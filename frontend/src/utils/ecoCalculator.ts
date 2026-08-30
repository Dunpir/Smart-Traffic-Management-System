import { EcoMetrics } from '../types';

/**
 * Smart City Eco & Carbon Footprint Calculator
 * Compares dynamic rule-based signal timing vs. legacy fixed-time 60s cycle.
 */
export const calculateEcoMetrics = (
  totalVehicles: number,
  averageWaitTimeSec: number,
  simulatedHoursElapsed: number = 4.5
): EcoMetrics => {
  // Baseline fixed-time signal stats (historical benchmark)
  const FIXED_SIGNAL_AVG_WAIT_SEC = 46.0; // average waiting time at fixed 60s junction
  const IDLE_CO2_GRAMS_PER_SEC = 2.28; // EPA standard passenger car idle emission
  const IDLE_FUEL_ML_PER_SEC = 0.58; // Idle fuel burn per second
  const ANNUAL_TREE_CO2_ABSORPTION_KG = 21.77; // Average mature tree absorption per year

  const safeVehicles = Math.max(totalVehicles, 12);
  const safeWait = Math.max(averageWaitTimeSec, 8);

  // Time saved per vehicle
  const waitSavedSecPerVehicle = Math.max(FIXED_SIGNAL_AVG_WAIT_SEC - safeWait, 5);
  const idleReductionPercent = Math.round(
    ((FIXED_SIGNAL_AVG_WAIT_SEC - safeWait) / FIXED_SIGNAL_AVG_WAIT_SEC) * 100
  );

  // Cumulative volume factor based on simulated session
  const totalVolumeEstimate = Math.round(safeVehicles * (12 + simulatedHoursElapsed * 24));

  // Cumulative Savings
  const co2SavedGrams = totalVolumeEstimate * waitSavedSecPerVehicle * IDLE_CO2_GRAMS_PER_SEC;
  const co2SavedKg = parseFloat((co2SavedGrams / 1000).toFixed(2));
  const co2SavedTodayKg = parseFloat((co2SavedKg * 1.85).toFixed(1));

  const fuelSavedMl = totalVolumeEstimate * waitSavedSecPerVehicle * IDLE_FUEL_ML_PER_SEC;
  const fuelSavedLiters = parseFloat((fuelSavedMl / 1000).toFixed(2));

  const treesEquivalent = parseFloat(
    ((co2SavedKg / ANNUAL_TREE_CO2_ABSORPTION_KG) * 365).toFixed(1)
  );

  // Comparative Emissions
  const staticEmissionsKg = parseFloat(
    (
      (totalVolumeEstimate * FIXED_SIGNAL_AVG_WAIT_SEC * IDLE_CO2_GRAMS_PER_SEC) /
      1000
    ).toFixed(2)
  );
  const smartEmissionsKg = parseFloat(
    (
      (totalVolumeEstimate * safeWait * IDLE_CO2_GRAMS_PER_SEC) /
      1000
    ).toFixed(2)
  );

  // Eco score calculation 0-100
  let ecoScore = Math.min(Math.max(Math.round(75 + idleReductionPercent * 0.7), 60), 99);
  if (idleReductionPercent > 25) ecoScore = 96;

  let ecoGrade: 'A+' | 'A' | 'B+' | 'B' | 'C' = 'A+';
  if (ecoScore >= 95) ecoGrade = 'A+';
  else if (ecoScore >= 90) ecoGrade = 'A';
  else if (ecoScore >= 80) ecoGrade = 'B+';
  else if (ecoScore >= 70) ecoGrade = 'B';
  else ecoGrade = 'C';

  return {
    co2SavedKg,
    co2SavedTodayKg,
    fuelSavedLiters,
    treesEquivalent,
    ecoScore,
    ecoGrade,
    idleReductionPercent,
    staticEmissionsKg,
    smartEmissionsKg,
  };
};
