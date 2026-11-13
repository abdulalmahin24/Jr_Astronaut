// ============================================================================
// NASA Junior Astronaut — Hardcore Survival Missions Engine (JavaScript Module)
// Modular initial conditions, rules, and win/loss triggers
// References: benjamin-awd/solar-system-threejs, jakerunzer/space-flight
// ============================================================================

export const CELESTIAL_BODIES = {
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

export const HARDCORE_SURVIVAL_MISSIONS = [
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
    scientificContext: 'Proposed by NASA astrophysicist Donald J. Kessler in 1978: cascading collisions create a runaway debris belt rendering orbital slots impassable.',
    nasaDataSources: [
      {
        title: 'NASA Orbital Debris Program Office (ODPO) Datasets',
        url: 'https://orbitaldebris.jsc.nasa.gov/',
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
    scientificContext: 'Extreme solar particle events (SPE) induce severe geomagnetic currents, disabling transponders and visual guidance.',
    nasaDataSources: [
      {
        title: 'NASA Space Weather Database (DONKI)',
        url: 'https://api.nasa.gov/',
        portal: 'api.nasa.gov',
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
    scientificContext: 'NASA calculated that if entry was shallower than 5.5°, the capsule would skip off Earth\'s atmosphere; steeper than 7.5°, deceleration exceeds 30 Gs, destroying the capsule.',
    nasaDataSources: [
      {
        title: 'NASA Apollo 13 Mission Operations Report',
        url: 'https://www.nasa.gov/mission_pages/apollo/missions/apollo13.html',
        portal: 'jpl.nasa.gov',
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
    scientificContext: 'The Oberth Effect proves rocket engines generate far more kinetic energy when burned at high speed deep within a gravitational potential well (Delta-E = v * Delta-v).',
    nasaDataSources: [
      {
        title: 'NASA Juno Jupiter Gravity Investigation',
        url: 'https://www.jpl.nasa.gov/missions/juno',
        portal: 'jpl.nasa.gov',
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
    initialAltitudeKm: 3.8,
    initialVelocityKms: 0.22,
    initialVerticalSpeedKms: -0.215,
    initialPitchDeg: 90,
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
    scientificContext: 'SpaceX Falcon 9 and NASA Apollo LM descent profiles use hoverslam suicide burns: h_burn = v^2 / (2 * (a_thrust - g)).',
    nasaDataSources: [
      {
        title: 'NASA Apollo Lunar Surface Journal Descent Data',
        url: 'https://data.nasa.gov/',
        portal: 'data.nasa.gov',
      },
    ],
  },
];

export function computeKeplerianElements(radiusKm, velocityKms, verticalSpeedKms, body) {
  const mu = body.mu;
  const r = Math.max(radiusKm, body.radiusKm);
  const v = Math.max(velocityKms, 0.0001);

  const epsilon = (v * v) / 2 - mu / r;
  const sinGamma = Math.max(-1, Math.min(1, verticalSpeedKms / v));
  const flightPathAngleDeg = (Math.asin(sinGamma) * 180) / Math.PI;

  const cosGamma = Math.cos((flightPathAngleDeg * Math.PI) / 180);
  const h = r * v * Math.abs(cosGamma);

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

export function calculateSuicideBurnAltitude(downwardSpeedMs, maxThrustAccelMs2, gravityMs2) {
  const vy = Math.abs(downwardSpeedMs);
  const netDecel = maxThrustAccelMs2 - gravityMs2;
  if (netDecel <= 0) {
    return { suicideBurnDistanceM: Infinity, timeToIgniteSec: 0 };
  }
  const suicideBurnDistanceM = (vy * vy) / (2 * netDecel);
  const timeToIgniteSec = vy / netDecel;
  return { suicideBurnDistanceM, timeToIgniteSec };
}

export function generateOrbitalDebrisField(count = 110, earthRadiusKm = 6371) {
  const debris = [];
  const types = ['fragment', 'stage', 'panel'];

  for (let i = 0; i < count; i++) {
    const altitude = 200 + Math.random() * 300;
    const r = earthRadiusKm + altitude;
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

export function createInitialTelemetry(mission) {
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

export function evaluateMissionRules(mission, state, kepler) {
  const warnings = [];

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
