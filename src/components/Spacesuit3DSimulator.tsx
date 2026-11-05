import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  Shield,
  Zap,
  Gauge,
  Flame,
  Lightbulb,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Info,
  Maximize2,
  Volume2,
  VolumeX,
  Compass,
  Activity,
  Play,
  Crosshair,
} from 'lucide-react';
import { soundFx } from '../utils/audioEffects';

export interface SpacesuitHotspot {
  id: string;
  name: string;
  nasaCode: string;
  category: 'HEAD_HELMET' | 'TORSO_LIFE_SUPPORT' | 'HANDS_ARMS' | 'LEGS_BOOTS' | 'PROPULSION';
  icon: string;
  cameraPos: [number, number, number];
  cameraTarget: [number, number, number];
  summary: string;
  physicsReason: string;
  specs: string;
}

export const SPACESUIT_HOTSPOTS: SpacesuitHotspot[] = [
  {
    id: 'HELMET_VISOR',
    name: 'Extravehicular Visor Assembly (LEVA)',
    nasaCode: 'EVVA / LEVA',
    category: 'HEAD_HELMET',
    icon: '🪖',
    cameraPos: [0, 2.3, 1.8],
    cameraTarget: [0, 1.9, 0],
    summary: 'Polycarbonate protective pressure shell layered with pure vapor-deposited 24-karat gold.',
    physicsReason: 'In the vacuum of space without atmospheric Rayleigh scattering, unfiltered solar UV & IR are lethal. The micro-thin gold film reflects 95% of thermal solar radiation while allowing optimal optical visibility.',
    specs: 'Polycarbonate shell coated with 0.000005 cm layer of pure gold; rated for -150°C to +120°C extremes.',
  },
  {
    id: 'PLSS_BACKPACK',
    name: 'Portable Life Support System (PLSS)',
    nasaCode: 'PLSS / Primary ECLSS',
    category: 'TORSO_LIFE_SUPPORT',
    icon: '🎒',
    cameraPos: [0, 1.8, -2.4],
    cameraTarget: [0, 1.3, -0.3],
    summary: 'Self-contained life-support backpack supplying pure oxygen, removing carbon dioxide, and cycling cooling water.',
    physicsReason: 'Regulates internal suit atmosphere at 29.6 kPa (4.3 psi) of 100% pure oxygen. Sublimates ice into vacuum through a microporous metal plate to reject astronaut body heat.',
    specs: 'Dual cryogenic O2 tanks at 24.8 MPa (3,600 psi); 8-hour EVA endurance with 30-min secondary emergency O2 pack.',
  },
  {
    id: 'DCM_CHEST',
    name: 'Display and Control Module (DCM)',
    nasaCode: 'DCM / Chest Console',
    category: 'TORSO_LIFE_SUPPORT',
    icon: '🎛️',
    cameraPos: [0, 1.5, 1.4],
    cameraTarget: [0, 1.25, 0],
    summary: 'Mission chest console housing vital suit telemetry switches, purge valves, and pressure readouts.',
    physicsReason: 'Astronauts cannot look straight down through helmet rings, so DCM labeling is printed in mirror-reverse so the crew can read switches using a wrist-mounted mirror.',
    specs: 'Digital OLED pressure transducer readout, primary/secondary O2 actuators, and comms volume dials.',
  },
  {
    id: 'EVA_GLOVES',
    name: 'Phase VI High-Dexterity Pressurized Gloves',
    nasaCode: 'Phase VI EVA Assembly',
    category: 'HANDS_ARMS',
    icon: '🧤',
    cameraPos: [1.3, 1.2, 1.2],
    cameraTarget: [0.65, 0.85, 0],
    summary: 'Multi-layer finger convolutes with integrated fingertip heating elements and silicone grip matrices.',
    physicsReason: 'When a glove is pressurized to 29.6 kPa against zero vacuum, bending fingers requires tremendous continuous muscular force. Convolute bellows minimize fatigue.',
    specs: 'RTV silicone palms, Vectran tear-resistant restraint layer, active resistive fingertip warmers.',
  },
  {
    id: 'LUNAR_BOOTS',
    name: 'Extraterrestrial Surface Traction Boots',
    nasaCode: 'LTA Thermal Overboots',
    category: 'LEGS_BOOTS',
    icon: '🥾',
    cameraPos: [0.7, 0.35, 1.6],
    cameraTarget: [0, 0.2, 0],
    summary: 'Deep-lug silicone-tread overboots shielding the astronaut from razor-sharp abrasive lunar regolith.',
    physicsReason: 'Lunar regolith dust consists of un-eroded, jagged glass shards from billions of years of meteorite impacts. Boots use silicon-sponge insulation against thermal ground extremes.',
    specs: 'Titanium-alloy lace reinforcement, multi-layer aluminized Mylar radiation insulation, -160°C to +130°C certified.',
  },
  {
    id: 'SAFER_THRUSTERS',
    name: 'Simplified Aid for EVA Rescue (SAFER)',
    nasaCode: 'SAFER Cold-Gas Jetpack',
    category: 'PROPULSION',
    icon: '🚀',
    cameraPos: [-1.2, 1.8, -2.0],
    cameraTarget: [-0.2, 1.4, -0.4],
    summary: 'Emergency self-rescue nitrogen cold-gas propulsion backpack for untethered spacewalk contingency.',
    physicsReason: 'If an astronaut becomes untethered and drifts away from the airlock or station, SAFER fires cold compressed nitrogen thrusters to counter angular velocity and fly back.',
    specs: '24 cold-gas nitrogen thrusters delivering 3.56 N (0.8 lbf) thrust each; Delta-V capacity: ~3.05 m/s (10 ft/s).',
  },
];

interface Spacesuit3DSimulatorProps {
  onBackToCatalog?: () => void;
}

export const Spacesuit3DSimulator: React.FC<Spacesuit3DSimulatorProps> = ({ onBackToCatalog }) => {
  const mountRef = useRef<HTMLDivElement>(null);

  // Active Hotspot & Telemetry State
  const [selectedHotspot, setSelectedHotspot] = useState<SpacesuitHotspot>(SPACESUIT_HOTSPOTS[0]);
  const [isVisorOpen, setIsVisorOpen] = useState(false);
  const [lightsActive, setLightsActive] = useState(true);
  const [thrustersFiring, setThrustersFiring] = useState(false);
  const [isAutoRotate, setIsAutoRotate] = useState(false);
  const [walkMode, setWalkMode] = useState<'IDLE' | 'FLOAT' | 'WALK'>('FLOAT');
  const [suitPressureKpa, setSuitPressureKpa] = useState(29.6);
  const [o2PurityPct, setO2PurityPct] = useState(99.8);
  const [coreTempC, setCoreTempC] = useState(21.4);
  const [alertActive, setAlertActive] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  // References to Three.js elements
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const visorMeshRef = useRef<THREE.Mesh | null>(null);
  const spotlightLRef = useRef<THREE.SpotLight | null>(null);
  const spotlightRRef = useRef<THREE.SpotLight | null>(null);
  const thrusterFlamesRef = useRef<THREE.Mesh[]>([]);
  const astroGroupRef = useRef<THREE.Group | null>(null);
  const armLRef = useRef<THREE.Group | null>(null);
  const armRRef = useRef<THREE.Group | null>(null);
  const legLRef = useRef<THREE.Group | null>(null);
  const legRRef = useRef<THREE.Group | null>(null);

  // Camera lerp targets
  const targetCamPos = useRef(new THREE.Vector3(0, 1.8, 3.2));
  const targetCamLook = useRef(new THREE.Vector3(0, 1.2, 0));

  // Switch hotspot inspection target
  const handleSelectHotspot = useCallback((spot: SpacesuitHotspot) => {
    setSelectedHotspot(spot);
    targetCamPos.current.set(spot.cameraPos[0], spot.cameraPos[1], spot.cameraPos[2]);
    targetCamLook.current.set(spot.cameraTarget[0], spot.cameraTarget[1], spot.cameraTarget[2]);
    soundFx.playTelemetryChirp();
  }, []);

  // Action: Toggle 24K Gold Visor
  const handleToggleVisor = () => {
    setIsVisorOpen((prev) => {
      const next = !prev;
      soundFx.playClick(next ? 520 : 740);
      return next;
    });
  };

  // Action: Toggle Helmet Dual Floodlights
  const handleToggleLights = () => {
    setLightsActive((prev) => {
      const next = !prev;
      if (spotlightLRef.current) spotlightLRef.current.visible = next;
      if (spotlightRRef.current) spotlightRRef.current.visible = next;
      soundFx.playClick(next ? 880 : 440);
      return next;
    });
  };

  // Action: Test SAFER Nitrogen Thrusters Burst
  const handleFireThrusters = () => {
    if (thrustersFiring) return;
    setThrustersFiring(true);
    soundFx.playReactorStart();
    thrusterFlamesRef.current.forEach((f) => ((f.material as THREE.MeshBasicMaterial).opacity = 0.95));

    // Impulse burst float animation
    setTimeout(() => {
      setThrustersFiring(false);
      thrusterFlamesRef.current.forEach((f) => ((f.material as THREE.MeshBasicMaterial).opacity = 0));
    }, 1200);
  };

  // Action: Test 29.6 kPa Suit Atmospheric Regulation Drill
  const handleTestPressureDrill = () => {
    soundFx.playReactorStart();
    setSuitPressureKpa(101.3); // Starts at Earth sea level habitat pressure
    let p = 101.3;
    const interval = setInterval(() => {
      p -= 7.2;
      if (p <= 29.6) {
        p = 29.6;
        clearInterval(interval);
        soundFx.playVictory();
      }
      setSuitPressureKpa(Number(p.toFixed(1)));
    }, 80);
  };

  // Action: Micrometeorite Leak Emergency Drill
  const handleEmergencyDrill = () => {
    if (alertActive) return;
    setAlertActive(true);
    setAlertMessage('🚨 WARNING: MICROMETEORITE IMPACT DETECTED! PRESSURE VENTING AT -1.8 kPa/sec');
    soundFx.playAlarm();

    let p = 29.6;
    const leakInterval = setInterval(() => {
      p = Math.max(18.2, p - 2.1);
      setSuitPressureKpa(Number(p.toFixed(1)));
      if (p <= 21.0) {
        clearInterval(leakInterval);
        // Automatic Self-Sealing Bladder & Secondary O2 Actuation
        setAlertMessage('🛡️ AUTOMATIC PUNCTURE SEAL ENGAGED · SECONDARY O2 REGULATOR NOMINAL');
        soundFx.playShieldHum();

        setTimeout(() => {
          setSuitPressureKpa(29.6);
          setAlertActive(false);
          setAlertMessage(null);
          soundFx.playVictory();
        }, 2200);
      }
    }, 120);
  };

  // Setup Three.js WebGL Scene
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight || 420;

    // Scene & Deep-Space Fog
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.fog = new THREE.FogExp2(0x020617, 0.025);

    // Perspective Camera
    const camera = new THREE.PerspectiveCamera(46, width / height, 0.1, 100);
    camera.position.set(0, 1.8, 3.2);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    container.appendChild(renderer.domElement);

    // Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controlsRef.current = controls;
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.minDistance = 1.1;
    controls.maxDistance = 6.0;
    controls.maxPolarAngle = Math.PI / 2.05;
    controls.target.set(0, 1.2, 0);

    // Ambient & Tactical Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 1.4));

    const keyLight = new THREE.DirectionalLight(0xe0f2fe, 3.2);
    keyLight.position.set(3, 5, 4);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 2.6);
    rimLight.position.set(-4, 3, -4);
    scene.add(rimLight);

    const warmGroundLight = new THREE.PointLight(0xf59e0b, 1.2, 8);
    warmGroundLight.position.set(0, 0.2, 0);
    scene.add(warmGroundLight);

    // Background Starfield
    const starGeo = new THREE.BufferGeometry();
    const starCount = 900;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      const r = 24 + Math.random() * 30;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      starPositions[i] = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i + 1] = r * Math.sin(phi) * Math.sin(theta);
      starPositions[i + 2] = r * Math.cos(phi);
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xbae6fd, size: 0.12, transparent: true, opacity: 0.85 });
    const starField = new THREE.Points(starGeo, starMat);
    scene.add(starField);

    // Distant Earth Globe in background
    const earthGeo = new THREE.SphereGeometry(3.5, 32, 32);
    const earthMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.7,
      metalness: 0.1,
      emissive: 0x0369a1,
      emissiveIntensity: 0.35,
    });
    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    earthMesh.position.set(16, 8, -26);
    scene.add(earthMesh);

    // Pedestal: High-tech Lunar EVA Staging Ground Platform
    const pedestalGeo = new THREE.CylinderGeometry(1.65, 1.85, 0.22, 32);
    const pedestalMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.35,
      metalness: 0.8,
    });
    const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
    pedestal.position.y = 0.11;
    pedestal.receiveShadow = true;
    scene.add(pedestal);

    // Pedestal Glowing Rings
    const ringGeo = new THREE.RingGeometry(1.4, 1.58, 32);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide });
    const pRing = new THREE.Mesh(ringGeo, ringMat);
    pRing.rotation.x = -Math.PI / 2;
    pRing.position.y = 0.225;
    scene.add(pRing);

    // ─── HIGH-FIDELITY 3D NASA ARTEMIS xEMU SPACESUIT MODEL ───
    const astroGroup = new THREE.Group();
    astroGroup.position.set(0, 0.22, 0);
    astroGroupRef.current = astroGroup;
    scene.add(astroGroup);

    // Materials
    const suitMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.4,
      metalness: 0.12,
    });
    const jointMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.7,
      metalness: 0.4,
    });
    const visorMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.98,
      roughness: 0.05,
      emissive: 0xd97706,
      emissiveIntensity: 0.45,
    });
    const innerVisorMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      metalness: 0.9,
      roughness: 0.15,
      transparent: true,
      opacity: 0.55,
    });
    const dcmMat = new THREE.MeshStandardMaterial({
      color: 0x020617,
      metalness: 0.85,
      roughness: 0.2,
    });
    const plssMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.3,
      roughness: 0.35,
    });
    const gloveMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      metalness: 0.2,
      roughness: 0.6,
    });
    const bootMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.5,
      roughness: 0.8,
    });

    // 1. Hard Upper Torso (HUT)
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.32, 0.72, 20), suitMat);
    torso.position.y = 1.15;
    astroGroup.add(torso);

    // Red NASA Commander Mission Stripe
    const redStripe = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.09, 0.4), new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.5 }));
    redStripe.position.set(0, 1.38, 0.01);
    astroGroup.add(redStripe);

    // NASA Meatball Insignia Patch (Left Chest)
    const patch = new THREE.Mesh(
      new THREE.CylinderGeometry(0.065, 0.065, 0.02, 16),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, emissive: 0x0369a1, emissiveIntensity: 0.5 })
    );
    patch.rotation.x = Math.PI / 2;
    patch.position.set(-0.18, 1.28, 0.22);
    astroGroup.add(patch);

    // 2. Chest Display & Control Module (DCM Console)
    const dcmGroup = new THREE.Group();
    dcmGroup.position.set(0, 1.15, 0.24);
    const dcmBox = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.24, 0.1), dcmMat);
    dcmGroup.add(dcmBox);

    // DCM Digital Pressure Transducer Display Screen
    const dcmScreen = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.07, 0.02),
      new THREE.MeshBasicMaterial({ color: 0x22c55e })
    );
    dcmScreen.position.set(0, 0.05, 0.055);
    dcmGroup.add(dcmScreen);

    // DCM Status Indicator LEDs
    const ledColors = [0x38bdf8, 0xef4444, 0xf59e0b];
    ledColors.forEach((col, idx) => {
      const led = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.03, 8), new THREE.MeshBasicMaterial({ color: col }));
      led.rotation.x = Math.PI / 2;
      led.position.set(-0.06 + idx * 0.06, -0.04, 0.055);
      dcmGroup.add(led);
    });
    astroGroup.add(dcmGroup);

    // 3. Helmet & Visor Assembly
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 1.76, 0);
    astroGroup.add(headGroup);

    // Helmet Neck Disconnect Ring
    const neckRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.28, 0.04, 12, 24),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9 })
    );
    neckRing.rotation.x = Math.PI / 2;
    neckRing.position.y = -0.22;
    headGroup.add(neckRing);

    // Outer Helmet Pressure Bubble
    const outerHelmet = new THREE.Mesh(new THREE.SphereGeometry(0.36, 24, 24), suitMat);
    headGroup.add(outerHelmet);

    // Clear Inner Pressure Faceplate
    const innerBubble = new THREE.Mesh(new THREE.SphereGeometry(0.3, 20, 20), innerVisorMat);
    innerBubble.position.set(0, 0, 0.12);
    headGroup.add(innerBubble);

    // 24K Gold Extravehicular Visor (Pivotable)
    const visorMesh = new THREE.Mesh(new THREE.SphereGeometry(0.31, 24, 24, 0, Math.PI, 0, Math.PI * 0.72), visorMat);
    visorMesh.rotation.x = -Math.PI / 2;
    visorMesh.position.set(0, 0.02, 0.11);
    headGroup.add(visorMesh);
    visorMeshRef.current = visorMesh;

    // Dual Helmet Headlights (High-Lumen LEDs)
    const spotL = new THREE.SpotLight(0xffffff, 3.5, 9, Math.PI / 4, 0.4);
    spotL.position.set(-0.35, 1.82, 0.2);
    spotL.target.position.set(-0.35, 1.6, 3.5);
    astroGroup.add(spotL);
    astroGroup.add(spotL.target);
    spotlightLRef.current = spotL;

    const spotR = new THREE.SpotLight(0xffffff, 3.5, 9, Math.PI / 4, 0.4);
    spotR.position.set(0.35, 1.82, 0.2);
    spotR.target.position.set(0.35, 1.6, 3.5);
    astroGroup.add(spotR);
    astroGroup.add(spotR.target);
    spotlightRRef.current = spotR;

    // 4. Portable Life Support System (PLSS Backpack)
    const plssGroup = new THREE.Group();
    plssGroup.position.set(0, 1.25, -0.32);
    astroGroup.add(plssGroup);

    // Main Backpack Body
    const plssBody = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.86, 0.35), plssMat);
    plssGroup.add(plssBody);

    // Dual Cryogenic Oxygen Tanks (Tapered cylinders)
    const o2TankGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.75, 16);
    const o2TankMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.8, roughness: 0.2 });
    [-0.16, 0.16].forEach((tx) => {
      const tank = new THREE.Mesh(o2TankGeo, o2TankMat);
      tank.position.set(tx, 0.02, -0.16);
      plssGroup.add(tank);
    });

    // Sublimator Radiator Grill
    const grill = new THREE.Mesh(
      new THREE.BoxGeometry(0.38, 0.18, 0.02),
      new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.9 })
    );
    grill.position.set(0, 0.28, -0.18);
    plssGroup.add(grill);

    // UHF Communications Antenna
    const antPole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.02, 0.42),
      new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9 })
    );
    antPole.position.set(0.24, 0.58, -0.1);
    plssGroup.add(antPole);

    // 5. SAFER Cold-Gas Thruster System (4 Corner Nozzles + Animated Particle Plumes)
    const thrusterFlames: THREE.Mesh[] = [];
    const nozzleOffsets = [
      [-0.24, 0.4, -0.16],
      [0.24, 0.4, -0.16],
      [-0.24, -0.35, -0.16],
      [0.24, -0.35, -0.16],
    ];

    nozzleOffsets.forEach(([nx, ny, nz]) => {
      const nozzle = new THREE.Mesh(
        new THREE.ConeGeometry(0.045, 0.09, 10),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9 })
      );
      nozzle.position.set(nx, ny, nz);
      nozzle.rotation.x = Math.PI;
      plssGroup.add(nozzle);

      // Gas plume flame cone
      const plume = new THREE.Mesh(
        new THREE.ConeGeometry(0.08, 0.45, 12),
        new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0 })
      );
      plume.position.set(nx, ny - 0.24, nz);
      plume.rotation.x = Math.PI;
      plssGroup.add(plume);
      thrusterFlames.push(plume);
    });
    thrusterFlamesRef.current = thrusterFlames;

    // 6. Articulated Arms & High-Dexterity Gloves
    const armL = new THREE.Group();
    armL.position.set(-0.48, 1.35, 0);
    const bicepL = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.42, 12), suitMat);
    bicepL.position.y = -0.21;
    armL.add(bicepL);
    const elbowL = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 12), jointMat);
    elbowL.position.y = -0.42;
    armL.add(elbowL);
    const forearmL = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.09, 0.34, 12), suitMat);
    forearmL.position.y = -0.58;
    armL.add(forearmL);
    const gloveL = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.18, 0.14), gloveMat);
    gloveL.position.y = -0.8;
    armL.add(gloveL);
    astroGroup.add(armL);
    armLRef.current = armL;

    const armR = new THREE.Group();
    armR.position.set(0.48, 1.35, 0);
    const bicepR = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.42, 12), suitMat);
    bicepR.position.y = -0.21;
    armR.add(bicepR);
    const elbowR = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 12), jointMat);
    elbowR.position.y = -0.42;
    armR.add(elbowR);
    const forearmR = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.09, 0.34, 12), suitMat);
    forearmR.position.y = -0.58;
    armR.add(forearmR);
    const gloveR = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.18, 0.14), gloveMat);
    gloveR.position.y = -0.8;
    armR.add(gloveR);
    astroGroup.add(armR);
    armRRef.current = armR;

    // 7. Lower Torso Assembly (LTA) & Lunar Surface Boots
    const legL = new THREE.Group();
    legL.position.set(-0.21, 0.8, 0);
    const thighL = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.12, 0.52, 12), suitMat);
    thighL.position.y = -0.26;
    legL.add(thighL);
    const kneeL = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 12), jointMat);
    kneeL.position.y = -0.52;
    legL.add(kneeL);
    const calfL = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.11, 0.46, 12), suitMat);
    calfL.position.y = -0.74;
    legL.add(calfL);
    const bootL = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.18, 0.42), bootMat);
    bootL.position.set(0, -1.02, 0.06);
    legL.add(bootL);
    astroGroup.add(legL);
    legLRef.current = legL;

    const legR = new THREE.Group();
    legR.position.set(0.21, 0.8, 0);
    const thighR = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.12, 0.52, 12), suitMat);
    thighR.position.y = -0.26;
    legR.add(thighR);
    const kneeR = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 12), jointMat);
    kneeR.position.y = -0.52;
    legR.add(kneeR);
    const calfR = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.11, 0.46, 12), suitMat);
    calfR.position.y = -0.74;
    legR.add(calfR);
    const bootR = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.18, 0.42), bootMat);
    bootR.position.set(0, -1.02, 0.06);
    legR.add(bootR);
    astroGroup.add(legR);
    legRRef.current = legR;

    // ─── ANIMATION LOOP ───
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Smooth camera interpolation towards selected hotspot
      camera.position.lerp(targetCamPos.current, 0.06);
      controls.target.lerp(targetCamLook.current, 0.06);
      controls.update();

      // Auto-rotation toggle
      if (isAutoRotate) {
        astroGroup.rotation.y += 0.008;
      }

      // Visor mechanical flip animation
      if (visorMeshRef.current) {
        const targetRotX = isVisorOpen ? -Math.PI / 1.15 : -Math.PI / 2;
        visorMeshRef.current.rotation.x = THREE.MathUtils.lerp(visorMeshRef.current.rotation.x, targetRotX, 0.12);
      }

      // Spacewalk Float / Walk cycle physics
      if (walkMode === 'FLOAT') {
        astroGroup.position.y = 0.22 + Math.sin(elapsed * 1.5) * 0.08;
        astroGroup.rotation.z = Math.sin(elapsed * 0.8) * 0.03;
        armL.rotation.z = -0.15 + Math.sin(elapsed * 1.2) * 0.08;
        armR.rotation.z = 0.15 - Math.sin(elapsed * 1.2) * 0.08;
        legL.rotation.x = Math.sin(elapsed * 1.0) * 0.06;
        legR.rotation.x = -Math.sin(elapsed * 1.0) * 0.06;
      } else if (walkMode === 'WALK') {
        const walkFreq = elapsed * 3.5;
        astroGroup.position.y = 0.22 + Math.abs(Math.sin(walkFreq)) * 0.06;
        armL.rotation.x = Math.sin(walkFreq) * 0.35;
        armR.rotation.x = -Math.sin(walkFreq) * 0.35;
        legL.rotation.x = -Math.sin(walkFreq) * 0.45;
        legR.rotation.x = Math.sin(walkFreq) * 0.45;
      } else {
        // IDLE stance
        astroGroup.position.y = 0.22;
        armL.rotation.set(0, 0, 0);
        armR.rotation.set(0, 0, 0);
        legL.rotation.set(0, 0, 0);
        legR.rotation.set(0, 0, 0);
      }

      // Thruster burst dynamic vertical kick
      if (thrustersFiring) {
        astroGroup.position.y += Math.sin(elapsed * 25) * 0.03 + 0.04;
      }

      // Slowly rotate distant background Earth
      earthMesh.rotation.y += 0.0015;

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(animate);

    // Resize handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight || 580;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      renderer.forceContextLoss();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [isAutoRotate, isVisorOpen, walkMode, thrustersFiring]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        width: '100%',
        minHeight: '480px',
        backgroundColor: '#030712',
        borderRadius: '16px',
        border: '1.5px solid rgba(56, 189, 248, 0.35)',
        boxShadow: '0 0 40px rgba(15, 23, 42, 0.95)',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* ── TOP HEADER / TELEMETRY STATUS BAR ── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '14px 20px',
          background: 'linear-gradient(90deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.85))',
          borderBottom: '1px solid rgba(56, 189, 248, 0.25)',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #0284c7, #38bdf8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              boxShadow: '0 0 15px rgba(56, 189, 248, 0.5)',
            }}
          >
            🧑‍🚀
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '15px', fontWeight: 900, color: '#f8fafc', letterSpacing: '0.04em' }}>
                NASA ARTEMIS xEMU 3D SPACESUIT SIMULATOR
              </span>
              <span
                style={{
                  background: 'rgba(56, 189, 248, 0.15)',
                  border: '1px solid #38bdf8',
                  borderRadius: '6px',
                  padding: '2px 8px',
                  fontSize: '10px',
                  color: '#38bdf8',
                  fontWeight: 800,
                }}
              >
                INTERACTIVE EVA LAB
              </span>
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>
              Full 3D Kinematics · 29.6 kPa Pressure Regulator · SAFER Cold-Gas RCS · Thermal Vacuum Diagnostics
            </div>
          </div>
        </div>

        {/* Live Suit Gauges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Gauge size={16} color="#38bdf8" />
            <div>
              <div style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 800 }}>PRESSURE</div>
              <div style={{ fontSize: '13px', fontWeight: 900, color: suitPressureKpa === 29.6 ? '#38bdf8' : '#f59e0b' }}>
                {suitPressureKpa} kPa
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={16} color="#4ade80" />
            <div>
              <div style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 800 }}>O2 PURITY</div>
              <div style={{ fontSize: '13px', fontWeight: 900, color: '#4ade80' }}>
                {o2PurityPct}%
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={16} color="#a855f7" />
            <div>
              <div style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 800 }}>CORE TEMP</div>
              <div style={{ fontSize: '13px', fontWeight: 900, color: '#c084fc' }}>
                {coreTempC}°C
              </div>
            </div>
          </div>

          {onBackToCatalog && (
            <button
              onClick={onBackToCatalog}
              style={{
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#cbd5e1',
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              📋 View Catalog
            </button>
          )}
        </div>
      </div>

      {/* ── EMERGENCY ALERT BANNER ── */}
      {alertMessage && (
        <div
          style={{
            margin: '0 20px',
            background: 'linear-gradient(90deg, rgba(239, 68, 68, 0.95), rgba(185, 28, 28, 0.95))',
            color: '#fff',
            padding: '10px 18px',
            borderRadius: '10px',
            fontSize: '12px',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: '0 0 20px rgba(239, 68, 68, 0.6)',
            animation: 'pulse 1s infinite',
          }}
        >
          <AlertTriangle size={18} />
          <span>{alertMessage}</span>
        </div>
      )}

      {/* ── MAIN STAGE: 3D VIEWPORT + RIGHT INSPECTION HUD ── */}
      <div style={{ display: 'flex', flex: 1, position: 'relative', minHeight: '420px', flexWrap: 'wrap' }}>
        {/* Left: 3D Canvas */}
        <div style={{ flex: '1 1 560px', height: '420px', position: 'relative', overflow: 'hidden' }}>
          <div ref={mountRef} style={{ width: '100%', height: '100%', cursor: 'grab' }} />

          {/* Canvas Controls Overlay (Orbit hints & reset) */}
          <div
            style={{
              position: 'absolute',
              bottom: '16px',
              left: '16px',
              display: 'flex',
              gap: '8px',
              background: 'rgba(15, 23, 42, 0.8)',
              padding: '6px 12px',
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              fontSize: '11px',
              color: '#94a3b8',
              backdropFilter: 'blur(8px)',
            }}
          >
            <span>🖱️ Drag to Orbit 360° · Scroll to Zoom</span>
            <button
              onClick={() => {
                targetCamPos.current.set(0, 1.8, 3.2);
                targetCamLook.current.set(0, 1.2, 0);
                soundFx.playClick(600);
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#38bdf8',
                cursor: 'pointer',
                fontWeight: 800,
                padding: '0 4px',
              }}
            >
              [RESET VIEW]
            </button>
          </div>

          {/* Auto-rotate pill */}
          <button
            onClick={() => {
              setIsAutoRotate((r) => !r);
              soundFx.playClick(750);
            }}
            style={{
              position: 'absolute',
              top: '16px',
              left: '16px',
              background: isAutoRotate ? 'rgba(56, 189, 248, 0.25)' : 'rgba(15, 23, 42, 0.8)',
              border: isAutoRotate ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.15)',
              color: isAutoRotate ? '#38bdf8' : '#94a3b8',
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '11px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backdropFilter: 'blur(8px)',
            }}
          >
            <RotateCcw size={13} /> {isAutoRotate ? 'TURNTABLE ON' : 'AUTO-ROTATE'}
          </button>
        </div>

        {/* Right: Component Inspector & NASA Telemetry Card */}
        <div
          style={{
            flex: '0 0 380px',
            background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.95), rgba(11, 16, 26, 0.98))',
            borderLeft: '1px solid rgba(56, 189, 248, 0.25)',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            overflowY: 'auto',
            maxHeight: '420px',
          }}
        >
          {/* Quick Select Hotspot Pills */}
          <div>
            <div style={{ fontSize: '10px', color: '#38bdf8', fontWeight: 900, marginBottom: '8px', letterSpacing: '0.08em' }}>
              🔍 SELECT SPACESUIT SUBSYSTEM TO INSPECT:
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
              {SPACESUIT_HOTSPOTS.map((spot) => {
                const isSelected = selectedHotspot.id === spot.id;
                return (
                  <button
                    key={spot.id}
                    onClick={() => handleSelectHotspot(spot)}
                    style={{
                      background: isSelected ? 'linear-gradient(135deg, rgba(56, 189, 248, 0.25), rgba(2, 132, 199, 0.25))' : 'rgba(255, 255, 255, 0.04)',
                      border: isSelected ? '1.5px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.1)',
                      color: isSelected ? '#ffffff' : '#94a3b8',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      fontSize: '11px',
                      fontWeight: isSelected ? 900 : 700,
                      cursor: 'pointer',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.15s ease',
                      boxShadow: isSelected ? '0 0 12px rgba(56, 189, 248, 0.3)' : 'none',
                    }}
                  >
                    <span>{spot.icon}</span>
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{spot.nasaCode}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Hotspot Inspector Details */}
          <div
            style={{
              background: 'rgba(2, 6, 23, 0.7)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              borderRadius: '12px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '24px' }}>{selectedHotspot.icon}</span>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 900, color: '#f8fafc' }}>
                  {selectedHotspot.name}
                </div>
                <div style={{ fontSize: '10px', color: '#38bdf8', fontWeight: 800 }}>
                  NASA DESIGNATION: {selectedHotspot.nasaCode}
                </div>
              </div>
            </div>

            <p style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: '1.55', margin: 0 }}>
              {selectedHotspot.summary}
            </p>

            <div style={{ background: 'rgba(56, 189, 248, 0.08)', borderRadius: '8px', padding: '10px', borderLeft: '3px solid #38bdf8' }}>
              <div style={{ fontSize: '10px', color: '#38bdf8', fontWeight: 900, marginBottom: '4px' }}>
                ⚛️ SPACE PHYSICS &amp; VACUUM PRINCIPLE:
              </div>
              <div style={{ fontSize: '11.5px', color: '#e2e8f0', lineHeight: '1.5' }}>
                {selectedHotspot.physicsReason}
              </div>
            </div>

            <div style={{ background: 'rgba(168, 85, 247, 0.08)', borderRadius: '8px', padding: '10px', borderLeft: '3px solid #a855f7' }}>
              <div style={{ fontSize: '10px', color: '#c084fc', fontWeight: 900, marginBottom: '4px' }}>
                📐 NASA ENGINEERING SPECIFICATION:
              </div>
              <div style={{ fontSize: '11px', color: '#e2e8f0', fontFamily: 'monospace' }}>
                {selectedHotspot.specs}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── BOTTOM INTERACTIVE SIMULATION DRILL CONTROLS ── */}
      <div
        style={{
          padding: '14px 20px',
          background: 'linear-gradient(90deg, rgba(15, 23, 42, 0.98), rgba(30, 41, 59, 0.95))',
          borderTop: '1px solid rgba(56, 189, 248, 0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Action 1: Fire SAFER Nitrogen Thrusters */}
          <button
            onClick={handleFireThrusters}
            style={{
              background: thrustersFiring
                ? 'linear-gradient(135deg, #0284c7, #38bdf8)'
                : 'linear-gradient(135deg, rgba(2, 132, 199, 0.25), rgba(15, 23, 42, 0.8))',
              border: '1.5px solid #38bdf8',
              color: '#ffffff',
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '11.5px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: thrustersFiring ? '0 0 20px rgba(56, 189, 248, 0.6)' : 'none',
            }}
          >
            <Flame size={15} color="#38bdf8" />
            <span>TEST SAFER RCS JETS</span>
          </button>

          {/* Action 2: Gold Visor Flip */}
          <button
            onClick={handleToggleVisor}
            style={{
              background: isVisorOpen
                ? 'linear-gradient(135deg, #d97706, #f59e0b)'
                : 'linear-gradient(135deg, rgba(217, 119, 6, 0.25), rgba(15, 23, 42, 0.8))',
              border: '1.5px solid #f59e0b',
              color: '#ffffff',
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '11.5px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>🪖</span>
            <span>{isVisorOpen ? 'CLOSE GOLD VISOR' : 'OPEN GOLD VISOR'}</span>
          </button>

          {/* Action 3: Helmet Floodlights */}
          <button
            onClick={handleToggleLights}
            style={{
              background: lightsActive
                ? 'linear-gradient(135deg, #059669, #10b981)'
                : 'linear-gradient(135deg, rgba(5, 150, 105, 0.2), rgba(15, 23, 42, 0.8))',
              border: '1.5px solid #10b981',
              color: '#ffffff',
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '11.5px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Lightbulb size={15} color="#10b981" />
            <span>{lightsActive ? 'HELMET LIGHTS: ON' : 'HELMET LIGHTS: OFF'}</span>
          </button>

          {/* Action 4: Atmospheric Pressure Purge / Regulation Test */}
          <button
            onClick={handleTestPressureDrill}
            style={{
              background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.25), rgba(15, 23, 42, 0.8))',
              border: '1.5px solid #a855f7',
              color: '#e2e8f0',
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '11.5px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Gauge size={15} color="#c084fc" />
            <span>TEST 29.6 kPa PURGE</span>
          </button>

          {/* Action 5: Micrometeorite Leak Drill */}
          <button
            onClick={handleEmergencyDrill}
            style={{
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.25), rgba(15, 23, 42, 0.8))',
              border: '1.5px solid #ef4444',
              color: '#fca5a5',
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '11.5px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <AlertTriangle size={15} color="#ef4444" />
            <span>LEAK DRILL</span>
          </button>
        </div>

        {/* Kinematics Pose Mode Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(2, 6, 23, 0.6)', padding: '3px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
          {(['FLOAT', 'WALK', 'IDLE'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => {
                setWalkMode(mode);
                soundFx.playClick(600);
              }}
              style={{
                background: walkMode === mode ? '#38bdf8' : 'transparent',
                color: walkMode === mode ? '#020617' : '#94a3b8',
                border: 'none',
                padding: '5px 10px',
                borderRadius: '6px',
                fontSize: '10.5px',
                fontWeight: 900,
                cursor: 'pointer',
              }}
            >
              {mode === 'FLOAT' ? '🛸 ZERO-G FLOAT' : mode === 'WALK' ? '🚶 LUNAR WALK' : '🧍 IDLE'}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
