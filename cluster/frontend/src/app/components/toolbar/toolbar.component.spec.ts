import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ToolbarComponent } from './toolbar.component';
import { NavbarTitleComponent } from '../navbar-title/navbar-title.component';
import { NavbarAccountComponent } from '../navbar-account/navbar-account.component';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterTestingModule } from '@angular/router/testing';
import { LogoComponent } from '../logo/logo.component';
import { AuthService } from 'src/app/auth/auth.service';
import { of } from 'rxjs';

const authServiceStub = {
  user: of({ uid: 'mock' }),
};

describe('ToolbarComponent', () => {
  let component: ToolbarComponent;
  let fixture: ComponentFixture<ToolbarComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ToolbarComponent, NavbarTitleComponent, NavbarAccountComponent, LogoComponent],
      imports: [MatToolbarModule, RouterTestingModule, MatMenuModule, MatIconModule],
      providers: [{ provide: AuthService, useValue: authServiceStub }],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ToolbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
