import { Component, OnInit, inject } from '@angular/core';
import { MatDialogRef, MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose } from '@angular/material/dialog';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { KeyValuePipe, KeyValue } from '@angular/common';
import { MatFormField } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';


@Component({
    selector: 'app-add-item-dialog',
    templateUrl: './add-item-dialog.component.html',
    styleUrls: ['./add-item-dialog.component.css'],
    imports: [MatDialogTitle, CdkScrollable, MatDialogContent, MatFormField, MatInput, FormsModule, MatDialogActions, MatButton, MatDialogClose, KeyValuePipe]
})
export class AddItemDialogComponent implements OnInit {
  data = inject(MAT_DIALOG_DATA);
  private dialogRef = inject<MatDialogRef<AddItemDialogComponent>>(MatDialogRef);

  response: Record<string, unknown> = {};

  close() {
    this.dialogRef.close();
  }

  trackByFn(index: number, item: KeyValue<string, unknown>): string {
    return item.key;
  }

  getFieldType(key: string): string {
    if (key.indexOf("password") > -1) return "password";
    if (key === "email") return "email";
    return "text";
  }

  ngOnInit() {
    this.response = this.data.item;
  }
}
