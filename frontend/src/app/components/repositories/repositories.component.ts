import { DatePipe } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { FirebaseDataService } from 'src/app/services/firebase-data.service';
import { ApiService, GithubInstallation, GithubInstallationRepository } from 'src/app/services/api.service';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { map } from 'rxjs';

type InstallationView = GithubInstallation & {
  linkedRepositories: GithubInstallationRepository[]
  availableRepositories: GithubInstallationRepository[]
}

@Component({
    selector: 'app-repositories',
    templateUrl: './repositories.component.html',
    styleUrls: ['./repositories.component.scss'],
  imports: [MatButton, MatIcon, MatCardModule, MatListModule, DatePipe]
})
export class RepositoriesComponent {
  private route = inject(ActivatedRoute);
  private firebaseDataService = inject(FirebaseDataService);
  private apiService = inject(ApiService);

  readonly installations = signal<GithubInstallation[]>([]);
  readonly isLoading = signal(false);
  readonly isConnecting = signal(false);
  readonly error = signal('');
  readonly unlinkingInstallationId = signal('');
  readonly linkingRepositoryKey = signal('');
  readonly unlinkingRepositoryKey = signal('');
  readonly projectId = computed(() => this.firebaseDataService.projectId());
  readonly selectedInstallationId = toSignal(
    this.route.queryParamMap.pipe(map((params) => params.get('installationId') ?? '')),
    { initialValue: this.route.snapshot.queryParamMap.get('installationId') ?? '' },
  )

  readonly connectedInstallations = computed<InstallationView[]>(() => {
    const projectId = this.projectId();
    return this.installations()
      .map((installation) => ({
        ...installation,
        linkedRepositories: installation.repositories.filter((repository) => repository.linkedProjectId === projectId),
        availableRepositories: installation.repositories.filter((repository) => repository.linkedProjectId !== projectId),
      }))
      .sort((left, right) => {
        const selectedInstallationId = this.selectedInstallationId()
        if (left.installationId === selectedInstallationId) return -1
        if (right.installationId === selectedInstallationId) return 1
        return (right.updatedAt ?? 0) - (left.updatedAt ?? 0)
      })
  });

  constructor() {
    effect((cleanup) => {
      const projectId = this.projectId();
      if (!projectId) {
        this.installations.set([]);
        return;
      }

      let cancelled = false;
      this.installations.set([]);
      this.isLoading.set(true);
      this.error.set('');

      this.apiService.listGithubInstallations(projectId)
        .then((installationsResponse) => {
          if (!cancelled) {
            this.installations.set(installationsResponse.installations);
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

  repoActionKey(installationId: string, fullName: string): string {
    return `${installationId}:${fullName}`;
  }

  private async refreshInstallations() {
    const projectId = this.projectId();
    if (!projectId) return;
    this.isLoading.set(true);
    try {
      const response = await this.apiService.listGithubInstallations(projectId);
      this.installations.set(response.installations);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Failed to refresh installations');
    } finally {
      this.isLoading.set(false);
    }
  }

  async startGithubInstall(): Promise<void> {
    const projectId = this.projectId();
    if (!projectId || this.isConnecting()) return;

    this.isConnecting.set(true);
    this.error.set('');
    try {
      const response = await this.apiService.createGithubInstallationConnectUrl(projectId);
      window.location.assign(response.connectUrl);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Failed to start GitHub installation flow');
    } finally {
      this.isConnecting.set(false);
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

  async linkRepository(installationId: string, fullName: string): Promise<void> {
    const projectId = this.projectId();
    const actionKey = this.repoActionKey(installationId, fullName);
    if (!projectId || this.linkingRepositoryKey()) return;

    this.linkingRepositoryKey.set(actionKey);
    this.error.set('');
    try {
      await this.apiService.linkGithubInstallation(projectId, installationId, { selectedRepoFullNames: [fullName] });
      await this.refreshInstallations();
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Failed to link repository');
    } finally {
      this.linkingRepositoryKey.set('');
    }
  }

  async unlinkRepository(installationId: string, fullName: string): Promise<void> {
    const projectId = this.projectId();
    const actionKey = this.repoActionKey(installationId, fullName);
    if (!projectId || this.unlinkingRepositoryKey()) return;

    this.unlinkingRepositoryKey.set(actionKey);
    this.error.set('');
    try {
      await this.apiService.unlinkSelectedGithubRepositories(projectId, installationId, [fullName]);
      await this.refreshInstallations();
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Failed to unlink repository');
    } finally {
      this.unlinkingRepositoryKey.set('');
    }
  }
}
