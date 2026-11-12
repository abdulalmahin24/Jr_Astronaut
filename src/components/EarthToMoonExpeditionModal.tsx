// ============================================================
// EarthToMoonExpeditionModal.tsx
// NASA Artemis Full Mission: Earth Launch to Moon Landing
// State-of-the-art WebGL / Three.js Simulation
// Multi-Stage: Pad 39B Liftoff -> SRB Sep -> TLI Burn -> Deep Space -> Lunar Descent -> Touchdown
// ============================================================

import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { getSharedGLTFLoader } from '../utils/modelLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import confetti from 'canvas-confetti';
import {
  X,
  Volume2,
  VolumeX,
  Music,
  Compass,
  Rocket,
  Flame,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Eye,
  Activity,
  Layers,
  ChevronRight,
  Radio,
} from 'lucide-react';
import { soundFx } from '../utils/audioEffects';
import { spaceMusicEngine } from '../utils/spaceMusicEngine';
import { speechEngine } from '../utils/speechEngine';
import { AuthenticCockpitOverlay } from './AuthenticCockpitOverlay';
import type { MissionGameConfig } from '../game/missionGameData';

interface EarthToMoonExpeditionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenMoonquakeMap?: () => void;
}

export type ExpeditionPhase =
  | 'PAD_LAUNCH'        // Stage 1: Pad 39B liftoff (0-70 km)
  | 'TLI_INJECTION'     // Stage 2: Earth orbit & Trans-Lunar Injection (70-2,000 km)
  | 'CISLUNAR_COAST'    // Stage 3: Deep space coast to Moon (2,000-380,000 km)
  | 'LUNAR_DESCENT'     // Stage 4: Powered descent to lunar surface (30 km to 0 m)
  | 'SURFACE_TOUCHDOWN'; // Stage 5: Landed at Shackleton Crater South Pole

export type AdvancedMissionProfile =
  | 'NEW_SHEPARD'
  | 'ARTEMIS_5'
  | 'APOLLO_11'
  | 'STS_31'
  | 'ISS_DRAGON'
  | 'MARS_PERSEV';

export interface MissionProfileMeta {
  id: AdvancedMissionProfile;
  title: string;
  badge: string;
  craft: string;
  destination: string;
  description: string;
  crew: string;
  launchSite: string;
  videoUrl?: string;
  youtubeId?: string;
  flightDuration?: string;
  apogeeKm?: number;
}

export const ADVANCED_PROFILES: MissionProfileMeta[] = [
  {
    id: 'NEW_SHEPARD',
    title: 'New Shepard: Space & Back in 10 Minutes',
    badge: 'COMMERCIAL ASTRONAUT · 10 MIN PROFILE',
    craft: 'New Shepard Reusable Booster (BE-3PM) + RSS First Step Crew Capsule',
    destination: 'Kármán Line Space Boundary (106 km Apogee)',
    description: 'Fly the authentic 10-minute commercial suborbital spaceflight featured in the YouTube flight profile (https://www.youtube.com/watch?v=O9E0Ljd2ML8): Liftoff from Launch Site One (West Texas), punch through Max-Q past Mach 3, separate crew capsule at 100 km Kármán line, experience zero-G microgravity with panoramic Earth horizon views, watch the booster perform autonomous vertical propulsive landing, and descend under three giant parachutes with retro-thrust touchdown.',
    crew: 'Commercial Astronaut Crew (6 Astronauts)',
    launchSite: 'Launch Site One, West Texas (Corn Ranch)',
    videoUrl: 'https://www.youtube.com/watch?v=O9E0Ljd2ML8',
    youtubeId: 'O9E0Ljd2ML8',
    flightDuration: '10 min 15 sec',
    apogeeKm: 106,
  },
  {
    id: 'ARTEMIS_5',
    title: 'Artemis V: Lunar South Pole Expedition',
    badge: 'DEEP SPACE LEVEL 5',
    craft: 'SLS Block 1B + Orion MPCV + Starship HLS',
    destination: 'Shackleton Crater Rim (-89.9°S)',
    description: 'Launch from Pad 39B, execute Trans-Lunar Injection (TLI), navigate 384,400 km cislunar transfer, and brake into low lunar orbit for powered touchdown.',
    crew: 'CDR Wiseman · PLT Glover · MS Koch · MS Hansen',
    launchSite: 'Kennedy Space Center LC-39B',
  },
  {
    id: 'APOLLO_11',
    title: 'Apollo 11: First Human Moon Landing',
    badge: 'HISTORIC RE-CREATION',
    craft: 'Saturn V (SA-506) + CSM Columbia + LM Eagle',
    destination: 'Mare Tranquillitatis (0.67°N, 23.47°E)',
    description: 'Relive humanity’s greatest voyage. Saturn V liftoff, Free-Return translunar trajectory, Eagle separation, 1202 program alarm descent, and historic lunar contact.',
    crew: 'CDR Neil Armstrong · LMP Buzz Aldrin · CMP Michael Collins',
    launchSite: 'Kennedy Space Center LC-39A',
  },
  {
    id: 'STS_31',
    title: 'STS-31: Space Shuttle Hubble Deployment',
    badge: 'ORBITAL EXTRAVEHICULAR',
    craft: 'Space Shuttle Discovery (OV-103)',
    destination: '600 km Low Earth Orbit (28.5° Inc)',
    description: 'Ascend to 600 km orbital altitude, open cargo payload bay doors, unberth Hubble Space Telescope using Canadarm RMS robotic manipulator arm, and release into orbit.',
    crew: 'CDR Loren Shriver · PLT Charles Bolden · MS Steven Hawley · MS Bruce McCandless',
    launchSite: 'Kennedy Space Center LC-39B',
  },
  {
    id: 'ISS_DRAGON',
    title: 'ISS Expedition: Commercial Crew Docking',
    badge: 'AUTONOMOUS RENDEZVOUS',
    craft: 'Crew Dragon Freedom + Falcon 9 Block 5',
    destination: 'International Space Station (IDA-2 Docking Port)',
    description: 'Rendezvous at 400 km orbital altitude, establish 200m approach corridor, perform precision reaction control system (RCS) burns, and achieve soft capture seal.',
    crew: 'CDR Kjell Lindgren · PLT Robert Hines · MS Samantha Cristoforetti',
    launchSite: 'Cape Canaveral SLC-40',
  },
  {
    id: 'MARS_PERSEV',
    title: 'Mars 2020: 7 Minutes of Terror EDL',
    badge: 'INTERPLANETARY ENTRY',
    craft: 'Atlas V 541 + Aeroshell Heatshield + Sky Crane',
    destination: 'Jezero Crater, Mars (18.38°N, 77.58°E)',
    description: 'Hypersonic Martian atmospheric entry at 20,000 km/h, supersonic parachute mortar deployment, terrain-relative navigation, and rocket-powered Sky Crane touchdown.',
    crew: 'JPL Flight Control Team · Autonomous Deep Space Computer',
    launchSite: 'Cape Canaveral SLC-41',
  },
];

// Procedural Rocket Rumble Audio Synth
class ExpeditionAudioSynth {
  private ctx: AudioContext | null = null;
  private engineOsc: OscillatorNode | null = null;
  private noiseNode: AudioBufferSourceNode | null = null;
  private engineGain: GainNode | null = null;
  private enabled: boolean = true;

  init() {
    if (this.ctx) return;
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    } catch {}
  }

  setEnabled(val: boolean) {
    this.enabled = val;
    if (!val && this.engineGain && this.ctx) {
      this.engineGain.gain.setValueAtTime(0, this.ctx.currentTime);
    }
  }

  setEngineThrust(throttle: number) {
    if (!this.enabled || !this.ctx) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    if (throttle > 0.02) {
      if (!this.engineOsc) {
        // Deep sub-bass rumble oscillator
        this.engineOsc = this.ctx.createOscillator();
        this.engineOsc.type = 'sawtooth';
        this.engineGain = this.ctx.createGain();
        this.engineGain.gain.setValueAtTime(0, this.ctx.currentTime);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(95, this.ctx.currentTime);

        this.engineOsc.connect(filter);
        filter.connect(this.engineGain);
        this.engineGain.connect(this.ctx.destination);
        this.engineOsc.start();
      }

      const freq = 42 + throttle * 70;
      this.engineOsc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      if (this.engineGain) {
        this.engineGain.gain.setValueAtTime(Math.min(0.3, throttle * 0.28), this.ctx.currentTime);
      }
    } else if (this.engineGain) {
      this.engineGain.gain.setValueAtTime(0, this.ctx.currentTime);
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
    } catch {}
  }
}

export const EarthToMoonExpeditionModal: React.FC<EarthToMoonExpeditionModalProps> = ({
  isOpen,
  onClose,
  onOpenMoonquakeMap,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const navballCanvasRef = useRef<HTMLCanvasElement>(null);
  const audioSynthRef = useRef<ExpeditionAudioSynth>(new ExpeditionAudioSynth());
  const cockpitLookRef = useRef({ yaw: 0, pitch: 0 });
  const doBoosterSeparationRef = useRef<() => void>(() => {});
  const doFairingSeparationRef = useRef<() => void>(() => {});
  const doCoreStageSeparationRef = useRef<() => void>(() => {});

  // Flight Phase & Controls State
  const [phase, setPhase] = useState<ExpeditionPhase>('PAD_LAUNCH');
  const [selectedProfileId, setSelectedProfileId] = useState<AdvancedMissionProfile>('NEW_SHEPARD');
  const [showTrajectoryPlan, setShowTrajectoryPlan] = useState<boolean>(true);
  const [showVideoModal, setShowVideoModal] = useState<boolean>(false);
  const [cameraMode, setCameraMode] = useState<'orbit' | 'chase' | 'cockpit' | 'tower'>('orbit');
  const [musicActive, setMusicActive] = useState<boolean>(!spaceMusicEngine.getIsMuted());
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(true);

  const currentProfile = ADVANCED_PROFILES.find((p) => p.id === selectedProfileId) || ADVANCED_PROFILES[0];

  // Active mission config for era-authentic cockpit overlay
  const activeMission: MissionGameConfig = useMemo(() => {
    const p = ADVANCED_PROFILES.find((x) => x.id === selectedProfileId) || ADVANCED_PROFILES[1];
    return {
      id: p.id,
      missionName: p.title,
      programName: p.id === 'APOLLO_11' ? 'Apollo Program' : p.id === 'STS_31' ? 'Space Shuttle' : p.id === 'NEW_SHEPARD' ? 'Mercury Program' : 'Artemis Program',
      gameType: 'launch' as const,
      difficulty: 2,
      year: p.id === 'APOLLO_11' ? '1969' : p.id === 'STS_31' ? '1990' : '2025',
      briefing: p.description,
      objective: 'Launch from pad, execute multi-stage separation, and achieve stable Low Earth Orbit (LEO) insertion.',
      funFact: p.description,
      params: {
        targetAltitudeKm: p.apogeeKm || 185,
        targetVelocityKms: p.id === 'NEW_SHEPARD' ? 1.1 : 7.8,
        fuelCapacity: 100,
        windEnabled: false,
        hasStageSeparation: true,
        trajectoryWindowDeg: 6,
        timeWindowSec: 180,
      },
    };
  }, [selectedProfileId]);

  // Telemetry HUD State
  const [telemetry, setTelemetry] = useState({
    altitudeKm: 0,
    velocityKms: 0,
    throttle: 0,
    propellant: 100,
    pitchDeg: 90,
    rollDeg: 0,
    gForce: 1.0,
    stage: 1,
    statusText: 'PAD 39B ARMED · READY FOR LIFTOFF',
    statusColor: '#38bdf8',
  });

  // Flight simulation internal variables ref
  const flightStateRef = useRef({
    phase: 'PAD_LAUNCH' as ExpeditionPhase,
    altitudeKm: 0,
    velocityKms: 0,
    throttle: 0,
    propellant: 100,
    pitchDeg: 90,
    rollDeg: 0,
    gForce: 1.0,
    stage: 1,
    isFinished: false,
    keys: {} as Record<string, boolean>,
    lunarDistancePct: 0, // 0 = Earth, 1 = Moon
    statusText: 'PAD 39B ARMED · READY FOR LIFTOFF',
    statusColor: '#38bdf8',
    srbSeparated: false,
    fairingSeparated: false,
    stage1Separated: false,
    orbitConfirmed: false,
    srbSeparationProgress: 0,
    lasJettisoned: false,
    solarArrayDeployed: false,
    touchdownConfirmed: false,
  });

  // Start audio & background music automatically when modal opens
  useEffect(() => {
    if (isOpen) {
      audioSynthRef.current.init();
      spaceMusicEngine.setTheme('LAUNCH');
      spaceMusicEngine.start();
      setMusicActive(!spaceMusicEngine.getIsMuted());
    } else {
      audioSynthRef.current.dispose();
      spaceMusicEngine.stop();
    }
  }, [isOpen]);

  const toggleMusic = () => {
    const isMuted = spaceMusicEngine.toggleMute();
    setMusicActive(!isMuted);
    soundFx.playClick(750);
  };

  const announceCapcom = (msg: string) => {
    if (!voiceEnabled) return;
    try {
      speechEngine.speak(msg, 'HOUSTON_CAPCOM');
    } catch {}
  };

  // Keyboard controls listener
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      flightStateRef.current.keys[k] = true;

      // Spacebar: Liftoff, Stage Separation or Action
      if (e.code === 'Space') {
        e.preventDefault();
        handlePrimaryAction();
      }

      // 'c' key: toggle camera mode
      if (k === 'c') {
        setCameraMode((prev) => (prev === 'chase' ? 'cockpit' : prev === 'cockpit' ? 'tower' : 'chase'));
        soundFx.playClick(850);
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      flightStateRef.current.keys[k] = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [isOpen]);

  // Confirm Stable Low Earth Orbit (LEO) Insertion
  const confirmOrbitInsertion = () => {
    const state = flightStateRef.current;
    if (state.orbitConfirmed) return;
    state.isFinished = true;
    state.orbitConfirmed = true;
    state.altitudeKm = Math.max(185, state.altitudeKm);
    state.velocityKms = Math.max(7.8, state.velocityKms);
    state.statusText = '🌍 ORBITAL INSERTION ACHIEVED · 185 KM × 185 KM STABLE EARTH ORBIT · MISSION COMPLETE!';
    state.statusColor = '#22c55e';
    setTelemetry((prev) => ({
      ...prev,
      altitudeKm: state.altitudeKm,
      velocityKms: state.velocityKms,
      statusText: '🌍 ORBITAL INSERTION ACHIEVED · 185 KM × 185 KM STABLE EARTH ORBIT · MISSION COMPLETE!',
      statusColor: '#22c55e',
    }));
    soundFx.playVictory();
    confetti({ particleCount: 220, spread: 90 });
    announceCapcom('Houston Capcom: Orbital insertion confirmed! All systems nominal. 185 km stable circular orbit achieved!');
  };

  // Pitch Adjustment for manual steering
  const handlePitchChange = (delta: number) => {
    const state = flightStateRef.current;
    state.pitchDeg = Math.max(0, Math.min(90, state.pitchDeg + delta));
    soundFx.playClick(850);
  };

  // Primary Action triggered via Spacebar or big button
  const handlePrimaryAction = () => {
    const state = flightStateRef.current;

    if (state.throttle === 0) {
      state.throttle = 1.0;
      state.statusText = selectedProfileId === 'NEW_SHEPARD'
        ? 'BE-3PM IGNITION & LIFTOFF · WEST TEXAS LAUNCH SITE ONE'
        : 'IGNITION & LIFTOFF · ALL ENGINES RUNNING AT 100%';
      state.statusColor = '#22c55e';
      soundFx.playReactorStart();
      announceCapcom(selectedProfileId === 'NEW_SHEPARD'
        ? 'We have ignition and liftoff of New Shepard! Cleared the tower in West Texas!'
        : 'Ignition, and liftoff! We have cleared the launch tower!');
    } else if (!state.srbSeparated && state.altitudeKm >= 15) {
      doBoosterSeparationRef.current();
    } else if (!state.fairingSeparated && state.altitudeKm >= 45) {
      doFairingSeparationRef.current();
    } else if (!state.stage1Separated && state.altitudeKm >= 80) {
      doCoreStageSeparationRef.current();
    } else if (state.altitudeKm >= 135 && !state.orbitConfirmed) {
      confirmOrbitInsertion();
    }
  };

  const transitionToPhase = (nextPhase: ExpeditionPhase) => {
    const state = flightStateRef.current;
    state.phase = nextPhase;
    setPhase(nextPhase);

    const prof = selectedProfileId;

    if (nextPhase === 'PAD_LAUNCH') {
      state.altitudeKm = 0;
      state.velocityKms = 0;
      state.throttle = 0;
      state.propellant = 100;
      state.pitchDeg = 90;
      state.srbSeparated = false;
      state.fairingSeparated = false;
      state.stage1Separated = false;
      state.orbitConfirmed = false;
      state.isFinished = false;
      state.stage = 1;
      if (prof === 'NEW_SHEPARD') {
        state.statusText = 'LAUNCH SITE ONE (WEST TEXAS) · NEW SHEPARD ARMED FOR 10-MIN FLIGHT';
      } else if (prof === 'APOLLO_11') {
        state.statusText = 'PAD 39A ARMED · SATURN V (SA-506) READY FOR LIFTOFF';
      } else if (prof === 'STS_31') {
        state.statusText = 'PAD 39B ARMED · SHUTTLE DISCOVERY OV-103 COUNTDOWN AT T-0';
      } else if (prof === 'ISS_DRAGON') {
        state.statusText = 'SLC-40 ARMED · FALCON 9 & CREW DRAGON READY FOR ISS RENDEZVOUS';
      } else if (prof === 'MARS_PERSEV') {
        state.statusText = 'SLC-41 ARMED · ATLAS V 541 ARMED FOR LAUNCH';
      } else {
        state.statusText = 'PAD 39B ARMED · SLS ARTEMIS READY FOR LIFTOFF';
      }
      state.statusColor = '#38bdf8';
      spaceMusicEngine.setTheme('LAUNCH');
    } else if (nextPhase === 'TLI_INJECTION') {
      // Phase 2: Boosters Jettison (36-75 km)
      state.altitudeKm = 38;
      state.velocityKms = 2.4;
      state.throttle = 1.0;
      state.pitchDeg = 75;
      state.stage = 1;
      state.statusText = '🚀 BOOSTER SEPARATION · PUSHER JETS ACTIVE · TWIN SRBS JETTISONED';
      state.statusColor = '#f59e0b';
      doBoosterSeparationRef.current();
      announceCapcom('Booster burnout and separation confirmed! Continuing nominal ascent trajectory.');
    } else if (nextPhase === 'CISLUNAR_COAST') {
      // Phase 3: Fairings Jettison (75-125 km)
      state.altitudeKm = 78;
      state.velocityKms = 4.8;
      state.throttle = 1.0;
      state.pitchDeg = 55;
      state.stage = 1;
      state.statusText = '🛡️ PAYLOAD FAIRINGS JETTISONED · SPACECRAFT EXPOSED TO SPACE';
      state.statusColor = '#38bdf8';
      doBoosterSeparationRef.current();
      doFairingSeparationRef.current();
      announceCapcom('Payload fairings jettison confirmed! Vehicle is in vacuum.');
    } else if (nextPhase === 'LUNAR_DESCENT') {
      // Phase 4: Core MECO & S2 Ignition (125-185 km)
      state.altitudeKm = 128;
      state.velocityKms = 6.9;
      state.throttle = 1.0;
      state.pitchDeg = 25;
      state.stage = 2;
      state.statusText = '🔥 MAIN ENGINE CUTOFF (MECO) · CORE STAGE SEPARATED · STAGE 2 IGNITION';
      state.statusColor = '#a855f7';
      doBoosterSeparationRef.current();
      doFairingSeparationRef.current();
      doCoreStageSeparationRef.current();
      announceCapcom('MECO confirmed! Stage 1 separation confirmed, upper stage engine start.');
    } else if (nextPhase === 'SURFACE_TOUCHDOWN') {
      // Phase 5: LEO Orbit Insertion Complete (185 km)
      state.altitudeKm = 185;
      state.velocityKms = 7.8;
      state.throttle = 0.0;
      state.pitchDeg = 0;
      state.stage = 2;
      doBoosterSeparationRef.current();
      doFairingSeparationRef.current();
      doCoreStageSeparationRef.current();
      confirmOrbitInsertion();
    }
  };

  // ─────────────────────────────────────────────────────────────
  // Navball Drawing Function (HUD ADI)
  // ─────────────────────────────────────────────────────────────
  const updateNavball = (pitch: number, roll: number) => {
    const canvas = navballCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = 110;
    const h = 110;
    if (canvas.width !== w) canvas.width = w;
    if (canvas.height !== h) canvas.height = h;

    const cx = w / 2;
    const cy = h / 2;
    const radius = 46;

    ctx.clearRect(0, 0, w, h);
    ctx.save();

    // Outer bezel
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fillStyle = '#0b1329';
    ctx.fill();
    ctx.clip();

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((roll * Math.PI) / 180);

    const pitchOffset = ((90 - pitch) / 90) * (radius * 0.85);

    // Cyan Sky
    ctx.fillStyle = '#0369a1';
    ctx.fillRect(-radius - 10, -radius * 2 + pitchOffset, (radius + 10) * 2, radius * 2);

    // Brown Ground
    ctx.fillStyle = '#78350f';
    ctx.fillRect(-radius - 10, pitchOffset, (radius + 10) * 2, radius * 2);

    // White Horizon Line
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-radius, pitchOffset);
    ctx.lineTo(radius, pitchOffset);
    ctx.stroke();

    // Pitch ladder lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.lineWidth = 1;
    [-60, -30, 30, 60].forEach((deg) => {
      const y = pitchOffset - (deg / 90) * (radius * 0.85);
      ctx.beginPath();
      ctx.moveTo(-12, y);
      ctx.lineTo(12, y);
      ctx.stroke();
    });

    ctx.restore();

    // Aircraft Reticle (Yellow)
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(cx - 18, cy);
    ctx.lineTo(cx - 6, cy);
    ctx.lineTo(cx, cy + 5);
    ctx.lineTo(cx + 6, cy);
    ctx.lineTo(cx + 18, cy);
    ctx.stroke();
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(cx, cy, 2, 0, Math.PI * 2);
    ctx.fill();

    // Prograde Vector (Green Circle)
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy - 3, 6, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();

    // Outer ring border
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();
  };

  // ─────────────────────────────────────────────────────────────
  // 3D THREE.JS FLIGHT WORLD SETUP & ANIMATION LOOP
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen || !mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || 960;
    const height = container.clientHeight || 620;

    // Reset state
    flightStateRef.current = {
      phase: 'PAD_LAUNCH',
      altitudeKm: 0,
      velocityKms: 0,
      throttle: 0,
      propellant: 100,
      pitchDeg: 90,
      rollDeg: 0,
      gForce: 1.0,
      stage: 1,
      isFinished: false,
      keys: {},
      lunarDistancePct: 0,
      statusText: 'PAD 39B ARMED · SLS ARTEMIS V READY FOR LIFTOFF',
      statusColor: '#38bdf8',
      srbSeparated: false,
      fairingSeparated: false,
      stage1Separated: false,
      orbitConfirmed: false,
      srbSeparationProgress: 0,
      lasJettisoned: false,
      solarArrayDeployed: false,
      touchdownConfirmed: false,
    };
    setPhase('PAD_LAUNCH');

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020409);
    scene.fog = new THREE.FogExp2(0x020409, 0.00012);

    const camera = new THREE.PerspectiveCamera(54, width / height, 0.1, 50000);
    camera.position.set(0, 18, 56);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    container.appendChild(renderer.domElement);

    // Interactive 360 Orbit Controls for Rocket & Flight Inspection
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.maxDistance = 1500;
    controls.minDistance = 4;
    controls.target.set(0, 18, 0);

    // 2. High-Fidelity Multi-Source Lighting
    const sunLight = new THREE.DirectionalLight(0xfff7ed, 3.2);
    sunLight.position.set(300, 500, 250);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 1800;
    scene.add(sunLight);

    const ambientLight = new THREE.AmbientLight(0x0e1b2f, 0.7);
    scene.add(ambientLight);

    const earthAlbedoLight = new THREE.DirectionalLight(0x1e3a8a, 0.8);
    earthAlbedoLight.position.set(0, -300, 0);
    scene.add(earthAlbedoLight);

    // Dynamic Rocket Plume PointLight
    const plumeLight = new THREE.PointLight(0xff7700, 0, 120);
    plumeLight.position.set(0, -6, 0);
    scene.add(plumeLight);

    // 3. Multi-Spectral Starfield
    const starCount = 3800;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const idx = i * 3;
      const r = 4000 + Math.random() * 3000;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      starPos[idx] = r * Math.sin(phi) * Math.cos(theta);
      starPos[idx + 1] = r * Math.sin(phi) * Math.sin(theta);
      starPos[idx + 2] = r * Math.cos(phi);

      const s = Math.random();
      if (s > 0.8) {
        starColors[idx] = 0.7;
        starColors[idx + 1] = 0.85;
        starColors[idx + 2] = 1.0;
      } else if (s > 0.6) {
        starColors[idx] = 1.0;
        starColors[idx + 1] = 0.95;
        starColors[idx + 2] = 0.75;
      } else {
        starColors[idx] = 0.95;
        starColors[idx + 1] = 0.95;
        starColors[idx + 2] = 0.95;
      }
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
    const starMat = new THREE.PointsMaterial({ vertexColors: true, size: 2.2, sizeAttenuation: false });
    scene.add(new THREE.Points(starGeo, starMat));

    // 4. Photorealistic NASA Earth Globe & Atmosphere
    const textureLoader = new THREE.TextureLoader();
    const earthRadius = 620;
    const earthGeo = new THREE.SphereGeometry(earthRadius, 64, 64);
    const earthTexture = textureLoader.load('/assets/earth_orbit.jpg');
    earthTexture.colorSpace = THREE.SRGBColorSpace;

    const earthMat = new THREE.MeshStandardMaterial({
      map: earthTexture,
      roughness: 0.65,
      metalness: 0.1,
    });
    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    earthMesh.position.set(0, -earthRadius - 120, 0);
    earthMesh.receiveShadow = true;
    earthMesh.visible = false;
    scene.add(earthMesh);

    // Cyan Atmospheric Glow Shell
    const atmoGeo = new THREE.SphereGeometry(earthRadius + 65, 64, 64);
    const atmoMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.BackSide,
      transparent: true,
      opacity: 0.32,
      blending: THREE.AdditiveBlending,
    });
    const atmoMesh = new THREE.Mesh(atmoGeo, atmoMat);
    atmoMesh.position.set(0, -earthRadius - 120, 0);
    atmoMesh.visible = false;
    scene.add(atmoMesh);

    // 5. NASA Moon Surface (Hidden during launch-to-orbit missions)
    const moonRadius = 1737;
    const moonGeo = new THREE.SphereGeometry(moonRadius, 64, 64);
    const moonTexture = textureLoader.load('/assets/moon_texture.jpg');
    moonTexture.colorSpace = THREE.SRGBColorSpace;
    moonTexture.wrapS = THREE.RepeatWrapping;
    moonTexture.wrapT = THREE.RepeatWrapping;
    moonTexture.repeat.set(12, 12);

    const moonMat = new THREE.MeshStandardMaterial({
      map: moonTexture,
      bumpMap: moonTexture,
      bumpScale: 1.2,
      roughness: 0.92,
      metalness: 0.05,
    });
    const moonMesh = new THREE.Mesh(moonGeo, moonMat);
    moonMesh.position.set(0, -moonRadius - 100, -8000);
    moonMesh.receiveShadow = true;
    moonMesh.visible = false; // Strictly hidden in orbital ascent launch missions!
    scene.add(moonMesh);

    // Lunar South Pole Landing Terrain (Hidden)
    const lunarGroundGroup = new THREE.Group();
    const lunarTerrainGeo = new THREE.PlaneGeometry(800, 800, 64, 64);
    const lunarTerrainMat = new THREE.MeshStandardMaterial({
      map: moonTexture,
      bumpMap: moonTexture,
      bumpScale: 1.8,
      roughness: 0.95,
      color: 0x94a3b8,
    });
    const lunarTerrain = new THREE.Mesh(lunarTerrainGeo, lunarTerrainMat);
    lunarTerrain.rotation.x = -Math.PI / 2;
    lunarTerrain.receiveShadow = true;
    lunarGroundGroup.add(lunarTerrain);

    // 3D Lunar Boulders
    const rockGeo = new THREE.DodecahedronGeometry(1.5, 1);
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.9 });
    for (let i = 0; i < 35; i++) {
      const rock = new THREE.Mesh(rockGeo, rockMat);
      const angle = Math.random() * Math.PI * 2;
      const dist = 12 + Math.random() * 140;
      rock.position.set(Math.cos(angle) * dist, 0.7, Math.sin(angle) * dist);
      rock.scale.set(Math.random() * 1.5 + 0.6, Math.random() * 1.2 + 0.4, Math.random() * 1.5 + 0.6);
      rock.castShadow = true;
      rock.receiveShadow = true;
      lunarGroundGroup.add(rock);
    }

    // Touchdown Landing Site Beacon
    const padBeaconGeo = new THREE.RingGeometry(8, 9, 32);
    const padBeaconMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide });
    const padBeacon = new THREE.Mesh(padBeaconGeo, padBeaconMat);
    padBeacon.rotation.x = Math.PI / 2;
    padBeacon.position.y = 0.1;
    lunarGroundGroup.add(padBeacon);

    lunarGroundGroup.position.set(0, -5000, 0); // hidden
    lunarGroundGroup.visible = false;
    scene.add(lunarGroundGroup);

    // 5.1 Photorealistic Earth visible in the Lunar Sky during Descent & Landing (Earthrise)
    const lunarSkyEarthGroup = new THREE.Group();
    const lunarSkyEarthRadius = 26;
    const lunarSkyEarthGeo = new THREE.SphereGeometry(lunarSkyEarthRadius, 48, 48);
    const lunarSkyEarthMat = new THREE.MeshStandardMaterial({
      map: earthTexture,
      roughness: 0.65,
      metalness: 0.1,
    });
    const lunarSkyEarthMesh = new THREE.Mesh(lunarSkyEarthGeo, lunarSkyEarthMat);
    lunarSkyEarthGroup.add(lunarSkyEarthMesh);

    // Cyan Atmospheric Glow Halo for Lunar Sky Earth
    const lunarSkyAtmoGeo = new THREE.SphereGeometry(lunarSkyEarthRadius + 1.2, 48, 48);
    const lunarSkyAtmoMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.BackSide,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
    });
    const lunarSkyAtmoMesh = new THREE.Mesh(lunarSkyAtmoGeo, lunarSkyAtmoMat);
    lunarSkyEarthGroup.add(lunarSkyAtmoMesh);

    // Positioned majestically above the lunar horizon
    lunarSkyEarthGroup.position.set(160, 180, -260);
    lunarSkyEarthGroup.visible = false;
    scene.add(lunarSkyEarthGroup);

    // 5.2 Glowing 3D Low Earth Orbit (LEO) Ascent & Insertion Trajectory Corridor around Earth
    const trajCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 4, 0),         // Pad at Cape Canaveral / KSC LC-39B
      new THREE.Vector3(18, 55, -15),     // Waypoint 1: Booster Separation Corridor (36 km)
      new THREE.Vector3(55, 120, -45),    // Waypoint 2: Fairing Separation Corridor (75 km)
      new THREE.Vector3(120, 200, -95),   // Waypoint 3: Core MECO & S-II Ignition (125 km)
      new THREE.Vector3(220, 280, -165),  // Waypoint 4: Upper Stage Orbital Insertion Burn (160 km)
      new THREE.Vector3(380, 330, -250),  // Target 185 km Circular LEO Flight Path around Earth
      new THREE.Vector3(560, 350, -360),
      new THREE.Vector3(760, 355, -490),
    ]);
    const trajPoints = trajCurve.getPoints(120);
    const trajGeo = new THREE.BufferGeometry().setFromPoints(trajPoints);
    const trajMat = new THREE.LineBasicMaterial({
      color: 0x00e5ff,
      linewidth: 3,
      transparent: true,
      opacity: 0.85,
    });
    const trajectoryMesh = new THREE.Line(trajGeo, trajMat);
    trajectoryMesh.visible = true; // Always visible as orbital insertion flight corridor guidance!
    scene.add(trajectoryMesh);

    // Holographic Waypoint Corridor Rings along the ascent flight path
    const waypointRings = [
      { pos: new THREE.Vector3(18, 55, -15), radius: 8, color: 0xfbbf24 },   // Booster Sep (36 km)
      { pos: new THREE.Vector3(55, 120, -45), radius: 10, color: 0x38bdf8 },  // Fairing Sep (75 km)
      { pos: new THREE.Vector3(120, 200, -95), radius: 12, color: 0xa855f7 }, // MECO (125 km)
      { pos: new THREE.Vector3(380, 330, -250), radius: 16, color: 0x22c55e }, // LEO Orbit Target (185 km)
    ];
    waypointRings.forEach((wp) => {
      const ringGeo = new THREE.TorusGeometry(wp.radius, 0.35, 16, 48);
      const ringMat = new THREE.MeshBasicMaterial({ color: wp.color, transparent: true, opacity: 0.65 });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.copy(wp.pos);
      ring.lookAt(wp.pos.clone().add(new THREE.Vector3(1, 0.4, -0.7)));
      scene.add(ring);
    });

    // ─────────────────────────────────────────────────────────────
    // 6. KENNEDY SPACE CENTER PAD 39B & MOBILE LAUNCHER TOWER
    // ─────────────────────────────────────────────────────────────
    const padGroup = new THREE.Group();

    // Pad Base & Concrete Flame Trench
    const padConcreteGeo = new THREE.CylinderGeometry(40, 48, 8, 48);
    const padConcreteMat = new THREE.MeshStandardMaterial({ color: 0x242d3d, roughness: 0.85, metalness: 0.15 });
    const padBase = new THREE.Mesh(padConcreteGeo, padConcreteMat);
    padBase.position.y = 4;
    padBase.receiveShadow = true;
    padGroup.add(padBase);

    // Mobile Launcher Lattice Truss Steel Gantry Tower (Red NASA Tower)
    const towerGroup = new THREE.Group();
    towerGroup.position.set(-20, 0, 0);

    const steelColGeo = new THREE.BoxGeometry(0.9, 74, 0.9);
    const towerMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, metalness: 0.65, roughness: 0.35 });
    for (let cx = -2.6; cx <= 2.6; cx += 5.2) {
      for (let cz = -2.6; cz <= 2.6; cz += 5.2) {
        const col = new THREE.Mesh(steelColGeo, towerMat);
        col.position.set(cx, 37, cz);
        col.castShadow = true;
        towerGroup.add(col);
      }
    }

    // Platforms & Umbilical Swing Arms
    for (let lvl = 8; lvl <= 68; lvl += 7.5) {
      const platGeo = new THREE.BoxGeometry(6.2, 0.4, 6.2);
      const platMat = new THREE.MeshStandardMaterial({ color: 0x374151, metalness: 0.8 });
      const plat = new THREE.Mesh(platGeo, platMat);
      plat.position.set(0, lvl, 0);
      towerGroup.add(plat);

      // Umbilical fuel arms pointing toward rocket
      if (lvl === 23 || lvl === 38 || lvl === 53) {
        const armGeo = new THREE.BoxGeometry(13, 1.4, 1.6);
        const armMat = new THREE.MeshStandardMaterial({ color: 0x6b7280, metalness: 0.6 });
        const arm = new THREE.Mesh(armGeo, armMat);
        arm.position.set(6.5, lvl, 0);
        towerGroup.add(arm);
      }
    }

    // High-Intensity Pad Xenon Floodlights
    const padSpot = new THREE.SpotLight(0xfff7ed, 4.5, 140, Math.PI / 4, 0.3);
    padSpot.position.set(-15, 52, 14);
    padSpot.target.position.set(0, 20, 0);
    towerGroup.add(padSpot);
    towerGroup.add(padSpot.target);

    // Cryogenic Boil-off Venting Vapor (Before Launch)
    const ventCount = 90;
    const ventGeo = new THREE.BufferGeometry();
    const ventPos = new Float32Array(ventCount * 3);
    for (let v = 0; v < ventCount; v++) {
      ventPos[v * 3] = -14 + Math.random() * 2;
      ventPos[v * 3 + 1] = 53 + Math.random() * 3;
      ventPos[v * 3 + 2] = (Math.random() - 0.5) * 3;
    }
    ventGeo.setAttribute('position', new THREE.BufferAttribute(ventPos, 3));
    const ventMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 15,
      transparent: true,
      opacity: 0.4,
      depthWrite: false,
    });
    const ventParticles = new THREE.Points(ventGeo, ventMat);
    padGroup.add(ventParticles);

    padGroup.add(towerGroup);
    scene.add(padGroup);

    // ─────────────────────────────────────────────────────────────
    // 7. REALISTIC SLS ARTEMIS V ROCKET ASSEMBLY
    // ─────────────────────────────────────────────────────────────
    const spacecraftGroup = new THREE.Group();
    const lunarLanderGroup = new THREE.Group();
    const gltfLoader = getSharedGLTFLoader();

    // Helper to center and scale loaded GLTF models
    const attachGltf = (url: string, targetGroup: THREE.Group, targetSize: number, onLoaded?: () => void) => {
      gltfLoader.load(
        url,
        (gltf) => {
          const model = gltf.scene;
          const box = new THREE.Box3().setFromObject(model);
          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z) || 1;
          const scale = targetSize / maxDim;
          model.scale.setScalar(scale);

          const center = box.getCenter(new THREE.Vector3());
          model.position.x = -center.x * scale;
          model.position.y = -center.y * scale;
          model.position.z = -center.z * scale;

          model.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });

          targetGroup.add(model);
          if (onLoaded) onLoaded();
        },
        undefined,
        (err) => console.warn('GLTF load failed:', url, err)
      );
    };

    // Load Apollo Lunar Module / HLS Lander
    attachGltf('/models/Apollo_Lunar_Module.glb', lunarLanderGroup, 10.5);
    lunarLanderGroup.visible = false;
    scene.add(lunarLanderGroup);

    // Surface Astronaut Model for Touchdown Phase
    const astronautEVA = new THREE.Group();
    attachGltf('/models/Astronaut.glb', astronautEVA, 3.2);
    astronautEVA.position.set(7, 0, 4);
    astronautEVA.visible = false;
    lunarGroundGroup.add(astronautEVA);

    // 7. MULTI-VEHICLE 3D WORKSHOP ACCORDING TO SELECTED MISSION PROFILE
    const coreStage = new THREE.Group();
    const srbGroupLeft = new THREE.Group();
    const srbGroupRight = new THREE.Group();
    const orionGroup = new THREE.Group();
    const solarWingsGroup = new THREE.Group();
    const nsParachuteGroup = new THREE.Group();

    if (selectedProfileId === 'NEW_SHEPARD') {
      // ═══════════════════════════════════════════════════════════════
      // 7.1 BLUE ORIGIN NEW SHEPARD SUBORBITAL REUSABLE SYSTEM
      // ═══════════════════════════════════════════════════════════════
      // Booster: Tall, sleek bright-white cylinder
      const nsBoosterGeo = new THREE.CylinderGeometry(1.8, 1.8, 26, 48);
      const nsWhiteMat = new THREE.MeshStandardMaterial({
        color: 0xf8fafc,
        roughness: 0.25,
        metalness: 0.15,
      });
      const nsBooster = new THREE.Mesh(nsBoosterGeo, nsWhiteMat);
      nsBooster.position.y = 13;
      nsBooster.castShadow = true;
      coreStage.add(nsBooster);

      // Blue Origin dark navy feather pattern decal fin on side
      const featherGeo = new THREE.CylinderGeometry(1.82, 1.82, 18, 32, 1, false, 0, Math.PI * 0.45);
      const featherMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4 });
      const feather = new THREE.Mesh(featherGeo, featherMat);
      feather.position.y = 13;
      coreStage.add(feather);

      // Forward Aerodynamic Ring Fin collar at top of booster
      const ringFinGeo = new THREE.CylinderGeometry(2.35, 2.35, 1.6, 48, 1, true);
      const ringFinMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, side: THREE.DoubleSide });
      const ringFin = new THREE.Mesh(ringFinGeo, ringFinMat);
      ringFin.position.y = 24.5;
      coreStage.add(ringFin);

      // 4 Deployable Wedge Fins
      for (let f = 0; f < 4; f++) {
        const wAngle = (f * Math.PI) / 2;
        const wFinGeo = new THREE.BoxGeometry(0.12, 1.8, 0.9);
        const wFinMat = new THREE.MeshStandardMaterial({ color: 0x0f172a });
        const wFin = new THREE.Mesh(wFinGeo, wFinMat);
        wFin.position.set(Math.cos(wAngle) * 2.4, 24.5, Math.sin(wAngle) * 2.4);
        wFin.rotation.y = wAngle;
        coreStage.add(wFin);
      }

      // Single BE-3PM Gimbaled Liquid Rocket Engine at Base
      const be3Geo = new THREE.ConeGeometry(0.95, 2.8, 32);
      const be3Mat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.9, roughness: 0.15 });
      const be3Nozzle = new THREE.Mesh(be3Geo, be3Mat);
      be3Nozzle.rotation.x = Math.PI;
      be3Nozzle.position.y = -0.6;
      coreStage.add(be3Nozzle);

      // 4 Deployable VTVL Hydraulic Landing Legs at base
      for (let leg = 0; leg < 4; leg++) {
        const lAngle = (leg * Math.PI) / 2 + Math.PI / 4;
        const legGeo = new THREE.CylinderGeometry(0.14, 0.14, 4.4, 16);
        const legMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.7 });
        const legMesh = new THREE.Mesh(legGeo, legMat);
        legMesh.position.set(Math.cos(lAngle) * 1.9, 1.2, Math.sin(lAngle) * 1.9);
        legMesh.rotation.z = Math.cos(lAngle) * 0.28;
        legMesh.rotation.x = Math.sin(lAngle) * 0.28;
        coreStage.add(legMesh);
      }
      spacecraftGroup.add(coreStage);

      // RSS First Step Crew Capsule on Top
      orionGroup.position.y = 26;
      const capGeo = new THREE.ConeGeometry(2.15, 3.8, 36);
      const capMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2, metalness: 0.3 });
      const capMesh = new THREE.Mesh(capGeo, capMat);
      capMesh.position.y = 1.9;
      capMesh.castShadow = true;
      orionGroup.add(capMesh);

      // 6 Panoramic Observation Windows
      for (let win = 0; win < 6; win++) {
        const winAngle = (win * Math.PI) / 3;
        const winGeo = new THREE.BoxGeometry(0.1, 1.3, 0.75);
        const winMat = new THREE.MeshStandardMaterial({
          color: 0x0284c7,
          metalness: 0.9,
          roughness: 0.1,
          emissive: 0x0369a1,
          emissiveIntensity: 0.35,
        });
        const winMesh = new THREE.Mesh(winGeo, winMat);
        winMesh.position.set(Math.cos(winAngle) * 1.6, 2.0, Math.sin(winAngle) * 1.6);
        winMesh.rotation.y = winAngle;
        orionGroup.add(winMesh);
      }

      // 3 Giant Blue & Orange Landing Parachutes (for Phase 5)
      for (let cp = 0; cp < 3; cp++) {
        const cpAngle = (cp * Math.PI * 2) / 3;
        const chuteGeo = new THREE.SphereGeometry(3.2, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.5);
        const chuteMat = new THREE.MeshStandardMaterial({
          color: cp % 2 === 0 ? 0x0284c7 : 0xea580c,
          side: THREE.DoubleSide,
        });
        const chuteMesh = new THREE.Mesh(chuteGeo, chuteMat);
        chuteMesh.position.set(Math.cos(cpAngle) * 3.8, 12, Math.sin(cpAngle) * 3.8);
        chuteMesh.rotation.x = Math.PI;
        nsParachuteGroup.add(chuteMesh);

        // Suspension lines
        const lineGeo = new THREE.CylinderGeometry(0.02, 0.02, 8.5, 8);
        const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const susLine = new THREE.Mesh(lineGeo, lineMat);
        susLine.position.set(Math.cos(cpAngle) * 1.9, 7.5, Math.sin(cpAngle) * 1.9);
        nsParachuteGroup.add(susLine);
      }
      nsParachuteGroup.visible = false;
      orionGroup.add(nsParachuteGroup);
      spacecraftGroup.add(orionGroup);
    } else if (selectedProfileId === 'APOLLO_11') {
      // ═══════════════════════════════════════════════════════════════
      // 7.2 NASA SATURN V (APOLLO 11)
      // ═══════════════════════════════════════════════════════════════
      // S-IC First Stage with black-and-white roll markings
      const s1Geo = new THREE.CylinderGeometry(3.2, 3.2, 24, 48);
      const s1Mat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 });
      const s1 = new THREE.Mesh(s1Geo, s1Mat);
      s1.position.y = 12;
      coreStage.add(s1);

      // Black roll markings
      for (let b = 0; b < 4; b++) {
        const bAngle = (b * Math.PI) / 2;
        const bandGeo = new THREE.CylinderGeometry(3.22, 3.22, 20, 16, 1, false, bAngle, Math.PI * 0.25);
        const bandMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
        const band = new THREE.Mesh(bandGeo, bandMat);
        band.position.y = 12;
        coreStage.add(band);
      }

      // 5 Massive F-1 Engines
      for (let f = 0; f < 5; f++) {
        const fNozGeo = new THREE.ConeGeometry(0.85, 2.5, 24);
        const fNozMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9 });
        const fNoz = new THREE.Mesh(fNozGeo, fNozMat);
        fNoz.rotation.x = Math.PI;
        if (f === 4) fNoz.position.set(0, -0.6, 0);
        else {
          const a = (f * Math.PI) / 2;
          fNoz.position.set(Math.cos(a) * 1.7, -0.6, Math.sin(a) * 1.7);
        }
        coreStage.add(fNoz);
      }

      // S-II & S-IVB Stages
      const s2Geo = new THREE.CylinderGeometry(3.2, 3.2, 14, 48);
      const s2 = new THREE.Mesh(s2Geo, s1Mat);
      s2.position.y = 31;
      coreStage.add(s2);

      const s4bGeo = new THREE.CylinderGeometry(2.3, 3.2, 11, 48);
      const s4b = new THREE.Mesh(s4bGeo, s1Mat);
      s4b.position.y = 43.5;
      coreStage.add(s4b);

      spacecraftGroup.add(coreStage);

      // Apollo CSM & LES Tower
      orionGroup.position.y = 49;
      const csmGeo = new THREE.CylinderGeometry(1.9, 1.9, 4.5, 36);
      const csmMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.5 });
      const csm = new THREE.Mesh(csmGeo, csmMat);
      csm.position.y = 2.25;
      orionGroup.add(csm);

      const cmGeo = new THREE.ConeGeometry(1.9, 3.5, 36);
      const cmMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.7 });
      const cm = new THREE.Mesh(cmGeo, cmMat);
      cm.position.y = 5.75;
      orionGroup.add(cm);

      const lesGeo = new THREE.CylinderGeometry(0.18, 0.18, 7.5, 12);
      const les = new THREE.Mesh(lesGeo, new THREE.MeshStandardMaterial({ color: 0xffffff }));
      les.position.y = 11;
      orionGroup.add(les);

      spacecraftGroup.add(orionGroup);
    } else if (selectedProfileId === 'STS_31') {
      // ═══════════════════════════════════════════════════════════════
      // 7.3 SPACE SHUTTLE DISCOVERY (STS-31)
      // ═══════════════════════════════════════════════════════════════
      // Rust-Orange External Tank (ET)
      const etGeo = new THREE.CylinderGeometry(2.8, 2.8, 30, 48);
      const etMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.7 });
      const et = new THREE.Mesh(etGeo, etMat);
      et.position.y = 15;
      coreStage.add(et);

      const etNose = new THREE.Mesh(new THREE.ConeGeometry(2.8, 5.5, 48), etMat);
      etNose.position.y = 32.7;
      coreStage.add(etNose);
      spacecraftGroup.add(coreStage);

      // Twin White SRBs
      for (const side of [-1, 1]) {
        const srbGeo = new THREE.CylinderGeometry(1.15, 1.15, 27, 32);
        const srbMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.35 });
        const srb = new THREE.Mesh(srbGeo, srbMat);
        srb.position.set(side * 4.2, 13.5, 0);
        if (side === -1) srbGroupLeft.add(srb);
        else srbGroupRight.add(srb);

        const srbNose = new THREE.Mesh(new THREE.ConeGeometry(1.15, 3.5, 32), srbMat);
        srbNose.position.set(side * 4.2, 28.7, 0);
        if (side === -1) srbGroupLeft.add(srbNose);
        else srbGroupRight.add(srbNose);
      }
      spacecraftGroup.add(srbGroupLeft);
      spacecraftGroup.add(srbGroupRight);

      // Space Shuttle Orbiter mounted to side
      orionGroup.position.set(0, 11, 3.8);
      const fuseGeo = new THREE.BoxGeometry(2.8, 2.4, 18);
      const fuseMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.3 });
      const fuse = new THREE.Mesh(fuseGeo, fuseMat);
      fuse.rotation.x = Math.PI / 2;
      orionGroup.add(fuse);

      // Delta Wings with Black underside tiles
      const wingGeo = new THREE.BoxGeometry(11, 0.25, 8.5);
      const wingMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 });
      const wings = new THREE.Mesh(wingGeo, wingMat);
      wings.position.set(0, -1.1, 0);
      orionGroup.add(wings);

      // Vertical Tail
      const tailGeo = new THREE.BoxGeometry(0.2, 4.2, 3.2);
      const tail = new THREE.Mesh(tailGeo, fuseMat);
      tail.position.set(0, 2.8, -7);
      orionGroup.add(tail);

      // 3 SSME Main Engines
      for (let eng = 0; eng < 3; eng++) {
        const engGeo = new THREE.ConeGeometry(0.55, 1.8, 16);
        const engMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.9 });
        const engMesh = new THREE.Mesh(engGeo, engMat);
        engMesh.rotation.x = -Math.PI / 2;
        const eY = eng === 0 ? 0.8 : -0.4;
        const eX = eng === 0 ? 0 : (eng === 1 ? -0.8 : 0.8);
        engMesh.position.set(eX, eY, -9.5);
        orionGroup.add(engMesh);
      }
      spacecraftGroup.add(orionGroup);
    } else {
      // ═══════════════════════════════════════════════════════════════
      // 7.4 SLS ARTEMIS V / FALCON 9 / ATLAS V
      // ═══════════════════════════════════════════════════════════════
      const coreBodyGeo = new THREE.CylinderGeometry(2.4, 2.4, 30, 48);
      const coreMat = new THREE.MeshStandardMaterial({
        color: selectedProfileId === 'ISS_DRAGON' ? 0xf8fafc : 0xc26510,
        roughness: 0.65,
        metalness: 0.15,
      });
      const coreBody = new THREE.Mesh(coreBodyGeo, coreMat);
      coreBody.position.y = 15;
      coreBody.castShadow = true;
      coreStage.add(coreBody);

      // 4 RS-25 Engines
      for (let i = 0; i < 4; i++) {
        const a = (i * Math.PI) / 2 + Math.PI / 4;
        const nozGeo = new THREE.ConeGeometry(0.7, 2.2, 24);
        const nozMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.9, roughness: 0.2 });
        const noz = new THREE.Mesh(nozGeo, nozMat);
        noz.rotation.x = Math.PI;
        noz.position.set(Math.cos(a) * 1.3, -0.6, Math.sin(a) * 1.3);
        coreStage.add(noz);
      }
      spacecraftGroup.add(coreStage);

      // SRBs
      if (selectedProfileId !== 'ISS_DRAGON') {
        const buildSRBMesh = () => {
          const grp = new THREE.Group();
          const bGeo = new THREE.CylinderGeometry(1.15, 1.15, 27, 32);
          const bMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.35 });
          const b = new THREE.Mesh(bGeo, bMat);
          b.position.y = 13.5;
          grp.add(b);
          const nose = new THREE.Mesh(new THREE.ConeGeometry(1.15, 3.8, 32), bMat);
          nose.position.y = 28.9;
          grp.add(nose);
          return grp;
        };
        const srbLeft = buildSRBMesh();
        srbGroupLeft.add(srbLeft);
        srbGroupLeft.position.set(-3.7, 0, 0);
        spacecraftGroup.add(srbGroupLeft);

        const srbRight = buildSRBMesh();
        srbGroupRight.add(srbRight);
        srbGroupRight.position.set(3.7, 0, 0);
        spacecraftGroup.add(srbGroupRight);
      }

      // Orion / Payload
      orionGroup.position.y = 30.5;
      const smGeo = new THREE.CylinderGeometry(2.1, 2.1, 4.5, 36);
      const smMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.3 });
      const sm = new THREE.Mesh(smGeo, smMat);
      sm.position.y = 2.25;
      orionGroup.add(sm);

      // 4 Deployable X-formation Solar Panels
      const wingGeo = new THREE.BoxGeometry(0.08, 1.2, 5.5);
      const wingMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, metalness: 0.8, roughness: 0.2 });
      for (let w = 0; w < 4; w++) {
        const wing = new THREE.Mesh(wingGeo, wingMat);
        const angle = (w * Math.PI) / 2 + Math.PI / 4;
        wing.position.set(Math.cos(angle) * 4.6, 2.2, Math.sin(angle) * 4.6);
        wing.rotation.y = angle;
        solarWingsGroup.add(wing);
      }
      solarWingsGroup.visible = false;
      orionGroup.add(solarWingsGroup);

      const capGeo = new THREE.ConeGeometry(2.1, 4.6, 36);
      const capMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.4, roughness: 0.25 });
      const cap = new THREE.Mesh(capGeo, capMat);
      cap.position.y = 6.8;
      orionGroup.add(cap);

      const lasTowerGeo = new THREE.CylinderGeometry(0.22, 0.22, 7.5, 16);
      const las = new THREE.Mesh(lasTowerGeo, new THREE.MeshStandardMaterial({ color: 0xffffff }));
      las.position.y = 12.8;
      orionGroup.add(las);

      spacecraftGroup.add(orionGroup);
    }

    spacecraftGroup.position.set(0, 4, 0);
    scene.add(spacecraftGroup);

    // Bipartite Clamshell Payload Fairings (Left & Right Halves)
    const fairingMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.35,
      metalness: 0.2,
      side: THREE.DoubleSide,
    });
    const fairingLeft = new THREE.Group();
    const fairingRight = new THREE.Group();
    const fairingBaseY = selectedProfileId === 'APOLLO_11' ? 48 : (selectedProfileId === 'NEW_SHEPARD' ? 25 : 30);
    fairingLeft.position.set(0, fairingBaseY, 0);
    fairingRight.position.set(0, fairingBaseY, 0);

    const fCylLeft = new THREE.Mesh(
      new THREE.CylinderGeometry(2.35, 2.35, 9.5, 32, 1, true, 0, Math.PI),
      fairingMat
    );
    fairingLeft.add(fCylLeft);
    const fConeLeft = new THREE.Mesh(
      new THREE.ConeGeometry(2.35, 4.5, 32, 1, true, 0, Math.PI),
      fairingMat
    );
    fConeLeft.position.y = 7.0;
    fairingLeft.add(fConeLeft);
    spacecraftGroup.add(fairingLeft);

    const fCylRight = new THREE.Mesh(
      new THREE.CylinderGeometry(2.35, 2.35, 9.5, 32, 1, true, Math.PI, Math.PI),
      fairingMat
    );
    fairingRight.add(fCylRight);
    const fConeRight = new THREE.Mesh(
      new THREE.ConeGeometry(2.35, 4.5, 32, 1, true, Math.PI, Math.PI),
      fairingMat
    );
    fConeRight.position.y = 7.0;
    fairingRight.add(fConeRight);
    spacecraftGroup.add(fairingRight);

    // Staging callbacks connecting to component refs
    const doBoosterSeparation = () => {
      const state = flightStateRef.current;
      if (state.srbSeparated) return;
      state.srbSeparated = true;
      state.srbSeparationProgress = 0;
      soundFx.playExplosion();
      announceCapcom('SRB burnout! Booster separation confirmed.');

      const tempPos = new THREE.Vector3();
      const tempQuat = new THREE.Quaternion();
      if (srbGroupLeft.parent) {
        srbGroupLeft.getWorldPosition(tempPos);
        srbGroupLeft.getWorldQuaternion(tempQuat);
        srbGroupLeft.parent.remove(srbGroupLeft);
        srbGroupLeft.position.copy(tempPos);
        srbGroupLeft.quaternion.copy(tempQuat);
        scene.add(srbGroupLeft);
      }
      if (srbGroupRight.parent) {
        srbGroupRight.getWorldPosition(tempPos);
        srbGroupRight.getWorldQuaternion(tempQuat);
        srbGroupRight.parent.remove(srbGroupRight);
        srbGroupRight.position.copy(tempPos);
        srbGroupRight.quaternion.copy(tempQuat);
        scene.add(srbGroupRight);
      }
      state.statusText = '🚀 BOOSTER SEPARATION · KOROLEV CROSS JETTISON NOMINAL';
      state.statusColor = '#f59e0b';
    };
    doBoosterSeparationRef.current = doBoosterSeparation;

    const doFairingSeparation = () => {
      const state = flightStateRef.current;
      if (state.fairingSeparated) return;
      state.fairingSeparated = true;
      soundFx.playExplosion();
      announceCapcom('Payload fairings jettison confirmed! Spacecraft exposed to vacuum.');

      const tempPos = new THREE.Vector3();
      const tempQuat = new THREE.Quaternion();
      if (fairingLeft.parent) {
        fairingLeft.getWorldPosition(tempPos);
        fairingLeft.getWorldQuaternion(tempQuat);
        fairingLeft.parent.remove(fairingLeft);
        fairingLeft.position.copy(tempPos);
        fairingLeft.quaternion.copy(tempQuat);
        scene.add(fairingLeft);
      }
      if (fairingRight.parent) {
        fairingRight.getWorldPosition(tempPos);
        fairingRight.getWorldQuaternion(tempQuat);
        fairingRight.parent.remove(fairingRight);
        fairingRight.position.copy(tempPos);
        fairingRight.quaternion.copy(tempQuat);
        scene.add(fairingRight);
      }
      state.statusText = '🛡️ FAIRING JETTISON · PAYLOAD SHIELD SEPARATED INTO SPACE';
      state.statusColor = '#38bdf8';
    };
    doFairingSeparationRef.current = doFairingSeparation;

    const doCoreStageSeparation = () => {
      const state = flightStateRef.current;
      if (state.stage1Separated) return;
      state.stage1Separated = true;
      state.stage = 2;
      soundFx.playExplosion();
      announceCapcom('Main Engine Cutoff (MECO). Core stage separation confirmed! Upper stage ignition nominal.');

      const tempPos = new THREE.Vector3();
      const tempQuat = new THREE.Quaternion();
      if (coreStage.parent) {
        coreStage.getWorldPosition(tempPos);
        coreStage.getWorldQuaternion(tempQuat);
        coreStage.parent.remove(coreStage);
        coreStage.position.copy(tempPos);
        coreStage.quaternion.copy(tempQuat);
        scene.add(coreStage);
      }
      state.statusText = '🔥 CORE STAGE SEPARATED (MECO) · UPPER STAGE IGNITION NOMINAL';
      state.statusColor = '#a855f7';
    };
    doCoreStageSeparationRef.current = doCoreStageSeparation;

    // ─────────────────────────────────────────────────────────────
    // 8. ROCKET PLUMES, MACH SHOCK DIAMONDS & VOLUMETRIC SMOKE
    // ─────────────────────────────────────────────────────────────
    // Core Engine Flame
    const coreFlameGeo = new THREE.ConeGeometry(2.6, 24, 32);
    const coreFlameMat = new THREE.MeshBasicMaterial({
      color: 0xff6600,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
    });
    const coreFlame = new THREE.Mesh(coreFlameGeo, coreFlameMat);
    coreFlame.rotation.x = Math.PI;
    coreFlame.position.y = -12;
    coreFlame.visible = false;
    spacecraftGroup.add(coreFlame);

    // Mach Shock Diamonds (Bright Blue/White Plasma)
    const machDiamondsGroup = new THREE.Group();
    for (let d = 0; d < 4; d++) {
      const diamondGeo = new THREE.OctahedronGeometry(0.85 - d * 0.12);
      const diamondMat = new THREE.MeshBasicMaterial({ color: 0x93c5fd, blending: THREE.AdditiveBlending });
      const diamond = new THREE.Mesh(diamondGeo, diamondMat);
      diamond.position.y = -3 - d * 4.5;
      machDiamondsGroup.add(diamond);
    }
    machDiamondsGroup.visible = false;
    spacecraftGroup.add(machDiamondsGroup);

    // Twin SRB Exhaust Plumes (Intense Bright Yellow-White)
    const srbFlameGeo = new THREE.ConeGeometry(1.6, 28, 24);
    const srbFlameMat = new THREE.MeshBasicMaterial({
      color: 0xffea00,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
    });
    const srbFlameLeft = new THREE.Mesh(srbFlameGeo, srbFlameMat);
    srbFlameLeft.rotation.x = Math.PI;
    srbFlameLeft.position.set(-3.7, -14, 0);
    srbFlameLeft.visible = false;
    spacecraftGroup.add(srbFlameLeft);

    const srbFlameRight = new THREE.Mesh(srbFlameGeo, srbFlameMat);
    srbFlameRight.rotation.x = Math.PI;
    srbFlameRight.position.set(3.7, -14, 0);
    srbFlameRight.visible = false;
    spacecraftGroup.add(srbFlameRight);

    // Separation Pusher Rocket Flares (On SRBs)
    const sepPlumeGeo = new THREE.ConeGeometry(0.8, 5, 12);
    const sepPlumeMat = new THREE.MeshBasicMaterial({ color: 0xfffbeb, blending: THREE.AdditiveBlending });
    const sepFlareLeft = new THREE.Mesh(sepPlumeGeo, sepPlumeMat);
    sepFlareLeft.rotation.z = Math.PI / 2;
    sepFlareLeft.position.set(1.4, 27, 0);
    sepFlareLeft.visible = false;
    srbGroupLeft.add(sepFlareLeft);

    const sepFlareRight = new THREE.Mesh(sepPlumeGeo, sepPlumeMat);
    sepFlareRight.rotation.z = -Math.PI / 2;
    sepFlareRight.position.set(-1.4, 27, 0);
    sepFlareRight.visible = false;
    srbGroupRight.add(sepFlareRight);

    // Launch Smoke Particles System (Billowing clouds at liftoff)
    const smokeCount = 350;
    const smokeGeo = new THREE.BufferGeometry();
    const smokePos = new Float32Array(smokeCount * 3);
    const smokeVels: THREE.Vector3[] = [];

    for (let i = 0; i < smokeCount; i++) {
      smokePos[i * 3] = (Math.random() - 0.5) * 8;
      smokePos[i * 3 + 1] = -500;
      smokePos[i * 3 + 2] = (Math.random() - 0.5) * 8;
      smokeVels.push(new THREE.Vector3((Math.random() - 0.5) * 16, Math.random() * 10 + 3, (Math.random() - 0.5) * 16));
    }
    smokeGeo.setAttribute('position', new THREE.BufferAttribute(smokePos, 3));
    const smokeMat = new THREE.PointsMaterial({
      color: 0xd1d5db,
      size: 26,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
    });
    const smokeParticles = new THREE.Points(smokeGeo, smokeMat);
    scene.add(smokeParticles);

    // ─────────────────────────────────────────────────────────────
    // 9. ANIMATION & PHYSICS GAME LOOP
    // ─────────────────────────────────────────────────────────────
    let animId: number;
    let clock = new THREE.Clock();
    const prevExpeditionTarget = new THREE.Vector3(0, 16, 0);

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.05);
      const state = flightStateRef.current;

      // Update sound rumble with throttle
      audioSynthRef.current.setEngineThrust(state.throttle);

      // Keyboard Controls (W/S for Throttle, A/D for Pitch)
      if (state.keys['w'] || state.keys['arrowup']) {
        state.throttle = Math.min(1.0, state.throttle + dt * 0.4);
      }
      if (state.keys['s'] || state.keys['arrowdown']) {
        state.throttle = Math.max(0.0, state.throttle - dt * 0.4);
      }
      if (state.keys['a'] || state.keys['arrowleft']) {
        state.pitchDeg = Math.max(0, state.pitchDeg - dt * 18);
      }
      if (state.keys['d'] || state.keys['arrowright']) {
        state.pitchDeg = Math.min(90, state.pitchDeg + dt * 18);
      }

      // Rotate Earth slowly
      earthMesh.rotation.y += 0.0003;
      moonMesh.rotation.y += 0.00015;

      // ── REALISTIC ASCENT & ORBITAL INSERTION PHYSICS ──
      const isBurning = state.throttle > 0.02;
      coreFlame.visible = isBurning;
      machDiamondsGroup.visible = isBurning && state.throttle > 0.6;
      srbFlameLeft.visible = isBurning && !state.srbSeparated;
      srbFlameRight.visible = isBurning && !state.srbSeparated;
      plumeLight.intensity = isBurning ? 4.5 + Math.random() * 2.0 : 0;

      if (isBurning && !state.orbitConfirmed) {
        state.propellant = Math.max(0, state.propellant - state.throttle * dt * 0.55);
        state.velocityKms = Math.min(7.85, state.velocityKms + state.throttle * dt * 0.26);
        state.altitudeKm += state.velocityKms * dt * 11.5;
        state.gForce = 1.0 + state.throttle * 2.5;

        // Camera shake on high throttle
        if (cameraMode === 'cockpit' || cameraMode === 'chase') {
          camera.position.x += (Math.random() - 0.5) * 0.1 * state.throttle;
          camera.position.y += (Math.random() - 0.5) * 0.1 * state.throttle;
        }

        // Manual Ascent and Steering along 3D LEO Orbital Insertion Corridor
        const pitchRad = (state.pitchDeg * Math.PI) / 180;
        const vertRatio = Math.sin(pitchRad);

        // Stage 1 vs Stage 2 engine efficiency
        const thrustEff = state.stage === 1 ? (state.srbSeparated ? 0.78 : 1.0) : 1.18;
        state.velocityKms = Math.min(7.85, state.velocityKms + state.throttle * dt * 0.28 * thrustEff);

        // Dead weight penalty if boosters not manually separated past 36 km
        if (!state.srbSeparated && state.altitudeKm > 36) {
          state.velocityKms = Math.max(0.4, state.velocityKms - dt * 0.15);
        }

        // Dead weight penalty if fairing not manually separated past 75 km
        if (!state.fairingSeparated && state.altitudeKm > 75) {
          state.velocityKms = Math.max(1.0, state.velocityKms - dt * 0.08);
        }

        state.altitudeKm += state.velocityKms * vertRatio * dt * 11.5;
        const altRatio = Math.min(1.0, state.altitudeKm / 185);
        const downrangeProgress = Math.min(1.0, Math.max(0, ((90 - state.pitchDeg) / 90) * altRatio * 1.35));

        spacecraftGroup.position.x = THREE.MathUtils.lerp(0, 380, Math.pow(downrangeProgress, 1.25));
        spacecraftGroup.position.y = 4 + THREE.MathUtils.lerp(0, 330, altRatio);
        spacecraftGroup.position.z = THREE.MathUtils.lerp(0, -250, Math.pow(downrangeProgress, 1.25));

        // Rocket visual attitude directly reflects user's manual pitch angle
        const radPitch = ((90 - state.pitchDeg) * Math.PI) / 180;
        spacecraftGroup.rotation.z = -radPitch * 0.95;

        padGroup.position.y = -Math.min(state.altitudeKm * 25, 3000);

        // Billow launch smoke at pad
        if (state.altitudeKm < 15) {
          const pos = smokeGeo.attributes.position.array as Float32Array;
          for (let i = 0; i < smokeCount; i++) {
            if (pos[i * 3 + 1] < -100) {
              pos[i * 3] = (Math.random() - 0.5) * 10;
              pos[i * 3 + 1] = padGroup.position.y + 4;
              pos[i * 3 + 2] = (Math.random() - 0.5) * 10;
            } else {
              pos[i * 3] += smokeVels[i].x * dt;
              pos[i * 3 + 1] += smokeVels[i].y * dt;
              pos[i * 3 + 2] += smokeVels[i].z * dt;
              if (pos[i * 3 + 1] > padGroup.position.y + 120) {
                pos[i * 3 + 1] = -500;
              }
            }
          }
          smokeGeo.attributes.position.needsUpdate = true;
        }
      }

      // ── PHYSICAL DRIFT OF SEPARATED ROCKET STAGES ──
      // 1. SRB Boosters Drift & Pusher Flares
      if (state.srbSeparated) {
        state.srbSeparationProgress += dt;
        sepFlareLeft.visible = state.srbSeparationProgress < 1.8;
        sepFlareRight.visible = state.srbSeparationProgress < 1.8;

        if (srbGroupLeft.parent === scene) {
          srbGroupLeft.position.x -= 16 * dt;
          srbGroupLeft.position.y -= 22 * dt;
          srbGroupLeft.position.z -= 8 * dt;
          srbGroupLeft.rotation.z += 0.45 * dt;
        }
        if (srbGroupRight.parent === scene) {
          srbGroupRight.position.x += 16 * dt;
          srbGroupRight.position.y -= 22 * dt;
          srbGroupRight.position.z -= 8 * dt;
          srbGroupRight.rotation.z -= 0.45 * dt;
        }
      } else {
        sepFlareLeft.visible = false;
        sepFlareRight.visible = false;
      }

      // 2. Bipartite Payload Fairing Drift
      if (state.fairingSeparated) {
        if (fairingLeft.parent === scene) {
          fairingLeft.position.x -= 18 * dt;
          fairingLeft.position.y -= 26 * dt;
          fairingLeft.position.z -= 14 * dt;
          fairingLeft.rotation.z += 0.55 * dt;
        }
        if (fairingRight.parent === scene) {
          fairingRight.position.x += 18 * dt;
          fairingRight.position.y -= 26 * dt;
          fairingRight.position.z -= 14 * dt;
          fairingRight.rotation.z -= 0.55 * dt;
        }
      }

      // 3. Stage 1 Core MECO Drift
      if (state.stage1Separated) {
        if (coreStage.parent === scene) {
          coreStage.position.y -= 38 * dt;
          coreStage.position.z -= 10 * dt;
          coreStage.rotation.x += 0.2 * dt;
        }
      }

      // ── MANUAL FLIGHT MILESTONES & PROMPTS (ASTRONAUT OPERATED) ──
      if (state.altitudeKm >= 36 && !state.srbSeparated) {
        state.statusText = '⚠️ BOOSTER BURNOUT REACHED · PRESS [SPACE] OR CLICK BUTTON TO JETTISON BOOSTERS!';
        state.statusColor = '#f59e0b';
      } else if (state.altitudeKm >= 75 && !state.fairingSeparated) {
        state.statusText = '⚠️ VACUUM REACHED · PRESS [SPACE] OR CLICK BUTTON TO JETTISON FAIRING!';
        state.statusColor = '#38bdf8';
      } else if (state.altitudeKm >= 125 && !state.stage1Separated) {
        state.statusText = '⚠️ MECO BURNOUT · PRESS [SPACE] OR CLICK BUTTON TO SEPARATE STAGE 1!';
        state.statusColor = '#a855f7';
      } else if (state.altitudeKm >= 185 && !state.orbitConfirmed) {
        state.statusText = '🎯 ORBIT INSERTION WINDOW REACHED · PRESS [SPACE] OR CLICK CONFIRM TO INSERT ORBIT!';
        state.statusColor = '#22c55e';
      }

      // ── CAMERA MODES WITH CONTINUOUS VEHICLE TRACKING ──
      const vehicleTarget = new THREE.Vector3(spacecraftGroup.position.x, spacecraftGroup.position.y + 16, spacecraftGroup.position.z);

      if (cameraMode === 'orbit') {
        controls.enabled = true;
        const delta = vehicleTarget.clone().sub(prevExpeditionTarget);
        camera.position.add(delta);
        controls.target.copy(vehicleTarget);
        controls.update();
      } else if (cameraMode === 'chase') {
        controls.enabled = true;
        const delta = vehicleTarget.clone().sub(prevExpeditionTarget);
        controls.target.copy(vehicleTarget);
        camera.position.lerp(spacecraftGroup.position.clone().add(new THREE.Vector3(0, 16, 54)), 0.12);
        controls.update();
      } else if (cameraMode === 'tower') {
        controls.enabled = false;
        camera.position.set(-20, 58, 38);
        camera.lookAt(spacecraftGroup.position.x, spacecraftGroup.position.y + 16, spacecraftGroup.position.z);
      } else if (cameraMode === 'cockpit') {
        controls.enabled = false;
        const cabinPos = spacecraftGroup.position.clone().add(new THREE.Vector3(0, 32, 2.2));
        camera.position.copy(cabinPos);
        const lookDir = new THREE.Vector3(
          Math.sin((cockpitLookRef.current.yaw * Math.PI) / 180),
          Math.sin((cockpitLookRef.current.pitch * Math.PI) / 180) + 0.15,
          -1
        ).normalize();
        camera.lookAt(cabinPos.clone().add(lookDir.multiplyScalar(60)));
      }
      prevExpeditionTarget.copy(vehicleTarget);

      // Sync React HUD telemetry
      setTelemetry({
        altitudeKm: state.altitudeKm,
        velocityKms: state.velocityKms,
        throttle: state.throttle,
        propellant: state.propellant,
        pitchDeg: state.pitchDeg,
        rollDeg: state.rollDeg,
        gForce: state.gForce,
        statusText: state.statusText,
        statusColor: state.statusColor,
        stage: state.stage,
      });

      // Update Navball attitude
      updateNavball(state.pitchDeg, state.rollDeg);

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(animate);

    const onResize = () => {
      const w = container.clientWidth || 960;
      const h = container.clientHeight || 620;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
      controls.dispose();
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [isOpen, selectedProfileId]);

  const getPhaseLabels = (profId: AdvancedMissionProfile): { id: ExpeditionPhase; label: string }[] => {
    return [
      { id: 'PAD_LAUNCH', label: '1. PAD LIFTOFF' },
      { id: 'TLI_INJECTION', label: '2. BOOSTERS SEP' },
      { id: 'CISLUNAR_COAST', label: '3. FAIRINGS' },
      { id: 'LUNAR_DESCENT', label: '4. CORE MECO' },
      { id: 'SURFACE_TOUCHDOWN', label: '5. LEO INSERTION' },
    ];
  };

  const getActionLabel = (profId: AdvancedMissionProfile, ph: ExpeditionPhase, thr: number): string => {
    const state = flightStateRef.current;
    if (thr === 0) {
      if (profId === 'NEW_SHEPARD') return 'BE-3PM IGNITION & LIFTOFF [SPACE]';
      if (profId === 'APOLLO_11') return 'SATURN V IGNITION & LIFTOFF [SPACE]';
      if (profId === 'STS_31') return 'SSME IGNITION & LIFTOFF [SPACE]';
      if (profId === 'ISS_DRAGON') return 'MERLIN 1D IGNITION & LIFTOFF [SPACE]';
      if (profId === 'MARS_PERSEV') return 'ATLAS V IGNITION & LIFTOFF [SPACE]';
      return 'SLS IGNITION & LIFTOFF [SPACE]';
    }
    if (!state.srbSeparated) return '🚀 JETTISON BOOSTERS (SRB) [SPACE]';
    if (!state.fairingSeparated) return '🛡️ JETTISON PAYLOAD FAIRING [SPACE]';
    if (state.stage === 1) return '🔥 CORE STAGE SEPARATION (MECO) [SPACE]';
    if (!state.orbitConfirmed) return '🌍 CONFIRM LEO ORBIT INSERTION [SPACE]';
    return '✅ LEO ORBIT INSERTION COMPLETE';
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(2, 4, 9, 0.96)',
        backdropFilter: 'blur(16px)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* ── TOP MISSION CONTROL HEADER ── */}
      {/* ── TOP MISSION CONTROL HEADER ── */}
      <header
        style={{
          padding: '8px 20px',
          background: 'rgba(11, 19, 43, 0.98)',
          borderBottom: '1px solid rgba(56, 189, 248, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          zIndex: 30,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #ea580c, #dc2626)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 16px rgba(234, 88, 12, 0.6)',
              }}
            >
              <Rocket size={20} className="text-white" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '15px', fontWeight: 900, color: '#f8fafc', letterSpacing: '0.06em', fontFamily: 'var(--font-space)' }}>
                  {currentProfile.title.toUpperCase()}
                </span>
                <span
                  style={{
                    fontSize: '9.5px',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: 'rgba(239, 68, 68, 0.2)',
                    border: '1px solid rgba(239, 68, 68, 0.5)',
                    color: '#f87171',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  🔒 {currentProfile.badge}
                </span>
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
                {currentProfile.craft} · <span style={{ color: '#38bdf8' }}>{currentProfile.destination}</span> · {currentProfile.crew}
              </div>
            </div>
          </div>

          {/* Right Action Icons: Video, Trajectory toggle, Music, Voice, Sound, Close */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {currentProfile.youtubeId && (
              <button
                onClick={() => {
                  setShowVideoModal(true);
                  soundFx.playClick(900);
                }}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.28), rgba(220, 38, 38, 0.38))',
                  border: '1px solid rgba(239, 68, 68, 0.6)',
                  color: '#fca5a5',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontFamily: 'var(--font-mono)',
                  boxShadow: '0 0 14px rgba(239, 68, 68, 0.35)',
                }}
                title="Watch Official YouTube Flight Profile: Space & Back in 10 Minutes"
              >
                <span style={{ fontSize: '13px' }}>▶️</span>
                <span>FLIGHT VIDEO (10 MIN)</span>
              </button>
            )}

            <button
              onClick={() => {
                setShowTrajectoryPlan(!showTrajectoryPlan);
                soundFx.playClick(850);
              }}
              style={{
                padding: '6px 11px',
                borderRadius: '6px',
                background: showTrajectoryPlan ? 'rgba(245, 158, 11, 0.25)' : 'rgba(30, 41, 59, 0.8)',
                border: '1px solid rgba(245, 158, 11, 0.5)',
                color: showTrajectoryPlan ? '#fbbf24' : '#94a3b8',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontFamily: 'var(--font-mono)',
              }}
              title="Toggle Authentic Orbital Flight Trajectory Planner"
            >
              <Compass size={14} />
              <span>{showTrajectoryPlan ? 'TRAJECTORY: ON' : 'TRAJECTORY: OFF'}</span>
            </button>

            <button
              onClick={toggleMusic}
              style={{
                padding: '6px 10px',
                borderRadius: '6px',
                background: musicActive ? 'rgba(56, 189, 248, 0.2)' : 'rgba(30, 41, 59, 0.8)',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                color: musicActive ? '#38bdf8' : '#94a3b8',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
              title="Toggle Background Space Music"
            >
              <Music size={14} />
              <span>{musicActive ? 'MUSIC ON' : 'MUSIC OFF'}</span>
            </button>

            <button
              onClick={() => {
                setVoiceEnabled(!voiceEnabled);
                soundFx.playClick(750);
              }}
              style={{
                padding: '6px 10px',
                borderRadius: '6px',
                background: voiceEnabled ? 'rgba(16, 185, 129, 0.2)' : 'rgba(30, 41, 59, 0.8)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                color: voiceEnabled ? '#34d399' : '#94a3b8',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
              title="Toggle Houston Capcom Radio Voice"
            >
              <Radio size={14} />
              <span>{voiceEnabled ? 'VOICE ON' : 'VOICE OFF'}</span>
            </button>

            <button
              onClick={() => {
                const next = !soundEnabled;
                setSoundEnabled(next);
                audioSynthRef.current.setEnabled(next);
                soundFx.playClick(750);
              }}
              style={{
                padding: '6px 10px',
                borderRadius: '6px',
                background: soundEnabled ? 'rgba(59, 130, 246, 0.2)' : 'rgba(30, 41, 59, 0.8)',
                border: '1px solid rgba(59, 130, 246, 0.4)',
                color: soundEnabled ? '#60a5fa' : '#94a3b8',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 700,
              }}
              title="Toggle Rocket Audio Effects"
            >
              {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
            </button>

            <button
              onClick={onClose}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                border: '1px solid rgba(148, 163, 184, 0.3)',
                background: 'rgba(30, 41, 59, 0.8)',
                color: '#f8fafc',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* ── ADVANCED ASTRONAUT MISSIONS SELECTOR BAR (6 ICONIC DEEP SPACE EXPEDITIONS) ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '6px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto' }}>
            <span style={{ fontSize: '10px', color: '#f59e0b', fontFamily: 'var(--font-mono)', fontWeight: 800, whiteSpace: 'nowrap' }}>
              🎖️ SELECT FLIGHT:
            </span>
            {ADVANCED_PROFILES.map((prof) => {
              const isSelected = prof.id === selectedProfileId;
              return (
                <button
                  key={prof.id}
                  onClick={() => {
                    setSelectedProfileId(prof.id);
                    transitionToPhase('PAD_LAUNCH');
                    soundFx.playReactorStart();
                    announceCapcom(`Loading flight plan for ${prof.title}. Systems check complete.`);
                  }}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    background: isSelected ? 'linear-gradient(135deg, rgba(234, 88, 12, 0.35), rgba(220, 38, 38, 0.35))' : 'rgba(15, 23, 42, 0.7)',
                    border: isSelected ? '1px solid #ea580c' : '1px solid rgba(148, 163, 184, 0.2)',
                    color: isSelected ? '#f8fafc' : '#94a3b8',
                    fontSize: '10.5px',
                    fontWeight: isSelected ? 800 : 600,
                    fontFamily: 'var(--font-mono)',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <span>{prof.id === 'NEW_SHEPARD' ? '🚀' : prof.id === 'ARTEMIS_5' ? '🌙' : prof.id === 'APOLLO_11' ? '🦅' : prof.id === 'STS_31' ? '🛰️' : prof.id === 'ISS_DRAGON' ? '🛸' : '🔴'}</span>
                  <span>{prof.id.replace('_', ' ')}</span>
                </button>
              );
            })}
          </div>

          {/* Phase Jump Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '10px', color: '#38bdf8', fontFamily: 'var(--font-mono)', fontWeight: 800 }}>STAGE:</span>
            {getPhaseLabels(selectedProfileId).map((p) => (
              <button
                key={p.id}
                onClick={() => transitionToPhase(p.id)}
                style={{
                  padding: '3px 8px',
                  borderRadius: '5px',
                  border: 'none',
                  cursor: 'pointer',
                  background: phase === p.id ? '#ea580c' : 'rgba(15, 23, 42, 0.8)',
                  color: phase === p.id ? '#ffffff' : '#94a3b8',
                  fontSize: '10px',
                  fontWeight: 800,
                  fontFamily: 'var(--font-mono)',
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ── 3D SIMULATION CANVAS CONTAINER ── */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <div ref={mountRef} style={{ width: '100%', height: '100%' }} />

        {/* ── AUTHENTIC NASA ERA COCKPIT OVERLAY (When in Cockpit View) ── */}
        {cameraMode === 'cockpit' && (
          <AuthenticCockpitOverlay
            mission={activeMission}
            telemetry={{
              altitudeKm: telemetry.altitudeKm,
              velocityKms: telemetry.velocityKms,
              throttle: telemetry.throttle,
              propellantPct: telemetry.propellant,
              pitchDeg: telemetry.pitchDeg,
              rollDeg: telemetry.rollDeg,
              gForce: telemetry.gForce,
              flightPhase: telemetry.stage === 2 ? 'STAGE 2 ASCENT' : 'BOOSTER ASCENT',
              targetAltitudeKm: 185,
              targetVelocityKms: 7.8,
              isLunarMission: false,
              isMarsMission: false,
              destinationName: 'Low Earth Orbit (185 km)',
            }}
            cockpitLookYaw={cockpitLookRef.current.yaw}
            cockpitLookPitch={cockpitLookRef.current.pitch}
            onSetCockpitLook={(yaw, pitch) => {
              cockpitLookRef.current = { yaw, pitch };
            }}
            onThrottleChange={(delta) => {
              flightStateRef.current.throttle = Math.max(0, Math.min(1, flightStateRef.current.throttle + delta));
            }}
            onStageTrigger={handlePrimaryAction}
          />
        )}

        {/* ── TOP-LEFT: STATUS & PRIMARY FLIGHT TELEMETRY HUD ── */}
        <div
          style={{
            position: 'absolute',
            top: '16px',
            left: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            zIndex: 10,
            pointerEvents: 'auto',
          }}
        >
          {/* Status Banner */}
          <div
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              background: 'rgba(15, 23, 42, 0.92)',
              border: `1px solid ${telemetry.statusColor}`,
              color: telemetry.statusColor,
              fontWeight: 800,
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              boxShadow: `0 0 16px ${telemetry.statusColor}33`,
              maxWidth: '460px',
            }}
          >
            {telemetry.statusText}
          </div>

          {/* Telemetry Data Grid */}
          <div
            style={{
              padding: '12px',
              borderRadius: '10px',
              background: 'rgba(11, 19, 43, 0.88)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              backdropFilter: 'blur(10px)',
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '10px',
              width: '280px',
            }}
          >
            <div>
              <div style={{ fontSize: '9px', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>ALTITUDE</div>
              <div style={{ fontSize: '16px', fontWeight: 900, color: '#f8fafc', fontFamily: 'var(--font-mono)' }}>
                {telemetry.altitudeKm.toLocaleString(undefined, { maximumFractionDigits: 1 })} <span style={{ fontSize: '10px', color: '#38bdf8' }}>KM</span>
              </div>
            </div>

            <div>
              <div style={{ fontSize: '9px', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>VELOCITY</div>
              <div style={{ fontSize: '16px', fontWeight: 900, color: '#f8fafc', fontFamily: 'var(--font-mono)' }}>
                {telemetry.velocityKms.toFixed(2)} <span style={{ fontSize: '10px', color: '#38bdf8' }}>KM/S</span>
              </div>
            </div>

            <div>
              <div style={{ fontSize: '9px', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>THROTTLE</div>
              <div style={{ fontSize: '14px', fontWeight: 900, color: '#fb923c', fontFamily: 'var(--font-mono)' }}>
                {(telemetry.throttle * 100).toFixed(0)}%
              </div>
            </div>

            <div>
              <div style={{ fontSize: '9px', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>PROPELLANT</div>
              <div style={{ fontSize: '14px', fontWeight: 900, color: telemetry.propellant > 20 ? '#34d399' : '#f87171', fontFamily: 'var(--font-mono)' }}>
                {telemetry.propellant.toFixed(0)}%
              </div>
            </div>

            <div>
              <div style={{ fontSize: '9px', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>G-FORCE</div>
              <div style={{ fontSize: '14px', fontWeight: 900, color: '#f8fafc', fontFamily: 'var(--font-mono)' }}>
                {telemetry.gForce.toFixed(2)} G
              </div>
            </div>

            <div>
              <div style={{ fontSize: '9px', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>PITCH</div>
              <div style={{ fontSize: '14px', fontWeight: 900, color: '#f8fafc', fontFamily: 'var(--font-mono)' }}>
                {telemetry.pitchDeg.toFixed(0)}°
              </div>
            </div>
          </div>

          {/* Authentic Orbital Flight Trajectory Planner Card */}
          {showTrajectoryPlan && (
            <div
              style={{
                padding: '12px',
                borderRadius: '10px',
                background: 'rgba(11, 19, 43, 0.92)',
                border: '1px solid rgba(245, 158, 11, 0.35)',
                backdropFilter: 'blur(10px)',
                width: '310px',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ fontSize: '10px', color: '#fbbf24', fontFamily: 'var(--font-mono)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🗺️</span>
                  <span>AUTHENTIC FLIGHT TRAJECTORY</span>
                </div>
                <span style={{ fontSize: '9px', color: '#38bdf8', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                  LEO 185 KM
                </span>
              </div>

              {/* Waypoints timeline */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '9px', fontFamily: 'var(--font-mono)' }}>
                {[
                  { label: '1. Pad 39B Liftoff', note: 'Alt 0 km · v=0 km/s · 100% Thrust', active: telemetry.altitudeKm < 36 },
                  { label: '2. Booster Separation (SRB)', note: 'Alt 36 km · v=2.4 km/s · Korolev Cross', active: telemetry.altitudeKm >= 36 && telemetry.altitudeKm < 75 },
                  { label: '3. Fairing Jettison', note: 'Alt 75 km · v=4.8 km/s · Space Vacuum', active: telemetry.altitudeKm >= 75 && telemetry.altitudeKm < 125 },
                  { label: '4. Core MECO & S2 Ignition', note: 'Alt 125 km · v=6.9 km/s · Stage 2 Burn', active: telemetry.altitudeKm >= 125 && telemetry.altitudeKm < 185 },
                  { label: '5. LEO Orbit Insertion Complete', note: 'Alt 185 km · v=7.8 km/s · Stable Orbit', active: telemetry.altitudeKm >= 185 || flightStateRef.current.orbitConfirmed },
                ].map((wp, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '3px 6px',
                      borderRadius: '4px',
                      background: wp.active ? 'rgba(245, 158, 11, 0.2)' : 'rgba(15, 23, 42, 0.5)',
                      border: wp.active ? '1px solid rgba(245, 158, 11, 0.5)' : '1px solid transparent',
                      color: wp.active ? '#fbbf24' : '#94a3b8',
                    }}
                  >
                    <span style={{ fontWeight: wp.active ? 800 : 500 }}>
                      {wp.active ? '▶ ' : '• '}{wp.label}
                    </span>
                    <span style={{ fontSize: '8px', color: wp.active ? '#fef08a' : '#64748b' }}>
                      {wp.note}
                    </span>
                  </div>
                ))}
              </div>

              {/* Orbital Telemetry Parameters */}
              <div
                style={{
                  marginTop: '6px',
                  paddingTop: '6px',
                  borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '4px',
                  fontSize: '8.5px',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                <div>
                  <span style={{ color: '#64748b' }}>APOAPSIS (Ra): </span>
                  <span style={{ color: '#38bdf8', fontWeight: 800 }}>405,500 KM</span>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>PERIAPSIS (Rp): </span>
                  <span style={{ color: '#38bdf8', fontWeight: 800 }}>185 KM</span>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>ECCENTRICITY: </span>
                  <span style={{ color: '#a78bfa', fontWeight: 800 }}>0.967</span>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>INCLINATION: </span>
                  <span style={{ color: '#a78bfa', fontWeight: 800 }}>28.5°</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── TOP-RIGHT: 3D ADI NAVBALL HUD ── */}
        <div
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            zIndex: 10,
          }}
        >
          <div
            style={{
              padding: '10px',
              borderRadius: '12px',
              background: 'rgba(11, 19, 43, 0.9)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <div style={{ fontSize: '9.5px', color: '#38bdf8', fontFamily: 'var(--font-mono)', fontWeight: 800, marginBottom: '6px' }}>
              ATTITUDE INDICATOR (ADI)
            </div>
            <canvas ref={navballCanvasRef} width={110} height={110} />
          </div>

          {/* Camera Switcher */}
          <div style={{ display: 'flex', gap: '4px' }}>
            {(['orbit', 'chase', 'tower', 'cockpit'] as const).map((cam) => (
              <button
                key={cam}
                onClick={() => {
                  setCameraMode(cam);
                  soundFx.playClick(850);
                }}
                style={{
                  padding: '4px 8px',
                  borderRadius: '5px',
                  border: 'none',
                  cursor: 'pointer',
                  background: cameraMode === cam ? '#38bdf8' : 'rgba(15, 23, 42, 0.8)',
                  color: cameraMode === cam ? '#0f172a' : '#cbd5e1',
                  fontSize: '10px',
                  fontWeight: 800,
                  fontFamily: 'var(--font-mono)',
                  textTransform: 'uppercase',
                }}
              >
                {cam === 'orbit' ? '360° ORBIT' : cam}
              </button>
            ))}
          </div>
        </div>

        {/* ── 360 ORBIT MOUSE HINT PILL ── */}
        {(cameraMode === 'orbit' || cameraMode === 'chase') && (
          <div
            style={{
              position: 'absolute',
              bottom: '80px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(11, 19, 43, 0.85)',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              borderRadius: '20px',
              padding: '4px 14px',
              fontSize: '10.5px',
              fontWeight: 700,
              color: '#38bdf8',
              fontFamily: 'var(--font-mono)',
              pointerEvents: 'none',
              zIndex: 25,
              backdropFilter: 'blur(8px)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.6)',
            }}
          >
            🖱️ Left-Click + Drag: 360° Free Look · Scroll Wheel: Zoom · 'C': Switch Camera
          </div>
        )}

        {/* ── BOTTOM FLIGHT COMMAND CONSOLE (INTERACTIVE BUTTONS) ── */}
        <div
          style={{
            position: 'absolute',
            bottom: '16px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            zIndex: 20,
            background: 'rgba(15, 23, 42, 0.94)',
            padding: '10px 18px',
            borderRadius: '12px',
            border: '1px solid rgba(56, 189, 248, 0.35)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.8)',
          }}
        >
          {/* BIG IGNITE / ACTION BUTTON */}
          <button
            onClick={handlePrimaryAction}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              background: 'linear-gradient(135deg, #ea580c, #dc2626)',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 900,
              fontFamily: 'var(--font-space)',
              letterSpacing: '0.05em',
              boxShadow: '0 0 16px rgba(234, 88, 12, 0.5)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Flame size={16} />
            <span>{getActionLabel(selectedProfileId, phase, telemetry.throttle)}</span>
          </button>

          {/* Explicit Multi-Stage Action Buttons */}
          {telemetry.throttle > 0 && !flightStateRef.current.srbSeparated && telemetry.altitudeKm >= 15 && (
            <button
              onClick={() => doBoosterSeparationRef.current()}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid #f59e0b',
                cursor: 'pointer',
                background: 'rgba(245, 158, 11, 0.25)',
                color: '#fbbf24',
                fontSize: '11px',
                fontWeight: 900,
                fontFamily: 'var(--font-mono)',
              }}
            >
              🚀 SEPARATE BOOSTERS
            </button>
          )}

          {flightStateRef.current.srbSeparated && !flightStateRef.current.fairingSeparated && telemetry.altitudeKm >= 45 && (
            <button
              onClick={() => doFairingSeparationRef.current()}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid #38bdf8',
                cursor: 'pointer',
                background: 'rgba(56, 189, 248, 0.25)',
                color: '#38bdf8',
                fontSize: '11px',
                fontWeight: 900,
                fontFamily: 'var(--font-mono)',
              }}
            >
              🛡️ JETTISON FAIRINGS
            </button>
          )}

          {flightStateRef.current.fairingSeparated && telemetry.stage === 1 && telemetry.altitudeKm >= 90 && (
            <button
              onClick={() => doCoreStageSeparationRef.current()}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid #a855f7',
                cursor: 'pointer',
                background: 'rgba(168, 85, 247, 0.25)',
                color: '#c084fc',
                fontSize: '11px',
                fontWeight: 900,
                fontFamily: 'var(--font-mono)',
              }}
            >
              🔥 SEPARATE CORE STAGE (MECO)
            </button>
          )}

          {telemetry.altitudeKm >= 135 && !flightStateRef.current.orbitConfirmed && (
            <button
              onClick={confirmOrbitInsertion}
              style={{
                padding: '10px 18px',
                borderRadius: '8px',
                border: '1px solid #22c55e',
                cursor: 'pointer',
                background: 'linear-gradient(135deg, #16a34a, #15803d)',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: 900,
                fontFamily: 'var(--font-mono)',
                boxShadow: '0 0 16px rgba(34, 197, 94, 0.6)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span>🌍 CONFIRM LEO ORBIT INSERTION</span>
            </button>
          )}

          {/* Throttle Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              onClick={() => {
                flightStateRef.current.throttle = Math.min(1.0, flightStateRef.current.throttle + 0.2);
                soundFx.playClick(850);
              }}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid rgba(148, 163, 184, 0.3)',
                background: 'rgba(30, 41, 59, 0.8)',
                color: '#f8fafc',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 800,
              }}
              title="Throttle Up (W key)"
            >
              THROTTLE +
            </button>
            <button
              onClick={() => {
                flightStateRef.current.throttle = Math.max(0, flightStateRef.current.throttle - 0.2);
                soundFx.playClick(850);
              }}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid rgba(148, 163, 184, 0.3)',
                background: 'rgba(30, 41, 59, 0.8)',
                color: '#f8fafc',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 800,
              }}
              title="Throttle Down (S key)"
            >
              THROTTLE -
            </button>
          </div>

          {/* Manual Pitch Steering Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              onClick={() => handlePitchChange(10)}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid rgba(148, 163, 184, 0.3)',
                background: 'rgba(30, 41, 59, 0.8)',
                color: '#f8fafc',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 800,
              }}
              title="Pitch Up (D key / Right Arrow)"
            >
              ⮝ PITCH +10°
            </button>
            <button
              onClick={() => handlePitchChange(-10)}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid rgba(148, 163, 184, 0.3)',
                background: 'rgba(30, 41, 59, 0.8)',
                color: '#f8fafc',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 800,
              }}
              title="Pitch Down / Gravity Turn (A key / Left Arrow)"
            >
              ⮟ PITCH -10°
            </button>
          </div>

          {/* Reset Flight */}
          <button
            onClick={() => transitionToPhase('PAD_LAUNCH')}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid rgba(148, 163, 184, 0.3)',
              background: 'rgba(30, 41, 59, 0.8)',
              color: '#94a3b8',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
            title="Reset flight to Pad 39B"
          >
            <RotateCcw size={13} />
            <span>RESET</span>
          </button>

          {/* If Surface Touchdown: Open Moonquake Map */}
          {phase === 'SURFACE_TOUCHDOWN' && onOpenMoonquakeMap && (
            <button
              onClick={() => {
                onClose();
                onOpenMoonquakeMap();
              }}
              style={{
                padding: '8px 14px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                background: '#0284c7',
                color: '#ffffff',
                fontSize: '11px',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Compass size={14} />
              <span>OPEN MOONQUAKE GLOBE →</span>
            </button>
          )}
        </div>
      </div>

      {/* ── EMBEDDED YOUTUBE FLIGHT VIDEO MODAL (NEW SHEPARD: SPACE & BACK IN 10 MIN) ── */}
      {showVideoModal && currentProfile.youtubeId && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999999,
            background: 'rgba(0, 0, 0, 0.88)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
          }}
          onClick={() => setShowVideoModal(false)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '920px',
              background: '#090d16',
              borderRadius: '16px',
              border: '1px solid rgba(56, 189, 248, 0.45)',
              boxShadow: '0 24px 80px rgba(0, 0, 0, 0.95)',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: '12px 18px',
                background: 'rgba(15, 23, 42, 0.96)',
                borderBottom: '1px solid rgba(56, 189, 248, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '18px' }}>🎥</span>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 900, color: '#f8fafc', fontFamily: 'var(--font-space)' }}>
                    {currentProfile.title.toUpperCase()}
                  </div>
                  <div style={{ fontSize: '10.5px', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
                    Official NASA/Commercial Spaceflight Reference Video · 10-Minute Profile
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowVideoModal(false)}
                style={{
                  background: 'rgba(30, 41, 59, 0.8)',
                  border: '1px solid rgba(148, 163, 184, 0.3)',
                  color: '#f8fafc',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  width: '30px',
                  height: '30px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={16} />
              </button>
            </div>
            <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', background: '#000' }}>
              <iframe
                title="Mission Reference Video"
                src={`https://www.youtube.com/embed/${currentProfile.youtubeId}?autoplay=1&rel=0`}
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EarthToMoonExpeditionModal;
