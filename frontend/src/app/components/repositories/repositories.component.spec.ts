import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RepositoriesComponent } from './repositories.component';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from 'src/app/auth/auth.service';
import { ApiService } from 'src/app/services/api.service';
import { FirebaseDataService } from 'src/app/services/firebase-data.service';
import { MockActivatedRoute, MockApiService, MockAuthService, MockFirebaseDataService } from 'src/app/testing/mocks';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('RepositoriesComponent', () => {
  let component: RepositoriesComponent;
  let fixture: ComponentFixture<RepositoriesComponent>;
  let apiService: ApiService;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [RepositoriesComponent, NoopAnimationsModule],
      providers: [
        { provide: ActivatedRoute, useClass: MockActivatedRoute },
        { provide: AuthService, useClass: MockAuthService },
        { provide: ApiService, useClass: MockApiService },
        { provide: FirebaseDataService, useClass: MockFirebaseDataService }
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RepositoriesComponent);
    component = fixture.componentInstance;
    apiService = TestBed.inject(ApiService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should split linked and available repositories per installation', async () => {
    vi.spyOn(apiService, 'listGithubInstallations').mockResolvedValue({
      installations: [{
        installationId: '12345',
        account: { login: 'example-org', type: 'Organization' },
        updatedAt: Date.now(),
        repositories: [
          { id: '1', fullName: 'example-org/repo-a', linkedProjectId: 'test-value' },
          { id: '2', fullName: 'example-org/repo-b' },
        ],
      }],
    });

    await (component as any).refreshInstallations();

    expect(component.connectedInstallations()[0].linkedRepositories).toHaveLength(1);
    expect(component.connectedInstallations()[0].availableRepositories).toHaveLength(1);
  });
});
