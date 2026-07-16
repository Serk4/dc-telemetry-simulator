# ── Cluster and Infrastructure Outputs ────────────────────────────────────────
output "cluster_name" {
  description = "Name of the provisioned local Kubernetes cluster"
  value       = var.cluster_name
}

output "kube_context" {
  description = "kubectl context name for the cluster"
  value       = local.kube_context
}

output "kubeconfig_path" {
  description = "Path to the kubeconfig file"
  value       = var.kubeconfig_path
}

output "telemetry_namespace" {
  description = "Name of the telemetry namespace"
  value       = kubernetes_namespace.telemetry.metadata[0].name
}

output "monitoring_namespace" {
  description = "Name of the monitoring namespace"
  value       = kubernetes_namespace.monitoring.metadata[0].name
}

# ── Access Instructions ────────────────────────────────────────────────────────
output "grafana_port_forward" {
  description = "Command to port-forward Grafana to localhost:3000"
  value       = "kubectl port-forward -n monitoring svc/grafana 3000:3000"
}

output "prometheus_port_forward" {
  description = "Command to port-forward Prometheus to localhost:9090"
  value       = "kubectl port-forward -n monitoring svc/prometheus 9090:9090"
}

output "status_port_forward" {
  description = "Command to port-forward the telemetry-generator /api/status endpoint"
  value       = "kubectl port-forward -n telemetry svc/telemetry-generator 8080:80"
}
