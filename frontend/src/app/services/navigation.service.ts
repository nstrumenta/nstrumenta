import { Injectable, inject } from '@angular/core';
import { Router, NavigationExtras } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class NavigationService {
  private router = inject(Router);

  /**
   * Navigate to a route while preserving query parameters
   */
  navigate(commands: Parameters<Router['navigate']>[0], extras?: NavigationExtras): Promise<boolean> {
    const mergedExtras: NavigationExtras = {
      queryParamsHandling: 'preserve',
      ...extras
    };
    return this.router.navigate(commands, mergedExtras);
  }

  /**
   * Navigate by URL while preserving query parameters
   */
  navigateByUrl(url: string, extras?: NavigationExtras): Promise<boolean> {
    const mergedExtras: NavigationExtras = {
      queryParamsHandling: 'preserve',
      ...extras
    };
    return this.router.navigateByUrl(url, mergedExtras);
  }
}
