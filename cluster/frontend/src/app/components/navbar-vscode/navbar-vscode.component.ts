import { Component, OnInit } from '@angular/core';
import { VscodeService } from 'src/app/services/vscode.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-navbar-vscode',
  templateUrl: './navbar-vscode.component.html',
  styleUrls: ['./navbar-vscode.component.scss'],
})
export class NavbarVscodeComponent {
  constructor(public vscodeService: VscodeService, public snackbar: MatSnackBar) {}
  init() {
    this.vscodeService.init();
    this.vscodeService.message$.subscribe((message) => {
      const snackBarRef = this.snackbar.open(
        'nstrumenta-vscode:' + message.type,
        'Close',
        {
          duration: 2000,
        }
      );
      snackBarRef.afterDismissed().subscribe(() => {});

      snackBarRef.onAction().subscribe(() => {});
    });
  }

  ping() {
    this.vscodeService.send({
      type: 'ping',
      payload: { timestamp: Date.now() },
    });
  }
}
