import { firebaseConfig } from "../../../credentials/firebaseConfig"
export const environment = {
  production: true,
  version: require('../../package.json').version,
  firebase: firebaseConfig,
};
