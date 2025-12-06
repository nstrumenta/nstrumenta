import { Component, inject } from '@angular/core';
import { AuthService } from 'src/app/auth/auth.service';
import { AsyncPipe } from '@angular/common';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { CdkCopyToClipboard } from '@angular/cdk/clipboard';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
    selector: 'app-user-profile',
    templateUrl: './user-profile.component.html',
    styleUrls: ['./user-profile.component.scss'],
    imports: [AsyncPipe, MatIconButton, MatIcon, CdkCopyToClipboard]
})
export class UserProfileComponent {
  public authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);

  onCopied(copied: boolean) {
    if (copied) {
      this.snackBar.open('User ID copied to clipboard!', 'Close', {
        duration: 2000,
      });
    }
  }
}
