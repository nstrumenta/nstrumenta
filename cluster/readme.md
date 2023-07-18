# start a local nstrumenta cluster that connects to your nstrumenta firebase project

### run prod builds without debugger ports

```shell
cluster % NSTRUMENTA_API_KEY=[api key] NSTRUMENTA_API_URL=[server url (required for cloud run)] docker-compose -f docker-compose.yml up
```

### run dev

this uses the docker-compose.override.yml that runs dev servers and opens debugger ports for attaching (see e.g. frontend/.vscode/launch.json)

```shell
cluster % NSTRUMENTA_API_KEY=[api key] NSTRUMENTA_API_URL=[server url (required for cloud run)] docker-compose up
```
