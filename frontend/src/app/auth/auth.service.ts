import { Injectable, signal } from '@angular/core';
import {
  Auth,
  User,
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  EmailAuthProvider,
  linkWithCredential,
} from 'firebase/auth';
import { Firestore, doc, getFirestore, onSnapshot, Unsubscribe } from 'firebase/firestore';

const EMAIL_LINK_STORAGE_KEY = 'nstrumenta.pendingEmailLinkAddress';

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

  async sendEmailLinkForCurrentUser(email: string): Promise<void> {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      throw new Error('Email is required');
    }

    await sendSignInLinkToEmail(this.auth, normalizedEmail, {
      url: `${window.location.origin}/account/profile?emailLink=1`,
      handleCodeInApp: true,
    });

    window.localStorage.setItem(EMAIL_LINK_STORAGE_KEY, normalizedEmail);
  }

  async sendInvitationEmailLink(email: string, continueUrl: string): Promise<void> {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      throw new Error('Email is required');
    }

    await sendSignInLinkToEmail(this.auth, normalizedEmail, {
      url: continueUrl,
      handleCodeInApp: true,
    });
  }

  hasPendingEmailLinkInUrl(): boolean {
    return isSignInWithEmailLink(this.auth, window.location.href);
  }

  async completePendingEmailLink(emailOverride?: string): Promise<'linked' | 'none'> {
    if (!isSignInWithEmailLink(this.auth, window.location.href)) {
      return 'none';
    }

    const pendingEmail = (window.localStorage.getItem(EMAIL_LINK_STORAGE_KEY) || emailOverride || '').trim().toLowerCase();
    if (!pendingEmail) {
      const error: Error & { code?: string } = new Error('Enter your email address to complete verification.');
      error.code = 'auth/missing-email-for-link';
      throw error;
    }

    const user = this.currentUser();
    if (!user) {
      throw new Error('Sign in first, then open the email link again to link your email.');
    }

    try {
      const credential = EmailAuthProvider.credentialWithLink(pendingEmail, window.location.href);
      await linkWithCredential(user, credential);
      await user.reload();
      this.currentUser.set(this.auth.currentUser);
      window.localStorage.removeItem(EMAIL_LINK_STORAGE_KEY);
      this.clearEmailLinkParams();
      return 'linked';
    } catch (error: any) {
      const code = error?.code ?? '';
      if (code === 'auth/provider-already-linked') {
        window.localStorage.removeItem(EMAIL_LINK_STORAGE_KEY);
        this.clearEmailLinkParams();
        return 'linked';
      }
      if (code === 'auth/credential-already-in-use') {
        throw new Error('This email is already linked to a different account. Sign in with that account instead.');
      }
      throw error;
    }
  }

  async signInWithInvitationEmailLink(email: string): Promise<'signed-in' | 'none'> {
    if (!isSignInWithEmailLink(this.auth, window.location.href)) {
      return 'none';
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      const error: Error & { code?: string } = new Error('Email is required to complete sign-in.');
      error.code = 'auth/missing-email-for-link';
      throw error;
    }

    const result = await signInWithEmailLink(this.auth, normalizedEmail, window.location.href);
    this.currentUser.set(result.user);
    this.clearEmailLinkParams();
    return 'signed-in';
  }

  private clearEmailLinkParams(): void {
    const url = new URL(window.location.href);
    ['apiKey', 'oobCode', 'mode', 'lang', 'continueUrl', 'emailLink'].forEach((name) => {
      url.searchParams.delete(name);
    });
    window.history.replaceState({}, document.title, `${url.pathname}${url.search}${url.hash}`);
  }

  async logout(): Promise<void> {
    await this.auth.signOut();
  }

  getAuth(): Auth {
    return this.auth;
  }
}
