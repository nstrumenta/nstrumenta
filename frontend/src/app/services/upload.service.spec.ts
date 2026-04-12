import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { UploadService } from './upload.service';
import { ApiService } from './api.service';
import { FirebaseDataService } from './firebase-data.service';
import { MockApiService, MockFirebaseDataService } from '../testing/mocks';

describe('UploadService', () => {
  let service: UploadService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        UploadService,
        { provide: ApiService, useClass: MockApiService },
        { provide: FirebaseDataService, useClass: MockFirebaseDataService },
      ],
    });
    service = TestBed.inject(UploadService);
  });

  describe('getProjectPath', () => {
    it('returns the projectId as-is for org/project format', () => {
      expect(service.getProjectPath('my-org/my-project')).toBe('my-org/my-project');
    });

    it('expectedPath for uploaded file matches GCS filePath stored by Cloud Function', () => {
      // Cloud Function stores filePath = raw GCS path = `${orgSlug}/${projectSlug}/data/...`
      // upload.service builds: `${getProjectPath(projectId)}/${uploadPath}`
      // where uploadPath = `data/${file.name}`
      const projectId = 'acme/sensor-lab';
      const fileName = 'recording.mcap';
      const uploadPath = `data/${fileName}`;
      const expectedPath = `${service.getProjectPath(projectId)}/${uploadPath}`;
      expect(expectedPath).toBe('acme/sensor-lab/data/recording.mcap');
    });

    it('expectedPath with subfolder matches GCS path', () => {
      const projectId = 'acme/sensor-lab';
      const folder = 'session-1';
      const fileName = 'data.json';
      const normalizedFolder = folder.replace(/^\/+|\/+$/g, '');
      const uploadPath = `data/${normalizedFolder}/${fileName}`;
      const expectedPath = `${service.getProjectPath(projectId)}/${uploadPath}`;
      expect(expectedPath).toBe('acme/sensor-lab/data/session-1/data.json');
    });
  });
});
