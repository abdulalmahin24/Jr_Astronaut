// ============================================================================
// NASA Junior Astronaut — Real Scientific Data Plan for 4 Survival Missions
// 2 Moon Survival Missions + 2 Mars Survival Missions
// Grounded in NASA Open Data (data.nasa.gov), NASA API Portal (api.nasa.gov),
// NASA Earthdata (earthdata.nasa.gov), and NASA JPL Planetary Data (jpl.nasa.gov)
// Built for NASA Space Apps Challenge 2026 · Team Mysterio
// ============================================================================

export interface NasaSurvivalDataPlanMission {
  id: string;
  targetBody: 'MOON' | 'MARS';
  missionNumber: 1 | 2 | 3 | 4;
  title: string;
  subtitle: string;
  targetSite: string;
  coordinates: string;
  elevationM: number;
  nasaPortal: 'data.nasa.gov' | 'api.nasa.gov' | 'earthdata.nasa.gov' | 'jpl.nasa.gov';
  primaryDatasetName: string;
  datasetCitationDoc: string;
  datasetDirectUrl: string;
  scientificPhenomenon: string;
  physicsFormula: string;
  environmentalTelemetry: {
    atmosphericPressurePa: number;
    ambientTemperatureC: { min: number; max: number };
    surfaceGravityMs2: number;
    primaryHazardValue: string;
    criticalThreshold: string;
  };
  survivalObjective: string;
  commanderProtocols: {
    step: number;
    action: string;
    scientificRationale: string;
  }[];
  failureConsequence: string;
  verificationGuide: string;
}

export const NASA_SURVIVAL_DATA_PLAN: NasaSurvivalDataPlanMission[] = [
  // ─── 1. MOON SURVIVAL MISSION 1 ──────────────────────────────────────────
  {
    id: 'moon-survival-nakamura-seismic',
    targetBody: 'MOON',
    missionNumber: 1,
    title: 'Moon Survival 1: Shallow Moonquake & Regolith Resonance',
    subtitle: 'Nakamura (1979) High-Q Acoustic Ringing & Structural Isolation',
    targetSite: 'Mare Tranquillitatis (Apollo 11 PSE Station S11)',
    coordinates: '0.67°N, 23.47°E',
    elevationM: -1850,
    nasaPortal: 'data.nasa.gov',
    primaryDatasetName: 'Apollo Passive Seismic Experiment (PSE) Shallow Moonquake Catalog',
    datasetCitationDoc: 'Yosio Nakamura et al. (1979), Journal of Geophysical Research, Vol. 84, pp. 1569–1577; NASA PDS Geosciences Node (PDS3-GEO-APOLLO-PSE-V1.0)',
    datasetDirectUrl: 'https://pds-geosciences.wustl.edu/missions/apollo/pse.htm',
    scientificPhenomenon:
      'Unlike earthquakes which attenuate in 1–2 minutes due to water saturation, dry lunar regolith lacks moisture and fluid damping (seismic quality factor Q > 3,000 to 5,000). A shallow moonquake rings violently for 60 to 120 minutes with lateral accelerations exceeding 0.05 m/s², threatening to tip landing modules, rupture cryo fuel lines, and compromise pressurized habitat seals.',
    physicsFormula: 'A(t) = A_0 \\cdot e^{-\\frac{\\omega t}{2Q}} \\cdot \\sin(\\omega t + \\phi)',
    environmentalTelemetry: {
      atmosphericPressurePa: 0.0000000003, // Hard vacuum 3x10^-10 Pa
      ambientTemperatureC: { min: -170, max: 120 },
      surfaceGravityMs2: 1.622,
      primaryHazardValue: 'Magnitude 3.2 Richter / 0.065 m/s² lateral ground acceleration',
      criticalThreshold: 'Structural vibration threshold: > 0.045 m/s² causes landing gear shearing',
    },
    survivalObjective:
      'Deploy mechanical vibration damping pylons, vent residual hypergolic propellant lines to eliminate resonance explosion risks, and balance habitat airlock pressure before acoustic ringing collapses the outpost structure.',
    commanderProtocols: [
      {
        step: 1,
        action: 'Deploy Hydraulic Dampening Outriggers',
        scientificRationale: 'Attenuates high-Q seismic resonance from the lunar megaregolith, preventing harmonic oscillation transfer into the spacecraft frame.',
      },
      {
        step: 2,
        action: 'Depressurize Interstage Propellant Manifolds',
        scientificRationale: 'Vibrational sloshing of nitrogen tetroxide (N2O4) oxidizer at natural frequency creates cavitation shock that can rupture plumbing.',
      },
      {
        step: 3,
        action: 'Lock Gimbal Actuators & Engage Micro-Spike Anchors',
        scientificRationale: 'Secures footpads into the titanium regolith matrix to resist lateral shear loads.',
      },
    ],
    failureConsequence: 'Landing gear shear failure; spacecraft tips on lunar surface, breaching crew cabin and destroying ascent engine.',
    verificationGuide:
      'Search "Apollo Passive Seismic Experiment" on data.nasa.gov or access the Nakamura (1979) catalog at pds-geosciences.wustl.edu to verify recorded shallow moonquake dates, magnitudes, and coordinates.',
  },

  // ─── 2. MOON SURVIVAL MISSION 2 ──────────────────────────────────────────
  {
    id: 'moon-survival-solar-storm-malapert',
    targetBody: 'MOON',
    missionNumber: 2,
    title: 'Moon Survival 2: Malapert Mountain Class X7.2 Solar Storm',
    subtitle: 'Coronal Mass Ejection (CME) Proton Flux & Regolith Vault Shielding',
    targetSite: 'Malapert Mountain Plateau (Lunar South Pole, Connecting Ridge)',
    coordinates: '86.0°S, 2.7°E',
    elevationM: 5000,
    nasaPortal: 'api.nasa.gov',
    primaryDatasetName: 'NASA Space Weather Database of Notifications, Knowledge, Information (DONKI) & LRO CRaTER',
    datasetCitationDoc: 'NASA GSFC Community Coordinated Modeling Center (CCMC) DONKI CME/SEP Catalog; LRO Cosmic Ray Telescope for the Effects of Radiation (CRaTER)',
    datasetDirectUrl: 'https://kauai.ccmc.gsfc.nasa.gov/DONKI/',
    scientificPhenomenon:
      'A Class X7.2 solar flare triggers an intense Solar Energetic Particle (SEP) event, hurling relativistic protons (energies > 100 MeV) directly along the interplanetary magnetic field lines toward the Moon at 2,200 km/s. With zero lunar atmosphere and no global magnetosphere, unshielded surface biological absorbed doses exceed 1.5–2.0 Gray (Gy), causing acute radiation syndrome (ARS) within hours.',
    physicsFormula: 'I(x) = I_0 \\cdot e^{-\\mu x} = I_0 \\cdot e^{-(\\mu/\\rho) \\cdot \\rho x}',
    environmentalTelemetry: {
      atmosphericPressurePa: 0.0,
      ambientTemperatureC: { min: -230, max: -40 },
      surfaceGravityMs2: 1.622,
      primaryHazardValue: 'Proton Flux > 12,000 pfu (> 10 MeV) / 1.85 Gy unshielded dose',
      criticalThreshold: 'Cumulative exposure must not exceed 0.25 Gy (NASA career limit threshold)',
    },
    survivalObjective:
      'Evacuate surface exploration crew from Malapert Mountain ridge into the subterranean basalt storm shelter (packed with 2.0+ meters of lunar regolith shielding) within the 18-minute proton arrival warning window.',
    commanderProtocols: [
      {
        step: 1,
        action: 'Abort Surface EVA & Ingress Storm Vault',
        scientificRationale: 'Solar Energetic Particle (SEP) shock front travels at 0.007c; astronauts have exactly 18 minutes from satellite X-ray detection to proton storm onset.',
      },
      {
        step: 2,
        action: 'Deploy Electrostatic / Water Wall Shields',
        scientificRationale: 'Low-Z hydrogenous materials (water jackets and regolith polyethylene composites) absorb high-energy protons without generating secondary Bremsstrahlung gamma rays.',
      },
      {
        step: 3,
        action: 'Switch Avionics to Radiation-Hardened Safe Mode',
        scientificRationale: 'High-energy proton flux induces Single Event Upsets (SEUs) and latch-ups in standard CMOS microprocessors.',
      },
    ],
    failureConsequence: 'Lethal acute radiation exposure (> 2.0 Gy); permanent avionics memory corruption rendering navigation computer inoperable.',
    verificationGuide:
      'Query the NASA DONKI API endpoint (https://api.nasa.gov/DONKI/SEP) with an API key to inspect real historical Class X Solar Energetic Particle event flux data.',
  },

  // ─── 3. MARS SURVIVAL MISSION 1 ──────────────────────────────────────────
  {
    id: 'mars-survival-rems-global-dust-storm',
    targetBody: 'MARS',
    missionNumber: 3,
    title: 'Mars Survival 1: REMS Extreme Planet-Encircling Dust Storm',
    subtitle: 'Gale / Jezero Optical Opacity Tau > 3.5 & Electrostatic Discharge',
    targetSite: 'Gale Crater (Curiosity MSL) & Jezero Crater (Perseverance)',
    coordinates: '4.58°S, 137.44°E / 18.38°N, 77.58°E',
    elevationM: -4500,
    nasaPortal: 'jpl.nasa.gov',
    primaryDatasetName: 'Rover Environmental Monitoring Station (REMS) & MEDA Atmospheric Telemetry',
    datasetCitationDoc: 'NASA PDS Atmospheres Node (MSL-M-REMS-MOD-EDR-V1.0) / JPL Mars Science Laboratory Data Records; Gómez-Elvira et al. (2014)',
    datasetDirectUrl: 'https://pds-atmospheres.nmsu.edu/data_and_services/atmospheres_data/MARS/curiosity/rems.html',
    scientificPhenomenon:
      'During Martian perihelion season, atmospheric solar absorption triggers planet-encircling global dust events. Optical depth (tau) escalates past 3.5 to 4.5, blocking 99% of sunlight and causing surface solar irradiance to collapse from 590 W/m² to under 15 W/m². Extreme nighttime thermal radiation plunges ambient temperatures to -85°C, while airborne dust triboelectric charging creates 20 kV/m electrostatic discharge arcs.',
    physicsFormula: 'I_{surface} = I_{top} \\cdot e^{-\\tau / \\cos(\\theta_{zenith})}',
    environmentalTelemetry: {
      atmosphericPressurePa: 750, // 0.75% of Earth's sea-level pressure (95% CO2)
      ambientTemperatureC: { min: -85, max: -15 },
      surfaceGravityMs2: 3.72,
      primaryHazardValue: 'Optical Depth Tau = 4.2 / Wind Gusts 32 m/s / -85°C Night Chill',
      criticalThreshold: 'Solar power collapse (< 45 W); rover internal battery freeze-out at < -40°C',
    },
    survivalObjective:
      'Shutdown non-essential science instruments, activate MMRTG / Kilopower nuclear thermal bus to heat battery cores above -35°C, ground all composite chassis against electrostatic buildup, and position rover in the leeward shadow of a basalt ridge.',
    commanderProtocols: [
      {
        step: 1,
        action: 'Transition from Solar Arrays to Nuclear MMRTG Thermal Bus',
        scientificRationale: 'Solar array power output falls below the 55 W survival threshold under Tau > 3.0; nuclear decay heat (Pu-238) prevents electrolyte freezing.',
      },
      {
        step: 2,
        action: 'Activate Resistive Heating on Actuators & Mobility Bogies',
        scientificRationale: 'Hydrocarbon lubricants freeze solid at -65°C; joint heaters must maintain viscosity to prevent gear fracturing.',
      },
      {
        step: 3,
        action: 'Deploy Conductive Grounding Tethers',
        scientificRationale: 'Martian dust devils generate massive triboelectric potentials (> 20 kV); grounding prevents destructive ESD arcing across sensitive CMOS sensors.',
      },
    ],
    failureConsequence: 'Battery thermal runaway and freezing; Opportunity-style catastrophic power starvation and permanent vehicle loss.',
    verificationGuide:
      'Access NASA PDS Atmospheres Node (pds-atmospheres.nmsu.edu) or JPL Mars Science Laboratory portal to examine real sol-by-sol REMS daily pressure, wind, and tau graphs.',
  },

  // ─── 4. MARS SURVIVAL MISSION 2 ──────────────────────────────────────────
  {
    id: 'mars-survival-coprates-chasma-canyon',
    targetBody: 'MARS',
    missionNumber: 4,
    title: 'Mars Survival 2: Coprates Chasma Hypersonic Canyon Entry',
    subtitle: 'Valles Marineris (-6,800m) Katabatic Wind Shear & Permafrost Extraction',
    targetSite: 'Coprates Chasma (Central Valles Marineris Canyon System)',
    coordinates: '13.4°S, 61.2°W',
    elevationM: -6800,
    nasaPortal: 'earthdata.nasa.gov',
    primaryDatasetName: 'Mars Orbiter Laser Altimeter (MOLA) & SHARAD Subsurface Radar Sounder',
    datasetCitationDoc: 'Smith et al. (2001), Mars Global Surveyor MOLA MEGDR Product; NASA Planetary Data System Geosciences Node (MGS-M-MOLA-5-MEGDR-L3-V1.0)',
    datasetDirectUrl: 'https://pds-geosciences.wustl.edu/missions/mgs/mola.html',
    scientificPhenomenon:
      'Landing inside Coprates Chasma—the deepest trench of Valles Marineris at -6,800 meters below Martian datum. The 7 km vertical canyon walls generate violent nighttime katabatic down-draft winds exceeding 45 m/s. While atmospheric pressure is the highest on Mars (1,150 Pa), navigating hypersonic entry between sheer rock cliffs onto a narrow 30° basalt scree apron requires pinpoint active thruster guidance.',
    physicsFormula: 'F_{katabatic} = -\\rho \\cdot \\theta_{anom} \\cdot g \\cdot \\sin(\\alpha) - C_d \\cdot \\frac{1}{2} \\rho v^2',
    environmentalTelemetry: {
      atmosphericPressurePa: 1150, // Dense Martian basin atmosphere (1.15 kPa)
      ambientTemperatureC: { min: -92, max: -8 },
      surfaceGravityMs2: 3.72,
      primaryHazardValue: 'Katabatic Wind Shear 45 m/s / 30° Basalt Scree Incline / -6,800m Canyon',
      criticalThreshold: 'Touchdown vertical velocity must not exceed 2.8 m/s on a 15° slope limit',
    },
    survivalObjective:
      'Pilot hypersonic entry guidance through the narrow canyon mouth, execute suicide-burn retro-propulsion against 45 m/s katabatic down-drafts, self-level hydraulic landing legs on a narrow basalt ledge, and drill deep core for pure subsurface permafrost ice.',
    commanderProtocols: [
      {
        step: 1,
        action: 'Angle Terrain-Relative Navigation (TRN) LIDAR at Canyon Walls',
        scientificRationale: 'Shadowing inside 7 km canyon walls blocks optical sky references; real-time LIDAR surface contour matching prevents cliff face collision.',
      },
      {
        step: 2,
        action: 'Execute High-Thrust Pulsed Retro-Burn Against Down-Drafts',
        scientificRationale: 'Katabatic wind shear adds sudden downward acceleration vectors; pulsed throttle compensators maintain constant descent velocity (< 3.0 m/s).',
      },
      {
        step: 3,
        action: 'Engage Rotary-Percussive Diamond Core Drill at 0.8m Depth',
        scientificRationale: 'SHARAD radar indicates pure cryogenic permafrost ice lenses reside beneath the top 80 cm of insulating basalt scree.',
      },
    ],
    failureConsequence: 'Collision with vertical canyon walls; dynamic rollover on 30° loose basalt scree slope, causing lander structural collapse.',
    verificationGuide:
      'Verify elevation contours and slope gradients using NASA MOLA Mission Elevation Grid Data Records (MEGDR) at pds-geosciences.wustl.edu or search Valles Marineris topography on earthdata.nasa.gov.',
  },
];
