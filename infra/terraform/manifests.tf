# ── Apply Kubernetes manifests ────────────────────────────────────────────────
resource "null_resource" "apply_manifests" {
  depends_on = [
    kubernetes_namespace.telemetry,
    kubernetes_namespace.monitoring,
  ]

  triggers = {
    telemetry_generator_hash = filesha256("${local.k8s_manifests_dir}/telemetry-generator.yaml")
    prometheus_hash          = filesha256("${local.k8s_manifests_dir}/prometheus.yaml")
    grafana_hash             = filesha256("${local.k8s_manifests_dir}/grafana.yaml")
  }

  provisioner "local-exec" {
    command = join(" && ", [
      "kubectl apply --context ${local.kube_context} -f ${local.k8s_manifests_dir}/telemetry-generator.yaml",
      "kubectl apply --context ${local.kube_context} -f ${local.k8s_manifests_dir}/prometheus.yaml",
      "kubectl apply --context ${local.k8s_manifests_dir}/grafana.yaml",
    ])
  }
}

# ── Outputs ───────────────────────────────────────────────────────────────────
output "cluster_name" {
  description = "Name of the provisioned local Kubernetes cluster"
  value       = var.cluster_name
}

output "kube_context" {
  description = "kubectl context name for the cluster"
  value       = local.kube_context
}

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
