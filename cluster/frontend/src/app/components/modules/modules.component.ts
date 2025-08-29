import { SelectionModel } from '@angular/cdk/collections';
import { Component, OnInit, ViewChild, inject, DestroyRef, effect } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { MatSort, MatSortHeader } from '@angular/material/sort';
import { MatTableDataSource, MatTable, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatCellDef, MatCell, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow } from '@angular/material/table';
import { ActivatedRoute } from '@angular/router';
import { deleteObject, getDownloadURL, getStorage, ref } from 'firebase/storage';
import { AuthService } from 'src/app/auth/auth.service';
import { FirebaseDataService } from 'src/app/services/firebase-data.service';
import { MatFormField } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { DatePipe } from '@angular/common';
import { MatIconButton } from '@angular/material/button';
import { MatTooltip } from '@angular/material/tooltip';
import { MatIcon } from '@angular/material/icon';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatMenuItem } from '@angular/material/menu';

@Component({
    selector: 'app-modules',
    templateUrl: './modules.component.html',
    styleUrls: ['./modules.component.scss'],
    imports: [MatFormField, MatInput, MatIconButton, MatTooltip, MatIcon, MatTable, MatSort, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatCheckbox, MatCellDef, MatCell, MatSortHeader, MatMenuItem, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow, DatePipe]
})
export class ModulesComponent implements OnInit {
  displayedColumns = ['select', 'id', 'url', 'modified'];
  dataSource: MatTableDataSource<any>;
  selection = new SelectionModel<any>(true, []);
  dataPath: string;
  projectId: string;

  @ViewChild(MatSort, { static: true }) sort: MatSort;

  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);
  private destroyRef = inject(DestroyRef);
  private firebaseDataService = inject(FirebaseDataService);
  public dialog = inject(MatDialog);

  constructor() {
    // Set up effect to handle modules data changes
    effect(() => {
      const modules = this.firebaseDataService.modules();
      this.dataSource = new MatTableDataSource(modules);
      this.dataSource.sort = this.sort;
    });
  }

  ngOnInit() {
    this.projectId = this.route.snapshot.paramMap.get('projectId');
    this.dataPath = `/projects/${this.projectId}/modules`;
    
    // Subscribe to user auth state and set project when authenticated
    this.authService.user.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((user) => {
      if (user && this.projectId) {
        this.firebaseDataService.setProject(this.projectId);
      }
    });
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

  deleteSelected() {
    const storage = getStorage();

    this.selection.selected.forEach((item) => {
      console.log('deleting', item);
      deleteObject(ref(storage, item.filePath));
      this.firebaseDataService.deleteModule(this.projectId, item.id);
    });
    this.selection.clear();
  }

  downloadSelected() {
    this.selection.selected.forEach((selectedFile) => {
      this.download(selectedFile);
    });
  }

  download(fileDocument) {
    console.log('download', fileDocument.name);
    const storage = getStorage();
    getDownloadURL(ref(storage, fileDocument.filePath))
      .then((url) => {
        window.open(url);
      })
      .catch((error) => {
        console.error(error);
      });
  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  masterToggle() {
    this.isAllSelected()
      ? this.selection.clear()
      : this.dataSource.data.forEach((row) => this.selection.select(row));
  }
}
