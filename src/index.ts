import { Command } from 'commander';

import { auth, machine } from './commands/index.js';

export interface Keys {
  [key: string]: string;
}

const program = new Command().version('0.0.1').option('-d, --debug', 'output extra debugging');
// .command('run [algorithm] [input]', 'run algorithm on input')

// TODO: figure some better structure later;
const machineCommand = program.command('machine');
machineCommand
  .command('list')
  .alias('ls')
  .description('List host machines for current project')
  .action(machine.list);

const authCommand = program.command('auth');
authCommand.command('add').description('Add API Key for project').action(auth.addKey);

authCommand.command('list').description('List projects with keys stored').action(auth.list);

authCommand
  .command('set')
  .argument('[id]', 'Project ID')
  .description('Set current project')
  .action(auth.setProject);

program.parse(process.argv);

const options = program.opts();
if (options.debug) console.log(options);

// can't use redirects or pop-ups  - might use email password, or could require an nstrumenta API key
