// Usage, e.g.:
// for await (const doc of walkFirestoreDocument('projects/accel-filter') {
//  if (depth > MAX_DEPTH) break;
//  console.log(doc)
// }
import {
  DocumentReference,
  DocumentSnapshot,
  Firestore,
} from '@google-cloud/firestore'
import { ActionData } from '../index'

export interface FirestoreArchiveServiceDependencies {
  firestore: Firestore
}

// replace the originalPath in path with duplicatePath, that is, the path of the new duplicate project
function updatePathForDocument({
  path,
  duplicatePath,
  originalPath,
}: {
  path: string //
  duplicatePath: string
  originalPath: string
}) {
  const updatedPath = path.replace(originalPath, duplicatePath)

  if (path === updatedPath)
    throw new Error(
      `problem trying to replace archived path ${originalPath} with duplicate project path ${duplicatePath}`,
    )

  return updatedPath
}

export interface ArchiveService {
  archiveProject: (path: string, data: ActionData) => Promise<DocumentReference>
  duplicateProject: (
    path: string,
    data: ActionData,
  ) => Promise<DocumentReference | undefined>
}

export interface RootProjectDocument {
  members: object
  name: string
  archive?: string
}

function setDuplicateRootFields(
  [path, data]: [path: string, data: RootProjectDocument],
  { name, userId }: { name: string; userId: string },
): [path: string, data: RootProjectDocument] {
  return [
    path,
    {
      ...data,
      members: {
        [userId]: 'owner',
      },
      name,
    },
  ]
}

export function createArchiveService({
  firestore,
}: FirestoreArchiveServiceDependencies): ArchiveService {
  async function* walkFirestoreDocument(
    path: string,
  ): AsyncGenerator<DocumentSnapshot> {
    // First yield the current doc
    const documentRef = firestore.doc(path)
    const documentSnapshot = await documentRef.get()
    yield documentSnapshot

    // Now, each sub-collection has a list of documents
    const collections = await documentRef.listCollections()
    for await (const documentsList of collections.map((c) =>
      c.listDocuments(),
    )) {
      // And once we've awaited the list of documents, we yield each document
      for await (const doc of documentsList) {
        yield* await walkFirestoreDocument(doc.path)
      }
    }
  }

  function cleanDataForArchive(doc: FirebaseFirestore.DocumentSnapshot): {
    valid: boolean
    data: unknown
  } {
    const result = { valid: true, data: Object.assign({}, { ...doc.data() }) }

    // Any primitive type should be fine
    if (!(typeof result.data === 'object')) return result

    // Don't store actions, probably? If we did, we'd need to deal with pending actions
    if (doc.ref.path.indexOf('actions/') > -1) result.valid = false

    if (!!result.data.archive) result.valid = false

    return result
  }

  return {
    // archive a project as a list of key value pairs [path, value]
    archiveProject: async function archiveProject(
      actionPath: string,
      data: ActionData,
    ) {
      const {
        payload: { projectId },
      } = data

      const project = []

      try {
        for await (const doc of walkFirestoreDocument(
          `projects/${projectId}`,
        )) {
          const { valid, data } = cleanDataForArchive(doc)
          if (!valid) continue

          console.log(`push doc ${doc.ref.path}`)
          project.push([doc.ref.path, data])
        }

        const timestamp = Date.now()

        console.log(`set archive at ${timestamp}`)
        await firestore
          .doc(`projects/${projectId}`)
          .collection('archives')
          .doc(timestamp.toString())
          .set({ archive: JSON.stringify(project), createdAt: timestamp })

        // TODO: this should be managed by the listener which spawned this service action
        console.log(`set action ${actionPath} to complete`)
        await firestore
          .doc(actionPath)
          .set({ status: 'complete' }, { merge: true })

        console.log('archive is', project)
        console.log('archive succeeded :O')

        // TODO: Create archive metadata
        return firestore.doc(`projects/${{ projectId }}`)
      } catch (err) {
        await firestore
          .doc(actionPath)
          .set({ status: 'error', error: JSON.stringify(err) }, { merge: true })
        console.log('archive failed :(')

        throw new Error(JSON.stringify(err))
      }
    },

    duplicateProject: async function (actionPath: string, data: ActionData) {
      const {
        payload: {
          projectId: originalProjectId,
          duplicateName,
          requestingUserId,
        },
      } = data

      const duplicateId = duplicateName || `${originalProjectId}_duplicate`
      const originalPath = `projects/${originalProjectId}`
      const duplicatePath = `projects/${duplicateId}`

      try {
        // create a new project
        const archiveDoc = firestore.doc(duplicatePath)
        await archiveDoc.create({})

        const archiveRefs = await firestore
          .doc(`projects/${originalProjectId}`)
          .collection('archives')
          .listDocuments()

        // for now, let's just grab the most recent
        const archiveRef = archiveRefs.sort(
          ({ id: a }, { id: b }) => parseInt(a, 10) - parseInt(b, 10),
        )[archiveRefs.length - 1]

        const archiveSnapshot = await archiveRef.get()
        const archive = archiveSnapshot.data()?.archive

        const fields: [path: string, data: RootProjectDocument][] =
          JSON.parse(archive)

        // Update root doc's fields (assuming this is 1st index isn't ideal...)
        fields[0] = setDuplicateRootFields(fields[0], {
          name: duplicateName,
          userId: requestingUserId,
        })

        // add all the paths
        console.log('ALL THE THINGS! ', fields)
        fields.forEach(([path, data]) => {
          const updatedPath = updatePathForDocument({
            path,
            duplicatePath,
            originalPath,
          })

          // TODO: sanitize the data;
          // here's pme prob w/storing the archives within the project
          // this cleaning step should already be taken care of when archive is created
          // but we'll just make sure here
          if (!!data.archive) {
            console.log(`data is an archive`)
            return
          }

          firestore.doc(updatedPath).set(data)
        })
        await firestore
          .doc(actionPath)
          .set({ status: 'complete' }, { merge: true })

        return archiveRef
      } catch (err) {
        // are we a failure? destroy the new project
        // firestore.doc(`projects/${YOU MAKE ME REAL}`).some_delete_thing()

        const doc = await firestore.doc(duplicatePath).get()
        const copyData = doc.data()
        console.log('the dupe:', copyData)
        await firestore.doc(duplicatePath).delete()

        await firestore
          .doc(actionPath)
          .set({ status: 'error', error: JSON.stringify(err) }, { merge: true })
        console.log('duplicate project from archive failed :(', err)
      }
    },
  }
}
