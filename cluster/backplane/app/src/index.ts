import { Firestore } from '@google-cloud/firestore'
import { NstrumentaClient, NstrumentaServer } from 'nstrumenta'
import WebSocket from 'ws'

import { serviceAccount } from './ServiceAccount'

;(async () => {
  const { name, version } = require('../package.json')

  console.log(`Starting ${name} version ${version}`)

  const firestore = new Firestore({
    projectId: serviceAccount.project_id,
    credentials: {
      client_email: serviceAccount.client_email,
      private_key: serviceAccount.private_key,
    },
    timestampsInSnapshots: true,
  })
  const apiKey = process.env.NSTRUMENTA_API_KEY
  const port = process.env.NSTRUMENTA_PORT || '8089'
  if (!apiKey)
    throw new Error('NSTRUMENTA_API_KEY environment variable not set')
  const nstServer = new NstrumentaServer({
    apiKey,
    port,
    debug: true,
    allowCrossProjectApiKey: true,
    connectToBackplane: false,
  })

  // client to self for subscriptions
  const nstClient = new NstrumentaClient()

  const actionUnsubscribeFunctions = new Map<string, () => void>()

  nstServer.addListener('clients', (agents) => {
    console.log('agents', agents)
  })

  await nstServer.run()

  nstClient.addListener('open', () => {
    nstClient.addSubscription('_nstrumenta', (message) => {
      if (message.command) {
        switch (message?.command) {
          case 'registerAgent':
            const { agentId, actionsCollectionPath } = message
            const actionsCollectionRef = firestore.collection(
              actionsCollectionPath,
            )
            console.log(`subscribing to ${actionsCollectionPath}`)

            const shutdown = actionUnsubscribeFunctions.get('agentId')
            if (shutdown) shutdown()

            actionUnsubscribeFunctions.set(
              agentId,
              actionsCollectionRef.onSnapshot(async (actionsSnapshot) => {
                actionsSnapshot.forEach(async (action) => {
                  action.ref.get().then(async (doc) => {
                    const actionDocument = await doc.data()
                    if (actionDocument && actionDocument.status == 'pending') {
                      const message = {
                        actionId: action.ref.id,
                        ...actionDocument,
                      }
                      nstClient?.send(agentId, message)
                      action.ref.set(
                        { status: 'sentToAgent', lastModified: Date.now() },
                        { merge: true },
                      )
                    }
                  })
                })
              }),
            )
            break
          default:
            console.log('unrecognized command ', message)
        }
      }
    })
  })

  nstClient.connect({
    apiKey,
    nodeWebSocket: WebSocket as any,
    wsUrl: `ws://localhost:${port}`,
  })
})()
