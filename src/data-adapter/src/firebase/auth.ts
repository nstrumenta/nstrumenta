import { Auth, signInWithPopup, GithubAuthProvider } from '@angular/fire/auth';
import { user, User as FirebaseUser } from '@angular/fire/auth';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthAdapter, User } from '../../auth';

export class FirebaseAuthAdapter implements AuthAdapter {
  constructor(private auth: Auth) {}

  signInWithPopup(provider: any): Promise<User | null> {
    // for now, we only support github
    return signInWithPopup(this.auth, new GithubAuthProvider()).then(({ user }) => this.mapUser(user));
  }

  signOut(): Promise<void> {
    return this.auth.signOut();
  }

  getAuthState(): Observable<User | null> {
    return user(this.auth).pipe(map(this.mapUser));
  }

  private mapUser(user: FirebaseUser | null): User | null {
    if (!user) {
      return null;
    }
    const { uid, email, displayName, photoURL } = user;
    return { uid, email, displayName, photoURL };
  }
}
