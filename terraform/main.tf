variable "billing_account" {
  type = string
}

variable "org_id" {
  type = string
}

variable "location_id" {
  type = string
  default = "us-west1"
}


# Creates a new Google Cloud project.
resource "google_project" "fs" {  # fs = Firestore + Storage
  provider   = google-beta.no_user_project_override
  name       = "${terraform.workspace}"
  project_id = "${terraform.workspace}"
  org_id = var.org_id
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
    "firebaserules.googleapis.com",
    "firebasestorage.googleapis.com",
    "storage.googleapis.com",
    "firestore.googleapis.com",
    "firebase.googleapis.com"
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
  provider         = google-beta
  project          = google_project.fs.project_id
  name             = "(default)"
  # See available locations: https://firebase.google.com/docs/projects/locations#default-cloud-location
  location_id      = var.location_id
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
      name = "firestore.rules"
      content = file("firestore.rules")
    }
  }

  # Wait for Firestore to be provisioned before creating this ruleset.
  depends_on = [
    google_firestore_database.firestore-fs
  ]
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
resource "google_app_engine_application" "default-bucket-fs" {
  provider    = google-beta
  project     = google_project.fs.project_id
  # See available locations: https://firebase.google.com/docs/projects/locations#default-cloud-location
  # This will set the location for the default Storage bucket and the App Engine App.
  location_id = var.location_id  # Must be in the same location as Firestore (above)

  # Wait for Firestore to be provisioned first.
  # Otherwise, the Firestore instance will be provisioned in Datastore mode (unusable by Firebase).
  depends_on = [
    google_firestore_database.firestore-fs,
  ]
}

# Makes the default Storage bucket accessible for Firebase SDKs, authentication, and Firebase Security Rules.
resource "google_firebase_storage_bucket" "default-bucket-fs" {
  provider  = google-beta
  project   = google_project.fs.project_id
  bucket_id = google_app_engine_application.default-bucket-fs.default_bucket
}

# Creates a ruleset of Cloud Storage Security Rules from a local file.
resource "google_firebaserules_ruleset" "default-bucket-fs" {
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
}

# Releases the ruleset to the default Storage bucket.
resource "google_firebaserules_release" "default-bucket-fs" {
  provider     = google-beta
  name         = "firebase.storage/${google_app_engine_application.default-bucket-fs.default_bucket}"
  ruleset_name = "projects/${google_project.fs.project_id}/rulesets/${google_firebaserules_ruleset.default-bucket-fs.name}"
  project      = google_project.fs.project_id
}