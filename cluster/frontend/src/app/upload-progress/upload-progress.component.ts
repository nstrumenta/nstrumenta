import { Component, Input, OnInit } from '@angular/core';
import { Observable } from 'rxjs';

@Component({
    selector: 'app-upload-progress',
    templateUrl: './upload-progress.component.html',
    styleUrls: ['./upload-progress.component.scss'],
    standalone: false
})
export class UploadProgressComponent implements OnInit {
  @Input() uploads: Map<string, { name: string; progress: Observable<number> }>;

  constructor() {}

  ngOnInit(): void {}

  ngOnDestroy(): void {}
}
