# ── Cluster Configuration ─────────────────────────────────────────────────────
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
