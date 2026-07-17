import React, { useState, useEffect } from 'react';
import { api, StatusResponse, RackMetrics } from './api';
import './App.css';

const MetricBar: React.FC<{ label: string; value: number; max: number; unit: string; color?: string }> = ({
  label,
  value,
  max,
  unit,
  color = 'blue'
}) => {
  const percentage = (value / max) * 100;
  return (
    <div className="metric-item">
      <div className="metric-label">
        {label}: <span className="metric-value">{value.toFixed(1)} {unit}</span>
      </div>
      <div className="metric-bar-container">
        <div
          className={`metric-bar metric-${color}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
};

const HealthBadge: React.FC<{ healthy: boolean }> = ({ healthy }) => (
  <div className={`health-badge ${healthy ? 'healthy' : 'degraded'}`}>
    {healthy ? '✓ Healthy' : '✗ Degraded'}
  </div>
);

const RackPanel: React.FC<{ rack: RackMetrics }> = ({ rack }) => {
  const tempColor = rack.temperature_celsius > 80 ? 'red' : rack.temperature_celsius > 70 ? 'yellow' : 'green';

  return (
    <div className="rack-panel">
      <div className="rack-header">
        <h2>Rack {rack.rack_id}</h2>
        <HealthBadge healthy={rack.node_healthy} />
      </div>

      <div className="metrics-grid">
        <MetricBar
          label="Temperature"
          value={rack.temperature_celsius}
          max={100}
          unit="°C"
          color={tempColor}
        />
        <MetricBar
          label="GPU Utilization"
          value={rack.gpu_utilization_percent}
          max={100}
          unit="%"
          color="blue"
        />
        <MetricBar label="Power Draw" value={rack.power_draw_watts} max={4000} unit="W" color="orange" />
        <MetricBar
          label="Network Throughput"
          value={rack.network_throughput_Mbit_per_second}
          max={10000}
          unit="Mbit/s"
          color="purple"
        />
        <MetricBar
          label="Cooling Load"
          value={rack.cooling_load_percent}
          max={100}
          unit="%"
          color="cyan"
        />
      </div>
    </div>
  );
};

export default function App() {
  const [data, setData] = useState<StatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.getStatus();
      setData(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch metrics');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <h1>DC Telemetry Dashboard</h1>
        <div className="header-info">
          {data && <span className="timestamp">Last updated: {new Date(data.timestamp).toLocaleTimeString()}</span>}
          <button className="refresh-btn" onClick={fetchData} disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </header>

      <main className="app-main">
        {error && <div className="error-banner">{error}</div>}
        {loading && !data && <div className="loading">Loading metrics...</div>}
        {data && (
          <div className="racks-container">
            {data.racks.length > 0 ? (
              data.racks.map((rack) => <RackPanel key={rack.rack_id} rack={rack} />)
            ) : (
              <div className="no-data">No rack data available</div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
