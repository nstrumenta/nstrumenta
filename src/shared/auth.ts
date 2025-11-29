import crypto from 'crypto';

export interface AuthResult {
  authenticated: boolean;
  projectId: string;
  message?: string;
}

export function createApiKeyHash(key: string): string {
  // Security Note: CodeQL flags this as "insufficient computational effort" because it uses SHA256.
  // However, API keys are high-entropy random strings (32+ chars), making rainbow tables ineffective.
  // Changing this to a slower hash (like PBKDF2) would be a breaking change for existing keys.
  // We accept this risk for now. Future key versions should use PBKDF2/scrypt.
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
    const hash = createApiKeyHash(apiKey.split(':')[0]);
    const keyDoc = await firestore.collection('keys').doc(hash).get();
    const docData = keyDoc.data();

    if (!docData) {
      return { authenticated: false, message: 'invalid key', projectId: '' };
    }

    const lastUsed = Date.now();
    const projectPath = `projects/${docData.projectId}`;
    
    // Update last used timestamp (fire and forget)
    firestore.doc(projectPath).update({
      [`apiKeys.${hash}.lastUsed`]: lastUsed
    }).catch((err: Error) => {
      console.error('Failed to update lastUsed:', err);
    });

    return { authenticated: true, projectId: docData.projectId };
  } catch (error) {
    console.error('API key validation error:', error);
    return { authenticated: false, message: 'error', projectId: '' };
  }
}
