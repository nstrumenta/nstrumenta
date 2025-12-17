import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { NavbarVscodeComponent } from './navbar-vscode.component';
import { VscodeService } from 'src/app/services/vscode.service';
import { MockVscodeService } from 'src/app/testing/mocks';

describe('NavbarVscodeComponent', () => {
  let component: NavbarVscodeComponent;
  let fixture: ComponentFixture<NavbarVscodeComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
    imports: [NavbarVscodeComponent, MatSnackBarModule],
    providers: [{ provide: VscodeService, useClass: MockVscodeService }]
}).compileComponents();

    // Register the vscode-logo icon
    const iconRegistry = TestBed.inject(MatIconRegistry);
    const sanitizer = TestBed.inject(DomSanitizer);
    iconRegistry.addSvgIcon(
      'vscode-logo',
      sanitizer.bypassSecurityTrustResourceUrl('/assets/images/vscode-logo.svg')
    );
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NavbarVscodeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
