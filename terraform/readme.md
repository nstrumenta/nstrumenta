# terraform for nstrumenta project setup
use terraform to create new client deployment
based on https://firebase.google.com/docs/projects/terraform/get-started


## terraform 
the following commands are intended to run in the terraform folder
```
cd terraform
```

### terraform init
```
terraform init
```
this will connect to the terraform cloud backend, which stores the state of all workspaces and gcloud

### set workspace
```
terraform workspace new [project name]
```

### set terraform vars in terraform cloud
```
billing_account =  [find or create in https://console.cloud.google.com/billing]
org_id          = [find in https://console.cloud.google.com/ ]
```

### plan
```
terraform plan
```

### apply
optionally apply target google_project_service.fs to enable apis (they are asynchronous, so this avoids errors during the first apply, but re-running plan again works as well)
```
terraform apply -target=google_project_service.fs
```

then apply as normal:
```
terraform apply
```


## extra steps

### deploy frontend

### set cors on firebase bucket
### gcloud auth with user account
```
gcloud auth application-default login
```


### gcloud auth with service account WIP
```
gcloud auth activate-service-account --key-file [path to key-file]
```




## if not using terraform cloud
### gcloud auth with user account
```
gcloud auth application-default login
```


### gcloud auth with service account
```
gcloud auth activate-service-account --key-file [path to key-file]
```


