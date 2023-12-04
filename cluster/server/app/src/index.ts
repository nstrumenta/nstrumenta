import { Firestore } from '@google-cloud/firestore'
import { CreateApiKeyService } from './services/ApiKeyService'
import { createCloudAgentService } from './services/cloudAgent'
import { createArchiveService } from './services/firestoreArchive'

import { spawn } from 'child_process'
import cors from 'cors'
import express from 'express'
import {
  copyFileSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from 'fs'
import { mkdir, readFile } from 'fs/promises'
import * as functions from './api'
import {
  bucketName,
  serviceAccount,
  storage,
} from './authentication/ServiceAccount'
import { createCloudAdminService } from './services/cloudAdmin'
import { createCloudDataJobService } from './services/cloudDataJob'

const version = require('../package.json').version

export const nstrumentaImageRepository =
  process.env.IMAGE_REPOSITORY ?? 'nstrumenta'
export const nstrumentaImageVersionTag =
  process.env.IMAGE_VERSION_TAG ?? 'latest'

console.log(
  `Starting server ${version} \nIMAGE_REPOSITORY: ${nstrumentaImageRepository} \nIMAGE_VERSION_TAG: ${nstrumentaImageVersionTag}`,
)
const compute = require('@google-cloud/compute')
const util = require('util')
const exec = util.promisify(require('child_process').exec)
const path = require('path')
const ejs = require('ejs')

export interface ActionData {
  payload: { projectId: string; [key: string]: any }

  [key: string]: any
}

const port = process.env.API_PORT ?? 5999

const app = express()
app.use(express.json())

app.use(cors())

Object.keys({ ...functions }).map((fn) => {
  // console.log(`register POST listener [${fn}]`)
  app.post(`/${fn}`, ({ ...functions } as Record<string, any>)[fn])
})

Object.keys(functions).map((fn) => {
  // console.log(`register GET listener [${fn}]`)
  app.get(`/${fn}`, (functions as Record<string, any>)[fn])
})

app.get('/', (req, res) => {
  res.status(200).send('server is running')
})

const server = require('http').Server(app)

server.listen(port, () => {
  console.log('listening on *:', port)
})

const agentType = process.env.NST_AGENT_TYPE || 'main'
console.log('agentType: ', agentType)
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

function walk(base: string, callback: (path: string) => void) {
  let files = readdirSync(base)
  files.forEach((file: string) => {
    let path = `${base}/${file}`
    if (statSync(path).isDirectory()) {
      walk(path, callback)
    } else {
      callback && callback(path)
    }
  })
}

async function buildAlgorithmFromFolder(
  nstModule: any,
  projectDir: string,
  projectId: any,
  commitId: any,
): Promise<any> {
  let tic = Date.now()
  let data: Record<string, unknown> = {}

  const algorithmPath = `${projectDir}/${nstModule.folder}`
  data['nstModuleFolder'] = nstModule.folder

  const nst_project = JSON.parse(
    await readFile(`${algorithmPath}/nst_project.json`, {
      encoding: 'utf8',
    }),
  )

  //check for required or use defaults
  if (!nst_project.parameters) nst_project.parameters = []
  if (!nst_project.arrays) nst_project.arrays = []

  const options = {}

  var errorLogContents: string[] = []

  ejs.renderFile(
    '_nstrumenta.cpp',
    nst_project,
    options,
    async function (err: string, str: string) {
      if (err) {
        console.log('Error in nst_project.json:', err)
        errorLogContents.push(err)
      } else {
        writeFileSync(`${algorithmPath}/nstrumenta.cpp`, str)
      }
    },
  )

  copyFileSync('Makefile', `${algorithmPath}/Makefile`)

  console.log(
    `Create .cpp from template (${((Date.now() - tic) * 1e-3).toFixed(3)}s)`,
  )
  tic = Date.now()

  await exec('make clean; make', {
    cwd: algorithmPath,
    shell: '/bin/bash',
  }).catch((err: { stderr: string }) => {
    console.log(err)
    errorLogContents.push(err.stderr)
  })

  console.log(`build-js (${((Date.now() - tic) * 1e-3).toFixed(3)}s)`)
  tic = Date.now()

  if (errorLogContents.length > 0) {
    console.log('compilation failed, responding with error')
    data['error'] = errorLogContents

    data['status'] = 'build-error'
  } else {
    await new Promise<void>((resolve) => {
      const options = {
        contentType: 'application/javascript',
      }
      const stream = bucket
        .file(`${projectDir}/nstrumenta.js`)
        .createWriteStream(options)
      stream.end(readFileSync(`${algorithmPath}/nstrumenta.js`))
      stream.on('finish', () => {
        console.log(`uploaded ${projectDir}/nstrumenta.js`)
        resolve()
      })
    })

    data[
      'algorithm'
    ] = `https://storage.googleapis.com/${bucket.name}/${projectDir}/nstrumenta.js`
    data['lastModified'] = Date.now()
    data['payload'] = [] // remove source from action now that it is complete
    data['nst_project'] = nst_project
    data['status'] = 'complete'

    // create algorithm instance object

    const algorithmInstanceDocPath = `projects/${projectId}/algorithms/${nstModule.name}/builds/${commitId}`
    const algorithmParentPath = `projects/${projectId}/algorithms/${nstModule.name}`
    const build: any = {}
    build.nst_project = nst_project
    build.url = data['algorithm']
    build.lastModified = Date.now()

    await firestore
      .doc(algorithmParentPath)
      .set({ lastModified: Date.now() }, { merge: true })
    await firestore.doc(algorithmInstanceDocPath).set(build)
  }

  console.log(
    `build algorithm ${projectDir} ${nstModule.name} (${(
      (Date.now() - tic) *
      1e-3
    ).toFixed(3)}s)`,
  )
  tic = Date.now()
  return data
}

async function buildFromFolder(actionPath: string, data: any) {
  let tic = Date.now()
  const projectDir = `objects/${actionPath}`
  const projectId = data.payload.projectId
  const commitId = `live-session:${data.uid}`
  console.log(`building ${actionPath}`)

  await mkdir(projectDir, { recursive: true })
  const promises: any[] = []
  data.payload.storageFiles.forEach(
    async (storageFile: { storagePath: string; path: any }) => {
      console.log(storageFile.storagePath)
      const destination = `${projectDir}/${storageFile.path}`
      await mkdir(path.dirname(destination), { recursive: true })
      promises.push(
        bucket
          .file(storageFile.storagePath)
          .download({ destination: destination }),
      )
    },
  )
  await Promise.all(promises)
  console.log(`Download (${((Date.now() - tic) * 1e-3).toFixed(3)}s)`)

  const config = JSON.parse(
    await readFile(`${projectDir}/.nstrumenta/config.json`, {
      encoding: 'utf8',
    }),
  )

  console.log(config)
  const modulePromises: any[] = []
  config.modules.forEach(async (nstModule: { type: any; name: any }) => {
    switch (nstModule.type) {
      case 'algorithm':
        {
          console.log(`algorithm ${nstModule.name}`)
          modulePromises.push(
            buildAlgorithmFromFolder(
              nstModule,
              projectDir,
              projectId,
              commitId,
            ).then(async (data) => {
              await firestore.doc(actionPath).set(data, { merge: true })
            }),
          )
        }
        break
      default:
        console.log('unrecognized module type', nstModule)
        break
    }
  })
  Promise.all(modulePromises)
    .then(() => {
      firestore
        .doc(actionPath)
        .set({ lastModified: Date.now(), status: 'complete' }, { merge: true })
    })
    .catch((err) => {
      firestore
        .doc(actionPath)
        .set({ status: 'error', error: JSON.stringify(err) }, { merge: true })
      console.log(err)
    })
}

async function buildFromGithub(actionPath: string, data: any) {
  const { projectId, repositoryId } = data.payload
  console.log('buildFromGithub', projectId, repositoryId)
  // buildFromGithub action implementation is changing
  // can re-implement using new module patterns
  // e.g. building and publishing based on module version changes
  firestore
    .doc(actionPath)
    .set({ lastModified: Date.now(), status: 'complete' }, { merge: true })
}

// subscribe to all projects with matching agentType
let projectActionSubscriptions: Map<string, Function> = new Map()
firestore
  .collection('projects')
  .where('agentType', '==', agentType)
  .onSnapshot((projectsSnapshot) => {
    let projectIds: string[] = []
    projectsSnapshot.forEach(async (project) => {
      projectIds.push(project.ref.path.split('/')[1])
    })
    // unsubscribe to previous if needed
    projectActionSubscriptions.forEach((unsubscribe, projectId) => {
      if (!projectIds.includes(projectId)) {
        console.log(`unsubscribe watching for actions ${projectId}`)
        unsubscribe()
        projectActionSubscriptions.delete(projectId)
      }
    })

    projectsSnapshot.forEach(async (project) => {
      const projectId = project.ref.path.split('/')[1]
      if (projectActionSubscriptions.has(projectId)) {
        return
      }
      console.log(`watching for actions ${projectId}`)
      // watch for actions
      projectActionSubscriptions.set(
        projectId,
        firestore
          .collection(`${project.ref.path}/actions`)
          .onSnapshot((actionsSnapshot) => {
            actionsSnapshot.forEach((action) => {
              action.ref.get().then((doc) => {
                const data = doc.data()
                if (data?.status != null && data.status === 'pending') {
                  switch (data.task) {
                    case 'buildFromGithub':
                      buildFromGithub(doc.ref.path, data)
                      break
                    case 'buildFromFolder':
                      buildFromFolder(doc.ref.path, data)
                      break
                    case 'archiveProject':
                      archiveService.archiveProject(
                        doc.ref.path,
                        data as ActionData,
                      )
                      break
                    case 'duplicateProject':
                      archiveService.duplicateProject(
                        doc.ref.path,
                        data as ActionData,
                      )
                      break
                    case 'deployCloudAgent':
                      cloudAgentService.deployCloudAgent(
                        doc.ref.path,
                        data as ActionData,
                        apiKeyService,
                      )
                      break
                    case 'deleteDeployedCloudAgent':
                      cloudAgentService.deleteDeployedCloudAgent(
                        doc.ref.path,
                        data as ActionData,
                      )
                      break
                    case 'cloudRun':
                      try {
                        cloudDataJobService.createJob(
                          doc.ref.path,
                          projectId,
                          data as ActionData,
                        )
                      } catch (err) {
                        console.error(err)
                      }
                      break
                    case 'startCloudRunService':
                      try {
                        cloudDataJobService.createService(
                          doc.ref.path,
                          projectId,
                          data as ActionData,
                        )
                      } catch (err) {
                        console.error(err)
                      }
                      break
                    case 'hostModule':
                      try {
                        cloudAdminService.hostModule(
                          doc.ref.path,
                          projectId,
                          data as ActionData,
                        )
                      } catch (err) {
                        console.error(err)
                      }
                      break
                    case 'createApiKey':
                      apiKeyService.createApiKey(
                        doc.ref.path,
                        projectId,
                        data.payload.apiUrl,
                      )
                      break
                    case 'revokeApiKey':
                      apiKeyService.revokeApiKey(
                        doc.ref.path,
                        projectId,
                        data as ActionData,
                      )
                      break
                    default:
                      const unrecognizedMessage = `unrecognized server task:${data?.task}`
                      console.log(unrecognizedMessage)
                      doc.ref.set({ status: unrecognizedMessage })
                      break
                  }
                }
              })
            })
          }),
      )
    })
  })
