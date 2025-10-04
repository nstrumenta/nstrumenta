import { Component, inject } from '@angular/core';
import { UploadService } from '../services/upload.service';
import { MatCard, MatCardHeader, MatCardTitle, MatCardContent } from '@angular/material/card';
import { DecimalPipe } from '@angular/common';
import { MatProgressBar } from '@angular/material/progress-bar';
import { MatChip } from '@angular/material/chips';

@Component({
    selector: 'app-upload-progress',
    templateUrl: './upload-progress.component.html',
    styleUrls: ['./upload-progress.component.scss'],
    imports: [MatCard, MatCardHeader, MatCardTitle, MatCardContent, MatProgressBar, MatChip, DecimalPipe]
})
export class UploadProgressComponent {
  uploadService = inject(UploadService);
}
