export const DEFAULT_HOST_PORT = '8088';

const BASE_URL = process.env.NSTRUMENTA_LOCAL
  ? 'http://localhost:8080'
  : 'https://us-central1-macro-coil-194519.cloudfunctions.net';

if (process.env.NSTRUMENTA_LOCAL) {
  console.warn('NSTRUMENTA_LOCAL env var is set. Using local API endpoints');
}

export const endpoints = {
  ADMIN_UTILS: `${BASE_URL}/adminUtils`,
  GET_MACHINES: `${BASE_URL}/getMachines`,
  GET_UPLOAD_URL: `${BASE_URL}/getUploadUrl`,
  GET_UPLOAD_DATA_URL: `${BASE_URL}/getUploadDataUrl`,
  REGISTER_AGENT: `${BASE_URL}/registerAgent`,
  LIST_AGENTS: `${BASE_URL}/listAgents`,
  SET_AGENT_ACTION: `${BASE_URL}/setAgentAction`,
  GET_AGENT_ID_BY_TAG: `${BASE_URL}/getAgentIdByTag`,
  CLEAN_AGENT_ACTIONS: `${BASE_URL}/cleanAgentActions`,
  GET_DOWNLOAD_URL: `${BASE_URL}/getDownloadUrl`,
  GET_PROJECT_DOWNLOAD_URL: `${BASE_URL}/getProjectDownloadUrl`,
  LIST_MODULES: `${BASE_URL}/listModules`,
  GET_TOKEN: `${BASE_URL}/getToken`,
  VERIFY_TOKEN: `${BASE_URL}/verifyToken`,
  VERIFY_API_KEY: `${BASE_URL}/verifyApiKey`,
  SET_STORAGE_OBJECT: `${BASE_URL}/setStorageObject`,
  SET_DATA_METADATA: `${BASE_URL}/setDataMetadata`,
  LIST_STORAGE_OBJECTS: `${BASE_URL}/listStorageObjects`,
  QUERY_DATA: `${BASE_URL}/queryData`,
  v2: {
    LIST_MODULES: `${BASE_URL}/listModulesV2`,
  },
};

export enum ObjectTypes {
  DATA = 'data',
  MODULES = 'modules',
}

export * from './lib';
