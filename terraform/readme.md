# terraform for nstrumenta project setup
use terraform to create new client deployment
based on https://firebase.google.com/docs/projects/terraform/get-started


### gcloud auth with user account
```
gcloud auth application-default login
```


### gcloud auth with service account WIP
```
gcloud auth activate-service-account --key-file [path to key-file]
```


## terraform 

### terraform init
```
terraform init
```


### set workspace
```
terraform workspace new [project name]
```

### add variables to terraform.tfvar
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

