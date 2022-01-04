const BASE_URL = process.env.LOCAL
  ? 'http://localhost:8080'
  : 'https://us-central1-macro-coil-194519.cloudfunctions.net';

export const endpoints = {
  GET_MACHINES: `${BASE_URL}/getMachines`,
  GET_SIGNED_UPLOAD_URL: `${BASE_URL}/getSignedUploadUrl`,
  GET_TOKEN: `${BASE_URL}/getToken`,
  VERIFY_TOKEN: `${BASE_URL}/verifyToken`,
};
