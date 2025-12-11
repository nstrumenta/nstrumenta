import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ProjectSettingsComponent } from './project-settings.component';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from 'src/app/auth/auth.service';
import { FirebaseDataService } from 'src/app/services/firebase-data.service';
import { ProjectService } from 'src/app/services/project.service';
import { ServerService } from 'src/app/services/server.service';
import { MatDialog } from '@angular/material/dialog';
import { MockActivatedRoute, MockAuthService, MockFirebaseDataService, MockProjectService, MockServerService } from 'src/app/testing/mocks';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('ProjectSettingsComponent', () => {
  let component: ProjectSettingsComponent;
  let fixture: ComponentFixture<ProjectSettingsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [ProjectSettingsComponent, NoopAnimationsModule],
      providers: [
        { provide: ActivatedRoute, useClass: MockActivatedRoute },
        { provide: AuthService, useClass: MockAuthService },
        { provide: FirebaseDataService, useClass: MockFirebaseDataService },
        { provide: ProjectService, useClass: MockProjectService },
        { provide: ServerService, useClass: MockServerService },
        { provide: MatDialog, useValue: {} }
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProjectSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
