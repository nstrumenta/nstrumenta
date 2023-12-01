import firebaseConfig from './firebaseConfig.json';

export const environment = {
  production: true,
  version: require('../../package.json').version,
  firebase: firebaseConfig,
};
