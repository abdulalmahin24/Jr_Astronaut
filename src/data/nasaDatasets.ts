export interface NasaDatasetInfo {
  id: string;
  name: string;
  category: 'LUNAR_SURFACE' | 'SPACE_WEATHER' | 'LIFE_SUPPORT' | 'RADIATION' | 'SURFACE_OPS' | 'POWER_ENERGY';
  citationDoc: string;
  agencyOrPublisher: string;
  directUrl: string;
  accessDate: string;
  relevantFactOrData: string;
  units: string;
  howUsedInGame: string;
  limitationsOrSimplifications: string;
  isRealData: boolean;
}

export const NASA_DATASETS: NasaDatasetInfo[] = [
  // 1. Lunar Environment & Surface Exploration
  {
    id: 'lro-lola-topography',
    name: 'Lunar Reconnaissance Orbiter (LRO) LOLA Polar Elevation Models',
    category: 'LUNAR_SURFACE',
    citationDoc: 'NASA GSFC / LRO-L-LOLA-4-GDR-V1.0',
    agencyOrPublisher: 'NASA Goddard Space Flight Center & Planetary Data System (PDS)',
    directUrl: 'https://pds-geosciences.wustl.edu/missions/lro/lola.htm',
    accessDate: '2026-10-15',
    relevantFactOrData: 'Shackleton Crater rim (89.9°S) features peaks with up to 86–92% illumination annually, with adjacent floor temperatures dipping below 40 Kelvin (-233°C) in Permanently Shadowed Regions (PSRs).',
    units: 'Meters elevation, Kelvin (K), % annual illumination',
    howUsedInGame: 'Defines the topographic map, solar angle calculations, crater obstacles, and volatile ice waypoint coordinates in the 3D base and rover simulator.',
    limitationsOrSimplifications: 'Elevation contours are quantized for real-time 60 FPS WebGL mesh rendering and top-down canvas physics.',
    isRealData: true,
  },
  {
    id: 'lcross-volatile-ice',
    name: 'LCROSS Impact Science Results: Water Volatiles in Cabeus Crater',
    category: 'LUNAR_SURFACE',
    citationDoc: 'Science Vol. 330, pp. 463-468 (NASA Ames)',
    agencyOrPublisher: 'NASA Ames Research Center & Science Journal',
    directUrl: 'https://www.nasa.gov/mission_pages/LCROSS/main/index.html',
    accessDate: '2026-10-15',
    relevantFactOrData: 'Spectral absorption confirmed volatile water ice content estimated at 5.5 ± 1.5% by weight in permanently shadowed polar cold traps, alongside volatile methane (CH4), carbon monoxide (CO), and ammonia (NH3).',
    units: '% weight water ice concentration (wt%)',
    howUsedInGame: 'Sets the volatile ice extraction yield in the Rover Exploration mini-game when drilling in permanently shadowed crater floors (+35 science points and water recovery buff).',
    limitationsOrSimplifications: 'Simplified to pure water ice extraction without complex cryogenic multi-phase chemical distillation.',
    isRealData: true,
  },

  // 2. Space Weather & Solar Activity
  {
    id: 'donki-ccmc-cme',
    name: 'NASA Space Weather Database of Notifications, Knowledge, Information (DONKI)',
    category: 'SPACE_WEATHER',
    citationDoc: 'NASA CCMC DONKI Catalog / NOAA Space Weather Prediction Center',
    agencyOrPublisher: 'NASA Goddard Space Flight Center Community Coordinated Modeling Center',
    directUrl: 'https://kauai.ccmc.gsfc.nasa.gov/DONKI/',
    accessDate: '2026-10-15',
    relevantFactOrData: 'Coronal Mass Ejections (CMEs) travel from 250 km/s to over 3,000 km/s, driving Solar Energetic Particle (SEP) proton flux exceeding 100 MeV that can deliver lethal absorbed doses (>1,000 mGy) to unshielded astronauts.',
    units: 'km/s velocity, MeV proton energy, Particle Flux Units (pfu)',
    howUsedInGame: 'Drives the Sol 10 Coronal Mass Ejection crisis event, requiring astronauts to seal the storm vault or activate magnetic shielding to prevent acute radiation illness.',
    limitationsOrSimplifications: 'Game models flare transit time deterministically across Sol turns rather than continuous interplanetary shock wave tracking.',
    isRealData: true,
  },

  // 3. Human Exploration & Life-Support Systems (ECLSS)
  {
    id: 'bvad-eclss-standards',
    name: 'NASA Baseline Values and Assumptions Document (BVAD)',
    category: 'LIFE_SUPPORT',
    citationDoc: 'NASA/TP-2015-218570',
    agencyOrPublisher: 'NASA Johnson Space Center & NASA Life Support Technical Committee',
    directUrl: 'https://ntrs.nasa.gov/citations/20150003001',
    accessDate: '2026-10-15',
    relevantFactOrData: 'Nominal crew metabolic baseline inputs/outputs per astronaut: 0.84 kg O2 consumption/day, 3.0 L H2O consumption/day, 1.0 kg CO2 generated/day, 2.5 kg food rations/day at 3,000 kcal/day.',
    units: 'kg/person/day, Liters/person/day, kcal/day',
    howUsedInGame: 'Forms the single authoritative basis for all daily resource consumption rates in computeDailySimulationTurn() and Outpost Construction ECLSS sizing.',
    limitationsOrSimplifications: 'Scaled to 4-astronaut outpost complement and expressed as percentage of habitat life-support capacity (0-100%).',
    isRealData: true,
  },

  // 4. Radiation Protection & Regolith Shielding
  {
    id: 'crater-radiation-dose',
    name: 'Cosmic Ray Telescope for the Effects of Radiation (CRaTER)',
    category: 'RADIATION',
    citationDoc: 'NASA LRO CRaTER Science Investigation (NASA-TM-2011-216442)',
    agencyOrPublisher: 'NASA Goddard Space Flight Center & University of New Hampshire',
    directUrl: 'https://crater.unh.edu/',
    accessDate: '2026-10-15',
    relevantFactOrData: 'Ambient unshielded Galactic Cosmic Ray (GCR) surface dose at the Moon ranges from 0.4 to 0.7 mSv/day at solar maximum up to 1.5 mSv/day at solar minimum. Sintered lunar regolith (bulk density 1.5 to 1.9 g/cm³) provides 50% GCR attenuation at ~45 cm depth and >85% attenuation at 150 cm.',
    units: 'mSv/day (millisieverts), g/cm³ regolith density, cm shield thickness',
    howUsedInGame: 'Calibrates daily radiation exposure accumulation and rewards constructing the 2-meter Sintered Regolith Vault in Outpost Construction.',
    limitationsOrSimplifications: 'Linearized exponential attenuation model in game simulation instead of full Monte Carlo GEANT4 nuclear spallation code.',
    isRealData: true,
  },

  // 5. Lunar Surface Operations & Dust Mitigation
  {
    id: 'artemis-surface-operations',
    name: 'Artemis Surface Exploration Operations & Lunar Dust Mitigation',
    category: 'SURFACE_OPS',
    citationDoc: 'NASA Special Publication SP-20205008533 (Artemis III Science Definition)',
    agencyOrPublisher: 'NASA Headquarters & Artemis Science Definition Team',
    directUrl: 'https://www.nasa.gov/reports/artemis-iii-science-definition-report/',
    accessDate: '2026-10-15',
    relevantFactOrData: 'Sub-20 micron jagged lunar regolith grains carry electrostatic charges and abrasive glass shards that cause seal wear, joint abrasion, and solar panel power degradation of 1.0–2.5% per week if unmitigated.',
    units: 'Microns grain size (µm), % power loss per sol, electrostatic potential (V)',
    howUsedInGame: 'Simulates equipment wear & tear (-1.5% per Sol) and the Sol 6 Solar Dust Accumulation event requiring automated brush cleaning or 3D spare parts fabrication.',
    limitationsOrSimplifications: 'Dust optical depth and seal degradation are modeled as daily percentage wear vectors.',
    isRealData: true,
  },

  // 6. Power Systems & Mission Hardware
  {
    id: 'kilopower-fission-krusty',
    name: 'Kilopower Fission Surface Power System Design & Testing (KRUSTY)',
    category: 'POWER_ENERGY',
    citationDoc: 'NASA-TM-2018-219801 / NASA Glenn Research Center',
    agencyOrPublisher: 'NASA Glenn Research Center & Los Alamos National Laboratory',
    directUrl: 'https://ntrs.nasa.gov/citations/20180002166',
    accessDate: '2026-10-15',
    relevantFactOrData: 'The Kilopower KRUSTY reactor incorporates a solid U-235 molybdenum core with sodium heat pipes transferring thermal energy to dual closed-loop Stirling convertors, producing 1 to 10 kWe of continuous electric power for 10+ years independent of sunlight.',
    units: 'kWe (kilowatts electric), kWth (kilowatts thermal), kg mass (8,500 kg flight system)',
    howUsedInGame: 'Allows the player to select the Kilopower Fission Reactor in Outpost Construction (+25 kW continuous power day and night), eliminating catastrophic freeze risk during the 354-hour lunar night.',
    limitationsOrSimplifications: 'Thermal sodium fluid dynamics and startup criticality rods are abstracted into a reliable continuous kilowatt output.',
    isRealData: true,
  },
];
