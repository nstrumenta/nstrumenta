import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-accept-invite',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule],
  template: `
    <div class="accept-invite-page">
      <mat-card>
        <mat-card-title>Project Invitation</mat-card-title>
        <mat-card-content>
          <p>{{ statusMessage }}</p>
        </mat-card-content>
        <mat-card-actions>
          <button mat-flat-button (click)="goHome()">Go Home</button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [
    `
      .accept-invite-page {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 60vh;
        padding: 24px;
      }
    `,
  ],
})
export class AcceptInviteComponent {
  private route = inject(ActivatedRoute);
  private apiService = inject(ApiService);
  private router = inject(Router);

  statusMessage = 'Accepting invitation...';

  constructor() {
    const orgId = this.route.snapshot.queryParamMap.get('orgId');
    const projectId = this.route.snapshot.queryParamMap.get('projectId');
    const invitationId = this.route.snapshot.queryParamMap.get('invitationId');

    if (!orgId || !projectId || !invitationId) {
      this.statusMessage = 'Missing invitation parameters.';
      return;
    }

    this.apiService.acceptProjectInvitation({ orgId, projectId, invitationId })
      .then(() => {
        this.statusMessage = 'Invitation accepted. Redirecting to project settings...';
        return this.router.navigate(['/', orgId, projectId, 'settings']);
      })
      .catch(() => {
        this.statusMessage = 'Failed to accept invitation. Please try again.';
      });
  }

  goHome() {
    this.router.navigate(['/']).catch(console.error);
  }
}
