import { APIEndpoint, withAuth } from '../authentication'
import { firestore } from '../authentication/ServiceAccount'

const TIMEOUT = 30000





export interface SetDataMetadataArgs {
  projectId: string
}

export interface SetDataMetadataBody {
  metadata: Record<string, unknown>
  merge: boolean
  dataId: string
  timeout?: number
}

const setDataMetadataBase: APIEndpoint<SetDataMetadataArgs> = async (
  req,
  res,
  args,
) => {
  try {
    const { projectId } = args
    const {
      dataId,
      merge = true,
      metadata,
      timeout: requestedTimeout = TIMEOUT,
    }: SetDataMetadataBody = req.body
    const timeout = Math.min(requestedTimeout, TIMEOUT)
    
    const collectionRef = firestore.collection(`projects/${projectId}/data`)

    const findDocs = async () => {
      // Parallel query for efficiency
      const [byId, byPath] = await Promise.all([
        collectionRef.where('dataId', '==', dataId).get(),
        collectionRef.where('filePath', '==', dataId).get()
      ])
      return !byId.empty ? byId : (!byPath.empty ? byPath : null)
    }

    let ref = await findDocs()
    
    if (!ref) {
      await new Promise<void>((resolve, reject) => {
        const interval = setInterval(async () => {
          ref = await findDocs()
          if (ref) {
            clearInterval(interval)
            resolve()
          }
        }, 100)
        
        setTimeout(() => {
          clearInterval(interval)
          reject(new Error(`timeout: no documents found for [${dataId}]`))
        }, timeout)
      })
    }

    if (!ref || ref.empty) {
       throw new Error(`Document not found for ${dataId}`);
    }

    // Update metadata and ensure dataId is set for future lookups
    const updates = ref.docs.map(async (doc) => {
        await doc.ref.set({ ...metadata, dataId }, { merge });
        return (await doc.ref.get()).data();
    });

    const updatedMetadata = await Promise.all(updates);
    return res.status(200).send(updatedMetadata)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(400).json({ error: `Failed to update metadata: ${message}` })
  }
}

export const setDataMetadata = withAuth(setDataMetadataBase)
