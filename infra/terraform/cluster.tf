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
