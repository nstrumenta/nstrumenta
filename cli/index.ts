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
  QueryData,
  QueryModules,
  Unmount as UnmountData,
  Upload as UploadData,
} from './commands/data';
import { ListMachines } from './commands/machines';
import { ListServices, StartService } from './commands/services';
import { CloudRun, Host, List, Publish, Run } from './commands/module';
import { Info as ProjectInfo, ProjectId } from './commands/project';
import { version } from '../lib/version';

export const nstrumentaVersion = version;

const program = new Command()
  .version(nstrumentaVersion, '-v, --version', 'output the current version')
  .option('-d, --debug', 'output extra debugging');

const machineCommand = program.command('machines');
machineCommand
  .command('list')
  .alias('ls')
  .description('List host machines for current project')
  .action(ListMachines);

const servicesCommand = program.command('services');
servicesCommand
  .command('list')
  .alias('ls')
  .description('List cloud run servies for current project')
  .action(ListServices);

servicesCommand
  .command('start')
  .argument('[imageName]', 'docker image for service', 'nstrumenta/agent')
  .option('--containerCommand <containerCommand>', 'command used to launch container')
  .option('--containerPort <containerPort>', 'application port in container')
  .description('start cloud run service')
  .action(StartService);

const projectCommand = program.command('project');
projectCommand.command('id').alias('name').description('print project id').action(ProjectId);
projectCommand
  .command('info')
  .alias('describe')
  .description('Read project info')
  .action(ProjectInfo);

const moduleCommand = program.command('module');
moduleCommand
  .command('publish')
  .option('-n, --name <name>', 'specify single module from config')
  .description('publish modules')
  .action(Publish);

moduleCommand
  .command('run')
  .argument('[module]', 'module to run')
  .option('--module-version <version>', 'optional specific version - otherwise will use latest')
  .option('--command-args <command-args...>', 'arguments to append to module command')
  .description('run module')
  .action(Run);

moduleCommand
  .command('cloud-run')
  .argument('[module]', 'module to run')
  .option('--module-version <version>', 'optional specific version - otherwise will use latest')
  .option('--command-args <command-args...>', 'arguments to append to module command')
  .option('--image <image>', 'image to use for the cloud run job')
  .description('run module on cloud')
  .action(CloudRun);

moduleCommand
  .command('host')
  .argument('<module>', 'module to host on cloud storage')
  .option('--module-version <version>', 'optional specific version - otherwise will use latest')
  .description('host published module on cloud storage')
  .action(Host);

moduleCommand
  .command('list')
  .description('list modules published in current project')
  .option('--filter <filter>', 'filter string to match')
  .option('--depth <depth>', 'depth of object to print')
  .option('--json', 'output json')
  .action(async (options) => {
    const result = await List(options);
    if (options.json && result) {
      console.log(JSON.stringify(result, null, 2));
    }
  });
moduleCommand
  .command('query')
  .description('query modules with field, comparison, compareValue')
  .option('--field <field>', 'field to query, e.g. name')
  .option(
    '--comparison <comparison>',
    `comparison: one of < <= == > >= != array-contains array-contains-any in not-in`
  )
  .option('--compareValue <compareValue>', 'value for compare')
  .action(QueryModules);
const agentCommand = program.command('agent');
agentCommand
  .command('start')
  .option('-p,--port <port>', 'websocket port', '8088')
  .option('-d, --debug', 'output extra debugging', false)
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
  .option('--overwrite', 'allow overwrite existing filename if dataId is specified')
  .argument('<filename...>', 'filename(s) to upload')
  .description('Upload file to project data')
  .action(UploadData);
dataCommand
  .command('query')
  .description('query data with field, comparison, compareValue')
  .option('--field <field>', 'field to query, e.g. name')
  .option(
    '--comparison <comparison>',
    `comparison: one of < <= == > >= != array-contains array-contains-any in not-in`
  )
  .option('--compareValue <compareValue>', 'value for compare')
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
