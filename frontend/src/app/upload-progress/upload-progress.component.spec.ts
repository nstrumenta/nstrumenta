import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UploadProgressComponent } from './upload-progress.component';
import { UploadService } from '../services/upload.service';
import { MockUploadService } from '../testing/mocks';

describe('UploadProgressComponent', () => {
  let component: UploadProgressComponent;
  let fixture: ComponentFixture<UploadProgressComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [UploadProgressComponent],
    providers: [{ provide: UploadService, useClass: MockUploadService }]
})
    .compileComponents();

    fixture = TestBed.createComponent(UploadProgressComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
