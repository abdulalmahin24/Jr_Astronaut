import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  GraduationCap,
  Award,
  CheckCircle2,
  Play,
  Sparkles,
  ChevronRight,
  BookOpen,
  Rocket,
  Search,
  Building2,
  Target,
  Film,
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
  onOpenMarsSurvival?: () => void;
  onOpenHardcoreSurvival?: () => void;
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
  onOpenMarsSurvival,
  onOpenHardcoreSurvival,
}) => {
  const [progression, setProgression] = useState(getCadetProgression);
  const [selectedLessonId, setSelectedLessonId] = useState<string>(LESSONS[0].id);

  // Unified Top Navigation Tab: Ground School, Ranks, Exam, Spacesuit, 30 Progressive Missions, 76 Campaign, Hangar
  const [activeTab, setActiveTab] = useState<AcademyUnifiedTab>(initialTab);
  void (useState<AstronautRank | null>(null));

  // 30 Progressive Missions Filter States
  const [missionLevelFilter, setMissionLevelFilter] = useState<'ALL' | 'CADET' | 'OFFICER' | 'SENIOR' | 'COMMANDER' | 'MASTER'>('ALL');
  void (useState<string>('ALL'));
  const [missionSearchQuery, setMissionSearchQuery] = useState('');
  const [selectedTrailerMission, setSelectedTrailerMission] = useState<NasaLevelMission | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleConfig>(NASA_VEHICLES[0]);
  const [isTrailerAudioMuted, setIsTrailerAudioMuted] = useState(false);

  const prevInitialTabRef = useRef(initialTab);
  const prevIsOpenRef = useRef(isOpen);

  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      setActiveTab(initialTab);
      prevInitialTabRef.current = initialTab;
    } else if (initialTab && initialTab !== prevInitialTabRef.current) {
      setActiveTab(initialTab);
      prevInitialTabRef.current = initialTab;
    }
    prevIsOpenRef.current = isOpen;
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

  if (!isOpen) return null;

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

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1100 }}>
      <div
        className="modal-container"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '1240px',
          width: '98vw',
          maxHeight: '94vh',
          overflowY: 'auto',
          backgroundColor: '#070b13',
          border: '1px solid rgba(167, 139, 250, 0.45)',
          borderRadius: '18px',
          boxShadow: '0 0 50px rgba(0, 0, 0, 0.9), 0 0 30px rgba(167, 139, 250, 0.2)',
        }}
      >
        {/* Top Header */}
        <div className="modal-header" style={{ borderBottom: '1px solid rgba(167, 139, 250, 0.25)', padding: '16px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(167, 139, 250, 0.15)', border: '1px solid rgba(167, 139, 250, 0.3)' }}>
              <GraduationCap size={24} className="text-violet-400" />
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#a78bfa', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                NASA Astronaut Candidate Training Corps (ASCAN)
              </div>
              <h2 className="modal-title" style={{ fontSize: '1.35rem', fontWeight: 800 }}>
                Astronaut Academy: Earth Ground Training &amp; Space Flight Academy
              </h2>
            </div>
          </div>
          <button onClick={onClose} className="modal-close-btn">
            <X size={18} />
          </button>
        </div>

        {/* Master Navigation Strip: Ground School & Missions in One Unified Section */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#0a0f1d',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '8px 16px',
            gap: '8px',
            overflowX: 'auto',
            whiteSpace: 'nowrap',
            scrollbarWidth: 'thin',
          }}
        >
          {/* Group 1: 🎓 Ground School & Training */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '10px', fontWeight: 900, color: '#a78bfa', letterSpacing: '0.08em', padding: '0 4px' }}>
              SCHOOL:
            </span>

            <button
              id="academy-tab-curriculum"
              onClick={() => { setActiveTab('CURRICULUM'); soundFx.playClick(650); }}
              style={{
                padding: '7px 11px',
                borderRadius: '7px',
                border: activeTab === 'CURRICULUM' ? '1px solid #a78bfa' : '1px solid rgba(255,255,255,0.06)',
                backgroundColor: activeTab === 'CURRICULUM' ? 'rgba(167, 139, 250, 0.22)' : 'rgba(255,255,255,0.02)',
                color: activeTab === 'CURRICULUM' ? '#ffffff' : '#94a3b8',
                fontSize: '0.76rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer',
              }}
            >
              <span>📑 Curriculum (8 Modules)</span>
            </button>

            <button
              id="academy-tab-ranks"
              onClick={() => { setActiveTab('RANKS_HIERARCHY'); soundFx.playClick(850); }}
              style={{
                padding: '7px 11px',
                borderRadius: '7px',
                border: activeTab === 'RANKS_HIERARCHY' ? '1px solid #e11d48' : '1px solid rgba(255,255,255,0.06)',
                backgroundColor: activeTab === 'RANKS_HIERARCHY' ? 'rgba(225, 29, 72, 0.22)' : 'rgba(255,255,255,0.02)',
                color: activeTab === 'RANKS_HIERARCHY' ? '#fb7185' : '#94a3b8',
                fontSize: '0.76rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer',
              }}
            >
              <span>🎖️ Ranks &amp; Levels</span>
              <span style={{ fontSize: '0.65rem', padding: '1px 4px', borderRadius: '4px', backgroundColor: '#e11d48', color: '#fff', fontWeight: 900 }}>
                LV.{getCurrentRank(progression.xp).level}
              </span>
            </button>

            <button
              id="academy-tab-earth"
              onClick={() => { setActiveTab('EARTH_ACADEMY'); soundFx.playClick(750); }}
              style={{
                padding: '7px 11px',
                borderRadius: '7px',
                border: activeTab === 'EARTH_ACADEMY' ? '1px solid #10b981' : '1px solid rgba(255,255,255,0.06)',
                backgroundColor: activeTab === 'EARTH_ACADEMY' ? 'rgba(16, 185, 129, 0.22)' : 'rgba(255,255,255,0.02)',
                color: activeTab === 'EARTH_ACADEMY' ? '#43ffa0' : '#94a3b8',
                fontSize: '0.76rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer',
              }}
            >
              <span>🌍 Earth Exam</span>
              {hasPassedEarth && <span style={{ fontSize: '0.65rem', padding: '1px 4px', borderRadius: '4px', backgroundColor: '#10b981', color: '#000', fontWeight: 900 }}>PASS</span>}
            </button>

            <button
              id="academy-tab-space"
              onClick={() => { setActiveTab('SPACE_ACADEMY'); soundFx.playClick(850); }}
              style={{
                padding: '7px 11px',
                borderRadius: '7px',
                border: activeTab === 'SPACE_ACADEMY' ? '1.5px solid #fbbf24' : '1px solid rgba(255,255,255,0.06)',
                backgroundColor: activeTab === 'SPACE_ACADEMY' ? 'rgba(251, 191, 36, 0.22)' : 'rgba(255,255,255,0.02)',
                color: activeTab === 'SPACE_ACADEMY' ? '#fbbf24' : '#94a3b8',
                fontSize: '0.76rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer',
              }}
            >
              <span>🚀 Space Academy</span>
              {hasPassedEarth ? (
                <span style={{ fontSize: '0.65rem', padding: '1px 4px', borderRadius: '4px', backgroundColor: '#fbbf24', color: '#000', fontWeight: 900 }}>PASS</span>
              ) : (
                <span style={{ fontSize: '0.65rem', padding: '1px 4px', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.1)', color: '#94a3b8', fontWeight: 700 }}>ADVANCED</span>
              )}
            </button>

            <button
              id="academy-tab-suit"
              onClick={() => { setActiveTab('SPACESUIT_EQUIPMENT'); soundFx.playClick(700); }}
              style={{
                padding: '7px 11px',
                borderRadius: '7px',
                border: activeTab === 'SPACESUIT_EQUIPMENT' ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.06)',
                backgroundColor: activeTab === 'SPACESUIT_EQUIPMENT' ? 'rgba(56, 189, 248, 0.22)' : 'rgba(255,255,255,0.02)',
                color: activeTab === 'SPACESUIT_EQUIPMENT' ? '#ffffff' : '#94a3b8',
                fontSize: '0.76rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer',
              }}
            >
              <span>🧑‍🚀 Spacesuit Lab</span>
            </button>
          </div>

          <div style={{ width: '1px', height: '24px', backgroundColor: 'rgba(255,255,255,0.15)', margin: '0 3px' }} />

          {/* Group 2: 🚀 Missions & Flight Operations */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '9.5px', fontWeight: 900, color: '#38bdf8', letterSpacing: '0.08em', padding: '0 3px' }}>
              MISSIONS:
            </span>

            <button
              id="academy-tab-30missions"
              onClick={() => { setActiveTab('ACADEMY_30_MISSIONS'); soundFx.playClick(850); }}
              style={{
                padding: '7px 13px',
                borderRadius: '7px',
                border: activeTab === 'ACADEMY_30_MISSIONS' ? '1.5px solid #38bdf8' : '1px solid rgba(56,189,248,0.25)',
                backgroundColor: activeTab === 'ACADEMY_30_MISSIONS' ? 'rgba(56, 189, 248, 0.28)' : 'rgba(56, 189, 248, 0.08)',
                color: activeTab === 'ACADEMY_30_MISSIONS' ? '#38bdf8' : '#cbd5e1',
                fontSize: '0.78rem',
                fontWeight: 900,
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                cursor: 'pointer',
                boxShadow: activeTab === 'ACADEMY_30_MISSIONS' ? '0 0 16px rgba(56, 189, 248, 0.35)' : 'none',
              }}
            >
              <Target size={13} color="#38bdf8" />
              <span>🎯 30 Progressive Missions</span>
            </button>

            <button
              id="academy-tab-76campaign"
              onClick={() => { setActiveTab('NASA_76_CAMPAIGN'); soundFx.playClick(900); }}
              style={{
                padding: '7px 13px',
                borderRadius: '7px',
                border: activeTab === 'NASA_76_CAMPAIGN' ? '1.5px solid #fbbf24' : '1px solid rgba(251,191,36,0.25)',
                backgroundColor: activeTab === 'NASA_76_CAMPAIGN' ? 'rgba(251, 191, 36, 0.28)' : 'rgba(251, 191, 36, 0.08)',
                color: activeTab === 'NASA_76_CAMPAIGN' ? '#fbbf24' : '#cbd5e1',
                fontSize: '0.78rem',
                fontWeight: 900,
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                cursor: 'pointer',
                boxShadow: activeTab === 'NASA_76_CAMPAIGN' ? '0 0 16px rgba(251, 191, 36, 0.35)' : 'none',
              }}
            >
              <Rocket size={13} color="#fbbf24" />
              <span>🚀 76 NASA Campaign</span>
            </button>

            {onOpenMarsSurvival && (
              <button
                id="academy-tab-mars-survival"
                onClick={() => {
                  onClose();
                  onOpenMarsSurvival();
                  soundFx.playReactorStart();
                }}
                style={{
                  padding: '7px 13px',
                  borderRadius: '7px',
                  border: '1.5px solid #ef4444',
                  backgroundColor: 'rgba(239, 68, 68, 0.22)',
                  color: '#fca5a5',
                  fontSize: '0.78rem',
                  fontWeight: 900,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  cursor: 'pointer',
                  boxShadow: '0 0 14px rgba(239, 68, 68, 0.35)',
                }}
                title="Launch 4 NASA Mars Planetary Survival Operations"
              >
                <span>🔴</span>
                <span>Mars Survival (4 Ops)</span>
              </button>
            )}

            {onOpenHardcoreSurvival && (
              <button
                id="academy-tab-hardcore-survival"
                onClick={() => {
                  onClose();
                  onOpenHardcoreSurvival();
                  soundFx.playReactorStart();
                }}
                style={{
                  padding: '7px 13px',
                  borderRadius: '7px',
                  border: '1.5px solid #f97316',
                  backgroundColor: 'rgba(249, 115, 22, 0.22)',
                  color: '#fed7aa',
                  fontSize: '0.78rem',
                  fontWeight: 900,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  cursor: 'pointer',
                  boxShadow: '0 0 14px rgba(249, 115, 22, 0.35)',
                }}
                title="Launch 5 Hardcore Orbital Survival Missions (Kessler, Solar Storm, Apollo 13, Oberth, Suicide Burn)"
              >
                <span>🔥</span>
                <span>Hardcore Survival (5 Ops)</span>
              </button>
            )}

            <button
              id="academy-tab-hangar"
              onClick={() => { setActiveTab('VEHICLE_HANGAR'); soundFx.playClick(800); }}
              style={{
                padding: '7px 11px',
                borderRadius: '7px',
                border: activeTab === 'VEHICLE_HANGAR' ? '1px solid #c084fc' : '1px solid rgba(255,255,255,0.06)',
                backgroundColor: activeTab === 'VEHICLE_HANGAR' ? 'rgba(192, 132, 252, 0.22)' : 'rgba(255,255,255,0.02)',
                color: activeTab === 'VEHICLE_HANGAR' ? '#c084fc' : '#94a3b8',
                fontSize: '0.76rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer',
              }}
            >
              <span>🛸 Spacecraft Hangar</span>
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.1rem' }}>{lesson.icon}</span>
                    <div>
                      <div style={{ fontSize: '0.78rem', fontWeight: active ? 700 : 500, lineHeight: 1.2 }}>
                        {lesson.title}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: '#64748b' }}>Module #{lesson.number}</div>
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
                    color: '#a78bfa',
                    backgroundColor: 'rgba(167, 139, 250, 0.15)',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  {activeLesson.category}
                </span>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#f1f5f9', marginTop: '6px' }}>
                  {activeLesson.icon} {activeLesson.title}
                </h3>
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
                      <span>Airlock $\Delta P$ Cross-Section Schematic</span>
                      <span style={{ color: airlockPressure === 0 ? '#43ffa0' : '#38bdf8', fontWeight: 700 }}>
                        {airlockPressure === 0 ? 'STATUS: VACUUM CLEARED' : 'STATUS: PRESSURIZED'}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr 1fr', gap: '8px', alignItems: 'stretch' }}>
                      {/* Habitat Section */}
                      <div style={{ padding: '12px 8px', borderRadius: '8px', backgroundColor: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.3)', textAlign: 'center' }}>
                        <div style={{ fontSize: '1.2rem', marginBottom: '4px' }}>🏠</div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38bdf8' }}>Habitat Core</div>
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontFamily: 'monospace' }}>101.3 kPa</div>
                        <div style={{ fontSize: '0.62rem', color: '#22c55e', marginTop: '4px', fontWeight: 600 }}>Inner Hatch: LOCKED</div>
                      </div>

                      {/* Airlock Chamber Section */}
                      <div style={{ padding: '12px 8px', borderRadius: '8px', backgroundColor: isAirlockPumping ? 'rgba(234, 179, 8, 0.15)' : airlockPressure === 0 ? 'rgba(34, 197, 94, 0.12)' : 'rgba(168, 85, 247, 0.12)', border: '1px solid rgba(168, 85, 247, 0.3)', textAlign: 'center', position: 'relative' }}>
                        <div style={{ fontSize: '1.2rem', marginBottom: '4px' }}>🚪🔄</div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#c084fc' }}>Cycle Chamber</div>
                        <div style={{ fontSize: '0.9rem', color: airlockPressure === 0 ? '#43ffa0' : '#fbbf24', fontFamily: 'monospace', fontWeight: 800 }}>
                          {airlockPressure} kPa
                        </div>
                        <div style={{ fontSize: '0.62rem', color: '#94a3b8', marginTop: '4px' }}>
                          {isAirlockPumping ? 'Pumping N2/O2...' : airlockPressure === 0 ? 'EVA Ready' : 'Atmosphere Sealed'}
                        </div>
                      </div>

                      {/* Lunar Vacuum Section */}
                      <div style={{ padding: '12px 8px', borderRadius: '8px', backgroundColor: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255, 255, 255, 0.15)', textAlign: 'center' }}>
                        <div style={{ fontSize: '1.2rem', marginBottom: '4px' }}>🌑✨</div>
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
                      borderRadius: '8px',
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
                  <div style={{ backgroundColor: '#030712', borderRadius: '10px', padding: '14px', border: '1px solid rgba(234, 179, 8, 0.3)', marginBottom: '12px' }}>
                    <div style={{ fontSize: '0.72rem', color: '#fbbf24', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '8px' }}>
                      Sabatier Catalytic Reactor Flow Loop (CO2 + 4H2 → CH4 + 2H2O)
                    </div>
                    {/* Visual Reactor Pipeline */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1.3fr auto 1.2fr', alignItems: 'center', gap: '6px' }}>
                      <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', padding: '10px 8px', borderRadius: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>INLET GAS</div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#f8fafc' }}>CO₂ + 4 H₂</div>
                        <div style={{ fontSize: '0.62rem', color: '#38bdf8' }}>Crew Respiration</div>
                      </div>
                      <div style={{ color: '#fbbf24', fontSize: '1rem', fontWeight: 800 }}>➔</div>
                      <div style={{ backgroundColor: sabatierTemp >= 380 && sabatierTemp <= 440 ? 'rgba(234, 179, 8, 0.2)' : 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(234, 179, 8, 0.5)', padding: '10px 8px', borderRadius: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.7rem', color: '#fbbf24', fontWeight: 700 }}>CATALYST BED</div>
                        <div style={{ fontSize: '0.92rem', fontWeight: 900, fontFamily: 'monospace', color: '#ffffff' }}>{sabatierTemp}°C (Ru/Al₂O₃)</div>
                        <div style={{ fontSize: '0.62rem', color: sabatierTemp >= 380 && sabatierTemp <= 440 ? '#43ffa0' : '#f87171' }}>
                          {sabatierTemp >= 380 && sabatierTemp <= 440 ? 'Optimal Stoichiometry (98.4%)' : 'Sub-Optimal Conversion'}
                        </div>
                      </div>
                      <div style={{ color: '#fbbf24', fontSize: '1rem', fontWeight: 800 }}>➔</div>
                      <div style={{ backgroundColor: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.3)', padding: '10px 8px', borderRadius: '8px', textAlign: 'center' }}>
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
                  <div style={{ backgroundColor: '#030712', borderRadius: '10px', padding: '14px', border: '1px solid rgba(251, 191, 36, 0.3)', marginBottom: '12px' }}>
                    <div style={{ fontSize: '0.72rem', color: '#fbbf24', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '6px' }}>
                      Lunar South Pole Solar Incidence Geometry
                    </div>
                    {/* Visual Diagram of Solar Mast */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1.4rem' }}>☀️</div>
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
                  <div style={{ backgroundColor: '#030712', borderRadius: '10px', padding: '14px', border: '1px solid rgba(56, 189, 248, 0.3)', marginBottom: '12px' }}>
                    <div style={{ fontSize: '0.72rem', color: '#38bdf8', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '8px' }}>
                      Vapor Compression Distillation (VCD) & Catalytic Purifier
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                      <div style={{ backgroundColor: 'rgba(234, 179, 8, 0.1)', border: '1px solid rgba(234, 179, 8, 0.3)', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '1rem' }}>💧</div>
                        <div style={{ fontSize: '0.72rem', color: '#fbbf24', fontWeight: 700 }}>Graywater Inflow</div>
                        <div style={{ fontSize: '0.8rem', fontFamily: 'monospace', color: '#e2e8f0', marginTop: '2px' }}>3.2 L/Sol/Crew</div>
                      </div>
                      <div style={{ backgroundColor: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.3)', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '1rem' }}>⚙️</div>
                        <div style={{ fontSize: '0.72rem', color: '#c084fc', fontWeight: 700 }}>VCD Centrifuge</div>
                        <div style={{ fontSize: '0.8rem', fontFamily: 'monospace', color: '#43ffa0', marginTop: '2px' }}>{waterDistillRate}% Recovery</div>
                      </div>
                      <div style={{ backgroundColor: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.4)', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '1rem' }}>🚰</div>
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
                  <div style={{ backgroundColor: '#030712', borderRadius: '10px', padding: '14px', border: '1px solid rgba(34, 197, 94, 0.3)', marginBottom: '12px' }}>
                    <div style={{ fontSize: '0.72rem', color: '#43ffa0', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '8px' }}>
                      NASA Veggie / APH Controlled Spectrum Chamber
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '10px', borderRadius: '8px', backgroundColor: cropLightMode === 'photosynthetic' ? 'rgba(236, 72, 153, 0.15)' : 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <div style={{ fontSize: '2rem' }}>🌱🥗</div>
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
                        borderRadius: '8px',
                        border: cropLightMode === 'photosynthetic' ? '1px solid #f472b6' : '1px solid rgba(255,255,255,0.1)',
                        backgroundColor: cropLightMode === 'photosynthetic' ? 'rgba(236, 72, 153, 0.2)' : 'transparent',
                        color: '#f8fafc',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      🌸 Dual Photosynthetic
                    </button>
                    <button
                      onClick={() => setCropLightMode('photoperiod')}
                      style={{
                        flex: 1,
                        padding: '8px 10px',
                        borderRadius: '8px',
                        border: cropLightMode === 'photoperiod' ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.1)',
                        backgroundColor: cropLightMode === 'photoperiod' ? 'rgba(239, 68, 68, 0.2)' : 'transparent',
                        color: '#f8fafc',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      🔴 660nm Photoperiod
                    </button>
                    <button
                      onClick={() => setCropLightMode('germination')}
                      style={{
                        flex: 1,
                        padding: '8px 10px',
                        borderRadius: '8px',
                        border: cropLightMode === 'germination' ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)',
                        backgroundColor: cropLightMode === 'germination' ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
                        color: '#f8fafc',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      ⚪ White Inspection
                    </button>
                  </div>
                </div>
              )}

              {/* MODULE 6: RADIATION REGOLITH SHIELDING */}
              {activeLesson.interactiveType === 'radiation' && (
                <div>
                  <div style={{ backgroundColor: '#030712', borderRadius: '10px', padding: '14px', border: '1px solid rgba(167, 139, 250, 0.3)', marginBottom: '12px' }}>
                    <div style={{ fontSize: '0.72rem', color: '#a78bfa', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '8px' }}>
                      Lunar Surface Storm Bunker Attenuation Cross-Section
                    </div>
                    {/* Visual Cutaway */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderRadius: '8px', overflow: 'hidden' }}>
                      <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.25)', padding: '6px 12px', fontSize: '0.72rem', color: '#f87171', display: 'flex', justifyContent: 'space-between' }}>
                        <span>⚡ Space Radiation (GCR + SPE Protons)</span>
                        <span>1.50 mSv/day Unshielded</span>
                      </div>
                      <div style={{ backgroundColor: '#334155', height: `${Math.max(16, (regolithDepth / 200) * 50)}px`, transition: 'height 0.15s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', borderTop: '2px solid #64748b', borderBottom: '2px solid #64748b' }}>
                        <span style={{ fontSize: '0.72rem', color: '#cbd5e1', fontWeight: 700 }}>
                          Sintered Regolith Shield: {regolithDepth} cm
                        </span>
                      </div>
                      <div style={{ backgroundColor: regolithDepth >= 150 ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)', padding: '6px 12px', fontSize: '0.72rem', display: 'flex', justifyContent: 'space-between', color: regolithDepth >= 150 ? '#43ffa0' : '#f87171' }}>
                        <span>🏠 Crew Habitat Bunker</span>
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
                  <div style={{ backgroundColor: '#030712', borderRadius: '10px', padding: '14px', border: '1px solid rgba(249, 115, 22, 0.3)', marginBottom: '12px' }}>
                    <div style={{ fontSize: '0.72rem', color: '#fb923c', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '8px' }}>
                      Rover Terramechanics &amp; Wheel-Slip Vector Diagram
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '1.2rem', marginBottom: '4px' }}>🚜⚙️</div>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Tire Contact Patch</div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f8fafc' }}>Titanium Mesh & Chevrons</div>
                        <div style={{ fontSize: '0.65rem', color: '#fb923c', marginTop: '2px' }}>Regolith Shear: 1.8 kPa</div>
                      </div>
                      <div style={{ backgroundColor: roverSlope > 18 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)', border: roverSlope > 18 ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(34, 197, 94, 0.3)', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Calculated Wheel Slip (s)</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 900, fontFamily: 'monospace', color: roverSlope > 18 ? '#ef4444' : '#43ffa0' }}>
                          {Math.min(95, Math.round(5 + Math.pow(roverSlope / 3.2, 1.8)))}%
                        </div>
                        <div style={{ fontSize: '0.65rem', fontWeight: 700, color: roverSlope > 18 ? '#ef4444' : '#43ffa0', marginTop: '2px' }}>
                          {roverSlope > 18 ? '⚠️ DANGER: HIGH ROVER SLIP' : 'NOMINAL TRACTION'}
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
                  <div style={{ backgroundColor: '#030712', borderRadius: '10px', padding: '14px', border: '1px solid rgba(168, 85, 247, 0.3)', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.72rem', color: '#c084fc', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                        Laser Raman Spectroscopy (532 nm Excitation)
                      </span>
                      <span style={{ fontSize: '0.68rem', color: isLaserPulsing ? '#43ffa0' : '#94a3b8', fontFamily: 'monospace' }}>
                        {isLaserPulsing ? '● LASER FIRING...' : 'STANDBY'}
                      </span>
                    </div>

                    {/* Spectral Readout Bar */}
                    <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '8px', padding: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#94a3b8', marginBottom: '6px' }}>
                        <span>Target: {spectrometerTarget === 'shackleton_psr' ? 'Shackleton PSR Ice Core' : spectrometerTarget === 'regolith_matrix' ? 'Dry Regolith Glass' : 'Anorthosite Crust'}</span>
                        <span style={{ color: spectrometerTarget === 'shackleton_psr' ? '#43ffa0' : '#38bdf8', fontWeight: 700 }}>
                          {spectrometerTarget === 'shackleton_psr' ? 'H2O Peak at 3,200 cm⁻¹ (5.4% wt)' : 'Silicate Bands at 1,000 cm⁻¹'}
                        </span>
                      </div>
                      <div style={{ height: '36px', backgroundColor: '#090d16', borderRadius: '4px', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'flex-end', gap: '2px', padding: '2px 4px' }}>
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
                        borderRadius: '8px',
                        backgroundColor: '#7c3aed',
                        color: '#ffffff',
                        border: 'none',
                        fontWeight: 700,
                        fontSize: '0.78rem',
                        cursor: 'pointer',
                      }}
                    >
                      🔬 Scan Shackleton Ice Core
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
                        borderRadius: '8px',
                        backgroundColor: 'rgba(255,255,255,0.08)',
                        color: '#cbd5e1',
                        border: '1px solid rgba(255,255,255,0.15)',
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
                  <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#f8fafc', margin: '0 0 4px 0' }}>
                    🧑‍🚀 Spacesuit Anatomy &amp; Extraterrestrial Field Equipment
                  </h3>
                  <p style={{ fontSize: '0.82rem', color: '#94a3b8', margin: 0 }}>
                    Full visual breakdown of every component of the astronaut’s dress (EMU / xEMU / Orion suit) and planetary surface tools: Name, NASA Designation, Location, Function, and Physics principles.
                  </p>
                </div>

                {/* Filter Pills */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
                  {[
                    { id: 'ALL', label: `All Equipment (${SPACESUIT_PARTS.length})` },
                    { id: 'HEAD_HELMET', label: '🪖 Helmet & Audio' },
                    { id: 'TORSO_LIFE_SUPPORT', label: '🎒 Torso & Life Support' },
                    { id: 'HANDS_ARMS', label: '🧤 Pressurized Gloves' },
                    { id: 'LEGS_BOOTS', label: '🥾 Boots & Tethers' },
                    { id: 'FIELD_TOOLS', label: '🔬 Scientific Field Tools' },
                  ].map((btn) => (
                    <button
                      key={btn.id}
                      onClick={() => { setSuitFilter(btn.id as any); soundFx.playClick(650); }}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '8px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        border: suitFilter === btn.id ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)',
                        backgroundColor: suitFilter === btn.id ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255,255,255,0.03)',
                        color: suitFilter === btn.id ? '#38bdf8' : '#94a3b8',
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
                    backgroundColor: '#0c1222',
                    border: '1px solid rgba(56, 189, 248, 0.25)',
                    borderRadius: '14px',
                    padding: '18px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '12px',
                    boxShadow: '0 4px 18px rgba(0,0,0,0.5)',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <span style={{ fontSize: '2rem' }}>{part.icon}</span>
                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontFamily: 'monospace',
                          fontWeight: 800,
                          padding: '3px 8px',
                          borderRadius: '4px',
                          backgroundColor: 'rgba(56, 189, 248, 0.15)',
                          color: '#38bdf8',
                          border: '1px solid rgba(56, 189, 248, 0.3)',
                        }}
                      >
                        {part.nasaCode}
                      </span>
                    </div>

                    <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#f8fafc', margin: '0 0 6px 0' }}>
                      {part.name}
                    </h4>

                    {/* Where Used */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: '#fbbf24', fontWeight: 700, marginBottom: '8px' }}>
                      <span>📍 Where Used:</span>
                      <span style={{ color: '#fed7aa', fontWeight: 600 }}>{part.locationOnBody}</span>
                    </div>

                    {/* Primary Function */}
                    <div style={{ fontSize: '0.8rem', color: '#cbd5e1', lineHeight: 1.45, marginBottom: '10px' }}>
                      <strong style={{ color: '#f1f5f9' }}>Function: </strong>
                      {part.primaryFunction}
                    </div>

                    {/* Physics / Reason */}
                    <div style={{ padding: '8px 10px', borderRadius: '8px', backgroundColor: 'rgba(124, 58, 237, 0.12)', borderLeft: '3px solid #a78bfa', fontSize: '0.75rem', color: '#e9d5ff', lineHeight: 1.4, marginBottom: '10px' }}>
                      <strong style={{ color: '#c4b5fd' }}>Science &amp; Physics Reason: </strong>
                      {part.physicsReason}
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '10px', fontSize: '0.7rem', color: '#64748b' }}>
                    <span style={{ fontWeight: 700, color: '#94a3b8' }}>NASA Specs: </span>
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
                    icon: '🎓',
                    title: 'STEM Master’s Degree Prerequisite',
                    desc: 'Master of Science in Aerospace, Physics, Math, or Computer Science + 3 years professional technical leadership or 1,000 jet pilot hours.',
                  },
                  {
                    num: '2',
                    icon: '🏊‍♂️',
                    title: 'Neutral Buoyancy Lab (NBL)',
                    desc: '6.2-million-gallon water pool in Houston. Every 1 hour of EVA spacewalk in orbit requires 7 hours underwater wearing 140 kg suits.',
                  },
                  {
                    num: '3',
                    icon: '🌀',
                    title: 'High-G Centrifuge Conditioning',
                    desc: 'Surviving 4G to 9G launch acceleration and ballistic re-entry. Cadets learn the Anti-G Straining Maneuver (AGSM) to prevent blackouts.',
                  },
                  {
                    num: '4',
                    icon: '❄️',
                    title: 'Wilderness & Subterranean Survival',
                    desc: 'Analog survival trials in blizzards, deserts, and underground cave systems to forge psychological grit and extreme teamwork under isolation.',
                  },
                  {
                    num: '5',
                    icon: '🕹️',
                    title: 'Full-Motion Flight Simulator',
                    desc: 'Hundreds of hours mastering 6-DOF RCS thrusters, orbital rendezvous, and manual joystick lunar descent guidance.',
                  },
                ].map((m) => (
                  <div
                    key={m.num}
                    style={{
                      backgroundColor: '#0c1222',
                      border: '1px solid rgba(16, 185, 129, 0.25)',
                      borderRadius: '12px',
                      padding: '16px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <span style={{ fontSize: '1.6rem' }}>{m.icon}</span>
                      <div>
                        <div style={{ fontSize: '0.65rem', color: '#10b981', fontWeight: 800 }}>STEP #{m.num}</div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#f8fafc' }}>{m.title}</div>
                      </div>
                    </div>
                    <p style={{ fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.45, margin: 0 }}>
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

                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <button
                        onClick={() => {
                          setEarthSubmitted(false);
                          setEarthAnswers({});
                          soundFx.playClick(750);
                        }}
                        style={{
                          padding: '9px 16px',
                          borderRadius: '8px',
                          backgroundColor: 'rgba(56, 189, 248, 0.15)',
                          border: '1px solid #38bdf8',
                          color: '#38bdf8',
                          fontWeight: 800,
                          fontSize: '0.83rem',
                          cursor: 'pointer',
                        }}
                      >
                        🔄 Retake Exam
                      </button>

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
                    icon: '🛰️',
                    title: 'Orbital Rendezvous & 6-DOF Docking',
                    sub: 'V-Bar & R-Bar Trajectories',
                    desc: 'Approach speeds must drop below 0.05 m/s. Thrusters must modulate 6 degrees of freedom to align guide petals within 0.5 degrees.',
                  },
                  {
                    icon: '💨',
                    title: 'Closed-Loop ECLSS Sabatier',
                    sub: 'CO2 + 4H2 → CH4 + 2H2O',
                    desc: 'Catalytic ruthenium reactor operating at 400°C turns crew exhaled breath into drinkable water and combustible methane fuel.',
                  },
                  {
                    icon: '🏗️',
                    title: 'Outpost Construction & Kilopower',
                    sub: 'Sintered Regolith Vaults',
                    desc: '1.5 to 2.0 meters of compacted regolith shields against deep-space cosmic rays while KRUSTY fission reactors power the 354-hour lunar night.',
                  },
                  {
                    icon: '🚜',
                    title: 'Surface Rover Terramechanics',
                    sub: 'Titanium Mesh Wheels',
                    desc: 'Managing wheel slip on 15°–18° crater slopes. Normal force and shear stress calculation prevents catastrophic vehicle rollover.',
                  },
                  {
                    icon: '🧊',
                    title: 'Polar Ice Coring & Spectrometry',
                    sub: 'Shackleton Crater PSR (40 Kelvin)',
                    desc: 'Extracting volatile water ice in permanent shadow. 1 metric ton of lunar ice yields 890 kg breathable O2 and 110 kg rocket hydrogen fuel!',
                  },
                ].map((d) => (
                  <div
                    key={d.title}
                    style={{
                      backgroundColor: '#0c1222',
                      border: '1px solid rgba(251, 191, 36, 0.25)',
                      borderRadius: '12px',
                      padding: '16px',
                    }}
                  >
                    <div style={{ fontSize: '1.8rem', marginBottom: '4px' }}>{d.icon}</div>
                    <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#f8fafc' }}>{d.title}</div>
                    <div style={{ fontSize: '0.68rem', color: '#fbbf24', fontWeight: 700, marginBottom: '6px' }}>{d.sub}</div>
                    <p style={{ fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.45, margin: 0 }}>
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

        {/* ── TAB 5: ASTRONAUT CADET RANKS & HIERARCHY (ছোট থেকে বড় পদবী) ── */}
        {activeTab === 'RANKS_HIERARCHY' && (() => {
          const rankProg = getRankProgress(progression.xp);
          return (
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px', backgroundColor: '#070a13' }}>
              <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                {/* Header Banner */}
                <div
                  style={{
                    padding: '24px',
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, rgba(225, 29, 72, 0.2) 0%, rgba(15, 23, 42, 0.8) 100%)',
                    border: '1px solid rgba(225, 29, 72, 0.4)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <span style={{ fontSize: '1.6rem' }}>🎖️</span>
                        <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#f8fafc', margin: 0, fontFamily: 'var(--font-space)' }}>
                          NASA Astronaut Rank Hierarchy &amp; Career Ladder
                        </h3>
                        <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', backgroundColor: '#e11d48', color: '#fff', fontWeight: 900 }}>
                          ৬টি ধাপে পদবী বিভাজন
                        </span>
                      </div>
                      <p style={{ fontSize: '0.88rem', color: '#cbd5e1', margin: 0, maxWidth: '820px', lineHeight: 1.5 }}>
                        মহাকাশচারী হতে হলে শিশুদের একেবারে প্রাথমিক তারা অনুসন্ধানকারী (Junior Stargazer) থেকে শুরু করে ধাপে ধাপে প্রশিক্ষণ, পরীক্ষা ও মহাকাশ অভিযানের মাধ্যমে সর্বোচ্চ ইন্টারপ্ল্যানেটারি সুপ্রিম কমান্ডার পদে পৌঁছাতে হয়। নিচে ছোট থেকে বড় পদবীসমূহের বিস্তারিত দেওয়া হলো:
                      </p>
                    </div>

                    {/* Active Cadet Live Rank Badge */}
                    <div
                      style={{
                        padding: '12px 18px',
                        borderRadius: '12px',
                        background: rankProg.currentRank.bgGradient,
                        border: `1px solid ${rankProg.currentRank.color}`,
                        textAlign: 'center',
                        minWidth: '220px',
                        boxShadow: `0 0 20px ${rankProg.currentRank.glowColor}`,
                      }}
                    >
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase' }}>
                        আপনার বর্তমান পদবী
                      </div>
                      <div style={{ fontSize: '1.3rem', fontWeight: 900, color: rankProg.currentRank.color, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', margin: '4px 0' }}>
                        <span>{rankProg.currentRank.badgeEmoji}</span>
                        <span>লেভেল {rankProg.currentRank.level}</span>
                      </div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#f1f5f9' }}>
                        {rankProg.currentRank.titleEn}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#cbd5e1', marginTop: '2px' }}>
                        {rankProg.currentRank.titleBn}
                      </div>
                    </div>
                  </div>

                  {/* Dynamic XP Progress Bar to Next Rank */}
                  <div style={{ marginTop: '20px', background: 'rgba(0, 0, 0, 0.4)', borderRadius: '10px', padding: '12px 16px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', marginBottom: '6px', fontWeight: 700 }}>
                      <span style={{ color: '#cbd5e1' }}>
                        মোট অর্জিত অভিজ্ঞতা: <strong style={{ color: '#43ffa0' }}>{progression.xp} XP</strong>
                      </span>
                      {rankProg.nextRank ? (
                        <span style={{ color: rankProg.nextRank.color }}>
                          পরবর্তী পদবী: <strong>{rankProg.nextRank.titleEn}</strong> ({rankProg.xpNeeded} XP প্রয়োজন)
                        </span>
                      ) : (
                        <span style={{ color: '#fbbf24' }}>🏆 সর্বোচ্চ পদবী অর্জিত!</span>
                      )}
                    </div>
                    <div style={{ width: '100%', height: '8px', backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${rankProg.progressPercent}%`,
                          height: '100%',
                          background: 'linear-gradient(90deg, #38bdf8, #10b981, #f59e0b)',
                          borderRadius: '4px',
                          transition: 'width 0.4s ease',
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Visual Ladder Stepper Roadmap */}
                <div style={{ background: 'rgba(15, 23, 42, 0.7)', borderRadius: '14px', padding: '16px 20px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '14px', letterSpacing: '0.05em' }}>
                    🚀 Astronaut Career Progression Ladder (ধাপ ১ থেকে ধাপ ৬)
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px' }}>
                    {ASTRONAUT_RANKS.map((rank) => {
                      const isCurrent = rank.level === rankProg.currentRank.level;
                      const isUnlocked = progression.xp >= rank.minXp;
                      return (
                        <div
                          key={rank.id}
                          style={{
                            padding: '10px 12px',
                            borderRadius: '8px',
                            background: isCurrent ? 'rgba(16, 185, 129, 0.2)' : isUnlocked ? 'rgba(30, 41, 59, 0.6)' : 'rgba(15, 23, 42, 0.4)',
                            border: isCurrent ? '2px solid #10b981' : isUnlocked ? `1px solid ${rank.color}` : '1px dashed rgba(255, 255, 255, 0.1)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px',
                            position: 'relative',
                            boxShadow: isCurrent ? '0 0 16px rgba(16, 185, 129, 0.4)' : 'none',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '1.2rem' }}>{rank.badgeEmoji}</span>
                            <span style={{ fontSize: '0.65rem', fontWeight: 900, color: isCurrent ? '#43ffa0' : rank.color }}>
                              LEVEL {rank.level}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.78rem', fontWeight: 800, color: isUnlocked ? '#ffffff' : '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {rank.titleEn.split('&')[0]}
                          </div>
                          <div style={{ fontSize: '0.68rem', color: isUnlocked ? '#94a3b8' : '#475569' }}>
                            {rank.minXp} XP+
                          </div>
                          {isCurrent && (
                            <span style={{ position: 'absolute', top: '-6px', right: '6px', fontSize: '8px', background: '#10b981', color: '#000', fontWeight: 900, padding: '1px 4px', borderRadius: '3px' }}>
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
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>📚</span>
                    <span>পদবীসমূহের পূর্ণাঙ্গ বিবরণ (দায়িত্ব, ইকুইপমেন্ট ও প্রমোশন নিয়ম)</span>
                  </div>

                  {ASTRONAUT_RANKS.map((rank) => {
                    const isCurrent = rank.level === rankProg.currentRank.level;
                    const isUnlocked = progression.xp >= rank.minXp;

                    return (
                      <div
                        key={rank.id}
                        style={{
                          backgroundColor: 'rgba(15, 23, 42, 0.85)',
                          borderRadius: '16px',
                          border: isCurrent ? `2px solid ${rank.color}` : '1px solid rgba(255, 255, 255, 0.1)',
                          borderLeft: `6px solid ${rank.color}`,
                          padding: '20px 24px',
                          boxShadow: isCurrent ? `0 0 28px ${rank.glowColor}` : '0 4px 20px rgba(0, 0, 0, 0.3)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '14px',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        {/* Top Rank Title Row */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <div
                              style={{
                                width: '56px',
                                height: '56px',
                                borderRadius: '12px',
                                background: rank.bgGradient,
                                border: `2px solid ${rank.color}`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '2rem',
                                boxShadow: `0 0 20px ${rank.glowColor}`,
                              }}
                            >
                              {rank.badgeEmoji}
                            </div>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                <span style={{ fontSize: '0.72rem', background: rank.color, color: '#000', fontWeight: 900, padding: '2px 8px', borderRadius: '4px' }}>
                                  পদবী ধাপ {rank.level} · LEVEL {rank.level}
                                </span>
                                <span style={{ fontSize: '0.75rem', background: 'rgba(255, 255, 255, 0.1)', color: '#cbd5e1', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
                                  {rank.ageGroup}
                                </span>
                                {isCurrent && (
                                  <span style={{ fontSize: '0.72rem', background: '#10b981', color: '#000', fontWeight: 900, padding: '2px 8px', borderRadius: '4px' }}>
                                    ⭐ আপনার বর্তমান সক্রিয় পদ
                                  </span>
                                )}
                              </div>
                              <h4 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#ffffff', margin: '4px 0 2px 0', fontFamily: 'var(--font-space)' }}>
                                {rank.titleEn}
                              </h4>
                              <div style={{ fontSize: '0.9rem', color: rank.color, fontWeight: 700 }}>
                                {rank.titleBn}
                              </div>
                            </div>
                          </div>

                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
                              নাসা সমমান পদবী
                            </div>
                            <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#e2e8f0', fontFamily: 'var(--font-mono)' }}>
                              {rank.nasaEquivalent}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: isUnlocked ? '#43ffa0' : '#f59e0b', marginTop: '4px', fontWeight: 800 }}>
                              {isUnlocked ? '🔓 পদবী আনলকড' : `🔒 লকড (${rank.minXp} XP প্রয়োজন)`}
                            </div>
                          </div>
                        </div>

                        {/* Rank Summary */}
                        <p style={{ fontSize: '0.88rem', color: '#cbd5e1', margin: 0, lineHeight: 1.5, background: 'rgba(0, 0, 0, 0.25)', padding: '10px 14px', borderRadius: '8px' }}>
                          {rank.summary}
                        </p>

                        {/* Responsibilities & Unlocked Gear Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '14px' }}>
                          
                          {/* 1. Responsibilities */}
                          <div style={{ background: 'rgba(2, 6, 23, 0.5)', padding: '12px 16px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                            <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span>📋</span>
                              <span>মূল দায়িত্ব ও প্রশিক্ষণ (Responsibilities)</span>
                            </div>
                            <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.82rem', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                              {rank.responsibilities.map((resp, i) => (
                                <li key={i}>{resp}</li>
                              ))}
                            </ul>
                          </div>

                          {/* 2. Unlocked Gear & Equipment */}
                          <div style={{ background: 'rgba(2, 6, 23, 0.5)', padding: '12px 16px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                            <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span>🎒</span>
                              <span>আনলক হওয়া ইকুইপমেন্ট ও সুবিধা (Unlocked Perks)</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              {rank.unlockedGear.map((gear, i) => (
                                <div
                                  key={i}
                                  style={{
                                    fontSize: '0.8rem',
                                    color: '#e2e8f0',
                                    background: 'rgba(56, 189, 248, 0.08)',
                                    padding: '5px 10px',
                                    borderRadius: '6px',
                                    border: '1px solid rgba(56, 189, 248, 0.2)',
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
                            background: 'rgba(245, 158, 11, 0.1)',
                            border: '1px solid rgba(245, 158, 11, 0.3)',
                            borderRadius: '8px',
                            padding: '8px 14px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '8px',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '1.1rem' }}>🎯</span>
                            <span style={{ fontSize: '0.82rem', color: '#fbbf24', fontWeight: 700 }}>
                              <strong>পরবর্তী পদে প্রমোশন নিয়ম:</strong> {rank.promotionCriteria}
                            </span>
                          </div>
                          <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: '#94a3b8' }}>
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

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                          <button
                            onClick={() => {
                              setSelectedTrailerMission(m);
                              soundFx.playReactorStart();
                            }}
                            style={{
                              padding: '9px 10px',
                              borderRadius: '9px',
                              background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.35) 0%, rgba(37, 99, 235, 0.45) 100%)',
                              border: '1.5px solid #38bdf8',
                              color: '#ffffff',
                              fontSize: '11px',
                              fontWeight: 900,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '5px',
                              boxShadow: '0 0 12px rgba(56, 189, 248, 0.3)',
                            }}
                          >
                            <Film size={13} />
                            <span>🎬 3D TRAILER</span>
                          </button>

                          <button
                            onClick={() => {
                              onClose();
                              if (onLaunchMission) {
                                onLaunchMission(m.id);
                              }
                            }}
                            style={{
                              padding: '9px 10px',
                              borderRadius: '9px',
                              background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                              border: '1.5px solid #43ffa0',
                              color: '#ffffff',
                              fontSize: '11px',
                              fontWeight: 900,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '5px',
                              boxShadow: '0 0 12px rgba(67, 255, 160, 0.35)',
                            }}
                          >
                            <Play size={13} fill="#ffffff" />
                            <span>🚀 LAUNCH NOW</span>
                          </button>
                        </div>
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
            {onOpenMarsSurvival && (
              <div style={{
                margin: '16px 24px 0 24px',
                padding: '14px 20px',
                background: 'linear-gradient(90deg, rgba(239, 68, 68, 0.25) 0%, rgba(15, 23, 42, 0.95) 100%)',
                border: '1.5px solid rgba(239, 68, 68, 0.6)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '14px',
                boxShadow: '0 4px 25px rgba(239, 68, 68, 0.25)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <span style={{ fontSize: '28px' }}>🔴</span>
                  <div>
                    <div style={{ fontWeight: 900, fontSize: '14px', color: '#fca5a5', fontFamily: 'var(--font-space)' }}>
                      NASA MARS PLANETARY SURVIVAL SUITE (4 SPECIAL OPERATIONS)
                    </div>
                    <div style={{ fontSize: '11px', color: '#cbd5e1', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                      Jezero MOXIE O₂ Extraction · Gale REMS Dust Storm · Valles Marineris Ice Core · Elysium Quake
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    onClose();
                    onOpenMarsSurvival();
                    soundFx.playReactorStart();
                  }}
                  style={{
                    padding: '9px 18px',
                    background: '#ef4444',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 900,
                    fontSize: '11.5px',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-mono)',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 0 16px rgba(239, 68, 68, 0.6)',
                  }}
                >
                  LAUNCH 4 SURVIVAL OPS ▶
                </button>
              </div>
            )}
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
    </div>
  );
};
