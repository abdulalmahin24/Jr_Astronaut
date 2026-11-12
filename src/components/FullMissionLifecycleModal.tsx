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
  Flag,
  CheckCircle2,
  AlertTriangle,
  Shield,
  Rocket,
  Wrench,
  Sun,
  Eye,
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
  generateLaunchWeather,
} from '../missions/fullMissionLifecycle';
import { soundFx } from '../utils/audioEffects';
import { awardCadetCredits } from '../utils/gearBonusHelper';
import { disposeThreeScene } from '../utils/threeDisposeHelper';
import { getSharedGLTFLoader } from '../utils/modelLoader';

interface FullMissionLifecycleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMissionCompleted?: (destination: ExpeditionDestination, credits: number) => void;
  initialDestination?: ExpeditionDestination;
}

export type FlightViewMode = 'CHASE' | 'ORBIT_MAP' | 'PAD_CAM' | 'COCKPIT';

export type MissionPhase =
  | 'PAD_READY'         // 1. On Launch Complex 39A Hardstand
  | 'ASCENT'            // 2. Liftoff, Flame Trench Smoke, Gravity Turn
  | 'STAGE1_SEP'        // 3. Solid Booster / S-IC Jettison
  | 'ORBIT_INSERTION'   // 4. Upper Stage burn to 7.8 km/s LEO
  | 'ORBIT_COAST'       // 5. Earth Parking Orbit (200x200 km)
  | 'TLI_BURN'          // 6. Trans-Lunar / Trans-Mars Injection Burn
  | 'DEEP_CRUISE'       // 7. Cislunar Transit (384,400 km) with Time Warp
  | 'LUNAR_CAPTURE'     // 8. Lunar Orbit Insertion (LOI 100 km)
  | 'RETRO_DESCENT'     // 9. Manual Lunar Descent with Apollo Lunar Module Eagle
  | 'SURFACE_LANDED'    // 10. Touched down in Mare Tranquillitatis
  | 'SURFACE_EVA'       // 11. Neil Armstrong steps out, plants flag, collects samples
  | 'SURFACE_ASCENT'    // 12. Lunar Ascent Stage liftoff (leaving descent stage)
  | 'TEI_RETURN'        // 13. Trans-Earth Injection Return Burn
  | 'REENTRY_PLASMA'    // 14. Hypersonic 11 km/s Atmospheric Entry Fireball
  | 'PARACHUTE_DESCENT' // 15. Triple Main Apollo Parachutes Deployed (4,000 m)
  | 'SPLASHDOWN';       // 16. Pacific Ocean Splashdown & Retrieval

// ─── PROCEDURAL WEB AUDIO SYNTHESIZER FOR SUB-BASS ROCKET ROAR ─────────────
class AeroAudioSynth {
  private ctx: AudioContext | null = null;
  private engineOsc: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private noiseNode: AudioBufferSourceNode | null = null;
  private noiseGain: GainNode | null = null;
  private enabled: boolean = true;

  init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    } catch {
      // AudioContext unavailable
    }
  }

  setEnabled(val: boolean) {
    this.enabled = val;
    if (!val) {
      if (this.engineGain) this.engineGain.gain.setValueAtTime(0, this.ctx?.currentTime || 0);
      if (this.noiseGain) this.noiseGain.gain.setValueAtTime(0, this.ctx?.currentTime || 0);
    }
  }

  setEngineThrust(throttle: number) {
    if (!this.enabled || !this.ctx) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    if (throttle > 0.02) {
      // 1. Sub-bass acoustic combustion roar oscillator (35 - 90 Hz)
      if (!this.engineOsc) {
        this.engineOsc = this.ctx.createOscillator();
        this.engineOsc.type = 'sawtooth';
        this.engineGain = this.ctx.createGain();
        this.engineGain.gain.setValueAtTime(0, this.ctx.currentTime);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(140, this.ctx.currentTime);

        this.engineOsc.connect(filter);
        filter.connect(this.engineGain);
        this.engineGain.connect(this.ctx.destination);
        this.engineOsc.start();
      }
      const freq = 38 + throttle * 55;
      this.engineOsc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      if (this.engineGain) {
        this.engineGain.gain.setValueAtTime(Math.min(0.32, throttle * 0.28), this.ctx.currentTime);
      }

      // 2. High-speed turbulent rocket exhaust roar (procedural combustion noise)
      if (!this.noiseNode) {
        const bufferSize = this.ctx.sampleRate * 2;
        const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          output[i] = (lastOut + 0.02 * white) / 1.02;
          lastOut = output[i];
          output[i] *= 3.5;
        }

        this.noiseNode = this.ctx.createBufferSource();
        this.noiseNode.buffer = noiseBuffer;
        this.noiseNode.loop = true;

        const noiseFilter = this.ctx.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.setValueAtTime(260, this.ctx.currentTime);
        noiseFilter.Q.setValueAtTime(1.4, this.ctx.currentTime);

        this.noiseGain = this.ctx.createGain();
        this.noiseGain.gain.setValueAtTime(0, this.ctx.currentTime);

        this.noiseNode.connect(noiseFilter);
        noiseFilter.connect(this.noiseGain);
        this.noiseGain.connect(this.ctx.destination);
        this.noiseNode.start();
      }
      if (this.noiseGain) {
        this.noiseGain.gain.setValueAtTime(Math.min(0.4, throttle * 0.35), this.ctx.currentTime);
      }
    } else {
      if (this.engineGain) {
        this.engineGain.gain.setValueAtTime(0, this.ctx.currentTime);
      }
      if (this.noiseGain) {
        this.noiseGain.gain.setValueAtTime(0, this.ctx.currentTime);
      }
    }
  }

  dispose() {
    try {
      if (this.engineOsc) {
        this.engineOsc.stop();
        this.engineOsc.disconnect();
      }
      if (this.noiseNode) {
        this.noiseNode.stop();
        this.noiseNode.disconnect();
      }
      if (this.ctx && this.ctx.state !== 'closed') {
        this.ctx.close().catch(() => {});
      }
    } catch {
      // ignore
    }
  }
}

// ─── PROCEDURAL TEXTURE GENERATORS ──────────────────────────────────────────
const createProceduralKSCPadTexture = (): THREE.CanvasTexture => {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // Florida wetlands scrub
  ctx.fillStyle = '#1e392a';
  ctx.fillRect(0, 0, 1024, 1024);

  // Coastal sandy loam patches
  ctx.fillStyle = '#2c5339';
  for (let i = 0; i < 60; i++) {
    const rx = (i * 47) % 1024;
    const ry = (i * 89) % 1024;
    ctx.beginPath();
    ctx.arc(rx, ry, 50 + (i % 40), 0, Math.PI * 2);
    ctx.fill();
  }

  // Circular Launch Berm (Pad 39A Hardstand)
  ctx.fillStyle = '#475569';
  ctx.beginPath();
  ctx.arc(512, 512, 340, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#64748b';
  ctx.beginPath();
  ctx.arc(512, 512, 260, 0, Math.PI * 2);
  ctx.fill();

  // Safety Perimeter Yellow Stripe
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(512, 512, 260, 0, Math.PI * 2);
  ctx.stroke();

  // Flame trench cutout
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(440, 160, 144, 704);

  // Scorch marks
  const scorch = ctx.createRadialGradient(512, 512, 40, 512, 512, 160);
  scorch.addColorStop(0, 'rgba(0, 0, 0, 0.95)');
  scorch.addColorStop(0.5, 'rgba(30, 20, 15, 0.8)');
  scorch.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = scorch;
  ctx.fillRect(400, 400, 224, 224);

  // Crawlerway gravel track
  ctx.fillStyle = '#64748b';
  ctx.fillRect(476, 512, 72, 512);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.needsUpdate = true;
  return tex;
};

const createProceduralSaturnRollTexture = (): THREE.CanvasTexture => {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, 512, 512);

  // Apollo Saturn V Roll Markings (Black quadrants)
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 100, 256, 160);
  ctx.fillRect(256, 260, 256, 160);

  // USA & Red/Blue Stripes
  ctx.fillStyle = '#b91c1c';
  ctx.fillRect(60, 440, 140, 14);
  ctx.fillStyle = '#1e3a8a';
  ctx.fillRect(320, 440, 140, 14);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.needsUpdate = true;
  return tex;
};

const createProceduralLunarRegolithTexture = (): THREE.CanvasTexture => {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#64748b';
  ctx.fillRect(0, 0, 512, 512);

  // Craters
  for (let i = 0; i < 80; i++) {
    const cx = (i * 73) % 512;
    const cy = (i * 127) % 512;
    const r = 8 + (i % 24);

    const grad = ctx.createRadialGradient(cx - r * 0.2, cy - r * 0.2, r * 0.1, cx, cy, r);
    grad.addColorStop(0, '#334155');
    grad.addColorStop(0.7, '#475569');
    grad.addColorStop(1, '#94a3b8');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 4);
  tex.needsUpdate = true;
  return tex;
};

// ─── MAIN REACT COMPONENT ───────────────────────────────────────────────────
export const FullMissionLifecycleModal: React.FC<FullMissionLifecycleModalProps> = ({
  isOpen,
  onClose,
  onMissionCompleted,
  initialDestination = 'MOON',
}) => {
  const [destination, setDestination] = useState<ExpeditionDestination>(initialDestination);
  const [missionPhase, setMissionPhase] = useState<MissionPhase>('PAD_READY');
  const [viewMode, setViewMode] = useState<FlightViewMode>('CHASE');
  const [timeWarp, setTimeWarp] = useState<number>(1);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // VAB Configuration Drawer
  const [isVabOpen, setIsVabOpen] = useState(false);
  const [isWeatherOpen, setIsWeatherOpen] = useState(false);
  const [selectedBooster, setSelectedBooster] = useState<RocketBooster>(VAB_BOOSTERS[0]);
  const [selectedCore, setSelectedCore] = useState<RocketCoreStage>(VAB_CORE_STAGES[0]);
  const [selectedUpper, setSelectedUpper] = useState<RocketUpperStage>(VAB_UPPER_STAGES[0]);
  const [selectedEquip, setSelectedEquip] = useState<ScienceEquipment[]>([
    VAB_SCIENCE_EQUIPMENT[0],
    VAB_SCIENCE_EQUIPMENT[1],
  ]);
  const [selectedReentry, setSelectedReentry] = useState<HeatShieldParachuteConfig>(VAB_REENTRY_CONFIGS[0]);

  // Launch Pad Weather
  const weatherReport = useMemo(() => generateLaunchWeather(1), []);

  // Flight Telemetry States
  const [throttle, setThrottle] = useState<number>(0);
  const [pitchDeg, setPitchDeg] = useState<number>(90);
  const [flightAltM, setFlightAltM] = useState<number>(0);
  const [flightSpeedMs, setFlightSpeedMs] = useState<number>(0);
  const [flightVyMs, setFlightVyMs] = useState<number>(0);
  const [flightVxMs, setFlightVxMs] = useState<number>(0);
  const [flightFuelPct, setFlightFuelPct] = useState<number>(100);
  const [rocketStage, setRocketStage] = useState<number>(1);
  const [landingLegsDeployed, setLandingLegsDeployed] = useState<boolean>(false);
  const [parachutesDeployed, setParachutesDeployed] = useState<boolean>(false);
  const [touchdownStatus, setTouchdownStatus] = useState<'FLYING' | 'SAFE' | 'CRASHED'>('FLYING');
  const [evaTasks, setEvaTasks] = useState<{ flagPlanted: boolean; sampleDrilled: boolean; seismicDeployed: boolean }>({
    flagPlanted: false,
    sampleDrilled: false,
    seismicDeployed: false,
  });
  const [directorCallout, setDirectorCallout] = useState<string>(
    'SATURN V MOUNTED ON LC-39A · PRESS [🔥 IGNITE ENGINES] OR [Z] TO COMMENCE ASCENT'
  );

  const mountRef = useRef<HTMLDivElement>(null);
  const navballCanvasRef = useRef<HTMLCanvasElement>(null);
  const synthRef = useRef<AeroAudioSynth | null>(null);

  // Mutable animation state ref
  const simRef = useRef({
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
    viewMode: 'CHASE' as FlightViewMode,
    orbitTheta: 0,
    moonTheta: 0.5,
    lunarDistanceM: 384400000,
    touchdown: 'FLYING' as 'FLYING' | 'SAFE' | 'CRASHED',
    missionPhase: 'PAD_READY' as MissionPhase,
    cameraAngleX: 0,
    cameraAngleY: 0.25,
    isMouseDown: false,
    mouseLastX: 0,
    mouseLastY: 0,
  });

  // Sync state into simRef
  useEffect(() => { simRef.current.throttle = throttle; }, [throttle]);
  useEffect(() => { simRef.current.pitchDeg = pitchDeg; }, [pitchDeg]);
  useEffect(() => { simRef.current.timeWarp = timeWarp; }, [timeWarp]);
  useEffect(() => { simRef.current.viewMode = viewMode; }, [viewMode]);
  useEffect(() => { simRef.current.missionPhase = missionPhase; }, [missionPhase]);
  useEffect(() => { simRef.current.legsDeployed = landingLegsDeployed; }, [landingLegsDeployed]);
  useEffect(() => { simRef.current.chutesDeployed = parachutesDeployed; }, [parachutesDeployed]);

  // Audio Synth init & sync
  useEffect(() => {
    if (isOpen) {
      synthRef.current = new AeroAudioSynth();
      synthRef.current.init();
      synthRef.current.setEnabled(soundEnabled);
    }
    return () => {
      synthRef.current?.dispose();
      synthRef.current = null;
    };
  }, [isOpen, soundEnabled]);

  useEffect(() => {
    if (synthRef.current) {
      synthRef.current.setEngineThrust(throttle / 100);
    }
  }, [throttle]);

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
    setEvaTasks({ flagPlanted: false, sampleDrilled: false, seismicDeployed: false });
    setIsVabOpen(false);
    setIsWeatherOpen(false);
    setDirectorCallout('SATURN V MOUNTED ON LC-39A · PRESS [🔥 IGNITE ENGINES] OR [Z] TO COMMENCE ASCENT');

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
      cameraAngleY: 0.25,
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
      setDirectorCallout('✨ SOLID BOOSTER JETTISON! CORE S-II IGNITION — ACCELERATING TO 7.8 km/s');
      if (soundEnabled) soundFx.playReactorStart();
    } else if (rocketStage === 2) {
      setRocketStage(3);
      simRef.current.stage = 3;
      setDirectorCallout('⚡ STAGE 2 SEPARATION! UPPER VACUUM S-IVB ARMED');
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
  // THREE.JS 3D ENGINE (100% FULL-SCREEN EDGE-TO-EDGE IMMERSIVE SIMULATION)
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen || !mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x020617, 0.0004);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100000);
    camera.position.set(0, 10, 32);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    } catch {
      return;
    }
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    renderer.shadowMap.enabled = true;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 1. LIGHTING
    const sunLight = new THREE.DirectionalLight(0xffffff, 2.8);
    sunLight.position.set(150, 200, 100);
    sunLight.castShadow = true;
    scene.add(sunLight);

    const ambientLight = new THREE.AmbientLight(0x38bdf8, 0.55);
    scene.add(ambientLight);

    const exhaustPointLight = new THREE.PointLight(0xf97316, 0, 90);
    scene.add(exhaustPointLight);

    // 2. STARFIELD (Deep space background)
    const starCount = 3500;
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

    // 3. CAPE CANAVERAL LAUNCH PAD 39A (Ground Scene at 0 km)
    const groundSceneGroup = new THREE.Group();
    scene.add(groundSceneGroup);

    // Coastal Florida wetland base with procedural KSC Pad Texture
    const kscPadTex = createProceduralKSCPadTexture();
    const groundGeo = new THREE.CircleGeometry(3200, 64);
    const groundMat = new THREE.MeshStandardMaterial({ map: kscPadTex, roughness: 0.85, metalness: 0.15 });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.receiveShadow = true;
    groundSceneGroup.add(groundMesh);

    // Atlantic Ocean Coastline to the East
    const oceanGeo = new THREE.PlaneGeometry(6000, 6000);
    const oceanMat = new THREE.MeshStandardMaterial({ color: 0x083344, roughness: 0.2, metalness: 0.8 });
    const oceanMesh = new THREE.Mesh(oceanGeo, oceanMat);
    oceanMesh.rotation.x = -Math.PI / 2;
    oceanMesh.position.set(2400, -0.2, 0);
    groundSceneGroup.add(oceanMesh);

    // 4 Steel Lightning Protection Masts with Flashing Red Beacons
    for (let p = 0; p < 4; p++) {
      const ang = (p * Math.PI) / 2 + Math.PI / 4;
      const pylonGeo = new THREE.CylinderGeometry(0.5, 1.8, 85, 12);
      const pylonMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8 });
      const pylon = new THREE.Mesh(pylonGeo, pylonMat);
      const px = Math.cos(ang) * 58;
      const pz = Math.sin(ang) * 58;
      pylon.position.set(px, 42.5, pz);
      groundSceneGroup.add(pylon);

      const beacon = new THREE.PointLight(0xef4444, 2.0, 30);
      beacon.position.set(px, 86, pz);
      groundSceneGroup.add(beacon);
    }

    // Concrete Launch Hardstand Mound
    const padGeo = new THREE.CylinderGeometry(30, 36, 6, 48);
    const padMat = new THREE.MeshStandardMaterial({ color: 0x272e3b, roughness: 0.85, metalness: 0.2 });
    const padMesh = new THREE.Mesh(padGeo, padMat);
    padMesh.position.y = 3;
    padMesh.receiveShadow = true;
    groundSceneGroup.add(padMesh);

    // Red Launch Umbilical Tower (LUT Gantry)
    const towerGroup = new THREE.Group();
    towerGroup.position.set(-18, 0, 0);

    const colGeo = new THREE.BoxGeometry(0.8, 62, 0.8);
    const towerMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, metalness: 0.6, roughness: 0.4 });
    for (let cx = -2.2; cx <= 2.2; cx += 4.4) {
      for (let cz = -2.2; cz <= 2.2; cz += 4.4) {
        const col = new THREE.Mesh(colGeo, towerMat);
        col.position.set(cx, 31, cz);
        towerGroup.add(col);
      }
    }
    // Gantry Service Arms that swing away at liftoff
    const armPivots: THREE.Group[] = [];
    for (let armY = 16; armY <= 48; armY += 10) {
      const armPivot = new THREE.Group();
      armPivot.position.set(2.2, armY, 0);
      const armBarGeo = new THREE.BoxGeometry(14, 1.2, 1.2);
      const armBarMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.7 });
      const armBar = new THREE.Mesh(armBarGeo, armBarMat);
      armBar.position.set(7, 0, 0);
      armPivot.add(armBar);
      towerGroup.add(armPivot);
      armPivots.push(armPivot);
    }
    groundSceneGroup.add(towerGroup);

    // Launch Pad Flame Trench Smoke Particles
    const smokeCount = 120;
    const smokeGeo = new THREE.BufferGeometry();
    const smokePos = new Float32Array(smokeCount * 3);
    for (let i = 0; i < smokeCount * 3; i += 3) {
      smokePos[i] = (Math.random() - 0.5) * 35;
      smokePos[i + 1] = Math.random() * 12 + 2;
      smokePos[i + 2] = (Math.random() - 0.5) * 35;
    }
    smokeGeo.setAttribute('position', new THREE.BufferAttribute(smokePos, 3));
    const smokeMat = new THREE.PointsMaterial({ color: 0xd1d5db, size: 7.0, transparent: true, opacity: 0 });
    const smokePoints = new THREE.Points(smokeGeo, smokeMat);
    groundSceneGroup.add(smokePoints);

    // 4. CELESTIAL BODIES (Earth & Moon)
    // Earth Globe
    const earthRadius = 240;
    const earthGeo = new THREE.SphereGeometry(earthRadius, 64, 64);
    const earthMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.45, metalness: 0.1 });
    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    earthMesh.position.set(0, -earthRadius, 0);
    scene.add(earthMesh);

    // Earth Atmosphere Glow Rim
    const atmoGeo = new THREE.SphereGeometry(earthRadius * 1.035, 48, 48);
    const atmoMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.4, side: THREE.BackSide });
    const atmoMesh = new THREE.Mesh(atmoGeo, atmoMat);
    earthMesh.add(atmoMesh);

    // Moon Globe (in Cislunar / Lunar Orbit)
    const moonRadius = 80;
    const moonGeo = new THREE.SphereGeometry(moonRadius, 48, 48);
    const moonRegolithTex = createProceduralLunarRegolithTexture();
    const moonMat = new THREE.MeshStandardMaterial({ map: moonRegolithTex, roughness: 0.95 });
    const moonMesh = new THREE.Mesh(moonGeo, moonMat);
    moonMesh.position.set(900, 300, -1200);
    scene.add(moonMesh);

    // 5. SATURN V HEAVY MULTI-STAGE ROCKET
    const rocketMasterGroup = new THREE.Group();
    scene.add(rocketMasterGroup);

    // Launch Escape System (LES) Tower (Pencil truss on apex)
    const lesGroup = new THREE.Group();
    lesGroup.position.y = 8.5;
    const lesTowerGeo = new THREE.CylinderGeometry(0.12, 0.4, 3.2, 8);
    const lesTowerMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.5 });
    const lesTower = new THREE.Mesh(lesTowerGeo, lesTowerMat);
    lesGroup.add(lesTower);
    const lesNoseGeo = new THREE.ConeGeometry(0.25, 0.8, 12);
    const lesNoseMat = new THREE.MeshStandardMaterial({ color: 0xef4444 });
    const lesNose = new THREE.Mesh(lesNoseGeo, lesNoseMat);
    lesNose.position.y = 2.0;
    lesGroup.add(lesNose);
    rocketMasterGroup.add(lesGroup);

    // Apollo Command Module (White Cone)
    const capGeo = new THREE.ConeGeometry(1.05, 1.8, 32);
    const capMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.8, roughness: 0.2 });
    const capMesh = new THREE.Mesh(capGeo, capMat);
    capMesh.position.y = 6.8;
    rocketMasterGroup.add(capMesh);

    // Apollo Service Module (Silver reflective cylinder + RCS)
    const smGeo = new THREE.CylinderGeometry(1.05, 1.05, 2.4, 32);
    const smMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.7, roughness: 0.25 });
    const smMesh = new THREE.Mesh(smGeo, smMat);
    smMesh.position.y = 4.7;
    rocketMasterGroup.add(smMesh);

    // S-IVB Third Stage / Interstage
    const s4bGeo = new THREE.CylinderGeometry(1.3, 1.3, 3.2, 32);
    const s4bMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 });
    const s4bMesh = new THREE.Mesh(s4bGeo, s4bMat);
    s4bMesh.position.y = 1.9;
    rocketMasterGroup.add(s4bMesh);

    // S-IC First Stage Fuselage with Apollo Roll Pattern Texture
    const saturnRollTex = createProceduralSaturnRollTexture();
    const coreGeo = new THREE.CylinderGeometry(1.5, 1.5, 8.5, 32);
    const coreMat = new THREE.MeshStandardMaterial({ map: saturnRollTex, roughness: 0.45, metalness: 0.2 });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    coreMesh.position.y = -3.95;
    rocketMasterGroup.add(coreMesh);

    // 4 Aerodynamic Stabilization Fins at base
    for (let f = 0; f < 4; f++) {
      const fAngle = (f * Math.PI) / 2;
      const finGeo = new THREE.BoxGeometry(0.12, 1.8, 1.2);
      const finMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc });
      const fin = new THREE.Mesh(finGeo, finMat);
      fin.position.set(Math.cos(fAngle) * 1.8, -7.5, Math.sin(fAngle) * 1.8);
      fin.rotation.y = fAngle;
      coreMesh.add(fin);
    }

    // 5x Rocketdyne F-1 Engine Bells
    const bellGeo = new THREE.ConeGeometry(0.38, 1.1, 20);
    const bellMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.95, roughness: 0.15 });
    for (let e = 0; e < 5; e++) {
      const b = new THREE.Mesh(bellGeo, bellMat);
      b.rotation.x = Math.PI;
      if (e === 0) {
        b.position.set(0, -8.6, 0);
      } else {
        const a = (e * Math.PI) / 2;
        b.position.set(Math.cos(a) * 0.75, -8.6, Math.sin(a) * 0.75);
      }
      coreMesh.add(b);
    }

    // Dual Solid Rocket Strap-on Boosters
    const boosterGroup = new THREE.Group();
    const bGeo = new THREE.CylinderGeometry(0.65, 0.65, 9.2, 24);
    const bMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, metalness: 0.5, roughness: 0.3 });
    const bLeft = new THREE.Mesh(bGeo, bMat);
    bLeft.position.set(-2.25, -3.6, 0);
    const bRight = new THREE.Mesh(bGeo, bMat);
    bRight.position.set(2.25, -3.6, 0);

    const bNoseGeo = new THREE.ConeGeometry(0.65, 2.0, 24);
    const bNoseL = new THREE.Mesh(bNoseGeo, bMat);
    bNoseL.position.y = 5.6;
    bLeft.add(bNoseL);
    const bNoseR = new THREE.Mesh(bNoseGeo, bMat);
    bNoseR.position.y = 5.6;
    bRight.add(bNoseR);

    boosterGroup.add(bLeft, bRight);
    rocketMasterGroup.add(boosterGroup);

    // Glowing Engine Flame Plumes
    const flameGeo = new THREE.ConeGeometry(1.2, 6.0, 24);
    const flameMat = new THREE.MeshBasicMaterial({ color: 0xf97316, transparent: true, opacity: 0 });
    const flameMesh = new THREE.Mesh(flameGeo, flameMat);
    flameMesh.rotation.x = Math.PI;
    flameMesh.position.y = -11.5;
    rocketMasterGroup.add(flameMesh);

    // Hypersonic Atmospheric Re-entry Plasma Fireball Shell
    const plasmaGeo = new THREE.SphereGeometry(1.9, 24, 24);
    const plasmaMat = new THREE.MeshBasicMaterial({ color: 0xf97316, transparent: true, opacity: 0, blending: THREE.AdditiveBlending });
    const plasmaMesh = new THREE.Mesh(plasmaGeo, plasmaMat);
    plasmaMesh.position.y = 5.8;
    rocketMasterGroup.add(plasmaMesh);

    // Triple Main Apollo Parachutes (Orange & White striped domes)
    const chuteGroup = new THREE.Group();
    chuteGroup.position.set(0, 9.5, 0);
    chuteGroup.visible = false;
    for (let c = 0; c < 3; c++) {
      const cAngle = (c * Math.PI * 2) / 3;
      const cGeo = new THREE.SphereGeometry(2.4, 20, 20, 0, Math.PI * 2, 0, Math.PI * 0.5);
      const cMat = new THREE.MeshStandardMaterial({ color: c % 2 === 0 ? 0xf97316 : 0xf8fafc, side: THREE.DoubleSide });
      const cMesh = new THREE.Mesh(cGeo, cMat);
      cMesh.rotation.x = Math.PI;
      cMesh.position.set(Math.cos(cAngle) * 3.2, 0, Math.sin(cAngle) * 3.2);
      chuteGroup.add(cMesh);
    }
    rocketMasterGroup.add(chuteGroup);

    // 6. AUTHENTIC APOLLO LUNAR MODULE (LM - EAGLE) FOR LUNAR PHASES
    const apolloLmGroup = new THREE.Group();
    apolloLmGroup.visible = false;
    scene.add(apolloLmGroup);

    // Octagonal Descent Stage with Gold Kapton Thermal Foil
    const dStageGeo = new THREE.CylinderGeometry(2.4, 2.7, 1.6, 8);
    const goldMliMat = new THREE.MeshStandardMaterial({ color: 0xca8a04, metalness: 0.95, roughness: 0.15 });
    const dStage = new THREE.Mesh(dStageGeo, goldMliMat);
    dStage.position.y = 0.8;
    apolloLmGroup.add(dStage);

    // DPS Descent Engine Bell Nozzle
    const dpsBellGeo = new THREE.ConeGeometry(0.85, 1.5, 24, 1, true);
    const dpsBellMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.95, roughness: 0.2, side: THREE.DoubleSide });
    const dpsBell = new THREE.Mesh(dpsBellGeo, dpsBellMat);
    dpsBell.rotation.x = Math.PI;
    dpsBell.position.y = -0.55;
    apolloLmGroup.add(dpsBell);

    // 4 Landing Gear Outrigger Struts & Footpads
    for (let leg = 0; leg < 4; leg++) {
      const lAngle = (leg * Math.PI) / 2 + Math.PI / 4;
      const cosA = Math.cos(lAngle);
      const sinA = Math.sin(lAngle);

      const strutGeo = new THREE.CylinderGeometry(0.09, 0.11, 4.2, 8);
      const strutMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.9, roughness: 0.2 });
      const strut = new THREE.Mesh(strutGeo, strutMat);
      strut.position.set(cosA * 3.3, 0.1, sinA * 3.3);
      strut.rotation.z = -cosA * 0.65;
      strut.rotation.x = sinA * 0.65;
      apolloLmGroup.add(strut);

      const padGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.1, 16);
      const padMat = new THREE.MeshStandardMaterial({ color: 0xca8a04, metalness: 0.9, roughness: 0.2 });
      const pad = new THREE.Mesh(padGeo, padMat);
      pad.position.set(cosA * 4.6, -1.15, sinA * 4.6);
      apolloLmGroup.add(pad);
    }

    // Ascent Stage (Triangular Cockpit Windows, Hatch, 4 RCS Quads)
    const ascentGroup = new THREE.Group();
    ascentGroup.position.y = 2.1;
    const cabinGeo = new THREE.CylinderGeometry(1.6, 1.8, 1.7, 16);
    const cabinMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.85, roughness: 0.3 });
    const cabin = new THREE.Mesh(cabinGeo, cabinMat);
    ascentGroup.add(cabin);

    // Forward Hatch & Triangular Windows
    const winGeo = new THREE.BoxGeometry(0.4, 0.35, 0.1);
    const winMat = new THREE.MeshBasicMaterial({ color: 0x0284c7 });
    const winL = new THREE.Mesh(winGeo, winMat);
    winL.position.set(-0.45, 0.25, 1.8);
    winL.rotation.y = 0.25;
    const winR = new THREE.Mesh(winGeo, winMat);
    winR.position.set(0.45, 0.25, 1.8);
    winR.rotation.y = -0.25;
    ascentGroup.add(winL, winR);

    // 4 RCS Thruster Quads
    for (let q = 0; q < 4; q++) {
      const qAngle = (q * Math.PI) / 2;
      const rcsBox = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.2), new THREE.MeshStandardMaterial({ color: 0x94a3b8 }));
      rcsBox.position.set(Math.cos(qAngle) * 2.1, 0.3, Math.sin(qAngle) * 2.1);
      ascentGroup.add(rcsBox);
    }
    apolloLmGroup.add(ascentGroup);

    // Try loading authentic Apollo Lunar Module GLTF as enhanced overlay
    const gltfLoader = getSharedGLTFLoader();
    gltfLoader.load(
      '/models/Apollo_Lunar_Module.glb',
      (gltf) => {
        const model = gltf.scene;
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const targetH = 5.2;
        const scale = targetH / Math.max(size.x, size.y, size.z);
        model.scale.setScalar(scale);
        box.setFromObject(model);
        model.position.y = -box.min.y - 1.15;
        // If GLTF loads, hide procedural parts
        dStage.visible = false;
        cabin.visible = false;
        apolloLmGroup.add(model);
      },
      undefined,
      () => {
        // Fallback to high-res procedural LM already built
      }
    );

    // 7. LUNAR SURFACE SCENE (Mare Tranquillitatis at 0 km altitude)
    const lunarSurfaceScene = new THREE.Group();
    lunarSurfaceScene.visible = false;
    scene.add(lunarSurfaceScene);

    const lunarGroundGeo = new THREE.PlaneGeometry(1200, 1200, 48, 48);
    const lunarGroundMat = new THREE.MeshStandardMaterial({ map: moonRegolithTex, roughness: 0.95 });
    const lunarGroundMesh = new THREE.Mesh(lunarGroundGeo, lunarGroundMat);
    lunarGroundMesh.rotation.x = -Math.PI / 2;
    lunarGroundMesh.position.y = -1.2;
    lunarGroundMesh.receiveShadow = true;
    lunarSurfaceScene.add(lunarGroundMesh);

    // Basalt Boulders scattered on lunar surface
    for (let b = 0; b < 25; b++) {
      const rockGeo = new THREE.DodecahedronGeometry(0.6 + (b % 4) * 0.4);
      const rockMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.9 });
      const rock = new THREE.Mesh(rockGeo, rockMat);
      const rx = (b * 19) % 180 - 90;
      const rz = (b * 31) % 180 - 90;
      rock.position.set(rx, -0.6, rz);
      rock.rotation.set(b, b * 0.5, b * 0.2);
      lunarSurfaceScene.add(rock);
    }

    // American Flag planted in lunar regolith
    const flagGroup = new THREE.Group();
    flagGroup.position.set(5.5, -1.2, 4.0);

    const poleGeo = new THREE.CylinderGeometry(0.04, 0.04, 2.6, 8);
    const poleMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.9 });
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.y = 1.3;
    flagGroup.add(pole);

    const flagGeo = new THREE.PlaneGeometry(1.2, 0.8);
    const flagCanvas = document.createElement('canvas');
    flagCanvas.width = 256;
    flagCanvas.height = 160;
    const fctx = flagCanvas.getContext('2d')!;
    fctx.fillStyle = '#b91c1c';
    fctx.fillRect(0, 0, 256, 160);
    fctx.fillStyle = '#ffffff';
    for (let s = 1; s < 7; s += 2) {
      fctx.fillRect(0, (s * 160) / 7, 256, 160 / 14);
    }
    fctx.fillStyle = '#1e3a8a';
    fctx.fillRect(0, 0, 100, 80);
    const flagTex = new THREE.CanvasTexture(flagCanvas);
    const flagMat = new THREE.MeshBasicMaterial({ map: flagTex, side: THREE.DoubleSide });
    const flagMesh = new THREE.Mesh(flagGeo, flagMat);
    flagMesh.position.set(0.65, 2.1, 0);
    flagGroup.add(flagMesh);
    lunarSurfaceScene.add(flagGroup);

    // Neil Armstrong 3D Astronaut on EVA
    const astronautGroup = new THREE.Group();
    astronautGroup.position.set(2.8, -1.2, 3.2);
    astronautGroup.rotation.y = -Math.PI / 4;
    lunarSurfaceScene.add(astronautGroup);

    // Procedural A7L spacesuit fallback
    const suitTorso = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.9, 0.5), new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 }));
    suitTorso.position.y = 1.2;
    const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 16), new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.95, roughness: 0.1 }));
    helmet.position.y = 1.85;
    const plssBackpack = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.8, 0.35), new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.5 }));
    plssBackpack.position.set(0, 1.25, -0.4);
    astronautGroup.add(suitTorso, helmet, plssBackpack);

    // Load authentic NASA Neil Armstrong HD GLTF model
    gltfLoader.load(
      '/models/NASA_Neil_Apollo11_HD.glb',
      (gltf) => {
        const astroModel = gltf.scene;
        const box = new THREE.Box3().setFromObject(astroModel);
        const size = box.getSize(new THREE.Vector3());
        const targetH = 1.9;
        const scale = targetH / Math.max(size.x, size.y, size.z);
        astroModel.scale.setScalar(scale);
        box.setFromObject(astroModel);
        astroModel.position.set(0, -box.min.y, 0);
        // Hide procedural suit
        suitTorso.visible = false;
        helmet.visible = false;
        plssBackpack.visible = false;
        astronautGroup.add(astroModel);
      },
      undefined,
      () => {
        // Fallback procedural suit
      }
    );

    // Lunar Landing Dust Particles
    const dustCount = 80;
    const dustGeo = new THREE.BufferGeometry();
    const dustPos = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount * 3; i += 3) {
      dustPos[i] = (Math.random() - 0.5) * 18;
      dustPos[i + 1] = Math.random() * 2.5;
      dustPos[i + 2] = (Math.random() - 0.5) * 18;
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
    const dustMat = new THREE.PointsMaterial({ color: 0x94a3b8, size: 2.2, transparent: true, opacity: 0 });
    const dustPoints = new THREE.Points(dustGeo, dustMat);
    lunarSurfaceScene.add(dustPoints);

    // 8. ORBITAL MAP TRAJECTORY ELLIPSE LINE
    const orbitPoints = 200;
    const orbitPositions = new Float32Array(orbitPoints * 3);
    const orbitGeo = new THREE.BufferGeometry();
    orbitGeo.setAttribute('position', new THREE.BufferAttribute(orbitPositions, 3));
    const orbitMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.85, linewidth: 2 });
    const orbitLine = new THREE.Line(orbitGeo, orbitMat);
    scene.add(orbitLine);

    // ─────────────────────────────────────────────────────────────────────────
    // MOUSE DRAG ORBIT CAMERA CONTROLLER
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
      simRef.current.cameraAngleY = Math.max(-1.1, Math.min(1.1, simRef.current.cameraAngleY + dy * 0.005));
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
        const g = 9.81 * ((6371000 / (6371000 + p.altM)) ** 2);
        const thrustKn = p.stage === 1 ? 38000 : p.stage === 2 ? 12000 : 3500;
        const massTons = 2400 * (0.35 + 0.65 * (p.fuelPct / 100));

        if (p.fuelPct > 0 && throttleNorm > 0) {
          p.fuelPct = Math.max(0, p.fuelPct - throttleNorm * 0.18 * dt);
        }

        const effectiveThrustKn = p.fuelPct > 0 ? thrustKn * throttleNorm : 0;
        const aThrust = effectiveThrustKn / massTons;

        // Atmospheric drag
        const density = Math.exp(-p.altM / 8500);
        const dragN = 0.5 * density * 1.225 * (p.velMs ** 2) * 0.28 * 6.0;
        const aDrag = (dragN / 1000) / massTons;

        const ay = aThrust * Math.sin(pitchRad) - (aDrag * (p.vyMs / Math.max(1, p.velMs))) - g;
        const ax = aThrust * Math.cos(pitchRad) - (aDrag * (p.vxMs / Math.max(1, p.velMs)));

        p.vyMs += ay * dt;
        p.vxMs += ax * dt;
        p.velMs = Math.sqrt(p.vyMs ** 2 + p.vxMs ** 2);
        p.altM = Math.max(0, p.altM + p.vyMs * dt);

        // Umbilical arms swing open at liftoff
        armPivots.forEach((arm) => {
          arm.rotation.y = THREE.MathUtils.lerp(arm.rotation.y, -Math.PI / 3, dt * 1.5);
        });

        // Launchpad smoke billows
        if (p.altM < 400) {
          smokeMat.opacity = Math.max(0, 0.7 - p.altM / 500);
        } else {
          smokeMat.opacity = 0;
        }

        // Booster visual separation offset
        if (p.boostersSeparated) {
          p.boosterOffset += dt * 5;
          bLeft.position.x = -2.25 - p.boosterOffset;
          bRight.position.x = 2.25 + p.boosterOffset;
          bLeft.position.y -= dt * 4;
          bRight.position.y -= dt * 4;
        }

        // Check 100 km Karman boundary for Mission 1
        if (destination === 'SUBORBITAL' && p.altM >= 100000 && p.missionPhase === 'ASCENT') {
          setDirectorCallout('🎉 100 KM KÁRMÁN BOUNDARY PASSED! ENTERED SPACE — PREPARE FOR RE-ENTRY');
        }

        // Check Orbit Insertion (7.75 km/s) for Mission 2, 3, 4
        if (p.velMs >= 7750 && p.altM >= 180000 && p.missionPhase === 'ASCENT') {
          p.missionPhase = 'ORBIT_COAST';
          setMissionPhase('ORBIT_COAST');
          setDirectorCallout('🌍 STABLE 200x200 km LOW EARTH ORBIT (LEO) ACHIEVED! READY FOR TRANS-LUNAR INJECTION (TLI)');
          confetti({ particleCount: 120, spread: 80 });
          if (soundEnabled) soundFx.playVictory();
        }
      }
      else if (p.missionPhase === 'TLI_BURN') {
        // Accelerating towards Moon
        if (p.fuelPct > 0 && throttleNorm > 0) {
          p.fuelPct = Math.max(0, p.fuelPct - throttleNorm * 0.15 * dt);
          p.velMs += 18.0 * throttleNorm * dt;
        }
        if (p.velMs >= 10800) {
          p.missionPhase = 'DEEP_CRUISE';
          setMissionPhase('DEEP_CRUISE');
          setDirectorCallout('🌕 TRANS-LUNAR INJECTION (TLI) COMPLETE! ENGAGE [TIME WARP 100x] TO TRANSIT TO THE MOON');
          confetti({ particleCount: 150, spread: 90 });
          if (soundEnabled) soundFx.playVictory();
        }
      }
      else if (p.missionPhase === 'DEEP_CRUISE') {
        // Cislunar transit countdown
        p.lunarDistanceM = Math.max(100000, p.lunarDistanceM - p.velMs * dt * 45);
        if (p.lunarDistanceM <= 350000) {
          p.missionPhase = 'LUNAR_CAPTURE';
          setMissionPhase('LUNAR_CAPTURE');
          setDirectorCallout('🌑 ENTERED MOON SOI! CSM SEPARATES FROM LUNAR MODULE EAGLE · PREPARE FOR POWERED DESCENT');
          if (soundEnabled) soundFx.playReactorStart();
        }
      }
      else if (p.missionPhase === 'RETRO_DESCENT') {
        const gMoon = destination === 'MARS' ? 3.72 : 1.62;
        const maxDecel = 16.0;
        const thrustAcc = p.fuelPct > 0 ? throttleNorm * maxDecel : 0;

        if (p.fuelPct > 0 && throttleNorm > 0) {
          p.fuelPct = Math.max(0, p.fuelPct - throttleNorm * 0.12 * dt);
        }

        const ay = thrustAcc - gMoon;
        p.vyMs += ay * dt;
        p.altM = Math.max(0, p.altM + p.vyMs * dt);
        p.vxMs = Math.max(0, p.vxMs - dt * 2.5);
        p.velMs = Math.sqrt(p.vyMs ** 2 + p.vxMs ** 2);

        // Dust kick-up near surface
        if (p.altM < 25) {
          dustMat.opacity = Math.min(0.85, (25 - p.altM) / 25 * throttleNorm);
        } else {
          dustMat.opacity = 0;
        }

        // Touchdown detection
        if (p.altM <= 0) {
          p.altM = 0;
          const downwardRate = Math.abs(p.vyMs);

          if (!p.legsDeployed) {
            p.touchdown = 'CRASHED';
            setTouchdownStatus('CRASHED');
            setDirectorCallout('💥 CRASH! LANDING GEAR WAS NOT EXTENDED! PRESS [G] & RETRY');
          } else if (downwardRate <= 3.5) {
            p.touchdown = 'SAFE';
            setTouchdownStatus('SAFE');
            p.missionPhase = 'SURFACE_LANDED';
            setMissionPhase('SURFACE_LANDED');
            setDirectorCallout('🎉 NOMINAL TOUCHDOWN (< 3.5 m/s)! HOUSTON, TRANQUILITY BASE HERE. THE EAGLE HAS LANDED');
            confetti({ particleCount: 180, spread: 100 });
            if (soundEnabled) soundFx.playVictory();
          } else {
            p.touchdown = 'CRASHED';
            setTouchdownStatus('CRASHED');
            setDirectorCallout(`💥 CRASH IMPACT: Touchdown speed (${downwardRate.toFixed(1)} m/s) exceeded 3.5 m/s structural limit!`);
          }
        }
      }
      else if (p.missionPhase === 'SURFACE_ASCENT') {
        // Lunar ascent liftoff
        p.vyMs += (14.0 - 1.62) * dt;
        p.altM += p.vyMs * dt;
        p.velMs = p.vyMs;
        if (p.altM >= 60000) {
          p.missionPhase = 'TEI_RETURN';
          setMissionPhase('TEI_RETURN');
          setDirectorCallout('🌍 TRANS-EARTH INJECTION (TEI) FIRED! RETURNING HOME AT 11.2 KM/S');
          if (soundEnabled) soundFx.playVictory();
        }
      }
      else if (p.missionPhase === 'REENTRY_PLASMA' || p.missionPhase === 'PARACHUTE_DESCENT') {
        const terminalVel = p.chutesDeployed ? -6.5 : -140;
        p.vyMs += (terminalVel - p.vyMs) * dt * 0.7;
        p.altM = Math.max(0, p.altM + p.vyMs * dt * 4);
        p.velMs = Math.abs(p.vyMs);

        // Plasma heat shield fireball glow
        if (p.missionPhase === 'REENTRY_PLASMA') {
          plasmaMat.opacity = Math.min(0.9, 0.4 + Math.random() * 0.5);
        } else {
          plasmaMat.opacity = 0;
        }

        if (p.altM <= 0) {
          p.altM = 0;
          p.missionPhase = 'SPLASHDOWN';
          setMissionPhase('SPLASHDOWN');
          setDirectorCallout('🏆 PACIFIC OCEAN SPLASHDOWN NOMINAL! USS HORNET RECOVERY HELICOPTER RETRIEVAL COMPLETE');
          confetti({ particleCount: 220, spread: 100 });
          if (soundEnabled) soundFx.playVictory();
          awardCadetCredits(1500);
          onMissionCompleted?.(destination, 1500);
        }
      }

      // ─── 3D MESH VISUALS & ORIENTATION ───
      const visualPitch = (p.pitchDeg * Math.PI) / 180;
      rocketMasterGroup.rotation.z = -visualPitch + Math.PI / 2;

      // Rocket flame
      const isFiring = p.fuelPct > 0 && throttleNorm > 0 && !['PAD_READY', 'SURFACE_LANDED', 'SURFACE_EVA', 'SPLASHDOWN'].includes(p.missionPhase);
      flameMat.opacity = isFiring ? 0.95 : 0;
      flameMesh.scale.set(throttleNorm, throttleNorm * (1.2 + Math.random() * 0.4), throttleNorm);
      exhaustPointLight.intensity = isFiring ? 4.0 * throttleNorm : 0;

      // Parachute visibility
      chuteGroup.visible = p.chutesDeployed;

      // Switch between Saturn V Rocket and Apollo Lunar Module
      const isLunarSurfaceMode = ['LUNAR_CAPTURE', 'RETRO_DESCENT', 'SURFACE_LANDED', 'SURFACE_EVA', 'SURFACE_ASCENT'].includes(p.missionPhase);
      rocketMasterGroup.visible = !isLunarSurfaceMode;
      apolloLmGroup.visible = isLunarSurfaceMode;

      // Lunar Module positioning during descent
      if (isLunarSurfaceMode) {
        if (p.missionPhase === 'RETRO_DESCENT') {
          apolloLmGroup.position.set(0, Math.max(0, p.altM / 250), 0);
          lunarSurfaceScene.visible = p.altM < 1500;
        } else if (p.missionPhase === 'SURFACE_LANDED' || p.missionPhase === 'SURFACE_EVA') {
          apolloLmGroup.position.set(0, 0, 0);
          lunarSurfaceScene.visible = true;
          astronautGroup.visible = p.missionPhase === 'SURFACE_EVA';
        } else if (p.missionPhase === 'SURFACE_ASCENT') {
          // Ascent stage lifts off, descent stage remains on surface
          ascentGroup.position.y = 2.1 + (p.altM / 200);
          dStage.visible = true;
          lunarSurfaceScene.visible = true;
        }
      }

      // Earth & Moon world positioning
      if (p.missionPhase === 'PAD_READY') {
        rocketMasterGroup.position.set(0, 10.5, 0);
        groundSceneGroup.visible = true;
        earthMesh.visible = false;
        moonMesh.visible = false;
      } else if (p.missionPhase === 'ASCENT' || p.missionPhase === 'ORBIT_INSERTION') {
        const normAlt = p.altM / 1000;
        rocketMasterGroup.position.set(normAlt * 0.35, Math.min(130, 10.5 + normAlt * 0.8), -normAlt * 0.2);
        groundSceneGroup.visible = normAlt < 45;
        earthMesh.visible = normAlt >= 15;
        earthMesh.position.set(0, -earthRadius - normAlt * 0.3, 0);
      } else if (['ORBIT_COAST', 'TLI_BURN', 'DEEP_CRUISE'].includes(p.missionPhase)) {
        groundSceneGroup.visible = false;
        earthMesh.visible = true;
        moonMesh.visible = true;
        rocketMasterGroup.position.set(0, 0, 0);
      } else if (['REENTRY_PLASMA', 'PARACHUTE_DESCENT', 'SPLASHDOWN'].includes(p.missionPhase)) {
        groundSceneGroup.visible = false;
        earthMesh.visible = true;
        moonMesh.visible = false;
        rocketMasterGroup.position.set(0, Math.min(60, p.altM / 1000), 0);
      }

      // ─── 3D CAMERA RIG ───
      const camDist = p.viewMode === 'PAD_CAM' ? 55 : p.viewMode === 'ORBIT_MAP' ? 700 : 34;
      const phi = p.cameraAngleY;
      const theta = p.cameraAngleX;

      const targetPos = isLunarSurfaceMode ? apolloLmGroup.position : rocketMasterGroup.position;
      camera.position.x = targetPos.x + camDist * Math.cos(phi) * Math.sin(theta);
      camera.position.y = targetPos.y + camDist * Math.sin(phi);
      camera.position.z = targetPos.z + camDist * Math.cos(phi) * Math.cos(theta);
      camera.lookAt(targetPos.clone().add(new THREE.Vector3(0, 2.5, 0)));

      // Sync telemetry states for React HUD (throttled to ~15 Hz)
      setFlightAltM(p.altM);
      setFlightSpeedMs(p.velMs);
      setFlightVyMs(p.vyMs);
      setFlightVxMs(p.vxMs);
      setFlightFuelPct(p.fuelPct);

      // Render 3D Scene
      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(animate);

    // Resize Handler
    const handleResize = () => {
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

  // ─── ATTITUDE NAVBALL CANVAS RENDERER ──────────────────────────────────────
  useEffect(() => {
    if (!isOpen || !navballCanvasRef.current) return;
    const canvas = navballCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, 96, 96);
    const cx = 48;
    const cy = 48;
    const r = 42;

    // Outer ring
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();

    // Pitch horizon calculation
    const pitchOffset = ((90 - pitchDeg) / 90) * (r * 0.9);

    // Sky half (Blue)
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(0, 0, 96, cy + pitchOffset);

    // Ground half (Brown)
    ctx.fillStyle = '#92400e';
    ctx.fillRect(0, cy + pitchOffset, 96, 96);

    // Artificial Horizon Line
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(6, cy + pitchOffset);
    ctx.lineTo(90, cy + pitchOffset);
    ctx.stroke();

    // Target reticle
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(cx, cy, 6, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();

    // Glass bezel
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }, [isOpen, pitchDeg]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: '#020617',
        color: '#f8fafc',
        fontFamily: 'Inter, system-ui, sans-serif',
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 100% FULL-SCREEN EDGE-TO-EDGE 3D VIEWPORT CANVAS                    */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div
        ref={mountRef}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          cursor: simRef.current.isMouseDown ? 'grabbing' : 'grab',
        }}
      />

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* TOP HEADER: MISSION SELECTOR & PHASE BREADCRUMB PROGRESS            */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          padding: '12px 20px',
          background: 'linear-gradient(180deg, rgba(2,6,23,0.95) 0%, rgba(2,6,23,0.65) 80%, transparent 100%)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          zIndex: 100,
          pointerEvents: 'auto',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          {/* Mission Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {(['SUBORBITAL', 'ORBITAL', 'MOON', 'MARS'] as ExpeditionDestination[]).map((dest, idx) => {
              const prof = DESTINATION_PROFILES[dest];
              const isSelected = destination === dest;
              return (
                <button
                  key={dest}
                  onClick={() => resetSimulation(dest)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 14px',
                    borderRadius: '8px',
                    background: isSelected ? 'linear-gradient(135deg, #0284c7, #0369a1)' : 'rgba(15, 23, 42, 0.75)',
                    border: `1.5px solid ${isSelected ? '#38bdf8' : 'rgba(255,255,255,0.15)'}`,
                    color: isSelected ? '#ffffff' : '#94a3b8',
                    fontWeight: 800,
                    fontSize: '11px',
                    cursor: 'pointer',
                    boxShadow: isSelected ? '0 0 15px rgba(56, 189, 248, 0.4)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span>{prof.badge}</span>
                  <span>{idx + 1}. {prof.name.split(':')[0]}</span>
                </button>
              );
            })}
          </div>

          {/* Right Utilities */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => setSoundEnabled((v) => !v)}
              style={{
                background: 'rgba(15, 23, 42, 0.75)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: soundEnabled ? '#38bdf8' : '#64748b',
                borderRadius: '8px',
                padding: '6px 10px',
                cursor: 'pointer',
              }}
              title="Toggle Engine Audio Synthesis"
            >
              {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid #ef4444',
                color: '#ffffff',
                borderRadius: '8px',
                padding: '6px 12px',
                fontWeight: 800,
                fontSize: '11px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <X size={14} /> EXIT
            </button>
          </div>
        </div>

        {/* Phase Breadcrumbs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
          {[
            { phase: 'PAD_READY', label: '1. Pad 39A' },
            { phase: 'ASCENT', label: '2. Ascent & Staging' },
            { phase: 'ORBIT_COAST', label: '3. Earth Orbit' },
            { phase: 'TLI_BURN', label: '4. TLI Burn' },
            { phase: 'DEEP_CRUISE', label: '5. Deep Cruise' },
            { phase: 'RETRO_DESCENT', label: '6. Lunar Descent' },
            { phase: 'SURFACE_EVA', label: '7. Moon EVA' },
            { phase: 'SURFACE_ASCENT', label: '8. Ascent & Return' },
            { phase: 'SPLASHDOWN', label: '9. Splashdown' },
          ].map((item) => {
            const isActive = missionPhase === item.phase;
            return (
              <div
                key={item.phase}
                style={{
                  padding: '3px 8px',
                  borderRadius: '6px',
                  fontSize: '9.5px',
                  fontWeight: 800,
                  fontFamily: 'monospace',
                  background: isActive ? '#0284c7' : 'rgba(15, 23, 42, 0.6)',
                  border: `1px solid ${isActive ? '#38bdf8' : 'rgba(255,255,255,0.08)'}`,
                  color: isActive ? '#ffffff' : '#64748b',
                  whiteSpace: 'nowrap',
                }}
              >
                {item.label}
              </div>
            );
          })}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* CENTER TOP: FLIGHT DIRECTOR GUIDANCE COMPUTER CALLOUT BANNER        */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          top: '90px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(15, 23, 42, 0.85)',
          border: '1.5px solid #38bdf8',
          borderRadius: '10px',
          padding: '8px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          boxShadow: '0 0 25px rgba(56, 189, 248, 0.3)',
          zIndex: 90,
          pointerEvents: 'none',
          maxWidth: '850px',
        }}
      >
        <Radio size={16} color="#38bdf8" />
        <span style={{ fontSize: '12px', fontWeight: 900, fontFamily: 'monospace', color: '#f8fafc', letterSpacing: '0.04em' }}>
          {directorCallout}
        </span>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* LEFT: PRIMARY TELEMETRY & ATTITUDE INDICATOR (AEROSPACE HUD)        */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          top: '140px',
          left: '20px',
          background: 'rgba(15, 23, 42, 0.88)',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          borderRadius: '12px',
          padding: '14px 16px',
          width: '210px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
          zIndex: 80,
          pointerEvents: 'auto',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '6px' }}>
          <span style={{ fontSize: '10px', fontWeight: 900, color: '#38bdf8', fontFamily: 'monospace' }}>FLIGHT TELEMETRY</span>
          <span style={{ fontSize: '9px', color: '#22c55e', fontWeight: 800 }}>LIVE 60 FPS</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
          <span style={{ color: '#94a3b8' }}>ALTITUDE:</span>
          <strong style={{ color: '#ffffff', fontFamily: 'monospace' }}>
            {flightAltM >= 1000 ? `${(flightAltM / 1000).toFixed(1)} km` : `${Math.round(flightAltM)} m`}
          </strong>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
          <span style={{ color: '#94a3b8' }}>TOTAL VELOCITY:</span>
          <strong style={{ color: '#38bdf8', fontFamily: 'monospace' }}>
            {flightSpeedMs >= 1000 ? `${(flightSpeedMs / 1000).toFixed(2)} km/s` : `${Math.round(flightSpeedMs)} m/s`}
          </strong>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
          <span style={{ color: '#94a3b8' }}>VERTICAL SPEED (Vy):</span>
          <strong style={{ color: flightVyMs < -5 ? '#ef4444' : '#4ade80', fontFamily: 'monospace' }}>
            {flightVyMs.toFixed(1)} m/s
          </strong>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
          <span style={{ color: '#94a3b8' }}>PITCH ANGLE:</span>
          <strong style={{ color: '#fbbf24', fontFamily: 'monospace' }}>{Math.round(pitchDeg)}°</strong>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
          <span style={{ color: '#94a3b8' }}>PROPELLANT:</span>
          <strong style={{ color: flightFuelPct < 20 ? '#ef4444' : '#38bdf8', fontFamily: 'monospace' }}>
            {flightFuelPct.toFixed(0)}%
          </strong>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
          <span style={{ color: '#94a3b8' }}>ACTIVE STAGE:</span>
          <strong style={{ color: '#a855f7', fontFamily: 'monospace' }}>STAGE {rocketStage} / 3</strong>
        </div>

        {/* Attitude Navball */}
        <div style={{ marginTop: '6px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '8px' }}>
          <span style={{ fontSize: '9px', fontWeight: 800, color: '#94a3b8' }}>ATTITUDE NAVBALL</span>
          <canvas ref={navballCanvasRef} width={96} height={96} style={{ width: '84px', height: '84px' }} />
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* FLOATING VAB BUILDER OVERLAY (WHEN OPEN)                            */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {isVabOpen && (
        <div
          style={{
            position: 'absolute',
            top: '140px',
            right: '20px',
            width: '380px',
            background: 'rgba(15, 23, 42, 0.94)',
            border: '1.5px solid #38bdf8',
            borderRadius: '14px',
            padding: '18px',
            zIndex: 150,
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            boxShadow: '0 12px 48px rgba(0,0,0,0.8)',
            maxHeight: 'calc(100vh - 260px)',
            overflowY: 'auto',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#38bdf8', fontWeight: 900, fontSize: '13px' }}>
              <Wrench size={18} />
              VAB VEHICLE CONFIGURATION
            </div>
            <button onClick={() => setIsVabOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
              <X size={18} />
            </button>
          </div>

          <div>
            <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 800, marginBottom: '6px' }}>SELECT STRAP-ON BOOSTERS</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {VAB_BOOSTERS.map((b) => (
                <button
                  key={b.id}
                  onClick={() => setSelectedBooster(b)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '8px',
                    background: selectedBooster.id === b.id ? 'rgba(2, 132, 199, 0.3)' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${selectedBooster.id === b.id ? '#38bdf8' : 'rgba(255,255,255,0.1)'}`,
                    color: '#ffffff',
                    textAlign: 'left',
                    fontSize: '11px',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ fontWeight: 800 }}>{b.name}</div>
                  <div style={{ fontSize: '9px', color: '#94a3b8' }}>Thrust: {b.thrustKn} kN · {b.description}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 800, marginBottom: '6px' }}>CORE PROPULSION STAGE</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {VAB_CORE_STAGES.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCore(c)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '8px',
                    background: selectedCore.id === c.id ? 'rgba(2, 132, 199, 0.3)' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${selectedCore.id === c.id ? '#38bdf8' : 'rgba(255,255,255,0.1)'}`,
                    color: '#ffffff',
                    textAlign: 'left',
                    fontSize: '11px',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ fontWeight: 800 }}>{c.name} ({c.engineCount}x Engines)</div>
                  <div style={{ fontSize: '9px', color: '#94a3b8' }}>Thrust: {c.thrustKn} kN · {c.description}</div>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => setIsVabOpen(false)}
            style={{
              padding: '10px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              border: 'none',
              color: '#ffffff',
              fontWeight: 900,
              fontSize: '11px',
              cursor: 'pointer',
            }}
          >
            CONFIRM CONFIGURATION & RETURN TO PAD
          </button>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* FLOATING LAUNCH PAD WEATHER CHECK (WHEN OPEN)                       */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {isWeatherOpen && (
        <div
          style={{
            position: 'absolute',
            top: '140px',
            right: '20px',
            width: '360px',
            background: 'rgba(15, 23, 42, 0.94)',
            border: '1.5px solid #22c55e',
            borderRadius: '14px',
            padding: '18px',
            zIndex: 150,
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            boxShadow: '0 12px 48px rgba(0,0,0,0.8)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#22c55e', fontWeight: 900, fontSize: '13px' }}>
              <Sun size={18} />
              NASA 45TH WEATHER SQUADRON REPORT
            </div>
            <button onClick={() => setIsWeatherOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
              <X size={18} />
            </button>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>SURFACE WINDS:</span>
              <strong style={{ color: '#ffffff' }}>{weatherReport.windSpeedKts} kts (GUSTS {weatherReport.windGustsKts} kts)</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>CLOUD CEILING:</span>
              <strong style={{ color: '#ffffff' }}>{weatherReport.cloudCeilingFt.toLocaleString()} ft ({weatherReport.relativeHumidityPct}% RH)</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>LIGHTNING PROBABILITY:</span>
              <strong style={{ color: weatherReport.lightningProbabilityPct < 20 ? '#22c55e' : '#ef4444' }}>
                {weatherReport.lightningProbabilityPct}%
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>GEOMAGNETIC KP:</span>
              <strong style={{ color: weatherReport.geomagneticKpIndex <= 4 ? '#22c55e' : '#f59e0b' }}>
                Kp {weatherReport.geomagneticKpIndex}
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>LAUNCH CLEARANCE:</span>
              <strong style={{ color: weatherReport.weatherStatus === 'GO' ? '#22c55e' : '#ef4444' }}>
                {weatherReport.weatherStatus === 'GO' ? '✅ GO FOR LAUNCH' : '❌ NO-GO (SCRUB)'}
              </strong>
            </div>
          </div>

          <button
            onClick={() => setIsWeatherOpen(false)}
            style={{
              padding: '10px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #0284c7, #0369a1)',
              border: 'none',
              color: '#ffffff',
              fontWeight: 900,
              fontSize: '11px',
              cursor: 'pointer',
            }}
          >
            ACKNOWLEDGE WEATHER & PROCEED
          </button>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* BOTTOM CONTROLS DECK: INTERACTIVE ACTIONS & FLIGHT INSTRUMENTS      */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          bottom: '20px',
          left: '20px',
          right: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '14px',
          zIndex: 100,
          pointerEvents: 'none',
        }}
      >
        {/* Left: Camera & Time Warp Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', pointerEvents: 'auto' }}>
          {(['CHASE', 'ORBIT_MAP', 'PAD_CAM'] as FlightViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                background: viewMode === mode ? '#0284c7' : 'rgba(15, 23, 42, 0.85)',
                border: `1.5px solid ${viewMode === mode ? '#38bdf8' : 'rgba(255,255,255,0.15)'}`,
                color: '#ffffff',
                fontSize: '10.5px',
                fontWeight: 900,
                cursor: 'pointer',
              }}
            >
              {mode === 'CHASE' ? '🎥 CHASE' : mode === 'ORBIT_MAP' ? '🌍 ORBIT MAP' : '🚀 PAD / SURFACE'}
            </button>
          ))}

          {/* Time Warp Selector */}
          <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(15, 23, 42, 0.85)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', overflow: 'hidden' }}>
            {[1, 5, 25, 100].map((w) => (
              <button
                key={w}
                onClick={() => setTimeWarp(w)}
                style={{
                  padding: '6px 10px',
                  background: timeWarp === w ? '#a855f7' : 'transparent',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '10px',
                  fontWeight: 900,
                  cursor: 'pointer',
                }}
              >
                {w}x
              </button>
            ))}
          </div>
        </div>

        {/* Center: BIG ADAPTIVE PRIMARY ACTION BUTTON */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', pointerEvents: 'auto' }}>
          {missionPhase === 'PAD_READY' && (
            <>
              <button
                onClick={() => setIsVabOpen((v) => !v)}
                style={{
                  padding: '12px 18px',
                  borderRadius: '10px',
                  background: 'rgba(15, 23, 42, 0.85)',
                  border: '1.5px solid #38bdf8',
                  color: '#ffffff',
                  fontWeight: 900,
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Wrench size={16} /> VAB BUILDER
              </button>

              <button
                onClick={() => setIsWeatherOpen((v) => !v)}
                style={{
                  padding: '12px 18px',
                  borderRadius: '10px',
                  background: 'rgba(15, 23, 42, 0.85)',
                  border: '1.5px solid #22c55e',
                  color: '#ffffff',
                  fontWeight: 900,
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Sun size={16} /> PAD WEATHER
              </button>

              <button
                onClick={handleStageTrigger}
                style={{
                  padding: '14px 28px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #16a34a, #15803d)',
                  border: '2px solid #22c55e',
                  color: '#ffffff',
                  fontWeight: 900,
                  fontSize: '14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 0 30px rgba(34, 197, 94, 0.6)',
                }}
              >
                <span>🔥</span> T-0 IGNITE & LIFTOFF [Z]
              </button>
            </>
          )}

          {missionPhase === 'ASCENT' && (
            <button
              onClick={handleStageTrigger}
              style={{
                padding: '14px 28px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                border: '2px solid #38bdf8',
                color: '#ffffff',
                fontWeight: 900,
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 0 25px rgba(56, 189, 248, 0.5)',
              }}
            >
              <span>⚡</span> JETTISON BOOSTERS (STAGE) [SPACE]
            </button>
          )}

          {missionPhase === 'ORBIT_COAST' && (
            <button
              onClick={() => {
                setMissionPhase('TLI_BURN');
                setThrottle(100);
                setDirectorCallout('🔥 EXECUTING TRANS-LUNAR INJECTION (TLI) BURN (+3,050 m/s Δv)!');
                if (soundEnabled) soundFx.playReactorStart();
              }}
              style={{
                padding: '14px 28px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #a855f7, #7e22ce)',
                border: '2px solid #c084fc',
                color: '#ffffff',
                fontWeight: 900,
                fontSize: '14px',
                cursor: 'pointer',
                boxShadow: '0 0 30px rgba(168, 85, 247, 0.6)',
              }}
            >
              <span>🌕</span> EXECUTE TRANS-LUNAR INJECTION (TLI)
            </button>
          )}

          {missionPhase === 'TLI_BURN' && (
            <button
              onClick={() => {
                setMissionPhase('DEEP_CRUISE');
                setTimeWarp(100);
                setDirectorCallout('⏩ ENGAGING 100x TIME WARP FOR CISLUNAR TRANSIT (384,400 KM)');
              }}
              style={{
                padding: '14px 28px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #eab308, #ca8a04)',
                border: '2px solid #fde047',
                color: '#ffffff',
                fontWeight: 900,
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              <span>⏩</span> TIME WARP TO MOON (100x)
            </button>
          )}

          {missionPhase === 'DEEP_CRUISE' && (
            <button
              onClick={() => {
                setMissionPhase('LUNAR_CAPTURE');
                setTimeWarp(1);
                setDirectorCallout('🌑 ENTERING MOON ORBIT (LOI)! CSM SEPARATES FROM LUNAR MODULE');
              }}
              style={{
                padding: '14px 28px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                border: '2px solid #38bdf8',
                color: '#ffffff',
                fontWeight: 900,
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              <span>🌑</span> ENTER LUNAR ORBIT INSERTION
            </button>
          )}

          {missionPhase === 'LUNAR_CAPTURE' && (
            <button
              onClick={() => {
                setMissionPhase('RETRO_DESCENT');
                setFlightAltM(12000);
                setFlightVyMs(-35);
                setThrottle(40);
                setLandingLegsDeployed(true);
                setDirectorCallout('🌕 POWERED DESCENT INITIATION (PDI)! CONTROL THROTTLE [W]/[S] (< 3.5 m/s)');
                if (soundEnabled) soundFx.playReactorStart();
              }}
              style={{
                padding: '14px 28px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #f97316, #ea580c)',
                border: '2px solid #fb923c',
                color: '#ffffff',
                fontWeight: 900,
                fontSize: '14px',
                cursor: 'pointer',
                boxShadow: '0 0 30px rgba(249, 115, 22, 0.6)',
              }}
            >
              <span>🌕</span> COMMENCE POWERED DESCENT [W/S]
            </button>
          )}

          {missionPhase === 'RETRO_DESCENT' && (
            <button
              onClick={() => {
                setLandingLegsDeployed(true);
                setFlightAltM(0);
                setFlightVyMs(-1.8);
                setTouchdownStatus('SAFE');
                setMissionPhase('SURFACE_LANDED');
                setDirectorCallout('🎉 NOMINAL TOUCHDOWN! HOUSTON, TRANQUILITY BASE HERE. THE EAGLE HAS LANDED');
                confetti({ particleCount: 180, spread: 100 });
                if (soundEnabled) soundFx.playVictory();
              }}
              style={{
                padding: '14px 28px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                border: '2px solid #34d399',
                color: '#ffffff',
                fontWeight: 900,
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              <span>🦿</span> TOUCHDOWN ON MOON SURFACE
            </button>
          )}

          {missionPhase === 'SURFACE_LANDED' && (
            <button
              onClick={() => {
                setMissionPhase('SURFACE_EVA');
                setDirectorCallout('🧑‍🚀 NEIL ARMSTRONG DESCENDS LADDER: "THAT\'S ONE SMALL STEP FOR MAN, ONE GIANT LEAP FOR MANKIND"');
                confetti({ particleCount: 200, spread: 100 });
                if (soundEnabled) soundFx.playVictory();
              }}
              style={{
                padding: '14px 28px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                border: '2px solid #38bdf8',
                color: '#ffffff',
                fontWeight: 900,
                fontSize: '14px',
                cursor: 'pointer',
                boxShadow: '0 0 30px rgba(56, 189, 248, 0.6)',
              }}
            >
              <span>🧑‍🚀</span> STEP OUT ON MOON EVA (NEIL ARMSTRONG)
            </button>
          )}

          {missionPhase === 'SURFACE_EVA' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={() => {
                  setEvaTasks((t) => ({ ...t, flagPlanted: true }));
                  setDirectorCallout('🚩 AMERICAN FLAG PLANTED AT TRANQUILITY BASE!');
                  confetti({ particleCount: 80, spread: 60 });
                }}
                style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: evaTasks.flagPlanted ? '#16a34a' : 'rgba(15, 23, 42, 0.85)',
                  border: '1.5px solid #22c55e',
                  color: '#ffffff',
                  fontWeight: 900,
                  fontSize: '11px',
                  cursor: 'pointer',
                }}
              >
                🚩 PLANT FLAG {evaTasks.flagPlanted ? '✓' : ''}
              </button>

              <button
                onClick={() => {
                  setEvaTasks((t) => ({ ...t, sampleDrilled: true }));
                  setDirectorCallout('⛏️ LUNAR REGOLITH CORE SAMPLE EXTRACTED & STORED IN CAPSULE!');
                  confetti({ particleCount: 80, spread: 60 });
                }}
                style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: evaTasks.sampleDrilled ? '#16a34a' : 'rgba(15, 23, 42, 0.85)',
                  border: '1.5px solid #38bdf8',
                  color: '#ffffff',
                  fontWeight: 900,
                  fontSize: '11px',
                  cursor: 'pointer',
                }}
              >
                ⛏️ SAMPLE DRILL {evaTasks.sampleDrilled ? '✓' : ''}
              </button>

              <button
                onClick={() => {
                  setMissionPhase('SURFACE_ASCENT');
                  setFlightAltM(100);
                  setFlightVyMs(80);
                  setThrottle(100);
                  setDirectorCallout('🚀 ASCENT STAGE LIFTOFF! SEPARATING FROM DESCENT STAGE');
                  if (soundEnabled) soundFx.playReactorStart();
                }}
                style={{
                  padding: '12px 20px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #16a34a, #15803d)',
                  border: '2px solid #22c55e',
                  color: '#ffffff',
                  fontWeight: 900,
                  fontSize: '12px',
                  cursor: 'pointer',
                  boxShadow: '0 0 25px rgba(34, 197, 94, 0.6)',
                }}
              >
                <span>🚀</span> LAUNCH ASCENT STAGE & RETURN
              </button>
            </div>
          )}

          {missionPhase === 'SURFACE_ASCENT' && (
            <button
              onClick={() => {
                setMissionPhase('TEI_RETURN');
                setDirectorCallout('🌍 RENDEZVOUS COMPLETE! BURNING TRANS-EARTH INJECTION (TEI)');
              }}
              style={{
                padding: '14px 28px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                border: '2px solid #38bdf8',
                color: '#ffffff',
                fontWeight: 900,
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              <span>🌍</span> TRANS-EARTH INJECTION RETURN
            </button>
          )}

          {missionPhase === 'TEI_RETURN' && (
            <button
              onClick={() => {
                setMissionPhase('REENTRY_PLASMA');
                setFlightAltM(65000);
                setFlightVyMs(-180);
                setDirectorCallout('🔥 HYPERSONIC RE-ENTRY AT 11 KM/S! HEAT SHIELD PLASMA GLOWING');
                if (soundEnabled) soundFx.playReactorStart();
              }}
              style={{
                padding: '14px 28px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #ea580c, #c2410c)',
                border: '2px solid #f97316',
                color: '#ffffff',
                fontWeight: 900,
                fontSize: '14px',
                cursor: 'pointer',
                boxShadow: '0 0 30px rgba(234, 88, 12, 0.7)',
              }}
            >
              <span>🔥</span> ENTER ATMOSPHERIC RE-ENTRY
            </button>
          )}

          {missionPhase === 'REENTRY_PLASMA' && (
            <button
              onClick={handleDeployChutes}
              style={{
                padding: '14px 28px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                border: '2px solid #38bdf8',
                color: '#ffffff',
                fontWeight: 900,
                fontSize: '14px',
                cursor: 'pointer',
                boxShadow: '0 0 25px rgba(56, 189, 248, 0.5)',
              }}
            >
              <span>🪂</span> DEPLOY TRIPLE MAIN PARACHUTES [P]
            </button>
          )}

          {missionPhase === 'PARACHUTE_DESCENT' && (
            <button
              onClick={() => {
                setFlightAltM(0);
                setFlightVyMs(-2);
                setMissionPhase('SPLASHDOWN');
                setDirectorCallout('🏆 PACIFIC OCEAN SPLASHDOWN NOMINAL! USS HORNET RETRIEVAL COMPLETE');
                confetti({ particleCount: 220, spread: 100 });
                if (soundEnabled) soundFx.playVictory();
                awardCadetCredits(1500);
                onMissionCompleted?.(destination, 1500);
              }}
              style={{
                padding: '14px 28px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                border: '2px solid #34d399',
                color: '#ffffff',
                fontWeight: 900,
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              <span>🪂</span> OCEAN TOUCHDOWN
            </button>
          )}

          {missionPhase === 'SPLASHDOWN' && (
            <button
              onClick={() => resetSimulation(destination)}
              style={{
                padding: '14px 28px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #16a34a, #15803d)',
                border: '2px solid #22c55e',
                color: '#ffffff',
                fontWeight: 900,
                fontSize: '14px',
                cursor: 'pointer',
                boxShadow: '0 0 30px rgba(34, 197, 94, 0.6)',
              }}
            >
              <span>🏆</span> MISSION ACCOMPLISHED · FLY AGAIN
            </button>
          )}
        </div>

        {/* Right: Throttle & Pitch Steering Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(15, 23, 42, 0.88)', padding: '10px 14px', borderRadius: '12px', border: '1px solid rgba(56, 189, 248, 0.3)', pointerEvents: 'auto' }}>
          {/* Throttle Slider */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', width: '130px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#94a3b8', fontWeight: 800 }}>
              <span>THROTTLE</span>
              <span style={{ color: '#38bdf8' }}>{Math.round(throttle)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={throttle}
              onChange={(e) => setThrottle(Number(e.target.value))}
              style={{ accentColor: '#38bdf8', cursor: 'pointer' }}
            />
          </div>

          <button
            onClick={() => setThrottle(0)}
            style={{
              padding: '6px 10px',
              borderRadius: '6px',
              background: '#ef4444',
              border: 'none',
              color: '#ffffff',
              fontSize: '10px',
              fontWeight: 900,
              cursor: 'pointer',
            }}
          >
            CUT [X]
          </button>

          <button
            onClick={() => setThrottle(100)}
            style={{
              padding: '6px 10px',
              borderRadius: '6px',
              background: '#16a34a',
              border: 'none',
              color: '#ffffff',
              fontSize: '10px',
              fontWeight: 900,
              cursor: 'pointer',
            }}
          >
            MAX [Z]
          </button>

          {/* Pitch Steering */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button
              onClick={() => setPitchDeg((p) => Math.min(90, p + 5))}
              style={{
                padding: '6px 10px',
                borderRadius: '6px',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: '#ffffff',
                fontSize: '10px',
                fontWeight: 900,
                cursor: 'pointer',
              }}
              title="Steer Pitch Up [A]"
            >
              ▲ PITCH [A]
            </button>
            <button
              onClick={() => setPitchDeg((p) => Math.max(0, p - 5))}
              style={{
                padding: '6px 10px',
                borderRadius: '6px',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: '#ffffff',
                fontSize: '10px',
                fontWeight: 900,
                cursor: 'pointer',
              }}
              title="Steer Pitch Down [D]"
            >
              ▼ PITCH [D]
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
