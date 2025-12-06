import { Component, inject } from '@angular/core';
import { AuthService } from 'src/app/auth/auth.service';
import { ToolbarComponent } from '../../components/toolbar/toolbar.component';

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss'],
    imports: [ToolbarComponent]
})
export class HomeComponent {
  public authService = inject(AuthService);
}
