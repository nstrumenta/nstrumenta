import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { AuthService } from 'src/app/auth/auth.service';
import { ApiService } from 'src/app/services/api.service';
import { Subscription } from 'rxjs';
import { MatFormField, MatError } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { FormsModule } from '@angular/forms';

import { MatButton } from '@angular/material/button';

@Component({
    selector: 'app-new-project-dialog',
    templateUrl: './new-project-dialog.component.html',
    styleUrls: ['./new-project-dialog.component.scss'],
    imports: [MatFormField, MatInput, FormsModule, MatError, MatButton]
})
export class NewProjectDialogComponent implements OnInit, OnDestroy {
  subscription: Subscription;
  projectName: string;
  uid: string;
  isCreating = false;
  errorMessage: string;

  private authService = inject(AuthService);
  private apiService = inject(ApiService);
  public dialogRef = inject(MatDialogRef<NewProjectDialogComponent>);

  ngOnInit(): void {
    // Component initialization
  }

  async create(projectIdRaw: string): Promise<void> {
    if (this.isCreating) return;
    
    this.isCreating = true;
    this.errorMessage = '';

    try {
      const response = await this.apiService.createProject({
        name: this.projectName,
        projectIdBase: projectIdRaw
      });

      console.log('Project created successfully:', response);
      this.dialogRef.close(response);
    } catch (error) {
      console.error('Error creating project:', error);
      this.errorMessage = error?.error || 'Failed to create project. Please try again.';
      this.isCreating = false;
    }
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
