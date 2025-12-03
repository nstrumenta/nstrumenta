import { TestBed } from '@angular/core/testing';
import { SafePipe } from './safe.pipe';
import { DomSanitizer } from '@angular/platform-browser';

describe('SafePipe', () => {
  it('create an instance', () => {
    TestBed.runInInjectionContext(() => {
      const pipe = new SafePipe();
      expect(pipe).toBeTruthy();
    });
  });
});
