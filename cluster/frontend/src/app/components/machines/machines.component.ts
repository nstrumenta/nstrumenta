import { SelectionModel } from '@angular/cdk/collections';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { MatDialog } from '@angular/material/dialog';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from 'src/app/auth/auth.service';
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
    private afs: AngularFirestore,
    private storage: AngularFireStorage,
    private authService: AuthService,
    public dialog: MatDialog,
    private vmService: VmService
  ) {}

  ngOnInit() {
    this.dataPath = '/projects/' + this.route.snapshot.paramMap.get('projectId') + '/machines';
    this.subscriptions.push(
      this.authService.user.subscribe((user) => {
        this.subscriptions.push(
          this.afs
            .collection<any>(this.dataPath)
            .snapshotChanges()
            .pipe(
              map((items) => {
                return items.map((a) => {
                  const data = a.payload.doc.data();
                  const key = a.payload.doc.id;
                  return { key: key, ...data };
                });
              })
            )
            .subscribe((data) => {
              this.dataSource = new MatTableDataSource(data);
              this.dataSource.sort = this.sort;
            })
        );
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

  stopSelected() {
    this.selection.selected.forEach((item) => {
      console.log('stopping', item);
      this.vmService.stopDeployedHostedVM({ hostInstanceMachineId: item.key });
    });
    this.selection.clear();
  }

  deleteSelected() {
    this.selection.selected.forEach((item) => {
      console.log('deleting', item);
      this.vmService.deleteDeployedHostedVM({ hostInstanceMachineId: item.key });
    });
    this.selection.clear();
  }

  createMachine(machineType: 'e2-micro' | 'n1-standard-1') {
    this.vmService.deployHostedVM(machineType);
  }
}
