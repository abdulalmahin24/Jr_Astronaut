/**
 * astronautRanks.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Official NASA-inspired Cadet Rank Hierarchy & Progression System for Jr_AstroCamp.
 * Aligned with NASA Astronaut Candidate (ASCAN) training protocols, Johnson Space
 * Center (JSC) milestones, and Artemis Deep Space Expedition roles.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export interface AstronautRank {
  level: number;
  id: string;
  titleEn: string;
  titleBn: string;
  badgeCode: string;
  badgeName: string;
  color: string;
  bgGradient: string;
  glowColor: string;
  minXp: number;
  ageGroup: string;
  nasaEquivalent: string;
  summary: string;
  responsibilities: string[];
  unlockedGear: string[];
  promotionCriteria: string;
}

export const ASTRONAUT_RANKS: AstronautRank[] = [
  {
    level: 1,
    id: 'rank-1-stargazer',
    titleEn: 'Junior Stargazer & Space Scout',
    titleBn: 'Junior Stargazer & Space Scout (Level 1)',
    badgeCode: 'STR-01',
    badgeName: 'Bronze Stargazer Insignia',
    color: '#38bdf8',
    bgGradient: 'linear-gradient(135deg, rgba(56, 189, 248, 0.25), rgba(2, 132, 199, 0.25))',
    glowColor: 'rgba(56, 189, 248, 0.5)',
    minXp: 0,
    ageGroup: 'Ages 6–9 (Elementary Cadets)',
    nasaEquivalent: 'NASA Space Science Explorer / Earth Observer',
    summary: 'The inaugural gateway into astronautics. Cadets master nocturnal constellations, locate lunar maria, track planetary orbits, and absorb core astrophysics fundamentals.',
    responsibilities: [
      'Identify principal celestial constellations (Orion, Ursa Major, Cassiopeia)',
      'Map lunar landmarks including Mare Tranquillitatis and Shackleton Crater',
      'Complete STEM graphic novel chapters on orbital mechanics basics',
      'Attend foundational ground school lectures on spaceflight safety'
    ],
    unlockedGear: [
      'Refractor Optical Stargazer Telescope (70mm aperture)',
      'Lunar Surface Cartography & Ephemeris Star Map',
      'Cadet Flight Log & Technical Science Journal'
    ],
    promotionCriteria: 'Study Curriculum Modules 1–2 and complete one certification quiz to earn 250 XP.'
  },
  {
    level: 2,
    id: 'rank-2-ascan',
    titleEn: 'ASCAN — Astronaut Candidate',
    titleBn: 'ASCAN — Astronaut Candidate (Level 2)',
    badgeCode: 'ASC-02',
    badgeName: 'Silver Candidate Wings',
    color: '#a78bfa',
    bgGradient: 'linear-gradient(135deg, rgba(167, 139, 250, 0.25), rgba(124, 58, 237, 0.25))',
    glowColor: 'rgba(167, 139, 250, 0.5)',
    minXp: 250,
    ageGroup: 'Ages 9–12 (Middle School Cadets)',
    nasaEquivalent: 'Astronaut Candidate, NASA Johnson Space Center (JSC)',
    summary: 'Official NASA flight training entrant. Candidates undergo underwater spacewalk trials at the Neutral Buoyancy Lab (NBL), endure centrifuge high-G conditioning, and pass Earth Ground School.',
    responsibilities: [
      'Log simulated EVA runs in the 6.2-million-gallon Neutral Buoyancy Lab',
      'Master the Anti-G Straining Maneuver (AGSM) under 4G to 9G acceleration',
      'Pass desert and arctic analog wilderness survival training trials',
      'Earn passing scores on the Earth Ground Academy qualifying examination'
    ],
    unlockedGear: [
      'LCVG Liquid Cooling & Ventilation Undergarment (91m tubing)',
      'Communications Carrier Assembly ("Snoopy Cap") dual audio headset',
      'T-38 Supersonic Jet Flight Avionics Trainer Simulator Key'
    ],
    promotionCriteria: 'Score ≥75% on the Earth Ground Academy Qualifying Exam to reach 600 XP.'
  },
  {
    level: 3,
    id: 'rank-3-specialist',
    titleEn: 'Flight Engineer & Mission Specialist',
    titleBn: 'Flight Engineer & Mission Specialist (Level 3)',
    badgeCode: 'ENG-03',
    badgeName: 'Gold Spacewalk Specialist Wings',
    color: '#10b981',
    bgGradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(5, 150, 105, 0.25))',
    glowColor: 'rgba(16, 185, 129, 0.5)',
    minXp: 600,
    ageGroup: 'Ages 12–15 (Junior High / High School)',
    nasaEquivalent: 'Active ISS / Lunar Gateway Mission Specialist',
    summary: 'Fully certified orbital astronaut qualified for open-vacuum extravehicular activities (EVA), robotic arm berthing, and closed-loop environmental life-support engineering.',
    responsibilities: [
      'Execute open-space microgravity spacewalks outside orbital habitat modules',
      'Operate 17-meter Canadarm2 robotic arms to capture visiting resupply crafts',
      'Manage catalytic Sabatier reactors turning exhaled CO2 into potable water and methane',
      'Perform rapid depressurization leak mitigation and airlock pressure cycle repairs'
    ],
    unlockedGear: [
      'PLSS Portable Life Support System Backpack (8.5-hr pure O2 capacity)',
      '14-Layer Thermal Micrometeoroid Garment (TMG) with pure vapor-gold visor',
      'Phase VI Resistive-Heated Pressurized Gloves & SAFER Emergency Jetpack'
    ],
    promotionCriteria: 'Complete 5 flight simulation modules and reach 1,200 XP.'
  },
  {
    level: 4,
    id: 'rank-4-navigator',
    titleEn: 'Lunar Surface Navigator & Rover Pilot',
    titleBn: 'Lunar Surface Navigator & Rover Pilot (Level 4)',
    badgeCode: 'NAV-04',
    badgeName: 'Lunar Rover Golden Wheel Insignia',
    color: '#f97316',
    bgGradient: 'linear-gradient(135deg, rgba(249, 115, 22, 0.25), rgba(194, 65, 12, 0.25))',
    glowColor: 'rgba(249, 115, 22, 0.5)',
    minXp: 1200,
    ageGroup: 'Ages 14–18 (Senior Flight Academy)',
    nasaEquivalent: 'NASA Artemis Surface Rover Pilot / Lunar Geologist',
    summary: 'Specialist pilot navigating rugged terrain around Shackleton Crater at the lunar South Pole. Expert in driving rover chassis across steep 18-degree crater slopes in -250°C permanent shadows.',
    responsibilities: [
      'Pilot multi-terrain surface rovers through Permanently Shadowed Regions (PSRs)',
      'Operate rotary-percussive core drills to extract cryogenic volatile ice samples',
      'Calculate wheel slip ratios, regolith shear stress, and terramechanics angles',
      'Conduct ultraviolet and Raman laser spectrometry on excavated sub-surface minerals'
    ],
    unlockedGear: [
      'Artemis MK-IV Surface Terrain Vehicle Master Pilot Certification',
      'SHERLOC Laser Raman Spectrometer & Percussive Core Drill Array',
      'Indium Knife-Edge Hermetic Vacuum Sample Caching Flasks'
    ],
    promotionCriteria: 'Extract ice cores on lunar rover surface sorties and earn 2,500 XP.'
  },
  {
    level: 5,
    id: 'rank-5-commander',
    titleEn: 'Lunar Outpost Commander',
    titleBn: 'Lunar Outpost Commander (Level 5)',
    badgeCode: 'CMD-05',
    badgeName: 'Artemis Base Commander Wreath',
    color: '#f59e0b',
    bgGradient: 'linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(217, 119, 6, 0.25))',
    glowColor: 'rgba(245, 158, 11, 0.5)',
    minXp: 2500,
    ageGroup: 'Elite Flight Leaders',
    nasaEquivalent: 'Commander, Artemis Base Camp (South Pole Station)',
    summary: 'Chief commander of humanity’s first permanent extraterrestrial habitat. Oversees life support, fission power distribution, and survival across the grueling 354-hour lunar night.',
    responsibilities: [
      'Sustain zero-casualty crew safety through 14-day lunar nights and solar storms',
      'Balance electrical loads across 10 kWe Kilopower fission reactors and solar masts',
      'Supervise coordinated operations across 12 academy habitats and scientific depots',
      'Deploy sintered regolith radiation shelters and megawatt energy storage arrays'
    ],
    unlockedGear: [
      '12-Station Artemis Surface Base Architectural Master Schematic',
      'Kilopower 10 kWe Fission Reactor Primary Supervisory Command Access',
      'Ka-Band Deployable Deep Space Network (DSN) Earth High-Gain Array'
    ],
    promotionCriteria: 'Survive 30 lunar sols with nominal outpost reserves and reach 4,000 XP.'
  },
  {
    level: 6,
    id: 'rank-6-supreme',
    titleEn: 'Supreme Interplanetary Commander',
    titleBn: 'Supreme Interplanetary Commander (Level 6)',
    badgeCode: 'SUP-06',
    badgeName: 'Diamond Nebula Grand Cross',
    color: '#e11d48',
    bgGradient: 'linear-gradient(135deg, rgba(225, 29, 72, 0.25), rgba(159, 18, 57, 0.25))',
    glowColor: 'rgba(225, 29, 72, 0.6)',
    minXp: 4000,
    ageGroup: 'Master of Spaceflight (Supreme Rank)',
    nasaEquivalent: 'Chief of the NASA Astronaut Office / Mars Mission Director',
    summary: 'The pinnacle rank of the space program. Directs human colonization at Jezero Crater on Mars, commands the fleet of 76 historic and future NASA flights, and mentors the next generation.',
    responsibilities: [
      'Direct crew landings and base construction at Jezero Crater on Mars',
      'Exercise master command over 76 historical and deep-space mission campaigns',
      'Mentor and train incoming cadet classes across global aerospace institutions',
      'Authorize interplanetary trajectories and interstellar propulsion blueprints'
    ],
    unlockedGear: [
      'Orion Deep Space Interplanetary Starship Command Flag',
      'Diamond Nebula Grand Cross & Supreme Spaceflight Medal of Honor',
      'NASA International Space Apps Hall of Fame Permanent Legend Status'
    ],
    promotionCriteria: 'Maximum Rank Attained. You are now a commanding mentor for the next generation.'
  }
];

export function getRankByLevel(level: number): AstronautRank {
  return ASTRONAUT_RANKS.find((r) => r.level === level) || ASTRONAUT_RANKS[0];
}

export function getCurrentRank(xp: number): AstronautRank {
  for (let i = ASTRONAUT_RANKS.length - 1; i >= 0; i--) {
    if (xp >= ASTRONAUT_RANKS[i].minXp) {
      return ASTRONAUT_RANKS[i];
    }
  }
  return ASTRONAUT_RANKS[0];
}

export function getNextRank(xp: number): AstronautRank | null {
  const current = getCurrentRank(xp);
  const nextLevel = current.level + 1;
  return ASTRONAUT_RANKS.find((r) => r.level === nextLevel) || null;
}

export function getRankProgress(xp: number): {
  currentRank: AstronautRank;
  nextRank: AstronautRank | null;
  progressPercent: number;
  xpNeeded: number;
} {
  const currentRank = getCurrentRank(xp);
  const nextRank = getNextRank(xp);

  if (!nextRank) {
    return {
      currentRank,
      nextRank: null,
      progressPercent: 100,
      xpNeeded: 0
    };
  }

  const range = nextRank.minXp - currentRank.minXp;
  const earnedInRange = Math.max(0, xp - currentRank.minXp);
  const progressPercent = Math.min(100, Math.floor((earnedInRange / range) * 100));
  const xpNeeded = Math.max(0, nextRank.minXp - xp);

  return {
    currentRank,
    nextRank,
    progressPercent,
    xpNeeded
  };
}
