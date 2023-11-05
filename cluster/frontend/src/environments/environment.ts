const firebaseConfig = require("../../../../terraform/firebaseConfig.json")

export const environment = {
  production: false,
  version: require('../../package.json').version + '-dev',
  firebase: firebaseConfig,
};
