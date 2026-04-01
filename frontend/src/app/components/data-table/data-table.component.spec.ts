import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { FileSizePipe } from 'src/app/pipes/file-size.pipe';
import { DataTableComponent } from './data-table.component';
import { RouterTestingModule } from '@angular/router/testing';
import { FirebaseDataService } from 'src/app/services/firebase-data.service';
import { ApiService } from 'src/app/services/api.service';
import { MockFirebaseDataService, MockAuthService, MockApiService } from 'src/app/testing/mocks';
import { AuthService } from 'src/app/auth/auth.service';

describe('DataTableComponent', () => {
  let component: DataTableComponent;
  let fixture: ComponentFixture<DataTableComponent>;
  let mockApiService: MockApiService;

  beforeEach(async () => {
    mockApiService = new MockApiService();
    await TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        MatSortModule,
        MatTableModule,
        MatFormFieldModule,
        MatIconModule,
        MatDialogModule,
        MatInputModule,
        RouterTestingModule,
        DataTableComponent,
        FileSizePipe,
      ],
      providers: [
        MatDialog,
        { provide: FirebaseDataService, useClass: MockFirebaseDataService },
        { provide: AuthService, useClass: MockAuthService },
        { provide: ApiService, useValue: mockApiService },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DataTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should compile', () => {
    expect(component).toBeTruthy();
  });

  it('download() calls apiService.getDownloadUrl with filePath and projectId', async () => {
    const spy = vi.spyOn(mockApiService, 'getDownloadUrl').mockResolvedValue('https://signed-url');
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    await component.download({ filePath: 'projects/test-project/data/file.mcap', name: 'file.mcap' });

    expect(spy).toHaveBeenCalledWith('projects/test-project/data/file.mcap', 'test-project');
    expect(openSpy).toHaveBeenCalledWith('https://signed-url');
  });

  it('deleteSelected() calls apiService.deleteFile for each selected file', () => {
    const spy = vi.spyOn(mockApiService, 'deleteFile').mockResolvedValue(undefined);
    const file1 = { filePath: 'projects/test-project/data/a.mcap', key: 'key-a', name: 'a.mcap' };
    const file2 = { filePath: 'projects/test-project/data/b.mcap', key: 'key-b', name: 'b.mcap' };

    component.dataSource.data = [file1, file2];
    component.selection.select(file1, file2);
    component.deleteSelected();

    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy).toHaveBeenCalledWith(file1.filePath, file1.key, 'test-project');
    expect(spy).toHaveBeenCalledWith(file2.filePath, file2.key, 'test-project');
    expect(component.selection.isEmpty()).toBe(true);
  });

  it('deleteSelected() skips folder items', () => {
    const spy = vi.spyOn(mockApiService, 'deleteFile').mockResolvedValue(undefined);
    const folder = { name: 'subfolder', isFolder: true as const, path: 'subfolder' };
    component.dataSource.data = [folder];
    component.selection.select(folder);
    component.deleteSelected();

    expect(spy).not.toHaveBeenCalled();
  });
});
