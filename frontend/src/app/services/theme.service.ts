import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly storageKey = 'nst-theme';

  isDark = signal<boolean>(this.resolveInitialTheme());

  private resolveInitialTheme(): boolean {
    const saved = localStorage.getItem(this.storageKey);
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  toggleTheme() {
    const next = !this.isDark();
    this.isDark.set(next);
    localStorage.setItem(this.storageKey, next ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark-mode', next);
    document.documentElement.classList.toggle('light-mode', !next);
  }
}
