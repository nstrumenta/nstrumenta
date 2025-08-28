import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ProjectService } from 'src/app/services/project.service';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from 'src/app/auth/auth.service';

@Component({
    selector: 'app-navbar-project-select',
    templateUrl: './navbar-project-select.component.html',
    styleUrls: ['./navbar-project-select.component.scss'],
    standalone: false
})
export class NavbarProjectSelectComponent implements OnInit {
  public projectService = inject(ProjectService);
  public authService = inject(AuthService);
  private activatedRoute = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);

  ngOnInit() {
    this.activatedRoute.paramMap.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((paramMap) => {
      const projectId = paramMap.get('projectId');
      if (projectId) {
        this.projectService.setProject(paramMap.get('projectId'));
      }
    });
  }
}
