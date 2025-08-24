import { SelectionModel } from '@angular/cdk/collections';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute } from '@angular/router';
import { FirestoreAdapter } from '@nstrumenta/data-adapter';
import { Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { VmService } from 'src/app/vm.service';

@Component({
  selector: 'app-machines',
  templateUrl: './machines.component.html',
  styleUrls: ['./machines.component.scss'],
})
export class MachinesComponent implements OnInit, OnDestroy {
  displayedColumns = ['select', 'name', 'createdAt', 'status', 'serverStatus', 'downloadURL'];
  dataSource: MatTableDataSource<any>;
  selection = new SelectionModel<any>(true, []);
  dataPath: string;
  subscriptions = new Array<Subscription>();

  @ViewChild(MatSort, { static: true }) sort: MatSort;

  constructor(
    private route: ActivatedRoute,
    private firestoreAdapter: FirestoreAdapter,
    public dialog: MatDialog,
    private vmService: VmService
  ) {}

  ngOnInit() {
    this.dataPath = '/projects/' + this.route.snapshot.paramMap.get('projectId') + '/machines';

    this.subscriptions.push(
      this.firestoreAdapter
        .collection$<any>(this.dataPath)
        .pipe(
          map((items) => {
            return items.map((item) => {
              const { serverStatus, deleted, metadata, status } = item;
              const name = item.id;
              const createdAt = metadata?.creationTimestamp;
              const url = status?.url;
              const currentStatus = deleted
                ? 'Deleted'
                : status?.conditions && status?.conditions[0]?.type;
              return { name, createdAt, url, status: currentStatus, serverStatus };
            });
          })
        )
        .subscribe((dataSource) => {
          this.dataSource = new MatTableDataSource(dataSource);
          this.dataSource.sort = this.sort;
          this.dataSource.sortingDataAccessor = (item, property) => {
            switch (property) {
              case 'date': {
                let newDate = new Date(item.date);
                return newDate;
              }
              default: {
                return item[property];
              }
            }
          };
        })
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
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

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  masterToggle() {
    this.isAllSelected()
      ? this.selection.clear()
      : this.dataSource.data.forEach((row) => this.selection.select(row));
  }

  deleteSelected() {
    this.selection.selected.forEach((item) => {
      console.log('deleting', item);
      this.vmService.deleteDeployedCloudAgent({ instanceId: item.name });
    });
    this.selection.clear();
  }

  createMachine() {
    this.vmService.deployCloudAgent();
  }
}
