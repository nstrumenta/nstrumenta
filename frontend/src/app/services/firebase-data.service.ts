import {
  DestroyRef,
  Injectable,
  Injector,
  inject,
  runInInjectionContext,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import {
  Firestore,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  getFirestore,
  DocumentData,
  Query,
  DocumentReference,
} from 'firebase/firestore';
import {
  FirebaseStorage,
  UploadMetadata,
  getDownloadURL,
  ref,
  uploadBytesResumable,
  getStorage,
} from 'firebase/storage';
import {
  Observable,
  catchError,
  combineLatest,
  from,
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
import { ApiService } from './api.service';
import { AuthService } from '../auth/auth.service';

@Injectable({
  providedIn: 'root',
})
export class FirebaseDataService {
  getProjectPath(projectId: string): string {
    const parts = projectId.split('/');
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      throw new Error(`Invalid projectId format '${projectId}': expected 'orgSlug/projectSlug'`);
    }
    return `organizations/${parts[0]}/projects/${parts[1]}`;
  }
  private firestore: Firestore;
  private storage: FirebaseStorage;
  private destroyRef = inject(DestroyRef);
  private injector = inject(Injector);
  private apiService = inject(ApiService);
  private authService = inject(AuthService);

  private currentProjectId = signal<string>('');
  private currentAgentId = signal<string>('');
  private currentUserId = signal<string>('');

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
    this.firestore = getFirestore();
    this.storage = getStorage();
    
    // Create all Firebase observables during injection context

    // Gate all per-project subscriptions on both projectId and authenticated user being present.
    // This prevents Firestore permission errors during auth restore on fresh page loads.
    const projectWithAuth$ = combineLatest([toObservable(this.currentProjectId), toObservable(this.authService.currentUser)]);

    this.modulesObservable$ = projectWithAuth$.pipe(
      switchMap(([projectId, user]) => {
        if (!projectId || !user) return of([]);
        return runInInjectionContext(this.injector, () => {
          const modulesCollection = collection(this.firestore, `/${this.getProjectPath(projectId)}/modules`);
          const modulesQuery = query(modulesCollection);
          return this.collectionData(modulesQuery);
        });
      })
    );

    this.dataObservable$ = projectWithAuth$.pipe(
      switchMap(([projectId, user]) => {
        if (!projectId || !user) return of([]);
        return runInInjectionContext(this.injector, () => {
          const dataCollection = collection(this.firestore, `/${this.getProjectPath(projectId)}/data`);
          const dataQuery = query(dataCollection);
          return this.collectionData(dataQuery);
        });
      })
    );

    this.recordObservable$ = projectWithAuth$.pipe(
      switchMap(([projectId, user]) => {
        if (!projectId || !user) return of([]);
        return runInInjectionContext(this.injector, () => {
          const recordCollection = collection(this.firestore, `/${this.getProjectPath(projectId)}/record`);
          const orderedRecordQuery = query(recordCollection, orderBy('lastModified', 'desc'));
          return this.collectionData(orderedRecordQuery);
        });
      })
    );

    this.actionsObservable$ = projectWithAuth$.pipe(
      switchMap(([projectId, user]) => {
        if (!projectId || !user) return of([]);
        return runInInjectionContext(this.injector, () => {
          const actionsCollection = collection(this.firestore, `/${this.getProjectPath(projectId)}/actions`);
          const orderedActionsQuery = query(actionsCollection, orderBy('created', 'desc'));
          return this.collectionData(orderedActionsQuery);
        });
      })
    );

    this.agentActionsObservable$ = combineLatest([toObservable(this.currentProjectId), toObservable(this.currentAgentId), toObservable(this.authService.currentUser)]).pipe(
      switchMap(([projectId, agentId, user]) => {
        if (!projectId || !agentId || !user) return of([]);
        return runInInjectionContext(this.injector, () => {
          const agentActionsCollection = collection(
            this.firestore,
            `/${this.getProjectPath(projectId)}/agents/${agentId}/actions`
          );
          const orderedAgentActionsQuery = query(
            agentActionsCollection,
            orderBy('created', 'desc')
          );
          return this.collectionData(orderedAgentActionsQuery);
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

    this.repositoriesObservable$ = projectWithAuth$.pipe(
      switchMap(([projectId, user]) => {
        if (!projectId || !user) return of([]);
        return runInInjectionContext(this.injector, () => {
          const repositoriesCollection = collection(this.firestore, `/${this.getProjectPath(projectId)}/repositories`);
          const repositoriesQuery = query(repositoriesCollection);
          return this.collectionData(repositoriesQuery);
        });
      })
    );

    this.agentsObservable$ = projectWithAuth$.pipe(
      switchMap(([projectId, user]) => {
        if (!projectId || !user) return of([]);
        return runInInjectionContext(this.injector, () => {
          const agentsCollection = collection(this.firestore, `/${this.getProjectPath(projectId)}/agents`);
          const agentsQuery = query(agentsCollection);
          return this.collectionData(agentsQuery);
        });
      })
    );

    this.machinesObservable$ = projectWithAuth$.pipe(
      switchMap(([projectId, user]) => {
        if (!projectId || !user) return of([]);
        return runInInjectionContext(this.injector, () => {
          const machinesCollection = collection(this.firestore, `/${this.getProjectPath(projectId)}/machines`);
          const machinesQuery = query(machinesCollection);
          return this.collectionData(machinesQuery);
        });
      })
    );

    this.userProjectsObservable$ = toObservable(this.authService.currentUser).pipe(
      switchMap((user) => {
        if (!user?.uid) return of([]);
        return from(this.getUserDocOnce(user.uid)).pipe(
          switchMap((userData) => {
            const username = userData['username'] as string;
            if (!username) return of([]);
            return runInInjectionContext(this.injector, () => {
              const projectsCollection = collection(this.firestore, `organizations/${username}/projects`);
              return this.collectionData(query(projectsCollection));
            });
          }),
          catchError((error) => {
            console.error('Error loading user projects:', error);
            return of([]);
          })
        );
      })
    );

    this.projectSettingsObservable$ = projectWithAuth$.pipe(
      switchMap(([projectId, user]) => {
        if (!projectId || !user) return of(null);
        return runInInjectionContext(this.injector, () =>
          this.docData(doc(this.firestore, `/${this.getProjectPath(projectId)}`))
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
  
  async resolveAndSetProject(owner: string, project: string): Promise<string | null> {
    try {
      const db = this.firestore;
      const projectDoc = await getDoc(
        doc(db, `organizations/${owner}/projects/${project}`)
      );
      if (projectDoc.exists()) {
        const projectId = `${owner}/${project}`;
        this.setProject(projectId);
        return projectId;
      } else {
        console.error('Project not found', owner, project);
        this.setProject('');
        return null;
      }
    } catch (e) {
      console.error('Failed to resolve project', e);
      this.setProject('');
      return null;
    }
  }

  setProject(projectId: string) {
    this.currentProjectId.set(projectId);
  }

  setAgent(agentId: string) {
    this.currentAgentId.set(agentId);
  }

  setUser(userId: string) {
    this.currentUserId.set(userId);
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
    return this.currentProjectId.asReadonly();
  }

  get agentId() {
    return this.currentAgentId.asReadonly();
  }

  get userId() {
    return this.currentUserId.asReadonly();
  }

  // Method to get agent-specific actions (separate subscription)
  getAgentActionsData(agentId: string) {
    const agentActionsSignal = signal<Action[]>([]);

    const createAgentActionsObservable = (projectId: string): Observable<unknown[]> => {
      if (!projectId || !agentId) return of([]);
      const agentActionsCollection = collection(
        this.firestore,
        `/${this.getProjectPath(projectId)}/agents/${agentId}/actions`
      );
      const agentActionsQuery = query(agentActionsCollection);
      return this.collectionData(agentActionsQuery);
    };

    toObservable(this.currentProjectId, { injector: this.injector }).pipe(
        switchMap((projectId) => createAgentActionsObservable(projectId)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((actions) => {
        agentActionsSignal.set(actions as Action[]);
      });

    return agentActionsSignal.asReadonly();
  }

  // CRUD Operations - all centralized here to maintain injection context

  async addRepository(projectId: string, data: unknown): Promise<void> {
    await runInInjectionContext(this.injector, async () => {
      const repositoriesCollection = collection(
        this.firestore,
        `/${this.getProjectPath(projectId)}/repositories`
      );
      await addDoc(repositoriesCollection, data);
    });
  }

  async deleteRepository(projectId: string, id: string): Promise<void> {
    await runInInjectionContext(this.injector, async () => {
      const docRef = doc(this.firestore, `/${this.getProjectPath(projectId)}/repositories/${id}`);
      await deleteDoc(docRef);
    });
  }

  async deleteAction(projectId: string, id: string): Promise<void> {
    await runInInjectionContext(this.injector, async () => {
      const docRef = doc(this.firestore, `/${this.getProjectPath(projectId)}/actions/${id}`);
      await deleteDoc(docRef);
    });
  }

  // Get single document
  getDocument(projectId: string, collection: string, id: string): Observable<FirebaseDocument> {
    const docRef = doc(this.firestore, `/${this.getProjectPath(projectId)}/${collection}/${id}`);
    return this.docData(docRef).pipe(map((data) => data as FirebaseDocument));
  }

  // User project operations
  getUserDoc(uid: string): Observable<any> {
    const docRef = doc(this.firestore, `users/${uid}`);
    return this.docData(docRef);
  }

  async getUserDocOnce(uid: string): Promise<Record<string, unknown>> {
    const snapshot = await getDoc(doc(this.firestore, `users/${uid}`));
    return (snapshot.data() as Record<string, unknown>) ?? {};
  }

  async slugExists(slug: string): Promise<boolean> {
    const snapshot = await getDoc(doc(this.firestore, `slugs/${slug}`));
    return snapshot.exists();
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
        const actionsCollection = collection(this.firestore, `${this.getProjectPath(projectId)}/actions`);
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

  async uploadFile(path: string, file: File | Blob, metadata?: UploadMetadata) {
    // Flatten metadata for API Service
    const flatMeta: Record<string, string> = {};
    if (metadata) {
      if (metadata.contentType) flatMeta['contentType'] = metadata.contentType;
      if (metadata.contentDisposition)
        flatMeta['contentDisposition'] = metadata.contentDisposition;
      if (metadata.customMetadata) {
        Object.assign(flatMeta, metadata.customMetadata);
      }
    }

    // get_upload_url expects a path relative to the project root (e.g. "data/file.mcap"),
    // but callers pass the full GCS path (e.g. "/{orgSlug}/{projectSlug}/data/file.mcap").
    // Strip the {orgSlug}/{projectSlug}/ storage prefix so the server doesn't double it.
    const projectId = this.projectId();
    const [orgSlug, projectSlug] = projectId.split('/');
    const prefix = `${orgSlug}/${projectSlug}/`;
    const leadingSlashPrefix = `/${prefix}`;
    const relativePath = path.startsWith(leadingSlashPrefix)
      ? path.slice(leadingSlashPrefix.length)
      : path.startsWith(prefix)
      ? path.slice(prefix.length)
      : path;

    const progress$ = await this.apiService.uploadFileToPath(
      relativePath,
      file,
      projectId,
      flatMeta
    );
    return progress$.toPromise();
  }

  async getDownloadUrl(path: string): Promise<string> {
    const storageRef = this.getStorageRef(path);
    return await getDownloadURL(storageRef);
  }

  // Helper method to get storage instance (for components that need direct access)
  getStorage(): FirebaseStorage {
    return this.storage;
  }

  // Helper to convert Firestore snapshots to observables (replaces collectionData from rxfire)
  private collectionData<T>(query: Query<DocumentData>): Observable<T[]> {
    return new Observable(subscriber => {
      const unsubscribe = onSnapshot(query, 
        snapshot => {
          const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
          subscriber.next(data);
        },
        error => subscriber.error(error)
      );
      return () => unsubscribe();
    });
  }

  // Helper to convert Firestore doc snapshots to observables (replaces docData from rxfire)
  private docData<T>(docRef: DocumentReference<DocumentData>): Observable<T | undefined> {
    return new Observable(subscriber => {
      const unsubscribe = onSnapshot(docRef,
        snapshot => {
          if (snapshot.exists()) {
            subscriber.next({ id: snapshot.id, ...snapshot.data() } as T);
          } else {
            subscriber.next(undefined);
          }
        },
        error => subscriber.error(error)
      );
      return () => unsubscribe();
    });
  }
}
