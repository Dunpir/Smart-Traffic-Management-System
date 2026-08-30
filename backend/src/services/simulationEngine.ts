import { Direction, EmergencyVehicleType } from '../types';
import { trafficEngine } from './trafficEngine';
import { emergencyManager } from './emergencyManager';
import { logger } from './loggerService';

export interface SimulationConfig {
  isRunning: boolean;
  tickIntervalMs: number;
  scenario: 'NORMAL_FLUCTUATION' | 'MORNING_RUSH' | 'EVENING_RUSH' | 'RAIN_STORM';
  autoEmergencySpawn: boolean;
}

class SimulationEngine {
  private config: SimulationConfig = {
    isRunning: true,
    tickIntervalMs: 4000,
    scenario: 'NORMAL_FLUCTUATION',
    autoEmergencySpawn: false,
  };

  private timer: NodeJS.Timeout | null = null;
  private socketBroadcaster: ((event: string, data: any) => void) | null = null;

  constructor() {
    if (this.config.isRunning) {
      this.start();
    }
  }

  public setSocketBroadcaster(broadcaster: (event: string, data: any) => void) {
    this.socketBroadcaster = broadcaster;
  }

  public getConfig(): SimulationConfig {
    return { ...this.config };
  }

  public start() {
    this.config.isRunning = true;
    if (this.timer) clearInterval(this.timer);

    this.timer = setInterval(() => {
      this.simulationTick();
    }, this.config.tickIntervalMs);

    logger.log({
      eventType: 'SIMULATION',
      junctionId: 'J001',
      description: `Traffic Simulation started [Scenario: ${this.config.scenario}, Tick: ${this.config.tickIntervalMs}ms].`,
      source: 'SIMULATOR',
      level: 'INFO',
    });

    this.broadcastState();
  }

  public stop() {
    this.config.isRunning = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }

    logger.log({
      eventType: 'SIMULATION',
      junctionId: 'J001',
      description: 'Traffic Simulation stopped.',
      source: 'SIMULATOR',
      level: 'WARNING',
    });

    this.broadcastState();
  }

  public setScenario(scenario: SimulationConfig['scenario']) {
    this.config.scenario = scenario;
    logger.log({
      eventType: 'SIMULATION',
      junctionId: 'J001',
      description: `Simulation scenario switched to: ${scenario}`,
      source: 'SIMULATOR',
      level: 'INFO',
    });
    this.broadcastState();
  }

  public setTickInterval(intervalMs: number) {
    this.config.tickIntervalMs = Math.max(1000, intervalMs);
    if (this.config.isRunning) {
      this.start();
    }
  }

  /**
   * Generates a sudden traffic spike on a chosen road (e.g. West Road = 38 vehicles)
   */
  public async generateTrafficSpike(direction: Direction = 'WEST', vehicleCount: number = 38) {
    const roadMap: Record<Direction, { roadId: string; sensorId: string; speed: number }> = {
      NORTH: { roadId: 'R001', sensorId: 'C001', speed: 50 },
      SOUTH: { roadId: 'R002', sensorId: 'C002', speed: 50 },
      EAST: { roadId: 'R003', sensorId: 'C003', speed: 60 },
      WEST: { roadId: 'R004', sensorId: 'C004', speed: 60 },
    };

    const target = roadMap[direction];

    // Trigger IR occupancy
    trafficEngine.handleIRSensorUpdate({
      roadId: target.roadId,
      sensorId: target.sensorId.replace('C', 'IR'),
      isActive: true,
    });

    // Update vehicle count
    await trafficEngine.handleVehicleCountUpdate({
      junctionId: 'J001',
      roadId: target.roadId,
      sensorId: target.sensorId,
      count: vehicleCount,
      flowRate: `${Math.round(vehicleCount * 1.3)} veh/min`,
    });

    logger.log({
      eventType: 'SIMULATION',
      junctionId: 'J001',
      roadId: target.roadId,
      description: `Traffic Congestion Spike injected on ${direction} Road: ${vehicleCount} vehicles.`,
      source: 'SIMULATOR',
      level: 'WARNING',
    });
  }

  /**
   * Triggers an emergency vehicle through the simulator
   */
  public async generateEmergency(
    direction: Direction = 'WEST',
    vehicleType: EmergencyVehicleType = 'AMBULANCE'
  ) {
    return await emergencyManager.triggerEmergency({
      direction,
      vehicleType,
      priorityLevel: 'CRITICAL',
      durationSeconds: 30,
      isSimulated: true,
    });
  }

  /**
   * Simulation Tick: randomly and realistically adjusts vehicle counts according to current scenario
   */
  private async simulationTick() {
    const telemetry = trafficEngine.getLiveTelemetry();
    const directions: Direction[] = ['NORTH', 'SOUTH', 'EAST', 'WEST'];

    for (const dir of directions) {
      const road = telemetry.roads[dir];
      let currentCount = road.vehicleCount;
      const isGreen = road.currentSignal === 'GREEN';

      // Discharge vehicles if green, accumulate vehicles if red
      if (isGreen) {
        const discharge = Math.floor(Math.random() * 4) + 1; // 1-4 cars pass
        currentCount = Math.max(2, currentCount - discharge);
      } else {
        // Influx based on scenario
        let influx = Math.floor(Math.random() * 3); // 0-2 cars arrive
        if (this.config.scenario === 'MORNING_RUSH' && (dir === 'NORTH' || dir === 'SOUTH')) {
          influx = Math.floor(Math.random() * 4) + 2;
        } else if (this.config.scenario === 'EVENING_RUSH' && (dir === 'EAST' || dir === 'WEST')) {
          influx = Math.floor(Math.random() * 4) + 2;
        } else if (this.config.scenario === 'RAIN_STORM') {
          influx = Math.floor(Math.random() * 3) + 1;
        }
        currentCount = Math.min(45, currentCount + influx);
      }

      // IR sensor stop-line trigger if queue is >= 15 cars
      const irActive = currentCount >= 15;
      trafficEngine.handleIRSensorUpdate({
        roadId: road.roadId,
        sensorId: `IR00${directions.indexOf(dir) + 1}`,
        isActive: irActive,
      });

      // Update vehicle count
      await trafficEngine.handleVehicleCountUpdate({
        junctionId: 'J001',
        roadId: road.roadId,
        sensorId: `C00${directions.indexOf(dir) + 1}`,
        count: currentCount,
        flowRate: `${Math.round(currentCount * 1.2)} veh/min`,
      });
    }
  }

  private broadcastState() {
    if (this.socketBroadcaster) {
      this.socketBroadcaster('simulation:state', this.getConfig());
    }
  }
}

export const simulationEngine = new SimulationEngine();
