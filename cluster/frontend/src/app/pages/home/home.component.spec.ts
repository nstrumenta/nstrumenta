import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { AppComponent } from 'src/app/app.component';
import { imports } from 'src/app/app.imports';
import { DataTableComponent } from 'src/app/components/data-table/data-table.component';
import { EditDialogComponent } from 'src/app/components/edit-dialog/edit-dialog.component';
import { LoginComponent } from 'src/app/components/login/login.component';
import { LogoComponent } from 'src/app/components/logo/logo.component';
import { MachinesComponent } from 'src/app/components/machines/machines.component';
import { NavComponent } from 'src/app/components/nav/nav.component';
import { NavbarAccountComponent } from 'src/app/components/navbar-account/navbar-account.component';
import { NavbarTitleComponent } from 'src/app/components/navbar-title/navbar-title.component';
import { NewProjectDialogComponent } from 'src/app/components/new-project-dialog/new-project-dialog.component';
import { OverviewDashboardComponent } from 'src/app/components/overview-dashboard/overview-dashboard.component';
import { ProjectListComponent } from 'src/app/components/project-list/project-list.component';
import { ToolbarComponent } from 'src/app/components/toolbar/toolbar.component';
import { ViewInSandboxDialogComponent } from 'src/app/components/view-in-sandbox-dialog/view-in-sandbox-dialog.component';
import { FileSizePipe } from 'src/app/pipes/file-size.pipe';
import { AlgorithmsComponent } from '../algorithms/algorithms.component';
import { ExperimentsComponent } from '../experiments/experiments.component';
import { OverviewComponent } from '../overview/overview.component';
import { HomeComponent } from './home.component';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: imports,
      declarations: [
        HomeComponent,
        AppComponent,
        NavComponent,
        MachinesComponent,
        DataTableComponent,
        ExperimentsComponent,
        AlgorithmsComponent,
        NavbarTitleComponent,
        LogoComponent,
        LoginComponent,
        OverviewComponent,
        HomeComponent,
        NavbarAccountComponent,
        ToolbarComponent,
        ProjectListComponent,
        EditDialogComponent,
        FileSizePipe,
        ViewInSandboxDialogComponent,
        NewProjectDialogComponent,
        OverviewDashboardComponent,
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
