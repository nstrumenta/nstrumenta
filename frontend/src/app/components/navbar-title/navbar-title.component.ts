import { Component } from '@angular/core';
import { environment } from 'src/environments/environment';
import { MatMenuItem } from '@angular/material/menu';
import { RouterLink } from '@angular/router';
import { getNstConfig, getServerSha } from '../../nst-config';

@Component({
    selector: 'app-navbar-title',
    templateUrl: './navbar-title.component.html',
    styleUrls: ['./navbar-title.component.scss'],
    imports: [MatMenuItem, RouterLink]
})
export class NavbarTitleComponent {
  version: string;
  frontendSha = '';
  serverSha = '';

  constructor() {
    this.version = environment.version;
    getNstConfig().then((config) => {
      this.frontendSha = config.frontendSha ? config.frontendSha.substring(0, 7) : '';
    });
    getServerSha().then((sha) => {
      this.serverSha = sha ? sha.substring(0, 7) : '';
    });
  }
}
