import { SelectionModel } from '@angular/cdk/collections';
import { Component, OnInit, ViewChild, inject, DestroyRef, effect } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { MatSort, MatSortHeader } from '@angular/material/sort';
import { MatTableDataSource, MatTable, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatCellDef, MatCell, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow } from '@angular/material/table';
import { ActivatedRoute, ParamMap, Router, RouterLink } from '@angular/router';
import { deleteObject, getDownloadURL, ref } from 'firebase/storage';
import { map, tap } from 'rxjs/operators';
import { ServerService } from 'src/app/services/server.service';
import { FirebaseDataService } from 'src/app/services/firebase-data.service';
import { FolderNavigationService } from 'src/app/services/folder-navigation.service';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { DatePipe, KeyValuePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
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

interface FolderItem {
  name: string;
  isFolder: true;
  path: string;
  size?: number;
  lastModified?: number;
}

type TableItem = DataRecord | FolderItem;

function isFolderItem(item: TableItem): item is FolderItem {
  return 'isFolder' in item && item.isFolder === true;
}

@Component({
    selector: 'app-data-table',
    templateUrl: './data-table.component.html',
    styleUrls: ['./data-table.component.scss'],
    imports: [MatFormField, MatLabel, MatInput, MatIconButton, MatTooltip, MatIcon, MatTable, MatSort, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatCheckbox, MatCellDef, MatCell, MatSortHeader, MatButton, RouterLink, MatMenuTrigger, MatMenu, MatMenuItem, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow, DatePipe, KeyValuePipe, FileSizePipe, FormsModule]
})
export class DataTableComponent implements OnInit {
  displayedColumns = ['select', 'name', 'lastModified', 'size', 'actions'];
  dataSource: MatTableDataSource<TableItem>;
  selection = new SelectionModel<TableItem>(true, []);
  projectId: string;
  dataPath: string;
  filterParam: string;
  newFolderName = '';

  moduleActions = new Map<string, ModuleAction>();

  @ViewChild(MatSort, { static: true }) sort: MatSort;

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private serverService = inject(ServerService);
  private destroyRef = inject(DestroyRef);
  private firebaseDataService = inject(FirebaseDataService);
  folderNav = inject(FolderNavigationService);
  public dialog = inject(MatDialog);

  constructor() {
    // Set up effect to handle modules changes
    effect(() => {
      const modules = this.firebaseDataService.modules();
      modules.forEach((module) => {
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
      const allData = this.firebaseDataService.data();
      const currentFolder = this.folderNav.currentFolder();
      const isFlatView = this.folderNav.flatView();
      
      // Helper function to extract folder from filePath
      // filePath format: projects/{projectId}/data/{folder}/{filename}
      // We want just the {folder} part, which matches dirname
      const getFolderFromPath = (filePath: string): string => {
        if (!filePath) return '';
        
        // Find everything after "data/" and before the last "/"
        const dataIndex = filePath.indexOf('/data/');
        if (dataIndex === -1) return '';
        
        const pathAfterData = filePath.substring(dataIndex + 6); // +6 for "/data/"
        const lastSlashIndex = pathAfterData.lastIndexOf('/');
        
        if (lastSlashIndex === -1) {
          // File is at root (no folder)
          return '';
        }
        
        // Return the folder path (everything before the last slash)
        return pathAfterData.substring(0, lastSlashIndex);
      };
      
      // Helper function to extract relative path from filePath (without projects/{projectId}/data prefix)
      const getRelativePath = (filePath: string): string => {
        if (!filePath) return '';
        const dataIndex = filePath.indexOf('/data/');
        if (dataIndex === -1) return filePath;
        return filePath.substring(dataIndex + 6); // +6 for "/data/"
      };
      
      let filesInCurrentFolder: DataRecord[];
      let folderItems: FolderItem[] = [];
      
      if (isFlatView) {
        // Flat view: show all files, no folders
        filesInCurrentFolder = allData.map(item => ({
          ...item,
          // Replace name with relative path for flat view
          displayName: getRelativePath(item.filePath || '') || item.name
        }));
      } else {
        // Hierarchical view: filter by current folder and show subfolders
        // Filter files by current folder
        filesInCurrentFolder = allData.filter(item => {
          // Use dirname if available, otherwise extract from filePath
          const itemFolder = item.dirname !== undefined ? item.dirname : getFolderFromPath(item.filePath || '');
          return itemFolder === currentFolder;
        });
      
        // Find immediate subfolders in current folder
        const subfolders = new Map<string, DataRecord[]>();
        allData.forEach(item => {
        const itemFolder = item.dirname !== undefined ? item.dirname : getFolderFromPath(item.filePath || '');
        
        // Check if this item is in a subfolder of current folder
        if (currentFolder) {
          // Item should start with current folder path
          if (itemFolder.startsWith(currentFolder + '/')) {
            const relativePath = itemFolder.substring(currentFolder.length + 1);
            const firstSegment = relativePath.split('/')[0];
            if (firstSegment) {
              if (!subfolders.has(firstSegment)) {
                subfolders.set(firstSegment, []);
              }
              subfolders.get(firstSegment)!.push(item);
            }
          }
        } else {
          // At root, show top-level folders
          const firstSegment = itemFolder.split('/')[0];
          if (firstSegment) {
            if (!subfolders.has(firstSegment)) {
              subfolders.set(firstSegment, []);
            }
            subfolders.get(firstSegment)!.push(item);
          }
        }
      });
      
        // Create folder items with aggregated size and latest lastModified
        folderItems = Array.from(subfolders.entries()).map(([folderName, files]) => {
          // Sum up the sizes of all files in this folder (and subfolders)
          const totalSize = files.reduce((sum, file) => {
            const fileSize = typeof file.size === 'string' ? parseInt(file.size) : (file.size || 0);
            return sum + fileSize;
          }, 0);
          
          // Find the latest lastModified timestamp
          const latestModified = files.reduce((latest, file) => {
            const fileModified = file.lastModified || 0;
            return Math.max(latest, fileModified);
          }, 0);
          
          return {
            name: folderName,
            isFolder: true,
            path: currentFolder ? `${currentFolder}/${folderName}` : folderName,
            size: totalSize,
            lastModified: latestModified
          };
        });
      }
      
      // Process file data
      const processedFiles = filesInCurrentFolder.map((item) => {
        if (item.size) {
          item.size = typeof item.size === 'string' ? parseInt(item.size) : item.size;
        }
        return item;
      });
      
      // Sort folders alphabetically
      folderItems.sort((a, b) => a.name.localeCompare(b.name));
      
      // Sort files by name (default)
      processedFiles.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      
      // Combine folders first, then files
      const combinedData: TableItem[] = [...folderItems, ...processedFiles];
      
      this.dataSource = new MatTableDataSource(combinedData);
      this.dataSource.filter = this.filterParam;
      
      // Custom comparator to always keep folders above files
      this.dataSource.sortData = (data: TableItem[], sort: MatSort): TableItem[] => {
        const active = sort.active;
        const direction = sort.direction;
        
        if (!active || direction === '') {
          return data;
        }
        
        return data.sort((a, b) => {
          // Always keep folders above files
          const aIsFolder = isFolderItem(a);
          const bIsFolder = isFolderItem(b);
          
          if (aIsFolder && !bIsFolder) return -1;
          if (!aIsFolder && bIsFolder) return 1;
          
          // Both are same type, sort by the active column
          let aValue: string | number;
          let bValue: string | number;
          
          if (aIsFolder && bIsFolder) {
            // Both folders - can sort by any column now
            const aFolder = a as FolderItem;
            const bFolder = b as FolderItem;
            
            switch (active) {
              case 'name':
                aValue = aFolder.name.toLowerCase();
                bValue = bFolder.name.toLowerCase();
                break;
              case 'size':
                aValue = aFolder.size || 0;
                bValue = bFolder.size || 0;
                break;
              case 'lastModified':
                aValue = aFolder.lastModified || 0;
                bValue = bFolder.lastModified || 0;
                break;
              default:
                return 0;
            }
          } else {
            // Both files - sort by active column
            // TypeScript knows a and b are DataRecord here
            const aFile = a as DataRecord;
            const bFile = b as DataRecord;
            
            switch (active) {
              case 'name':
                aValue = (aFile.name || '').toLowerCase();
                bValue = (bFile.name || '').toLowerCase();
                break;
              case 'size':
                aValue = aFile.size || 0;
                bValue = bFile.size || 0;
                break;
              case 'lastModified':
                aValue = aFile.lastModified || 0;
                bValue = bFile.lastModified || 0;
                break;
              default:
                return 0;
            }
          }
          
          // Compare values
          let result = 0;
          if (aValue < bValue) result = -1;
          else if (aValue > bValue) result = 1;
          
          return direction === 'asc' ? result : -result;
        });
      };
      
      // Assign sort and trigger it to ensure folders stay on top
      this.dataSource.sort = this.sort;
      if (this.sort && this.sort.active) {
        // Re-trigger the sort to apply our custom sortData function
        this.dataSource.data = this.dataSource.sortData(this.dataSource.data, this.sort);
      }
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
      if (this.dataSource) {
        this.dataSource.filter = this.filterParam || '';
      }
    });
  }
  applyFilter(filterValue: string) {
    filterValue = filterValue.trim();
    filterValue = filterValue.toLowerCase();
    this.router.navigate([], {
      queryParams: { filter: filterValue || null },
      queryParamsHandling: 'merge',
    });
  }

  /** Whether the number of selected elements matches the total number of rows. */
  isAllSelected() {
    const numSelected = this.selection.selected.length;
    // Only count files, not folders
    const numFiles = this.dataSource.data.filter(item => !isFolderItem(item)).length;
    return numSelected === numFiles && numFiles > 0;
  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  masterToggle() {
    if (this.isAllSelected()) {
      this.selection.clear();
    } else {
      // Only select files, not folders
      this.dataSource.data.forEach((row) => {
        if (!isFolderItem(row)) {
          this.selection.select(row);
        }
      });
    }
  }

  download(fileDocument) {
    console.log('download', fileDocument.name);
  const storage = this.firebaseDataService.getStorage();
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
      const config = await fetch('/firebaseConfig.json').then(res => res.json());
      window.open(
        `${moduleAction.url}?org=${config.projectId}&experiment=${fileDocument.filePath}`
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
  const storage = this.firebaseDataService.getStorage();

    this.selection.selected.forEach((item) => {
      // Only delete files, not folders
      if (!isFolderItem(item)) {
        console.log('deleting', item);
        deleteObject(ref(storage, item.filePath));
        this.firebaseDataService.deleteRecord(this.projectId, item.key);
      }
    });
    this.selection.clear();
  }

  downloadSelected() {
    this.selection.selected.forEach((selectedItem) => {
      // Only download files, not folders
      if (!isFolderItem(selectedItem)) {
        this.download(selectedItem);
      }
    });
  }

  navigateToFolder(folderPath: string) {
    this.folderNav.navigateToFolder(folderPath);
  }

  isFolder(item: TableItem): boolean {
    return isFolderItem(item);
  }

  setFolder() {
    if (this.newFolderName) {
      this.folderNav.setFolder(this.newFolderName);
      this.newFolderName = '';
    }
  }

  createFolder() {
    const folderName = this.newFolderName.trim();
    if (!folderName) return;
    
    const currentFolder = this.folderNav.currentFolder();
    const newFolderPath = currentFolder ? `${currentFolder}/${folderName}` : folderName;
    
    this.folderNav.navigateToFolder(newFolderPath);
    this.newFolderName = '';
  }
}
