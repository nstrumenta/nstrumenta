import { Component, Input } from '@angular/core';
import { Observable } from 'rxjs';
import { MatCard, MatCardHeader, MatCardTitle, MatCardContent } from '@angular/material/card';
import { AsyncPipe, DecimalPipe, KeyValuePipe } from '@angular/common';
import { MatList, MatListItem } from '@angular/material/list';
import { MatLabel } from '@angular/material/form-field';
import { MatProgressBar } from '@angular/material/progress-bar';

@Component({
    selector: 'app-upload-progress',
    templateUrl: './upload-progress.component.html',
    styleUrls: ['./upload-progress.component.scss'],
    imports: [MatCard, MatCardHeader, MatCardTitle, MatCardContent, MatList, MatListItem, MatLabel, MatProgressBar, AsyncPipe, DecimalPipe, KeyValuePipe]
})
export class UploadProgressComponent {
  @Input() uploads: Map<string, { name: string; progress: Observable<number> }>;
}
