import { SelectionModel } from '@angular/cdk/collections';
import { Component, OnInit, ViewChild, inject, DestroyRef, effect } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { MatSort, MatSortHeader } from '@angular/material/sort';
import { MatTableDataSource, MatTable, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatCellDef, MatCell, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow } from '@angular/material/table';
import { ActivatedRoute, ParamMap, Router, RouterLink } from '@angular/router';
import { deleteObject, getDownloadURL, getStorage, ref } from 'firebase/storage';
import { map, tap } from 'rxjs/operators';
import { ServerService } from 'src/app/services/server.service';
import { FirebaseDataService } from 'src/app/services/firebase-data.service';
import { environment } from 'src/environments/environment';
import { MatFormField } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { DatePipe, KeyValuePipe } from '@angular/common';
import { MatIconButton, MatButton } from '@angular/material/button';
import { MatTooltip } from '@angular/material/tooltip';
import { MatIcon } from '@angular/material/icon';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatMenuTrigger, MatMenu, MatMenuItem } from '@angular/material/menu';
import { FileSizePipe } from 'src/app/pipes/file-size.pipe';
import { DataRecord } from 'src/app/models/firebase.model';

interface ModuleAction {
  name: string;
  url?: string;
}

@Component({
    selector: 'app-data-table',
    templateUrl: './data-table.component.html',
    styleUrls: ['./data-table.component.scss'],
    imports: [MatFormField, MatInput, MatIconButton, MatTooltip, MatIcon, MatTable, MatSort, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatCheckbox, MatCellDef, MatCell, MatSortHeader, MatButton, RouterLink, MatMenuTrigger, MatMenu, MatMenuItem, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow, DatePipe, KeyValuePipe, FileSizePipe]
})
export class DataTableComponent implements OnInit {
  displayedColumns = ['select', 'name', 'lastModified', 'size', 'actions'];
  dataSource: MatTableDataSource<DataRecord>;
  selection = new SelectionModel<DataRecord>(true, []);
  projectId: string;
  dataPath: string;
  filterParam: string;

  moduleActions = new Map<string, ModuleAction>();

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
          this.moduleActions.set(name as string, { name: name as string, url: url as string });
        } else {
          this.moduleActions.set(name as string, { name: name as string });
        }
      });
    });

    // Set up effect to handle data changes
    effect(() => {
      const dataSource = this.firebaseDataService.data();
      const processedData = dataSource.map((item) => {
        if (item.size) {
          item.size = typeof item.size === 'string' ? parseInt(item.size) : item.size;
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
    if (this.isAllSelected()) {
      this.selection.clear();
    } else {
      this.dataSource.data.forEach((row) => this.selection.select(row));
    }
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
