import { Component, ViewChild, OnInit, inject, DestroyRef, effect } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Storage, ref, updateMetadata } from '@angular/fire/storage';
import { MatDialog } from '@angular/material/dialog';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute } from '@angular/router';
import { SelectionModel } from '@angular/cdk/collections';
import { AuthService } from 'src/app/auth/auth.service';
import { FirebaseDataService } from 'src/app/services/firebase-data.service';

@Component({
    selector: 'app-actions',
    templateUrl: './actions.component.html',
    styleUrls: ['./actions.component.scss'],
    standalone: false
})
export class ActionsComponent implements OnInit {
  displayedColumns = ['task', 'status', 'lastModified', 'error'];
  dataSource: MatTableDataSource<any>;
  selection = new SelectionModel<any>(true, []);
  dataPath: string;
  projectId: string;

  @ViewChild(MatSort, { static: true }) sort: MatSort;

  private route = inject(ActivatedRoute);
  private storage = inject(Storage);
  private authService = inject(AuthService);
  private destroyRef = inject(DestroyRef);
  private firebaseDataService = inject(FirebaseDataService);
  public dialog = inject(MatDialog);

  constructor() {
    // Set up effect to handle actions data changes
    effect(() => {
      const actions = this.firebaseDataService.actions();
      this.dataSource = new MatTableDataSource(actions);
      this.dataSource.sort = this.sort;
    });
  }

  ngOnInit() {
    this.projectId = this.route.snapshot.paramMap.get('projectId');
    this.dataPath = '/projects/' + this.projectId + '/actions';
    
    // Subscribe to user auth state and set project when authenticated
    this.authService.user.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((user) => {
      if (user && this.projectId) {
        this.firebaseDataService.setProject(this.projectId);
      }
    });
  }

  ngOnDestroy() {
    // No manual cleanup needed with signals and takeUntilDestroyed
  }

  applyFilter(filterValue: string) {
    filterValue = filterValue.trim();
    filterValue = filterValue.toLowerCase();
    this.dataSource.filter = filterValue;
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

  dropzoneClick() {
    console.log('dropzone click');
  }

  onUploadSuccess(fileDocument: any) {
    // Use Firebase service to update the document
    this.firebaseDataService.updateAction(this.projectId, fileDocument.key, { name: fileDocument.name });
  }

  deleteSelected() {
    this.selection.selected.forEach((item) => {
      console.log('deleting', item);
      this.firebaseDataService.deleteAction(this.projectId, item.key);
    });
    this.selection.clear();
  }
}
