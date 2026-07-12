# DC Telemetry Simulator

A small but realistic **Data Center Telemetry Simulator** demonstrating modern infrastructure engineering with C#/.NET 8, OpenTelemetry, Prometheus, Grafana, Kubernetes, and Terraform.

---

## Architecture

```
┌─────────────────────────────┐      scrape /metrics      ┌─────────────┐
│  telemetry-generator        │◄──────────────────────────│  Prometheus │
│  (C# .NET 8 Minimal API)    │                           └──────┬──────┘
│                             │                                  │
│  BackgroundService          │                           ┌──────▼──────┐
│  ├── rack temperature       │                           │   Grafana   │
│  ├── power draw             │                           │  dashboards │
│  ├── cooling load           │                           └─────────────┘
│  ├── GPU utilization        │
│  ├── network throughput     │
│  └── node health            │
│                             │
│  /metrics  (Prometheus)     │
│  /api/status (JSON)         │
│  /healthz   (probe)         │
└─────────────────────────────┘
```

**Namespace layout:**

| Namespace | Workloads |
|-----------|-----------|
| `telemetry` | telemetry-generator |
| `monitoring` | prometheus, grafana |

---

## Quick Start

### Prerequisites

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8)
- [Docker](https://docs.docker.com/get-docker/)
- [k3d](https://k3d.io/) or [kind](https://kind.sigs.k8s.io/)
- [kubectl](https://kubernetes.io/docs/tasks/tools/)
- [Terraform ≥ 1.6](https://developer.hashicorp.com/terraform/install)

### Run locally (no Kubernetes)

```bash
cd src/telemetry-generator
dotnet run

# Endpoints
curl http://localhost:5249/healthz
curl http://localhost:5249/api/status
curl http://localhost:5249/metrics
```

### Build Docker image

```bash
cd src/telemetry-generator
docker build -t telemetry-generator:latest .
```

### Deploy to local Kubernetes (Terraform)

```bash
# 1. Make sure k3d or kind is installed and Docker is running
cd infra/terraform

# 2. Initialize Terraform
terraform init

# 3. Provision cluster + deploy everything
terraform apply

# 4. Port-forward services
kubectl port-forward -n monitoring svc/prometheus 9090:9090 &
kubectl port-forward -n monitoring svc/grafana 3000:3000 &
kubectl port-forward -n telemetry svc/telemetry-generator 8080:80 &

# 5. Open Grafana
open http://localhost:3000   # admin / admin
```

### Deploy without Terraform

```bash
kubectl apply -f infra/k8s/namespaces.yaml
kubectl apply -f infra/k8s/telemetry-generator.yaml
kubectl apply -f infra/k8s/prometheus.yaml
kubectl apply -f infra/k8s/grafana.yaml
```

---

## Configuration

Configuration is externalized in `appsettings.json` and overridable via environment variables:

| Key | Default | Description |
|-----|---------|-------------|
| `Simulator__RackCount` | `4` | Number of simulated racks |
| `Simulator__IntervalMs` | `5000` | Metric refresh interval (ms) |

---

## Metrics Reference

All metrics are exported under the `dc.telemetry` meter and scraped by Prometheus:

| Metric (Prometheus) | Unit | Description |
|---------------------|------|-------------|
| `dc_rack_temperature_celsius` | °C | Rack inlet temperature |
| `dc_rack_power_draw_watts` | W | Rack power draw |
| `dc_rack_cooling_load_percent` | % | Cooling system load |
| `dc_rack_gpu_utilization_percent` | % | GPU utilization |
| `dc_rack_network_throughput_Mbit_per_second` | Mbit/s | Network throughput |
| `dc_rack_node_healthy` | 0/1 | Node health (1 = healthy) |

---

## Grafana Dashboards

The **DC Telemetry** dashboard (auto-provisioned) includes:

- Rack Temperature graph with 70°C / 80°C thresholds
- GPU Utilization graph
- Power Draw graph
- Network Throughput graph
- Node Health stat panel
- Cooling Load graph

---

## Alert Rules

| Alert | Condition | Severity |
|-------|-----------|----------|
| `RackTemperatureHigh` | temp > 80°C for 1 min | warning |
| `RackTemperatureCritical` | temp > 90°C for 30 s | critical |
| `NodeDegraded` | node healthy = 0 for 30 s | warning |

---

## Project Structure

```
/src/telemetry-generator        C# .NET 8 service
/infra/k8s                      Kubernetes manifests
/infra/terraform                Terraform IaC
/docs                           Additional documentation
INSTRUCTIONS.md                 Source of truth for Copilot
```
