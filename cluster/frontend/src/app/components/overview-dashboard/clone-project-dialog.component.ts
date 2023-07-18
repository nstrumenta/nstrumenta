import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-clone-project-dialog',
  templateUrl: './clone-project-dialog.component.html',
  styleUrls: ['./clone-project-dialog.component.scss'],
})
export class CloneProjectDialogComponent implements OnInit {

  constructor(public dialogRef: MatDialogRef<CloneProjectDialogComponent>,
              @Inject(MAT_DIALOG_DATA) public data: { name: string }) {
  }

  ngOnInit(): void {
  }
  
}
