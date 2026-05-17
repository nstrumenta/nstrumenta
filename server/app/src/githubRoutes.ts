import crypto from 'crypto'
import express from 'express'
import { firestore } from './authentication/ServiceAccount'
import { withProjectAuth } from './authentication/projectAuth'

type InstallationRepositorySummary = {
  id: string
  fullName: string
  linkedProjectId?: string
}

type InstallationSummary = {
  installationId: string
  account: { login?: string; type?: string }
  repositories: InstallationRepositorySummary[]
  updatedAt?: number
}

const GITHUB_APP_WEBHOOK_SECRET = process.env.GITHUB_APP_WEBHOOK_SECRET

function verifySignature(rawBody: Buffer, signature: string | undefined): boolean {
  if (!signature) return false
  if (!GITHUB_APP_WEBHOOK_SECRET) throw new Error('GITHUB_APP_WEBHOOK_SECRET env var is required')
  const expected = `sha256=${crypto.createHmac('sha256', GITHUB_APP_WEBHOOK_SECRET).update(rawBody).digest('hex')}`
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
}

function summarizeInstallation(data: any): InstallationSummary {
  const linkedProjects: Record<string, string> = data?.linkedProjects ?? {}
  const repositories = (data?.repositories ?? []).map((repository: any) => ({
    id: repository.id,
    fullName: repository.fullName,
    linkedProjectId: linkedProjects[repository.fullName],
  }))

  return {
    installationId: String(data?.installationId ?? ''),
    account: data?.account ?? {},
    repositories,
    updatedAt: data?.updatedAt,
  }
}

async function handleInstallation(action: string, installation: any, repositories: any[] = []) {
  const installationId = String(installation.id)
  const docRef = firestore.doc(`githubInstallations/${installationId}`)

  if (action === 'deleted') {
    await docRef.delete()
    console.log(`[github] installation ${installationId} deleted`)
    return
  }

  const repoList = repositories.map((r: any) => ({ id: r.id, fullName: r.full_name }))
  await docRef.set({
    installationId,
    account: { login: installation.account.login, type: installation.account.type },
    repositories: repoList,
    updatedAt: Date.now(),
  }, { merge: true })
  console.log(`[github] installation ${installationId} ${action} with ${repoList.length} repos`)
}

async function handleInstallationRepositories(action: string, installationId: string, reposAdded: any[], reposRemoved: any[]) {
  const docRef = firestore.doc(`githubInstallations/${installationId}`)
  const doc = await docRef.get()
  if (!doc.exists) {
    console.warn(`[github] installation_repositories event for unknown installation ${installationId}`)
    return
  }
  const existing: any[] = doc.data()?.repositories ?? []
  const removedIds = new Set(reposRemoved.map((r: any) => r.id))
  const merged = [
    ...existing.filter((r: any) => !removedIds.has(r.id)),
    ...reposAdded.map((r: any) => ({ id: r.id, fullName: r.full_name })),
  ]
  await docRef.set({ repositories: merged, updatedAt: Date.now() }, { merge: true })
  console.log(`[github] installation ${installationId}: +${reposAdded.length} -${reposRemoved.length} repos`)
}

async function handlePush(installationId: string, repoFullName: string, ref: string, headSha: string) {
  const docRef = firestore.doc(`githubInstallations/${installationId}`)
  const doc = await docRef.get()
  if (!doc.exists) {
    console.warn(`[github] push from unknown installation ${installationId}`)
    return
  }
  const linkedProjects: Record<string, string> = doc.data()?.linkedProjects ?? {}
  const nstProjectId = linkedProjects[repoFullName]
  if (!nstProjectId) {
    console.log(`[github] push from ${repoFullName} — no linked nstrumenta project, ignoring`)
    return
  }
  console.log(`[github] push ${repoFullName}@${ref} (${headSha}) → project ${nstProjectId}`)
}

async function handlePullRequest(action: string, installationId: string, repoFullName: string, prNumber: number, headSha: string) {
  if (action !== 'opened' && action !== 'synchronize') return
  const docRef = firestore.doc(`githubInstallations/${installationId}`)
  const doc = await docRef.get()
  if (!doc.exists) return
  const linkedProjects: Record<string, string> = doc.data()?.linkedProjects ?? {}
  const nstProjectId = linkedProjects[repoFullName]
  if (!nstProjectId) {
    console.log(`[github] PR #${prNumber} from ${repoFullName} — no linked nstrumenta project, ignoring`)
    return
  }
  console.log(`[github] PR #${prNumber} ${repoFullName}@${headSha} → project ${nstProjectId}`)
}

export function registerGithubRoutes(app: express.Application) {
  // Must receive raw body for HMAC verification — register before global json middleware applies to this path
  app.post('/api/github/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['x-hub-signature-256'] as string | undefined
    if (!verifySignature(req.body as Buffer, sig)) {
      res.status(401).json({ error: 'invalid signature' })
      return
    }

    const event = req.headers['x-github-event'] as string
    const payload = JSON.parse((req.body as Buffer).toString('utf8'))

    try {
      switch (event) {
        case 'installation':
          await handleInstallation(payload.action, payload.installation, payload.repositories ?? [])
          break
        case 'installation_repositories':
          await handleInstallationRepositories(
            payload.action,
            String(payload.installation.id),
            payload.repositories_added ?? [],
            payload.repositories_removed ?? [],
          )
          break
        case 'push':
          await handlePush(
            String(payload.installation?.id),
            payload.repository.full_name,
            payload.ref,
            payload.head_commit?.id ?? '',
          )
          break
        case 'pull_request':
          await handlePullRequest(
            payload.action,
            String(payload.installation?.id),
            payload.repository.full_name,
            payload.pull_request.number,
            payload.pull_request.head.sha,
          )
          break
        default:
          console.log(`[github] unhandled event: ${event}`)
      }
      res.status(200).json({ ok: true })
    } catch (err: any) {
      console.error('[github] webhook handler error:', err.message)
      res.status(500).json({ error: err.message })
    }
  })

  // Link an installation to a project (called from frontend after App install callback)
  app.post('/api/github/installations/link', express.json(), withProjectAuth(async (req, res, args) => {
    const { installationId: rawInstallationId, projectId } = req.body
    if (!rawInstallationId || !projectId) {
      res.status(400).json({ error: 'installationId and projectId are required' })
      return
    }
    const installationId = String(rawInstallationId)
    if (installationId.includes('/')) {
      res.status(400).json({ error: 'invalid installationId' })
      return
    }

    const docRef = firestore.doc(`githubInstallations/${installationId}`)
    const doc = await docRef.get()
    if (!doc.exists) {
      res.status(404).json({ error: `installation ${installationId} not found` })
      return
    }
    const repoFullNames: string[] = (doc.data()?.repositories ?? []).map((r: any) => r.fullName)
    const linkedProjects: Record<string, string> = { ...(doc.data()?.linkedProjects ?? {}) }
    const linkedRepos: string[] = []
    const skippedRepos: Array<{ fullName: string; linkedProjectId: string }> = []

    for (const fullName of repoFullNames) {
      const existingProjectId = linkedProjects[fullName]
      if (!existingProjectId || existingProjectId === projectId) {
        linkedProjects[fullName] = projectId
        linkedRepos.push(fullName)
      } else {
        skippedRepos.push({ fullName, linkedProjectId: existingProjectId })
      }
    }
    await docRef.set({ linkedProjects, updatedAt: Date.now() }, { merge: true })
    console.log(`[github] installation ${installationId} linked to project ${projectId}`)
    res.status(200).json({ ok: true, linkedRepos, skippedRepos })
  }))

  app.get('/api/github/installations', withProjectAuth(async (_req, res, args) => {
    const { projectId } = args
    const snapshot = await firestore.collection('githubInstallations').get()
    const installations = snapshot.docs
      .map((doc) => summarizeInstallation(doc.data()))
      .map((installation) => ({
        ...installation,
        repositories: installation.repositories.filter(
          (repository) => !repository.linkedProjectId || repository.linkedProjectId === projectId,
        ),
      }))
      .filter((installation) => installation.repositories.length > 0)

    res.status(200).json({ installations })
  }))

  app.delete('/api/github/installations/:installationId/link', withProjectAuth(async (req, res, args) => {
    const { projectId } = args
    const installationId = String(req.params.installationId ?? '')
    if (!installationId || installationId.includes('/')) {
      res.status(400).json({ error: 'invalid installationId' })
      return
    }

    const docRef = firestore.doc(`githubInstallations/${installationId}`)
    const doc = await docRef.get()
    if (!doc.exists) {
      res.status(404).json({ error: `installation ${installationId} not found` })
      return
    }

    const linkedProjects: Record<string, string> = { ...(doc.data()?.linkedProjects ?? {}) }
    const unlinkedRepos = Object.entries(linkedProjects)
      .filter(([, linkedProjectId]) => linkedProjectId === projectId)
      .map(([fullName]) => fullName)

    for (const fullName of unlinkedRepos) {
      delete linkedProjects[fullName]
    }

    await docRef.set({ linkedProjects, updatedAt: Date.now() }, { merge: true })
    res.status(200).json({ ok: true, unlinkedRepos })
  }))
}
