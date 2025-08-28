import { SelectionModel } from '@angular/cdk/collections';
import { Component, OnInit, ViewChild } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { MatDialog } from '@angular/material/dialog';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { map } from 'rxjs/operators';
import { AuthService } from '../../auth/auth.service';
import { NewProjectDialogComponent } from '../new-project-dialog/new-project-dialog.component';

export interface Item {
  id: string;
  modified: number;
}

@Component({
  selector: 'app-project-list',
  templateUrl: './project-list.component.html',
  styleUrls: ['./project-list.component.scss'],
})
export class ProjectListComponent implements OnInit {
  displayedColumns = ['id', 'lastOpened'];
  dataSource: MatTableDataSource<any>;
  selection = new SelectionModel<any>(true, []);
  breakpoint: Number;

  @ViewChild(MatSort, { static: false }) sort: MatSort;

  constructor(
    public dialog: MatDialog,
    private afs: AngularFirestore,
    public authService: AuthService
  ) { }

  computeBreakpoint() {
    const ret = Math.max(1, Math.min(4, Math.ceil(window.innerWidth / 400)));
    return ret;
  }

  ngOnInit() {
    this.breakpoint = this.computeBreakpoint();
    this.authService.user.subscribe((user) => {
      if (user) {
        const collection = '/users/' + user.uid + '/projects';
        console.log(collection);
        this.afs.collection<Item>(collection).snapshotChanges().pipe(
          map((items) => {
            return items.map((a) => {
              const data = a.payload.doc.data();
              const id = a.payload.doc.id;
              return { key: id, id: id, ...data };
            });
          })
        )
          .subscribe((data) => {
            this.dataSource = new MatTableDataSource(data);
            this.dataSource.sort = this.sort;
          });
      }
    });
  }

  applyFilter(filterValue: string) {
    filterValue = filterValue.trim();
    filterValue = filterValue.toLowerCase();
    this.dataSource.filter = filterValue;
  }

  newProjectDialog() {
    const dialogRef = this.dialog.open(NewProjectDialogComponent);
  }

  onResize() {
    this.breakpoint = this.computeBreakpoint();
  }

  /** Whether the number of selected elements matches the total number of rows. */
  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  masterToggle() {
    this.isAllSelected()
      ? this.selection.clear()
      : this.dataSource.data.forEach((row) => this.selection.select(row));
  }
}
