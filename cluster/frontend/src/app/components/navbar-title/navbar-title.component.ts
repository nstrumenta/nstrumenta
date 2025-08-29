import { Component } from '@angular/core';
import { environment } from 'src/environments/environment';

@Component({
    selector: 'app-navbar-title',
    templateUrl: './navbar-title.component.html',
    styleUrls: ['./navbar-title.component.scss'],
    standalone: false
})
export class NavbarTitleComponent {
  version: string;

  constructor() {
    this.version = environment.version;
  }
}
