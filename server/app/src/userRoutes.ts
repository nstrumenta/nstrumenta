import { Express } from 'express'
import { setupUsername } from './api/userProfile'

export const registerUserRoutes = (app: Express) => {
  app.post('/api/user/setup-username', setupUsername)
}