import { firebaseConfig } from "../../../credentials/firebaseConfig"

export const environment = {
  production: false,
  version: require('../../package.json').version + '-dev',
  firebase: firebaseConfig,
};
