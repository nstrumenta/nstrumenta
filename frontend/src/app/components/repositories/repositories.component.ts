import { DatePipe } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { FirebaseDataService } from 'src/app/services/firebase-data.service';
import { ApiService, GithubInstallation } from 'src/app/services/api.service';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';

@Component({
    selector: 'app-repositories',
    templateUrl: './repositories.component.html',
    styleUrls: ['./repositories.component.scss'],
  imports: [MatButton, MatIcon, MatCardModule, MatListModule, DatePipe]
})
export class RepositoriesComponent {
  private firebaseDataService = inject(FirebaseDataService);
  private apiService = inject(ApiService);

  readonly installations = signal<GithubInstallation[]>([]);
  readonly isLoading = signal(false);
  readonly error = signal('');
  readonly linkingInstallationId = signal('');
  readonly unlinkingInstallationId = signal('');
  readonly projectId = computed(() => this.firebaseDataService.projectId());
  readonly connectUrl = computed(() => {
    const projectId = this.projectId();
    if (!projectId) return '';
    return `https://github.com/apps/nstrumenta-github/installations/new?state=${encodeURIComponent(projectId)}`;
  });

  readonly linkedInstallations = computed(() => {
    const projectId = this.projectId();
    return this.installations()
      .map((installation) => ({
        ...installation,
        repositories: installation.repositories.filter((repository) => repository.linkedProjectId === projectId),
      }))
      .filter((installation) => installation.repositories.length > 0);
  });

  readonly availableInstallations = computed(() => this.installations()
    .map((installation) => ({
      ...installation,
      repositories: installation.repositories.filter((repository) => !repository.linkedProjectId),
    }))
    .filter((installation) => installation.repositories.length > 0));

  constructor() {
    effect((cleanup) => {
      const projectId = this.projectId();
      if (!projectId) {
        this.installations.set([]);
        return;
      }

      let cancelled = false;
      this.isLoading.set(true);
      this.error.set('');

      this.apiService.listGithubInstallations(projectId)
        .then((response) => {
          if (!cancelled) {
            this.installations.set(response.installations);
          }
        })
        .catch((error) => {
          if (!cancelled) {
            this.error.set(error instanceof Error ? error.message : 'Failed to load repositories');
          }
        })
        .finally(() => {
          if (!cancelled) {
            this.isLoading.set(false);
          }
        });

      cleanup(() => {
        cancelled = true;
      });
    });
  }

  githubUrl(fullName: string): string {
    return `https://github.com/${fullName}`;
  }

  private async refreshInstallations() {
    const projectId = this.projectId();
    if (!projectId) return;
    const response = await this.apiService.listGithubInstallations(projectId);
    this.installations.set(response.installations);
  }

  async linkInstallation(installationId: string): Promise<void> {
    const projectId = this.projectId();
    if (!projectId || this.linkingInstallationId()) return;

    this.linkingInstallationId.set(installationId);
    this.error.set('');
    try {
      await this.apiService.linkGithubInstallation(projectId, installationId);
      await this.refreshInstallations();
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Failed to link installation');
    } finally {
      this.linkingInstallationId.set('');
    }
  }

  async unlinkInstallation(installationId: string): Promise<void> {
    const projectId = this.projectId();
    if (!projectId || this.unlinkingInstallationId()) return;

    this.unlinkingInstallationId.set(installationId);
    this.error.set('');
    try {
      await this.apiService.unlinkGithubInstallation(projectId, installationId);
      await this.refreshInstallations();
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Failed to unlink installation');
    } finally {
      this.unlinkingInstallationId.set('');
    }
  }
}
