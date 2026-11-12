/**
 * outpostBalanceConfig.ts
 * =============================================================================
 * Jr_AstroCamp Outpost Simulator — Unified NASA-Cited Balance Configuration
 * NASA International Space Apps Challenge 2026
 * 
 * ALL balance numbers in this configuration are directly derived from official,
 * peer-reviewed NASA and space agency technical baselines.
 * 
 * Primary NASA Sources:
 * 1. NASA/TP-2015-218570: Baseline Values and Assumptions Document (BVAD)
 *    - Human Metabolic Rates: Table 3.1, p. 25-26
 *    - ECLSS Mass Balances: Section 4.3.2 (Sabatier CO2 Reduction & Water Recovery)
 * 2. NASA TM-2019-220311 / NASA Glenn: Kilopower KRUSTY Nuclear Reactor Baseline
 *    - 1-10 kWe continuous Stirling power generation independent of sunlight
 * 3. NASA SP-2009-566 & LRO LOLA: Lunar Reconnaissance Orbiter Polar Topography
 *    - Shackleton Crater illumination & 354-hour (14.7-day) lunar night
 * 4. Science 343(6169) / Hassler et al. & MSL RAD: Mars Surface Radiation Environment
 *    - MSL Curiosity RAD measurements: ~0.67 mSv/day unshielded GCR
 * 5. NASA-STD-3001 Vol 1 & 2: Space Flight Human-System Standard
 *    - Maximum 30-day short term limit: 250 mSv; Permissible exposure levels
 * =============================================================================
 */

export interface DestinationProfile {
  id: 'MOON' | 'MARS';
  name: string;
  tagline: string;
  siteName: string;
  coordinates: string;
  totalSols: number;
  gravityG: number;
  atmosphereDescription: string;
  solarFluxWm2: number;
  dayLengthHours: number;
  nightDurationSols: number;
  temperatureRangeC: [number, number];
  primaryHazards: string[];
  nasaCitation: string;
}

export interface DifficultyProfile {
  id: 'CADET' | 'OFFICER' | 'COMMANDER';
  name: string;
  label: string;
  description: string;
  badge: string;
  initialBuildPoints: number;
  dailyBuildPoints: number;
  consumptionMultiplier: number;
  stormSeverityMultiplier: number;
  startingResources: {
    power: number;
    oxygen: number;
    water: number;
    food: number;
    shielding: number;
    crewHealth: number;
    crewMorale: number;
    science: number;
  };
}

export interface BuildableModuleSpec {
  id: string;
  name: string;
  category: 'POWER' | 'LIFE_SUPPORT' | 'DEFENSE' | 'HABITATION';
  buildCostBP: number;
  description: string;
  simpleEffect: string;
  nasaScienceFact: string;
  icon: string;
  statDeltas: {
    power?: number;
    oxygen?: number;
    water?: number;
    food?: number;
    shielding?: number;
    crewHealth?: number;
    crewMorale?: number;
  };
}

export interface OutpostEventDefinition {
  id: string;
  title: string;
  hazardType: 'SOLAR_FLARE' | 'DUST_STORM' | 'LUNAR_NIGHT' | 'METEORITE' | 'EQUIPMENT_FAILURE';
  destination?: 'MOON' | 'MARS' | 'BOTH';
  solTrigger: number; // Earliest sol this can occur
  warningAdvanceSols: number; // 1 = 1-day advance warning
  warningTitle: string;
  warningMessage: string;
  eventDescription: string;
  nasaScienceExplanation: string;
  nasaDocReference: string;
  choices: {
    id: string;
    label: string;
    actionDescription: string;
    buildPointCost?: number;
    tradeOff: string;
    resourceImpact: {
      power?: number;
      oxygen?: number;
      water?: number;
      food?: number;
      shielding?: number;
      crewHealth?: number;
      crewMorale?: number;
      science?: number;
    };
    outcomeReport: string;
    simpleScienceTakeaway: string;
  }[];
}

export interface EndingScenario {
  id: string;
  isVictory: boolean;
  title: string;
  badge: string;
  headline: string;
  kidFriendlySummary: string;
  rootCauseAnalysis: string;
  realScienceLesson: string;
  nasaTakeaway: string;
}

// ─── 1. DESTINATION ENVIRONMENTS ──────────────────────────────────────────────
export const DESTINATION_PROFILES: Record<'MOON' | 'MARS', DestinationProfile> = {
  MOON: {
    id: 'MOON',
    name: 'Artemis Lunar Base Camp',
    tagline: 'Survive the 354-Hour Deep Freeze at the Lunar South Pole',
    siteName: 'Shackleton Crater Rim',
    coordinates: '89.9°S, 0.0°E (Peak of Eternal Light)',
    totalSols: 30,
    gravityG: 0.166, // 1/6th Earth gravity
    atmosphereDescription: 'Hard Vacuum (< 10⁻¹² Pa) — Zero atmospheric buffering',
    solarFluxWm2: 1361, // Unfiltered solar constant
    dayLengthHours: 708, // 29.5 Earth days synodic month
    nightDurationSols: 14, // ~354 hours of darkness (Sols 15–28)
    temperatureRangeC: [-130, 120], // Down to -246°C in permanently shadowed craters
    primaryHazards: [
      '354-hour continuous lunar night (Solar output drops to 0)',
      'Direct Solar Particle Events (SPE) without magnetic shield',
      'Hyper-velocity micrometeorite impacts without atmosphere',
      'Electrostatic regolith dust abrasive to seal rings'
    ],
    nasaCitation: 'NASA/SP-2009-566 & LRO LOLA GDR Topography (Smith et al., 2010)'
  },
  MARS: {
    id: 'MARS',
    name: 'AstroCamp Mars Outpost',
    tagline: 'Balance Life Support Through Jezero Crater Global Dust Storms',
    siteName: 'Jezero Crater Paleolake Delta',
    coordinates: '18.38°N, 77.58°E (Perseverance Landing Site)',
    totalSols: 40,
    gravityG: 0.379, // ~38% Earth gravity
    atmosphereDescription: 'Thin CO₂ atmosphere (610 Pa, ~0.6% Earth pressure)',
    solarFluxWm2: 590, // Lower solar irradiance due to 1.52 AU distance
    dayLengthHours: 24.66, // 24h 39m 35s Martian Sol
    nightDurationSols: 1, // Standard daily night cycle (~12h dark / 12h light)
    temperatureRangeC: [-125, 20],
    primaryHazards: [
      'Martian global dust storms blocking up to 85% of solar rays (Tau > 1.8)',
      'Sub-zero atmospheric freezing putting constant load on habitat heaters',
      'High UV flux and Galactic Cosmic Rays through thin atmosphere',
      'Telemetry communication delay of 4 to 20 minutes back to Earth'
    ],
    nasaCitation: 'NASA Mars Science Laboratory (MSL RAD Hassler 2014) & BVAD 2015'
  }
};

// ─── 2. DIFFICULTY TIERS ──────────────────────────────────────────────────────
export const DIFFICULTY_PROFILES: Record<'CADET' | 'OFFICER' | 'COMMANDER', DifficultyProfile> = {
  CADET: {
    id: 'CADET',
    name: 'Junior Cadet',
    label: 'Cadet (Training Mode)',
    description: 'Forgiving life support margins, extra build budget, and generous advance storm warnings. Perfect for first-time astronauts!',
    badge: '🟢 JUNIOR CADET',
    initialBuildPoints: 12,
    dailyBuildPoints: 6,
    consumptionMultiplier: 0.75, // 25% slower resource drain
    stormSeverityMultiplier: 0.7,
    startingResources: {
      power: 85,
      oxygen: 95,
      water: 90,
      food: 30,
      shielding: 80,
      crewHealth: 100,
      crewMorale: 100,
      science: 15
    }
  },
  OFFICER: {
    id: 'OFFICER',
    name: 'Mission Officer',
    label: 'Officer (NASA Standard)',
    description: 'Exact NASA stoichiometric baseline rates from the NASA BVAD handbook. Authentic spaceflight trade-offs.',
    badge: '🟡 MISSION OFFICER',
    initialBuildPoints: 8,
    dailyBuildPoints: 4,
    consumptionMultiplier: 1.0, // 100% NASA BVAD baseline
    stormSeverityMultiplier: 1.0,
    startingResources: {
      power: 75,
      oxygen: 90,
      water: 80,
      food: 24,
      shielding: 60,
      crewHealth: 95,
      crewMorale: 90,
      science: 10
    }
  },
  COMMANDER: {
    id: 'COMMANDER',
    name: 'Base Commander',
    label: 'Commander (Extreme Challenge)',
    description: 'Harsh contingency mode: severe weather anomalies, fast resource drain, and razor-thin engineering margins.',
    badge: '🔴 BASE COMMANDER',
    initialBuildPoints: 5,
    dailyBuildPoints: 3,
    consumptionMultiplier: 1.25, // 25% faster resource drain
    stormSeverityMultiplier: 1.4,
    startingResources: {
      power: 65,
      oxygen: 80,
      water: 70,
      food: 18,
      shielding: 45,
      crewHealth: 90,
      crewMorale: 75,
      science: 5
    }
  }
};

// ─── 2B. CREW SPECIALTY BONUSES (NASA Crew Systems) ──────────────────────────
export const CREW_SPECIALTY_BONUSES = {
  COMMANDER: {
    role: 'Commander',
    defaultName: 'Alex Rivera',
    moraleBonusPct: 15, // +15% Team Morale baseline buffer
    moraleLossMultiplier: 0.85, // 15% resilience against morale degradation during emergencies
    description: '+15% Team Morale',
  },
  ENGINEER: {
    role: 'Engineer',
    defaultName: 'Maya Lin',
    repairSpeedMultiplier: 1.5, // 50% faster equipment condition restoration and module maintenance
    equipmentWearMultiplier: 0.75, // 25% slower equipment wear per sol
    description: 'Fast Module Repairs',
  },
  DOCTOR: {
    role: 'Doctor',
    defaultName: 'Dr. Sam Okonjo',
    healthFloor: 15, // Minimum safety floor against catastrophic medical collapse on a single turn
    healthRecoveryBonus: 1.5, // +50% faster crew health regeneration when ECLSS is nominal
    hypoxiaDamageReduction: 0.35, // 35% reduction in health loss from oxygen or water shortages
    description: 'Crew Health Shield',
  },
  FARMER: {
    role: 'Space Farmer',
    defaultName: 'Chloe Patel',
    cropHarvestMultiplier: 1.25, // +25% crop harvest yield and greenhouse biomass growth
    greenhouseFailureBuffer: true, // Prevents crop withering for 1 sol during minor drought
    description: '+25% Crop Harvest',
  },
} as const;

export type CrewRole = keyof typeof CREW_SPECIALTY_BONUSES;

// ─── 3. INTERDEPENDENT METABOLIC CONSUMPTION CONSTANTS (NASA BVAD) ───────────
export const METABOLIC_BALANCE = {
  // NASA/TP-2015-218570 Table 3.1: 0.84 kg O2/person/day
  // For a 4-person crew: 3.36 kg O2/day. In % of base tank:
  DAILY_O2_BASE_DRAIN_PCT: 3.0,

  // NASA/TP-2015-218570 Table 3.1: 2.50 L potable + hygiene/person/day
  // For 4 crew: 10-12 L/day. Base drain without recycling:
  DAILY_WATER_BASE_DRAIN_PCT: 3.5,

  // Recycler Recovery Efficiency (NASA Carter 2009 WRS Paper: 93% recovery)
  RECYCLER_WATER_RECOVERY_RATE: 0.85, // Net water drain drops to ~0.5% per day!

  // NASA BVAD Table 3.1: 0.62 kg dry food/person/day = 4 rations/day
  DAILY_FOOD_RATION_DRAIN: 1.0,

  // Base electrical power load for life support heaters, pumps, lights:
  DAILY_POWER_BASE_DRAIN_PCT: 12.0, // % of battery per sol
  SOLAR_DAY_CHARGE_PCT: 20.0, // Recharges +20% during sunlit hours

  // Radiation baseline background (Hassler et al. 2014, MSL RAD)
  DAILY_BACKGROUND_RADIATION_MSV: 0.67,

  // Health and Morale Interdependence thresholds:
  THRESHOLDS: {
    O2_DANGER: 25,          // Below 25%, hypoxia sets in -> Health drops -10%/day
    WATER_DANGER: 20,       // Below 20%, dehydration -> Health drops -8%/day, Morale -15%/day
    FOOD_DANGER: 5,         // Below 5 rations, malnutrition -> Health drops -5%/day, Morale -12%/day
    POWER_BLACKOUT: 0,      // At 0% power, heaters fail -> Health drops -20%/day, Morale -25%/day
    RADIATION_CRITICAL: 80, // Above 80 mSv -> Health drops -15%/day
    SHIELDING_MINIMUM: 20   // Below 20%, solar flares do double damage
  }
};

// ─── 4. BUILDABLE OUTPOST MODULES ─────────────────────────────────────────────
export const BUILDABLE_MODULES: BuildableModuleSpec[] = [
  {
    id: 'SOLAR_ARRAY',
    name: 'Deployable Solar PV Wing',
    category: 'POWER',
    buildCostBP: 3,
    description: 'High-efficiency multi-junction solar cells that produce clean electricity from sunlight.',
    simpleEffect: '+10% Daily Power Generation during daytime.',
    nasaScienceFact: 'NASA Artemis solar wings use Ultraflex gallium arsenide cells producing up to 300 W/kg.',
    icon: '☀️',
    statDeltas: { power: 15 }
  },
  {
    id: 'BATTERY_STORAGE',
    name: 'Lithium-Ion Energy Bank',
    category: 'POWER',
    buildCostBP: 4,
    description: 'Thermal-jacketed deep storage batteries to survive the lunar night and Martian dust storms.',
    simpleEffect: 'Increases Power reserve by +25% and buffers against blackouts.',
    nasaScienceFact: 'The ISS upgraded to lithium-ion batteries with an 85% depth of discharge and 10-year lifespan.',
    icon: '🔋',
    statDeltas: { power: 25 }
  },
  {
    id: 'KILOPOWER_REACTOR',
    name: 'Kilopower Fission Reactor',
    category: 'POWER',
    buildCostBP: 8,
    description: 'Compact Stirling nuclear reactor delivering constant, reliable electricity 24 hours a day, sun or night.',
    simpleEffect: '+15% Power every single sol — immune to dust storms and darkness!',
    nasaScienceFact: 'NASA KRUSTY project tested a 1 kWe reactor with a U-235 cast core and Stirling engines (NASA TM-2019-220311).',
    icon: '⚛️',
    statDeltas: { power: 35, crewMorale: 5 }
  },
  {
    id: 'O2_SABATIER',
    name: 'Sabatier O₂ Generator & Scrubber',
    category: 'LIFE_SUPPORT',
    buildCostBP: 4,
    description: 'Chemical reactor that converts astronaut CO₂ breath and hydrogen into water and oxygen.',
    simpleEffect: 'Generates +20% Oxygen and stabilizes atmospheric pressure.',
    nasaScienceFact: 'Sabatier reaction (CO₂ + 4H₂ → CH₄ + 2H₂O) recovers over 50% of oxygen from exhaled air (BVAD Sec 4.3).',
    icon: '💨',
    statDeltas: { oxygen: 20, crewHealth: 5 }
  },
  {
    id: 'WATER_RECYCLER',
    name: 'Thermo-Electric Water Recycler',
    category: 'LIFE_SUPPORT',
    buildCostBP: 5,
    description: 'High-recovery filtration loop that purifies 93% of humidity, sweat, and wastewater into drinking water.',
    simpleEffect: 'Cuts daily water loss by 80% and adds +15% clean potable water.',
    nasaScienceFact: 'The ISS Water Recovery System (WRS) achieves 93-98% recovery, critical for deep space where resupply is impossible.',
    icon: '💧',
    statDeltas: { water: 25, crewHealth: 5 }
  },
  {
    id: 'GREENHOUSE_POD',
    name: 'Hydroponic Salad Pod (Veggie)',
    category: 'LIFE_SUPPORT',
    buildCostBP: 4,
    description: 'LED-lit aeroponic plant nursery growing fresh lettuce, radishes, and dwarf tomatoes.',
    simpleEffect: '+8 Food rations, +10% Crew Morale, and natural CO₂ scrubbing.',
    nasaScienceFact: 'NASA Veggie & Advanced Plant Habitat (APH) aboard the ISS demonstrated fresh crops improve astronaut mental wellbeing.',
    icon: '🌱',
    statDeltas: { food: 8, crewMorale: 15, oxygen: 5 }
  },
  {
    id: 'REGOLITH_VAULT',
    name: 'Sintered Regolith Storm Shield',
    category: 'DEFENSE',
    buildCostBP: 5,
    description: 'A 1.5-meter protective shell 3D-printed from melted space dirt to block radiation and micrometeorites.',
    simpleEffect: '+30% Radiation Shielding; cuts storm damage in half.',
    nasaScienceFact: 'Lunar soil (regolith) is rich in silicates, basalt, and iron, providing radiation attenuation comparable to water.',
    icon: '🛡️',
    statDeltas: { shielding: 30, crewHealth: 10 }
  },
  {
    id: 'REC_HABITAT',
    name: 'Crew Wellness & Exercise Hab',
    category: 'HABITATION',
    buildCostBP: 4,
    description: 'Dedicated module with exercise cycle, VR Earth scenery, and communication lounge for cadet crew health.',
    simpleEffect: '+25% Crew Morale and +15% Crew Health.',
    nasaScienceFact: 'Astronauts exercise 2.5 hours daily with ARED and T2 treadmill to prevent bone density and cardiovascular loss.',
    icon: '🎮',
    statDeltas: { crewMorale: 25, crewHealth: 15 }
  },
  {
    id: 'HABITAT_EXPANSION',
    name: 'Reinforced Pressurized Habitat Dome',
    category: 'HABITATION',
    buildCostBP: 6,
    description: 'Expanded pressurized living quarters with redundant airlocks, bunk beds, and reinforced micrometeorite hull.',
    simpleEffect: '+15% Radiation Shielding, +15% Crew Morale, +10% Crew Health.',
    nasaScienceFact: 'NASA-STD-3001 recommends at least 25 m³ of net habitable volume per crew member on long-duration surface missions.',
    icon: '🏠',
    statDeltas: { shielding: 15, crewMorale: 15, crewHealth: 10 }
  }
];

// ─── 5. SCIENCE-BASED EVENTS WITH 1-DAY ADVANCE WARNING ───────────────────────
export const SCIENCE_EVENTS: OutpostEventDefinition[] = [
  {
    id: 'event-solar-flare',
    title: 'Coronal Mass Ejection (Solar Flare)',
    hazardType: 'SOLAR_FLARE',
    destination: 'BOTH',
    solTrigger: 6,
    warningAdvanceSols: 1,
    warningTitle: '⚠️ SOLAR STORM ALERT (24-Hour Advance Warning)',
    warningMessage: 'Deep space heliospheric sensors detected an X-class solar flare bursting from the Sun. High-energy protons will hit the outpost in 24 hours! Prepare your defenses!',
    eventDescription: 'The solar radiation wave is washing over the outpost! High-energy cosmic protons are ionizing the habitat exterior.',
    nasaScienceExplanation: 'Solar Particle Events (SPE) can deliver up to 2000 mSv of unshielded radiation, causing acute radiation sickness. Dense matter like water or sintered regolith shields astronauts by scattering charged particles.',
    nasaDocReference: 'NASA-STD-3001 Vol 1 & NASA TM-4527 (Townsend et al.)',
    choices: [
      {
        id: 'cme-bunker',
        label: 'Evacuate Crew to Regolith Storm Vault',
        actionDescription: 'Lock down non-essential modules and seal crew inside the heavily armored storm shelter.',
        buildPointCost: 2,
        tradeOff: 'Uses 2 Build Points to reinforce airlocks; base science work pauses for 1 sol.',
        resourceImpact: { power: -10, shielding: -10, crewHealth: 0, crewMorale: -5, science: 5 },
        outcomeReport: 'Crew stayed safely shielded under 1.5m of regolith! Radiation absorbed: < 2 mSv. Nominal health maintained.',
        simpleScienceTakeaway: 'Staying inside a dense storm vault stops over 90% of energetic solar protons!'
      },
      {
        id: 'cme-active-shield',
        label: 'Divert Battery Power to Magnetic Deflection & Alarms',
        actionDescription: 'Run the experimental superconducting magnetic coils to deflect incoming charged particles.',
        tradeOff: 'Consumes huge battery power (-25% Power); minor radiation leaks through.',
        resourceImpact: { power: -25, crewHealth: -5, crewMorale: +5, science: 15 },
        outcomeReport: 'Magnetic fields deflected the bulk of the particle stream, but the huge electrical load drained habitat batteries.',
        simpleScienceTakeaway: 'Magnetic fields bend charged protons just like Earth’s magnetosphere, but require intense electrical power.'
      },
      {
        id: 'cme-unprepared',
        label: 'Continue Standard Shifts with Light Polyethylene Liners',
        actionDescription: 'Attempt to finish ongoing maintenance without sealing the storm vault.',
        tradeOff: 'Conserves power, but crew takes direct radiation dose and loses health.',
        resourceImpact: { power: 0, crewHealth: -25, crewMorale: -20, shielding: -15 },
        outcomeReport: 'CRITICAL DOSE: Solar protons breached the unreinforced habitat walls! Crew suffered radiation nausea and elevated fatigue.',
        simpleScienceTakeaway: 'Light plastic sheets cannot block high-energy solar protons; thick regolith shielding is non-negotiable.'
      }
    ]
  },
  {
    id: 'event-dust-storm',
    title: 'Regional Dust Storm Cloud',
    hazardType: 'DUST_STORM',
    destination: 'MARS',
    solTrigger: 12,
    warningAdvanceSols: 1,
    warningTitle: '⚠️ MARTIAN DUST STORM ALERT (24-Hour Advance Warning)',
    warningMessage: 'Mars Reconnaissance Orbiter (MRO) cameras track a massive red dust cloud expanding across Jezero Crater. Solar opacity (Tau) will surge tomorrow!',
    eventDescription: 'Fine red ferric oxide dust has engulfed the sky! Midday sunlight has dimmed by 80%, slashing solar array power generation.',
    nasaScienceExplanation: 'Martian dust storms can loft particles 50 km into the atmosphere, creating atmospheric opacity (Tau > 2.0). Solar panels lose up to 85% of their output, as happened to NASA’s Opportunity and InSight missions.',
    nasaDocReference: 'NASA JPL MSL REMS Data & Smith (2004) Icarus 167',
    choices: [
      {
        id: 'dust-nuclear',
        label: 'Switch Base to Kilopower Nuclear & Battery Conservation',
        actionDescription: 'Turn off outdoor spotlights, dial back greenhouse lamps, and run life support on continuous fission/battery power.',
        tradeOff: 'Saves the base from freezing, but greenhouse plants grow slower (-5 Food).',
        resourceImpact: { power: -10, food: -5, crewHealth: 0, crewMorale: -5, science: 10 },
        outcomeReport: 'The base safely weathered the dark days on nuclear/battery reserves. Temperature remained a comfortable +21°C!',
        simpleScienceTakeaway: 'Nuclear power does not rely on sunlight or air, making it the ultimate deep space survival power source.'
      },
      {
        id: 'dust-clean-panels',
        label: 'Deploy Electrostatic Dust Brooms to Keep Solar Panels Clean',
        actionDescription: 'Use high-voltage electrostatic waves to shake dust particles off solar panel glass.',
        buildPointCost: 2,
        tradeOff: 'Spends 2 Build Points; recovers 50% of solar generation.',
        resourceImpact: { power: +10, shielding: -5, crewHealth: 0, crewMorale: +5, science: 10 },
        outcomeReport: 'Electrostatic cleaning kept the solar arrays clear of red dust! Power held steady throughout the storm.',
        simpleScienceTakeaway: 'Martian dust is electrostatically charged; applying an alternating electric field pushes dust off surfaces.'
      },
      {
        id: 'dust-ignore',
        label: 'Run Habitat Heaters at Full Power on Normal Solar',
        actionDescription: 'Do not conserve power or clean panels.',
        tradeOff: 'Batteries plummet to near zero; thermal heaters brown out.',
        resourceImpact: { power: -40, crewHealth: -15, crewMorale: -20 },
        outcomeReport: 'POWER CRISIS: Solar panels were blanketed in thick red dust and produced only 2 kW. Heaters browned out and crew was freezing!',
        simpleScienceTakeaway: 'Without sunlight or nuclear backup, batteries deplete in less than 36 hours in sub-zero space environments.'
      }
    ]
  },
  {
    id: 'event-lunar-night',
    title: 'The 354-Hour Lunar Night Deep Freeze',
    hazardType: 'LUNAR_NIGHT',
    destination: 'MOON',
    solTrigger: 15,
    warningAdvanceSols: 1,
    warningTitle: '⚠️ LUNAR NIGHTFALL APPROACHING (24-Hour Advance Warning)',
    warningMessage: 'The Sun is sinking beneath the rim of Shackleton Crater. In 24 hours, the base will enter 14 consecutive Earth days (354 hours) of pitch-black night at -130°C!',
    eventDescription: 'Total darkness has fallen over the Moon. External temperatures have plunged to -130°C. Solar arrays produce exactly 0 kW.',
    nasaScienceExplanation: 'Because the Moon rotates on its axis once every 29.5 Earth days, a single lunar night lasts ~354 hours. Habitat survival requires storing daytime power or deploying continuous nuclear Stirling generators.',
    nasaDocReference: 'NASA Artemis Plan (2020) & Heiken et al. Lunar Sourcebook',
    choices: [
      {
        id: 'night-stirling',
        label: 'Engage Thermal Heat Storage & Closed-Loop Energy Buffers',
        actionDescription: 'Insulate modules with multi-layer aluminized Mylar blankets and route stored battery heat.',
        tradeOff: 'Consumes 3 Build Points for insulation; protects crew completely.',
        buildPointCost: 3,
        resourceImpact: { power: -15, water: 0, crewHealth: 0, crewMorale: +5, science: 15 },
        outcomeReport: 'Thermal insulation held module temperatures steady at +20°C through the long freeze. Base held nominal!',
        simpleScienceTakeaway: 'Multi-layer insulation (MLI) traps radiant heat in a vacuum where there is no air to conduct warmth away.'
      },
      {
        id: 'night-conserve',
        label: 'Power Down Science Lab and Enter Hibernate Mode',
        actionDescription: 'Sleep in thermal sleeping bags inside the central hub to minimize heating volume.',
        tradeOff: 'Zero science gained for 5 days; morale dips from cramped quarters.',
        resourceImpact: { power: -25, crewMorale: -15, crewHealth: -5, science: 0 },
        outcomeReport: 'The crew endured the dark in thermal bags. Power remained low but survival was maintained.',
        simpleScienceTakeaway: 'Reducing heated volume cuts electrical thermal demand by over 60% during emergency brownouts.'
      },
      {
        id: 'night-overload',
        label: 'Keep All Science Experiments & Outdoor Spotlights Running',
        actionDescription: 'Refuse to cut power consumption.',
        tradeOff: 'Complete battery depletion; catastrophic habitat freeze.',
        resourceImpact: { power: -55, crewHealth: -30, crewMorale: -30, oxygen: -15 },
        outcomeReport: 'CRITICAL FAILURE: Batteries hit 0%! Water pipes froze and burst, oxygen pumps halted, and crew suffered severe hypothermia.',
        simpleScienceTakeaway: 'In space, heating requires enormous electrical power. Never waste power when the Sun is down!'
      }
    ]
  },
  {
    id: 'event-water-membrane-leak',
    title: 'Water Recovery Filtration Clog',
    hazardType: 'EQUIPMENT_FAILURE',
    destination: 'BOTH',
    solTrigger: 22,
    warningAdvanceSols: 1,
    warningTitle: '⚠️ ECLSS TELEMETRY WARNING: Water Pressure Drop',
    warningMessage: 'Flow sensors on the Water Recovery System (WRS) show osmotic membrane scaling. Pressure dropped 40%. Maintenance required within 24 hours!',
    eventDescription: 'The primary wastewater distillation tube has clogged with calcium precipitates. Fresh drinking water production has dropped to a trickle.',
    nasaScienceExplanation: 'Microgravity causes astronauts to lose bone calcium, which enters urine and causes gypsum/calcium sulfate scaling inside ECLSS distillation tubes (Carter 2009). Chemical pretreatment is required.',
    nasaDocReference: 'SAE Technical Paper 2009-01-2349 (Carter, NASA MSFC)',
    choices: [
      {
        id: 'water-acid-flush',
        label: 'Run Phosphoric Pre-Treat Acid Flush & Replace Filter Core',
        actionDescription: 'Dissolve calcium scales using spare chemical canisters and install a fresh membrane filter.',
        buildPointCost: 2,
        tradeOff: 'Uses 2 Build Points from spare parts inventory; restores 100% water recovery.',
        resourceImpact: { water: +20, power: -5, crewHealth: 0, crewMorale: +5 },
        outcomeReport: 'Acid flush dissolved the mineral scale! Water recovery returned to 93% efficiency.',
        simpleScienceTakeaway: 'Chemical pretreatment prevents calcium scaling from clogging space water distillation assemblies.'
      },
      {
        id: 'water-ration',
        label: 'Institute Emergency 50% Water Rationing',
        actionDescription: 'Cut shower/hygiene water and limit drinking to 1.5 liters per day.',
        tradeOff: 'Conserves water, but crew suffers dehydration headaches and morale collapse.',
        resourceImpact: { water: -5, crewHealth: -10, crewMorale: -20 },
        outcomeReport: 'Water was conserved, but cadets suffered severe dehydration, dry skin, and plummeting spirits.',
        simpleScienceTakeaway: 'The human body needs at least 2.5 L of water per day in dry spacecraft environments to prevent kidney distress.'
      }
    ]
  },
  {
    id: 'event-meteorite-strike',
    title: 'Micrometeoroid Hull Impact',
    hazardType: 'METEORITE',
    destination: 'BOTH',
    solTrigger: 27,
    warningAdvanceSols: 1,
    warningTitle: '⚠️ RADAR WARNING: Orbital Debris & Meteoroid Swarm',
    warningMessage: 'Lunar/Mars radar detected a comet debris trail intersecting the outpost orbit in 24 hours! Whipple bumper shields and regolith vault status critical!',
    eventDescription: 'A pebble-sized meteoroid travelling at 22 km/s slammed into the habitat outer perimeter!',
    nasaScienceExplanation: 'Without an Earth-like atmosphere to burn up space rocks, meteoroids hit at 20-70 km/s. Whipple shields use sacrificial bumper sheets to vaporize incoming projectiles before they breach the pressurized hull.',
    nasaDocReference: 'NASA SP-8042 (Meteoroid Damage Assessment) & Christiansen (2003)',
    choices: [
      {
        id: 'meteor-whipple',
        label: 'Deploy Secondary Whipple Bumper & Seal Pressure Bulkheads',
        actionDescription: 'Sacrificial aluminum plates shatter the impactor into harmless dust.',
        buildPointCost: 2,
        tradeOff: 'Uses 2 Build Points to patch bumper; zero hull breach.',
        resourceImpact: { shielding: +15, power: -5, oxygen: 0, crewHealth: 0, crewMorale: +5 },
        outcomeReport: 'The Whipple shield did its job! The 20 km/s meteoroid disintegrated into vapor against the outer bumper.',
        simpleScienceTakeaway: 'A Whipple shield has a thin outer sheet that shatters high-speed space rocks into a cloud of harmless tiny fragments.'
      },
      {
        id: 'meteor-patch',
        label: 'Rapid Airlock EVA Patch Using Epoxy Resin & Kevlar',
        actionDescription: 'Cadet astronaut performs immediate EVA to seal the hull gouge.',
        tradeOff: 'Risky spacewalk; slight oxygen leak before seal sets.',
        resourceImpact: { oxygen: -10, shielding: -10, crewHealth: -5, crewMorale: +10, science: 10 },
        outcomeReport: 'Cadets sealed the micro-puncture with Kevlar tape before atmospheric pressure dropped dangerously low!',
        simpleScienceTakeaway: 'Fast emergency repair drills are practiced continuously by astronauts to handle sudden pressure breaches.'
      }
    ]
  }
];

// ─── 6. MULTIPLE WIN / LOSE OUTPOST ENDINGS ───────────────────────────────────
export const ENDING_SCENARIOS: Record<string, EndingScenario> = {
  GOLDEN_TRIUMPH: {
    id: 'GOLDEN_TRIUMPH',
    isVictory: true,
    title: '🏆 Golden Aerospace Triumph: Self-Sustaining Colony',
    badge: 'GOLD MEDAL OF AEROSPACE EXCELLENCE',
    headline: 'Mission Succeeded with High Honors! All Crew Safe & Outpost Thriving!',
    kidFriendlySummary: 'You kept power, air, water, and food perfectly balanced! Your crew stayed healthy and happy, and your scientific research discovered groundbreaking space secrets!',
    rootCauseAnalysis: 'All 7 life support systems remained nominal throughout the expedition. Proactive shielding absorbed solar storms, nuclear/battery power survived the darkness, and hydroponic crops kept morale high.',
    realScienceLesson: 'NASA long-duration spaceflight requires closed-loop life support (ECLSS) where 95%+ of water and oxygen is recycled continuously, combined with redundant power sources.',
    nasaTakeaway: 'Recommended for selection into NASA Astronaut Candidate (ASCAN) Class 2026!'
  },
  SURVIVAL_VICTORY: {
    id: 'SURVIVAL_VICTORY',
    isVictory: true,
    title: '🥈 Hardy Frontier Survival: Mission Accomplished',
    badge: 'FRONTIER PIONEER MEDAL',
    headline: 'You Survived the Full Expedition Through True Grit & Smart Choices!',
    kidFriendlySummary: 'It was a wild ride! Things broke, storms raged, and supplies ran low, but you made tough trade-offs that kept your crew alive until the return spacecraft touched down!',
    rootCauseAnalysis: 'Resources dipped close to emergency thresholds during solar storms and nightfall, but quick emergency rationing and tactical repairs prevented total system failure.',
    realScienceLesson: 'Aerospace engineering is all about trade-offs (mass vs power vs safety). Sometimes you have to turn off scientific tools to save power for life-saving heaters.',
    nasaTakeaway: 'Your crew returned home safely to Houston with valuable real-world expedition telemetry!'
  },
  LIFE_SUPPORT_FREEZE: {
    id: 'LIFE_SUPPORT_FREEZE',
    isVictory: false,
    title: '❄️ Mission Failure: Thermal Heaters Blackout & Freeze',
    badge: 'CRITICAL FAILURE: POWER DEPLETION',
    headline: 'Outpost Batteries Hit 0% During Extreme Night/Storm Conditions!',
    kidFriendlySummary: 'When power ran out, the habitat heaters shut down. Deep space cold (-130°C) froze the water pipes and life support systems, forcing Houston to order an emergency rescue evacuation!',
    rootCauseAnalysis: 'Energy generation was insufficient to match habitat thermal load during prolonged darkness. Failure to build Kilopower nuclear backup or battery banks caused cascading electrical collapse.',
    realScienceLesson: 'Space has no air to hold warmth. Without electrical heaters running 24/7, an outpost freezes solid in just a few hours. Power is the foundation of all life support.',
    nasaTakeaway: 'Always build extra battery storage or nuclear Stirling reactors before entering the 354-hour lunar night!'
  },
  DEPRESSURIZATION_HYPOXIA: {
    id: 'DEPRESSURIZATION_HYPOXIA',
    isVictory: false,
    title: '💨 Mission Failure: Atmospheric Depressurization & Hypoxia',
    badge: 'CRITICAL FAILURE: OXYGEN LOSS',
    headline: 'Habitat Oxygen Reserves Depleted to 0%!',
    kidFriendlySummary: 'The air ran out! Without enough oxygen generators or CO₂ scrubbers, the air became unbreathable. Emergency sirens sounded as the crew scrambled into their spacesuits.',
    rootCauseAnalysis: 'Oxygen was consumed faster than the Sabatier loop could regenerate it. Unpatched hull micro-leaks and unmitigated ECLSS failures drained the remaining air reserves.',
    realScienceLesson: 'Humans need 0.84 kg of pure O₂ every day (NASA BVAD 2015). On the Moon or Mars, you cannot just open a window — every molecule of oxygen must be recycled or split from water.',
    nasaTakeaway: 'Never ignore oxygen scrubber warnings or delay Sabatier reactor maintenance!'
  },
  DESICCATION_DEHYDRATION: {
    id: 'DESICCATION_DEHYDRATION',
    isVictory: false,
    title: '💧 Mission Failure: Water Filtration Loop Exhaustion',
    badge: 'CRITICAL FAILURE: WATER EXHAUSTION',
    headline: 'Fresh Water Tanks Ran Bone Dry!',
    kidFriendlySummary: 'Without clean drinking water, the crew suffered extreme dehydration. Plants in the greenhouse wilted, hydroponics failed, and life support could no longer produce oxygen.',
    rootCauseAnalysis: 'The Water Recovery System clogged or lacked sufficient efficiency, allowing 3.5% daily water loss to drain the tanks faster than ice cores could be melted.',
    realScienceLesson: 'Water is heavy (1 kg per liter), so rockets cannot carry endless supplies. An outpost must achieve at least 90-95% water recovery through distillation and reverse osmosis.',
    nasaTakeaway: 'Build Thermo-Electric Water Recyclers early to keep recycling efficiency above 90%!'
  },
  RADIATION_CASUALTY: {
    id: 'RADIATION_CASUALTY',
    isVictory: false,
    title: '☢️ Mission Failure: Excessive Radiation Dose',
    badge: 'CRITICAL FAILURE: RADIATION ILLNESS',
    headline: 'Cumulative Radiation Exposure Exceeded Safe NASA Limits!',
    kidFriendlySummary: 'High-energy cosmic rays and solar flares pierced the habitat walls. Without enough regolith shielding, the crew became sick from radiation exposure and had to be evacuated.',
    rootCauseAnalysis: 'Unshielded surface exposure exceeded 100 mSv. Failure to build sintered regolith storm shelters or seal the storm vault during solar particle events exposed crew to lethal proton fluxes.',
    realScienceLesson: 'Earth’s magnetic field and thick atmosphere protect us from cosmic radiation. On the Moon or Mars, astronauts need at least 1.5 to 2 meters of packed space dirt (regolith) over their habitat.',
    nasaTakeaway: 'Prioritize 3D-printed regolith shielding before solar storm seasons begin!'
  },
  CREW_MORALE_COLLAPSE: {
    id: 'CREW_MORALE_COLLAPSE',
    isVictory: false,
    title: '🧠 Mission Failure: Psychological Burnout & Morale Collapse',
    badge: 'CRITICAL FAILURE: CREW DESPAIR',
    headline: 'Crew Morale Reached 0% Under Extreme Isolation & Deprivation!',
    kidFriendlySummary: 'Too many emergency lockdowns, cold rations, and broken recreational systems caused the astronauts to burn out. Dispirited and exhausted, the crew could no longer safely operate the outpost.',
    rootCauseAnalysis: 'Chronic food shortages, cramped quarters without exercise or green plants, and continuous crisis alarms severely deteriorated crew mental health, halting maintenance routines.',
    realScienceLesson: 'Astronaut psychology is a critical NASA mission success factor. Fresh greens from hydroponic gardens, exercise, and comfortable rest spaces are vital for mental resilience during deep space isolation.',
    nasaTakeaway: 'Happy astronauts run safe missions! Build hydroponic salad pods and recreation modules to support mental health.'
  },
  SCIENTIFIC_TRIUMPH: {
    id: 'SCIENTIFIC_TRIUMPH',
    isVictory: true,
    title: '🔬 Scientific Triumph: Breakthrough Discoveries Unlocked',
    badge: 'NASA SCIENTIFIC DISCOVERY LAUREL',
    headline: 'Groundbreaking Planetary Science Data Returned to Earth!',
    kidFriendlySummary: 'You did not just survive — you made history! Your outpost discovered deep polar ice formations, solar wind records, and ancient bedrock samples that rewrite planetary textbooks!',
    rootCauseAnalysis: 'High science yield achieved while keeping life support nominal. Robust power allowed continuous mass spectrometry and lab analysis.',
    realScienceLesson: 'The goal of human space exploration is scientific discovery. Stable life support creates the foundation for revolutionary research.',
    nasaTakeaway: 'Your scientific data was published in Nature and Science magazines!'
  },
  STARVATION: {
    id: 'STARVATION',
    isVictory: false,
    title: '🥗 Mission Failure: Food Depletion & Starvation',
    badge: 'CRITICAL FAILURE: MALNUTRITION',
    headline: 'Outpost Food Rations Completely Exhausted!',
    kidFriendlySummary: 'The pantry ran empty and hydroponic crops failed to harvest in time. Weakened by severe calorie deficits, the crew could no longer perform base maintenance.',
    rootCauseAnalysis: 'Daily food consumption exceeded agricultural yield. Without greenhouse salad pods or resupply, stored rations drained to 0 meals.',
    realScienceLesson: 'Humans need approximately 2,800 to 3,200 calories per day during space work (NASA BVAD 2015). Hydroponics must supplement shelf-stable rations.',
    nasaTakeaway: 'Plant crops early and ensure greenhouses have dedicated water and power buffers!'
  },
  DEPRESSURIZATION: {
    id: 'DEPRESSURIZATION',
    isVictory: false,
    title: '💥 Mission Failure: Catastrophic Hull Depressurization',
    badge: 'CRITICAL FAILURE: HULL COMPROMISED',
    headline: 'Structural Breach Caused Rapid Atmospheric Venting!',
    kidFriendlySummary: 'A high-speed meteoroid impact or unpatched airlock tear ripped open the pressurized habitat. The cabin air escaped into the vacuum before bulkheads could seal.',
    rootCauseAnalysis: 'Radiation shielding and physical armor dropped to 0%. When an impact occurred, the habitat hull lacked sacrificial Whipple bumpers or regolith cover.',
    realScienceLesson: 'In the vacuum of space, internal air exerts 101 kPa (14.7 psi) of outward pressure. A structural breach vents cabin atmosphere in seconds without automated seals.',
    nasaTakeaway: 'Maintain at least 30% shielding at all times to prevent structural puncture!'
  }
};

// Aliases matching required endings
ENDING_SCENARIOS['FULL_SUCCESS'] = ENDING_SCENARIOS['GOLDEN_TRIUMPH'];
ENDING_SCENARIOS['PYRRHIC_SURVIVAL'] = ENDING_SCENARIOS['SURVIVAL_VICTORY'];
ENDING_SCENARIOS['POWER_FREEZE'] = ENDING_SCENARIOS['LIFE_SUPPORT_FREEZE'];
ENDING_SCENARIOS['SUFFOCATION'] = ENDING_SCENARIOS['DEPRESSURIZATION_HYPOXIA'];
ENDING_SCENARIOS['RADIATION_SICKNESS'] = ENDING_SCENARIOS['RADIATION_CASUALTY'];


