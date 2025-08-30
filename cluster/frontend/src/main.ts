import { enableProdMode, importProvidersFrom, ENVIRONMENT_INITIALIZER, inject } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { ErrorHandler } from '@angular/core';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { getStorage, provideStorage } from '@angular/fire/storage';
import { MatSnackBar } from '@angular/material/snack-bar';

import { AppComponent } from './app/app.component';
import { routes } from './app/app-routing.module';
import { environment } from './environments/environment';
import { AuthService } from './app/auth/auth.service';
import { VscodeService } from './app/services/vscode.service';
import * as Sentry from '@sentry/browser';

// Sentry Error Handler
class SentryErrorHandler implements ErrorHandler {
  handleError(error: unknown): void {
    Sentry.captureException(error);
    console.error(error);
  }
}

// Initialize Material Icons
function initializeIcons() {
  return () => {
    const matIconRegistry = inject(MatIconRegistry);
    const domSanitizer = inject(DomSanitizer);

    matIconRegistry.addSvgIcon(
      'nstrumenta-logo',
      domSanitizer.bypassSecurityTrustResourceUrl('/assets/images/nstrumenta-logo.svg')
    );
    matIconRegistry.addSvgIcon(
      'vscode-logo',
      domSanitizer.bypassSecurityTrustResourceUrl('/assets/images/vscode-logo.svg')
    );
    matIconRegistry.registerFontClassAlias('fontawesome', 'fa');
  };
}

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi()),
    importProvidersFrom(BrowserAnimationsModule),
    
    // Firebase providers
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
    provideStorage(() => getStorage()),
    
    // Services
    AuthService,
    VscodeService,
    MatIconRegistry,
    MatSnackBar,
    
    // Error handler
    { provide: ErrorHandler, useClass: SentryErrorHandler },
    
    // Initialize icons after app bootstrap
    { provide: ENVIRONMENT_INITIALIZER, useFactory: initializeIcons, multi: true },
  ]
}).catch((err) => console.log(err));
