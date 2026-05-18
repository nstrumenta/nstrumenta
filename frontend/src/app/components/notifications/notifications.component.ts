import { Component, effect, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { FirebaseDataService } from 'src/app/services/firebase-data.service';
import { ApiService } from 'src/app/services/api.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, DatePipe, MatCardModule, MatListModule, MatButtonModule],
  template: `
    <div class="notifications-page">
      <mat-card>
        <mat-card-title>Notifications</mat-card-title>
        <mat-card-content>
          @if (notifications().length === 0) {
            <p>No notifications yet.</p>
          } @else {
            <mat-list>
              @for (notification of notifications(); track notification.id ?? $index) {
                <mat-list-item class="notification-list-item">
                  <div class="notification-item" [class.unread]="!notification.read">
                    <div class="message">{{ notification.message || notification.type }}</div>
                    <div class="time">{{ notification.createdAt | date: 'medium' }}</div>
                    @if (notification.type === 'project_invitation_pending') {
                      <div class="actions">
                        <button mat-flat-button color="primary" [disabled]="actionLoading" (click)="acceptInvite(notification)">Accept</button>
                        <button mat-button color="warn" [disabled]="actionLoading" (click)="declineInvite(notification)">Decline</button>
                      </div>
                    }
                  </div>
                </mat-list-item>
              }
            </mat-list>
          }
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [
    `
      .notifications-page {
        padding: 16px;
      }

      .notification-list-item {
        height: auto !important;
        padding-top: 8px;
        padding-bottom: 8px;
      }

      .notification-item {
        display: flex;
        flex-direction: column;
        gap: 4px;
        opacity: 0.8;
      }

      .notification-item.unread {
        opacity: 1;
        font-weight: 500;
      }

      .time {
        font-size: 12px;
        opacity: 0.7;
        font-weight: 400;
      }

      .actions {
        display: flex;
        gap: 8px;
        margin-top: 8px;
      }
    `,
  ],
})
export class NotificationsComponent {
  private firebaseDataService = inject(FirebaseDataService);
  private apiService = inject(ApiService);
  notifications = this.firebaseDataService.notifications;
  actionLoading = false;

  constructor() {
    // Mark non-actionable notifications as read when the page is opened.
    // Pending invitations are only marked read when the user explicitly acts on them.
    effect(() => {
      const list = this.notifications();
      const informational = list.filter(n => !n['read'] && n.id && n['type'] !== 'project_invitation_pending');
      for (const n of informational) {
        this.apiService.markNotificationRead(n.id).catch(console.error);
      }
    });
  }

  async acceptInvite(notification: any) {
    if (!notification.invitationId || !notification.projectId) return;
    const [orgId, projectId] = notification.projectId.split('/');
    this.actionLoading = true;
    try {
      await this.apiService.acceptProjectInvitation({
        orgId,
        projectId,
        invitationId: notification.invitationId,
      });
      this.firebaseDataService.refreshUserProjects();
    } catch (err) {
      console.error('Failed to accept invite:', err);
      alert('Failed to accept: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      this.actionLoading = false;
    }
  }

  async declineInvite(notification: any) {
    if (!notification.id) return;
    this.actionLoading = true;
    try {
      await this.apiService.deleteNotification(notification.id);
    } catch (err) {
      console.error('Failed to decline invite:', err);
    } finally {
      this.actionLoading = false;
    }
  }
}
