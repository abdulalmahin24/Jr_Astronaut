import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { getSharedGLTFLoader } from '../utils/modelLoader';
import { soundFx } from '../utils/audioEffects';
import {
  RotateCcw,
  Eye,
  Maximize2,
  Compass,
  Zap,
  Radio,
  Rocket,
  Shield,
  Layers,
  Sparkles,
  Info,
  CheckCircle,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';

export interface SpacecraftModelDef {
  id: string;
  name: string;
  designation: string;
  category: 'SPACECRAFT' | 'PLANETARY' | 'SUITS' | 'INFRASTRUCTURE';
  modelPath: string;
  modelScale: number;
  cameraInitPos: [number, number, number];
  mission: string;
  program: string;
  year: string;
  mass: string;
  dimensions: string;
  propulsion: string;
  powerSystem: string;
  comms: string;
  missionId?: string;
  summary: string;
  keyInnovations: string[];
  flightManualNote: string;
}

export const SPACECRAFT_MODELS: SpacecraftModelDef[] = [
  {
    id: 'apollo-lm',
    name: 'Apollo Lunar Module Eagle (LM-5)',
    designation: 'LM-5 / EAGLE',
    category: 'SPACECRAFT',
    modelPath: '/models/Apollo_Lunar_Module.glb',
    modelScale: 1.0,
    cameraInitPos: [0, 1.8, 4.2],
    mission: 'Apollo 11',
    program: 'Project Apollo',
    year: '1969',
    mass: '15,200 kg (Loaded)',
    dimensions: '7.04 m (H) × 9.4 m (W)',
    propulsion: '45 kN Throttleable Descent Engine (DPS)',
    powerSystem: '5× Ag-Zn Batteries (1,600 Ah)',
    comms: 'Steerable High-Gain S-Band Dish (2.2 GHz)',
    missionId: 'NASA-M003',
    summary:
      'The first crewed vehicle to land on another celestial body. The Lunar Module consisted of a Descent Stage with landing radar and throttleable rocket engine, and an Ascent Stage housing the crew cockpit and rendezvous radar.',
    keyInnovations: [
      'Throttleable hypergolic rocket engine (10% to 60% thrust control)',
      'Apollo Guidance Computer (AGC) real-time fly-by-wire system',
      'Deployable landing gear with lunar surface touchdown sensors',
    ],
    flightManualNote:
      'Manual hover throttle override initiated by Armstrong at 400 ft altitude to avoid boulder field in West Crater with 30 seconds of fuel margin.',
  },
  {
    id: 'perseverance-rover',
    name: 'Mars 2020 Perseverance Rover',
    designation: 'M2020 / PERCY',
    category: 'PLANETARY',
    modelPath: '/models/Mars_Perseverance_Rover.glb',
    modelScale: 1.0,
    cameraInitPos: [0, 1.6, 3.8],
    mission: 'Mars 2020',
    program: 'Mars Exploration Program',
    year: '2020',
    mass: '1,025 kg',
    dimensions: '3.0 m (L) × 2.7 m (W) × 2.2 m (H)',
    propulsion: '6-wheel Rocker-Bogie drive (0.16 km/h max)',
    powerSystem: 'MMRTG (110W Plutonium-238 Decay)',
    comms: 'High-Gain X-Band & Ultra-High Frequency (UHF)',
    missionId: 'NASA-M004',
    summary:
      'NASA\'s most advanced planetary rover, engineered to investigate Jezero Crater for signs of ancient biosignatures, store sealed rock core samples, and pioneer in-situ oxygen generation via MOXIE.',
    keyInnovations: [
      'MOXIE Solid Oxide Electrolysis extracting O2 from CO2 Martian atmosphere',
      'SuperCam laser-induced breakdown spectroscopy for mineralogy',
      'Ingenuity Mars Helicopter scout deployment system',
    ],
    flightManualNote:
      'Autonomous Terrain Relative Navigation (TRN) selected safe touchdown coordinates inside Jezero Crater during supersonic parachute descent.',
  },
  {
    id: 'emu-suit',
    name: 'NASA Extravehicular Mobility Unit (EMU)',
    designation: 'EMU / xEVA-2',
    category: 'SUITS',
    modelPath: '/models/EMU_Suit_Clean.glb',
    modelScale: 1.0,
    cameraInitPos: [0, 1.4, 3.2],
    mission: 'Space Shuttle & ISS Expeditions',
    program: 'NASA Extravehicular Activity',
    year: '1981–Present',
    mass: '145 kg (Total System with PLSS)',
    dimensions: '1.9 m (H) × 0.85 m (W)',
    propulsion: 'SAFER Auxiliary Nitrogen Cold-Gas Thrusters',
    powerSystem: 'Silver-Zinc Battery (8.0 Hours Life Support)',
    comms: 'UHF Transceiver with Biomedical Telemetry',
    missionId: 'NASA-M005',
    summary:
      'An independent anthropomorphic human spacecraft protecting astronauts during spacewalks. Operates at 29.6 kPa (4.3 psi) pure oxygen, incorporating 14 layers of thermal and micrometeoroid protection.',
    keyInnovations: [
      'Liquid Cooling and Ventilation Garment (LCVG) with 91 meters of capillary tubes',
      'Primary Life Support System (PLSS) scrubbing CO2 with Lithium Hydroxide',
      'SAFER self-rescue nitrogen jetpack producing 1.4 N impulse',
    ],
    flightManualNote:
      'Pre-breathe protocol strictly required prior to airlock depressurization to eliminate blood nitrogen and prevent decompression sickness.',
  },
  {
    id: 'aces-suit',
    name: 'ACES Launch & Entry Pressure Suit',
    designation: 'ACES / P-100',
    category: 'SUITS',
    modelPath: '/models/ACES_Suit.glb',
    modelScale: 1.0,
    cameraInitPos: [0, 1.4, 3.2],
    mission: 'STS-64 through STS-135',
    program: 'Space Shuttle Flight Safety',
    year: '1994',
    mass: '42 kg',
    dimensions: '1.85 m (H) × 0.75 m (W)',
    propulsion: 'Passive Aerodynamic Para-Raft Deployment',
    powerSystem: 'Emergency Oxygen Regulator (10 min reserve)',
    comms: 'Helmet Intercom & Survival Satellite Beacon',
    missionId: 'NASA-M001',
    summary:
      'The iconic "pumpkin suit" worn by Space Shuttle astronauts during ascent and reentry. A full-pressure suit engineered with anti-g bladders, automatic flotation, and parachute harness for high-altitude escape.',
    keyInnovations: [
      'Automatic multi-stage anti-g lower torso compression bladders',
      'Integrated high-altitude parachute and single-action water survival pack',
      'Closed-loop faceplate demisting and liquid cooling connect manifolds',
    ],
    flightManualNote:
      'Visor lock verify completed before T-9 minutes. Automatic emergency valve triggers at cabin decompression above 10,000 meters.',
  },
  {
    id: 'agena-target',
    name: 'Agena Target Docking Vehicle (ATV)',
    designation: 'GATV-5003',
    category: 'SPACECRAFT',
    modelPath: '/models/Agena_Target.glb',
    modelScale: 1.0,
    cameraInitPos: [0, 1.5, 4.0],
    mission: 'Gemini 8',
    program: 'Project Gemini',
    year: '1966',
    mass: '3,248 kg',
    dimensions: '7.9 m (L) × 1.5 m (Dia)',
    propulsion: 'Bell 8096 Restartable Rocket Engine (71 kN)',
    powerSystem: 'Primary Silver-Zinc Chemical Batteries',
    comms: 'S-Band Radar Transponder & CapCom Command Link',
    missionId: 'NASA-M002',
    summary:
      'Launched aboard an Atlas rocket, the Agena Target Vehicle achieved history\'s first in-space docking with Gemini 8 (crewed by Neil Armstrong and David Scott), validating orbital rendezvous mechanics for Apollo.',
    keyInnovations: [
      'Multi-restart orbital hypergolic rocket engine for orbital plane changes',
      'Docking cone with mechanical latches and electrical umbilical couplings',
      'Ground-commanded attitude orientation gyros and horizon sensors',
    ],
    flightManualNote:
      'Docking index pin engaged with 0.1 m/s relative closing velocity. Critical roll RCS malfunction subsequent to docking led to emergency separation.',
  },
  {
    id: 'satellite-orbital',
    name: 'Deep Space Orbital Telemetry Satellite',
    designation: 'DS-SAT / ORBITER-1',
    category: 'SPACECRAFT',
    modelPath: '/models/Satellite.glb',
    modelScale: 1.0,
    cameraInitPos: [0, 1.5, 3.8],
    mission: 'Planetary Relay Network',
    program: 'Deep Space Explorations',
    year: '2024',
    mass: '2,400 kg',
    dimensions: '4.2 m (H) × 8.6 m (Wingspan)',
    propulsion: 'Hydrazine Monopropellant RCS + Hall Thruster',
    powerSystem: 'Dual Triple-Junction GaAs Solar Arrays (12 kW)',
    comms: 'X-Band & Ka-Band Optical Deep Space Link',
    missionId: 'NASA-M006',
    summary:
      'High-bandwidth planetary relay orbiter capable of routing high-definition telemetry, scientific data streams, and crew communications across the inner solar system.',
    keyInnovations: [
      'Laser Optical Communications (DSOC) yielding 267 Mbps downlink rate',
      'Autonomous star-tracker celestial orientation reference unit',
      'Radiation-hardened multi-band digital transponder bus',
    ],
    flightManualNote:
      'Sun-pointing attitude acquired automatically via reaction wheels following separation from the launch fairing.',
  },
  {
    id: 'dish-70m',
    name: 'DSN 70-Meter Parabolic Deep Space Antenna',
    designation: 'DSS-14 / GOLDSTONE 70M',
    category: 'INFRASTRUCTURE',
    modelPath: '/models/Dish_70m.glb',
    modelScale: 0.9,
    cameraInitPos: [0, 2.5, 5.2],
    mission: 'Deep Space Network (DSN)',
    program: 'NASA Space Communications and Navigation (SCaN)',
    year: '1966–Present',
    mass: '2,700,000 kg (Moving Structure)',
    dimensions: '70.0 m (Dish Dia) × 73.0 m (H)',
    propulsion: 'Azimuth-Elevation Hydraulic Hydrostatic Bearing',
    powerSystem: 'High-Power Klystron Amplifiers (20 kW / 400 kW)',
    comms: 'S, X, and Ka-Band Cryogenic Liquid-Helium Masers',
    missionId: 'NASA-M006',
    summary:
      'The backbone of NASA interplanetary communication. Positioned 120° apart at Goldstone, Madrid, and Canberra, ensuring uninterrupted radio contact with Voyager 1 & 2, Mars rovers, and New Horizons.',
    keyInnovations: [
      'Cryogenically cooled maser low-noise receivers at 4.2 Kelvin',
      '70-meter parabolic dish with sub-millimeter surface accuracy',
      'Dual-polarization simultaneous uplink and downlink capability',
    ],
    flightManualNote:
      'Capable of receiving signals from interstellar space with power levels less than one-billionth of a trillionth of a watt (10⁻²¹ W).',
  },
  {
    id: 'habitat-unit',
    name: 'Artemis Base Camp Surface Habitat',
    designation: 'L-HAB / ARTEMIS CAMP',
    category: 'INFRASTRUCTURE',
    modelPath: '/models/Habitat_Unit.glb',
    modelScale: 1.0,
    cameraInitPos: [0, 1.8, 4.4],
    mission: 'Artemis Surface Operations',
    program: 'Project Artemis',
    year: '2028',
    mass: '8,600 kg',
    dimensions: '5.5 m (Dia) × 6.2 m (H)',
    propulsion: 'Stationary / Surface Anchored Platform',
    powerSystem: 'Kilopower Fission Nuclear Reactor (10 kWe)',
    comms: 'Lunar South Pole Direct-to-Earth Optical Node',
    missionId: 'NASA-M005',
    summary:
      'A permanent pressurized surface outpost engineered for the lunar south pole near Shackleton Crater, supporting 4 crew members for 30-day extended surface exploration missions.',
    keyInnovations: [
      'Closed-loop Environmental Control and Life Support System (ECLSS)',
      'Dual-suitlock dust mitigation chamber preventing regolith entry',
      'Regolith-shielded multi-layer radiation storm shelter',
    ],
    flightManualNote:
      'Thermal loops operate continuously through the 14-day lunar night utilizing nuclear fission power and thermal radiator banks.',
  },
  {
    id: 'asteroid-bennu',
    name: 'Near-Earth Asteroid (101955 Bennu)',
    designation: 'NEO-101955',
    category: 'PLANETARY',
    modelPath: '/models/Asteroid.glb',
    modelScale: 1.1,
    cameraInitPos: [0, 1.5, 3.8],
    mission: 'OSIRIS-REx Sample Return',
    program: 'New Frontiers Program',
    year: 'Discovery: 1999',
    mass: '7.3 × 10¹⁰ kg',
    dimensions: '492 m (Mean Diameter)',
    propulsion: 'Orbital Velocity: 28 km/s (Solar Orbit)',
    powerSystem: 'Pristine Solar Nebula Carbonaceous Chemistry',
    comms: 'Probed by TAGSAM Touch-and-Go Sampler',
    missionId: 'NASA-M004',
    summary:
      'A carbon-rich B-type rubble-pile asteroid preserving unaltered building blocks from the earliest formation of our solar system 4.5 billion years ago. Visited by NASA\'s OSIRIS-REx probe in 2020.',
    keyInnovations: [
      'Touch-and-Go (TAG) nitrogen gas injection sample retrieval',
      'Polyhedral 3D shape reconstruction from lidar telemetry',
      'Direct return of 250 grams of extraterrestrial amino acids',
    ],
    flightManualNote:
      'Surface particle ejection events observed in microgravity orbit, requiring dynamic spacecraft trajectory safety clearances.',
  },
];

interface Interactive3DSpacecraftViewerProps {
  onLaunchMission?: (missionId: string) => void;
  defaultModelId?: string;
}

export const Interactive3DSpacecraftViewer: React.FC<Interactive3DSpacecraftViewerProps> = ({
  onLaunchMission,
  defaultModelId = 'apollo-lm',
}) => {
  const [selectedModelId, setSelectedModelId] = useState<string>(defaultModelId);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [wireframeMode, setWireframeMode] = useState<boolean>(false);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [lightingMode, setLightingMode] = useState<'SOLAR' | 'STUDIO' | 'RIM'>('SOLAR');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [camTelemetry, setCamTelemetry] = useState<{ azim: number; elev: number; dist: number }>({
    azim: 0,
    elev: 20,
    dist: 4.2,
  });

  const mountRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const modelRootRef = useRef<THREE.Group | null>(null);
  const lightsRef = useRef<{
    dir: THREE.DirectionalLight;
    ambient: THREE.AmbientLight;
    rim: THREE.DirectionalLight;
  } | null>(null);

  const activeModel =
    SPACECRAFT_MODELS.find((m) => m.id === selectedModelId) || SPACECRAFT_MODELS[0];

  const categories = [
    { id: 'ALL', label: 'All Assets (9)' },
    { id: 'SPACECRAFT', label: 'Spacecraft' },
    { id: 'PLANETARY', label: 'Planetary & Rovers' },
    { id: 'SUITS', label: 'EVA & Flight Suits' },
    { id: 'INFRASTRUCTURE', label: 'Infrastructure & Deep Space' },
  ];

  const filteredModels = SPACECRAFT_MODELS.filter(
    (m) => selectedCategory === 'ALL' || m.category === selectedCategory
  );

  // Initialize Three.js scene once
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 700;
    const height = container.clientHeight || 520;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x07090c);
    scene.fog = new THREE.FogExp2(0x07090c, 0.02);

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(...activeModel.cameraInitPos);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 15;
    controls.minDistance = 1.0;
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 1.2;
    controlsRef.current = controls;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 2.2);
    dirLight.position.set(6, 9, 7);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.4);
    rimLight.position.set(-8, 3, -7);
    scene.add(rimLight);

    lightsRef.current = { dir: dirLight, ambient: ambientLight, rim: rimLight };

    // Starfield Particle Sphere
    const starGeo = new THREE.BufferGeometry();
    const starCount = 600;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 25 + Math.random() * 5;
      starPositions[i] = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i + 1] = r * Math.sin(phi) * Math.sin(theta);
      starPositions[i + 2] = r * Math.cos(phi);
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0x93c5fd,
      size: 0.08,
      transparent: true,
      opacity: 0.6,
    });
    const starPoints = new THREE.Points(starGeo, starMat);
    scene.add(starPoints);

    // Staging Grid & Orientation Reticle
    const grid = new THREE.GridHelper(12, 24, 0x38bdf8, 0x1e293b);
    grid.position.y = -1.2;
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.Material).opacity = 0.25;
    scene.add(grid);

    // Circular pedestal platform
    const platformGeo = new THREE.CylinderGeometry(2.4, 2.6, 0.1, 48);
    const platformMat = new THREE.MeshStandardMaterial({
      color: 0x0b0e14,
      roughness: 0.4,
      metalness: 0.8,
    });
    const platform = new THREE.Mesh(platformGeo, platformMat);
    platform.position.y = -1.25;
    platform.receiveShadow = true;
    scene.add(platform);

    const ringGeo = new THREE.RingGeometry(2.35, 2.45, 48);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.7,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = -1.19;
    scene.add(ring);

    // Animation Loop
    let animId: number;
    let frameCounter = 0;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      controls.update();

      // Slowly rotate starfield
      starPoints.rotation.y += 0.0003;
      ring.rotation.z += 0.005;

      // Telemetry update throttled every 6 frames
      frameCounter++;
      if (frameCounter % 6 === 0 && camera) {
        const offset = camera.position.clone();
        const dist = offset.length();
        const elev = Math.round(THREE.MathUtils.radToDeg(Math.asin(camera.position.y / dist)));
        const azim = Math.round(THREE.MathUtils.radToDeg(Math.atan2(camera.position.x, camera.position.z)));
        setCamTelemetry({ azim, elev, dist: Number(dist.toFixed(1)) });
      }

      renderer.render(scene, camera);
    };
    animate();

    // Resize Observer
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight || 520;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      starGeo.dispose();
      starMat.dispose();
      platformGeo.dispose();
      platformMat.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Update controls auto-rotate when state changes
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = autoRotate;
    }
  }, [autoRotate]);

  // Update lighting mode
  useEffect(() => {
    if (!lightsRef.current) return;
    const { dir, ambient, rim } = lightsRef.current;
    if (lightingMode === 'SOLAR') {
      dir.color.setHex(0xffffff);
      dir.intensity = 2.4;
      ambient.intensity = 0.5;
      rim.intensity = 1.3;
      rim.color.setHex(0x38bdf8);
    } else if (lightingMode === 'STUDIO') {
      dir.color.setHex(0xfff7ed);
      dir.intensity = 1.8;
      ambient.intensity = 1.0;
      rim.intensity = 0.8;
      rim.color.setHex(0xf59e0b);
    } else {
      // RIM Deep Space Mode
      dir.color.setHex(0x94a3b8);
      dir.intensity = 0.8;
      ambient.intensity = 0.2;
      rim.intensity = 3.0;
      rim.color.setHex(0x38bdf8);
    }
  }, [lightingMode]);

  // Load active 3D GLB model
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    setIsLoading(true);
    setLoadError(null);

    // Remove previous model group
    if (modelRootRef.current) {
      scene.remove(modelRootRef.current);
      modelRootRef.current.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          mesh.geometry?.dispose();
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((m) => m.dispose());
          } else {
            mesh.material?.dispose();
          }
        }
      });
      modelRootRef.current = null;
    }

    const loader = getSharedGLTFLoader();
    let isCancelled = false;

    loader.load(
      activeModel.modelPath,
      (gltf) => {
        if (isCancelled) return;
        const root = gltf.scene;

        // Auto-center and normalize scale to fit viewer nicely
        const box = new THREE.Box3().setFromObject(root);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z) || 1;
        const targetSize = 2.3 * activeModel.modelScale;
        const scale = targetSize / maxDim;

        root.position.sub(center.multiplyScalar(scale));
        root.scale.setScalar(scale);

        // Adjust vertical ground offset so model sits cleanly on platform
        const scaledBox = new THREE.Box3().setFromObject(root);
        root.position.y += -1.15 - scaledBox.min.y;

        // Apply shadows and wireframe setting
        root.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            if (wireframeMode && mesh.material) {
              if (Array.isArray(mesh.material)) {
                mesh.material.forEach((m) => {
                  (m as THREE.MeshStandardMaterial).wireframe = true;
                });
              } else {
                (mesh.material as THREE.MeshStandardMaterial).wireframe = true;
              }
            }
          }
        });

        const group = new THREE.Group();
        group.add(root);
        scene.add(group);
        modelRootRef.current = group;

        // Reset camera focus to initial position smoothly
        if (cameraRef.current && controlsRef.current) {
          cameraRef.current.position.set(...activeModel.cameraInitPos);
          controlsRef.current.target.set(0, 0, 0);
          controlsRef.current.update();
        }

        setIsLoading(false);
      },
      undefined,
      (err) => {
        if (isCancelled) return;
        console.error('Failed to load 3D GLB model:', activeModel.modelPath, err);
        setLoadError(`Model asset could not be loaded (${activeModel.modelPath}).`);
        setIsLoading(false);
      }
    );

    return () => {
      isCancelled = true;
    };
  }, [selectedModelId]);

  // Wireframe toggle effect on current loaded model
  useEffect(() => {
    if (!modelRootRef.current) return;
    modelRootRef.current.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (mesh.material) {
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((m) => {
              (m as THREE.MeshStandardMaterial).wireframe = wireframeMode;
            });
          } else {
            (mesh.material as THREE.MeshStandardMaterial).wireframe = wireframeMode;
          }
        }
      }
    });
  }, [wireframeMode]);

  const handleResetCamera = () => {
    if (cameraRef.current && controlsRef.current) {
      cameraRef.current.position.set(...activeModel.cameraInitPos);
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
      soundFx.playClick(650);
    }
  };

  const handleSelectModel = (id: string) => {
    setSelectedModelId(id);
    soundFx.playClick(750);
  };

  return (
    <div className="spacecraft-viewer-root" style={{ color: '#f3f4f6', fontFamily: 'var(--font-body)' }}>
      {/* ── TOP ASSET CATEGORY & MODEL PICKER STRIP ──────────────────────────── */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          marginBottom: '16px',
          background: '#0d1014',
          padding: '12px 16px',
          border: '1px solid #27272a',
          borderRadius: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Rocket size={16} style={{ color: '#f59e0b' }} />
            <span style={{ fontSize: '13px', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
              NASA Aerospace 3D Inspection Deck
            </span>
          </div>

          {/* Category Filter Pills */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  setSelectedCategory(c.id);
                  soundFx.playClick(500);
                }}
                style={{
                  background: selectedCategory === c.id ? '#f59e0b' : '#14171d',
                  color: selectedCategory === c.id ? '#0c0d0e' : '#94a3b8',
                  border: selectedCategory === c.id ? '1px solid #f59e0b' : '1px solid #27272a',
                  padding: '4px 10px',
                  fontSize: '11px',
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono)',
                  cursor: 'pointer',
                  borderRadius: 0,
                  transition: 'all 0.15s',
                }}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Individual Model Carousel / Pills */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            paddingBottom: '4px',
          }}
        >
          {filteredModels.map((m) => {
            const isSelected = m.id === selectedModelId;
            return (
              <button
                key={m.id}
                onClick={() => handleSelectModel(m.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 14px',
                  background: isSelected ? 'rgba(245, 158, 11, 0.12)' : '#12151b',
                  border: isSelected ? '1px solid #f59e0b' : '1px solid #27272a',
                  color: isSelected ? '#f59e0b' : '#cbd5e1',
                  fontSize: '12px',
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono)',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  borderRadius: 0,
                  transition: 'all 0.2s',
                }}
              >
                <span style={{ fontSize: '10px', opacity: 0.65 }}>[{m.year}]</span>
                <span>{m.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── MAIN WORKBENCH: 3D CANVAS + ENGINEERING SPECIFICATIONS DOSSIER ───── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.45fr) minmax(320px, 0.95fr)',
          gap: '16px',
        }}
        className="viewer-grid-layout"
      >
        {/* ── LEFT: 3D INTERACTIVE WEBGL STAGE ──────────────────────────────── */}
        <div
          style={{
            position: 'relative',
            background: '#07090c',
            border: '1px solid #27272a',
            borderRadius: 0,
            overflow: 'hidden',
            minHeight: '520px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
          }}
        >
          {/* Three.js Mount Container */}
          <div ref={mountRef} style={{ width: '100%', height: '520px' }} />

          {/* Loading Indicator */}
          {isLoading && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(7, 9, 12, 0.8)',
                backdropFilter: 'blur(4px)',
                zIndex: 10,
                gap: '12px',
              }}
            >
              <RefreshCw size={28} className="animate-spin" style={{ color: '#f59e0b' }} />
              <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: '#f59e0b', letterSpacing: '0.08em' }}>
                LOADING 3D GLB MESH · {activeModel.designation}
              </div>
            </div>
          )}

          {/* Load Error State */}
          {loadError && (
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid #ef4444',
                padding: '16px 20px',
                color: '#f87171',
                fontSize: '12px',
                fontFamily: 'var(--font-mono)',
                textAlign: 'center',
                zIndex: 10,
              }}
            >
              {loadError}
            </div>
          )}

          {/* TOP-LEFT OVERLAY: Spacecraft Tag & Toolbar */}
          <div
            style={{
              position: 'absolute',
              top: '12px',
              left: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              zIndex: 5,
              pointerEvents: 'none',
            }}
          >
            <div
              style={{
                background: 'rgba(11, 14, 18, 0.85)',
                backdropFilter: 'blur(6px)',
                border: '1px solid #27272a',
                padding: '6px 12px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#10b981',
                  boxShadow: '0 0 8px #10b981',
                }}
              />
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#f8fafc', letterSpacing: '0.05em' }}>
                {activeModel.designation}
              </span>
              <span style={{ fontSize: '10px', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
                [{activeModel.program}]
              </span>
            </div>

            {/* Interactive Viewer Toolbar Buttons */}
            <div style={{ display: 'flex', gap: '6px', pointerEvents: 'auto' }}>
              <button
                onClick={() => {
                  setAutoRotate(!autoRotate);
                  soundFx.playClick(600);
                }}
                title="Toggle Auto-Rotation"
                style={{
                  background: autoRotate ? 'rgba(56, 189, 248, 0.2)' : 'rgba(11, 14, 18, 0.85)',
                  border: autoRotate ? '1px solid #38bdf8' : '1px solid #27272a',
                  color: autoRotate ? '#38bdf8' : '#cbd5e1',
                  padding: '5px 8px',
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Compass size={12} />
                <span>{autoRotate ? 'Rotate: ON' : 'Rotate: OFF'}</span>
              </button>

              <button
                onClick={() => {
                  setWireframeMode(!wireframeMode);
                  soundFx.playClick(wireframeMode ? 500 : 800);
                }}
                title="Toggle Wireframe CAD Mode"
                style={{
                  background: wireframeMode ? 'rgba(245, 158, 11, 0.2)' : 'rgba(11, 14, 18, 0.85)',
                  border: wireframeMode ? '1px solid #f59e0b' : '1px solid #27272a',
                  color: wireframeMode ? '#f59e0b' : '#cbd5e1',
                  padding: '5px 8px',
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Layers size={12} />
                <span>{wireframeMode ? 'CAD Wireframe' : 'PBR Surface'}</span>
              </button>

              <button
                onClick={handleResetCamera}
                title="Reset Camera Orientation"
                style={{
                  background: 'rgba(11, 14, 18, 0.85)',
                  border: '1px solid #27272a',
                  color: '#cbd5e1',
                  padding: '5px 8px',
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <RotateCcw size={12} />
                <span>Reset View</span>
              </button>
            </div>
          </div>

          {/* TOP-RIGHT OVERLAY: Live Camera Telemetry */}
          <div
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              background: 'rgba(11, 14, 18, 0.85)',
              backdropFilter: 'blur(6px)',
              border: '1px solid #27272a',
              padding: '6px 10px',
              fontSize: '10px',
              fontFamily: 'var(--font-mono)',
              color: '#94a3b8',
              lineHeight: 1.5,
              zIndex: 5,
              pointerEvents: 'none',
            }}
          >
            <div>AZIMUTH: <strong style={{ color: '#38bdf8' }}>{camTelemetry.azim}°</strong></div>
            <div>ELEVATION: <strong style={{ color: '#38bdf8' }}>{camTelemetry.elev}°</strong></div>
            <div>DISTANCE: <strong style={{ color: '#f59e0b' }}>{camTelemetry.dist} m</strong></div>
          </div>

          {/* BOTTOM-LEFT OVERLAY: Navigation Controls Hint */}
          <div
            style={{
              position: 'absolute',
              bottom: '12px',
              left: '12px',
              fontSize: '10px',
              fontFamily: 'var(--font-mono)',
              color: '#64748b',
              background: 'rgba(7, 9, 12, 0.75)',
              padding: '4px 8px',
              border: '1px solid #1e242b',
              zIndex: 5,
              pointerEvents: 'none',
            }}
          >
            🕹️ [DRAG] Orbit 360° · [SCROLL] Zoom · [RIGHT CLICK] Pan
          </div>

          {/* BOTTOM-RIGHT: Lighting Switcher */}
          <div
            style={{
              position: 'absolute',
              bottom: '12px',
              right: '12px',
              display: 'flex',
              gap: '4px',
              background: 'rgba(7, 9, 12, 0.8)',
              padding: '3px',
              border: '1px solid #27272a',
              zIndex: 5,
            }}
          >
            {(['SOLAR', 'STUDIO', 'RIM'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => {
                  setLightingMode(mode);
                  soundFx.playClick(550);
                }}
                style={{
                  background: lightingMode === mode ? '#27272a' : 'transparent',
                  color: lightingMode === mode ? '#f59e0b' : '#64748b',
                  border: 'none',
                  fontSize: '9.5px',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  padding: '3px 6px',
                  cursor: 'pointer',
                }}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* ── RIGHT: DETAILED ENGINEERING DOSSIER & SPECIFICATIONS ─────────── */}
        <div
          style={{
            background: '#101317',
            border: '1px solid #27272a',
            borderRadius: 0,
            padding: '18px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}
        >
          <div>
            <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: '#f59e0b', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              NASA Aerospace Technical Specification Dossier
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc', margin: '4px 0 2px' }}>
              {activeModel.name}
            </h3>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>
              Mission: <strong style={{ color: '#38bdf8' }}>{activeModel.mission}</strong> · First Operational Flight: <strong>{activeModel.year}</strong>
            </div>
          </div>

          <p style={{ fontSize: '12.5px', color: '#cbd5e1', lineHeight: 1.55, margin: 0 }}>
            {activeModel.summary}
          </p>

          {/* Quick Engineering Telemetry Matrix */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '8px',
              background: '#090b0e',
              padding: '10px 12px',
              border: '1px solid #1e242b',
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
            }}
          >
            <div>
              <span style={{ color: '#64748b' }}>TOTAL MASS:</span>
              <div style={{ color: '#f8fafc', fontWeight: 700 }}>{activeModel.mass}</div>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>DIMENSIONS:</span>
              <div style={{ color: '#f8fafc', fontWeight: 700 }}>{activeModel.dimensions}</div>
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <span style={{ color: '#64748b' }}>PROPULSION:</span>
              <div style={{ color: '#38bdf8', fontWeight: 700 }}>{activeModel.propulsion}</div>
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <span style={{ color: '#64748b' }}>POWER SYSTEM:</span>
              <div style={{ color: '#f59e0b', fontWeight: 700 }}>{activeModel.powerSystem}</div>
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <span style={{ color: '#64748b' }}>COMMS BAND:</span>
              <div style={{ color: '#10b981', fontWeight: 700 }}>{activeModel.comms}</div>
            </div>
          </div>

          {/* Key Engineering Breakthroughs */}
          <div>
            <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#f8fafc', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Zap size={13} style={{ color: '#f59e0b' }} />
              <span>KEY ENGINEERING BREAKTHROUGHS</span>
            </div>
            <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: '#cbd5e1', lineHeight: 1.5 }}>
              {activeModel.keyInnovations.map((item, idx) => (
                <li key={idx} style={{ marginBottom: '4px' }}>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Operational Flight Manual Protocol Callout */}
          <div
            style={{
              background: 'rgba(56, 189, 248, 0.06)',
              borderLeft: '3px solid #38bdf8',
              padding: '8px 12px',
              fontSize: '11.5px',
              color: '#93c5fd',
              lineHeight: 1.5,
              fontStyle: 'italic',
            }}
          >
            <strong style={{ fontStyle: 'normal', color: '#38bdf8' }}>Flight Manual Excerpt: </strong>
            "{activeModel.flightManualNote}"
          </div>

          {/* Action Launch Buttons */}
          <div style={{ marginTop: 'auto', display: 'flex', gap: '8px' }}>
            {onLaunchMission && activeModel.missionId && (
              <button
                onClick={() => {
                  soundFx.playReactorStart();
                  onLaunchMission(activeModel.missionId!);
                }}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  background: '#f59e0b',
                  color: '#0c0d0e',
                  border: '1px solid #f59e0b',
                  fontWeight: 800,
                  fontSize: '12px',
                  fontFamily: 'var(--font-mono)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                }}
              >
                <Rocket size={14} />
                <span>Simulate Flight Mission</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
