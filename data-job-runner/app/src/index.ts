import { Run } from 'nstrumenta/cli/commands/module';

async function createRunModuleTask() {
  console.log(process.env.ACTION_DATA);

  if (!process.env.ACTION_DATA) {
    console.log('ACTION_DATA not present');
    return;
  }

  const data = JSON.parse(atob(process.env.ACTION_DATA));

  let moduleName = data.data.module.name;
  let version = data.data.module.version;
  const args = data.data.args;

  if (moduleName.endsWith('.tar.gz')) {
    const versionMatch = /(\d+)\.(\d+)\.(\d+)(?:-[\w\d\.]+)?/.exec(moduleName);
    if (versionMatch) {
      const extractedVersion = versionMatch[0];
      moduleName = moduleName.replace(`-${extractedVersion}.tar.gz`, '');
      if (!version) {
        version = extractedVersion;
      }
    }
  }

  console.log({ moduleName, version, args });

  await Run(moduleName, { moduleVersion: version, commandArgs: args });

  return `createRunModuleTask complete`;
}

createRunModuleTask();
