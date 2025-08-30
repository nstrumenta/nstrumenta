import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AccountComponent } from './components/account/account.component';
import { ActionsComponent } from './components/actions/actions.component';
import { AgentDetailComponent } from './components/agent-detail/agent-detail.component';
import { AgentsComponent } from './components/agents/agents.component';
import { DataDetailComponent } from './components/data-detail/data-detail.component';
import { DataTableComponent } from './components/data-table/data-table.component';
import { MachinesComponent } from './components/machines/machines.component';
import { ModuleDetailsComponent } from './components/module-details/module-details.component';
import { ModulesComponent } from './components/modules/modules.component';
import { NavComponent } from './components/nav/nav.component';
import { ProjectListComponent } from './components/project-list/project-list.component';
import { ProjectSettingsComponent } from './components/project-settings/project-settings.component';
import { RecordComponent } from './components/record/record.component';
import { RepositoriesComponent } from './components/repositories/repositories.component';
import { UserProfileComponent } from './components/user-profile/user-profile.component';
import { HomeComponent } from './pages/home/home.component';
import { PricingComponent } from './pages/pricing/pricing.component';

const userRoutes: Routes = [
  {
    path: 'projects/:projectId',
    component: NavComponent,
    children: [
      {
        path: '',
        children: [
          { path: 'overview', redirectTo: 'data' },
          { path: 'data', component: DataTableComponent },
          { path: 'data/:dataId', component: DataDetailComponent },
          { path: 'record', component: RecordComponent },
          { path: 'actions', component: ActionsComponent },
          { path: 'agents', component: AgentsComponent },
          { path: 'agents/:agentId', component: AgentDetailComponent },
          { path: 'machines', component: MachinesComponent },
          { path: 'repositories', component: RepositoriesComponent },
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
            path: '',
            redirectTo: 'profile',
            pathMatch: 'full',
          },
        ],
      },
    ],
  },
];

// Export routes for standalone bootstrap
export { userRoutes as routes };

@NgModule({
  imports: [RouterModule.forRoot(userRoutes, {})],
  exports: [RouterModule],
})
export class AppRoutingModule {}
