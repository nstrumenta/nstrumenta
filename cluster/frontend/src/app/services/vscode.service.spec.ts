import { TestBed } from '@angular/core/testing';

import { VscodeService } from './vscode.service';

describe('VscodeService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: VscodeService = TestBed.get(VscodeService);
    expect(service).toBeTruthy();
  });
});
