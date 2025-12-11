import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { DataDetailComponent } from './data-detail.component';
import { FirebaseDataService } from 'src/app/services/firebase-data.service';
import { MockFirebaseDataService } from 'src/app/testing/mocks';

describe('DataDetailComponent', () => {
  let component: DataDetailComponent;
  let fixture: ComponentFixture<DataDetailComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
    imports: [DataDetailComponent, RouterTestingModule],
    providers: [{ provide: FirebaseDataService, useClass: MockFirebaseDataService }]
}).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DataDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
