import express from 'express'
import { createOrg, getOrg, listOrgMembers, removeOrgMember, listUserOrgs } from './api/organizations'
import { inviteMember, acceptInvitation, listInvitations, revokeInvitation, inviteProjectMember, acceptProjectInvitation } from './api/invitations'
import { listProjectMembers, updateProjectMemberRole, removeProjectMember } from './api/projectMembers'
import { getBilling, getUsage } from './api/billing'

function mergeParams(req: express.Request, _res: express.Response, next: express.NextFunction) {
  req.body = { ...req.body, ...req.params }
  next()
}

export function registerOrgRoutes(app: express.Application) {
  const router = express.Router()

  router.post('/', createOrg)
  router.get('/', listUserOrgs)
  router.get('/:orgId', mergeParams, getOrg)

  router.get('/:orgId/members', mergeParams, listOrgMembers)
  router.delete('/:orgId/members/:memberId', mergeParams, removeOrgMember)
  router.post('/:orgId/projects/:projectId/invitations', mergeParams, inviteProjectMember)
  router.post('/:orgId/projects/:projectId/invitations/:invitationId/accept', mergeParams, acceptProjectInvitation)
  router.get('/:orgId/projects/:projectId/members', mergeParams, listProjectMembers)
  router.patch('/:orgId/projects/:projectId/members/:memberId', mergeParams, updateProjectMemberRole)
  router.delete('/:orgId/projects/:projectId/members/:memberId', mergeParams, removeProjectMember)

  router.post('/:orgId/invitations', mergeParams, inviteMember)
  router.get('/:orgId/invitations', mergeParams, listInvitations)
  router.post('/:orgId/invitations/:invitationId/accept', mergeParams, acceptInvitation)
  router.delete('/:orgId/invitations/:invitationId', mergeParams, revokeInvitation)

  router.get('/:orgId/billing', mergeParams, getBilling)
  router.get('/:orgId/billing/usage', mergeParams, getUsage)

  app.use('/api/orgs', router)
}
