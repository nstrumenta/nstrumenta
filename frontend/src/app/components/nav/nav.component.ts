import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Component, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { map } from 'rxjs/operators';
import { MatSidenavContainer, MatSidenav, MatSidenavContent } from '@angular/material/sidenav';
import { NavbarTitleComponent } from '../navbar-title/navbar-title.component';
import { MatNavList, MatListItem, MatListItemIcon, MatListItemTitle } from '@angular/material/list';
import { MatIcon } from '@angular/material/icon';
import { ToolbarComponent } from '../toolbar/toolbar.component';
import { FirebaseDataService } from '../../services/firebase-data.service';

@Component({
    selector: 'app-nav',
    templateUrl: './nav.component.html',
    styleUrls: ['./nav.component.scss'],
    imports: [MatSidenavContainer, MatSidenav, NavbarTitleComponent, MatNavList, MatListItem, MatListItemIcon, MatListItemTitle, RouterLink, RouterLinkActive, MatIcon, MatSidenavContent, ToolbarComponent, RouterOutlet]
})
export class NavComponent {
  private breakpointObserver = inject(BreakpointObserver);
  private route = inject(ActivatedRoute);
  private firebaseDataService = inject(FirebaseDataService);

  isHandset = toSignal(
    this.breakpointObserver.observe(Breakpoints.Handset).pipe(map(result => result.matches)),
    { initialValue: false }
  );

  projectContext = toSignal(
    this.route.data.pipe(map(data => !!data['projectContext'])),
    { initialValue: false }
  );

  constructor() {
    effect(() => {
      if (!this.projectContext()) {
        this.firebaseDataService.setProject('');
      }
    });
  }
}
