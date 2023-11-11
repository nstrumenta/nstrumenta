to validate, run the circleci command line
can be run with docker:
https://github.com/CircleCI-Public/circleci-cli#docker

from the top level dir:
```shell
docker run --rm -v $(pwd):/data -w /data circleci/circleci-cli:alpine config validate /data/.circleci/config.yml --token $TOKEN
```