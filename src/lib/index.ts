export { NstrumentaClient } from './client';
export {
  BusMessage,
  deserializeBlob,
  deserializeWireMessage,
  makeBusMessageFromJsonObject,
} from './busMessage';
export { asyncSpawn } from './utils';

// TODO: add a local bool to context to handle this; or something like that
export const endpoints = process.env.LOCAL
  ? {
      GET_MACHINES: 'http://localhost:8080',
      GET_SIGNED_UPLOAD_URL: 'http://localhost:8080',
    }
  : {
      GET_MACHINES: 'https://us-central1-macro-coil-194519.cloudfunctions.net/getMachines',
      GET_SIGNED_UPLOAD_URL:
        'https://us-central1-macro-coil-194519.cloudfunctions.net/getSignedUploadUrl',
    };
