export interface ClassroomLesson {
  id: string;
  order: number;
  title: string;
  subtitle: string;
  category: 'CAREER_PATH' | 'SPACECRAFT_SYSTEMS' | 'LAUNCH_DYNAMICS' | 'DOCKING' | 'LANDING' | 'SURFACE_OPS';
  durationMins: number;
  instructor: string;
  instructorRole: string;
  instructorAvatar: string;
  badgeName: string;
  rewardCredits: number;
  keyConcepts: string[];
  lectureScript: {
    heading: string;
    body: string;
    callout?: string;
    formulaOrChecklist?: string;
  }[];
  flightChecklist: {
    step: string;
    detail: string;
    status: 'PENDING' | 'CHECKED';
  }[];
  exam: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
}

export const ASTRONAUT_CLASSES: ClassroomLesson[] = [
  {
    id: 'class-1-who-becomes-astronaut',
    order: 1,
    title: 'The Path to the Stars: How to Become an Astronaut',
    subtitle: 'Qualifications, ASCAN Boot Camp, and What It Takes to Fly for NASA',
    category: 'CAREER_PATH',
    durationMins: 15,
    instructor: 'Commander Maya Lin',
    instructorRole: 'NASA Flight Director & Artemis II Veteran',
    instructorAvatar: '👩‍🚀',
    badgeName: 'ASCAN Candidate Pin',
    rewardCredits: 3500,
    keyConcepts: [
      'STEM Degree & Operational Experience Requirements',
      'The 2-Year Astronaut Candidate (ASCAN) Syllabus',
      'Neutral Buoyancy Spacewalk Training (NBL)',
      'High-G Jet Flight & Centrifuge Conditioning',
      'Teamwork & Extreme Expedition Psychology',
    ],
    lectureScript: [
      {
        heading: '1. What Are the Real Requirements?',
        body: 'Every year, NASA receives over 12,000 applications for fewer than 12 astronaut candidate slots. To qualify, you must hold a Master’s degree in a STEM field (engineering, biological science, physical science, computer science, or mathematics), accompanied by at least three years of related professional experience or 1,000 hours of pilot-in-command time on jet aircraft.',
        callout: 'NASA selects two main astronaut tracks: Pilots (who command spacecraft) and Mission Specialists (who conduct EVAs, robotics, and complex deep space experiments).',
      },
      {
        heading: '2. Physical & Medical Standards',
        body: 'Astronauts must pass rigorous long-duration flight physicals: 20/20 vision (correctable with surgery or glasses), blood pressure not exceeding 140/90 sitting, and height between 62 and 75 inches to ensure fit in Orion and Commercial Crew couches. But physical fitness is only 20% of the battle—psychological adaptability under isolated, high-stress conditions is paramount.',
      },
      {
        heading: '3. The 2-Year ASCAN Boot Camp',
        body: 'Once selected, you report to Johnson Space Center in Houston as an "ASCAN". For two full years, you undergo: underwater spacewalk training in the 6.2-million-gallon Neutral Buoyancy Lab (wearing 140 kg spacesuits for 6 hours straight), T-38 supersonic flight decision-making, wilderness survival in blizzards and deserts, Russian/Japanese language fluency, and robotics operation.',
        formulaOrChecklist: 'NBL Training Ratio: Every 1 Hour of Spacewalk in Orbit = 7 Hours Underwater in Houston Pool!',
      },
    ],
    flightChecklist: [
      { step: 'STEM Degree Verified', detail: 'Master of Science in Aerospace, Physics, or Bio-Engineering', status: 'CHECKED' },
      { step: 'Aviation & Operational Hours', detail: 'Log 1,000+ flight or complex technical simulation hours', status: 'CHECKED' },
      { step: 'Class 1 Flight Physical', detail: 'Cardiovascular, vestibular balance, and atmospheric delta-P tolerance', status: 'CHECKED' },
      { step: 'Expeditionary Teamwork Assessment', detail: 'Pass subterranean cave analog and NEEMO underwater habitat trials', status: 'PENDING' },
    ],
    exam: {
      question: 'Which of the following is an absolute educational prerequisite to apply as a NASA Astronaut Candidate?',
      options: [
        'A high school diploma with honors in physical education',
        'A Master’s degree in a STEM discipline with at least 3 years of professional experience',
        'At least 10 years of commercial passenger airline flight time',
        'A degree in science journalism or public communication'
      ],
      correctIndex: 1,
      explanation: 'NASA mandates a Master’s degree in a STEM field (Science, Technology, Engineering, or Math) combined with 3 years of related technical experience or 1,000 hours as pilot-in-command.',
    },
  },
  {
    id: 'class-2-spacecraft-systems',
    order: 2,
    title: 'Spacecraft Systems & Life-Support Stoichiometry',
    subtitle: 'Mastering ECLSS, Sabatier Loops, and Atmosphere Control in the Vacuum',
    category: 'SPACECRAFT_SYSTEMS',
    durationMins: 20,
    instructor: 'Dr. Marcus Vance',
    instructorRole: 'Lead ECLSS Engineer, NASA Johnson Space Center',
    instructorAvatar: '👨‍🔬',
    badgeName: 'ECLSS Systems Specialist',
    rewardCredits: 4000,
    keyConcepts: [
      'Atmospheric Pressure & 101.3 kPa vs 29.6 kPa Suit Differential',
      'The Bends & 100% Oxygen Pre-Breathe Protocol',
      'Sabatier Reaction: CO2 + 4H2 -> CH4 + 2H2O',
      'Urine Processor Assembly (UPA) Vacuum Distillation',
      'Thermal Control: Radiating Heat into Deep Space (3 Kelvin)',
    ],
    lectureScript: [
      {
        heading: '1. Surviving the Vacuum: Delta-P Differentials',
        body: 'Space is a hard vacuum with zero ambient pressure. Inside the habitat, we maintain Earth sea-level pressure (101.3 kPa, 78% Nitrogen, 21% Oxygen). However, a flexible spacesuit cannot bend if inflated to full sea-level pressure—it would become as stiff as a steel beam! Therefore, spacesuits operate at 29.6 kPa (4.3 psi) of pure 100% Oxygen.',
        callout: 'DANGER: Transitioning too quickly from 101.3 kPa to 29.6 kPa causes nitrogen in your blood to boil into bubbles, inducing decompression sickness ("the bends"). Astronauts must pre-breathe 100% O2 for up to 2 hours before opening the airlock!',
      },
      {
        heading: '2. The Chemical Cycle of Life: The Sabatier Reactor',
        body: 'Every human breathes out ~1.0 kg of CO2 daily. Rather than venting it into space, we pass it over a heated ruthenium catalyst at 400°C with hydrogen gas. The Sabatier reaction chemically turns that waste into methane gas (vented) and fresh, pure potable water!',
        formulaOrChecklist: 'Chemical Equation: CO₂ + 4H₂ ➔ CH₄ + 2H₂O + Heat (exothermic recovery)',
      },
      {
        heading: '3. 98% Water Loop Closure',
        body: 'Water weighs 1 kg per liter; launching years worth of drinking water would bankrupt any rocket mission. Using vacuum rotary distillation and thermoelectric membrane filters, NASA ECLSS recovers 98% of all human moisture—including sweat, cabin humidity, and urine. As astronauts say: "Yesterday’s coffee is tomorrow’s coffee!"',
      },
    ],
    flightChecklist: [
      { step: 'Cabin Atmosphere Verify', detail: 'Partial pressure O2 = 21.3 kPa, CO2 scrubber active', status: 'CHECKED' },
      { step: 'Pre-Breathe Oxygen Cycle', detail: 'Flush nitrogen for 90 minutes on suit loop', status: 'CHECKED' },
      { step: 'Sabatier Catalyst Temp', detail: 'Nominal at 400°C, methane exhaust valve open', status: 'CHECKED' },
      { step: 'Water Recovery Loop', detail: 'Conductivity check < 0.5 μS/cm (potable purity)', status: 'CHECKED' },
    ],
    exam: {
      question: 'What is the primary chemical product of the Sabatier reaction that astronauts recycle for life support?',
      options: [
        'Solid carbon blocks and toxic ozone',
        'Pure potable liquid water (H2O)',
        'Hydrazine rocket thruster fuel',
        'Liquid nitrogen coolant'
      ],
      correctIndex: 1,
      explanation: 'The Sabatier reactor combines exhaled CO2 with hydrogen over a catalyst to yield water (H2O) and methane (CH4), recovering vital liquid moisture for the crew.',
    },
  },
  {
    id: 'class-3-launch-dynamics',
    order: 3,
    title: 'Rocket Launch Staging & Orbital Insertion',
    subtitle: 'From T-Minus Zero to 28,000 km/h: Delta-V, Max Q, and Staging Mechanics',
    category: 'LAUNCH_DYNAMICS',
    durationMins: 20,
    instructor: 'Commander Maya Lin',
    instructorRole: 'NASA Flight Director & Artemis II Veteran',
    instructorAvatar: '👩‍🚀',
    badgeName: 'Orbital Insertion Wings',
    rewardCredits: 4500,
    keyConcepts: [
      'Tsiolkovsky Rocket Equation & Mass Ratio',
      'Max Q: Maximum Aerodynamic Pressure',
      'Orbital Velocity (7.8 km/s) vs Escape Velocity (11.2 km/s)',
      'Gravity Turn & Pitch Profile Maneuvers',
      'Anti-G Straining Maneuver (AGSM) under 4G Acceleration',
    ],
    lectureScript: [
      {
        heading: '1. The Harsh Physics of Getting to Orbit',
        body: 'Reaching space isn’t about going up—it is about going sideways so fast that as you fall toward Earth, the ground curves away from beneath you! To enter Low Earth Orbit (LEO), your spacecraft must reach approximately 7.8 km/s (28,000 km/h). To break free of Earth toward the Moon, you must hit escape velocity: 11.2 km/s (40,320 km/h).',
        formulaOrChecklist: 'Tsiolkovsky Equation: ΔV = Isp · g₀ · ln(m_initial / m_final)',
      },
      {
        heading: '2. Surviving Max Q & Staging',
        body: 'At T+60 to T+80 seconds, your booster passes through "Max Q"—the point where aerodynamic drag from Earth’s atmosphere peaks. Rocket engines throttle back to 70% to prevent the spacecraft from breaking apart. Once through the sound barrier and high into the stratosphere, stage 1 shuts down (MECO) and separates cleanly.',
      },
      {
        heading: '3. The Gravity Turn',
        body: 'Rockets do not fly straight up. Shortly after clearing the launch tower, the guidance computer commands a gentle pitch-over maneuver called the "gravity turn". Gravity gradually pulls the velocity vector horizontal, trading vertical climb for immense horizontal velocity.',
      },
    ],
    flightChecklist: [
      { step: 'Guidance Gyro Alignment', detail: 'Inertial measurement unit calibrated to launch azimuth 090°', status: 'CHECKED' },
      { step: 'Propellant Tank Pressurization', detail: 'LOX/LH2 tanks at 280 kPa with helium purge', status: 'CHECKED' },
      { step: 'Max Q Throttle Bucket', detail: 'Throttle reduced to 72% at Mach 1.4', status: 'CHECKED' },
      { step: 'Stage Separation Pyro Check', detail: 'Pneumatic interstage collets armed', status: 'CHECKED' },
    ],
    exam: {
      question: 'Why do rockets execute a "gravity turn" rather than flying vertically straight up into space?',
      options: [
        'To burn off excess rocket paint through friction',
        'To achieve horizontal orbital velocity (7.8 km/s) so the craft orbits instead of falling back down',
        'Because rocket engines cannot fire straight up for more than 30 seconds',
        'To avoid colliding with commercial satellites stationed directly overhead'
      ],
      correctIndex: 1,
      explanation: 'Entering orbit requires tremendous horizontal speed (~7.8 km/s) so that the spacecraft perpetually falls around the Earth’s curvature rather than dropping back into the atmosphere.',
    },
  },
  {
    id: 'class-4-orbital-docking',
    order: 4,
    title: 'Orbital Rendezvous & 6-DOF Precision Docking',
    subtitle: 'Connecting Spacecraft in Microgravity: RCS Translation, V-Bar, and Latching',
    category: 'DOCKING',
    durationMins: 25,
    instructor: 'CapCom Elena Rostova',
    instructorRole: 'Orbital Rendezvous Lead, NASA Houston',
    instructorAvatar: '🛰️',
    badgeName: 'Master Docking Pilot',
    rewardCredits: 5000,
    keyConcepts: [
      'Counter-Intuitive Orbital Phasing: Burn Backwards to Speed Up!',
      '6 Degrees of Freedom (6-DOF): Pitch, Roll, Yaw + X, Y, Z Thrusters',
      'V-Bar (Velocity Vector) vs R-Bar (Radial Earth Vector) Approach',
      'Range & Range-Rate Telemetry: Keeping Approach < 0.1 m/s',
      'Soft Capture Ring Alignment & Hard Latches Closure',
    ],
    lectureScript: [
      {
        heading: '1. Orbital Mechanics Are Backwards!',
        body: 'If you are in orbit 10 km behind the International Space Station and fire your thrusters forward to catch up, you will FAIL! Firing forward raises your orbital altitude. And in orbital mechanics, higher orbits have LONGER periods—meaning you will actually slow down and fall further behind! To catch up, you must fire backward, drop into a lower, faster orbit, and then boost back up once ahead.',
      },
      {
        heading: '2. The Approach Corridors: V-Bar and R-Bar',
        body: 'Spacecraft approach docking targets along defined vectors. The V-Bar approach aligns with the target’s velocity vector. Inside 100 meters, speed must be restricted to under 0.2 meters per second (walking pace). Inside 10 meters, approach rate must drop below 0.05 m/s (5 cm per second) to prevent structural damage.',
        formulaOrChecklist: 'Flight Rule: Maximum Closure Rate = 0.1% of Distance (At 10m, speed ≤ 0.01 m/s)',
      },
      {
        heading: '3. Soft Capture to Hard Latch',
        body: 'When docking probes make contact, magnetic guides and guide petals trigger "Soft Capture"—damping relative motion. Once oscillation dies down, motorized hooks draw the rings together, compressing silicon O-rings to create an airtight seal (Hard Latch). Pressure equalization valves are opened before the hatch opens.',
      },
    ],
    flightChecklist: [
      { step: 'RCS Thruster Quad Purge', detail: 'All 16 hypergolic pulse nozzles nominal', status: 'CHECKED' },
      { step: 'Laser Rangefinder Telemetry', detail: 'Target distance 42.5m, closure rate -0.08 m/s', status: 'CHECKED' },
      { step: 'Docking Crosshair Alignment', detail: 'Angular roll error < 0.5 degrees', status: 'CHECKED' },
      { step: 'Capture Latches Armed', detail: 'Ready for contact switch closure', status: 'CHECKED' },
    ],
    exam: {
      question: 'In orbital mechanics, what happens if a chaser spacecraft fires its engines forward toward a target in the same orbit?',
      options: [
        'It speeds directly into the target like a car on a highway',
        'It enters a higher orbit with a longer period, falling behind the target',
        'Its fuel instantly freezes due to deep space temperature',
        'Gravity pulls it down into the upper atmosphere immediately'
      ],
      correctIndex: 1,
      explanation: 'Accelerating forward adds kinetic energy, boosting the spacecraft into a higher orbit where orbital velocity is slower and orbital period is longer, causing it to fall behind.',
    },
  },
  {
    id: 'class-5-lunar-landing',
    order: 5,
    title: 'Lunar & Planetary Descent: Safe Touchdown',
    subtitle: 'Managing Throttle, Terrain Slope Radar, and Eliminating Drift Velocity',
    category: 'LANDING',
    durationMins: 25,
    instructor: 'Commander Maya Lin',
    instructorRole: 'NASA Flight Director & Artemis II Veteran',
    instructorAvatar: '👩‍🚀',
    badgeName: 'Lunar Touchdown Aviator',
    rewardCredits: 5500,
    keyConcepts: [
      'Powered Descent Initiation (PDI) & Braking Phase',
      'Eliminating Horizontal Velocity to Avoid Tip-Over',
      'Terminal Descent Limits: Vertical Velocity < 2.2 m/s',
      'Radar Altimeter & LIDAR Hazard Detection (Boulders & Craters)',
      'Engine Plume Surface Interaction & Dust Obscuration ("Brownout")',
    ],
    lectureScript: [
      {
        heading: '1. No Atmosphere Means No Parachutes',
        body: 'On the Moon, there is zero atmosphere. Parachutes and heat shields are useless. 100% of your deceleration must come from rocket thrust! From an orbital speed of 1.7 km/s (6,120 km/h), your descent engine must fire continuously to bleed off energy until you hover just meters above the regolith.',
        callout: 'CRITICAL RULE: Any horizontal velocity at touchdown will cause the lander legs to catch on regolith, flipping the vehicle upside down. Horizontal drift MUST be zeroed before contact!',
      },
      {
        heading: '2. The Danger of "Brownout" Dust',
        body: 'At 15 meters altitude, the descent engine plume strikes the surface, blasting thousands of sharp regolith particles outward in an opaque dust cloud. Radar altimeters and optical cameras can lose lock. Astronauts must rely on inertial gimbals and Doppler radar to hold position.',
        formulaOrChecklist: 'Touchdown Constraints: Vertical Speed ≤ 2.0 m/s | Horizontal Drift ≤ 0.5 m/s | Slope ≤ 10°',
      },
      {
        heading: '3. Contact Light & Engine Shutdown',
        body: 'Probes extending 1.5 meters beneath the landing footpads touch the surface first, illuminating a blue "CONTACT LIGHT" on the commander’s panel. The commander must INSTANTLY hit the engine stop button to prevent the rocket exhaust from reflecting back into the engine bell and exploding!',
      },
    ],
    flightChecklist: [
      { step: 'Radar Altimeter Lock', detail: 'Altitude 1,200m, Terrain slope 4.2° (nominal)', status: 'CHECKED' },
      { step: 'Descent Engine Throttle', detail: 'Modulating between 55% and 85% thrust', status: 'CHECKED' },
      { step: 'Horizontal Drift Kill', detail: 'Lateral velocity vx = 0.1 m/s, vy = 0.0 m/s', status: 'CHECKED' },
      { step: 'Surface Contact Sensing', detail: 'Footpad sensor probes deployed', status: 'CHECKED' },
    ],
    exam: {
      question: 'What is the most critical constraint when touching down on an extraterrestrial surface without an atmosphere?',
      options: [
        'Deploying aerodynamic silk parachutes at 100 meters',
        'Zeroing out horizontal drift velocity and keeping descent speed under 2.2 m/s',
        'Leaving the main rocket engine firing at 100% power after touchdown',
        'Rolling down cabin windows to check outside atmospheric pressure'
      ],
      correctIndex: 1,
      explanation: 'Because there is no atmosphere to slow down or stabilize the lander, horizontal drift must be eliminated and vertical speed kept low (<2.2 m/s) to prevent the lander from rolling over and crushing the crew cabin.',
    },
  },
  {
    id: 'class-6-surface-exploration',
    order: 6,
    title: 'Surface Exploration, Science & Mission Completion',
    subtitle: 'Rover Operations, Cryogenic Ice Coring, and Mission Control Debrief',
    category: 'SURFACE_OPS',
    durationMins: 20,
    instructor: 'Dr. Marcus Vance',
    instructorRole: 'Lead ECLSS Engineer, NASA Johnson Space Center',
    instructorAvatar: '👨‍🔬',
    badgeName: 'Artemis Surface Commander Wings',
    rewardCredits: 6000,
    keyConcepts: [
      'Rover Terramechanics & Regolith Shear Strength',
      'Permanently Shadowed Regions (PSRs) at <40 Kelvin',
      'Raman Spectroscopy for Volatile Water-Ice Detection',
      'Solar Particle Event (SPE) Radiation Shelter Protocol',
      'Houston Mission Control Debrief & Root-Cause Autopsy',
    ],
    lectureScript: [
      {
        heading: '1. Surface Mobility: Traversing Alien Soil',
        body: 'Extraterrestrial soil is not smooth sand—it is regolith: microscopic jagged glass shards with zero water smoothing. Rovers must use titanium mesh wheels with chevron treads. Cadets must navigate around boulder fields, avoid wheel slip on slopes exceeding 15 degrees, and conserve electrical battery reserves for the return trip.',
      },
      {
        heading: '2. Hunting Polar Ice in Cold Traps',
        body: 'At the Lunar South Pole (Shackleton Crater), crater floors have sat in pitch-black shadow for two billion years at temperatures below 40 Kelvin (-233°C). These "cold traps" harbor billions of tons of volatile water ice. Astronauts extract 1-meter cores with rotary percussive drills, analyzing samples with Raman spectrometers before solar sublimation.',
        formulaOrChecklist: 'Water Ice Formula: 1 Metric Ton of Lunar Ice yields 890 kg Oxygen (breathable) + 110 kg Hydrogen (rocket fuel)!',
      },
      {
        heading: '3. Completing the Mission: Houston Debrief',
        body: 'Every successful mission ends with a comprehensive telemetry debrief at Houston Mission Control. Telemetry logs, oxygen consumption rates, battery discharge curves, and scientific discoveries are cross-examined against NASA baseline models. Failures are traced using causal AI autopsies to prepare the crew for the next flight!',
      },
    ],
    flightChecklist: [
      { step: 'Rover Battery Reserve Check', detail: 'Charge remaining > 35% (Safe return threshold)', status: 'CHECKED' },
      { step: 'Cryogenic Core Sample Sealed', detail: 'Core tube #4 locked in vacuum stowage container', status: 'CHECKED' },
      { step: 'Radiation Dosimeter Scan', detail: 'Cumulative crew dose < 0.4 mSv/sol (Nominal)', status: 'CHECKED' },
      { step: 'Houston CapCom Sign-Off', detail: 'Mission objectives certified 100% complete', status: 'CHECKED' },
    ],
    exam: {
      question: 'Why are permanently shadowed craters at the lunar south pole considered the most valuable real estate in the solar system?',
      options: [
        'They contain alien radio transmitters left behind by comets',
        'They harbor ancient cryogenic water ice that can be converted into drinking water, breathable oxygen, and rocket fuel',
        'They are completely warm and tropical throughout the year',
        'They are sheltered from all gravity, allowing astronauts to float'
      ],
      correctIndex: 1,
      explanation: 'Polar cold traps preserve massive volatile water-ice deposits. Melting and electrolyzing this ice produces potable water, life-support oxygen, and hydrogen rocket propellant for deep space missions.',
    },
  },
];
