use terraform to create new client deployment


### gcloud auth with service account
```
gcloud auth activate-service-account --key-file [path to key-file]
```


### gcloud auth with user account
```
gcloud auth application-default login
```


## terraform 
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
```
terraform apply
```