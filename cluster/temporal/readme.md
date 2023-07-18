# temporal server executable for task management

https://docs.temporal.io/kb/all-the-ways-to-run-a-cluster


build and run locally:
```shell
docker build -t temporal .
docker run -p 7233:7233 -p 8233:8233 temporal
```

build and push to google container registry

```shell
docker build -t gcr.io/GCP_PROJECT_NAME/temporal:1 .
```

```shell
docker push gcr.io/GCP_PROJECT_NAME/temporal:1   
```




