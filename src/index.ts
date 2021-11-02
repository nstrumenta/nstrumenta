#!/usr/bin/env node
import { Command } from 'commander';
import { AddKey, ListProjects, SetProject } from './commands/auth';
import { ListMachines } from './commands/machines';
import { Publish, Subscribe } from './commands/pubsub';
import { Serve } from './commands/serve';

export const DEFAULT_HOST_PORT = '8080';

const version = require('../package.json').version;
export interface Keys {
  [key: string]: string;
}

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
  .command('publish')
  .argument('<host>', 'websocket host')
  .argument('<channel>', 'channel to publish')
  .description('publish to host on channel')
  .action(Publish);

program
  .command('subscribe')
  .argument('<host>', 'websocket host')
  .argument('<channel>', 'channel for subscription')
  .option('-m,--message-only', 'parses json and prints only message')
  .description('subscribe to host on channel')
  .action(Subscribe);

program
  .command('serve')
  .option('-p,--port <port>', 'websocket port', '8088')
  .option('-d, --debug <debug>', 'output extra debugging')
  .option('--project <project>', 'nstrumenta project Id')
  .description('spin up a pubsub server')
  .action(Serve);

program.parse(process.argv);

const options = program.opts();
if (options.debug) console.log(options);
