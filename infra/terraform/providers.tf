terraform {
  required_version = ">= 1.6.0"

  required_providers {
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.13"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.30"
    }
    null = {
      source  = "hashicorp/null"
      version = "~> 3.2"
    }
  }
}

# ── Variables ─────────────────────────────────────────────────────────────────
variable "cluster_tool" {
  description = "Local Kubernetes cluster tool: k3d or kind"
  type        = string
  default     = "k3d"

  validation {
    condition     = contains(["k3d", "kind"], var.cluster_tool)
    error_message = "cluster_tool must be 'k3d' or 'kind'."
  }
}

variable "cluster_name" {
  description = "Name of the local Kubernetes cluster"
  type        = string
  default     = "dc-telemetry"
}

variable "kubeconfig_path" {
  description = "Path to the kubeconfig file"
  type        = string
  default     = "~/.kube/config"
}

# ── Providers ─────────────────────────────────────────────────────────────────
provider "kubernetes" {
  config_path    = var.kubeconfig_path
  config_context = local.kube_context
}

provider "helm" {
  kubernetes {
    config_path    = var.kubeconfig_path
    config_context = local.kube_context
  }
}

locals {
  kube_context = var.cluster_tool == "k3d" ? "k3d-${var.cluster_name}" : "kind-${var.cluster_name}"
  k8s_manifests_dir = "${path.module}/../k8s"
}
