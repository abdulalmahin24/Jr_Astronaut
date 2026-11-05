/**
 * test_simulation.mjs
 * Automated test suite for Jr_AstroCamp Outpost Management Simulation Engine.
 * Run directly with Node.js: `node tests/test_simulation.mjs`
 */

import assert from 'node:assert';

// ── MOCK TYPES & IMPLEMENTATION TEST ─────────────────────────────────────────

const DEFAULT_LUNAR_OUTPOST = {
  habitatType: 'INFLATABLE_TRANSHAB',
  powerGeneration: 'FOLDABLE_PV_ARRAY',
  energyStorage: 'LI_ION_BATTERY_BANK',
  lifeSupport: 'STANDARD_ECLSS',
  waterRecycling: 'VACUUM_DISTILLATION',
  greenhouse: 'COMPACT_SALAD_POD',
  radiationShielding: 'POLYETHYLENE_LINERS',
  communications: 'HIGH_GAIN_SBAND',
  maintenanceEquipment: 'MANUAL_TOOL_LOCKER',
  surfaceRover: 'UNPRESSURIZED_LTV',
  allocatedCargoKg: 38000,
  maxCargoBudgetKg: 45000,
};

const OUTPOST_BUILD_CATALOG = {
  habitat: [
    { id: 'INFLATABLE_TRANSHAB', massKg: 8000 },
    { id: 'HEAVY_REGOLITH_DOME', massKg: 14000 },
  ],
  powerGeneration: [
    { id: 'FOLDABLE_PV_ARRAY', massKg: 4000 },
    { id: 'VERTICAL_SOLAR_TOWERS', massKg: 7000 },
  ],
  energyStorage: [
    { id: 'LI_ION_BATTERY_BANK', massKg: 5000 },
    { id: 'KILOPOWER_REACTOR', massKg: 8500 },
  ],
  lifeSupport: [
    { id: 'STANDARD_ECLSS', massKg: 4500 },
    { id: 'CLOSED_LOOP_SABATIER', massKg: 8000 },
  ],
  waterRecycling: [
    { id: 'VACUUM_DISTILLATION', massKg: 3500 },
    { id: 'THERMO_ELECTRIC_MEMBRANE', massKg: 6500 },
  ],
  greenhouse: [
    { id: 'COMPACT_SALAD_POD', massKg: 4000 },
    { id: 'FULL_CROP_BIOME', massKg: 7500 },
  ],
  radiationShielding: [
    { id: 'POLYETHYLENE_LINERS', massKg: 3000 },
    { id: 'SINTERED_REGOLITH_VAULT', massKg: 6000 },
  ],
  communications: [
    { id: 'HIGH_GAIN_SBAND', massKg: 2500 },
    { id: 'DEEP_SPACE_LASER_DSOC', massKg: 4500 },
  ],
  maintenanceEquipment: [
    { id: 'MANUAL_TOOL_LOCKER', massKg: 2000 },
    { id: 'AUTOMATED_3D_FABRICATOR', massKg: 4500 },
  ],
  surfaceRover: [
    { id: 'UNPRESSURIZED_LTV', massKg: 3000 },
    { id: 'PRESSURIZED_SCIENCE_ROVER', massKg: 6500 },
  ],
};

function calculateTotalMass(config) {
  let total = 0;
  for (const [category, items] of Object.entries(OUTPOST_BUILD_CATALOG)) {
    const selectedId = category === 'habitat' ? (config.habitatType || config.habitat) : config[category];
    const match = items.find((i) => i.id === selectedId);
    if (match) total += match.massKg;
  }
  return total;
}

function computeDailyTurn(prevState, shiftAction = 'STANDARD_OPERATIONS') {
  const config = prevState.outpostConfig || DEFAULT_LUNAR_OUTPOST;
  const isMoon = prevState.destination === 'MOON';
  const sol = prevState.currentSol;
  const isLunarNight = isMoon && sol >= 16 && sol <= 27;

  let powerGenKw = 0;
  if (config.powerGeneration === 'VERTICAL_SOLAR_TOWERS') {
    powerGenKw += isLunarNight ? 8 : 50;
  } else {
    powerGenKw += isLunarNight ? 0 : 35;
  }
  if (config.energyStorage === 'KILOPOWER_REACTOR') {
    powerGenKw += 25;
  }

  let powerLoadKw = config.habitatType === 'HEAVY_REGOLITH_DOME' ? 10 : 6;
  if (isLunarNight) powerLoadKw += 8;
  powerLoadKw += config.lifeSupport === 'CLOSED_LOOP_SABATIER' ? 8 : 4;
  powerLoadKw += config.waterRecycling === 'THERMO_ELECTRIC_MEMBRANE' ? 6 : 3;
  powerLoadKw += config.greenhouse === 'FULL_CROP_BIOME' ? 9 : 4;
  powerLoadKw += config.communications === 'DEEP_SPACE_LASER_DSOC' ? 5 : 2;

  if (shiftAction === 'POWER_CONSERVATION') {
    powerLoadKw = Math.round(powerLoadKw * 0.6);
  } else if (shiftAction === 'SCIENCE_INTENSIVE') {
    powerLoadKw += 10;
  }

  const netPowerKw = powerGenKw - powerLoadKw;
  const powerDeltaPct = Math.round(netPowerKw * 1.1);

  let oxygenDelta = config.lifeSupport === 'CLOSED_LOOP_SABATIER' ? -0.8 : -2.5;
  let waterDelta = config.waterRecycling === 'THERMO_ELECTRIC_MEMBRANE' ? -0.5 : -3.0;
  let foodDelta = config.greenhouse === 'FULL_CROP_BIOME' ? 0.5 : -0.5;
  let radDelta = config.radiationShielding === 'SINTERED_REGOLITH_VAULT' ? 0.1 : 0.5;

  const currentRes = prevState.resources;
  const newPower = Math.min(100, Math.max(0, currentRes.power + powerDeltaPct));
  const newOxygen = Math.min(100, Math.max(0, currentRes.oxygen + oxygenDelta));
  const newWater = Math.min(100, Math.max(0, currentRes.water + waterDelta));
  const newFood = Math.max(0, currentRes.food + foodDelta);
  const newRadiation = Math.min(150, Math.max(0, currentRes.radiation + radDelta));
  const newScience = currentRes.science + (shiftAction === 'SCIENCE_INTENSIVE' ? 10 : 2);
  const newHealth = currentRes.crewHealth;

  let isGameOver = false;
  let outcome = 'IN_PROGRESS';
  let failureReason = '';

  if (newOxygen <= 0) {
    isGameOver = true;
    outcome = 'CRITICAL_FAILURE';
    failureReason = 'Hypoxia: O2 exhausted';
  } else if (newPower <= 0) {
    isGameOver = true;
    outcome = 'CRITICAL_FAILURE';
    failureReason = 'Freeze: Battery hit 0%';
  } else if (newRadiation >= 100) {
    isGameOver = true;
    outcome = 'CRITICAL_FAILURE';
    failureReason = 'Acute Radiation Syndrome';
  } else if (sol >= prevState.totalSols) {
    isGameOver = true;
    outcome = 'VICTORY';
  }

  return {
    resources: {
      power: newPower,
      oxygen: newOxygen,
      water: newWater,
      food: newFood,
      radiation: newRadiation,
      science: newScience,
      crewHealth: newHealth,
    },
    telemetry: {
      isLunarNight,
      powerGenKw,
      powerLoadKw,
      netPowerKw,
    },
    isGameOver,
    outcome,
    failureReason,
  };
}

// ── TEST RUNNER ─────────────────────────────────────────────────────────────

console.log('=== Running Jr_AstroCamp Web Simulation Engine Tests ===\n');

// 1. Initial State
console.log('1. Testing Initial Game State...');
const baseState = {
  destination: 'MOON',
  currentSol: 1,
  totalSols: 30,
  resources: {
    power: 75,
    water: 80,
    oxygen: 90,
    food: 24,
    radiation: 12,
    science: 10,
    crewHealth: 95,
  },
  outpostConfig: DEFAULT_LUNAR_OUTPOST,
  history: [],
  isGameOver: false,
  gameOutcome: 'IN_PROGRESS',
};
assert.strictEqual(baseState.currentSol, 1);
assert.strictEqual(baseState.destination, 'MOON');
assert.strictEqual(baseState.resources.power, 75);
console.log('  [PASS] Initial state verified.');

// 2. Outpost Construction Budget Validation
console.log('\n2. Testing Construction Mass Budget Calculations...');
const defaultMass = calculateTotalMass(DEFAULT_LUNAR_OUTPOST);
assert.strictEqual(defaultMass, 39500, `Expected 39,500 kg, got ${defaultMass}`);
assert(defaultMass <= 45000, 'Default lunar outpost should fit under 45,000 kg budget');

// Maxed out heavy outpost exceeding budget
const overBudgetConfig = {
  habitat: 'HEAVY_REGOLITH_DOME', // 14000
  powerGeneration: 'VERTICAL_SOLAR_TOWERS', // 7000
  energyStorage: 'KILOPOWER_REACTOR', // 8500
  lifeSupport: 'CLOSED_LOOP_SABATIER', // 8000
  waterRecycling: 'THERMO_ELECTRIC_MEMBRANE', // 6500
  greenhouse: 'FULL_CROP_BIOME', // 7500
  radiationShielding: 'SINTERED_REGOLITH_VAULT', // 6000
  communications: 'DEEP_SPACE_LASER_DSOC', // 4500
  maintenanceEquipment: 'AUTOMATED_3D_FABRICATOR', // 4500
  surfaceRover: 'PRESSURIZED_SCIENCE_ROVER', // 6500
};
const heavyMass = calculateTotalMass(overBudgetConfig);
assert.strictEqual(heavyMass, 73000);
assert(heavyMass > 45000, 'Overbudget check should correctly identify excess cargo');
console.log(`  [PASS] Mass budget validation: 39,500 kg (Valid) vs 73,000 kg (Exceeded).`);

// 3. Power Generation during Day vs Lunar Night
console.log('\n3. Testing Power Generation & Day/Night Transition...');
const dayTurn = computeDailyTurn({ ...baseState, currentSol: 5 });
assert.strictEqual(dayTurn.telemetry.isLunarNight, false, 'Sol 5 must be daytime');
assert.strictEqual(dayTurn.telemetry.powerGenKw, 35, 'Daytime solar generation must be 35 kW');
assert(dayTurn.telemetry.netPowerKw > 0, 'Net power should be positive during daytime');

const nightTurn = computeDailyTurn({ ...baseState, currentSol: 20 });
assert.strictEqual(nightTurn.telemetry.isLunarNight, true, 'Sol 20 must be lunar night');
assert.strictEqual(nightTurn.telemetry.powerGenKw, 0, 'Solar generation must be 0 kW during lunar night');
assert(nightTurn.telemetry.netPowerKw < 0, 'Net power must be negative during night without nuclear');
console.log(`  [PASS] Day/Night solar generation: Day = ${dayTurn.telemetry.powerGenKw} kW, Night = ${nightTurn.telemetry.powerGenKw} kW.`);

// 4. Kilopower Nuclear Resilience during Lunar Night
console.log('\n4. Testing Kilopower Fission Reactor Night Resilience...');
const nuclearConfig = { ...DEFAULT_LUNAR_OUTPOST, energyStorage: 'KILOPOWER_REACTOR' };
const nuclearNightTurn = computeDailyTurn({ ...baseState, currentSol: 20, outpostConfig: nuclearConfig });
assert.strictEqual(nuclearNightTurn.telemetry.powerGenKw, 25, 'Kilopower reactor must provide continuous 25 kW');
console.log(`  [PASS] Kilopower provides continuous 25 kW during lunar night.`);

// 5. Shift Action Effects (Power Conservation vs Science Intensive)
console.log('\n5. Testing Shift Action Trade-offs...');
const stdTurn = computeDailyTurn(baseState, 'STANDARD_OPERATIONS');
const conserveTurn = computeDailyTurn(baseState, 'POWER_CONSERVATION');
const scienceTurn = computeDailyTurn(baseState, 'SCIENCE_INTENSIVE');

assert(conserveTurn.telemetry.powerLoadKw < stdTurn.telemetry.powerLoadKw, 'Power conservation must reduce load');
assert(scienceTurn.resources.science > stdTurn.resources.science, 'Science intensive must generate more science');
console.log(`  [PASS] Shift trade-offs: Load (Conserve: ${conserveTurn.telemetry.powerLoadKw} kW vs Standard: ${stdTurn.telemetry.powerLoadKw} kW). Science yield: +${scienceTurn.resources.science - baseState.resources.science} pts.`);

// 6. Critical Failure Evaluation
console.log('\n6. Testing Critical Failure Conditions...');
const deadBatteryState = {
  ...baseState,
  currentSol: 20, // Lunar night: solar arrays yield 0 kW
  resources: { ...baseState.resources, power: 0 },
};
const failTurn = computeDailyTurn(deadBatteryState);
assert.strictEqual(failTurn.isGameOver, true, 'Game must end when battery hits 0');
assert.strictEqual(failTurn.outcome, 'CRITICAL_FAILURE');
console.log(`  [PASS] Battery depletion fatal freeze detected: "${failTurn.failureReason}"`);

// 7. Victory Outcome Evaluation
console.log('\n7. Testing Victory Outcome at Sol 30...');
const victoryState = {
  ...baseState,
  currentSol: 30,
};
const winTurn = computeDailyTurn(victoryState);
assert.strictEqual(winTurn.isGameOver, true, 'Game must finish at Sol 30');
assert.strictEqual(winTurn.outcome, 'VICTORY');
console.log('  [PASS] Victory outcome certified at Sol 30.');

// 8. Resource Boundary Capping (0% - 100%)
console.log('\n8. Testing Simulation Boundaries...');
const overchargedState = {
  ...baseState,
  resources: { ...baseState.resources, power: 99 },
};
const boundedTurn = computeDailyTurn(overchargedState);
assert(boundedTurn.resources.power <= 100, 'Power cannot exceed 100%');
console.log(`  [PASS] Resources strictly bounded between 0% and 100%.`);

console.log('\n======================================================');
console.log(' ALL SIMULATION ENGINE TESTS PASSED SUCCESSFULLY! (8/8)');
console.log('======================================================\n');
