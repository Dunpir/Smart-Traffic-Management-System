import { Router } from 'express';
import * as trafficCtrl from '../controllers/trafficController';
import * as hardwareCtrl from '../controllers/hardwareController';
import * as databaseCtrl from '../controllers/databaseController';
import * as simulationCtrl from '../controllers/simulationController';
import * as analyticsCtrl from '../controllers/analyticsController';
import * as logCtrl from '../controllers/logController';
import * as violationCtrl from '../controllers/violationController';
import * as forecasterCtrl from '../controllers/forecasterController';
import * as cityMapCtrl from '../controllers/cityMapController';

const router = Router();

// ==========================================
// 1. TRAFFIC CONTROL & PEDESTRIAN APIS
// ==========================================
router.get('/traffic-status', trafficCtrl.getTrafficStatus);
router.get('/traffic/thresholds', trafficCtrl.getThresholds);
router.post('/traffic/thresholds', trafficCtrl.updateThresholds);
router.post('/traffic/mode', trafficCtrl.setMode);
router.post('/traffic/manual-command', trafficCtrl.manualSignalCommand);
router.post('/traffic/start', trafficCtrl.startCycle);
router.post('/traffic/stop', trafficCtrl.stopCycle);
router.post('/traffic/reset', trafficCtrl.resetJunction);
router.post('/traffic/resolve-emergency', trafficCtrl.resolveEmergency);
router.post('/traffic/pedestrian-call', trafficCtrl.requestPedestrianCrossing);
router.get('/traffic/pedestrian-status', trafficCtrl.getPedestrianStatus);

// ==========================================
// 2. AUTOMATED E-CHALLAN & ANPR VIOLATIONS
// ==========================================
router.get('/violations', violationCtrl.getViolations);
router.get('/violations/stats', violationCtrl.getViolationStats);
router.get('/violations/:id', violationCtrl.getViolationById);
router.post('/violations/trigger', violationCtrl.triggerViolation);
router.post('/violations/:id/pay', violationCtrl.payViolation);

// ==========================================
// 3. AI PREDICTIVE RUSH-HOUR FORECASTER
// ==========================================
router.get('/forecast/timeseries', forecasterCtrl.getForecast);
router.get('/forecast/rush-hour', forecasterCtrl.getRushHourCurves);
router.get('/forecast/proactive-tuning', forecasterCtrl.getProactivePlan);
router.post('/forecast/apply-tuning', forecasterCtrl.applyProactivePlan);

// ==========================================
// 4. MULTI-JUNCTION METRO CITY MAP
// ==========================================
router.get('/city/intersections', cityMapCtrl.getCityIntersections);
router.get('/city/corridors', cityMapCtrl.getCityCorridorRoutes);

// ==========================================
// 5. HARDWARE INTEGRATION APIS
// ==========================================
router.post('/hardware/sensor-data', hardwareCtrl.ingestSensorData);
router.post('/hardware/vehicle-data', hardwareCtrl.ingestVehicleData);
router.post('/hardware/emergency', hardwareCtrl.ingestHardwareEmergency);
router.post('/signal/command', hardwareCtrl.dispatchSignalCommand);
router.get('/hardware/status', hardwareCtrl.getHardwareStatus);
router.post('/hardware/toggle', hardwareCtrl.togglePhysicalHardware);

// ==========================================
// 6. DATABASE & NEO4J APIS
// ==========================================
router.get('/database/status', databaseCtrl.getDatabaseStatus);
router.get('/database/stats', databaseCtrl.getDatabaseStats);
router.get('/database/graph', databaseCtrl.getGraphData);
router.post('/database/query', databaseCtrl.executeCustomCypher);
router.get('/database/events', databaseCtrl.getRecentEvents);

// ==========================================
// 7. SIMULATION APIS
// ==========================================
router.get('/simulation/status', simulationCtrl.getSimulationStatus);
router.post('/simulation/start', simulationCtrl.startSimulation);
router.post('/simulation/stop', simulationCtrl.stopSimulation);
router.post('/simulation/scenario', simulationCtrl.setScenario);
router.post('/simulation/spike', simulationCtrl.injectSpike);
router.post('/simulation/emergency', simulationCtrl.injectEmergency);

import * as aiCtrl from '../controllers/aiController';

// ==========================================
// 8. ANALYTICS APIS
// ==========================================
router.get('/analytics/timeseries', analyticsCtrl.getTrafficTimeseries);
router.get('/analytics/roads', analyticsCtrl.getRoadComparison);
router.get('/analytics/timings', analyticsCtrl.getSignalTimingHistory);
router.get('/analytics/emergencies', analyticsCtrl.getEmergencyHistory);

// ==========================================
// 9. SYSTEM AUDIT LOGS APIS
// ==========================================
router.get('/logs', logCtrl.getSystemLogs);
router.post('/logs/clear', logCtrl.clearSystemLogs);

// ==========================================
// 10. AI GROQ & VOICE ASSISTANT APIS (Edge-TTS)
// ==========================================
router.post('/ai/chat', aiCtrl.handleAiChat);
router.get('/ai/status', aiCtrl.getAiStatus);
router.get('/ai/tts', aiCtrl.handleTtsSynthesis);
router.post('/ai/tts', aiCtrl.handleTtsSynthesis);

export default router;

