#!/usr/bin/env node
import { Command } from 'commander';
import { DEFAULT_HOST_PORT, getEndpoints } from '../shared';
import { initContexts } from '../shared/lib/context';
import {
  CleanActions as CleanAgentActions,
  List as ListAgents,
  RunModule,
  SetAction as SetAgentAction,
  Start,
} from './commands/agent';
import { AddKey, ListProjects, SetProject } from './commands/auth';
import {
  AddContext,
  ClearConfig,
  DeleteContext,
  GetCurrentContext,
  ListContexts,
  SetContext,
  SetContextProperty,
} from './commands/contexts';
import { ListMachines } from './commands/machines';
import { List, Publish, Run } from './commands/module';
import { Send, Subscribe } from './commands/pubsub';
import {
  List as ListData,
  Upload as UploadData,
  Query as QueryData,
  Get as GetData,
} from './commands/data';
import axios from 'axios';
import { resolveApiKey } from './utils';

const version = require('../../package.json').version;

const endpoints = process.env.NSTRUMENTA_LOCAL ? getEndpoints('local') : getEndpoints('prod');

initContexts();

const program = new Command()
  .version(version, '-v, --version', 'output the current version')
  .option('-d, --debug', 'output extra debugging');

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

const moduleCommand = program.command('module');
moduleCommand
  .command('publish')
  .option('-n, --name <name>', 'specify single module from config')
  .description('publish modules')
  .action(Publish);

moduleCommand
  .command('run')
  .option('-n, --name <name>', 'specify module name')
  .option(
    '-l, --local',
    'require module locally in the current .nstrumenta project dir; --name also required here'
  )
  .option('-p, --path <path>', 'specify path (complete filename) of published module')
  .option('--non-interactive', 'requires module name, uses latest version from server')
  .description('run module')
  .action(Run);

moduleCommand
  .command('list')
  .option('-v, --verbose', 'verbose listing including versions, metadata')
  .description('list modules published in current project')
  .action(List);

const agentCommand = program.command('agent');
agentCommand
  .command('start')
  .option('-p,--port <port>', 'websocket port', DEFAULT_HOST_PORT)
  .option('-d, --debug <debug>', 'output extra debugging', false)
  .option('--project <project>', 'nstrumenta project Id')
  .option('-t,--tag <tag>', 'optional tag - removes tag from any agent that might already have it')
  .description('start agent')
  .action(Start);

agentCommand
  .command('run-module')
  .option('--agentId [agentId]', 'agent Id')
  .option('-m,--module [module]', 'name of the module to run')
  .option('-t,--tag [tag]', 'tag in lieu of agentId')
  .description('run module on an active agent')
  .action(RunModule);

agentCommand.command('list').description('list running agents in project').action(ListAgents);
agentCommand
  .command('set-action')
  .argument('[agentId]', 'agent Id')
  .option('-a,--action <action>', 'action to set')
  .option('-t,--tag <tag>', 'specify tag in lieu of agentId')
  .description('sets action on agent')
  .action(SetAgentAction);

agentCommand
  .command('clean-actions')
  .argument('[agentId]', 'agent Id')
  .description('cancels all pending actions for an agent')
  .action(CleanAgentActions);

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

const dataCommand = program.command('data');
dataCommand
  .command('list')
  .option('-v, --verbose', 'include metadata')
  .description('List data files within project')
  .action(ListData);
dataCommand
  .command('upload')
  .option('-t, --tags <tags...>')
  .option('--dataId <dataId>')
  .argument('<filename...>', 'filename to upload')
  .description('Upload file to project data')
  .action(UploadData);
dataCommand
  .command('query')
  .option('-t, --tag <tag...>')
  .option('-f, --id <id...>')
  .option('-b, --before <before>', 'before timestamp')
  .option('-a, --after <after>', 'after timestamp')
  .option('-l, --limit <limit>', 'default to 1')
  .option('-n, --filenames <filenames...>', 'filenames to filter by')
  .option('--metadata <metadata>', 'metadata to filter by, stringified json')
  .description('Get data by name, tags, or date range')
  .action(QueryData);
dataCommand
  .command('get')
  .option('-t, --tag <tag...>')
  .option('-f, --file <file...>')
  .option('-b, --before <before>', 'before timestamp')
  .option('-a, --after <after>', 'after timestamp')
  .option('-l, --limit <limit>', 'default to 1')
  .option('-n, --filenames <filenames...>', 'filenames to filter by')
  .option('--metadata <metadata>', 'metadata to filter by, stringified json')
  .option('-o --output <output>', 'output directory')
  .description('Download data by name, tags, or date range')
  .action(GetData);

const adminUtilsCommand = program.command('admin-utils', '', { hidden: true });
adminUtilsCommand
  .description(
    "Reference already stored modules in db (newly published modules shouldn't need this)"
  )
  .argument('[name]', '')
  .action(function Admin(name: string) {
    if (!name) {
      console.log('util name required');
      return;
    }
    const apiKey = resolveApiKey();
    console.log(`to call ${endpoints.ADMIN_UTILS}: apiKey: ${apiKey}: ${name}`);
    axios
      .post(
        endpoints.ADMIN_UTILS,
        { name },
        {
          headers: { 'x-api-key': apiKey, 'content-type': 'application/json' },
        }
      )
      .then((result) => {
        console.log(JSON.stringify(result.data));
      })
      .catch(() => {
        console.log('something went wrong');
      });
  });

program.parse(process.argv);

const options = program.opts();
if (options.debug) console.log(options, program.args);
