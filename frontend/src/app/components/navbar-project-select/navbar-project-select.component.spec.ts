import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NavbarProjectSelectComponent } from './navbar-project-select.component';
import { AuthService } from 'src/app/auth/auth.service';
import { FirebaseDataService } from 'src/app/services/firebase-data.service';
import { MockAuthService, MockFirebaseDataService } from 'src/app/testing/mocks';

describe('NavbarProjectSelectComponent', () => {
  let component: NavbarProjectSelectComponent;
  let fixture: ComponentFixture<NavbarProjectSelectComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
    imports: [NavbarProjectSelectComponent, RouterTestingModule],
    providers: [
      { provide: AuthService, useClass: MockAuthService },
      { provide: FirebaseDataService, useClass: MockFirebaseDataService }
    ]
}).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NavbarProjectSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
