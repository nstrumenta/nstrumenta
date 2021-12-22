import fs from 'fs/promises';

export type ModuleTypes = 'sandbox' | 'nodejs' | 'algorithm';

export interface Module {
  type: ModuleTypes;
  name: string;
  folder: string;
  entry: string;
}

// map of module types to upload promises
const uploadHandlers: Record<ModuleTypes, (module: Module) => Promise<unknown>> = {
  sandbox: (module) => {
    console.log(`sandbox ${module.name}`);
    // return uploadSandboxFromFolder(module, projectDir, projectId, commitId); // <<= expand this fn right here
    return new Promise((res) => res); // TODO: wip
  },
  nodejs: (module: Module) => new Promise((res) => res), // placeholder
  algorithm: (module: Module) => new Promise((res) => res), // placeholder
};

export const Publish = async ({ name }: { name?: string }) => {
  let config: { [key: string]: unknown; modules: Module[] };
  try {
    config = JSON.parse(
      await fs.readFile(`.nstrumenta/config.json`, {
        encoding: 'utf8',
      })
    );
  } catch (error) {
    throw Error(error as string);
  }

  const modules = name ? config.modules.filter((m) => m.name === name) : config.modules;
  console.log('modules: ', modules);
  const promises = modules.map((module) => uploadHandlers[module.type]);
  const results = await Promise.all(promises);

  console.log(results);
};
