import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectListComponent } from './project-list.component';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';
import { FirebaseDataService } from 'src/app/services/firebase-data.service';
import { AuthService } from 'src/app/auth/auth.service';
import { signal } from '@angular/core';
import { Project } from 'src/app/models/firebase.model';
import { RouterTestingModule } from '@angular/router/testing';

const authServiceStub = {
  currentUser: signal<any>({ uid: 'mock' }),
};

function makeStub(projects: Project[]) {
  return {
    userProjects: signal(projects),
    setUser: vi.fn(),
  };
}

const routableProject: Project = { id: 'abc', name: 'My Project', orgSlug: 'myorg', slug: 'my-project', lastOpened: 1000 };
const legacyProject: Project = { id: 'xyz', orgSlug: 'projects', lastOpened: 500 };
const noSlugProject: Project = { id: 'def', orgSlug: 'myorg', lastOpened: 200 };

describe('ProjectListComponent', () => {
  let component: ProjectListComponent;
  let fixture: ComponentFixture<ProjectListComponent>;

  function setup(projects: Project[]) {
    TestBed.configureTestingModule({
      imports: [MatDialogModule, RouterTestingModule, ProjectListComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        { provide: AuthService, useValue: authServiceStub },
        { provide: FirebaseDataService, useValue: makeStub(projects) },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ProjectListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(() => TestBed.resetTestingModule());

  it('should create', async () => {
    await setup([]);
    expect(component).toBeTruthy();
  });

  describe('isRoutable', () => {
    beforeEach(async () => setup([]));

    it('returns true for a project with valid orgSlug and slug', () => {
      expect(component.isRoutable(routableProject)).toBe(true);
    });

    it('returns false when orgSlug is a reserved word', () => {
      expect(component.isRoutable(legacyProject)).toBe(false);
    });

    it('returns false when slug is missing', () => {
      expect(component.isRoutable(noSlugProject)).toBe(false);
    });

    it('returns false when both slug and orgSlug are missing', () => {
      expect(component.isRoutable({ id: 'bare' })).toBe(false);
    });
  });

  describe('filteredProjects', () => {
    beforeEach(async () => setup([routableProject, legacyProject, noSlugProject]));

    it('returns all projects sorted by lastOpened descending', () => {
      const sorted = component.filteredProjects();
      expect(sorted[0].id).toBe('abc');
      expect(sorted[1].id).toBe('xyz');
      expect(sorted[2].id).toBe('def');
    });

    it('filters by name', () => {
      component.filterText.set('my');
      expect(component.filteredProjects().length).toBe(1);
      expect(component.filteredProjects()[0].id).toBe('abc');
    });

    it('returns empty when filter matches nothing', () => {
      component.filterText.set('zzznomatch');
      expect(component.filteredProjects().length).toBe(0);
    });
  });
});
