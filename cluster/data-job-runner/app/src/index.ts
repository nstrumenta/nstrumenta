import { spawn } from 'child_process';

async function asyncSpawn(cmd: string, args?: string[], options?: { cwd?: string }) {
  console.log(`${cmd} ${args?.join(' ')}`);
  const process = spawn(cmd, args || [], options);

  let output = '';
  for await (const chunk of process.stdout) {
    output += chunk;
  }
  let error = '';
  for await (const chunk of process.stderr) {
    error += chunk;
  }
  const code: number = await new Promise((resolve) => {
    process.on('close', resolve);
  });
  if (code) {
    throw new Error(`spawned process ${cmd} error code ${code}, ${error}`);
  }

  console.log(`${cmd} ${args?.join(' ')}`, output, error);
  return output;
}

async function createRunModuleTask() {
  console.log(process.env);

  if (!process.env.ACTION_DATA) {
    console.log('ACTION_DATA not present');
    return;
  }

  const data = JSON.parse(atob(process.env.ACTION_DATA));

  const moduleName = data.data.module.name;
  const version = data.data.module.version;
  const args = data.data.args.slice(1);

  console.log({ moduleName, version, args });

  const res = await asyncSpawn('nst', [
    'module',
    'run',
    moduleName,
    '--version',
    version,
    '--',
    ...args,
  ]);

  return `createRunModuleTask complete ${res}`;
}

createRunModuleTask();
