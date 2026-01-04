#!/usr/bin/env node
import { Firestore } from '@google-cloud/firestore'
import { CreateApiKeyService } from './services/ApiKeyService'
import { createCloudAgentService } from './services/cloudAgent'
import { createArchiveService } from './services/firestoreArchive'

import { spawn } from 'child_process'
import cors from 'cors'
import express, { Request, Response, NextFunction } from 'express'
import { mkdir } from 'fs/promises'
import {
  bucketName,
  serviceAccount,
  storage,
} from './authentication/ServiceAccount'
import { createCloudAdminService } from './services/cloudAdmin'
import { createCloudDataJobService } from './services/cloudDataJob'
import { handleMcpRequest, handleMcpSseRequest, handleMcpSseMessage } from './mcp'
import { registerOAuthRoutes } from './oauth'

const version = require('../package.json').version

export const nstrumentaImageRepository =
  process.env.IMAGE_REPOSITORY ?? 'nstrumenta'
export const nstrumentaImageVersionTag =
  process.env.IMAGE_VERSION_TAG ?? 'latest'

console.log(
  `Starting server ${version} \nIMAGE_REPOSITORY: ${nstrumentaImageRepository} \nIMAGE_VERSION_TAG: ${nstrumentaImageVersionTag}`,
)
const compute = require('@google-cloud/compute')

export interface ActionData {
  payload: { projectId: string; [key: string]: any }

  [key: string]: any
}

const port = process.env.API_PORT ?? 5999

const app = express()
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

// API routes first (before static files to prevent shadowing)
registerOAuthRoutes(app)

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', version })
})

app.get('/config', (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=3600')
  res.json({
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: `${serviceAccount.project_id}.firebaseapp.com`,
    projectId: serviceAccount.project_id,
    appId: process.env.FIREBASE_APP_ID
  })
})

app.get('/nstrumentaDeployment.json', async (req, res) => {
  try {
    const file = storage.bucket(`${serviceAccount.project_id}-config`).file('nstrumentaDeployment.json')
    const [content] = await file.download()
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Cache-Control', 'public, max-age=30')
    res.send(content)
  } catch (error) {
    console.error('Error serving nstrumentaDeployment.json:', error)
    res.status(500).json({ error: 'Failed to load deployment config' })
  }
})

// MCP JSON-RPC 2.0 endpoints
app.post('/', mcpLimiter, handleMcpRequest)
app.get('/mcp/sse', mcpLimiter, handleMcpSseRequest)
app.post('/mcp/messages', mcpLimiter, handleMcpSseMessage)

// Serve frontend static files (after API routes)
app.use(express.static('/app/frontend'))

// Catch-all route for Angular SPA (must be last)
app.get('*', (req, res) => {
  res.sendFile('/app/frontend/index.html')
})

const server = require('http').Server(app)

server.listen(port, '0.0.0.0', () => {
  console.log('listening on *:', port)
})

console.log('project_id: ', serviceAccount.project_id)

const firestore = new Firestore({
  projectId: serviceAccount.project_id,
  credentials: {
    client_email: serviceAccount.client_email,
    private_key: serviceAccount.private_key,
  },
  timestampsInSnapshots: true,
})

const bucket = storage.bucket(bucketName)

const computeClient = new compute.InstancesClient(serviceAccount)

// Wire services to their dependencies

const archiveService = createArchiveService({ firestore })
const cloudAgentService = createCloudAgentService({
  firestore,
  compute: computeClient,
  spawn,
  storage,
})
const apiKeyService = CreateApiKeyService({ firestore })
const cloudDataJobService = createCloudDataJobService({
  firestore,
  compute: computeClient,
  spawn,
  storage,
})
const cloudAdminService = createCloudAdminService({
  firestore,
  spawn,
  storage,
})
