#!/usr/bin/env node
import { Command } from 'commander';
import {
  CleanActions as CleanAgentActions,
  List as ListAgents,
  RunModule,
  SetAction as SetAgentAction,
  Start,
} from './commands/agent';
import {
  Get as GetData,
  List as ListData,
  Mount as MountData,
  Query as QueryData,
  Unmount as UnmountData,
  Upload as UploadData,
} from './commands/data';
import { ListMachines } from './commands/machines';
import { CloudRun, List, Publish, Run } from './commands/module';
import { Send, Subscribe } from './commands/pubsub';

const version = require('../../package.json').version;

const program = new Command()
  .version(version, '-v, --version', 'output the current version')
  .option('-d, --debug', 'output extra debugging');

const machineCommand = program.command('machines');
machineCommand
  .command('list')
  .alias('ls')
  .description('List host machines for current project')
  .action(ListMachines);

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
  .option('--module-version [version]', 'version of the module to run')
  .description('run module')
  .action(Run);

moduleCommand
  .command('cloud-run')
  .argument('[module]', 'module to run')
  .option('--version <version>', 'optional specific version - otherwise will use latest')
  .description('run module on cloud')
  .action(CloudRun);

moduleCommand.command('list').description('list modules published in current project').action(List);

const agentCommand = program.command('agent');
agentCommand
  .command('start')
  .option('-p,--port <port>', 'websocket port', '8088')
  .option('-d, --debug <debug>', 'output extra debugging', 'false')
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

const dataCommand = program.command('data');
dataCommand
  .command('list')
  .option('-v, --verbose', 'include metadata')
  .description('List data files within project')
  .action(ListData);
dataCommand
  .command('mount')
  .description('mount data to local filesystem (requires gcsfuse)')
  .action(MountData);
dataCommand.command('unmount').description('unmount previously mounted data').action(UnmountData);
dataCommand
  .command('upload')
  .option('-t, --tags <tags...>')
  .option('--dataId <dataId>')
  .option('--overwrite', 'allow overwrite existing filename if dataId is specified')
  .argument('<filename...>', 'filename(s) to upload')
  .description('Upload file to project data')
  .action(UploadData);
dataCommand
  .command('query')
  .option('-t, --tag <tag...>')
  .option('--id <id>')
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
  .option('--id <id>')
  .option('-b, --before <before>', 'before timestamp')
  .option('-a, --after <after>', 'after timestamp')
  .option('-l, --limit <limit>', 'default to 1')
  .option('-n, --filenames <filenames...>', 'filenames to filter by')
  .option('--metadata <metadata>', 'metadata to filter by, stringified json')
  .option('-o --output <output>', 'output directory')
  .description('Download data by name, tags, or date range')
  .action(GetData);

program.parse(process.argv);

const options = program.opts();
if (options.debug) console.log(options, program.args);
