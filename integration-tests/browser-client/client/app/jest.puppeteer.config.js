const { exec } = require('child_process');

module.exports = {
  server: {
    command: 'npm run serve',
    port: 3000,
    launchTimeout: 10000,
    debug: true,
  },
  launch: {
    headless: !(process.env.NON_HEADLESS === 'true'),
    slowMo: false,
    devtools: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    executablePath: '/usr/bin/chromium',
  },
  browserContext: 'default',
};
