/**
 * simulationEngine.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Single authoritative simulation engine for Jr_AstroCamp Outpost Management.
 * Implements deterministic physics, resource accounting, day/night thermal
 * cycles, life-support mass balances, and trade-off mechanics based on
 * official NASA technical publications (BVAD, NASA-TP-2015-218570, NASA-TM-2018-219801).
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type {
  GameState,
  ResourceState,
  OutpostConfiguration,
  ShiftActionType,
  MissionObjective,
  Destination,
} from '../types/game';
import { SCIENCE_EVENTS, ENDING_SCENARIOS, METABOLIC_BALANCE, DIFFICULTY_PROFILES, CREW_SPECIALTY_BONUSES } from '../data/outpostBalanceConfig';

// ── DEFAULT OUTPOST CONFIGURATIONS ──────────────────────────────────────────

export const DEFAULT_LUNAR_OUTPOST: OutpostConfiguration = {
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
  allocatedCargoKg: 39500,
  maxCargoBudgetKg: 45000,
};

export const DEFAULT_MARS_OUTPOST: OutpostConfiguration = {
  habitatType: 'HEAVY_REGOLITH_DOME',
  powerGeneration: 'VERTICAL_SOLAR_TOWERS',
  energyStorage: 'KILOPOWER_REACTOR',
  lifeSupport: 'CLOSED_LOOP_SABATIER',
  waterRecycling: 'THERMO_ELECTRIC_MEMBRANE',
  greenhouse: 'FULL_CROP_BIOME',
  radiationShielding: 'SINTERED_REGOLITH_VAULT',
  communications: 'DEEP_SPACE_LASER_DSOC',
  maintenanceEquipment: 'AUTOMATED_3D_FABRICATOR',
  surfaceRover: 'PRESSURIZED_SCIENCE_ROVER',
  allocatedCargoKg: 58500,
  maxCargoBudgetKg: 60000,
};

// ── OUTPOST BUILDABLE MODULE SPECS (Mass & Trade-offs) ───────────────────────

export interface ModuleOptionSpec {
  id: string;
  name: string;
  massKg: number;
  powerKw: number; // positive = generation, negative = consumption
  description: string;
  benefits: string[];
  tradeOffs: string[];
}

export const OUTPOST_BUILD_CATALOG = {
  habitat: [
    {
      id: 'INFLATABLE_TRANSHAB',
      name: 'Inflatable TransHab Core',
      massKg: 8000,
      powerKw: -6,
      description: 'Expandable Kevlar/Nextel shell with 4-person living quarters and airlock.',
      benefits: ['Low launch mass (8,000 kg)', 'Rapid pneumatic deployment'],
      tradeOffs: ['Lower thermal inertia', 'Standard micrometeoroid protection'],
    },
    {
      id: 'HEAVY_REGOLITH_DOME',
      name: 'Heavy Regolith-Reinforced Dome',
      massKg: 14000,
      powerKw: -10,
      description: 'Rigid composite dome covered with 1.5m sintered regolith shielding.',
      benefits: ['+25% thermal stability', 'Superior micrometeoroid protection', '+15% storm vault resilience'],
      tradeOffs: ['High mass cost (14,000 kg)', 'Higher life support heating load'],
    },
  ],
  powerGeneration: [
    {
      id: 'FOLDABLE_PV_ARRAY',
      name: 'Deployable Solar PV Array (35 kW)',
      massKg: 4000,
      powerKw: 35,
      description: 'Ultra-lightweight triple-junction solar arrays deployed on tracking gimbals.',
      benefits: ['Lightweight (4,000 kg)', '+35 kW daytime generation'],
      tradeOffs: ['0 kW during the 354-hr lunar night', 'Vulnerable to regolith dust accumulation'],
    },
    {
      id: 'VERTICAL_SOLAR_TOWERS',
      name: 'South Pole Vertical Solar Towers (50 kW)',
      massKg: 7000,
      powerKw: 50,
      description: 'Tall vertical mast arrays optimized for grazing solar incidence at polar crater rims.',
      benefits: ['+50 kW peak generation', 'Captures perpetual ridge sunlight', 'Lower dust settling'],
      tradeOffs: ['Higher mass (7,000 kg)', 'Requires precision mast anchoring'],
    },
  ],
  energyStorage: [
    {
      id: 'LI_ION_BATTERY_BANK',
      name: 'Lithium-Ion Energy Storage (150 kWh)',
      massKg: 5000,
      powerKw: 0,
      description: 'High-density battery packs with active liquid thermal management.',
      benefits: ['Clean discharge buffer', 'Proven flight heritage'],
      tradeOffs: ['Limited 150 kWh capacity', 'Requires heavy daytime solar recharge'],
    },
    {
      id: 'KILOPOWER_REACTOR',
      name: '10 kWe Kilopower Fission Reactor (KRUSTY)',
      massKg: 8500,
      powerKw: 25,
      description: 'Enriched uranium reactor core with sodium heat-pipes and dual Stirling convertors.',
      benefits: ['Continuous 25 kW 24/7 power regardless of sun or dust', 'Immune to lunar night freeze'],
      tradeOffs: ['Mass intensive (8,500 kg)', 'Requires 100m standoff deployment distance'],
    },
  ],
  lifeSupport: [
    {
      id: 'STANDARD_ECLSS',
      name: 'Standard Physical-Chemical ECLSS',
      massKg: 4500,
      powerKw: -4,
      description: 'Electrolysis oxygen generation with amine-bed CO2 scrubbers.',
      benefits: ['Moderate mass (4,500 kg)', 'Reliable flight-tested hardware'],
      tradeOffs: ['Consumes 2.5% O2/sol', 'Requires regular filter replacement'],
    },
    {
      id: 'CLOSED_LOOP_SABATIER',
      name: 'Advanced Closed-Loop Sabatier/Bosch Unit',
      massKg: 8000,
      powerKw: -8,
      description: 'Converts carbon dioxide and hydrogen into water and oxygen at 98% closed efficiency.',
      benefits: ['98% atmospheric recovery', '+10% crew health buffer', 'Minimizes O2 losses to 0.5%/sol'],
      tradeOffs: ['Heavier mass (8,000 kg)', 'Draws 8 kW continuous power'],
    },
  ],
  waterRecycling: [
    {
      id: 'VACUUM_DISTILLATION',
      name: 'Vacuum Distillation Urine Processor (VPA)',
      massKg: 3500,
      powerKw: -3,
      description: 'Rotary distillation assembly for graywater and condensate recovery.',
      benefits: ['Low mass (3,500 kg)', '85% water recovery rate'],
      tradeOffs: ['15% water makeup needed each sol', 'Maintenance sensitive'],
    },
    {
      id: 'THERMO_ELECTRIC_MEMBRANE',
      name: 'Thermo-Electric Membrane Distillation (TEMD)',
      massKg: 6500,
      powerKw: -6,
      description: 'Forward osmosis and catalytic oxidation loop for 98% closed water recovery.',
      benefits: ['98% water recovery', 'Produces ultra-pure water', 'Drought-proof base loop'],
      tradeOffs: ['Mass cost (6,500 kg)', 'Requires 6 kW continuous heating'],
    },
  ],
  greenhouse: [
    {
      id: 'COMPACT_SALAD_POD',
      name: 'Compact Microgreen Salad Pod',
      massKg: 4000,
      powerKw: -4,
      description: 'Automated aeroponic growth chamber for fresh radish, lettuce, and microgreens.',
      benefits: ['Provides +0.5 rations/sol', '+3% crew psychological morale', 'Low water consumption'],
      tradeOffs: ['Cannot sustain full caloric requirements alone'],
    },
    {
      id: 'FULL_CROP_BIOME',
      name: 'Full-Scale Crop Biome (Wheat & Soy)',
      massKg: 7500,
      powerKw: -9,
      description: 'Multi-tiered LED growth chamber cultivating high-protein staples and tubers.',
      benefits: ['Produces +1.8 rations/sol', 'Absorbs CO2 and generates supplemental O2', '+8% crew vitality'],
      tradeOffs: ['High mass (7,500 kg)', 'Draws 9 kW power and 4% water/sol'],
    },
  ],
  radiationShielding: [
    {
      id: 'POLYETHYLENE_LINERS',
      name: 'Hydrogenated Polyethylene Liners (15 g/cm²)',
      massKg: 3000,
      powerKw: 0,
      description: 'Low-Z hydrogen-rich polymer blankets lining habitat interior bulkheads.',
      benefits: ['Lightweight (3,000 kg)', 'Effective against secondary neutron scattering'],
      tradeOffs: ['Moderate 35% GCR attenuation', 'Requires storm vault retreat during flares'],
    },
    {
      id: 'SINTERED_REGOLITH_VAULT',
      name: 'Automated Regolith Sintering Vault (2m thick)',
      massKg: 6000,
      powerKw: -3,
      description: 'Microwave-sintered regolith brick archway creating an impenetrable radiation bunker.',
      benefits: ['85% radiation block', 'Complete protection against Solar Particle Events (SPE)', 'Zero radiation creep'],
      tradeOffs: ['Heavy construction gear (6,000 kg)', 'Draws 3 kW maintenance power'],
    },
  ],
  communications: [
    {
      id: 'HIGH_GAIN_SBAND',
      name: 'High-Gain S/X-Band Tracking Antenna',
      massKg: 2500,
      powerKw: -2,
      description: 'Parabolic dish antenna tracking NASA Deep Space Network ground stations.',
      benefits: ['Proven reliability', 'Continuous telemetry voice and data carrier'],
      tradeOffs: ['Limited 4 Mbps bandwidth', 'Weather susceptible on Earth ground side'],
    },
    {
      id: 'DEEP_SPACE_LASER_DSOC',
      name: 'Deep Space Optical Communications (DSOC Laser)',
      massKg: 4500,
      powerKw: -5,
      description: 'Near-infrared laser transceiver transmitting high-definition science telemetry at 100 Mbps.',
      benefits: ['100 Mbps broadband', '+25% science research points from telemetry', 'Instant CapCom sync'],
      tradeOffs: ['Requires 5 kW power', 'Requires precise gimbal pointing alignment'],
    },
  ],
  maintenanceEquipment: [
    {
      id: 'MANUAL_TOOL_LOCKER',
      name: 'Manual Tool Locker & EVA Spare Kits',
      massKg: 2000,
      powerKw: 0,
      description: 'Standard socket wrenches, torque drivers, sealant tape, and spare O-rings.',
      benefits: ['Zero power drain', 'Minimal mass (2,000 kg)'],
      tradeOffs: ['Requires manual crew EVA hours for repairs', 'Finite spare parts stock'],
    },
    {
      id: 'AUTOMATED_3D_FABRICATOR',
      name: 'Automated Regolith/Polymer 3D Spare Parts Printer',
      massKg: 4500,
      powerKw: -4,
      description: 'Additive manufacturing facility printing replacement valves, gears, and structural brackets.',
      benefits: ['Auto-repairs equipment degradation each sol', '+25% base resilience', 'Infinite custom spares'],
      tradeOffs: ['Draws 4 kW power', 'Requires raw feedstock mass'],
    },
  ],
  surfaceRover: [
    {
      id: 'UNPRESSURIZED_LTV',
      name: 'Unpressurized Lunar Terrain Vehicle (LTV)',
      massKg: 3000,
      powerKw: -2,
      description: 'Open-cockpit 2-astronaut electric rover with wire-mesh wheels and drill mast.',
      benefits: ['Compact (3,000 kg)', 'Quick deployment for near-base EVA surveys'],
      tradeOffs: ['Astronauts must wear bulky EVA suits', 'Limited 15 km battery radius'],
    },
    {
      id: 'PRESSURIZED_SCIENCE_ROVER',
      name: 'Pressurized Habitable Science Rover (Small Pressurized Rover)',
      massKg: 6500,
      powerKw: -5,
      description: 'Cockpit-cabin rover allowing 7-day scientific expeditions in shirtsleeve environment.',
      benefits: ['Double science sampling yields', 'Safe shelter in field', 'Equipped with heavy rock corer'],
      tradeOffs: ['Mass intensive (6,500 kg)', 'Consumes 5 kW charging power'],
    },
  ],
};

// ── INITIAL OBJECTIVES GENERATOR ────────────────────────────────────────────

export function generateMissionObjectives(destination: Destination): MissionObjective[] {
  if (destination === 'MARS') {
    return [
      {
        id: 'obj-survive',
        title: 'Complete 30-Sol Martian Surface Expedition',
        description: 'Keep crew healthy and maintain outpost life support throughout the mission duration.',
        completed: false,
        requiredValue: 30,
        currentValue: 1,
        unit: 'Sols',
      },
      {
        id: 'obj-science',
        title: 'Biosignature & Geology Science Benchmark',
        description: 'Collect at least 200 Science Research Points from Jezero Crater exploration.',
        completed: false,
        requiredValue: 200,
        currentValue: 10,
        unit: 'Points',
      },
      {
        id: 'obj-dust',
        title: 'Weather Martian Dust Storms',
        description: 'Maintain power reserves and battery charge above 20% despite atmospheric dust opacity.',
        completed: false,
        requiredValue: 20,
        currentValue: 75,
        unit: '%',
      },
      {
        id: 'obj-health',
        title: 'Crew Physical & Psychological Health',
        description: 'Finish expedition with crew health index at or above 70%.',
        completed: false,
        requiredValue: 70,
        currentValue: 95,
        unit: '%',
      },
    ];
  }

  // Default: Lunar Artemis Base Camp
  return [
    {
      id: 'obj-survive',
      title: 'Complete 30-Sol Lunar South Pole Mission',
      description: 'Sustain permanent human outpost operations at Shackleton Crater.',
      completed: false,
      requiredValue: 30,
      currentValue: 1,
      unit: 'Sols',
    },
    {
      id: 'obj-lunar-night',
      title: 'Survive the 354-Hour Lunar Night',
      description: 'Maintain base power, life support, and heating during Sols 16 to 27 without blackout.',
      completed: false,
      requiredValue: 27,
      currentValue: 1,
      unit: 'Sols',
    },
    {
      id: 'obj-science',
      title: 'Polar Volatile Ice Research Benchmark',
      description: 'Accumulate at least 150 Science Research Points through rover and lab analysis.',
      completed: false,
      requiredValue: 150,
      currentValue: 10,
      unit: 'Points',
    },
    {
      id: 'obj-radiation',
      title: 'Radiation ALARA Protection',
      description: 'Keep cumulative crew radiation dose strictly below 50 mSv safe benchmark ceiling.',
      completed: false,
      requiredValue: 50,
      currentValue: 12,
      unit: 'mSv',
    },
  ];
}

// ── DAILY DETERMINISTIC SIMULATION TURN CALCULATOR ──────────────────────────

export interface TurnTelemetry {
  sol: number;
  isLunarNight: boolean;
  powerGeneratedKw: number;
  powerConsumedKw: number;
  netPowerKw: number;
  powerDeltaPct: number;
  oxygenDeltaPct: number;
  waterDeltaPct: number;
  foodDeltaRations: number;
  radiationDeltaMsv: number;
  equipmentWearDeltaPct: number;
  reportSummary: string;
}

export function computeDailySimulationTurn(
  prevState: GameState,
  shiftAction: ShiftActionType = 'STANDARD_OPERATIONS'
): {
  updatedResources: ResourceState;
  telemetry: TurnTelemetry;
  updatedObjectives: MissionObjective[];
  isGameOver: boolean;
  outcome: 'IN_PROGRESS' | 'VICTORY' | 'PARTIAL_SUCCESS' | 'CRITICAL_FAILURE';
  failureReason: string;
  activeWarning?: {
    title: string;
    message: string;
    hazardType: string;
    countdownSols: number;
    nasaDocReference?: string;
  } | null;
  endingScenarioId?: string;
  buildPointsEarned: number;
} {
  const config = prevState.outpostConfig || DEFAULT_LUNAR_OUTPOST;
  const isMoon = prevState.destination === 'MOON';
  const sol = prevState.currentSol;

  // Difficulty Profile Scaling (Cadet: 0.75x consumption, 0.7x storm severity, 6 BP/day; Officer: 1.0x, 1.0x, 4 BP/day; Commander: 1.25x, 1.4x, 3 BP/day)
  const diffTierKey: 'CADET' | 'OFFICER' | 'COMMANDER' =
    prevState.difficultyMode === 'CADET' || (prevState.difficultyMode as any) === 'EXPLORER'
      ? 'CADET'
      : prevState.difficultyMode === 'COMMANDER' || (prevState.difficultyMode as any) === 'SCIENTIST'
        ? 'COMMANDER'
        : 'OFFICER';
  const diffProfile = DIFFICULTY_PROFILES[diffTierKey] || DIFFICULTY_PROFILES.OFFICER;
  const consumptionMult = diffProfile.consumptionMultiplier;
  const stormMult = diffProfile.stormSeverityMultiplier;

  // 1. Day / Night & Environmental Conditions
  // On the Moon, Sols 15-28 correspond to the deep 354-hour lunar night (-130°C to -180°C, 0 kW solar)
  const isLunarNight = isMoon && sol >= 15 && sol <= 28;
  // On Mars, global dust storms during Sols 14-22 block up to 75% of solar irradiance
  const isMarsDustStorm = !isMoon && ((sol >= 14 && sol <= 22) || (prevState.activeEvent ? prevState.activeEvent.title.toLowerCase().includes('dust') : false));

  // 2. Power Generation
  let powerGenKw = 0;
  if (config.powerGeneration === 'VERTICAL_SOLAR_TOWERS') {
    // Polar towers catch grazing light even in shallow shadow
    powerGenKw += isLunarNight ? 8 : (isMarsDustStorm ? Math.round(12 / stormMult) : 50);
  } else {
    // Foldable PV arrays
    powerGenKw += isLunarNight ? 0 : (isMarsDustStorm ? Math.max(3, Math.round(9 / stormMult)) : 35);
  }

  // Kilopower reactor generates 25 kW 24/7 continuous (immune to night & dust storms)
  if (config.energyStorage === 'KILOPOWER_REACTOR') {
    powerGenKw += 25;
  }

  // 3. Power Consumption
  let powerLoadKw = 0;
  // Habitat heating & life support (modulated by difficulty mode)
  powerLoadKw += Math.round((config.habitatType === 'HEAVY_REGOLITH_DOME' ? 10 : 6) * (0.8 + 0.2 * consumptionMult));
  if (isLunarNight) powerLoadKw += Math.round(8 * (0.8 + 0.2 * stormMult)); // Extra thermal electric heating in cryogenic freeze

  // ECLSS & Water
  powerLoadKw += config.lifeSupport === 'CLOSED_LOOP_SABATIER' ? 8 : 4;
  powerLoadKw += config.waterRecycling === 'THERMO_ELECTRIC_MEMBRANE' ? 6 : 3;

  // Greenhouse
  powerLoadKw += config.greenhouse === 'FULL_CROP_BIOME' ? 9 : 4;

  // Comms & 3D Fabricator
  powerLoadKw += config.communications === 'DEEP_SPACE_LASER_DSOC' ? 5 : 2;
  if (config.maintenanceEquipment === 'AUTOMATED_3D_FABRICATOR') powerLoadKw += 4;
  if (config.radiationShielding === 'SINTERED_REGOLITH_VAULT') powerLoadKw += 3;

  // Shift Action Modifiers
  if (shiftAction === 'POWER_CONSERVATION') {
    powerLoadKw = Math.round(powerLoadKw * 0.6); // Cut non-essential subsystems
  } else if (shiftAction === 'SCIENCE_INTENSIVE') {
    powerLoadKw += 10; // High compute and lab ovens
  } else if (shiftAction === 'GREENHOUSE_SURGE') {
    powerLoadKw += 6; // Max 24-hr PAR grow lights
  } else if (shiftAction === 'ROVER_EVA') {
    powerLoadKw += 5; // Rover recharge battery cycle
  }

  const netPowerKw = powerGenKw - powerLoadKw;
  // Net power directly changes battery storage % (approx 1 kW deficit = -1.2% battery per 24hr sol)
  const powerDeltaPct = Math.round(netPowerKw * 1.1);

  // Interdependent state checks
  const isPowerBlackout = prevState.resources.power <= 0 || (prevState.resources.power <= 10 && netPowerKw < -10);
  const isWaterDrought = prevState.resources.water < 20;

  // 4. Life Support (Oxygen, Water, Food) with Chain Reactions
  // Oxygen: Sabatier needs electrical power to run catalytic electrolyzers
  let oxygenDelta = -2.5 * consumptionMult; // Baseline human metabolic consumption (BVAD)
  if (isPowerBlackout) {
    oxygenDelta = -5.0 * consumptionMult; // Blackout halts all O2 generation and CO2 scrubbing pumps
  } else if (config.lifeSupport === 'CLOSED_LOOP_SABATIER') {
    oxygenDelta = -0.8 * consumptionMult; // Sabatier recovers 50%+ O2
  }

  // Water: Distillation loops need thermal/electrical power
  let waterDelta = -3.5 * consumptionMult; // Baseline human consumption
  if (isPowerBlackout) {
    waterDelta = -4.5 * consumptionMult; // Blackout shuts down water recovery pumps
  } else if (config.waterRecycling === 'THERMO_ELECTRIC_MEMBRANE') {
    waterDelta = -0.5 * consumptionMult; // High-efficiency recycling recovers 90%+
  }
  if (shiftAction === 'ECLSS_MAINTENANCE' && !isPowerBlackout) {
    waterDelta += 4;
    oxygenDelta += 3;
  }

  // Food & Greenhouse: Space Farmer bonus enhances crop yield and biomass O2
  let foodDelta = -1.0 * consumptionMult; // 1 ration consumed by crew per sol
  if (isPowerBlackout || isWaterDrought) {
    // Crops wither without power grow-lights or irrigation water
    foodDelta = -2.0 * consumptionMult;
  } else {
    if (config.greenhouse === 'FULL_CROP_BIOME') {
      foodDelta += 1.5 * CREW_SPECIALTY_BONUSES.FARMER.cropHarvestMultiplier; // Net food surplus from hydroponic tubers & wheat
      oxygenDelta += 0.8 * CREW_SPECIALTY_BONUSES.FARMER.cropHarvestMultiplier; // Plants give off O2
    } else if (config.greenhouse === 'COMPACT_SALAD_POD') {
      foodDelta += 0.5 * CREW_SPECIALTY_BONUSES.FARMER.cropHarvestMultiplier; // Fresh greens supplement
      oxygenDelta += 0.3 * CREW_SPECIALTY_BONUSES.FARMER.cropHarvestMultiplier;
    }
    if (shiftAction === 'GREENHOUSE_SURGE') foodDelta += 0.8 * CREW_SPECIALTY_BONUSES.FARMER.cropHarvestMultiplier;
  }

  // Radiation & Shielding: Low shielding allows cosmic rays and SPE to penetrate
  const currentShielding = prevState.resources.shielding ?? 70;
  let radDelta = 0.5 * stormMult; // Baseline GCR scaled by storm severity
  if (currentShielding < 30) {
    radDelta += 1.8 * stormMult; // Severe radiation penetration due to degraded shielding!
  } else if (config.radiationShielding === 'SINTERED_REGOLITH_VAULT') {
    radDelta = 0.1 * stormMult; // Sintered rock blocks 85%
  } else if (config.habitatType === 'HEAVY_REGOLITH_DOME') {
    radDelta = 0.25 * stormMult;
  }
  if (shiftAction === 'POWER_CONSERVATION') {
    radDelta = Math.max(0.05, radDelta * 0.6);
  }

  // Equipment Wear & Maintenance (Engineer bonus: 25% slower equipment wear, 50% faster repair):
  let equipDelta = -1.5 * CREW_SPECIALTY_BONUSES.ENGINEER.equipmentWearMultiplier;
  if (config.maintenanceEquipment === 'AUTOMATED_3D_FABRICATOR' && !isPowerBlackout) {
    equipDelta += 1.0;
  }
  if (shiftAction === 'ECLSS_MAINTENANCE') {
    equipDelta += 5.0 * CREW_SPECIALTY_BONUSES.ENGINEER.repairSpeedMultiplier;
  }

  // 5. Apply Updates to Resources
  const currentRes = prevState.resources;
  const newPower = Math.min(100, Math.max(0, currentRes.power + powerDeltaPct));
  const newOxygen = Math.min(100, Math.max(0, currentRes.oxygen + oxygenDelta));
  const newWater = Math.min(100, Math.max(0, currentRes.water + waterDelta));
  const newFood = Math.max(0, currentRes.food + foodDelta);
  const newRadiation = Math.min(150, Math.max(0, currentRes.radiation + radDelta));
  const newShielding = Math.min(100, Math.max(0, currentShielding - 0.5));

  // Science passive gains: Reduced if morale is low (fatigued crew)
  const currentMorale = currentRes.crewMorale ?? 90;
  let scienceGain = 2;
  if (config.communications === 'DEEP_SPACE_LASER_DSOC') scienceGain += 3;
  if (config.surfaceRover === 'PRESSURIZED_SCIENCE_ROVER') scienceGain += 2;
  if (shiftAction === 'SCIENCE_INTENSIVE') scienceGain += 8;
  if (currentMorale < 40) {
    scienceGain = Math.max(0, Math.floor(scienceGain * 0.4)); // Fatigued crew produces 60% less science
  }
  const newScience = currentRes.science + scienceGain;

  // Crew Health (Doctor bonus: 35% hypoxia/stress mitigation shield and +50% recovery):
  let healthDelta = 0;
  let stressDamage = 0;
  if (newOxygen < 25) stressDamage -= 12; // Severe hypoxia
  if (newWater < 20) stressDamage -= 10; // Severe dehydration
  if (newFood <= 1) stressDamage -= 8; // Malnutrition
  if (newRadiation > 45) stressDamage -= 6; // Radiation sickness
  if (newPower <= 0) stressDamage -= 16; // Catastrophic freezing quarters (-130°C)
  else if (newPower < 20) stressDamage -= 6;

  // Doctor Health Shield mitigates environmental damage
  if (stressDamage < 0) {
    healthDelta += Math.round(stressDamage * (1 - CREW_SPECIALTY_BONUSES.DOCTOR.hypoxiaDamageReduction));
  }

  if (newPower >= 50 && newOxygen >= 70 && newWater >= 50 && newFood >= 8 && newRadiation < 35) {
    // Doctor enhanced recovery
    healthDelta += Math.round(2 * CREW_SPECIALTY_BONUSES.DOCTOR.healthRecoveryBonus);
  }
  const newHealth = Math.min(100, Math.max(0, currentRes.crewHealth + healthDelta));

  // Crew Morale (Commander bonus: +15% baseline buffer and 15% crisis resilience):
  let moraleDelta = 0;
  if (newFood <= 2) moraleDelta -= 10;
  if (newWater < 25) moraleDelta -= 12;
  if (newPower <= 0) moraleDelta -= 20; // Panic in cold darkness
  else if (newPower < 20) moraleDelta -= 10;
  if (newOxygen < 30) moraleDelta -= 12;
  if (newRadiation > 50) moraleDelta -= 10;
  if (newHealth < 40) moraleDelta -= 10;
  if (newShielding < 25) moraleDelta -= 6; // Fear of micrometeorites

  // Commander Morale Shield softens dips during crises
  if (moraleDelta < 0) {
    moraleDelta = Math.round(moraleDelta * CREW_SPECIALTY_BONUSES.COMMANDER.moraleLossMultiplier);
  }

  if (newPower >= 50 && newOxygen >= 70 && newWater >= 50 && newFood >= 8 && !isPowerBlackout) {
    moraleDelta += 3; // High spirits from nominal living conditions
  }
  const newMorale = Math.min(100, Math.max(0, currentMorale + moraleDelta));

  const updatedResources: ResourceState = {
    power: newPower,
    water: newWater,
    oxygen: newOxygen,
    food: newFood,
    radiation: Math.round(newRadiation * 10) / 10,
    science: newScience,
    crewHealth: newHealth,
    crewMorale: newMorale,
    shielding: Math.round(newShielding * 10) / 10,
  };

  // 6. Evaluate Objectives
  const prevObjs = prevState.objectives || generateMissionObjectives(prevState.destination);
  const updatedObjectives: MissionObjective[] = prevObjs.map((obj) => {
    let completed = obj.completed;
    let curr = obj.currentValue;

    if (obj.id === 'obj-survive') {
      curr = sol;
      if (curr >= obj.requiredValue) completed = true;
    } else if (obj.id === 'obj-lunar-night') {
      if (sol >= 27 && newPower > 0) {
        completed = true;
        curr = 27;
      } else {
        curr = Math.min(27, sol);
      }
    } else if (obj.id === 'obj-science') {
      curr = newScience;
      if (curr >= obj.requiredValue) completed = true;
    } else if (obj.id === 'obj-radiation') {
      curr = Math.round(newRadiation);
      completed = curr < obj.requiredValue;
    } else if (obj.id === 'obj-health') {
      curr = newHealth;
      completed = curr >= obj.requiredValue;
    } else if (obj.id === 'obj-dust') {
      curr = newPower;
      completed = curr >= obj.requiredValue;
    }

    return { ...obj, currentValue: curr, completed };
  });

  // 7. Check Failure & Victory Endings
  let isGameOver = false;
  let outcome: 'IN_PROGRESS' | 'VICTORY' | 'PARTIAL_SUCCESS' | 'CRITICAL_FAILURE' = 'IN_PROGRESS';
  let failureReason = '';
  let endingScenarioId = '';

  if (newOxygen <= 0) {
    isGameOver = true;
    outcome = 'CRITICAL_FAILURE';
    failureReason = 'Hypoxia: Atmospheric oxygen exhausted. ECLSS pressure loops collapsed.';
    endingScenarioId = 'DEPRESSURIZATION_HYPOXIA';
  } else if (newPower <= 0) {
    isGameOver = true;
    outcome = 'CRITICAL_FAILURE';
    failureReason = 'Catastrophic Freeze: Base battery hit 0% during the lunar night. Thermal loops froze.';
    endingScenarioId = 'LIFE_SUPPORT_FREEZE';
  } else if (newWater <= 0) {
    isGameOver = true;
    outcome = 'CRITICAL_FAILURE';
    failureReason = 'Dehydration: Water recovery loops failed to supply minimum metabolic fluid requirement.';
    endingScenarioId = 'DESICCATION_DEHYDRATION';
  } else if (newFood <= 0) {
    isGameOver = true;
    outcome = 'CRITICAL_FAILURE';
    failureReason = 'Starvation: Outpost nutritional reserves completely depleted.';
    endingScenarioId = 'STARVATION';
  } else if (newShielding <= 0) {
    isGameOver = true;
    outcome = 'CRITICAL_FAILURE';
    failureReason = 'Catastrophic Hull Breach: Regolith shielding collapsed; unmitigated debris impact punctured the pressure hull.';
    endingScenarioId = 'DEPRESSURIZATION';
  } else if (newRadiation >= 100) {
    isGameOver = true;
    outcome = 'CRITICAL_FAILURE';
    failureReason = 'Acute Radiation Syndrome: Cumulative crew dosimeter exceeded safe biological ceiling (100 mSv).';
    endingScenarioId = 'RADIATION_CASUALTY';
  } else if (newHealth <= 0) {
    isGameOver = true;
    outcome = 'CRITICAL_FAILURE';
    failureReason = 'Medical Incapacitation: Crew vitals collapsed under compounded mission stresses.';
    endingScenarioId = 'CREW_MORALE_COLLAPSE';
  } else if (newMorale <= 0) {
    isGameOver = true;
    outcome = 'CRITICAL_FAILURE';
    failureReason = 'Psychological Collapse: Crew morale reached 0% under prolonged stress and deprivation.';
    endingScenarioId = 'CREW_MORALE_COLLAPSE';
  } else if (sol >= prevState.totalSols) {
    isGameOver = true;
    const completedCount = updatedObjectives.filter((o) => o.completed).length;
    if (completedCount >= updatedObjectives.length - 1 && newHealth >= 45 && newMorale >= 35) {
      outcome = 'VICTORY';
      if (newScience >= 160 && newHealth >= 65) {
        endingScenarioId = 'SCIENTIFIC_TRIUMPH';
      } else if (newHealth >= 75 && newMorale >= 70) {
        endingScenarioId = 'GOLDEN_TRIUMPH';
      } else {
        endingScenarioId = 'SURVIVAL_VICTORY';
      }
    } else {
      outcome = 'PARTIAL_SUCCESS';
      endingScenarioId = 'SURVIVAL_VICTORY';
    }
  }

  // 8. Check 1-Day Advance Warning Telemetry
  const nextSol = sol + 1;
  const upcomingEvent = SCIENCE_EVENTS.find(
    (e) => (e.destination === 'BOTH' || e.destination === prevState.destination) && e.solTrigger === nextSol
  );
  const activeWarning = upcomingEvent
    ? {
        title: upcomingEvent.warningTitle,
        message: upcomingEvent.warningMessage,
        hazardType: upcomingEvent.hazardType,
        countdownSols: 1,
        nasaDocReference: upcomingEvent.nasaDocReference,
      }
    : null;

  // Daily Engineering Build Points (cadets earn points to expand/repair base each sol)
  // Scaled by difficulty profile (Cadet: 6, Officer: 4, Commander: 3)
  // Low crew morale (< 40%) reduces daily work output by 50%
  let rawBuildPoints = diffProfile.dailyBuildPoints;
  if (newMorale < 40) {
    rawBuildPoints = Math.max(1, Math.floor(rawBuildPoints * 0.5));
  }
  const buildPointsEarned = rawBuildPoints;

  const telemetry: TurnTelemetry = {
    sol,
    isLunarNight,
    powerGeneratedKw: powerGenKw,
    powerConsumedKw: powerLoadKw,
    netPowerKw,
    powerDeltaPct,
    oxygenDeltaPct: Math.round(oxygenDelta * 10) / 10,
    waterDeltaPct: Math.round(waterDelta * 10) / 10,
    foodDeltaRations: Math.round(foodDelta * 10) / 10,
    radiationDeltaMsv: Math.round(radDelta * 10) / 10,
    equipmentWearDeltaPct: Math.round(equipDelta * 10) / 10,
    reportSummary: isLunarNight
      ? `Lunar Night Active: Solar = 0 kW. Base relying on battery and Kilopower. Net power: ${netPowerKw >= 0 ? '+' : ''}${netPowerKw} kW.`
      : `Nominal Solar Exposure: ${powerGenKw} kW generated, ${powerLoadKw} kW consumed. Battery at ${newPower}%.`,
  };

  return {
    updatedResources,
    telemetry,
    updatedObjectives,
    isGameOver,
    outcome,
    failureReason,
    activeWarning,
    endingScenarioId,
    buildPointsEarned,
  };
}

// ── LOCAL STORAGE VALIDATION AND PERSISTENCE ─────────────────────────────────

const SAVE_STORAGE_KEY = 'jr_astrocamp_save_state_v2';
const ACADEMY_XP_KEY = 'jr_astrocamp_cadet_xp';
const ACADEMY_LESSONS_KEY = 'jr_astrocamp_completed_lessons';

export function saveGameStateToStorage(state: GameState): boolean {
  try {
    if (typeof window === 'undefined') return false;
    const serialized = JSON.stringify(state);
    localStorage.setItem(SAVE_STORAGE_KEY, serialized);
    return true;
  } catch (err) {
    console.error('Failed to save game state to storage:', err);
    return false;
  }
}

export function loadGameStateFromStorage(): GameState | null {
  try {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(SAVE_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    // Strict schema validation
    if (
      typeof parsed !== 'object' ||
      !parsed.destination ||
      !parsed.resources ||
      typeof parsed.resources.power !== 'number' ||
      typeof parsed.resources.oxygen !== 'number' ||
      typeof parsed.currentSol !== 'number'
    ) {
      console.warn('Corrupted game save detected in localStorage, skipping.');
      return null;
    }

    // Invalidate legacy corrupt saves that mixed Mercury-Redstone into the lunar base
    if (parsed.activeEvent?.title?.includes('Mercury-Redstone') || parsed.activeEvent?.id?.includes('NASA-M001')) {
      localStorage.removeItem(SAVE_STORAGE_KEY);
      return null;
    }

    return parsed as GameState;
  } catch (err) {
    console.error('Failed to load game state from storage:', err);
    return null;
  }
}

export function clearGameSave(): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(SAVE_STORAGE_KEY);
    }
  } catch (err) {
    console.error('Failed to clear game save:', err);
  }
}

export function getCadetProgression(): { xp: number; completedLessons: string[] } {
  try {
    if (typeof window === 'undefined') return { xp: 0, completedLessons: [] };
    const xp = parseInt(localStorage.getItem(ACADEMY_XP_KEY) || '0', 10);
    const lessons = JSON.parse(localStorage.getItem(ACADEMY_LESSONS_KEY) || '[]');
    return { xp, completedLessons: Array.isArray(lessons) ? lessons : [] };
  } catch {
    return { xp: 0, completedLessons: [] };
  }
}

export function recordLessonCompletion(lessonId: string, earnedXp: number): { xp: number; completedLessons: string[] } {
  const current = getCadetProgression();
  if (current.completedLessons.includes(lessonId)) {
    return current;
  }

  const nextLessons = [...current.completedLessons, lessonId];
  const nextXp = current.xp + earnedXp;

  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(ACADEMY_LESSONS_KEY, JSON.stringify(nextLessons));
      localStorage.setItem(ACADEMY_XP_KEY, nextXp.toString());
    }
  } catch (err) {
    console.warn('Failed to record lesson completion:', err);
  }

  return { xp: nextXp, completedLessons: nextLessons };
}
