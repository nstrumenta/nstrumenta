import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Inject } from '@angular/core';

@Component({
    selector: 'app-add-item-dialog',
    templateUrl: './add-item-dialog.component.html',
    styleUrls: ['./add-item-dialog.component.css'],
    standalone: false
})
export class AddItemDialogComponent implements OnInit {
  response: any = {};

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<AddItemDialogComponent>
  ) {}

  close() {
    this.dialogRef.close();
  }

  trackByFn(index: any) {
    return index;
  }

  ngOnInit() {
    this.response = this.data.item;
  }
}
