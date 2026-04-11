import { Injectable, signal } from '@angular/core';
import { Auth, User, GoogleAuthProvider, GithubAuthProvider, signInWithPopup, onAuthStateChanged, getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { Firestore, doc, getFirestore, onSnapshot, Unsubscribe } from 'firebase/firestore';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private auth: Auth;
  private firestore: Firestore;
  private googleProvider: GoogleAuthProvider;
  private githubProvider: GithubAuthProvider;

  readonly currentUser = signal<User | null>(null);
  readonly authResolved = signal(false);
  readonly userStatus = signal<string | null>(null);
  readonly currentUserRole = signal<string | null>(null);

  /** Resolves once auth + Firestore have both settled for the initial page load. */
  readonly initialized: Promise<void>;

  private userStatusUnsubscribe?: Unsubscribe;
  private resolveInitialized!: () => void;

  constructor() {
    this.auth = getAuth();
    this.firestore = getFirestore();
    this.googleProvider = new GoogleAuthProvider();
    this.githubProvider = new GithubAuthProvider();

    this.initialized = new Promise<void>(resolve => {
      this.resolveInitialized = resolve;
    });

    onAuthStateChanged(this.auth, (user) => {
      this.currentUser.set(user);
      this.authResolved.set(true);

      if (this.userStatusUnsubscribe) {
        this.userStatusUnsubscribe();
        this.userStatusUnsubscribe = undefined;
      }

      if (!user) {
        this.userStatus.set(null);
        this.currentUserRole.set(null);
        this.resolveInitialized();
        return;
      }

      const docRef = doc(this.firestore, `users/${user.uid}`);
      this.userStatusUnsubscribe = onSnapshot(docRef, async (snapshot) => {
        const data = snapshot.data();
        if (!snapshot.exists() || !data?.['status']) {
          const idToken = await user.getIdToken();
          fetch('/api/user/init', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${idToken}` },
          }).catch(err => console.error('Failed to init user:', err));
          // resolveInitialized will be called on the next snapshot after server creates the doc
        } else {
          const status = data?.['status'] || 'pending';
          this.currentUserRole.set(data?.['role'] ?? null);
          this.userStatus.set(status);
          this.resolveInitialized();
        }
      });
    });
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
