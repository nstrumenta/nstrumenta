import { TestBed } from '@angular/core/testing';
import { UrlTree, Router, RouterStateSnapshot, ActivatedRouteSnapshot } from '@angular/router';
import { BehaviorSubject, of, Observable } from 'rxjs';
import { WaitlistGuard } from './waitlist.guard';

describe('WaitlistGuard', () => {
  let guard: WaitlistGuard;
  let routerSpy: jasmine.SpyObj<Router>;
  let userStatusSubject: BehaviorSubject<string | null>;

  beforeEach(() => {
    userStatusSubject = new BehaviorSubject<string | null>('approved');

    routerSpy = jasmine.createSpyObj('Router', ['parseUrl', 'navigate']);

    TestBed.configureTestingModule({
      providers: [
        WaitlistGuard,
        { provide: Router, useValue: routerSpy }
      ]
    });
    guard = TestBed.inject(WaitlistGuard);

    // Mocking auth service temporarily within the test for isolation
    (guard as any).authService = {
      userStatus$: userStatusSubject.asObservable()
    };
  });

  it('should redirect to /waitlist if user is pending', (done) => {
    const mockUrlTree = {} as any;
    routerSpy.parseUrl.and.returnValue(mockUrlTree);
    userStatusSubject.next('pending');

    const result$ = guard.canActivate({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot) as Observable<boolean | UrlTree>;
    result$.subscribe(result => {
      expect(result).toBe(mockUrlTree);
      expect(routerSpy.parseUrl).toHaveBeenCalledWith('/waitlist');
      done();
    });
  });

  it('should allow navigation if user is not logged in', (done) => {
    userStatusSubject.next(null);
    const result$ = guard.canActivate({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot) as Observable<boolean | UrlTree>;
    result$.subscribe(result => {
      expect(result).toBeTrue();
      done();
    });
  });

  it('should allow navigation if user is approved', (done) => {
    userStatusSubject.next('approved');
    const result$ = guard.canActivate({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot) as Observable<boolean | UrlTree>;
    result$.subscribe(result => {
      expect(result).toBeTrue();
      done();
    });
  });
});
