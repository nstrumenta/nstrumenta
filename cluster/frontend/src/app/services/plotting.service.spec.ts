import { TestBed } from '@angular/core/testing';
import { PlottingService } from './plotting.service';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthService } from '../auth/auth.service';
import { MockAuthService } from 'src/app/testing/mocks';

describe('PlottingService', () => {
  let service: PlottingService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [{ provide: AuthService, useClass: MockAuthService }]
    });
    service = TestBed.inject(PlottingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
