import { Express } from 'express'
import rateLimit from 'express-rate-limit'
import { initUser, setupUsername } from './api/userProfile'
import { listUserProjects } from './api/userProjects'

const userWriteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
})

export const registerUserRoutes = (app: Express) => {
  app.post('/api/user/init', userWriteLimiter, initUser)
  app.post('/api/user/setup-username', userWriteLimiter, setupUsername)
  app.get('/api/user/projects', listUserProjects)
}