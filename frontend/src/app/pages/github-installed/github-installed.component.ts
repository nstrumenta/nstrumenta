import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { MatButton } from '@angular/material/button';
import { ApiService } from 'src/app/services/api.service';

@Component({
  selector: 'app-github-installed',
  templateUrl: './github-installed.component.html',
  styleUrls: ['./github-installed.component.scss'],
  imports: [MatButton, RouterLink],
})
export class GithubInstalledComponent {
  private route = inject(ActivatedRoute)
  private apiService = inject(ApiService)

  readonly installationId = toSignal(
    this.route.queryParamMap.pipe(map((params) => params.get('installation_id') ?? '')),
    { initialValue: this.route.snapshot.queryParamMap.get('installation_id') ?? '' },
  )
  readonly state = toSignal(
    this.route.queryParamMap.pipe(map((params) => params.get('state') ?? '')),
    { initialValue: this.route.snapshot.queryParamMap.get('state') ?? '' },
  )
  readonly setupAction = toSignal(
    this.route.queryParamMap.pipe(map((params) => params.get('setup_action') ?? '')),
    { initialValue: this.route.snapshot.queryParamMap.get('setup_action') ?? '' },
  )

  readonly status = signal<'linking' | 'success' | 'error'>('linking')
  readonly message = signal('Connecting GitHub installation...')
  readonly linkedRepos = signal<string[]>([])
  readonly attempted = signal(false)
  readonly parsedState = computed(() => {
    const state = this.state()
    const separatorIndex = state.lastIndexOf(':')
    if (separatorIndex <= 0 || separatorIndex === state.length - 1) {
      return null
    }

    return {
      projectId: state.slice(0, separatorIndex),
      stateToken: state.slice(separatorIndex + 1),
    }
  })
  readonly projectId = computed(() => this.parsedState()?.projectId ?? '')
  readonly returnRoute = computed(() => {
    const projectId = this.projectId()
    const [owner, project] = projectId.split('/')
    if (!owner || !project) return ['/']
    return ['/', owner, project, 'repositories']
  })

  constructor() {
    effect(() => {
      const installationId = this.installationId()
      const parsedState = this.parsedState()
      const setupAction = this.setupAction()

      if (this.attempted()) return
      this.attempted.set(true)

      if (!installationId || !parsedState?.projectId || !parsedState.stateToken) {
        this.status.set('error')
        this.message.set('Missing or invalid installation callback state in the GitHub callback URL.')
        return
      }

      this.apiService.linkGithubInstallation(parsedState.projectId, installationId, parsedState.stateToken)
        .then((response) => {
          this.linkedRepos.set(response.linkedRepos)
          this.status.set('success')
          this.message.set(
            setupAction === 'update'
              ? 'GitHub installation updated and linked successfully.'
              : 'GitHub installation linked successfully.',
          )
        })
        .catch((error) => {
          this.status.set('error')
          this.message.set(error instanceof Error ? error.message : 'Failed to link GitHub installation')
        })
    })
  }
}