import { Component, inject } from '@angular/core';
import { AuthService } from 'src/app/auth/auth.service';
import { ToolbarComponent } from '../../components/toolbar/toolbar.component';
import { ProjectListComponent } from '../../components/project-list/project-list.component';

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss'],
    imports: [ToolbarComponent, ProjectListComponent]
})
export class HomeComponent {
  readonly currentUser = inject(AuthService).currentUser;
}
