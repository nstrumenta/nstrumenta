# Terraform configuration to set up providers by version.
terraform {
  required_version = ">= 1.6.0"
  
  cloud {
    organization = "nstrumenta"
    workspaces {
      tags = ["gcloud:backend"]
    }
  }
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = ">= 4.34.0"
    }
    google-beta = {
      source  = "hashicorp/google-beta"
      version = ">= 4.34.0"
    }
  }
}

# Configures the provider to use the resource block's specified project for quota checks.
provider "google-beta" {
  user_project_override = true
}

# Configures the provider to not use the resource block's specified project for quota checks.
# This provider should only be used during project creation and initializing services.
provider "google-beta" {
  alias                 = "no_user_project_override"
  user_project_override = false
}
