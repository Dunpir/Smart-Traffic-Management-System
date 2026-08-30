const API_BASE = '/api';

export const api = {
  // 1. Traffic Control
  async getTrafficStatus() {
    const res = await fetch(`${API_BASE}/traffic-status`);
    return res.json();
  },

  async setMode(mode: 'AUTOMATIC' | 'MANUAL') {
    const res = await fetch(`${API_BASE}/traffic/mode`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode }),
    });
    return res.json();
  },

  async sendManualCommand(direction: string, signal: string, duration: number = 30) {
    const res = await fetch(`${API_BASE}/traffic/manual-command`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ direction, signal, duration }),
    });
    return res.json();
  },

  async startCycle() {
    const res = await fetch(`${API_BASE}/traffic/start`, { method: 'POST' });
    return res.json();
  },

  async stopCycle() {
    const res = await fetch(`${API_BASE}/traffic/stop`, { method: 'POST' });
    return res.json();
  },

  async resetJunction() {
    const res = await fetch(`${API_BASE}/traffic/reset`, { method: 'POST' });
    return res.json();
  },

  async resolveEmergency() {
    const res = await fetch(`${API_BASE}/traffic/resolve-emergency`, { method: 'POST' });
    return res.json();
  },

  async injectEmergency(direction: string, vehicleType: string = 'AMBULANCE') {
    const res = await fetch(`${API_BASE}/simulation/emergency`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ direction, vehicleType }),
    });
    return res.json();
  },

  async getThresholds() {
    const res = await fetch(`${API_BASE}/traffic/thresholds`);
    return res.json();
  },

  async updateThresholds(thresholds: any) {
    const res = await fetch(`${API_BASE}/traffic/thresholds`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(thresholds),
    });
    return res.json();
  },

  // 2. Hardware Layer
  async getHardwareStatus() {
    const res = await fetch(`${API_BASE}/hardware/status`);
    return res.json();
  },

  async toggleHardware(connected: boolean, port?: string) {
    const res = await fetch(`${API_BASE}/hardware/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ connected, port }),
    });
    return res.json();
  },

  async sendHardwareSensorData(data: any) {
    const res = await fetch(`${API_BASE}/hardware/sensor-data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  // 3. Database & Neo4j
  async getDatabaseStatus() {
    const res = await fetch(`${API_BASE}/database/status`);
    return res.json();
  },

  async getDatabaseStats() {
    const res = await fetch(`${API_BASE}/database/stats`);
    return res.json();
  },

  async getDatabaseGraph() {
    const res = await fetch(`${API_BASE}/database/graph`);
    return res.json();
  },

  async executeCypher(query: string, params: any = {}) {
    const res = await fetch(`${API_BASE}/database/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, params }),
    });
    return res.json();
  },

  async getDatabaseEvents() {
    const res = await fetch(`${API_BASE}/database/events`);
    return res.json();
  },

  // 4. Simulation Engine
  async getSimulationStatus() {
    const res = await fetch(`${API_BASE}/simulation/status`);
    return res.json();
  },

  async startSimulation() {
    const res = await fetch(`${API_BASE}/simulation/start`, { method: 'POST' });
    return res.json();
  },

  async stopSimulation() {
    const res = await fetch(`${API_BASE}/simulation/stop`, { method: 'POST' });
    return res.json();
  },

  async setScenario(scenario: string) {
    const res = await fetch(`${API_BASE}/simulation/scenario`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario }),
    });
    return res.json();
  },

  async triggerSpike(direction: string = 'WEST', vehicleCount: number = 38) {
    const res = await fetch(`${API_BASE}/simulation/spike`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ direction, vehicleCount }),
    });
    return res.json();
  },

  async triggerEmergency(direction: string = 'WEST', vehicleType: string = 'AMBULANCE') {
    const res = await fetch(`${API_BASE}/simulation/emergency`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ direction, vehicleType }),
    });
    return res.json();
  },

  // 5. Analytics
  async getTimeseries(roadId?: string) {
    const url = roadId ? `${API_BASE}/analytics/timeseries?roadId=${roadId}` : `${API_BASE}/analytics/timeseries`;
    const res = await fetch(url);
    return res.json();
  },

  async getRoadComparison() {
    const res = await fetch(`${API_BASE}/analytics/roads`);
    return res.json();
  },

  async getSignalTimingHistory() {
    const res = await fetch(`${API_BASE}/analytics/timings`);
    return res.json();
  },

  async getEmergencyHistory() {
    const res = await fetch(`${API_BASE}/analytics/emergencies`);
    return res.json();
  },

  // 6. Pedestrian Crosswalk (PAB)
  async requestPedestrianCrossing(direction: string = 'ALL', accessibleMode: boolean = false) {
    const res = await fetch(`${API_BASE}/traffic/pedestrian-call`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ direction, accessibleMode }),
    });
    return res.json();
  },

  async getPedestrianStatus() {
    const res = await fetch(`${API_BASE}/traffic/pedestrian-status`);
    return res.json();
  },

  // 7. Automated E-Challan & ANPR Violations
  async getViolations(filters?: { roadId?: string; violationType?: string; status?: string; search?: string }) {
    const params = new URLSearchParams();
    if (filters?.roadId) params.append('roadId', filters.roadId);
    if (filters?.violationType) params.append('violationType', filters.violationType);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.search) params.append('search', filters.search);

    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${API_BASE}/violations${qs}`);
    return res.json();
  },

  async getViolationById(id: string) {
    const res = await fetch(`${API_BASE}/violations/${id}`);
    return res.json();
  },

  async triggerViolation(data: {
    direction: string;
    roadId?: string;
    violationType?: string;
    speedKmh?: number;
    plateNumber?: string;
    vehicleType?: string;
  }) {
    const res = await fetch(`${API_BASE}/violations/trigger`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async payViolation(id: string) {
    const res = await fetch(`${API_BASE}/violations/${id}/pay`, {
      method: 'POST',
    });
    return res.json();
  },

  async getViolationStats() {
    const res = await fetch(`${API_BASE}/violations/stats`);
    return res.json();
  },

  // 8. AI Predictive Rush-Hour Forecaster
  async getForecastTimeseries() {
    const res = await fetch(`${API_BASE}/forecast/timeseries`);
    return res.json();
  },

  async getRushHourCurves() {
    const res = await fetch(`${API_BASE}/forecast/rush-hour`);
    return res.json();
  },

  async getProactivePlan() {
    const res = await fetch(`${API_BASE}/forecast/proactive-tuning`);
    return res.json();
  },

  async applyProactivePlan() {
    const res = await fetch(`${API_BASE}/forecast/apply-tuning`, {
      method: 'POST',
    });
    return res.json();
  },

  // 9. Multi-Junction Metro City Map
  async getCityIntersections() {
    const res = await fetch(`${API_BASE}/city/intersections`);
    return res.json();
  },

  async getCityCorridors() {
    const res = await fetch(`${API_BASE}/city/corridors`);
    return res.json();
  },

  // 10. System Logs
  async getLogs(limit: number = 100, eventType?: string) {
    const url = eventType ? `${API_BASE}/logs?limit=${limit}&eventType=${eventType}` : `${API_BASE}/logs?limit=${limit}`;
    const res = await fetch(url);
    return res.json();
  },

  async clearLogs() {
    const res = await fetch(`${API_BASE}/logs/clear`, { method: 'POST' });
    return res.json();
  },
};

