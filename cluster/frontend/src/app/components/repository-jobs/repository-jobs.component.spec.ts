import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { RepositoryJobsComponent } from './repository-jobs.component';

describe('RepositoryJobsComponent', () => {
  let component: RepositoryJobsComponent;
  let fixture: ComponentFixture<RepositoryJobsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [RepositoryJobsComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RepositoryJobsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
