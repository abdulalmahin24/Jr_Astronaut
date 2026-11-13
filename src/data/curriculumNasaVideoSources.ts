// ============================================================================
// curriculumNasaVideoSources.ts
// Curated Official NASA Mission Videos, Documentaries & YouTube References
// Team Mysterio · NASA International Space Apps Challenge 2026
// ============================================================================

export interface NasaCurriculumVideoSource {
  moduleId: number;
  moduleName: string;
  themeColor: string;
  youtubeId: string; // YouTube embed ID (e.g. "qXYpltxSTK0")
  secondaryYoutubeId?: string;
  documentaryTitle: string;
  publisher: string;
  duration: string;
  keyHighlight: string;
  officialNasaUrl: string;
  youtubeUrl: string;
}

export const CURRICULUM_NASA_VIDEO_SOURCES: Record<number, NasaCurriculumVideoSource> = {
  1: {
    moduleId: 1,
    moduleName: 'Launch — Escaping Earth',
    themeColor: '#f59e0b',
    youtubeId: '16w5kL8_0vY', // Apollo 11 Saturn V Launch Camera E-8 Slow-Mo
    secondaryYoutubeId: 'zGNryrsNmKY', // Mercury-Atlas 6 Friendship 7
    documentaryTitle: 'Apollo 11 Saturn V Launch Camera HD & Staging Telemetry',
    publisher: 'NASA Kennedy Space Center Video Archives',
    duration: '3:15',
    keyHighlight: 'Dual-camera 500 fps slow-motion capture of F-1 rocket engines building 7.5 million pounds of thrust and staging separation.',
    officialNasaUrl: 'https://images.nasa.gov/details/KSC-69PC-442',
    youtubeUrl: 'https://www.youtube.com/watch?v=16w5kL8_0vY',
  },
  2: {
    moduleId: 2,
    moduleName: 'Docking — The Slow Dance',
    themeColor: '#38bdf8',
    youtubeId: '110Kx7_e37g', // Gemini VIII First Docking in Space
    secondaryYoutubeId: 'R10qB8eU_6k', // Artemis Gateway Rendezvous
    documentaryTitle: 'Gemini VIII: The First Orbital Docking in Space',
    publisher: 'NASA History Division & Johnson Space Center',
    duration: '4:20',
    keyHighlight: 'Neil Armstrong and David Scott approach and latch with Agena Target Vehicle, followed by emergency OAMS thruster recovery.',
    officialNasaUrl: 'https://www.nasa.gov/specials/gemini-anniversary/',
    youtubeUrl: 'https://www.youtube.com/watch?v=110Kx7_e37g',
  },
  3: {
    moduleId: 3,
    moduleName: 'Lander — Soft Touchdown',
    themeColor: '#eab308',
    youtubeId: 'qXYpltxSTK0', // Ellipse: Rocket Simulator - Mission 3: Lunar Voyager
    secondaryYoutubeId: 'RONIax0_12g', // Apollo 11 Real Moon Landing
    documentaryTitle: 'Ellipse Simulator: Mission 3 Lunar Voyager Powered Descent & Landing',
    publisher: 'NASA Spaceflight Heritage & Ellipse Aerospace Simulator',
    duration: '5:42',
    keyHighlight: 'Complete real-time lunar descent, hover slam burn (<3 m/s), 30-second fuel reserve alarm, Neil Armstrong surface EVA, and liftoff.',
    officialNasaUrl: 'https://www.nasa.gov/mission_pages/apollo/apollo-11.html',
    youtubeUrl: 'https://www.youtube.com/watch?v=qXYpltxSTK0',
  },
  4: {
    moduleId: 4,
    moduleName: 'Rover — Reading the Ground',
    themeColor: '#ef4444',
    youtubeId: 'Ki_Af_o9Q9s', // Curiosity Seven Minutes of Terror
    secondaryYoutubeId: '4czjS9h4Fpg', // Perseverance Mars 2020 Real Landing Cameras
    documentaryTitle: 'NASA JPL: Challenges of Getting to Mars: Seven Minutes of Terror',
    publisher: 'NASA Jet Propulsion Laboratory (JPL)',
    duration: '5:08',
    keyHighlight: 'Hypersonic atmospheric deceleration, supersonic parachute deployment, radar altimetry, and Sky Crane retro-rocket touchdown in Gale Crater.',
    officialNasaUrl: 'https://mars.nasa.gov/msl/mission/technology/edl/',
    youtubeUrl: 'https://www.youtube.com/watch?v=Ki_Af_o9Q9s',
  },
  5: {
    moduleId: 5,
    moduleName: 'Telescope — Catching Light',
    themeColor: '#8b5cf6',
    youtubeId: '4P8fKd0IV90', // Hubble Servicing Mission 1 STS-61
    secondaryYoutubeId: 'v6ihVeEoUdo', // James Webb Space Telescope 29 Days on the Edge
    documentaryTitle: 'Hubble Space Telescope Servicing Mission 1 (STS-61) EVA Spacewalk',
    publisher: 'NASA Goddard Space Flight Center',
    duration: '4:45',
    keyHighlight: 'Space Shuttle Endeavour astronauts space-walk to install COSTAR corrective optics, fixing spherical aberration for crisp cosmic imaging.',
    officialNasaUrl: 'https://hubblesite.org/contents/media/videos/1993/01/1000-Image',
    youtubeUrl: 'https://www.youtube.com/watch?v=4P8fKd0IV90',
  },
  6: {
    moduleId: 6,
    moduleName: 'Deep Space — Borrowing Gravity',
    themeColor: '#10b981',
    youtubeId: 'q_m35b2jQfA', // NASA JPL Voyager Grand Tour Animation
    secondaryYoutubeId: 'L6_u_0B94jU', // Voyager Interstellar Journey
    documentaryTitle: 'NASA JPL: The Grand Tour: Voyager 1 & 2 Gravity Assist Animation',
    publisher: 'NASA Jet Propulsion Laboratory (JPL)',
    duration: '3:50',
    keyHighlight: 'Rare 176-year geometric planetary alignment allowing Voyager to slingshot past Jupiter and Saturn into the interstellar void.',
    officialNasaUrl: 'https://voyager.jpl.nasa.gov/mission/science/planetary-voyage/',
    youtubeUrl: 'https://www.youtube.com/watch?v=q_m35b2jQfA',
  },
};

