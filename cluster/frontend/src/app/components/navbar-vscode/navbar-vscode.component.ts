import { Component, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { VscodeService } from 'src/app/services/vscode.service';

@Component({
    selector: 'app-navbar-vscode',
    templateUrl: './navbar-vscode.component.html',
    styleUrls: ['./navbar-vscode.component.scss'],
    standalone: false
})
export class NavbarVscodeComponent {
  public vscodeService = inject(VscodeService);
  public snackbar = inject(MatSnackBar);
  init() {
    this.vscodeService.init();
    this.vscodeService.message$.subscribe((message) => {
      const snackBarRef = this.snackbar.open('nstrumenta-vscode:' + message.type, 'Close', {
        duration: 2000,
      });
      // Note: These subscriptions intentionally have no logic
      snackBarRef.afterDismissed().subscribe();
      snackBarRef.onAction().subscribe();
    });
  }

  ping() {
    this.vscodeService.send({
      type: 'ping',
      payload: { timestamp: Date.now() },
    });
  }
}
