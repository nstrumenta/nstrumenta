import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { IntegrationsComponent } from './integrations.component';

describe('IntegrationsComponent', () => {
  let component: IntegrationsComponent;
  let fixture: ComponentFixture<IntegrationsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [IntegrationsComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(IntegrationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
