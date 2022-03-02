export const DEFAULT_HOST_PORT = '8088';

const BASE_URL = process.env.NSTRUMENTA_LOCAL
  ? 'http://localhost:8080'
  : 'https://us-central1-macro-coil-194519.cloudfunctions.net';

if (process.env.NSTRUMENTA_LOCAL) {
  console.warn('NSTRUMENTA_LOCAL env var is set. Using local API endpoints');
}

export const endpoints = {
  GET_MACHINES: `${BASE_URL}/getMachines`,
  GET_UPLOAD_URL: `${BASE_URL}/getUploadUrl`,
  REGISTER_AGENT: `${BASE_URL}/registerAgent`,
  LIST_AGENTS: `${BASE_URL}/listAgents`,
  SET_AGENT_ACTION: `${BASE_URL}/setAgentAction`,
  CLEAN_AGENT_ACTIONS: `${BASE_URL}/cleanAgentActions`,
  GET_DOWNLOAD_URL: `${BASE_URL}/getDownloadUrl`,
  LIST_MODULES: `${BASE_URL}/listModules`,
  GET_TOKEN: `${BASE_URL}/getToken`,
  VERIFY_TOKEN: `${BASE_URL}/verifyToken`,
};
