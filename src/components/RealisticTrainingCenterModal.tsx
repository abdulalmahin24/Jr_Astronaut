import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  X,
  Volume2,
  VolumeX,
  HelpCircle,
  Trophy,
  Rocket,
  Film,
} from 'lucide-react';
import { soundFx } from '../utils/audioEffects';
import { disposeThreeScene } from '../utils/threeDisposeHelper';
import { speechEngine } from '../utils/speechEngine';
import { CadetAnimationVideoStage } from './CadetAnimationVideoStage';

// ── REALISTIC PROCEDURAL & TEXTURED 3D GROUND SURFACES PER PILLAR ──
function createNblFloor(): THREE.Object3D {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  // Blue ceramic pool tiles
  ctx.fillStyle = '#0284c7';
  ctx.fillRect(0, 0, 512, 512);
  // Tile grout lines
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 3;
  for (let i = 0; i <= 512; i += 64) {
    ctx.beginPath();
    ctx.moveTo(i, 0); ctx.lineTo(i, 512);
    ctx.moveTo(0, i); ctx.lineTo(512, i);
    ctx.stroke();
  }
  // Black swimming lane target cross
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(224, 0, 64, 512);
  ctx.fillRect(0, 224, 512, 64);
  // Stencil markings
  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 20px monospace';
  ctx.fillText('POOL DEPTH: 12.2 METERS (40 FT)', 60, 210);
  ctx.fillText('NASA NEUTRAL BUOYANCY LAB', 85, 330);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);

  const floorMat = new THREE.MeshStandardMaterial({
    map: tex,
    roughness: 0.15,
    metalness: 0.25,
  });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0;
  floor.receiveShadow = true;
  return floor;
}

function createCleanroomFloor(): THREE.Object3D {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  // Heavy industrial hangar steel deck
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(0, 0, 512, 512);
  // Diamond tread steel plates
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 2;
  for (let x = -512; x < 1024; x += 32) {
    ctx.beginPath();
    ctx.moveTo(x, 0); ctx.lineTo(x + 512, 512);
    ctx.moveTo(x, 512); ctx.lineTo(x + 512, 0);
    ctx.stroke();
  }
  // Yellow/black diagonal hazard safety perimeter
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(0, 0, 512, 32);
  ctx.fillRect(0, 480, 512, 32);
  ctx.fillStyle = '#0f172a';
  for (let i = 0; i < 512; i += 40) {
    ctx.beginPath();
    ctx.moveTo(i, 0); ctx.lineTo(i + 20, 0); ctx.lineTo(i + 40, 32); ctx.lineTo(i + 20, 32); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(i, 480); ctx.lineTo(i + 20, 480); ctx.lineTo(i + 40, 512); ctx.lineTo(i + 20, 512); ctx.fill();
  }
  // High-visibility cleanroom stencil
  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 18px monospace';
  ctx.fillText('SPACESUIT PREPARATION & ECLSS TESTING DECK', 35, 250);
  ctx.fillText('PRESSURE CALIBRATION ZONE · 4.3 PSI NOMINAL', 45, 280);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);

  const floorMat = new THREE.MeshStandardMaterial({
    map: tex,
    roughness: 0.35,
    metalness: 0.85,
  });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0;
  floor.receiveShadow = true;
  return floor;
}

function createHabitatFloor(): THREE.Object3D {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  // Aerospace composite module deck
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, 512, 512);
  // Access panels and grid
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 3;
  ctx.strokeRect(16, 16, 480, 480);
  ctx.strokeRect(64, 64, 384, 384);
  // Luminescent floor guidelines
  ctx.strokeStyle = '#00d2ff';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(256, 0); ctx.lineTo(256, 512);
  ctx.stroke();
  // Hatch decal
  ctx.fillStyle = '#64748b';
  ctx.font = 'bold 18px monospace';
  ctx.fillText('ISS TRANQUILITY / HARMONY DECK', 95, 245);
  ctx.fillText('ZERO-G SLEEP POD & LIFE RECOVERY SYSTEM', 45, 280);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);

  const floorMat = new THREE.MeshStandardMaterial({
    map: tex,
    roughness: 0.45,
    metalness: 0.6,
  });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0;
  floor.receiveShadow = true;
  return floor;
}

function createRegolithGround(): THREE.Object3D {
  const group = new THREE.Group();
  const texLoader = new THREE.TextureLoader();
  const moonTex = texLoader.load('/assets/moon_texture.jpg');
  moonTex.wrapS = THREE.RepeatWrapping;
  moonTex.wrapT = THREE.RepeatWrapping;
  moonTex.repeat.set(3, 3);

  const groundGeo = new THREE.PlaneGeometry(14, 14, 48, 48);
  const pos = groundGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = Math.sin(x * 0.7) * Math.cos(y * 0.7) * 0.22 + Math.sin(x * 2.2 + y * 1.5) * 0.08;
    pos.setZ(i, z);
  }
  groundGeo.computeVertexNormals();

  const groundMat = new THREE.MeshStandardMaterial({
    map: moonTex,
    roughness: 0.95,
    metalness: 0.05,
    color: 0x94a3b8,
  });
  const groundMesh = new THREE.Mesh(groundGeo, groundMat);
  groundMesh.rotation.x = -Math.PI / 2;
  groundMesh.position.y = 0;
  groundMesh.receiveShadow = true;
  group.add(groundMesh);

  // Scattered 3D basalt rocks
  const rockGeo = new THREE.IcosahedronGeometry(0.14, 1);
  const rockMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.9 });
  for (let i = 0; i < 22; i++) {
    const rock = new THREE.Mesh(rockGeo, rockMat);
    const rx = (Math.random() - 0.5) * 8.5;
    const rz = (Math.random() - 0.5) * 8.5;
    const s = 0.5 + Math.random() * 1.3;
    rock.scale.set(s, s * 0.65, s);
    rock.position.set(rx, 0.06, rz);
    rock.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
    group.add(rock);
  }

  return group;
}

function createBlastDeckFloor(): THREE.Object3D {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  // Heavy thermal protection tile deck
  ctx.fillStyle = '#090d16';
  ctx.fillRect(0, 0, 512, 512);
  // Red emergency warning diagonal bands
  ctx.fillStyle = '#dc2626';
  ctx.fillRect(0, 0, 512, 28);
  ctx.fillRect(0, 484, 512, 28);
  // Exhaust vent grill pattern
  ctx.fillStyle = '#1e293b';
  for (let y = 140; y < 380; y += 20) {
    ctx.fillRect(140, y, 232, 12);
  }
  ctx.fillStyle = '#f87171';
  ctx.font = 'bold 18px monospace';
  ctx.fillText('EMERGENCY AIRLOCK · BLAST DECK', 105, 230);
  ctx.fillText('RAPID DEPRESS & FIRE SUPPRESSION ZONE', 60, 270);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);

  const floorMat = new THREE.MeshStandardMaterial({
    map: tex,
    roughness: 0.5,
    metalness: 0.75,
  });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0;
  floor.receiveShadow = true;
  return floor;
}

export type TrainingPillarId = 
  | 'FITNESS_NBL'
  | 'SPACESUIT_ECLSS'
  | 'HABITAT_NUTRITION'
  | 'SURFACE_REGOLITH'
  | 'EMERGENCY_DRILLS';

export interface RealisticTrainingCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPillar?: TrainingPillarId;
  initialMode?: 'ANIMATION_VIDEO' | 'PRACTICE_3D';
  onOpenClassroom?: () => void;
  onOpenAcademy?: () => void;
}

export const RealisticTrainingCenterModal: React.FC<RealisticTrainingCenterModalProps> = ({
  isOpen,
  onClose,
  initialPillar = 'FITNESS_NBL',
  initialMode = 'ANIMATION_VIDEO',
  onOpenAcademy,
}) => {
  const [activePillar, setActivePillar] = useState<TrainingPillarId>(initialPillar);
  const [viewMode, setViewMode] = useState<'ANIMATION_VIDEO' | 'PRACTICE_3D'>(initialMode);
  void (useState<number>(0));
  void (useState(false));
  const [completedDrills, setCompletedDrills] = useState<string[]>([]);
  const [activeToast, setActiveToast] = useState<string | null>(null);
  const [isSpeakingGuide, setIsSpeakingGuide] = useState<boolean>(false);
  const [showVictoryCert, setShowVictoryCert] = useState<boolean>(false);
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);

  const PILLARS_LIST: TrainingPillarId[] = [
    'FITNESS_NBL',
    'SPACESUIT_ECLSS',
    'HABITAT_NUTRITION',
    'SURFACE_REGOLITH',
    'EMERGENCY_DRILLS',
  ];

  const handleNextPillar = () => {
    const currentIndex = PILLARS_LIST.indexOf(activePillar);
    const nextIndex = (currentIndex + 1) % PILLARS_LIST.length;
    setActivePillar(PILLARS_LIST[nextIndex]);
    soundFx.playTelemetryChirp();
    if (isSpeakingGuide) {
      speechEngine.stop();
      setIsSpeakingGuide(false);
    }
  };

  const handlePrevPillar = () => {
    const currentIndex = PILLARS_LIST.indexOf(activePillar);
    const prevIndex = (currentIndex - 1 + PILLARS_LIST.length) % PILLARS_LIST.length;
    setActivePillar(PILLARS_LIST[prevIndex]);
    soundFx.playClick(750);
    if (isSpeakingGuide) {
      speechEngine.stop();
      setIsSpeakingGuide(false);
    }
  };

  const handleSpeakPillarGuide = (pillar: TrainingPillarId) => {
    if (isSpeakingGuide) {
      speechEngine.stop();
      setIsSpeakingGuide(false);
      return;
    }
    const scripts: Record<TrainingPillarId, string> = {
      FITNESS_NBL:
        "Welcome to the Neutral Buoyancy Lab, Cadet! Slide your lead weights to zero kilograms until the status shows Neutral, then click Test Buoyancy. Then click Torque Bolt four times to lock the underwater hatch, and test your inner ear against dizziness on the Bárány chair.",
      SPACESUIT_ECLSS:
        "Cadet, inspect your NASA EMU spacesuit. Select 4.3 psi pure oxygen and click Start Pre-Breathe to wash nitrogen from your blood. Then click the Valsalva sponge to pop your ears and equalize pressure.",
      HABITAT_NUTRITION:
        "In the space habitat, zero gravity has no natural air circulation! Keep your sleep fan running so carbon dioxide does not build up around your head, and always eat tortillas instead of crumbly bread.",
      SURFACE_REGOLITH:
        "On the lunar surface, razor-sharp static dust clings to everything. Enter the airlock and activate the electrostatic shower to decontaminate, then send berthing commands to the robotic Canadarm.",
      EMERGENCY_DRILLS:
        "Emergency protocols! In zero gravity, flames form dangerous blue spheres. Press the CO2 extinguisher immediately to smother the flame, and if your tether snaps, fire the SAFER nitrogen jetpack to fly back to safety!"
    };
    setIsSpeakingGuide(true);
    speechEngine.speak(
      scripts[pillar] || scripts.FITNESS_NBL,
      'HOUSTON_CAPCOM',
      () => {},
      () => setIsSpeakingGuide(false)
    );
  };

  // ── THREE.JS 3D CANVAS REFS ──
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const dynamicMeshesRef = useRef<Record<string, any>>({});

  // ── PILLAR 1: FITNESS & NBL STATE ──
  const [nblLeadWeightKg, setNblLeadWeightKg] = useState<number>(0); // -15 to +15 kg
  const [nblBuoyancyState, setNblBuoyancyState] = useState<'FLOAT' | 'NEUTRAL' | 'SINK'>('NEUTRAL');
  const [nblBoltTightenedPct, setNblBoltTightenedPct] = useState<number>(30);
  const [, setBaranyRpm] = useState<number>(0);
  const [baranyBlindfolded] = useState<boolean>(false);
  const [, setSasMotionNauseaPct] = useState<number>(10);
  void (useState<number>(-6)); // Head-down tilt
  void (useState<number>(24));
  void (useState<boolean>(false));

  // ── PILLAR 2: SPACESUIT & ECLSS STATE ──
  const [activeSuitLayer] = useState<'LCVG' | 'PRESSURE_BLADDER' | 'HELMET_GOLD_VISOR' | 'TETHER'>('LCVG');
  void (useState<number>(1.8)); // 0 to 3.0 L/min
  const [suitO2PressureKpa, setSuitO2PressureKpa] = useState<number>(29.6); // 4.3 psi
  void (useState<number>(120));
  const [bloodNitrogenPct, setBloodNitrogenPct] = useState<number>(12);
  const [, setValsalvaPushed] = useState<boolean>(false);
  void (useState<number>(95));
  void (useState<boolean>(true));
  void (useState<number>(88));
  void (useState<number>(98.2));

  // ── PILLAR 3: HABITAT & ZERO-G LIFE STATE ──
  const [sleepFanRunning, setSleepFanRunning] = useState<boolean>(true);
  const [, setCo2BubbleAroundHeadPpm] = useState<number>(450);
  void (useState<boolean>(false));
  const [spaceFoodType, setSpaceFoodType] = useState<'TORTILLA' | 'CRUMB_BREAD'>('TORTILLA');
  const [, setFloatingCrumbsInAir] = useState<boolean>(false);

  // ── PILLAR 4: SURFACE OPERATIONS & REGOLITH STATE ──
  const [airlockElectrostaticShowerActive, setAirlockElectrostaticShowerActive] = useState<boolean>(false);
  const [regolithDustLevelPct, setRegolithDustLevelPct] = useState<number>(85);
  void (useState<number>(45));
  void (useState<number>(4.2));
  const [cosmicCatchSuccess, setCosmicCatchSuccess] = useState<boolean>(false);
  const [, setCoreDrillDepthCm] = useState<number>(35);

  // ── PILLAR 5: EMERGENCY PROTOCOLS STATE ──
  const [zeroGFireActive, setZeroGFireActive] = useState<boolean>(false);
  const [fireExtinguished, setFireExtinguished] = useState<boolean>(false);
  void (useState<boolean>(false));
  const [, setQuickDonMaskEquipped] = useState<boolean>(false);
  void (useState<boolean>(false));
  void (useState<boolean>(false));
  const [saferDriftDistanceMeters, setSaferDriftDistanceMeters] = useState<number>(42);
  const [saferNitrogenFuelPct, setSaferNitrogenFuelPct] = useState<number>(84);

  const showToast = useCallback((msg: string) => {
    setActiveToast(msg);
    setTimeout(() => setActiveToast(null), 3500);
  }, []);

  const markDrillCompleted = useCallback((drillId: string, title: string) => {
    if (!completedDrills.includes(drillId)) {
      setCompletedDrills((prev) => [...prev, drillId]);
      soundFx.playVictory();
      showToast(`🏆 DRILL PASSED: ${title}`);
    }
  }, [completedDrills, showToast]);

  // ── 1-CLICK DRILL HANDLERS FOR MINIMAL BUTTONS & MAXIMUM IMPACT ──
  const handleExecuteStation1 = () => {
    setNblLeadWeightKg(0);
    setNblBuoyancyState('NEUTRAL');
    setNblBoltTightenedPct(100);
    setBaranyRpm(20);
    setSasMotionNauseaPct(0);
    soundFx.playHydroPressureSwoosh();
    markDrillCompleted('nbl_neutral_buoyancy', 'Neutral Buoyancy & Torque Drill');
    showToast('🏆 Station 1 Passed: Perfect Zero-G Buoyancy & 100% Torque Locked!');
  };

  const handleExecuteStation2 = () => {
    setSuitO2PressureKpa(29.6);
    setBloodNitrogenPct(0);
    setValsalvaPushed(true);
    soundFx.playReactorStart();
    markDrillCompleted('suit_pure_o2', 'EMU Spacesuit Donning & 4.3 psi Pre-Breathe');
    showToast('🏆 Station 2 Passed: 100% O2 Pre-Breathe & 4.3 psi Suit Sealed!');
  };

  const handleExecuteStation3 = () => {
    setSleepFanRunning(true);
    setCo2BubbleAroundHeadPpm(380);
    setSpaceFoodType('TORTILLA');
    setFloatingCrumbsInAir(false);
    soundFx.playTelemetryChirp();
    markDrillCompleted('habitat_sleep_fan', 'Cabin Fan Ventilation & Space Nutrition');
    showToast('🏆 Station 3 Passed: Sleep Pod Fan On & Zero-Crumb Meal Served!');
  };

  const handleExecuteStation4 = () => {
    setAirlockElectrostaticShowerActive(true);
    setRegolithDustLevelPct(0);
    setCosmicCatchSuccess(true);
    setCoreDrillDepthCm(300);
    soundFx.playHydroPressureSwoosh();
    markDrillCompleted('surface_airlock_dedust', 'Electrostatic Shower & Canadarm Snare');
    showToast('🏆 Station 4 Passed: Sharp Lunar Dust Repelled & Canadarm Grappled!');
  };

  const handleExecuteStation5 = () => {
    setZeroGFireActive(false);
    setFireExtinguished(true);
    setQuickDonMaskEquipped(true);
    setSaferDriftDistanceMeters(0);
    soundFx.playAlarm();
    setTimeout(() => soundFx.playVictory(), 800);
    markDrillCompleted('emergency_spherical_fire', 'Spherical Fire & SAFER Jetpack Flyback');
    showToast('🏆 Station 5 Passed: Zero-G Fire Extinguished & Airlock Jetpack Return!');
  };

  // ── INITIALIZE AND UPDATE 3D SCENE ───────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    const container = canvasContainerRef.current;
    if (!container) return;

    // Reset container children
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    const width = container.clientWidth || 640;
    const height = container.clientHeight || 420;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x070b13);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 1.5, 4.5);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 12;
    controls.minDistance = 1;
    controlsRef.current = controls;

    // Ambient & Directional Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambient);

    const sunLight = new THREE.DirectionalLight(0xfff7e6, 2.4);
    sunLight.position.set(4, 6, 4);
    scene.add(sunLight);

    const cyanBounce = new THREE.PointLight(0x00d2ff, 1.8, 10);
    cyanBounce.position.set(-3, -1, -2);
    scene.add(cyanBounce);

    // Realistic 3D Ground Surface matching active training pillar
    let floorMesh: THREE.Object3D;
    if (activePillar === 'FITNESS_NBL') {
      floorMesh = createNblFloor();
    } else if (activePillar === 'SPACESUIT_ECLSS') {
      floorMesh = createCleanroomFloor();
    } else if (activePillar === 'HABITAT_NUTRITION') {
      floorMesh = createHabitatFloor();
    } else if (activePillar === 'SURFACE_REGOLITH') {
      floorMesh = createRegolithGround();
    } else {
      floorMesh = createBlastDeckFloor();
    }
    scene.add(floorMesh);

    // ── POPULATE 3D OBJECTS BASED ON ACTIVE PILLAR ──
    dynamicMeshesRef.current = {};

    if (activePillar === 'FITNESS_NBL') {
      // 🏊‍♂️ 3D NBL Underwater Training Pool
      const poolGeo = new THREE.BoxGeometry(4.5, 2.5, 3.5);
      const poolMat = new THREE.MeshPhysicalMaterial({
        color: 0x0088cc,
        transparent: true,
        opacity: 0.35,
        roughness: 0.1,
        transmission: 0.6,
        depthWrite: false,
      });
      const poolMesh = new THREE.Mesh(poolGeo, poolMat);
      poolMesh.position.set(0, 1.25, 0);
      scene.add(poolMesh);

      // Trainee Underwater Astronaut
      const astroGroup = new THREE.Group();
      astroGroup.position.set(0, 1.2, 0);

      // Body (suit)
      const bodyGeo = new THREE.CylinderGeometry(0.35, 0.32, 0.9, 16);
      const bodyMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      astroGroup.add(body);

      // Helmet & Visor
      const headGeo = new THREE.SphereGeometry(0.3, 24, 24);
      const visorMat = new THREE.MeshStandardMaterial({
        color: 0xffd700,
        metalness: 0.95,
        roughness: 0.1,
      });
      const head = new THREE.Mesh(headGeo, visorMat);
      head.position.y = 0.65;
      astroGroup.add(head);

      // Submerged Tool (Ratchet Wrench on truss)
      const trussGeo = new THREE.CylinderGeometry(0.08, 0.08, 2.0, 8);
      const trussMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8 });
      const truss = new THREE.Mesh(trussGeo, trussMat);
      truss.rotation.z = Math.PI / 4;
      truss.position.set(0.6, 0.2, 0);
      astroGroup.add(truss);

      scene.add(astroGroup);
      dynamicMeshesRef.current.astronaut = astroGroup;

      // Underwater Air Bubbles
      const bubbleCount = 60;
      const bubbleGeo = new THREE.BufferGeometry();
      const bubblePos = new Float32Array(bubbleCount * 3);
      for (let i = 0; i < bubbleCount * 3; i += 3) {
        bubblePos[i] = (Math.random() - 0.5) * 3;
        bubblePos[i + 1] = Math.random() * 2.2;
        bubblePos[i + 2] = (Math.random() - 0.5) * 3;
      }
      bubbleGeo.setAttribute('position', new THREE.BufferAttribute(bubblePos, 3));
      const bubbleMat = new THREE.PointsMaterial({
        color: 0x7dd3fc,
        size: 0.06,
        transparent: true,
        opacity: 0.7,
      });
      const bubbles = new THREE.Points(bubbleGeo, bubbleMat);
      scene.add(bubbles);
      dynamicMeshesRef.current.bubbles = bubbles;

    } else if (activePillar === 'SPACESUIT_ECLSS') {
      // 🧑‍🚀 3D Multi-Layer Spacesuit & Life Support Backpack (PLSS)
      const suitGroup = new THREE.Group();
      suitGroup.position.set(0, 0.4, 0);

      // PLSS Backpack
      const plssGeo = new THREE.BoxGeometry(0.7, 1.1, 0.4);
      const plssMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, metalness: 0.3, roughness: 0.4 });
      const plss = new THREE.Mesh(plssGeo, plssMat);
      plss.position.set(0, 0.9, -0.32);
      suitGroup.add(plss);

      // Suit Torso
      const torsoGeo = new THREE.CylinderGeometry(0.38, 0.34, 1.0, 24);
      const torsoMat = new THREE.MeshStandardMaterial({
        color: activeSuitLayer === 'LCVG' ? 0x0284c7 : 0xffffff,
        roughness: 0.6,
      });
      const torso = new THREE.Mesh(torsoGeo, torsoMat);
      torso.position.y = 0.85;
      suitGroup.add(torso);

      // Liquid Cooling Tubes Layer (Animated Blue Coils if LCVG active)
      if (activeSuitLayer === 'LCVG') {
        const tubeCurve = new THREE.TorusGeometry(0.40, 0.02, 12, 32);
        const tubeMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
        for (let i = 0; i < 5; i++) {
          const tRing = new THREE.Mesh(tubeCurve, tubeMat);
          tRing.rotation.x = Math.PI / 2;
          tRing.position.y = 0.5 + i * 0.18;
          suitGroup.add(tRing);
        }
      }

      // Helmet & 24K Gold Visor
      const helmetGeo = new THREE.SphereGeometry(0.35, 32, 32);
      const helmetMat = new THREE.MeshStandardMaterial({
        color: 0xffd700,
        metalness: 0.96,
        roughness: 0.08,
      });
      const helmet = new THREE.Mesh(helmetGeo, helmetMat);
      helmet.position.y = 1.6;
      suitGroup.add(helmet);

      // Display & Control Module (DCM) on Chest
      const dcmGeo = new THREE.BoxGeometry(0.36, 0.28, 0.16);
      const dcmMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.7 });
      const dcm = new THREE.Mesh(dcmGeo, dcmMat);
      dcm.position.set(0, 0.95, 0.38);
      suitGroup.add(dcm);

      scene.add(suitGroup);
      dynamicMeshesRef.current.suitGroup = suitGroup;

    } else if (activePillar === 'HABITAT_NUTRITION') {
      // 🥗 3D Zero-G Habitat Wall Bunk & Airflow
      const bunkGeo = new THREE.BoxGeometry(1.6, 2.6, 0.2);
      const bunkMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 });
      const bunk = new THREE.Mesh(bunkGeo, bunkMat);
      bunk.position.set(0, 1.3, -0.6);
      scene.add(bunk);

      // Sleeping Bag strapped to wall
      const bagGeo = new THREE.CapsuleGeometry(0.38, 1.4, 8, 16);
      const bagMat = new THREE.MeshStandardMaterial({ color: 0xe11d48, roughness: 0.7 });
      const bag = new THREE.Mesh(bagGeo, bagMat);
      bag.position.set(0, 1.2, -0.3);
      scene.add(bag);

      // Overhead Air Ventilation Fan (Blades rotate)
      const fanGroup = new THREE.Group();
      fanGroup.position.set(0, 2.2, -0.1);
      const fanHubGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.06, 16);
      const fanHubMat = new THREE.MeshStandardMaterial({ color: 0x00d2ff });
      const fanHub = new THREE.Mesh(fanHubGeo, fanHubMat);
      fanHub.rotation.x = Math.PI / 2;
      fanGroup.add(fanHub);

      // 4 Blades
      const bladeGeo = new THREE.BoxGeometry(0.06, 0.45, 0.01);
      const bladeMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8 });
      for (let i = 0; i < 4; i++) {
        const blade = new THREE.Mesh(bladeGeo, bladeMat);
        blade.rotation.z = (i * Math.PI) / 2;
        blade.position.y = 0.2;
        fanGroup.add(blade);
      }
      scene.add(fanGroup);
      dynamicMeshesRef.current.fan = fanGroup;

      // Exhaled CO2 Cloud Sphere (Visible in microgravity if fan stops!)
      const co2Geo = new THREE.SphereGeometry(0.32, 16, 16);
      const co2Mat = new THREE.MeshBasicMaterial({
        color: 0xa855f7,
        transparent: true,
        opacity: sleepFanRunning ? 0.08 : 0.65,
      });
      const co2Bubble = new THREE.Mesh(co2Geo, co2Mat);
      co2Bubble.position.set(0, 1.65, -0.15);
      scene.add(co2Bubble);
      dynamicMeshesRef.current.co2Bubble = co2Bubble;

    } else if (activePillar === 'SURFACE_REGOLITH') {
      // 🚜 3D Lunar Regolith Surface & Robotic Canadarm
      const regolithGeo = new THREE.PlaneGeometry(8, 8, 32, 32);
      const regolithMat = new THREE.MeshStandardMaterial({
        color: 0x475569,
        roughness: 0.95,
      });
      const regolith = new THREE.Mesh(regolithGeo, regolithMat);
      regolith.rotation.x = -Math.PI / 2;
      scene.add(regolith);

      // Robotic Canadarm Assembly
      const armGroup = new THREE.Group();
      armGroup.position.set(-1.2, 0, 0);

      // Base pedestal
      const baseGeo = new THREE.CylinderGeometry(0.25, 0.3, 0.4, 16);
      const baseMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.5 });
      const base = new THREE.Mesh(baseGeo, baseMat);
      base.position.y = 0.2;
      armGroup.add(base);

      // Shoulder & Boom 1
      const boom1Geo = new THREE.CylinderGeometry(0.08, 0.08, 1.8, 12);
      const boomMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.7 });
      const boom1 = new THREE.Mesh(boom1Geo, boomMat);
      boom1.position.set(0.4, 0.9, 0);
      boom1.rotation.z = -Math.PI / 4;
      armGroup.add(boom1);

      // End Effector (Cosmic Catch Grapple)
      const grappleGeo = new THREE.TorusGeometry(0.2, 0.04, 8, 24);
      const grappleMat = new THREE.MeshStandardMaterial({ color: 0xff9e1b });
      const grapple = new THREE.Mesh(grappleGeo, grappleMat);
      grapple.position.set(1.1, 1.6, 0);
      armGroup.add(grapple);

      scene.add(armGroup);
      dynamicMeshesRef.current.canadarm = armGroup;

    } else if (activePillar === 'EMERGENCY_DRILLS') {
      // 🚨 3D Microgravity Spherical Fire Chamber & Untethered SAFER Astronaut
      const fireGroup = new THREE.Group();
      fireGroup.position.set(0, 1.4, 0);

      // Spherical Microgravity Flame (Blue-Yellow sphere, no buoyancy flicker!)
      const flameGeo = new THREE.SphereGeometry(0.45, 24, 24);
      const flameMat = new THREE.MeshBasicMaterial({
        color: zeroGFireActive && !fireExtinguished ? 0x00e5ff : 0x334155,
        transparent: true,
        opacity: zeroGFireActive && !fireExtinguished ? 0.85 : 0.2,
      });
      const flameSphere = new THREE.Mesh(flameGeo, flameMat);
      fireGroup.add(flameSphere);

      // Burning core glow
      const coreGeo = new THREE.SphereGeometry(0.22, 16, 16);
      const coreMat = new THREE.MeshBasicMaterial({
        color: zeroGFireActive && !fireExtinguished ? 0xffea00 : 0x1e293b,
        transparent: true,
        opacity: zeroGFireActive && !fireExtinguished ? 0.95 : 0.1,
      });
      const flameCore = new THREE.Mesh(coreGeo, coreMat);
      fireGroup.add(flameCore);

      scene.add(fireGroup);
      dynamicMeshesRef.current.flame = fireGroup;
      dynamicMeshesRef.current.flameMat = flameMat;
      dynamicMeshesRef.current.flameCoreMat = coreCoreMatCheck(coreMat);
    }

    function coreCoreMatCheck(mat: THREE.MeshBasicMaterial) {
      return mat;
    }

    // ── ANIMATION RENDER LOOP ──
    const clock = new THREE.Clock();

    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      controls.update();

      // Dynamic animations
      if (activePillar === 'FITNESS_NBL' && dynamicMeshesRef.current.astronaut) {
        // Floating gentle bobbing under water
        const bob = Math.sin(elapsed * 1.5) * 0.06;
        dynamicMeshesRef.current.astronaut.position.y = 1.2 + bob + (nblLeadWeightKg * -0.02);
        dynamicMeshesRef.current.astronaut.rotation.y = elapsed * 0.15;
      }

      if (activePillar === 'HABITAT_NUTRITION') {
        if (dynamicMeshesRef.current.fan && sleepFanRunning) {
          dynamicMeshesRef.current.fan.rotation.z += 0.25;
        }
      }

      if (activePillar === 'EMERGENCY_DRILLS' && dynamicMeshesRef.current.flame && zeroGFireActive && !fireExtinguished) {
        // Pulsing spherical flame
        const pulse = 1.0 + Math.sin(elapsed * 6.0) * 0.08;
        dynamicMeshesRef.current.flame.scale.set(pulse, pulse, pulse);
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 640;
      const h = container.clientHeight || 420;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      window.removeEventListener('resize', handleResize);
      disposeThreeScene(renderer, scene, container);
    };
  }, [isOpen, activePillar, activeSuitLayer, nblLeadWeightKg, sleepFanRunning, zeroGFireActive, fireExtinguished]);

  if (!isOpen) return null;

  // ── INTERACTIVE HANDLERS FOR EACH DRILL ───────────────────────────────────────
  void (() => {
    soundFx.playHydroPressureSwoosh();
    if (Math.abs(nblLeadWeightKg) <= 2) {
      setNblBuoyancyState('NEUTRAL');
      markDrillCompleted('NBL_BUOYANCY', 'Neutral Buoyancy Equilibrium Achieved');
    } else if (nblLeadWeightKg > 2) {
      setNblBuoyancyState('SINK');
    } else {
      setNblBuoyancyState('FLOAT');
    }
  });

  void (() => {
    soundFx.playClick(920);
    setNblBoltTightenedPct((prev) => {
      const next = Math.min(100, prev + 25);
      if (next >= 100) {
        markDrillCompleted('UNDERWATER_BOLT_TORQUE', 'Underwater EVA Tool Ratchet Torque Passed');
      }
      return next;
    });
  });

  void ((targetRpm: number) => {
    soundFx.playReactorStart();
    setBaranyRpm(targetRpm);
    const risk = targetRpm * (baranyBlindfolded ? 1.6 : 1.1);
    setSasMotionNauseaPct(Math.min(100, Math.round(risk)));
    if (targetRpm >= 30) {
      markDrillCompleted('BARANY_VESTIBULAR_SAS', 'Vestibular Adaptation & SAS Desensitization');
    }
  });

  void (() => {
    soundFx.playReactorStart();
    showToast('🌬️ PRE-BREATHE ACTIVE: Washing dissolved Nitrogen gas from bloodstream...');
    let n = bloodNitrogenPct;
    const interval = setInterval(() => {
      n -= 2;
      if (n <= 1) {
        n = 1;
        clearInterval(interval);
        setBloodNitrogenPct(1);
        markDrillCompleted('PRE_BREATHE_BENDS', 'Pure O2 Pre-Breathe Completed (Zero Bends Risk)');
      } else {
        setBloodNitrogenPct(n);
      }
    }, 250);
  });

  void (() => {
    const next = !sleepFanRunning;
    setSleepFanRunning(next);
    soundFx.playClick(next ? 880 : 320);
    if (!next) {
      soundFx.playAlarm();
      showToast('⚠️ WARNING: Without fan circulation, exhaled CO2 forms a fatal 4500 ppm bubble around astronaut’s head!');
      setCo2BubbleAroundHeadPpm(4500);
    } else {
      setCo2BubbleAroundHeadPpm(450);
      markDrillCompleted('CO2_VENTILATION_FAN', 'Microgravity Sleeping Pod Ventilation Configured');
    }
  });

  void (() => {
    soundFx.playShieldHum();
    setFireExtinguished(true);
    setZeroGFireActive(false);
    markDrillCompleted('ZERO_G_FIRE_SUPPRESSION', 'Spherical Microgravity Fire Extinguished with CO2');
  });

  void (() => {
    soundFx.playReactorStart();
    showToast('🚀 SAFER THRUSTERS BURST: Countering angular drift vector back to airlock...');
    let dist = saferDriftDistanceMeters;
    let fuel = saferNitrogenFuelPct;
    const interval = setInterval(() => {
      dist -= 10;
      fuel -= 8;
      if (dist <= 0) {
        dist = 0;
        clearInterval(interval);
        setSaferDriftDistanceMeters(0);
        setSaferNitrogenFuelPct(fuel);
        markDrillCompleted('SAFER_UNETHERED_RESCUE', 'Untethered EVA SAFER Jetpack Flyback Successful');
      } else {
        setSaferDriftDistanceMeters(dist);
        setSaferNitrogenFuelPct(fuel);
      }
    }, 300);
  });

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        backgroundColor: 'rgba(3, 7, 18, 0.95)',
        backdropFilter: 'blur(20px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        fontFamily: 'var(--font-sans), system-ui, sans-serif',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '1240px',
          height: '92vh',
          backgroundColor: '#0a0f1d',
          border: '1px solid rgba(0, 210, 255, 0.4)',
          borderRadius: '16px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 60px rgba(0,0,0,0.9), 0 0 50px rgba(0, 210, 255, 0.25)',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* ── HEADER BAR ── */}
        <div
          style={{
            padding: '14px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            background: 'linear-gradient(90deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.9) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #00d2ff 0%, #3b82f6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                boxShadow: '0 0 20px rgba(0, 210, 255, 0.5)',
              }}
            >
              🧑‍🚀
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 900, color: '#f8fafc', margin: 0, letterSpacing: '0.04em' }}>
                  JUNIOR ASTRONAUT TRAINING & GROUND SCHOOL
                </h2>
                {/* 2-Way View Mode Switcher */}
                <div style={{ display: 'flex', background: 'rgba(15, 23, 42, 0.9)', padding: '2px', borderRadius: '8px', border: '1px solid rgba(0, 210, 255, 0.35)' }}>
                  <button
                    onClick={() => { setViewMode('ANIMATION_VIDEO'); soundFx.playTelemetryChirp(); }}
                    style={{
                      padding: '4px 12px',
                      borderRadius: '6px',
                      border: 'none',
                      background: viewMode === 'ANIMATION_VIDEO' ? 'linear-gradient(90deg, #0284c7, #2563eb)' : 'transparent',
                      color: viewMode === 'ANIMATION_VIDEO' ? '#ffffff' : '#94a3b8',
                      fontWeight: 900,
                      fontSize: '11px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      boxShadow: viewMode === 'ANIMATION_VIDEO' ? '0 0 12px rgba(2, 132, 199, 0.6)' : 'none',
                    }}
                  >
                    <Film size={13} />
                    <span>🎬 ANIMATION VIDEOS</span>
                  </button>
                  <button
                    onClick={() => { setViewMode('PRACTICE_3D'); soundFx.playTelemetryChirp(); }}
                    style={{
                      padding: '4px 12px',
                      borderRadius: '6px',
                      border: 'none',
                      background: viewMode === 'PRACTICE_3D' ? 'linear-gradient(90deg, #059669, #10b981)' : 'transparent',
                      color: viewMode === 'PRACTICE_3D' ? '#ffffff' : '#94a3b8',
                      fontWeight: 900,
                      fontSize: '11px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      boxShadow: viewMode === 'PRACTICE_3D' ? '0 0 12px rgba(16, 185, 129, 0.6)' : 'none',
                    }}
                  >
                    <Rocket size={13} />
                    <span>🕹️ 3D PRACTICE DRILL</span>
                  </button>
                </div>
              </div>
              <p style={{ fontSize: '11px', color: '#94a3b8', margin: '2px 0 0 0' }}>
                Pre-Flight Water Training · Spacesuit Architecture · Zero-G Habitat Ecology & Emergency Survival Drills
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => setShowHelpModal(true)}
              style={{
                background: 'rgba(56, 189, 248, 0.15)',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                borderRadius: '6px',
                color: '#38bdf8',
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                cursor: 'pointer',
              }}
              title="Click for Step-by-Step Cadet Ground School Guide"
            >
              <HelpCircle size={14} />
              <span>HOW TO PLAY</span>
            </button>

            <button
              onClick={() => setShowVictoryCert(true)}
              style={{
                background: 'rgba(251, 191, 36, 0.15)',
                border: '1px solid rgba(251, 191, 36, 0.4)',
                borderRadius: '6px',
                color: '#fbbf24',
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                cursor: 'pointer',
              }}
              title="View NASA Flight Readiness Certificate"
            >
              <Trophy size={14} />
              <span>CERTIFICATE</span>
            </button>

            <div style={{ fontSize: '11px', color: '#10b981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(16, 185, 129, 0.1)', padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
              <CheckCircle2 size={15} />
              <span>{completedDrills.length} / 12 PASSED</span>
            </div>

            <button
              onClick={onClose}
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: '8px',
                color: '#f87171',
                width: '34px',
                height: '34px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              title="Close Training Center"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ── 5 PILLARS NAVIGATION TABS ── */}
        <div
          style={{
            display: 'flex',
            backgroundColor: '#070b13',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '4px 16px',
            gap: '8px',
            overflowX: 'auto',
          }}
        >
          {[
            { id: 'FITNESS_NBL', icon: '🏊‍♂️', title: '1. Physical Prep & NBL', sub: 'Neutral Buoyancy & Vestibular' },
            { id: 'SPACESUIT_ECLSS', icon: '🧑‍🚀', title: '2. Spacesuit & ECLSS', sub: 'LCVG, 4.3 psi & Life Support' },
            { id: 'HABITAT_NUTRITION', icon: '🥗', title: '3. Habitat Daily Life', sub: 'Sleep Fan, Food & Waste' },
            { id: 'SURFACE_REGOLITH', icon: '🚜', title: '4. Surface Operations', sub: 'Airlock Dust, Canadarm & Core Drill' },
            { id: 'EMERGENCY_DRILLS', icon: '🚨', title: '5. Emergency Survival', sub: 'Spherical Fire & SAFER Jetpack' },
          ].map((tab) => {
            const active = activePillar === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActivePillar(tab.id as TrainingPillarId);
                  soundFx.playClick(750);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  background: active ? 'linear-gradient(180deg, rgba(0, 210, 255, 0.2), rgba(15, 23, 42, 0.8))' : 'transparent',
                  border: active ? '1px solid #00d2ff' : '1px solid transparent',
                  color: active ? '#ffffff' : '#94a3b8',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s',
                }}
              >
                <span style={{ fontSize: '18px' }}>{tab.icon}</span>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '12px', fontWeight: 800 }}>{tab.title}</div>
                  <div style={{ fontSize: '9.5px', color: active ? '#38bdf8' : '#64748b' }}>{tab.sub}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* ── MAIN WORKSPACE: ANIMATION VIDEO MODE OR 3D INTERACTIVE PRACTICE ── */}
        {viewMode === 'ANIMATION_VIDEO' ? (
          <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
            <CadetAnimationVideoStage
              pillarId={activePillar}
              onDrillPassed={(pid) => {
                markDrillCompleted(`video_${pid}`, `${pid} Animated Lesson`);
              }}
            />
          </div>
        ) : (
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 440px', overflow: 'hidden' }}>
            {/* ── LEFT: 3D THREE.JS WEBGL SIMULATOR CANVAS ── */}
            <div style={{ position: 'relative', width: '100%', height: '100%', backgroundColor: '#070b13' }}>
              <div ref={canvasContainerRef} style={{ width: '100%', height: '100%' }} />

              {/* 3D Viewport HUD Overlay Badges */}
              <div
                style={{
                  position: 'absolute',
                  top: '16px',
                  left: '16px',
                  background: 'rgba(7, 11, 19, 0.85)',
                  border: '1px solid rgba(0, 210, 255, 0.3)',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  backdropFilter: 'blur(8px)',
                  pointerEvents: 'none',
                }}
              >
                <div style={{ fontSize: '10px', color: '#00d2ff', fontFamily: 'var(--font-mono)', fontWeight: 800 }}>
                  ● 3D INTERACTIVE SIMULATION ACTIVE
                </div>
                <div style={{ fontSize: '12px', color: '#f8fafc', fontWeight: 700, marginTop: '2px' }}>
                  {activePillar === 'FITNESS_NBL' && 'Houston NBL 6.2M Gallon Neutral Buoyancy Tank'}
                  {activePillar === 'SPACESUIT_ECLSS' && 'NASA EMU Extravehicular Mobility Unit Architecture'}
                  {activePillar === 'HABITAT_NUTRITION' && 'Lunar Outpost Crew Quarters & Zero-G Aerodynamics'}
                  {activePillar === 'SURFACE_REGOLITH' && 'Shackleton Rim Regolith De-Dusting & Surface Ops'}
                  {activePillar === 'EMERGENCY_DRILLS' && 'Microgravity Physics Emergency Response Arena'}
                </div>
                <div style={{ fontSize: '9px', color: '#94a3b8', marginTop: '3px' }}>
                  🖱️ Left Click Drag to Rotate 360° · Scroll to Zoom
                </div>
              </div>

              {/* Toast Notification */}
              {activeToast && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: '24px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'rgba(16, 185, 129, 0.95)',
                    color: '#ffffff',
                    padding: '8px 20px',
                    borderRadius: '24px',
                    fontSize: '12px',
                    fontWeight: 800,
                    boxShadow: '0 8px 24px rgba(16, 185, 129, 0.5)',
                    animation: 'pulse 1.5s infinite',
                    zIndex: 20,
                  }}
                >
                  {activeToast}
                </div>
              )}
            </div>

            {/* ── RIGHT: CONSOLIDATED ZERO-CLUTTER 1-BUTTON PRACTICE CONSOLE ── */}
            <div
              style={{
                backgroundColor: '#0a0f1d',
                borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
                overflowY: 'auto',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              {/* Station Objective & Voice Coach */}
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(0, 210, 255, 0.14) 0%, rgba(59, 130, 246, 0.12) 100%)',
                  border: '1px solid rgba(0, 210, 255, 0.35)',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '18px' }}>🎯</span>
                    <span style={{ fontSize: '12px', fontWeight: 900, color: '#f8fafc' }}>
                      STATION OBJECTIVE
                    </span>
                  </div>
                  <button
                    onClick={() => handleSpeakPillarGuide(activePillar)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      background: isSpeakingGuide ? 'rgba(239, 68, 68, 0.3)' : 'rgba(56, 189, 248, 0.2)',
                      border: isSpeakingGuide ? '1px solid #ef4444' : '1px solid #38bdf8',
                      color: isSpeakingGuide ? '#fca5a5' : '#38bdf8',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontSize: '10.5px',
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    {isSpeakingGuide ? <VolumeX size={12} /> : <Volume2 size={12} />}
                    <span>{isSpeakingGuide ? 'Stop Audio' : '🔊 Houston Audio Coach'}</span>
                  </button>
                </div>

                <div style={{ fontSize: '11px', color: '#e2e8f0', lineHeight: '1.45' }}>
                  {activePillar === 'FITNESS_NBL' && 'Master water buoyancy and vestibular adaptation. Set your lead weights to 0 kg and torque structural bolts.'}
                  {activePillar === 'SPACESUIT_ECLSS' && 'Inspect spacesuit life support. Run 100% O2 pre-breathe to wash nitrogen from blood and equalize ears with Valsalva.'}
                  {activePillar === 'HABITAT_NUTRITION' && 'Maintain zero-g habitat health. Keep the sleep ventilation fan running and choose tortillas over crumbly bread.'}
                  {activePillar === 'SURFACE_REGOLITH' && 'Handle lunar surface hazards. Run the electrostatic airlock de-duster and teleoperate the Canadarm cargo catch.'}
                  {activePillar === 'EMERGENCY_DRILLS' && 'Survive critical orbital emergencies. Extinguish spherical microgravity fires and fire SAFER thrusters back to safety.'}
                </div>
              </div>

              {/* ═════════ PILLAR 1: FITNESS & NBL ═════════ */}
              {activePillar === 'FITNESS_NBL' && (
                <div style={{
                  background: nblBuoyancyState === 'NEUTRAL' && nblBoltTightenedPct >= 100 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(15, 23, 42, 0.8)',
                  border: nblBuoyancyState === 'NEUTRAL' && nblBoltTightenedPct >= 100 ? '1px solid #10b981' : '1px solid rgba(0, 210, 255, 0.4)',
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', fontWeight: 900, color: '#f8fafc' }}>
                      🏊‍♂️ Station 1: NBL Buoyancy & Hatch Lock
                    </span>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: nblBuoyancyState === 'NEUTRAL' && nblBoltTightenedPct >= 100 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(251, 191, 36, 0.2)',
                      color: nblBuoyancyState === 'NEUTRAL' && nblBoltTightenedPct >= 100 ? '#4ade80' : '#fef08a',
                    }}>
                      {nblBuoyancyState === 'NEUTRAL' && nblBoltTightenedPct >= 100 ? '✅ PASSED' : 'DRILL PENDING'}
                    </span>
                  </div>

                  <p style={{ fontSize: '11.5px', color: '#cbd5e1', margin: 0, lineHeight: 1.45 }}>
                    Submerge into NASA's 6.2M-gallon NBL pool. Balance lead weights to 0 kg so you float weightlessly (Fb = m · g), then torque the structural bolts to 100% on the underwater ISS truss.
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div style={{ background: '#0a0f1d', padding: '8px 12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <div style={{ fontSize: '10px', color: '#94a3b8' }}>BALLAST WEIGHT:</div>
                      <div style={{ fontSize: '14px', fontFamily: 'monospace', fontWeight: 800, color: nblLeadWeightKg === 0 ? '#4ade80' : '#38bdf8' }}>
                        {nblLeadWeightKg} kg ({nblBuoyancyState})
                      </div>
                    </div>
                    <div style={{ background: '#0a0f1d', padding: '8px 12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <div style={{ fontSize: '10px', color: '#94a3b8' }}>BOLT TORQUE:</div>
                      <div style={{ fontSize: '14px', fontFamily: 'monospace', fontWeight: 800, color: nblBoltTightenedPct >= 100 ? '#4ade80' : '#f59e0b' }}>
                        {nblBoltTightenedPct}% {nblBoltTightenedPct >= 100 ? 'LOCKED' : ''}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleExecuteStation1}
                    style={{
                      padding: '12px 18px',
                      borderRadius: '8px',
                      background: nblBuoyancyState === 'NEUTRAL' && nblBoltTightenedPct >= 100
                        ? 'linear-gradient(90deg, #059669, #10b981)'
                        : 'linear-gradient(90deg, #0284c7, #2563eb)',
                      border: 'none',
                      color: '#ffffff',
                      fontSize: '12.5px',
                      fontWeight: 900,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 18px rgba(2, 132, 199, 0.4)',
                    }}
                  >
                    {nblBuoyancyState === 'NEUTRAL' && nblBoltTightenedPct >= 100 ? (
                      <>
                        <CheckCircle2 size={16} />
                        <span>✅ ZERO-G BUOYANCY & BOLT TORQUED (+50 XP)</span>
                      </>
                    ) : (
                      <>
                        <span>🌊 START ZERO-G BUOYANCY & TORQUE DRILL (+50 XP)</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* ═════════ PILLAR 2: SPACESUIT & ECLSS ═════════ */}
              {activePillar === 'SPACESUIT_ECLSS' && (
                <div style={{
                  background: bloodNitrogenPct === 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(15, 23, 42, 0.8)',
                  border: bloodNitrogenPct === 0 ? '1px solid #10b981' : '1px solid rgba(0, 210, 255, 0.4)',
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', fontWeight: 900, color: '#f8fafc' }}>
                      🧑‍🚀 Station 2: Spacesuit EMU & Pre-Breathe
                    </span>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: bloodNitrogenPct === 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(251, 191, 36, 0.2)',
                      color: bloodNitrogenPct === 0 ? '#4ade80' : '#fef08a',
                    }}>
                      {bloodNitrogenPct === 0 ? '✅ PASSED' : 'DRILL PENDING'}
                    </span>
                  </div>

                  <p style={{ fontSize: '11.5px', color: '#cbd5e1', margin: 0, lineHeight: 1.45 }}>
                    The EMU suit operates at 4.3 psi pure oxygen. Breathe 100% O2 to purge nitrogen from the bloodstream, equalize inner ears with the Valsalva sponge, and secure dual safety tethers.
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div style={{ background: '#0a0f1d', padding: '8px 12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <div style={{ fontSize: '10px', color: '#94a3b8' }}>SUIT O2 PRESSURE:</div>
                      <div style={{ fontSize: '14px', fontFamily: 'monospace', fontWeight: 800, color: '#38bdf8' }}>
                        {suitO2PressureKpa.toFixed(1)} kPa (4.3 psi)
                      </div>
                    </div>
                    <div style={{ background: '#0a0f1d', padding: '8px 12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <div style={{ fontSize: '10px', color: '#94a3b8' }}>BLOOD NITROGEN:</div>
                      <div style={{ fontSize: '14px', fontFamily: 'monospace', fontWeight: 800, color: bloodNitrogenPct === 0 ? '#4ade80' : '#f59e0b' }}>
                        {bloodNitrogenPct}% {bloodNitrogenPct === 0 ? 'PURGED' : ''}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleExecuteStation2}
                    style={{
                      padding: '12px 18px',
                      borderRadius: '8px',
                      background: bloodNitrogenPct === 0
                        ? 'linear-gradient(90deg, #059669, #10b981)'
                        : 'linear-gradient(90deg, #0284c7, #2563eb)',
                      border: 'none',
                      color: '#ffffff',
                      fontSize: '12.5px',
                      fontWeight: 900,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 18px rgba(2, 132, 199, 0.4)',
                    }}
                  >
                    {bloodNitrogenPct === 0 ? (
                      <>
                        <CheckCircle2 size={16} />
                        <span>✅ SPACESUIT SEALED & PRE-BREATHE COMPLETE (+50 XP)</span>
                      </>
                    ) : (
                      <>
                        <span>🧑‍🚀 DON SPACESUIT & START 4.3 PSI PRE-BREATHE (+50 XP)</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* ═════════ PILLAR 3: HABITAT & ZERO-G NUTRITION ═════════ */}
              {activePillar === 'HABITAT_NUTRITION' && (
                <div style={{
                  background: sleepFanRunning && spaceFoodType === 'TORTILLA' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(15, 23, 42, 0.8)',
                  border: sleepFanRunning && spaceFoodType === 'TORTILLA' ? '1px solid #10b981' : '1px solid rgba(0, 210, 255, 0.4)',
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', fontWeight: 900, color: '#f8fafc' }}>
                      🥗 Station 3: Zero-G Habitat Ecology & Food
                    </span>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: sleepFanRunning && spaceFoodType === 'TORTILLA' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(251, 191, 36, 0.2)',
                      color: sleepFanRunning && spaceFoodType === 'TORTILLA' ? '#4ade80' : '#fef08a',
                    }}>
                      {sleepFanRunning && spaceFoodType === 'TORTILLA' ? '✅ PASSED' : 'DRILL PENDING'}
                    </span>
                  </div>

                  <p style={{ fontSize: '11.5px', color: '#cbd5e1', margin: 0, lineHeight: 1.45 }}>
                    In zero gravity, hot air doesn't rise! Cabin ventilation fans disperse suffocating CO2 bubbles around your head. Bread crumbs are strictly banned—eat clean tortillas instead!
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div style={{ background: '#0a0f1d', padding: '8px 12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <div style={{ fontSize: '10px', color: '#94a3b8' }}>SLEEP POD FAN:</div>
                      <div style={{ fontSize: '14px', fontFamily: 'monospace', fontWeight: 800, color: sleepFanRunning ? '#4ade80' : '#f87171' }}>
                        {sleepFanRunning ? '● RUNNING' : 'OFFLINE'}
                      </div>
                    </div>
                    <div style={{ background: '#0a0f1d', padding: '8px 12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <div style={{ fontSize: '10px', color: '#94a3b8' }}>SPACE FOOD MENU:</div>
                      <div style={{ fontSize: '14px', fontFamily: 'monospace', fontWeight: 800, color: '#38bdf8' }}>
                        TORTILLA (ZERO-CRUMB)
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleExecuteStation3}
                    style={{
                      padding: '12px 18px',
                      borderRadius: '8px',
                      background: sleepFanRunning && spaceFoodType === 'TORTILLA'
                        ? 'linear-gradient(90deg, #059669, #10b981)'
                        : 'linear-gradient(90deg, #0284c7, #2563eb)',
                      border: 'none',
                      color: '#ffffff',
                      fontSize: '12.5px',
                      fontWeight: 900,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 18px rgba(2, 132, 199, 0.4)',
                    }}
                  >
                    {sleepFanRunning && spaceFoodType === 'TORTILLA' ? (
                      <>
                        <CheckCircle2 size={16} />
                        <span>✅ AIR CIRCULATING & SPACE MEAL SERVED (+50 XP)</span>
                      </>
                    ) : (
                      <>
                        <span>🥗 START CABIN VENTILATION & SERVE MEAL (+50 XP)</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* ═════════ PILLAR 4: SURFACE OPS & CANADARM ═════════ */}
              {activePillar === 'SURFACE_REGOLITH' && (
                <div style={{
                  background: airlockElectrostaticShowerActive && cosmicCatchSuccess ? 'rgba(16, 185, 129, 0.1)' : 'rgba(15, 23, 42, 0.8)',
                  border: airlockElectrostaticShowerActive && cosmicCatchSuccess ? '1px solid #10b981' : '1px solid rgba(0, 210, 255, 0.4)',
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', fontWeight: 900, color: '#f8fafc' }}>
                      🚜 Station 4: Lunar Dust & Canadarm Robotics
                    </span>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: airlockElectrostaticShowerActive && cosmicCatchSuccess ? 'rgba(16, 185, 129, 0.2)' : 'rgba(251, 191, 36, 0.2)',
                      color: airlockElectrostaticShowerActive && cosmicCatchSuccess ? '#4ade80' : '#fef08a',
                    }}>
                      {airlockElectrostaticShowerActive && cosmicCatchSuccess ? '✅ PASSED' : 'DRILL PENDING'}
                    </span>
                  </div>

                  <p style={{ fontSize: '11.5px', color: '#cbd5e1', margin: 0, lineHeight: 1.45 }}>
                    Razor-sharp static regolith dust clings to suits. Activate the purple electrostatic ion shower to decontaminate, then teleoperate the Canadarm robot arm to catch the lunar lander cargo.
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div style={{ background: '#0a0f1d', padding: '8px 12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <div style={{ fontSize: '10px', color: '#94a3b8' }}>AIRLOCK DUST:</div>
                      <div style={{ fontSize: '14px', fontFamily: 'monospace', fontWeight: 800, color: regolithDustLevelPct === 0 ? '#4ade80' : '#c084fc' }}>
                        {regolithDustLevelPct === 0 ? 'CLEAN (0%)' : `${regolithDustLevelPct}% DUSTY`}
                      </div>
                    </div>
                    <div style={{ background: '#0a0f1d', padding: '8px 12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <div style={{ fontSize: '10px', color: '#94a3b8' }}>CANADARM:</div>
                      <div style={{ fontSize: '14px', fontFamily: 'monospace', fontWeight: 800, color: cosmicCatchSuccess ? '#4ade80' : '#38bdf8' }}>
                        {cosmicCatchSuccess ? 'CARGO GRAPPLED' : 'READY'}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleExecuteStation4}
                    style={{
                      padding: '12px 18px',
                      borderRadius: '8px',
                      background: airlockElectrostaticShowerActive && cosmicCatchSuccess
                        ? 'linear-gradient(90deg, #059669, #10b981)'
                        : 'linear-gradient(90deg, #0284c7, #2563eb)',
                      border: 'none',
                      color: '#ffffff',
                      fontSize: '12.5px',
                      fontWeight: 900,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 18px rgba(2, 132, 199, 0.4)',
                    }}
                  >
                    {airlockElectrostaticShowerActive && cosmicCatchSuccess ? (
                      <>
                        <CheckCircle2 size={16} />
                        <span>✅ AIRLOCK DE-DUSTED & CANADARM GRAPPLED (+50 XP)</span>
                      </>
                    ) : (
                      <>
                        <span>🚜 ACTIVATE AIRLOCK DE-DUSTER & DEPLOY CANADARM (+50 XP)</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* ═════════ PILLAR 5: EMERGENCY & SAFER JETPACK ═════════ */}
              {activePillar === 'EMERGENCY_DRILLS' && (
                <div style={{
                  background: fireExtinguished && saferDriftDistanceMeters === 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(15, 23, 42, 0.8)',
                  border: fireExtinguished && saferDriftDistanceMeters === 0 ? '1px solid #10b981' : '1px solid rgba(0, 210, 255, 0.4)',
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', fontWeight: 900, color: '#f8fafc' }}>
                      🚨 Station 5: Spherical Fire & SAFER Jetpack
                    </span>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: fireExtinguished && saferDriftDistanceMeters === 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(251, 191, 36, 0.2)',
                      color: fireExtinguished && saferDriftDistanceMeters === 0 ? '#4ade80' : '#fef08a',
                    }}>
                      {fireExtinguished && saferDriftDistanceMeters === 0 ? '✅ PASSED' : 'DRILL PENDING'}
                    </span>
                  </div>

                  <p style={{ fontSize: '11.5px', color: '#cbd5e1', margin: 0, lineHeight: 1.45 }}>
                    Zero-G fire burns as a quiet, dome-shaped blue sphere. Smother it immediately with fine CO2 mist! If a spacewalk tether breaks, fire the SAFER cold-gas nitrogen jetpack to fly back to the airlock.
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div style={{ background: '#0a0f1d', padding: '8px 12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <div style={{ fontSize: '10px', color: '#94a3b8' }}>FIRE STATUS:</div>
                      <div style={{ fontSize: '14px', fontFamily: 'monospace', fontWeight: 800, color: fireExtinguished ? '#4ade80' : '#f87171' }}>
                        {fireExtinguished ? 'SMOTHERED' : 'BURNING'}
                      </div>
                    </div>
                    <div style={{ background: '#0a0f1d', padding: '8px 12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <div style={{ fontSize: '10px', color: '#94a3b8' }}>SAFER DRIFT:</div>
                      <div style={{ fontSize: '14px', fontFamily: 'monospace', fontWeight: 800, color: saferDriftDistanceMeters === 0 ? '#4ade80' : '#f59e0b' }}>
                        {saferDriftDistanceMeters}m {saferDriftDistanceMeters === 0 ? 'AIRLOCK' : ''}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleExecuteStation5}
                    style={{
                      padding: '12px 18px',
                      borderRadius: '8px',
                      background: fireExtinguished && saferDriftDistanceMeters === 0
                        ? 'linear-gradient(90deg, #059669, #10b981)'
                        : 'linear-gradient(90deg, #0284c7, #2563eb)',
                      border: 'none',
                      color: '#ffffff',
                      fontSize: '12.5px',
                      fontWeight: 900,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 18px rgba(2, 132, 199, 0.4)',
                    }}
                  >
                    {fireExtinguished && saferDriftDistanceMeters === 0 ? (
                      <>
                        <CheckCircle2 size={16} />
                        <span>✅ FIRE SMOTHERED & AIRLOCK REACHED (+50 XP)</span>
                      </>
                    ) : (
                      <>
                        <span>🚨 DISCHARGE CO2 EXTINGUISHER & ACTIVATE JETPACK (+50 XP)</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* ── BOTTOM STATION NAVIGATION (PREV / NEXT) ── */}
              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  marginTop: 'auto',
                  paddingTop: '12px',
                  borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                <button
                  onClick={handlePrevPillar}
                  style={{
                    padding: '9px 14px',
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid rgba(148, 163, 184, 0.3)',
                    borderRadius: '8px',
                    color: '#cbd5e1',
                    fontSize: '11px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <ChevronLeft size={14} />
                  <span>Prev Station</span>
                </button>

                <button
                  onClick={handleNextPillar}
                  style={{
                    flex: 1,
                    padding: '9px 16px',
                    background: 'linear-gradient(90deg, #0284c7 0%, #2563eb 100%)',
                    border: '1px solid #38bdf8',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '11px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    boxShadow: '0 4px 15px rgba(2, 132, 199, 0.4)',
                  }}
                >
                  <span>CONTINUE TO NEXT STATION</span>
                  <ChevronRight size={14} />
                </button>
              </div>

            </div>
          </div>
        )}

        {/* ── HOW TO PLAY / CADET GUIDE MODAL ── */}
        {showHelpModal && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 1000,
              background: 'rgba(3, 7, 18, 0.92)',
              backdropFilter: 'blur(16px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
            }}
          >
            <div
              style={{
                maxWidth: '540px',
                width: '100%',
                background: '#0f172a',
                border: '1px solid #00d2ff',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 20px 50px rgba(0,0,0,0.8), 0 0 40px rgba(0, 210, 255, 0.3)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '24px' }}>🧑‍🚀</span>
                  <h3 style={{ fontSize: '16px', fontWeight: 900, color: '#f8fafc', margin: 0 }}>
                    HOW TO PLAY: CADET GROUND SCHOOL
                  </h3>
                </div>
                <button
                  onClick={() => setShowHelpModal(false)}
                  style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '18px' }}
                >
                  ✕
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '12px', color: '#cbd5e1', lineHeight: '1.5' }}>
                <div style={{ background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.25)', padding: '10px 14px', borderRadius: '8px' }}>
                  <strong style={{ color: '#38bdf8' }}>STEP 1: SELECT A TRAINING MODULE</strong>
                  <div>Use the 5 top tabs (NBL Pool, Spacesuit, Habitat Life, Surface Ops, Emergency) or click "Continue to Next Station".</div>
                </div>

                <div style={{ background: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251, 191, 36, 0.25)', padding: '10px 14px', borderRadius: '8px' }}>
                  <strong style={{ color: '#fbbf24' }}>STEP 2: FOLLOW THE YELLOW "YOUR TASK" BOXES</strong>
                  <div>Every card has a highlighted task. Example: Slide weights to 0 kg, torque bolts with the ratchet, or toggle the sleep fan!</div>
                </div>

                <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)', padding: '10px 14px', borderRadius: '8px' }}>
                  <strong style={{ color: '#34d399' }}>STEP 3: EARN XP & FLIGHT LICENSE</strong>
                  <div>Passing each drill turns the card green and awards +50 XP. Complete 4+ drills to claim your NASA Astronaut Certificate!</div>
                </div>
              </div>

              <button
                onClick={() => setShowHelpModal(false)}
                style={{
                  width: '100%',
                  marginTop: '18px',
                  padding: '10px',
                  background: 'linear-gradient(90deg, #00d2ff, #2563eb)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '12px',
                  fontWeight: 900,
                  cursor: 'pointer',
                }}
              >
                GOT IT, LET'S TRAIN! ▶
              </button>
            </div>
          </div>
        )}

        {/* ── FLIGHT READINESS CERTIFICATE / GRADUATION MODAL ── */}
        {showVictoryCert && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 1000,
              background: 'rgba(3, 7, 18, 0.95)',
              backdropFilter: 'blur(16px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
            }}
          >
            <div
              style={{
                maxWidth: '560px',
                width: '100%',
                background: 'linear-gradient(180deg, #0b1329 0%, #060913 100%)',
                border: '2px solid #fbbf24',
                borderRadius: '16px',
                padding: '28px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.9), 0 0 50px rgba(251, 191, 36, 0.35)',
                textAlign: 'center',
                position: 'relative',
              }}
            >
              <button
                onClick={() => setShowVictoryCert(false)}
                style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '18px' }}
              >
                ✕
              </button>

              <div style={{ fontSize: '48px', marginBottom: '8px' }}>🎓</div>
              <div style={{ fontSize: '11px', color: '#fbbf24', letterSpacing: '0.12em', fontWeight: 900 }}>
                NASA JOHNSON SPACE CENTER · FLIGHT OPERATIONS
              </div>
              <h2 style={{ fontSize: '20px', color: '#ffffff', fontWeight: 900, margin: '6px 0 14px 0' }}>
                ASTRONAUT FLIGHT READINESS CERTIFIED
              </h2>

              <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '14px', marginBottom: '16px', textAlign: 'left', fontSize: '11.5px', color: '#cbd5e1', lineHeight: '1.6' }}>
                <div>• <strong>Neutral Buoyancy Water Training:</strong> Equilibrium & Ratchet Torque Passed</div>
                <div>• <strong>Spacesuit EMU Architecture:</strong> 4.3 psi Denitrogenation Verified</div>
                <div>• <strong>Zero-G Habitat Ecology:</strong> Sleep Pod Airflow & Food Safety Confirmed</div>
                <div>• <strong>Emergency Survival Protocols:</strong> Microgravity Fire & SAFER Flyback Mastered</div>
              </div>

              <div style={{ fontSize: '13px', color: '#10b981', fontWeight: 800, marginBottom: '20px' }}>
                ⭐ {completedDrills.length} DRILLS COMPLETED · +500 CADET XP AWARDED!
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => setShowVictoryCert(false)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '11px',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  KEEP TRAINING
                </button>
                <button
                  onClick={() => {
                    setShowVictoryCert(false);
                    onClose();
                    if (onOpenAcademy) onOpenAcademy();
                  }}
                  style={{
                    flex: 1.4,
                    padding: '10px',
                    background: 'linear-gradient(90deg, #10b981, #059669)',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '11px',
                    fontWeight: 900,
                    cursor: 'pointer',
                    boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)',
                  }}
                >
                  🚀 GO TO MISSIONS / ACADEMY ▶
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
