import React, { useEffect, useRef, useState } from 'react';
import {
  X,
  Compass,
  Zap,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Target
} from 'lucide-react';
import { soundFx } from '../utils/audioEffects';

interface Waypoint {
  id: string;
  name: string;
  x: number;
  y: number;
  radius: number;
  collected: boolean;
  scienceValue: number;
  description: string;
  sampleType: string;
}

interface Obstacle {
  x: number;
  y: number;
  radius: number;
  type: 'crater' | 'boulder';
}

export interface RoverMissionConfig {
  id: string;
  name: string;
  roverName: string;
  roverType: '6wheel' | '4wheel' | 'lander';
  destination: string;
  isMoon: boolean;
  accentColor: string;
  waypoints: Waypoint[];
  obstacles: Obstacle[];
}

export const ROVER_CONFIGS: RoverMissionConfig[] = [
  {
    id: 'perseverance',
    name: 'Perseverance (Mars 2020)',
    roverName: 'Mars 2020 Perseverance & Ingenuity',
    roverType: '6wheel',
    destination: 'Jezero Crater Delta, Mars',
    isMoon: false,
    accentColor: '#ef4444',
    waypoints: [
      { id: 'wp-p1', name: 'Jezero Delta Mudstone Core', x: 220, y: 160, radius: 40, collected: false, scienceValue: 40, description: 'Ancient delta river clay deposits containing preserved organic molecules and biosignatures.', sampleType: 'Delta Mudstone Core' },
      { id: 'wp-p2', name: 'Kodiak Butte Layered Strata', x: 720, y: 200, radius: 40, collected: false, scienceValue: 35, description: 'Exposed bottomset and foreset sediment layers from catastrophic ancient floods.', sampleType: 'Foreset Sandstone' },
      { id: 'wp-p3', name: 'Séítah Olivine Cumulate Bedrock', x: 480, y: 120, radius: 40, collected: false, scienceValue: 30, description: 'Igneous crystallized olivine forged in an ancient Martian magma chamber.', sampleType: 'Olivine Crystal Core' },
    ],
    obstacles: [
      { x: 340, y: 320, radius: 45, type: 'crater' },
      { x: 580, y: 350, radius: 35, type: 'crater' },
      { x: 380, y: 220, radius: 25, type: 'boulder' },
      { x: 620, y: 180, radius: 28, type: 'boulder' },
      { x: 260, y: 280, radius: 22, type: 'boulder' },
      { x: 500, y: 260, radius: 40, type: 'crater' },
    ],
  },
  {
    id: 'curiosity',
    name: 'Curiosity (MSL)',
    roverName: 'Curiosity Mars Science Laboratory',
    roverType: '6wheel',
    destination: 'Gale Crater & Mount Sharp, Mars',
    isMoon: false,
    accentColor: '#f97316',
    waypoints: [
      { id: 'wp-c1', name: 'Yellowknife Bay Mudstone', x: 240, y: 180, radius: 40, collected: false, scienceValue: 35, description: 'Habitable ancient freshwater lake bed with neutral pH and sulfur, nitrogen, oxygen, phosphorus, and carbon.', sampleType: 'Sheepbed Mudstone' },
      { id: 'wp-c2', name: 'Vera Rubin Ridge Hematite', x: 700, y: 170, radius: 40, collected: false, scienceValue: 35, description: 'Crystalline gray hematite precipitated from ancient warm groundwater fluids.', sampleType: 'Gray Hematite' },
      { id: 'wp-c3', name: 'Mount Sharp Sulfate Unit', x: 450, y: 110, radius: 40, collected: false, scienceValue: 30, description: 'Hydrated magnesium sulfates marking Mars climate transition from wet to arid.', sampleType: 'Sulfate Mineral Core' },
    ],
    obstacles: [
      { x: 320, y: 300, radius: 42, type: 'crater' },
      { x: 560, y: 320, radius: 36, type: 'boulder' },
      { x: 400, y: 200, radius: 24, type: 'boulder' },
      { x: 640, y: 240, radius: 30, type: 'crater' },
      { x: 220, y: 270, radius: 20, type: 'boulder' },
    ],
  },
  {
    id: 'spirit_opportunity',
    name: 'Spirit & Opportunity',
    roverName: 'Mars Exploration Rover (MER)',
    roverType: '6wheel',
    destination: 'Gusev Crater & Meridiani Planum, Mars',
    isMoon: false,
    accentColor: '#eab308',
    waypoints: [
      { id: 'wp-so1', name: 'Endurance Crater Sulfate Outcrop', x: 260, y: 190, radius: 40, collected: false, scienceValue: 35, description: 'Cross-bedded jarosite sulfate rock formed in acidic surface water pools.', sampleType: 'Jarosite Sulfate' },
      { id: 'wp-so2', name: 'Victoria Crater Blueberry Bed', x: 680, y: 210, radius: 40, collected: false, scienceValue: 30, description: 'Hematite spherical concretions weathered out of sedimentary bedrock.', sampleType: 'Hematite Blueberries' },
      { id: 'wp-so3', name: 'Home Plate Hydrothermal Silica', x: 490, y: 130, radius: 40, collected: false, scienceValue: 35, description: 'Pure 90% opaline silica deposits formed in volcanic hot springs or fumaroles.', sampleType: 'Hydrothermal Opal Silica' },
    ],
    obstacles: [
      { x: 360, y: 310, radius: 40, type: 'crater' },
      { x: 600, y: 340, radius: 32, type: 'crater' },
      { x: 390, y: 230, radius: 22, type: 'boulder' },
      { x: 510, y: 250, radius: 38, type: 'crater' },
    ],
  },
  {
    id: 'sojourner',
    name: 'Sojourner (Pathfinder)',
    roverName: 'Mars Pathfinder Sojourner Micro-Rover',
    roverType: '6wheel',
    destination: 'Ares Vallis Outflow Plain, Mars',
    isMoon: false,
    accentColor: '#f43f5e',
    waypoints: [
      { id: 'wp-sj1', name: 'Yogi Rock Andesite', x: 280, y: 210, radius: 38, collected: false, scienceValue: 30, description: 'Sub-rounded volcanic rock analyzed by Alpha Proton X-ray Spectrometer (APXS).', sampleType: 'APXS Yogi Andesite' },
      { id: 'wp-sj2', name: 'Barnacle Bill High-Silica Rock', x: 670, y: 190, radius: 38, collected: false, scienceValue: 30, description: 'First rock analyzed on Mars by Sojourner rover on Sol 3.', sampleType: 'Silica Andesite' },
      { id: 'wp-sj3', name: 'Souffle Dune Regolith', x: 470, y: 140, radius: 38, collected: false, scienceValue: 25, description: 'Fine Martian atmospheric dust and sulfur-rich surface soil.', sampleType: 'Oxidized Soil Dust' },
    ],
    obstacles: [
      { x: 350, y: 310, radius: 35, type: 'crater' },
      { x: 570, y: 330, radius: 30, type: 'boulder' },
      { x: 420, y: 210, radius: 22, type: 'boulder' },
      { x: 290, y: 260, radius: 20, type: 'boulder' },
    ],
  },
  {
    id: 'viking',
    name: 'Viking 1 & 2',
    roverName: 'Viking Surface Lander & Soil Trench Sampler',
    roverType: 'lander',
    destination: 'Chryse & Utopia Planitia, Mars',
    isMoon: false,
    accentColor: '#fb923c',
    waypoints: [
      { id: 'wp-vk1', name: 'Chryse Planitia Surface Dust', x: 260, y: 180, radius: 40, collected: false, scienceValue: 30, description: 'Iron-rich Martian surface dust scooped by 3-meter mechanical backhoe arm.', sampleType: 'Oxidized Topsoil' },
      { id: 'wp-vk2', name: 'Sol-8 Sub-Surface Trench Scoop', x: 690, y: 220, radius: 40, collected: false, scienceValue: 35, description: 'Sub-surface soil sheltered from lethal solar ultraviolet radiation.', sampleType: 'Sub-Surface Soil Core' },
      { id: 'wp-vk3', name: 'Labeled Release Biology Chamber', x: 480, y: 120, radius: 40, collected: false, scienceValue: 35, description: 'Radioactive carbon nutrient broth test for microbial metabolic gas release.', sampleType: 'Pyrolytic Biology Sample' },
    ],
    obstacles: [
      { x: 340, y: 330, radius: 45, type: 'crater' },
      { x: 590, y: 340, radius: 38, type: 'boulder' },
      { x: 380, y: 210, radius: 24, type: 'boulder' },
    ],
  },
  {
    id: 'apollo15',
    name: 'Apollo 15 LRV',
    roverName: 'Apollo 15 Lunar Roving Vehicle',
    roverType: '4wheel',
    destination: 'Hadley-Apennine, Moon',
    isMoon: true,
    accentColor: '#38bdf8',
    waypoints: [
      { id: 'wp-a15-1', name: 'Hadley Rille Gorge Rim', x: 230, y: 170, radius: 40, collected: false, scienceValue: 35, description: 'Ancient volcanic collapsed lava tube channel 1.5 km wide and 300 meters deep.', sampleType: 'Vesicular Basalt' },
      { id: 'wp-a15-2', name: 'Apennine Front Genesis Rock', x: 710, y: 190, radius: 40, collected: false, scienceValue: 45, description: 'Sample 15415 — 4.1 billion year old primordial anorthosite from the original lunar crust.', sampleType: 'Genesis Anorthosite' },
      { id: 'wp-a15-3', name: 'Dune Crater Regolith Core', x: 480, y: 120, radius: 40, collected: false, scienceValue: 30, description: 'Deep lunar regolith core drill tube capturing billions of years of solar wind ions.', sampleType: 'Regolith Drill Core' },
    ],
    obstacles: [
      { x: 330, y: 310, radius: 42, type: 'crater' },
      { x: 570, y: 330, radius: 36, type: 'crater' },
      { x: 390, y: 220, radius: 26, type: 'boulder' },
      { x: 610, y: 180, radius: 28, type: 'boulder' },
    ],
  },
  {
    id: 'apollo17',
    name: 'Apollo 17 LRV',
    roverName: 'Apollo 17 Lunar Roving Vehicle (Taped Fender)',
    roverType: '4wheel',
    destination: 'Taurus-Littrow Valley, Moon',
    isMoon: true,
    accentColor: '#a78bfa',
    waypoints: [
      { id: 'wp-a17-1', name: 'Shorty Crater Orange Glass Beads', x: 240, y: 180, radius: 40, collected: false, scienceValue: 40, description: 'Pyroclastic volcanic fire-fountain glass beads formed 3.64 billion years ago.', sampleType: 'Orange Volcanic Glass' },
      { id: 'wp-a17-2', name: 'Camelot Crater Sub-Floor Basalt', x: 700, y: 210, radius: 40, collected: false, scienceValue: 35, description: 'Impact-excavated basalt bedrock sample from Taurus-Littrow mare floor.', sampleType: 'Sub-Floor Basalt' },
      { id: 'wp-a17-3', name: 'North Massif Boulder Track Sample', x: 470, y: 110, radius: 40, collected: false, scienceValue: 35, description: 'Blue-gray crystalline breccia rolled down from mountain heights.', sampleType: 'Recrystallized Breccia' },
    ],
    obstacles: [
      { x: 350, y: 310, radius: 44, type: 'crater' },
      { x: 580, y: 340, radius: 36, type: 'crater' },
      { x: 410, y: 220, radius: 24, type: 'boulder' },
      { x: 620, y: 200, radius: 26, type: 'boulder' },
    ],
  },
  {
    id: 'artemis',
    name: 'Artemis LTV',
    roverName: 'NASA Artemis Lunar Terrain Vehicle (LTV)',
    roverType: '4wheel',
    destination: 'Shackleton Crater Rim, Moon South Pole',
    isMoon: true,
    accentColor: '#34d399',
    waypoints: [
      { id: 'wp-art-1', name: 'Permanently Shadowed Ice Deposit Alpha', x: 220, y: 180, radius: 40, collected: false, scienceValue: 35, description: 'Ultra-cold regolith core rich in volatile water ice in polar cold trap.', sampleType: 'Water Ice Core' },
      { id: 'wp-art-2', name: 'Pristine Anorthosite Boulder Ridge', x: 700, y: 220, radius: 40, collected: false, scienceValue: 25, description: 'Ancient primordial lunar crust rock sample dating back 4.4 billion years.', sampleType: 'Anorthosite Rock' },
      { id: 'wp-art-3', name: 'Deep Space Laser Reflector Site', x: 480, y: 120, radius: 40, collected: false, scienceValue: 20, description: 'Deploy retroreflector for Earth-to-Moon sub-millimeter laser ranging.', sampleType: 'Retroreflector Array' },
    ],
    obstacles: [
      { x: 340, y: 320, radius: 45, type: 'crater' },
      { x: 580, y: 350, radius: 35, type: 'crater' },
      { x: 380, y: 220, radius: 25, type: 'boulder' },
      { x: 620, y: 180, radius: 28, type: 'boulder' },
    ],
  },
];

interface RoverExplorationModalProps {
  isOpen: boolean;
  onClose: () => void;
  destinationName?: string;
  isMoon?: boolean;
  onCompleteRoverMission?: (earnedScience: number, earnedXp: number, summary: string) => void;
}

export const RoverExplorationModal: React.FC<RoverExplorationModalProps> = ({
  isOpen,
  onClose,
  destinationName = 'Shackleton Crater Rim',
  isMoon = true,
  onCompleteRoverMission,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [selectedRoverId, setSelectedRoverId] = useState<string>(() => {
    if (destinationName.toLowerCase().includes('mars') || destinationName.toLowerCase().includes('jezero')) return 'perseverance';
    if (destinationName.toLowerCase().includes('gale')) return 'curiosity';
    if (destinationName.toLowerCase().includes('hadley')) return 'apollo15';
    if (destinationName.toLowerCase().includes('taurus')) return 'apollo17';
    if (destinationName.toLowerCase().includes('viking') || destinationName.toLowerCase().includes('chryse')) return 'viking';
    return isMoon ? 'apollo15' : 'perseverance';
  });

  const activeConfig = ROVER_CONFIGS.find((c) => c.id === selectedRoverId) || ROVER_CONFIGS[0];
  const effectiveIsMoon = activeConfig.isMoon;

  // Rover physics
  const roverRef = useRef({
    x: 450,
    y: 400,
    vx: 0,
    vy: 0,
    angle: -Math.PI / 2, // facing up
    speed: 0,
    battery: 100,
    samplesCollected: 0,
    isDrilling: false,
    drillProgress: 0,
    health: 100,
    tracks: [] as { x: number; y: number; angle: number }[],
    laserActive: false,
    laserTarget: null as { x: number; y: number; name: string } | null,
    spectroscopy: null as { title: string; elements: string; bonus: number } | null,
  });

  const keysRef = useRef<{ [k: string]: boolean }>({});
  const [hudState, setHudState] = useState({
    battery: 100,
    speed: 0,
    samples: 0,
    totalSamples: 3,
    bearing: 0,
    distanceToTarget: 0,
    targetName: 'Volatile Ice Pocket Alpha',
    health: 100,
    isDrilling: false,
    drillProgress: 0,
    laserActive: false,
    spectroscopy: null as { title: string; elements: string; bonus: number } | null,
  });

  const [missionFinished, setMissionFinished] = useState(false);
  const [finishResult, setFinishResult] = useState<{
    success: boolean;
    earnedScience: number;
    earnedXp: number;
    reason: string;
  } | null>(null);

  // Targets
  const waypointsRef = useRef<Waypoint[]>(activeConfig.waypoints.map((w) => ({ ...w, collected: false })));

  // Obstacles
  const obstaclesRef = useRef<Obstacle[]>([...activeConfig.obstacles]);

  // Base Station coordinates
  const BASE_X = 450;
  const BASE_Y = 480;

  // Reinitialize whenever selected rover changes or modal opens
  useEffect(() => {
    if (!isOpen) return;
    const config = ROVER_CONFIGS.find((c) => c.id === selectedRoverId) || ROVER_CONFIGS[0];
    waypointsRef.current = config.waypoints.map((w) => ({ ...w, collected: false }));
    obstaclesRef.current = [...config.obstacles];
    const r = roverRef.current;
    r.x = 450;
    r.y = 400;
    r.vx = 0;
    r.vy = 0;
    r.speed = 0;
    r.angle = -Math.PI / 2;
    r.battery = 100;
    r.health = 100;
    r.samplesCollected = 0;
    r.isDrilling = false;
    r.drillProgress = 0;
    r.tracks = [];
    r.laserActive = false;
    r.laserTarget = null;
    r.spectroscopy = null;
    setMissionFinished(false);
    setFinishResult(null);
  }, [isOpen, selectedRoverId]);

  // Key listeners
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = true;
      keysRef.current[e.code] = true;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = false;
      keysRef.current[e.code] = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [isOpen]);

  // Main simulation loop
  useEffect(() => {
    if (!isOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let lastTime = performance.now();

    const loop = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      const r = roverRef.current;
      const keys = keysRef.current;

      // Update Controls if not drilling or finished
      if (!missionFinished && r.health > 0 && r.battery > 0) {
        const turnSpeed = 2.4;
        const accel = 90;
        const maxSpeed = 110;
        const friction = 0.92;

        if (keys['arrowleft'] || keys['a']) {
          r.angle -= turnSpeed * dt;
        }
        if (keys['arrowright'] || keys['d']) {
          r.angle += turnSpeed * dt;
        }
        if (keys['arrowup'] || keys['w']) {
          r.speed = Math.min(maxSpeed, r.speed + accel * dt);
          r.battery = Math.max(0, r.battery - 0.7 * dt);
        } else if (keys['arrowdown'] || keys['s']) {
          r.speed = Math.max(-50, r.speed - accel * 0.7 * dt);
          r.battery = Math.max(0, r.battery - 0.5 * dt);
        } else {
          r.speed *= friction;
        }

        // Apply movement
        r.x += Math.cos(r.angle) * r.speed * dt;
        r.y += Math.sin(r.angle) * r.speed * dt;

        // Boundaries
        r.x = Math.max(30, Math.min(canvas.width - 30, r.x));
        r.y = Math.max(30, Math.min(canvas.height - 30, r.y));

        // Add wheel tracks periodically
        if (Math.abs(r.speed) > 10 && Math.random() < 0.25) {
          r.tracks.push({ x: r.x, y: r.y, angle: r.angle });
          if (r.tracks.length > 120) r.tracks.shift();
        }

        // Check Obstacle collisions
        for (const obs of obstaclesRef.current) {
          const dist = Math.hypot(r.x - obs.x, r.y - obs.y);
          if (dist < obs.radius + 14) {
            r.speed = -r.speed * 0.4;
            r.health = Math.max(0, r.health - (obs.type === 'crater' ? 0.8 : 2.0));
            soundFx.playImpact();
          }
        }

        // Check Drilling / Sample collection
        let insideActiveTarget: Waypoint | null = null;
        for (const wp of waypointsRef.current) {
          if (!wp.collected) {
            const dist = Math.hypot(r.x - wp.x, r.y - wp.y);
            if (dist < wp.radius) {
              insideActiveTarget = wp;
              break;
            }
          }
        }

        if (insideActiveTarget && (keys[' '] || keys['space'] || r.isDrilling)) {
          r.speed *= 0.5;
          r.drillProgress += 28 * dt;
          r.battery = Math.max(0, r.battery - 1.2 * dt);

          if (r.drillProgress >= 100) {
            insideActiveTarget.collected = true;
            r.samplesCollected += 1;
            r.drillProgress = 0;
            r.isDrilling = false;
            soundFx.playTelemetryChirp();
          }
        } else if (!insideActiveTarget) {
          r.drillProgress = 0;
        }

        // ── NASA SuperCam Laser Zapper (ChemCam LIBS Spectrometry) ─────────
        if (keys['z'] || keys['l'] || keys['laser']) {
          r.laserActive = true;
          let nearestWp: Waypoint | null = null;
          let minDist = 260;
          for (const wp of waypointsRef.current) {
            const d = Math.hypot(r.x - wp.x, r.y - wp.y);
            if (d < minDist) {
              minDist = d;
              nearestWp = wp;
            }
          }
          if (nearestWp) {
            r.laserTarget = { x: nearestWp.x, y: nearestWp.y, name: nearestWp.name };
            r.battery = Math.max(0, r.battery - 0.25 * dt);
            if (!r.spectroscopy) {
              soundFx.playMiningLaser();
              let elements = 'SiO2: 46.2%, FeO: 14.5%, Al2O3: 11.2%, H2O Volatiles: 4.8%';
              if (nearestWp.sampleType.includes('Ice')) {
                elements = 'Volatile Water Ice (H2O): 5.6 wt%, Regolith Breccia: 94.4%, Trace CO2';
              } else if (nearestWp.sampleType.includes('Anorthosite')) {
                elements = 'Plagioclase Feldspar (CaAl2Si2O8): 91.5%, Pyroxene: 5.2%, Ilmenite: 3.3%';
              }
              r.spectroscopy = {
                title: `NASA SuperCam LIBS · ${nearestWp.name}`,
                elements,
                bonus: 15,
              };
            }
          } else {
            const fX = r.x + Math.cos(r.angle) * 160;
            const fY = r.y + Math.sin(r.angle) * 160;
            r.laserTarget = { x: fX, y: fY, name: 'Planetary Regolith Substrate' };
          }
        } else {
          r.laserActive = false;
        }

        // Check Return to Base
        const distToBase = Math.hypot(r.x - BASE_X, r.y - BASE_Y);
        if (distToBase < 45 && r.samplesCollected > 0 && keys['return_to_base']) {
          finishMission(true, 'Returned to Artemis Base Camp with all science samples secured!');
        }

        // Check Battery Depletion
        if (r.battery <= 0) {
          finishMission(false, 'Rover battery fully depleted in the field. Astronauts initiated emergency walkback.');
        }
        if (r.health <= 0) {
          finishMission(false, 'Rover wheel suspension broken by crater boulder impact.');
        }
      }

      // Update HUD state
      const nextTarget = waypointsRef.current.find((w) => !w.collected);
      let bearing = 0;
      let distTarget = 0;
      let targetName = 'All Science Sites Sampled! Return to Base Camp';

      if (nextTarget) {
        targetName = nextTarget.name;
        distTarget = Math.round(Math.hypot(nextTarget.x - r.x, nextTarget.y - r.y));
        bearing = Math.round((Math.atan2(nextTarget.y - r.y, nextTarget.x - r.x) * 180) / Math.PI);
        if (bearing < 0) bearing += 360;
      } else {
        distTarget = Math.round(Math.hypot(BASE_X - r.x, BASE_Y - r.y));
        bearing = Math.round((Math.atan2(BASE_Y - r.y, BASE_X - r.x) * 180) / Math.PI);
        if (bearing < 0) bearing += 360;
      }

      setHudState({
        battery: Math.round(r.battery),
        speed: Math.round(Math.abs(r.speed) * 0.1),
        samples: r.samplesCollected,
        totalSamples: waypointsRef.current.length,
        bearing,
        distanceToTarget: distTarget,
        targetName,
        health: Math.round(r.health),
        isDrilling: r.drillProgress > 0,
        drillProgress: Math.min(100, Math.round(r.drillProgress)),
        laserActive: r.laserActive,
        spectroscopy: r.spectroscopy,
      });

      // ── RENDER CANVAS ────────────────────────────────────────────────────────
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 1. Planetary Regolith Background
      ctx.fillStyle = effectiveIsMoon ? '#1a202c' : '#2d1810';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Subtle terrain contour noise
      ctx.strokeStyle = effectiveIsMoon ? 'rgba(255,255,255,0.03)' : 'rgba(234,88,12,0.06)';
      ctx.lineWidth = 1;
      for (let i = 0; i < canvas.width; i += 40) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
      }

      // 2. Wheel Tracks
      ctx.fillStyle = effectiveIsMoon ? 'rgba(15,23,42,0.65)' : 'rgba(20,10,5,0.6)';
      for (const t of r.tracks) {
        ctx.save();
        ctx.translate(t.x, t.y);
        ctx.rotate(t.angle);
        ctx.fillRect(-6, -8, 12, 3);
        ctx.fillRect(-6, 5, 12, 3);
        ctx.restore();
      }

      // 3. Obstacles (Craters and Boulders)
      for (const obs of obstaclesRef.current) {
        if (obs.type === 'crater') {
          // Crater shadow and rim
          const grad = ctx.createRadialGradient(obs.x, obs.y, 0, obs.x, obs.y, obs.radius);
          grad.addColorStop(0, '#090d16');
          grad.addColorStop(0.7, '#111827');
          grad.addColorStop(1, 'rgba(148, 163, 184, 0.4)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(obs.x, obs.y, obs.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#475569';
          ctx.lineWidth = 2;
          ctx.stroke();
        } else {
          // Sharp boulder
          ctx.fillStyle = effectiveIsMoon ? '#64748b' : '#9a3412';
          ctx.beginPath();
          ctx.arc(obs.x, obs.y, obs.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      }

      // 4. Base Station Habitat
      ctx.save();
      ctx.translate(BASE_X, BASE_Y);
      ctx.fillStyle = activeConfig.accentColor;
      ctx.beginPath();
      ctx.arc(0, 0, 32, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(effectiveIsMoon ? 'BASE CAMP' : 'LANDER HAB', 0, 4);
      ctx.restore();

      // 5. Waypoints (Science Target Zones)
      for (const wp of waypointsRef.current) {
        ctx.save();
        ctx.translate(wp.x, wp.y);

        if (wp.collected) {
          ctx.strokeStyle = '#10b981';
          ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(0, 0, wp.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#43ffa0';
          ctx.font = '10px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('✓ SAMPLED', 0, 4);
        } else {
          // Pulsing target circle
          const pulse = Math.sin(time * 0.005) * 4;
          ctx.strokeStyle = activeConfig.accentColor;
          ctx.fillStyle = `${activeConfig.accentColor}20`;
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.arc(0, 0, wp.radius + pulse, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.fillStyle = '#f8fafc';
          ctx.font = 'bold 9.5px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(wp.sampleType, 0, -2);
          ctx.fillStyle = activeConfig.accentColor;
          ctx.font = '8.5px monospace';
          ctx.fillText(`+${wp.scienceValue} Science`, 0, 10);
        }
        ctx.restore();
      }

      // 6. Draw Rover
      ctx.save();
      ctx.translate(r.x, r.y);
      ctx.rotate(r.angle);

      // Rover chassis
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(-16, -10, 32, 20);
      ctx.strokeStyle = activeConfig.accentColor;
      ctx.lineWidth = 2;
      ctx.strokeRect(-16, -10, 32, 20);

      // Solar/battery top deck
      ctx.fillStyle = activeConfig.isMoon ? '#1e3a8a' : '#7c2d12';
      ctx.fillRect(-10, -6, 20, 12);

      // Wheels or Landing Pads based on roverType
      if (activeConfig.roverType === '6wheel') {
        // 6 Rocker-Bogie Cleated Wheels
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(-14, -15, 7, 4); // front left
        ctx.fillRect(-2, -15, 7, 4);  // mid left
        ctx.fillRect(10, -15, 7, 4);  // rear left
        ctx.fillRect(-14, 11, 7, 4);  // front right
        ctx.fillRect(-2, 11, 7, 4);   // mid right
        ctx.fillRect(10, 11, 7, 4);   // rear right
      } else if (activeConfig.roverType === 'lander') {
        // 3 Tripod landing pads
        ctx.fillStyle = '#cbd5e1';
        ctx.beginPath();
        ctx.arc(-16, -14, 5, 0, Math.PI * 2);
        ctx.arc(-16, 14, 5, 0, Math.PI * 2);
        ctx.arc(18, 0, 5, 0, Math.PI * 2);
        ctx.fill();
        // Robotic Backhoe Sampler arm
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(12, 0);
        ctx.lineTo(24, 0);
        ctx.stroke();
      } else {
        // 4 wire-mesh tires (Apollo LRV / Artemis LTV)
        ctx.fillStyle = '#475569';
        ctx.fillRect(-14, -14, 8, 4); // front left
        ctx.fillRect(6, -14, 8, 4);  // front right
        ctx.fillRect(-14, 10, 8, 4);  // rear left
        ctx.fillRect(6, 10, 8, 4);   // rear right
      }

      // High-gain dish mast pointing forward
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(8, 0);
      ctx.lineTo(18, 0);
      ctx.stroke();

      // Headlight beams
      ctx.fillStyle = 'rgba(254, 240, 138, 0.18)';
      ctx.beginPath();
      ctx.moveTo(16, -6);
      ctx.lineTo(70, -25);
      ctx.lineTo(70, 25);
      ctx.lineTo(16, 6);
      ctx.closePath();
      ctx.fill();

      ctx.restore();

      // 7. Draw NASA SuperCam Laser Pulse Beam
      if (r.laserActive && r.laserTarget) {
        ctx.save();
        ctx.strokeStyle = '#4ade80';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#22c55e';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.moveTo(r.x, r.y);
        ctx.lineTo(r.laserTarget.x, r.laserTarget.y);
        ctx.stroke();

        // Laser impact spark flare
        ctx.fillStyle = '#86efac';
        ctx.beginPath();
        ctx.arc(r.laserTarget.x, r.laserTarget.y, 6 + Math.random() * 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isOpen, missionFinished, effectiveIsMoon, selectedRoverId]);

  const finishMission = (success: boolean, reason: string) => {
    setMissionFinished(true);
    let totalScience = 0;
    for (const wp of waypointsRef.current) {
      if (wp.collected) totalScience += wp.scienceValue;
    }
    const earnedXp = success ? totalScience * 3 + 100 : totalScience * 2;

    setFinishResult({
      success,
      earnedScience: totalScience,
      earnedXp,
      reason,
    });

    if (success) {
      soundFx.playVictory();
    } else {
      soundFx.playAlarm();
    }
  };

  const handleReturnToBaseBtn = () => {
    let totalScience = 0;
    for (const wp of waypointsRef.current) {
      if (wp.collected) totalScience += wp.scienceValue;
    }
    finishMission(true, `Expedition Concluded: Returned to Base with ${roverRef.current.samplesCollected} planetary samples.`);
  };

  const handleClaimAndClose = () => {
    if (finishResult && onCompleteRoverMission) {
      onCompleteRoverMission(finishResult.earnedScience, finishResult.earnedXp, finishResult.reason);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1250 }}>
      <div
        className="modal-container"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '960px',
          backgroundColor: '#070b13',
          border: '1px solid rgba(56, 189, 248, 0.45)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div className="modal-header" style={{ padding: '12px 20px', borderBottom: '1px solid rgba(56, 189, 248, 0.2)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Compass size={22} style={{ color: activeConfig.accentColor }} />
            <div>
              <div style={{ fontSize: '0.7rem', color: activeConfig.accentColor, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                {activeConfig.roverName}
              </div>
              <h2 className="modal-title" style={{ fontSize: '1.15rem', fontWeight: 800 }}>
                Rover Exploration · {activeConfig.destination}
              </h2>
            </div>
          </div>
          <button onClick={onClose} className="modal-close-btn">
            <X size={18} />
          </button>
        </div>

        {/* Rover Mission Selector Tabs */}
        <div
          style={{
            display: 'flex',
            gap: '6px',
            overflowX: 'auto',
            padding: '8px 16px',
            background: 'rgba(15, 23, 42, 0.95)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            flexShrink: 0,
            minHeight: '46px',
            alignItems: 'center',
          }}
        >
          {ROVER_CONFIGS.map((cfg) => {
            const isSel = selectedRoverId === cfg.id;
            return (
              <button
                key={cfg.id}
                onClick={() => {
                  setSelectedRoverId(cfg.id);
                  soundFx.playClick(900);
                }}
                style={{
                  background: isSel ? `${cfg.accentColor}35` : 'rgba(255, 255, 255, 0.04)',
                  border: `1.5px solid ${isSel ? cfg.accentColor : 'rgba(255, 255, 255, 0.12)'}`,
                  color: isSel ? '#ffffff' : '#94a3b8',
                  padding: '5px 11px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap',
                  boxShadow: isSel ? `0 0 12px ${cfg.accentColor}50` : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>{cfg.isMoon ? '⚪' : '🔴'}</span>
                <span>{cfg.name}</span>
              </button>
            );
          })}
        </div>

        {/* Telemetry Dashboard Strip */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            padding: '8px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            fontSize: '0.8rem',
            fontFamily: 'monospace',
            flexWrap: 'wrap',
            gap: '10px',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Zap size={14} className={hudState.battery < 25 ? 'text-rose-400 animate-pulse' : 'text-amber-400'} />
            <span style={{ color: hudState.battery < 25 ? '#f87171' : '#e2e8f0' }}>BATTERY: {hudState.battery}%</span>
          </div>

          <div style={{ color: '#38bdf8' }}>SPEED: {hudState.speed} km/h</div>

          <div style={{ color: '#43ffa0' }}>
            SAMPLES: {hudState.samples} / {hudState.totalSamples}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#a78bfa' }}>
            <Target size={14} />
            <span>BEARING: {hudState.bearing}° ({hudState.distanceToTarget}m to target)</span>
          </div>

          <div style={{ color: hudState.health < 40 ? '#ef4444' : '#94a3b8' }}>
            INTEGRITY: {hudState.health}%
          </div>
        </div>

        {/* Canvas Simulator Area */}
        <div style={{ position: 'relative', width: '100%', height: '480px', flex: '1 1 auto', backgroundColor: '#090d16' }}>
          <canvas
            ref={canvasRef}
            width={940}
            height={480}
            style={{ width: '100%', height: '100%', display: 'block' }}
          />

          {/* Drill Status Floating Pill */}
          {hudState.isDrilling && (
            <div
              style={{
                position: 'absolute',
                top: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                border: '1.5px solid #38bdf8',
                borderRadius: '999px',
                padding: '6px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                boxShadow: '0 0 20px rgba(56, 189, 248, 0.4)',
              }}
            >
              <RotateCcw size={16} className="text-cyan-400 animate-spin" />
              <span style={{ color: '#ffffff', fontWeight: 700, fontSize: '0.85rem' }}>
                DRILLING REGOLITH CORE: {hudState.drillProgress}%
              </span>
            </div>
          )}

          {/* NASA SuperCam LIBS Spectroscopy Telemetry Drawer */}
          {hudState.spectroscopy && (
            <div
              style={{
                position: 'absolute',
                top: '16px',
                left: '16px',
                right: '16px',
                maxWidth: '680px',
                margin: '0 auto',
                backgroundColor: 'rgba(9, 14, 26, 0.94)',
                border: '1px solid #4ade80',
                borderRadius: '12px',
                padding: '10px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: '0 0 25px rgba(74, 222, 128, 0.35)',
                backdropFilter: 'blur(10px)',
                zIndex: 30,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '18px' }}>⚡</span>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: '#4ade80', fontWeight: 800, fontSize: '11px', fontFamily: 'monospace' }}>
                      {hudState.spectroscopy.title}
                    </span>
                    <span style={{ background: 'rgba(74, 222, 128, 0.2)', color: '#86efac', padding: '1px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 700 }}>
                      +{hudState.spectroscopy.bonus} SCIENCE
                    </span>
                  </div>
                  <div style={{ color: '#cbd5e1', fontSize: '11.5px', marginTop: '2px' }}>
                    {hudState.spectroscopy.elements}
                  </div>
                </div>
              </div>
              <span style={{ fontSize: '10px', color: '#86efac', fontFamily: 'monospace', fontWeight: 700 }}>
                TITANIUM TUBE CACHED 🧪
              </span>
            </div>
          )}

          {/* Touch / On-screen Controls (Bottom Left & Bottom Right) */}
          <div
            style={{
              position: 'absolute',
              bottom: '16px',
              left: '16px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'rgba(15, 23, 42, 0.75)',
              padding: '8px',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <button
              onMouseDown={() => (keysRef.current['arrowup'] = true)}
              onMouseUp={() => (keysRef.current['arrowup'] = false)}
              onTouchStart={() => (keysRef.current['arrowup'] = true)}
              onTouchEnd={() => (keysRef.current['arrowup'] = false)}
              style={{ padding: '8px 14px', borderRadius: '6px', backgroundColor: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', cursor: 'pointer' }}
            >
              <ChevronUp size={18} />
            </button>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onMouseDown={() => (keysRef.current['arrowleft'] = true)}
                onMouseUp={() => (keysRef.current['arrowleft'] = false)}
                onTouchStart={() => (keysRef.current['arrowleft'] = true)}
                onTouchEnd={() => (keysRef.current['arrowleft'] = false)}
                style={{ padding: '8px 14px', borderRadius: '6px', backgroundColor: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', cursor: 'pointer' }}
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onMouseDown={() => (keysRef.current['arrowdown'] = true)}
                onMouseUp={() => (keysRef.current['arrowdown'] = false)}
                onTouchStart={() => (keysRef.current['arrowdown'] = true)}
                onTouchEnd={() => (keysRef.current['arrowdown'] = false)}
                style={{ padding: '8px 14px', borderRadius: '6px', backgroundColor: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', cursor: 'pointer' }}
              >
                <ChevronDown size={18} />
              </button>
              <button
                onMouseDown={() => (keysRef.current['arrowright'] = true)}
                onMouseUp={() => (keysRef.current['arrowright'] = false)}
                onTouchStart={() => (keysRef.current['arrowright'] = true)}
                onTouchEnd={() => (keysRef.current['arrowright'] = false)}
                style={{ padding: '8px 14px', borderRadius: '6px', backgroundColor: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', cursor: 'pointer' }}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          <div
            style={{
              position: 'absolute',
              bottom: '16px',
              right: '16px',
              display: 'flex',
              gap: '8px',
            }}
          >
            {/* NASA SuperCam Laser Button (Z key) */}
            <button
              onMouseDown={() => (keysRef.current['laser'] = true)}
              onMouseUp={() => (keysRef.current['laser'] = false)}
              onTouchStart={() => (keysRef.current['laser'] = true)}
              onTouchEnd={() => (keysRef.current['laser'] = false)}
              style={{
                padding: '10px 16px',
                borderRadius: '8px',
                backgroundColor: 'rgba(74, 222, 128, 0.25)',
                border: '1px solid #4ade80',
                color: '#4ade80',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                boxShadow: '0 0 14px rgba(74, 222, 128, 0.3)',
              }}
              title="Shoot SuperCam Laser to analyze rock chemistry remotely"
            >
              ⚡ SuperCam Laser (Z)
            </button>
            <button
              onClick={() => {
                roverRef.current.isDrilling = true;
              }}
              style={{
                padding: '10px 16px',
                borderRadius: '8px',
                backgroundColor: 'rgba(56, 189, 248, 0.25)',
                border: '1px solid #38bdf8',
                color: '#38bdf8',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              Drill / Sample (Space)
            </button>
            <button
              onClick={handleReturnToBaseBtn}
              style={{
                padding: '10px 16px',
                borderRadius: '8px',
                backgroundColor: 'rgba(16, 185, 129, 0.25)',
                border: '1px solid #10b981',
                color: '#43ffa0',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              Return to Hab
            </button>
          </div>

          {/* Mission Finished Overlay */}
          {missionFinished && finishResult && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: 'rgba(7, 11, 19, 0.92)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '24px',
                textAlign: 'center',
              }}
            >
              <div style={{ marginBottom: '16px' }}>
                {finishResult.success ? (
                  <CheckCircle2 size={54} className="text-emerald-400" />
                ) : (
                  <AlertTriangle size={54} className="text-rose-400" />
                )}
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: finishResult.success ? '#43ffa0' : '#f87171' }}>
                {finishResult.success ? 'SURFACE EXPEDITION SUCCESS' : 'EXPEDITION ABORTED'}
              </h3>
              <p style={{ color: '#cbd5e1', maxWidth: '500px', fontSize: '0.95rem', margin: '8px 0 20px' }}>
                {finishResult.reason}
              </p>

              <div
                style={{
                  display: 'flex',
                  gap: '24px',
                  backgroundColor: 'rgba(15, 23, 42, 0.8)',
                  padding: '14px 24px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  marginBottom: '24px',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>RESEARCH POINTS GAINED</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#38bdf8', fontFamily: 'monospace' }}>
                    +{finishResult.earnedScience} Science
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>CADET EXPERIENCE</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fbbf24', fontFamily: 'monospace' }}>
                    +{finishResult.earnedXp} XP
                  </div>
                </div>
              </div>

              <button
                onClick={handleClaimAndClose}
                style={{
                  padding: '12px 28px',
                  borderRadius: '10px',
                  backgroundColor: '#0284c7',
                  border: 'none',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '1rem',
                  cursor: 'pointer',
                  boxShadow: '0 0 25px rgba(56, 189, 248, 0.4)',
                }}
              >
                Sync Telemetry to Base Camp Flight Log
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
