# DC Telemetry Simulator

> A full-stack, cloud-native telemetry simulation platform for data center environments — featuring a C# backend, Prometheus + Grafana observability stack, Kubernetes orchestration, Terraform infrastructure-as-code, and an optional React (Vite) UI.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Features](#features)
- [Architecture](#architecture)
- [Backend](#backend)
- [Frontend](#frontend)
- [Monitoring: Prometheus & Grafana](#monitoring-prometheus--grafana)
- [Kubernetes](#kubernetes)
- [Terraform](#terraform)
- [Local Development](#local-development)
- [Running the System](#running-the-system)

---

## Project Overview

The **DC Telemetry Simulator** is a production-grade simulation platform that emulates real-time telemetry output from a modern data center. It generates and exposes metrics — including rack temperature, power draw, GPU utilization, network throughput, and node health — across a configurable fleet of virtual "racks."

Designed as a cloud-native reference implementation, the project demonstrates end-to-end observability pipelines using OpenTelemetry, Prometheus, and Grafana, container orchestration with Kubernetes, and declarative infrastructure provisioning with Terraform.

---

## Features

- **Realistic metric generation** — Configurable rack count with simulated temperature spikes, power fluctuations, and node health anomalies
- **OpenTelemetry instrumentation** — Traces, metrics, and logs collected and exported
- **Prometheus-native exposition** — Metrics served on `/metrics` endpoint in Prometheus format, ready for scraping
- **Live Grafana dashboards** — Pre-built "DC Telemetry Overview" dashboard with automatic provisioning
- **Prometheus alerting rules** — Pre-defined alerts for temperature thresholds and node degradation
- **Kubernetes-ready** — Complete manifest suite for Deployments, Services, ConfigMaps, and PrometheusRules
- **Terraform IaC** — Declarative provisioning of local Kubernetes cluster with manifest deployment
- **React (Vite) UI** — Lightweight optional frontend for real-time metric visualization (alternative to Grafana)
- **CORS-enabled** — Backend allows cross-origin requests from the React UI

---

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                 DC Telemetry Simulator Stack                 │
│                                                              │
│  ┌─────────────────────┐                                     │
│  │  C# Backend         │                                     │
│  │  (Telemetry         ├─────/metrics──────┐                 │
│  │   Generator)        │                   │                 │
│  │  ASP.NET Core 10    │    /api/status    │                 │
│  │  + OpenTelemetry    │    /healthz       │                 │
│  └─────────────────────┘                   │                 │
│           ▲                                ▼                 │
│           │                      ┌─────────────────────┐     │
│           │                      │ Prometheus          │     │
│           └──────────────────────│ (Metrics Scraper)   │     │
│                                  └──────────┬──────────┘     │
│                                             │                │
│                    ┌────────────────────────┼────────────┐   │
│                    │                        ▼            │   │
│                    │                  ┌──────────────┐   │   │
│              ┌─────┴────────┐         │  Grafana     │   │   │
│              │  React UI    │         │  (Dashboards │   │   │
│              │  (Vite)      │         │   & Alerts)  │   │   │
│              └──────────────┘         └──────────────┘   │   │
│                                                          │   │
│  ┌───────────────────────────────────────────────────────┘   │
│  │ Kubernetes        │   Terraform IaC                   |   │
│  └───────────────────────────────────────────────────────┘   |
└──────────────────────────────────────────────────────────────┘
```

### Folder Structure

```
dc-telemetry-simulator/
├── src/
│   └── telemetry-generator/        # C# .NET 10 backend
│       ├── Models/                 # RackMetrics, StatusResponse records
│       ├── Services/               # MetricsGeneratorService (IHostedService)
│       ├── Program.cs              # App bootstrap, endpoint registration
│       ├── appsettings.json        # Configuration
│       └── Properties/
│           └── launchSettings.json # Port: 5249
├── ui/                             # React (Vite) frontend (optional)
│   ├── src/
│   │   ├── App.tsx                 # Main dashboard component
│   │   ├── App.css                 # Styles
│   │   ├── api.ts                  # Axios API client
│   │   └── main.tsx                # Entry point
│   ├── package.json
│   ├── vite.config.ts
│   └── index.html
├── infra/
│   ├── k8s/                        # Kubernetes manifests
│   │   ├── namespaces.yaml         # telemetry + monitoring namespaces
│   │   ├── telemetry-generator.yaml         # Deployment + Service
│   │   ├── prometheus.yaml         # Deployment + ConfigMaps
│   │   ├── prometheus-rules.yaml   # PrometheusRule CRD
│   │   ├── grafana.yaml            # Deployment + provisioning ConfigMaps
│   │   └── grafana-dashboard.json  # Pre-built dashboard JSON
│   └── terraform/                  # Terraform IaC
│       ├── providers.tf            # Terraform & Kubernetes providers
│       ├── main.tf                 # Cluster + namespace resources
│       ├── variables.tf            # Input variables
│       └── outputs.tf              # Output values
├── copilot-instructions.md         # Source of truth for code generation
└── README.md
```

---

## Backend

The backend is an **ASP.NET Core 10** minimal API service written in **C#** that generates simulated data center telemetry.

### Responsibilities

| Component | Description |
|---|---|
| `MetricsGeneratorService` | Background service that generates metrics for N virtual racks every 5 seconds |
| Metric Simulation | Temperature (20–90°C with 5% spike probability), power (500–4000 W), GPU utilization, network throughput, node health (98% healthy) |
| OpenTelemetry | Traces all requests, exports metrics in Prometheus format |
| CORS Support | Allows cross-origin requests from frontend UI |

### Key Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/status` | Current rack metrics snapshot (JSON) |
| `GET` | `/metrics` | Prometheus-format metrics exposition |
| `GET` | `/healthz` | Liveness/readiness probe |

### Build & Run

```bash
cd src/telemetry-generator
dotnet build
dotnet run
```

Backend → http://localhost:5249  
Metrics → http://localhost:5249/metrics  
Status  → http://localhost:5249/api/status

---

## Frontend

The optional React (Vite) UI provides a real-time telemetry dashboard without requiring Grafana. It fetches the backend REST API and renders live rack metrics with auto-refresh every 5 seconds.

### Tech Stack

- **React 18** — UI framework
- **TypeScript** — Type safety
- **Vite** — Dev server and bundler
- **Axios** — HTTP client
- **CSS** — Minimal dark-theme styling

### Run (Development)

```bash
cd ui
npm install
npm run dev
```

The UI will run on port 3000 or 3001 (if 3000 is in use).

**Note:** Ensure the backend is running first at http://localhost:5249

### Environment Configuration

Default API URL is `http://localhost:5249`. To override:

```bash
VITE_API_URL=http://your-backend:5249 npm run dev
```

Or edit `ui/src/api.ts` directly.

### Production Build

```bash
npm run build      # Output: ui/dist/
npm run preview    # Preview production build locally
```

---

## Monitoring: Prometheus & Grafana

### Prometheus

- **Configuration:** Embedded in `infra/k8s/prometheus.yaml` ConfigMap
- **Scrape interval:** 10 seconds (telemetry-generator)
- **Retention:** TSDB retention configured in Prometheus deployment

### Prometheus Alerting Rules

Alert rules defined in `infra/k8s/prometheus-rules.yaml` (PrometheusRule CRD):

| Alert | Condition | Duration | Severity |
|---|---|---|---|
| `RackTemperatureHigh` | temp > 80°C | 1m | warning |
| `RackTemperatureCritical` | temp > 90°C | 30s | critical |
| `NodeDegraded` | node health == 0 | 30s | warning |

### Grafana

- **Dashboard:** "DC Telemetry Overview" auto-provisioned from `infra/k8s/grafana-dashboard.json`
- **Data source:** Prometheus (configured automatically)
- **Default credentials:** admin / admin

**Dashboard panels:**

| Panel | Type | Range | Description |
|---|---|---|---|
| Rack Temperature | timeseries | 0–100°C | With 80°C threshold line |
| GPU Utilization | timeseries | 0–100% | Percentage utilization |
| Power Draw | timeseries | 500–4000 W | Watts consumed |
| Network Throughput | timeseries | 0–10,000 Mbit/s | Network bandwidth |
| Cooling Load | timeseries | 0–100% | Cooling demand |
| Node Health | stat | — | Green (healthy) / Red (degraded) |

---

## Kubernetes

### Manifests in `infra/k8s/`

| File | Resource | Description |
|---|---|---|
| `namespaces.yaml` | Namespace | `telemetry` and `monitoring` namespaces |
| `telemetry-generator.yaml` | Deployment, Service | Backend pods + ClusterIP service |
| `prometheus.yaml` | Deployment, ConfigMap, Service | Prometheus scraper |
| `prometheus-rules.yaml` | PrometheusRule | Alert rules (requires Prometheus Operator) |
| `grafana.yaml` | Deployment, ConfigMap (×2), Service | Grafana dashboards + datasources |
| `grafana-dashboard.json` | Grafana Dashboard (JSON) | Pre-built dashboard |

### Deploy All

```bash
# Apply all manifests (order matters; namespaces first)
kubectl apply -f infra/k8s/

# Watch rollout
kubectl rollout status deployment/telemetry-generator -n telemetry
kubectl rollout status deployment/prometheus -n monitoring
kubectl rollout status deployment/grafana -n monitoring

# Port-forward services
kubectl port-forward -n telemetry svc/telemetry-generator 8080:8080
kubectl port-forward -n monitoring svc/prometheus 9090:9090
kubectl port-forward -n monitoring svc/grafana 3000:3000
```

### Scale Manually

```bash
kubectl scale deployment/telemetry-generator -n telemetry --replicas=3
```

### Teardown

```bash
kubectl delete -f infra/k8s/
```

---

## Terraform

Terraform manifests in `infra/terraform/` provision a local Kubernetes cluster and deploy all manifests.

### Prerequisites

- [Terraform](https://developer.hashicorp.com/terraform/install) >= 1.5
- [k3d](https://k3d.io/) or [kind](https://kind.sigs.k8s.io/)
- `kubectl` configured

### Provisioning

```bash
cd infra/terraform

terraform init                # Initialize Terraform
terraform plan              # Preview changes
terraform apply             # Create cluster + deploy manifests
```

### Outputs

After `terraform apply`:

```bash
terraform output cluster_name          # Cluster name
terraform output kubeconfig_path       # Path to kubeconfig
terraform output telemetry_namespace   # Telemetry namespace
terraform output monitoring_namespace  # Monitoring namespace
```

### Teardown

```bash
terraform destroy           # Remove all provisioned resources
```

⚠️ **Warning:** This permanently deletes the cluster and all data.

---

## Local Development

### Prerequisites

| Tool | Version | Purpose |
|---|---|---|
| [.NET SDK](https://dotnet.microsoft.com/download) | 10 | C# backend |
| [Node.js](https://nodejs.org/) | 16+ | React UI |
| [Docker](https://www.docker.com/) | 24+ | Container images (optional) |
| [kubectl](https://kubernetes.io/docs/tasks/tools/) | 1.28+ | Kubernetes (optional) |
| [Terraform](https://developer.hashicorp.com/terraform/install) | 1.5+ | IaC (optional) |

### Setup

```bash
git clone https://github.com/Serk4/dc-telemetry-simulator.git
cd dc-telemetry-simulator

# Backend
cd src/telemetry-generator
dotnet restore
cd ../..

# Frontend
cd ui
npm install
cd ..
```

---

## Running the System

### Option 1 — Backend + Frontend (Fastest for local dev)

**Terminal 1 — Backend:**
```bash
cd src/telemetry-generator
dotnet run
```
→ http://localhost:5249

**Terminal 2 — Frontend UI:**
```bash
cd ui
npm run dev
```
→ http://localhost:3000 (or 3001)

Then open **http://localhost:3000** in your browser to view real-time telemetry data.

### Option 2 — Backend + Prometheus + Grafana (Full observability stack)

**Terminal 1 — Backend:**
```bash
cd src/telemetry-generator
dotnet run
```

**Terminal 2 — Prometheus (Docker):**
```bash
docker run -p 9090:9090 \
  -v $(pwd)/infra/k8s/prometheus.yaml:/etc/prometheus/prometheus.yml \
  prom/prometheus
```
→ http://localhost:9090

**Terminal 3 — Grafana (Docker):**
```bash
docker run -p 3000:3000 \
  -e GF_SECURITY_ADMIN_PASSWORD=admin \
  -v $(pwd)/infra/k8s:/var/lib/grafana/provisioning \
  grafana/grafana:11.0.0
```
→ http://localhost:3000  
Credentials: `admin` / `admin`

### Option 3 — Kubernetes with Terraform

```bash
cd infra/terraform
terraform init
terraform apply
```

Then port-forward services:
```bash
kubectl port-forward -n telemetry svc/telemetry-generator 8080:8080
kubectl port-forward -n monitoring svc/prometheus 9090:9090
kubectl port-forward -n monitoring svc/grafana 3000:3000
```

---

## Architecture & Design Decisions

- **C# .NET 10:** Modern, type-safe backend with async/await throughout
- **OpenTelemetry:** Industry-standard observability instrumentation
- **Minimal API:** Lightweight ASP.NET Core endpoint definitions (no controllers)
- **Background service:** MetricsGeneratorService runs continuously on a 5-second tick
- **Prometheus CRD:** PrometheusRule CRD for alert definitions (requires Prometheus Operator in production)
- **React UI:** Optional, lightweight frontend—no heavy dependencies like D3 or Recharts
- **Terraform:** Infrastructure-as-code for reproducible cluster provisioning

---

## License

This project is licensed under the MIT License.



