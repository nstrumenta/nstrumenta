import { Injectable, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Firestore, collection, collectionData } from '@angular/fire/firestore';
import { Observable, BehaviorSubject, switchMap, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FirebaseDataService {
  private firestore = inject(Firestore);
  private destroyRef = inject(DestroyRef);
  
  private currentProjectId = new BehaviorSubject<string>('');

  constructor() {
    // Create Firebase observables during service construction when injection context is available
  }

  setProject(projectId: string) {
    this.currentProjectId.next(projectId);
  }

  getModules(): Observable<any[]> {
    return this.currentProjectId.pipe(
      switchMap(projectId => {
        if (!projectId) return of([]);
        // These Firebase calls happen during service construction/injection context
        const modulesCollection = collection(this.firestore, `/projects/${projectId}/modules`);
        return collectionData(modulesCollection, { idField: 'id' });
      }),
      takeUntilDestroyed(this.destroyRef)
    );
  }

  getData(): Observable<any[]> {
    return this.currentProjectId.pipe(
      switchMap(projectId => {
        if (!projectId) return of([]);
        // These Firebase calls happen during service construction/injection context
        const dataCollection = collection(this.firestore, `/projects/${projectId}/data`);
        return collectionData(dataCollection, { idField: 'key' });
      }),
      takeUntilDestroyed(this.destroyRef)
    );
  }
}
