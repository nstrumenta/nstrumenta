import { spawn } from 'child_process';

export async function asyncSpawn(
  cmd: string,
  args?: string[],
  options?: { cwd?: string; showOutput?: boolean; env?: Record<string, string>; quiet?: boolean },
  errCB?: (code: number) => void
) {
  if (!options?.quiet) console.log(`spawn [${cmd} ${args?.join(' ')}]`);
  const process = spawn(cmd, args || [], options);

  let output = '';
  process.stdout.on('data', (chunk: Buffer) => {
    output += chunk;
    if (options?.showOutput) {
      console.log(chunk.toString());
    }
  });
  let stderrOutput = '';
  process.stderr.on('data', (chunk: Buffer) => {
    stderrOutput += chunk;
    if (options?.showOutput) {
      console.log(chunk.toString());
    }
  });

  const code: number = await new Promise((resolve, reject) => {
    process.on('close', resolve);
    process.on('error', reject);
  });
  if (code) {
    if (errCB) {
      errCB(code);
    }

    throw new Error(`spawned process ${cmd} error code ${code}, ${stderrOutput}`);
  }

  if (!options?.quiet) console.log(`spawn ${cmd} output ${output}`);
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
  const args = data.data.args;

  console.log({ moduleName, version, args });

  const res = await asyncSpawn('nst', [
    'module',
    'run',
    moduleName,
    '--module-version',
    version,
    '--command-args',
    ...args,
  ]);

  return `createRunModuleTask complete ${res}`;
}

createRunModuleTask();
