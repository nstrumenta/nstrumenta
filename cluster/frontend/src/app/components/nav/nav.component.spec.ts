import { LayoutModule } from '@angular/cdk/layout';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';

import { NavComponent } from './nav.component';
import { NavbarTitleComponent } from '../navbar-title/navbar-title.component';
import { RouterTestingModule } from '@angular/router/testing';
import { NavbarAccountComponent } from '../navbar-account/navbar-account.component';
import { LogoComponent } from '../logo/logo.component';
import { AuthService } from 'src/app/auth/auth.service';
import { of } from 'rxjs';

const authServiceStub = {
  user: of({ uid: 'mock' }),
};

describe('NavComponent', () => {
  let component: NavComponent;
  let fixture: ComponentFixture<NavComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
    imports: [
        NoopAnimationsModule,
        LayoutModule,
        MatButtonModule,
        MatIconModule,
        MatListModule,
        MatSidenavModule,
        MatToolbarModule,
        RouterTestingModule,
        MatMenuModule,
        NavComponent, NavbarTitleComponent, NavbarAccountComponent, LogoComponent,
    ],
    providers: [{ provide: AuthService, useValue: authServiceStub }],
}).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NavComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should compile', () => {
    expect(component).toBeTruthy();
  });
});
