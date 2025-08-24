import { BehaviorSubject, Observable } from 'rxjs';
import { AuthAdapter, User } from '../../auth';

export class MockAuthAdapter implements AuthAdapter {
  private user$ = new BehaviorSubject<User | null>(null);

  constructor(initialUser: User | null = null) {
    this.user$.next(initialUser);
  }

  signInWithPopup(provider: any): Promise<User | null> {
    const user: User = {
      uid: 'mock-uid',
      email: 'mock@example.com',
      displayName: 'Mock User',
      photoURL: '',
    };
    this.user$.next(user);
    return Promise.resolve(user);
  }

  signOut(): Promise<void> {
    this.user$.next(null);
    return Promise.resolve();
  }

  getAuthState(): Observable<User | null> {
    return this.user$.asObservable();
  }

  // Helper method for tests
  setUser(user: User | null) {
    this.user$.next(user);
  }
}
