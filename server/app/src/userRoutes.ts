import { Express } from 'express'
import rateLimit from 'express-rate-limit'
import { initUser, setupUsername } from './api/userProfile'
import { listUserProjects } from './api/userProjects'

const userLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
})

export const registerUserRoutes = (app: Express) => {
  app.post('/api/user/init', userLimiter, initUser)
  app.post('/api/user/setup-username', userLimiter, setupUsername)
  app.get('/api/user/projects', userLimiter, listUserProjects)
}