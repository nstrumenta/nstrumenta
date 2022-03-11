import { WriteStream } from 'fs';
import { spawn } from 'child_process';

export async function asyncSpawn(
  cmd: string,
  args?: string[],
  options?: {
    cwd?: string;
    shell?: boolean;
    stdio?: 'pipe' | 'inherit';
    env?: Record<string, string>;
  },
  errCB?: (code: number) => void,
  stream?: WriteStream
) {
  console.log(`spawn [${cmd} ${args?.join(' ')}]`);
  args = args || [];
  options = { ...options };
  const childProcess = spawn(cmd, args, options);

  let output = '';
  let error = '';
  if (stream) {
    childProcess.stdout?.pipe(stream);
  }
  if (childProcess.stdout && childProcess.stderr) {
    for await (const chunk of childProcess.stdout) {
      output += chunk;
    }
    for await (const chunk of childProcess.stderr) {
      error += chunk;
    }
  }
  const code: number = await new Promise((resolve) => {
    childProcess.on('close', resolve);
  });
  if (code) {
    if (errCB) {
      errCB(code);
    }

    throw new Error(`spawned process ${cmd} error code ${code}, ${error}`);
  }

  console.log(`spawn ${cmd} output ${output}`);
  return childProcess;
}
