import { Command } from 'commander'

const program = new Command()
    .version('0.0.1')
    .option('-d, --debug', 'output extra debugging')
    // .command('run [algorithm] [input]', 'run algorithm on input')

program.parse(process.argv)

const options = program.opts()
if (options.debug) console.log(options)
console.log("hello world", options)


// can't use redirects or pop-ups  - might use email password, or could require an nstrumenta API key