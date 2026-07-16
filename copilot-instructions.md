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

| Layer | Technology |
|-------|-----------|
| Backend | C# / .NET 10, Minimal API, Background Hosted Service |
| Observability | OpenTelemetry (metrics, logs, traces), Prometheus exporter |
| Infrastructure | Kubernetes (local: k3d or kind), Prometheus, Grafana |
| IaC | Terraform (minimal: cluster + namespaces + manifest apply) |
| Optional UI | React (Vite) |

---

## FEATURES TO IMPLEMENT

### 1. telemetry-generator (C# service)

Generates fake data center metrics:

| Metric | Unit | Range |
|--------|------|-------|
| rack temperature | °C | 20–90 (spikes >80 at 5% probability) |
| power draw | W | 500–4000 |
| cooling load | % | 0–100 |
| GPU utilization | % | 0–100 |
| network throughput | Mbit/s | 0–10 000 |
| node health | boolean | 98% healthy |

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

- Namespace `telemetry`: Deployment + Service for telemetry-generator
- Namespace `monitoring`: Prometheus + Grafana Deployments + Services

### 4. Terraform (minimal)

- Provision local k3d or kind cluster
- Create namespaces via Terraform kubernetes provider
- Apply manifests via `kubectl apply` local-exec

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