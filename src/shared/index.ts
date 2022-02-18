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
  GET_BACKPLANE_URL: `${BASE_URL}/getBackplaneUrl`,
  GET_DOWNLOAD_URL: `${BASE_URL}/getDownloadUrl`,
  LIST_MODULES: `${BASE_URL}/listModules`,
  GET_TOKEN: `${BASE_URL}/getToken`,
  VERIFY_TOKEN: `${BASE_URL}/verifyToken`,
};
