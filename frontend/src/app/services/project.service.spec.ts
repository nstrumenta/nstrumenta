import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ProjectService } from './project.service';
import { AuthService } from '../auth/auth.service';
import { ServerService } from './server.service';
import { ApiService } from './api.service';
import { FirebaseDataService } from './firebase-data.service';
import { MockAuthService, MockServerService, MockApiService, MockFirebaseDataService } from '../testing/mocks';

describe('ProjectService', () => {
  beforeEach(() => TestBed.configureTestingModule({
    providers: [
      ProjectService,
      provideRouter([]),
      { provide: AuthService, useClass: MockAuthService },
      { provide: ServerService, useClass: MockServerService },
      { provide: ApiService, useClass: MockApiService },
      { provide: FirebaseDataService, useClass: MockFirebaseDataService }
    ]
  }));

  it('should be created', () => {
    const service: ProjectService = TestBed.inject(ProjectService);
    expect(service).toBeTruthy();
  });
});
