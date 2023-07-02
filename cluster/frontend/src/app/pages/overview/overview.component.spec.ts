import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { OverviewComponent } from './overview.component';
import { OverviewDashboardComponent } from 'src/app/components/overview-dashboard/overview-dashboard.component';
import { MatCardModule } from '@angular/material/card';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';

describe('OverviewComponent', () => {
  let component: OverviewComponent;
  let fixture: ComponentFixture<OverviewComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [MatGridListModule, MatIconModule, MatMenuModule, MatCardModule],
      declarations: [OverviewComponent, OverviewDashboardComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OverviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
