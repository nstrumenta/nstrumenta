import { Injectable, inject, DestroyRef, signal, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Firestore, collection, collectionData, doc, docData, query, orderBy, addDoc, updateDoc, deleteDoc, setDoc } from '@angular/fire/firestore';
import { BehaviorSubject, switchMap, of, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FirebaseDataService {
  private firestore = inject(Firestore);
  private destroyRef = inject(DestroyRef);
  
  // Use BehaviorSubject for project changes
  private currentProjectId = new BehaviorSubject<string>('');
  
  // Use BehaviorSubject for agent context
  private currentAgentId = new BehaviorSubject<string>('');
  
  // Data signals for different collections
  private modulesSignal = signal<any[]>([]);
  private dataSignal = signal<any[]>([]);
  private recordSignal = signal<any[]>([]);
  private actionsSignal = signal<any[]>([]);
  private agentActionsSignal = signal<any[]>([]);
  private repositoriesSignal = signal<any[]>([]);
  private agentsSignal = signal<any[]>([]);
  private machinesSignal = signal<any[]>([]);
  private projectsSignal = signal<any[]>([]);
  
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

  private createRecordObservable = (projectId: string): Observable<any[]> => {
    if (!projectId) return of([]);
    const recordCollection = collection(this.firestore, `/projects/${projectId}/record`);
    const orderedRecordQuery = query(recordCollection, orderBy('lastModified', 'desc'));
    return collectionData(orderedRecordQuery, { idField: 'key' });
  };

  private createActionsObservable = (projectId: string): Observable<any[]> => {
    if (!projectId) return of([]);
    const actionsCollection = collection(this.firestore, `/projects/${projectId}/actions`);
    const orderedActionsQuery = query(actionsCollection, orderBy('created', 'desc'));
    return collectionData(orderedActionsQuery, { idField: 'id' });
  };

  private createAgentActionsObservable = (projectId: string, agentId: string): Observable<any[]> => {
    if (!projectId || !agentId) return of([]);
    const agentActionsCollection = collection(this.firestore, `/projects/${projectId}/agents/${agentId}/actions`);
    const orderedAgentActionsQuery = query(agentActionsCollection, orderBy('created', 'desc'));
    return collectionData(orderedAgentActionsQuery, { idField: 'id' });
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

  private createMachinesObservable = (projectId: string): Observable<any[]> => {
    if (!projectId) return of([]);
    const machinesCollection = collection(this.firestore, `/projects/${projectId}/machines`);
    return collectionData(machinesCollection, { idField: 'name' });
  };

  private createProjectsObservable = (): Observable<any[]> => {
    const projectsCollection = collection(this.firestore, '/projects');
    return collectionData(projectsCollection, { idField: 'id' });
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
    this.setupRecordSubscription();
    this.setupActionsSubscription();
    this.setupAgentActionsSubscription();
    this.setupRepositoriesSubscription();
    this.setupAgentsSubscription();
    this.setupMachinesSubscription();
    this.setupProjectsSubscription();
    this.setupProjectSettingsSubscription();
  }

  // Public methods to set project and agent
  setProject(projectId: string) {
    this.currentProjectId.next(projectId);
  }

  setAgent(agentId: string) {
    this.currentAgentId.next(agentId);
  }

  // Public computed signals for components to use
  get modules() {
    return this.modulesSignal.asReadonly();
  }

  get data() {
    return this.dataSignal.asReadonly();
  }

  get record() {
    return this.recordSignal.asReadonly();
  }

  get actions() {
    return this.actionsSignal.asReadonly();
  }

  get agentActions() {
    return this.agentActionsSignal.asReadonly();
  }

  get repositories() {
    return this.repositoriesSignal.asReadonly();
  }

  get agents() {
    return this.agentsSignal.asReadonly();
  }

  get machines() {
    return this.machinesSignal.asReadonly();
  }

  get projects() {
    return this.projectsSignal.asReadonly();
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
      this.modulesSignal.set(modules as any[]);
    });
  }

  private setupDataSubscription() {
    this.currentProjectId.pipe(
      switchMap(projectId => this.createDataObservable(projectId)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(data => {
      this.dataSignal.set(data as any[]);
    });
  }

  private setupRecordSubscription() {
    this.currentProjectId.pipe(
      switchMap(projectId => this.createRecordObservable(projectId)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(record => {
      this.recordSignal.set(record as any[]);
    });
  }

  private setupActionsSubscription() {
    this.currentProjectId.pipe(
      switchMap(projectId => this.createActionsObservable(projectId)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(actions => {
      this.actionsSignal.set(actions as any[]);
    });
  }

  private setupAgentActionsSubscription() {
    // Combine project and agent IDs to create the agent actions observable
    this.currentProjectId.pipe(
      switchMap(projectId => 
        this.currentAgentId.pipe(
          switchMap(agentId => this.createAgentActionsObservable(projectId, agentId))
        )
      ),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(agentActions => {
      this.agentActionsSignal.set(agentActions as any[]);
    });
  }

  private setupRepositoriesSubscription() {
    this.currentProjectId.pipe(
      switchMap(projectId => this.createRepositoriesObservable(projectId)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(repositories => {
      this.repositoriesSignal.set(repositories as any[]);
    });
  }

  private setupAgentsSubscription() {
    this.currentProjectId.pipe(
      switchMap(projectId => this.createAgentsObservable(projectId)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(agents => {
      this.agentsSignal.set(agents as any[]);
    });
  }

  private setupMachinesSubscription() {
    this.currentProjectId.pipe(
      switchMap(projectId => this.createMachinesObservable(projectId)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(machines => {
      this.machinesSignal.set(machines as any[]);
    });
  }

  private setupProjectsSubscription() {
    // Projects don't depend on current project ID
    this.createProjectsObservable().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(projects => {
      this.projectsSignal.set(projects as any[]);
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
      agentActionsSignal.set(actions as any[]);
    });

    return agentActionsSignal.asReadonly();
  }

  // CRUD Operations - all centralized here to maintain injection context
  
  // Add operations
  async addRepository(projectId: string, data: any): Promise<void> {
    const repositoriesCollection = collection(this.firestore, `/projects/${projectId}/repositories`);
    await addDoc(repositoriesCollection, data);
  }

  async addRecord(projectId: string, data: any): Promise<void> {
    const recordsCollection = collection(this.firestore, `/projects/${projectId}/data`);
    await addDoc(recordsCollection, data);
  }

  async addAction(projectId: string, data: any): Promise<void> {
    const actionsCollection = collection(this.firestore, `/projects/${projectId}/actions`);
    await addDoc(actionsCollection, data);
  }

  // Update operations
  async updateRepository(projectId: string, id: string, data: any): Promise<void> {
    const docRef = doc(this.firestore, `/projects/${projectId}/repositories/${id}`);
    await updateDoc(docRef, data);
  }

  async updateRecord(projectId: string, id: string, data: any): Promise<void> {
    const docRef = doc(this.firestore, `/projects/${projectId}/data/${id}`);
    await updateDoc(docRef, data);
  }

  // Record collection CRUD operations (distinct from data collection)
  async addRecording(projectId: string, data: any): Promise<void> {
    const collectionRef = collection(this.firestore, `/projects/${projectId}/record`);
    await addDoc(collectionRef, { ...data, lastModified: Date.now() });
  }

  async updateRecording(projectId: string, id: string, data: any): Promise<void> {
    const docRef = doc(this.firestore, `/projects/${projectId}/record/${id}`);
    await setDoc(docRef, data, { merge: true });
  }

  async deleteRecording(projectId: string, id: string): Promise<void> {
    const docRef = doc(this.firestore, `/projects/${projectId}/record/${id}`);
    await deleteDoc(docRef);
  }

  async updateAction(projectId: string, id: string, data: any): Promise<void> {
    const docRef = doc(this.firestore, `/projects/${projectId}/actions/${id}`);
    await setDoc(docRef, data, { merge: true });
  }

  // Delete operations
  async deleteRepository(projectId: string, id: string): Promise<void> {
    const docRef = doc(this.firestore, `/projects/${projectId}/repositories/${id}`);
    await deleteDoc(docRef);
  }

  async deleteRecord(projectId: string, id: string): Promise<void> {
    const docRef = doc(this.firestore, `/projects/${projectId}/data/${id}`);
    await deleteDoc(docRef);
  }

  async deleteAction(projectId: string, id: string): Promise<void> {
    const docRef = doc(this.firestore, `/projects/${projectId}/actions/${id}`);
    await deleteDoc(docRef);
  }

  async deleteModule(projectId: string, id: string): Promise<void> {
    const docRef = doc(this.firestore, `/projects/${projectId}/modules/${id}`);
    await deleteDoc(docRef);
  }

  async deleteAgent(projectId: string, id: string): Promise<void> {
    const docRef = doc(this.firestore, `/projects/${projectId}/agents/${id}`);
    await deleteDoc(docRef);
  }

  // Agent actions CRUD operations
  async addAgentAction(projectId: string, agentId: string, data: any): Promise<void> {
    const collectionRef = collection(this.firestore, `/projects/${projectId}/agents/${agentId}/actions`);
    await addDoc(collectionRef, data);
  }

  async updateAgentAction(projectId: string, agentId: string, id: string, data: any): Promise<void> {
    const docRef = doc(this.firestore, `/projects/${projectId}/agents/${agentId}/actions/${id}`);
    await setDoc(docRef, data, { merge: true });
  }

  async deleteAgentAction(projectId: string, agentId: string, id: string): Promise<void> {
    const docRef = doc(this.firestore, `/projects/${projectId}/agents/${agentId}/actions/${id}`);
    await deleteDoc(docRef);
  }

  // Get single document
  getDocument(projectId: string, collection: string, id: string): Observable<any> {
    const docRef = doc(this.firestore, `/projects/${projectId}/${collection}/${id}`);
    return docData(docRef);
  }
}
