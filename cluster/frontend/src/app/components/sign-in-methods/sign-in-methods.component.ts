import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/auth/auth.service';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Subscription } from 'rxjs';
import firebase from 'firebase/compat';
import { MatDialog } from '@angular/material/dialog';
import { AddItemDialogComponent } from '../add-item-dialog/add-item-dialog.component';
import { AddEmailProviderDialogComponent } from '../add-email-provider-dialog/add-email-provider-dialog.component';

@Component({
  selector: 'app-sign-in-methods',
  templateUrl: './sign-in-methods.component.html',
  styleUrls: ['./sign-in-methods.component.scss'],
})
export class SignInMethodsComponent implements OnInit {
  subscriptions = new Array<Subscription>();
  githubProviderInfo: firebase.UserInfo | undefined;
  emailProviderInfo: firebase.UserInfo | undefined;
  isAddingProvider = false;
  user: firebase.User | undefined;

  constructor(public dialog: MatDialog, public authService: AuthService) {
    this.subscriptions.push(
      this.authService.user.subscribe((user) => {
        console.log('providers:', user?.providerData);
        this.emailProviderInfo = user?.providerData?.find(({ providerId }) => providerId === 'password');
        this.githubProviderInfo = user?.providerData?.find(({ providerId }) => providerId === 'github.com');
        this.user = user;
      }),
    );
  }

  validateEmailAndPassword(result): { reason: string } | undefined {
    // TODO: more
    const { email, password, ['password confirm']: confirmPassword } = result;
    console.log({ password, confirmPassword });
    if (password !== confirmPassword) {
      return { reason: 'Passwords mismatched' };
    }
    if (!email) { // ...
      return { reason: 'Invalid email' };
    }
    return;
  }

  async toggleLinkedProvider(provider): Promise<void> {
    console.log(`toggle provider: ${provider}`);
    this.isAddingProvider = true;

    switch (provider) {
      case 'password':
        if (!this.emailProviderInfo) {
          const dialogRef = this.dialog.open(AddItemDialogComponent, {
            data: {
              title: 'Login Info',
              item: {
                email: null,
                password: null,
                'password confirm': null,
              },
            },
          });


          dialogRef.afterClosed().subscribe(async (result) => {
            console.dir(result);
            this.isAddingProvider = false;
            const invalid = this.validateEmailAndPassword(result);
            if (invalid) {
              this.dialog.open(AddEmailProviderDialogComponent, { data: { description: invalid.reason } });
              return;
            }

            // TODO: We should probably have the user confirm their email before just adding it here
            const { email, password } = result;

            try {
              const usercred = await this.authService.linkEmailProvider(email, password);
              console.log('link email success', usercred);
            } catch (error) {
              console.log(error);
              this.dialog.open(AddEmailProviderDialogComponent, { data: { description: error.message } });
            }
          });
        } else {
          try {
            const usercred = await this.authService.unlinkProvider('password');
            console.log(usercred);
          } catch (error) {
            console.log(error);
            this.dialog.open(AddEmailProviderDialogComponent, { data: { description: 'Error unlinking' } });
          }
        }
        break;
      default:
        break;
    }
  }

  ngOnInit(): void {
  }

  ngOnDestroy() {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }

}
