import { firebaseConfig } from "./firebaseConfig"

export const environment = {
  production: false,
  version: require('../../package.json').version + '-dev',
  firebase: firebaseConfig,
};
