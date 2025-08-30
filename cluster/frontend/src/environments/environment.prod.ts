import firebaseConfig from './firebaseConfig.json';
import packageJson from '../../package.json';

export const environment = {
  production: true,
  version: packageJson.version,
  firebase: firebaseConfig,
};
