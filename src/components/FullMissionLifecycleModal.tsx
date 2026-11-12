// ============================================================================
// FullMissionLifecycleModal.tsx — NASA 3D Spaceflight & Orbital Rocket Simulator
// Full-Screen Immersive Aerospace Simulation Modeled Directly After:
// "Ellipse: Rocket Simulator - Mission 3: Lunar Voyager" (YouTube: qXYpltxSTK0)
// Complete Real-Time Flight: Pad Liftoff -> Staging -> Orbit -> TLI -> Powered Landing -> EVA -> Earth Return
// Built for NASA Space Apps Challenge 2026 · Team Mysterio
// ============================================================================

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import confetti from 'canvas-confetti';
import {
  X,
  Volume2,
  VolumeX,
  Compass,
  Award,
  ChevronRight,
  Flame,
  Radio,
  Layers,
  Sparkles,
  Camera,
  MapPin,
  Clock,
  FastForward,
  Play,
  RotateCcw,
} from 'lucide-react';

import {
  type ExpeditionDestination,
  type RocketBooster,
  type RocketCoreStage,
  type RocketUpperStage,
  type ScienceEquipment,
  type HeatShieldParachuteConfig,
  type RocketConfigSelection,
  VAB_BOOSTERS,
  VAB_CORE_STAGES,
  VAB_UPPER_STAGES,
  VAB_SCIENCE_EQUIPMENT,
  VAB_REENTRY_CONFIGS,
  DESTINATION_PROFILES,
  calculateRocketPhysics,
} from '../missions/fullMissionLifecycle';
import { soundFx } from '../utils/audioEffects';
import { awardCadetCredits } from '../utils/gearBonusHelper';
import { disposeThreeScene } from '../utils/threeDisposeHelper';

interface FullMissionLifecycleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMissionCompleted?: (destination: ExpeditionDestination, credits: number) => void;
  initialDestination?: ExpeditionDestination;
}

export type FlightViewMode = 'CHASE' | 'ORBIT_MAP' | 'PAD_CAM';

export type MissionPhase =
  | 'PAD_READY'       // On Launch Pad 39A
  | 'ASCENT'          // Liftoff & Gravity Turn
  | 'STAGE1_SEP'      // Booster Separation
  | 'ORBIT_INSERTION' // Accelerating to 7.8 km/s LEO
  | 'ORBIT_COAST'     // In Earth Parking Orbit (200x200 km)
  | 'TLI_BURN'        // Trans-Lunar / Trans-Mars Injection Burn
  | 'DEEP_CRUISE'     // Coasting across Cislunar/Interplanetary Space
  | 'LUNAR_CAPTURE'   // Orbiting Moon / Mars
  | 'RETRO_DESCENT'   // Manual Retrograde Powered Landing (< 3.5 m/s)
  | 'SURFACE_LANDED'  // Safely on Lunar / Martian surface
  | 'SURFACE_EVA'     // Step out, plant flag, drill core sample
  | 'SURFACE_ASCENT'  // Liftoff from surface back to orbit
  | 'TEI_RETURN'      // Trans-Earth Injection return burn
  | 'REENTRY_PLASMA'  // Hypersonic atmospheric entry
  | 'PARACHUTE_DESCENT' // Parachutes open at 4,000 m
  | 'SPLASHDOWN';     // Pacific Ocean Splashdown & Mission Complete

export const FullMissionLifecycleModal: React.FC<FullMissionLifecycleModalProps> = ({
  isOpen,
  onClose,
  onMissionCompleted,
  initialDestination = 'MOON',
}) => {
  // 4 Progressive Missions
  const [destination, setDestination] = useState<ExpeditionDestination>(initialDestination);
  const [missionPhase, setMissionPhase] = useState<MissionPhase>('PAD_READY');
  const [viewMode, setViewMode] = useState<FlightViewMode>('CHASE');
  const [timeWarp, setTimeWarp] = useState<number>(1); // 1x, 5x, 25x, 100x
  const [soundEnabled, setSoundEnabled] = useState(true);

  // 100% Real-time Flight Controls
  const [throttle, setThrottle] = useState<number>(0); // 0 to 100%
  const [pitchDeg, setPitchDeg] = useState<number>(90); // 90° = vertical up, 0° = horizontal
  const [flightAltM, setFlightAltM] = useState<number>(0);
  const [flightSpeedMs, setFlightSpeedMs] = useState<number>(0);
  const [flightVyMs, setFlightVyMs] = useState<number>(0);
  const [flightVxMs, setFlightVxMs] = useState<number>(0);
  const [flightFuelPct, setFlightFuelPct] = useState<number>(100);
  const [rocketStage, setRocketStage] = useState<1 | 2 | 3>(1); // 1 = Boosters, 2 = Core, 3 = Lander/Upper
  const [landingLegsDeployed, setLandingLegsDeployed] = useState<boolean>(false);
  const [parachutesDeployed, setParachutesDeployed] = useState<boolean>(false);
  const [directorCallout, setDirectorCallout] = useState<string>('PRESS [IGNITE ENGINES] OR [Z] FOR PAD LIFTOFF');
  const [touchdownStatus, setTouchdownStatus] = useState<'FLYING' | 'SAFE' | 'HARD' | 'CRASHED'>('FLYING');

  // Surface EVA Tasks
  const [evaTasks, setEvaTasks] = useState<{ flagPlanted: boolean; sampleDrilled: boolean }>({
    flagPlanted: false,
    sampleDrilled: false,
  });

  // Three.js Mount reference
  const mountRef = useRef<HTMLDivElement>(null);

  // Mutable refs for 60 FPS physics & animation
  const simRef = useRef({
    throttle: 0,
    pitchDeg: 90,
    altM: 0,
    velMs: 0,
    vyMs: 0,
    vxMs: 0,
    fuelPct: 100,
    stage: 1 as 1 | 2 | 3,
    legsDeployed: false,
    chutesDeployed: false,
    boostersSeparated: false,
    boosterOffset: 0,
    timeWarp: 1,
    viewMode: 'CHASE' as FlightViewMode,
    orbitTheta: 0,
    moonTheta: 0.5,
    lunarDistanceM: 384400000,
    touchdown: 'FLYING' as 'FLYING' | 'SAFE' | 'HARD' | 'CRASHED',
    missionPhase: 'PAD_READY' as MissionPhase,
    cameraAngleX: 0,
    cameraAngleY: 0.2,
    isMouseDown: false,
    mouseLastX: 0,
    mouseLastY: 0,
  });

  // Sync state to mutable refs
  useEffect(() => {
    simRef.current.throttle = throttle;
  }, [throttle]);

  useEffect(() => {
    simRef.current.pitchDeg = pitchDeg;
  }, [pitchDeg]);

  useEffect(() => {
    simRef.current.legsDeployed = landingLegsDeployed;
  }, [landingLegsDeployed]);

  useEffect(() => {
    simRef.current.chutesDeployed = parachutesDeployed;
  }, [parachutesDeployed]);

  useEffect(() => {
    simRef.current.timeWarp = timeWarp;
  }, [timeWarp]);

  useEffect(() => {
    simRef.current.viewMode = viewMode;
  }, [viewMode]);

  useEffect(() => {
    simRef.current.missionPhase = missionPhase;
  }, [missionPhase]);

  const destProfile = DESTINATION_PROFILES[destination];

  // Reset simulation when destination changes or modal opens
  const resetSimulation = useCallback((dest: ExpeditionDestination) => {
    setDestination(dest);
    setMissionPhase('PAD_READY');
    setViewMode('CHASE');
    setTimeWarp(1);
    setThrottle(0);
    setPitchDeg(90);
    setFlightAltM(0);
    setFlightSpeedMs(0);
    setFlightVyMs(0);
    setFlightVxMs(0);
    setFlightFuelPct(100);
    setRocketStage(1);
    setLandingLegsDeployed(false);
    setParachutesDeployed(false);
    setTouchdownStatus('FLYING');
    setEvaTasks({ flagPlanted: false, sampleDrilled: false });
    setDirectorCallout('ROCKET MOUNTED ON PAD 39A · PRESS [IGNITE ENGINES] OR [Z] TO COMMENCE ASCENT');

    simRef.current = {
      throttle: 0,
      pitchDeg: 90,
      altM: 0,
      velMs: 0,
      vyMs: 0,
      vxMs: 0,
      fuelPct: 100,
      stage: 1,
      legsDeployed: false,
      chutesDeployed: false,
      boostersSeparated: false,
      boosterOffset: 0,
      timeWarp: 1,
      viewMode: 'CHASE',
      orbitTheta: 0,
      moonTheta: 0.5,
      lunarDistanceM: 384400000,
      touchdown: 'FLYING',
      missionPhase: 'PAD_READY',
      cameraAngleX: 0,
      cameraAngleY: 0.2,
      isMouseDown: false,
      mouseLastX: 0,
      mouseLastY: 0,
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      resetSimulation(initialDestination);
    }
  }, [isOpen, initialDestination, resetSimulation]);

  // Keyboard Shortcuts: [W]/[S]/[Z]/[X], [A]/[D], [SPACE], [G], [P], [M]
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      // Throttle
      if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') {
        e.preventDefault();
        setThrottle((prev) => Math.min(100, prev + 5));
        if (soundEnabled) soundFx.playThruster();
      } else if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') {
        e.preventDefault();
        setThrottle((prev) => Math.max(0, prev - 5));
      } else if (e.key === 'z' || e.key === 'Z') {
        e.preventDefault();
        setThrottle(100);
        if (soundEnabled) soundFx.playReactorStart();
      } else if (e.key === 'x' || e.key === 'X') {
        e.preventDefault();
        setThrottle(0);
      }

      // Pitch Steering
      else if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') {
        e.preventDefault();
        setPitchDeg((prev) => Math.min(90, prev + 3));
      } else if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') {
        e.preventDefault();
        setPitchDeg((prev) => Math.max(0, prev - 3));
      }

      // Staging: [SPACE]
      else if (e.code === 'Space') {
        e.preventDefault();
        handleStageTrigger();
      }

      // Landing Gear: [G]
      else if (e.key === 'g' || e.key === 'G') {
        e.preventDefault();
        setLandingLegsDeployed((prev) => !prev);
        if (soundEnabled) soundFx.playClick(750);
      }

      // Parachutes: [P]
      else if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        handleDeployChutes();
      }

      // Map View Toggle: [M]
      else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        setViewMode((prev) => (prev === 'CHASE' ? 'ORBIT_MAP' : 'CHASE'));
        if (soundEnabled) soundFx.playTelemetryChirp();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, soundEnabled, onClose]);

  // Stage Trigger Handler
  const handleStageTrigger = () => {
    if (missionPhase === 'PAD_READY') {
      setMissionPhase('ASCENT');
      setThrottle(100);
      setDirectorCallout('🔥 T-0 IGNITION & LIFTOFF! CLEARING PAD TOWER — STEER GRAVITY TURN (45° @ 30 KM)');
      if (soundEnabled) soundFx.playReactorStart();
      return;
    }

    if (rocketStage === 1) {
      setRocketStage(2);
      simRef.current.stage = 2;
      simRef.current.boostersSeparated = true;
      setDirectorCallout('✨ SOLID BOOSTER JETTISON! CORE STAGE IGNITION — ACCELERATING TO 7.8 km/s');
      if (soundEnabled) soundFx.playReactorStart();
    } else if (rocketStage === 2) {
      setRocketStage(3);
      simRef.current.stage = 3;
      setDirectorCallout('⚡ STAGE 2 SEPARATION! UPPER VACUUM ENGINE ARMED');
      if (soundEnabled) soundFx.playReactorStart();
    }
  };

  // Parachute deploy
  const handleDeployChutes = () => {
    if (flightAltM <= 6000 && !parachutesDeployed) {
      setParachutesDeployed(true);
      simRef.current.chutesDeployed = true;
      setMissionPhase('PARACHUTE_DESCENT');
      setDirectorCallout('🪂 TRIPLE MAIN PARACHUTES DEPLOYED! DESCENT DECELERATING TO 6.5 m/s');
      if (soundEnabled) soundFx.playReactorStart();
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // THREE.JS 3D ENGINE (FULL-SCREEN EDGE-TO-EDGE VIEWPORT)
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen || !mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x020617, 0.0005);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100000);
    camera.position.set(0, 8, 26);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    } catch {
      return;
    }
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 1. LIGHTING
    const sunLight = new THREE.DirectionalLight(0xffffff, 2.8);
    sunLight.position.set(150, 200, 100);
    scene.add(sunLight);

    const ambientLight = new THREE.AmbientLight(0x38bdf8, 0.5);
    scene.add(ambientLight);

    const exhaustPointLight = new THREE.PointLight(0xf97316, 0, 80);
    scene.add(exhaustPointLight);

    // 2. STARFIELD (Deep space background)
    const starCount = 3000;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starPos[i] = (Math.random() - 0.5) * 8000;
      starPos[i + 1] = (Math.random() - 0.5) * 8000;
      starPos[i + 2] = (Math.random() - 0.5) * 8000;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 2.2 });
    const starPoints = new THREE.Points(starGeo, starMat);
    scene.add(starPoints);

    // 3. LAUNCH PAD 39A (Ground Scene at 0 km)
    const groundSceneGroup = new THREE.Group();
    scene.add(groundSceneGroup);

    // Green/Coastal Florida ground plane
    const groundGeo = new THREE.CircleGeometry(2500, 64);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x1e3a1e, roughness: 0.9 });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.position.y = 0;
    groundSceneGroup.add(groundMesh);

    // Concrete Launch Pad Mound
    const padGeo = new THREE.CylinderGeometry(18, 24, 2.5, 32);
    const padMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.8 });
    const padMesh = new THREE.Mesh(padGeo, padMat);
    padMesh.position.y = 1.25;
    groundSceneGroup.add(padMesh);

    // Red Launch Umbilical Tower Gantry
    const towerGeo = new THREE.BoxGeometry(3.5, 34, 3.5);
    const towerMat = new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.7, roughness: 0.3 });
    const towerMesh = new THREE.Mesh(towerGeo, towerMat);
    towerMesh.position.set(-6, 17, -2);
    groundSceneGroup.add(towerMesh);

    // 4. CELESTIAL BODIES (Earth & Moon)
    // Earth Globe
    const earthRadius = 180;
    const earthGeo = new THREE.SphereGeometry(earthRadius, 64, 64);
    const earthMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.5, metalness: 0.1 });
    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    earthMesh.position.set(0, -earthRadius, 0);
    scene.add(earthMesh);

    // Earth Atmosphere Rim
    const atmoGeo = new THREE.SphereGeometry(earthRadius * 1.035, 48, 48);
    const atmoMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.35, side: THREE.BackSide });
    const atmoMesh = new THREE.Mesh(atmoGeo, atmoMat);
    earthMesh.add(atmoMesh);

    // Moon Globe (for Cislunar and Lunar Orbit/Descent)
    const moonRadius = 60;
    const moonGeo = new THREE.SphereGeometry(moonRadius, 48, 48);
    const moonMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.95 });
    const moonMesh = new THREE.Mesh(moonGeo, moonMat);
    moonMesh.position.set(800, 250, -1200);
    scene.add(moonMesh);

    // 5. DETAILED MULTI-STAGE 3D ROCKET GROUP
    const rocketMasterGroup = new THREE.Group();
    scene.add(rocketMasterGroup);

    // Crew Command Capsule (Top cone)
    const capGeo = new THREE.ConeGeometry(0.85, 1.6, 24);
    const capMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.8, roughness: 0.2 });
    const capMesh = new THREE.Mesh(capGeo, capMat);
    capMesh.position.y = 4.2;
    rocketMasterGroup.add(capMesh);

    // Service Module (Upper cylinder)
    const smGeo = new THREE.CylinderGeometry(0.85, 0.85, 1.8, 24);
    const smMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.5, roughness: 0.3 });
    const smMesh = new THREE.Mesh(smGeo, smMat);
    smMesh.position.y = 2.5;
    rocketMasterGroup.add(smMesh);

    // Lunar Lander Stage (Golden foil octagonal section with legs)
    const landerGeo = new THREE.CylinderGeometry(1.15, 1.15, 2.2, 8);
    const landerMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.85, roughness: 0.2 }); // Gold foil
    const landerMesh = new THREE.Mesh(landerGeo, landerMat);
    landerMesh.position.y = 0.5;
    rocketMasterGroup.add(landerMesh);

    // 4 Deployable Landing Legs
    const legsGroup = new THREE.Group();
    const legGeo = new THREE.CylinderGeometry(0.08, 0.08, 2.6, 8);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.9, roughness: 0.2 });

    const leg1 = new THREE.Mesh(legGeo, legMat);
    leg1.position.set(-1.3, -0.6, 0);
    leg1.rotation.z = 0.3;
    const leg2 = new THREE.Mesh(legGeo, legMat);
    leg2.position.set(1.3, -0.6, 0);
    leg2.rotation.z = -0.3;
    const leg3 = new THREE.Mesh(legGeo, legMat);
    leg3.position.set(0, -0.6, -1.3);
    leg3.rotation.x = -0.3;
    const leg4 = new THREE.Mesh(legGeo, legMat);
    leg4.position.set(0, -0.6, 1.3);
    leg4.rotation.x = 0.3;
    legsGroup.add(leg1, leg2, leg3, leg4);
    rocketMasterGroup.add(legsGroup);

    // Core Cryogenic Propellant Tank (SLS Orange / Saturn White)
    const coreGeo = new THREE.CylinderGeometry(1.2, 1.2, 6.5, 32);
    const coreMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.5, metalness: 0.3 }); // Orange SLS foam
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    coreMesh.position.y = -3.85;
    rocketMasterGroup.add(coreMesh);

    // Core Engine Bells (4x Cluster)
    const bellGeo = new THREE.CylinderGeometry(0.2, 0.45, 0.8, 16);
    const bellMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.95, roughness: 0.1 });
    for (let i = -1; i <= 1; i += 2) {
      for (let j = -1; j <= 1; j += 2) {
        const b = new THREE.Mesh(bellGeo, bellMat);
        b.position.set(i * 0.4, -7.5, j * 0.4);
        coreMesh.add(b);
      }
    }

    // Dual Solid Rocket Boosters (Left & Right)
    const boosterGroup = new THREE.Group();
    const bGeo = new THREE.CylinderGeometry(0.55, 0.55, 7.5, 20);
    const bMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, metalness: 0.6, roughness: 0.3 }); // White composite casing
    const bLeft = new THREE.Mesh(bGeo, bMat);
    bLeft.position.set(-1.85, -3.5, 0);
    const bRight = new THREE.Mesh(bGeo, bMat);
    bRight.position.set(1.85, -3.5, 0);

    // Booster Nosecones
    const noseGeo = new THREE.ConeGeometry(0.55, 1.6, 20);
    const noseLeft = new THREE.Mesh(noseGeo, bMat);
    noseLeft.position.y = 4.55;
    bLeft.add(noseLeft);
    const noseRight = new THREE.Mesh(noseGeo, bMat);
    noseRight.position.y = 4.55;
    bRight.add(noseRight);

    boosterGroup.add(bLeft, bRight);
    rocketMasterGroup.add(boosterGroup);

    // Glowing Engine Flame Plume
    const flameGeo = new THREE.ConeGeometry(0.9, 4.5, 20);
    const flameMat = new THREE.MeshBasicMaterial({ color: 0xf97316, transparent: true, opacity: 0 });
    const flameMesh = new THREE.Mesh(flameGeo, flameMat);
    flameMesh.rotation.x = Math.PI;
    flameMesh.position.y = -9.5;
    rocketMasterGroup.add(flameMesh);

    // Triple Parachutes Mesh (Orange & White striped dome)
    const chuteGeo = new THREE.SphereGeometry(3.5, 20, 20, 0, Math.PI * 2, 0, Math.PI * 0.5);
    const chuteMat = new THREE.MeshStandardMaterial({ color: 0xf97316, side: THREE.DoubleSide });
    const chuteMesh = new THREE.Mesh(chuteGeo, chuteMat);
    chuteMesh.position.set(0, 8.5, 0);
    chuteMesh.rotation.x = Math.PI;
    chuteMesh.visible = false;
    rocketMasterGroup.add(chuteMesh);

    // 6. ORBITAL MAP TRAJECTORY LINE
    const orbitPoints = 180;
    const orbitPositions = new Float32Array(orbitPoints * 3);
    const orbitGeo = new THREE.BufferGeometry();
    orbitGeo.setAttribute('position', new THREE.BufferAttribute(orbitPositions, 3));
    const orbitMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.8, linewidth: 2 });
    const orbitLine = new THREE.Line(orbitGeo, orbitMat);
    scene.add(orbitLine);

    // ─────────────────────────────────────────────────────────────────────────
    // MOUSE DRAG ORBIT CAMERA LISTENER
    // ─────────────────────────────────────────────────────────────────────────
    const handleMouseDown = (e: MouseEvent) => {
      simRef.current.isMouseDown = true;
      simRef.current.mouseLastX = e.clientX;
      simRef.current.mouseLastY = e.clientY;
    };
    const handleMouseMove = (e: MouseEvent) => {
      if (!simRef.current.isMouseDown) return;
      const dx = e.clientX - simRef.current.mouseLastX;
      const dy = e.clientY - simRef.current.mouseLastY;
      simRef.current.cameraAngleX += dx * 0.005;
      simRef.current.cameraAngleY = Math.max(-1.2, Math.min(1.2, simRef.current.cameraAngleY + dy * 0.005));
      simRef.current.mouseLastX = e.clientX;
      simRef.current.mouseLastY = e.clientY;
    };
    const handleMouseUp = () => {
      simRef.current.isMouseDown = false;
    };

    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    // ─────────────────────────────────────────────────────────────────────────
    // 60 FPS MASTER ANIMATION & AEROSPACE PHYSICS LOOP
    // ─────────────────────────────────────────────────────────────────────────
    let animId: number;
    let lastTime = performance.now();

    const animate = (time: number) => {
      animId = requestAnimationFrame(animate);
      const rawDt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      const p = simRef.current;
      const dt = rawDt * p.timeWarp;

      // Rotate starfield slowly
      starPoints.rotation.y += 0.0001;

      // Update Moon position in Cislunar orbit
      p.moonTheta += 0.0002 * p.timeWarp;
      moonMesh.position.x = 900 * Math.cos(p.moonTheta);
      moonMesh.position.z = -1200 * Math.sin(p.moonTheta);

      // ─── FLIGHT PHYSICS SIMULATION ───
      const throttleNorm = p.throttle / 100;
      const pitchRad = (p.pitchDeg * Math.PI) / 180;

      if (p.missionPhase === 'ASCENT' || p.missionPhase === 'ORBIT_INSERTION') {
        // Accelerations
        const g = 9.81 * ((6371000 / (6371000 + p.altM)) ** 2);
        const thrustKn = p.stage === 1 ? 38000 : p.stage === 2 ? 12000 : 3500;
        const massTons = 2400 * (0.35 + 0.65 * (p.fuelPct / 100));

        if (p.fuelPct > 0 && throttleNorm > 0) {
          p.fuelPct = Math.max(0, p.fuelPct - throttleNorm * 0.18 * dt);
        }

        const effectiveThrustKn = p.fuelPct > 0 ? thrustKn * throttleNorm : 0;
        const aThrust = effectiveThrustKn / massTons;

        // Atmospheric drag (decays exponentially above 10 km)
        const density = Math.exp(-p.altM / 8500);
        const dragN = 0.5 * density * 1.225 * (p.velMs ** 2) * 0.28 * 6.0;
        const aDrag = (dragN / 1000) / massTons;

        const ay = aThrust * Math.sin(pitchRad) - (aDrag * (p.vyMs / Math.max(1, p.velMs))) - g;
        const ax = aThrust * Math.cos(pitchRad) - (aDrag * (p.vxMs / Math.max(1, p.velMs)));

        p.vyMs += ay * dt;
        p.vxMs += ax * dt;
        p.velMs = Math.sqrt(p.vyMs ** 2 + p.vxMs ** 2);
        p.altM = Math.max(0, p.altM + p.vyMs * dt);

        // Booster visual separation offset
        if (p.boostersSeparated) {
          p.boosterOffset += dt * 5;
          bLeft.position.x = -1.85 - p.boosterOffset;
          bRight.position.x = 1.85 + p.boosterOffset;
          bLeft.position.y -= dt * 3;
          bRight.position.y -= dt * 3;
        }

        // Check 100 km Karman boundary for Mission 1
        if (destination === 'SUBORBITAL' && p.altM >= 100000) {
          setDirectorCallout('🎉 100 KM KÁRMÁN BOUNDARY PASSED! ENTERED MICROGRAVITY — RETURNING TO SPLASHDOWN');
        }

        // Check Orbit Insertion (7.75 km/s) for Mission 2, 3, 4
        if (p.velMs >= 7750 && p.altM >= 180000 && p.missionPhase === 'ASCENT') {
          p.missionPhase = 'ORBIT_COAST';
          setMissionPhase('ORBIT_COAST');
          setDirectorCallout('🌍 STABLE 200x200 km LOW EARTH ORBIT (LEO) ACHIEVED! READY FOR TRANS-LUNAR INJECTION (TLI)');
          confetti({ particleCount: 100, spread: 70 });
          if (soundEnabled) soundFx.playVictory();
        }
      }
      else if (p.missionPhase === 'RETRO_DESCENT') {
        const gMoon = destination === 'MARS' ? 3.72 : 1.62;
        const maxDecel = 16.0; // m/s^2 deceleration
        const thrustAcc = p.fuelPct > 0 ? throttleNorm * maxDecel : 0;

        if (p.fuelPct > 0 && throttleNorm > 0) {
          p.fuelPct = Math.max(0, p.fuelPct - throttleNorm * 0.12 * dt);
        }

        const ay = thrustAcc - gMoon;
        p.vyMs += ay * dt;
        p.altM = Math.max(0, p.altM + p.vyMs * dt);
        p.vxMs = Math.max(0, p.vxMs - dt * 2.0);
        p.velMs = Math.sqrt(p.vyMs ** 2 + p.vxMs ** 2);

        // Touchdown detection
        if (p.altM <= 0) {
          p.altM = 0;
          const downwardRate = Math.abs(p.vyMs);

          if (!p.legsDeployed) {
            p.touchdown = 'CRASHED';
            setTouchdownStatus('CRASHED');
            setDirectorCallout('💥 CRASH! LANDING LEGS WERE NOT DEPLOYED! PRESS [G] & RETRY');
          } else if (downwardRate <= 3.5) {
            p.touchdown = 'SAFE';
            setTouchdownStatus('SAFE');
            p.missionPhase = 'SURFACE_LANDED';
            setMissionPhase('SURFACE_LANDED');
            setDirectorCallout('🎉 NOMINAL TOUCHDOWN (< 3.5 m/s)! THE EAGLE HAS LANDED ON THE MOON');
            confetti({ particleCount: 160, spread: 90 });
            if (soundEnabled) soundFx.playVictory();
          } else {
            p.touchdown = 'CRASHED';
            setTouchdownStatus('CRASHED');
            setDirectorCallout(`💥 CRASH IMPACT: Touchdown speed (${downwardRate.toFixed(1)} m/s) exceeded 3.5 m/s structural limit!`);
          }
        }
      }
      else if (p.missionPhase === 'REENTRY_PLASMA' || p.missionPhase === 'PARACHUTE_DESCENT') {
        const terminalVel = p.chutesDeployed ? -6.5 : -140;
        p.vyMs += (terminalVel - p.vyMs) * dt * 0.7;
        p.altM = Math.max(0, p.altM + p.vyMs * dt * 4);
        p.velMs = Math.abs(p.vyMs);

        if (p.altM <= 0) {
          p.altM = 0;
          p.missionPhase = 'SPLASHDOWN';
          setMissionPhase('SPLASHDOWN');
          setDirectorCallout('🎉 OCEAN SPLASHDOWN NOMINAL! US NAVY RETRIEVAL TEAMS DISPATCHED');
          confetti({ particleCount: 200, spread: 100 });
          if (soundEnabled) soundFx.playVictory();
          awardCadetCredits(1500);
          onMissionCompleted?.(destination, 1500);
        }
      }

      // ─── 3D ROCKET MESH ORIENTATION & VISUALS ───
      const visualPitch = (p.pitchDeg * Math.PI) / 180;
      rocketMasterGroup.rotation.z = -visualPitch + Math.PI / 2;

      // Rocket flame
      const isFiring = p.fuelPct > 0 && throttleNorm > 0 && !['PAD_READY', 'SURFACE_LANDED', 'SURFACE_EVA', 'SPLASHDOWN'].includes(p.missionPhase);
      flameMat.opacity = isFiring ? 0.95 : 0;
      flameMesh.scale.set(throttleNorm, throttleNorm * (1.2 + Math.random() * 0.4), throttleNorm);
      exhaustPointLight.intensity = isFiring ? 3.5 * throttleNorm : 0;

      // Parachute mesh
      chuteMesh.visible = p.chutesDeployed;

      // Landing legs deployment
      if (p.legsDeployed) {
        leg1.position.y = -1.2;
        leg2.position.y = -1.2;
        leg3.position.y = -1.2;
        leg4.position.y = -1.2;
      } else {
        leg1.position.y = -0.6;
        leg2.position.y = -0.6;
        leg3.position.y = -0.6;
        leg4.position.y = -0.6;
      }

      // Rocket world position based on phase
      if (p.missionPhase === 'PAD_READY') {
        rocketMasterGroup.position.set(0, 10.5, 0);
        groundSceneGroup.visible = true;
        earthMesh.visible = false;
        moonMesh.visible = false;
      } else if (p.missionPhase === 'ASCENT' || p.missionPhase === 'ORBIT_INSERTION') {
        // Rocket climbing into sky
        const normAlt = p.altM / 1000;
        rocketMasterGroup.position.set(normAlt * 0.3, Math.min(120, 10.5 + normAlt * 0.8), -normAlt * 0.2);

        // Ground disappears, Earth globe appears
        groundSceneGroup.visible = normAlt < 45;
        earthMesh.visible = normAlt >= 15;
        earthMesh.position.set(0, -earthRadius - normAlt * 0.3, 0);
      } else if (['ORBIT_COAST', 'TLI_BURN', 'DEEP_CRUISE'].includes(p.missionPhase)) {
        groundSceneGroup.visible = false;
        earthMesh.visible = true;
        moonMesh.visible = true;
        rocketMasterGroup.position.set(0, 0, 0);
      } else if (['LUNAR_CAPTURE', 'RETRO_DESCENT', 'SURFACE_LANDED', 'SURFACE_EVA', 'SURFACE_ASCENT'].includes(p.missionPhase)) {
        groundSceneGroup.visible = false;
        earthMesh.visible = false;
        moonMesh.visible = true;
        moonMesh.position.set(0, -moonRadius - 4, 0);
        rocketMasterGroup.position.set(0, p.altM / 200, 0);
      } else if (['REENTRY_PLASMA', 'PARACHUTE_DESCENT', 'SPLASHDOWN'].includes(p.missionPhase)) {
        groundSceneGroup.visible = p.altM < 2000;
        earthMesh.visible = true;
        moonMesh.visible = false;
        rocketMasterGroup.position.set(0, p.altM / 1000 + 4, 0);
      }

      // ─── CAMERA MODES ───
      if (p.viewMode === 'ORBIT_MAP') {
        // High-altitude orbital trajectory plotter
        camera.position.set(0, 800, 1200);
        camera.lookAt(0, 0, -200);

        // Update trajectory ellipse
        const pos = orbitGeo.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < orbitPoints; i++) {
          const theta = (i / orbitPoints) * Math.PI * 2;
          const a = 320;
          const b = 280;
          pos.setXYZ(i, a * Math.cos(theta), 0, b * Math.sin(theta) - 100);
        }
        pos.needsUpdate = true;
        orbitLine.visible = true;
      } else if (p.viewMode === 'PAD_CAM') {
        // Ground camera at pad looking up at rocket
        camera.position.set(28, 4, 32);
        camera.lookAt(rocketMasterGroup.position);
        orbitLine.visible = false;
      } else {
        // CHASE CAM (Follows rocket with mouse orbital inspection)
        orbitLine.visible = false;
        const camDist = 24;
        const cx = rocketMasterGroup.position.x + camDist * Math.sin(p.cameraAngleX) * Math.cos(p.cameraAngleY);
        const cy = rocketMasterGroup.position.y + camDist * Math.sin(p.cameraAngleY) + 4;
        const cz = rocketMasterGroup.position.z + camDist * Math.cos(p.cameraAngleX) * Math.cos(p.cameraAngleY);
        camera.position.set(cx, cy, cz);
        camera.lookAt(rocketMasterGroup.position);
      }

      // Sync React state for HUD
      setFlightAltM(Math.round(p.altM));
      setFlightSpeedMs(Math.round(p.velMs));
      setFlightVyMs(Number(p.vyMs.toFixed(1)));
      setFlightVxMs(Number(p.vxMs.toFixed(1)));
      setFlightFuelPct(Math.round(p.fuelPct));

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(animate);

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      disposeThreeScene(renderer, scene, container);
    };
  }, [isOpen, destination, soundEnabled, onMissionCompleted]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 13500,
        backgroundColor: '#020617',
        fontFamily: 'var(--font-mono, monospace)',
        overflow: 'hidden',
        color: '#f8fafc',
        userSelect: 'none',
      }}
    >
      {/* ─── FULL-SCREEN 3D WEBGL VIEWPORT ─── */}
      <div ref={mountRef} style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }} />

      {/* ─── TOP MASTER NAVBAR & 4-MISSION SELECTOR ─── */}
      <header
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          background: 'linear-gradient(180deg, rgba(6, 9, 18, 0.96) 0%, rgba(6, 9, 18, 0.6) 80%, transparent 100%)',
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 50,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
              border: '1.5px solid #38bdf8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              boxShadow: '0 0 16px rgba(56, 189, 248, 0.5)',
            }}
          >
            🚀
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 900, color: '#f8fafc', fontFamily: 'var(--font-space)' }}>
              NASA SURVIVAL SIMULATOR <span style={{ color: '#38bdf8' }}>[{destProfile.name}]</span>
            </div>
            <div style={{ fontSize: '10px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#fbbf24' }}>MODELED AFTER ELLIPSE: LUNAR VOYAGER (YOUTUBE: qXYpltxSTK0)</span>
              <span>•</span>
              <span style={{ color: '#4ade80' }}>100% REAL-TIME MANUAL CONTROLS</span>
            </div>
          </div>
        </div>

        {/* 4 Mission Quick Select Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {(['SUBORBITAL', 'ORBITAL', 'MOON', 'MARS'] as ExpeditionDestination[]).map((dest, idx) => {
            const isSel = destination === dest;
            const labels = ['1. Sub-Orbital (100km)', '2. LEO Orbit (200km)', '3. Lunar Voyager (YouTube)', '4. Mars Voyager'];
            return (
              <button
                key={dest}
                onClick={() => {
                  resetSimulation(dest);
                  if (soundEnabled) soundFx.playClick(850);
                }}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 900,
                  cursor: 'pointer',
                  border: isSel ? '1.5px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.1)',
                  background: isSel ? 'rgba(56, 189, 248, 0.25)' : 'rgba(15, 23, 42, 0.7)',
                  color: isSel ? '#ffffff' : '#94a3b8',
                  boxShadow: isSel ? '0 0 14px rgba(56, 189, 248, 0.5)' : 'none',
                }}
              >
                {labels[idx]}
              </button>
            );
          })}
        </div>

        {/* Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            style={{
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '8px',
              padding: '6px 10px',
              color: soundEnabled ? '#38bdf8' : '#64748b',
              cursor: 'pointer',
            }}
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(239, 68, 68, 0.25)',
              border: '1.5px solid #ef4444',
              borderRadius: '8px',
              padding: '6px 14px',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 900,
              cursor: 'pointer',
            }}
          >
            ✕ EXIT
          </button>
        </div>
      </header>

      {/* ─── TOP CENTER: LIVE FLIGHT DIRECTOR CALLOUT ─── */}
      <div
        style={{
          position: 'absolute',
          top: '64px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(6, 9, 18, 0.88)',
          border: '1.5px solid rgba(56, 189, 248, 0.45)',
          borderRadius: '30px',
          padding: '8px 24px',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          zIndex: 40,
          boxShadow: '0 0 25px rgba(56, 189, 248, 0.3)',
        }}
      >
        <span style={{ fontSize: '16px' }}>📡</span>
        <span style={{ fontSize: '12px', fontWeight: 900, color: '#f8fafc', letterSpacing: '0.04em' }}>
          {directorCallout}
        </span>
        <span style={{ fontSize: '10px', color: '#fbbf24', fontWeight: 800 }}>
          [{missionPhase}]
        </span>
      </div>

      {/* ─── TOP RIGHT: CAMERA & TIME WARP CONTROLS ─── */}
      <div
        style={{
          position: 'absolute',
          top: '64px',
          right: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          zIndex: 40,
        }}
      >
        {/* Camera Modes */}
        <div
          style={{
            background: 'rgba(6, 9, 18, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '8px',
            padding: '4px',
            display: 'flex',
            gap: '4px',
            backdropFilter: 'blur(10px)',
          }}
        >
          <button
            onClick={() => setViewMode('CHASE')}
            style={{
              padding: '5px 10px',
              borderRadius: '6px',
              fontSize: '10px',
              fontWeight: 800,
              background: viewMode === 'CHASE' ? '#2563eb' : 'transparent',
              color: '#ffffff',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            🚀 CHASE
          </button>
          <button
            onClick={() => setViewMode('ORBIT_MAP')}
            style={{
              padding: '5px 10px',
              borderRadius: '6px',
              fontSize: '10px',
              fontWeight: 800,
              background: viewMode === 'ORBIT_MAP' ? '#2563eb' : 'transparent',
              color: '#ffffff',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            🗺️ ORBIT MAP [M]
          </button>
          <button
            onClick={() => setViewMode('PAD_CAM')}
            style={{
              padding: '5px 10px',
              borderRadius: '6px',
              fontSize: '10px',
              fontWeight: 800,
              background: viewMode === 'PAD_CAM' ? '#2563eb' : 'transparent',
              color: '#ffffff',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            🎥 PAD
          </button>
        </div>

        {/* Time Warp Buttons */}
        <div
          style={{
            background: 'rgba(6, 9, 18, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '8px',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            backdropFilter: 'blur(10px)',
          }}
        >
          <span style={{ fontSize: '9px', color: '#94a3b8', padding: '0 6px', fontWeight: 800 }}>WARP:</span>
          {[1, 5, 25, 100].map((w) => (
            <button
              key={w}
              onClick={() => {
                setTimeWarp(w);
                if (soundEnabled) soundFx.playTelemetryChirp();
              }}
              style={{
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '10px',
                fontWeight: 900,
                background: timeWarp === w ? '#fbbf24' : 'transparent',
                color: timeWarp === w ? '#020617' : '#cbd5e1',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              {w}x
            </button>
          ))}
        </div>
      </div>

      {/* ─── TOP LEFT: PRIMARY FLIGHT TELEMETRY HUD ─── */}
      <div
        style={{
          position: 'absolute',
          top: '64px',
          left: '20px',
          background: 'rgba(6, 9, 18, 0.88)',
          border: '1.5px solid rgba(56, 189, 248, 0.35)',
          borderRadius: '12px',
          padding: '14px 18px',
          backdropFilter: 'blur(12px)',
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '8px 20px',
          zIndex: 40,
          boxShadow: '0 0 20px rgba(0, 0, 0, 0.6)',
        }}
      >
        <div>
          <div style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 800 }}>ALTITUDE</div>
          <div style={{ fontSize: '20px', fontWeight: 900, color: '#38bdf8' }}>
            {flightAltM >= 1000 ? `${(flightAltM / 1000).toFixed(1)} km` : `${flightAltM} m`}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 800 }}>TOTAL VELOCITY</div>
          <div style={{ fontSize: '20px', fontWeight: 900, color: '#fbbf24' }}>
            {flightSpeedMs >= 1000 ? `${(flightSpeedMs / 1000).toFixed(2)} km/s` : `${flightSpeedMs} m/s`}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 800 }}>VERTICAL SPEED (Vy)</div>
          <div style={{ fontSize: '14px', fontWeight: 900, color: flightVyMs >= 0 ? '#4ade80' : '#f87171' }}>
            {flightVyMs > 0 ? `+${flightVyMs}` : flightVyMs} m/s
          </div>
        </div>
        <div>
          <div style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 800 }}>PITCH ANGLE</div>
          <div style={{ fontSize: '14px', fontWeight: 900, color: '#ffffff' }}>
            {pitchDeg}° {pitchDeg >= 80 ? '↑ Vertical' : pitchDeg <= 15 ? '→ Orbital' : '↗ Gravity Turn'}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 800 }}>PROPELLANT</div>
          <div style={{ fontSize: '14px', fontWeight: 900, color: flightFuelPct > 20 ? '#38bdf8' : '#ef4444' }}>
            {flightFuelPct}%
          </div>
        </div>
        <div>
          <div style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 800 }}>ACTIVE STAGE</div>
          <div style={{ fontSize: '14px', fontWeight: 900, color: '#a78bfa' }}>
            STAGE {rocketStage} / 3
          </div>
        </div>
      </div>

      {/* ─── BOTTOM LEFT: REAL AEROSPACE ATTITUDE NAVBALL ─── */}
      <div
        style={{
          position: 'absolute',
          bottom: '20px',
          left: '20px',
          background: 'rgba(6, 9, 18, 0.92)',
          border: '1.5px solid rgba(56, 189, 248, 0.4)',
          borderRadius: '16px',
          padding: '12px',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
          zIndex: 40,
        }}
      >
        <div style={{ fontSize: '9px', color: '#38bdf8', fontWeight: 900, letterSpacing: '0.06em' }}>
          ATTITUDE INDICATOR (NAVBALL)
        </div>
        {/* Navball Graphic */}
        <div
          style={{
            width: '90px',
            height: '90px',
            borderRadius: '50%',
            position: 'relative',
            overflow: 'hidden',
            border: '2px solid #38bdf8',
            boxShadow: '0 0 15px rgba(56, 189, 248, 0.35)',
            background: 'linear-gradient(180deg, #1e40af 50%, #92400e 50%)',
          }}
        >
          {/* Horizon Line */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: 0,
              right: 0,
              height: '2px',
              backgroundColor: '#ffffff',
              transform: `translateY(-50%) rotate(${-(pitchDeg - 90)}deg)`,
            }}
          />
          {/* Prograde Crosshair */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              color: '#fbbf24',
              fontSize: '18px',
              fontWeight: 900,
            }}
          >
            ⊕
          </div>
        </div>

        {/* Pitch Manual Buttons */}
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={() => setPitchDeg((prev) => Math.min(90, prev + 5))}
            style={{
              padding: '5px 8px',
              borderRadius: '6px',
              background: 'rgba(56, 189, 248, 0.2)',
              border: '1px solid #38bdf8',
              color: '#ffffff',
              fontSize: '10px',
              fontWeight: 900,
              cursor: 'pointer',
            }}
            title="Pitch Up [A]"
          >
            ↰ [A] +5°
          </button>
          <button
            onClick={() => setPitchDeg((prev) => Math.max(0, prev - 5))}
            style={{
              padding: '5px 8px',
              borderRadius: '6px',
              background: 'rgba(56, 189, 248, 0.2)',
              border: '1px solid #38bdf8',
              color: '#ffffff',
              fontSize: '10px',
              fontWeight: 900,
              cursor: 'pointer',
            }}
            title="Pitch Down [D]"
          >
            ↱ [D] -5°
          </button>
        </div>
      </div>

      {/* ─── BOTTOM RIGHT: THROTTLE SLIDER & STAGE TRIGGER CLUSTER ─── */}
      <div
        style={{
          position: 'absolute',
          bottom: '20px',
          right: '20px',
          background: 'rgba(6, 9, 18, 0.94)',
          border: '1.5px solid rgba(56, 189, 248, 0.45)',
          borderRadius: '16px',
          padding: '14px 20px',
          backdropFilter: 'blur(16px)',
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
          zIndex: 40,
          boxShadow: '0 0 30px rgba(0, 0, 0, 0.7)',
        }}
      >
        {/* Throttle Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
          <div style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 900 }}>
            THROTTLE [W/S]
          </div>
          <div style={{ fontSize: '18px', fontWeight: 900, color: throttle > 0 ? '#f97316' : '#64748b' }}>
            {throttle}%
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={throttle}
            onChange={(e) => setThrottle(Number(e.target.value))}
            style={{ width: '130px', accentColor: '#f97316', cursor: 'pointer' }}
          />
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => setThrottle(0)}
              style={{
                padding: '3px 8px',
                borderRadius: '4px',
                background: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid #ef4444',
                color: '#ffffff',
                fontSize: '9px',
                fontWeight: 900,
                cursor: 'pointer',
              }}
            >
              CUT [X]
            </button>
            <button
              onClick={() => setThrottle(100)}
              style={{
                padding: '3px 8px',
                borderRadius: '4px',
                background: 'rgba(249, 115, 22, 0.2)',
                border: '1px solid #f97316',
                color: '#ffffff',
                fontSize: '9px',
                fontWeight: 900,
                cursor: 'pointer',
              }}
            >
              MAX [Z]
            </button>
          </div>
        </div>

        {/* Big Staging Action Button */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            onClick={handleStageTrigger}
            style={{
              padding: '12px 20px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #a855f7, #7c3aed)',
              border: '1.5px solid #c084fc',
              color: '#ffffff',
              fontWeight: 900,
              fontSize: '12px',
              cursor: 'pointer',
              boxShadow: '0 0 20px rgba(168, 85, 247, 0.5)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span>⚡</span>
            <span>{missionPhase === 'PAD_READY' ? 'IGNITE & LAUNCH [SPACE]' : `STAGE ${rocketStage} SEP [SPACE]`}</span>
          </button>

          {/* Landing Gear Toggle */}
          <button
            onClick={() => {
              setLandingLegsDeployed(!landingLegsDeployed);
              if (soundEnabled) soundFx.playClick(750);
            }}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              background: landingLegsDeployed ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.2)',
              border: landingLegsDeployed ? '1.5px solid #10b981' : '1.5px solid #ef4444',
              color: '#ffffff',
              fontSize: '11px',
              fontWeight: 900,
              cursor: 'pointer',
            }}
          >
            🦿 LEGS: {landingLegsDeployed ? 'DEPLOYED [G]' : 'STOWED [G]'}
          </button>

          {/* Parachute Button */}
          <button
            onClick={handleDeployChutes}
            disabled={flightAltM > 6000 || parachutesDeployed}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              background: parachutesDeployed
                ? 'rgba(16, 185, 129, 0.3)'
                : flightAltM <= 6000
                ? 'linear-gradient(135deg, #f97316, #ea580c)'
                : '#334155',
              border: parachutesDeployed ? '1.5px solid #10b981' : '1.5px solid #f97316',
              color: '#ffffff',
              fontSize: '11px',
              fontWeight: 900,
              cursor: flightAltM <= 6000 && !parachutesDeployed ? 'pointer' : 'default',
            }}
          >
            🪂 {parachutesDeployed ? 'CHUTES INFLATED [P]' : flightAltM <= 6000 ? 'DEPLOY CHUTE [P]' : 'CHUTE ARMED (< 6km)'}
          </button>
        </div>
      </div>

      {/* ─── BOTTOM CENTER: CONTEXTUAL MISSION ADVANCEMENT BUTTONS ─── */}
      <div
        style={{
          position: 'absolute',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '12px',
          zIndex: 40,
        }}
      >
        {/* Orbit Insertion complete -> Go for TLI burn */}
        {missionPhase === 'ORBIT_COAST' && destination !== 'SUBORBITAL' && (
          <button
            onClick={() => {
              setMissionPhase('TLI_BURN');
              setThrottle(100);
              setDirectorCallout('🔥 TRANS-LUNAR INJECTION (TLI) BURN ACTIVE! ACCELERATING OUT OF EARTH GRAVITY WELL');
              if (soundEnabled) soundFx.playReactorStart();
              setTimeout(() => {
                setMissionPhase('DEEP_CRUISE');
                setThrottle(0);
                setDirectorCallout('🌕 TLI BURN COMPLETE! COASTING ACROSS CISLUNAR SPACE TO THE MOON');
              }, 4000);
            }}
            style={{
              padding: '12px 24px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
              border: '1.5px solid #38bdf8',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 900,
              cursor: 'pointer',
              boxShadow: '0 0 25px rgba(37, 99, 235, 0.6)',
            }}
          >
            EXECUTE TRANS-LUNAR INJECTION (TLI) BURN ▶
          </button>
        )}

        {/* Deep Cruise -> Begin Powered Lunar Descent */}
        {missionPhase === 'DEEP_CRUISE' && (
          <button
            onClick={() => {
              setMissionPhase('RETRO_DESCENT');
              setFlightAltM(3500);
              setFlightVyMs(-65);
              setThrottle(40);
              setDirectorCallout('⚠️ RETRO DESCENT: THROTTLE DOWN TO TOUCH DOWN SOFTLY < 3.5 m/s!');
              if (soundEnabled) soundFx.playReactorStart();
            }}
            style={{
              padding: '12px 24px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #ef4444, #b91c1c)',
              border: '1.5px solid #f87171',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 900,
              cursor: 'pointer',
              boxShadow: '0 0 25px rgba(239, 68, 68, 0.6)',
            }}
          >
            COMMENCE POWERED LUNAR RETRO DESCENT ▶
          </button>
        )}

        {/* Landed on Moon -> Step out for Surface EVA */}
        {missionPhase === 'SURFACE_LANDED' && (
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => {
                setEvaTasks((prev) => ({ ...prev, flagPlanted: true }));
                if (soundEnabled) soundFx.playVictory();
                setDirectorCallout('🏁 AMERICAN / NASA FLAG ERECTED ON SHACKLETON CRATER!');
              }}
              style={{
                padding: '12px 18px',
                borderRadius: '8px',
                background: evaTasks.flagPlanted ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255, 255, 255, 0.1)',
                border: evaTasks.flagPlanted ? '1.5px solid #10b981' : '1px solid rgba(255,255,255,0.2)',
                color: '#ffffff',
                fontWeight: 900,
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              🏁 {evaTasks.flagPlanted ? 'FLAG PLANTED ✓' : 'PLANT EXPEDITION FLAG'}
            </button>

            <button
              onClick={() => {
                setEvaTasks((prev) => ({ ...prev, sampleDrilled: true }));
                if (soundEnabled) soundFx.playClick(900);
                setDirectorCallout('🔬 PRISTINE LUNAR ICE CORE SAMPLE DRILLED & STOWED!');
              }}
              style={{
                padding: '12px 18px',
                borderRadius: '8px',
                background: evaTasks.sampleDrilled ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255, 255, 255, 0.1)',
                border: evaTasks.sampleDrilled ? '1.5px solid #10b981' : '1px solid rgba(255,255,255,0.2)',
                color: '#ffffff',
                fontWeight: 900,
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              🔬 {evaTasks.sampleDrilled ? 'SAMPLE DRILLED ✓' : 'DRILL REGOLITH CORE'}
            </button>

            {evaTasks.flagPlanted && evaTasks.sampleDrilled && (
              <button
                onClick={() => {
                  setMissionPhase('SURFACE_ASCENT');
                  setThrottle(100);
                  setFlightAltM(100);
                  setFlightVyMs(50);
                  setDirectorCallout('🚀 ASCENT MODULE LIFTOFF! ENTERING LUNAR ORBIT & BURNING FOR EARTH');
                  if (soundEnabled) soundFx.playReactorStart();
                  setTimeout(() => {
                    setMissionPhase('REENTRY_PLASMA');
                    setFlightAltM(65000);
                    setFlightSpeedMs(7800);
                    setFlightVyMs(-250);
                    setThrottle(0);
                    setDirectorCallout('🔥 HYPERSONIC RE-ENTRY INTERFACE — HEAT SHIELD ACTIVE');
                  }, 4000);
                }}
                style={{
                  padding: '12px 22px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  border: '1.5px solid #34d399',
                  color: '#ffffff',
                  fontSize: '12px',
                  fontWeight: 900,
                  cursor: 'pointer',
                  boxShadow: '0 0 25px rgba(16, 185, 129, 0.6)',
                }}
              >
                BOARD ASCENT MODULE & RETURN TO EARTH ▶
              </button>
            )}
          </div>
        )}

        {/* Retry on Crash */}
        {touchdownStatus === 'CRASHED' && (
          <button
            onClick={() => {
              setTouchdownStatus('FLYING');
              setFlightAltM(3500);
              setFlightVyMs(-65);
              setThrottle(40);
              setDirectorCallout('⚠️ RETRYING DESCENT: KEEP DOWNWARD VELOCITY UNDER 3.5 m/s!');
            }}
            style={{
              padding: '12px 24px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #ef4444, #b91c1c)',
              border: '1.5px solid #f87171',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 900,
              cursor: 'pointer',
              boxShadow: '0 0 25px rgba(239, 68, 68, 0.7)',
            }}
          >
            🔄 RETRY POWERED DESCENT FROM 3,500 M
          </button>
        )}
      </div>
    </div>
  );
};
