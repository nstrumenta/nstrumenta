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
  get notifications() { return () => []; }
  get projectSettings() { return () => null; }
  get projectId() { return () => 'test-project'; }
  get agentId() { return () => ''; }
  get userId() { return () => ''; }
  getDocument() { return of({}); }
  getUserDoc() { return of({}); }
  getUserDocOnce() { return Promise.resolve({}); }
  slugExists() { return Promise.resolve(false); }
  setProject() {}
  setUser() {}
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
  currentUser = signal<any>({ uid: 'test-uid' });
  authResolved = signal(true);
  userStatus = signal<string | null>('approved');
  currentUserRole = signal<string | null>(null);
  setUser() {}
  login() { return Promise.resolve(); }
  loginWithGoogle() { return Promise.resolve(); }
  loginWithGithub() { return Promise.resolve(); }
  loginWithEmail(_email: string, _password: string) { return Promise.resolve(); }
  registerWithEmail(_email: string, _password: string) { return Promise.resolve(); }
  sendEmailLinkForCurrentUser(_email: string) { return Promise.resolve(); }
  sendInvitationEmailLink(_email: string, _continueUrl: string) { return Promise.resolve(); }
  hasPendingEmailLinkInUrl() { return false; }
  completePendingEmailLink(_emailOverride?: string) { return Promise.resolve<'linked' | 'none'>('none'); }
  signInWithInvitationEmailLink(_email: string) { return Promise.resolve<'signed-in' | 'none'>('signed-in'); }
  logout() { return Promise.resolve(); }
  getAuth() { return {} as any; }
}

export class MockThemeService {
  isDark = signal(false);
  toggleTheme() { this.isDark.set(!this.isDark()); }
}

export class MockProjectService {
  currentProjectId = 'test-project';
  currentProject = new BehaviorSubject<string>('test-project');
  userProjectsObservable$ = of([{ projectId: 'test-project' }]);
  inviteProjectMember() { return Promise.resolve({}); }
  updateProjectMemberRole() { return Promise.resolve({}); }
  removeProjectMember() { return Promise.resolve({}); }
}

export class MockServerService {
  runServerTask() { return Promise.resolve({}); }
}

export class MockApiService {
  getApiUrl() { return Promise.resolve('http://localhost:8080'); }
  createApiKey() { return Promise.resolve({}); }
  getDownloadUrl() { return Promise.resolve('https://storage.example.com/signed-read-url'); }
  deleteFile() { return Promise.resolve(); }
  uploadFileToPath() { return Promise.resolve(of(100)); }
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
