import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { DataDetailComponent } from './data-detail.component';
import { FirebaseDataService } from 'src/app/services/firebase-data.service';
import { ApiService } from 'src/app/services/api.service';
import { MockFirebaseDataService, MockApiService } from 'src/app/testing/mocks';

describe('DataDetailComponent', () => {
  let component: DataDetailComponent;
  let fixture: ComponentFixture<DataDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DataDetailComponent, RouterTestingModule],
      providers: [
        { provide: FirebaseDataService, useClass: MockFirebaseDataService },
        { provide: ApiService, useClass: MockApiService },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DataDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
