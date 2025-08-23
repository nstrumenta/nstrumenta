import { ApplicationConfig, ErrorHandler, importProvidersFrom } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { LayoutModule } from '@angular/cdk/layout';
import { ClipboardModule } from '@angular/cdk/clipboard';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { FormsModule } from '@angular/forms';

import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule, MatIconRegistry } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSliderModule } from '@angular/material/slider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';

import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';

import { AppRoutingModule } from './app-routing.module';
import { SentryErrorHandler } from './app.module';
import { AuthService } from './auth/auth.service';
import { VscodeService } from './services/vscode.service';
import { environment } from 'src/environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    // Core and Router
    importProvidersFrom(BrowserModule, AppRoutingModule),
    provideAnimations(),
    provideHttpClient(withInterceptorsFromDi()),

    // Firebase
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),

    // App Services
    AuthService,
    VscodeService,
    MatIconRegistry,
    MatSnackBar,
    { provide: ErrorHandler, useClass: SentryErrorHandler },

    // Import all required Material modules
    importProvidersFrom(
      FormsModule,
      LayoutModule,
      ClipboardModule,
      DragDropModule,
      MatToolbarModule,
      MatButtonModule,
      MatSidenavModule,
      MatIconModule,
      MatListModule,
      MatFormFieldModule,
      MatInputModule,
      MatCardModule,
      MatDialogModule,
      MatSelectModule,
      MatProgressSpinnerModule,
      MatMenuModule,
      MatGridListModule,
      MatTableModule,
      MatPaginatorModule,
      MatSortModule,
      MatTabsModule,
      MatCheckboxModule,
      MatSliderModule,
      MatExpansionModule,
      MatTooltipModule,
      MatSnackBarModule,
      MatDividerModule,
      MatProgressBarModule,
      MatChipsModule
    ),
  ],
};
