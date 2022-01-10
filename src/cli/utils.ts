import { spawn } from 'child_process';
import fs from 'fs/promises';

export async function asyncSpawn(
  cmd: string,
  args?: string[],
  options?: { cwd?: string; shell?: boolean },
  errCB?: (code: number) => void
) {
  console.log(`spawn [${cmd} ${args?.join(' ')}]`);
  const process = spawn(cmd, args, options);

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
    if (errCB) {
      errCB(code);
    }

    throw new Error(`spawned process ${cmd} error code ${code}, ${error}`);
  }

  console.log(`spawn ${cmd} output ${output}`);
  return output;
}

export const getTmpDir = async () => {
  const cwd = `${__dirname}/.nst`;

  try {
    await fs.mkdir(cwd);
  } catch (err) {
    // exists... hopefully?
  }

  try {
    const stat = await fs.stat(cwd);
    if (!stat.isDirectory()) {
      throw new Error('no .nst temp dir');
    }
  } catch (err) {
    console.warn((err as Error).message);
    throw err;
  }

  console.log(`get .nst temp dir: ${cwd}`);
  return cwd;
};
