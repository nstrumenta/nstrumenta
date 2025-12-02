variable "billing_account" {
  type = string
}

variable "org_id" {
  type = string
}

variable "image_version_tag" {
  description = "The version tag of the image for the server and data-job-runner"
  type = string
  default = "latest"
}

variable "location_id" {
  type    = string
  default = "us-west1"
}

# Creates a new Google Cloud project.
resource "google_project" "fs" { # fs = Firestore + Storage
  provider        = google-beta.no_user_project_override
  name            = terraform.workspace
  project_id      = terraform.workspace
  org_id          = var.org_id
  billing_account = var.billing_account

  # Required for the project to display in a list of Firebase projects.
  labels = {
    "firebase" = "enabled"
  }
}

# Enables required APIs.
resource "google_project_service" "fs" {
  provider = google-beta.no_user_project_override
  project  = google_project.fs.project_id
  for_each = toset([
    "serviceusage.googleapis.com",
    "cloudresourcemanager.googleapis.com",
    "run.googleapis.com",
    "secretmanager.googleapis.com",
    "firebaserules.googleapis.com",
    "firebasestorage.googleapis.com",
    "storage.googleapis.com",
    "firestore.googleapis.com",
    "firebase.googleapis.com",
    "cloudfunctions.googleapis.com",
    "dns.googleapis.com",
    "cloudbuild.googleapis.com",
    "eventarc.googleapis.com",
    "pubsub.googleapis.com",
    "compute.googleapis.com"
  ])
  service = each.key

  # Don't disable the service if the resource block is removed by accident
  disable_on_destroy = false
}

# Enables Firebase services for the new project created above.
resource "google_firebase_project" "fs" {
  provider = google-beta
  project  = google_project.fs.project_id

}

#### Set up Firestore before default Cloud Storage bucket ####

# Provisions the Firestore database instance.
resource "google_firestore_database" "firestore-fs" {
  provider = google-beta
  project  = google_project.fs.project_id
  name     = "(default)"
  # See available locations: https://firebase.google.com/docs/projects/locations#default-cloud-location
  location_id = var.location_id
  # "FIRESTORE_NATIVE" is required to use Firestore with Firebase SDKs, authentication, and Firebase Security Rules.
  type             = "FIRESTORE_NATIVE"
  concurrency_mode = "OPTIMISTIC"

  # Wait for Firebase to be enabled in the Google Cloud project before initializing Firestore.
  depends_on = [
    google_firebase_project.fs,
  ]
}

# Creates a ruleset of Firestore Security Rules from a local file.
resource "google_firebaserules_ruleset" "firestore-fs" {
  provider = google-beta
  project  = google_project.fs.project_id
  source {
    files {
      # Write security rules in a local file named "firestore.rules".
      # Learn more: https://firebase.google.com/docs/firestore/security/get-started
      name    = "firestore.rules"
      content = file("firestore.rules")
    }
  }

  # Wait for Firestore to be provisioned before creating this ruleset.
  depends_on = [
    google_firestore_database.firestore-fs
  ]

  lifecycle {
    create_before_destroy = true
  }
}

# Releases the ruleset for the Firestore instance.
resource "google_firebaserules_release" "firestore-fs" {
  provider     = google-beta
  name         = "cloud.firestore" # must be cloud.firestore
  ruleset_name = google_firebaserules_ruleset.firestore-fs.name
  project      = google_project.fs.project_id

  # Wait for Firestore to be provisioned before releasing the ruleset.
  depends_on = [
    google_firestore_database.firestore-fs,
  ]
}

#### Set up default Cloud Storage default bucket after Firestore ####

# Provisions the default Cloud Storage bucket for the project via Google App Engine.
resource "google_app_engine_application" "fb_app" {
  provider = google-beta
  project  = google_project.fs.project_id
  # See available locations: https://firebase.google.com/docs/projects/locations#default-cloud-location
  # This will set the location for the default Storage bucket and the App Engine App.
  location_id = var.location_id # Must be in the same location as Firestore (above)

  # Wait for Firestore to be provisioned first.
  # Otherwise, the Firestore instance will be provisioned in Datastore mode (unusable by Firebase).
  depends_on = [
    google_firestore_database.firestore-fs,
  ]
}

# Makes the default Storage bucket accessible for Firebase SDKs, authentication, and Firebase Security Rules.
resource "google_firebase_storage_bucket" "fb_app" {
  provider  = google-beta
  project   = google_project.fs.project_id
  bucket_id = google_app_engine_application.fb_app.default_bucket
}

# Creates a ruleset of Cloud Storage Security Rules from a local file.
resource "google_firebaserules_ruleset" "fb_app" {
  provider = google-beta
  project  = google_project.fs.project_id
  source {
    files {
      # Write security rules in a local file named "storage.rules".
      # Learn more: https://firebase.google.com/docs/storage/security/get-started
      name    = "storage.rules"
      content = file("storage.rules")
    }
  }

  # Wait for the Cloud Storage bucket to be provisioned before creating this ruleset.
  depends_on = [
    google_firebase_project.fs,
  ]

  lifecycle {
    create_before_destroy = true
  }
}

# Releases the ruleset to the default Storage bucket.
resource "google_firebaserules_release" "fb_app" {
  provider     = google-beta
  name         = "firebase.storage/${google_app_engine_application.fb_app.default_bucket}"
  ruleset_name = "projects/${google_project.fs.project_id}/rulesets/${google_firebaserules_ruleset.fb_app.name}"
  project      = google_project.fs.project_id
}

# web app
resource "google_firebase_web_app" "web_app" {
  depends_on   = [google_app_engine_application.fb_app]
  provider     = google-beta
  display_name = "Frontend"
  project      = google_project.fs.project_id
}

data "google_firebase_web_app_config" "web_app" {
  provider   = google-beta
  web_app_id = google_firebase_web_app.web_app.app_id
  project    = google_project.fs.project_id
}

resource "google_firebase_hosting_site" "web_app" {
  provider = google-beta
  project  = google_project.fs.project_id
  site_id  = "${terraform.workspace}-frontend"
  app_id   = google_firebase_web_app.web_app.app_id
}

data "google_app_engine_default_service_account" "default" {
  depends_on = [google_app_engine_application.fb_app]
  project    = google_project.fs.project_id
}

data "google_compute_default_service_account" "default" {
  project = google_project.fs.project_id
}

# public bucket to serve configurations to web apps
resource "google_storage_bucket" "config" {
  provider      = google-beta
  project       = google_project.fs.project_id
  name          = "${google_project.fs.project_id}-config"
  location      = var.location_id
  force_destroy = true
  cors {
    origin          = ["*"]
    method          = ["GET", "HEAD", "PUT", "POST", "DELETE"]
    response_header = ["*"]
    max_age_seconds = 3600
  }

  uniform_bucket_level_access = true
}

data "google_iam_policy" "data_bucket" {
  binding {
    role = "roles/storage.objectViewer"
    members = [
      "allUsers",
    ]
  }
  binding {
    role    = "roles/storage.objectAdmin"
    members = ["allAuthenticatedUsers"]
  }
}
resource "google_storage_bucket_iam_policy" "data_bucket" {
  provider    = google-beta
  bucket      = google_storage_bucket.config.id
  policy_data = data.google_iam_policy.data_bucket.policy_data
}

resource "google_storage_bucket_object" "firebase_config" {
  name = "firebaseConfig.json"
  content = jsonencode({
    projectId         = google_project.fs.project_id
    appId             = google_firebase_web_app.web_app.app_id
    apiKey            = data.google_firebase_web_app_config.web_app.api_key
    authDomain        = data.google_firebase_web_app_config.web_app.auth_domain
    databaseURL       = lookup(data.google_firebase_web_app_config.web_app, "database_url", "")
    storageBucket     = lookup(data.google_firebase_web_app_config.web_app, "storage_bucket", "")
    messagingSenderId = lookup(data.google_firebase_web_app_config.web_app, "messaging_sender_id", "")
    measurementId     = lookup(data.google_firebase_web_app_config.web_app, "measurement_id", "")
  })
  bucket = google_storage_bucket.config.id
}

resource "google_storage_bucket_object" "nstrumenta_deployment" {
  depends_on = [google_cloud_run_v2_service.default]
  name       = "nstrumentaDeployment.json"
  content = jsonencode({
    apiUrl = google_cloud_run_v2_service.default.uri
    }
  )
  bucket        = google_storage_bucket.config.id
  cache_control = "public, max-age=30"
}


# Create a Cloud DNS managed zone
resource "google_dns_managed_zone" "managed_zone" {
  project     = google_project.fs.project_id
  name        = terraform.workspace
  dns_name    = "${terraform.workspace}.nstrumenta.com."
  description = "Managed DNS Zone for Firebase"
}

# Create a DNS record set for Firebase Hosting
resource "google_dns_record_set" "firebase_dns" {
  depends_on   = [google_firebase_web_app.web_app]
  project      = google_project.fs.project_id
  managed_zone = google_dns_managed_zone.managed_zone.name
  name         = "www.${terraform.workspace}.nstrumenta.com."
  type         = "CNAME"
  ttl          = 300
  rrdatas      = ["${replace(google_firebase_hosting_site.web_app.default_url, "https://", "")}."]
}


resource "google_service_account_key" "server" {
  service_account_id = data.google_app_engine_default_service_account.default.id
}

resource "google_secret_manager_secret_iam_member" "app_engine" {
  project   = google_project.fs.project_id
  secret_id = google_secret_manager_secret.server_key.secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${data.google_app_engine_default_service_account.default.email}"
}

resource "google_secret_manager_secret_iam_member" "compute" {
  project   = google_project.fs.project_id
  secret_id = google_secret_manager_secret.server_key.secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${data.google_compute_default_service_account.default.email}"
}

# secret so we can reference the key when starting the cloud service
resource "google_secret_manager_secret" "server_key" {
  secret_id = "GCLOUD_SERVICE_KEY"
  project   = google_project.fs.project_id
  replication {
    auto {}
  }
}

# secret versions hold the actual secret
resource "google_secret_manager_secret_version" "server_key" {
  provider = google-beta

  secret      = google_secret_manager_secret.server_key.id
  secret_data = base64decode(google_service_account_key.server.private_key)
}

# Secret for API Key Pepper
resource "google_secret_manager_secret" "api_key_pepper" {
  secret_id = "NSTRUMENTA_API_KEY_PEPPER"
  project   = google_project.fs.project_id
  replication {
    auto {}
  }
}

resource "random_password" "api_key_pepper" {
  length  = 32
  special = true
}

resource "google_secret_manager_secret_version" "api_key_pepper" {
  provider = google-beta

  secret      = google_secret_manager_secret.api_key_pepper.id
  secret_data = random_password.api_key_pepper.result
}

resource "google_secret_manager_secret_iam_member" "app_engine_pepper" {
  project   = google_project.fs.project_id
  secret_id = google_secret_manager_secret.api_key_pepper.secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${data.google_app_engine_default_service_account.default.email}"
}

# server in cloudrun service
resource "google_cloud_run_v2_service" "default" {
  name     = "cloudrun-service"
  location = var.location_id
  project  = google_project.fs.project_id

  template {
    service_account = data.google_app_engine_default_service_account.default.email
    annotations = {
      # Force new revision when secret version changes
      "secret-version" = google_secret_manager_secret_version.server_key.version
    }
    containers {
      name = "server"
      ports {
        container_port = 5999
      }
      image = "nstrumenta/server:${var.image_version_tag}"

      resources {
        cpu_idle = false
      }

      env {
        name = "GCLOUD_SERVICE_KEY"
        value_source {
          secret_key_ref {
            secret  = "GCLOUD_SERVICE_KEY"
            version = "latest"
          }
        }
      }
      env {
        name = "NSTRUMENTA_API_KEY_PEPPER"
        value_source {
          secret_key_ref {
            secret  = "NSTRUMENTA_API_KEY_PEPPER"
            version = "latest"
          }
        }
      }
      env {
        name  = "IMAGE_VERSION_TAG"
        value = var.image_version_tag
      }
    }
    scaling {
      min_instance_count = 0
      max_instance_count = 1
    }
  }
}

resource "google_cloud_run_service_iam_binding" "default" {
  project  = google_project.fs.project_id
  location = google_cloud_run_v2_service.default.location
  service  = google_cloud_run_v2_service.default.name
  role     = "roles/run.invoker"
  members = [
    "allUsers"
  ]
}

resource "google_storage_bucket_object" "function_zip" {
  name   = "functionZip/storageObjectFunctions${filesha256("./storageObjectFunctions.zip")}.zip"
  bucket = split("/", google_firebase_storage_bucket.fb_app.id)[3]
  source = "./storageObjectFunctions.zip"
}

# To use GCS CloudEvent triggers, the GCS service account requires the Pub/Sub Publisher(roles/pubsub.publisher) IAM role in the specified project.
# (See https://cloud.google.com/eventarc/docs/run/quickstart-storage#before-you-begin)
data "google_storage_project_service_account" "default" {
  project = google_project.fs.project_id
}
resource "google_project_iam_member" "gcs_pubsub_publishing" {
  project = google_project.fs.project_id
  role    = "roles/pubsub.publisher"
  member  = "serviceAccount:${data.google_storage_project_service_account.default.email_address}"
}

# add role for creating agents with --allow-unauthenticated for public access 
resource "google_project_iam_member" "cloud" {
  project = google_project.fs.project_id
  role    = "roles/run.admin"
  member  = "serviceAccount:${data.google_app_engine_default_service_account.default.email}"
}

#cloud functions for storage triggers
resource "google_cloudfunctions2_function" "finalize" {
  name     = "storageObjectFinalize"
  location = var.location_id
  project  = google_project.fs.project_id

  labels = {
    # Force new deployment when secret version changes
    secret-version = google_secret_manager_secret_version.server_key.version
  }

  build_config {
    runtime     = "nodejs20"
    entry_point = "storageObjectFinalize"

    source {
      storage_source {
        bucket = split("/", google_firebase_storage_bucket.fb_app.id)[3]
        object = google_storage_bucket_object.function_zip.name
      }
    }
  }

  service_config {
    service_account_email = data.google_app_engine_default_service_account.default.email
    secret_environment_variables {
      key        = "GCLOUD_SERVICE_KEY"
      project_id = google_project.fs.project_id
      secret     = "GCLOUD_SERVICE_KEY"
      version    = "latest"
    }
  }
  event_trigger {
    retry_policy   = "RETRY_POLICY_DO_NOT_RETRY"
    trigger_region = var.location_id
    event_type     = "google.cloud.storage.object.v1.finalized"
    event_filters {
      attribute = "bucket"
      value     = split("/", google_firebase_storage_bucket.fb_app.id)[3]
    }
  }
  lifecycle {
    ignore_changes = [
      build_config[0].docker_repository,
      service_config[0].environment_variables["LOG_EXECUTION_ID"],
    ]
  }
}

#cloud functions for storage triggers
resource "google_cloudfunctions2_function" "delete" {
  name     = "storageObjectDelete"
  location = var.location_id
  project  = google_project.fs.project_id

  labels = {
    # Force new deployment when secret version changes
    secret-version = google_secret_manager_secret_version.server_key.version
  }

  build_config {
    runtime     = "nodejs20"
    entry_point = "storageObjectDelete"

    source {
      storage_source {
        bucket = split("/", google_firebase_storage_bucket.fb_app.id)[3]
        object = google_storage_bucket_object.function_zip.name
      }
    }
  }

  service_config {
    service_account_email = data.google_app_engine_default_service_account.default.email
    secret_environment_variables {
      key        = "GCLOUD_SERVICE_KEY"
      project_id = google_project.fs.project_id
      secret     = "GCLOUD_SERVICE_KEY"
      version    = "latest"
    }
  }
  event_trigger {
    retry_policy   = "RETRY_POLICY_DO_NOT_RETRY"
    trigger_region = var.location_id
    event_type     = "google.cloud.storage.object.v1.deleted"
    event_filters {
      attribute = "bucket"
      value     = split("/", google_firebase_storage_bucket.fb_app.id)[3]
    }
  }
  lifecycle {
    ignore_changes = [
      build_config[0].docker_repository,
      service_config[0].environment_variables["LOG_EXECUTION_ID"],
    ]
  }
}

# artifact registry for pushing server containers in CI
resource "google_artifact_registry_repository" "server" {
  project       = google_project.fs.project_id
  location      = "us-west1"
  repository_id = "server"
  description   = "repository for CI server images"
  format        = "DOCKER"
}
