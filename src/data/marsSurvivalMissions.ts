/**
 * marsSurvivalMissions.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * 4 Dedicated Mars Planetary Survival Missions grounded in verified NASA data,
 * real-time APIs, REMS environmental logs, Mars Trek GIS coordinates, and
 * NASA Eyes trajectory telemetry.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export interface MarsSurvivalChoice {
  id: string;
  title: string;
  description: string;
  scientificTradeOff: string;
  resourceDelta: {
    oxygen?: number;
    power?: number;
    thermal?: number;
    integrity?: number;
    science?: number;
  };
  consequenceText: string;
  isOptimal: boolean;
}

export interface MarsSurvivalEvent {
  sol: number;
  timeString: string;
  title: string;
  incidentReport: string;
  environmentalNotice: string;
  choices: MarsSurvivalChoice[];
}

export interface MarsSurvivalMission {
  id: string;
  title: string;
  subtitle: string;
  destinationName: string;
  landingSite: string;
  coordinates: string;
  elevationMeters: number;
  surfaceTempC: string;
  atmosphericPressurePa: number; // In Pascals (Earth is ~101,325 Pa, Mars is ~600-1150 Pa)
  windSpeedMs: number;
  uvIndex: number;
  dustOpacityTau: number; // Optical depth (tau)
  nasaDatasetUrl: string;
  nasaDataSourceLabel: string;
  missionBadge: string;
  briefingAudioScript: string;
  scientificContext: string;
  initialResources: {
    oxygen: number;    // % (0-100)
    power: number;     // % (0-100)
    thermal: number;   // °C / % thermal balance (0-100)
    integrity: number; // % hull structural integrity (0-100)
    science: number;   // XP points
  };
  events: MarsSurvivalEvent[];
}

export const MARS_SURVIVAL_MISSIONS: MarsSurvivalMission[] = [
  // ─── MISSION 1: MARS 2020 — JEZERO CRATER DELTA & MOXIE OXYGEN EXTRACTION ───
  {
    id: 'mars-survive-01',
    title: 'Mission 1: Jezero Delta — MOXIE Oxygen Extraction',
    subtitle: 'Mars 2020 Perseverance & Ingenuity Astrobiology Sortie',
    destinationName: 'Mars · Jezero Crater Ancient River Delta',
    landingSite: 'Octavia E. Butler Landing Site',
    coordinates: '18.38°N, 77.58°E',
    elevationMeters: -2560,
    surfaceTempC: '-88°C to -14°C',
    atmosphericPressurePa: 610, // ~0.6% Earth pressure, 95.3% CO2
    windSpeedMs: 9.4,
    uvIndex: 8.5,
    dustOpacityTau: 0.65,
    nasaDatasetUrl: 'https://science.nasa.gov/mission/mars-2020-perseverance/',
    nasaDataSourceLabel: 'NASA Mars 2020 Perseverance Mission Archive & PDS Geosciences',
    missionBadge: '🔴',
    briefingAudioScript:
      'Commander, welcome to Jezero Crater. Atmospheric pressure is 610 Pascals—pure unbreathable carbon dioxide. Your primary life-support goal is operating the MOXIE solid oxide electrolysis stack to synthesize breathable oxygen before nightfall freeze.',
    scientificContext:
      'MOXIE (Mars Oxygen ISRU Experiment) heats atmospheric CO2 to 800°C across solid oxide ceramic tubes to split 2CO2 into 2CO + O2. Operating this system requires 300 Watts from the MMRTG nuclear battery while maintaining thermal insulation against -88°C nighttime lows.',
    initialResources: {
      oxygen: 65,
      power: 80,
      thermal: 75,
      integrity: 95,
      science: 120,
    },
    events: [
      {
        sol: 1,
        timeString: 'Sol 01 · 10:15 LST (Local Solar Time)',
        title: 'MOXIE Thermal Ramp-Up & Compressor Startup',
        incidentReport:
          'Atmospheric gas intake pump is drawing thin Martian air. MOXIE heating element is climbing toward the critical 800°C electrolysis threshold. Ambient temperature is -28°C with moderate morning breeze.',
        environmentalNotice: 'Barometric Pressure: 612 Pa · CO2 Purity: 95.3% · Ambient Solar Flux: 590 W/m²',
        choices: [
          {
            id: 'moxie-high-yield',
            title: 'High-Temperature Solid Oxide Electrolysis (800°C)',
            description: 'Direct max power to ceramic heating tubes to produce 10 grams O2/hour at peak efficiency.',
            scientificTradeOff: 'Consumes +25% MMRTG battery power but maximizes breathable oxygen reserves.',
            resourceDelta: { oxygen: +25, power: -20, thermal: +10, science: +40 },
            consequenceText: 'MOXIE reached nominal 800°C equilibrium! High-purity O2 is filling secondary life-support tanks.',
            isOptimal: true,
          },
          {
            id: 'moxie-eco-conserve',
            title: 'Pulsed Low-Current Compression Mode',
            description: 'Run compressor in pulses to protect battery reserves, generating modest 3 grams O2/hour.',
            scientificTradeOff: 'Saves battery power but generates insufficient oxygen buffer before nightfall.',
            resourceDelta: { oxygen: +8, power: -6, thermal: -5, science: +15 },
            consequenceText: 'Power drain minimized, but oxygen replenishment is lagging behind planned EVA consumption rate.',
            isOptimal: false,
          },
        ],
      },
      {
        sol: 2,
        timeString: 'Sol 02 · 14:40 LST',
        title: 'Ingenuity Aerial Flight Path Scouting',
        incidentReport:
          'A 12-meter boulder-strewn scarp blocks the rover route to the ancient river delta deposits. Traversing blindly risks wheel slip and chassis stranding in soft aeolian sands.',
        environmentalNotice: 'Air Density: 0.018 kg/m³ · Wind Gusts: 14 m/s · Rotor RPM Target: 2,540 RPM',
        choices: [
          {
            id: 'ingenuity-scout',
            title: 'Deploy Ingenuity Rotorcraft for 90-Second Recon Flight',
            description: 'Spin counter-rotating carbon-fiber blades to 2,540 RPM to map a safe traversable path over the delta bluff.',
            scientificTradeOff: 'Risk micro-rotor thermal stress; delivers high-resolution terrain clearance map.',
            resourceDelta: { oxygen: -5, power: -10, integrity: +10, science: +60 },
            consequenceText: 'Ingenuity airborne! Aerial color navcam detected a gentle 8° gravel ramp bypassing treacherous sand traps.',
            isOptimal: true,
          },
          {
            id: 'blind-traverse',
            title: 'Force Direct Rover Rocker-Bogie Climb',
            description: 'Engage all 6 aluminum cleated wheels to climb directly through the scree field without aerial recon.',
            scientificTradeOff: 'Saves drone battery; high risk of wheel slip and chassis underbody scraping.',
            resourceDelta: { power: -18, integrity: -25, science: +20 },
            consequenceText: 'Right middle wheel experienced 42% slip on loose silt. Cleat edges scraped against sharp basalt boulders.',
            isOptimal: false,
          },
        ],
      },
      {
        sol: 3,
        timeString: 'Sol 03 · 21:00 LST (Cryogenic Freeze)',
        title: 'Martian Nightfall Cryogenic Thermal Survival',
        incidentReport:
          'Sun has dropped below the crater rim. Temperatures are plunging toward -88°C. Cold-welding and lithium-ion electrolyte crystallization will trigger permanent battery failure if thermal loops lose circulation.',
        environmentalNotice: 'Ambient Temperature: -88.4°C · Thermal Radiator Loss: -65 W/m² · No Solar Power',
        choices: [
          {
            id: 'thermal-loop-recirc',
            title: 'Recirculate MMRTG Excess Heat Loop & Warm Electronics Box',
            description: 'Pump heated Freon-11 through rover internal chassis and habitat battery banks.',
            scientificTradeOff: 'Requires 45W continuous pumping; maintains critical core above -20°C safety margin.',
            resourceDelta: { oxygen: -4, power: -14, thermal: +20, integrity: +5 },
            consequenceText: 'Freon thermal loops maintained internal avionics at comfortable +12°C throughout the deep cryogenic freeze.',
            isOptimal: true,
          },
          {
            id: 'deep-sleep-shutoff',
            title: 'Emergency Deep-Sleep Power Shutdown',
            description: 'Cut all avionics heating and let core temperature drop to -45°C to preserve electricity.',
            scientificTradeOff: 'Zero electrical draw; risks thermal shock fracturing sensitive spectrometer optical mirrors.',
            resourceDelta: { power: +10, thermal: -30, integrity: -20, science: -15 },
            consequenceText: 'Core survived, but cryogenic contraction knocked the laser spectrometer out of calibration.',
            isOptimal: false,
          },
        ],
      },
    ],
  },

  // ─── MISSION 2: MSL CURIOSITY — GALE CRATER REMS DUST STORM SURVIVAL ───
  {
    id: 'mars-survive-02',
    title: 'Mission 2: Gale Crater — REMS Extreme Dust Storm',
    subtitle: 'Curiosity Rover Environmental Monitoring Station (REMS)',
    destinationName: 'Mars · Gale Crater & Mount Sharp (Aeolis Mons)',
    landingSite: 'Bradbury Landing',
    coordinates: '4.59°S, 137.44°E',
    elevationMeters: -4450,
    surfaceTempC: '-75°C to +5°C',
    atmosphericPressurePa: 840,
    windSpeedMs: 28.5,
    uvIndex: 11.2,
    dustOpacityTau: 4.2, // Extreme opacity during global dust storm
    nasaDatasetUrl: 'https://science.nasa.gov/mission/msl-curiosity/science-instruments/#h-rover-environmental-monitoring-station-rems',
    nasaDataSourceLabel: 'NASA Curiosity REMS Environmental Archive & PDS Atmospheres Node',
    missionBadge: '🌪️',
    briefingAudioScript:
      'Warning: REMS sensors indicate a planet-wide dust storm is engulfing Gale Crater. Atmospheric optical depth tau has surged past 4.0. Solar arrays are losing 95% of sunlight. Prepare dust mitigation protocols immediately.',
    scientificContext:
      'Curiosity REMS measures barometric pressure, air/ground temperature, wind velocity, humidity, and UV flux. When optical depth tau exceeds 3.5, electrostatic charging of microscopic iron-oxide dust threatens airlock seals, radiators, and electronics.',
    initialResources: {
      oxygen: 70,
      power: 60,
      thermal: 70,
      integrity: 90,
      science: 150,
    },
    events: [
      {
        sol: 1,
        timeString: 'Sol 142 · 08:30 LST',
        title: 'REMS Pressure Drop & Dust Squall Detection',
        incidentReport:
          'REMS boom anemometer registers sudden 30 m/s gusts. Barometric sensor detects a rapid 45 Pa drop indicating an approaching mesoscale dust squall column.',
        environmentalNotice: 'Optical Depth (tau): 3.85 · Solar Flux Drop: -88% · Ambient Temp: -42°C',
        choices: [
          {
            id: 'rems-lockdown',
            title: 'Stow Sensor Masts & Engage Electrostatic Dust Purge',
            description: 'Turn camera turrets away from prevailing winds and activate positive electrostatic repulsive bias on solar/sensor optics.',
            scientificTradeOff: 'Prevents abrasive glass pitting and sensor clogging; draws 35W auxiliary battery power.',
            resourceDelta: { power: -15, integrity: +15, science: +35 },
            consequenceText: 'Dust purge repelled 94% of abrasive airborne grains. Navcams and REMS sensors remained unblemished.',
            isOptimal: true,
          },
          {
            id: 'keep-operating',
            title: 'Maintain Full Science Sampling During Storm Peak',
            description: 'Keep robotic arm drill and cameras exposed to photograph dynamic dust devil tracks.',
            scientificTradeOff: 'Gathers rare meteorological science data; risks severe abrasion and mechanical arm jam.',
            resourceDelta: { power: -10, integrity: -25, science: +60 },
            consequenceText: 'Spectacular meteorological wind data captured, but fine silicate dust jammed the arm elbow azimuth gear.',
            isOptimal: false,
          },
        ],
      },
      {
        sol: 2,
        timeString: 'Sol 143 · 15:00 LST',
        title: 'Global Solar Blackout & Auxiliary Power Switching',
        incidentReport:
          'Dust canopy has blocked 98% of direct sunlight. Solar generation has collapsed to near zero. Habitat life support and oxygen scrubbers demand immediate power stabilization.',
        environmentalNotice: 'Optical Depth (tau): 4.40 · Day turned pitch black · Surface Wind: 26 m/s',
        choices: [
          {
            id: 'switch-kilopower',
            title: 'Switch to Kilopower Nuclear Sterling Fission Backup',
            description: 'Engage 10 kW continuous surface reactor to power closed-loop ECLSS and resistive heating grids.',
            scientificTradeOff: 'Ensures 100% life-support uptime completely immune to dust storm blackout.',
            resourceDelta: { oxygen: +15, power: +30, thermal: +15, integrity: +5 },
            consequenceText: 'Kilopower fission reactor took over the load seamlessly! Outpost humming with stable 10 kW electrical power.',
            isOptimal: true,
          },
          {
            id: 'drain-battery-bank',
            title: 'Rely on Reserve Lithium-Ion Battery Bank',
            description: 'Avoid nuclear reactor startup and drain secondary storage batteries down to 15% reserve.',
            scientificTradeOff: 'Saves reactor fuel; severe risk of brownout if dust storm persists longer than 36 hours.',
            resourceDelta: { power: -35, oxygen: -10, thermal: -15 },
            consequenceText: 'Battery storage dropped into the red zone (12%). Non-essential heating was severed to maintain O2 flow.',
            isOptimal: false,
          },
        ],
      },
    ],
  },

  // ─── MISSION 3: MARS TREK — VALLES MARINERIS WATER ICE PROSPECTING ───
  {
    id: 'mars-survive-03',
    title: 'Mission 3: Valles Marineris — Deep Canyon Ice Prospecting',
    subtitle: 'Mars Trek GIS Coordinates & High-Resolution Elevation Data',
    destinationName: 'Mars · Coprates Chasma, Valles Marineris',
    landingSite: 'Coprates Chasma Floor',
    coordinates: '14.6°S, 59.2°W',
    elevationMeters: -6800, // 6.8 km below datum!
    surfaceTempC: '-65°C to +15°C',
    atmosphericPressurePa: 1150, // Higher pressure in deep canyon!
    windSpeedMs: 12.0,
    uvIndex: 7.2,
    dustOpacityTau: 0.7,
    nasaDatasetUrl: 'https://trek.nasa.gov/mars/',
    nasaDataSourceLabel: 'NASA Mars Trek GIS & MOLA Topographic Elevation Database',
    missionBadge: '🏔️',
    briefingAudioScript:
      'Cadet, you are descending into Valles Marineris—a canyon 4 times deeper than the Grand Canyon. At 6.8 kilometers below datum, atmospheric pressure reaches 1,150 Pascals. Use the thermal drill to prospect subsurface water ice.',
    scientificContext:
      'Because Coprates Chasma lies deep beneath the Martian topographic datum, atmospheric pressure is nearly double the average surface value (1,150 Pa vs 610 Pa). This allows sub-surface permafrost ice to remain stable without immediate sublimation.',
    initialResources: {
      oxygen: 75,
      power: 70,
      thermal: 65,
      integrity: 85,
      science: 180,
    },
    events: [
      {
        sol: 1,
        timeString: 'Sol 210 · 11:00 LST',
        title: '30-Degree Basalt Escarpment Navigation',
        incidentReport:
          'Mars Trek elevation scans show a steep 30° descent down a scree slope to reach the ice-bearing alluvial fan on the canyon floor. Rover center of mass must be dynamically adjusted.',
        environmentalNotice: 'Canyon Depth: 6.8 km · Slope Incline: 30° · Regolith Shear Strength: 14 kPa',
        choices: [
          {
            id: 'gyro-stabilize',
            title: 'Lock Active Gyro-Stabilizer & Crawl in Low Gear',
            description: 'Limit descent speed to 0.05 m/s while dynamic mass ballast compensates for slope angle.',
            scientificTradeOff: 'Slow descent consumes extra drive motor power; prevents fatal rollover.',
            resourceDelta: { power: -16, integrity: +10, science: +30 },
            consequenceText: 'Rover executed a textbook controlled crawl down the canyon wall with zero wheel slippage.',
            isOptimal: true,
          },
          {
            id: 'fast-coast',
            title: 'Neutral Coasting Down the Talus Gradient',
            description: 'Allow wheels to roll freely down the slope to conserve drive motor battery power.',
            scientificTradeOff: 'Zero motor power spent; extreme hazard of tumbling over 20-meter drop-off.',
            resourceDelta: { power: +5, integrity: -35, science: -20 },
            consequenceText: 'Rover picked up excessive downhill momentum! Skid sideways against a basalt outcropping, bending left rear tie-rod.',
            isOptimal: false,
          },
        ],
      },
      {
        sol: 2,
        timeString: 'Sol 211 · 13:45 LST',
        title: 'Cryogenic Permafrost Core Drilling & Ice Extraction',
        incidentReport:
          'Subsurface radar detects high dielectric permittivity indicating 85% pure water ice buried 1.2 meters below the dusty regolith overburden.',
        environmentalNotice: 'Ice Table Depth: 1.2 m · Temperature at Core: -58°C · Pressure: 1,152 Pa',
        choices: [
          {
            id: 'heated-core-drill',
            title: 'Rotary-Percussive Drill with Vacuum Thermal Distillation',
            description: 'Drill 1.5m core, heat sample chamber to +4°C, and capture evaporated water vapor into condensers.',
            scientificTradeOff: 'Demands 220W of thermal heating; extracts 12 Liters of pure potable H2O.',
            resourceDelta: { oxygen: +20, power: -18, thermal: +5, science: +80 },
            consequenceText: 'SUCCESS! Harvested 12.4 Liters of pristine Martian water ice. Closed-loop life support water reserves refilled!',
            isOptimal: true,
          },
          {
            id: 'shallow-scrape',
            title: 'Shallow Surface Regolith Scraping with Scoop',
            description: 'Scrape upper 5 cm of dry regolith to look for hydrated sulfate salts without deep drilling.',
            scientificTradeOff: 'Low power draw; only extracts trace moisture (<0.5 L) contaminated with toxic perchlorates.',
            resourceDelta: { power: -4, oxygen: +2, integrity: -10, science: +25 },
            consequenceText: 'Scoop gathered mostly dry dust. Perchlorate contamination required extensive chemical filter scrubbing.',
            isOptimal: false,
          },
        ],
      },
    ],
  },

  // ─── MISSION 4: NASA EYES & INSIGHT — ELYSIUM PLANITIA SEISMIC & SOLAR STORM ───
  {
    id: 'mars-survive-04',
    title: 'Mission 4: Elysium — Marsquake & Solar Radiation Storm',
    subtitle: 'NASA Eyes Interplanetary Tracking & InSight SEIS Telemetry',
    destinationName: 'Mars · Elysium Planitia Volcanic Plains',
    landingSite: 'InSight Touchdown Plains',
    coordinates: '4.5°N, 135.6°E',
    elevationMeters: -2610,
    surfaceTempC: '-95°C to +10°C',
    atmosphericPressurePa: 720,
    windSpeedMs: 6.8,
    uvIndex: 12.8,
    dustOpacityTau: 0.5,
    nasaDatasetUrl: 'https://science.nasa.gov/eyes/',
    nasaDataSourceLabel: 'NASA Eyes on the Solar System & InSight Seismic Experiment Archive',
    missionBadge: '🛰️',
    briefingAudioScript:
      'Urgent: NASA Eyes deep space tracking detects a powerful Coronal Mass Ejection heading directly for Mars. Simultaneously, InSight SEIS registers Magnitude 4.7 Marsquake shockwaves emanating from Cerberus Fossae. Execute emergency base survival!',
    scientificContext:
      'Mars lacks a protective global dipolar magnetic field. When high-energy solar particle events (SPE) strike, surface ionizing radiation exceeds 250 mGy/day. When combined with tectonic Marsquakes from the Cerberus Fossae fracture system, structural habitats face dual catastrophic loads.',
    initialResources: {
      oxygen: 80,
      power: 75,
      thermal: 70,
      integrity: 85,
      science: 200,
    },
    events: [
      {
        sol: 1,
        timeString: 'Sol 84 · 06:12 LST',
        title: 'Magnitude 4.7 Cerberus Fossae Marsquake',
        incidentReport:
          'InSight SEIS detects P-waves followed by intense S-wave ground shaking lasting over 18 minutes. Structural vibration alarm sounds as airlock seal clamps begin to groan under shear stress.',
        environmentalNotice: 'Seismic Peak Ground Acceleration: 0.18g · Duration: 18.4 min · Marsquake Mag: 4.7',
        choices: [
          {
            id: 'flexible-damping',
            title: 'Engage Hydraulic Base Decouplers & Pressurize Bladder Berms',
            description: 'Decouple rigid habitat mounts and allow pneumatic sub-frame to absorb 85% of ground resonance.',
            scientificTradeOff: 'Uses 20% power bus; preserves airtight welds and seals from catastrophic rupture.',
            resourceDelta: { power: -15, integrity: +10, oxygen: -2, science: +45 },
            consequenceText: 'Hydraulic decouplers dampened the 18-minute tremor. Habitat seals remained 100% airtight with zero decompression.',
            isOptimal: true,
          },
          {
            id: 'brace-rigid',
            title: 'Rigid Mechanical Locking Pins Engage',
            description: 'Clamp all titanium foundation pins rigidly into bedrock to prevent horizontal shifting.',
            scientificTradeOff: 'Zero electrical consumption; transfers full shear energy into habitat composite walls.',
            resourceDelta: { integrity: -30, oxygen: -15, science: +20 },
            consequenceText: 'Severe stress concentration cracked secondary airlock weld. Oxygen vented until automated pressure bulkhead slammed shut.',
            isOptimal: false,
          },
        ],
      },
      {
        sol: 2,
        timeString: 'Sol 85 · 14:00 LST',
        title: 'Coronal Mass Ejection (CME) Solar Radiation Storm',
        incidentReport:
          'NASA Eyes telemetry confirms the interplanetary shockfront has reached Mars orbit. RAD radiation dosimeter indicates proton flux spiking past 350 mGy/day. Solar particle radiation storm is active.',
        environmentalNotice: 'Proton Energy: >100 MeV · Ionizing Radiation: 350 mGy/day · SPE Storm Warning: CRITICAL',
        choices: [
          {
            id: 'regolith-storm-shelter',
            title: 'Retreat to 2-Meter Compacted Regolith Radiation Vault',
            description: 'Move all crew and sensitive biological cultures into the subterranean sintered regolith vault.',
            scientificTradeOff: 'Regolith attenuates ionizing GCR/SPE dose by 98%; temporary operational slowdown.',
            resourceDelta: { integrity: +10, oxygen: -5, power: -10, science: +75 },
            consequenceText: 'Two meters of compacted basaltic regolith blocked 98.4% of the radiation storm. Crew absorbed near-zero dose!',
            isOptimal: true,
          },
          {
            id: 'surface-active-shield',
            title: 'Run Surface Electromagnetic Deflection Coil at Max Overdrive',
            description: 'Maintain surface crew activities while powering a high-current magnetic shielding coil.',
            scientificTradeOff: 'Consumes massive battery power; high-energy neutral particles still penetrate.',
            resourceDelta: { power: -40, integrity: -10, science: +50 },
            consequenceText: 'Electromagnetic coil deflected charged electrons, but uncharged high-energy neutrons penetrated habitat walls.',
            isOptimal: false,
          },
        ],
      },
    ],
  },
];

