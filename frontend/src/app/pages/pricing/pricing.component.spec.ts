import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { PricingComponent } from './pricing.component';
import { ActivatedRoute } from '@angular/router';
import { FirebaseDataService } from 'src/app/services/firebase-data.service';
import { MockActivatedRoute, MockFirebaseDataService } from 'src/app/testing/mocks';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('PricingComponent', () => {
  let component: PricingComponent;
  let fixture: ComponentFixture<PricingComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [PricingComponent, NoopAnimationsModule],
      providers: [
        { provide: ActivatedRoute, useClass: MockActivatedRoute },
        { provide: FirebaseDataService, useClass: MockFirebaseDataService }
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PricingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
