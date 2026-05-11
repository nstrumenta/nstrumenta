import { Component, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { FirebaseDataService } from 'src/app/services/firebase-data.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, DatePipe, MatCardModule, MatListModule],
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
                <mat-list-item>
                  <div class="notification-item">
                    <div class="message">{{ notification.message || notification.type }}</div>
                    <div class="time">{{ notification.createdAt | date: 'medium' }}</div>
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

      .notification-item {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .time {
        font-size: 12px;
        opacity: 0.7;
      }
    `,
  ],
})
export class NotificationsComponent {
  private firebaseDataService = inject(FirebaseDataService);
  notifications = this.firebaseDataService.notifications;
}
