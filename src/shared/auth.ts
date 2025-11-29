import crypto from 'crypto';

export interface AuthResult {
  authenticated: boolean;
  projectId: string;
  message?: string;
}

export function createApiKeyHash(key: string): string {
  // Legacy SHA256 hash for existing keys
  return crypto.createHash('sha256').update(key).update('salt').digest('hex');
}

export async function validateApiKey(
  apiKey: string,
  firestore: any
): Promise<AuthResult> {
  if (!apiKey) {
    return { authenticated: false, message: 'missing key', projectId: '' };
  }

  try {
    const rawKey = apiKey.split(':')[0];
    let docId: string;
    let isV2 = false;

    // Check if it's a V2 key (48 chars hex)
    if (rawKey.length === 48 && /^[0-9a-f]+$/i.test(rawKey)) {
      docId = rawKey.substring(0, 16);
      isV2 = true;
    } else {
      // Legacy key
      docId = createApiKeyHash(rawKey);
    }

    const keyDoc = await firestore.collection('keys').doc(docId).get();
    const docData = keyDoc.data();

    if (!docData) {
      return { authenticated: false, message: 'invalid key', projectId: '' };
    }

    // Verify V2 key hash
    if (isV2) {
      if (docData.version !== 'v2' || !docData.salt || !docData.hash) {
        return { authenticated: false, message: 'invalid key version', projectId: '' };
      }
      
      const secretAccessKey = rawKey.substring(16);
      // Note: In shared code (client-side or non-server), we might not have process.env.NSTRUMENTA_API_KEY_PEPPER
      // But validateApiKey is typically run on server/functions where env vars are available.
      // If this runs in browser, process.env might be empty or polyfilled.
      // Assuming this runs in a secure environment (Cloud Functions / Server).
      const pepper = process.env.NSTRUMENTA_API_KEY_PEPPER || '';
      const hash = crypto.scryptSync(secretAccessKey, docData.salt + pepper, 64).toString('hex');
      
      if (hash !== docData.hash) {
        return { authenticated: false, message: 'invalid key', projectId: '' };
      }
    }

    const lastUsed = Date.now();
    const projectPath = `projects/${docData.projectId}`;
    
    // Update last used timestamp (fire and forget)
    firestore.doc(projectPath).update({
      [`apiKeys.${docId}.lastUsed`]: lastUsed
    }).catch((err: Error) => {
      console.error('Failed to update lastUsed:', err);
    });

    return { authenticated: true, projectId: docData.projectId };
  } catch (error) {
    console.error('API key validation error:', error);
    return { authenticated: false, message: 'error', projectId: '' };
  }
}
