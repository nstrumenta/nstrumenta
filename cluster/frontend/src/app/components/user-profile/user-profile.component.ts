import { Component, inject } from '@angular/core';
import { AuthService } from 'src/app/auth/auth.service';
import { MatList, MatListItem } from '@angular/material/list';
import { AsyncPipe } from '@angular/common';

@Component({
    selector: 'app-user-profile',
    templateUrl: './user-profile.component.html',
    styleUrls: ['./user-profile.component.scss'],
    imports: [MatList, MatListItem, AsyncPipe]
})
export class UserProfileComponent {
  public authService = inject(AuthService);
}
