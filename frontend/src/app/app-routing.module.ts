import { inject } from '@angular/core';
import { ResolveFn, Routes } from '@angular/router';
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
import { ProjectSettingsComponent } from './components/project-settings/project-settings.component';
import { RecordComponent } from './components/record/record.component';
import { RepositoriesComponent } from './components/repositories/repositories.component';
import { UserProfileComponent } from './components/user-profile/user-profile.component';
import { HomeComponent } from './pages/home/home.component';
import { waitlistGuard } from './guards/waitlist.guard';
import { usernameGuard } from './guards/username.guard';
import { WaitlistComponent } from './pages/waitlist/waitlist.component';
import { reservedPathGuard } from './guards/reserved-path.guard';
import { FirebaseDataService } from './services/firebase-data.service';
import { Router } from '@angular/router';

const projectResolver: ResolveFn<string | null> = (route) => {
  const firebaseDataService = inject(FirebaseDataService);
  const router = inject(Router);
  const owner = route.paramMap.get('owner');
  const project = route.paramMap.get('project');
  return firebaseDataService.resolveAndSetProject(owner, project).then(projectId => {
    if (!projectId) {
      router.navigate(['/']);
    }
    return projectId;
  });
};

const userRoutes: Routes = [
  {
    path: 'waitlist',
    component: WaitlistComponent
  },
  {
    path: 'account',
    component: NavComponent,
    canActivate: [waitlistGuard],
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
  {
    path: '',
    component: HomeComponent,
    pathMatch: 'full',
    canActivate: [usernameGuard]
  },
  {
    path: ':owner',
    canMatch: [reservedPathGuard],
    canActivate: [waitlistGuard, usernameGuard],
    children: [
      {
        path: ':project',
        component: NavComponent,
        resolve: { projectId: projectResolver },
        children: [
          { path: '', redirectTo: 'data', pathMatch: 'full' },
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
          { path: 'modules/:moduleId', component: ModuleDetailsComponent },
        ]
      }
    ]
  }
];

// Export routes for standalone bootstrap (used in main.ts)
export { userRoutes as routes };
