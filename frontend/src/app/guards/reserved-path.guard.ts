import { Route, UrlSegment, CanMatchFn } from '@angular/router';

const reservedWords = new Set([
  'admin', 'settings', 'new', 'waitlist', 'login', 'signup',
  'api', 'mcp', 'oauth', 'health', 'config', 'assets', '_', 'projects', 'account'
]);

export const reservedPathGuard: CanMatchFn = (route: Route, segments: UrlSegment[]) => {
  if (segments.length > 0) {
    const firstSegment = segments[0].path.toLowerCase();
    if (reservedWords.has(firstSegment)) {
      return false; // Skip this route, let other routes match
    }
  }
  return true;
};
