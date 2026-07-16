# ── Locals ────────────────────────────────────────────────────────────────────
locals {
  kube_context      = var.cluster_tool == "k3d" ? "k3d-${var.cluster_name}" : "kind-${var.cluster_name}"
  k8s_manifests_dir = "${path.module}/../k8s"
}

# ── Cluster bootstrap ─────────────────────────────────────────────────────────
resource "null_resource" "cluster" {
  triggers = {
    cluster_name = var.cluster_name
    cluster_tool = var.cluster_tool
  }

  provisioner "local-exec" {
    command = var.cluster_tool == "k3d" ? (
      "k3d cluster create ${var.cluster_name} --agents 2 --port '80:80@loadbalancer' --port '443:443@loadbalancer' || echo 'Cluster already exists'"
    ) : (
      "kind create cluster --name ${var.cluster_name} || echo 'Cluster already exists'"
    )
  }

  provisioner "local-exec" {
    when    = destroy
    command = self.triggers.cluster_tool == "k3d" ? (
      "k3d cluster delete ${self.triggers.cluster_name}"
    ) : (
      "kind delete cluster --name ${self.triggers.cluster_name}"
    )
  }
}

# ── Namespaces ────────────────────────────────────────────────────────────────
resource "kubernetes_namespace" "telemetry" {
  depends_on = [null_resource.cluster]

  metadata {
    name = "telemetry"
    labels = {
      "managed-by" = "terraform"
    }
  }
}

resource "kubernetes_namespace" "monitoring" {
  depends_on = [null_resource.cluster]

  metadata {
    name = "monitoring"
    labels = {
      "managed-by" = "terraform"
    }
  }
}

# ── Apply Kubernetes Manifests ────────────────────────────────────────────────
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
      "kubectl apply --context ${local.kube_context} -f ${local.k8s_manifests_dir}/grafana.yaml",
    ])
  }
}
