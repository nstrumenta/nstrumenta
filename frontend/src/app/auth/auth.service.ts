import { Injectable } from '@angular/core';
import { Auth, User, GithubAuthProvider, signInWithPopup, onAuthStateChanged, getAuth } from 'firebase/auth';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private auth: Auth;
  private githubProvider: GithubAuthProvider;
  user = new BehaviorSubject<User | null>(null);
  user$: Observable<User | null>;

  constructor() {
    this.auth = getAuth();
    this.githubProvider = new GithubAuthProvider();
    this.user$ = this.user.asObservable();

    // Listen to auth state changes
    onAuthStateChanged(this.auth, (user) => {
      this.user.next(user);
    });
  }

  setUser(user: User | null) {
    this.user.next(user);
  }

  async login(): Promise<void> {
    await signInWithPopup(this.auth, this.githubProvider);
  }

  async logout(): Promise<void> {
    await this.auth.signOut();
  }

  getAuth(): Auth {
    return this.auth;
  }
}
