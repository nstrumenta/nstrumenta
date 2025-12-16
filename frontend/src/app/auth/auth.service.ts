import { Injectable } from '@angular/core';
import { Auth, User, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private auth: Auth;
  private googleProvider: GoogleAuthProvider;
  user = new BehaviorSubject<User | null>(null);
  user$: Observable<User | null>;

  constructor() {
    this.auth = getAuth();
    this.googleProvider = new GoogleAuthProvider();
    this.user$ = this.user.asObservable();

    // Listen to auth state changes
    onAuthStateChanged(this.auth, (user) => {
      this.user.next(user);
    });
  }

  setUser(user: User | null) {
    this.user.next(user);
  }

  async loginWithGoogle(): Promise<void> {
    await signInWithPopup(this.auth, this.googleProvider);
  }

  async loginWithEmail(email: string, password: string): Promise<void> {
    await signInWithEmailAndPassword(this.auth, email, password);
  }

  async registerWithEmail(email: string, password: string): Promise<void> {
    await createUserWithEmailAndPassword(this.auth, email, password);
  }

  // Deprecated: use loginWithGoogle instead
  async login(): Promise<void> {
    return this.loginWithGoogle();
  }

  async logout(): Promise<void> {
    await this.auth.signOut();
  }

  getAuth(): Auth {
    return this.auth;
  }
}
