/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-empty-function */
import { of, BehaviorSubject, Subject } from 'rxjs';
import { signal } from '@angular/core';

export class MockFirebaseDataService {
  getStorage() { return {}; }
  runTask() { return Promise.resolve({}); }
  get modules() { return () => []; }
  get data() { return () => []; }
  get record() { return () => []; }
  get actions() { return () => []; }
  get agentActions() { return () => []; }
  get repositories() { return () => []; }
  get agents() { return () => []; }
  get machines() { return () => []; }
  get userProjects() { return () => []; }
  get projectSettings() { return () => null; }
  get projectId() { return () => 'test-project'; }
  getDocument() { return of({}); }
  setProject() {}
  deleteRecord() {}
  deleteModule() {}
  setUser() {}
  updateUserProject() {}
  userProjectsObservable$ = of([]);
  getDownloadUrl() { return Promise.resolve('http://localhost/test.file'); }
}

export class MockVscodeService {
  message$ = new Subject<any>();
  init() {}
  send() {}
}

export class MockUploadService {
  uploads = signal(new Map());
  uploadFile() { return Promise.resolve(''); }
  hasActiveUploads() { return false; }
  getUploadsArray() { return []; }
}

export class MockFolderNavigationService {
  currentFolder = signal('');
  flatView = signal(false);
  setFolder() {}
  toggleFlatView() {}
  navigateToFolder() {}
  navigateUp() {}
  get breadcrumbs() { return []; }
}

export class MockAuth {
  signOut() { return Promise.resolve(); }
  onIdTokenChanged(callback: any) {
    callback(null);
    return () => {};
  }
  updateCurrentUser() { return Promise.resolve(); }
}

export class MockAuthService {
  user = new BehaviorSubject<any>({ uid: 'test-uid' });
  user$ = this.user.asObservable();
  setUser() {}
  login() { return Promise.resolve(); }
  loginWithGoogle() { return Promise.resolve(); }
  loginWithGithub() { return Promise.resolve(); }
  loginWithEmail(_email: string, _password: string) { return Promise.resolve(); }
  registerWithEmail(_email: string, _password: string) { return Promise.resolve(); }
  logout() { return Promise.resolve(); }
  getAuth() { return {} as any; }
}

export class MockProjectService {
  currentProjectId = 'test-project';
  user = { uid: 'test-uid' };
  currentProject = new BehaviorSubject<string>('test-project');
  userProjectsObservable$ = of([{ projectId: 'test-project' }]);
}

export class MockServerService {
  runServerTask() { return Promise.resolve({}); }
}

export class MockApiService {
  getApiUrl() { return Promise.resolve('http://localhost:8080'); }
  createApiKey() { return Promise.resolve({}); }
}

export class MockActivatedRoute {
  params = of({});
  queryParams = of({});
  snapshot = {
    paramMap: {
      get: (_key: string) => 'test-value'
    },
    queryParamMap: {
      get: (_key: string) => 'test-value'
    }
  };
}

export class MockMatDialogRef {
  close(_result?: any) {}
}
