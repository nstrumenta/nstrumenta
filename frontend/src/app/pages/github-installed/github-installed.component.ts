import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButton } from '@angular/material/button';
import { ApiService } from 'src/app/services/api.service';

@Component({
  selector: 'app-github-installed',
  templateUrl: './github-installed.component.html',
  styleUrls: ['./github-installed.component.scss'],
  imports: [MatButton, RouterLink],
})
export class GithubInstalledComponent implements OnInit {
  private route = inject(ActivatedRoute)
  private apiService = inject(ApiService)

  readonly status = signal<'linking' | 'success' | 'error'>('linking')
  readonly message = signal('Connecting GitHub installation...')
  readonly linkedRepos = signal<string[]>([])
  readonly projectId = signal('')
  
  readonly returnRoute = computed(() => {
    const projectId = this.projectId()
    const [owner, project] = projectId.split('/')
    if (!owner || !project) return ['/']
    return ['/', owner, project, 'repositories']
  })

  ngOnInit() {
    const installationId = this.route.snapshot.queryParamMap.get('installation_id') ?? ''
    const state = this.route.snapshot.queryParamMap.get('state') ?? ''
    const setupAction = this.route.snapshot.queryParamMap.get('setup_action') ?? ''

    const separatorIndex = state.lastIndexOf(':')
    if (separatorIndex <= 0 || separatorIndex === state.length - 1) {
      this.status.set('error')
      this.message.set('Missing or invalid installation callback state in the GitHub callback URL.')
      return
    }

    const projectId = state.slice(0, separatorIndex)
    const stateToken = state.slice(separatorIndex + 1)
    
    this.projectId.set(projectId)

    if (!installationId) {
      this.status.set('error')
      this.message.set('Missing installation_id in the GitHub callback URL.')
      return
    }

    this.apiService.linkGithubInstallation(projectId, installationId, stateToken)
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
  }
}