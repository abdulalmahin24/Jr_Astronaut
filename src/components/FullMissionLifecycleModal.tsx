// ============================================================================
// FullMissionLifecycleModal.tsx — NASA Complete Round-Trip Expedition System
// Full Mission Lifecycle: Earth VAB Build -> Launch Pad Weather -> Staged Liftoff
// -> Deep Space Cruise -> Moon/Mars Landing -> Surface EVA -> Earth Return Splashdown
// Built for NASA Space Apps Challenge 2026 · Team Mysterio
// ============================================================================

import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  ExternalLink,
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

const STAGE_STEPS: { stage: LifecycleStage; label: string; number: number }[] = [
  { stage: 'VAB_BUILD', label: '1. VAB Build', number: 1 },
  { stage: 'PAD_WEATHER', label: '2. Pad Weather', number: 2 },
  { stage: 'ASCENT_STAGING', label: '3. Liftoff & Orbit', number: 3 },
  { stage: 'DEEP_SPACE_CRUISE', label: '4. Deep Cruise', number: 4 },
  { stage: 'DESCENT_LANDING', label: '5. Powered Landing', number: 5 },
  { stage: 'SURFACE_EVA', label: '6. Surface EVA', number: 6 },
  { stage: 'SURFACE_ASCENT', label: '7. Surface Liftoff', number: 7 },
  { stage: 'EARTH_RETURN', label: '8. Earth Splashdown', number: 8 },
];

export const FullMissionLifecycleModal: React.FC<FullMissionLifecycleModalProps> = ({
  isOpen,
  onClose,
  onMissionCompleted,
  initialDestination = 'MOON',
}) => {
  // Current active lifecycle stage
  const [currentStage, setCurrentStage] = useState<LifecycleStage>('VAB_BUILD');
  const [destination, setDestination] = useState<ExpeditionDestination>(initialDestination);
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
  const [crewCount, setCrewCount] = useState<number>(4);

  // Weather state
  const [weatherAttempt, setWeatherAttempt] = useState<number>(0);
  const weatherReport = useMemo(() => generateLaunchWeather(weatherAttempt), [weatherAttempt]);

  // Stage 3 Ascent animation state
  const [countdown, setCountdown] = useState<number>(10);
  const [isCountingDown, setIsCountingDown] = useState<boolean>(false);
  const [ascentAltitudeKm, setAscentAltitudeKm] = useState<number>(0);
  const [ascentSpeedKms, setAscentSpeedKms] = useState<number>(0);
  const [ascentSubStage, setAscentSubStage] = useState<'COUNTDOWN' | 'LIFTOFF' | 'BOOSTER_SEP' | 'FAIRING_SEP' | 'ORBIT_INSERTION'>('COUNTDOWN');

  // Stage 5 Landing state
  const [landingAltitudeM, setLandingAltitudeM] = useState<number>(2500);
  const [landingSpeedMs, setLandingSpeedMs] = useState<number>(45);
  const [landingFuelPct, setLandingFuelPct] = useState<number>(100);
  const [isLanded, setIsLanded] = useState<boolean>(false);

  // Stage 6 Surface EVA Tasks Completed state
  const [evaTasks, setEvaTasks] = useState<{ flagPlanted: boolean; sampleDrilled: boolean; sensorDeployed: boolean; roverDriven: boolean }>({
    flagPlanted: false,
    sampleDrilled: false,
    sensorDeployed: false,
    roverDriven: false,
  });

  // Stage 8 Earth Return state
  const [reentryAltitudeKm, setReentryAltitudeKm] = useState<number>(120);
  const [reentrySpeedKms, setReentrySpeedKms] = useState<number>(11.1);
  const [chuteDeployed, setChuteDeployed] = useState<boolean>(false);
  const [hasSplashedDown, setHasSplashedDown] = useState<boolean>(false);

  // Three.js Mount reference
  const mountRef = useRef<HTMLDivElement>(null);

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

  // Esc key closes modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Reset state when destination or modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStage('VAB_BUILD');
      setWeatherAttempt(0);
      setCountdown(10);
      setIsCountingDown(false);
      setAscentAltitudeKm(0);
      setAscentSpeedKms(0);
      setAscentSubStage('COUNTDOWN');
      setLandingAltitudeM(2500);
      setLandingSpeedMs(45);
      setLandingFuelPct(100);
      setIsLanded(false);
      setEvaTasks({ flagPlanted: false, sampleDrilled: false, sensorDeployed: false, roverDriven: false });
      setReentryAltitudeKm(120);
      setReentrySpeedKms(11.1);
      setChuteDeployed(false);
      setHasSplashedDown(false);
    }
  }, [isOpen, destination]);

  // Toggle equipment in VAB
  const toggleEquipment = (eq: ScienceEquipment) => {
    if (selectedEquip.some((e) => e.id === eq.id)) {
      if (selectedEquip.length > 1) {
        setSelectedEquip(selectedEquip.filter((e) => e.id !== eq.id));
      }
    } else {
      setSelectedEquip([...selectedEquip, eq]);
    }
    if (soundEnabled) soundFx.playClick(850);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // THREE.JS 3D VIEWPORT ENGINE (DYNAMIC PER STAGE)
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen || !mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth > 0 ? container.clientWidth : window.innerWidth;
    const height = container.clientHeight > 0 ? container.clientHeight : 500;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x030712, 0.0008);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 8000);
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
    renderer.toneMappingExposure = 1.2;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Lights
    const sunLight = new THREE.DirectionalLight(0xffffff, 2.5);
    sunLight.position.set(40, 60, 50);
    scene.add(sunLight);

    const ambientLight = new THREE.AmbientLight(0x38bdf8, 0.7);
    scene.add(ambientLight);

    // Dynamic 3D Scene Group
    const visualGroup = new THREE.Group();
    scene.add(visualGroup);

    // 1. STARFIELD
    const starCount = 1800;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starPos[i] = (Math.random() - 0.5) * 4000;
      starPos[i + 1] = (Math.random() - 0.5) * 4000;
      starPos[i + 2] = (Math.random() - 0.5) * 4000;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 2.2 });
    const starPoints = new THREE.Points(starGeo, starMat);
    scene.add(starPoints);

    // 2. ROCKET MESH
    const rocketMesh = new THREE.Group();

    // Capsule
    const capGeo = new THREE.ConeGeometry(0.8, 1.4, 20);
    const capMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.8, roughness: 0.2 });
    const capMesh = new THREE.Mesh(capGeo, capMat);
    capMesh.position.y = 3.6;
    rocketMesh.add(capMesh);

    // Upper Stage
    const upGeo = new THREE.CylinderGeometry(0.8, 0.8, 1.8, 20);
    const upMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.5, roughness: 0.3 });
    const upMesh = new THREE.Mesh(upGeo, upMat);
    upMesh.position.y = 2.0;
    rocketMesh.add(upMesh);

    // Core Stage
    const coreGeo = new THREE.CylinderGeometry(1.0, 1.0, 4.2, 24);
    const coreMat = new THREE.MeshStandardMaterial({
      color: selectedCore.propellant === 'LH2_LOX' ? 0xd97706 : 0xf8fafc,
      metalness: 0.4,
      roughness: 0.4,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    coreMesh.position.y = -0.9;
    rocketMesh.add(coreMesh);

    // Boosters
    const bGeo = new THREE.CylinderGeometry(0.45, 0.45, 3.8, 16);
    const bMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.7, roughness: 0.3 });
    const bLeft = new THREE.Mesh(bGeo, bMat);
    bLeft.position.set(-1.45, -0.9, 0);
    const bRight = new THREE.Mesh(bGeo, bMat);
    bRight.position.set(1.45, -0.9, 0);
    rocketMesh.add(bLeft, bRight);

    // Engine Plume (Flames)
    const flameGeo = new THREE.ConeGeometry(0.7, 3.0, 16);
    const flameMat = new THREE.MeshBasicMaterial({ color: 0xf97316, transparent: true, opacity: 0 });
    const flameMesh = new THREE.Mesh(flameGeo, flameMat);
    flameMesh.rotation.x = Math.PI;
    flameMesh.position.y = -4.5;
    rocketMesh.add(flameMesh);

    visualGroup.add(rocketMesh);

    // 3. PLANET / TERRAIN (For Cruise / Landing / EVA)
    const planetGeo = new THREE.SphereGeometry(18, 48, 48);
    const planetMat = new THREE.MeshStandardMaterial({
      color: destination === 'MARS' ? 0xb91c1c : 0x64748b,
      roughness: 0.8,
      metalness: 0.1,
    });
    const planetMesh = new THREE.Mesh(planetGeo, planetMat);
    planetMesh.position.set(0, -22, -15);
    visualGroup.add(planetMesh);

    // Animation Loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);

      // Rotate starfield slowly
      starPoints.rotation.y += 0.0002;

      if (currentStage === 'VAB_BUILD') {
        rocketMesh.rotation.y += 0.01;
        flameMat.opacity = 0;
        planetMesh.visible = false;
        camera.position.set(0, 1, 14);
        camera.lookAt(0, 0.5, 0);
      } else if (currentStage === 'PAD_WEATHER') {
        rocketMesh.rotation.y = 0;
        flameMat.opacity = 0;
        planetMesh.visible = false;
        camera.position.set(4, 0, 12);
        camera.lookAt(0, 0, 0);
      } else if (currentStage === 'ASCENT_STAGING') {
        flameMat.opacity = 0.95;
        flameMesh.scale.y = 1 + Math.random() * 0.4;
        rocketMesh.position.y = (Math.sin(Date.now() * 0.003) * 0.2);
        rocketMesh.rotation.z = -0.15;
        planetMesh.visible = true;
        planetMesh.position.set(0, -35, -25);
        camera.position.set(0, -1, 16);
        camera.lookAt(0, 1, 0);
      } else if (currentStage === 'DEEP_SPACE_CRUISE') {
        flameMat.opacity = 0.2;
        rocketMesh.rotation.z = Math.PI / 2;
        rocketMesh.rotation.x = Math.sin(Date.now() * 0.001) * 0.1;
        planetMesh.visible = true;
        planetMesh.position.set(15, -10, -40);
        camera.position.set(0, 3, 16);
        camera.lookAt(0, 0, 0);
      } else if (currentStage === 'DESCENT_LANDING') {
        flameMat.opacity = 0.85;
        rocketMesh.rotation.z = 0;
        planetMesh.visible = true;
        planetMesh.position.set(0, -20, -10);
        camera.position.set(0, 2, 12);
        camera.lookAt(0, -1, 0);
      } else if (currentStage === 'SURFACE_EVA') {
        flameMat.opacity = 0;
        rocketMesh.position.set(-3, -1, 0);
        rocketMesh.rotation.z = 0;
        planetMesh.visible = true;
        planetMesh.position.set(0, -19.5, 0);
        camera.position.set(0, 0.5, 10);
        camera.lookAt(0, 0, 0);
      } else if (currentStage === 'SURFACE_ASCENT') {
        flameMat.opacity = 0.9;
        rocketMesh.position.set(0, 2, 0);
        rocketMesh.rotation.z = -0.3;
        planetMesh.visible = true;
        camera.position.set(0, 0, 15);
        camera.lookAt(0, 1, 0);
      } else if (currentStage === 'EARTH_RETURN') {
        flameMat.opacity = 0;
        rocketMesh.rotation.z = Math.PI; // heat shield blunt entry
        planetMesh.visible = true;
        planetMesh.material = new THREE.MeshStandardMaterial({ color: 0x1d4ed8 }); // Earth ocean
        planetMesh.position.set(0, -20, 0);
        camera.position.set(0, 2, 11);
        camera.lookAt(0, 0, 0);
      }

      renderer.render(scene, camera);
    };
    animate();

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
  }, [isOpen, currentStage, destination, selectedCore.propellant]);

  // ─────────────────────────────────────────────────────────────────────────
  // STAGE PROGRESSION HANDLERS
  // ─────────────────────────────────────────────────────────────────────────

  // Liftoff Countdown Timer
  useEffect(() => {
    let timer: any;
    if (currentStage === 'ASCENT_STAGING' && isCountingDown && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown((c) => c - 1);
        if (soundEnabled) soundFx.playClick(600 + (10 - countdown) * 40);
      }, 1000);
    } else if (currentStage === 'ASCENT_STAGING' && isCountingDown && countdown === 0) {
      // Ignition!
      setAscentSubStage('LIFTOFF');
      if (soundEnabled) soundFx.playReactorStart();
    }
    return () => clearTimeout(timer);
  }, [currentStage, isCountingDown, countdown, soundEnabled]);

  // Ascent telemetry advancement
  useEffect(() => {
    let interval: any;
    if (currentStage === 'ASCENT_STAGING' && ascentSubStage !== 'COUNTDOWN') {
      interval = setInterval(() => {
        setAscentAltitudeKm((prev) => {
          const next = prev + 12;
          if (next >= 45 && next < 100) setAscentSubStage('BOOSTER_SEP');
          else if (next >= 100 && next < 180) setAscentSubStage('FAIRING_SEP');
          else if (next >= 200) setAscentSubStage('ORBIT_INSERTION');
          return Math.min(200, next);
        });
        setAscentSpeedKms((prev) => Math.min(7.75, prev + 0.45));
      }, 700);
    }
    return () => clearInterval(interval);
  }, [currentStage, ascentSubStage]);

  // Landing Descent simulation
  useEffect(() => {
    let interval: any;
    if (currentStage === 'DESCENT_LANDING' && !isLanded) {
      interval = setInterval(() => {
        setLandingAltitudeM((prev) => {
          const next = Math.max(0, prev - 120);
          if (next <= 0) {
            setIsLanded(true);
            confetti({ particleCount: 120, spread: 80 });
            if (soundEnabled) soundFx.playVictory();
          }
          return next;
        });
        setLandingSpeedMs((prev) => Math.max(1.8, prev - 2.2));
        setLandingFuelPct((prev) => Math.max(15, prev - 1.5));
      }, 600);
    }
    return () => clearInterval(interval);
  }, [currentStage, isLanded, soundEnabled]);

  // Earth Re-entry simulation
  useEffect(() => {
    let interval: any;
    if (currentStage === 'EARTH_RETURN' && !hasSplashedDown) {
      interval = setInterval(() => {
        setReentryAltitudeKm((prev) => {
          const next = Math.max(0, prev - 8);
          if (next <= 12 && !chuteDeployed) {
            setChuteDeployed(true);
            if (soundEnabled) soundFx.playReactorStart();
          }
          if (next <= 0) {
            setHasSplashedDown(true);
            confetti({ particleCount: 160, spread: 90 });
            if (soundEnabled) soundFx.playVictory();
            awardCadetCredits(1000);
            onMissionCompleted?.(destination, 1000);
          }
          return next;
        });
        setReentrySpeedKms((prev) => Math.max(0.02, prev - 0.7));
      }, 700);
    }
    return () => clearInterval(interval);
  }, [currentStage, hasSplashedDown, chuteDeployed, destination, onMissionCompleted, soundEnabled]);

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
      {/* ─── TOP MASTER NAVBAR & EXPEDITION PHASE TRACKER ─── */}
      <header
        style={{
          background: 'rgba(10, 15, 26, 0.95)',
          borderBottom: '1.5px solid rgba(56, 189, 248, 0.3)',
          padding: '12px 24px',
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
              NASA FULL ROUND-TRIP EXPEDITION <span style={{ color: '#38bdf8' }}>[EARTH ➔ {destination} ➔ EARTH]</span>
            </div>
            <div style={{ fontSize: '10px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>{destProfile.name}</span>
              <span>•</span>
              <span style={{ color: '#fbbf24' }}>REAL TSIOLKOVSKY EQUATION</span>
              <span>•</span>
              <span style={{ color: '#4ade80' }}>WEATHER GO/NO-GO</span>
            </div>
          </div>
        </div>

        {/* Top Phase Steps Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto' }}>
          {STAGE_STEPS.map((step) => {
            const isActive = step.stage === currentStage;
            const isPassed = STAGE_STEPS.findIndex((s) => s.stage === step.stage) < STAGE_STEPS.findIndex((s) => s.stage === currentStage);
            return (
              <div
                key={step.stage}
                style={{
                  padding: '5px 10px',
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
                  boxShadow: isActive ? '0 0 12px rgba(56, 189, 248, 0.4)' : 'none',
                }}
              >
                {isPassed ? '✓ ' : ''}{step.label}
              </div>
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
              border: '1px solid #ef4444',
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

      {/* ─── MAIN DUAL-PANE VIEWPORT ─── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left Half: 3D Aerospace Canvas */}
        <div style={{ flex: 1.1, position: 'relative', overflow: 'hidden', borderRight: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <div ref={mountRef} style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }} />

          {/* Floating Stage Overlay Badge on Canvas */}
          <div
            style={{
              position: 'absolute',
              top: '16px',
              left: '16px',
              background: 'rgba(10, 15, 26, 0.85)',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              padding: '8px 14px',
              borderRadius: '8px',
              backdropFilter: 'blur(10px)',
              zIndex: 10,
            }}
          >
            <div style={{ fontSize: '9px', color: '#38bdf8', fontWeight: 800 }}>LIVE 3D SIMULATION STAGE</div>
            <div style={{ fontSize: '13px', color: '#ffffff', fontWeight: 900 }}>
              {STAGE_STEPS.find((s) => s.stage === currentStage)?.label}
            </div>
          </div>
        </div>

        {/* Right Half: Interactive Mission Control & Phase UI */}
        <div
          style={{
            flex: 1.4,
            background: 'rgba(6, 9, 18, 0.95)',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
            padding: '24px',
          }}
        >
          {/* ═══════════════════════════════════════════════════════════════
              PHASE 1: VAB ROCKET BUILDER & EQUIPMENT SELECTION
              ═══════════════════════════════════════════════════════════════ */}
          {currentStage === 'VAB_BUILD' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 900, letterSpacing: '0.06em' }}>
                  STAGE 1: VEHICLE ASSEMBLY BUILDING (VAB)
                </div>
                <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#f8fafc', margin: '2px 0 6px 0', fontFamily: 'var(--font-space)' }}>
                  Assemble Your Exploration Rocket
                </h2>
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>
                  Select heavy-lift boosters, core stages, deep-space upper stages, and scientific exploration payloads.
                </p>
              </div>

              {/* Destination Selector Tabs */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button
                  onClick={() => { setDestination('MOON'); if (soundEnabled) soundFx.playClick(850); }}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: destination === 'MOON' ? '2px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)',
                    background: destination === 'MOON' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255,255,255,0.03)',
                    color: destination === 'MOON' ? '#ffffff' : '#94a3b8',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ fontSize: '14px', fontWeight: 900 }}>🌕 MOON EXPEDITION</div>
                  <div style={{ fontSize: '10px', color: '#cbd5e1', marginTop: '2px' }}>Artemis Base Camp · 384,400 km · 10,400 m/s Req Δv</div>
                </button>

                <button
                  onClick={() => { setDestination('MARS'); if (soundEnabled) soundFx.playClick(850); }}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: destination === 'MARS' ? '2px solid #ef4444' : '1px solid rgba(255,255,255,0.1)',
                    background: destination === 'MARS' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255,255,255,0.03)',
                    color: destination === 'MARS' ? '#ffffff' : '#94a3b8',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ fontSize: '14px', fontWeight: 900 }}>🔴 MARS EXPEDITION</div>
                  <div style={{ fontSize: '10px', color: '#cbd5e1', marginTop: '2px' }}>Jezero Delta · 225M km · 13,200 m/s Req Δv</div>
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
                      <div style={{ fontSize: '9px', color: '#fbbf24', marginTop: '4px' }}>{c.propellant} · Isp {c.ispVacuumSec}s</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Science Equipment Selector Checklist */}
              <div>
                <label style={{ fontSize: '11px', fontWeight: 900, color: '#f8fafc', marginBottom: '6px', display: 'block' }}>
                  3. SCIENTIFIC PAYLOAD & SURFACE EQUIPMENT:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {VAB_SCIENCE_EQUIPMENT.map((eq) => {
                    const isChecked = selectedEquip.some((e) => e.id === eq.id);
                    return (
                      <button
                        key={eq.id}
                        onClick={() => toggleEquipment(eq)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: isChecked ? '1.5px solid #4ade80' : '1px solid rgba(255,255,255,0.08)',
                          background: isChecked ? 'rgba(74, 222, 128, 0.12)' : 'rgba(255,255,255,0.02)',
                          color: isChecked ? '#ffffff' : '#94a3b8',
                          cursor: 'pointer',
                          textAlign: 'left',
                          fontSize: '11px',
                        }}
                      >
                        <span style={{ fontSize: '18px' }}>{eq.icon}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{eq.name}</div>
                          <div style={{ fontSize: '9px', color: isChecked ? '#86efac' : '#64748b' }}>{eq.massKg} kg · +{eq.scientificValueXp} Science XP</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Live Tsiolkovsky Physics Card */}
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9), rgba(30, 41, 59, 0.9))',
                  border: physics.isMissionFeasible ? '1.5px solid #10b981' : '1.5px solid #ef4444',
                  borderRadius: '12px',
                  padding: '14px 18px',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '12px',
                  boxShadow: physics.isMissionFeasible ? '0 0 25px rgba(16, 185, 129, 0.25)' : 'none',
                }}
              >
                <div>
                  <div style={{ fontSize: '9px', color: '#94a3b8' }}>LIFTOFF MASS</div>
                  <div style={{ fontSize: '16px', fontWeight: 900, color: '#f8fafc' }}>{physics.totalLiftoffMassTons.toLocaleString()} t</div>
                  <div style={{ fontSize: '8.5px', color: '#64748b' }}>Dry: {physics.dryMassTons}t</div>
                </div>
                <div>
                  <div style={{ fontSize: '9px', color: '#94a3b8' }}>TOTAL DELTA-V (Δv)</div>
                  <div style={{ fontSize: '16px', fontWeight: 900, color: physics.totalDeltaVmS >= physics.requiredDeltaVmS ? '#4ade80' : '#f87171' }}>
                    {physics.totalDeltaVmS.toLocaleString()} m/s
                  </div>
                  <div style={{ fontSize: '8.5px', color: '#64748b' }}>Req: {physics.requiredDeltaVmS.toLocaleString()} m/s</div>
                </div>
                <div>
                  <div style={{ fontSize: '9px', color: '#94a3b8' }}>LIFTOFF TWR</div>
                  <div style={{ fontSize: '16px', fontWeight: 900, color: physics.liftoffTWR >= 1.15 ? '#38bdf8' : '#f87171' }}>
                    {physics.liftoffTWR}x
                  </div>
                  <div style={{ fontSize: '8.5px', color: '#64748b' }}>Min: 1.15x</div>
                </div>
                <div>
                  <div style={{ fontSize: '9px', color: '#94a3b8' }}>FEASIBILITY</div>
                  <div style={{ fontSize: '13px', fontWeight: 900, color: physics.isMissionFeasible ? '#10b981' : '#ef4444' }}>
                    {physics.isMissionFeasible ? `READY (+${physics.feasibilityMarginPct}%)` : 'INSUFFICIENT Δv'}
                  </div>
                  <div style={{ fontSize: '8.5px', color: '#94a3b8' }}>{physics.isMissionFeasible ? 'Go for Rollout' : 'Add Boosters'}</div>
                </div>
              </div>

              {/* Proceed to Pad Weather Button */}
              <button
                disabled={!physics.isMissionFeasible}
                onClick={() => {
                  setCurrentStage('PAD_WEATHER');
                  if (soundEnabled) soundFx.playReactorStart();
                }}
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
                <span>ROLL OUT TO PAD 39B & CHECK WEATHER</span>
                <ChevronRight size={16} />
              </button>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════
              PHASE 2: LAUNCH PAD WEATHER & METEOROLOGY
              ═══════════════════════════════════════════════════════════════ */}
          {currentStage === 'PAD_WEATHER' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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

              {/* Weather Status Banner */}
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

              {/* Weather Telemetry Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                <div style={{ background: 'rgba(15, 23, 42, 0.7)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ fontSize: '9px', color: '#94a3b8' }}>SURFACE WINDS</div>
                  <div style={{ fontSize: '16px', fontWeight: 900, color: weatherReport.windSpeedKts > 24 ? '#ef4444' : '#4ade80' }}>
                    {weatherReport.windSpeedKts} kts
                  </div>
                  <div style={{ fontSize: '9px', color: '#64748b' }}>Gusts: {weatherReport.windGustsKts} kts @ {weatherReport.windDirectionDeg}°</div>
                </div>

                <div style={{ background: 'rgba(15, 23, 42, 0.7)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ fontSize: '9px', color: '#94a3b8' }}>LIGHTNING RISK</div>
                  <div style={{ fontSize: '16px', fontWeight: 900, color: weatherReport.lightningProbabilityPct > 15 ? '#ef4444' : '#38bdf8' }}>
                    {weatherReport.lightningProbabilityPct}%
                  </div>
                  <div style={{ fontSize: '9px', color: '#64748b' }}>Anvil rule limit: 15%</div>
                </div>

                <div style={{ background: 'rgba(15, 23, 42, 0.7)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ fontSize: '9px', color: '#94a3b8' }}>CLOUD CEILING</div>
                  <div style={{ fontSize: '16px', fontWeight: 900, color: '#f8fafc' }}>
                    {weatherReport.cloudCeilingFt.toLocaleString()} ft
                  </div>
                  <div style={{ fontSize: '9px', color: '#64748b' }}>Tracking limit: 3,000 ft</div>
                </div>
              </div>

              {/* Action Buttons */}
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
                  ⏳ WAIT FOR NEXT WEATHER WINDOW (SCRUB T-0)
                </button>

                <button
                  disabled={weatherReport.weatherStatus === 'NO_GO'}
                  onClick={() => {
                    setCurrentStage('ASCENT_STAGING');
                    setIsCountingDown(true);
                    if (soundEnabled) soundFx.playReactorStart();
                  }}
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
                  🚀 AUTHORIZE "GO FOR LAUNCH" (COUNTDOWN)
                </button>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════
              PHASE 3: LIFTOFF & STAGED ASCENT TO EARTH ORBIT
              ═══════════════════════════════════════════════════════════════ */}
          {currentStage === 'ASCENT_STAGING' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 900 }}>
                  STAGE 3: PAD LIFTOFF, MAX-Q & STAGED ASCENT
                </div>
                <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#f8fafc', margin: '2px 0 6px 0', fontFamily: 'var(--font-space)' }}>
                  Ascending Through Atmosphere to LEO
                </h2>
              </div>

              {/* Countdown / Flight Status Clock */}
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.9)',
                  border: '1.5px solid #38bdf8',
                  borderRadius: '12px',
                  padding: '20px',
                  textAlign: 'center',
                }}
              >
                {countdown > 0 ? (
                  <div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 800 }}>TERMINAL COUNTDOWN</div>
                    <div style={{ fontSize: '56px', fontWeight: 900, color: '#fbbf24', fontFamily: 'var(--font-mono)' }}>
                      T-{countdown}s
                    </div>
                    <div style={{ fontSize: '12px', color: '#38bdf8' }}>Retracting Crew Access Arm · Pressurizing LH2/LOX Tanks</div>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: '11px', color: '#4ade80', fontWeight: 800 }}>MISSION ELAPSED TIME: T+00:02:45</div>
                    <div style={{ fontSize: '26px', fontWeight: 900, color: '#ffffff', margin: '6px 0' }}>
                      {ascentSubStage === 'LIFTOFF' && '🔥 LIFTOFF! CLEARING LAUNCH TOWER'}
                      {ascentSubStage === 'BOOSTER_SEP' && '✨ MECO & SOLID BOOSTER JETTISON'}
                      {ascentSubStage === 'FAIRING_SEP' && '🛡️ PAYLOAD FAIRING JETTISON (110 km)'}
                      {ascentSubStage === 'ORBIT_INSERTION' && '🌍 ORBIT INSERTION ACHIEVED: 200x200 km LEO'}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', fontSize: '12px', color: '#cbd5e1' }}>
                      <span>Altitude: <strong>{ascentAltitudeKm} km</strong></span>
                      <span>Velocity: <strong>{ascentSpeedKms.toFixed(2)} km/s</strong></span>
                      <span>Target: <strong>Low Earth Orbit</strong></span>
                    </div>
                  </div>
                )}
              </div>

              {ascentSubStage === 'ORBIT_INSERTION' && (
                <button
                  onClick={() => {
                    setCurrentStage('DEEP_SPACE_CRUISE');
                    if (soundEnabled) soundFx.playReactorStart();
                  }}
                  style={{
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
                  EXECUTE TRANS-{destination === 'MOON' ? 'LUNAR' : 'MARS'} INJECTION (TLI/TMI) BURN ▶
                </button>
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════
              PHASE 4: DEEP SPACE CRUISE
              ═══════════════════════════════════════════════════════════════ */}
          {currentStage === 'DEEP_SPACE_CRUISE' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 900 }}>
                  STAGE 4: DEEP SPACE CISLUNAR / INTERPLANETARY CRUISE
                </div>
                <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#f8fafc', margin: '2px 0 6px 0', fontFamily: 'var(--font-space)' }}>
                  Coasting to {destProfile.name}
                </h2>
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>
                  The Upper Stage burn has injected our spacecraft onto a free-return trajectory. Total transit distance: {destProfile.distanceKm}.
                </p>
              </div>

              <div style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '12px', padding: '16px' }}>
                <div style={{ fontSize: '11px', fontWeight: 900, color: '#38bdf8', marginBottom: '8px' }}>
                  MID-COURSE TRAJECTORY CORRECTION (MCC-2)
                </div>
                <div style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: 1.6 }}>
                  RCS thrusters have fine-tuned our periapsis corridor. Guidance computer confirms nominal capture window. All life support and cryogenic fuel pressures are in the green.
                </div>
              </div>

              <button
                onClick={() => {
                  setCurrentStage('DESCENT_LANDING');
                  if (soundEnabled) soundFx.playReactorStart();
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
                BEGIN POWERED DESCENT & TOUCHDOWN (EDL) ▶
              </button>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════
              PHASE 5: POWERED DESCENT & LANDING
              ═══════════════════════════════════════════════════════════════ */}
          {currentStage === 'DESCENT_LANDING' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#ef4444', fontWeight: 900 }}>
                  STAGE 5: POWERED DESCENT & TOUCHDOWN (EDL)
                </div>
                <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#f8fafc', margin: '2px 0 6px 0', fontFamily: 'var(--font-space)' }}>
                  {destination === 'MOON' ? 'Lunar Powered Descent' : '7 Minutes of Terror Martian EDL'}
                </h2>
              </div>

              <div style={{ background: 'rgba(15, 23, 42, 0.9)', border: '1px solid #ef4444', borderRadius: '12px', padding: '18px', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>RADAR ALTIMETER</div>
                <div style={{ fontSize: '42px', fontWeight: 900, color: isLanded ? '#4ade80' : '#fbbf24' }}>
                  {isLanded ? 'TOUCHDOWN CONFIRMED!' : `${landingAltitudeM.toLocaleString()} m`}
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', fontSize: '12px', color: '#cbd5e1', marginTop: '6px' }}>
                  <span>Descent Rate: <strong>{isLanded ? '0.0 m/s' : `${landingSpeedMs.toFixed(1)} m/s`}</strong></span>
                  <span>Descent Fuel: <strong>{landingFuelPct.toFixed(0)}%</strong></span>
                  <span>Site: <strong>{destProfile.landingSite}</strong></span>
                </div>
              </div>

              {isLanded && (
                <button
                  onClick={() => {
                    setCurrentStage('SURFACE_EVA');
                    if (soundEnabled) soundFx.playReactorStart();
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
                  DEPRESSURIZE AIRLOCK & STEP OUT FOR SURFACE EVA ▶
                </button>
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════
              PHASE 6: SURFACE MISSION OPERATIONS (EVA)
              ═══════════════════════════════════════════════════════════════ */}
          {currentStage === 'SURFACE_EVA' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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

              {/* EVA Interactive Tasks */}
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
                    {evaTasks.roverDriven ? '✓ 12 km Traverse Complete' : 'Drive Surface Rover'}
                  </div>
                  <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>
                    Scout surrounding terrain & panoramic vistas.
                  </div>
                </button>
              </div>

              {/* Ready for Ascent check */}
              {evaTasks.flagPlanted && evaTasks.sampleDrilled && (
                <button
                  onClick={() => {
                    setCurrentStage('SURFACE_ASCENT');
                    if (soundEnabled) soundFx.playReactorStart();
                  }}
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
                onClick={() => {
                  setCurrentStage('EARTH_RETURN');
                  if (soundEnabled) soundFx.playReactorStart();
                }}
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>ALTITUDE ABOVE PACIFIC OCEAN</div>
                  <div style={{ fontSize: '42px', fontWeight: 900, color: '#f97316' }}>
                    {reentryAltitudeKm} km
                  </div>
                  <div style={{ fontSize: '12px', color: '#cbd5e1', marginTop: '6px' }}>
                    Velocity: <strong>{reentrySpeedKms.toFixed(2)} km/s</strong> · Heat Shield Plasma: <strong>{chuteDeployed ? 'COOLED' : '3,100°C'}</strong>
                  </div>
                  <div style={{ fontSize: '11px', color: chuteDeployed ? '#4ade80' : '#fbbf24', marginTop: '8px', fontWeight: 800 }}>
                    {chuteDeployed ? '🪂 TRIPLE MAIN PARACHUTES INFLATED (7.2 m/s)' : '🔥 HYPERSONIC IONIZATION BLACKOUT'}
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
                    Commander, you built your rocket in the VAB, navigated KSC launch pad weather, executed translunar/planetary injection, landed on the alien surface, collected deep science samples, and safely returned to Earth!
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '20px' }}>
                    <div style={{ background: 'rgba(0,0,0,0.4)', padding: '10px', borderRadius: '8px' }}>
                      <div style={{ fontSize: '9px', color: '#94a3b8' }}>DESTINATION CONQUERED</div>
                      <div style={{ fontSize: '14px', fontWeight: 900, color: '#38bdf8' }}>{destination} EXPEDITION</div>
                    </div>
                    <div style={{ background: 'rgba(0,0,0,0.4)', padding: '10px', borderRadius: '8px' }}>
                      <div style={{ fontSize: '9px', color: '#94a3b8' }}>SCIENCE SAMPLES RETURNED</div>
                      <div style={{ fontSize: '14px', fontWeight: 900, color: '#4ade80' }}>100% INTACT</div>
                    </div>
                    <div style={{ background: 'rgba(0,0,0,0.4)', padding: '10px', borderRadius: '8px' }}>
                      <div style={{ fontSize: '9px', color: '#94a3b8' }}>CADET CREDITS REWARD</div>
                      <div style={{ fontSize: '14px', fontWeight: 900, color: '#fbbf24' }}>+1,000 CREDITS</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                      onClick={() => {
                        setCurrentStage('VAB_BUILD');
                        if (soundEnabled) soundFx.playReactorStart();
                      }}
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
                      🔄 BUILD ANOTHER ROCKET
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
