import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-add-email-provider',
  templateUrl: './add-email-provider-dialog.component.html',
  styleUrls: ['./add-email-provider-dialog.component.scss']
})
export class AddEmailProviderDialogComponent implements OnInit {
  constructor(private dialogRef: MatDialogRef<boolean>, @Inject(MAT_DIALOG_DATA) public data: any) {}

  ngOnInit(): void {
  }

  close() {
    this.dialogRef.close()
  }
}
