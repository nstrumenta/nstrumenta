import { spawn } from 'child_process';
import { WriteStream } from 'fs';
import fs from 'fs/promises';
import path from 'path';

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

export const getNstDir = async () => {
  const cwd = `${__dirname}/.nst`;

  await fs.mkdir(cwd, { recursive: true });

  try {
    const stat = await fs.stat(cwd);
    if (!stat.isDirectory()) {
      throw new Error('no .nst temp dir');
    }
  } catch (err) {
    console.warn((err as Error).message);
    throw err;
  }
  return cwd;
};

export const getNearestConfigJson = async () => {
  let currentDir = '';
  let nextDir = process.cwd();
  let file;

  while (!file && currentDir !== nextDir) {
    try {
      currentDir = nextDir;
      file = await fs.readFile(path.join(currentDir, `.nstrumenta/config.json`), {
        encoding: 'utf8',
      });
    } catch (error) {
      nextDir = path.join(currentDir, '..');
    }
  }

  if (file === undefined) {
    throw new Error('No nstrumenta config found');
  }
  return { file, cwd: currentDir };
};

export async function* walkDirectory(
  dir: string,
  { maxDepth }: { maxDepth?: number } = {}
): AsyncGenerator<string> {
  const max = maxDepth ? maxDepth : Infinity;
  for await (const file of await fs.opendir(dir)) {
    if (max < 1) continue;
    const entry = path.join(dir, file.name);
    if (file.isDirectory()) yield* walkDirectory(entry, { maxDepth: max - 1 });
    else if (file.isFile()) yield entry;
  }
}
