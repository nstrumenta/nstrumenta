import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { FileSizePipe } from 'src/app/pipes/file-size.pipe';
import { DataTableComponent } from './data-table.component';
import { RouterTestingModule } from '@angular/router/testing';
import { FirebaseDataService } from 'src/app/services/firebase-data.service';
import { MockFirebaseDataService } from 'src/app/testing/mocks';

describe('DataTableComponent', () => {
  let component: DataTableComponent;
  let fixture: ComponentFixture<DataTableComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
    imports: [
        NoopAnimationsModule,
        MatPaginatorModule,
        MatSortModule,
        MatTableModule,
        MatFormFieldModule,
        MatIconModule,
        MatDialogModule,
        MatInputModule,
        RouterTestingModule,
        DataTableComponent, FileSizePipe,
    ],
    providers: [MatDialog, { provide: FirebaseDataService, useClass: MockFirebaseDataService }],
}).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DataTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should compile', () => {
    expect(component).toBeTruthy();
  });
});
