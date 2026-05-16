import express from 'express'
import { approveUser, listPendingUsers } from './api/adminUsers'

export function registerAdminRoutes(app: express.Application) {
  const router = express.Router()

  router.post('/users/approve', (req, res) => approveUser(req, res))
  router.get('/users/pending', (req, res) => listPendingUsers(req, res))

  app.use('/api/admin', router)
}
