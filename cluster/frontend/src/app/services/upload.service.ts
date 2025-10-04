import { Injectable, inject, signal, DestroyRef } from '@angular/core';
import { ApiService } from './api.service';
import { FirebaseDataService } from './firebase-data.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription, interval } from 'rxjs';
import { filter, take, timeout } from 'rxjs/operators';

export interface UploadTask {
  id: string;
  fileName: string;
  progress: number;
  status: 'uploading' | 'verifying' | 'complete' | 'error';
  error?: string;
}

@Injectable({
  providedIn: 'root',
})
export class UploadService {
  private apiService = inject(ApiService);
  private firebaseDataService = inject(FirebaseDataService);
  private destroyRef = inject(DestroyRef);

  // Map of upload ID to upload task
  private uploadsMap = signal<Map<string, UploadTask>>(new Map());
  
  // Track verification subscriptions
  private verificationSubs = new Map<string, Subscription>();

  // Public readonly signal for components to observe
  uploads = this.uploadsMap.asReadonly();

  async uploadFile(projectId: string, file: File, folder?: string): Promise<string> {
    const uploadId = `${Date.now()}-${file.name}`;
    const normalizedFolder = folder ? folder.replace(/^\/+|\/+$/g, '') : '';
    const folderPath = normalizedFolder ? `${normalizedFolder}/` : '';
    const expectedPath = `projects/${projectId}/data/${folderPath}${file.name}`;

    // Initialize upload task
    this.updateUpload(uploadId, {
      id: uploadId,
      fileName: file.name,
      progress: 0,
      status: 'uploading',
    });

    try {
      // Start the upload
      const progress$ = await this.apiService.uploadFile(projectId, file, folder);

      // Subscribe to progress
      progress$.subscribe({
        next: (progress) => {
          const current = this.uploadsMap().get(uploadId);
          if (current) {
            this.updateUpload(uploadId, { ...current, progress });
          }
        },
        error: (error) => {
          // CORS errors (status 0) are expected, treat as completion
          if (error.status === 0) {
            console.log(`Upload HTTP completed for ${file.name}, verifying in database...`);
            this.startVerification(uploadId, expectedPath);
          } else {
            // Real error
            this.updateUpload(uploadId, {
              ...this.uploadsMap().get(uploadId)!,
              status: 'error',
              error: `Upload failed: ${error.message || error.statusText}`,
            });
            this.scheduleRemoval(uploadId, 5000);
          }
        },
        complete: () => {
          console.log(`Upload HTTP completed for ${file.name}, verifying in database...`);
          this.startVerification(uploadId, expectedPath);
        },
      });
    } catch (error) {
      this.updateUpload(uploadId, {
        ...this.uploadsMap().get(uploadId)!,
        status: 'error',
        error: `Failed to initiate upload: ${(error as Error).message}`,
      });
      this.scheduleRemoval(uploadId, 5000);
    }

    return uploadId;
  }

  private startVerification(uploadId: string, expectedPath: string) {
    const current = this.uploadsMap().get(uploadId);
    if (!current) return;

    this.updateUpload(uploadId, {
      ...current,
      status: 'verifying',
      progress: 100,
    });

    // Poll the data signal every 500ms looking for our file
    let checkCount = 0;
    const maxChecks = 60; // 30 seconds (60 * 500ms)

    const checkInterval = interval(500).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      checkCount++;
      
      const files = this.firebaseDataService.data();
      const found = files.find((f) => f.filePath === expectedPath);

      if (found) {
        console.log(`File verified in database: ${expectedPath}`);

        const task = this.uploadsMap().get(uploadId);
        if (task) {
          this.updateUpload(uploadId, {
            ...task,
            status: 'complete',
          });
          this.scheduleRemoval(uploadId, 2000);
        }

        // Stop checking
        this.verificationSubs.get(uploadId)?.unsubscribe();
        this.verificationSubs.delete(uploadId);
      } else if (checkCount >= maxChecks) {
        // Timeout after 30 seconds
        console.warn(`Verification timeout for ${uploadId}`);
        
        const task = this.uploadsMap().get(uploadId);
        if (task && task.status === 'verifying') {
          this.updateUpload(uploadId, {
            ...task,
            status: 'error',
            error: 'Verification timeout - file may not have been processed by Cloud Function',
          });
          this.scheduleRemoval(uploadId, 10000);
        }

        // Stop checking
        this.verificationSubs.get(uploadId)?.unsubscribe();
        this.verificationSubs.delete(uploadId);
      }
    });

    this.verificationSubs.set(uploadId, checkInterval);
  }

  private updateUpload(uploadId: string, task: UploadTask) {
    const newMap = new Map(this.uploadsMap());
    newMap.set(uploadId, task);
    this.uploadsMap.set(newMap);
  }

  private scheduleRemoval(uploadId: string, delay: number) {
    setTimeout(() => {
      const newMap = new Map(this.uploadsMap());
      newMap.delete(uploadId);
      this.uploadsMap.set(newMap);
      
      // Clean up any remaining verification subscription
      this.verificationSubs.get(uploadId)?.unsubscribe();
      this.verificationSubs.delete(uploadId);
    }, delay);
  }

  // Public method to get uploads as an array for easier iteration
  getUploadsArray(): UploadTask[] {
    return Array.from(this.uploadsMap().values());
  }

  // Check if any uploads are in progress
  hasActiveUploads(): boolean {
    const uploads = this.uploadsMap();
    for (const task of uploads.values()) {
      if (task.status === 'uploading' || task.status === 'verifying') {
        return true;
      }
    }
    return false;
  }
}
