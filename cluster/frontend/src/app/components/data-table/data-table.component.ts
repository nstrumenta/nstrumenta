import { SelectionModel } from '@angular/cdk/collections';
import { Component, OnInit, ViewChild, inject, DestroyRef, effect } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { deleteObject, getDownloadURL, getStorage, ref } from 'firebase/storage';
import { map, tap } from 'rxjs/operators';
import { ServerService } from 'src/app/services/server.service';
import { FirebaseDataService } from 'src/app/services/firebase-data.service';
import { environment } from 'src/environments/environment';

@Component({
    selector: 'app-data-table',
    templateUrl: './data-table.component.html',
    styleUrls: ['./data-table.component.scss'],
    standalone: false
})
export class DataTableComponent implements OnInit {
  displayedColumns = ['select', 'name', 'lastModified', 'size', 'actions'];
  dataSource: MatTableDataSource<any>;
  selection = new SelectionModel<any>(true, []);
  projectId: string;
  dataPath: string;
  filterParam: string;

  moduleActions = new Map<string, any>();

  @ViewChild(MatSort, { static: true }) sort: MatSort;

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private serverService = inject(ServerService);
  private destroyRef = inject(DestroyRef);
  private firebaseDataService = inject(FirebaseDataService);
  public dialog = inject(MatDialog);

  constructor() {
    // Set up effect to handle modules changes
    effect(() => {
      const modules = this.firebaseDataService.modules();
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

    // Set up effect to handle data changes
    effect(() => {
      const dataSource = this.firebaseDataService.data();
      const processedData = dataSource.map((item) => {
        if (item.size) {
          item.size = parseInt(item.size);
        }
        return item;
      });
      this.dataSource = new MatTableDataSource(processedData);
      this.dataSource.sort = this.sort;
      this.dataSource.filter = this.filterParam;
    });
  }

  ngOnInit(): void {
    // Subscribe to route changes to set project ID in the Firebase service
    this.route.paramMap.pipe(
      map(paramMap => paramMap.get('projectId')),
      tap(projectId => {
        if (projectId) {
          this.projectId = projectId;
          this.dataPath = `/projects/${projectId}/data`;
          this.moduleActions.clear();
          // Set project in Firebase service to trigger data loading
          this.firebaseDataService.setProject(projectId);
        }
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe();

    // Handle query params for filtering
    this.route.queryParamMap.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((params: ParamMap) => {
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
    const storage = getStorage();
    getDownloadURL(ref(storage, fileDocument.filePath))
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
    const storage = getStorage();

    this.selection.selected.forEach((item) => {
      console.log('deleting', item);
      deleteObject(ref(storage, item.filePath));
      this.firebaseDataService.deleteRecord(this.projectId, item.key);
    });
    this.selection.clear();
  }

  downloadSelected() {
    this.selection.selected.forEach((selectedFile) => {
      this.download(selectedFile);
    });
  }
}
