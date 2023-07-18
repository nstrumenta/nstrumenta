import { Component, OnInit, OnChanges } from '@angular/core';
import { ProjectService } from 'src/app/services/project.service';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from 'src/app/auth/auth.service';

@Component({
  selector: 'app-navbar-project-select',
  templateUrl: './navbar-project-select.component.html',
  styleUrls: ['./navbar-project-select.component.scss'],
})
export class NavbarProjectSelectComponent implements OnInit {
  constructor(
    public projectService: ProjectService,
    public authService: AuthService,
    private activatedRoute: ActivatedRoute
  ) {}

  ngOnInit() {
    this.activatedRoute.paramMap.subscribe((paramMap) => {
      const projectId = paramMap.get('projectId');
      if (projectId) {
        this.projectService.setProject(paramMap.get('projectId'));
      }
    });
  }
}
