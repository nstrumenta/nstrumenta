import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MatSnackBarModule } from '@angular/material/snack-bar';
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
