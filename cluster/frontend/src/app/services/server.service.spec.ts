import { TestBed } from '@angular/core/testing';
import { ServerService } from './server.service';
import { FirebaseDataService } from './firebase-data.service';
import { AuthService } from '../auth/auth.service';
import { MockFirebaseDataService, MockAuthService } from '../testing/mocks';

describe('ServerService', () => {
  beforeEach(() => TestBed.configureTestingModule({
    providers: [
      ServerService,
      { provide: FirebaseDataService, useClass: MockFirebaseDataService },
      { provide: AuthService, useClass: MockAuthService }
    ]
  }));

  it('should be created', () => {
    const service: ServerService = TestBed.inject(ServerService);
    expect(service).toBeTruthy();
  });
});
