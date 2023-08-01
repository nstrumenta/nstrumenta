import { ClipboardModule } from '@angular/cdk/clipboard';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { LayoutModule } from '@angular/cdk/layout';
import { HttpClientModule } from '@angular/common/http';
import { ErrorHandler, Injectable, NgModule } from '@angular/core';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { FIREBASE_OPTIONS } from '@angular/fire/compat';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule, MatIconRegistry } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSliderModule } from '@angular/material/slider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BrowserModule, DomSanitizer } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import * as Sentry from '@sentry/browser';
import { environment } from 'src/environments/environment';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AuthService } from './auth/auth.service';
import { AccountComponent } from './components/account/account.component';
import { ActionsComponent } from './components/actions/actions.component';
import { AddEmailProviderDialogComponent } from './components/add-email-provider-dialog/add-email-provider-dialog.component';
import { AddItemDialogComponent } from './components/add-item-dialog/add-item-dialog.component';
import { AddProjectMemberDialogComponent } from './components/add-project-member-dialog/add-project-member-dialog.component';
import { AgentDetailComponent } from './components/agent-detail/agent-detail.component';
import { AgentsComponent } from './components/agents/agents.component';
import { ConfirmationDialogComponent } from './components/confirmation-dialog/confirmation-dialog.component';
import { CreateKeyDialogComponent } from './components/create-key-dialog/create-key-dialog.component';
import { DataDetailComponent } from './components/data-detail/data-detail.component';
import { DataTableComponent } from './components/data-table/data-table.component';
import { EditDialogComponent } from './components/edit-dialog/edit-dialog.component';
import { MachinesComponent } from './components/machines/machines.component';
import { ModuleDetailsComponent } from './components/module-details/module-details.component';
import { ModulesComponent } from './components/modules/modules.component';
import { NavComponent } from './components/nav/nav.component';
import { NavbarAccountComponent } from './components/navbar-account/navbar-account.component';
import { NavbarProjectSelectComponent } from './components/navbar-project-select/navbar-project-select.component';
import { NavbarStatusComponent } from './components/navbar-status/navbar-status.component';
import { NavbarTitleComponent } from './components/navbar-title/navbar-title.component';
import { NavbarVscodeComponent } from './components/navbar-vscode/navbar-vscode.component';
import { NewProjectDialogComponent } from './components/new-project-dialog/new-project-dialog.component';
import { ProjectListComponent } from './components/project-list/project-list.component';
import { ProjectSettingsComponent } from './components/project-settings/project-settings.component';
import { RecordComponent } from './components/record/record.component';
import { RepositoriesComponent } from './components/repositories/repositories.component';
import { ToolbarComponent } from './components/toolbar/toolbar.component';
import { UserProfileComponent } from './components/user-profile/user-profile.component';
import { HomeComponent } from './pages/home/home.component';
import { PricingComponent } from './pages/pricing/pricing.component';
import { DateAsQueryParamPipe } from './pipes/date-as-query-param.pipe';
import { FileSizePipe } from './pipes/file-size.pipe';
import { SafePipe } from './pipes/safe.pipe';
import { VscodeService } from './services/vscode.service';
import { UploadProgressComponent } from './upload-progress/upload-progress.component';

declare let process: any;
if (process.env.NODE_ENV === 'production') {
  Sentry.init({
    release: environment.version,
    dsn: 'https://9f2c53e1ba36484693bcaa05b595312e@sentry.io/1870631',
  });
}
@Injectable()
export class SentryErrorHandler implements ErrorHandler {
  constructor() {}
  handleError(error) {
    throw error;
    // const eventId = Sentry.captureException(error.originalError || error);
    // Sentry.showReportDialog({ eventId });
  }
}

@NgModule({
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
    HttpClientModule,
    LayoutModule,
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
    FormsModule,
    MatMenuModule,
    MatGridListModule,
    AppRoutingModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatTabsModule,
    MatCheckboxModule,
    MatSliderModule,
    MatExpansionModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    ClipboardModule,
    DragDropModule,
    MatDividerModule,
    MatProgressBarModule,
    MatChipsModule,
  ],
  declarations: [
    AppComponent,
    NavComponent,
    DataTableComponent,
    AgentsComponent,
    AgentDetailComponent,
    MachinesComponent,
    NavbarTitleComponent,
    HomeComponent,
    NavbarAccountComponent,
    ToolbarComponent,
    ProjectListComponent,
    EditDialogComponent,
    FileSizePipe,
    NewProjectDialogComponent,
    SafePipe,
    AddItemDialogComponent,
    CreateKeyDialogComponent,
    NavbarVscodeComponent,
    NavbarProjectSelectComponent,
    NavbarStatusComponent,
    RecordComponent,
    PricingComponent,
    AccountComponent,
    UserProfileComponent,
    RepositoriesComponent,
    ProjectSettingsComponent,
    ActionsComponent,
    DataDetailComponent,
    AddProjectMemberDialogComponent,
    ConfirmationDialogComponent,
    DateAsQueryParamPipe,
    AddEmailProviderDialogComponent,
    ModulesComponent,
    ModuleDetailsComponent,
    UploadProgressComponent,
  ],
  providers: [
    AuthService,
    { provide: FIREBASE_OPTIONS, useValue: environment.firebase },
    VscodeService,
    MatIconRegistry,
    MatSnackBar,
    { provide: ErrorHandler, useClass: SentryErrorHandler },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {
  constructor(matIconRegistry: MatIconRegistry, domSanitizer: DomSanitizer) {
    matIconRegistry.addSvgIcon(
      'nstrumenta-logo',
      domSanitizer.bypassSecurityTrustResourceUrl('/assets/images/nstrumenta-logo.svg')
    );
    matIconRegistry.addSvgIcon(
      'vscode-logo',
      domSanitizer.bypassSecurityTrustResourceUrl('/assets/images/vscode-logo.svg')
    );
    matIconRegistry.registerFontClassAlias('fontawesome', 'fa');
  }
}
