import { enableProdMode, importProvidersFrom, ENVIRONMENT_INITIALIZER, inject, provideZoneChangeDetection } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter, withComponentInputBinding, withRouterConfig } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { ErrorHandler } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
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
    
    if (!environment.production) {
      throw error;
    }
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

fetch('/firebaseConfig.json')
  .then((res) => res.json())
  .then((config) => {
    if (environment.production) {
      enableProdMode();
    }

    // Initialize Firebase
    const app = initializeApp(config);
    getAuth(app);
    getFirestore(app);
    getStorage(app);

    bootstrapApplication(AppComponent, {
      providers: [
        provideZoneChangeDetection(),provideRouter(
          routes,
          withComponentInputBinding(),
          withRouterConfig({
            paramsInheritanceStrategy: 'always',
            onSameUrlNavigation: 'reload'
          })
        ),
        provideHttpClient(withInterceptorsFromDi()),
        importProvidersFrom(BrowserAnimationsModule),
        
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
  });
// Ensure bootstrap errors are visible
// Note: we use console.error so production logging tools and Sentry can capture this consistently
