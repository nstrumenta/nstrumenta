import { Component, OnInit } from '@angular/core';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-navbar-title',
  templateUrl: './navbar-title.component.html',
  styleUrls: ['./navbar-title.component.scss'],
})
export class NavbarTitleComponent implements OnInit {
  version: string;

  constructor() {
    this.version = environment.version;
  }

  ngOnInit() {}
}
