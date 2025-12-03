import { TestBed } from '@angular/core/testing';
import { ArchiveService } from './archive.service';
import { ServerService } from './server.service';
import { ProjectService } from './project.service';
import { MockServerService, MockProjectService } from 'src/app/testing/mocks';

describe('ArchiveServiceService', () => {
  let service: ArchiveService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: ServerService, useClass: MockServerService },
        { provide: ProjectService, useClass: MockProjectService }
      ]
    });
    service = TestBed.inject(ArchiveService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
