/**
 * missionScenarioEngine.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Authoritative Mission Scenario Engine for Jr_AstroCamp Outpost Command.
 * Serves peer-reviewed, verified NASA ECLSS survival and exploration scenarios
 * for Artemis Base Camp (Moon) and AstroCamp Mars Outpost (Jezero Crater).
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { MissionEvent } from '../types/game';
import type { DifficultyTier } from '../data/difficultyTiers';
import type { NasaMission } from '../data/nasaMissions';
import { getEventDeck } from '../data/tierEvents';

/**
 * Returns the complete, authentic event deck for the specified mission & difficulty tier.
 * Destination-specific:
 *  - MOON: Peer-reviewed Artemis Base Camp at Shackleton Crater Rim (NASA BVAD & LRO LOLA)
 *  - MARS: Peer-reviewed AstroCamp Mars Outpost at Jezero Crater (NASA Mars 2020 MOXIE & HiRISE)
 */
export function getMissionScenarioDeck(mission: NasaMission, tier: DifficultyTier): MissionEvent[] {
  if (mission.destination === 'MARS') {
    return getMarsOutpostDeck(tier);
  }

  // Default / Moon: Artemis Base Camp at Shackleton Crater Rim
  return getEventDeck(tier);
}

// ─── MARS JEZERO OUTPOST 40-SOL EVENT DECK ────────────────────────────────────

function getMarsOutpostDeck(tier: DifficultyTier): MissionEvent[] {
  const isKid = tier === 'EXPLORER' || tier === 'CADET';

  return [
    // Sol 1: Touchdown at Jezero Crater
    {
      id: 'mars-sol-01-touchdown',
      sol: 1,
      title: isKid
        ? '🔴 Sol 1: Touchdown at Jezero Crater Delta!'
        : 'SOL 001 — Jezero Crater Touchdown & Surface Base Deployment',
      urgency: 'INFO',
      weatherNotice: 'Atmosphere: 0.61 kPa (95.3% CO₂) · Surface Temp: -62°C · Optical Depth Tau: 0.45',
      nasaCitation: {
        title: 'NASA Mars 2020 Terrain-Relative Navigation & Jezero Geomorphology',
        docNumber: 'Farley et al. (2020) Space Sci Rev 216:142',
        description: 'Jezero Crater preserves an ancient lacustrine delta rich in phyllosilicates and carbonates formed under sustained aqueous conditions ~3.8 billion years ago.'
      },
      comicPanels: [
        {
          speaker: 'CADET_MAYA',
          dialogue: isKid
            ? 'Commander Dadu, we made it to Mars! Look at the red hills and ancient river delta outside the airlock!'
            : 'Commander Dadu, touchdown verified on the Jezero delta floor. Atmospheric pressure is 0.61 kPa. All primary habitat systems online!',
          mood: 'excited',
          illustrationType: 'ROVER_SURVEY'
        },
        {
          speaker: 'COMMANDER_DADU',
          dialogue: isKid
            ? 'Welcome to the Red Planet, Maya! Before we drive the rover, we must start our oxygen makers and secure our power grid!'
            : 'Outstanding touchdown. Consult the Mars surface flight rules: First priority is MOXIE oxygen generation and power grid stabilization before scientific sample collection.',
          mood: 'heroic',
          illustrationType: 'AIRLOCK'
        }
      ],
      options: [
        {
          id: 'mars-opt-deploy-solar',
          title: isKid ? 'Deploy Tall Martian Solar Arrays' : 'Deploy Vertical Tracking Solar Array & Dust Shields',
          description: 'Erect high-efficiency photovoltaic towers to capture sunlight through the thin Martian atmosphere.',
          tradeOffText: 'Provides reliable baseline power; draws modest water for thermal cooling loops.',
          resourceDelta: { power: +30, science: +10, water: -4 },
          consequenceNarrative: 'The solar towers deploy across the Jezero regolith, providing stable electrical current to the habitat batteries.',
          educationalInsight: 'Mars receives ~43% of the solar flux of Earth (590 W/m² vs 1361 W/m²), requiring larger photovoltaic surface areas.'
        },
        {
          id: 'mars-opt-moxie-spinup',
          title: isKid ? 'Start MOXIE Oxygen Generator' : 'Initiate MOXIE Solid Oxide Electrolysis Run',
          description: 'Electrolyze atmospheric CO₂ at 800°C to extract breathable O₂ and store pure oxygen reserves.',
          tradeOffText: 'Boosts oxygen supply and crew safety; draws significant power.',
          resourceDelta: { oxygen: +25, power: -18, crewHealth: +10 },
          consequenceNarrative: 'MOXIE reaches operational temperature and pumps medical-grade O₂ into the habitat buffer cylinders.',
          educationalInsight: 'NASA MOXIE on Perseverance demonstrated producing 6–10 grams of oxygen per hour from the Martian atmosphere.'
        },
        {
          id: 'mars-opt-delta-survey',
          title: isKid ? 'Quick Rover Sample Drill' : 'Surface Reconnaissance & Regolith Core Sampling',
          description: 'Deploy the pressurized rover to core sedimentary clays near the delta fan.',
          tradeOffText: 'High science yield, but leaves habitat running on minimum battery margins.',
          resourceDelta: { science: +40, power: -14, crewHealth: -5 },
          consequenceNarrative: 'The rover retrieves rich smectite clay cores from the Jezero ancient riverbed.',
          educationalInsight: 'Fine-grained clays on Earth frequently preserve organic biosignatures, making them top exploration targets on Mars.'
        }
      ]
    },

    // Sol 4: MOXIE & Aeroponic Crops
    {
      id: 'mars-sol-04-aeroponics',
      sol: 4,
      title: isKid ? '🌱 Sol 4: Martian Greenhouse Sprouting!' : 'SOL 004 — Closed-Loop Aeroponics & Sabatier Integration',
      urgency: 'INFO',
      weatherNotice: 'Solar irradiance 590 W/m² · Habitat humidity 65% · LED spectrum: 450nm/660nm',
      nasaCitation: {
        title: 'NASA Technical Publication: Advanced Life Support Baseline Values',
        docNumber: 'NASA/TP-2015-218570 (BVAD)',
        description: 'Controlled environment agriculture requires balancing light intensity, nutrient solutions, and recycled atmospheric moisture.'
      },
      comicPanels: [
        {
          speaker: 'CADET_MAYA',
          dialogue: isKid
            ? 'Dadu, the salad pods are glowing green! The radish and wheat sprouts are growing under the purple lights!'
            : 'Commander, the aeroponic biome germination cycle is underway. Nutrient delivery loops are stable at pH 6.2.',
          mood: 'excited',
          illustrationType: 'AIRLOCK'
        },
        {
          speaker: 'COMMANDER_DADU',
          dialogue: isKid
            ? 'Plants are our best friends on Mars! They recycle our carbon dioxide into fresh air and give us fresh food.'
            : 'Excellent work. Bioregenerative life support reduces consumable resupply mass by over 80% on long-duration Mars stays.',
          mood: 'heroic',
          illustrationType: 'AIRLOCK'
        }
      ],
      options: [
        {
          id: 'mars-opt-greenhouse-full',
          title: isKid ? 'Full Lighting Cycle for Crop Growth' : 'Max-Yield Photoperiod (16h Lighting + CO₂ Enrichment)',
          description: 'Drive high-intensity LED illumination to accelerate caloric crop maturity.',
          tradeOffText: 'Substantial food and oxygen production; draws heavy electrical power and water.',
          resourceDelta: { food: +8, oxygen: +10, power: -20, water: -12 },
          consequenceNarrative: 'Crops absorb CO₂ and pump moisture into the air recycler, with rapid leaf growth.',
          educationalInsight: 'Plants produce ~1.07 kg of O₂ for every 1 kg of dry biomass produced through photosynthesis.'
        },
        {
          id: 'mars-opt-greenhouse-balanced',
          title: isKid ? 'Balanced Eco Mode for Plants' : 'Balanced Aeroponic Maintenance Cycle',
          description: 'Maintain sustainable nutrient misting and 12-hour photoperiod to preserve reserves.',
          tradeOffText: 'Moderate food gain; balanced resource consumption.',
          resourceDelta: { food: +4, oxygen: +5, power: -8, water: -6, science: +10 },
          consequenceNarrative: 'The crops thrive steadily while conserving water reserves for future sols.',
          educationalInsight: 'Aeroponic misting uses 95% less water than traditional terrestrial soil agriculture.'
        }
      ]
    },

    // Sol 8: Global Dust Storm Warning
    {
      id: 'mars-sol-08-dust-storm',
      sol: 8,
      title: isKid ? '⚠️ Sol 8: ALERT — Martian Dust Storm Approaching!' : 'SOL 008 — CRITICAL: High-Opacity Dust Storm Advisory',
      urgency: 'HIGH',
      weatherNotice: 'Optical Depth Tau: 2.85 · Wind speed: 28 m/s · Ambient temp: -78°C',
      nasaCitation: {
        title: 'NASA Mars Climate Database & InSight Dust Storm Observations',
        docNumber: 'Banfield et al. (2020) Nature Geoscience 13:190',
        description: 'Martian global dust storms dramatically increase atmospheric opacity (Tau > 3.0), reducing solar array output by up to 90%.'
      },
      comicPanels: [
        {
          speaker: 'CADET_MAYA',
          dialogue: isKid
            ? 'Dadu! The sky is turning dark butterscotch orange! The dust sensors are buzzing like crazy!'
            : 'Commander, dust optical depth Tau jumped from 0.45 to 2.85 in 4 hours! Solar array output is dropping rapidly!',
          mood: 'warning',
          illustrationType: 'DUST_STORM'
        },
        {
          speaker: 'COMMANDER_DADU',
          dialogue: isKid
            ? 'Seal the storm locks! We have planned for this. Turn on the Kilopower nuclear reactor and protect the solar panels!'
            : 'Sound storm stations. Route primary life support to Kilopower nuclear generation and engage electrostatic dust repellent on the PV glass.',
          mood: 'curious',
          illustrationType: 'AIRLOCK'
        }
      ],
      options: [
        {
          id: 'mars-opt-storm-kilopower',
          title: isKid ? 'Spin Up Nuclear Reactor' : 'Spin Up Kilopower KRUSTY Reactor to Full 10 kWe',
          description: 'Rely on the stirling nuclear core to power life support independent of sunlight.',
          tradeOffText: 'Guarantees 100% continuous power regardless of dust; modest crew stress.',
          resourceDelta: { power: +45, oxygen: +8, crewHealth: +5, water: -4 },
          consequenceNarrative: 'The Kilopower reactor purrs steadily, flooding the habitat with power despite total solar blackout.',
          educationalInsight: 'NASA Kilopower uses enriched uranium-235 with sodium heat pipes and Stirling engines, unaffected by dust.'
        },
        {
          id: 'mars-opt-storm-conserve',
          title: isKid ? 'Hibernate Non-Essential Systems' : 'Enter Habitat Safe-Mode & Conserve Battery Banks',
          description: 'Power down science racks and non-critical heaters while riding out the peak winds.',
          tradeOffText: 'Preserves emergency power; slows scientific research.',
          resourceDelta: { power: -10, science: -5, food: -2, crewHealth: +8 },
          consequenceNarrative: 'The base maintains safe margins in silent running until the dust front passes.',
          educationalInsight: 'Mars atmosphere is 1% the density of Earth, so high wind speeds carry little dynamic pressure force.'
        }
      ]
    },

    // Sol 14: Sample Caching & MSR
    {
      id: 'mars-sol-14-sample-caching',
      sol: 14,
      title: isKid ? '🔬 Sol 14: Ancient Lakebed Core Discovery!' : 'SOL 014 — Jezero Delta Lacustrine Sample Sealing',
      urgency: 'INFO',
      weatherNotice: 'Solar irradiance 570 W/m² · Rover telemetry locked · Gamma ray spectrometer online',
      nasaCitation: {
        title: 'NASA-ESA Mars Sample Return Architecture',
        docNumber: 'Muirhead et al. (2020) IEEE Aerospace Conf',
        description: 'Hermetically sealed titanium sample tubes preserve Martian rock cores for future return to terrestrial laboratories.'
      },
      comicPanels: [
        {
          speaker: 'CADET_MAYA',
          dialogue: isKid
            ? 'Look at this core sample! It has delicate microscopic layers from an ancient Martian lake that dried up billions of years ago!'
            : 'Commander, the drill bit retrieved a dense layered mudstone core with organic carbonate signatures! Caching tube hermetically sealed.',
          mood: 'excited',
          illustrationType: 'ROVER_SURVEY'
        },
        {
          speaker: 'COMMANDER_DADU',
          dialogue: isKid
            ? 'This could be the biggest scientific breakthrough in human history! Let us downlink the spectroscopic scan to NASA Earth.'
            : 'Carefully document the geochemical spectrum. Transmit full Raman and fluorescence spectroscopy to Houston and JPL science teams.',
          mood: 'heroic',
          illustrationType: 'ROVER_SURVEY'
        }
      ],
      options: [
        {
          id: 'mars-opt-sample-downlink',
          title: isKid ? 'Deep Space Laser Downlink to Earth' : 'High-Bandwidth DSOC Optical Laser Downlink to JPL',
          description: 'Transmit 4K multispectral micro-imaging of the core sample using deep space laser communications.',
          tradeOffText: 'Tremendous science return; draws high electrical power.',
          resourceDelta: { science: +60, power: -15, crewHealth: +8 },
          consequenceNarrative: 'NASA Headquarters and the worldwide scientific community celebrate as the data confirms ancient lakebed biosignature candidates.',
          educationalInsight: 'Deep Space Optical Communications (DSOC) achieves data rates 10 to 100 times higher than radio frequency.'
        },
        {
          id: 'mars-opt-sample-store',
          title: isKid ? 'Secure in Vault & Preserve Power' : 'Store Core in Cryo-Vault & Conserve Transmitter Power',
          description: 'Store the sample tube safely in the hermetic science vault and transmit compressed telemetry.',
          tradeOffText: 'Balanced science gain; conserves power grid reserves.',
          resourceDelta: { science: +35, power: +10, water: -2 },
          consequenceNarrative: 'Sample tube securely cataloged and locked in the cryogenic sample vault.',
          educationalInsight: 'Titanium caching tubes are designed to protect volatile organic compounds from solar UV degradation.'
        }
      ]
    },

    // Sol 20: Severe Thermal Nightfall
    {
      id: 'mars-sol-20-night-cold',
      sol: 20,
      title: isKid ? '❄️ Sol 20: Deep Martian Freeze (-110°C)!' : 'SOL 020 — Nocturnal Thermal Extreme (-110°C Cryo-Excursion)',
      urgency: 'HIGH',
      weatherNotice: 'External temp: -112°C · Internal temp: +21°C · Radiator loop flow: 1.8 L/min',
      nasaCitation: {
        title: 'NASA Human Exploration of Mars Design Reference Architecture 5.0',
        docNumber: 'NASA/SP-2009-566',
        description: 'Nighttime temperatures at equatorial and sub-tropical Martian latitudes require active loop heating and multilayer insulation (MLI).'
      },
      comicPanels: [
        {
          speaker: 'CADET_MAYA',
          dialogue: isKid
            ? 'Brrr! Outside is minus 110 degrees Celsius! The frost on the habitat airlock is frozen carbon dioxide dry ice!'
            : 'Commander, ambient temperature has dropped to -112°C. Thermal loop pressure is rising as coolant viscosity increases.',
          mood: 'warning',
          illustrationType: 'AIRLOCK'
        },
        {
          speaker: 'COMMANDER_DADU',
          dialogue: isKid
            ? 'Check the radiator valves! We use the reactor heat and thermal blankets to keep our habitat cozy at room temperature.'
            : 'Activate secondary heat exchangers. Route Stirling engine waste heat directly through the habitat perimeter hydronic loop.',
          mood: 'heroic',
          illustrationType: 'AIRLOCK'
        }
      ],
      options: [
        {
          id: 'mars-opt-heat-waste',
          title: isKid ? 'Use Reactor Waste Heat' : 'Route Nuclear/RTG Waste Heat through Habitat Walls',
          description: 'Use cogeneration thermal circuits to heat the living quarters without drawing electrical battery power.',
          tradeOffText: 'Excellent thermal stability; requires careful coolant fluid pressure monitoring.',
          resourceDelta: { power: +15, crewHealth: +12, water: -3, oxygen: +5 },
          consequenceNarrative: 'Thermal loops circulate smoothly, keeping the living quarters at a comfortable +21°C.',
          educationalInsight: 'Nuclear surface power systems produce 3 to 4 times more thermal heat than electrical output, perfect for cogeneration.'
        },
        {
          id: 'mars-opt-heat-resistive',
          title: isKid ? 'Turn on Electric Heaters' : 'Activate Electric Resistance Heating Elements',
          description: 'Draw power from battery banks to drive auxiliary ceramic heating elements.',
          tradeOffText: 'Immediate warmth; heavy drain on battery storage.',
          resourceDelta: { power: -25, crewHealth: +10 },
          consequenceNarrative: 'Electric heaters glow cherry red, stabilizing habitat temperature through the frigid Martian night.',
          educationalInsight: 'Resistive heating is 100% electrically efficient but creates rapid drains on chemical battery storage.'
        }
      ]
    },

    // Sol 28: Subsurface Water Radar
    {
      id: 'mars-sol-28-subsurface-water',
      sol: 28,
      title: isKid ? '💧 Sol 28: Underground Ice Lenses Detected!' : 'SOL 028 — SHARAD Radar Detection of Subsurface Water Ice',
      urgency: 'INFO',
      weatherNotice: 'Ground Penetrating Radar: 15-25 MHz · Depth: 12 meters · Dielectric permittivity: 3.1',
      nasaCitation: {
        title: 'Shallow Radar (SHARAD) Sounding of Martian Glacial and Lacustrine Deposits',
        docNumber: 'Seu et al. (2007) J. Geophys. Res. 112:E05S05',
        description: 'Orbital and surface ground-penetrating radar confirm extensive sheet ice and glacial lenses buried beneath protective regolith mantles.'
      },
      comicPanels: [
        {
          speaker: 'CADET_MAYA',
          dialogue: isKid
            ? 'Dadu, the radar screen is flashing blue! Look at the echo reflection 12 meters beneath our feet — it is pure glacial ice!'
            : 'Commander, ground-penetrating radar confirms a 4-meter thick ice lens buried under 12 meters of dry regolith! Estimated purity >90%!',
          mood: 'excited',
          illustrationType: 'ROVER_SURVEY'
        },
        {
          speaker: 'COMMANDER_DADU',
          dialogue: isKid
            ? 'Water is life on Mars! With water ice, we can drink, grow crops, and split water into hydrogen rocket fuel!'
            : 'This secures the permanent future of the Jezero Outpost. Subsurface ice enables In-Situ Resource Utilization for Earth return flights.',
          mood: 'heroic',
          illustrationType: 'ROVER_SURVEY'
        }
      ],
      options: [
        {
          id: 'mars-opt-drill-ice',
          title: isKid ? 'Deep Thermal Ice Probe Drilling' : 'Deploy Automated Thermal Subsurface Coring Drill',
          description: 'Melts a narrow extraction channel to sample and verify water purity.',
          tradeOffText: 'Huge water and science gain; requires substantial thermal power.',
          resourceDelta: { water: +35, science: +40, power: -20 },
          consequenceNarrative: 'Pristine ancient Martian meltwater flows through the filter lines, topping off the outpost water reservoirs.',
          educationalInsight: 'Extracting 1 cubic meter of ice produces 1,000 liters of water, saving hundreds of millions in launch costs.'
        },
        {
          id: 'mars-opt-map-deposit',
          title: isKid ? 'Map the Full Underground Lake' : 'Complete 3D Tomographic Radar Mapping of Ice Field',
          description: 'Drive the rover in a grid pattern to map the boundary of the water-ice field.',
          tradeOffText: 'Massive science gain; modest power expenditure.',
          resourceDelta: { science: +60, power: -10, crewHealth: +5 },
          consequenceNarrative: 'The 3D hydrological map is transmitted to NASA, delineating millions of cubic meters of accessible ice.',
          educationalInsight: 'Planetary radar tomography measures reflections between dielectric interfaces to reveal hidden stratigraphy.'
        }
      ]
    },

    // Sol 34: ISRU Fuel Plant
    {
      id: 'mars-sol-34-isru-propellant',
      sol: 34,
      title: isKid ? '🚀 Sol 34: Rocket Fuel Synthesis Online!' : 'SOL 034 — Sabatier ISRU Methane & Liquid Oxygen Synthesis',
      urgency: 'INFO',
      weatherNotice: 'CO₂ inlet: 4.2 kg/hr · CH₄ synthesis rate: 1.5 kg/hr · Cryo-tank: 92 K',
      nasaCitation: {
        title: 'NASA In-Situ Resource Utilization (ISRU) Architecture for Mars Ascent',
        docNumber: 'Sanders et al. (2014) AIAA Space Conf',
        description: 'Combining atmospheric CO₂ with water-derived hydrogen via the Sabatier reaction yields methane (CH₄) and liquid oxygen (LOX) rocket propellant.'
      },
      comicPanels: [
        {
          speaker: 'CADET_MAYA',
          dialogue: isKid
            ? 'The chemical plant is chugging along! We are making real rocket fuel out of thin Martian air!'
            : 'Commander, Sabatier reactor is operating at 98% catalytic efficiency. Methane liquefaction stage is chilling propellant to 92 Kelvin.',
          mood: 'excited',
          illustrationType: 'AIRLOCK'
        },
        {
          speaker: 'COMMANDER_DADU',
          dialogue: isKid
            ? 'By making our fuel on Mars instead of carrying it from Earth, our return spaceship is fully fueled and ready for the journey home!'
            : 'That is the cornerstone of interplanetary exploration: Live off the land. Our Earth Return Vehicle now has 100% full propellant tanks.',
          mood: 'heroic',
          illustrationType: 'AIRLOCK'
        }
      ],
      options: [
        {
          id: 'mars-opt-fuel-liquefaction',
          title: isKid ? 'Fill Cryogenic Fuel Tanks' : 'Complete Full Cryogenic LOX/CH₄ Propellant Loading',
          description: 'Top off the Earth Return Vehicle cryogenic tanks and verify thermal boil-off mitigation.',
          tradeOffText: 'Completes return propulsion requirements; requires high power for cryo-coolers.',
          resourceDelta: { power: -22, science: +35, oxygen: +15, crewHealth: +10 },
          consequenceNarrative: 'Propellant mass verification confirms 100% load. The return rocket is fully fueled for the flight to Earth.',
          educationalInsight: 'The Sabatier reaction (CO₂ + 4H₂ → CH₄ + 2H₂O) was discovered in 1897 and remains NASA’s primary Mars ISRU pathway.'
        },
        {
          id: 'mars-opt-fuel-conserve',
          title: isKid ? 'Safe Propellant Buffer & Conserve' : 'Maintain Nominal Propellant Buffer & Balance Life Support',
          description: 'Keep propellant synthesis at steady maintenance levels while prioritizing crew health.',
          tradeOffText: 'Maintains balanced margins across all subsystems.',
          resourceDelta: { power: +10, water: +10, crewHealth: +15, science: +20 },
          consequenceNarrative: 'All stations report green indicators. Life support consumables and propellant reserves remain optimal.',
          educationalInsight: 'Dual-purpose consumables like liquid oxygen can serve as both crew breathing gas and rocket oxidizer.'
        }
      ]
    },

    // Sol 40: Mission Success
    {
      id: 'mars-sol-40-victory',
      sol: 40,
      title: isKid ? '🏆 Sol 40: Mission Success — Mars Outpost Established!' : 'SOL 040 — 40-Sol Mars Expedition Objectives Accomplished!',
      urgency: 'INFO',
      weatherNotice: 'Solar irradiance 590 W/m² · Earth sightline clear · All telemetry channels nominal',
      nasaCitation: {
        title: 'NASA Journey to Mars: Pioneering Next Steps in Space Exploration',
        docNumber: 'NASA NP-2015-08-2018-HQ',
        description: 'Establishing a long-duration human presence on Mars transforms humanity into a multi-planetary species.'
      },
      comicPanels: [
        {
          speaker: 'HOUSTON_CAPCOM',
          dialogue: 'AstroCamp Mars Outpost, this is Houston Flight Director. You have successfully completed the 40-Sol Jezero Expedition! All science objectives achieved, life support margins held flawless. Outstanding work, Commander and Cadet!',
          mood: 'heroic',
          illustrationType: 'MISSION_VICTORY'
        },
        {
          speaker: 'CADET_MAYA',
          dialogue: isKid
            ? 'We did it, Dadu! We survived 40 days on Mars, made our own oxygen, grew crops, found ancient water ice, and made history!'
            : 'Mission accomplished, Commander! Habitat integrity is 100%, science data is beamed to Earth, and our outpost stands strong on Mars!',
          mood: 'excited',
          illustrationType: 'MISSION_VICTORY'
        }
      ],
      options: [
        {
          id: 'mars-opt-final-downlink',
          title: isKid ? 'Transmit Historic Final Log to Earth' : 'Transmit Final Expedition Archive & Handover Telemetry',
          description: 'Broadcast the comprehensive geological and life support data catalog to NASA Earth.',
          tradeOffText: 'Maximum science output and crew prestige; certifies the mission with top honors.',
          resourceDelta: { science: +80, crewHealth: +20, power: +15, water: +15, oxygen: +15 },
          consequenceNarrative: 'Houston CapCom confirms receipt of the complete expedition archive. AstroCamp Jezero is officially certified as a permanent human research outpost on Mars!',
          educationalInsight: 'The transition from robotic exploration to permanent human outposts marks the dawn of true interplanetary civilization.'
        }
      ]
    }
  ];
}
