# INSTRUCTIONS.md — DC Telemetry Simulator

> This document is the **source of truth** for all code generation in this project.
> When generating code with Copilot or any AI assistant, always reference this file.
> If a request conflicts with this document, ask for clarification.

---

## PROJECT GOAL

Build a small but realistic **Data Center Telemetry Simulator** that demonstrates
modern infrastructure engineering skills. This project is **SOFTWARE ONLY**.
We simulate telemetry; we do **NOT** model real electrical systems.

---

## TECH STACK

| Layer          | Technology                                                 |
| -------------- | ---------------------------------------------------------- |
| Backend        | C# / .NET 10, Minimal API, Background Hosted Service       |
| Observability  | OpenTelemetry (metrics, logs, traces), Prometheus exporter |
| Infrastructure | Kubernetes (local: k3d or kind), Prometheus, Grafana       |
| IaC            | Terraform (minimal: cluster + namespaces + manifest apply) |
| Optional UI    | React (Vite)                                               |

---

## FEATURES TO IMPLEMENT

### 1. telemetry-generator (C# service)

Generates fake data center metrics:

| Metric             | Unit    | Range                                |
| ------------------ | ------- | ------------------------------------ |
| rack temperature   | °C      | 20–90 (spikes >80 at 5% probability) |
| power draw         | W       | 500–4000                             |
| cooling load       | %       | 0–100                                |
| GPU utilization    | %       | 0–100                                |
| network throughput | Mbit/s  | 0–10 000                             |
| node health        | boolean | 98% healthy                          |

Exposes:

- `/metrics` — Prometheus scrape endpoint (OpenTelemetry Prometheus exporter)
- `/api/status` — JSON snapshot of current rack metrics
- `/healthz` — liveness/readiness probe

### 2. Prometheus + Grafana

- Prometheus scrapes `telemetry-generator` every 10 s
- Grafana dashboards visualize:
  - Rack temperature graph (with >80°C threshold)
  - GPU utilization graph
  - Power draw graph
  - Network throughput graph
  - Node health stat panel
  - Cooling load graph
- Alert rules:
  - `RackTemperatureHigh` — temp > 80°C for 1 min (warning)
  - `RackTemperatureCritical` — temp > 90°C for 30 s (critical)
  - `NodeDegraded` — node healthy == 0 for 30 s (warning)

### 3. Kubernetes Manifests

#### 3.1 Namespaces

- Create two namespaces:
  - `telemetry`
  - `monitoring`

#### 3.2 Telemetry Generator (Namespace: telemetry)

- Deployment:
  - Name: telemetry-generator
  - Image: telemetry-generator:latest (placeholder)
  - Port: 8080
  - Environment variables: none initially
  - Resources:
    - requests: cpu 100m, memory 128Mi
    - limits: cpu 500m, memory 256Mi
  - Readiness probe: GET /api/status
  - Liveness probe: GET /api/status
  - Prometheus annotations:
    - prometheus.io/scrape: "true"
    - prometheus.io/port: "8080"
    - prometheus.io/path: "/metrics"
- Service:
  - Type: ClusterIP
  - Port: 8080

#### 3.3 Prometheus (Namespace: monitoring)

- Deployment:
  - Use Prometheus image: prom/prometheus:latest
  - Mount ConfigMap for prometheus.yaml
  - Expose port 9090
- Service:
  - Type: ClusterIP
  - Port: 9090

#### 3.4 Grafana (Namespace: monitoring)

- Deployment:
  - Use Grafana image: grafana/grafana:latest
  - Mount dashboards ConfigMap
  - Mount datasources ConfigMap
  - Expose port 3000
- Service:
  - Type: ClusterIP
  - Port: 3000

#### 3.5 File Placement

- Place all manifests in `infra/k8s/`
- Use separate files:
  - telemetry-namespace.yaml
  - telemetry-generator-deployment.yaml
  - telemetry-generator-service.yaml
  - monitoring-namespace.yaml
  - prometheus-deployment.yaml
  - prometheus-service.yaml
  - grafana-deployment.yaml
  - grafana-service.yaml

### 4. Terraform (minimal but structured)

#### 4.1 Terraform Project Structure

- Place all Terraform files in `infra/terraform/`
- Use the following files:
  - `main.tf`
  - `providers.tf`
  - `variables.tf`
  - `outputs.tf`

#### 4.2 Local Kubernetes Cluster Provisioning

- Use either `k3d` or `kind` (choose one; default to k3d)
- Provision a local cluster named `telemetry-cluster`
- Use `null_resource` + `local-exec` to run cluster creation commands
- Ensure kubeconfig is written to a known path:
  - `${path.module}/kubeconfig`

#### 4.3 Kubernetes Provider Configuration

- Use the Terraform Kubernetes provider
- Configure provider to use the generated kubeconfig:

```hcl
provider "kubernetes" {
  config_path = "${path.module}/kubeconfig"
}
```

#### 4.4 Namespace Creation

- Create namespaces via Terraform resources:
- `kubernetes_namespace.telemetry`
- `kubernetes_namespace.monitoring`

#### 4.5 Applying Kubernetes Manifests

- Use `null_resource` + `local-exec` to apply manifests:
- Apply all YAML files in `infra/k8s/`
- Use:
  ```bash
  kubectl apply -f ../../infra/k8s
  ```
- Ensure apply runs **after** namespaces are created
- Use `depends_on` to enforce ordering

#### 4.6 Outputs

- Output:
- cluster name
- kubeconfig path
- telemetry namespace
- monitoring namespace

### 5. Prometheus Alerting Rules

#### 5.1 Rule Definitions

Create Prometheus alerting rules for the following conditions:

- RackTemperatureHigh
  - Condition: rack_temperature > 80°C
  - Duration: 1m
  - Severity: warning

- RackTemperatureCritical
  - Condition: rack_temperature > 90°C
  - Duration: 30s
  - Severity: critical

- NodeDegraded
  - Condition: node_health == 0
  - Duration: 30s
  - Severity: warning

#### 5.2 File Format

- Use standard Prometheus rule group YAML:
  - apiVersion: monitoring.coreos.com/v1
  - kind: PrometheusRule
  - metadata:
    name: telemetry-rules
    namespace: monitoring
  - spec:
    groups: - name: telemetry.rules
    rules: [...]

#### 5.3 File Placement

- Place rule file in: `infra/k8s/prometheus-rules.yaml`

#### 5.4 Integration

- Ensure Prometheus Deployment mounts the rule ConfigMap
- Ensure Prometheus is configured to load rule files from:
  `/etc/prometheus/rules`

#### 5.5 Requirements

- Clean, valid YAML
- No duplicate rule names
- Use labels:
  - severity: <warning|critical>
  - service: telemetry-generator

### 6. Grafana Dashboards

#### 6.1 Dashboard Requirements

Create a Grafana dashboard named "DC Telemetry Overview" containing:

- Rack Temperature graph
  - Threshold line at 80°C
  - Color change above threshold

- GPU Utilization graph
  - 0–100% range
  - Single time-series panel

- Power Draw graph
  - 500–4000 W range

- Network Throughput graph
  - 0–10,000 Mbit/s range

- Cooling Load graph
  - 0–100% range

- Node Health stat panel
  - Green = healthy
  - Red = degraded

#### 6.2 File Format

- Use Grafana JSON dashboard format (apiVersion: 1)
- Must be valid JSON
- Must be compatible with Grafana provisioning

#### 6.3 File Placement

- Place dashboard JSON in:
  `infra/k8s/grafana-dashboard.json`

#### 6.4 Integration

- Ensure Grafana Deployment mounts:
  - dashboards ConfigMap
  - datasources ConfigMap

- ConfigMap must place dashboards under:
  `/var/lib/grafana/dashboards`

### 7. Optional UI — React (Vite)

#### 7.1 Project Structure

Create a minimal React (Vite) UI in `/ui/` with:

- Vite + React + TypeScript
- TailwindCSS (optional)
- Axios for API calls

#### 7.2 Features

- Display `/api/status` metrics from telemetry-generator
- Auto-refresh every 5 seconds
- Panels:
  - Rack temperature
  - GPU utilization
  - Power draw
  - Network throughput
  - Cooling load
  - Node health

#### 7.3 File Placement

- `/ui/src/App.tsx` — main UI
- `/ui/src/api.ts` — API client
- `/ui/index.html` — root HTML

#### 7.4 Requirements

- Clean, minimal UI
- No charts required (text + simple bars OK)
- Must run locally via:
  `npm install && npm run dev`

#### 7.5 Non-goals

- No Kubernetes deployment for UI
- No Terraform integration
- No authentication

---

## NON-GOALS

Do NOT implement:

- Real electrical engineering simulation
- Real SCADA systems
- Real GPU cluster orchestration
- Liquid cooling physics
- Over-engineered enterprise architecture
- Unnecessary microservices
- Anything not listed in FEATURES TO IMPLEMENT

---

## FOLDER STRUCTURE

```
/src/telemetry-generator        C# .NET 10 Minimal API service
  /Models                       Record types (RackMetrics, StatusResponse)
  /Services                     MetricsGeneratorService (IHostedService)
  Program.cs                    App bootstrap + endpoint registration
  appsettings.json              Externalized configuration

/infra/k8s
  namespaces.yaml               telemetry + monitoring namespaces
  telemetry-generator.yaml      Deployment + Service
  prometheus.yaml               Prometheus Deployment + ConfigMap + rules
  grafana.yaml                  Grafana Deployment + provisioning ConfigMaps

/infra/terraform
  providers.tf                  Providers + variables + locals
  cluster.tf                    Cluster creation + namespace resources
  manifests.tf                  null_resource manifest apply + outputs

/docs                           Architecture notes, runbook
```

---

## CODING STYLE REQUIREMENTS

- Minimal, readable, senior-level code
- `async`/`await` everywhere async is meaningful
- Dependency injection for all services
- Composition over inheritance
- All configuration externalized via `appsettings.json` / environment variables
- Small, testable increments
- No unnecessary comments; code should be self-documenting

---

## COPILOT BEHAVIOR

- Follow this document strictly
- Ask for clarification when needed
- Generate code in small steps
- Do **NOT** hallucinate hardware details
- Stay software-focused
- Reference `copilot-instructions.md` as source of truth

## Skills to Use

- Kubernetes Deployment Authoring
- Terraform Authoring
- Grafana Dashboard Authoring
- Prometheus Rule Authoring
