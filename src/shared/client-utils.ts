/**
 * Client SDK utilities
 * Shared across CLI, Node.js, and Browser clients
 */

/**
 * Get API endpoints from API key
 * Used by all clients
 */
export const getEndpoints = (apiKey: string, apiUrl?: string) => {
  const url = apiUrl ? apiUrl : atob(apiKey.split(':')[1] ?? '').trim();
  return {
    ADMIN_UTILS: `${url}/adminUtils`,
    CREATE_PROJECT: `${url}/createProject`,
    GET_MACHINES: `${url}/getMachines`,
    GET_CLOUD_RUN_SERVICES: `${url}/getCloudRunServices`,
    GET_UPLOAD_URL: `${url}/getUploadUrl`,
    GET_UPLOAD_DATA_URL: `${url}/getUploadDataUrl`,
    GET_PROJECT: `${url}/getProject`,
    REGISTER_AGENT: `${url}/registerAgent`,
    LIST_AGENTS: `${url}/listAgents`,
    SET_ACTION: `${url}/setAction`,
    GET_ACTION: `${url}/getAction`,
    SET_AGENT_ACTION: `${url}/setAgentAction`,
    GET_AGENT_ID_BY_TAG: `${url}/getAgentIdByTag`,
    CLEAN_AGENT_ACTIONS: `${url}/cleanAgentActions`,
    GET_DOWNLOAD_URL: `${url}/getDownloadUrl`,
    GET_PROJECT_DOWNLOAD_URL: `${url}/getProjectDownloadUrl`,
    GENERATE_DATA_ID: `${url}/generateDataId`,
    LIST_MODULES: `${url}/listModules`,
    GET_TOKEN: `${url}/getToken`,
    VERIFY_TOKEN: `${url}/verifyToken`,
    VERIFY_API_KEY: `${url}/verifyApiKey`,
    SET_STORAGE_OBJECT: `${url}/setStorageObject`,
    SET_DATA_METADATA: `${url}/setDataMetadata`,
    LIST_STORAGE_OBJECTS: `${url}/listStorageObjects`,
    GET_DATA_MOUNT: `${url}/getDataMount`,
    QUERY_COLLECTION: `${url}/queryCollection`,
    MCP: `${url}/`,
    MCP_SSE: `${url}/mcp/messages`,
  };
};

/**
 * Resolve API key from environment or return empty string
 * Used by Node.js and CLI clients (not browser)
 */
export const resolveApiKey = (): string => {
  // Check if we're in a Node.js environment
  if (typeof process !== 'undefined' && process.env) {
    const apiKey = process.env.NSTRUMENTA_API_KEY || process.env.NST_API_KEY;
    if (!apiKey) {
      console.warn(
        'Warning: NSTRUMENTA_API_KEY environment variable not set. Some commands will fail.'
      );
      return '';
    }
    return apiKey;
  }
  return '';
};

/**
 * Resolve API URL from environment variable if set
 * Used by CLI clients (not browser)
 */
export const resolveApiUrl = (): string | undefined => {
  // Check if we're in a Node.js environment
  if (typeof process !== 'undefined' && process.env) {
    const apiUrl = process.env.NSTRUMENTA_API_URL || process.env.NST_API_URL;
    if (apiUrl) {
      return apiUrl;
    }
  }
  return undefined;
};

/**
 * Get endpoints for the current environment
 * Resolves API key and URL automatically
 */
export const getClientEndpoints = () => {
  return getEndpoints(resolveApiKey(), resolveApiUrl());
};
