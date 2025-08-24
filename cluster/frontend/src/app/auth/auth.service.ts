import { Injectable } from '@angular/core';
import { Injectable } from '@angular/core';
import { User } from '@nstrumenta/data-adapter';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  user = new BehaviorSubject<User | null>(null);

  setUser(user: User | null) {
    this.user.next(user);
  }
}
