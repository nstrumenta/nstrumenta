import { SelectionModel } from '@angular/cdk/collections';
import { Component, OnInit, ViewChild } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { MatDialog } from '@angular/material/dialog';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { deleteObject, getDownloadURL, ref, getStorage } from 'firebase/storage';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-data-table',
  templateUrl: './data-table.component.html',
  styleUrls: ['./data-table.component.scss'],
})
export class DataTableComponent implements OnInit {
  displayedColumns = ['select', 'name', 'size', 'tags', 'lastModified', 'actions'];
  dataSource: MatTableDataSource<any>;
  selection = new SelectionModel<any>(true, []);
  dataPath: string;
  filterParam: string;

  @ViewChild(MatSort, { static: true }) sort: MatSort;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private afs: AngularFirestore,
    public dialog: MatDialog
  ) {}

  ngOnInit() {
    this.dataPath = '/projects/' + this.route.snapshot.paramMap.get('projectId') + '/data';
    this.afs
      .collection<any>(this.dataPath)
      .snapshotChanges()
      .pipe(
        map((items) => {
          return items.map((a) => {
            const data = a.payload.doc.data();
            // ensure that data.size is a number
            // uploader puts string into data.size
            data.size = parseInt(data.size);
            const key = a.payload.doc.id;
            return { key: key, ...data };
          });
        })
      )
      .subscribe(async (dataSource) => {
        this.dataSource = new MatTableDataSource(dataSource);
        this.dataSource.sort = this.sort;
        this.dataSource.filter = this.filterParam;
        return;
      });
    this.route.queryParamMap.subscribe((params: ParamMap) => {
      this.filterParam = params.get('filter');
      this.dataSource.filter = this.filterParam;
    });
  }
  applyFilter(filterValue: string) {
    filterValue = filterValue.trim();
    filterValue = filterValue.toLowerCase();
    this.router.navigate([], {
      queryParams: { filter: filterValue },
      queryParamsHandling: 'merge',
    });
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

  deleteSelected() {
    const storage = getStorage();

    this.selection.selected.forEach((item) => {
      console.log('deleting', item);
      deleteObject(ref(storage, item.filePath));
      this.afs.doc(this.dataPath + '/' + item.key).delete();
    });
    this.selection.clear();
  }

  downloadSelected() {
    this.selection.selected.forEach((selectedFile) => {
      this.download(selectedFile);
    });
  }
}
