#!/usr/bin/env node
import { CreateApiKeyService } from './services/ApiKeyService'

import cors from 'cors'
import express, { Request, Response, NextFunction } from 'express'
import { mkdir } from 'fs/promises'
import {
  bucketName,
  firestore,
  projectId,
  storage,
} from './authentication/ServiceAccount'
import { createCloudAdminService } from './services/cloudAdmin'
import { createCloudDataJobService } from './services/cloudDataJob'
import { handleMcpRequest, handleMcpSseRequest, handleMcpSseMessage } from './mcp'
import { registerOAuthRoutes } from './oauth'
import { registerOrgRoutes } from './orgRoutes'
import { registerUserRoutes } from './userRoutes'
import { registerAdminRoutes } from './adminRoutes'
import { registerGithubRoutes } from './githubRoutes'
import { markNotificationRead, deleteNotification } from './api/notifications'

const version = require('../package.json').version

export { ActionData } from './types'

const imageVersionTag = process.env.IMAGE_VERSION_TAG ?? ''

console.log(`Starting server ${version}`)

const port = process.env.API_PORT ?? 5999

const app = express()
app.set('trust proxy', 1)
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use(cors())

import rateLimit from 'express-rate-limit'

// Rate limiters for different endpoints
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes for general API endpoints
  standardHeaders: true,
  legacyHeaders: false,
})

const mcpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
})

app.use('/api/', (req, res, next) => {
  if (req.path === '/github/webhook') return next()
  return apiLimiter(req, res, next)
})

// API routes first (before static files to prevent shadowing)
registerOAuthRoutes(app)
registerOrgRoutes(app)
registerUserRoutes(app)
registerAdminRoutes(app)
registerGithubRoutes(app)

app.patch('/api/notifications/:notificationId', (req, res) => {
  req.body = { ...req.body, ...req.params }
  markNotificationRead(req, res)
})
app.delete('/api/notifications/:notificationId', (req, res) => {
  req.body = { ...req.body, ...req.params }
  deleteNotification(req, res)
})

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', version, buildSha: imageVersionTag })
})

app.get('/config', (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=3600')
  const protocol = req.get('x-forwarded-proto') || req.protocol;
  const host = req.get('x-forwarded-host') || req.get('host');
  res.json({
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: `${projectId}.firebaseapp.com`,
    projectId: projectId,
    appId: process.env.FIREBASE_APP_ID,
    apiUrl: process.env.NST_API_URL || `${protocol}://${host}`,
    serverSha: imageVersionTag
  })
})

// MCP JSON-RPC 2.0 endpoints
app.post('/mcp', mcpLimiter, handleMcpRequest)
app.get('/mcp/sse', mcpLimiter, handleMcpSseRequest)
app.post('/mcp/messages', mcpLimiter, handleMcpSseMessage)

// Serve frontend static files (after API routes)
app.use(express.static('/app/frontend'))

// Catch-all route for Angular SPA (must be last)
app.get('/{*path}', apiLimiter, (req, res) => {
  res.sendFile('/app/frontend/index.html')
})

const server = require('http').Server(app)

server.listen(port, '0.0.0.0', () => {
  console.log('listening on *:', port)
})

console.log('project_id: ', projectId)

const bucket = storage.bucket(bucketName)

// Wire services to their dependencies

const apiKeyService = CreateApiKeyService({ firestore })
const cloudDataJobService = createCloudDataJobService({ firestore })
const cloudAdminService = createCloudAdminService({
  firestore,
  storage,
})
