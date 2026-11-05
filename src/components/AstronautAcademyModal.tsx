import React, { useState, useEffect } from 'react';
import {
  X,
  GraduationCap,
  Award,
  CheckCircle2,
  Play,
  Sparkles,
  ChevronRight,
  BookOpen,
  Globe,
  Rocket,
  Shield,
  Wrench,
  Search,
  ExternalLink,
  Check,
  Building2,
  Target,
  Radio,
  Layers,
  Flame,
  Film,
  Compass,
  Trophy,
  Gauge,
  Info,
  DoorClosed,
  RefreshCw,
  Sun,
  Droplets,
  Sprout,
  ShieldAlert,
  Activity,
  Cpu,
  Eye,
  Zap,
  Thermometer,
  AlertTriangle,
  Gamepad2,
  FileText,
} from 'lucide-react';
import { soundFx } from '../utils/audioEffects';
import { getCadetProgression, recordLessonCompletion } from '../utils/simulationEngine';
import {
  ASTRONAUT_RANKS,
  getCurrentRank,
  getRankProgress,
  type AstronautRank,
} from '../data/astronautRanks';
import { Spacesuit3DSimulator } from './Spacesuit3DSimulator';
import {
  NASA_30_MISSIONS,
  NASA_MAPS,
  NASA_VEHICLES,
  type NasaLevelMission,
  type VehicleConfig,
} from '../data/nasaInteractiveMissions';
import { MissionCampaignMap } from './MissionCampaignMap';
import { MissionCinematicIntro } from './MissionCinematicIntro';

export interface SpacesuitPart {
  id: string;
  name: string;
  nasaCode: string;
  category: 'HEAD_HELMET' | 'TORSO_LIFE_SUPPORT' | 'HANDS_ARMS' | 'LEGS_BOOTS' | 'FIELD_TOOLS';
  icon: string;
  locationOnBody: string;
  primaryFunction: string;
  physicsReason: string;
  specs: string;
}

export const getSpacesuitIcon = (id: string) => {
  switch (id) {
    case 'suit-visor': return <Eye size={22} style={{ color: 'var(--color-accent)' }} />;
    case 'suit-snoopy': return <Radio size={22} style={{ color: 'var(--color-accent)' }} />;
    case 'suit-lcvg': return <Thermometer size={22} style={{ color: '#38bdf8' }} />;
    case 'suit-plss': return <Activity size={22} style={{ color: 'var(--color-accent)' }} />;
    case 'suit-dcm': return <Gauge size={22} style={{ color: 'var(--color-accent)' }} />;
    case 'suit-tmg': return <Shield size={22} style={{ color: 'var(--color-accent)' }} />;
    case 'suit-gloves': return <Wrench size={22} style={{ color: 'var(--color-accent)' }} />;
    case 'suit-safer': return <Rocket size={22} style={{ color: 'var(--color-accent)' }} />;
    case 'suit-boots': return <Compass size={22} style={{ color: 'var(--color-accent)' }} />;
    case 'suit-tether': return <Layers size={22} style={{ color: 'var(--color-accent)' }} />;
    case 'tool-core-drill': return <Wrench size={22} style={{ color: 'var(--color-accent)' }} />;
    case 'tool-raman': return <Zap size={22} style={{ color: 'var(--color-accent)' }} />;
    case 'tool-hammer': return <Target size={22} style={{ color: 'var(--color-accent)' }} />;
    case 'tool-sample-flask': return <CheckCircle2 size={22} style={{ color: 'var(--color-accent)' }} />;
    case 'tool-neutron-spec': return <Radio size={22} style={{ color: 'var(--color-accent)' }} />;
    case 'tool-dsn-antenna': return <Globe size={22} style={{ color: 'var(--color-accent)' }} />;
    default: return <Wrench size={22} style={{ color: 'var(--color-accent)' }} />;
  }
};

export const getLessonIcon = (type: string) => {
  switch (type) {
    case 'airlock': return <Shield size={18} style={{ color: 'var(--color-accent)' }} />;
    case 'sabatier': return <RefreshCw size={18} style={{ color: 'var(--color-accent)' }} />;
    case 'solar': return <Sun size={18} style={{ color: 'var(--color-accent)' }} />;
    case 'water': return <Droplets size={18} style={{ color: 'var(--color-accent)' }} />;
    case 'greenhouse': return <Sprout size={18} style={{ color: 'var(--color-accent)' }} />;
    case 'radiation': return <ShieldAlert size={18} style={{ color: 'var(--color-accent)' }} />;
    case 'rover': return <Compass size={18} style={{ color: 'var(--color-accent)' }} />;
    case 'spectrometer': return <Search size={18} style={{ color: 'var(--color-accent)' }} />;
    default: return <BookOpen size={18} style={{ color: 'var(--color-accent)' }} />;
  }
};

export const getRankBadgeIcon = (level: number) => {
  switch (level) {
    case 1: return <Compass size={22} style={{ color: 'var(--color-accent)' }} />;
    case 2: return <Rocket size={22} style={{ color: 'var(--color-accent)' }} />;
    case 3: return <Wrench size={22} style={{ color: 'var(--color-accent)' }} />;
    case 4: return <Target size={22} style={{ color: 'var(--color-accent)' }} />;
    case 5: return <Award size={22} style={{ color: 'var(--color-accent)' }} />;
    case 6: return <Sparkles size={22} style={{ color: 'var(--color-accent)' }} />;
    default: return <Award size={22} style={{ color: 'var(--color-accent)' }} />;
  }
};

export const SPACESUIT_PARTS: SpacesuitPart[] = [
  {
    id: 'suit-visor',
    name: 'Extravehicular Visor Assembly (Gold Visor)',
    nasaCode: 'EVVA / LEVA',
    category: 'HEAD_HELMET',
    icon: '🪖',
    locationOnBody: 'Over the transparent pressure helmet shell',
    primaryFunction: 'Blocks blinding solar glare and 100% of hazardous deep-space UV and infrared radiation while allowing full visual reconnaissance.',
    physicsReason: 'In the vacuum of space, there is no atmospheric Rayleigh scattering. Direct sunlight is violently intense; pure vapor-deposited gold reflects 95% of thermal solar radiation.',
    specs: 'Polycarbonate shell coated with a 0.000005 cm layer of pure gold; rated for -150°C to +120°C.'
  },
  {
    id: 'suit-snoopy',
    name: 'Communications Carrier Assembly ("Snoopy Cap")',
    nasaCode: 'CCA',
    category: 'HEAD_HELMET',
    icon: '🎧',
    locationOnBody: 'Directly worn on cadet’s head underneath the hard helmet',
    primaryFunction: 'Hands-free dual noise-cancelling boom microphones and headphone receivers linking astronaut to CAPCOM and crew.',
    physicsReason: 'Sound waves require a physical gas medium to propagate. Space is an absolute vacuum (0 kPa), meaning radio frequency transmission is the ONLY way astronauts can communicate!',
    specs: 'Binaural audio transducers with Teflon wiring and sweat-wicking acoustic mesh.'
  },
  {
    id: 'suit-lcvg',
    name: 'Liquid Cooling and Ventilation Garment (LCVG)',
    nasaCode: 'LCVG',
    category: 'TORSO_LIFE_SUPPORT',
    icon: '❄️',
    locationOnBody: 'Form-fitting mesh undergarment worn directly against the skin',
    primaryFunction: 'Continuously circulates chilled water through 91 meters of flexible tubing to draw off body heat and perspiration during heavy EVA labor.',
    physicsReason: 'Without atmospheric air to provide convection cooling, an astronaut’s body heat cannot radiate away inside an insulated suit. Without liquid cooling, heat exhaustion occurs in 20 minutes!',
    specs: 'Circulates 1.8 L/min of water at 4°C to 15°C across 91m (300 ft) of medical-grade Tygon tubes.'
  },
  {
    id: 'suit-plss',
    name: 'Portable Life Support System (PLSS Backpack)',
    nasaCode: 'PLSS',
    category: 'TORSO_LIFE_SUPPORT',
    icon: '🎒',
    locationOnBody: 'Rigid titanium backpack locked to the Hard Upper Torso (HUT)',
    primaryFunction: 'Supplies breathable pure oxygen (29.6 kPa), removes exhaled carbon dioxide using lithium hydroxide, and provides sublimation ice cooling.',
    physicsReason: 'Acts as a personal miniature spacecraft preserving biological equilibrium, blood oxygenation, and continuous biometrics telemetry streaming to Houston.',
    specs: 'Dual 100% O2 tanks at 5,800 kPa, sublimator water evaporator, LiOH CO2 filter, 8.5-hour duration.'
  },
  {
    id: 'suit-dcm',
    name: 'Display and Control Module (DCM)',
    nasaCode: 'DCM',
    category: 'TORSO_LIFE_SUPPORT',
    icon: '📟',
    locationOnBody: 'Chest-mounted console on the astronaut’s upper torso',
    primaryFunction: 'Switches oxygen flow rate, regulates LCVG water cooling temperature, purges nitrogen, and displays digital suit pressure warnings.',
    physicsReason: 'Lettering on the chest console is printed backwards (in mirror image)! Astronauts read their chest gauges by looking down into a wrist-mounted mirror because rigid helmets prevent bending the neck.',
    specs: 'O2 regulator toggle, cooling rheostat, emergency purge valve, reversed typography.'
  },
  {
    id: 'suit-tmg',
    name: 'Thermal Micrometeoroid Garment (TMG Outer Layers)',
    nasaCode: 'TMG',
    category: 'TORSO_LIFE_SUPPORT',
    icon: '🛡️',
    locationOnBody: '14-layer outer protective envelope encompassing arms, legs, and torso',
    primaryFunction: 'Shields the internal pressure bladder against hypervelocity micrometeoroid impacts, abrasive lunar dust, and deep freeze / solar baking.',
    physicsReason: 'Micrometeoroids travel at 20 km/s (Mach 58). Ballistic Kevlar and aluminized Mylar dissipate kinetic collision energy before punctures can breach suit vacuum integrity.',
    specs: '14 distinct layers: Orthofabric (Gore-Tex/Nomex), 5 layers aluminized Mylar, Dacron, and Kevlar.'
  },
  {
    id: 'suit-gloves',
    name: 'Phase VI Heated Extravehicular Pressurized Gloves',
    nasaCode: 'EMU Gloves',
    category: 'HANDS_ARMS',
    icon: '🧤',
    locationOnBody: 'Locked to forearm wrist bearings with 360-degree rotation rings',
    primaryFunction: 'Enables high-dexterity grip on rover steering controls and rock hammers while actively heating fingertips.',
    physicsReason: 'Touching freezing metal handrails (-150°C) causes rapid thermal conduction that freezes fingers solid. Electric resistive heaters keep fingertips warm.',
    specs: 'Laser-scanned silicone palm molds, miniature fingertip heating elements, woven brass wire weave.'
  },
  {
    id: 'suit-safer',
    name: 'Simplified Aid for EVA Rescue (SAFER Jetpack)',
    nasaCode: 'SAFER',
    category: 'TORSO_LIFE_SUPPORT',
    icon: '🚀',
    locationOnBody: 'Attached beneath the PLSS backpack for microgravity spacewalks',
    primaryFunction: 'Emergency nitrogen cold-gas thruster propulsion allowing an untethered astronaut to fly back to safety if separated from the spacecraft.',
    physicsReason: 'In microgravity, Newton’s 1st Law means an untethered astronaut who drifts away will keep drifting forever. SAFER provides 3 m/s of Delta-V to maneuver back.',
    specs: '24 cold-gas nitrogen thruster nozzles producing 3.56 N thrust; deployable manual joystick.'
  },
  {
    id: 'suit-boots',
    name: 'Lunar Surface Thermal Traction Overboots',
    nasaCode: 'Lunar Overshoes',
    category: 'LEGS_BOOTS',
    icon: '🥾',
    locationOnBody: 'Slipped over the inner pressure boots on planetary surfaces',
    primaryFunction: 'Provides rugged friction grip on loose regolith slopes and thermally isolates feet from contact with scorching or frozen ground.',
    physicsReason: 'Lunar regolith is composed of crushed glass and volcanic basalt with microscopic jagged razor edges. Without silicone overboots, normal fabric would shred in hours.',
    specs: 'Molded silicone ribbed sole, aluminized insulation layers, titanium lace fasteners.'
  },
  {
    id: 'suit-tether',
    name: 'Braided Stainless Steel D-Ring Safety Tether',
    nasaCode: 'Safety Tether',
    category: 'LEGS_BOOTS',
    icon: '🪢',
    locationOnBody: 'Locked into waist structural D-rings on the suit lower torso',
    primaryFunction: 'Secures astronaut to habitat airlock tie-downs, rover rails, and crane anchors during high-risk crater traverses.',
    physicsReason: 'Prevents falling down steep crater walls or floating away when climbing steep extraterrestrial slopes.',
    specs: '16-meter braided aircraft cable with double-locking carabiner clips and auto-retract reel.'
  },
  {
    id: 'tool-core-drill',
    name: 'Percussive Rotary Core Drill & Vacuum Core Tubes',
    nasaCode: 'CRD Drill',
    category: 'FIELD_TOOLS',
    icon: '🔩',
    locationOnBody: 'Rover tool rack / Handheld deployment',
    primaryFunction: 'Extracts pristine 1 to 2-meter deep cylindrical core samples of subterranean regolith and ancient volatile ice.',
    physicsReason: 'Subsurface core drilling must be rotary-percussive with low friction so mechanical heat does not melt or sublimate fragile cryogenic ice before analysis!',
    specs: 'Titanium drill bit with vacuum-sealed Teflon-lined inner core barrels.'
  },
  {
    id: 'tool-raman',
    name: 'Laser Raman & Fluorescence Spectrometer',
    nasaCode: 'SHERLOC / LCROSS',
    category: 'FIELD_TOOLS',
    icon: '🔬',
    locationOnBody: 'Rover robotic arm / Cadets field science kit',
    primaryFunction: 'Shoots a 532nm green laser into dark crater ice to measure vibrational molecular frequencies and identify organic minerals.',
    physicsReason: 'Different molecular bonds (such as the O-H stretch of water ice at 3,200 cm⁻¹) scatter laser light at characteristic wavelength shifts, proving ice is present without chemical wet-labs.',
    specs: '532 nm pulsed neodymium laser, sub-millimeter spot size, 200–4,000 cm⁻¹ spectral resolution.'
  },
  {
    id: 'tool-hammer',
    name: 'Titanium Geology Hammer & Extension Tongs',
    nasaCode: 'Apollo Hammer',
    category: 'FIELD_TOOLS',
    icon: '🔨',
    locationOnBody: 'Leg-holstered tool scabbard',
    primaryFunction: 'Chips fresh rock samples off impact boulders; 1-meter spring tongs pick up rocks without requiring the astronaut to kneel in stiff suits.',
    physicsReason: 'Pressurized spacesuits take tremendous muscular energy to bend down to the ground. Spring-loaded extension tongs prevent cadet fatigue.',
    specs: 'Drop-forged titanium head with stainless steel handle and wrist lanyard.'
  },
  {
    id: 'tool-sample-flask',
    name: 'Indium Knife-Edge Hermetic Sample Return Flask',
    nasaCode: 'SRC Flask',
    category: 'FIELD_TOOLS',
    icon: '🧪',
    locationOnBody: 'Rover sample caching bay',
    primaryFunction: 'Hermetically seals rock and ice samples in high-vacuum chambers to keep them pristine until Earth laboratory return.',
    physicsReason: 'If lunar samples come into contact with Earth air, oxygen and moisture immediately alter the pristine volatile chemistry. Indium knife-edge cold-welds the seal shut.',
    specs: 'Pure Indium deformable metal gasket, ultra-high vacuum retention (< 10⁻⁸ torr).'
  },
  {
    id: 'tool-neutron-spec',
    name: 'Subsurface Pulsed Neutron Hydration Spectrometer',
    nasaCode: 'PNS Sensor',
    category: 'FIELD_TOOLS',
    icon: '📡',
    locationOnBody: 'Mounted to underside of surface rover chassis',
    primaryFunction: 'Fires pulses of high-energy neutrons into regolith and measures how many bounce back slowed down by hydrogen atoms.',
    physicsReason: 'Hydrogen atoms have the exact same mass as neutrons, so they absorb neutron momentum like billiard balls. Slowed neutrons directly indicate water ice (H2O)!',
    specs: 'Detects hydrogen concentrations as low as 0.1% by weight down to 1.0m underground.'
  },
  {
    id: 'tool-dsn-antenna',
    name: 'High-Gain Ka-Band Deployable Deep Space Antenna',
    nasaCode: 'HGA Mast',
    category: 'FIELD_TOOLS',
    icon: '📶',
    locationOnBody: 'Habitat roof / Rover tracking gimbal',
    primaryFunction: 'Transmits live 4K telemetry, astronaut ECG vitals, and high-volume science data directly to NASA Deep Space Network dishes on Earth.',
    physicsReason: 'High frequency Ka-band provides gigabit data transfer rates across 384,000 km of interplanetary space with minimum attenuation.',
    specs: '0.8-meter parabolic dish with auto-acquisition sun and Earth vector tracking.'
  }
];

interface Lesson {
  id: string;
  number: number;
  title: string;
  icon: string;
  category: string;
  overview: string;
  nasaContext: string;
  interactiveType: 'airlock' | 'sabatier' | 'solar' | 'water' | 'greenhouse' | 'radiation' | 'rover' | 'spectrometer';
  quiz: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
  badgeName: string;
}

const LESSONS: Lesson[] = [
  {
    id: 'lesson-1-safety',
    number: 1,
    title: 'Mission Safety & Airlock Protocol',
    icon: '🛡️',
    category: 'SAFETY & OPERATIONS',
    overview: 'Before any astronaut steps onto lunar regolith, they must execute a 2-stage airlock depressurization to prevent explosive decompression and cabin atmosphere loss.',
    nasaContext: 'NASA Apollo and Artemis flight rules require pre-breathe oxygen cycles to flush nitrogen from the bloodstream and eliminate decompression sickness ("the bends").',
    interactiveType: 'airlock',
    quiz: {
      question: 'Why do astronauts breathe pure oxygen before an EVA (spacewalk)?',
      options: [
        'To speed up their metabolism for heavy lifting',
        'To wash nitrogen out of blood tissues and prevent the bends',
        'To cool down the suit’s internal liquid ventilation garments',
        'To eliminate the need for drinking water during the EVA'
      ],
      correctIndex: 1,
      explanation: 'Pre-breathing 100% O2 eliminates nitrogen gas dissolved in body fluids so it does not form painful or lethal gas bubbles when suit pressure drops.'
    },
    badgeName: 'Safety Officer Patch'
  },
  {
    id: 'lesson-2-life-support',
    number: 2,
    title: 'ECLSS & Closed-Loop Sabatier Chemistry',
    icon: '💨',
    category: 'LIFE SUPPORT SYSTEMS',
    overview: 'In deep space, resupply from Earth is impossible. The Sabatier reactor combines crew exhaled CO2 with hydrogen byproduct to manufacture water and methane fuel.',
    nasaContext: 'The ISS Environmental Control and Life Support System (ECLSS) recovers over 98% of atmospheric water and oxygen using catalytic Sabatier reactions.',
    interactiveType: 'sabatier',
    quiz: {
      question: 'What are the reaction products when Carbon Dioxide (CO2) reacts with Hydrogen (H2) in a Sabatier reactor?',
      options: [
        'Nitrogen gas and liquid ammonia',
        'Methane (CH4) and Water (H2O)',
        'Sulfur dioxide and oxygen',
        'Ozone and solid carbon soot'
      ],
      correctIndex: 1,
      explanation: 'CO2 + 4H2 -> CH4 + 2H2O. The water is condensed and split into breathable oxygen via electrolysis!'
    },
    badgeName: 'ECLSS Specialist Patch'
  },
  {
    id: 'lesson-3-power',
    number: 3,
    title: 'Solar Incidence & Kilopower Storage',
    icon: '⚡',
    category: 'POWER & ENERGY',
    overview: 'Solar arrays at the lunar poles must be tilted perpendicular to low-grazing sun rays. During the 354-hour lunar night, a fission reactor provides continuous thermal power.',
    nasaContext: 'NASA Glenn Research Center tested the KRUSTY Kilopower reactor, capable of generating 1–10 kWe continuously for 10 years without refueling.',
    interactiveType: 'solar',
    quiz: {
      question: 'Why are solar arrays at the lunar South Pole built as tall vertical towers instead of flat ground panels?',
      options: [
        'To avoid getting covered in blowing sand dunes',
        'Because the Sun hugs the horizon at very low grazing angles (1.5°)',
        'To receive high-frequency radio broadcasts from Earth',
        'To provide lightning rods for electrostatic storms'
      ],
      correctIndex: 1,
      explanation: 'At the lunar poles, sunlight arrives nearly parallel to the surface. Vertical panels catch full horizontal sunlight as the Moon slowly rotates!'
    },
    badgeName: 'Power Gridmaster Patch'
  },
  {
    id: 'lesson-4-water',
    number: 4,
    title: 'Water Recovery & Condensate Loops',
    icon: '💧',
    category: 'RESOURCE RECOVERY',
    overview: 'Each crew member requires 3.0 liters of water daily. Vacuum distillation and catalytic oxidation purify crew sweat, exhaled breath, and urine back into pristine potable water.',
    nasaContext: 'NASA Baseline Values and Assumptions Document (BVAD) requires water recovery loops to operate above 95% closure for planetary outposts.',
    interactiveType: 'water',
    quiz: {
      question: 'What is the primary source of recovered water inside a spacecraft cabin?',
      options: [
        'Direct moisture harvested from comet tails',
        'Condensation of crew respiration and perspiration from air filters',
        'Melting lunar rock crystals in an autoclave',
        'Residual moisture in freeze-dried food pouches'
      ],
      correctIndex: 1,
      explanation: 'Astronauts exhale and sweat out over 1.8 liters of moisture every day, which cabin heat exchangers condense and route to purifiers.'
    },
    badgeName: 'Hydrologist Patch'
  },
  {
    id: 'lesson-5-food',
    number: 5,
    title: 'Controlled Environment Hydroponics',
    icon: '🌱',
    category: 'BIO-REGENERATIVE LIFE SUPPORT',
    overview: 'Growing fresh salad crops and dwarf wheat provides vital calories, absorbs toxic CO2, and releases oxygen while boosting crew mental wellbeing.',
    nasaContext: 'NASA Kennedy Space Center Vegetable Production System (Veggie) and Advanced Plant Habitat (APH) grow mizuna mustard and dwarf wheat on the ISS.',
    interactiveType: 'greenhouse',
    quiz: {
      question: 'Which light wavelengths are most efficiently absorbed by plant chlorophyll for photosynthesis?',
      options: [
        'Green and yellow light',
        'Red (660 nm) and Blue (450 nm) spectrums',
        'Pure ultraviolet radiation',
        'Infrared heat rays only'
      ],
      correctIndex: 1,
      explanation: 'Chlorophyll A and B pigments absorb red and blue photon bands for maximum photosynthetic biomass conversion, which is why space greenhouses glow magenta!'
    },
    badgeName: 'Astro-Botanist Patch'
  },
  {
    id: 'lesson-6-radiation',
    number: 6,
    title: 'Radiation Shielding & Regolith Vaults',
    icon: '☢️',
    category: 'ENVIRONMENTAL HAZARDS',
    overview: 'Without Earth’s magnetosphere, astronauts are exposed to Galactic Cosmic Rays (GCR) and Solar Particle Events (SPE). 1.5 to 2 meters of sintered regolith provides biological shielding.',
    nasaContext: 'NASA guidelines adhere to the ALARA principle (As Low As Reasonably Achievable). The safe career radiation limit is 600 mSv; unrestrained lunar surface dose is ~1.5 mSv/day.',
    interactiveType: 'radiation',
    quiz: {
      question: 'Why is hydrogen-rich regolith or polyethylene better than heavy lead for cosmic ray shielding?',
      options: [
        'Lead melts instantly in the vacuum of space',
        'Light elements minimize secondary neutron spallation radiation',
        'Heavy metals attract high-voltage solar flares like magnets',
        'Polyethylene glows in the dark to illuminate the habitat'
      ],
      correctIndex: 1,
      explanation: 'When energetic cosmic rays strike heavy nucleus atoms like lead, they shatter the nuclei into dangerous secondary neutron showers. Light hydrogen atoms safely absorb ions!'
    },
    badgeName: 'Radiation Marshal Patch'
  },
  {
    id: 'lesson-7-rover',
    number: 7,
    title: 'Surface Rover Driving & Terrain Slip',
    icon: '🚜',
    category: 'SURFACE MOBILITY',
    overview: 'Navigating craters in 1/6th gravity requires careful speed management. Wheels can easily slip in loose regolith powder, and sharp crater slopes risk rollover.',
    nasaContext: 'The Apollo Lunar Roving Vehicle (LRV) traveled up to 18 km/h using woven zinc-coated piano wire wheels with titanium chevrons for regolith traction.',
    interactiveType: 'rover',
    quiz: {
      question: 'Why do lunar rovers use open mesh wire tires rather than standard pressurized rubber tires?',
      options: [
        'Rubber would degrade and explode under extreme thermal swings (-150°C to +120°C) and vacuum',
        'Wire mesh looks more futuristic in NASA photographs',
        'Wire wheels allow the rover to float on lunar lakes',
        'Rubber tires are too heavy to launch into space'
      ],
      correctIndex: 0,
      explanation: 'In the vacuum of space and severe thermal swings (-150°C to +120°C), traditional pressurized rubber tires would become brittle, freeze, or burst.'
    },
    badgeName: 'Master Navigator Patch'
  },
  {
    id: 'lesson-8-science',
    number: 8,
    title: 'Sample Collection & Spectrometry',
    icon: '🔬',
    category: 'PLANETARY SCIENCE',
    overview: 'Identifying water ice deposits hidden inside Permanently Shadowed Regions (PSRs) requires reflectance spectroscopy and neutron spectrometers.',
    nasaContext: 'NASA’s Lunar Crater Observation and Sensing Satellite (LCROSS) confirmed the presence of volatile water ice (up to 5.6% by weight) in Cabeus crater.',
    interactiveType: 'spectrometer',
    quiz: {
      question: 'What tool does NASA use to detect subterranean hydrogen and water ice from orbit or surface rovers?',
      options: [
        'Acoustic sound wave microphones',
        'Neutron Spectrometers that detect slowed neutron signatures',
        'Metal detectors tuned to iron resonance',
        'Thermal thermometers lowered on fishing lines'
      ],
      correctIndex: 1,
      explanation: 'Cosmic rays knock neutrons out of the regolith. If hydrogen (from water ice) is present, it efficiently slows down those neutrons, creating a clear spectral signature.'
    },
    badgeName: 'Planetary Geologist Patch'
  }
];

export type AcademyUnifiedTab =
  | 'CURRICULUM'
  | 'RANKS_HIERARCHY'
  | 'EARTH_ACADEMY'
  | 'SPACESUIT_EQUIPMENT'
  | 'SPACE_ACADEMY'
  | 'ACADEMY_30_MISSIONS'
  | 'NASA_76_CAMPAIGN'
  | 'VEHICLE_HANGAR';

export interface AstronautAcademyModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: AcademyUnifiedTab;
  completedMissions?: string[];
  onLaunchMission?: (missionId: string) => void;
  onOpenComics?: () => void;
  onOpenClassroom?: () => void;
  onOpenDepot?: () => void;
  isFullPage?: boolean;
}

export const AstronautAcademyModal: React.FC<AstronautAcademyModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'CURRICULUM',
  completedMissions = [],
  onLaunchMission,
  onOpenComics,
  onOpenClassroom,
  onOpenDepot,
  isFullPage = false,
}) => {
  const [progression, setProgression] = useState(getCadetProgression);
  const [selectedLessonId, setSelectedLessonId] = useState<string>(LESSONS[0].id);

  // Unified Top Navigation Tab: Ground School, Ranks, Exam, Spacesuit, 30 Progressive Missions, 76 Campaign, Hangar
  const [activeTab, setActiveTab] = useState<AcademyUnifiedTab>(initialTab);
  const [selectedRankForDetail, setSelectedRankForDetail] = useState<AstronautRank | null>(null);

  // 30 Progressive Missions Filter States
  const [missionLevelFilter, setMissionLevelFilter] = useState<'ALL' | 'CADET' | 'OFFICER' | 'SENIOR' | 'COMMANDER' | 'MASTER'>('ALL');
  const [missionDestFilter, setMissionDestFilter] = useState<string>('ALL');
  const [missionSearchQuery, setMissionSearchQuery] = useState('');
  const [selectedTrailerMission, setSelectedTrailerMission] = useState<NasaLevelMission | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleConfig>(NASA_VEHICLES[0]);
  const [isTrailerAudioMuted, setIsTrailerAudioMuted] = useState(false);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab, isOpen]);

  // Spacesuit & Equipment Filter States
  const [suitViewMode, setSuitViewMode] = useState<'3D_SIMULATOR' | 'CATALOG'>('3D_SIMULATOR');
  const [suitFilter, setSuitFilter] = useState<'ALL' | 'HEAD_HELMET' | 'TORSO_LIFE_SUPPORT' | 'HANDS_ARMS' | 'LEGS_BOOTS' | 'FIELD_TOOLS'>('ALL');
  const [suitSearch, setSuitSearch] = useState('');

  // Earth Candidate Certification Exam State
  const [earthAnswers, setEarthAnswers] = useState<Record<number, number>>({});
  const [earthSubmitted, setEarthSubmitted] = useState(false);
  const [hasPassedEarth, setHasPassedEarth] = useState<boolean>(() => {
    try {
      return localStorage.getItem('astro_camp_earth_academy_passed') === 'true';
    } catch {
      return false;
    }
  });

  // Mini-simulation states for all 8 curriculum modules
  const [airlockPressure, setAirlockPressure] = useState(101); // kPa (101 -> 0)
  const [isAirlockPumping, setIsAirlockPumping] = useState(false);
  const [sabatierTemp, setSabatierTemp] = useState(400); // °C (300 -> 550)
  const [panelAngle, setPanelAngle] = useState(45); // degrees
  const [waterDistillRate, setWaterDistillRate] = useState(98); // % recovery closure
  const [cropLightMode, setCropLightMode] = useState<'photosynthetic' | 'photoperiod' | 'germination'>('photosynthetic');
  const [regolithDepth, setRegolithDepth] = useState(50); // cm
  const [roverSlope, setRoverSlope] = useState(12); // degrees slope
  const [isLaserPulsing, setIsLaserPulsing] = useState(false);
  const [spectrometerTarget, setSpectrometerTarget] = useState<'shackleton_psr' | 'regolith_matrix' | 'anorthosite'>('shackleton_psr');
  const [selectedQuizAnswer, setSelectedQuizAnswer] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  useEffect(() => {
    setProgression(getCadetProgression());
  }, [isOpen]);

  const activeLesson = LESSONS.find((l) => l.id === selectedLessonId) || LESSONS[0];
  const isLessonCompleted = progression.completedLessons.includes(activeLesson.id);

  if (!isOpen && !isFullPage) return null;

  const handleSelectLesson = (id: string) => {
    setSelectedLessonId(id);
    setSelectedQuizAnswer(null);
    setQuizSubmitted(false);
    setAirlockPressure(101);
    setIsAirlockPumping(false);
    setIsLaserPulsing(false);
    soundFx.playClick(750);
  };

  const handleRunAirlock = () => {
    setIsAirlockPumping(true);
    soundFx.playRadioChirp();
    const interval = setInterval(() => {
      setAirlockPressure((prev) => {
        if (prev <= 5) {
          clearInterval(interval);
          setIsAirlockPumping(false);
          soundFx.playTelemetryChirp();
          return 0;
        }
        return prev - 15;
      });
    }, 200);
  };

  const handleSubmitQuiz = () => {
    if (selectedQuizAnswer === null) return;
    setQuizSubmitted(true);
    const isCorrect = selectedQuizAnswer === activeLesson.quiz.correctIndex;
    if (isCorrect) {
      soundFx.playTelemetryChirp();
      const updated = recordLessonCompletion(activeLesson.id, 50);
      setProgression(updated);
    } else {
      soundFx.playImpact();
    }
  };

  // Earth Academy 4-Question Qualifying Exam
  const EARTH_EXAM = [
    {
      q: '1. What educational degree is an absolute prerequisite to apply as a NASA Astronaut Candidate (ASCAN)?',
      opts: [
        'A high school diploma with honors in athletics',
        'A Master’s degree in a STEM field (Science, Tech, Engineering, or Math)',
        'Commercial airline pilot license with 10 years experience',
        'A university degree in public relations or journalism'
      ],
      correct: 1,
      why: 'NASA requires a Master of Science in a recognized STEM discipline along with 3 years of professional experience or 1,000 jet pilot hours.'
    },
    {
      q: '2. In the 6.2-million-gallon Houston Neutral Buoyancy Lab (NBL), what is the training ratio for spacewalks?',
      opts: [
        '1 hour in the pool = 10 minutes in orbit',
        '7 hours underwater in pool = 1 hour of spacewalk (EVA) in orbit',
        'Astronauts only swim once a month for recreation',
        'Underwater training is only for navy submarine officers'
      ],
      correct: 1,
      why: 'For every single hour an astronaut spends outside the airlock in space, they must log 7 grueling hours underwater in 140 kg spacesuits.'
    },
    {
      q: '3. Why must astronauts pre-breathe 100% pure oxygen before opening the airlock for an EVA?',
      opts: [
        'To wash nitrogen gas out of blood tissues and eliminate decompression sickness ("the bends")',
        'To speed up blood circulation so they feel warmer',
        'To sterilize their internal lungs against bacteria',
        'Because space suits cannot store oxygen'
      ],
      correct: 0,
      why: 'The habitat is at 101.3 kPa, but spacesuits operate at 29.6 kPa. Rapid pressure drops cause dissolved nitrogen in blood to boil into painful, fatal bubbles without pre-breathing O2.'
    },
    {
      q: '4. During launch and atmospheric re-entry, how do astronauts prevent G-induced blackout (G-LOC) under 4G–9G forces?',
      opts: [
        'Closing their eyes and holding their breath',
        'Anti-G Straining Maneuver (AGSM) and centrifuge high-G conditioning',
        'Loosening suit chest straps to allow free blood flow',
        'Drinking caffeinated energy drinks before ignition'
      ],
      correct: 1,
      why: 'Centrifuge training teaches astronauts to tense lower abdominal and leg muscles (AGSM) to physically force blood up to the brain under heavy gravitational acceleration.'
    }
  ];

  const handleGradeEarthExam = () => {
    let score = 0;
    EARTH_EXAM.forEach((item, idx) => {
      if (earthAnswers[idx] === item.correct) score++;
    });
    setEarthSubmitted(true);
    if (score >= 3) {
      soundFx.playReactorStart();
      setHasPassedEarth(true);
      try {
        localStorage.setItem('astro_camp_earth_academy_passed', 'true');
      } catch (e) {
        console.warn(e);
      }
    } else {
      soundFx.playImpact();
    }
  };

  const filteredSuitParts = SPACESUIT_PARTS.filter((part) => {
    const matchesCat = suitFilter === 'ALL' || part.category === suitFilter;
    const matchesSearch = suitSearch === '' || 
      part.name.toLowerCase().includes(suitSearch.toLowerCase()) ||
      part.nasaCode.toLowerCase().includes(suitSearch.toLowerCase()) ||
      part.primaryFunction.toLowerCase().includes(suitSearch.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const modalBody = (
    <div
      className={isFullPage ? "academy-fullpage-panel" : "modal-container"}
      onClick={(e) => e.stopPropagation()}
      style={isFullPage ? {
        maxWidth: '1360px',
        width: '100%',
        margin: '0 auto',
        backgroundColor: 'var(--color-paper-2)',
        border: 'var(--rule-hair)',
        borderRadius: '4px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      } : {
        maxWidth: '1120px',
        width: '96vw',
        maxHeight: '94vh',
        overflowY: 'auto',
        backgroundColor: 'var(--color-paper-2)',
        border: 'var(--rule-hair)',
        borderRadius: 0,
      }}
    >
      {/* Top Header */}
      <div className="modal-header" style={{ borderBottom: 'var(--rule-hair)', padding: '16px 24px', background: 'var(--color-paper-2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ padding: '8px', border: 'var(--rule-hair)', background: 'var(--color-paper-3)' }}>
            <GraduationCap size={22} color="var(--color-accent)" />
          </div>
          <div>
            <div style={{ fontSize: '10px', color: 'var(--color-accent)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
              NASA ASTRONAUT CANDIDATE TRAINING CORPS (ASCAN)
            </div>
            <h2 className="modal-title" style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-ink)' }}>
              Astronaut Academy: Earth Ground Training &amp; Space Flight Academy
            </h2>
          </div>
        </div>
        {!isFullPage && (
          <button onClick={onClose} className="modal-close-btn" style={{ borderRadius: 0, border: 'var(--rule-hair)' }}>
            <X size={18} />
          </button>
        )}
      </div>

        {/* Master Navigation Strip: Ground School & Missions in One Unified Section */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--color-paper)',
            borderBottom: 'var(--rule-hair)',
            padding: '8px 16px',
            gap: '8px',
            overflowX: 'auto',
            whiteSpace: 'nowrap',
            scrollbarWidth: 'thin',
          }}
        >
          {/* Group 1: Ground School & Training */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-accent)', letterSpacing: '0.08em', padding: '0 4px', fontFamily: 'var(--font-mono)' }}>
              SCHOOL:
            </span>

            <button
              onClick={() => { setActiveTab('CURRICULUM'); soundFx.playClick(650); }}
              style={{
                padding: '6px 12px',
                borderRadius: 0,
                border: activeTab === 'CURRICULUM' ? '1px solid var(--color-accent)' : 'var(--rule-hair)',
                backgroundColor: activeTab === 'CURRICULUM' ? 'var(--color-paper-3)' : 'transparent',
                color: activeTab === 'CURRICULUM' ? 'var(--color-accent)' : 'var(--color-muted)',
                fontSize: '11px',
                fontWeight: 700,
                fontFamily: 'var(--font-mono)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
              }}
            >
              <BookOpen size={13} />
              <span>Curriculum (8 Modules)</span>
            </button>

            <button
              id="academy-tab-ranks"
              onClick={() => { setActiveTab('RANKS_HIERARCHY'); soundFx.playClick(850); }}
              style={{
                padding: '6px 12px',
                borderRadius: 0,
                border: activeTab === 'RANKS_HIERARCHY' ? '1px solid var(--color-accent)' : 'var(--rule-hair)',
                backgroundColor: activeTab === 'RANKS_HIERARCHY' ? 'var(--color-paper-3)' : 'transparent',
                color: activeTab === 'RANKS_HIERARCHY' ? 'var(--color-accent)' : 'var(--color-muted)',
                fontSize: '11px',
                fontWeight: 700,
                fontFamily: 'var(--font-mono)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
              }}
            >
              <Award size={13} />
              <span>Ranks &amp; Levels</span>
              <span style={{ fontSize: '9px', padding: '1px 5px', backgroundColor: 'var(--color-paper-2)', border: 'var(--rule-hair)', color: 'var(--color-accent)', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                LV.{getCurrentRank(progression.xp).level}
              </span>
            </button>

            <button
              onClick={() => { setActiveTab('EARTH_ACADEMY'); soundFx.playClick(750); }}
              style={{
                padding: '6px 12px',
                borderRadius: 0,
                border: activeTab === 'EARTH_ACADEMY' ? '1px solid var(--color-accent)' : 'var(--rule-hair)',
                backgroundColor: activeTab === 'EARTH_ACADEMY' ? 'var(--color-paper-3)' : 'transparent',
                color: activeTab === 'EARTH_ACADEMY' ? 'var(--color-accent-green)' : 'var(--color-muted)',
                fontSize: '11px',
                fontWeight: 700,
                fontFamily: 'var(--font-mono)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
              }}
            >
              <Globe size={13} />
              <span>Earth Exam</span>
              {hasPassedEarth && <span style={{ fontSize: '9px', padding: '1px 5px', backgroundColor: 'var(--color-paper-2)', border: '1px solid var(--color-accent-green)', color: 'var(--color-accent-green)', fontWeight: 700 }}>PASS</span>}
            </button>

            <button
              onClick={() => { setActiveTab('SPACESUIT_EQUIPMENT'); soundFx.playClick(700); }}
              style={{
                padding: '6px 12px',
                borderRadius: 0,
                border: activeTab === 'SPACESUIT_EQUIPMENT' ? '1px solid var(--color-accent)' : 'var(--rule-hair)',
                backgroundColor: activeTab === 'SPACESUIT_EQUIPMENT' ? 'var(--color-paper-3)' : 'transparent',
                color: activeTab === 'SPACESUIT_EQUIPMENT' ? 'var(--color-accent)' : 'var(--color-muted)',
                fontSize: '11px',
                fontWeight: 700,
                fontFamily: 'var(--font-mono)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
              }}
            >
              <Shield size={13} />
              <span>Spacesuit Lab</span>
            </button>
          </div>

          <div style={{ width: '1px', height: '20px', backgroundColor: 'var(--rule-subtle)', margin: '0 4px' }} />

          {/* Group 2: Missions & Flight Operations */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-accent)', letterSpacing: '0.08em', padding: '0 4px', fontFamily: 'var(--font-mono)' }}>
              MISSIONS:
            </span>

            <button
              onClick={() => { setActiveTab('ACADEMY_30_MISSIONS'); soundFx.playClick(850); }}
              style={{
                padding: '6px 12px',
                borderRadius: 0,
                border: activeTab === 'ACADEMY_30_MISSIONS' ? '1px solid var(--color-accent)' : 'var(--rule-hair)',
                backgroundColor: activeTab === 'ACADEMY_30_MISSIONS' ? 'var(--color-paper-3)' : 'transparent',
                color: activeTab === 'ACADEMY_30_MISSIONS' ? 'var(--color-accent)' : 'var(--color-muted)',
                fontSize: '11px',
                fontWeight: 700,
                fontFamily: 'var(--font-mono)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
              }}
            >
              <Target size={13} />
              <span>30 Progressive Missions</span>
            </button>

            <button
              onClick={() => { setActiveTab('NASA_76_CAMPAIGN'); soundFx.playClick(900); }}
              style={{
                padding: '6px 12px',
                borderRadius: 0,
                border: activeTab === 'NASA_76_CAMPAIGN' ? '1px solid var(--color-accent)' : 'var(--rule-hair)',
                backgroundColor: activeTab === 'NASA_76_CAMPAIGN' ? 'var(--color-paper-3)' : 'transparent',
                color: activeTab === 'NASA_76_CAMPAIGN' ? 'var(--color-accent-amber)' : 'var(--color-muted)',
                fontSize: '11px',
                fontWeight: 700,
                fontFamily: 'var(--font-mono)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
              }}
            >
              <Rocket size={13} />
              <span>76 NASA Campaign</span>
            </button>

            <button
              onClick={() => { setActiveTab('VEHICLE_HANGAR'); soundFx.playClick(800); }}
              style={{
                padding: '6px 12px',
                borderRadius: 0,
                border: activeTab === 'VEHICLE_HANGAR' ? '1px solid var(--color-accent)' : 'var(--rule-hair)',
                backgroundColor: activeTab === 'VEHICLE_HANGAR' ? 'var(--color-paper-3)' : 'transparent',
                color: activeTab === 'VEHICLE_HANGAR' ? 'var(--color-accent-2)' : 'var(--color-muted)',
                fontSize: '11px',
                fontWeight: 700,
                fontFamily: 'var(--font-mono)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
              }}
            >
              <Compass size={13} />
              <span>Spacecraft Hangar</span>
            </button>
          </div>
        </div>

        {/* Cadet Progression Strip (Only in Curriculum tab) */}
        {activeTab === 'CURRICULUM' && (
          <div
            style={{
              padding: '12px 24px',
              backgroundColor: 'rgba(15, 23, 42, 0.85)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Award size={18} className="text-amber-400" />
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#e2e8f0' }}>
                Cadet XP:{' '}
                <span style={{ color: '#fbbf24', fontFamily: 'monospace', fontWeight: 800 }}>{progression.xp}</span>
              </span>
              <span style={{ color: '#64748b' }}>·</span>
              <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                Modules Completed:{' '}
                <span style={{ color: '#43ffa0', fontWeight: 700 }}>{progression.completedLessons.length} / {LESSONS.length}</span>
              </span>
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              {LESSONS.map((l) => {
                const done = progression.completedLessons.includes(l.id);
                return (
                  <span
                    key={l.id}
                    title={`${l.title}: ${done ? 'Completed' : 'Pending'}`}
                    style={{
                      display: 'inline-block',
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      backgroundColor: done ? '#43ffa0' : 'rgba(255,255,255,0.15)',
                      boxShadow: done ? '0 0 8px rgba(67, 255, 160, 0.6)' : 'none',
                    }}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* ── TAB 1: CURRICULUM (8 MODULES) ── */}
        {activeTab === 'CURRICULUM' && (
        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', minHeight: '520px' }}>
          {/* Left Lesson List Navigation */}
          <div
            style={{
              backgroundColor: 'rgba(10, 15, 26, 0.95)',
              borderRight: '1px solid rgba(255, 255, 255, 0.08)',
              padding: '14px 10px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', paddingLeft: '8px', marginBottom: '4px' }}>
              Training Modules
            </div>
            {LESSONS.map((lesson) => {
              const active = lesson.id === activeLesson.id;
              const completed = progression.completedLessons.includes(lesson.id);
              return (
                <button
                  key={lesson.id}
                  onClick={() => handleSelectLesson(lesson.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: active ? '1px solid rgba(167, 139, 250, 0.6)' : '1px solid transparent',
                    backgroundColor: active ? 'rgba(167, 139, 250, 0.15)' : 'transparent',
                    color: active ? '#ffffff' : '#94a3b8',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: 'var(--radius-card)', background: 'var(--color-paper-2)', border: 'var(--rule-hair) solid var(--color-rule)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {getLessonIcon(lesson.interactiveType)}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.78rem', fontWeight: active ? 700 : 500, lineHeight: 1.2 }}>
                        {lesson.title}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: '#64748b', fontFamily: 'var(--font-mono)' }}>Module #{lesson.number}</div>
                    </div>
                  </div>
                  {completed ? (
                    <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                  ) : (
                    <ChevronRight size={14} className="text-slate-600 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Right Lesson Detail & Mini-Simulation */}
          <div style={{ padding: '24px', backgroundColor: '#070b13' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
              <div>
                <span
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    color: 'var(--color-accent)',
                    backgroundColor: 'var(--color-paper-2)',
                    border: 'var(--rule-hair) solid var(--color-rule)',
                    padding: '3px 8px',
                    borderRadius: 'var(--radius-card)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {activeLesson.category}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-card)', background: 'var(--color-paper-2)', border: 'var(--rule-hair) solid var(--color-rule)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {getLessonIcon(activeLesson.interactiveType)}
                  </div>
                  <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#f1f5f9', margin: 0, fontFamily: 'var(--font-space)' }}>
                    {activeLesson.title}
                  </h3>
                </div>
              </div>

              {isLessonCompleted && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    color: '#43ffa0',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                  }}
                >
                  <Award size={14} />
                  <span>{activeLesson.badgeName} Unlocked!</span>
                </div>
              )}
            </div>

            <p style={{ fontSize: '0.9rem', color: '#cbd5e1', lineHeight: 1.6, marginBottom: '16px' }}>
              {activeLesson.overview}
            </p>

            {/* NASA Research Box */}
            <div
              style={{
                backgroundColor: 'rgba(56, 189, 248, 0.08)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                borderRadius: '10px',
                padding: '12px 16px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
              }}
            >
              <BookOpen size={18} className="text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase' }}>
                  NASA Technical Heritage &amp; Science Context
                </div>
                <div style={{ fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.45, marginTop: '2px' }}>
                  {activeLesson.nasaContext}
                </div>
              </div>
            </div>

            {/* Interactive Demonstration Widget */}
            <div
              style={{
                backgroundColor: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '22px',
              }}
            >
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#e2e8f0', textTransform: 'uppercase', marginBottom: '10px' }}>
                Interactive Hands-On Demonstration
              </div>

              {/* MODULE 1: AIRLOCK PROTOCOL */}
              {activeLesson.interactiveType === 'airlock' && (
                <div>
                  {/* Schematic Cross-Section Diagram */}
                  <div style={{ backgroundColor: '#030712', borderRadius: '10px', padding: '14px', border: '1px solid rgba(56, 189, 248, 0.25)', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      <span>Airlock ΔP Differential Pressure Schematic</span>
                      <span style={{ color: airlockPressure === 0 ? '#43ffa0' : '#38bdf8', fontWeight: 700 }}>
                        {airlockPressure === 0 ? 'STATUS: VACUUM CLEARED' : 'STATUS: PRESSURIZED'}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr 1fr', gap: '8px', alignItems: 'stretch' }}>
                      {/* Habitat Section */}
                      <div style={{ padding: '12px 8px', borderRadius: 'var(--radius-card)', backgroundColor: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.3)', textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '6px' }}>
                          <Building2 size={22} className="text-sky-400" />
                        </div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38bdf8' }}>Habitat Core</div>
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontFamily: 'monospace' }}>101.3 kPa</div>
                        <div style={{ fontSize: '0.62rem', color: '#22c55e', marginTop: '4px', fontWeight: 600 }}>Inner Hatch: LOCKED</div>
                      </div>

                      {/* Airlock Chamber Section */}
                      <div style={{ padding: '12px 8px', borderRadius: 'var(--radius-card)', backgroundColor: isAirlockPumping ? 'rgba(234, 179, 8, 0.15)' : airlockPressure === 0 ? 'rgba(34, 197, 94, 0.12)' : 'rgba(168, 85, 247, 0.12)', border: '1px solid rgba(168, 85, 247, 0.3)', textAlign: 'center', position: 'relative' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '6px' }}>
                          <RefreshCw size={22} className={`text-purple-400 ${isAirlockPumping ? 'animate-spin' : ''}`} />
                        </div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#c084fc' }}>Cycle Chamber</div>
                        <div style={{ fontSize: '0.9rem', color: airlockPressure === 0 ? '#43ffa0' : '#fbbf24', fontFamily: 'monospace', fontWeight: 800 }}>
                          {airlockPressure} kPa
                        </div>
                        <div style={{ fontSize: '0.62rem', color: '#94a3b8', marginTop: '4px' }}>
                          {isAirlockPumping ? 'Pumping N2/O2...' : airlockPressure === 0 ? 'EVA Ready' : 'Atmosphere Sealed'}
                        </div>
                      </div>

                      {/* Lunar Vacuum Section */}
                      <div style={{ padding: '12px 8px', borderRadius: 'var(--radius-card)', backgroundColor: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255, 255, 255, 0.15)', textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '6px' }}>
                          <Globe size={22} className="text-slate-400" />
                        </div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f8fafc' }}>Lunar Surface</div>
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontFamily: 'monospace' }}>0.0 kPa (Hard Vac)</div>
                        <div style={{ fontSize: '0.62rem', color: airlockPressure === 0 ? '#43ffa0' : '#ef4444', marginTop: '4px', fontWeight: 600 }}>
                          {airlockPressure === 0 ? 'Outer Hatch: OPEN' : 'Outer Hatch: SEALED'}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Airlock Internal Pressure:</span>
                    <span style={{ fontSize: '1.1rem', fontFamily: 'monospace', fontWeight: 800, color: airlockPressure === 0 ? '#43ffa0' : '#38bdf8' }}>
                      {airlockPressure} kPa {airlockPressure === 0 ? '(VACUUM / SAFE TO CYCLE)' : '(PRESSURIZED)'}
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '8px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '999px', overflow: 'hidden', marginBottom: '12px' }}>
                    <div style={{ width: `${(airlockPressure / 101) * 100}%`, height: '100%', backgroundColor: airlockPressure === 0 ? '#43ffa0' : '#38bdf8', transition: 'width 0.2s ease' }} />
                  </div>
                  <button
                    onClick={handleRunAirlock}
                    disabled={isAirlockPumping || airlockPressure === 0}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 'var(--radius-card)',
                      backgroundColor: airlockPressure === 0 ? '#10b981' : '#0284c7',
                      color: '#ffffff',
                      border: 'none',
                      fontWeight: 700,
                      cursor: airlockPressure === 0 ? 'default' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <Play size={14} />
                    <span>{airlockPressure === 0 ? 'Airlock Depressurized (Ready for Spacewalk)' : isAirlockPumping ? 'Pumping Atmosphere to Recovery Tanks...' : 'Execute Depressurization Pump Cycle'}</span>
                  </button>
                </div>
              )}

              {/* MODULE 2: SABATIER CLOSED-LOOP CHEMISTRY */}
              {activeLesson.interactiveType === 'sabatier' && (
                <div>
                  <div style={{ backgroundColor: '#030712', borderRadius: 'var(--radius-card)', padding: '14px', border: '1px solid rgba(234, 179, 8, 0.3)', marginBottom: '12px' }}>
                    <div style={{ fontSize: '0.72rem', color: '#fbbf24', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '8px' }}>
                      Sabatier Catalytic Reactor Flow Loop (CO2 + 4H2 → CH4 + 2H2O)
                    </div>
                    {/* Visual Reactor Pipeline */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1.3fr auto 1.2fr', alignItems: 'center', gap: '6px' }}>
                      <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', padding: '10px 8px', borderRadius: 'var(--radius-card)', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>INLET GAS</div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#f8fafc' }}>CO₂ + 4 H₂</div>
                        <div style={{ fontSize: '0.62rem', color: '#38bdf8' }}>Crew Respiration</div>
                      </div>
                      <ChevronRight size={18} className="text-amber-400" />
                      <div style={{ backgroundColor: sabatierTemp >= 380 && sabatierTemp <= 440 ? 'rgba(234, 179, 8, 0.2)' : 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(234, 179, 8, 0.5)', padding: '10px 8px', borderRadius: 'var(--radius-card)', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.7rem', color: '#fbbf24', fontWeight: 700 }}>CATALYST BED</div>
                        <div style={{ fontSize: '0.92rem', fontWeight: 900, fontFamily: 'monospace', color: '#ffffff' }}>{sabatierTemp}°C (Ru/Al₂O₃)</div>
                        <div style={{ fontSize: '0.62rem', color: sabatierTemp >= 380 && sabatierTemp <= 440 ? '#43ffa0' : '#f87171' }}>
                          {sabatierTemp >= 380 && sabatierTemp <= 440 ? 'Optimal Stoichiometry (98.4%)' : 'Sub-Optimal Conversion'}
                        </div>
                      </div>
                      <ChevronRight size={18} className="text-amber-400" />
                      <div style={{ backgroundColor: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.3)', padding: '10px 8px', borderRadius: 'var(--radius-card)', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.7rem', color: '#38bdf8' }}>OUTLETS</div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#43ffa0' }}>2 H₂O (Potable)</div>
                        <div style={{ fontSize: '0.68rem', color: '#fbbf24' }}>+ CH₄ (Methane Vent)</div>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Reactor Catalyst Bed Temperature:</span>
                    <span style={{ fontSize: '1rem', fontFamily: 'monospace', fontWeight: 800, color: sabatierTemp >= 380 && sabatierTemp <= 440 ? '#43ffa0' : '#fbbf24' }}>
                      {sabatierTemp} °C (NASA Target: 400°C)
                    </span>
                  </div>
                  <input
                    type="range"
                    min="250"
                    max="550"
                    value={sabatierTemp}
                    onChange={(e) => setSabatierTemp(parseInt(e.target.value, 10))}
                    style={{ width: '100%', accentColor: '#fbbf24', cursor: 'pointer' }}
                  />
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '6px' }}>
                    Calculated Water Recovery: <span style={{ color: '#38bdf8', fontWeight: 700 }}>{(1.0 * (1 - Math.abs(sabatierTemp - 400) / 400)).toFixed(2)} L/sol potable moisture</span> recovered.
                  </div>
                </div>
              )}

              {/* MODULE 3: SOLAR INCIDENCE & KILOPOWER */}
              {activeLesson.interactiveType === 'solar' && (
                <div>
                  <div style={{ backgroundColor: '#030712', borderRadius: 'var(--radius-card)', padding: '14px', border: '1px solid rgba(251, 191, 36, 0.3)', marginBottom: '12px' }}>
                    <div style={{ fontSize: '0.72rem', color: '#fbbf24', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '6px' }}>
                      Lunar South Pole Solar Incidence Geometry
                    </div>
                    {/* Visual Diagram of Solar Mast */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-card)' }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '4px' }}>
                          <Sun size={24} className="text-amber-400" />
                        </div>
                        <div style={{ fontSize: '0.68rem', color: '#fbbf24' }}>Sun Vector (1.5° Horiz.)</div>
                      </div>
                      <div style={{ flex: 1, height: '2px', backgroundColor: 'rgba(251, 191, 36, 0.4)', margin: '0 12px', position: 'relative' }}>
                        <div style={{ position: 'absolute', right: 0, top: '-4px', width: '8px', height: '8px', borderRight: '2px solid #fbbf24', borderTop: '2px solid #fbbf24', transform: 'rotate(45deg)' }} />
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-block', width: '6px', height: '36px', backgroundColor: '#38bdf8', transform: `rotate(${panelAngle - 45}deg)`, transition: 'transform 0.1s ease' }} />
                        <div style={{ fontSize: '0.68rem', color: '#38bdf8', marginTop: '4px' }}>Solar Mast: {panelAngle}°</div>
                      </div>
                      <div style={{ textAlign: 'right', paddingLeft: '16px' }}>
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>EFFICIENCY</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800, fontFamily: 'monospace', color: '#43ffa0' }}>
                          {Math.round(Math.sin((panelAngle * Math.PI) / 180) * 100)}%
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Panel Tracking Angle: {panelAngle}°</span>
                    <span style={{ fontSize: '1rem', fontFamily: 'monospace', fontWeight: 800, color: '#fbbf24' }}>
                      Electrical Output: {Math.round(35 * Math.sin((panelAngle * Math.PI) / 180))} kW
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="90"
                    value={panelAngle}
                    onChange={(e) => setPanelAngle(parseInt(e.target.value, 10))}
                    style={{ width: '100%', accentColor: '#fbbf24', cursor: 'pointer' }}
                  />
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '6px' }}>
                    Tuning angle perpendicular to solar vectors maximizes photon collision flux on photovoltaic cells!
                  </div>
                </div>
              )}

              {/* MODULE 4: WATER RECOVERY LOOP */}
              {activeLesson.interactiveType === 'water' && (
                <div>
                  <div style={{ backgroundColor: '#030712', borderRadius: 'var(--radius-card)', padding: '14px', border: '1px solid rgba(56, 189, 248, 0.3)', marginBottom: '12px' }}>
                    <div style={{ fontSize: '0.72rem', color: '#38bdf8', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '8px' }}>
                      Vapor Compression Distillation (VCD) & Catalytic Purifier
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                      <div style={{ backgroundColor: 'rgba(234, 179, 8, 0.1)', border: '1px solid rgba(234, 179, 8, 0.3)', padding: '10px', borderRadius: 'var(--radius-card)', textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '4px' }}>
                          <Droplets size={20} className="text-amber-400" />
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#fbbf24', fontWeight: 700 }}>Graywater Inflow</div>
                        <div style={{ fontSize: '0.8rem', fontFamily: 'monospace', color: '#e2e8f0', marginTop: '2px' }}>3.2 L/Sol/Crew</div>
                      </div>
                      <div style={{ backgroundColor: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.3)', padding: '10px', borderRadius: 'var(--radius-card)', textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '4px' }}>
                          <Activity size={20} className="text-purple-400" />
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#c084fc', fontWeight: 700 }}>VCD Centrifuge</div>
                        <div style={{ fontSize: '0.8rem', fontFamily: 'monospace', color: '#43ffa0', marginTop: '2px' }}>{waterDistillRate}% Recovery</div>
                      </div>
                      <div style={{ backgroundColor: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.4)', padding: '10px', borderRadius: 'var(--radius-card)', textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '4px' }}>
                          <CheckCircle2 size={20} className="text-sky-400" />
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#38bdf8', fontWeight: 700 }}>Potable Storage</div>
                        <div style={{ fontSize: '0.8rem', fontFamily: 'monospace', color: '#38bdf8', marginTop: '2px' }}>&lt; 0.18 μS/cm (Clean)</div>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Distillation Centrifuge Recovery Rate:</span>
                    <span style={{ fontSize: '1rem', fontFamily: 'monospace', fontWeight: 800, color: waterDistillRate >= 95 ? '#43ffa0' : '#fbbf24' }}>
                      {waterDistillRate}% {waterDistillRate >= 95 ? '(NASA BVAD PASSED)' : '(SUB-THRESHOLD)'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="80"
                    max="99"
                    value={waterDistillRate}
                    onChange={(e) => setWaterDistillRate(parseInt(e.target.value, 10))}
                    style={{ width: '100%', accentColor: '#38bdf8', cursor: 'pointer' }}
                  />
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '6px' }}>
                    Recovers {((3.2 * waterDistillRate) / 100).toFixed(2)} L of drinking water per astronaut per day.
                  </div>
                </div>
              )}

              {/* MODULE 5: BIO-REGENERATIVE GREENHOUSE */}
              {activeLesson.interactiveType === 'greenhouse' && (
                <div>
                  <div style={{ backgroundColor: '#030712', borderRadius: 'var(--radius-card)', padding: '14px', border: '1px solid rgba(34, 197, 94, 0.3)', marginBottom: '12px' }}>
                    <div style={{ fontSize: '0.72rem', color: '#43ffa0', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '8px' }}>
                      NASA Veggie / APH Controlled Spectrum Chamber
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '10px', borderRadius: 'var(--radius-card)', backgroundColor: cropLightMode === 'photosynthetic' ? 'rgba(236, 72, 153, 0.15)' : 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <div style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-card)', background: 'var(--color-paper-2)', border: 'var(--rule-hair) solid var(--color-rule)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Sprout size={24} className="text-emerald-400" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f8fafc' }}>
                          Active Light Spectrum:{' '}
                          <span style={{ color: cropLightMode === 'photosynthetic' ? '#f472b6' : '#38bdf8' }}>
                            {cropLightMode === 'photosynthetic' ? 'Magenta (450nm Blue + 660nm Red)' : cropLightMode === 'photoperiod' ? 'Deep Red (660nm Flowering)' : 'Full Spectrum White'}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '3px' }}>
                          Photosynthetic Photon Flux (PPFD): 450 μmol/m²/s | O2 Generation: +1.2 kg/day
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => setCropLightMode('photosynthetic')}
                      style={{
                        flex: 1,
                        padding: '8px 10px',
                        borderRadius: 'var(--radius-card)',
                        border: cropLightMode === 'photosynthetic' ? '1px solid #f472b6' : '1px solid rgba(255,255,255,0.1)',
                        backgroundColor: cropLightMode === 'photosynthetic' ? 'rgba(236, 72, 153, 0.2)' : 'transparent',
                        color: '#f8fafc',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Dual Photosynthetic (450/660nm)
                    </button>
                    <button
                      onClick={() => setCropLightMode('photoperiod')}
                      style={{
                        flex: 1,
                        padding: '8px 10px',
                        borderRadius: 'var(--radius-card)',
                        border: cropLightMode === 'photoperiod' ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.1)',
                        backgroundColor: cropLightMode === 'photoperiod' ? 'rgba(239, 68, 68, 0.2)' : 'transparent',
                        color: '#f8fafc',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Photoperiod Flowering (660nm)
                    </button>
                    <button
                      onClick={() => setCropLightMode('germination')}
                      style={{
                        flex: 1,
                        padding: '8px 10px',
                        borderRadius: 'var(--radius-card)',
                        border: cropLightMode === 'germination' ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)',
                        backgroundColor: cropLightMode === 'germination' ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
                        color: '#f8fafc',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Full Spectrum White
                    </button>
                  </div>
                </div>
              )}

              {/* MODULE 6: RADIATION REGOLITH SHIELDING */}
              {activeLesson.interactiveType === 'radiation' && (
                <div>
                  <div style={{ backgroundColor: '#030712', borderRadius: 'var(--radius-card)', padding: '14px', border: '1px solid rgba(167, 139, 250, 0.3)', marginBottom: '12px' }}>
                    <div style={{ fontSize: '0.72rem', color: '#a78bfa', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '8px' }}>
                      Lunar Surface Storm Bunker Attenuation Cross-Section
                    </div>
                    {/* Visual Cutaway */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderRadius: 'var(--radius-card)', overflow: 'hidden' }}>
                      <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.25)', padding: '6px 12px', fontSize: '0.72rem', color: '#f87171', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Zap size={14} className="text-rose-400" />
                          <span>Cosmic Radiation (GCR + SPE Protons)</span>
                        </span>
                        <span>1.50 mSv/day Unshielded</span>
                      </div>
                      <div style={{ backgroundColor: '#334155', height: `${Math.max(16, (regolithDepth / 200) * 50)}px`, transition: 'height 0.15s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', borderTop: '2px solid #64748b', borderBottom: '2px solid #64748b' }}>
                        <span style={{ fontSize: '0.72rem', color: '#cbd5e1', fontWeight: 700 }}>
                          Sintered Regolith Shield: {regolithDepth} cm
                        </span>
                      </div>
                      <div style={{ backgroundColor: regolithDepth >= 150 ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)', padding: '6px 12px', fontSize: '0.72rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: regolithDepth >= 150 ? '#43ffa0' : '#f87171' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Shield size={14} className={regolithDepth >= 150 ? 'text-emerald-400' : 'text-rose-400'} />
                          <span>Crew Habitat Bunker</span>
                        </span>
                        <span style={{ fontWeight: 800 }}>{(1.5 * Math.exp(-regolithDepth / 45)).toFixed(2)} mSv/day ({regolithDepth >= 150 ? 'SAFE' : 'HAZARDOUS'})</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Regolith Shield Thickness: {regolithDepth} cm</span>
                    <span style={{ fontSize: '1rem', fontFamily: 'monospace', fontWeight: 800, color: regolithDepth >= 150 ? '#43ffa0' : '#f87171' }}>
                      Dose: {(1.5 * Math.exp(-regolithDepth / 45)).toFixed(2)} mSv/day
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={regolithDepth}
                    onChange={(e) => setRegolithDepth(parseInt(e.target.value, 10))}
                    style={{ width: '100%', accentColor: '#a78bfa', cursor: 'pointer' }}
                  />
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '6px' }}>
                    150+ cm of compact lunar regolith attenuates 98% of deep space cosmic rays down to harmless background levels.
                  </div>
                </div>
              )}

              {/* MODULE 7: ROVER MOBILITY & TERRAMECHANICS */}
              {activeLesson.interactiveType === 'rover' && (
                <div>
                  <div style={{ backgroundColor: '#030712', borderRadius: 'var(--radius-card)', padding: '14px', border: '1px solid rgba(249, 115, 22, 0.3)', marginBottom: '12px' }}>
                    <div style={{ fontSize: '0.72rem', color: '#fb923c', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '8px' }}>
                      Rover Terramechanics &amp; Wheel-Slip Vector Diagram
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: 'var(--radius-card)', textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '4px' }}>
                          <Compass size={22} className="text-orange-400" />
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Tire Contact Patch</div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f8fafc' }}>Titanium Mesh & Chevrons</div>
                        <div style={{ fontSize: '0.65rem', color: '#fb923c', marginTop: '2px' }}>Regolith Shear: 1.8 kPa</div>
                      </div>
                      <div style={{ backgroundColor: roverSlope > 18 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)', border: roverSlope > 18 ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(34, 197, 94, 0.3)', padding: '10px', borderRadius: 'var(--radius-card)', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Calculated Wheel Slip (s)</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 900, fontFamily: 'monospace', color: roverSlope > 18 ? '#ef4444' : '#43ffa0' }}>
                          {Math.min(95, Math.round(5 + Math.pow(roverSlope / 3.2, 1.8)))}%
                        </div>
                        <div style={{ fontSize: '0.65rem', fontWeight: 700, color: roverSlope > 18 ? '#ef4444' : '#43ffa0', marginTop: '2px' }}>
                          {roverSlope > 18 ? 'HAZARD WARNING: HIGH SLIP COEFFICIENT' : 'NOMINAL TRACTION'}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Crater Slope Incline: {roverSlope}°</span>
                    <span style={{ fontSize: '1rem', fontFamily: 'monospace', fontWeight: 800, color: roverSlope > 18 ? '#ef4444' : '#fbbf24' }}>
                      {roverSlope}° {roverSlope > 18 ? '(SLOPE WARNING)' : '(SAFE CLIMB)'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="28"
                    value={roverSlope}
                    onChange={(e) => setRoverSlope(parseInt(e.target.value, 10))}
                    style={{ width: '100%', accentColor: '#fb923c', cursor: 'pointer' }}
                  />
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '6px' }}>
                    Maximum safe operating slope for lunar rover chassis is 15°–18° to prevent catastrophic rollover.
                  </div>
                </div>
              )}

              {/* MODULE 8: RAMAN & SPECTROMETRY */}
              {activeLesson.interactiveType === 'spectrometer' && (
                <div>
                  <div style={{ backgroundColor: '#030712', borderRadius: 'var(--radius-card)', padding: '14px', border: '1px solid rgba(168, 85, 247, 0.3)', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.72rem', color: '#c084fc', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                        Laser Raman Spectroscopy (532 nm Excitation)
                      </span>
                      <span style={{ fontSize: '0.68rem', color: isLaserPulsing ? '#43ffa0' : '#94a3b8', fontFamily: 'monospace' }}>
                        {isLaserPulsing ? '● LASER FIRING...' : 'STANDBY'}
                      </span>
                    </div>

                    {/* Spectral Readout Bar */}
                    <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-card)', padding: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#94a3b8', marginBottom: '6px' }}>
                        <span>Target: {spectrometerTarget === 'shackleton_psr' ? 'Shackleton PSR Ice Core' : spectrometerTarget === 'regolith_matrix' ? 'Dry Regolith Glass' : 'Anorthosite Crust'}</span>
                        <span style={{ color: spectrometerTarget === 'shackleton_psr' ? '#43ffa0' : '#38bdf8', fontWeight: 700 }}>
                          {spectrometerTarget === 'shackleton_psr' ? 'H2O Peak at 3,200 cm⁻¹ (5.4% wt)' : 'Silicate Bands at 1,000 cm⁻¹'}
                        </span>
                      </div>
                      <div style={{ height: '36px', backgroundColor: '#090d16', borderRadius: 'var(--radius-card)', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'flex-end', gap: '2px', padding: '2px 4px' }}>
                        {Array.from({ length: 32 }).map((_, i) => {
                          const isWaterPeak = spectrometerTarget === 'shackleton_psr' && i >= 18 && i <= 22;
                          const heightPct = isWaterPeak ? 90 - Math.abs(i - 20) * 15 : 15 + ((i * 7) % 25);
                          return (
                            <div
                              key={i}
                              style={{
                                flex: 1,
                                height: `${isLaserPulsing ? heightPct : 10}%`,
                                backgroundColor: isWaterPeak ? '#43ffa0' : '#38bdf8',
                                opacity: isLaserPulsing ? 1 : 0.3,
                                transition: 'height 0.2s ease, opacity 0.2s ease',
                              }}
                            />
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => {
                        setSpectrometerTarget('shackleton_psr');
                        setIsLaserPulsing(true);
                        soundFx.playTelemetryChirp();
                        setTimeout(() => setIsLaserPulsing(false), 2000);
                      }}
                      style={{
                        flex: 1,
                        padding: '8px',
                        borderRadius: 'var(--radius-card)',
                        backgroundColor: 'var(--color-accent)',
                        color: '#000000',
                        border: 'none',
                        fontWeight: 800,
                        fontSize: '0.78rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                      }}
                    >
                      <Search size={14} />
                      <span>Scan Shackleton Ice Core</span>
                    </button>
                    <button
                      onClick={() => {
                        setSpectrometerTarget('regolith_matrix');
                        setIsLaserPulsing(true);
                        soundFx.playClick(600);
                        setTimeout(() => setIsLaserPulsing(false), 2000);
                      }}
                      style={{
                        padding: '8px 14px',
                        borderRadius: 'var(--radius-card)',
                        backgroundColor: 'var(--color-paper-2)',
                        color: 'var(--color-ink-2)',
                        border: 'var(--rule-hair) solid var(--color-rule)',
                        fontSize: '0.78rem',
                        cursor: 'pointer',
                      }}
                    >
                      Scan Dry Regolith
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Knowledge Check / Interactive Quiz */}
            <div
              style={{
                backgroundColor: 'rgba(30, 41, 59, 0.45)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                padding: '18px',
              }}
            >
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', marginBottom: '8px' }}>
                Cadet Certification Quiz (+50 XP)
              </div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f1f5f9', marginBottom: '12px' }}>
                {activeLesson.quiz.question}
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {activeLesson.quiz.options.map((opt, idx) => {
                  const isSelected = selectedQuizAnswer === idx;
                  const isCorrect = idx === activeLesson.quiz.correctIndex;
                  let borderColor = 'rgba(255, 255, 255, 0.12)';
                  let bgColor = 'rgba(15, 23, 42, 0.6)';

                  if (quizSubmitted) {
                    if (isCorrect) {
                      borderColor = '#10b981';
                      bgColor = 'rgba(16, 185, 129, 0.15)';
                    } else if (isSelected) {
                      borderColor = '#ef4444';
                      bgColor = 'rgba(239, 68, 68, 0.15)';
                    }
                  } else if (isSelected) {
                    borderColor = '#a78bfa';
                    bgColor = 'rgba(167, 139, 250, 0.15)';
                  }

                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        if (!quizSubmitted) {
                          setSelectedQuizAnswer(idx);
                          soundFx.playClick(800);
                        }
                      }}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: `1px solid ${borderColor}`,
                        backgroundColor: bgColor,
                        cursor: quizSubmitted ? 'default' : 'pointer',
                        fontSize: '0.85rem',
                        color: '#e2e8f0',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <span
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          backgroundColor: isSelected ? '#a78bfa' : 'rgba(255,255,255,0.08)',
                          color: isSelected ? '#0f172a' : '#94a3b8',
                        }}
                      >
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span>{opt}</span>
                    </div>
                  );
                })}
              </div>

              {!quizSubmitted ? (
                <button
                  onClick={handleSubmitQuiz}
                  disabled={selectedQuizAnswer === null}
                  style={{
                    marginTop: '14px',
                    padding: '8px 18px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: selectedQuizAnswer === null ? 'rgba(255,255,255,0.1)' : '#7c3aed',
                    color: selectedQuizAnswer === null ? '#64748b' : '#ffffff',
                    fontWeight: 700,
                    cursor: selectedQuizAnswer === null ? 'not-allowed' : 'pointer',
                  }}
                >
                  Submit Answer &amp; Claim Badge
                </button>
              ) : (
                <div style={{ marginTop: '14px', padding: '12px', borderRadius: '8px', backgroundColor: selectedQuizAnswer === activeLesson.quiz.correctIndex ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)', border: `1px solid ${selectedQuizAnswer === activeLesson.quiz.correctIndex ? '#10b981' : '#ef4444'}` }}>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: selectedQuizAnswer === activeLesson.quiz.correctIndex ? '#43ffa0' : '#f87171' }}>
                    {selectedQuizAnswer === activeLesson.quiz.correctIndex ? '✓ Correct! +50 XP Awarded' : '✗ Incorrect. Review the explanation below:'}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#cbd5e1', marginTop: '4px', lineHeight: 1.4 }}>
                    {activeLesson.quiz.explanation}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        )}

        {/* ── TAB 2: SPACESUIT ANATOMY & FIELD EQUIPMENT ENCYCLOPEDIA ── */}
        {activeTab === 'SPACESUIT_EQUIPMENT' && (
          <div style={{ padding: '24px', overflowY: 'auto' }}>
            {/* Mode Switcher: 3D Simulator vs Encyclopedia Catalog */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => { setSuitViewMode('3D_SIMULATOR'); soundFx.playClick(750); }}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '10px',
                    fontSize: '0.84rem',
                    fontWeight: 800,
                    border: suitViewMode === '3D_SIMULATOR' ? '1.5px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)',
                    backgroundColor: suitViewMode === '3D_SIMULATOR' ? 'rgba(56, 189, 248, 0.22)' : 'rgba(15, 23, 42, 0.6)',
                    color: suitViewMode === '3D_SIMULATOR' ? '#ffffff' : '#94a3b8',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: suitViewMode === '3D_SIMULATOR' ? '0 0 18px rgba(56, 189, 248, 0.35)' : 'none',
                  }}
                >
                  <span>🎮</span> 3D SPACESUIT SIMULATOR &amp; EVA LAB
                </button>
                <button
                  onClick={() => { setSuitViewMode('CATALOG'); soundFx.playClick(650); }}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '10px',
                    fontSize: '0.84rem',
                    fontWeight: 800,
                    border: suitViewMode === 'CATALOG' ? '1.5px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)',
                    backgroundColor: suitViewMode === 'CATALOG' ? 'rgba(56, 189, 248, 0.22)' : 'rgba(15, 23, 42, 0.6)',
                    color: suitViewMode === 'CATALOG' ? '#ffffff' : '#94a3b8',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: suitViewMode === 'CATALOG' ? '0 0 18px rgba(56, 189, 248, 0.35)' : 'none',
                  }}
                >
                  <span>📋</span> COMPONENT ENCYCLOPEDIA &amp; CATALOG ({SPACESUIT_PARTS.length})
                </button>
              </div>

              {suitViewMode === 'CATALOG' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', padding: '6px 12px' }}>
                  <Search size={16} className="text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search suit parts, tools..."
                    value={suitSearch}
                    onChange={(e) => setSuitSearch(e.target.value)}
                    style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '0.82rem', outline: 'none', width: '180px' }}
                  />
                </div>
              )}
            </div>

            {suitViewMode === '3D_SIMULATOR' ? (
              <Spacesuit3DSimulator onBackToCatalog={() => setSuitViewMode('CATALOG')} />
            ) : (
              <>
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <Shield size={22} style={{ color: 'var(--color-accent)' }} />
                    <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#f8fafc', margin: 0, fontFamily: 'var(--font-space)' }}>
                      Spacesuit Architecture &amp; Planetary Field Equipment
                    </h3>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: '#94a3b8', margin: 0 }}>
                    Technical specification breakdown of every subsystem in the Extravehicular Mobility Unit (EMU / xEMU / Orion suit) and scientific planetary surface tools.
                  </p>
                </div>

                {/* Filter Pills */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
                  {[
                    { id: 'ALL', label: `All Equipment (${SPACESUIT_PARTS.length})` },
                    { id: 'HEAD_HELMET', label: 'Helmet & Audio (LEVA)' },
                    { id: 'TORSO_LIFE_SUPPORT', label: 'Torso & Life Support (PLSS)' },
                    { id: 'HANDS_ARMS', label: 'Pressurized Gloves' },
                    { id: 'LEGS_BOOTS', label: 'Boots & Tethers' },
                    { id: 'FIELD_TOOLS', label: 'Scientific Field Instruments' },
                  ].map((btn) => (
                    <button
                      key={btn.id}
                      onClick={() => { setSuitFilter(btn.id as any); soundFx.playClick(650); }}
                      style={{
                        padding: '6px 14px',
                        borderRadius: 'var(--radius-card)',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        fontFamily: 'var(--font-mono)',
                        border: suitFilter === btn.id ? 'var(--rule-hair) solid var(--color-accent)' : 'var(--rule-hair) solid var(--color-rule)',
                        backgroundColor: suitFilter === btn.id ? 'var(--color-paper-2)' : 'var(--color-paper)',
                        color: suitFilter === btn.id ? 'var(--color-accent)' : 'var(--color-ink-2)',
                        cursor: 'pointer',
                      }}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>

            {/* Equipment Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
              {filteredSuitParts.map((part) => (
                <div
                  key={part.id}
                  style={{
                    backgroundColor: 'var(--color-paper-2)',
                    border: 'var(--rule-hair) solid var(--color-rule)',
                    borderRadius: 'var(--radius-card)',
                    padding: '18px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '12px',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-card)', background: 'var(--color-paper)', border: 'var(--rule-hair) solid var(--color-rule)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {getSpacesuitIcon(part.id)}
                      </div>
                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontFamily: 'monospace',
                          fontWeight: 800,
                          padding: '3px 8px',
                          borderRadius: 'var(--radius-card)',
                          backgroundColor: 'var(--color-paper)',
                          color: 'var(--color-accent)',
                          border: 'var(--rule-hair) solid var(--color-rule)',
                        }}
                      >
                        {part.nasaCode}
                      </span>
                    </div>

                    <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#f8fafc', margin: '0 0 6px 0', fontFamily: 'var(--font-space)' }}>
                      {part.name}
                    </h4>

                    {/* Where Used */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: '#fbbf24', fontWeight: 700, marginBottom: '8px' }}>
                      <span style={{ fontFamily: 'var(--font-mono)' }}>LOCATION ON SUIT:</span>
                      <span style={{ color: '#fed7aa', fontWeight: 600 }}>{part.locationOnBody}</span>
                    </div>

                    {/* Primary Function */}
                    <div style={{ fontSize: '0.8rem', color: '#cbd5e1', lineHeight: 1.45, marginBottom: '10px' }}>
                      <strong style={{ color: '#f1f5f9' }}>Function: </strong>
                      {part.primaryFunction}
                    </div>

                    {/* Physics / Reason */}
                    <div style={{ padding: '8px 10px', borderRadius: 'var(--radius-card)', backgroundColor: 'var(--color-paper)', border: 'var(--rule-hair) solid var(--color-rule)', borderLeft: '3px solid var(--color-accent)', fontSize: '0.75rem', color: 'var(--color-ink-2)', lineHeight: 1.4, marginBottom: '10px' }}>
                      <strong style={{ color: 'var(--color-ink)' }}>Science &amp; Physics Reason: </strong>
                      {part.physicsReason}
                    </div>
                  </div>

                  <div style={{ borderTop: 'var(--rule-hair) solid var(--color-rule)', paddingTop: '10px', fontSize: '0.7rem', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
                    <span style={{ fontWeight: 700, color: 'var(--color-ink-2)' }}>NASA SPECS: </span>
                    {part.specs}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    )}

        {/* ── TAB 3: EARTH GROUND TRAINING ACADEMY ── */}
        {activeTab === 'EARTH_ACADEMY' && (
          <div style={{ padding: '24px', overflowY: 'auto' }}>
            <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '22px' }}>
              <div>
                <div style={{ display: 'inline-block', fontSize: '0.7rem', fontWeight: 800, color: '#10b981', padding: '3px 8px', borderRadius: '4px', backgroundColor: 'rgba(16, 185, 129, 0.15)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                  NASA Johnson Space Center · Houston, Texas Analog Ground School
                </div>
                <h3 style={{ fontSize: '1.45rem', fontWeight: 900, color: '#f8fafc', margin: 0 }}>
                  🌍 Phase 1: What It Takes to Become a NASA Astronaut on Earth
                </h3>
                <p style={{ fontSize: '0.86rem', color: '#94a3b8', lineHeight: 1.5, marginTop: '6px' }}>
                  Every astronaut candidate must complete a grueling 2-year boot camp on Earth before being certified for spaceflight. Cadets master STEM degrees, underwater neutral buoyancy spacewalks, high-G centrifuge forces, and extreme wilderness survival.
                </p>
              </div>

              {/* Quick Jump Action Bar */}
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {onOpenComics && (
                  <button
                    onClick={() => { onClose(); onOpenComics(); }}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(245, 158, 11, 0.18)',
                      border: '1px solid rgba(245, 158, 11, 0.45)',
                      color: '#fbbf24',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <BookOpen size={15} />
                    <span>Read STEM Graphic Novels (Comics 1–8)</span>
                  </button>
                )}

                {onOpenClassroom && (
                  <button
                    onClick={() => { onClose(); onOpenClassroom(); }}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(124, 58, 237, 0.18)',
                      border: '1px solid rgba(167, 139, 250, 0.45)',
                      color: '#c4b5fd',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <GraduationCap size={15} />
                    <span>Attend Ground School Classroom (3D Flight Models)</span>
                  </button>
                )}

                {onOpenDepot && (
                  <button
                    onClick={() => { onClose(); onOpenDepot(); }}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(56, 189, 248, 0.18)',
                      border: '1px solid rgba(56, 189, 248, 0.45)',
                      color: '#38bdf8',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <Building2 size={15} />
                    <span>Construct Earth &amp; Space Facilities in Depot</span>
                  </button>
                )}
              </div>

              {/* 5 Ground Training Milestones */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
                {[
                  {
                    num: '1',
                    icon: <GraduationCap size={22} className="text-emerald-400" />,
                    title: 'STEM Master’s Degree Prerequisite',
                    desc: 'Master of Science in Aerospace, Physics, Math, or Computer Science + 3 years professional technical leadership or 1,000 jet pilot hours.',
                  },
                  {
                    num: '2',
                    icon: <Activity size={22} className="text-sky-400" />,
                    title: 'Neutral Buoyancy Lab (NBL)',
                    desc: '6.2-million-gallon water pool in Houston. Every 1 hour of EVA spacewalk in orbit requires 7 hours underwater wearing 140 kg suits.',
                  },
                  {
                    num: '3',
                    icon: <RefreshCw size={22} className="text-amber-400" />,
                    title: 'High-G Centrifuge Conditioning',
                    desc: 'Surviving 4G to 9G launch acceleration and ballistic re-entry. Cadets learn the Anti-G Straining Maneuver (AGSM) to prevent blackouts.',
                  },
                  {
                    num: '4',
                    icon: <Shield size={22} className="text-cyan-400" />,
                    title: 'Wilderness & Subterranean Survival',
                    desc: 'Analog survival trials in blizzards, deserts, and underground cave systems to forge psychological grit and extreme teamwork under isolation.',
                  },
                  {
                    num: '5',
                    icon: <Gamepad2 size={22} className="text-purple-400" />,
                    title: 'Full-Motion Flight Simulator',
                    desc: 'Hundreds of hours mastering 6-DOF RCS thrusters, orbital rendezvous, and manual joystick lunar descent guidance.',
                  },
                ].map((m) => (
                  <div
                    key={m.num}
                    style={{
                      backgroundColor: 'var(--color-paper-2)',
                      border: 'var(--rule-hair) solid var(--color-rule)',
                      borderRadius: 'var(--radius-card)',
                      padding: '16px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-card)', background: 'var(--color-paper)', border: 'var(--rule-hair) solid var(--color-rule)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {m.icon}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.65rem', color: '#10b981', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>STEP #{m.num}</div>
                        <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#f8fafc' }}>{m.title}</div>
                      </div>
                    </div>
                    <p style={{ fontSize: '0.78rem', color: 'var(--color-ink-2)', lineHeight: 1.45, margin: 0 }}>
                      {m.desc}
                    </p>
                  </div>
                ))}
              </div>

              {/* Earth Qualification Certification Exam */}
              <div
                style={{
                  backgroundColor: 'rgba(15, 23, 42, 0.85)',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  borderRadius: '14px',
                  padding: '20px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <div>
                    <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#10b981', textTransform: 'uppercase' }}>
                      Cadet Flight Qualification Exam
                    </span>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc', margin: '2px 0 0 0' }}>
                      Earth Ground School Graduation Test
                    </h4>
                  </div>
                  {hasPassedEarth && (
                    <span style={{ padding: '4px 10px', borderRadius: '6px', backgroundColor: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10b981', color: '#43ffa0', fontSize: '0.75rem', fontWeight: 800 }}>
                      ✓ ASCAN WINGS CERTIFIED
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {EARTH_EXAM.map((exam, qIdx) => (
                    <div key={qIdx} style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '10px' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc', marginBottom: '8px' }}>
                        {exam.q}
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {exam.opts.map((opt, optIdx) => {
                          const isSelected = earthAnswers[qIdx] === optIdx;
                          const isCorrect = optIdx === exam.correct;
                          let border = '1px solid rgba(255,255,255,0.1)';
                          let bg = 'transparent';

                          if (earthSubmitted) {
                            if (isCorrect) {
                              border = '1px solid #10b981';
                              bg = 'rgba(16, 185, 129, 0.15)';
                            } else if (isSelected) {
                              border = '1px solid #ef4444';
                              bg = 'rgba(239, 68, 68, 0.15)';
                            }
                          } else if (isSelected) {
                            border = '1px solid #10b981';
                            bg = 'rgba(16, 185, 129, 0.15)';
                          }

                          return (
                            <div
                              key={optIdx}
                              onClick={() => {
                                if (!earthSubmitted) {
                                  setEarthAnswers((prev) => ({ ...prev, [qIdx]: optIdx }));
                                  soundFx.playClick(750);
                                }
                              }}
                              style={{
                                padding: '8px 12px',
                                borderRadius: '6px',
                                border,
                                backgroundColor: bg,
                                cursor: earthSubmitted ? 'default' : 'pointer',
                                fontSize: '0.8rem',
                                color: '#cbd5e1',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                              }}
                            >
                              <span style={{ fontWeight: 700, color: isSelected ? '#43ffa0' : '#64748b' }}>
                                {String.fromCharCode(65 + optIdx)}.
                              </span>
                              <span>{opt}</span>
                            </div>
                          );
                        })}
                      </div>

                      {earthSubmitted && (
                        <div style={{ marginTop: '8px', fontSize: '0.74rem', color: '#94a3b8', lineHeight: 1.4 }}>
                          <strong style={{ color: '#38bdf8' }}>Explanation: </strong>
                          {exam.why}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {!earthSubmitted ? (
                  <button
                    onClick={handleGradeEarthExam}
                    disabled={Object.keys(earthAnswers).length < EARTH_EXAM.length}
                    style={{
                      marginTop: '16px',
                      padding: '10px 20px',
                      borderRadius: '8px',
                      backgroundColor: Object.keys(earthAnswers).length < EARTH_EXAM.length ? 'rgba(255,255,255,0.1)' : '#10b981',
                      color: Object.keys(earthAnswers).length < EARTH_EXAM.length ? '#64748b' : '#ffffff',
                      fontWeight: 800,
                      fontSize: '0.88rem',
                      border: 'none',
                      cursor: Object.keys(earthAnswers).length < EARTH_EXAM.length ? 'not-allowed' : 'pointer',
                    }}
                  >
                    Submit Earth Exam &amp; Unlock Space Academy
                  </button>
                ) : (
                  <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 800, color: hasPassedEarth ? '#43ffa0' : '#f87171' }}>
                      {hasPassedEarth ? '🎉 PASSED! You are now certified for Deep Space Academy flight!' : '⚠️ Score below 75%. Review the material and try again.'}
                    </div>

                    {hasPassedEarth && (
                      <button
                        onClick={() => { setActiveTab('SPACE_ACADEMY'); soundFx.playClick(850); }}
                        style={{
                          padding: '10px 18px',
                          borderRadius: '8px',
                          backgroundColor: '#fbbf24',
                          color: '#070b13',
                          fontWeight: 900,
                          fontSize: '0.85rem',
                          border: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        🚀 Enter Space Flight Academy ➔
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 4: DEEP SPACE & PLANETARY ACADEMY ── */}
        {activeTab === 'SPACE_ACADEMY' && (
          <div style={{ padding: '24px', overflowY: 'auto' }}>
            <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '22px' }}>
              <div>
                <div style={{ display: 'inline-block', fontSize: '0.7rem', fontWeight: 800, color: '#fbbf24', padding: '3px 8px', borderRadius: '4px', backgroundColor: 'rgba(251, 191, 36, 0.15)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                  Extraterrestrial Planetary Flight &amp; Survival Ops
                </div>
                <h3 style={{ fontSize: '1.45rem', fontWeight: 900, color: '#f8fafc', margin: 0 }}>
                  🚀 Phase 2: What It Takes to Survive in Deep Space &amp; Alien Worlds
                </h3>
                <p style={{ fontSize: '0.86rem', color: '#94a3b8', lineHeight: 1.5, marginTop: '6px' }}>
                  In deep space, resupply from Earth is impossible. Astronauts must operate autonomous closed-loop life support (Sabatier &amp; VCD), build radiation-shielded regolith outposts, navigate rovers across crater slopes, and harvest volatile water ice from cold traps.
                </p>
              </div>

              {/* 5 Core Space Survival Domains */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
                {[
                  {
                    icon: <Rocket size={22} className="text-amber-400" />,
                    title: 'Orbital Rendezvous & 6-DOF Docking',
                    sub: 'V-Bar & R-Bar Trajectories',
                    desc: 'Approach speeds must drop below 0.05 m/s. Thrusters must modulate 6 degrees of freedom to align guide petals within 0.5 degrees.',
                  },
                  {
                    icon: <RefreshCw size={22} className="text-purple-400" />,
                    title: 'Closed-Loop ECLSS Sabatier',
                    sub: 'CO2 + 4H2 → CH4 + 2H2O',
                    desc: 'Catalytic ruthenium reactor operating at 400°C turns crew exhaled breath into drinkable water and combustible methane fuel.',
                  },
                  {
                    icon: <Building2 size={22} className="text-sky-400" />,
                    title: 'Outpost Construction & Kilopower',
                    sub: 'Sintered Regolith Vaults',
                    desc: '1.5 to 2.0 meters of compacted regolith shields against deep-space cosmic rays while KRUSTY fission reactors power the 354-hour lunar night.',
                  },
                  {
                    icon: <Compass size={22} className="text-orange-400" />,
                    title: 'Surface Rover Terramechanics',
                    sub: 'Titanium Mesh Wheels',
                    desc: 'Managing wheel slip on 15°–18° crater slopes. Normal force and shear stress calculation prevents catastrophic vehicle rollover.',
                  },
                  {
                    icon: <Search size={22} className="text-cyan-400" />,
                    title: 'Polar Ice Coring & Spectrometry',
                    sub: 'Shackleton Crater PSR (40 Kelvin)',
                    desc: 'Extracting volatile water ice in permanent shadow. 1 metric ton of lunar ice yields 890 kg breathable O2 and 110 kg rocket hydrogen fuel!',
                  },
                ].map((d) => (
                  <div
                    key={d.title}
                    style={{
                      backgroundColor: 'var(--color-paper-2)',
                      border: 'var(--rule-hair) solid var(--color-rule)',
                      borderRadius: 'var(--radius-card)',
                      padding: '16px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-card)', background: 'var(--color-paper)', border: 'var(--rule-hair) solid var(--color-rule)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {d.icon}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#f8fafc' }}>{d.title}</div>
                        <div style={{ fontSize: '0.68rem', color: '#fbbf24', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{d.sub}</div>
                      </div>
                    </div>
                    <p style={{ fontSize: '0.78rem', color: 'var(--color-ink-2)', lineHeight: 1.45, margin: 0 }}>
                      {d.desc}
                    </p>
                  </div>
                ))}
              </div>

              {/* Comparative Table: Earth Academy vs Space Academy */}
              <div
                style={{
                  backgroundColor: 'rgba(15, 23, 42, 0.85)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '14px',
                  padding: '20px',
                }}
              >
                <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#f8fafc', marginBottom: '12px' }}>
                  📊 Side-by-Side: Earth Ground Training vs. Deep Space Operations
                </h4>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.15)', color: '#94a3b8' }}>
                        <th style={{ padding: '10px' }}>Operational Factor</th>
                        <th style={{ padding: '10px', color: '#43ffa0' }}>🌍 Earth Ground Academy</th>
                        <th style={{ padding: '10px', color: '#fbbf24' }}>🚀 Space &amp; Planetary Academy</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { factor: 'Ambient Atmosphere', earth: '101.3 kPa (78% N2, 21% O2)', space: 'Hard Vacuum (0 kPa) — Instant boiling without suit' },
                        { factor: 'Effective Gravity', earth: '1.0 G (9.8 m/s²)', space: 'Microgravity (0.0 G) to Lunar (0.166 G) / Mars (0.38 G)' },
                        { factor: 'Radiation Exposure', earth: 'Shielded by Earth magnetosphere & atmosphere', space: 'Unshielded GCR + SPE protons (~1.5 mSv/day)' },
                        { factor: 'Supply Replenishment', earth: 'Immediate grocery and water replenishment', space: '100% Closed-loop Sabatier & VCD recycling mandatory' },
                        { factor: 'Emergency Abort', earth: 'Stop simulation & exit test chamber', space: 'Multi-day ballistic return trajectory' },
                      ].map((row, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                          <td style={{ padding: '10px', fontWeight: 700, color: '#f1f5f9' }}>{row.factor}</td>
                          <td style={{ padding: '10px', color: '#cbd5e1' }}>{row.earth}</td>
                          <td style={{ padding: '10px', color: '#fed7aa' }}>{row.space}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 5: ASTRONAUT CADET RANKS & HIERARCHY ── */}
        {activeTab === 'RANKS_HIERARCHY' && (() => {
          const rankProg = getRankProgress(progression.xp);
          return (
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px', backgroundColor: 'var(--color-paper)' }}>
              <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                {/* Header Banner */}
                <div
                  style={{
                    padding: '24px',
                    borderRadius: 'var(--radius-card)',
                    background: 'var(--color-paper-2)',
                    border: 'var(--rule-hair) solid var(--color-rule)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                        <Award size={22} style={{ color: 'var(--color-accent)' }} />
                        <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-ink)', margin: 0, fontFamily: 'var(--font-space)', letterSpacing: '-0.01em' }}>
                          NASA Astronaut Rank Hierarchy &amp; Career Ladder
                        </h3>
                        <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: 'var(--radius-card)', backgroundColor: 'var(--color-paper-3)', border: 'var(--rule-hair) solid var(--color-rule)', color: 'var(--color-accent)', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                          6-TIER CADET PROGRESSION
                        </span>
                      </div>
                      <p style={{ fontSize: '0.86rem', color: 'var(--color-ink-2)', margin: 0, maxWidth: '820px', lineHeight: 1.5 }}>
                        Astronaut candidates advance through six rigorous qualification tiers, progressing from fundamental observational astronomy as Junior Stargazers to full interplanetary mission command. Complete training modules, flight simulations, and field expeditions to elevate your rank:
                      </p>
                    </div>

                    {/* Active Cadet Live Rank Badge */}
                    <div
                      style={{
                        padding: '14px 20px',
                        borderRadius: 'var(--radius-card)',
                        background: 'var(--color-paper)',
                        border: 'var(--rule-hair) solid var(--color-accent)',
                        textAlign: 'center',
                        minWidth: '220px',
                      }}
                    >
                      <div style={{ fontSize: '0.7rem', color: 'var(--color-ink-2)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-mono)' }}>
                        CURRENT CADET STATUS
                      </div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 900, color: rankProg.currentRank.color, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', margin: '6px 0' }}>
                        {getRankBadgeIcon(rankProg.currentRank.level)}
                        <span>LEVEL {rankProg.currentRank.level}</span>
                      </div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-ink)' }}>
                        {rankProg.currentRank.titleEn}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--color-accent)', marginTop: '3px', fontFamily: 'var(--font-mono)' }}>
                        {rankProg.currentRank.badgeCode} · {rankProg.currentRank.nasaEquivalent}
                      </div>
                    </div>
                  </div>

                  {/* Dynamic XP Progress Bar to Next Rank */}
                  <div style={{ marginTop: '20px', background: 'var(--color-paper)', borderRadius: 'var(--radius-card)', padding: '12px 16px', border: 'var(--rule-hair) solid var(--color-rule)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', marginBottom: '8px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                      <span style={{ color: 'var(--color-ink-2)' }}>
                        CUMULATIVE EXPERIENCE: <strong style={{ color: 'var(--color-accent)' }}>{progression.xp} XP</strong>
                      </span>
                      {rankProg.nextRank ? (
                        <span style={{ color: rankProg.nextRank.color }}>
                          NEXT TIER: <strong>{rankProg.nextRank.titleEn}</strong> ({rankProg.xpNeeded} XP REQUIRED)
                        </span>
                      ) : (
                        <span style={{ color: '#fbbf24' }}>MAXIMUM QUALIFICATION ACHIEVED — SUPREME COMMANDER</span>
                      )}
                    </div>
                    <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--color-paper-3)', borderRadius: 'var(--radius-card)', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${rankProg.progressPercent}%`,
                          height: '100%',
                          backgroundColor: 'var(--color-accent)',
                          transition: 'width 0.4s ease',
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Visual Ladder Stepper Roadmap */}
                <div style={{ background: 'var(--color-paper-2)', borderRadius: 'var(--radius-card)', padding: '16px 20px', border: 'var(--rule-hair) solid var(--color-rule)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-ink-2)', textTransform: 'uppercase', marginBottom: '14px', letterSpacing: '0.08em', fontFamily: 'var(--font-mono)' }}>
                    ASTRONAUT CAREER PROGRESSION ROADMAP (LEVELS 1–6)
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px' }}>
                    {ASTRONAUT_RANKS.map((rank) => {
                      const isCurrent = rank.level === rankProg.currentRank.level;
                      const isUnlocked = progression.xp >= rank.minXp;
                      return (
                        <div
                          key={rank.id}
                          style={{
                            padding: '12px',
                            borderRadius: 'var(--radius-card)',
                            background: isCurrent ? 'var(--color-paper)' : isUnlocked ? 'var(--color-paper-2)' : 'var(--color-paper)',
                            border: isCurrent ? 'var(--rule-hair) solid var(--color-accent)' : isUnlocked ? 'var(--rule-hair) solid var(--color-rule)' : '1px dashed var(--color-rule)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '6px',
                            position: 'relative',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            {getRankBadgeIcon(rank.level)}
                            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: isCurrent ? 'var(--color-accent)' : rank.color, fontFamily: 'var(--font-mono)' }}>
                              LEVEL {rank.level}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.78rem', fontWeight: 800, color: isUnlocked ? 'var(--color-ink)' : 'var(--color-ink-2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {rank.titleEn.split('&')[0]}
                          </div>
                          <div style={{ fontSize: '0.68rem', color: isUnlocked ? 'var(--color-accent)' : 'var(--color-ink-2)', fontFamily: 'var(--font-mono)' }}>
                            {rank.minXp} XP+
                          </div>
                          {isCurrent && (
                            <span style={{ position: 'absolute', top: '-6px', right: '6px', fontSize: '9px', background: 'var(--color-accent)', color: '#000', fontWeight: 900, padding: '1px 5px', borderRadius: 'var(--radius-card)', fontFamily: 'var(--font-mono)' }}>
                              ACTIVE
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Detailed 6 Rank Cards (From Lowest to Highest) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--color-ink)', display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'var(--font-mono)' }}>
                    <BookOpen size={16} style={{ color: 'var(--color-accent)' }} />
                    <span>COMPREHENSIVE RANK SPECIFICATIONS &amp; PROMOTION PROTOCOLS</span>
                  </div>

                  {ASTRONAUT_RANKS.map((rank) => {
                    const isCurrent = rank.level === rankProg.currentRank.level;
                    const isUnlocked = progression.xp >= rank.minXp;

                    return (
                      <div
                        key={rank.id}
                        style={{
                          backgroundColor: 'var(--color-paper-2)',
                          borderRadius: 'var(--radius-card)',
                          border: isCurrent ? 'var(--rule-hair) solid var(--color-accent)' : 'var(--rule-hair) solid var(--color-rule)',
                          borderLeft: `4px solid ${rank.color}`,
                          padding: '20px 24px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '14px',
                        }}
                      >
                        {/* Top Rank Title Row */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <div
                              style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: 'var(--radius-card)',
                                background: 'var(--color-paper)',
                                border: `var(--rule-hair) solid ${rank.color}`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              {getRankBadgeIcon(rank.level)}
                            </div>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                <span style={{ fontSize: '0.68rem', background: rank.color, color: '#000', fontWeight: 900, padding: '2px 8px', borderRadius: 'var(--radius-card)', fontFamily: 'var(--font-mono)' }}>
                                  STAGE {rank.level} · LEVEL {rank.level}
                                </span>
                                <span style={{ fontSize: '0.72rem', background: 'var(--color-paper-3)', color: 'var(--color-ink-2)', padding: '2px 8px', borderRadius: 'var(--radius-card)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                                  {rank.ageGroup}
                                </span>
                                {isCurrent && (
                                  <span style={{ fontSize: '0.68rem', background: 'var(--color-accent)', color: '#000', fontWeight: 900, padding: '2px 8px', borderRadius: 'var(--radius-card)', fontFamily: 'var(--font-mono)' }}>
                                    ACTIVE CADET RANK
                                  </span>
                                )}
                              </div>
                              <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-ink)', margin: '4px 0 2px 0', fontFamily: 'var(--font-space)' }}>
                                {rank.titleEn}
                              </h4>
                              <div style={{ fontSize: '0.75rem', color: rank.color, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                                CODE: {rank.badgeCode}
                              </div>
                            </div>
                          </div>

                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.68rem', color: 'var(--color-ink-2)', textTransform: 'uppercase', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                              NASA EQUIVALENCY
                            </div>
                            <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--color-ink)', fontFamily: 'var(--font-mono)' }}>
                              {rank.nasaEquivalent}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: isUnlocked ? 'var(--color-accent)' : '#f59e0b', marginTop: '4px', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                              {isUnlocked ? 'AUTHORIZED' : `LOCKED (${rank.minXp} XP REQUIRED)`}
                            </div>
                          </div>
                        </div>

                        {/* Rank Summary */}
                        <p style={{ fontSize: '0.86rem', color: 'var(--color-ink-2)', margin: 0, lineHeight: 1.5, background: 'var(--color-paper)', padding: '10px 14px', borderRadius: 'var(--radius-card)', border: 'var(--rule-hair) solid var(--color-rule)' }}>
                          {rank.summary}
                        </p>

                        {/* Responsibilities & Unlocked Gear Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '14px' }}>
                          
                          {/* 1. Responsibilities */}
                          <div style={{ background: 'var(--color-paper)', padding: '12px 16px', borderRadius: 'var(--radius-card)', border: 'var(--rule-hair) solid var(--color-rule)' }}>
                            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-ink-2)', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'var(--font-mono)' }}>
                              <FileText size={14} style={{ color: 'var(--color-accent)' }} />
                              <span>CORE RESPONSIBILITIES &amp; FLIGHT TRAINING</span>
                            </div>
                            <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.8rem', color: 'var(--color-ink-2)', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                              {rank.responsibilities.map((resp, i) => (
                                <li key={i}>{resp}</li>
                              ))}
                            </ul>
                          </div>

                          {/* 2. Unlocked Gear & Equipment */}
                          <div style={{ background: 'var(--color-paper)', padding: '12px 16px', borderRadius: 'var(--radius-card)', border: 'var(--rule-hair) solid var(--color-rule)' }}>
                            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-accent)', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'var(--font-mono)' }}>
                              <Layers size={14} style={{ color: 'var(--color-accent)' }} />
                              <span>AUTHORIZED EQUIPMENT &amp; PRIVILEGES</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              {rank.unlockedGear.map((gear, i) => (
                                <div
                                  key={i}
                                  style={{
                                    fontSize: '0.78rem',
                                    color: 'var(--color-ink)',
                                    background: 'var(--color-paper-2)',
                                    padding: '5px 10px',
                                    borderRadius: 'var(--radius-card)',
                                    border: 'var(--rule-hair) solid var(--color-rule)',
                                    fontFamily: 'var(--font-mono)',
                                  }}
                                >
                                  {gear}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Promotion Criteria Banner */}
                        <div
                          style={{
                            background: 'var(--color-paper)',
                            border: 'var(--rule-hair) solid var(--color-rule)',
                            borderRadius: 'var(--radius-card)',
                            padding: '10px 14px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '8px',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Target size={16} style={{ color: 'var(--color-accent)' }} />
                            <span style={{ fontSize: '0.8rem', color: 'var(--color-ink-2)' }}>
                              <strong style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-mono)' }}>PROMOTION CRITERIA:</strong> {rank.promotionCriteria}
                            </span>
                          </div>
                          <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--color-accent)', fontWeight: 800 }}>
                            QUALIFICATION XP: {rank.minXp}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })()}

        {/* ── TAB 6: 30 PROGRESSIVE ACADEMY MISSIONS (LEVEL-WISE) ── */}
        {activeTab === 'ACADEMY_30_MISSIONS' && (
          <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Header banner */}
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(8, 14, 28, 0.98))',
                border: '1.5px solid rgba(56, 189, 248, 0.35)',
                borderRadius: '16px',
                padding: '20px 24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '16px',
                boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
              }}
            >
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(56, 189, 248, 0.15)', border: '1px solid #38bdf8', padding: '3px 10px', borderRadius: '12px', fontSize: '10.5px', color: '#38bdf8', fontWeight: 800, marginBottom: '6px' }}>
                  <Sparkles size={12} />
                  <span>PROGRESSIVE FLIGHT TRAINING ACADEMY · 30 MISSIONS · 5 RANKS</span>
                </div>
                <h3 style={{ fontSize: '22px', fontWeight: 900, color: '#f8fafc', margin: '0 0 4px 0' }}>
                  Astronaut Flight Simulation Academy (লেভেল অনুযায়ী ৩০টি মিশন)
                </h3>
                <p style={{ fontSize: '12.5px', color: '#94a3b8', margin: 0, maxWidth: '640px' }}>
                  Fly progressive missions tailored from Novice Cadet (Age 6-10) up to Master Flight Commander. Each mission includes 3D Cinematic Movie Trailer followed by authentic flight cockpit simulation.
                </p>
              </div>

              {/* Search Input */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(2, 6, 23, 0.8)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '10px', padding: '6px 12px' }}>
                <Search size={14} color="#94a3b8" />
                <input
                  type="text"
                  placeholder="Search mission or planet..."
                  value={missionSearchQuery}
                  onChange={(e) => setMissionSearchQuery(e.target.value)}
                  style={{ background: 'transparent', border: 'none', outline: 'none', color: '#f8fafc', fontSize: '12px', width: '180px' }}
                />
              </div>
            </div>

            {/* 5-Level Academy Filter Buttons */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8' }}>FILTER BY RANK/LEVEL:</span>
              {[
                { id: 'ALL', label: 'ALL (30 MISSIONS)', color: '#38bdf8' },
                { id: 'CADET', label: '🌟 CADET (AGE 6–10)', color: '#38bdf8' },
                { id: 'OFFICER', label: '🚀 JUNIOR (AGE 11–15)', color: '#fbbf24' },
                { id: 'COMMANDER', label: '🪐 COMMANDER (AGE 16+)', color: '#c084fc' },
              ].map((btn) => (
                <button
                  key={btn.id}
                  onClick={() => { setMissionLevelFilter(btn.id as any); soundFx.playClick(750); }}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '8px',
                    border: missionLevelFilter === btn.id ? `1.5px solid ${btn.color}` : '1px solid rgba(255,255,255,0.1)',
                    background: missionLevelFilter === btn.id ? `${btn.color}25` : 'rgba(255,255,255,0.03)',
                    color: missionLevelFilter === btn.id ? btn.color : '#94a3b8',
                    fontSize: '11px',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  {btn.label}
                </button>
              ))}
            </div>

            {/* 30 Mission Cards Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
              {NASA_30_MISSIONS
                .filter((m) => {
                  if (missionLevelFilter !== 'ALL' && m.tier !== missionLevelFilter) return false;
                  if (missionSearchQuery.trim()) {
                    const q = missionSearchQuery.toLowerCase();
                    return m.title.toLowerCase().includes(q) || m.codeName.toLowerCase().includes(q) || m.description.toLowerCase().includes(q);
                  }
                  return true;
                })
                .map((m) => {
                  const mapConfig = NASA_MAPS[m.mapId] || NASA_MAPS['map-moon-aitken'];
                  return (
                    <div
                      key={m.id}
                      style={{
                        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.92) 0%, rgba(8, 14, 28, 0.96) 100%)',
                        border: `1.5px solid ${mapConfig.accentColor}44`,
                        borderRadius: '14px',
                        padding: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '12px',
                        boxShadow: '0 6px 20px rgba(0,0,0,0.5)',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '10px', fontWeight: 900, background: 'rgba(56, 189, 248, 0.15)', border: '1px solid #38bdf8', color: '#38bdf8', padding: '2px 8px', borderRadius: '10px' }}>
                            #{m.missionNumber.toString().padStart(2, '0')} · {m.tier} LEVEL
                          </span>
                          <span style={{ fontSize: '10px', color: mapConfig.accentColor, fontWeight: 800 }}>
                            {mapConfig.badge}
                          </span>
                        </div>

                        <div style={{ fontSize: '15px', fontWeight: 900, color: '#f8fafc', marginBottom: '4px' }}>
                          {m.title}
                        </div>
                        <div style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 700, marginBottom: '6px' }}>
                          {m.codeName} · {mapConfig.name}
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#94a3b8', lineHeight: '1.45' }}>
                          {m.description}
                        </div>
                      </div>

                      <div>
                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '10px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: '#cbd5e1' }}>
                          <span>🎯 {m.gameMechanicsInspiration}</span>
                          <span style={{ color: '#fbbf24', fontWeight: 800 }}>{m.difficultyLabel}</span>
                        </div>

                        <button
                          onClick={() => {
                            setSelectedTrailerMission(m);
                            soundFx.playReactorStart();
                          }}
                          style={{
                            width: '100%',
                            padding: '10px 14px',
                            borderRadius: '10px',
                            background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 50%, #7c3aed 100%)',
                            border: '1.5px solid #38bdf8',
                            color: '#ffffff',
                            fontSize: '11.5px',
                            fontWeight: 900,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            boxShadow: '0 0 16px rgba(56, 189, 248, 0.4)',
                            letterSpacing: '0.03em',
                          }}
                        >
                          <Film size={14} />
                          <span>🎬 3D TRAILER ➔ 🚀 FLIGHT SIMULATOR</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* ── TAB 7: 76 NASA HISTORICAL CAMPAIGN ── */}
        {activeTab === 'NASA_76_CAMPAIGN' && (
          <div style={{ minHeight: '600px', backgroundColor: '#070b13' }}>
            <MissionCampaignMap
              completedMissions={completedMissions}
              onLaunchMission={(missionId) => {
                onClose();
                if (onLaunchMission) {
                  onLaunchMission(missionId);
                }
              }}
            />
          </div>
        )}

        {/* ── TAB 8: SPACECRAFT FLEET HANGAR ── */}
        {activeTab === 'VEHICLE_HANGAR' && (
          <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(8, 14, 28, 0.98))',
                border: '1.5px solid rgba(192, 132, 252, 0.4)',
                borderRadius: '16px',
                padding: '20px 24px',
              }}
            >
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(192, 132, 252, 0.15)', border: '1px solid #c084fc', padding: '3px 10px', borderRadius: '12px', fontSize: '10.5px', color: '#c084fc', fontWeight: 800, marginBottom: '6px' }}>
                <Rocket size={12} />
                <span>NASA EXPLORATION VEHICLE FLEET · 9 AUTHENTIC SPACECRAFT</span>
              </div>
              <h3 style={{ fontSize: '22px', fontWeight: 900, color: '#f8fafc', margin: '0 0 4px 0' }}>
                NASA Spacecraft Fleet &amp; Flight Hardware Hangar
              </h3>
              <p style={{ fontSize: '12.5px', color: '#94a3b8', margin: 0, maxWidth: '720px' }}>
                Inspect real NASA flight vehicles across 3 primary mission classes: Planetary Surface Rovers, Earth Orbital Launch Systems, and Deep Space Interplanetary Starships.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
              {Object.values(NASA_VEHICLES).map((veh) => (
                <div
                  key={veh.id}
                  style={{
                    background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.92) 0%, rgba(8, 14, 28, 0.96) 100%)',
                    border: selectedVehicle.id === veh.id ? '2px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '14px',
                    padding: '18px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '12px',
                    boxShadow: selectedVehicle.id === veh.id ? '0 0 20px rgba(56, 189, 248, 0.3)' : 'none',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '28px' }}>{veh.icon}</span>
                      <span style={{ fontSize: '10px', fontWeight: 900, color: '#38bdf8', background: 'rgba(56,189,248,0.15)', padding: '2px 8px', borderRadius: '8px' }}>
                        {veh.category}
                      </span>
                    </div>

                    <div style={{ fontSize: '16px', fontWeight: 900, color: '#f8fafc', marginBottom: '2px' }}>
                      {veh.name}
                    </div>
                    <div style={{ fontSize: '11px', color: '#fbbf24', fontWeight: 700, marginBottom: '6px' }}>
                      {veh.badge} · {veh.thrust}
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#94a3b8', lineHeight: '1.45' }}>
                      {veh.description}
                    </div>

                    <div style={{ marginTop: '10px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '10.5px' }}>
                      <div style={{ background: 'rgba(255,255,255,0.04)', padding: '6px', borderRadius: '6px' }}>
                        <span style={{ color: '#64748b' }}>Top Speed: </span>
                        <strong style={{ color: '#38bdf8' }}>{veh.topSpeed}</strong>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.04)', padding: '6px', borderRadius: '6px' }}>
                        <span style={{ color: '#64748b' }}>Handling: </span>
                        <strong style={{ color: '#4ade80' }}>{veh.handling}</strong>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedVehicle(veh);
                      soundFx.playClick(900);
                    }}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: selectedVehicle.id === veh.id ? 'rgba(56, 189, 248, 0.3)' : 'rgba(255,255,255,0.06)',
                      border: selectedVehicle.id === veh.id ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.15)',
                      color: selectedVehicle.id === veh.id ? '#38bdf8' : '#e2e8f0',
                      fontSize: '11px',
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    {selectedVehicle.id === veh.id ? '✓ EQUIPPED IN HANGAR' : 'SELECT VEHICLE'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── 3D CINEMATIC TRAILER PREVIEW OVERLAY ── */}
        {selectedTrailerMission && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1300 }}>
            <MissionCinematicIntro
              mission={selectedTrailerMission}
              vehicle={selectedVehicle}
              map={NASA_MAPS[selectedTrailerMission.mapId] || NASA_MAPS['map-moon-aitken']}
              onLaunchGame={() => {
                const missionId = selectedTrailerMission.id;
                setSelectedTrailerMission(null);
                onClose();
                if (onLaunchMission) {
                  onLaunchMission(missionId);
                }
              }}
              onBackToHub={() => setSelectedTrailerMission(null)}
              isMuted={isTrailerAudioMuted}
              onToggleMute={() => setIsTrailerAudioMuted(!isTrailerAudioMuted)}
            />
          </div>
        )}
      </div>
  );

  if (isFullPage) {
    return (
      <div className="page-astronaut-academy" style={{ minHeight: 'calc(100vh - 52px)', background: 'var(--color-space-950, #04070e)', padding: '16px 20px 48px' }}>
        {modalBody}
      </div>
    );
  }

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1100 }}>
      {modalBody}
    </div>
  );
};
