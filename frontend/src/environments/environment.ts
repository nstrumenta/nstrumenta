import firebaseConfig from './firebaseConfig.json';
import packageJson from '../../package.json';

export const environment = {
  production: false,
  version: packageJson.version + '-dev',
  firebase: firebaseConfig,
};
