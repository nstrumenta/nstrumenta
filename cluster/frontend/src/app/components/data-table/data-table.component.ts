import { SelectionModel } from '@angular/cdk/collections';
import { Component, OnInit, ViewChild, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Firestore, collection, collectionData, doc, deleteDoc } from '@angular/fire/firestore';
import { MatDialog } from '@angular/material/dialog';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { deleteObject, getDownloadURL, getStorage, ref } from 'firebase/storage';
import { map, switchMap, tap } from 'rxjs/operators';
import { combineLatest, of } from 'rxjs';
import { ServerService } from 'src/app/services/server.service';
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
  private firestore = inject(Firestore);
  private serverService = inject(ServerService);
  private destroyRef = inject(DestroyRef);
  public dialog = inject(MatDialog);

  ngOnInit() {
    // Create reactive stream that switches Firebase observables based on route changes
    // This ensures Firebase calls happen in the outer observable chain, maintaining injection context
    const projectId$ = this.route.paramMap.pipe(
      map(paramMap => paramMap.get('projectId')),
      tap(projectId => {
        if (projectId) {
          this.projectId = projectId;
          this.dataPath = `/projects/${projectId}/data`;
          this.moduleActions.clear();
        }
      }),
      takeUntilDestroyed(this.destroyRef)
    );

    // Create modules observable that switches when project changes
    const modules$ = projectId$.pipe(
      switchMap(projectId => {
        if (!projectId) return of([]);
        // Firebase calls happen here in the main observable chain - injection context maintained
        const modulesCollection = collection(this.firestore, `/projects/${projectId}/modules`);
        return collectionData(modulesCollection, { idField: 'id' });
      })
    );

    // Create data observable that switches when project changes
    const data$ = projectId$.pipe(
      switchMap(projectId => {
        if (!projectId) return of([]);
        // Firebase calls happen here in the main observable chain - injection context maintained
        const dataCollection = collection(this.firestore, `/projects/${projectId}/data`);
        return collectionData(dataCollection, { idField: 'key' });
      })
    );

    // Subscribe to modules changes
    modules$.subscribe((modules: any[]) => {
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

    // Subscribe to data changes
    data$.subscribe((dataSource: any[]) => {
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
      const docRef = doc(this.firestore, this.dataPath + '/' + item.key);
      deleteDoc(docRef);
    });
    this.selection.clear();
  }

  downloadSelected() {
    this.selection.selected.forEach((selectedFile) => {
      this.download(selectedFile);
    });
  }
}
