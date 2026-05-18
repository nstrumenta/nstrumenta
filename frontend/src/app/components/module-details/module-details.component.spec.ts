import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';

import { ModuleDetailsComponent } from './module-details.component';
import { ApiService } from 'src/app/services/api.service';
import { FirebaseDataService } from 'src/app/services/firebase-data.service';

class MockFirebaseDataService {
  modules = signal([
    {
      id: 'module-1',
      name: 'flyimal',
      version: '1.2.3',
      type: 'web',
      url: 'https://example.com/flyimal/',
      path: 'modules/flyimal-1.2.3.tgz',
      lastModified: 1710000000000,
    },
  ]);

  projectId = signal('test-org/test-project');
}

class MockApiService {
  approveModule = async () => ({
    moduleId: 'module-1',
    approved: true,
    approvedAt: Date.now(),
    approvedBy: 'test-user',
  });
}

describe('ModuleDetailsComponent', () => {
  let component: ModuleDetailsComponent;
  let fixture: ComponentFixture<ModuleDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModuleDetailsComponent],
      providers: [
        { provide: ApiService, useClass: MockApiService },
        { provide: FirebaseDataService, useClass: MockFirebaseDataService },
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(convertToParamMap({ moduleId: 'module-1' })),
            snapshot: {
              paramMap: convertToParamMap({ moduleId: 'module-1' }),
            },
          },
        },
      ],
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ModuleDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should resolve the selected module from the current project modules', () => {
    expect(component.module()?.name).toBe('flyimal');
    expect(component.canPreview()).toBe(true);
  });

  it('should render module metadata and preview link', () => {
    const nativeElement = fixture.nativeElement as HTMLElement;

    expect(nativeElement.textContent).toContain('flyimal');
    expect(nativeElement.textContent).toContain('1.2.3');
    expect(nativeElement.textContent).toContain('web');
    expect(nativeElement.querySelector('iframe')).toBeTruthy();
    expect((nativeElement.querySelector('a') as HTMLAnchorElement)?.href).toContain('https://example.com/flyimal/');
  });

  it('should approve the selected module', async () => {
    await component.approveModule();

    expect(component.isApproved()).toBe(true);
    expect(component.approvalError()).toBe('');
  });
});
