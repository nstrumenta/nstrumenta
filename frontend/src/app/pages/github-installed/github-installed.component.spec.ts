import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { ApiService } from 'src/app/services/api.service';
import { GithubInstalledComponent } from './github-installed.component';

class MockApiService {
  linkGithubInstallation = vi.fn(async () => ({
    ok: true,
    linkedRepos: ['tbryant/flyimal'],
  }));
}

describe('GithubInstalledComponent', () => {
  let fixture: ComponentFixture<GithubInstalledComponent>;
  let component: GithubInstalledComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GithubInstalledComponent, RouterTestingModule],
      providers: [
        { provide: ApiService, useClass: MockApiService },
        {
          provide: ActivatedRoute,
          useValue: {
            queryParamMap: of(convertToParamMap({
              installation_id: '12345',
              state: 'test-org/test-project',
              setup_action: 'install',
            })),
            snapshot: {
              queryParamMap: convertToParamMap({
                installation_id: '12345',
                state: 'test-org/test-project',
                setup_action: 'install',
              }),
            },
          },
        },
      ],
    }).compileComponents();
  });

  beforeEach(async () => {
    fixture = TestBed.createComponent(GithubInstalledComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should link the installation from the callback params', () => {
    expect(component.status()).toBe('success');
    expect(component.linkedRepos()).toContain('tbryant/flyimal');
  });
});