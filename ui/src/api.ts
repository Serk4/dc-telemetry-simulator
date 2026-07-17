import axios from 'axios';

export interface RackMetrics {
  rackId: string;
  temperatureCelsius: number;
  powerDrawWatts: number;
  coolingLoadPercent: number;
  gpuUtilizationPercent: number;
  networkThroughputMbps: number;
  nodeHealthy: boolean;
}

export interface StatusResponse {
  status: string;
  timestamp: string;
  rackCount: number;
  racks: RackMetrics[];
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5249';

// Add request/response logging for debugging
axios.interceptors.request.use(
  (config) => {
    console.log(`[Axios] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('[Axios] Request error:', error);
    return Promise.reject(error);
  }
);

axios.interceptors.response.use(
  (response) => {
    console.log(`[Axios] Response ${response.status} from ${response.config.url}`, response.data);
    return response;
  },
  (error) => {
    console.error('[Axios] Response error:', error.message, error.response?.status);
    return Promise.reject(error);
  }
);

export const api = {
  getStatus: async (): Promise<StatusResponse> => {
    try {
      const url = `${API_BASE}/api/status`;
      console.log(`[API] Fetching status from: ${url}`);
      const response = await axios.get<StatusResponse>(url);
      console.log('[API] Status response received:', response.data);
      return response.data;
    } catch (error) {
      console.error('[API] Failed to fetch status:', error);
      throw error;
    }
  },

  getHealthz: async (): Promise<{ status: string }> => {
    try {
      const url = `${API_BASE}/healthz`;
      console.log(`[API] Fetching health from: ${url}`);
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error('[API] Failed to fetch health status:', error);
      throw error;
    }
  }
};
