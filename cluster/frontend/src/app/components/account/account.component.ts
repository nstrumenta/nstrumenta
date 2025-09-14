import { Component, OnInit } from '@angular/core';
import { MatToolbar } from '@angular/material/toolbar';
import { RouterOutlet } from '@angular/router';

@Component({
    selector: 'app-account',
    templateUrl: './account.component.html',
    styleUrls: ['./account.component.scss'],
    imports: [MatToolbar, RouterOutlet]
})
export class AccountComponent implements OnInit {
  constructor() {}

  ngOnInit() {}
}
