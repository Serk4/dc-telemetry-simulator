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
  const tempColor = rack.temperatureCelsius > 80 ? 'red' : rack.temperatureCelsius > 70 ? 'yellow' : 'green';

  return (
    <div className="rack-panel">
      <div className="rack-header">
        <h2>Rack {rack.rackId}</h2>
        <HealthBadge healthy={rack.nodeHealthy} />
      </div>

      <div className="metrics-grid">
        <MetricBar
          label="Temperature"
          value={rack.temperatureCelsius}
          max={100}
          unit="°C"
          color={tempColor}
        />
        <MetricBar
          label="GPU Utilization"
          value={rack.gpuUtilizationPercent}
          max={100}
          unit="%"
          color="blue"
        />
        <MetricBar label="Power Draw" value={rack.powerDrawWatts} max={4000} unit="W" color="orange" />
        <MetricBar
          label="Network Throughput"
          value={rack.networkThroughputMbps}
          max={10000}
          unit="Mbit/s"
          color="purple"
        />
        <MetricBar
          label="Cooling Load"
          value={rack.coolingLoadPercent}
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
  const [isInitialized, setIsInitialized] = useState(false);

  const fetchData = async () => {
    try {
      console.log('[App] Fetching data...');
      setError(null);
      const response = await api.getStatus();
      console.log('[App] Data fetched successfully:', response);
      setData(response);
      setLoading(false);
    } catch (err) {
      console.error('[App] Error fetching data:', err);
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch metrics';
      setError(errorMsg);
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('[App] Component mounted, initializing...');
    if (!isInitialized) {
      setIsInitialized(true);
      fetchData();
      const interval = setInterval(fetchData, 5000);
      return () => {
        console.log('[App] Cleaning up interval');
        clearInterval(interval);
      };
    }
  }, [isInitialized]);

  console.log('[App] Render state:', { loading, error, hasData: !!data });

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
        {error && (
          <div className="error-banner">
            <strong>Error:</strong> {error}
            <br />
            <small>Make sure the telemetry-generator service is running on http://localhost:5249</small>
          </div>
        )}
        {loading && !data && <div className="loading">Loading metrics...</div>}
        {!loading && !data && !error && <div className="no-data">No rack data available</div>}
        {data && (
          <div className="racks-container">
            {data.racks.length > 0 ? (
              data.racks.map((rack) => <RackPanel key={rack.rackId} rack={rack} />)
            ) : (
              <div className="no-data">No racks found in telemetry data</div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
