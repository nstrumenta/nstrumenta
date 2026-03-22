import express from 'express'
import { createOrg, getOrg, listOrgMembers, removeOrgMember } from './api/organizations'
import { inviteMember, acceptInvitation, listInvitations, revokeInvitation } from './api/invitations'
import { getBilling, getUsage } from './api/billing'

// Middleware that merges route params into req.body so withFirebaseAuth can extract them
function mergeParams(req: express.Request, _res: express.Response, next: express.NextFunction) {
  req.body = { ...req.body, ...req.params }
  next()
}

export function registerOrgRoutes(app: express.Application) {
  // Organization CRUD
  app.post('/api/orgs', (req, res) => createOrg(req, res))
  app.get('/api/orgs/:orgId', mergeParams, (req, res) => getOrg(req, res))

  // Organization members
  app.get('/api/orgs/:orgId/members', mergeParams, (req, res) => listOrgMembers(req, res))
  app.delete('/api/orgs/:orgId/members/:memberId', mergeParams, (req, res) => removeOrgMember(req, res))

  // Invitations
  app.post('/api/orgs/:orgId/invitations', mergeParams, (req, res) => inviteMember(req, res))
  app.get('/api/orgs/:orgId/invitations', mergeParams, (req, res) => listInvitations(req, res))
  app.post('/api/orgs/:orgId/invitations/:invitationId/accept', mergeParams, (req, res) => acceptInvitation(req, res))
  app.delete('/api/orgs/:orgId/invitations/:invitationId', mergeParams, (req, res) => revokeInvitation(req, res))

  // Billing
  app.get('/api/orgs/:orgId/billing', mergeParams, (req, res) => getBilling(req, res))
  app.get('/api/orgs/:orgId/billing/usage', mergeParams, (req, res) => getUsage(req, res))
}
