import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { AlgorithmBuildsComponent } from './algorithm-builds.component';

describe('AlgorithmBuildsComponent', () => {
  let component: AlgorithmBuildsComponent;
  let fixture: ComponentFixture<AlgorithmBuildsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [AlgorithmBuildsComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AlgorithmBuildsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
