import { FieldPath } from 'firebase-admin/firestore';

import crypto from 'crypto'
import express from 'express'
import { firestore } from './authentication/ServiceAccount'
import { withProjectAuth } from './authentication/projectAuth'
import { orgProjectPath } from './shared/utils'

type InstallationRepositorySummary = {
  id: string
  fullName: string
  linkedProjectId?: string
}

type ProjectGithubConnection = {
  installationId: string
  projectId: string
  account: { login?: string; type?: string }
  connectedAt: number
  connectedBy: string
  updatedAt: number
}

type ProjectGithubLink = {
  installationId: string
  projectId: string
  repoId: string
  fullName: string
  account: { login?: string; type?: string }
  linkedAt: number
  linkedBy: string
  updatedAt: number
}

type GithubInstallSession = {
  projectId: string
  userId: string
  createdAt: number
  expiresAt: number
  consumedAt?: number
}

type InstallationSummary = {
  installationId: string
  account: { login?: string; type?: string }
  repositories: InstallationRepositorySummary[]
  updatedAt?: number
}

const GITHUB_APP_WEBHOOK_SECRET = process.env.GITHUB_APP_WEBHOOK_SECRET
const GITHUB_APP_INSTALL_URL = process.env.GITHUB_APP_INSTALL_URL
const GITHUB_INSTALL_SESSION_TTL_MS = 15 * 60 * 1000

function projectGithubConnectionsPath(projectId: string): string {
  return `${orgProjectPath(projectId)}/githubConnections`
}

function projectGithubLinksPath(projectId: string): string {
  return `${orgProjectPath(projectId)}/githubLinks`
}

function githubInstallSessionPath(stateToken: string): string {
  return `githubInstallSessions/${stateToken}`
}

function buildGithubInstallState(projectId: string, stateToken: string): string {
  return `${projectId}:${stateToken}`
}

function buildGithubLinkId(installationId: string, fullName: string): string {
  return `${installationId}__${Buffer.from(fullName).toString('base64url')}`
}

function summarizeInstallationFromProjectDocs(
  connection: ProjectGithubConnection,
  links: ProjectGithubLink[],
): InstallationSummary {
  return {
    installationId: connection.installationId,
    account: connection.account,
    repositories: links.map((link) => ({
      id: link.repoId,
      fullName: link.fullName,
      linkedProjectId: link.projectId,
    })),
    updatedAt: connection.updatedAt,
  }
}

async function listProjectInstallations(projectId: string): Promise<InstallationSummary[]> {
  const [connectionsSnapshot, linksSnapshot] = await Promise.all([
    firestore.collection(projectGithubConnectionsPath(projectId)).get(),
    firestore.collection(projectGithubLinksPath(projectId)).get(),
  ])

  const linksByInstallationId = new Map<string, ProjectGithubLink[]>()
  for (const doc of linksSnapshot.docs) {
    const link = doc.data() as ProjectGithubLink
    const existing = linksByInstallationId.get(link.installationId) ?? []
    existing.push(link)
    linksByInstallationId.set(link.installationId, existing)
  }

  return connectionsSnapshot.docs
    .map((doc) => doc.data() as ProjectGithubConnection)
    .map((connection) => summarizeInstallationFromProjectDocs(
      connection,
      linksByInstallationId.get(connection.installationId) ?? [],
    ))
    .sort((left, right) => (right.updatedAt ?? 0) - (left.updatedAt ?? 0))
}

async function createProjectGithubLinks(
  projectId: string,
  installationId: string,
  account: { login?: string; type?: string },
  repositories: Array<{ id: string; fullName: string }>,
  linkedBy: string,
): Promise<string[]> {
  const writer = firestore.bulkWriter()
  const now = Date.now()

  const connectionRef = firestore.doc(`${projectGithubConnectionsPath(projectId)}/${installationId}`)
  writer.set(connectionRef, {
    installationId,
    projectId,
    account,
    connectedAt: now,
    connectedBy: linkedBy,
    updatedAt: now,
  } satisfies ProjectGithubConnection, { merge: true })

  for (const repository of repositories) {
    const linkRef = firestore.doc(`${projectGithubLinksPath(projectId)}/${buildGithubLinkId(installationId, repository.fullName)}`)
    writer.set(linkRef, {
      installationId,
      projectId,
      repoId: repository.id,
      fullName: repository.fullName,
      account,
      linkedAt: now,
      linkedBy,
      updatedAt: now,
    } satisfies ProjectGithubLink, { merge: true })
  }

  await writer.close()
  return repositories.map((repository) => repository.fullName)
}

async function deleteProjectGithubLinks(projectId: string, installationId: string): Promise<string[]> {
  const linksSnapshot = await firestore.collection(projectGithubLinksPath(projectId))
    .where('installationId', '==', installationId)
    .get()

  const unlinkedRepos = linksSnapshot.docs.map((doc) => String(doc.data()?.fullName ?? ''))
  const writer = firestore.bulkWriter()
  writer.delete(firestore.doc(`${projectGithubConnectionsPath(projectId)}/${installationId}`))
  for (const doc of linksSnapshot.docs) {
    writer.delete(doc.ref)
  }
  await writer.close()
  return unlinkedRepos.filter(Boolean)
}

async function fanOutRepoEventProjectIds(installationId: string, repoFullName: string): Promise<string[]> {
  const snapshot = await firestore.collectionGroup('githubLinks')
    .where(FieldPath.documentId(), '==', buildGithubLinkId(installationId, repoFullName))
    .get()

  return snapshot.docs
    .map((doc) => String(doc.data()?.projectId ?? ''))
    .filter(Boolean)
}

async function deleteLinksForRemovedRepositories(installationId: string, repoFullNames: string[]): Promise<void> {
  for (const repoFullName of repoFullNames) {
    const snapshot = await firestore.collectionGroup('githubLinks')
      .where(FieldPath.documentId(), '==', buildGithubLinkId(installationId, repoFullName))
      .get()

    if (snapshot.empty) {
      continue
    }

    const batch = firestore.batch()
    for (const doc of snapshot.docs) {
      batch.delete(doc.ref)
    }
    await batch.commit()
  }
}

async function fanOutAddedRepositories(
  installationId: string,
  account: { login?: string; type?: string },
  repositories: Array<{ id: string; fullName: string }>,
): Promise<void> {
  if (repositories.length === 0) {
    return
  }

  const connectionSnapshot = await firestore.collectionGroup('githubConnections')
    .where(FieldPath.documentId(), '==', installationId)
    .get()

  for (const connectionDoc of connectionSnapshot.docs) {
    const connection = connectionDoc.data() as ProjectGithubConnection
    await createProjectGithubLinks(
      connection.projectId,
      installationId,
      account,
      repositories,
      connection.connectedBy,
    )
  }
}

async function deleteInstallationConnections(installationId: string): Promise<void> {
  const snapshot = await firestore.collectionGroup('githubConnections')
    .where(FieldPath.documentId(), '==', installationId)
    .get()

  if (snapshot.empty) {
    return
  }

  const batch = firestore.batch()
  for (const doc of snapshot.docs) {
    batch.delete(doc.ref)
  }
  await batch.commit()
}

function verifySignature(rawBody: Buffer, signature: string | undefined): boolean {
  if (!signature) return false
  if (!GITHUB_APP_WEBHOOK_SECRET) throw new Error('GITHUB_APP_WEBHOOK_SECRET env var is required')
  const expected = `sha256=${crypto.createHmac('sha256', GITHUB_APP_WEBHOOK_SECRET).update(rawBody).digest('hex')}`
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
}

async function consumeGithubInstallSession(projectId: string, userId: string, stateToken: string): Promise<void> {
  const sessionRef = firestore.doc(githubInstallSessionPath(stateToken))
  const now = Date.now()

  await firestore.runTransaction(async (transaction) => {
    const sessionDoc = await transaction.get(sessionRef)
    if (!sessionDoc.exists) {
      throw new Error('GitHub installation session not found')
    }

    const session = sessionDoc.data() as GithubInstallSession
    if (session.projectId !== projectId || session.userId !== userId) {
      throw new Error('GitHub installation session does not match this project or user')
    }
    if (session.consumedAt) {
      throw new Error('GitHub installation session has already been used')
    }
    if (session.expiresAt < now) {
      throw new Error('GitHub installation session has expired')
    }

    transaction.update(sessionRef, { consumedAt: now })
  })
}

async function handleInstallation(action: string, installation: any, repositories: any[] = []) {
  const installationId = String(installation.id)
  const docRef = firestore.doc(`githubInstallations/${installationId}`)

  if (action === 'deleted') {
    await docRef.delete()
    await deleteInstallationConnections(installationId)
    await deleteLinksForRemovedRepositories(
      installationId,
      ((repositories ?? []) as any[]).map((repository) => String(repository.full_name ?? '')),
    )
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
  await deleteLinksForRemovedRepositories(
    installationId,
    reposRemoved.map((repository: any) => String(repository.full_name ?? '')),
  )
  await fanOutAddedRepositories(
    installationId,
    doc.data()?.account ?? {},
    reposAdded.map((repository: any) => ({ id: String(repository.id), fullName: String(repository.full_name) })),
  )
  console.log(`[github] installation ${installationId}: +${reposAdded.length} -${reposRemoved.length} repos`)
}

async function handlePush(installationId: string, repoFullName: string, ref: string, headSha: string) {
  const projectIds = await fanOutRepoEventProjectIds(installationId, repoFullName)
  if (projectIds.length === 0) {
    console.log(`[github] push from ${repoFullName} — no linked nstrumenta project, ignoring`)
    return
  }
  for (const projectId of projectIds) {
    console.log(`[github] push ${repoFullName}@${ref} (${headSha}) → project ${projectId}`)
  }
}

async function handlePullRequest(action: string, installationId: string, repoFullName: string, prNumber: number, headSha: string) {
  if (action !== 'opened' && action !== 'synchronize') return
  const projectIds = await fanOutRepoEventProjectIds(installationId, repoFullName)
  if (projectIds.length === 0) {
    console.log(`[github] PR #${prNumber} from ${repoFullName} — no linked nstrumenta project, ignoring`)
    return
  }
  for (const projectId of projectIds) {
    console.log(`[github] PR #${prNumber} ${repoFullName}@${headSha} → project ${projectId}`)
  }
}

export function registerGithubRoutes(app: express.Application) {
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

  app.post('/api/github/installations/connect-url', express.json(), withProjectAuth(async (_req, res, args) => {
    if (!GITHUB_APP_INSTALL_URL) {
      res.status(503).json({ error: 'GitHub App install URL is not configured on this server' })
      return
    }
    if (args.type !== 'user') {
      res.status(400).json({ error: 'GitHub App installation requires user authentication' })
      return
    }

    const stateToken = crypto.randomUUID()
    const now = Date.now()
    await firestore.doc(githubInstallSessionPath(stateToken)).set({
      projectId: args.projectId,
      userId: args.userId,
      createdAt: now,
      expiresAt: now + GITHUB_INSTALL_SESSION_TTL_MS,
    } satisfies GithubInstallSession)

    const connectUrl = `${GITHUB_APP_INSTALL_URL}?state=${encodeURIComponent(buildGithubInstallState(args.projectId, stateToken))}`
    res.status(200).json({ connectUrl })
  }))

  // Link an installation to a project (called from frontend after App install callback)
  app.post('/api/github/installations/link', express.json(), withProjectAuth(async (req, res, args) => {
    const { installationId: rawInstallationId, projectId, stateToken } = req.body
    if (!rawInstallationId || !projectId) {
      res.status(400).json({ error: 'installationId and projectId are required' })
      return
    }
    const installationId = String(rawInstallationId)
    if (installationId.includes('/')) {
      res.status(400).json({ error: 'invalid installationId' })
      return
    }

    if (args.type === 'user') {
      if (typeof stateToken !== 'string' || !stateToken) {
        res.status(400).json({ error: 'stateToken is required for user-authenticated GitHub installation linking' })
        return
      }
      await consumeGithubInstallSession(projectId, args.userId, stateToken)
    }

    const docRef = firestore.doc(`githubInstallations/${installationId}`)
    const doc = await docRef.get()
    if (!doc.exists) {
      res.status(404).json({ error: `installation ${installationId} not found` })
      return
    }
    const repositories = (doc.data()?.repositories ?? []).map((repository: any) => ({
      id: String(repository.id),
      fullName: String(repository.fullName),
    }))
    const linkedRepos = await createProjectGithubLinks(
      projectId,
      installationId,
      doc.data()?.account ?? {},
      repositories,
      args.type === 'user' ? args.userId : 'api-key',
    )
    console.log(`[github] installation ${installationId} linked to project ${projectId}`)
    res.status(200).json({ ok: true, linkedRepos })
  }))

  app.get('/api/github/installations', withProjectAuth(async (_req, res, args) => {
    const { projectId } = args
    const installations = await listProjectInstallations(projectId)

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

    const unlinkedRepos = await deleteProjectGithubLinks(projectId, installationId)
    res.status(200).json({ ok: true, unlinkedRepos })
  }))
}
