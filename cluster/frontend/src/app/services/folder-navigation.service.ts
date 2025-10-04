import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class FolderNavigationService {
  currentFolder = signal<string>('');
  flatView = signal<boolean>(false); // Toggle between hierarchical and flat view

  setFolder(folder: string) {
    this.currentFolder.set(folder);
  }

  toggleFlatView() {
    this.flatView.update(current => !current);
  }

  navigateToFolder(folder: string) {
    this.setFolder(folder);
  }

  navigateUp() {
    const current = this.currentFolder();
    if (!current) return;
    
    const parts = current.split('/').filter(p => p);
    parts.pop();
    this.setFolder(parts.join('/'));
  }

  get breadcrumbs() {
    const folder = this.currentFolder();
    if (!folder) return [];
    
    const parts = folder.split('/').filter(p => p);
    return parts.map((part, index) => ({
      label: part,
      path: parts.slice(0, index + 1).join('/')
    }));
  }
}
