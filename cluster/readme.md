# start a local nstrumenta cluster that connects to your nstrumenta firebase project

### run prod builds without debugger ports

```shell
docker-compose --env-file=./credentials/local.env -f docker-compose.yml up
```

### run dev

this uses the docker-compose.override.yml that runs dev servers and opens debugger ports for attaching (see e.g. frontend/.vscode/launch.json)

all services:
```shell
docker-compose --env-file=./credentials/local.env up --build
```

no agent:
```shell
docker-compose --env-file=./credentials/local.env up --build --scale agent=0
```

just server:
```shell
docker-compose --env-file=./credentials/local.env up --build server
```