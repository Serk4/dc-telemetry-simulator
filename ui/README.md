# DC Telemetry Dashboard UI

A minimal React + Vite + TypeScript UI for the DC Telemetry Simulator.

## Features

- Displays real-time metrics from the telemetry-generator service
- Auto-refreshes every 5 seconds
- Shows metrics for each rack:
  - Rack temperature (°C)
  - GPU utilization (%)
  - Power draw (W)
  - Network throughput (Mbit/s)
  - Cooling load (%)
  - Node health status

## Getting Started

### Prerequisites

- Node.js 16+ and npm

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The dashboard will be available at `http://localhost:3000`

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Configuration

The UI connects to the telemetry-generator service. By default, it connects to `http://localhost:5249`.

To use a different API endpoint, set the environment variable:

```bash
REACT_APP_API_URL=http://your-server:port npm run dev
```

Or edit the `api.ts` file to change the default.

## Development

The project uses:

- **React 18** — UI framework
- **Vite** — Fast build tool
- **TypeScript** — Type safety
- **Axios** — HTTP client
- **CSS** — Styling (no framework, minimal CSS)

All components are in `src/`:

- `main.tsx` — Entry point
- `App.tsx` — Main dashboard component
- `App.css` — Styles
- `api.ts` — API client

## Architecture

The UI is intentionally minimal and has no Kubernetes deployment or Terraform integration. It's designed for local development and testing against the telemetry-generator service.

### No Charts Required

The dashboard uses simple progress bars and text displays instead of complex charting libraries, keeping the UI lightweight and focused.
