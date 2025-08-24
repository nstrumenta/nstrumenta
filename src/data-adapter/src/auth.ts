import { Observable } from 'rxjs';

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export interface AuthAdapter {
  signInWithPopup(provider: any): Promise<User | null>;
  signOut(): Promise<void>;
  getAuthState(): Observable<User | null>;
}
