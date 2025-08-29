import { Component, OnInit, inject } from '@angular/core';
import { AuthService } from 'src/app/auth/auth.service';

@Component({
    selector: 'app-user-profile',
    templateUrl: './user-profile.component.html',
    styleUrls: ['./user-profile.component.scss'],
    standalone: false
})
export class UserProfileComponent implements OnInit {
  public authService = inject(AuthService);

  ngOnInit(): void {
    // Component initialization
  }
}
