import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { NavbarStatusComponent } from './navbar-status.component';
import { ProjectService } from 'src/app/services/project.service';
import { FirebaseDataService } from 'src/app/services/firebase-data.service';
import { MockProjectService, MockFirebaseDataService } from 'src/app/testing/mocks';

describe('NavbarStatusComponent', () => {
  let component: NavbarStatusComponent;
  let fixture: ComponentFixture<NavbarStatusComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
    imports: [NavbarStatusComponent],
    providers: [
      { provide: ProjectService, useClass: MockProjectService },
      { provide: FirebaseDataService, useClass: MockFirebaseDataService }
    ]
}).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NavbarStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
