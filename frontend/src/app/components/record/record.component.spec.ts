import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { RecordComponent } from './record.component';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from 'src/app/auth/auth.service';
import { FirebaseDataService } from 'src/app/services/firebase-data.service';
import { MockActivatedRoute, MockAuthService, MockFirebaseDataService } from 'src/app/testing/mocks';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('RecordComponent', () => {
  let component: RecordComponent;
  let fixture: ComponentFixture<RecordComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [RecordComponent, NoopAnimationsModule],
      providers: [
        { provide: ActivatedRoute, useClass: MockActivatedRoute },
        { provide: AuthService, useClass: MockAuthService },
        { provide: FirebaseDataService, useClass: MockFirebaseDataService }
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RecordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
