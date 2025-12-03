import { TestBed } from '@angular/core/testing';

import { VmService } from './vm.service';
import { ServerService } from './services/server.service';
import { ProjectService } from './services/project.service';
import { AuthService } from 'src/app/auth/auth.service';
import { MockServerService, MockProjectService, MockAuthService } from 'src/app/testing/mocks';

describe('VmService', () => {
  let service: VmService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: ServerService, useClass: MockServerService },
        { provide: ProjectService, useClass: MockProjectService },
        { provide: AuthService, useClass: MockAuthService }
      ]
    });
    service = TestBed.inject(VmService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
