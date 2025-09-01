import {
  DestroyRef,
  Injectable,
  Injector,
  computed,
  inject,
  runInInjectionContext,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  Firestore,
  addDoc,
  collection,
  collectionData,
  deleteDoc,
  doc,
  docData,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
} from '@angular/fire/firestore';
import {
  Storage,
  UploadMetadata,
  getDownloadURL,
  ref,
  uploadBytesResumable,
} from '@angular/fire/storage';
import {
  BehaviorSubject,
  Observable,
  catchError,
  combineLatest,
  map,
  of,
  switchMap
} from 'rxjs';
import { Action } from '../models/action.model';
import {
  Agent,
  DataRecord,
  FirebaseDocument,
  Machine,
  Module,
  Project,
  RecordData,
  Repository,
} from '../models/firebase.model';
import { ProjectSettings } from '../models/projectSettings.model';

@Injectable({
  providedIn: 'root',
})
export class FirebaseDataService {
  private firestore = inject(Firestore);
  private storage = inject(Storage);
  private destroyRef = inject(DestroyRef);
  private injector = inject(Injector);

  // Use BehaviorSubject for project changes
  private currentProjectId = new BehaviorSubject<string>('');

  // Use BehaviorSubject for agent context
  private currentAgentId = new BehaviorSubject<string>('');

  // Use BehaviorSubject for user context
  private currentUserId = new BehaviorSubject<string>('');

  // Data signals for different collections
  private modulesSignal = signal<Module[]>([]);
  private dataSignal = signal<DataRecord[]>([]);
  private recordSignal = signal<RecordData[]>([]);
  private actionsSignal = signal<Action[]>([]);
  private agentActionsSignal = signal<Action[]>([]);
  private repositoriesSignal = signal<Repository[]>([]);
  private agentsSignal = signal<Agent[]>([]);
  private machinesSignal = signal<Machine[]>([]);
  private userProjectsSignal = signal<Project[]>([]);

  // Project settings signal
  private projectSettingsSignal = signal<ProjectSettings | null>(null);

  // Pre-create all Firebase observables during constructor (injection context)
  private modulesObservable$: Observable<unknown[]>;
  private dataObservable$: Observable<unknown[]>;
  private recordObservable$: Observable<unknown[]>;
  private actionsObservable$: Observable<unknown[]>;
  private agentActionsObservable$: Observable<unknown[]>;
  private repositoriesObservable$: Observable<unknown[]>;
  private agentsObservable$: Observable<unknown[]>;
  private machinesObservable$: Observable<unknown[]>;
  public userProjectsObservable$: Observable<Project[]>; // Made public for ProjectService
  private projectSettingsObservable$: Observable<unknown>;

  constructor() {
    // Create all Firebase observables during injection context

    this.modulesObservable$ = this.currentProjectId.pipe(
      switchMap((projectId) => {
        if (!projectId) return of([]);
        return runInInjectionContext(this.injector, () =>
          collectionData(collection(this.firestore, `/projects/${projectId}/modules`), {
            idField: 'id',
          })
        );
      })
    );

    this.dataObservable$ = this.currentProjectId.pipe(
      switchMap((projectId) => {
        if (!projectId) return of([]);
        return runInInjectionContext(this.injector, () =>
          collectionData(collection(this.firestore, `/projects/${projectId}/data`), {
            idField: 'key',
          })
        );
      })
    );

    this.recordObservable$ = this.currentProjectId.pipe(
      switchMap((projectId) => {
        if (!projectId) return of([]);
        return runInInjectionContext(this.injector, () => {
          const recordCollection = collection(this.firestore, `/projects/${projectId}/record`);
          const orderedRecordQuery = query(recordCollection, orderBy('lastModified', 'desc'));
          return collectionData(orderedRecordQuery, { idField: 'key' });
        });
      })
    );

    this.actionsObservable$ = this.currentProjectId.pipe(
      switchMap((projectId) => {
        if (!projectId) return of([]);
        return runInInjectionContext(this.injector, () => {
          const actionsCollection = collection(this.firestore, `/projects/${projectId}/actions`);
          const orderedActionsQuery = query(actionsCollection, orderBy('created', 'desc'));
          return collectionData(orderedActionsQuery, { idField: 'id' });
        });
      })
    );

    this.agentActionsObservable$ = combineLatest([this.currentProjectId, this.currentAgentId]).pipe(
      switchMap(([projectId, agentId]) => {
        if (!projectId || !agentId) return of([]);
        return runInInjectionContext(this.injector, () => {
          const agentActionsCollection = collection(
            this.firestore,
            `/projects/${projectId}/agents/${agentId}/actions`
          );
          const orderedAgentActionsQuery = query(
            agentActionsCollection,
            orderBy('created', 'desc')
          );
          return collectionData(orderedAgentActionsQuery, { idField: 'id' });
        }).pipe(
          catchError((error) => {
            console.error(
              'Error loading agent actions for project:',
              projectId,
              'agent:',
              agentId,
              error
            );
            return of([]);
          })
        );
      })
    );

    this.repositoriesObservable$ = this.currentProjectId.pipe(
      switchMap((projectId) => {
        if (!projectId) return of([]);
        return runInInjectionContext(this.injector, () =>
          collectionData(collection(this.firestore, `/projects/${projectId}/repositories`), {
            idField: 'key',
          })
        );
      })
    );

    this.agentsObservable$ = this.currentProjectId.pipe(
      switchMap((projectId) => {
        if (!projectId) return of([]);
        return runInInjectionContext(this.injector, () =>
          collectionData(collection(this.firestore, `/projects/${projectId}/agents`), {
            idField: 'id',
          })
        );
      })
    );

    this.machinesObservable$ = this.currentProjectId.pipe(
      switchMap((projectId) => {
        if (!projectId) return of([]);
        return runInInjectionContext(this.injector, () =>
          collectionData(collection(this.firestore, `/projects/${projectId}/machines`), {
            idField: 'name',
          })
        );
      })
    );

    this.userProjectsObservable$ = this.currentUserId.pipe(
      switchMap((userId) => {
        if (!userId) return of([]);
        return runInInjectionContext(this.injector, () =>
          collectionData(collection(this.firestore, `/users/${userId}/projects`), { idField: 'id' })
        ).pipe(
          map((data) => data as Project[]),
          catchError((error) => {
            console.error('Error loading user projects for user:', userId, error);
            return of([]);
          })
        );
      })
    );

    this.projectSettingsObservable$ = this.currentProjectId.pipe(
      switchMap((projectId) => {
        if (!projectId) return of(null);
        return runInInjectionContext(this.injector, () =>
          docData(doc(this.firestore, `/projects/${projectId}`))
        );
      })
    );

    // Set up subscriptions to update signals
    this.setupSubscriptions();
  }

  private setupSubscriptions() {
    // Subscribe to all observables and update signals
    this.modulesObservable$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data) => this.modulesSignal.set((data as Module[]) || []));

    this.dataObservable$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data) => this.dataSignal.set((data as DataRecord[]) || []));

    this.recordObservable$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data) => this.recordSignal.set((data as RecordData[]) || []));

    this.actionsObservable$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data) => this.actionsSignal.set((data as Action[]) || []));

    this.agentActionsObservable$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data) => this.agentActionsSignal.set((data as Action[]) || []));

    this.repositoriesObservable$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data) => this.repositoriesSignal.set((data as Repository[]) || []));

    this.agentsObservable$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data) => this.agentsSignal.set((data as Agent[]) || []));

    this.machinesObservable$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data) => this.machinesSignal.set((data as Machine[]) || []));

    this.userProjectsObservable$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data) => this.userProjectsSignal.set((data as Project[]) || []));

    this.projectSettingsObservable$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data) => this.projectSettingsSignal.set(data as ProjectSettings | null));
  }

  // Public methods to set project and agent
  setProject(projectId: string) {
    this.currentProjectId.next(projectId);
  }

  setAgent(agentId: string) {
    this.currentAgentId.next(agentId);
  }

  setUser(userId: string) {
    this.currentUserId.next(userId);
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


  get userProjects() {
    return this.userProjectsSignal.asReadonly();
  }

  get userProjectsObservable() {
    return this.userProjectsObservable$;
  }

  get projectSettings() {
    return this.projectSettingsSignal.asReadonly();
  }

  get projectId() {
    return computed(() => this.currentProjectId.value);
  }

  // Method to get agent-specific actions (separate subscription)
  getAgentActionsData(agentId: string) {
    const agentActionsSignal = signal<Action[]>([]);

    const createAgentActionsObservable = (projectId: string): Observable<unknown[]> => {
      if (!projectId || !agentId) return of([]);
      const agentActionsCollection = collection(
        this.firestore,
        `/projects/${projectId}/agents/${agentId}/actions`
      );
      return collectionData(agentActionsCollection, { idField: 'id' });
    };

    this.currentProjectId
      .pipe(
        switchMap((projectId) => createAgentActionsObservable(projectId)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((actions) => {
        agentActionsSignal.set(actions as Action[]);
      });

    return agentActionsSignal.asReadonly();
  }

  // CRUD Operations - all centralized here to maintain injection context

  // Add operations
  async addRepository(projectId: string, data: unknown): Promise<void> {
    await runInInjectionContext(this.injector, async () => {
      const repositoriesCollection = collection(
        this.firestore,
        `/projects/${projectId}/repositories`
      );
      await addDoc(repositoriesCollection, data);
    });
  }

  async addRecord(projectId: string, data: unknown): Promise<void> {
    await runInInjectionContext(this.injector, async () => {
      const recordsCollection = collection(this.firestore, `/projects/${projectId}/data`);
      await addDoc(recordsCollection, data);
    });
  }

  async addAction(projectId: string, data: unknown): Promise<void> {
    await runInInjectionContext(this.injector, async () => {
      const actionsCollection = collection(this.firestore, `/projects/${projectId}/actions`);
      await addDoc(actionsCollection, data);
    });
  }

  // Update operations
  async updateRepository(projectId: string, id: string, data: unknown): Promise<void> {
    await runInInjectionContext(this.injector, async () => {
      const docRef = doc(this.firestore, `/projects/${projectId}/repositories/${id}`);
      await updateDoc(docRef, data);
    });
  }

  async updateRecord(projectId: string, id: string, data: unknown): Promise<void> {
    await runInInjectionContext(this.injector, async () => {
      const docRef = doc(this.firestore, `/projects/${projectId}/data/${id}`);
      await updateDoc(docRef, data);
    });
  }

  // Record collection CRUD operations (distinct from data collection)
  async addRecording(projectId: string, data: unknown): Promise<void> {
    await runInInjectionContext(this.injector, async () => {
      const collectionRef = collection(this.firestore, `/projects/${projectId}/record`);
      await addDoc(collectionRef, { ...(data as object), lastModified: Date.now() });
    });
  }

  async updateRecording(projectId: string, id: string, data: unknown): Promise<void> {
    await runInInjectionContext(this.injector, async () => {
      const docRef = doc(this.firestore, `/projects/${projectId}/record/${id}`);
      await setDoc(docRef, data, { merge: true });
    });
  }

  async deleteRecording(projectId: string, id: string): Promise<void> {
    await runInInjectionContext(this.injector, async () => {
      const docRef = doc(this.firestore, `/projects/${projectId}/record/${id}`);
      await deleteDoc(docRef);
    });
  }

  async updateAction(projectId: string, id: string, data: unknown): Promise<void> {
    await runInInjectionContext(this.injector, async () => {
      const docRef = doc(this.firestore, `/projects/${projectId}/actions/${id}`);
      await setDoc(docRef, data, { merge: true });
    });
  }

  // Delete operations
  async deleteRepository(projectId: string, id: string): Promise<void> {
    await runInInjectionContext(this.injector, async () => {
      const docRef = doc(this.firestore, `/projects/${projectId}/repositories/${id}`);
      await deleteDoc(docRef);
    });
  }

  async deleteRecord(projectId: string, id: string): Promise<void> {
    await runInInjectionContext(this.injector, async () => {
      const docRef = doc(this.firestore, `/projects/${projectId}/data/${id}`);
      await deleteDoc(docRef);
    });
  }

  async deleteAction(projectId: string, id: string): Promise<void> {
    await runInInjectionContext(this.injector, async () => {
      const docRef = doc(this.firestore, `/projects/${projectId}/actions/${id}`);
      await deleteDoc(docRef);
    });
  }

  async deleteModule(projectId: string, id: string): Promise<void> {
    await runInInjectionContext(this.injector, async () => {
      const docRef = doc(this.firestore, `/projects/${projectId}/modules/${id}`);
      await deleteDoc(docRef);
    });
  }

  async deleteAgent(projectId: string, id: string): Promise<void> {
    await runInInjectionContext(this.injector, async () => {
      const docRef = doc(this.firestore, `/projects/${projectId}/agents/${id}`);
      await deleteDoc(docRef);
    });
  }

  // Agent actions CRUD operations
  async addAgentAction(projectId: string, agentId: string, data: unknown): Promise<void> {
    await runInInjectionContext(this.injector, async () => {
      const collectionRef = collection(
        this.firestore,
        `/projects/${projectId}/agents/${agentId}/actions`
      );
      await addDoc(collectionRef, data);
    });
  }

  async updateAgentAction(
    projectId: string,
    agentId: string,
    id: string,
    data: unknown
  ): Promise<void> {
    await runInInjectionContext(this.injector, async () => {
      const docRef = doc(this.firestore, `/projects/${projectId}/agents/${agentId}/actions/${id}`);
      await setDoc(docRef, data, { merge: true });
    });
  }

  async deleteAgentAction(projectId: string, agentId: string, id: string): Promise<void> {
    await runInInjectionContext(this.injector, async () => {
      const docRef = doc(this.firestore, `/projects/${projectId}/agents/${agentId}/actions/${id}`);
      await deleteDoc(docRef);
    });
  }

  // Get single document
  getDocument(projectId: string, collection: string, id: string): Observable<FirebaseDocument> {
    const docRef = doc(this.firestore, `/projects/${projectId}/${collection}/${id}`);
    return docData(docRef).pipe(map((data) => data as FirebaseDocument));
  }

  // Project settings operations
  async updateProjectSettings(projectId: string, data: unknown): Promise<void> {
    await runInInjectionContext(this.injector, async () => {
      const docRef = doc(this.firestore, `/projects/${projectId}`);
      await setDoc(docRef, data, { merge: true });
    });
  }

  // User project operations
  async updateUserProject(projectId: string, projectData: unknown): Promise<void> {
    const currentUserId = this.currentUserId.value;
    if (!currentUserId) return;

    await runInInjectionContext(this.injector, async () => {
      const userProjectRef = doc(this.firestore, `/users/${currentUserId}/projects/${projectId}`);
      await setDoc(
        userProjectRef,
        {
          id: projectId,
          name: (projectData as { name?: string }).name || 'Untitled Project',
          lastAccessed: new Date(),
          ...(projectData as object),
        },
        { merge: true }
      );
    });
  }

  // Task execution methods (moved from AgentService and ServerService)
  async runTask(
    task: string,
    projectId: string,
    uid: string,
    payload?: unknown,
    data?: unknown,
    progress?: (message: string) => void
  ): Promise<unknown> {
    return new Promise<unknown>((resolve, reject) => {
      if (!uid) {
        reject(new Error('User not authenticated'));
        return;
      }

      console.log('setting task ' + task + ' action to pending');
      const action = {
        status: 'pending',
        created: Date.now(),
        lastModified: Date.now(),
        task: task,
        uid: uid,
        data: data ?? {},
        payload: payload ? payload : {},
        version: '1.0.0', // You may want to import this from environment
      };

      runInInjectionContext(this.injector, () => {
        const actionsCollection = collection(this.firestore, `projects/${projectId}/actions`);
        addDoc(actionsCollection, action)
          .then((ref) => {
            const key = ref.path;
            console.log('watching for project action to complete ', key);

            const unsubscribe = onSnapshot(ref, (snapshot) => {
              const val = snapshot.data() as {
                status: string;
                task: string;
                payload?: Record<string, unknown>;
              };
              console.log(val);

              switch (val.status) {
                case 'complete':
                  unsubscribe();
                  // Special handling for createApiKey to redact the key
                  if (task === 'createApiKey') {
                    const responseDeepCopy = JSON.parse(JSON.stringify(val));
                    const payload = val.payload;
                    if (payload) {
                      payload.key = 'redacted';
                      // Update the document to redact the key
                      runInInjectionContext(this.injector, () => {
                        updateDoc(ref, { payload });
                      });
                    }
                    resolve(responseDeepCopy);
                  } else {
                    resolve(val);
                  }
                  break;
                case 'build-error':
                case 'error':
                  unsubscribe();
                  reject(val);
                  break;
                default:
                  if (progress) {
                    progress(val.status);
                  }
                  break;
              }
            });
          })
          .catch(reject);
      });
    });
  }

  // Storage methods
  getStorageRef(path: string) {
    return ref(this.storage, path);
  }

  uploadFile(path: string, file: File, metadata?: UploadMetadata) {
    const storageRef = this.getStorageRef(path);
    return uploadBytesResumable(storageRef, file, metadata);
  }

  async getDownloadUrl(path: string): Promise<string> {
    const storageRef = this.getStorageRef(path);
    return await getDownloadURL(storageRef);
  }

  // Helper method to get storage instance (for components that need direct access)
  getStorage(): Storage {
    return this.storage;
  }
}
