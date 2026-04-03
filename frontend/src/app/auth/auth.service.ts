import { Injectable, inject } from '@angular/core';
import { Auth, User, GoogleAuthProvider, GithubAuthProvider, signInWithPopup, onAuthStateChanged, getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { Firestore, doc, getFirestore, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { BehaviorSubject, Observable, Subscription, of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private auth: Auth;
  private firestore: Firestore;
  private googleProvider: GoogleAuthProvider;
  private githubProvider: GithubAuthProvider;
  
  user = new BehaviorSubject<User | null>(null);
  user$: Observable<User | null>;

  private authResolvedSubject = new BehaviorSubject<boolean>(false);
  authResolved$ = this.authResolvedSubject.asObservable();

  private userStatusSubject = new BehaviorSubject<string | null>(null);
  userStatus$: Observable<string | null> = this.userStatusSubject.asObservable();
  private userStatusUnsubscribe?: Unsubscribe;

  constructor() {
    this.auth = getAuth();
    this.firestore = getFirestore();
    this.googleProvider = new GoogleAuthProvider();
    this.githubProvider = new GithubAuthProvider();
    this.user$ = this.user.asObservable();

    // Listen to auth state changes
    onAuthStateChanged(this.auth, (user) => {
      this.authResolvedSubject.next(true);
      this.user.next(user);
      
      // Cleanup previous subscription if it exists
      if (this.userStatusUnsubscribe) {
        this.userStatusUnsubscribe();
      }
      
      if (user) {
        const docRef = doc(this.firestore, `users/${user.uid}`);
        this.userStatusUnsubscribe = onSnapshot(docRef, async (snapshot) => {
          const data = snapshot.data();
          if (!snapshot.exists() || !data?.['status']) {
            // New or legacy user without status: initialize server-side
            const idToken = await user.getIdToken();
            fetch('/api/user/init', {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${idToken}` },
            }).catch(err => console.error('Failed to init user:', err));
            // snapshot will fire again once the server writes the doc
          } else {
            this.userStatusSubject.next(data?.['status'] || 'pending');
          }
        });
      } else {
        this.userStatusSubject.next(null);
      }
    });
  }

  setUser(user: User | null) {
    this.user.next(user);
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
