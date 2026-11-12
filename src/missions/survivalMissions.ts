// ============================================================================
// NASA Junior Astronaut — Hardcore Survival Missions Engine
// Real Orbital Mechanics, Newtonian Gravity, Keplerian Solvers & Mission Rules
// References: benjamin-awd/solar-system-threejs, jakerunzer/space-flight,
// NASA Open Data (data.nasa.gov), NASA API Portal (api.nasa.gov)
// ============================================================================

export type HardcoreMissionId =
  | 'suborbital-pioneer'
  | 'orbital-pioneer'
  | 'lunar-voyager'
  | 'mars-voyager'
  | 'kessler-syndrome'
  | 'solar-storm'
  | 'apollo-13'
  | 'oberth-slingshot'
  | 'suicide-burn';

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

export const HARDCORE_SURVIVAL_MISSIONS: HardcoreMissionConfig[] = [
  {
    id: 'suborbital-pioneer',
    missionNumber: 1,
    title: 'Mission 1: Sub-Orbital Pioneer & Kármán Boundary',
    tagline: '100 km Atmospheric Punch, Microgravity & Ocean Splashdown',
    scenario: 'Manual launch from Cape Canaveral. Throttle up, steer a gradual gravity turn, punch through atmospheric drag past the 100 km Kármán line into microgravity space. Decouple booster, orient capsule heat shield, and deploy parachutes below 4,000 m for ocean recovery.',
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
    targetObjective: 'Manually pilot rocket past 100 km Kármán line, achieve microgravity, re-enter atmosphere safely, and splash down with parachute below 8 m/s.',
    scientificContext: 'Project Mercury Redstone (MR-3 Freedom 7) sent Alan Shepard on a 15-minute suborbital flight peaking at 187 km. Proved human ability to withstand launch Gs and microgravity disorientation.',
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
    missionNumber: 2,
    title: 'Mission 2: Orbital Pioneer: Low Earth Orbit 200 km',
    tagline: 'Multi-Stage Staging, 7.8 km/s Orbital Velocity & De-Orbit Burn',
    scenario: 'Execute a full multi-stage orbital insertion. Steer the gravity turn pitch program (90° down to 10°), decouple stage 1 booster with [SPACE], accelerate to orbital velocity (7.8 km/s), circularize orbit at 200 km, perform retrograde de-orbit burn, and splash down.',
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
    targetObjective: 'Achieve stable 200 km circular Low Earth Orbit (velocity >= 7.75 km/s, Periapsis > 150 km), complete orbit verification, retrograde burn, and ocean splashdown.',
    scientificContext: 'First orbital velocity requirement (v = sqrt(G*M / r) = 7.8 km/s). Gravity turn optimizes fuel by letting gravity curve the flight vector without expending lateral gimbal energy.',
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
    missionNumber: 3,
    title: 'Mission 3: Lunar Voyager (Full Moon Expedition — YouTube Reference)',
    tagline: 'Earth Launch ➔ TLI ➔ Lunar Retro Touchdown ➔ Surface EVA ➔ Splashdown',
    scenario: 'Modeled directly after Ellipse: Lunar Voyager Mission 3 (YouTube: qXYpltxSTK0). Earth liftoff, Trans-Lunar Injection burn, enter lunar orbit, perform manual retro powered descent to touch down gently (< 3 m/s), plant flag & drill core on surface EVA, liftoff into lunar orbit, trans-Earth return burn, hypersonic atmospheric entry, and parachute ocean splashdown!',
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
    targetObjective: 'Execute pinpoint manual powered landing (< 3 m/s touchdown), complete surface EVA science, liftoff from Moon, and return capsule safely to Earth splashdown.',
    scientificContext: 'Apollo Lunar Module Descent Propulsion System (LMDE) required throttlable deep-throttling pintle engines to cancel 1.6 km/s orbital velocity and touch down gently on unpredictable lunar crater topography.',
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
    missionNumber: 4,
    title: 'Mission 4: Mars Interplanetary Voyager',
    tagline: 'Earth Launch ➔ TMI ➔ Mars Hypersonic EDL ➔ MOXIE EVA ➔ Return Splashdown',
    scenario: 'The ultimate interplanetary survival expedition. Earth launch, Trans-Mars Injection burn, brave hypersonic entry through thin Martian atmosphere (entry corridor heating), supersonic retro-propulsion touchdown in Jezero Crater, extract O2 with MOXIE, surface liftoff, trans-Earth return burn, and Pacific recovery.',
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
    targetObjective: 'Survive Mars Entry, Descent, and Landing (EDL), land softly in Jezero Crater, complete MOXIE/sample science, launch from Mars surface, and return to Earth ocean recovery.',
    scientificContext: 'Mars EDL combines atmospheric drag, supersonic parachutes, and powered terminal descent in a 610 Pa carbon dioxide atmosphere with 38% Earth gravity.',
    nasaDataSources: [
      {
        title: 'NASA Mars 2020 Perseverance Entry, Descent, and Landing (EDL) Telemetry',
        url: 'https://mars.nasa.gov/mars2020/',
        portal: 'jpl.nasa.gov',
      },
    ],
  },
];

// Bonus Orbital Mechanics Challenges (Available as supplementary simulations)
export const BONUS_ORBITAL_CHALLENGE_MISSIONS: HardcoreMissionConfig[] = [
  {
    id: 'kessler-syndrome',
    missionNumber: 5,
    title: 'Kessler Syndrome: Orbital Debris Survival',
    tagline: 'Cascade Collisions & Rapid Fuel Leak Mitigation',
    scenario: 'Spawn a dense field of 120 high-velocity orbital debris fragments (red pings on tactical radar) orbiting Earth between 200 km and 500 km altitude. Navigate through the debris storm with active hull breach detection.',
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
    targetObjective: 'Navigate safely through the debris field and raise orbit to a stable, circular orbit at 550 km altitude (Apoapsis & Periapsis ±30 km, Eccentricity < 0.05).',
    scientificContext: 'Proposed by NASA astrophysicist Donald J. Kessler in 1978: when space debris density in Low Earth Orbit (LEO) exceeds critical threshold, a single collision causes cascading fragmentations, creating a runaway debris belt rendering LEO unusable.',
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
    title: 'Solar Storm: Blind Telemetry Navigation',
    tagline: 'Coronal Mass Ejection Trajectory Blackout',
    scenario: 'A severe X-Class Coronal Mass Ejection (CME) strikes Earth\'s magnetosphere, causing complete telemetry blackout. Visual trajectory arc and radar orbital path are disabled. Navigate purely by raw numerical instruments.',
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
    targetObjective: 'Achieve a stable Earth parking orbit (Periapsis > 120 km and Apoapsis between 180 km and 350 km) relying strictly on numerical altitude, velocity, vertical speed, and pitch angle without overheating the engine.',
    scientificContext: 'Extreme solar particle events (SPE) induce severe geomagnetic currents, frying orbital transponders and GPS receivers. Astronauts must rely on inertial measurement units (IMUs) and throttle temperature management.',
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
    title: 'Apollo 13 Crisis: Critical System Failure',
    tagline: 'Free-Return Trajectory & 5.5°–7.5° Atmospheric Re-Entry Corridor',
    scenario: 'Service Module oxygen tank 2 exploded, disabling the primary Service Propulsion System (SPS) main engine. The crew is plunging toward Earth at 10.9 km/s on a lunar free-return trajectory with only low-thrust RCS maneuvering thrusters.',
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
    targetObjective: 'Execute precision RCS burns to steer Earth atmospheric re-entry corridor flight path angle to exactly between 5.5° and 7.5° before the 5-minute Oxygen & Battery timer expires.',
    scientificContext: 'During Apollo 13, NASA flight controllers calculated that if the entry angle was shallower than 5.5°, the spacecraft would skip off Earth\'s upper atmosphere like a flat stone on water into solar orbit; steeper than 7.5°, atmospheric deceleration would exceed 30 Gs, incinerating the heat shield.',
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
    title: 'Gravity Well Escape: Oberth Effect Slingshot',
    tagline: 'Deep Gas Giant Pericenter Burn & Heat Shield Melting',
    scenario: 'Plunging deep into the extreme gravity well of a massive gas giant (Jupiter analogue) on a dangerously decaying hyperbolic trajectory. The intense radiation and atmospheric friction melts your heat shield as altitude drops.',
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
    targetObjective: 'Wait for the exact moment of Periapsis (closest approach) to fire maximum prograde burn (Hermann Oberth effect) to achieve hyperbolic escape velocity before the heat shield melts to 0%.',
    scientificContext: 'The Oberth Effect proves that rocket engines generate far more kinetic energy when burned at high speed in the deepest point of a gravitational potential well, because Delta-E = v * Delta-v. Burning at pericenter is 4x more energy-efficient than burning at high altitude.',
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
    title: 'Pinpoint Suicide Burn: Hover Slam Landing',
    tagline: 'Last-Second Ignition & Zero-Margin Deceleration',
    scenario: 'Plunging toward the cratered lunar surface at 215 m/s downward velocity with zero atmosphere and only 8.5% fuel remaining. There is zero fuel to hover — you must ignite at the exact last fraction of a second to touch down safely.',
    targetBody: 'MOON',
    initialAltitudeKm: 3.8, // 3,800 meters
    initialVelocityKms: 0.22, // 220 m/s
    initialVerticalSpeedKms: -0.215, // -215 m/s
    initialPitchDeg: 90, // pointed vertically up for retrograde burn
    initialFuelPct: 8.5,
    mainEngineAvailable: true,
    rcsOnly: false,
    hideTrajectoryLine: false,
    hasDebrisField: false,
    hasEngineHeat: false,
    hasHeatShield: false,
    hasCountdownTimer: false,
    countdownDurationSec: 0,
    targetObjective: 'Calculate the exact terminal suicide burn altitude. Ignite 100% throttle at the last second to achieve touchdown speed < 3.0 m/s and horizontal speed < 1.0 m/s before running out of fuel.',
    scientificContext: 'SpaceX Falcon 9 and NASA Apollo Lunar Module (LMDE) descent profiles use optimal control suicide burns (hoverslam), where thrust acceleration matches kinematic stopping distance: h_burn = v^2 / (2 * (a_thrust - g)). Igniting even 0.5s too late causes catastrophic impact.',
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
    // Hyperbolic or parabolic trajectory
    semiMajorAxisKm = Math.abs(mu / (2 * Math.max(0.001, epsilon)));
    // Periapsis radius: r_p = (h^2 / mu) / (1 + e)
    const rp = (h * h) / (mu * (1 + eccentricity));
    periapsisAltitudeKm = rp - body.radiusKm;
    apoapsisAltitudeKm = Infinity;
    periodSec = Infinity;
  } else {
    // Elliptical bound orbit
    semiMajorAxisKm = -mu / (2 * epsilon);
    const rp = semiMajorAxisKm * (1 - eccentricity);
    const ra = semiMajorAxisKm * (1 + eccentricity);
    periapsisAltitudeKm = rp - body.radiusKm;
    apoapsisAltitudeKm = ra - body.radiusKm;
    // Orbital period: T = 2 * pi * sqrt(a^3 / mu)
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

  // h = v^2 / (2 * a_net)
  const suicideBurnDistanceM = (vy * vy) / (2 * netDecel);
  // t_burn = vy / a_net
  const timeToIgniteSec = vy / netDecel;

  return { suicideBurnDistanceM, timeToIgniteSec };
}

/**
 * Generates initial random orbital debris field for Kessler Syndrome
 */
export function generateOrbitalDebrisField(count = 90, earthRadiusKm = 6371): DebrisObject[] {
  const debris: DebrisObject[] = [];
  const types: Array<'fragment' | 'stage' | 'panel'> = ['fragment', 'stage', 'panel'];

  for (let i = 0; i < count; i++) {
    // Altitudes between 220 km and 540 km
    const altitude = 220 + Math.random() * 320;
    const r = earthRadiusKm + altitude;
    // Keep initial angle away from spawn point (theta ~ 0) for safe initial clearance
    const minSafeAngle = 0.35; // ~2300 km orbital clearance at spawn
    const angleRange = Math.PI * 2 - 2 * minSafeAngle;
    const angle = minSafeAngle + Math.random() * angleRange;
    const inc = (Math.random() - 0.5) * 0.3; // slight orbital inclination

    const x = r * Math.cos(angle);
    const y = r * Math.sin(inc);
    const z = r * Math.sin(angle);

    // Circular orbital speed ~ 7.7 km/s
    const vMag = Math.sqrt(398600.44 / r) * (0.98 + Math.random() * 0.04);
    const vx = -vMag * Math.sin(angle);
    const vy = (Math.random() - 0.5) * 0.2;
    const vz = vMag * Math.cos(angle);

    debris.push({
      id: i,
      x,
      y,
      z,
      vx,
      vy,
      vz,
      sizeM: 0.5 + Math.random() * 4.5,
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

