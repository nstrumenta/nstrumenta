import express from 'express'
import rateLimit from 'express-rate-limit'
import { approveUser, listPendingUsers } from './api/adminUsers'

const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
})

export function registerAdminRoutes(app: express.Application) {
  const router = express.Router()
  router.use(adminLimiter)

  router.post('/users/approve', (req, res) => approveUser(req, res))
  router.get('/users/pending', (req, res) => listPendingUsers(req, res))

  app.use('/api/admin', router)
}
