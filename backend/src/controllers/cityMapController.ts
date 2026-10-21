import { Request, Response } from 'express';
import { CityIntersectionNode, CityIncident, IncidentType, Direction, LightState } from '../types';
import { trafficEngine } from '../services/trafficEngine';
import { emergencyManager } from '../services/emergencyManager';

// In-memory active incidents tracking
let activeIncidents: CityIncident[] = [
  {
    id: 'INC-201',
    type: 'CONSTRUCTION_ZONE',
    title: 'Ashram Underpass Metro Expansion',
    junctionId: 'J009',
    severity: 'MEDIUM',
    impactDelayMin: 4.5,
    reportedAt: new Date(Date.now() - 1800000).toISOString(),
    description: 'Lane 2 barricaded for pier construction. Right turns restricted to 1 lane.',
    active: true,
  },
  {
    id: 'INC-202',
    type: 'AMBULANCE_DISPATCH',
    title: 'AIIMS Trauma Emergency Corridor Active',
    junctionId: 'J002',
    severity: 'HIGH',
    impactDelayMin: 0,
    reportedAt: new Date(Date.now() - 300000).toISOString(),
    description: 'Cat-1 Priority Green corridor cleared from Ring Road into AIIMS Trauma Centre.',
    active: true,
  },
];

// In-memory junction override map
const junctionOverrides: Record<string, { signal?: LightState; direction?: Direction; cycleLength?: number }> = {};

export const getCityIntersections = (req: Request, res: Response) => {
  const liveTelemetry = trafficEngine.getLiveTelemetry();
  const activeEmergency = emergencyManager.getActiveEmergency();

  const intersections: CityIntersectionNode[] = [
    {
      id: 'J001',
      name: 'Connaught Place Central Circle',
      code: 'CP-01',
      locationName: 'Radial Arterial Inner Ring',
      x: 50,
      y: 36,
      lat: 28.6315,
      lng: 77.2167,
      activeDirection: junctionOverrides['J001']?.direction || liveTelemetry.activeDirection,
      currentSignal: junctionOverrides['J001']?.signal || liveTelemetry.roads[liveTelemetry.activeDirection]?.currentSignal || 'GREEN',
      vehicleCount: liveTelemetry.totalVehicleCount,
      congestionLevel: liveTelemetry.congestionIndex > 70 ? 'HIGH' : liveTelemetry.congestionIndex > 40 ? 'MEDIUM' : 'LOW',
      connectedNodeIds: ['J005', 'J008', 'J004'],
      hasEmergency: Boolean(activeEmergency),
      efficiencyRating: '94.2%',
      queues: {
        NORTH: liveTelemetry.roads.NORTH?.vehicleCount || 12,
        SOUTH: liveTelemetry.roads.SOUTH?.vehicleCount || 10,
        EAST: liveTelemetry.roads.EAST?.vehicleCount || 14,
        WEST: liveTelemetry.roads.WEST?.vehicleCount || 9,
      },
      secondsRemaining: 18,
      cycleLength: junctionOverrides['J001']?.cycleLength || 60,
      pedestrianWaiting: 8,
      activeIncident: activeIncidents.find((i) => i.junctionId === 'J001' && i.active) || null,
      cctvOnline: true,
      speedKmh: 46,
    },
    {
      id: 'J002',
      name: 'AIIMS Ring Road Flyover Intercept',
      code: 'AIIMS-02',
      locationName: 'Sri Aurobindo Marg & Ring Road',
      x: 48,
      y: 64,
      lat: 28.5672,
      lng: 77.2100,
      activeDirection: junctionOverrides['J002']?.direction || 'NORTH',
      currentSignal: junctionOverrides['J002']?.signal || 'GREEN',
      vehicleCount: 42,
      congestionLevel: 'HIGH',
      connectedNodeIds: ['J008', 'J005', 'J006', 'J003'],
      hasEmergency: true,
      efficiencyRating: '88.1%',
      queues: { NORTH: 16, SOUTH: 11, EAST: 8, WEST: 7 },
      secondsRemaining: 24,
      cycleLength: junctionOverrides['J002']?.cycleLength || 65,
      pedestrianWaiting: 14,
      activeIncident: activeIncidents.find((i) => i.junctionId === 'J002' && i.active) || null,
      cctvOnline: true,
      speedKmh: 38,
    },
    {
      id: 'J003',
      name: 'Cyber City Expressway Plaza',
      code: 'CYB-03',
      locationName: 'NH-48 DLF Phase 2 Corridor',
      x: 18,
      y: 78,
      lat: 28.4900,
      lng: 77.0900,
      activeDirection: junctionOverrides['J003']?.direction || 'WEST',
      currentSignal: junctionOverrides['J003']?.signal || 'GREEN',
      vehicleCount: 56,
      congestionLevel: 'CRITICAL',
      connectedNodeIds: ['J008', 'J002'],
      hasEmergency: false,
      efficiencyRating: '82.4%',
      queues: { NORTH: 18, SOUTH: 22, EAST: 9, WEST: 7 },
      secondsRemaining: 12,
      cycleLength: junctionOverrides['J003']?.cycleLength || 80,
      pedestrianWaiting: 5,
      activeIncident: activeIncidents.find((i) => i.junctionId === 'J003' && i.active) || null,
      cctvOnline: true,
      speedKmh: 28,
    },
    {
      id: 'J004',
      name: 'Sector 62 Electronic City Hub',
      code: 'SEC62-04',
      locationName: 'Noida Model Town Crossing',
      x: 82,
      y: 42,
      lat: 28.6250,
      lng: 77.3650,
      activeDirection: junctionOverrides['J004']?.direction || 'EAST',
      currentSignal: junctionOverrides['J004']?.signal || 'RED',
      vehicleCount: 31,
      congestionLevel: 'MEDIUM',
      connectedNodeIds: ['J001', 'J007'],
      hasEmergency: false,
      efficiencyRating: '91.2%',
      queues: { NORTH: 7, SOUTH: 8, EAST: 11, WEST: 5 },
      secondsRemaining: 28,
      cycleLength: junctionOverrides['J004']?.cycleLength || 60,
      pedestrianWaiting: 3,
      activeIncident: activeIncidents.find((i) => i.junctionId === 'J004' && i.active) || null,
      cctvOnline: true,
      speedKmh: 52,
    },
    {
      id: 'J005',
      name: 'India Gate C-Hexagon Circle',
      code: 'INDG-05',
      locationName: 'Kartavya Path Arterial Ring',
      x: 58,
      y: 46,
      lat: 28.6129,
      lng: 77.2295,
      activeDirection: junctionOverrides['J005']?.direction || 'SOUTH',
      currentSignal: junctionOverrides['J005']?.signal || 'GREEN',
      vehicleCount: 22,
      congestionLevel: 'LOW',
      connectedNodeIds: ['J001', 'J002', 'J006', 'J009'],
      hasEmergency: false,
      efficiencyRating: '96.5%',
      queues: { NORTH: 5, SOUTH: 6, EAST: 6, WEST: 5 },
      secondsRemaining: 35,
      cycleLength: junctionOverrides['J005']?.cycleLength || 55,
      pedestrianWaiting: 18,
      activeIncident: activeIncidents.find((i) => i.junctionId === 'J005' && i.active) || null,
      cctvOnline: true,
      speedKmh: 58,
    },
    {
      id: 'J006',
      name: 'Lajpat Nagar Flyover Junction',
      code: 'LJP-06',
      locationName: 'Feroze Gandhi Marg & Inner Ring',
      x: 62,
      y: 66,
      lat: 28.5700,
      lng: 77.2400,
      activeDirection: junctionOverrides['J006']?.direction || 'WEST',
      currentSignal: junctionOverrides['J006']?.signal || 'RED',
      vehicleCount: 35,
      congestionLevel: 'MEDIUM',
      connectedNodeIds: ['J002', 'J005', 'J009'],
      hasEmergency: false,
      efficiencyRating: '89.5%',
      queues: { NORTH: 10, SOUTH: 9, EAST: 8, WEST: 8 },
      secondsRemaining: 15,
      cycleLength: junctionOverrides['J006']?.cycleLength || 60,
      pedestrianWaiting: 12,
      activeIncident: activeIncidents.find((i) => i.junctionId === 'J006' && i.active) || null,
      cctvOnline: true,
      speedKmh: 42,
    },
    {
      id: 'J007',
      name: 'Noida Expressway Mahamaya Gateway',
      code: 'NOIDA-07',
      locationName: 'Sector 44 Yamuna Bank Bypass',
      x: 86,
      y: 76,
      lat: 28.5480,
      lng: 77.3300,
      activeDirection: junctionOverrides['J007']?.direction || 'EAST',
      currentSignal: junctionOverrides['J007']?.signal || 'GREEN',
      vehicleCount: 48,
      congestionLevel: 'HIGH',
      connectedNodeIds: ['J004', 'J009'],
      hasEmergency: false,
      efficiencyRating: '91.0%',
      queues: { NORTH: 14, SOUTH: 12, EAST: 12, WEST: 10 },
      secondsRemaining: 22,
      cycleLength: junctionOverrides['J007']?.cycleLength || 70,
      pedestrianWaiting: 2,
      activeIncident: activeIncidents.find((i) => i.junctionId === 'J007' && i.active) || null,
      cctvOnline: true,
      speedKmh: 64,
    },
    {
      id: 'J008',
      name: 'Dhaula Kuan Mega Interchange',
      code: 'DK-08',
      locationName: 'Vandemataram Marg & NH-48 Hub',
      x: 28,
      y: 52,
      lat: 28.5921,
      lng: 77.1610,
      activeDirection: junctionOverrides['J008']?.direction || 'NORTH',
      currentSignal: junctionOverrides['J008']?.signal || 'GREEN',
      vehicleCount: 44,
      congestionLevel: 'HIGH',
      connectedNodeIds: ['J001', 'J003', 'J002'],
      hasEmergency: false,
      efficiencyRating: '87.6%',
      queues: { NORTH: 15, SOUTH: 13, EAST: 9, WEST: 7 },
      secondsRemaining: 31,
      cycleLength: junctionOverrides['J008']?.cycleLength || 75,
      pedestrianWaiting: 4,
      activeIncident: activeIncidents.find((i) => i.junctionId === 'J008' && i.active) || null,
      cctvOnline: true,
      speedKmh: 50,
    },
    {
      id: 'J009',
      name: 'Ashram Chowk Elevated Ring Hub',
      code: 'ASH-09',
      locationName: 'Mathura Road & DND Flyway Nexus',
      x: 72,
      y: 72,
      lat: 28.5714,
      lng: 77.2588,
      activeDirection: junctionOverrides['J009']?.direction || 'SOUTH',
      currentSignal: junctionOverrides['J009']?.signal || 'RED',
      vehicleCount: 50,
      congestionLevel: 'CRITICAL',
      connectedNodeIds: ['J005', 'J006', 'J007'],
      hasEmergency: false,
      efficiencyRating: '79.8%',
      queues: { NORTH: 17, SOUTH: 15, EAST: 10, WEST: 8 },
      secondsRemaining: 9,
      cycleLength: junctionOverrides['J009']?.cycleLength || 85,
      pedestrianWaiting: 9,
      activeIncident: activeIncidents.find((i) => i.junctionId === 'J009' && i.active) || null,
      cctvOnline: true,
      speedKmh: 31,
    },
  ];

  const totalVehicles = intersections.reduce((sum, n) => sum + n.vehicleCount, 0);

  res.json({
    success: true,
    data: {
      city: 'Delhi-NCR Metropolitan Smart Corridor',
      totalActiveIntersections: intersections.length,
      connectedCorridorsCount: 12,
      networkCongestionAverage: '51.4%',
      aggregateStats: {
        totalVehiclesInCity: totalVehicles,
        averageSpeedKmh: 47.3,
        activeIncidentsCount: activeIncidents.filter((i) => i.active).length,
        greenWaveBandEfficiency: '94.8%',
      },
      intersections,
      incidents: activeIncidents,
    },
  });
};

export const getCityCorridorRoutes = (req: Request, res: Response) => {
  const routes = [
    {
      id: 'CORR-01',
      name: 'East-West Capital Expressway (Gurgaon - Noida)',
      from: 'J003',
      to: 'J004',
      via: ['J008', 'J001'],
      totalDistanceKm: 34.2,
      synchronizedGreenWave: true,
      averageSpeedKmh: 56,
    },
    {
      id: 'CORR-02',
      name: 'North-South Heritage & Medical Corridor',
      from: 'J001',
      to: 'J002',
      via: ['J005', 'J006'],
      totalDistanceKm: 14.8,
      synchronizedGreenWave: true,
      averageSpeedKmh: 48,
    },
    {
      id: 'CORR-03',
      name: 'Trans-Yamuna DND Expressway Link',
      from: 'J009',
      to: 'J007',
      via: [],
      totalDistanceKm: 11.4,
      synchronizedGreenWave: true,
      averageSpeedKmh: 68,
    },
    {
      id: 'CORR-04',
      name: 'Outer Ring Radial Connector',
      from: 'J008',
      to: 'J002',
      via: [],
      totalDistanceKm: 8.6,
      synchronizedGreenWave: true,
      averageSpeedKmh: 52,
    },
    {
      id: 'CORR-05',
      name: 'Central Secretariat Ring Corridor',
      from: 'J001',
      to: 'J005',
      via: [],
      totalDistanceKm: 4.2,
      synchronizedGreenWave: true,
      averageSpeedKmh: 58,
    },
  ];

  res.json({ success: true, data: routes });
};

export const injectCityIncident = (req: Request, res: Response) => {
  const { type, title, junctionId, severity, impactDelayMin, description } = req.body;

  const newIncident: CityIncident = {
    id: `INC-${Math.floor(100 + Math.random() * 900)}`,
    type: (type as IncidentType) || 'ACCIDENT_BLOCK',
    title: title || 'Reported Incident on Node',
    junctionId: junctionId || 'J001',
    severity: severity || 'MEDIUM',
    impactDelayMin: Number(impactDelayMin) || 3.5,
    reportedAt: new Date().toISOString(),
    description: description || 'Traffic operations team notified. Autonomous signal retiming active.',
    active: true,
  };

  activeIncidents.unshift(newIncident);

  res.json({
    success: true,
    message: 'Incident injected into Metropolitan Grid',
    data: newIncident,
  });
};

export const resolveCityIncident = (req: Request, res: Response) => {
  const { incidentId } = req.body;
  activeIncidents = activeIncidents.filter((i) => i.id !== incidentId);

  res.json({
    success: true,
    message: 'Incident cleared from Metropolitan Grid',
    incidentId,
  });
};

export const overrideCityJunction = (req: Request, res: Response) => {
  const { junctionId, signal, direction, cycleLength } = req.body;

  if (!junctionOverrides[junctionId]) {
    junctionOverrides[junctionId] = {};
  }

  if (signal) junctionOverrides[junctionId].signal = signal;
  if (direction) junctionOverrides[junctionId].direction = direction;
  if (cycleLength) junctionOverrides[junctionId].cycleLength = Number(cycleLength);

  res.json({
    success: true,
    message: `Junction ${junctionId} telemetry overridden`,
    data: junctionOverrides[junctionId],
  });
};
