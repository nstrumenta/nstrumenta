import { LayoutModule } from '@angular/cdk/layout';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSnackBarModule } from '@angular/material/snack-bar';

import { NavComponent } from './nav.component';
import { NavbarTitleComponent } from '../navbar-title/navbar-title.component';
import { RouterTestingModule } from '@angular/router/testing';
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

describe('NavComponent', () => {
  let component: NavComponent;
  let fixture: ComponentFixture<NavComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
    imports: [
        NoopAnimationsModule,
        LayoutModule,
        MatButtonModule,
        MatIconModule,
        MatListModule,
        MatSidenavModule,
        MatToolbarModule,
        MatSnackBarModule,
        RouterTestingModule,
        MatMenuModule,
        NavComponent, NavbarTitleComponent, NavbarAccountComponent,
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
    fixture = TestBed.createComponent(NavComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should compile', () => {
    expect(component).toBeTruthy();
  });
});
