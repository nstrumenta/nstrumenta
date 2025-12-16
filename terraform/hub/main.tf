terraform {
  cloud {
    organization = "nstrumenta"
    workspaces {
      name = "nstrumenta-app-hub"
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

variable "billing_account" {
  description = "The billing account ID to attach to the hub project"
  type        = string
}

variable "org_id" {
  description = "The organization ID"
  type        = string
}

variable "hub_project_id" {
  description = "The ID for the hub project"
  type        = string
  default     = "nstrumenta-hub"
}

# 1. Create the Hub Project
resource "google_project" "hub" {
  name            = "Nstrumenta Hub"
  project_id      = var.hub_project_id
  org_id          = var.org_id
  billing_account = var.billing_account
}

# 2. Enable DNS API
resource "google_project_service" "dns" {
  project = google_project.hub.project_id
  service = "dns.googleapis.com"
  disable_on_destroy = false
}

# 3. Create the Parent Zone (app.nstrumenta.com)
resource "google_dns_managed_zone" "app_zone" {
  project     = google_project.hub.project_id
  name        = "app-nstrumenta-com"
  dns_name    = "app.nstrumenta.com."
  description = "Parent zone for all nstrumenta client apps"
  depends_on  = [google_project_service.dns]
}

# 4. Allow the Spoke projects to update records in this zone
# We need to grant the service accounts of the spoke projects permission to edit this zone.
# However, since we don't know the spoke service accounts yet, we can either:
# A) Grant permission to the entire Organization (easiest for internal use)
# B) Grant permission to a specific group
# C) Manually add IAM bindings later
# D) Use a Service Account for Terraform that has permissions on both.

# For now, we assume the person/machine running Terraform has permissions on both projects.

output "hub_project_id" {
  value = google_project.hub.project_id
}

output "hub_zone_name" {
  value = google_dns_managed_zone.app_zone.name
}

output "name_servers" {
  description = "Add these to your Squarespace DNS settings for app.nstrumenta.com"
  value       = google_dns_managed_zone.app_zone.name_servers
}
