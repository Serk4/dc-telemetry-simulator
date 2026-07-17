import axios from 'axios';

export interface RackMetrics {
  rack_id: string;
  temperature_celsius: number;
  power_draw_watts: number;
  cooling_load_percent: number;
  gpu_utilization_percent: number;
  network_throughput_Mbit_per_second: number;
  node_healthy: boolean;
}

export interface StatusResponse {
  timestamp: string;
  racks: RackMetrics[];
}

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5249';

export const api = {
  getStatus: async (): Promise<StatusResponse> => {
    try {
      const response = await axios.get<StatusResponse>(`${API_BASE}/api/status`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch status:', error);
      throw error;
    }
  },

  getHealthz: async (): Promise<{ status: string }> => {
    try {
      const response = await axios.get(`${API_BASE}/healthz`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch health status:', error);
      throw error;
    }
  }
};
