const { teardown } = require("jest-environment-puppeteer");

/**
 * Sets up the environment for running tests with Jest
 */
export default async () => {
  // do stuff which needs to be done before all tests are executed
  console.log("Jest globalTeardown");
  await teardown();
};
