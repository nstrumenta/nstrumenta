import { Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { AuthService } from 'src/app/auth/auth.service';
import { ToolbarComponent } from '../../components/toolbar/toolbar.component';
import { ProjectListComponent } from '../../components/project-list/project-list.component';

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss'],
    imports: [ToolbarComponent, ProjectListComponent, AsyncPipe]
})
export class HomeComponent {
  public authService = inject(AuthService);
}
