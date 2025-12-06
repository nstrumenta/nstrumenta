import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModuleDetailsComponent } from './module-details.component';

describe('ModuleDetailsComponent', () => {
  let component: ModuleDetailsComponent;
  let fixture: ComponentFixture<ModuleDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [ModuleDetailsComponent]
})
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ModuleDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
