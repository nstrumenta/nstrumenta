import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { MatSidenavContainer, MatSidenav, MatSidenavContent } from '@angular/material/sidenav';
import { NavbarTitleComponent } from '../navbar-title/navbar-title.component';
import { MatNavList, MatListItem, MatListItemIcon, MatListItemTitle } from '@angular/material/list';
import { AsyncPipe } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { ToolbarComponent } from '../toolbar/toolbar.component';

@Component({
    selector: 'app-nav',
    templateUrl: './nav.component.html',
    styleUrls: ['./nav.component.scss'],
    imports: [MatSidenavContainer, MatSidenav, NavbarTitleComponent, MatNavList, MatListItem, MatListItemIcon, MatListItemTitle, RouterLink, RouterLinkActive, MatIcon, MatSidenavContent, ToolbarComponent, RouterOutlet, AsyncPipe]
})
export class NavComponent {
  isExpanded = false;

  public router = inject(Router);
  private breakpointObserver = inject(BreakpointObserver);

  isHandset$: Observable<boolean> = this.breakpointObserver
    .observe(Breakpoints.Handset)
    .pipe(map((result) => result.matches));
}
