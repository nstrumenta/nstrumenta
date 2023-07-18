import { TestBed } from '@angular/core/testing';

import { ArchiveService } from './archive.service';

describe('ArchiveServiceService', () => {
  let service: ArchiveService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ArchiveService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
