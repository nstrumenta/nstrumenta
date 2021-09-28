#!/usr/bin/env node
import { Command } from 'commander';
import { ConnectCli } from './commands/connect';

import { AddKey, ListProjects, SetProject } from './commands/auth';
import { ListMachines } from './commands/machines';

const version = require('../package.json').version;
export interface Keys {
  [key: string]: string;
}

const program = new Command()
  .version(version)
  .option('-d, --debug', 'output extra debugging');

const machineCommand = program.command('machines');
machineCommand
  .command('list')
  .alias('ls')
  .description('List host machines for current project')
  .action(ListMachines);

const authCommand = program.command('auth');
authCommand
  .command('add')
  .description('Add API Key for project')
  .action(AddKey);

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

const connectCommand = program.command('connect');

connectCommand
  .command('cli')
  .argument('[machine name]', 'Machine name')
  .description('Open command line interface (cli) connection to remote machine')
  .action(ConnectCli);

program.parse(process.argv);

const options = program.opts();
if (options.debug) console.log(options);
