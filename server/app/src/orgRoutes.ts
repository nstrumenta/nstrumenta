import express from 'express'
import rateLimit from 'express-rate-limit'
import { createOrg, getOrg, listOrgMembers, removeOrgMember } from './api/organizations'
import { inviteMember, acceptInvitation, listInvitations, revokeInvitation } from './api/invitations'
import { getBilling, getUsage } from './api/billing'

// Rate limiter for organization endpoints (100 req per 15 minutes)
const orgLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
})

// Middleware that merges route params into req.body so withFirebaseAuth can extract them
function mergeParams(req: express.Request, _res: express.Response, next: express.NextFunction) {
  req.body = { ...req.body, ...req.params }
  next()
}

export function registerOrgRoutes(app: express.Application) {
  // Apply rate limiting to all standard organization paths internally
  const router = express.Router()
  router.use(orgLimiter)

  // Organization CRUD
  router.post('/', (req, res) => createOrg(req, res))
  router.get('/:orgId', mergeParams, (req, res) => getOrg(req, res))

  // Organization members
  router.get('/:orgId/members', mergeParams, (req, res) => listOrgMembers(req, res))
  router.delete('/:orgId/members/:memberId', mergeParams, (req, res) => removeOrgMember(req, res))

  // Invitations
  router.post('/:orgId/invitations', mergeParams, (req, res) => inviteMember(req, res))
  router.get('/:orgId/invitations', mergeParams, (req, res) => listInvitations(req, res))
  router.post('/:orgId/invitations/:invitationId/accept', mergeParams, (req, res) => acceptInvitation(req, res))
  router.delete('/:orgId/invitations/:invitationId', mergeParams, (req, res) => revokeInvitation(req, res))

  // Billing
  router.get('/:orgId/billing', mergeParams, (req, res) => getBilling(req, res))
  router.get('/:orgId/billing/usage', mergeParams, (req, res) => getUsage(req, res))

  app.use('/api/orgs', router)
}
