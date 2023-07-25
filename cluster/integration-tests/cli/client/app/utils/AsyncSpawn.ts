import { spawn } from 'child_process';

export async function asyncSpawn(
  cmd: string,
  args?: string[],
  options?: { cwd?: string; env?: Record<string, string>; quiet?: boolean },
  errCB?: (code: number) => void
) {
  if (!options?.quiet) console.log(`spawn [${cmd} ${args?.join(' ')}]`);
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
    if (errCB) {
      errCB(code);
    }

    throw new Error(`spawned process ${cmd} error code ${code}, ${error}`);
  }
  if (!options?.quiet) {
    console.log(`spawn ${cmd} output: ${output} stderr: ${error}`);
  }
  return output;
}

