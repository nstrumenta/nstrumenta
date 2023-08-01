import { Injectable } from '@angular/core';
import { User } from '@angular/fire/auth/firebase';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  user = new BehaviorSubject<User>(null);

  setUser(user: User) {
    this.user.next(user);
  }
}
