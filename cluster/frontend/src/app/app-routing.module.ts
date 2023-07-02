import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthService } from './auth/auth.service';
import { AccountComponent } from './components/account/account.component';
import { ActionsComponent } from './components/actions/actions.component';
import { AgentDetailComponent } from './components/agent-detail/agent-detail.component';
import { AgentsComponent } from './components/agents/agents.component';
import { AlgorithmBuildsComponent } from './components/algorithm-builds/algorithm-builds.component';
import { DataDetailComponent } from './components/data-detail/data-detail.component';
import { IntegrationsComponent } from './components/integrations/integrations.component';
import { LoginWaitComponent } from './components/login-wait/login-wait.component';
import { LoginComponent } from './components/login/login.component';
import { MachinesComponent } from './components/machines/machines.component';
import { NavComponent } from './components/nav/nav.component';
import { ProjectListComponent } from './components/project-list/project-list.component';
import { ProjectSettingsComponent } from './components/project-settings/project-settings.component';
import { RecordComponent } from './components/record/record.component';
import { RepositoriesComponent } from './components/repositories/repositories.component';
import { RepositoryJobsComponent } from './components/repository-jobs/repository-jobs.component';
import { SignInMethodsComponent } from './components/sign-in-methods/sign-in-methods.component';
import { UserProfileComponent } from './components/user-profile/user-profile.component';
import { AlgorithmsComponent } from './pages/algorithms/algorithms.component';
import { DataTableComponent } from './components/data-table/data-table.component';
import { HomeComponent } from './pages/home/home.component';
import { OverviewComponent } from './pages/overview/overview.component';
import { PricingComponent } from './pages/pricing/pricing.component';
import { ModulesComponent } from './components/modules/modules.component';
import { ModuleDetailsComponent } from './components/module-details/module-details.component';

const userRoutes: Routes = [
  {
    path: 'projects/:projectId',
    component: NavComponent,
    canActivate: [AuthService],
    children: [
      {
        path: '',
        children: [
          { path: 'overview', component: OverviewComponent },
          { path: 'data', component: DataTableComponent },
          { path: 'data/:dataId', component: DataDetailComponent },
          { path: 'record', component: RecordComponent },
          { path: 'actions', component: ActionsComponent },
          { path: 'agents', component: AgentsComponent },
          { path: 'agents/:agentId', component: AgentDetailComponent },
          { path: 'machines', component: MachinesComponent },
          {
            path: 'repositories/:repositoryId/jobs',
            component: RepositoryJobsComponent,
          },
          { path: 'repositories', component: RepositoriesComponent },
          {
            path: 'algorithms/:algorithmId/builds',
            component: AlgorithmBuildsComponent,
          },
          { path: 'algorithms', component: AlgorithmsComponent },
          { path: 'settings', component: ProjectSettingsComponent },
          { path: 'modules', component: ModulesComponent },
          { path: 'modules:/:moduleId', component: ModuleDetailsComponent },
        ],
      },
    ],
  },
  {
    path: 'projects',
    component: NavComponent,
    canActivate: [AuthService],
    children: [
      {
        path: '',
        component: ProjectListComponent,
      },
    ],
  },
  {
    path: '',
    component: HomeComponent,
  },
  { path: 'subscribe', component: PricingComponent },
  {
    path: 'account',
    component: NavComponent,
    children: [
      {
        path: '',
        component: AccountComponent,
        children: [
          {
            path: 'profile',
            component: UserProfileComponent,
          },
          {
            path: 'integrations',
            component: IntegrationsComponent,
          },
          {
            path: 'sign-in-methods',
            component: SignInMethodsComponent,
          },
          {
            path: '',
            redirectTo: 'profile',
            pathMatch: 'full',
          },
        ],
      },
    ],
  },
  {
    path: 'login-wait',
    component: LoginWaitComponent,
  },
  {
    path: 'login',
    component: NavComponent,
    children: [
      {
        path: '',
        component: LoginComponent,
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forRoot(userRoutes, { relativeLinkResolution: 'legacy' })],
  exports: [RouterModule],
})
export class AppRoutingModule {}
