#!/usr/bin/env node
import { Command } from 'commander';
import fs from 'fs/promises';
import { AddKey, ListProjects, SetProject } from '../commands/auth';
import {
  AddContext,
  ClearConfig,
  DeleteContext,
  GetCurrentContext,
  ListContexts,
  SetContext,
  SetContextProperty,
} from '../commands/contexts';
import { ListMachines } from '../commands/machines';
import { Module, Publish } from '../commands/publish';
import { Send, Subscribe } from '../commands/pubsub';
import { Serve } from '../commands/serve';
import { asyncSpawn } from './utils';
import { initContexts } from '../lib/context';

export const DEFAULT_HOST_PORT = '8080';

const version = require('../../package.json').version;

export interface Keys {
  [key: string]: string;
}

initContexts();

const program = new Command().version(version).option('-d, --debug', 'output extra debugging');

const machineCommand = program.command('machines');
machineCommand
  .command('list')
  .alias('ls')
  .description('List host machines for current project')
  .action(ListMachines);

const authCommand = program.command('auth');
authCommand.command('add').description('Add API Key for project').action(AddKey);

authCommand
  .command('list')
  .alias('ls')
  .description('List projects with keys stored')
  .action(ListProjects);

authCommand
  .command('set')
  .argument('[id]', 'Project ID')
  .description('Set current project')
  .action(SetProject);

program
  .command('send')
  .argument('[host]', 'websocket host')
  .option('-c,--channel <channel>', 'channel to send')
  .description('send to host on channel')
  .action(Send);

program
  .command('subscribe')
  .argument('[host]', 'websocket host')
  .option('<channel>', 'channel for subscription')
  .option('-m,--message-only', 'parses json and prints only message')
  .description('subscribe to host on channel')
  .action(Subscribe);

program
  .command('serve')
  .option('-p,--port <port>', 'websocket port')
  .option('-d, --debug <debug>', 'output extra debugging')
  .option('--project <project>', 'nstrumenta project Id')
  .description('spin up a pubsub server')
  .action(Serve);

const moduleCommand = program.command('module');
moduleCommand
  .command('publish')
  .option('-n, --name <name>', 'specify single module from config')
  .description('publish modules')
  .action(Publish);

// Do we need a manual agent start, based on the current directory's .nstrumenta config?
const agentCommand = program.command('agent');
agentCommand
  .command('start')
  .option('-n, --name <name>', 'specify single module from config')
  .description('WIP')
  .action(async () => {
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

    const modules: Module[] = config.modules;
    const [module] = modules; // just playing around here

    if (module.type !== 'nodejs') {
      console.log(`for now, nst needs a nodejs script to spawn, not ${module.type}`);
      return;
    }

    const filename = `./${module.folder}/${module.entry}`;
    let result;
    try {
      result = await asyncSpawn('node', [filename]);
    } catch (err) {
      console.log('problem', err);
    }

    console.log('spawned agent ended', result);
  });

const contextCommand = program.command('context');
contextCommand.command('add').description('Add a context').action(AddContext);
contextCommand.command('list').description('List all stored contexts').action(ListContexts);
contextCommand.command('show').description('Show current context').action(GetCurrentContext);
contextCommand.command('delete').description('Delete a context').action(DeleteContext);
contextCommand
  .command('set')
  .description('Set current context to one of the stored contexts')
  .action(SetContext);
contextCommand
  .command('set-property')
  .description('set one of the available properties on the current context')
  .argument('[name]', 'property name')
  .option('-v, --value <value>')
  .action(SetContextProperty);

if (process.env.NODE_ENV === 'development') {
  contextCommand.command('clear').description('** clear all local config!! **').action(ClearConfig);
}

program.parse(process.argv);

const options = program.opts();
if (options.debug) console.log(options);
