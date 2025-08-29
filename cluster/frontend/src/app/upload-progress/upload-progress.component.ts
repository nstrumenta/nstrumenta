import { Component, Input } from '@angular/core';
import { Observable } from 'rxjs';

@Component({
    selector: 'app-upload-progress',
    templateUrl: './upload-progress.component.html',
    styleUrls: ['./upload-progress.component.scss'],
    standalone: false
})
export class UploadProgressComponent {
  @Input() uploads: Map<string, { name: string; progress: Observable<number> }>;
}
