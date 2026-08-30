import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import { CONFIG } from './config/environment';
import apiRouter from './routes';
import { logger } from './services/loggerService';
import { dbService } from './database/neo4j';
import { hardwareService } from './services/hardwareService';
import { trafficEngine } from './services/trafficEngine';
import { emergencyManager } from './services/emergencyManager';
import { simulationEngine } from './services/simulationEngine';

const app = express();
const server = http.createServer(app);

// CORS configuration
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  })
);

app.use(express.json());

// Attach REST API routes
app.use('/api', apiRouter);

// Root healthcheck
app.get('/health', (req, res) => {
  res.json({
    status: 'HEALTHY',
    service: 'Intelligent Traffic Signal Controller Middleware',
    time: new Date().toISOString(),
    neo4j: dbService.getStatus().mode,
    hardware: hardwareService.getState().connected ? 'PHYSICAL' : 'SIMULATED',
  });
});

// Setup Socket.IO
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Universal Broadcast Helper
const broadcastSocketEvent = (event: string, data: any) => {
  io.emit(event, data);
};

// Wire socket broadcasters to services
logger.setSocketBroadcaster(broadcastSocketEvent);
hardwareService.setSocketBroadcaster(broadcastSocketEvent);
trafficEngine.setSocketBroadcaster(broadcastSocketEvent);
emergencyManager.setSocketBroadcaster(broadcastSocketEvent);
simulationEngine.setSocketBroadcaster(broadcastSocketEvent);

io.on('connection', (socket) => {
  // Push initial snapshot on connection
  socket.emit('junction:telemetry', trafficEngine.getLiveTelemetry());
  socket.emit('hardware:state', hardwareService.getState());
  socket.emit('database:status', dbService.getStatus());
  socket.emit('simulation:state', simulationEngine.getConfig());
  socket.emit('emergency:active', emergencyManager.getActiveEmergency());

  socket.on('disconnect', () => {
    // Client disconnected
  });
});

// Start Server
server.listen(CONFIG.PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚦 INTELLIGENT TRAFFIC SIGNAL CONTROLLER SERVER READY 🚦`);
  console.log(`   Port:         http://localhost:${CONFIG.PORT}`);
  console.log(`   API Endpoint: http://localhost:${CONFIG.PORT}/api`);
  console.log(`   Neo4j Target: ${CONFIG.NEO4J.URI} (${CONFIG.NEO4J.DATABASE})`);
  console.log(`   Simulation:   ${CONFIG.SIMULATION.ENABLED ? 'ACTIVE' : 'OFF'}`);
  console.log(`=======================================================`);
});

// Graceful Shutdown
const handleShutdown = async () => {
  console.log('\nShutting down Traffic Controller server gracefully...');
  await dbService.close();
  server.close(() => {
    console.log('Server closed. Goodbye!');
    process.exit(0);
  });
};

process.on('SIGINT', handleShutdown);
process.on('SIGTERM', handleShutdown);
