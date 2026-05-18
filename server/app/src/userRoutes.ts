import { Express } from 'express'
import { initUser, setupUsername } from './api/userProfile'
import { listUserProjects, repairUserProjectMemberships } from './api/userProjects'

export const registerUserRoutes = (app: Express) => {
  app.post('/api/user/init', initUser)
  app.post('/api/user/setup-username', setupUsername)
  app.get('/api/user/projects', listUserProjects)
  app.post('/api/user/projects/repair', repairUserProjectMemberships)
}