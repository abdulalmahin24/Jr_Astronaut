// ============================================================================
// NASA Junior Astronaut — Hardcore Survival Missions Engine
// Real Orbital Mechanics, Newtonian Gravity, Keplerian Solvers & Mission Rules
// References: benjamin-awd/solar-system-threejs, jakerunzer/space-flight,
// NASA Open Data (data.nasa.gov), NASA API Portal (api.nasa.gov)
// ============================================================================

export type HardcoreMissionId =
  | 'kessler-syndrome'
  | 'solar-storm'
  | 'apollo-13'
  | 'oberth-slingshot'
  | 'suicide-burn'
  | 'suborbital-pioneer'
  | 'orbital-pioneer'
  | 'lunar-voyager'
  | 'mars-voyager';

export interface CelestialBodyConfig {
  name: string;
  radiusKm: number;
  mu: number; // Standard gravitational parameter G*M (km^3/s^2)
  color: string;
  atmosphereHeightKm: number;
  surfaceGravityMs2: number;
}

export const CELESTIAL_BODIES: Record<string, CelestialBodyConfig> = {
  EARTH: {
    name: 'Earth',
    radiusKm: 6371,
    mu: 398600.4418, // km^3 / s^2
    color: '#2563eb',
    atmosphereHeightKm: 120,
    surfaceGravityMs2: 9.80665,
  },
  MOON: {
    name: 'Moon',
    radiusKm: 1737.4,
    mu: 4902.8000,
    color: '#94a3b8',
    atmosphereHeightKm: 0,
    surfaceGravityMs2: 1.622,
  },
  MARS: {
    name: 'Mars',
    radiusKm: 3389.5,
    mu: 42828.3752,
    color: '#ef4444',
    atmosphereHeightKm: 80,
    surfaceGravityMs2: 3.72,
  },
  GAS_GIANT: {
    name: 'Jupiter Analogue (Zephyrus)',
    radiusKm: 69911,
    mu: 126686534, // km^3 / s^2
    color: '#d97706',
    atmosphereHeightKm: 1000,
    surfaceGravityMs2: 24.79,
  },
};

export interface DebrisObject {
  id: number;
  x: number; // km
  y: number; // km
  z: number; // km
  vx: number; // km/s
  vy: number; // km/s
  vz: number; // km/s
  sizeM: number;
  type: 'fragment' | 'stage' | 'panel';
}

export interface HardcoreTelemetryState {
  missionId: HardcoreMissionId;
  timeSec: number;
  altitudeKm: number;
  velocityKms: number;
  verticalSpeedKms: number;
  horizontalSpeedKms: number;
  pitchDeg: number;
  yawDeg: number;
  rollDeg: number;
  throttlePct: number; // 0 - 100
  fuelPct: number; // 0 - 100
  hullIntegrityPct: number; // 0 - 100
  fuelLeakActive: boolean;
  engineHeatPct: number; // 0 - 100
  engineOverheated: boolean;
  heatShieldPct: number; // 0 - 100
  oxygenBatteryTimerSec: number;
  apoapsisKm: number;
  periapsisKm: number;
  eccentricity: number;
  flightPathAngleDeg: number;
  suicideBurnDistanceM: number;
  suicideBurnIgnitionRequired: boolean;
  radarDebris: Array<{ x: number; y: number; z: number; distanceKm: number }>;
  warningAlerts: string[];
  cameraShakeIntensity: number; // 0 to 1
  isGameOver: boolean;
  outcome: 'IN_PROGRESS' | 'SUCCESS' | 'FAILED';
  failureReason?: string;
  successMessage?: string;
}

export interface HardcoreMissionConfig {
  id: HardcoreMissionId;
  missionNumber: number;
  title: string;
  tagline: string;
  scenario: string;
  targetBody: 'EARTH' | 'MOON' | 'MARS' | 'GAS_GIANT';
  initialAltitudeKm: number;
  initialVelocityKms: number;
  initialVerticalSpeedKms: number;
  initialPitchDeg: number;
  initialFuelPct: number;
  mainEngineAvailable: boolean;
  rcsOnly: boolean;
  hideTrajectoryLine: boolean;
  hasDebrisField: boolean;
  hasEngineHeat: boolean;
  hasHeatShield: boolean;
  hasCountdownTimer: boolean;
  countdownDurationSec: number;
  targetObjective: string;
  scientificContext: string;
  nasaDataSources: {
    title: string;
    url: string;
    portal: 'data.nasa.gov' | 'api.nasa.gov' | 'earthdata.nasa.gov' | 'jpl.nasa.gov';
  }[];
}

// ============================================================================
// 5 PRIMARY HARDCORE SURVIVAL MISSIONS
// Modeled after real orbital mechanics, space debris dynamics, and critical failures
// ============================================================================
export const HARDCORE_SURVIVAL_MISSIONS: HardcoreMissionConfig[] = [
  {
    id: 'kessler-syndrome',
    missionNumber: 1,
    title: 'Mission 1: Kessler Syndrome (Orbital Debris Survival)',
    tagline: 'High-Velocity Debris Field & Rapid Fuel Leak Mitigation',
    scenario: 'Spawn in a dense field of high-velocity space debris orbiting Earth between 200 km and 500 km altitude. Debris fragments appear as red pings on tactical radar. Any impact reduces hull integrity and activates a continuous fuel leak. Navigate safely to reach a circular 550 km parking orbit.',
    targetBody: 'EARTH',
    initialAltitudeKm: 320,
    initialVelocityKms: 7.71,
    initialVerticalSpeedKms: 0.0,
    initialPitchDeg: 0,
    initialFuelPct: 85,
    mainEngineAvailable: true,
    rcsOnly: false,
    hideTrajectoryLine: false,
    hasDebrisField: true,
    hasEngineHeat: false,
    hasHeatShield: false,
    hasCountdownTimer: false,
    countdownDurationSec: 0,
    targetObjective: 'Navigate safely through the debris field and raise orbit to a stable, circular orbit at 550 km altitude (Apoapsis & Periapsis 550 ±35 km, Eccentricity < 0.05) with hull integrity intact.',
    scientificContext: 'Proposed by NASA astrophysicist Donald J. Kessler in 1978: when space debris density in Low Earth Orbit (LEO) exceeds critical threshold, cascading collisions create a runaway debris belt rendering orbital slots impassable.',
    nasaDataSources: [
      {
        title: 'NASA Orbital Debris Program Office (ODPO) Datasets',
        url: 'https://orbitaldebris.jsc.nasa.gov/',
        portal: 'data.nasa.gov',
      },
      {
        title: 'NASA Spacecraft Conjunction Assessment Risk Analysis (CARA)',
        url: 'https://data.nasa.gov/browse?q=orbital+debris',
        portal: 'data.nasa.gov',
      },
    ],
  },
  {
    id: 'solar-storm',
    missionNumber: 2,
    title: 'Mission 2: Solar Storm (Blind Telemetry Navigation)',
    tagline: 'Coronal Mass Ejection Trajectory Blackout & Engine Heat Management',
    scenario: 'A severe X-Class Coronal Mass Ejection (CME) strikes Earth\'s magnetosphere, blinding orbital navigation cameras. The visual orbital trajectory prediction line is disabled. Running throttle above 80% overheats the engine, triggering an automated shutdown. Achieve a stable orbit relying purely on numerical instruments.',
    targetBody: 'EARTH',
    initialAltitudeKm: 92,
    initialVelocityKms: 4.85,
    initialVerticalSpeedKms: 0.42,
    initialPitchDeg: 38,
    initialFuelPct: 75,
    mainEngineAvailable: true,
    rcsOnly: false,
    hideTrajectoryLine: true,
    hasDebrisField: false,
    hasEngineHeat: true,
    hasHeatShield: false,
    hasCountdownTimer: false,
    countdownDurationSec: 0,
    targetObjective: 'Achieve a stable Earth parking orbit (Periapsis > 120 km and Apoapsis between 180 km and 380 km) relying strictly on numerical altitude, velocity, vertical speed, and pitch angle without triggering engine overheat shutdown.',
    scientificContext: 'Extreme solar particle events (SPE) induce severe geomagnetic currents, disabling transponders and visual guidance. Astronauts must monitor engine nozzle temperatures and thrust vectors through inertial telemetry.',
    nasaDataSources: [
      {
        title: 'NASA Space Weather Database Of Notifications, Knowledge, Information (DONKI)',
        url: 'https://api.nasa.gov/',
        portal: 'api.nasa.gov',
      },
      {
        title: 'NASA Solar Dynamics Observatory (SDO) Heliophysics',
        url: 'https://science.nasa.gov/heliophysics/',
        portal: 'data.nasa.gov',
      },
    ],
  },
  {
    id: 'apollo-13',
    missionNumber: 3,
    title: 'Mission 3: Apollo 13 Crisis (Critical System Failure)',
    tagline: 'Free-Return Trajectory & 5.5°–7.5° Atmospheric Re-Entry Corridor',
    scenario: 'The primary Service Propulsion System (SPS) main engine is permanently disabled following an oxygen tank rupture. The spacecraft is hurtling toward Earth on a lunar return path with only 5 minutes of emergency Oxygen & Battery power. Only low-thrust RCS maneuvering thrusters remain available.',
    targetBody: 'EARTH',
    initialAltitudeKm: 28500,
    initialVelocityKms: 4.15,
    initialVerticalSpeedKms: -3.85,
    initialPitchDeg: -6.5,
    initialFuelPct: 40,
    mainEngineAvailable: false,
    rcsOnly: true,
    hideTrajectoryLine: false,
    hasDebrisField: false,
    hasEngineHeat: false,
    hasHeatShield: false,
    hasCountdownTimer: true,
    countdownDurationSec: 300, // 5 minutes
    targetObjective: 'Perform precise RCS manual burns to steer the Earth atmospheric re-entry corridor flight path angle to exactly between 5.5° and 7.5° before the 5-minute Oxygen & Battery timer runs out.',
    scientificContext: 'During Apollo 13, NASA flight controllers calculated that if entry was shallower than 5.5°, the capsule would skip off Earth\'s atmosphere into solar orbit; steeper than 7.5°, atmospheric deceleration would exceed 30 Gs, destroying the capsule.',
    nasaDataSources: [
      {
        title: 'NASA Apollo 13 Mission Operations Report & Flight Telemetry',
        url: 'https://www.nasa.gov/mission_pages/apollo/missions/apollo13.html',
        portal: 'jpl.nasa.gov',
      },
      {
        title: 'NASA Earth Atmospheric Density Profiles (MSIS-E-90)',
        url: 'https://earthdata.nasa.gov/',
        portal: 'earthdata.nasa.gov',
      },
    ],
  },
  {
    id: 'oberth-slingshot',
    missionNumber: 4,
    title: 'Mission 4: Gravity Well Escape (Oberth Effect Slingshot)',
    tagline: 'Deep Gas Giant Pericenter Burn & Heat Shield Melting',
    scenario: 'Plunging deep into the extreme gravity well of a massive gas giant (Jupiter analogue) on a decaying hyperbolic trajectory. The intense atmospheric friction melts your heat shield as altitude drops below 3,500 km. Wait for the exact moment of Periapsis to execute a full-throttle burn to escape before the heat shield hits 0%.',
    targetBody: 'GAS_GIANT',
    initialAltitudeKm: 6500,
    initialVelocityKms: 48.5,
    initialVerticalSpeedKms: -6.2,
    initialPitchDeg: -8,
    initialFuelPct: 60,
    mainEngineAvailable: true,
    rcsOnly: false,
    hideTrajectoryLine: false,
    hasDebrisField: false,
    hasEngineHeat: false,
    hasHeatShield: true,
    hasCountdownTimer: false,
    countdownDurationSec: 0,
    targetObjective: 'Wait until the exact moment of Periapsis (closest approach) to execute maximum prograde burn (Oberth Effect) to achieve hyperbolic escape velocity (>= 52.0 km/s) before the heat shield melts to 0%.',
    scientificContext: 'The Oberth Effect proves that rocket engines generate far more kinetic energy when burned at high speed deep within a gravitational potential well, because Delta-E = v * Delta-v. Burning at pericenter provides maximum Delta-V multiplication.',
    nasaDataSources: [
      {
        title: 'NASA Juno Jupiter Gravity Science Investigation Telemetry',
        url: 'https://www.jpl.nasa.gov/missions/juno',
        portal: 'jpl.nasa.gov',
      },
      {
        title: 'NASA JPL Solar System Dynamics (SSD) Horizons Orbit Ephemerides',
        url: 'https://ssd.jpl.nasa.gov/horizons/',
        portal: 'api.nasa.gov',
      },
    ],
  },
  {
    id: 'suicide-burn',
    missionNumber: 5,
    title: 'Mission 5: Pinpoint Suicide Burn (Hover Slam Landing)',
    tagline: 'Last-Second Ignition & Zero-Margin Deceleration',
    scenario: 'Descending rapidly toward the cratered lunar surface at 215 m/s downward velocity with zero atmosphere and only 8.0% fuel remaining. There is zero fuel to hover — you must calculate and execute the ignition at the exact last fraction of a second to touch down safely under 3 m/s.',
    targetBody: 'MOON',
    initialAltitudeKm: 3.8, // 3,800 meters
    initialVelocityKms: 0.22, // 220 m/s
    initialVerticalSpeedKms: -0.215, // -215 m/s
    initialPitchDeg: 90, // pointed vertically up for retrograde burn
    initialFuelPct: 8.0,
    mainEngineAvailable: true,
    rcsOnly: false,
    hideTrajectoryLine: false,
    hasDebrisField: false,
    hasEngineHeat: false,
    hasHeatShield: false,
    hasCountdownTimer: false,
    countdownDurationSec: 0,
    targetObjective: 'Calculate the exact terminal suicide burn altitude. Ignite 100% throttle at the last second to achieve touchdown speed < 3.0 m/s and horizontal drift < 1.0 m/s without running out of fuel mid-air.',
    scientificContext: 'SpaceX Falcon 9 and NASA Apollo Lunar Module descent profiles use optimal control suicide burns (hoverslam), where thrust deceleration matches kinematic stopping distance: h_burn = v^2 / (2 * (a_thrust - g)). Igniting even 0.5s too late causes catastrophic impact.',
    nasaDataSources: [
      {
        title: 'NASA Apollo Lunar Surface Journal (ALSJ) Descent Radar Data',
        url: 'https://data.nasa.gov/',
        portal: 'data.nasa.gov',
      },
      {
        title: 'NASA Planetary Data System (PDS) Moon Topography (LOLA)',
        url: 'https://pds.nasa.gov/',
        portal: 'data.nasa.gov',
      },
    ],
  },
];

// Supplementary full lifecycle expeditions
export const LIFECYCLE_SURVIVAL_MISSIONS: HardcoreMissionConfig[] = [
  {
    id: 'suborbital-pioneer',
    missionNumber: 6,
    title: 'Mission 6: Sub-Orbital Pioneer & Kármán Boundary',
    tagline: '100 km Atmospheric Punch, Microgravity & Ocean Splashdown',
    scenario: 'Manual launch from Cape Canaveral past the 100 km Kármán line into microgravity space. Decouple booster, orient capsule heat shield, and splash down.',
    targetBody: 'EARTH',
    initialAltitudeKm: 0.1,
    initialVelocityKms: 0.05,
    initialVerticalSpeedKms: 0.05,
    initialPitchDeg: 90,
    initialFuelPct: 100,
    mainEngineAvailable: true,
    rcsOnly: false,
    hideTrajectoryLine: false,
    hasDebrisField: false,
    hasEngineHeat: false,
    hasHeatShield: true,
    hasCountdownTimer: false,
    countdownDurationSec: 0,
    targetObjective: 'Manually pilot rocket past 100 km Kármán line, achieve microgravity, and splash down safely.',
    scientificContext: 'Project Mercury Redstone (MR-3 Freedom 7) sent Alan Shepard on a 15-minute suborbital flight peaking at 187 km.',
    nasaDataSources: [
      {
        title: 'NASA Project Mercury Flight Operations Report MR-3',
        url: 'https://www.nasa.gov/mission_pages/mercury/',
        portal: 'data.nasa.gov',
      },
    ],
  },
  {
    id: 'orbital-pioneer',
    missionNumber: 7,
    title: 'Mission 7: Orbital Pioneer: Low Earth Orbit 200 km',
    tagline: 'Multi-Stage Staging, 7.8 km/s Orbital Velocity & De-Orbit Burn',
    scenario: 'Execute a full multi-stage orbital insertion. Steer gravity turn pitch program, decouple stage 1, accelerate to orbital velocity (7.8 km/s), circularize orbit at 200 km.',
    targetBody: 'EARTH',
    initialAltitudeKm: 0.1,
    initialVelocityKms: 0.05,
    initialVerticalSpeedKms: 0.05,
    initialPitchDeg: 90,
    initialFuelPct: 100,
    mainEngineAvailable: true,
    rcsOnly: false,
    hideTrajectoryLine: false,
    hasDebrisField: false,
    hasEngineHeat: false,
    hasHeatShield: true,
    hasCountdownTimer: false,
    countdownDurationSec: 0,
    targetObjective: 'Achieve stable 200 km circular Low Earth Orbit (velocity >= 7.75 km/s, Periapsis > 150 km).',
    scientificContext: 'First orbital velocity requirement (v = sqrt(G*M / r) = 7.8 km/s).',
    nasaDataSources: [
      {
        title: 'NASA Launch Vehicle Guidance & Trajectory Optimization',
        url: 'https://data.nasa.gov/',
        portal: 'data.nasa.gov',
      },
    ],
  },
  {
    id: 'lunar-voyager',
    missionNumber: 8,
    title: 'Mission 8: Lunar Voyager (Full Moon Expedition)',
    tagline: 'Earth Launch ➔ TLI ➔ Lunar Retro Touchdown ➔ Surface EVA ➔ Splashdown',
    scenario: 'Earth liftoff, Trans-Lunar Injection burn, enter lunar orbit, powered descent touchdown (< 3 m/s), surface EVA, liftoff, and return splashdown.',
    targetBody: 'MOON',
    initialAltitudeKm: 3.5,
    initialVelocityKms: 0.22,
    initialVerticalSpeedKms: -0.21,
    initialPitchDeg: 90,
    initialFuelPct: 40,
    mainEngineAvailable: true,
    rcsOnly: false,
    hideTrajectoryLine: false,
    hasDebrisField: false,
    hasEngineHeat: false,
    hasHeatShield: true,
    hasCountdownTimer: false,
    countdownDurationSec: 0,
    targetObjective: 'Execute pinpoint powered landing (< 3 m/s touchdown) on Moon surface.',
    scientificContext: 'Apollo Lunar Module Descent Propulsion System (LMDE) required throttlable pintle engines to cancel 1.6 km/s orbital velocity.',
    nasaDataSources: [
      {
        title: 'NASA Apollo Lunar Surface Journal (ALSJ) Descent Radar Data',
        url: 'https://data.nasa.gov/',
        portal: 'data.nasa.gov',
      },
    ],
  },
  {
    id: 'mars-voyager',
    missionNumber: 9,
    title: 'Mission 9: Mars Interplanetary Voyager',
    tagline: 'Earth Launch ➔ TMI ➔ Mars Hypersonic EDL ➔ MOXIE EVA ➔ Return Splashdown',
    scenario: 'Interplanetary survival expedition. Hypersonic entry through thin Martian atmosphere, retro-propulsion touchdown in Jezero Crater, extract O2 with MOXIE.',
    targetBody: 'MARS',
    initialAltitudeKm: 12.0,
    initialVelocityKms: 1.25,
    initialVerticalSpeedKms: -0.65,
    initialPitchDeg: 80,
    initialFuelPct: 55,
    mainEngineAvailable: true,
    rcsOnly: false,
    hideTrajectoryLine: false,
    hasDebrisField: false,
    hasEngineHeat: true,
    hasHeatShield: true,
    hasCountdownTimer: false,
    countdownDurationSec: 0,
    targetObjective: 'Survive Mars Entry, Descent, and Landing (EDL), land softly in Jezero Crater (< 4 m/s).',
    scientificContext: 'Mars EDL combines atmospheric drag and supersonic retro-propulsion in 610 Pa carbon dioxide atmosphere.',
    nasaDataSources: [
      {
        title: 'NASA Mars 2020 Perseverance Entry, Descent, and Landing (EDL) Telemetry',
        url: 'https://mars.nasa.gov/mars2020/',
        portal: 'jpl.nasa.gov',
      },
    ],
  },
];

export const ALL_SURVIVAL_MISSIONS = [...HARDCORE_SURVIVAL_MISSIONS, ...LIFECYCLE_SURVIVAL_MISSIONS];

// ============================================================================
// Real Keplerian Orbital Mechanics & Mathematical Solvers
// ============================================================================

export interface KeplerianElements {
  semiMajorAxisKm: number;
  eccentricity: number;
  periapsisAltitudeKm: number;
  apoapsisAltitudeKm: number;
  specificEnergyKm2s2: number;
  periodSec: number;
  flightPathAngleDeg: number;
  isHyperbolic: boolean;
}

/**
 * Calculates exact Keplerian orbital elements from state vectors (r, v)
 * based on Newtonian two-body gravitational mechanics F = G * M * m / r^2.
 */
export function computeKeplerianElements(
  radiusKm: number,
  velocityKms: number,
  verticalSpeedKms: number,
  body: CelestialBodyConfig
): KeplerianElements {
  const mu = body.mu;
  const r = Math.max(radiusKm, body.radiusKm);
  const v = Math.max(velocityKms, 0.0001);

  // Specific orbital energy: epsilon = v^2 / 2 - mu / r
  const epsilon = (v * v) / 2 - mu / r;

  // Flight path angle gamma: sin(gamma) = v_r / v
  const sinGamma = Math.max(-1, Math.min(1, verticalSpeedKms / v));
  const flightPathAngleDeg = (Math.asin(sinGamma) * 180) / Math.PI;

  // Specific angular momentum h = r * v * cos(gamma)
  const cosGamma = Math.cos((flightPathAngleDeg * Math.PI) / 180);
  const h = r * v * Math.abs(cosGamma);

  // Eccentricity: e = sqrt(1 + 2 * epsilon * h^2 / mu^2)
  const eTerm = 1 + (2 * epsilon * h * h) / (mu * mu);
  const eccentricity = Math.sqrt(Math.max(0, eTerm));

  let semiMajorAxisKm = 0;
  let periapsisAltitudeKm = 0;
  let apoapsisAltitudeKm = 0;
  let periodSec = 0;
  const isHyperbolic = epsilon >= 0 || eccentricity >= 1.0;

  if (isHyperbolic) {
    semiMajorAxisKm = Math.abs(mu / (2 * Math.max(0.001, epsilon)));
    const rp = (h * h) / (mu * (1 + eccentricity));
    periapsisAltitudeKm = rp - body.radiusKm;
    apoapsisAltitudeKm = Infinity;
    periodSec = Infinity;
  } else {
    semiMajorAxisKm = -mu / (2 * epsilon);
    const rp = semiMajorAxisKm * (1 - eccentricity);
    const ra = semiMajorAxisKm * (1 + eccentricity);
    periapsisAltitudeKm = rp - body.radiusKm;
    apoapsisAltitudeKm = ra - body.radiusKm;
    periodSec = 2 * Math.PI * Math.sqrt(Math.pow(semiMajorAxisKm, 3) / mu);
  }

  return {
    semiMajorAxisKm,
    eccentricity,
    periapsisAltitudeKm,
    apoapsisAltitudeKm,
    specificEnergyKm2s2: epsilon,
    periodSec,
    flightPathAngleDeg,
    isHyperbolic,
  };
}

/**
 * Calculates Suicide Burn / Hover Slam ignition distance
 * h_burn = v_y^2 / (2 * (a_thrust - g))
 */
export function calculateSuicideBurnAltitude(
  downwardSpeedMs: number,
  maxThrustAccelMs2: number,
  gravityMs2: number
): { suicideBurnDistanceM: number; timeToIgniteSec: number } {
  const vy = Math.abs(downwardSpeedMs);
  const netDecel = maxThrustAccelMs2 - gravityMs2;
  if (netDecel <= 0) {
    return { suicideBurnDistanceM: Infinity, timeToIgniteSec: 0 };
  }

  const suicideBurnDistanceM = (vy * vy) / (2 * netDecel);
  const timeToIgniteSec = vy / netDecel;

  return { suicideBurnDistanceM, timeToIgniteSec };
}

/**
 * Generates initial random orbital debris field for Kessler Syndrome
 */
export function generateOrbitalDebrisField(count = 110, earthRadiusKm = 6371): DebrisObject[] {
  const debris: DebrisObject[] = [];
  const types: Array<'fragment' | 'stage' | 'panel'> = ['fragment', 'stage', 'panel'];

  for (let i = 0; i < count; i++) {
    // Altitudes between 200 km and 500 km
    const altitude = 200 + Math.random() * 300;
    const r = earthRadiusKm + altitude;
    // Clearance around initial vehicle position
    const minSafeAngle = 0.35;
    const angleRange = Math.PI * 2 - 2 * minSafeAngle;
    const angle = minSafeAngle + Math.random() * angleRange;
    const inc = (Math.random() - 0.5) * 0.35;

    const x = r * Math.cos(angle);
    const y = r * Math.sin(inc);
    const z = r * Math.sin(angle);

    const vMag = Math.sqrt(398600.44 / r) * (0.97 + Math.random() * 0.06);
    const vx = -vMag * Math.sin(angle);
    const vy = (Math.random() - 0.5) * 0.25;
    const vz = vMag * Math.cos(angle);

    debris.push({
      id: i,
      x,
      y,
      z,
      vx,
      vy,
      vz,
      sizeM: 0.4 + Math.random() * 4.0,
      type: types[i % types.length],
    });
  }

  return debris;
}

/**
 * Creates initial telemetry state for a given mission
 */
export function createInitialTelemetry(mission: HardcoreMissionConfig): HardcoreTelemetryState {
  const body = CELESTIAL_BODIES[mission.targetBody];
  const r = body.radiusKm + mission.initialAltitudeKm;
  const kepler = computeKeplerianElements(
    r,
    mission.initialVelocityKms,
    mission.initialVerticalSpeedKms,
    body
  );

  return {
    missionId: mission.id,
    timeSec: 0,
    altitudeKm: mission.initialAltitudeKm,
    velocityKms: mission.initialVelocityKms,
    verticalSpeedKms: mission.initialVerticalSpeedKms,
    horizontalSpeedKms: Math.sqrt(Math.max(0, Math.pow(mission.initialVelocityKms, 2) - Math.pow(mission.initialVerticalSpeedKms, 2))),
    pitchDeg: mission.initialPitchDeg,
    yawDeg: 0,
    rollDeg: 0,
    throttlePct: 0,
    fuelPct: mission.initialFuelPct,
    hullIntegrityPct: 100,
    fuelLeakActive: false,
    engineHeatPct: 20,
    engineOverheated: false,
    heatShieldPct: 100,
    oxygenBatteryTimerSec: mission.hasCountdownTimer ? mission.countdownDurationSec : 300,
    apoapsisKm: kepler.apoapsisAltitudeKm,
    periapsisKm: kepler.periapsisAltitudeKm,
    eccentricity: kepler.eccentricity,
    flightPathAngleDeg: kepler.flightPathAngleDeg,
    suicideBurnDistanceM: 0,
    suicideBurnIgnitionRequired: false,
    radarDebris: [],
    warningAlerts: [],
    cameraShakeIntensity: 0,
    isGameOver: false,
    outcome: 'IN_PROGRESS',
  };
}

/**
 * Modular Mission Rules Evaluation Engine
 * Evaluates win/loss conditions, dynamic warnings, and failure states
 */
export function evaluateMissionRules(
  mission: HardcoreMissionConfig,
  state: {
    altKm: number;
    vKms: number;
    vyKms: number;
    vxKms: number;
    fuel: number;
    hull: number;
    fuelLeak: boolean;
    engineHeat: number;
    engineOverheated: boolean;
    heatShield: number;
    countdownTimer: number;
    time: number;
  },
  kepler: KeplerianElements
): {
  isGameOver: boolean;
  outcome: 'IN_PROGRESS' | 'SUCCESS' | 'FAILED';
  reason?: string;
  warnings: string[];
} {
  const warnings: string[] = [];

  // 1. Mission 1: Kessler Syndrome
  if (mission.id === 'kessler-syndrome') {
    if (state.fuelLeak) warnings.push('⚠️ HULL BREACH · FUEL LEAK DETECTED');
    if (state.hull <= 0) {
      return {
        isGameOver: true,
        outcome: 'FAILED',
        reason: 'CATASTROPHIC HULL BREACH: SHIP DESTROYED BY HIGH-VELOCITY SPACE DEBRIS IMPACTS',
        warnings,
      };
    }
    const apDist = Math.abs(kepler.apoapsisAltitudeKm - 550);
    const peDist = Math.abs(kepler.periapsisAltitudeKm - 550);
    if (apDist <= 35 && peDist <= 35 && kepler.eccentricity < 0.05 && state.hull > 0) {
      return {
        isGameOver: true,
        outcome: 'SUCCESS',
        reason: `KESSLER SYNDROME ESCAPED! Stabilized in ${kepler.periapsisAltitudeKm.toFixed(0)}x${kepler.apoapsisAltitudeKm.toFixed(0)} km safe orbit with ${state.hull.toFixed(0)}% hull intact!`,
        warnings,
      };
    }
  }

  // 2. Mission 2: Solar Storm
  if (mission.id === 'solar-storm') {
    if (state.engineOverheated) warnings.push('⚠️ ENGINE OVERHEAT · SHUTDOWN LOCK');
    else if (state.engineHeat > 80) warnings.push('⚠️ ENGINE TEMPERATURE CRITICAL');

    if (kepler.periapsisAltitudeKm > 120 && kepler.apoapsisAltitudeKm >= 180 && kepler.apoapsisAltitudeKm <= 380) {
      return {
        isGameOver: true,
        outcome: 'SUCCESS',
        reason: `SOLAR STORM BLIND NAVIGATION SUCCESSFUL! Stable orbit insertion achieved: Pe ${kepler.periapsisAltitudeKm.toFixed(0)} km / Ap ${kepler.apoapsisAltitudeKm.toFixed(0)} km!`,
        warnings,
      };
    }
  }

  // 3. Mission 3: Apollo 13 Crisis
  if (mission.id === 'apollo-13') {
    if (state.countdownTimer < 90) warnings.push('⚠️ LOW O2 / BATTERY CRITICAL');

    if (state.countdownTimer <= 0) {
      return {
        isGameOver: true,
        outcome: 'FAILED',
        reason: 'CRITICAL ECLSS FAILURE: OXYGEN & BATTERY DEPLETED BEFORE RE-ENTRY INTERFACE',
        warnings,
      };
    }

    if (state.altKm < 2000) {
      const ang = Math.abs(kepler.flightPathAngleDeg);
      if (ang < 5.5) warnings.push(`⚠️ RE-ENTRY SHALLOW (${ang.toFixed(1)}° < 5.5° - WILL SKIP INTO SPACE)`);
      else if (ang > 7.5) warnings.push(`⚠️ RE-ENTRY STEEP (${ang.toFixed(1)}° > 7.5° - WILL INCINERATE)`);
    }

    if (state.altKm <= 120) {
      const entryAngle = Math.abs(kepler.flightPathAngleDeg);
      if (entryAngle >= 5.5 && entryAngle <= 7.5) {
        return {
          isGameOver: true,
          outcome: 'SUCCESS',
          reason: `APOLLO 13 SAVED! Precision re-entry corridor hit at ${entryAngle.toFixed(2)}° (Target: 5.5° - 7.5°). Capsule safely landed!`,
          warnings,
        };
      } else if (entryAngle < 5.5) {
        return {
          isGameOver: true,
          outcome: 'FAILED',
          reason: `SKIPPED OFF ATMOSPHERE: Entry angle was ${entryAngle.toFixed(2)}° (< 5.5°). Capsule ricocheted into deep space!`,
          warnings,
        };
      } else {
        return {
          isGameOver: true,
          outcome: 'FAILED',
          reason: `ENTRY TOO STEEP: Entry angle was ${entryAngle.toFixed(2)}° (> 7.5°). Deceleration exceeded 30 Gs; heat shield destroyed!`,
          warnings,
        };
      }
    }
  }

  // 4. Mission 4: Gravity Well Escape (Oberth Slingshot)
  if (mission.id === 'oberth-slingshot') {
    if (state.heatShield < 35) warnings.push('⚠️ HEAT SHIELD CRITICAL (< 35%)');
    if (state.altKm < 3500) warnings.push('⚠️ ATMOSPHERIC FRICTION HEATING ACTIVE');

    if (state.heatShield <= 0) {
      return {
        isGameOver: true,
        outcome: 'FAILED',
        reason: 'HEAT SHIELD ABLATED TO 0% — SPACECRAFT VAPORIZED IN UPPER ATMOSPHERE',
        warnings,
      };
    }

    if (kepler.isHyperbolic && state.vKms >= 52.0 && state.heatShield > 0) {
      return {
        isGameOver: true,
        outcome: 'SUCCESS',
        reason: `OBERTH SLINGSHOT ACHIEVED! Escaped Gas Giant gravity well at ${state.vKms.toFixed(1)} km/s with ${state.heatShield.toFixed(0)}% heat shield remaining!`,
        warnings,
      };
    }
  }

  // 5. Mission 5: Pinpoint Suicide Burn
  if (mission.id === 'suicide-burn') {
    const suicideCalc = calculateSuicideBurnAltitude(state.vyKms * 1000, 28.5, 1.62);
    const suicideBurnAltM = suicideCalc.suicideBurnDistanceM;
    const currentAltM = state.altKm * 1000;

    if (currentAltM <= suicideBurnAltM * 1.05 && currentAltM > 5) {
      warnings.push('⚠️ SUICIDE BURN IGNITION POINT [FULL THROTTLE NOW]');
    }

    if (state.fuel <= 0 && currentAltM > 10) {
      return {
        isGameOver: true,
        outcome: 'FAILED',
        reason: 'FUEL EXHAUSTION: Propellant depleted mid-air during suicide burn.',
        warnings,
      };
    }

    if (state.altKm <= 0.002) {
      const impactSpeedMs = Math.abs(state.vyKms * 1000);
      const horizSpeedMs = Math.abs(state.vxKms * 1000);

      if (impactSpeedMs <= 3.0 && horizSpeedMs <= 1.0) {
        return {
          isGameOver: true,
          outcome: 'SUCCESS',
          reason: `PINPOINT SUICIDE BURN SUCCESSFUL! Touchdown speed: ${impactSpeedMs.toFixed(1)} m/s (Remaining Fuel: ${state.fuel.toFixed(1)}%)`,
          warnings,
        };
      } else if (impactSpeedMs > 3.0) {
        return {
          isGameOver: true,
          outcome: 'FAILED',
          reason: `HARD IMPACT CRASH: Touchdown vertical speed was ${impactSpeedMs.toFixed(1)} m/s (Structural safety limit is 3.0 m/s)`,
          warnings,
        };
      } else {
        return {
          isGameOver: true,
          outcome: 'FAILED',
          reason: `LANDER TIPPED: Horizontal drift was ${horizSpeedMs.toFixed(1)} m/s (Limit: 1.0 m/s)`,
          warnings,
        };
      }
    }
  }

  // General Ground Crash check
  const isLandingMission = mission.id === 'suicide-burn' || mission.id === 'lunar-voyager' || mission.id === 'mars-voyager';
  if (state.altKm <= 0 && !isLandingMission) {
    return {
      isGameOver: true,
      outcome: 'FAILED',
      reason: 'CRASH IMPACT: Spacecraft crashed into the planetary surface.',
      warnings,
    };
  }

  return {
    isGameOver: false,
    outcome: 'IN_PROGRESS',
    warnings,
  };
}
