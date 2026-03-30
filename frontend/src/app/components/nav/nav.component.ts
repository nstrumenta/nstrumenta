import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Component, inject, OnInit, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink, RouterOutlet, ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { MatSidenavContainer, MatSidenav, MatSidenavContent } from '@angular/material/sidenav';
import { NavbarTitleComponent } from '../navbar-title/navbar-title.component';
import { MatNavList } from '@angular/material/list';
import { AsyncPipe } from '@angular/common';
import { MatMenuItem } from '@angular/material/menu';
import { MatIcon } from '@angular/material/icon';
import { ToolbarComponent } from '../toolbar/toolbar.component';
import { FirebaseDataService } from '../../services/firebase-data.service';

@Component({
    selector: 'app-nav',
    templateUrl: './nav.component.html',
    styleUrls: ['./nav.component.scss'],
    imports: [MatSidenavContainer, MatSidenav, NavbarTitleComponent, MatNavList, MatMenuItem, RouterLink, MatIcon, MatSidenavContent, ToolbarComponent, RouterOutlet, AsyncPipe]
})
export class NavComponent implements OnInit {
  isExpanded = false;
  element: HTMLElement;

  public router = inject(Router);
  public route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);
  private firebaseDataService = inject(FirebaseDataService);
  private breakpointObserver = inject(BreakpointObserver);

  isHandset$: Observable<boolean> = this.breakpointObserver
    .observe(Breakpoints.Handset)
    .pipe(map((result) => result.matches));

  ngOnInit() {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(async params => {
      const owner = params.get('owner');
      const project = params.get('project');
      
      if (owner && project) {
        const resolvedId = await this.firebaseDataService.resolveAndSetProject(owner, project);
        if (!resolvedId) {
          // Could redirect to 404 or show banner
          console.error('Project not found');
          // this.router.navigate(['/']); 
        }
      }
    });
  }
}
