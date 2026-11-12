// ============================================================================
// FullMissionLifecycleModal.tsx — NASA Complete 4-Expedition Survival System
// 100% Manual Flight Controls: Throttle ([W]/[S]/[Z]/[X]), Pitch ([A]/[D]),
// Staging ([SPACE]), Landing Gear ([G]), Parachutes ([P]), Real Newtonian Physics
// Modeled directly after Ellipse: Rocket Simulator (YouTube: qXYpltxSTK0)
// Built for NASA Space Apps Challenge 2026 · Team Mysterio
// ============================================================================

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import confetti from 'canvas-confetti';
import {
  X,
  Rocket,
  Shield,
  Wind,
  CloudLightning,
  Compass,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
  Award,
  ChevronRight,
  Flame,
  Radio,
  Layers,
  Thermometer,
  Gauge,
  Sun,
  Eye,
  Flag,
  Wrench,
  Sparkles,
} from 'lucide-react';

import {
  type ExpeditionDestination,
  type LifecycleStage,
  type RocketBooster,
  type RocketCoreStage,
  type RocketUpperStage,
  type ScienceEquipment,
  type HeatShieldParachuteConfig,
  type RocketConfigSelection,
  type RocketPhysicsMetrics,
  type LaunchPadWeatherReport,
  VAB_BOOSTERS,
  VAB_CORE_STAGES,
  VAB_UPPER_STAGES,
  VAB_SCIENCE_EQUIPMENT,
  VAB_REENTRY_CONFIGS,
  DESTINATION_PROFILES,
  calculateRocketPhysics,
  generateLaunchWeather,
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

export const FullMissionLifecycleModal: React.FC<FullMissionLifecycleModalProps> = ({
  isOpen,
  onClose,
  onMissionCompleted,
  initialDestination = 'MOON',
}) => {
  // Destination selection: 4 progressive manual missions
  const [destination, setDestination] = useState<ExpeditionDestination>(initialDestination);
  const [currentStage, setCurrentStage] = useState<LifecycleStage>('VAB_BUILD');
  const [soundEnabled, setSoundEnabled] = useState(true);

  // VAB Configuration state
  const [selectedBooster, setSelectedBooster] = useState<RocketBooster>(VAB_BOOSTERS[0]);
  const [selectedCore, setSelectedCore] = useState<RocketCoreStage>(VAB_CORE_STAGES[0]);
  const [selectedUpper, setSelectedUpper] = useState<RocketUpperStage>(VAB_UPPER_STAGES[0]);
  const [selectedEquip, setSelectedEquip] = useState<ScienceEquipment[]>([
    VAB_SCIENCE_EQUIPMENT[0],
    VAB_SCIENCE_EQUIPMENT[1],
    VAB_SCIENCE_EQUIPMENT[4],
  ]);
  const [selectedReentry, setSelectedReentry] = useState<HeatShieldParachuteConfig>(VAB_REENTRY_CONFIGS[0]);
  const [crewCount, setCrewCount] = useState<number>(3);

  // Weather state
  const [weatherAttempt, setWeatherAttempt] = useState<number>(0);
  const weatherReport = useMemo(() => generateLaunchWeather(weatherAttempt), [weatherAttempt]);

  // ─────────────────────────────────────────────────────────────────────────
  // REAL-TIME MANUAL FLIGHT PHYSICS STATE (Ascent, Landing, Re-entry)
  // ─────────────────────────────────────────────────────────────────────────
  const [throttle, setThrottle] = useState<number>(100); // 0 to 100%
  const [pitchDeg, setPitchDeg] = useState<number>(90); // 90° = vertical up, 0° = horizontal
  const [flightAltM, setFlightAltM] = useState<number>(0);
  const [flightVelMs, setFlightVelMs] = useState<number>(0);
  const [flightVyMs, setFlightVyMs] = useState<number>(0);
  const [flightVxMs, setFlightVxMs] = useState<number>(0);
  const [flightFuelPct, setFlightFuelPct] = useState<number>(100);
  const [rocketStage, setRocketStage] = useState<1 | 2 | 3>(1); // 1 = Boosters, 2 = Core, 3 = Upper/Lander
  const [landingLegsDeployed, setLandingLegsDeployed] = useState<boolean>(false);
  const [parachutesDeployed, setParachutesDeployed] = useState<boolean>(false);
  const [touchdownStatus, setTouchdownStatus] = useState<'FLYING' | 'LANDED_SAFE' | 'LANDED_HARD' | 'CRASHED'>('FLYING');
  const [missionCallout, setMissionCallout] = useState<string>('T-0 LIFTOFF! ENGINES FULL THROUST');
  const [flightTimeSec, setFlightTimeSec] = useState<number>(0);
  const [hasReachedOrbitOrBoundary, setHasReachedOrbitOrBoundary] = useState<boolean>(false);

  // Stage 6 Surface EVA Tasks
  const [evaTasks, setEvaTasks] = useState<{ flagPlanted: boolean; sampleDrilled: boolean; sensorDeployed: boolean; roverDriven: boolean }>({
    flagPlanted: false,
    sampleDrilled: false,
    sensorDeployed: false,
    roverDriven: false,
  });

  // Stage 8 Splashdown finished
  const [hasSplashedDown, setHasSplashedDown] = useState<boolean>(false);

  // Three.js Mount reference
  const mountRef = useRef<HTMLDivElement>(null);

  // Mutable refs for 60fps physics & Three.js animations
  const flightPhysRef = useRef({
    throttle: 100,
    pitchDeg: 90,
    altM: 0,
    velMs: 0,
    vyMs: 0,
    vxMs: 0,
    fuelPct: 100,
    stage: 1 as 1 | 2 | 3,
    legsDeployed: false,
    chutesDeployed: false,
    touchdown: 'FLYING' as 'FLYING' | 'LANDED_SAFE' | 'LANDED_HARD' | 'CRASHED',
    boostersSeparated: false,
    boosterSepOffset: 0,
  });

  // Sync state with mutable ref
  useEffect(() => {
    flightPhysRef.current.throttle = throttle;
  }, [throttle]);

  useEffect(() => {
    flightPhysRef.current.pitchDeg = pitchDeg;
  }, [pitchDeg]);

  useEffect(() => {
    flightPhysRef.current.legsDeployed = landingLegsDeployed;
  }, [landingLegsDeployed]);

  useEffect(() => {
    flightPhysRef.current.chutesDeployed = parachutesDeployed;
  }, [parachutesDeployed]);

  // Dynamic Stage Steps depending on Destination
  const activeStageSteps = useMemo(() => {
    if (destination === 'SUBORBITAL') {
      return [
        { stage: 'VAB_BUILD' as LifecycleStage, label: '1. VAB Build', number: 1 },
        { stage: 'PAD_WEATHER' as LifecycleStage, label: '2. Pad Weather', number: 2 },
        { stage: 'ASCENT_STAGING' as LifecycleStage, label: '3. 100km Kármán Punch', number: 3 },
        { stage: 'EARTH_RETURN' as LifecycleStage, label: '4. Parachute Splashdown', number: 4 },
      ];
    }
    if (destination === 'ORBITAL') {
      return [
        { stage: 'VAB_BUILD' as LifecycleStage, label: '1. VAB Build', number: 1 },
        { stage: 'PAD_WEATHER' as LifecycleStage, label: '2. Pad Weather', number: 2 },
        { stage: 'ASCENT_STAGING' as LifecycleStage, label: '3. Staged LEO Insertion', number: 3 },
        { stage: 'DEEP_SPACE_CRUISE' as LifecycleStage, label: '4. 200km Orbit & De-orbit', number: 4 },
        { stage: 'EARTH_RETURN' as LifecycleStage, label: '5. Parachute Splashdown', number: 5 },
      ];
    }
    // Moon & Mars: Full 8-stage expedition
    return [
      { stage: 'VAB_BUILD' as LifecycleStage, label: '1. VAB Build', number: 1 },
      { stage: 'PAD_WEATHER' as LifecycleStage, label: '2. Pad Weather', number: 2 },
      { stage: 'ASCENT_STAGING' as LifecycleStage, label: '3. Liftoff & Orbit', number: 3 },
      { stage: 'DEEP_SPACE_CRUISE' as LifecycleStage, label: '4. Deep Cruise', number: 4 },
      { stage: 'DESCENT_LANDING' as LifecycleStage, label: '5. Powered Landing', number: 5 },
      { stage: 'SURFACE_EVA' as LifecycleStage, label: '6. Surface EVA', number: 6 },
      { stage: 'SURFACE_ASCENT' as LifecycleStage, label: '7. Surface Liftoff', number: 7 },
      { stage: 'EARTH_RETURN' as LifecycleStage, label: '8. Earth Splashdown', number: 8 },
    ];
  }, [destination]);

  // Calculate live rocket physics
  const rocketConfig: RocketConfigSelection = useMemo(() => ({
    destination,
    booster: selectedBooster,
    coreStage: selectedCore,
    upperStage: selectedUpper,
    selectedEquipment: selectedEquip,
    reentryConfig: selectedReentry,
    crewCount,
  }), [destination, selectedBooster, selectedCore, selectedUpper, selectedEquip, selectedReentry, crewCount]);

  const physics = useMemo(() => calculateRocketPhysics(rocketConfig), [rocketConfig]);
  const destProfile = DESTINATION_PROFILES[destination];

  // ─────────────────────────────────────────────────────────────────────────
  // STAGE TRANSITION RESET LOGIC
  // ─────────────────────────────────────────────────────────────────────────
  const initStagePhysics = useCallback((stage: LifecycleStage) => {
    if (stage === 'ASCENT_STAGING') {
      flightPhysRef.current = {
        throttle: 100,
        pitchDeg: 90,
        altM: 100,
        velMs: 50,
        vyMs: 50,
        vxMs: 0,
        fuelPct: 100,
        stage: 1,
        legsDeployed: false,
        chutesDeployed: false,
        touchdown: 'FLYING',
        boostersSeparated: false,
        boosterSepOffset: 0,
      };
      setThrottle(100);
      setPitchDeg(90);
      setFlightAltM(100);
      setFlightVelMs(50);
      setFlightVyMs(50);
      setFlightVxMs(0);
      setFlightFuelPct(100);
      setRocketStage(1);
      setTouchdownStatus('FLYING');
      setHasReachedOrbitOrBoundary(false);
      setMissionCallout('🔥 T-0 LIFTOFF! CLEARING LAUNCH TOWER — STEER GRAVITY TURN!');
    } else if (stage === 'DESCENT_LANDING') {
      flightPhysRef.current = {
        throttle: 40,
        pitchDeg: 90,
        altM: destination === 'MARS' ? 5000 : 3500,
        velMs: 85,
        vyMs: -75,
        vxMs: 15,
        fuelPct: 55,
        stage: 3,
        legsDeployed: false,
        chutesDeployed: false,
        touchdown: 'FLYING',
        boostersSeparated: true,
        boosterSepOffset: 10,
      };
      setThrottle(40);
      setPitchDeg(90);
      setFlightAltM(destination === 'MARS' ? 5000 : 3500);
      setFlightVelMs(85);
      setFlightVyMs(-75);
      setFlightVxMs(15);
      setFlightFuelPct(55);
      setRocketStage(3);
      setLandingLegsDeployed(false);
      setTouchdownStatus('FLYING');
      setMissionCallout('⚠️ RETRO DESCENT: THROTTLE DOWN TO TOUCH DOWN < 3.5 m/s!');
    } else if (stage === 'EARTH_RETURN') {
      flightPhysRef.current = {
        throttle: 0,
        pitchDeg: 90,
        altM: 85000,
        velMs: 7800,
        vyMs: -450,
        vxMs: 7700,
        fuelPct: 15,
        stage: 3,
        legsDeployed: false,
        chutesDeployed: false,
        touchdown: 'FLYING',
        boostersSeparated: true,
        boosterSepOffset: 20,
      };
      setThrottle(0);
      setFlightAltM(85000);
      setFlightVelMs(7800);
      setFlightVyMs(-450);
      setFlightVxMs(7700);
      setParachutesDeployed(false);
      setHasSplashedDown(false);
      setTouchdownStatus('FLYING');
      setMissionCallout('🔥 HYPERSONIC RE-ENTRY INTERFACE — HEAT SHIELD ACTIVE');
    }
  }, [destination]);

  // Handle stage change
  const handleSetStage = (stage: LifecycleStage) => {
    setCurrentStage(stage);
    initStagePhysics(stage);
    if (soundEnabled) soundFx.playReactorStart();
  };

  // Keyboard Shortcuts for Flight Controls
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      // Flight keys active during Ascent, Landing, and Earth Return
      const isFlying = ['ASCENT_STAGING', 'DESCENT_LANDING', 'SURFACE_ASCENT', 'EARTH_RETURN'].includes(currentStage);
      if (!isFlying) return;

      // Throttle controls
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
        if (soundEnabled) soundFx.playThruster();
      } else if (e.key === 'x' || e.key === 'X') {
        e.preventDefault();
        setThrottle(0);
      }

      // Pitch steering
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
        handleManualStageSeparation();
      }

      // Landing Gear: [G]
      else if (e.key === 'g' || e.key === 'G') {
        e.preventDefault();
        setLandingLegsDeployed((prev) => !prev);
        if (soundEnabled) soundFx.playClick(750);
      }

      // Parachute: [P]
      else if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        handleDeployParachutes();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStage, soundEnabled, onClose]);

  // Staging Action
  const handleManualStageSeparation = () => {
    if (rocketStage === 1) {
      setRocketStage(2);
      flightPhysRef.current.stage = 2;
      flightPhysRef.current.boostersSeparated = true;
      setMissionCallout('✨ SOLID BOOSTER JETTISON! CORE STAGE IGNITION');
      if (soundEnabled) soundFx.playReactorStart();
    } else if (rocketStage === 2) {
      setRocketStage(3);
      flightPhysRef.current.stage = 3;
      setMissionCallout('⚡ STAGE 2 SEPARATION! UPPER VACUUM STAGE IGNITED');
      if (soundEnabled) soundFx.playReactorStart();
    }
  };

  // Parachute Action
  const handleDeployParachutes = () => {
    if (flightPhysRef.current.altM <= 6000 && !parachutesDeployed) {
      setParachutesDeployed(true);
      flightPhysRef.current.chutesDeployed = true;
      setMissionCallout('🪂 TRIPLE MAIN PARACHUTES DEPLOYED! TERMINAL VELOCITY 6.5 m/s');
      if (soundEnabled) soundFx.playReactorStart();
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // THREE.JS 3D VIEWPORT ENGINE WITH LIVE 60 FPS MANUAL FLIGHT LOOP
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen || !mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth > 0 ? container.clientWidth : window.innerWidth;
    const height = container.clientHeight > 0 ? container.clientHeight : 500;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x020617, 0.0006);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 10000);
    camera.position.set(0, 4, 18);

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

    // Lights
    const sunLight = new THREE.DirectionalLight(0xffffff, 2.5);
    sunLight.position.set(40, 60, 50);
    scene.add(sunLight);

    const ambientLight = new THREE.AmbientLight(0x38bdf8, 0.6);
    scene.add(ambientLight);

    // 1. STARFIELD
    const starCount = 2000;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starPos[i] = (Math.random() - 0.5) * 4500;
      starPos[i + 1] = (Math.random() - 0.5) * 4500;
      starPos[i + 2] = (Math.random() - 0.5) * 4500;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 2.2 });
    const starPoints = new THREE.Points(starGeo, starMat);
    scene.add(starPoints);

    // 2. ROCKET GROUP
    const rocketGroup = new THREE.Group();
    scene.add(rocketGroup);

    // Capsule
    const capGeo = new THREE.ConeGeometry(0.8, 1.4, 20);
    const capMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.8, roughness: 0.2 });
    const capMesh = new THREE.Mesh(capGeo, capMat);
    capMesh.position.y = 3.6;
    rocketGroup.add(capMesh);

    // Upper Stage
    const upGeo = new THREE.CylinderGeometry(0.8, 0.8, 1.8, 20);
    const upMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.6, roughness: 0.3 });
    const upMesh = new THREE.Mesh(upGeo, upMat);
    upMesh.position.y = 2.0;
    rocketGroup.add(upMesh);

    // Core Stage
    const coreGeo = new THREE.CylinderGeometry(1.0, 1.0, 4.2, 24);
    const coreMat = new THREE.MeshStandardMaterial({
      color: selectedCore.propellant === 'LH2_LOX' ? 0xd97706 : 0xf8fafc,
      metalness: 0.4,
      roughness: 0.4,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    coreMesh.position.y = -0.9;
    rocketGroup.add(coreMesh);

    // Boosters
    const bGeo = new THREE.CylinderGeometry(0.45, 0.45, 3.8, 16);
    const bMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.7, roughness: 0.3 });
    const bLeft = new THREE.Mesh(bGeo, bMat);
    bLeft.position.set(-1.45, -0.9, 0);
    const bRight = new THREE.Mesh(bGeo, bMat);
    bRight.position.set(1.45, -0.9, 0);
    rocketGroup.add(bLeft, bRight);

    // Landing Legs (Left & Right)
    const legGeo = new THREE.CylinderGeometry(0.08, 0.08, 2.2, 8);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.9, roughness: 0.2 });
    const legLeft = new THREE.Mesh(legGeo, legMat);
    legLeft.position.set(-1.0, -2.6, 0);
    legLeft.rotation.z = 0.2;
    const legRight = new THREE.Mesh(legGeo, legMat);
    legRight.position.set(1.0, -2.6, 0);
    legRight.rotation.z = -0.2;
    rocketGroup.add(legLeft, legRight);

    // Engine Plume Flames
    const flameGeo = new THREE.ConeGeometry(0.7, 3.0, 16);
    const flameMat = new THREE.MeshBasicMaterial({ color: 0xf97316, transparent: true, opacity: 0 });
    const flameMesh = new THREE.Mesh(flameGeo, flameMat);
    flameMesh.rotation.x = Math.PI;
    flameMesh.position.y = -4.5;
    rocketGroup.add(flameMesh);

    // Parachute Mesh (deployed on re-entry/landing)
    const chuteGeo = new THREE.SphereGeometry(2.8, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.5);
    const chuteMat = new THREE.MeshStandardMaterial({ color: 0xf97316, side: THREE.DoubleSide });
    const chuteMesh = new THREE.Mesh(chuteGeo, chuteMat);
    chuteMesh.position.set(0, 6.5, 0);
    chuteMesh.rotation.x = Math.PI;
    chuteMesh.visible = false;
    rocketGroup.add(chuteMesh);

    // 3. PLANET / TERRAIN
    const planetGeo = new THREE.SphereGeometry(24, 64, 64);
    let planetColor = 0x1d4ed8; // Earth
    if (destination === 'MOON') planetColor = 0x64748b;
    else if (destination === 'MARS') planetColor = 0xb91c1c;

    const planetMat = new THREE.MeshStandardMaterial({ color: planetColor, roughness: 0.8, metalness: 0.1 });
    const planetMesh = new THREE.Mesh(planetGeo, planetMat);
    planetMesh.position.set(0, -28, -15);
    scene.add(planetMesh);

    // ─────────────────────────────────────────────────────────────────────────
    // 60 FPS FLIGHT SIMULATOR LOOP (REAL NEWTONIAN DYNAMICS)
    // ─────────────────────────────────────────────────────────────────────────
    let animId: number;
    let lastTime = performance.now();

    const animate = (time: number) => {
      animId = requestAnimationFrame(animate);
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      const p = flightPhysRef.current;

      // Starfield rotation
      starPoints.rotation.y += 0.0001;

      // 1. VAB BUILD STAGE
      if (currentStage === 'VAB_BUILD') {
        rocketGroup.rotation.y += 0.01;
        rocketGroup.rotation.z = 0;
        flameMat.opacity = 0;
        chuteMesh.visible = false;
        planetMesh.visible = false;
        camera.position.set(0, 1, 14);
        camera.lookAt(0, 0.5, 0);
      }
      // 2. PAD WEATHER STAGE
      else if (currentStage === 'PAD_WEATHER') {
        rocketGroup.rotation.y = 0;
        rocketGroup.rotation.z = 0;
        flameMat.opacity = 0;
        chuteMesh.visible = false;
        planetMesh.visible = false;
        camera.position.set(4, 0, 13);
        camera.lookAt(0, 0, 0);
      }
      // 3. ASCENT / STAGING (100% MANUAL REAL-TIME PHYSICS)
      else if (currentStage === 'ASCENT_STAGING') {
        // Physical parameters
        const g0 = 9.81;
        const currentThrustKn = p.stage === 1
          ? selectedBooster.thrustKn + selectedCore.thrustKn
          : p.stage === 2
          ? selectedCore.thrustKn
          : selectedUpper.thrustKn;

        const throttleNorm = p.throttle / 100;
        const pitchRad = (p.pitchDeg * Math.PI) / 180;

        // Fuel burn
        if (p.fuelPct > 0 && throttleNorm > 0) {
          const burnRate = p.stage === 1 ? 0.35 : 0.25;
          p.fuelPct = Math.max(0, p.fuelPct - throttleNorm * burnRate * dt * 10);
        }

        const effectiveThrustKn = p.fuelPct > 0 ? currentThrustKn * throttleNorm : 0;
        const totalMassTons = physics.totalLiftoffMassTons * (0.3 + 0.7 * (p.fuelPct / 100));

        // Atmospheric drag (decays with altitude)
        const density = Math.exp(-p.altM / 8500);
        const dragN = 0.5 * density * 1.225 * (p.velMs ** 2) * 0.3 * 4.0;
        const dragKn = dragN / 1000;

        // Accelerations
        const aThrust = effectiveThrustKn / totalMassTons;
        const aDrag = dragKn / totalMassTons;
        const ay = aThrust * Math.sin(pitchRad) - (aDrag * (p.vyMs / Math.max(1, p.velMs))) - g0;
        const ax = aThrust * Math.cos(pitchRad) - (aDrag * (p.vxMs / Math.max(1, p.velMs)));

        p.vyMs += ay * dt;
        p.vxMs += ax * dt;
        p.velMs = Math.sqrt(p.vyMs ** 2 + p.vxMs ** 2);
        p.altM = Math.max(0, p.altM + p.vyMs * dt);

        // Booster visual separation offset
        if (p.boostersSeparated) {
          p.boosterSepOffset += dt * 4;
          bLeft.position.x = -1.45 - p.boosterSepOffset;
          bRight.position.x = 1.45 + p.boosterSepOffset;
          bLeft.position.y -= dt * 2;
          bRight.position.y -= dt * 2;
        }

        // Three.js visuals
        rocketGroup.rotation.z = -pitchRad + Math.PI / 2;
        flameMat.opacity = effectiveThrustKn > 0 ? 0.95 : 0;
        flameMesh.scale.set(throttleNorm, throttleNorm * (1.2 + Math.random() * 0.4), throttleNorm);

        planetMesh.visible = true;
        planetMesh.position.set(0, -35 - p.altM / 10000, -25);
        camera.position.set(0, -1, 16);
        camera.lookAt(0, 1, 0);

        // Sub-orbital 100 km boundary check
        if (destination === 'SUBORBITAL' && p.altM >= 100000 && !p.touchdown) {
          setHasReachedOrbitOrBoundary(true);
          setMissionCallout('🎉 KÁRMÁN BOUNDARY PASSED (100+ km)! ENTERED MICROGRAVITY SPACE');
        }

        // Orbital speed check (7.75 km/s)
        if (p.velMs >= 7750 && p.altM >= 180000) {
          setHasReachedOrbitOrBoundary(true);
          setMissionCallout('🌍 ORBIT INSERTION CONFIRMED! 200x200 km CIRCULAR LOW EARTH ORBIT');
        }
      }
      // 4. DEEP SPACE CRUISE
      else if (currentStage === 'DEEP_SPACE_CRUISE') {
        rocketGroup.rotation.z = Math.PI / 2;
        flameMat.opacity = 0.2;
        planetMesh.visible = true;
        planetMesh.position.set(15, -10, -40);
        camera.position.set(0, 3, 16);
        camera.lookAt(0, 0, 0);
      }
      // 5. MANUAL POWERED DESCENT & LANDING
      else if (currentStage === 'DESCENT_LANDING') {
        const gSurface = destination === 'MARS' ? 3.72 : 1.62;
        const throttleNorm = p.throttle / 100;

        if (p.touchdown === 'FLYING') {
          // Fuel burn
          if (p.fuelPct > 0 && throttleNorm > 0) {
            p.fuelPct = Math.max(0, p.fuelPct - throttleNorm * 0.15 * dt * 10);
          }

          const maxThrustAcc = 14.0; // m/s^2 deceleration capacity
          const effectiveThrustAcc = p.fuelPct > 0 ? throttleNorm * maxThrustAcc : 0;

          // Downward gravity vs upward thrust
          const ay = effectiveThrustAcc - gSurface;
          p.vyMs += ay * dt;
          p.altM = Math.max(0, p.altM + p.vyMs * dt);
          p.vxMs = Math.max(0, p.vxMs - dt * 1.5);
          p.velMs = Math.sqrt(p.vyMs ** 2 + p.vxMs ** 2);

          // Landing Leg animation
          if (p.legsDeployed) {
            legLeft.position.y = -3.2;
            legRight.position.y = -3.2;
          }

          // Touchdown detection
          if (p.altM <= 0) {
            p.altM = 0;
            const downwardSpeed = Math.abs(p.vyMs);

            if (!p.legsDeployed) {
              p.touchdown = 'CRASHED';
              setTouchdownStatus('CRASHED');
              setMissionCallout('💥 CRASH! LANDING GEAR WAS NOT DEPLOYED! PRESS [G] & RETRY');
              if (soundEnabled) soundFx.playReactorStart();
            } else if (downwardSpeed <= 3.5) {
              p.touchdown = 'LANDED_SAFE';
              setTouchdownStatus('LANDED_SAFE');
              setMissionCallout('🎉 NOMINAL TOUCHDOWN (< 3.5 m/s)! WELCOME TO THE SURFACE');
              confetti({ particleCount: 150, spread: 80 });
              if (soundEnabled) soundFx.playVictory();
            } else if (downwardSpeed <= 6.0) {
              p.touchdown = 'LANDED_HARD';
              setTouchdownStatus('LANDED_HARD');
              setMissionCallout('⚠️ HARD LANDING (3.5–6.0 m/s). Minor structural strain, but survived!');
              if (soundEnabled) soundFx.playVictory();
            } else {
              p.touchdown = 'CRASHED';
              setTouchdownStatus('CRASHED');
              setMissionCallout(`💥 CATASTROPHIC IMPACT: Touchdown speed (${downwardSpeed.toFixed(1)} m/s) exceeded 6 m/s!`);
              if (soundEnabled) soundFx.playReactorStart();
            }
          }
        }

        // Three.js visuals
        rocketGroup.rotation.z = 0;
        flameMat.opacity = p.touchdown === 'FLYING' && throttleNorm > 0 ? 0.9 : 0;
        flameMesh.scale.set(throttleNorm, throttleNorm * 1.6, throttleNorm);

        planetMesh.visible = true;
        planetMesh.position.set(0, -23, -5);
        camera.position.set(0, 2, 12);
        camera.lookAt(0, -1, 0);
      }
      // 6. SURFACE EVA
      else if (currentStage === 'SURFACE_EVA') {
        rocketGroup.position.set(-3, -1, 0);
        rocketGroup.rotation.z = 0;
        flameMat.opacity = 0;
        planetMesh.visible = true;
        planetMesh.position.set(0, -20, 0);
        camera.position.set(0, 0.5, 10);
        camera.lookAt(0, 0, 0);
      }
      // 7. SURFACE ASCENT
      else if (currentStage === 'SURFACE_ASCENT') {
        rocketGroup.position.set(0, 2, 0);
        rocketGroup.rotation.z = -0.3;
        flameMat.opacity = 0.95;
        planetMesh.visible = true;
        camera.position.set(0, 0, 15);
        camera.lookAt(0, 1, 0);
      }
      // 8. EARTH RE-ENTRY & SPLASHDOWN
      else if (currentStage === 'EARTH_RETURN') {
        flameMat.opacity = 0;
        rocketGroup.rotation.z = Math.PI; // heat shield forward

        if (!hasSplashedDown) {
          // Fall through atmosphere
          const terminalVel = p.chutesDeployed ? -6.5 : -120;
          p.vyMs += (terminalVel - p.vyMs) * dt * 0.8;
          p.altM = Math.max(0, p.altM + p.vyMs * dt * 4);
          p.velMs = Math.abs(p.vyMs);

          // Parachute mesh visibility
          chuteMesh.visible = p.chutesDeployed;

          if (p.altM <= 0) {
            p.altM = 0;
            setHasSplashedDown(true);
            setMissionCallout('🎉 SPLASHDOWN CONFIRMED! US NAVY RETRIEVAL TEAMS EN ROUTE');
            confetti({ particleCount: 180, spread: 90 });
            if (soundEnabled) soundFx.playVictory();
            awardCadetCredits(1200);
            onMissionCompleted?.(destination, 1200);
          }
        }

        planetMesh.visible = true;
        planetMesh.material = new THREE.MeshStandardMaterial({ color: 0x1d4ed8 });
        planetMesh.position.set(0, -22, 0);
        camera.position.set(0, 2, 11);
        camera.lookAt(0, 0, 0);
      }

      // Sync React state periodically for telemetry HUD
      setFlightAltM(Math.round(p.altM));
      setFlightVelMs(Math.round(p.velMs));
      setFlightVyMs(Number(p.vyMs.toFixed(1)));
      setFlightVxMs(Number(p.vxMs.toFixed(1)));
      setFlightFuelPct(Math.round(p.fuelPct));

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(animate);

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      disposeThreeScene(renderer, scene, container);
    };
  }, [isOpen, currentStage, destination, selectedCore.propellant, physics.totalLiftoffMassTons, onMissionCompleted, soundEnabled, hasSplashedDown]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 13500,
        backgroundColor: '#020617',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'var(--font-mono, monospace)',
        overflow: 'hidden',
        color: '#f8fafc',
      }}
    >
      {/* ─── TOP MASTER NAVBAR & EXPEDITION TRACKER ─── */}
      <header
        style={{
          background: 'rgba(10, 15, 26, 0.96)',
          borderBottom: '1.5px solid rgba(56, 189, 248, 0.3)',
          padding: '10px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backdropFilter: 'blur(16px)',
          zIndex: 40,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #2563eb, #1e40af)',
              border: '1.5px solid #38bdf8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              boxShadow: '0 0 20px rgba(56, 189, 248, 0.4)',
            }}
          >
            🚀
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 900, color: '#f8fafc', fontFamily: 'var(--font-space)' }}>
              NASA SURVIVAL EXPEDITIONS <span style={{ color: '#38bdf8' }}>[{destProfile.name}]</span>
            </div>
            <div style={{ fontSize: '10px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>{destProfile.badge}</span>
              <span>•</span>
              <span style={{ color: '#fbbf24' }}>100% MANUAL REAL-TIME CONTROLS</span>
              <span>•</span>
              <span style={{ color: '#4ade80' }}>ELLIPSE SIMULATOR HERITAGE</span>
            </div>
          </div>
        </div>

        {/* 4 Mission Quick Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {(['SUBORBITAL', 'ORBITAL', 'MOON', 'MARS'] as ExpeditionDestination[]).map((dest, idx) => {
            const isSel = destination === dest;
            const labels = ['1. Sub-Orbital', '2. LEO Orbit', '3. Lunar Voyager', '4. Mars Voyager'];
            return (
              <button
                key={dest}
                onClick={() => {
                  setDestination(dest);
                  setCurrentStage('VAB_BUILD');
                  if (soundEnabled) soundFx.playClick(850);
                }}
                style={{
                  padding: '5px 10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 900,
                  cursor: 'pointer',
                  border: isSel ? '1.5px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)',
                  background: isSel ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255,255,255,0.03)',
                  color: isSel ? '#ffffff' : '#94a3b8',
                  boxShadow: isSel ? '0 0 12px rgba(56, 189, 248, 0.4)' : 'none',
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
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '8px',
              padding: '6px 10px',
              color: soundEnabled ? '#38bdf8' : '#64748b',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11px',
            }}
          >
            {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
          </button>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(239, 68, 68, 0.2)',
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

      {/* ─── STAGE PROGRESSION BREADCRUMBS ─── */}
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.9)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '6px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          overflowX: 'auto',
        }}
      >
        {activeStageSteps.map((step) => {
          const isActive = step.stage === currentStage;
          const isPassed = activeStageSteps.findIndex((s) => s.stage === step.stage) < activeStageSteps.findIndex((s) => s.stage === currentStage);
          return (
            <div
              key={step.stage}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '10px',
                fontWeight: 800,
                background: isActive
                  ? 'rgba(56, 189, 248, 0.25)'
                  : isPassed
                  ? 'rgba(16, 185, 129, 0.15)'
                  : 'rgba(255, 255, 255, 0.03)',
                border: isActive
                  ? '1.5px solid #38bdf8'
                  : isPassed
                  ? '1px solid #10b981'
                  : '1px solid rgba(255, 255, 255, 0.08)',
                color: isActive ? '#ffffff' : isPassed ? '#34d399' : '#64748b',
                whiteSpace: 'nowrap',
              }}
            >
              {isPassed ? '✓ ' : ''}{step.label}
            </div>
          );
        })}
      </div>

      {/* ─── MAIN DUAL-PANE VIEWPORT ─── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left Half: 3D Aerospace Canvas + Real-Time Flight HUD */}
        <div style={{ flex: 1.15, position: 'relative', overflow: 'hidden', borderRight: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <div ref={mountRef} style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }} />

          {/* Callout Banner at Top of Canvas */}
          <div
            style={{
              position: 'absolute',
              top: '14px',
              left: '14px',
              right: '14px',
              background: 'rgba(10, 15, 26, 0.85)',
              border: '1.5px solid rgba(56, 189, 248, 0.4)',
              borderRadius: '8px',
              padding: '8px 14px',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              zIndex: 10,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '14px' }}>📡</span>
              <span style={{ fontSize: '11px', fontWeight: 900, color: '#f8fafc', letterSpacing: '0.03em' }}>
                {missionCallout}
              </span>
            </div>
            <div style={{ fontSize: '10px', color: '#38bdf8', fontWeight: 800 }}>
              {activeStageSteps.find((s) => s.stage === currentStage)?.label}
            </div>
          </div>

          {/* Flight Instruments Telemetry HUD during active flight */}
          {['ASCENT_STAGING', 'DESCENT_LANDING', 'EARTH_RETURN'].includes(currentStage) && (
            <div
              style={{
                position: 'absolute',
                top: '58px',
                left: '14px',
                background: 'rgba(6, 9, 18, 0.88)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                borderRadius: '8px',
                padding: '10px 14px',
                backdropFilter: 'blur(8px)',
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '8px 16px',
                fontSize: '11px',
                zIndex: 10,
              }}
            >
              <div>
                <div style={{ fontSize: '9px', color: '#94a3b8' }}>ALTITUDE</div>
                <div style={{ fontSize: '16px', fontWeight: 900, color: '#38bdf8' }}>
                  {flightAltM >= 1000 ? `${(flightAltM / 1000).toFixed(1)} km` : `${flightAltM} m`}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '9px', color: '#94a3b8' }}>TOTAL VELOCITY</div>
                <div style={{ fontSize: '16px', fontWeight: 900, color: '#fbbf24' }}>
                  {flightVelMs >= 1000 ? `${(flightVelMs / 1000).toFixed(2)} km/s` : `${flightVelMs} m/s`}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '9px', color: '#94a3b8' }}>VERTICAL SPEED (Vy)</div>
                <div style={{ fontSize: '14px', fontWeight: 900, color: flightVyMs >= 0 ? '#4ade80' : '#f87171' }}>
                  {flightVyMs > 0 ? `+${flightVyMs}` : flightVyMs} m/s
                </div>
              </div>
              <div>
                <div style={{ fontSize: '9px', color: '#94a3b8' }}>PITCH ANGLE</div>
                <div style={{ fontSize: '14px', fontWeight: 900, color: '#ffffff' }}>
                  {pitchDeg}° {pitchDeg >= 80 ? '↑ Vertical' : pitchDeg <= 15 ? '→ Orbital' : '↗ Gravity Turn'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '9px', color: '#94a3b8' }}>PROPELLANT</div>
                <div style={{ fontSize: '14px', fontWeight: 900, color: flightFuelPct > 20 ? '#38bdf8' : '#ef4444' }}>
                  {flightFuelPct}%
                </div>
              </div>
              <div>
                <div style={{ fontSize: '9px', color: '#94a3b8' }}>ACTIVE STAGE</div>
                <div style={{ fontSize: '14px', fontWeight: 900, color: '#a78bfa' }}>
                  STAGE {rocketStage} / 3
                </div>
              </div>
            </div>
          )}

          {/* Interactive Cockpit Controls Overlay at Bottom of 3D Canvas */}
          {['ASCENT_STAGING', 'DESCENT_LANDING', 'EARTH_RETURN'].includes(currentStage) && (
            <div
              style={{
                position: 'absolute',
                bottom: '14px',
                left: '14px',
                right: '14px',
                background: 'rgba(6, 9, 18, 0.92)',
                border: '1.5px solid rgba(56, 189, 248, 0.4)',
                borderRadius: '12px',
                padding: '12px 18px',
                backdropFilter: 'blur(12px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
                zIndex: 20,
              }}
            >
              {/* Throttle Controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div>
                  <div style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 900 }}>THROTTLE [W/S/Z/X]</div>
                  <div style={{ fontSize: '14px', fontWeight: 900, color: throttle > 0 ? '#f97316' : '#64748b' }}>
                    {throttle}%
                  </div>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={throttle}
                  onChange={(e) => setThrottle(Number(e.target.value))}
                  style={{ width: '110px', accentColor: '#f97316', cursor: 'pointer' }}
                />
                <button
                  onClick={() => setThrottle(0)}
                  style={{
                    padding: '4px 8px',
                    fontSize: '9px',
                    fontWeight: 900,
                    borderRadius: '4px',
                    background: 'rgba(239,68,68,0.2)',
                    border: '1px solid #ef4444',
                    color: '#ffffff',
                    cursor: 'pointer',
                  }}
                  title="Cutoff Engine [X]"
                >
                  CUTOFF [X]
                </button>
                <button
                  onClick={() => setThrottle(100)}
                  style={{
                    padding: '4px 8px',
                    fontSize: '9px',
                    fontWeight: 900,
                    borderRadius: '4px',
                    background: 'rgba(249,115,22,0.2)',
                    border: '1px solid #f97316',
                    color: '#ffffff',
                    cursor: 'pointer',
                  }}
                  title="Max Throttle [Z]"
                >
                  MAX [Z]
                </button>
              </div>

              {/* Pitch Steering Controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => setPitchDeg((prev) => Math.min(90, prev + 5))}
                  style={{
                    padding: '6px 10px',
                    fontSize: '11px',
                    fontWeight: 900,
                    borderRadius: '6px',
                    background: 'rgba(56, 189, 248, 0.15)',
                    border: '1px solid #38bdf8',
                    color: '#ffffff',
                    cursor: 'pointer',
                  }}
                  title="Steer Up/Left [A]"
                >
                  ↰ PITCH +5° [A]
                </button>
                <button
                  onClick={() => setPitchDeg((prev) => Math.max(0, prev - 5))}
                  style={{
                    padding: '6px 10px',
                    fontSize: '11px',
                    fontWeight: 900,
                    borderRadius: '6px',
                    background: 'rgba(56, 189, 248, 0.15)',
                    border: '1px solid #38bdf8',
                    color: '#ffffff',
                    cursor: 'pointer',
                  }}
                  title="Steer Down/Right [D]"
                >
                  ↱ PITCH -5° [D]
                </button>
              </div>

              {/* Action Buttons: Staging, Landing Gear, Parachutes */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {currentStage === 'ASCENT_STAGING' && (
                  <button
                    onClick={handleManualStageSeparation}
                    style={{
                      padding: '8px 14px',
                      fontSize: '11px',
                      fontWeight: 900,
                      borderRadius: '6px',
                      background: 'linear-gradient(135deg, #a855f7, #7c3aed)',
                      border: '1px solid #c084fc',
                      color: '#ffffff',
                      cursor: 'pointer',
                      boxShadow: '0 0 15px rgba(168, 85, 247, 0.4)',
                    }}
                  >
                    ⚡ STAGE SEPARATION [SPACE]
                  </button>
                )}

                {currentStage === 'DESCENT_LANDING' && (
                  <button
                    onClick={() => {
                      setLandingLegsDeployed(!landingLegsDeployed);
                      if (soundEnabled) soundFx.playClick(750);
                    }}
                    style={{
                      padding: '8px 14px',
                      fontSize: '11px',
                      fontWeight: 900,
                      borderRadius: '6px',
                      background: landingLegsDeployed ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.2)',
                      border: landingLegsDeployed ? '1.5px solid #10b981' : '1.5px solid #ef4444',
                      color: '#ffffff',
                      cursor: 'pointer',
                    }}
                  >
                    🦿 LEGS: {landingLegsDeployed ? 'DEPLOYED [G]' : 'STOWED [G]'}
                  </button>
                )}

                {currentStage === 'EARTH_RETURN' && (
                  <button
                    onClick={handleDeployParachutes}
                    disabled={flightAltM > 6000 || parachutesDeployed}
                    style={{
                      padding: '8px 14px',
                      fontSize: '11px',
                      fontWeight: 900,
                      borderRadius: '6px',
                      background: parachutesDeployed
                        ? 'rgba(16, 185, 129, 0.3)'
                        : flightAltM <= 6000
                        ? 'linear-gradient(135deg, #f97316, #ea580c)'
                        : '#334155',
                      border: parachutesDeployed ? '1.5px solid #10b981' : '1px solid #f97316',
                      color: '#ffffff',
                      cursor: flightAltM <= 6000 && !parachutesDeployed ? 'pointer' : 'default',
                    }}
                  >
                    🪂 {parachutesDeployed ? 'CHUTES INFLATED [P]' : flightAltM <= 6000 ? 'DEPLOY CHUTE [P]' : 'CHUTE ARMED (< 6km)'}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Half: Interactive Mission Control & Phase UI */}
        <div
          style={{
            flex: 1.35,
            background: 'rgba(6, 9, 18, 0.96)',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
            padding: '22px',
          }}
        >
          {/* ═══════════════════════════════════════════════════════════════
              PHASE 1: VAB ROCKET BUILDER & EQUIPMENT SELECTION
              ═══════════════════════════════════════════════════════════════ */}
          {currentStage === 'VAB_BUILD' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 900, letterSpacing: '0.06em' }}>
                  STAGE 1: VEHICLE ASSEMBLY BUILDING (VAB)
                </div>
                <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#f8fafc', margin: '2px 0 6px 0', fontFamily: 'var(--font-space)' }}>
                  Assemble Your Exploration Rocket
                </h2>
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>
                  Choose your expedition profile, heavy-lift boosters, core sustainer, and science payloads.
                </p>
              </div>

              {/* 4 Mission Profile Selector Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button
                  onClick={() => { setDestination('SUBORBITAL'); if (soundEnabled) soundFx.playClick(850); }}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: destination === 'SUBORBITAL' ? '2px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)',
                    background: destination === 'SUBORBITAL' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255,255,255,0.03)',
                    color: destination === 'SUBORBITAL' ? '#ffffff' : '#94a3b8',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ fontSize: '13px', fontWeight: 900 }}>🚀 1. SUB-ORBITAL PIONEER</div>
                  <div style={{ fontSize: '10px', color: '#cbd5e1', marginTop: '2px' }}>100 km Kármán Boundary · Microgravity · Atlantic Splashdown</div>
                </button>

                <button
                  onClick={() => { setDestination('ORBITAL'); if (soundEnabled) soundFx.playClick(850); }}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: destination === 'ORBITAL' ? '2px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)',
                    background: destination === 'ORBITAL' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255,255,255,0.03)',
                    color: destination === 'ORBITAL' ? '#ffffff' : '#94a3b8',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ fontSize: '13px', fontWeight: 900 }}>🛰️ 2. ORBITAL PIONEER (LEO)</div>
                  <div style={{ fontSize: '10px', color: '#cbd5e1', marginTop: '2px' }}>200 km Circular Orbit · Multi-Stage Staging · De-Orbit</div>
                </button>

                <button
                  onClick={() => { setDestination('MOON'); if (soundEnabled) soundFx.playClick(850); }}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: destination === 'MOON' ? '2px solid #fbbf24' : '1px solid rgba(255,255,255,0.1)',
                    background: destination === 'MOON' ? 'rgba(251, 191, 36, 0.15)' : 'rgba(255,255,255,0.03)',
                    color: destination === 'MOON' ? '#ffffff' : '#94a3b8',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ fontSize: '13px', fontWeight: 900 }}>🌕 3. LUNAR VOYAGER (YOUTUBE)</div>
                  <div style={{ fontSize: '10px', color: '#cbd5e1', marginTop: '2px' }}>Earth Launch ➔ TLI ➔ Retro Touchdown ➔ EVA ➔ Earth Return</div>
                </button>

                <button
                  onClick={() => { setDestination('MARS'); if (soundEnabled) soundFx.playClick(850); }}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: destination === 'MARS' ? '2px solid #ef4444' : '1px solid rgba(255,255,255,0.1)',
                    background: destination === 'MARS' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255,255,255,0.03)',
                    color: destination === 'MARS' ? '#ffffff' : '#94a3b8',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ fontSize: '13px', fontWeight: 900 }}>🔴 4. MARS INTERPLANETARY</div>
                  <div style={{ fontSize: '10px', color: '#cbd5e1', marginTop: '2px' }}>Earth Launch ➔ TMI ➔ Mars EDL ➔ MOXIE EVA ➔ Earth Return</div>
                </button>
              </div>

              {/* Stage 1 Booster Selector */}
              <div>
                <label style={{ fontSize: '11px', fontWeight: 900, color: '#f8fafc', marginBottom: '6px', display: 'block' }}>
                  1. FIRST STAGE BOOSTERS:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {VAB_BOOSTERS.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => { setSelectedBooster(b); if (soundEnabled) soundFx.playClick(800); }}
                      style={{
                        padding: '10px',
                        borderRadius: '8px',
                        border: selectedBooster.id === b.id ? '1.5px solid #38bdf8' : '1px solid rgba(255,255,255,0.08)',
                        background: selectedBooster.id === b.id ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255,255,255,0.02)',
                        color: selectedBooster.id === b.id ? '#ffffff' : '#94a3b8',
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontSize: '11px',
                        fontWeight: 800,
                      }}
                    >
                      <div>{b.name}</div>
                      <div style={{ fontSize: '9px', color: '#38bdf8', marginTop: '4px' }}>{b.thrustKn.toLocaleString()} kN · Isp {b.ispSeaLevelSec}s</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Stage 2 Core Stage Selector */}
              <div>
                <label style={{ fontSize: '11px', fontWeight: 900, color: '#f8fafc', marginBottom: '6px', display: 'block' }}>
                  2. CORE SUSTAINER STAGE:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {VAB_CORE_STAGES.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => { setSelectedCore(c); if (soundEnabled) soundFx.playClick(800); }}
                      style={{
                        padding: '10px',
                        borderRadius: '8px',
                        border: selectedCore.id === c.id ? '1.5px solid #fbbf24' : '1px solid rgba(255,255,255,0.08)',
                        background: selectedCore.id === c.id ? 'rgba(251, 191, 36, 0.15)' : 'rgba(255,255,255,0.02)',
                        color: selectedCore.id === c.id ? '#ffffff' : '#94a3b8',
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontSize: '11px',
                        fontWeight: 800,
                      }}
                    >
                      <div>{c.name}</div>
                      <div style={{ fontSize: '9px', color: '#fbbf24', marginTop: '4px' }}>{c.thrustKn.toLocaleString()} kN · Isp {c.ispVacuumSec}s</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tsiolkovsky Physics Card */}
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.75)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  borderRadius: '10px',
                  padding: '12px 16px',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '12px',
                  textAlign: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: '9px', color: '#94a3b8' }}>TOTAL STACK MASS</div>
                  <div style={{ fontSize: '14px', fontWeight: 900, color: '#f8fafc' }}>
                    {physics.totalLiftoffMassTons.toLocaleString()} t
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '9px', color: '#94a3b8' }}>TOTAL DELTA-V (Δv)</div>
                  <div style={{ fontSize: '14px', fontWeight: 900, color: physics.totalDeltaVmS >= physics.requiredDeltaVmS ? '#4ade80' : '#ef4444' }}>
                    {physics.totalDeltaVmS.toLocaleString()} m/s
                  </div>
                  <div style={{ fontSize: '8.5px', color: '#94a3b8' }}>Req: {physics.requiredDeltaVmS.toLocaleString()} m/s</div>
                </div>
                <div>
                  <div style={{ fontSize: '9px', color: '#94a3b8' }}>LIFTOFF TWR</div>
                  <div style={{ fontSize: '14px', fontWeight: 900, color: physics.liftoffTWR >= 1.15 ? '#4ade80' : '#ef4444' }}>
                    {physics.liftoffTWR}x
                  </div>
                  <div style={{ fontSize: '8.5px', color: '#64748b' }}>Min: 1.15x</div>
                </div>
                <div>
                  <div style={{ fontSize: '9px', color: '#94a3b8' }}>STATUS</div>
                  <div style={{ fontSize: '14px', fontWeight: 900, color: physics.isMissionFeasible ? '#10b981' : '#ef4444' }}>
                    {physics.isMissionFeasible ? `READY (+${physics.feasibilityMarginPct}%)` : 'LOW Δv'}
                  </div>
                </div>
              </div>

              {/* Proceed to Pad Weather Button */}
              <button
                disabled={!physics.isMissionFeasible}
                onClick={() => handleSetStage('PAD_WEATHER')}
                style={{
                  padding: '14px',
                  borderRadius: '10px',
                  background: physics.isMissionFeasible ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : '#334155',
                  color: '#ffffff',
                  fontWeight: 900,
                  fontSize: '13px',
                  border: 'none',
                  cursor: physics.isMissionFeasible ? 'pointer' : 'not-allowed',
                  boxShadow: physics.isMissionFeasible ? '0 0 25px rgba(37, 99, 235, 0.5)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <span>ROLL OUT TO PAD 39B & VERIFY LAUNCH WEATHER</span>
                <ChevronRight size={16} />
              </button>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════
              PHASE 2: LAUNCH PAD WEATHER & METEOROLOGY
              ═══════════════════════════════════════════════════════════════ */}
          {currentStage === 'PAD_WEATHER' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#fbbf24', fontWeight: 900, letterSpacing: '0.06em' }}>
                  STAGE 2: LAUNCH PAD METEOROLOGY (KSC 45TH WEATHER SQUADRON)
                </div>
                <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#f8fafc', margin: '2px 0 6px 0', fontFamily: 'var(--font-space)' }}>
                  Launch Pad Weather Go / No-Go
                </h2>
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>
                  Real rockets cannot launch into anvil clouds, high wind shears, or severe lightning risk. Review telemetry below.
                </p>
              </div>

              <div
                style={{
                  padding: '14px 20px',
                  borderRadius: '12px',
                  background: weatherReport.weatherStatus === 'GO'
                    ? 'rgba(16, 185, 129, 0.2)'
                    : weatherReport.weatherStatus === 'MARGINAL'
                    ? 'rgba(251, 191, 36, 0.2)'
                    : 'rgba(239, 68, 68, 0.2)',
                  border: weatherReport.weatherStatus === 'GO'
                    ? '1.5px solid #10b981'
                    : weatherReport.weatherStatus === 'MARGINAL'
                    ? '1.5px solid #fbbf24'
                    : '1.5px solid #ef4444',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ fontSize: '28px' }}>
                    {weatherReport.weatherStatus === 'GO' ? '🟢' : weatherReport.weatherStatus === 'MARGINAL' ? '🟡' : '🔴'}
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 900, color: '#ffffff' }}>
                      WEATHER STATUS: {weatherReport.weatherStatus === 'GO' ? 'GO FOR LAUNCH' : weatherReport.weatherStatus === 'MARGINAL' ? 'MARGINAL CONDITIONS' : 'NO-GO / WEATHER HOLD'}
                    </div>
                    <div style={{ fontSize: '11px', color: '#cbd5e1' }}>
                      {weatherReport.weatherStatus === 'GO'
                        ? 'All 45th Space Wing flight constraints satisfied.'
                        : weatherReport.violatedRules[0] || 'High risk of atmospheric abort.'}
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#38bdf8' }}>
                  TREND: {weatherReport.weatherForecastTrend}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                <div style={{ background: 'rgba(15, 23, 42, 0.7)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ fontSize: '9px', color: '#94a3b8' }}>SURFACE WINDS</div>
                  <div style={{ fontSize: '16px', fontWeight: 900, color: weatherReport.windSpeedKts > 24 ? '#ef4444' : '#4ade80' }}>
                    {weatherReport.windSpeedKts} kts
                  </div>
                  <div style={{ fontSize: '9px', color: '#64748b' }}>Limit: 24 kts</div>
                </div>

                <div style={{ background: 'rgba(15, 23, 42, 0.7)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ fontSize: '9px', color: '#94a3b8' }}>LIGHTNING RISK</div>
                  <div style={{ fontSize: '16px', fontWeight: 900, color: weatherReport.lightningProbabilityPct > 15 ? '#ef4444' : '#38bdf8' }}>
                    {weatherReport.lightningProbabilityPct}%
                  </div>
                  <div style={{ fontSize: '9px', color: '#64748b' }}>Anvil rule: 15%</div>
                </div>

                <div style={{ background: 'rgba(15, 23, 42, 0.7)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ fontSize: '9px', color: '#94a3b8' }}>CLOUD CEILING</div>
                  <div style={{ fontSize: '16px', fontWeight: 900, color: '#f8fafc' }}>
                    {weatherReport.cloudCeilingFt.toLocaleString()} ft
                  </div>
                  <div style={{ fontSize: '9px', color: '#64748b' }}>Min: 3,000 ft</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: 'auto' }}>
                <button
                  onClick={() => {
                    setWeatherAttempt((prev) => prev + 1);
                    if (soundEnabled) soundFx.playTelemetryChirp();
                  }}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  ⏳ WAIT FOR NEXT WINDOW (SCRUB)
                </button>

                <button
                  disabled={weatherReport.weatherStatus === 'NO_GO'}
                  onClick={() => handleSetStage('ASCENT_STAGING')}
                  style={{
                    flex: 1.2,
                    padding: '12px',
                    borderRadius: '8px',
                    background: weatherReport.weatherStatus !== 'NO_GO' ? 'linear-gradient(135deg, #16a34a, #15803d)' : '#334155',
                    color: '#ffffff',
                    fontWeight: 900,
                    fontSize: '12px',
                    border: 'none',
                    cursor: weatherReport.weatherStatus !== 'NO_GO' ? 'pointer' : 'not-allowed',
                    boxShadow: weatherReport.weatherStatus !== 'NO_GO' ? '0 0 20px rgba(22, 163, 74, 0.5)' : 'none',
                  }}
                >
                  🚀 GO FOR LAUNCH (START MANUAL FLIGHT)
                </button>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════
              PHASE 3: LIFTOFF & STAGED ASCENT (100% MANUAL FLIGHT)
              ═══════════════════════════════════════════════════════════════ */}
          {currentStage === 'ASCENT_STAGING' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 900 }}>
                  STAGE 3: ACTIVE MANUAL FLIGHT PILOTING
                </div>
                <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#f8fafc', margin: '2px 0 6px 0', fontFamily: 'var(--font-space)' }}>
                  {destination === 'SUBORBITAL' ? 'Punching Past 100 km Kármán Line' : 'Staged Ascent to Earth Orbit'}
                </h2>
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>
                  Adjust throttle with [W]/[S], steer pitch gravity turn with [A]/[D], and press [SPACE] to decouple boosters!
                </p>
              </div>

              {/* Flight Instructions Card */}
              <div style={{ background: 'rgba(15, 23, 42, 0.85)', border: '1px solid #38bdf8', borderRadius: '10px', padding: '14px' }}>
                <div style={{ fontSize: '12px', fontWeight: 900, color: '#38bdf8', marginBottom: '6px' }}>
                  PILOT GUIDANCE COMPUTER:
                </div>
                <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '11px', color: '#cbd5e1', lineHeight: 1.6 }}>
                  <li><strong>Gravity Turn:</strong> Steer pitch from 90° down towards 30° at 50 km, and 10° at 100 km.</li>
                  <li><strong>Booster Staging:</strong> When Stage 1 fuel empties, press <strong>[SPACE]</strong> to decouple spent boosters.</li>
                  <li><strong>Target:</strong> {destination === 'SUBORBITAL' ? 'Cross 100 km altitude into microgravity space.' : 'Achieve 7.8 km/s orbital velocity at 180+ km.'}</li>
                </ul>
              </div>

              {/* Next Phase Button when objective reached */}
              {hasReachedOrbitOrBoundary && (
                <button
                  onClick={() => {
                    if (destination === 'SUBORBITAL') handleSetStage('EARTH_RETURN');
                    else handleSetStage('DEEP_SPACE_CRUISE');
                  }}
                  style={{
                    padding: '14px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: '#ffffff',
                    fontWeight: 900,
                    fontSize: '13px',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 0 25px rgba(16, 185, 129, 0.5)',
                  }}
                >
                  {destination === 'SUBORBITAL'
                    ? 'PROCEED TO ATMOSPHERIC RE-ENTRY & PARACHUTE SPLASHDOWN ▶'
                    : 'EXECUTE TRANS-DESTINATION INJECTION (TLI/TMI) BURN ▶'}
                </button>
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════
              PHASE 4: DEEP SPACE CRUISE
              ═══════════════════════════════════════════════════════════════ */}
          {currentStage === 'DEEP_SPACE_CRUISE' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 900 }}>
                  STAGE 4: DEEP SPACE TRANSIT & COAST
                </div>
                <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#f8fafc', margin: '2px 0 6px 0', fontFamily: 'var(--font-space)' }}>
                  Coasting to {destProfile.name}
                </h2>
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>
                  Trans-injection burn complete. Spacecraft is cruising on targeted trajectory. Total distance: {destProfile.distanceKm}.
                </p>
              </div>

              <div style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '12px', padding: '16px' }}>
                <div style={{ fontSize: '11px', fontWeight: 900, color: '#38bdf8', marginBottom: '8px' }}>
                  MID-COURSE TRAJECTORY CORRECTION (MCC-2)
                </div>
                <div style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: 1.6 }}>
                  RCS thrusters have fine-tuned capture corridor. Guidance computer confirms nominal arrival periapsis. Life support, battery levels, and telemetry nominal.
                </div>
              </div>

              <button
                onClick={() => {
                  if (destination === 'ORBITAL') handleSetStage('EARTH_RETURN');
                  else handleSetStage('DESCENT_LANDING');
                }}
                style={{
                  marginTop: 'auto',
                  padding: '14px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #ef4444, #b91c1c)',
                  color: '#ffffff',
                  fontWeight: 900,
                  fontSize: '13px',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 0 25px rgba(239, 68, 68, 0.5)',
                }}
              >
                {destination === 'ORBITAL'
                  ? 'FIRE RETROGRADE DE-ORBIT BURN & RETURN TO EARTH ▶'
                  : 'BEGIN POWERED RETRO DESCENT & MANUAL TOUCHDOWN (EDL) ▶'}
              </button>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════
              PHASE 5: POWERED RETRO DESCENT & MANUAL LANDING
              ═══════════════════════════════════════════════════════════════ */}
          {currentStage === 'DESCENT_LANDING' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#ef4444', fontWeight: 900 }}>
                  STAGE 5: MANUAL POWERED RETRO DESCENT & TOUCHDOWN
                </div>
                <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#f8fafc', margin: '2px 0 6px 0', fontFamily: 'var(--font-space)' }}>
                  {destination === 'MOON' ? 'Lunar Module Hover-Slam Touchdown' : 'Mars 7 Minutes of Terror EDL'}
                </h2>
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>
                  Touchdown speed must be under 3.5 m/s with landing gear deployed ([G]). Control descent rate with [W]/[S] throttle.
                </p>
              </div>

              {/* Status Box */}
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.9)',
                  border: touchdownStatus === 'LANDED_SAFE' ? '1.5px solid #10b981' : touchdownStatus === 'CRASHED' ? '1.5px solid #ef4444' : '1px solid #fbbf24',
                  borderRadius: '12px',
                  padding: '16px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '10px', color: '#94a3b8' }}>RADAR ALTIMETER & SINK RATE</div>
                <div style={{ fontSize: '36px', fontWeight: 900, color: touchdownStatus === 'LANDED_SAFE' ? '#4ade80' : touchdownStatus === 'CRASHED' ? '#ef4444' : '#fbbf24' }}>
                  {flightAltM} m
                </div>
                <div style={{ fontSize: '13px', color: '#cbd5e1', marginTop: '4px' }}>
                  Descent Speed: <strong>{flightVyMs} m/s</strong> (Limit: -3.5 m/s) · Fuel: <strong>{flightFuelPct}%</strong>
                </div>
              </div>

              {/* Retry on crash */}
              {touchdownStatus === 'CRASHED' && (
                <button
                  onClick={() => initStagePhysics('DESCENT_LANDING')}
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    background: 'rgba(239, 68, 68, 0.3)',
                    border: '1.5px solid #ef4444',
                    color: '#ffffff',
                    fontWeight: 900,
                    cursor: 'pointer',
                  }}
                >
                  🔄 RETRY DESCENT FROM 3,500 m
                </button>
              )}

              {/* Next step on safe landing */}
              {(touchdownStatus === 'LANDED_SAFE' || touchdownStatus === 'LANDED_HARD') && (
                <button
                  onClick={() => handleSetStage('SURFACE_EVA')}
                  style={{
                    padding: '14px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: '#ffffff',
                    fontWeight: 900,
                    fontSize: '13px',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 0 25px rgba(16, 185, 129, 0.5)',
                  }}
                >
                  DEPRESSURIZE AIRLOCK & STEP OUT FOR SURFACE EVA ▶
                </button>
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════
              PHASE 6: SURFACE EVA MISSIONS
              ═══════════════════════════════════════════════════════════════ */}
          {currentStage === 'SURFACE_EVA' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#10b981', fontWeight: 900 }}>
                  STAGE 6: EXTRAVEHICULAR ACTIVITY (SURFACE SCIENCE MISSION)
                </div>
                <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#f8fafc', margin: '2px 0 6px 0', fontFamily: 'var(--font-space)' }}>
                  Execute Surface Scientific Objectives
                </h2>
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>
                  Perform all surface activities below before boarding the ascent stage for the return to Earth.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button
                  onClick={() => {
                    setEvaTasks((prev) => ({ ...prev, flagPlanted: true }));
                    if (soundEnabled) soundFx.playVictory();
                  }}
                  style={{
                    padding: '14px',
                    borderRadius: '10px',
                    border: evaTasks.flagPlanted ? '2px solid #10b981' : '1px solid rgba(255,255,255,0.1)',
                    background: evaTasks.flagPlanted ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.03)',
                    color: '#ffffff',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ fontSize: '22px' }}>🏁</div>
                  <div style={{ fontSize: '13px', fontWeight: 900, marginTop: '6px' }}>
                    {evaTasks.flagPlanted ? '✓ Flag Erected' : 'Plant Expedition Flag'}
                  </div>
                  <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>
                    Commemorate international scientific discovery.
                  </div>
                </button>

                <button
                  onClick={() => {
                    setEvaTasks((prev) => ({ ...prev, sampleDrilled: true }));
                    if (soundEnabled) soundFx.playClick(900);
                  }}
                  style={{
                    padding: '14px',
                    borderRadius: '10px',
                    border: evaTasks.sampleDrilled ? '2px solid #10b981' : '1px solid rgba(255,255,255,0.1)',
                    background: evaTasks.sampleDrilled ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.03)',
                    color: '#ffffff',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ fontSize: '22px' }}>🔬</div>
                  <div style={{ fontSize: '13px', fontWeight: 900, marginTop: '6px' }}>
                    {evaTasks.sampleDrilled ? '✓ Core Sample Stowed' : 'Drill Deep Core Sample'}
                  </div>
                  <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>
                    Collect volatile cryo-ice / delta mudstone.
                  </div>
                </button>

                <button
                  onClick={() => {
                    setEvaTasks((prev) => ({ ...prev, sensorDeployed: true }));
                    if (soundEnabled) soundFx.playTelemetryChirp();
                  }}
                  style={{
                    padding: '14px',
                    borderRadius: '10px',
                    border: evaTasks.sensorDeployed ? '2px solid #10b981' : '1px solid rgba(255,255,255,0.1)',
                    background: evaTasks.sensorDeployed ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.03)',
                    color: '#ffffff',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ fontSize: '22px' }}>📡</div>
                  <div style={{ fontSize: '13px', fontWeight: 900, marginTop: '6px' }}>
                    {evaTasks.sensorDeployed ? '✓ Seismic Station Active' : 'Deploy Science Sensor'}
                  </div>
                  <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>
                    Monitor subterranean quakes & radiation.
                  </div>
                </button>

                <button
                  onClick={() => {
                    setEvaTasks((prev) => ({ ...prev, roverDriven: true }));
                    if (soundEnabled) soundFx.playReactorStart();
                  }}
                  style={{
                    padding: '14px',
                    borderRadius: '10px',
                    border: evaTasks.roverDriven ? '2px solid #10b981' : '1px solid rgba(255,255,255,0.1)',
                    background: evaTasks.roverDriven ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.03)',
                    color: '#ffffff',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ fontSize: '22px' }}>🚙</div>
                  <div style={{ fontSize: '13px', fontWeight: 900, marginTop: '6px' }}>
                    {evaTasks.roverDriven ? '✓ Traverse Complete' : 'Drive Surface Rover'}
                  </div>
                  <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>
                    Scout surrounding terrain & craters.
                  </div>
                </button>
              </div>

              {evaTasks.flagPlanted && evaTasks.sampleDrilled && (
                <button
                  onClick={() => handleSetStage('SURFACE_ASCENT')}
                  style={{
                    marginTop: 'auto',
                    padding: '14px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                    color: '#ffffff',
                    fontWeight: 900,
                    fontSize: '13px',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 0 25px rgba(37, 99, 235, 0.5)',
                  }}
                >
                  BOARD ASCENT MODULE & LAUNCH FOR EARTH RETURN ▶
                </button>
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════
              PHASE 7: SURFACE ASCENT & TRANS-EARTH INJECTION
              ═══════════════════════════════════════════════════════════════ */}
          {currentStage === 'SURFACE_ASCENT' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#fbbf24', fontWeight: 900 }}>
                  STAGE 7: SURFACE ASCENT & TRANS-EARTH INJECTION (TEI)
                </div>
                <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#f8fafc', margin: '2px 0 6px 0', fontFamily: 'var(--font-space)' }}>
                  Lifting Off From {destination === 'MOON' ? 'the Moon' : 'Mars'}
                </h2>
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>
                  Leaving the descent stage and flag behind on the alien surface. Ascent engine ignition has placed our sample container in return orbit!
                </p>
              </div>

              <div style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid #fbbf24', borderRadius: '12px', padding: '16px' }}>
                <div style={{ fontSize: '11px', fontWeight: 900, color: '#fbbf24', marginBottom: '6px' }}>
                  TRANS-EARTH INJECTION BURN NOMINAL
                </div>
                <div style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: 1.6 }}>
                  Hyperbolic return trajectory set. Estimated Earth atmospheric entry speed: 11.2 km/s. Heat shield thermal protection system armed.
                </div>
              </div>

              <button
                onClick={() => handleSetStage('EARTH_RETURN')}
                style={{
                  marginTop: 'auto',
                  padding: '14px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #f97316, #ea580c)',
                  color: '#ffffff',
                  fontWeight: 900,
                  fontSize: '13px',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 0 25px rgba(249, 115, 22, 0.5)',
                }}
              >
                ENTER EARTH ATMOSPHERE & SPLASHDOWN ▶
              </button>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════
              PHASE 8: EARTH RE-ENTRY & OCEAN SPLASHDOWN (MISSION COMPLETE!)
              ═══════════════════════════════════════════════════════════════ */}
          {currentStage === 'EARTH_RETURN' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#10b981', fontWeight: 900 }}>
                  STAGE 8: HYPERSONIC RE-ENTRY & OCEAN SPLASHDOWN
                </div>
                <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#f8fafc', margin: '2px 0 6px 0', fontFamily: 'var(--font-space)' }}>
                  {hasSplashedDown ? '🎉 MISSION ACCOMPLISHED · WELCOME HOME!' : 'Atmospheric Re-entry Interface'}
                </h2>
              </div>

              {!hasSplashedDown ? (
                <div style={{ background: 'rgba(15, 23, 42, 0.9)', border: '1.5px solid #f97316', borderRadius: '12px', padding: '18px', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>ALTITUDE ABOVE OCEAN</div>
                  <div style={{ fontSize: '38px', fontWeight: 900, color: '#f97316' }}>
                    {flightAltM >= 1000 ? `${(flightAltM / 1000).toFixed(1)} km` : `${flightAltM} m`}
                  </div>
                  <div style={{ fontSize: '12px', color: '#cbd5e1', marginTop: '6px' }}>
                    Velocity: <strong>{flightVelMs} m/s</strong> · Heat Shield Plasma: <strong>{parachutesDeployed ? 'COOLED' : '3,100°C'}</strong>
                  </div>
                  <div style={{ fontSize: '11px', color: parachutesDeployed ? '#4ade80' : '#fbbf24', marginTop: '8px', fontWeight: 800 }}>
                    {parachutesDeployed ? '🪂 TRIPLE MAIN PARACHUTES INFLATED (6.5 m/s)' : flightAltM <= 6000 ? '⚠️ PRESS [P] OR CLICK "DEPLOY CHUTE" NOW!' : '🔥 HYPERSONIC IONIZATION BLACKOUT'}
                  </div>
                </div>
              ) : (
                /* OFFICIAL NASA MISSION DEBRIEF CERTIFICATE */
                <div
                  style={{
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(15, 23, 42, 0.95))',
                    border: '2px solid #10b981',
                    borderRadius: '16px',
                    padding: '24px',
                    textAlign: 'center',
                    boxShadow: '0 0 45px rgba(16, 185, 129, 0.35)',
                  }}
                >
                  <div style={{ fontSize: '44px' }}>🏆</div>
                  <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#34d399', margin: '6px 0', fontFamily: 'var(--font-space)' }}>
                    OFFICIAL NASA EXPEDITION CERTIFICATE
                  </h3>
                  <div style={{ fontSize: '12px', color: '#cbd5e1', maxWidth: '520px', margin: '0 auto 16px auto', lineHeight: 1.5 }}>
                    Commander, you manually assembled your rocket, passed launch weather clearance, piloted your flight trajectory, survived atmospheric forces, touched down on your target destination, and returned safely to ocean splashdown!
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '20px' }}>
                    <div style={{ background: 'rgba(0,0,0,0.4)', padding: '10px', borderRadius: '8px' }}>
                      <div style={{ fontSize: '9px', color: '#94a3b8' }}>EXPEDITION COMPLETED</div>
                      <div style={{ fontSize: '13px', fontWeight: 900, color: '#38bdf8' }}>{destProfile.name}</div>
                    </div>
                    <div style={{ background: 'rgba(0,0,0,0.4)', padding: '10px', borderRadius: '8px' }}>
                      <div style={{ fontSize: '9px', color: '#94a3b8' }}>MANUAL PILOTING</div>
                      <div style={{ fontSize: '13px', fontWeight: 900, color: '#4ade80' }}>100% SUCCESS</div>
                    </div>
                    <div style={{ background: 'rgba(0,0,0,0.4)', padding: '10px', borderRadius: '8px' }}>
                      <div style={{ fontSize: '9px', color: '#94a3b8' }}>CADET CREDITS REWARD</div>
                      <div style={{ fontSize: '13px', fontWeight: 900, color: '#fbbf24' }}>+1,200 CREDITS</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                      onClick={() => handleSetStage('VAB_BUILD')}
                      style={{
                        flex: 1,
                        padding: '12px',
                        background: 'rgba(255,255,255,0.08)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '8px',
                        color: '#ffffff',
                        fontWeight: 800,
                        fontSize: '12px',
                        cursor: 'pointer',
                      }}
                    >
                      🔄 FLY ANOTHER EXPEDITION
                    </button>
                    <button
                      onClick={onClose}
                      style={{
                        flex: 1,
                        padding: '12px',
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#ffffff',
                        fontWeight: 900,
                        fontSize: '12px',
                        cursor: 'pointer',
                        boxShadow: '0 0 20px rgba(16, 185, 129, 0.5)',
                      }}
                    >
                      RETURN TO MISSION CONTROL
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
