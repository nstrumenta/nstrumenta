# nstrumenta

### [nstrumenta cli](#cli)

Use the cli to:

- subscribe and send to a websocket server and pipe between files or processes
- ~~manage~~ list your vm servers
- ~~send your sandbox~~

### [nstrumenta javascript client module](#module)

The client module can be imported in node or web based javascript

## <a name="cli"></a>cli

### quickstart

1. Have a project on nstrumenta
2. Get yourself an api key for remote access to that project from https://nstrumenta.com/projects/[project name]/settings
3. Install and configure

```console
$ npm i -g nstrumenta
$ nstrumenta auth add
```

4. When prompted, enter the project id and the api key

5. start an agent that will be able to run modules

```console
$ nstrumenta agent start
```

## cli reference

### install

```
$ npm install -g nstrumenta
```

### usage

```
nstrumenta [command] {arguments --options}
```

- Note: `[command]` is required, and `[arguments]` are required or `{optional}`

nstrumenta will save your configuration scoped to the current user. Within this configuration, you can define a set of contexts which will store information about the project you're currently working with and how you want to interact with this project. You can set the working project, a websocket server to work to act as a broker for all your sensor and client interactions, the channel you want to communicate with, etc. These settings can be overridden with arguments and options if needed.

### commands

- [auth](#auth)
- [context](#context)
- [machines](#machines)
- [subscribe](#subscribe)
- [send](#send)
- [module](#module)
- [agent](#module) _need doc_

---

### <a name="auth"></a> auth

Manage project api keys

e.g. `nstrumenta auth set PROJECT_NAME`

###### subcommands:

`add` _add an api key associated with a project. You'll be prompted for the project name and the api key._

> Generate a project scoped api key from https://nstrumenta.com/projects/[your-project-name]/settings

`set PROJECT_NAME` s*et the current working project. This affects the current context. If you don't supply an argument, you'll be prompted to select one of projects already configured*

`list / ls` _list all locally configured projects_

---

### <a name="context"></a> context

Manage local contexts

e.g. `nstrumenta context set-property wsHost --value ws://localhost:8088`

There will always be a default context, which is editable. Additional contexts can be added to work locally or remotely within the same project, for instance, or to work with different projects or to stream to different channels.

###### subcommands:

`add CONTEXT_NAME`

`list` _List all context names_

`show` _Display the values of the properties of the current context_

`delete`

`set {CONTEXT_NAME}` _Will prompt to select an existing context if no arg_

Set the current working context

`set-property {PROPERTY_NAME} --{value | v VALUE}`
_Set a property in the current context. Only a valid property can be set — run without argument to be presented with an option list of possible properties_

---

### <a name="machines"></a> machines

Manage hosted virtual machines

###### subcommands:

`list | ls` _List running virtual machines_

---

### <a name="subscribe"></a> subscribe

Subscribe to a channel on the websocket host.

```
subscribe {WS_HOST} --{channel | c CHANNEL}
```

Will use the current context for configuration if no args/options.

---

### <a name="send"></a>send

Send to a channel on the websocket host. Pipe a process reading from a sensor into `nstrumenta send`

```
send {WS_HOST} --{channel | c CHANNEL}
```

Will use the current context for configuration if no args/options.

---

#### agent start

Start websocket pubsub host locally

```console
$ nstrumenta agent serve
```

The output is similar to the following

```shell
port:  8088
listening on *:8088
```

Websockets provide a full duplex, always on message based connection. The server will _receive_ messages from a **sender** on a specified channel, and will _broadcast_ messages to all **subscribers** to that channel. These subscribers and senders can be isntantiated with the cli for piping between processes, or can be created and used in a node or web based app using the nstrumenta [client module](#module).

### <a name="module"></a> module

Manage modules

examples:

```shell
# publishes all modules listed in .nstrumenta/config.json
nst module publish

# publish a single named module, listed in .nstrumenta/config.json
nst module publish gpio-rpi
```

Modules are referenced in `.nstrumenta/config.json`

```json
{
  "modules": [
    {
      "name": "gpio-rpi",
      "folder": "./gpio-rpi",
      "config": "module.json"
    },
    {
      // ...
    }
  ],
  "stacks": [
    // all modules running in the stack
    // channel mappings (graph definition)
  ]

  // ...
}
```

The modules are configured within their respective folders in the `config` file, with the properties in the following example:

```json
{
  "type": "nodejs",
  "name": "gpio-rpi",
  "run": "npm run start",
  "version": "0.0.13",
  "excludes": ["node_modules/"], // optional
  "channels": [{ "channel": "gpio-in", "type": "subscribe" }]
}
```

`type` can be _nodejs_, _sandbox_ (for web app sandboxes), or _algorithm_
`run` is the command to run when an agent loads a module
`version` is a unique semver string; publishing with an existing version will fail
`excludes` defaults to `["node_modules"]`; is a list of patterns to exclude from the module folder when publishing. Publishing with node modules is unnecessary and will consume excessive space.

###### subcommands:

`publish {MODULE_NAME}`

Publish modules. If no MODULE_NAME is given, all the modules lsited in project config (`.nstrumenta/config.json`) will be published

---

## <a name="module"></a> Client Module

### Install

Install the nstrumenta package in a javascript project:

```console
$ npm i nstrumenta
$ nstrumenta auth add
```

Usage

```javascript
// index.js
const { NstrumentaClient } = require('nstrumenta/dist/module/client');
const nst = new NstrumentaClient({ hostUrl: 'ws://localhost:8088' });

nst.addListener('open', () => {
  nst.subscribe('CHANNEL', (event) => {
    console.log(event);
  });
});
```

```console
$ node index.js
```

### to dev on nst-server
you can link the module by
```shell
nstrumenta$ npm link
...
app$ npm link nstrumenta
```

and then for hot rebuilding
```
npx nodemon --exec "npm run build" --watch ./src
```
