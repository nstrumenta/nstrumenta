import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { RepositoriesComponent } from './repositories.component';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from 'src/app/auth/auth.service';
import { FirebaseDataService } from 'src/app/services/firebase-data.service';
import { MockActivatedRoute, MockAuthService, MockFirebaseDataService } from 'src/app/testing/mocks';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('RepositoriesComponent', () => {
  let component: RepositoriesComponent;
  let fixture: ComponentFixture<RepositoriesComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [RepositoriesComponent, NoopAnimationsModule],
      providers: [
        { provide: ActivatedRoute, useClass: MockActivatedRoute },
        { provide: AuthService, useClass: MockAuthService },
        { provide: FirebaseDataService, useClass: MockFirebaseDataService }
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RepositoriesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
