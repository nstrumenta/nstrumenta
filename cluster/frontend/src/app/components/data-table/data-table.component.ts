import { SelectionModel } from '@angular/cdk/collections';
import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { FirestoreAdapter, StorageAdapter } from '@nstrumenta/data-adapter';
import { map } from 'rxjs/operators';
import { ServerService } from 'src/app/services/server.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-data-table',
  templateUrl: './data-table.component.html',
  styleUrls: ['./data-table.component.scss'],
})
export class DataTableComponent implements OnInit {
  displayedColumns = ['select', 'name', 'size', 'lastModified', 'actions'];
  dataSource: MatTableDataSource<any>;
  selection = new SelectionModel<any>(true, []);
  moduleActions: Map<string, { name: string; url?: string }>;
  projectId: string;
  dataPath: string;
  filterParam: string;

  @ViewChild(MatSort, { static: true }) sort: MatSort;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private firestoreAdapter: FirestoreAdapter,
    private storageAdapter: StorageAdapter,
    public dialog: MatDialog,
    private serverService: ServerService
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe((paramMap) => {
      this.projectId = paramMap.get('projectId');
      this.dataPath = '/projects/' + this.projectId + '/data';
      //gather modules for actions
      this.moduleActions = new Map();
      this.firestoreAdapter
        .collection$<any>('/projects/' + this.projectId + '/modules')
        .subscribe((modules) => {
          modules.forEach((module) => {
            console.log(module);
            const { name, url } = module;
            if (url != undefined) {
              this.moduleActions.set(name, { name, url });
            } else {
              this.moduleActions.set(name, { name });
            }
          });
        });
      this.firestoreAdapter
        .collection$<any>(this.dataPath)
        .pipe(
          map((items) => {
            return items.map((data) => {
              // ensure that data.size is a number
              // uploader puts string into data.size
              data.size = parseInt(data.size);
              return data;
            });
          })
        )
        .subscribe(async (dataSource) => {
          this.dataSource = new MatTableDataSource(dataSource);
          this.dataSource.sort = this.sort;
          this.dataSource.filter = this.filterParam;
          return;
        });
    });
    this.route.queryParamMap.subscribe((params: ParamMap) => {
      this.filterParam = params.get('filter');
      if (this.filterParam && this.dataSource) {
        this.dataSource.filter = this.filterParam;
      }
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
    this.storageAdapter
      .getDownloadURL(fileDocument.filePath)
      .then((url) => {
        window.open(url);
      })
      .catch((error) => {
        console.error(error);
      });
  }

  async handleModuleAction(moduleAction, fileDocument) {
    console.log(moduleAction, fileDocument);
    if (moduleAction.url) {
      window.open(
        `${moduleAction.url}?org=${environment.firebase.projectId}&experiment=${fileDocument.filePath}`
      );
    } else {
      function getVersionFromPath(path: string) {
        const match = /(\d+)\.(\d+).(\d+)/.exec(path);
        const version: string = match ? match[0] : '';
        return version;
      }
      const version = getVersionFromPath(moduleAction.name);
      const name = moduleAction.name.split(`-${version}`)[0];

      this.serverService.runServerTask(
        'cloudRun',
        this.projectId,
        {},
        (progress) => {
          console.log('task:' + progress);
        },
        { module: { filePath: moduleAction.name, version, name }, args: [fileDocument.filePath] }
      );
    }
  }

  deleteSelected() {
    this.selection.selected.forEach((item) => {
      console.log('deleting', item);
      this.storageAdapter.deleteObject(item.filePath);
      this.firestoreAdapter.deleteDoc(this.dataPath + '/' + item.id);
    });
    this.selection.clear();
  }

  downloadSelected() {
    this.selection.selected.forEach((selectedFile) => {
      this.download(selectedFile);
    });
  }
}
