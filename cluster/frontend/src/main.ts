import { enableProdMode, ErrorHandler, Injectable, importProvidersFrom } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule, SentryErrorHandler } from './app/app.module';
import { environment } from './environments/environment';
import { AppComponent } from './app/app.component';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { ClipboardModule } from '@angular/cdk/clipboard';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSliderModule } from '@angular/material/slider';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSortModule } from '@angular/material/sort';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { AppRoutingModule } from './app/app-routing.module';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatMenuModule } from '@angular/material/menu';
import { FormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { LayoutModule } from '@angular/cdk/layout';
import { withInterceptorsFromDi, provideHttpClient } from '@angular/common/http';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAnimations } from '@angular/platform-browser/animations';
import { BrowserModule, bootstrapApplication } from '@angular/platform-browser';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconRegistry, MatIconModule } from '@angular/material/icon';
import { VscodeService } from './app/services/vscode.service';
import { environment as environment_1 } from 'src/environments/environment';
import { FIREBASE_OPTIONS } from '@angular/fire/compat';
import { AuthService } from './app/auth/auth.service';

declare let process: any;



if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
    providers: [
        importProvidersFrom(BrowserModule, provideFirebaseApp(() => initializeApp(environment.firebase)), provideAuth(() => getAuth()), provideFirestore(() => getFirestore()), LayoutModule, MatToolbarModule, MatButtonModule, MatSidenavModule, MatIconModule, MatListModule, MatFormFieldModule, MatInputModule, MatCardModule, MatDialogModule, MatSelectModule, MatProgressSpinnerModule, FormsModule, MatMenuModule, MatGridListModule, AppRoutingModule, MatTableModule, MatPaginatorModule, MatSortModule, MatTabsModule, MatCheckboxModule, MatSliderModule, MatExpansionModule, MatTooltipModule, MatSnackBarModule, MatProgressSpinnerModule, ClipboardModule, DragDropModule, MatDividerModule, MatProgressBarModule, MatChipsModule),
        AuthService,
        { provide: FIREBASE_OPTIONS, useValue: environment.firebase },
        VscodeService,
        MatIconRegistry,
        MatSnackBar,
        { provide: ErrorHandler, useClass: SentryErrorHandler },
        provideAnimations(),
        provideHttpClient(withInterceptorsFromDi()),
    ]
})
  .catch((err) => console.log(err));
