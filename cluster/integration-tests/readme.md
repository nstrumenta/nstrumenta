# integration tests

docker-compose files in subfolders, each of which can test e.g. a specific client or configurations of agents, backplane, cli features, and web-app features

### Running a test suite

run docker-compose from a folder containing a docker-compose.yml file. Have TEST_ID and NSTRUMENTA_API_KEY variables set, these will be pulled into the containers via the docker-compose file in the folder and will be used in CI testing.

https://nstrumenta.com/projects/integration-tests/overview

```shell
nodejs-client % TEST_ID=`uuidgen` NSTRUMENTA_API_KEY=[apikey] docker-compose up --build
```


## running with environment file

```shell
ENVFILE=../credentials/.env ./ci.sh
```

with dotenv for running dev
```shell
npx dotenv -e ../../../../credentials/local.env -- bash -c 'echo $NSTRUMENTA_API_URL'
```


### write tests in ts-jest


