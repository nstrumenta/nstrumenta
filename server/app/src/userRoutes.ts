import { Express } from 'express'
import rateLimit from 'express-rate-limit'
import { setupUsername } from './api/userProfile'

const userLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
})

export const registerUserRoutes = (app: Express) => {
  app.post('/api/user/setup-username', userLimiter, setupUsername)
}