import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { RouterTestingModule } from '@angular/router/testing';
import { ToolbarComponent } from './toolbar.component';
import { NavbarTitleComponent } from '../navbar-title/navbar-title.component';
import { NavbarAccountComponent } from '../navbar-account/navbar-account.component';
import { AuthService } from 'src/app/auth/auth.service';
import { FirebaseDataService } from 'src/app/services/firebase-data.service';
import { UploadService } from 'src/app/services/upload.service';
import { FolderNavigationService } from 'src/app/services/folder-navigation.service';
import { ProjectService } from 'src/app/services/project.service';
import { VscodeService } from 'src/app/services/vscode.service';
import { 
  MockAuthService, 
  MockFirebaseDataService, 
  MockUploadService, 
  MockFolderNavigationService,
  MockProjectService,
  MockVscodeService
} from 'src/app/testing/mocks';
import { MatSnackBarModule } from '@angular/material/snack-bar';

describe('ToolbarComponent', () => {
  let component: ToolbarComponent;
  let fixture: ComponentFixture<ToolbarComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
    imports: [
      MatToolbarModule, 
      RouterTestingModule, 
      MatMenuModule, 
      MatIconModule, 
      MatSnackBarModule,
      ToolbarComponent, 
      NavbarTitleComponent, 
      NavbarAccountComponent
    ],
    providers: [
      { provide: AuthService, useClass: MockAuthService },
      { provide: FirebaseDataService, useClass: MockFirebaseDataService },
      { provide: UploadService, useClass: MockUploadService },
      { provide: FolderNavigationService, useClass: MockFolderNavigationService },
      { provide: ProjectService, useClass: MockProjectService },
      { provide: VscodeService, useClass: MockVscodeService }
    ],
}).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ToolbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
