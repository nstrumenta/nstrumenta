import { Injectable, signal } from '@angular/core';
import { Auth, User, GoogleAuthProvider, GithubAuthProvider, signInWithPopup, onAuthStateChanged, getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { Firestore, doc, getFirestore, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private auth: Auth;
  private firestore: Firestore;
  private googleProvider: GoogleAuthProvider;
  private githubProvider: GithubAuthProvider;

  // Signals — preferred for components
  readonly currentUser = signal<User | null>(null);
  readonly authResolved = signal(false);
  readonly userStatus = signal<string | null>(null);
  readonly currentUserRole = signal<string | null>(null);

  // Observable aliases — required for guards (CanActivateFn returns Observable)
  private userSubject = new BehaviorSubject<User | null>(null);
  user$ = this.userSubject.asObservable();
  // Keep BehaviorSubject for legacy consumers; guards use toObservable(this.authResolved)
  private authResolvedSubject = new BehaviorSubject<boolean>(false);
  authResolved$ = this.authResolvedSubject.asObservable();
  private userStatusSubject = new BehaviorSubject<string | null>(null);
  userStatus$ = this.userStatusSubject.asObservable();

  // Legacy: some components access .user.getValue() — keep the BehaviorSubject reference
  get user() { return this.userSubject; }

  private userStatusUnsubscribe?: Unsubscribe;

  constructor() {
    this.auth = getAuth();
    this.firestore = getFirestore();
    this.googleProvider = new GoogleAuthProvider();
    this.githubProvider = new GithubAuthProvider();

    onAuthStateChanged(this.auth, (user) => {
      this.currentUser.set(user);
      this.authResolved.set(true);
      this.userSubject.next(user);
      this.authResolvedSubject.next(true);

      if (this.userStatusUnsubscribe) {
        this.userStatusUnsubscribe();
      }

      if (user) {
        const docRef = doc(this.firestore, `users/${user.uid}`);
        this.userStatusUnsubscribe = onSnapshot(docRef, async (snapshot) => {
          const data = snapshot.data();
          if (!snapshot.exists() || !data?.['status']) {
            const idToken = await user.getIdToken();
            fetch('/api/user/init', {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${idToken}` },
            }).catch(err => console.error('Failed to init user:', err));
          } else {
            const status = data?.['status'] || 'pending';
            this.userStatus.set(status);
            this.userStatusSubject.next(status);
            this.currentUserRole.set(data?.['role'] ?? null);
          }
        });
      } else {
        this.userStatus.set(null);
        this.userStatusSubject.next(null);
        this.currentUserRole.set(null);
      }
    });
  }

  setUser(user: User | null) {
    this.userSubject.next(user);
    this.currentUser.set(user);
  }

  async loginWithGoogle(): Promise<void> {
    await signInWithPopup(this.auth, this.googleProvider);
  }

  async loginWithGithub(): Promise<void> {
    await signInWithPopup(this.auth, this.githubProvider);
  }

  async loginWithEmail(email: string, password: string): Promise<void> {
    await signInWithEmailAndPassword(this.auth, email, password);
  }

  async registerWithEmail(email: string, password: string): Promise<void> {
    await createUserWithEmailAndPassword(this.auth, email, password);
  }

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
