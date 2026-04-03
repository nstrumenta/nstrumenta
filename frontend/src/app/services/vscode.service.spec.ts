import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { VscodeService } from './vscode.service';
import { ProjectService } from './project.service';
import { ServerService } from './server.service';
import { FirebaseDataService } from './firebase-data.service';
import { AuthService } from '../auth/auth.service';
import { MockProjectService, MockServerService, MockFirebaseDataService, MockAuthService } from '../testing/mocks';

describe('VscodeService', () => {
  beforeEach(() => TestBed.configureTestingModule({
    providers: [
      VscodeService,
      { provide: ProjectService, useClass: MockProjectService },
      { provide: ServerService, useClass: MockServerService },
      { provide: FirebaseDataService, useClass: MockFirebaseDataService },
      { provide: AuthService, useClass: MockAuthService },
    ]
  }));

  it('should be created', () => {
    const service: VscodeService = TestBed.inject(VscodeService);
    expect(service).toBeTruthy();
  });
});
