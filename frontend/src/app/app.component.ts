import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { OrganizationService } from './services/organization.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    standalone: true,
    imports: [RouterOutlet]
})
export class AppComponent {
  private organizationService = inject(OrganizationService);
}
