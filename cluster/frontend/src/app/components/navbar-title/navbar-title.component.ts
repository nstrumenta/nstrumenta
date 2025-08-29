import { Component } from '@angular/core';
import { environment } from 'src/environments/environment';
import { MatMenuItem } from '@angular/material/menu';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-navbar-title',
    templateUrl: './navbar-title.component.html',
    styleUrls: ['./navbar-title.component.scss'],
    imports: [MatMenuItem, RouterLink]
})
export class NavbarTitleComponent {
  version: string;

  constructor() {
    this.version = environment.version;
  }
}
