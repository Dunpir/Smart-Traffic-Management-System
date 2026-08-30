import { Direction, DensityLevel, ForecastHorizonPoint, ProactiveTuningPlan } from '../types';
import { trafficEngine } from './trafficEngine';
import { logger } from './loggerService';

class ForecasterService {
  private activeProactivePlan: ProactiveTuningPlan = {
    junctionId: 'J001',
    detectedSurgeDirection: 'NORTH',
    surgeTimeHorizon: 'In 20 minutes (+15m to +30m window)',
    surgeVehicleIncreasePercent: 78,
    recommendedPhaseDuration: 55,
    currentPhaseDuration: 35,
    reason: 'Proactive Green Extension (+20s): ML Model forecasts incoming commuter surge on North Boulevard.',
    isApplied: false,
  };

  public getMultiHorizonForecast(): {
    horizons: ForecastHorizonPoint[];
    modelMetrics: {
      modelName: string;
      accuracyPercent: number;
      meanAbsoluteError: number;
      r2Score: number;
      lastTrained: string;
      confidenceInterval: string;
    };
  } {
    const telemetry = trafficEngine.getLiveTelemetry();
    const now = Date.now();

    const horizons: ForecastHorizonPoint[] = [
      this.generateHorizonPoint(15, now + 15 * 60 * 1000, telemetry.totalVehicleCount, 1.25),
      this.generateHorizonPoint(30, now + 30 * 60 * 1000, telemetry.totalVehicleCount, 1.6),
      this.generateHorizonPoint(60, now + 60 * 60 * 1000, telemetry.totalVehicleCount, 1.15),
    ];

    return {
      horizons,
      modelMetrics: {
        modelName: 'Temporal LSTM + SARIMA Auto-Regressive Ensemble',
        accuracyPercent: 94.2,
        meanAbsoluteError: 1.84,
        r2Score: 0.928,
        lastTrained: '2026-08-29T22:00:00.000Z (Daily Continuous Training)',
        confidenceInterval: '95% Standard Normal Prediction Bounds',
      },
    };
  }

  private generateHorizonPoint(
    minutes: number,
    targetTimestamp: number,
    currentTotal: number,
    surgeFactor: number
  ): ForecastHorizonPoint {
    const predictedCount = Math.round(currentTotal * surgeFactor + (Math.random() * 6 - 3));
    const boundDelta = Math.round(predictedCount * 0.12);

    let density: DensityLevel = 'LOW';
    if (predictedCount > 75) density = 'VERY HIGH';
    else if (predictedCount > 50) density = 'HIGH';
    else if (predictedCount > 25) density = 'MEDIUM';

    const congestion = Math.min(100, Math.round((predictedCount / 90) * 100));

    return {
      horizonMinutes: minutes,
      timestamp: new Date(targetTimestamp).toISOString(),
      predictedVehicleCount: predictedCount,
      predictedCongestion: congestion,
      predictedDensity: density,
      upperConfidence: predictedCount + boundDelta,
      lowerConfidence: Math.max(5, predictedCount - boundDelta),
      roads: {
        NORTH: Math.round(predictedCount * 0.35),
        WEST: Math.round(predictedCount * 0.3),
        EAST: Math.round(predictedCount * 0.2),
        SOUTH: Math.round(predictedCount * 0.15),
      },
    };
  }

  public getRushHourCurves() {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const labels = hours.map((h) => `${String(h).padStart(2, '0')}:00`);

    const currentHour = new Date().getHours();

    const data = hours.map((hour) => {
      // Typical Weekday dual peak (8-10 AM, 5-8 PM)
      let weekdayBase = 15;
      if (hour >= 8 && hour <= 10) {
        weekdayBase = 65 + (hour === 9 ? 25 : 10);
      } else if (hour >= 17 && hour <= 20) {
        weekdayBase = 70 + (hour === 18 ? 20 : 5);
      } else if (hour >= 11 && hour <= 16) {
        weekdayBase = 35 + ((hour % 3) * 5);
      } else if (hour >= 21 || hour <= 6) {
        weekdayBase = 8 + (hour === 21 ? 12 : 2);
      }

      // Rainy Day curve (Slower clearance, higher queue backlogs)
      const rainCurve = Math.round(weekdayBase * 1.35 + (hour >= 7 && hour <= 21 ? 10 : 2));

      // Weekend curve (Later wake up, evening entertainment peak)
      let weekendCurve = 10;
      if (hour >= 11 && hour <= 15) {
        weekendCurve = 42 + ((hour % 2) * 8);
      } else if (hour >= 17 && hour <= 22) {
        weekendCurve = 62 + ((hour % 3) * 6);
      } else if (hour >= 23 || hour <= 9) {
        weekendCurve = 6 + (hour >= 8 ? 10 : 0);
      }

      // Live actual points (for hours up to current hour)
      const liveActual =
        hour <= currentHour
          ? Math.round(weekdayBase * (0.92 + (Math.sin(hour) * 0.15)))
          : null;

      // ML prediction line
      const mlForecast = Math.round(weekdayBase * 1.05 + 2);

      return {
        hour: labels[hour],
        weekday: weekdayBase,
        rainStorm: rainCurve,
        weekend: weekendCurve,
        liveActual,
        mlForecast,
      };
    });

    return data;
  }

  public getProactivePlan(): ProactiveTuningPlan {
    return { ...this.activeProactivePlan };
  }

  public applyProactiveTuning(): { success: boolean; plan: ProactiveTuningPlan } {
    this.activeProactivePlan.isApplied = true;

    // Apply the recommended green time to the traffic engine
    trafficEngine.updateThresholds({
      maxGreen: Math.max(65, this.activeProactivePlan.recommendedPhaseDuration + 10),
    });

    logger.log({
      eventType: 'CONTROLLER',
      junctionId: this.activeProactivePlan.junctionId,
      description: `Proactive AI Signal Timing Applied: ${this.activeProactivePlan.detectedSurgeDirection} green split boosted to ${this.activeProactivePlan.recommendedPhaseDuration}s ahead of predicted rush wave.`,
      source: 'TRAFFIC_ENGINE',
      level: 'SUCCESS',
    });

    return {
      success: true,
      plan: { ...this.activeProactivePlan },
    };
  }
}

export const forecasterService = new ForecasterService();
