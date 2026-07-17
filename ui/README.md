# DC Telemetry Dashboard UI

A minimal React + Vite + TypeScript UI for the DC Telemetry Simulator.

## Features

- **Real-time metrics** — Displays live data from the telemetry-generator service
- **Auto-refresh** — Updates every 5 seconds by default
- **Dark theme** — Low-contrast, eye-friendly dashboard
- **Responsive layout** — Grid layout that adapts to screen size
- **Color-coded metrics** — Visual indicators for temperature thresholds and health status

### Metrics Displayed per Rack

- **Rack Temperature** (°C) — with color thresholds (green < 70°C, yellow 70–80°C, red > 80°C)
- **GPU Utilization** (%)
- **Power Draw** (W)
- **Network Throughput** (Mbit/s)
- **Cooling Load** (%)
- **Node Health** — Green badge (healthy), Red badge (degraded)

## Getting Started

### Prerequisites

- Node.js 16+ and npm

### Installation

```bash
cd ui
npm install
```

### Development

```bash
npm run dev
```

The dashboard will be available at `http://localhost:3000` (or `http://localhost:3001` if port 3000 is already in use).

**Note:** Ensure the telemetry-generator service is running on `http://localhost:5249` first.

### Build for Production

```bash
npm run build
```

Output: `ui/dist/`

### Preview Production Build

```bash
npm run preview
```

## Configuration

The UI connects to the telemetry-generator service. The default API base URL is `http://localhost:5249`.

### Override API URL

Set the `VITE_API_URL` environment variable:

```bash
VITE_API_URL=http://your-backend-server:5249 npm run dev
```

Or edit `ui/src/api.ts` and change the `API_BASE` default.

## Development

### Project Structure

```
ui/
├── src/
│   ├── main.tsx          # React entry point
│   ├── App.tsx           # Main dashboard component
│   ├── App.css           # Styles (dark theme)
│   └── api.ts            # Axios API client + types
├── index.html            # Root HTML
├── package.json          # Dependencies
├── vite.config.ts        # Vite configuration
├── tsconfig.json         # TypeScript config
└── README.md
```

### Technologies

- **React 18** — UI framework
- **TypeScript** — Type safety
- **Vite** — Fast dev server and build tool
- **Axios** — HTTP client for API calls
- **CSS** — Minimal styling, no CSS frameworks

### Component Architecture

- **`App.tsx`** — Main component managing state and rendering
  - Fetches data on mount, sets up 5-second refresh interval
  - Displays loading, error, and data states
  - Renders `RackPanel` for each rack
- **`RackPanel`** — Card component for individual rack
  - Displays rack ID and health status
  - Renders `MetricBar` components for each metric
- **`MetricBar`** — Reusable metric display
  - Progress bar showing metric value as % of max
  - Color-coded based on metric type
- **`HealthBadge`** — Health status indicator
  - Green for healthy, red for degraded

### Styling

The dashboard uses a dark theme (`#0f1419` background) with semantic color coding:

- **Green** (`#10b981`) — Healthy, good range
- **Yellow** (`#f59e0b`) — Warning, elevated
- **Red** (`#ef4444`) — Critical, high alarm
- **Blue** (`#3b82f6`) — Normal metrics
- **Orange** (`#f97316`) — Power-related
- **Purple** (`#a855f7`) — Network-related
- **Cyan** (`#06b6d4`) — Cooling-related

## API Client

### `api.ts`

Exports a singleton `api` object with methods:

- **`api.getStatus()`** — Fetches `/api/status` from backend
  - Returns `StatusResponse` with `racks: RackMetrics[]`
  - Logs all requests/responses via Axios interceptors

- **`api.getHealthz()`** — Fetches `/healthz` for health check

### Types

```typescript
interface RackMetrics {
  rackId: string;
  temperatureCelsius: number;
  powerDrawWatts: number;
  coolingLoadPercent: number;
  gpuUtilizationPercent: number;
  networkThroughputMbps: number;
  nodeHealthy: boolean;
}

interface StatusResponse {
  status: string;
  timestamp: string;
  rackCount: number;
  racks: RackMetrics[];
}
```

## Architecture

The UI is intentionally **minimal and lightweight**:

- **No Kubernetes deployment** — Designed for local development
- **No Terraform integration** — Not part of infrastructure-as-code
- **No complex charting libraries** — Simple progress bars instead of D3/Recharts
- **Direct API calls** — Fetches JSON from backend `/api/status` endpoint
- **CORS-enabled backend** — Frontend runs on different port (3000/3001) than backend (5249)

## Debugging

Open the browser Developer Console (F12) to see debug logs:

- `[App]` — Component lifecycle and state changes
- `[API]` — API request/response details
- `[Axios]` — HTTP client logs

Example:
```
[App] Component mounted, initializing...
[API] Fetching status from: http://localhost:5249/api/status
[Axios] GET http://localhost:5249/api/status
[Axios] Response 200 from http://localhost:5249/api/status
[App] Data fetched successfully: {...}
```

## Troubleshooting

**Blank page with no errors?**
- Check that backend is running on http://localhost:5249
- Open DevTools Console and look for network errors

**CORS error?**
- Backend must have CORS enabled (see `Program.cs` in backend)
- Ensure `app.UseCors()` is called after `app.Build()`

**404 on /api/status?**
- Verify backend is running: `curl http://localhost:5249/api/status`
- Check API base URL: edit `VITE_API_URL` or `ui/src/api.ts`

**Port 3000 already in use?**
- Vite will automatically use port 3001 or higher
- Or manually specify: `npm run dev -- --port 3002`

## Non-Goals

- No charts or complex visualizations
- No real-time WebSocket updates (polling only)
- No user authentication
- No Kubernetes or Terraform integration
- No production deployments (use Grafana for that)

