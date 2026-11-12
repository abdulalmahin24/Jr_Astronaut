// ============================================================================
// NASA Junior Astronaut — Full Round-Trip Expedition System
// Complete Mission Lifecycle: Earth Build -> Pad Weather -> Liftoff -> Landing -> Surface EVA -> Earth Return
// Grounded in Real Rocket Science, Tsiolkovsky Equation, NASA 45th Space Wing Weather Rules
// ============================================================================

export type ExpeditionDestination = 'SUBORBITAL' | 'ORBITAL' | 'MOON' | 'MARS';

export type LifecycleStage =
  | 'VAB_BUILD'         // 1. Vehicle Assembly: Select stages, engines & equipment
  | 'PAD_WEATHER'       // 2. Launch Pad Meteorology: Go / No-Go decision
  | 'ASCENT_STAGING'    // 3. Liftoff, Max-Q, Booster separation & LEO insertion
  | 'DEEP_SPACE_CRUISE' // 4. Trans-Lunar/Mars Injection (TLI/TMI) & Cruise
  | 'DESCENT_LANDING'   // 5. Powered Descent & Touchdown (EDL)
  | 'SURFACE_EVA'       // 6. Surface Mission: Drill samples, plant flag, rover exploration
  | 'SURFACE_ASCENT'    // 7. Surface Liftoff & Trans-Earth Injection (TEI)
  | 'EARTH_RETURN';     // 8. Earth Re-Entry, Parachutes, Ocean Splashdown & Debrief

// ─────────────────────────────────────────────────────────────────────────────
// ROCKET COMPONENT CATALOG FOR VAB BUILDER
// ─────────────────────────────────────────────────────────────────────────────

export interface RocketBooster {
  id: string;
  name: string;
  type: 'SOLID' | 'METHALOX' | 'KEROLOX';
  thrustKn: number;
  dryMassTons: number;
  propellantMassTons: number;
  ispSeaLevelSec: number;
  description: string;
}

export interface RocketCoreStage {
  id: string;
  name: string;
  propellant: 'LH2_LOX' | 'CH4_LOX' | 'RP1_LOX';
  thrustKn: number;
  dryMassTons: number;
  propellantMassTons: number;
  ispVacuumSec: number;
  engineCount: number;
  description: string;
}

export interface RocketUpperStage {
  id: string;
  name: string;
  thrustKn: number;
  dryMassTons: number;
  propellantMassTons: number;
  ispVacuumSec: number;
  description: string;
}

export interface ScienceEquipment {
  id: string;
  name: string;
  icon: string;
  massKg: number;
  powerWatts: number;
  scientificValueXp: number;
  description: string;
}

export interface HeatShieldParachuteConfig {
  id: string;
  name: string;
  heatResistanceMaxC: number;
  massKg: number;
  canopyDiameterM: number;
  description: string;
}

// Booster Options
export const VAB_BOOSTERS: RocketBooster[] = [
  {
    id: 'srb-twin',
    name: 'Dual 5-Segment Solid Rocket Boosters (SLS Style)',
    type: 'SOLID',
    thrustKn: 32000,
    dryMassTons: 190,
    propellantMassTons: 1450,
    ispSeaLevelSec: 269,
    description: 'Enormous solid thrust off the pad. Reliable liftoff boost through Max-Q.',
  },
  {
    id: 'methalox-heavy',
    name: 'SuperHeavy Reusable Booster (33x Raptor V3)',
    type: 'METHALOX',
    thrustKn: 74000,
    dryMassTons: 200,
    propellantMassTons: 3400,
    ispSeaLevelSec: 327,
    description: 'Cutting-edge sub-cooled liquid methane & oxygen. Tremendous lifting capability.',
  },
  {
    id: 'kerolox-triple',
    name: 'Falcon Heavy Triple-Core Kerolox (27x Merlin 1D)',
    type: 'KEROLOX',
    thrustKn: 22800,
    dryMassTons: 66,
    propellantMassTons: 1240,
    ispSeaLevelSec: 282,
    description: 'Proven high-density kerosene core with dual liquid strap-on boosters.',
  },
];

// Core Stage Options
export const VAB_CORE_STAGES: RocketCoreStage[] = [
  {
    id: 'core-lh2',
    name: 'Space Launch System Cryogenic Core (4x RS-25)',
    propellant: 'LH2_LOX',
    thrustKn: 8500,
    dryMassTons: 85,
    propellantMassTons: 987,
    ispVacuumSec: 452,
    engineCount: 4,
    description: 'Hydrogen-Oxygen sustained high-efficiency core reaching 452s vacuum specific impulse.',
  },
  {
    id: 'core-ch4',
    name: 'Starship Ship Stage (6x Raptor Vacuum & Sea-Level)',
    propellant: 'CH4_LOX',
    thrustKn: 14700,
    dryMassTons: 100,
    propellantMassTons: 1200,
    ispVacuumSec: 380,
    engineCount: 6,
    description: 'Full-flow staged combustion methalox upper stage capable of interplanetary travel.',
  },
  {
    id: 'core-saturn',
    name: 'Saturn S-IC / S-II Heavy Stacking (F-1 & J-2 Heritage)',
    propellant: 'RP1_LOX',
    thrustKn: 34500,
    dryMassTons: 130,
    propellantMassTons: 2150,
    ispVacuumSec: 421,
    engineCount: 5,
    description: 'Legendary Apollo Moon-shot architecture delivering brute payload capacity.',
  },
];

// Upper / In-Space Stage Options
export const VAB_UPPER_STAGES: RocketUpperStage[] = [
  {
    id: 'upper-rl10',
    name: 'Centaur V Deep Space Stage (2x RL10-C3)',
    thrustKn: 220,
    dryMassTons: 4.8,
    propellantMassTons: 54,
    ispVacuumSec: 453.8,
    description: 'The golden standard of vacuum cryogenic propulsion for Trans-Lunar and Trans-Mars injection burns.',
  },
  {
    id: 'upper-service',
    name: 'European Service Module (Orion AJ10 Engine + RCS)',
    thrustKn: 120,
    dryMassTons: 6.2,
    propellantMassTons: 28,
    ispVacuumSec: 316,
    description: 'Deep-space life support, solar power arrays, and high-reliability hypergolic maneuvers.',
  },
];

// Science Payloads & Surface Equipment
export const VAB_SCIENCE_EQUIPMENT: ScienceEquipment[] = [
  {
    id: 'raman-drill',
    name: 'SHERLOC Raman Laser & 2-Meter Subsurface Regolith Core Drill',
    icon: '🔬',
    massKg: 180,
    powerWatts: 450,
    scientificValueXp: 350,
    description: 'Pristine extraction of deep ice cores and biosignature organic molecule analysis.',
  },
  {
    id: 'surface-rover',
    name: 'Autonomous Pressurized Surface Exploration Rover',
    icon: '🚙',
    massKg: 450,
    powerWatts: 800,
    scientificValueXp: 450,
    description: 'Extends human exploration radius to 15 km with terrain-relative navigation and mineral cameras.',
  },
  {
    id: 'seismic-station',
    name: 'Cerberus / Shackleton Broadband Seismometer & Heat Flow Probe',
    icon: '📡',
    massKg: 85,
    powerWatts: 120,
    scientificValueXp: 280,
    description: 'Records tectonic tremors, meteoroid impacts, and core heat radiation.',
  },
  {
    id: 'in-situ-isru',
    name: 'MOXIE Oxygen & Water Extraction Prototype Module',
    icon: '⚡',
    massKg: 220,
    powerWatts: 600,
    scientificValueXp: 400,
    description: 'Produces breathable O2 and water directly from carbon dioxide or polar ice.',
  },
  {
    id: 'mission-flag',
    name: 'Commemorative High-Tensile Expedition Flag & 8K Panoramic Mast',
    icon: '🏁',
    massKg: 25,
    powerWatts: 50,
    scientificValueXp: 180,
    description: 'Plants humanity\'s mark of peaceful scientific discovery on the alien surface.',
  },
];

// Heat Shield & Parachutes
export const VAB_REENTRY_CONFIGS: HeatShieldParachuteConfig[] = [
  {
    id: 'shield-pica-x',
    name: 'PICA-X Phenolic Ablative Shield + Triple 35m Ring-Sail Chutes',
    heatResistanceMaxC: 3200,
    massKg: 650,
    canopyDiameterM: 35,
    description: 'Withstands lunar and Martian return velocities up to 11.2 km/s. Slows capsule to 7.2 m/s splashdown.',
  },
  {
    id: 'shield-carbon',
    name: 'Carbon-Carbon Dual Shell + Supersonic Ribbon Drogues & Mains',
    heatResistanceMaxC: 3600,
    massKg: 850,
    canopyDiameterM: 40,
    description: 'Maximum thermal margin for steep re-entry corridors and interplanetary velocities.',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// TSIOLKOVSKY ROCKET EQUATION CALCULATOR
// ─────────────────────────────────────────────────────────────────────────────

export interface RocketConfigSelection {
  destination: ExpeditionDestination;
  booster: RocketBooster;
  coreStage: RocketCoreStage;
  upperStage: RocketUpperStage;
  selectedEquipment: ScienceEquipment[];
  reentryConfig: HeatShieldParachuteConfig;
  crewCount: number;
}

export interface RocketPhysicsMetrics {
  dryMassTons: number;
  propellantMassTons: number;
  totalLiftoffMassTons: number;
  stage1DeltaVmS: number;
  stage2DeltaVmS: number;
  stage3DeltaVmS: number;
  totalDeltaVmS: number;
  liftoffThrustKn: number;
  liftoffTWR: number;
  requiredDeltaVmS: number;
  isMissionFeasible: boolean;
  feasibilityMarginPct: number;
}

/**
 * Calculates complete rocket physics using Tsiolkovsky Rocket Equation:
 * Delta-V = Isp * g0 * ln(m0 / mf)
 */
export function calculateRocketPhysics(config: RocketConfigSelection): RocketPhysicsMetrics {
  const g0 = 9.80665; // m/s^2

  // Payload mass (Capsule + Crew + Selected Equipment + Heat Shield)
  const crewMassTons = config.crewCount * 0.12; // 120 kg per astronaut with suit & life support
  const equipMassTons = config.selectedEquipment.reduce((sum, e) => sum + e.massKg, 0) / 1000;
  const heatShieldMassTons = config.reentryConfig.massKg / 1000;
  const capsuleDryMassTons = 6.0; // Orion / Dragon class crew module
  const payloadMassTons = capsuleDryMassTons + crewMassTons + equipMassTons + heatShieldMassTons;

  // Stage 3 (Upper / Return Stage)
  const stage3Dry = config.upperStage.dryMassTons + payloadMassTons;
  const stage3Wet = stage3Dry + config.upperStage.propellantMassTons;
  const stage3DeltaV = config.upperStage.ispVacuumSec * g0 * Math.log(stage3Wet / stage3Dry);

  // Stage 2 (Core Stage)
  const stage2Dry = config.coreStage.dryMassTons + stage3Wet;
  const stage2Wet = stage2Dry + config.coreStage.propellantMassTons;
  const stage2DeltaV = config.coreStage.ispVacuumSec * g0 * Math.log(stage2Wet / stage2Dry);

  // Stage 1 (Boosters + Core ignite at liftoff)
  const totalLiftoffThrustKn = config.booster.thrustKn + config.coreStage.thrustKn;
  const stage1Dry = config.booster.dryMassTons + stage2Wet;
  const stage1Wet = stage1Dry + config.booster.propellantMassTons;
  const stage1Isp = (config.booster.ispSeaLevelSec * 0.75 + config.coreStage.ispVacuumSec * 0.25);
  const stage1DeltaV = stage1Isp * g0 * Math.log(stage1Wet / stage1Dry);

  const totalDeltaVmS = Math.round(stage1DeltaV + stage2DeltaV + stage3DeltaV);
  const totalLiftoffMassTons = Math.round(stage1Wet);
  const dryMassTons = Math.round(config.booster.dryMassTons + config.coreStage.dryMassTons + config.upperStage.dryMassTons + payloadMassTons);
  const propellantMassTons = Math.round(config.booster.propellantMassTons + config.coreStage.propellantMassTons + config.upperStage.propellantMassTons);

  // Sea-level TWR = Thrust / (TotalMass * g0)
  const liftoffTWR = Number((totalLiftoffThrustKn / (totalLiftoffMassTons * g0)).toFixed(2));

  // Required Delta-V budget for full round-trip:
  // Suborbital: 2,400 m/s
  // LEO Orbital: 7,850 m/s
  // Moon: 10,400 m/s
  // Mars: 13,200 m/s
  const requiredDeltaVmS =
    config.destination === 'SUBORBITAL' ? 2400 :
    config.destination === 'ORBITAL' ? 7850 :
    config.destination === 'MOON' ? 10400 : 13200;
  const isMissionFeasible = totalDeltaVmS >= requiredDeltaVmS && liftoffTWR >= 1.15;
  const feasibilityMarginPct = Math.round(((totalDeltaVmS - requiredDeltaVmS) / requiredDeltaVmS) * 100);

  return {
    dryMassTons,
    propellantMassTons,
    totalLiftoffMassTons,
    stage1DeltaVmS: Math.round(stage1DeltaV),
    stage2DeltaVmS: Math.round(stage2DeltaV),
    stage3DeltaVmS: Math.round(stage3DeltaV),
    totalDeltaVmS,
    liftoffThrustKn: totalLiftoffThrustKn,
    liftoffTWR,
    requiredDeltaVmS,
    isMissionFeasible,
    feasibilityMarginPct,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// LAUNCH PAD WEATHER METEOROLOGY SYSTEM
// ─────────────────────────────────────────────────────────────────────────────

export interface LaunchPadWeatherReport {
  windSpeedKts: number;
  windDirectionDeg: number;
  windGustsKts: number;
  temperatureC: number;
  relativeHumidityPct: number;
  barometricPressureHpa: number;
  cloudCeilingFt: number;
  lightningProbabilityPct: number;
  geomagneticKpIndex: number;
  weatherStatus: 'GO' | 'MARGINAL' | 'NO_GO';
  violatedRules: string[];
  weatherForecastTrend: 'IMPROVING' | 'STEADY' | 'DETERIORATING';
}

/**
 * Generates dynamic launch pad weather based on real NASA 45th Weather Squadron rules
 */
export function generateLaunchWeather(attemptOffset = 0): LaunchPadWeatherReport {
  // Use pseudo-random seeded by offset
  const seed = (attemptOffset * 17 + 23) % 100;

  let windSpeedKts = 12 + Math.round((seed % 19));
  let windGustsKts = windSpeedKts + 4 + Math.round((seed % 8));
  let lightningProbabilityPct = (seed * 3) % 45;
  let cloudCeilingFt = 2500 + (seed * 85);
  let temperatureC = 21 + (seed % 11);
  let relativeHumidityPct = 65 + (seed % 28);
  let barometricPressureHpa = 1012 + (seed % 10) - 5;
  let geomagneticKpIndex = 1 + (seed % 5);

  const violatedRules: string[] = [];

  // NASA Flight Rules:
  // 1. Surface wind must not exceed 24 knots
  if (windSpeedKts > 24) {
    violatedRules.push(`SURFACE WIND EXCEEDED: ${windSpeedKts} kts > 24 kts safety limit`);
  }
  // 2. Wind gusts must not exceed 30 knots
  if (windGustsKts > 30) {
    violatedRules.push(`PEAK GUST LIMIT: ${windGustsKts} kts gusts exceeds structural limit (30 kts)`);
  }
  // 3. Lightning risk must be under 15%
  if (lightningProbabilityPct > 15) {
    violatedRules.push(`ANVIL CLOUD LIGHTNING RULE: ${lightningProbabilityPct}% risk exceeds 15% abort threshold`);
  }
  // 4. Cloud ceiling below 3,000 ft is marginal
  if (cloudCeilingFt < 3000) {
    violatedRules.push(`LOW CLOUD CEILING: ${cloudCeilingFt} ft inhibits optical range tracking (< 3000 ft)`);
  }

  let weatherStatus: 'GO' | 'MARGINAL' | 'NO_GO' = 'GO';
  if (violatedRules.length >= 2 || windSpeedKts > 26 || lightningProbabilityPct > 25) {
    weatherStatus = 'NO_GO';
  } else if (violatedRules.length === 1) {
    weatherStatus = 'MARGINAL';
  }

  const trends: Array<'IMPROVING' | 'STEADY' | 'DETERIORATING'> = ['IMPROVING', 'STEADY', 'DETERIORATING'];
  const weatherForecastTrend = trends[attemptOffset % trends.length];

  return {
    windSpeedKts,
    windDirectionDeg: 65 + (attemptOffset * 20) % 360,
    windGustsKts,
    temperatureC,
    relativeHumidityPct,
    barometricPressureHpa,
    cloudCeilingFt,
    lightningProbabilityPct,
    geomagneticKpIndex,
    weatherStatus,
    violatedRules,
    weatherForecastTrend,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// DESTINATION PRESETS
// ─────────────────────────────────────────────────────────────────────────────

export interface DestinationProfile {
  id: ExpeditionDestination;
  name: string;
  badge: string;
  distanceKm: string;
  transferTimeDays: string;
  surfaceGravityMs2: number;
  landingSite: string;
  landingCoordinates: string;
  atmospherePressure: string;
  surfaceTerrainDescription: string;
  primaryScienceDirective: string;
}

export const DESTINATION_PROFILES: Record<ExpeditionDestination, DestinationProfile> = {
  SUBORBITAL: {
    id: 'SUBORBITAL',
    name: 'Mission 1: Sub-Orbital Pioneer (Kármán 100 km Boundary)',
    badge: '🚀 100 KM KÁRMÁN FLIGHT',
    distanceKm: '105 km',
    transferTimeDays: '25 Minutes',
    surfaceGravityMs2: 9.81,
    landingSite: 'Atlantic Ocean Recovery Zone (28.4°N, 78.2°W)',
    landingCoordinates: '28.4° North, 78.2° West',
    atmospherePressure: '101.3 kPa -> Microgravity',
    surfaceTerrainDescription: 'Open ocean retrieval corridor, rapid recovery ship response, inflatable flotation collars deployed.',
    primaryScienceDirective: 'Execute manual pitch gravity turn, cross the 100 km Kármán line into microgravity space, stage booster, re-orient heat shield, deploy parachutes at 4,000 m, and execute ocean splashdown.',
  },
  ORBITAL: {
    id: 'ORBITAL',
    name: 'Mission 2: Orbital Pioneer (Low Earth Orbit 200 km Insertion)',
    badge: '🛰️ 200 KM LEO ORBITAL INSERTION',
    distanceKm: '200 km',
    transferTimeDays: '90 Minutes / Orbit',
    surfaceGravityMs2: 9.81,
    landingSite: 'Pacific Ocean Splashdown Zone (31.5°N, 121.2°W)',
    landingCoordinates: '31.5° North, 121.2° West',
    atmospherePressure: '101.3 kPa -> Vacuum',
    surfaceTerrainDescription: 'Deep ocean recovery fleet with US Navy retrieval helicopter, carrier recovery taskforce.',
    primaryScienceDirective: 'Multi-stage manual gravity turn, achieve 7.8 km/s orbital velocity, circularize 200 km LEO orbit, perform de-orbit retrograde burn, survive atmospheric entry, and parachute splashdown.',
  },
  MOON: {
    id: 'MOON',
    name: 'Mission 3: Lunar Voyager (Full Moon Expedition — YouTube Reference)',
    badge: '🌕 LUNAR VOYAGER (ELLIPSE REFERENCE)',
    distanceKm: '384,400 km',
    transferTimeDays: '3.5 Days',
    surfaceGravityMs2: 1.62,
    landingSite: 'Shackleton Crater Connecting Ridge (-89.9°S, 0.0°E)',
    landingCoordinates: '89.9° South, Permanently Shadowed Region',
    atmospherePressure: '0 Pa (Hard Vacuum)',
    surfaceTerrainDescription: 'Ultra-fine abrasive regolith, deep titanium-rich craters, permanent solar towers, and cryogenic water-ice deposits inside shadows.',
    primaryScienceDirective: 'Modeled after Ellipse: Lunar Voyager Mission 3 (YouTube: qXYpltxSTK0): Earth liftoff, TLI burn, manual lunar powered descent touchdown (< 3 m/s), plant flag & regolith drill EVA, lunar surface liftoff, trans-Earth return burn, hypersonic atmospheric entry, and parachute ocean splashdown.',
  },
  MARS: {
    id: 'MARS',
    name: 'Mission 4: Mars Interplanetary Voyager (Earth Launch ➔ Mars EDL ➔ Return)',
    badge: '🔴 RED PLANET INTERPLANETARY EXPEDITION',
    distanceKm: '225,000,000 km',
    transferTimeDays: '6 to 7 Months',
    surfaceGravityMs2: 3.72,
    landingSite: 'Jezero Crater Ancient River Delta (18.38°N, 77.58°E)',
    landingCoordinates: '18.38° North, 77.58° East',
    atmospherePressure: '610 Pa (~0.6% Earth Atmosphere - 95% CO2)',
    surfaceTerrainDescription: 'Layered clay mudstones, basalt boulder fields, active dust devils, rusty perchlorate-rich dust dunes, and ancient riverbeds.',
    primaryScienceDirective: 'Execute Earth multi-stage launch, Trans-Mars Injection burn, supersonic Mars atmospheric entry & powered touchdown, MOXIE O2 extraction and rover drill, surface liftoff, interplanetary return burn, and Pacific recovery.',
  },
};

