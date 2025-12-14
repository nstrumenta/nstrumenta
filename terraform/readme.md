# Terraform

Infrastructure-as-code for provisioning new nstrumenta deployments (Firebase project, GCS bucket, Firestore).

## Setup

```shell
cd terraform
terraform init
terraform workspace new <project-name>
```

Set variables in Terraform Cloud:
- `billing_account`: from https://console.cloud.google.com/billing
- `org_id`: from https://console.cloud.google.com/

## Deploy

```shell
terraform plan
terraform apply
```

After apply, deploy the frontend and set CORS on the storage bucket.

## to Rotate Keys:
```
terraform taint google_service_account_key.server
terraform apply
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


