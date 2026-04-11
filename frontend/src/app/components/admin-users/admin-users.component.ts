import { Component, inject, signal, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTable, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatCellDef, MatCell, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow } from '@angular/material/table';
import { AuthService } from '../../auth/auth.service';
import { ApiService } from '../../services/api.service';

interface PendingUser {
  uid: string;
  email?: string;
  createdAt?: string;
  status: string;
}

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [DatePipe, MatButton, MatIcon, MatTable, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatCellDef, MatCell, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow],
  template: `
    <div class="admin-users-container">
      <h2>Pending Users</h2>
      @if (loading()) {
        <p>Loading...</p>
      } @else if (pendingUsers().length === 0) {
        <p>No pending users.</p>
      } @else {
        <mat-table [dataSource]="pendingUsers()">
          <ng-container matColumnDef="email">
            <mat-header-cell *matHeaderCellDef>Email</mat-header-cell>
            <mat-cell *matCellDef="let user">{{ user.email ?? user.uid }}</mat-cell>
          </ng-container>
          <ng-container matColumnDef="uid">
            <mat-header-cell *matHeaderCellDef>UID</mat-header-cell>
            <mat-cell *matCellDef="let user">{{ user.uid }}</mat-cell>
          </ng-container>
          <ng-container matColumnDef="createdAt">
            <mat-header-cell *matHeaderCellDef>Signed Up</mat-header-cell>
            <mat-cell *matCellDef="let user">{{ user.createdAt | date:'medium' }}</mat-cell>
          </ng-container>
          <ng-container matColumnDef="actions">
            <mat-header-cell *matHeaderCellDef></mat-header-cell>
            <mat-cell *matCellDef="let user">
              <button mat-flat-button (click)="approve(user)" [disabled]="approving()">
                <mat-icon>check</mat-icon> Approve
              </button>
            </mat-cell>
          </ng-container>
          <mat-header-row *matHeaderRowDef="displayedColumns"></mat-header-row>
          <mat-row *matRowDef="let row; columns: displayedColumns;"></mat-row>
        </mat-table>
      }
    </div>
  `,
  styles: [`
    .admin-users-container { padding: 24px; max-width: 900px; }
    mat-cell, mat-header-cell { padding: 0 8px; }
    mat-cell:last-child { justify-content: flex-end; }
  `],
})
export class AdminUsersComponent implements OnInit {
  private authService = inject(AuthService);
  private apiService = inject(ApiService);
  private http = inject(HttpClient);
  private snackBar = inject(MatSnackBar);

  displayedColumns = ['email', 'uid', 'createdAt', 'actions'];
  pendingUsers = signal<PendingUser[]>([]);
  loading = signal(true);
  approving = signal(false);

  async ngOnInit() {
    await this.loadPending();
  }

  private async buildHeaders(): Promise<HttpHeaders> {
    const user = this.authService.currentUser();
    if (!user) throw new Error('Not authenticated');
    const idToken = await user.getIdToken();
    return new HttpHeaders().set('Authorization', `Bearer ${idToken}`);
  }

  async loadPending() {
    this.loading.set(true);
    try {
      const url = await this.apiService.getApiUrl();
      const headers = await this.buildHeaders();
      const result = await firstValueFrom(
        this.http.get<{ users: PendingUser[] }>(`${url}/api/admin/users/pending`, { headers })
      );
      this.pendingUsers.set(result?.users ?? []);
    } catch {
      this.snackBar.open('Failed to load pending users', 'Dismiss', { duration: 4000 });
    } finally {
      this.loading.set(false);
    }
  }

  async approve(user: PendingUser) {
    this.approving.set(true);
    try {
      const url = await this.apiService.getApiUrl();
      const headers = await this.buildHeaders();
      await firstValueFrom(
        this.http.post(`${url}/api/admin/users/approve`, { uid: user.uid }, { headers })
      );
      this.snackBar.open(`Approved ${user.email ?? user.uid}`, undefined, { duration: 3000 });
      this.pendingUsers.update(users => users.filter(u => u.uid !== user.uid));
    } catch {
      this.snackBar.open('Failed to approve user', 'Dismiss', { duration: 4000 });
    } finally {
      this.approving.set(false);
    }
  }
}
