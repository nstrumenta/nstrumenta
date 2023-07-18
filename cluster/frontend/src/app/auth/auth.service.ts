import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { CanActivate, Router } from '@angular/router';
import firebase from 'firebase/compat/app';
import { BehaviorSubject, Subscription } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService implements CanActivate, OnDestroy {
  user = new BehaviorSubject<firebase.User>(null);
  credential: any;
  redirectUrl: string;
  subscriptions = new Array<Subscription>();

  constructor(public firebaseAuth: AngularFireAuth, public router: Router, private ngZone: NgZone) {
    this.subscriptions.push(
      this.firebaseAuth.authState.subscribe((user) => {
        this.user.next(user);
      })
    );
    this.firebaseAuth.getRedirectResult().then(
      (result) => {
        if (result.user) {
          console.log('getRedirectResult');
          this.credential = result.credential;
        }
      },
      (error) => {
        // The provider's account email, can be used in case of
        // auth/account-exists-with-different-credential to fetch the providers
        // linked to the email:
        const email = error.email;
        // The provider's credential:
        this.credential = error.credential;
        // In case of auth/account-exists-with-different-credential error,
        // you can fetch the providers using this:
        if (error.code === 'auth/account-exists-with-different-credential') {
          this.firebaseAuth.fetchSignInMethodsForEmail(email).then((providers) => {
            console.log(providers);
            // The returned 'providers' is a list of the available providers
            // linked to the email address. Please refer to the guide for a more
            // complete explanation on how to recover from this error.
          });
        }
      }
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }

  loginWithGithub() {
    const provider = new firebase.auth.GithubAuthProvider();
    // You can add additional scopes to the provider:
    provider.addScope('user');
    provider.addScope('repo');
    // Sign in with popup:
    this.firebaseAuth.signInWithPopup(provider);
  }

  async unlinkProvider(providerId: string) {
    const current = await this.firebaseAuth.currentUser;
    return current.unlink(providerId);
  }

  async linkEmailProvider(email: string, password: string) {
    const credential = firebase.auth.EmailAuthProvider.credential(email, password);

    const current = await this.firebaseAuth.currentUser;
    const usercred = current.linkWithCredential(credential);
    console.log({ usercred });
    return usercred;
  }

  logout() {
    this.firebaseAuth.signOut();
    this.user.next(null);
    this.router.navigate(['/login']);
  }

  canActivate() {
    return this.firebaseAuth.authState !== null;
  }
}
