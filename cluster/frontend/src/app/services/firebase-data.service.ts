import { Injectable, inject, DestroyRef, signal, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Firestore, collection, collectionData, doc, docData, query, orderBy } from '@angular/fire/firestore';
import { BehaviorSubject, switchMap, of, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FirebaseDataService {
  private firestore = inject(Firestore);
  private destroyRef = inject(DestroyRef);
  
  // Use BehaviorSubject for project changes
  private currentProjectId = new BehaviorSubject<string>('');
  
  // Data signals for different collections
  private modulesSignal = signal<any[]>([]);
  private dataSignal = signal<any[]>([]);
  private actionsSignal = signal<any[]>([]);
  private repositoriesSignal = signal<any[]>([]);
  private agentsSignal = signal<any[]>([]);
  
  // Project settings signal
  private projectSettingsSignal = signal<any>(null);

  // Pre-create Firebase observable factories during injection context
  private createModulesObservable = (projectId: string): Observable<any[]> => {
    if (!projectId) return of([]);
    const modulesCollection = collection(this.firestore, `/projects/${projectId}/modules`);
    return collectionData(modulesCollection, { idField: 'id' });
  };

  private createDataObservable = (projectId: string): Observable<any[]> => {
    if (!projectId) return of([]);
    const dataCollection = collection(this.firestore, `/projects/${projectId}/data`);
    return collectionData(dataCollection, { idField: 'key' });
  };

  private createActionsObservable = (projectId: string): Observable<any[]> => {
    if (!projectId) return of([]);
    const actionsCollection = collection(this.firestore, `/projects/${projectId}/actions`);
    const orderedActionsQuery = query(actionsCollection, orderBy('created', 'desc'));
    return collectionData(orderedActionsQuery, { idField: 'id' });
  };

  private createRepositoriesObservable = (projectId: string): Observable<any[]> => {
    if (!projectId) return of([]);
    const repositoriesCollection = collection(this.firestore, `/projects/${projectId}/repositories`);
    return collectionData(repositoriesCollection, { idField: 'key' });
  };

  private createAgentsObservable = (projectId: string): Observable<any[]> => {
    if (!projectId) return of([]);
    const agentsCollection = collection(this.firestore, `/projects/${projectId}/agents`);
    return collectionData(agentsCollection, { idField: 'id' });
  };

  private createProjectSettingsObservable = (projectId: string): Observable<any> => {
    if (!projectId) return of(null);
    const projectDoc = doc(this.firestore, `/projects/${projectId}`);
    return docData(projectDoc);
  };

  constructor() {
    // Set up reactive subscriptions using pre-created Firebase observable factories
    this.setupModulesSubscription();
    this.setupDataSubscription();
    this.setupActionsSubscription();
    this.setupRepositoriesSubscription();
    this.setupAgentsSubscription();
    this.setupProjectSettingsSubscription();
  }

  // Public methods to set project
  setProject(projectId: string) {
    this.currentProjectId.next(projectId);
  }

  // Public computed signals for components to use
  get modules() {
    return this.modulesSignal.asReadonly();
  }

  get data() {
    return this.dataSignal.asReadonly();
  }

  get actions() {
    return this.actionsSignal.asReadonly();
  }

  get repositories() {
    return this.repositoriesSignal.asReadonly();
  }

  get agents() {
    return this.agentsSignal.asReadonly();
  }

  get projectSettings() {
    return this.projectSettingsSignal.asReadonly();
  }

  get projectId() {
    return computed(() => this.currentProjectId.value);
  }

  private setupModulesSubscription() {
    this.currentProjectId.pipe(
      switchMap(projectId => this.createModulesObservable(projectId)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(modules => {
      this.modulesSignal.set(modules);
    });
  }

  private setupDataSubscription() {
    this.currentProjectId.pipe(
      switchMap(projectId => this.createDataObservable(projectId)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(data => {
      this.dataSignal.set(data);
    });
  }

  private setupActionsSubscription() {
    this.currentProjectId.pipe(
      switchMap(projectId => this.createActionsObservable(projectId)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(actions => {
      this.actionsSignal.set(actions);
    });
  }

  private setupRepositoriesSubscription() {
    this.currentProjectId.pipe(
      switchMap(projectId => this.createRepositoriesObservable(projectId)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(repositories => {
      this.repositoriesSignal.set(repositories);
    });
  }

  private setupAgentsSubscription() {
    this.currentProjectId.pipe(
      switchMap(projectId => this.createAgentsObservable(projectId)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(agents => {
      this.agentsSignal.set(agents);
    });
  }

  private setupProjectSettingsSubscription() {
    this.currentProjectId.pipe(
      switchMap(projectId => this.createProjectSettingsObservable(projectId)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(settings => {
      this.projectSettingsSignal.set(settings);
    });
  }

  // Method to get agent-specific actions (separate subscription)
  getAgentActionsData(agentId: string) {
    const agentActionsSignal = signal<any[]>([]);
    
    const createAgentActionsObservable = (projectId: string): Observable<any[]> => {
      if (!projectId || !agentId) return of([]);
      const agentActionsCollection = collection(this.firestore, `/projects/${projectId}/agents/${agentId}/actions`);
      return collectionData(agentActionsCollection, { idField: 'id' });
    };
    
    this.currentProjectId.pipe(
      switchMap(projectId => createAgentActionsObservable(projectId)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(actions => {
      agentActionsSignal.set(actions);
    });

    return agentActionsSignal.asReadonly();
  }
}
