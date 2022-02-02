export const DEFAULT_HOST_PORT = '8080';

const BASE_URL = process.env.LOCAL
  ? 'http://localhost:8080'
  : 'https://us-central1-macro-coil-194519.cloudfunctions.net';

export const endpoints = {
  GET_MACHINES: `${BASE_URL}/getMachines`,
  GET_UPLOAD_URL: `${BASE_URL}/getUploadUrl`,
  GET_DOWNLOAD_URL: `${BASE_URL}/getDownloadUrl`,
  LIST_MODULES: `${BASE_URL}/listModules`,
  GET_TOKEN: `${BASE_URL}/getToken`,
  VERIFY_TOKEN: `${BASE_URL}/verifyToken`,
};
