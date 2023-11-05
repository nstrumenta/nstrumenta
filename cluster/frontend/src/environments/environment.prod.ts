const firebaseConfig = require("../../../../terraform/firebaseConfig.json")

export const environment = {
  production: true,
  version: require('../../package.json').version,
  firebase: firebaseConfig,
};
