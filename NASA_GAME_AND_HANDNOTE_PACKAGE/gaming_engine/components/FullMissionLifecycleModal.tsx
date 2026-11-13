// ============================================================================
// FullMissionLifecycleModal.tsx — NASA 3D Spaceflight & Orbital Rocket Simulator
// Full-Screen Immersive Aerospace Simulation Modeled Directly After:
// "Ellipse: Rocket Simulator - Mission 3: Lunar Voyager" (YouTube: qXYpltxSTK0)
// Complete Real-Time Flight:
// 1. VAB Rocket Builder & Equipment Selection (Custom 3D Assembly)
// 2. Pad 39A Weather Clearance Check & Liftoff
// 3. Multi-Stage Staging & Earth Orbit
// 4. Authentic 3D Keplerian Translunar Trajectory Flight Path
// 5. Apollo Lunar Module Powered Descent & Touchdown
// 6. Third-Person Walkable Astronaut (Neil Armstrong) on Moon Surface
//    (Active WASD Walking, Plant Flag, Drill Core Samples, Deploy Seismic Station)
// 7. Board LM, Launch Ascent Stage (Leaving Descent Stage & Flag on Moon)
// 8. Earth Return, Hypersonic Plasma Re-entry & Triple Chute Splashdown
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
  ShieldCheck,
  Rocket,
  Wrench,
  Sun,
  Eye,
  Footprints,
  Activity,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';

import {
  type ExpeditionDestination,
  type RocketBooster,
  type RocketCoreStage,
  type RocketUpperStage,
  type ScienceEquipment,
  type HeatShieldParachuteConfig,
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
import { NasaDataModal } from './NasaDataModal';
import { awardCadetCredits } from '../utils/gearBonusHelper';
import { disposeThreeScene } from '../utils/threeDisposeHelper';
import { getSharedGLTFLoader } from '../utils/modelLoader';

interface FullMissionLifecycleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMissionCompleted?: (destination: ExpeditionDestination, credits: number) => void;
  initialDestination?: ExpeditionDestination;
}

export type FlightViewMode = 'CHASE' | 'ORBIT_MAP' | 'PAD_CAM' | 'ASTRONAUT_EVA';

export type MissionPhase =
  | 'VAB_BUILD'         // 1. Vehicle Assembly Building (Build rocket, choose equipment)
  | 'PAD_READY'         // 2. Rollout to Launch Complex 39A & Weather Clearance
  | 'ASCENT'            // 3. T-0 Liftoff, Flame Trench Smoke, Gravity Turn
  | 'STAGE1_SEP'        // 4. Solid Booster / S-IC Jettison
  | 'ORBIT_INSERTION'   // 5. Upper Stage burn to 7.8 km/s LEO
  | 'ORBIT_COAST'       // 6. Earth Parking Orbit (200x200 km)
  | 'TLI_BURN'          // 7. Trans-Lunar Injection (TLI) Trajectory Expansion
  | 'DEEP_CRUISE'       // 8. 3D Translunar Trajectory Flight with Time Warp
  | 'LUNAR_CAPTURE'     // 9. Lunar Orbit Insertion (LOI 100 km)
  | 'RETRO_DESCENT'     // 10. Manual Lunar Descent with Apollo Lunar Module Eagle
  | 'SURFACE_LANDED'    // 11. Touched down in Mare Tranquillitatis
  | 'SURFACE_EVA'       // 12. Active Walkable Astronaut (Neil Armstrong) on Moon Surface
  | 'SURFACE_ASCENT'    // 13. Lunar Ascent Stage liftoff (leaving descent stage & flag)
  | 'TEI_RETURN'        // 14. Trans-Earth Injection Return Trajectory
  | 'REENTRY_PLASMA'    // 15. Hypersonic 11 km/s Atmospheric Entry Fireball
  | 'PARACHUTE_DESCENT' // 16. Triple Main Apollo Parachutes Deployed (4,000 m)
  | 'SPLASHDOWN';       // 17. Pacific Ocean Splashdown & Retrieval

// ─── PROCEDURAL WEB AUDIO SYNTHESIZER ───────────────────────────────────────
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
      if (this.engineGain) this.engineGain.gain.setValueAtTime(0, this.ctx?.currentTime || 0);
      if (this.noiseGain) this.noiseGain.gain.setValueAtTime(0, this.ctx?.currentTime || 0);
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

  ctx.fillStyle = '#1e392a';
  ctx.fillRect(0, 0, 1024, 1024);

  ctx.fillStyle = '#2c5339';
  for (let i = 0; i < 60; i++) {
    const rx = (i * 47) % 1024;
    const ry = (i * 89) % 1024;
    ctx.beginPath();
    ctx.arc(rx, ry, 50 + (i % 40), 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = '#475569';
  ctx.beginPath();
  ctx.arc(512, 512, 340, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#64748b';
  ctx.beginPath();
  ctx.arc(512, 512, 260, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(512, 512, 260, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(440, 160, 144, 704);

  const scorch = ctx.createRadialGradient(512, 512, 40, 512, 512, 160);
  scorch.addColorStop(0, 'rgba(0, 0, 0, 0.95)');
  scorch.addColorStop(0.5, 'rgba(30, 20, 15, 0.8)');
  scorch.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = scorch;
  ctx.fillRect(400, 400, 224, 224);

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

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 100, 256, 160);
  ctx.fillRect(256, 260, 256, 160);

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

  ctx.fillStyle = '#475569';
  ctx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 90; i++) {
    const cx = (i * 73) % 512;
    const cy = (i * 127) % 512;
    const r = 6 + (i % 26);

    const grad = ctx.createRadialGradient(cx - r * 0.25, cy - r * 0.25, r * 0.08, cx, cy, r);
    grad.addColorStop(0, '#1e293b');
    grad.addColorStop(0.65, '#334155');
    grad.addColorStop(1, '#94a3b8');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Titanium basalt dark specks
  ctx.fillStyle = '#0f172a';
  for (let s = 0; s < 180; s++) {
    const sx = (s * 37) % 512;
    const sy = (s * 83) % 512;
    ctx.fillRect(sx, sy, 2, 2);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 4);
  tex.needsUpdate = true;
  return tex;
};

// ─── PROCEDURAL MARS RED PLANET TEXTURE (JEZERO DELTA RUST) ───
const createProceduralMarsRedPlanetTexture = (): THREE.CanvasTexture => {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Oxidized terracotta & iron-oxide base
  ctx.fillStyle = '#991b1b';
  ctx.fillRect(0, 0, 512, 512);

  // Aeolian ripple sand dunes
  ctx.strokeStyle = '#7c2d12';
  ctx.lineWidth = 3;
  for (let y = 0; y < 512; y += 14) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x < 512; x += 32) {
      const wave = Math.sin((x + y * 2) * 0.04) * 6;
      ctx.lineTo(x, y + wave);
    }
    ctx.stroke();
  }

  // Dark basalt sand patches & volcanic granules
  ctx.fillStyle = '#450a0a';
  for (let i = 0; i < 70; i++) {
    const bx = (i * 97) % 512;
    const by = (i * 131) % 512;
    const br = 8 + (i % 22);
    ctx.beginPath();
    ctx.ellipse(bx, by, br * 1.6, br * 0.7, 0.35, 0, Math.PI * 2);
    ctx.fill();
  }

  // Dust streaks (atmospheric drift)
  ctx.fillStyle = 'rgba(234, 88, 12, 0.25)';
  for (let d = 0; d < 40; d++) {
    const dx = (d * 83) % 512;
    const dy = (d * 59) % 512;
    ctx.fillRect(dx, dy, 45, 3);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 4);
  tex.needsUpdate = true;
  return tex;
};

// ─── PROCEDURAL DESERT SAND TEXTURE (SUB-ORBITAL RECOVERY CORRIDOR) ───
const createProceduralDesertSandTexture = (): THREE.CanvasTexture => {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Golden desert sand
  ctx.fillStyle = '#d97706';
  ctx.fillRect(0, 0, 512, 512);

  // Dry lakebed clay polygon cracks
  ctx.strokeStyle = '#b45309';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 60; i++) {
    const cx = (i * 61) % 512;
    const cy = (i * 109) % 512;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + ((i % 5) - 2) * 20, cy + 25);
    ctx.lineTo(cx + 30, cy + 15);
    ctx.stroke();
  }

  // Desert wind dunes
  ctx.fillStyle = '#f59e0b';
  for (let d = 0; d < 35; d++) {
    const dx = (d * 79) % 512;
    const dy = (d * 113) % 512;
    ctx.beginPath();
    ctx.ellipse(dx, dy, 55, 12, -0.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Runway tire tracks / recovery corridors
  ctx.strokeStyle = 'rgba(120, 53, 15, 0.35)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(120, 0);
  ctx.lineTo(120, 512);
  ctx.moveTo(136, 0);
  ctx.lineTo(136, 512);
  ctx.stroke();

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 4);
  tex.needsUpdate = true;
  return tex;
};

// ─── PROCEDURAL OCEAN WATER TEXTURE (ORBITAL PACIFIC SPLASHDOWN) ───
const createProceduralOceanWaterTexture = (): THREE.CanvasTexture => {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Deep Pacific azure / navy base
  ctx.fillStyle = '#0369a1';
  ctx.fillRect(0, 0, 512, 512);

  // Swell ripples
  ctx.fillStyle = '#0284c7';
  for (let r = 0; r < 50; r++) {
    const rx = (r * 67) % 512;
    const ry = (r * 103) % 512;
    ctx.beginPath();
    ctx.ellipse(rx, ry, 60 + (r % 30), 16, 0.15, 0, Math.PI * 2);
    ctx.fill();
  }

  // White foam crests and sea spray
  ctx.fillStyle = 'rgba(224, 242, 254, 0.75)';
  for (let f = 0; f < 80; f++) {
    const fx = (f * 97) % 512;
    const fy = (f * 43) % 512;
    ctx.fillRect(fx, fy, 12 + (f % 16), 2);
    ctx.fillRect(fx + 2, fy - 1, 6, 1);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(6, 6);
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
  // Starts directly on Earth Pad 39A in full 3D simulation!
  const [missionPhase, setMissionPhase] = useState<MissionPhase>('PAD_READY');
  const [viewMode, setViewMode] = useState<FlightViewMode>('CHASE');
  const [timeWarp, setTimeWarp] = useState<number>(1);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isNasaModalOpen, setIsNasaModalOpen] = useState(false);

  // VAB Configuration State (Custom Rocket & Equipment Builder)
  const [selectedBooster, setSelectedBooster] = useState<RocketBooster>(VAB_BOOSTERS[0]);
  const [selectedCore, setSelectedCore] = useState<RocketCoreStage>(VAB_CORE_STAGES[0]);
  const [selectedUpper, setSelectedUpper] = useState<RocketUpperStage>(VAB_UPPER_STAGES[0]);
  const [selectedEquip, setSelectedEquip] = useState<ScienceEquipment[]>([
    VAB_SCIENCE_EQUIPMENT[0], // Apollo 11 Flag
    VAB_SCIENCE_EQUIPMENT[1], // Core Drill
    VAB_SCIENCE_EQUIPMENT[2], // Seismic Station
  ]);
  const [selectedReentry, setSelectedReentry] = useState<HeatShieldParachuteConfig>(VAB_REENTRY_CONFIGS[0]);

  // Real Rocket Physics Calculation
  const rocketPhysics = useMemo(() => {
    return calculateRocketPhysics({
      destination,
      booster: selectedBooster,
      coreStage: selectedCore,
      upperStage: selectedUpper,
      selectedEquipment: selectedEquip,
      reentryConfig: selectedReentry,
      crewCount: 3,
    });
  }, [destination, selectedBooster, selectedCore, selectedUpper, selectedEquip, selectedReentry]);

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

  // Walkable Astronaut EVA State on Moon Surface
  const [astroWalkPos, setAstroWalkPos] = useState({ x: 2.2, z: 2.2, rot: 0 });
  const [evaTasks, setEvaTasks] = useState<{ flagPlanted: boolean; sampleDrilled: boolean; seismicDeployed: boolean }>({
    flagPlanted: false,
    sampleDrilled: false,
    seismicDeployed: false,
  });
  const evaTasksRef = useRef(evaTasks);
  useEffect(() => { evaTasksRef.current = evaTasks; }, [evaTasks]);

  const [activeEvaPrompt, setActiveEvaPrompt] = useState<string | null>(null);
  const [obstacleAlert, setObstacleAlert] = useState<string | null>(null);

  // Dynamic Mission Task & Environment Profiles for 4 Distinct Destinations
  const taskInfo = useMemo(() => {
    switch (destination) {
      case 'MARS':
        return {
          suitTitle: 'xEMU MARS SUIT VITALS (NOMINAL)',
          location: 'JEZERO CRATER DELTA (18.38°N, 77.58°E)',
          gravity: '3.72 m/s² (3/8g)',
          atmo: '610 Pa (95% CO₂ DUST)',
          temp: '-63°C',
          subtitle: '🔴 JEZERO CRATER DELTA · 3/8g · 610 Pa CO₂ ATMOSPHERE',
          task1: { title: 'Activate MOXIE Oxygen Plant', icon: '⚡', desc: 'Solid oxide CO₂ electrolysis unit (6.5m, -3.0m)', doneLabel: 'ACTIVE ✓' },
          task2: { title: 'Drill Delta Mudstone Core', icon: '🔬', desc: 'Jezero ancient river biosignature rocks (-7.0m, 8.0m)', doneLabel: 'SECURED ✓' },
          task3: { title: 'Deploy Ingenuity & REMS', icon: '🛸', desc: 'Scout copter & atmospheric weather station (10.0m, 6.0m)', doneLabel: 'ONLINE ✓' },
          vehicle: { title: 'Board Mars Ascent Vehicle (MAV)', icon: '🚀', desc: 'Prepare for MAV launch into Mars orbit', readyLabel: 'READY [E]' },
          prompt1: '⚡ NEAR MOXIE REACTOR · PRESS [E] OR CLICK [ACTIVATE MOXIE]',
          prompt2: '🔬 NEAR DELTA CLAY · PRESS [E] OR CLICK [DRILL BIOSIGNATURE CORE]',
          prompt3: '🛸 NEAR SCOUT ZONE · PRESS [E] OR CLICK [DEPLOY INGENUITY]',
          promptBoard: '🚀 NEAR MAV LADDER · PRESS [E] OR CLICK [BOARD MAV & LAUNCH]',
          callout1: '⚡ MOXIE ELECTROLYSIS ONLINE! PRODUCING PURE OXYGEN FROM MARTIAN CO₂!',
          callout2: '🔬 ANCIENT DELTA RIVERBED MUDSTONE CORE SECURED (BIOSIGNATURE PRESERVED)!',
          callout3: '🛸 INGENUITY SCOUT DRONE & REMS ATMOSPHERIC STATION OPERATIONAL!',
          calloutBoard: '🚀 MAV LIFTOFF! ASCENDING THROUGH MARTIAN SKY TO RENDEZVOUS WITH ORBITER!',
        };
      case 'SUBORBITAL':
        return {
          suitTitle: 'ACES FLIGHT SUIT VITALS (NOMINAL)',
          location: 'WHITE SANDS SPACE HARBOR (32.9°N, 106.4°W)',
          gravity: '9.81 m/s² (1.0g)',
          atmo: '101.3 kPa (SEA LEVEL)',
          temp: '24°C',
          subtitle: '🏜️ WHITE SANDS RECOVERY CORRIDOR · 1.0g · 101.3 kPa',
          task1: { title: 'Activate GPS Recovery Beacon', icon: '📡', desc: 'Emergency search & rescue transponder (6.5m, -3.0m)', doneLabel: 'TRANSMITTING ✓' },
          task2: { title: 'Extract Microgravity Crystals', icon: '🧪', desc: 'Kármán boundary science package (-7.0m, 8.0m)', doneLabel: 'RECOVERED ✓' },
          task3: { title: 'Secure Drogue Parachute Rig', icon: '🪂', desc: 'Main descent parachute canopy (10.0m, 6.0m)', doneLabel: 'SECURED ✓' },
          vehicle: { title: 'Board Desert Recovery Truck', icon: '🚙', desc: 'Return to White Sands Space Harbor Base', readyLabel: 'READY [E]' },
          prompt1: '📡 NEAR BEACON · PRESS [E] OR CLICK [ACTIVATE GPS BEACON]',
          prompt2: '🧪 NEAR PAYLOAD POD · PRESS [E] OR CLICK [EXTRACT CRYSTALS]',
          prompt3: '🪂 NEAR PARACHUTE · PRESS [E] OR CLICK [SECURE CHUTE LINES]',
          promptBoard: '🚙 NEAR RECOVERY TRUCK · PRESS [E] OR CLICK [BOARD TRUCK]',
          callout1: '📡 SEARCH & RESCUE GPS HOMING BEACON TRANSMITTING TO SPACEPORT!',
          callout2: '🧪 100 KM KÁRMÁN MICROGRAVITY PROTEIN CRYSTALS RECOVERED IN TACT!',
          callout3: '🪂 MAIN RECOVERY PARACHUTE CANOPY SECURED AND PACKED!',
          calloutBoard: '🚙 RECOVERY TEAM SECURED! RETURNING TO WHITE SANDS SPACE HARBOR BASE!',
        };
      case 'ORBITAL':
        return {
          suitTitle: 'SEA SURVIVAL GEAR VITALS (NOMINAL)',
          location: 'PACIFIC SPLASHDOWN (31.5°N, 121.2°W)',
          gravity: '9.81 m/s² (1.0g)',
          atmo: '101.3 kPa (PACIFIC)',
          temp: '19°C',
          subtitle: '🌊 PACIFIC OCEAN SPLASHDOWN · 1.0g · 101.3 kPa',
          task1: { title: 'Inflate Sea Flotation Collar', icon: '🛟', desc: 'Buoyant self-righting flotation ring (6.5m, -3.0m)', doneLabel: 'DEPLOYED ✓' },
          task2: { title: 'Extract Flight Data Recorder', icon: '💾', desc: 'Hardened titanium black box core (-7.0m, 8.0m)', doneLabel: 'SECURED ✓' },
          task3: { title: 'Attach Navy Winch Tether', icon: '🚁', desc: 'Helicopter rescue hoist cable (10.0m, 6.0m)', doneLabel: 'LOCKED ✓' },
          vehicle: { title: 'Board Naval Recovery Raft', icon: '🚢', desc: 'Airlift to aircraft carrier USS Hornet', readyLabel: 'READY [E]' },
          prompt1: '🛟 NEAR FLOTATION RING · PRESS [E] OR CLICK [INFLATE COLLAR]',
          prompt2: '💾 NEAR BLACK BOX · PRESS [E] OR CLICK [EXTRACT RECORDER]',
          prompt3: '🚁 NEAR WINCH CABLE · PRESS [E] OR CLICK [ATTACH HOIST TETHER]',
          promptBoard: '🚢 NEAR RECOVERY RAFT · PRESS [E] OR CLICK [BOARD RAFT]',
          callout1: '🛟 BUOYANT HIGH-VISIBILITY OCEAN COLLAR DEPLOYED & SELF-RIGHTING!',
          callout2: '💾 HARDENED TITANIUM FLIGHT RECORDER & RE-ENTRY TELEMETRY SECURED!',
          callout3: '🚁 NAVY SEAHAWK HELICOPTER RESCUE HOIST LOCKED & TENSIONED!',
          calloutBoard: '🚢 PACIFIC RECOVERY SORTIE COMPLETE! AIRLIFTING TO AIRCRAFT CARRIER USS HORNET!',
        };
      case 'MOON':
      default:
        return {
          suitTitle: 'A7L SPACESUIT VITALS (NOMINAL)',
          location: 'MARE TRANQUILLITATIS (-89.9°S, 0.0°E)',
          gravity: '1.62 m/s² (1/6g)',
          atmo: '0 Pa (HARD VACUUM)',
          temp: '-160°C',
          subtitle: '🌕 MARE TRANQUILLITATIS · 1/6g · 0 Pa VACUUM',
          task1: { title: 'Plant American Flag', icon: '🚩', desc: 'Apollo 11 flag planting site (6.5m, -3.0m)', doneLabel: 'PLANTED ✓' },
          task2: { title: 'Drill Lunar Regolith Core', icon: '⛏️', desc: 'Basalt & highland anorthosite rocks (-7.0m, 8.0m)', doneLabel: 'SECURED ✓' },
          task3: { title: 'Deploy Apollo PSE Station', icon: '📡', desc: 'Passive seismic experiment network (10.0m, 6.0m)', doneLabel: 'ONLINE ✓' },
          vehicle: { title: 'Board Lunar Module Eagle', icon: '🦅', desc: 'Launch Eagle ascent stage into lunar orbit', readyLabel: 'READY [E]' },
          prompt1: '🚩 NEAR FLAG SITE · PRESS [E] OR CLICK [PLANT AMERICAN FLAG]',
          prompt2: '⛏️ NEAR BASALT ROCKS · PRESS [E] OR CLICK [DRILL REGOLITH CORE]',
          prompt3: '📡 NEAR SEISMIC SITE · PRESS [E] OR CLICK [DEPLOY SEISMIC STATION]',
          promptBoard: '🚀 NEAR LM LADDER · PRESS [E] OR CLICK [BOARD LM & LAUNCH ASCENT]',
          callout1: '🚩 AMERICAN FLAG PROUDLY PLANTED AT TRANQUILITY BASE!',
          callout2: '⛏️ LUNAR REGOLITH CORE DRILL SAMPLE EXTRACTED & SECURED IN CONTAINER!',
          callout3: '📡 APOLLO PSE PASSIVE SEISMIC STATION ONLINE (MONITORING MOONQUAKES)!',
          calloutBoard: '🚀 ASCENT STAGE LIFTOFF! SEPARATING FROM DESCENT STAGE (FLAG & LM BASE REMAIN ON MOON)',
        };
    }
  }, [destination]);

  const [directorCallout, setDirectorCallout] = useState<string>(
    '🌍 LAUNCH COMPLEX 39A (EARTH): APOLLO 11 ON LAUNCHPAD · PRESS [SPACE] OR CLICK [🔥 T-0 IGNITE & LIFTOFF] TO LAUNCH FOR THE MOON!'
  );

  const mountRef = useRef<HTMLDivElement>(null);
  const navballCanvasRef = useRef<HTMLCanvasElement>(null);
  const synthRef = useRef<AeroAudioSynth | null>(null);
  const keysDownRef = useRef<Record<string, boolean>>({});

  // Simulation ref for 60 FPS animation loop
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
    cislunarProgress: 0, // 0 (Earth Orbit) -> 1 (Moon Encounter)
    lunarDistanceM: 384400000,
    touchdown: 'FLYING' as 'FLYING' | 'SAFE' | 'CRASHED',
    missionPhase: 'PAD_READY' as MissionPhase,
    cameraAngleX: 0,
    cameraAngleY: 0.25,
    isMouseDown: false,
    mouseLastX: 0,
    mouseLastY: 0,
    astroX: 2.2,
    astroZ: 2.2,
    astroRot: 0,
    astroBounceY: 0,
    isWalking: false,
  });

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

  // Direct Phase Jumping for Interactive Cadet Mission Navigation
  const jumpToPhase = useCallback((targetPhase: MissionPhase) => {
    if (soundEnabled) soundFx.playTelemetryChirp();
    setMissionPhase(targetPhase);
    simRef.current.missionPhase = targetPhase;

    if (targetPhase === 'PAD_READY') {
      simRef.current.altM = 0;
      simRef.current.velMs = 0;
      simRef.current.vyMs = 0;
      simRef.current.vxMs = 0;
      simRef.current.fuelPct = 100;
      simRef.current.stage = 1;
      simRef.current.throttle = 0;
      simRef.current.pitchDeg = 90;
      simRef.current.legsDeployed = false;
      simRef.current.chutesDeployed = false;
      simRef.current.boostersSeparated = false;
      simRef.current.boosterOffset = 0;
      setFlightAltM(0);
      setFlightSpeedMs(0);
      setFlightVyMs(0);
      setFlightVxMs(0);
      setFlightFuelPct(100);
      setRocketStage(1);
      setThrottle(0);
      setPitchDeg(90);
      setDirectorCallout('🌍 LAUNCH COMPLEX 39A (EARTH): APOLLO 11 ON LAUNCHPAD · PRESS [SPACE] OR CLICK [🔥 T-0 IGNITE & LIFTOFF] TO LAUNCH FOR THE MOON!');
    } else if (targetPhase === 'ASCENT') {
      simRef.current.altM = 18500;
      simRef.current.velMs = 820;
      simRef.current.vyMs = 640;
      simRef.current.vxMs = 510;
      simRef.current.fuelPct = 80;
      simRef.current.stage = 1;
      simRef.current.throttle = 100;
      simRef.current.pitchDeg = 68;
      setFlightAltM(18500);
      setFlightSpeedMs(820);
      setFlightVyMs(640);
      setFlightVxMs(510);
      setFlightFuelPct(80);
      setRocketStage(1);
      setThrottle(100);
      setPitchDeg(68);
      setDirectorCallout('🔥 STAGED LIFTOFF: MAX-Q CLEARED · PRESS [SPACE] TO JETTISON SOLID ROCKET BOOSTERS');
    } else if (targetPhase === 'ORBIT_COAST') {
      simRef.current.altM = 210000;
      simRef.current.velMs = 7750;
      simRef.current.vyMs = 0;
      simRef.current.vxMs = 7750;
      simRef.current.fuelPct = 70;
      simRef.current.stage = 2;
      simRef.current.throttle = 0;
      simRef.current.pitchDeg = 0;
      setFlightAltM(210000);
      setFlightSpeedMs(7750);
      setFlightVyMs(0);
      setFlightVxMs(7750);
      setFlightFuelPct(70);
      setRocketStage(2);
      setThrottle(0);
      setPitchDeg(0);
      setDirectorCallout('🛰️ STABLE LOW EARTH ORBIT (LEO): 210 km CIRCULAR · CLICK [EXECUTE TRANS-LUNAR INJECTION (TLI)]');
    } else if (targetPhase === 'TLI_BURN') {
      simRef.current.altM = 320000;
      simRef.current.velMs = 10400;
      simRef.current.vyMs = 1800;
      simRef.current.vxMs = 10200;
      simRef.current.fuelPct = 58;
      simRef.current.stage = 3;
      simRef.current.throttle = 100;
      simRef.current.pitchDeg = 0;
      simRef.current.cislunarProgress = 0.2;
      setFlightAltM(320000);
      setFlightSpeedMs(10400);
      setFlightVyMs(1800);
      setFlightVxMs(10200);
      setFlightFuelPct(58);
      setRocketStage(3);
      setThrottle(100);
      setPitchDeg(0);
      setDirectorCallout('🌕 TRANS-LUNAR INJECTION (TLI): S-IVB UPPER STAGE BURN (+3,050 m/s Δv) TOWARDS THE MOON');
    } else if (targetPhase === 'DEEP_CRUISE') {
      simRef.current.cislunarProgress = 0.65;
      simRef.current.lunarDistanceM = 135000000;
      simRef.current.altM = 249000000;
      simRef.current.velMs = 2100;
      simRef.current.fuelPct = 50;
      setFlightAltM(249000000);
      setFlightSpeedMs(2100);
      setFlightFuelPct(50);
      setTimeWarp(25);
      setDirectorCallout('⏩ 3D TRANSLUNAR CRUISE: COASTING THROUGH CISLUNAR SPACE TOWARD MOON GRAVITATIONAL SPHERE (SOI)');
    } else if (targetPhase === 'RETRO_DESCENT') {
      simRef.current.altM = 8500;
      simRef.current.velMs = 95;
      simRef.current.vyMs = -24;
      simRef.current.vxMs = 45;
      simRef.current.fuelPct = 40;
      simRef.current.throttle = 40;
      simRef.current.legsDeployed = true;
      setFlightAltM(8500);
      setFlightSpeedMs(95);
      setFlightVyMs(-24);
      setFlightFuelPct(40);
      setThrottle(40);
      setLandingLegsDeployed(true);
      setDirectorCallout('🌕 POWERED DESCENT INITIATION (PDI): LM DESCENT ENGINE ACTIVE · TOUCHDOWN < 3.5 m/s WITH [W][S]');
    } else if (targetPhase === 'SURFACE_LANDED') {
      simRef.current.altM = 0;
      simRef.current.velMs = 0;
      simRef.current.vyMs = 0;
      simRef.current.vxMs = 0;
      simRef.current.legsDeployed = true;
      simRef.current.touchdown = 'SAFE';
      setFlightAltM(0);
      setFlightSpeedMs(0);
      setFlightVyMs(0);
      setTouchdownStatus('SAFE');
      setLandingLegsDeployed(true);
      setDirectorCallout('🎉 NOMINAL TOUCHDOWN! "HOUSTON, TRANQUILITY BASE HERE. THE EAGLE HAS LANDED." CLICK [STEP OUT ON MOON EVA]!');
    } else if (targetPhase === 'SURFACE_EVA') {
      simRef.current.altM = 0;
      simRef.current.velMs = 0;
      simRef.current.vyMs = 0;
      simRef.current.vxMs = 0;
      simRef.current.legsDeployed = true;
      simRef.current.touchdown = 'SAFE';
      simRef.current.astroX = 2.2;
      simRef.current.astroZ = 2.2;
      simRef.current.astroRot = 0;
      simRef.current.astroBounceY = 0;
      setFlightAltM(0);
      setFlightSpeedMs(0);
      setFlightVyMs(0);
      setTouchdownStatus('SAFE');
      setLandingLegsDeployed(true);
      setAstroWalkPos({ x: 2.2, z: 2.2, rot: 0 });
      setDirectorCallout('🧑‍🚀 NEIL ARMSTRONG 3D MOONWALK: WALK WITH [W][A][S][D] / ARROWS · [E] TO PLANT FLAG, DRILL SAMPLES, DEPLOY ALSEP!');
    } else if (targetPhase === 'SURFACE_ASCENT') {
      simRef.current.altM = 15000;
      simRef.current.velMs = 1450;
      simRef.current.vyMs = 180;
      setFlightAltM(15000);
      setFlightSpeedMs(1450);
      setFlightVyMs(180);
      setDirectorCallout('🚀 LUNAR ASCENT: EAGLE UPPER STAGE LIFTOFF · RENDEZVOUS WITH COMMAND SERVICE MODULE IN LUNAR ORBIT');
    } else if (targetPhase === 'SPLASHDOWN') {
      simRef.current.altM = 0;
      simRef.current.velMs = 6.8;
      simRef.current.vyMs = 0;
      simRef.current.chutesDeployed = true;
      setFlightAltM(0);
      setFlightSpeedMs(6.8);
      setFlightVyMs(0);
      setParachutesDeployed(true);
      setDirectorCallout('🪂 PACIFIC OCEAN SPLASHDOWN: NOMINAL RECOVERY · MISSION ACCOMPLISHED! LUNAR SAMPLES SECURED');
    } else if (targetPhase === 'VAB_BUILD') {
      setDirectorCallout('🔧 VAB WORKSHOP: CONFIGURE ROCKET BOOSTERS, ENGINES & LUNAR SURFACE EXPERIMENTAL EQUIPMENT');
    }
  }, [soundEnabled]);

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
    setAstroWalkPos({ x: 2.2, z: 2.2, rot: 0 });
    setEvaTasks({ flagPlanted: false, sampleDrilled: false, seismicDeployed: false });
    evaTasksRef.current = { flagPlanted: false, sampleDrilled: false, seismicDeployed: false };
    setActiveEvaPrompt(null);
    setDirectorCallout('🌍 LAUNCH COMPLEX 39A (EARTH): APOLLO 11 ON LAUNCHPAD · PRESS [SPACE] OR CLICK [🔥 T-0 IGNITE & LIFTOFF] TO LAUNCH FOR THE MOON!');

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
      cislunarProgress: 0,
      lunarDistanceM: 384400000,
      touchdown: 'FLYING',
      missionPhase: 'PAD_READY',
      cameraAngleX: 0,
      cameraAngleY: 0.25,
      isMouseDown: false,
      mouseLastX: 0,
      mouseLastY: 0,
      astroX: 2.2,
      astroZ: 2.2,
      astroRot: 0,
      astroBounceY: 0,
      isWalking: false,
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      resetSimulation(initialDestination);
    }
  }, [isOpen, initialDestination, resetSimulation]);

  // Keyboard Shortcuts & Active Walking Controls
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      keysDownRef.current[e.key.toLowerCase()] = true;
      keysDownRef.current[e.code] = true;

      if (e.key === 'Escape') {
        onClose();
        return;
      }

      // EVA Moon Walking: [E] Interact
      if (missionPhase === 'SURFACE_EVA' && (e.key === 'e' || e.key === 'E')) {
        e.preventDefault();
        handleEvaInteract();
        return;
      }

      // Flight Throttle
      if (['ASCENT', 'ORBIT_INSERTION', 'TLI_BURN', 'RETRO_DESCENT'].includes(missionPhase)) {
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
        } else if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') {
          e.preventDefault();
          setPitchDeg((prev) => Math.min(90, prev + 3));
        } else if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') {
          e.preventDefault();
          setPitchDeg((prev) => Math.max(0, prev - 3));
        } else if (e.code === 'Space') {
          e.preventDefault();
          handleStageTrigger();
        }
      }

      // Landing Gear: [G]
      if (e.key === 'g' || e.key === 'G') {
        e.preventDefault();
        setLandingLegsDeployed((prev) => !prev);
        if (soundEnabled) soundFx.playClick(750);
      }

      // Parachutes: [P]
      if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        handleDeployChutes();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysDownRef.current[e.key.toLowerCase()] = false;
      keysDownRef.current[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isOpen, missionPhase, soundEnabled, onClose]);

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

  // EVA Interaction Trigger (Plant Flag, Drill Sample, Deploy PSE, Board LM)
  const handleEvaInteract = () => {
    const p = simRef.current;
    const distFlag = Math.hypot(p.astroX - 6.5, p.astroZ - (-3.0));
    const distDrill = Math.hypot(p.astroX - (-7.0), p.astroZ - 8.0);
    const distSeismic = Math.hypot(p.astroX - 10.0, p.astroZ - 6.0);
    const distLm = Math.hypot(p.astroX - 2.2, p.astroZ - 2.2);

    const currentTasks = evaTasksRef.current;

    if (distFlag < 3.2 && !currentTasks.flagPlanted) {
      const next = { ...currentTasks, flagPlanted: true };
      setEvaTasks(next);
      evaTasksRef.current = next;
      setDirectorCallout(taskInfo.callout1);
      confetti({ particleCount: 100, spread: 70 });
      if (soundEnabled) soundFx.playVictory();
    } else if (distDrill < 3.2 && !currentTasks.sampleDrilled) {
      const next = { ...currentTasks, sampleDrilled: true };
      setEvaTasks(next);
      evaTasksRef.current = next;
      setDirectorCallout(taskInfo.callout2);
      confetti({ particleCount: 100, spread: 70 });
      if (soundEnabled) soundFx.playReactorStart();
    } else if (distSeismic < 3.2 && !currentTasks.seismicDeployed) {
      const next = { ...currentTasks, seismicDeployed: true };
      setEvaTasks(next);
      evaTasksRef.current = next;
      setDirectorCallout(taskInfo.callout3);
      confetti({ particleCount: 100, spread: 70 });
      if (soundEnabled) soundFx.playTelemetryChirp();
    } else if (distLm < 3.5 && currentTasks.flagPlanted && currentTasks.sampleDrilled && currentTasks.seismicDeployed) {
      // Board LM and launch ascent stage
      setMissionPhase('SURFACE_ASCENT');
      simRef.current.missionPhase = 'SURFACE_ASCENT';
      setFlightAltM(100);
      setFlightVyMs(85);
      setThrottle(100);
      setDirectorCallout(taskInfo.calloutBoard);
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

    // 3. VAB ASSEMBLY HANGAR SCENE (Phase: VAB_BUILD)
    const vabHangarGroup = new THREE.Group();
    scene.add(vabHangarGroup);

    // Hangar Floor Grid
    const hangarFloorGeo = new THREE.PlaneGeometry(80, 80);
    const hangarFloorMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8, metalness: 0.3 });
    const hangarFloor = new THREE.Mesh(hangarFloorGeo, hangarFloorMat);
    hangarFloor.rotation.x = -Math.PI / 2;
    hangarFloor.position.y = 0;
    vabHangarGroup.add(hangarFloor);

    // Hangar Steel Frame Work Platforms
    for (let y = 6; y <= 24; y += 8) {
      const platGeo = new THREE.RingGeometry(2.6, 6.5, 8);
      const platMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8, side: THREE.DoubleSide });
      const plat = new THREE.Mesh(platGeo, platMat);
      plat.rotation.x = -Math.PI / 2;
      plat.position.y = y;
      vabHangarGroup.add(plat);
    }

    // 4. CAPE CANAVERAL LAUNCH PAD 39A (Phase: PAD_READY & ASCENT)
    const groundSceneGroup = new THREE.Group();
    groundSceneGroup.visible = false;
    scene.add(groundSceneGroup);

    const kscPadTex = createProceduralKSCPadTexture();
    const groundGeo = new THREE.CircleGeometry(3200, 64);
    const groundMat = new THREE.MeshStandardMaterial({ map: kscPadTex, roughness: 0.85, metalness: 0.15 });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.receiveShadow = true;
    groundSceneGroup.add(groundMesh);

    const oceanGeo = new THREE.PlaneGeometry(6000, 6000);
    const oceanMat = new THREE.MeshStandardMaterial({ color: 0x083344, roughness: 0.2, metalness: 0.8 });
    const oceanMesh = new THREE.Mesh(oceanGeo, oceanMat);
    oceanMesh.rotation.x = -Math.PI / 2;
    oceanMesh.position.set(2400, -0.2, 0);
    groundSceneGroup.add(oceanMesh);

    // Lightning Masts
    for (let p = 0; p < 4; p++) {
      const ang = (p * Math.PI) / 2 + Math.PI / 4;
      const pylonGeo = new THREE.CylinderGeometry(0.5, 1.8, 85, 12);
      const pylonMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8 });
      const pylon = new THREE.Mesh(pylonGeo, pylonMat);
      pylon.position.set(Math.cos(ang) * 58, 42.5, Math.sin(ang) * 58);
      groundSceneGroup.add(pylon);
    }

    // Launch Pad Mound
    const padGeo = new THREE.CylinderGeometry(30, 36, 6, 48);
    const padMat = new THREE.MeshStandardMaterial({ color: 0x272e3b, roughness: 0.85, metalness: 0.2 });
    const padMesh = new THREE.Mesh(padGeo, padMat);
    padMesh.position.y = 3;
    groundSceneGroup.add(padMesh);

    // Red Gantry Umbilical Tower
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
    const armPivots: THREE.Group[] = [];
    for (let armY = 16; armY <= 48; armY += 10) {
      const armPivot = new THREE.Group();
      armPivot.position.set(2.2, armY, 0);
      const armBar = new THREE.Mesh(new THREE.BoxGeometry(14, 1.2, 1.2), new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.7 }));
      armBar.position.set(7, 0, 0);
      armPivot.add(armBar);
      towerGroup.add(armPivot);
      armPivots.push(armPivot);
    }
    groundSceneGroup.add(towerGroup);

    // Launchpad Smoke Particles
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

    // 5. CELESTIAL BODIES (Earth & Moon)
    const earthRadius = 240;
    const earthGeo = new THREE.SphereGeometry(earthRadius, 64, 64);
    const earthMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.45, metalness: 0.1 });
    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    earthMesh.position.set(0, -earthRadius, 0);
    scene.add(earthMesh);

    const atmoGeo = new THREE.SphereGeometry(earthRadius * 1.035, 48, 48);
    const atmoMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.4, side: THREE.BackSide });
    const atmoMesh = new THREE.Mesh(atmoGeo, atmoMat);
    earthMesh.add(atmoMesh);

    const moonRadius = 80;
    const moonGeo = new THREE.SphereGeometry(moonRadius, 48, 48);
    const moonRegolithTex = createProceduralLunarRegolithTexture();
    const moonMat = new THREE.MeshStandardMaterial({ map: moonRegolithTex, roughness: 0.95 });
    const moonMesh = new THREE.Mesh(moonGeo, moonMat);
    moonMesh.position.set(900, 300, -1200);
    scene.add(moonMesh);

    // 6. SATURN V HEAVY MULTI-STAGE ROCKET
    const rocketMasterGroup = new THREE.Group();
    scene.add(rocketMasterGroup);

    // LES Tower
    const lesGroup = new THREE.Group();
    lesGroup.position.y = 8.5;
    const lesTower = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.4, 3.2, 8), new THREE.MeshStandardMaterial({ color: 0xf8fafc }));
    lesGroup.add(lesTower);
    const lesNose = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.8, 12), new THREE.MeshStandardMaterial({ color: 0xef4444 }));
    lesNose.position.y = 2.0;
    lesGroup.add(lesNose);
    rocketMasterGroup.add(lesGroup);

    // Command Module
    const capMesh = new THREE.Mesh(new THREE.ConeGeometry(1.05, 1.8, 32), new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.8, roughness: 0.2 }));
    capMesh.position.y = 6.8;
    rocketMasterGroup.add(capMesh);

    // Service Module
    const smMesh = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.05, 2.4, 32), new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.7, roughness: 0.25 }));
    smMesh.position.y = 4.7;
    rocketMasterGroup.add(smMesh);

    // S-IVB Third Stage
    const s4bMesh = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 3.2, 32), new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 }));
    s4bMesh.position.y = 1.9;
    rocketMasterGroup.add(s4bMesh);

    // S-IC First Stage with Roll Pattern
    const saturnRollTex = createProceduralSaturnRollTexture();
    const coreMesh = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 8.5, 32), new THREE.MeshStandardMaterial({ map: saturnRollTex, roughness: 0.45, metalness: 0.2 }));
    coreMesh.position.y = -3.95;
    rocketMasterGroup.add(coreMesh);

    // Base Fins
    for (let f = 0; f < 4; f++) {
      const fAngle = (f * Math.PI) / 2;
      const fin = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.8, 1.2), new THREE.MeshStandardMaterial({ color: 0xf8fafc }));
      fin.position.set(Math.cos(fAngle) * 1.8, -7.5, Math.sin(fAngle) * 1.8);
      fin.rotation.y = fAngle;
      coreMesh.add(fin);
    }

    // 5x F-1 Engine Bells
    const bellGeo = new THREE.ConeGeometry(0.38, 1.1, 20);
    const bellMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.95, roughness: 0.15 });
    for (let e = 0; e < 5; e++) {
      const b = new THREE.Mesh(bellGeo, bellMat);
      b.rotation.x = Math.PI;
      if (e === 0) b.position.set(0, -8.6, 0);
      else {
        const a = (e * Math.PI) / 2;
        b.position.set(Math.cos(a) * 0.75, -8.6, Math.sin(a) * 0.75);
      }
      coreMesh.add(b);
    }

    // Strap-on Solid Boosters
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

    // Glowing Engine Flame
    const flameMesh = new THREE.Mesh(new THREE.ConeGeometry(1.2, 6.0, 24), new THREE.MeshBasicMaterial({ color: 0xf97316, transparent: true, opacity: 0 }));
    flameMesh.rotation.x = Math.PI;
    flameMesh.position.y = -11.5;
    rocketMasterGroup.add(flameMesh);

    // Plasma Fireball Shell
    const plasmaMesh = new THREE.Mesh(new THREE.SphereGeometry(1.9, 24, 24), new THREE.MeshBasicMaterial({ color: 0xf97316, transparent: true, opacity: 0, blending: THREE.AdditiveBlending }));
    plasmaMesh.position.y = 5.8;
    rocketMasterGroup.add(plasmaMesh);

    // Triple Main Parachutes
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

    // 7. AUTHENTIC 3D TRANSLUNAR TRAJECTORY ORBIT PATH (Keplerian Ellipse)
    const trajectoryCurveGroup = new THREE.Group();
    trajectoryCurveGroup.visible = false;
    scene.add(trajectoryCurveGroup);

    // Curved transfer path from Earth (LEO) out to Moon orbit
    const curvePoints: THREE.Vector3[] = [];
    for (let i = 0; i <= 100; i++) {
      const t = i / 100;
      const r = 35 + (680 - 35) * Math.sin(t * Math.PI * 0.5);
      const ang = t * (Math.PI * 0.78);
      curvePoints.push(new THREE.Vector3(r * Math.cos(ang), Math.sin(t * Math.PI) * 22, -r * Math.sin(ang)));
    }
    const transferCurve = new THREE.CatmullRomCurve3(curvePoints);
    const transferGeo = new THREE.TubeGeometry(transferCurve, 100, 0.45, 8, false);
    const transferMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.75 });
    const transferTube = new THREE.Mesh(transferGeo, transferMat);
    trajectoryCurveGroup.add(transferTube);

    // Moon Orbit Reference Ring
    const moonOrbitRingGeo = new THREE.RingGeometry(678, 682, 96);
    const moonOrbitRingMat = new THREE.MeshBasicMaterial({ color: 0x64748b, side: THREE.DoubleSide, transparent: true, opacity: 0.35 });
    const moonOrbitRing = new THREE.Mesh(moonOrbitRingGeo, moonOrbitRingMat);
    moonOrbitRing.rotation.x = -Math.PI / 2;
    trajectoryCurveGroup.add(moonOrbitRing);

    // Maneuver Icons along trajectory
    const tliNode = new THREE.Mesh(new THREE.SphereGeometry(1.6, 16, 16), new THREE.MeshBasicMaterial({ color: 0xf59e0b }));
    tliNode.position.copy(curvePoints[0]);
    trajectoryCurveGroup.add(tliNode);

    const moonEncounterNode = new THREE.Mesh(new THREE.SphereGeometry(2.0, 16, 16), new THREE.MeshBasicMaterial({ color: 0xa855f7 }));
    moonEncounterNode.position.copy(curvePoints[100]);
    trajectoryCurveGroup.add(moonEncounterNode);

    // 8. APOLLO LUNAR MODULE (LM - EAGLE)
    const apolloLmGroup = new THREE.Group();
    apolloLmGroup.visible = false;
    scene.add(apolloLmGroup);

    // Procedural Fallback Placeholder LM Parts (grouped together so they can be hidden cleanly when 3D GLTF loads)
    const proceduralLmGroup = new THREE.Group();
    apolloLmGroup.add(proceduralLmGroup);

    const dStage = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.7, 1.6, 8), new THREE.MeshStandardMaterial({ color: 0xca8a04, metalness: 0.95, roughness: 0.15 }));
    dStage.position.y = 0.8;
    proceduralLmGroup.add(dStage);

    const dpsBell = new THREE.Mesh(new THREE.ConeGeometry(0.85, 1.5, 24, 1, true), new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.95, roughness: 0.2, side: THREE.DoubleSide }));
    dpsBell.rotation.x = Math.PI;
    dpsBell.position.y = -0.55;
    proceduralLmGroup.add(dpsBell);

    // 4 Landing Struts & Footpads
    for (let leg = 0; leg < 4; leg++) {
      const lAngle = (leg * Math.PI) / 2 + Math.PI / 4;
      const cosA = Math.cos(lAngle);
      const sinA = Math.sin(lAngle);

      const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 4.2, 8), new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.9 }));
      strut.position.set(cosA * 3.3, 0.1, sinA * 3.3);
      strut.rotation.z = -cosA * 0.65;
      strut.rotation.x = sinA * 0.65;
      proceduralLmGroup.add(strut);

      const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.1, 16), new THREE.MeshStandardMaterial({ color: 0xca8a04, metalness: 0.9 }));
      pad.position.set(cosA * 4.6, -1.15, sinA * 4.6);
      proceduralLmGroup.add(pad);
    }

    const ascentGroup = new THREE.Group();
    ascentGroup.position.y = 2.1;
    const cabin = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.8, 1.7, 16), new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.85, roughness: 0.3 }));
    ascentGroup.add(cabin);
    proceduralLmGroup.add(ascentGroup);

    // Load authentic Apollo Lunar Module GLTF overlay
    const gltfLoader = getSharedGLTFLoader();
    gltfLoader.load(
      '/models/Apollo_Lunar_Module.glb',
      (gltf) => {
        const model = gltf.scene;
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const scale = 5.2 / Math.max(size.x, size.y, size.z);
        model.scale.setScalar(scale);
        box.setFromObject(model);
        model.position.y = -box.min.y - 1.15;
        // Completely hide the procedural placeholders once the authentic NASA GLTF model loads!
        proceduralLmGroup.visible = false;
        apolloLmGroup.add(model);
      },
      undefined,
      () => {}
    );

    // 9. DEDICATED PLANETARY / SURFACE SCENE & DIVERSE OBSTACLE COURSES
    const lunarSurfaceScene = new THREE.Group();
    lunarSurfaceScene.visible = false;
    scene.add(lunarSurfaceScene);

    // Apply destination-specific sky & fog
    if (destination === 'MARS') {
      scene.background = new THREE.Color(0x9a3412);
      scene.fog = new THREE.FogExp2(0x7c2d12, 0.0035);
    } else if (destination === 'SUBORBITAL') {
      scene.background = new THREE.Color(0x38bdf8);
      scene.fog = new THREE.FogExp2(0xfef3c7, 0.002);
    } else if (destination === 'ORBITAL') {
      scene.background = new THREE.Color(0x0284c7);
      scene.fog = new THREE.FogExp2(0x38bdf8, 0.002);
    } else {
      scene.background = new THREE.Color(0x000000);
      scene.fog = null;
    }

    // Ground Plane with Destination-Specific Procedural Texture
    let surfaceGroundMat: THREE.MeshStandardMaterial;
    if (destination === 'MARS') {
      surfaceGroundMat = new THREE.MeshStandardMaterial({ map: createProceduralMarsRedPlanetTexture(), roughness: 0.94, metalness: 0.05 });
    } else if (destination === 'SUBORBITAL') {
      surfaceGroundMat = new THREE.MeshStandardMaterial({ map: createProceduralDesertSandTexture(), roughness: 0.88, metalness: 0.02 });
    } else if (destination === 'ORBITAL') {
      surfaceGroundMat = new THREE.MeshStandardMaterial({ map: createProceduralOceanWaterTexture(), roughness: 0.25, metalness: 0.6 });
    } else {
      surfaceGroundMat = new THREE.MeshStandardMaterial({ map: createProceduralLunarRegolithTexture(), roughness: 0.95 });
    }
    const surfaceGroundMesh = new THREE.Mesh(new THREE.PlaneGeometry(1200, 1200, 48, 48), surfaceGroundMat);
    surfaceGroundMesh.rotation.x = -Math.PI / 2;
    surfaceGroundMesh.position.y = -1.2;
    surfaceGroundMesh.receiveShadow = true;
    lunarSurfaceScene.add(surfaceGroundMesh);

    // Active Obstacle Registry & Animated Objects
    const activeObstacles: Array<{ x: number; z: number; radius: number; name: string; type: string }> = [];
    const dynamicAnimatedObstacles: Array<{ update: (dt: number, time: number) => void }> = [];

    if (destination === 'MARS') {
      // 1. ACTIVE SWIRLING DUST DEVILS
      for (const ddPos of [{ x: -14, z: 12 }, { x: 16, z: -12 }]) {
        const ddGroup = new THREE.Group();
        ddGroup.position.set(ddPos.x, -1.2, ddPos.z);
        for (let lvl = 0; lvl < 6; lvl++) {
          const rLvl = 0.9 + lvl * 0.45;
          const rGeo = new THREE.RingGeometry(rLvl - 0.2, rLvl, 16);
          const rMat = new THREE.MeshBasicMaterial({ color: 0xea580c, transparent: true, opacity: 0.5 - lvl * 0.06, side: THREE.DoubleSide });
          const rMesh = new THREE.Mesh(rGeo, rMat);
          rMesh.rotation.x = -Math.PI / 2;
          rMesh.position.y = lvl * 1.1 + 0.1;
          ddGroup.add(rMesh);
        }
        lunarSurfaceScene.add(ddGroup);
        activeObstacles.push({ x: ddPos.x, z: ddPos.z, radius: 3.4, name: 'Active Mars Dust Devil (Wind Shear)', type: 'dust_devil' });
        dynamicAnimatedObstacles.push({
          update: (dt, time) => {
            ddGroup.rotation.y += dt * 4.5;
            ddGroup.position.x = ddPos.x + Math.sin(time * 0.001) * 3.0;
            ddGroup.position.z = ddPos.z + Math.cos(time * 0.001) * 3.0;
          }
        });
      }

      // 2. BASALT SAND RIDGES / TRANSVERSE AEOLIAN RIDGES (TARs)
      for (const d of [{ x: 12, z: 14, r: 4.2 }, { x: -16, z: -10, r: 4.5 }, { x: 8, z: -16, r: 3.8 }]) {
        const duneMesh = new THREE.Mesh(
          new THREE.ConeGeometry(d.r, 2.2, 16),
          new THREE.MeshStandardMaterial({ color: 0x7c2d12, roughness: 0.95 })
        );
        duneMesh.position.set(d.x, -0.1, d.z);
        duneMesh.scale.set(1.4, 0.4, 2.4);
        duneMesh.rotation.y = 0.6;
        lunarSurfaceScene.add(duneMesh);
        activeObstacles.push({ x: d.x, z: d.z, radius: d.r * 0.8, name: 'Martian Basalt Sand Ridge (TAR)', type: 'dune' });
      }

      // 3. JAGGED VOLCANIC LAVA ROCKS & HEMATITE SPIRES
      for (const lp of [{ x: -9, z: 6, s: 1.8 }, { x: 18, z: 6, s: 2.2 }, { x: -8, z: -14, s: 1.6 }, { x: 14, z: -4, s: 1.5 }, { x: -14, z: 4, s: 2.0 }]) {
        const spireMesh = new THREE.Mesh(
          new THREE.CylinderGeometry(0.2, lp.s, lp.s * 2.8, 7),
          new THREE.MeshStandardMaterial({ color: 0x450a0a, roughness: 0.92, metalness: 0.3 })
        );
        spireMesh.position.set(lp.x, lp.s * 1.4 - 1.2, lp.z);
        lunarSurfaceScene.add(spireMesh);
        activeObstacles.push({ x: lp.x, z: lp.z, radius: lp.s + 0.5, name: 'Volcanic Basalt Lava Spire', type: 'lava' });
      }

      // 4. SUBSURFACE CRYOGENIC PERMAFROST FISSURES
      for (const fPos of [{ x: 4, z: 12 }, { x: -12, z: -4 }]) {
        const fissureMesh = new THREE.Mesh(
          new THREE.BoxGeometry(7, 0.1, 1.2),
          new THREE.MeshStandardMaterial({ color: 0x262626, roughness: 0.9 })
        );
        fissureMesh.position.set(fPos.x, -1.18, fPos.z);
        fissureMesh.rotation.y = 0.45;
        lunarSurfaceScene.add(fissureMesh);
        activeObstacles.push({ x: fPos.x, z: fPos.z, radius: 2.4, name: 'Cryogenic Permafrost Fissure', type: 'crevasse' });
      }

    } else if (destination === 'SUBORBITAL') {
      // 1. SANDSTONE CANYON MESAS & HOODOOS
      for (const mp of [{ x: -14, z: -8, w: 5, h: 6 }, { x: 15, z: -14, w: 6, h: 7 }, { x: -18, z: 16, w: 4.5, h: 5 }, { x: 20, z: 12, w: 5.5, h: 6 }]) {
        const mesa = new THREE.Mesh(
          new THREE.CylinderGeometry(mp.w * 0.8, mp.w, mp.h, 8),
          new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.9 })
        );
        mesa.position.set(mp.x, mp.h / 2 - 1.2, mp.z);
        lunarSurfaceScene.add(mesa);
        activeObstacles.push({ x: mp.x, z: mp.z, radius: mp.w * 0.9, name: 'Sandstone Canyon Mesa', type: 'mesa' });
      }

      // 2. CHARRED BOOSTER CRASH DEBRIS
      for (const bp of [{ x: 8, z: 14 }, { x: -10, z: -18 }]) {
        const debrisGroup = new THREE.Group();
        debrisGroup.position.set(bp.x, -1.2, bp.z);
        const casing = new THREE.Mesh(
          new THREE.CylinderGeometry(1.4, 1.4, 4.5, 12),
          new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7, metalness: 0.5 })
        );
        casing.rotation.z = Math.PI / 2.3;
        casing.position.y = 0.7;
        debrisGroup.add(casing);
        lunarSurfaceScene.add(debrisGroup);
        activeObstacles.push({ x: bp.x, z: bp.z, radius: 3.2, name: 'Spent Booster Impact Debris', type: 'debris' });
      }

      // 3. DESERT SAND DUNES
      for (const dp of [{ x: -6, z: -10, r: 3.8 }, { x: 14, z: 6, r: 4.0 }, { x: -16, z: -4, r: 3.5 }]) {
        const dune = new THREE.Mesh(
          new THREE.ConeGeometry(dp.r, 1.8, 14),
          new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.92 })
        );
        dune.position.set(dp.x, -0.3, dp.z);
        dune.scale.set(1.5, 0.4, 2.2);
        lunarSurfaceScene.add(dune);
        activeObstacles.push({ x: dp.x, z: dp.z, radius: dp.r * 0.8, name: 'Desert Salt Ridge Dune', type: 'dune' });
      }

      // 4. TELEMETRY RADAR ANTENNA TOWERS
      for (const tp of [{ x: 18, z: 18 }, { x: -14, z: 12 }]) {
        const towerGroup = new THREE.Group();
        towerGroup.position.set(tp.x, -1.2, tp.z);
        const truss = new THREE.Mesh(
          new THREE.CylinderGeometry(0.3, 0.9, 6.0, 4),
          new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8 })
        );
        truss.position.y = 3.0;
        towerGroup.add(truss);
        const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
        beacon.position.y = 6.1;
        towerGroup.add(beacon);
        lunarSurfaceScene.add(towerGroup);
        activeObstacles.push({ x: tp.x, z: tp.z, radius: 2.2, name: 'Telemetry Tower & Warning Pylon', type: 'tower' });
      }

    } else if (destination === 'ORBITAL') {
      // 1. VOLCANIC SEA STACKS & JAGGED REEFS
      for (const sp of [{ x: -14, z: -10, w: 3.5, h: 5.5 }, { x: 16, z: -12, w: 4.0, h: 6.0 }, { x: -16, z: 14, w: 3.2, h: 4.8 }, { x: 20, z: 8, w: 3.8, h: 5.2 }]) {
        const stack = new THREE.Mesh(
          new THREE.ConeGeometry(sp.w, sp.h, 7),
          new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.95, metalness: 0.2 })
        );
        stack.position.set(sp.x, sp.h / 2 - 1.2, sp.z);
        lunarSurfaceScene.add(stack);
        activeObstacles.push({ x: sp.x, z: sp.z, radius: sp.w + 0.5, name: 'Volcanic Sea Stack & Basalt Reef', type: 'reef' });
      }

      // 2. FLOATING HEAT SHIELD DEBRIS
      for (const fp of [{ x: 10, z: 12 }, { x: -8, z: -16 }]) {
        const debrisMesh = new THREE.Mesh(
          new THREE.BoxGeometry(3.5, 0.4, 2.2),
          new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.7, metalness: 0.4 })
        );
        debrisMesh.position.set(fp.x, -1.0, fp.z);
        debrisMesh.rotation.y = 0.8;
        lunarSurfaceScene.add(debrisMesh);
        activeObstacles.push({ x: fp.x, z: fp.z, radius: 2.6, name: 'Floating Heat Shield Tile Fragment', type: 'debris' });
      }

      // 3. FLASHING MARINE SONAR PING BUOYS
      for (const bp of [{ x: 6, z: -8 }, { x: -12, z: 6 }, { x: 14, z: -4 }]) {
        const buoyGroup = new THREE.Group();
        buoyGroup.position.set(bp.x, -1.2, bp.z);
        const buoyBody = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 1.8, 12), new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.4 }));
        buoyBody.position.y = 0.9;
        const strobe = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 8), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
        strobe.position.y = 2.0;
        buoyGroup.add(buoyBody, strobe);
        lunarSurfaceScene.add(buoyGroup);
        activeObstacles.push({ x: bp.x, z: bp.z, radius: 2.0, name: 'High-Visibility Sonar Ping Buoy', type: 'buoy' });
      }

    } else {
      // 1. DEEP LUNAR IMPACT CRATERS
      for (const cp of [{ x: -15, z: -12, r: 4.8 }, { x: 18, z: -10, r: 5.2 }, { x: -14, z: 16, r: 4.5 }, { x: 20, z: 14, r: 5.0 }]) {
        const craterRim = new THREE.Mesh(
          new THREE.TorusGeometry(cp.r, 0.7, 8, 24),
          new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.95 })
        );
        craterRim.rotation.x = -Math.PI / 2;
        craterRim.position.set(cp.x, -1.15, cp.z);
        lunarSurfaceScene.add(craterRim);
        activeObstacles.push({ x: cp.x, z: cp.z, radius: cp.r, name: 'Deep Lunar Impact Crater', type: 'crater' });
      }

      // 2. SHARP BASALT BOULDERS
      for (const mr of [{ x: 8, z: -12, s: 1.8 }, { x: -10, z: -6, s: 2.2 }, { x: 12, z: 10, s: 1.6 }, { x: -8, z: 14, s: 1.9 }, { x: 16, z: 4, s: 1.7 }, { x: -18, z: 4, s: 2.0 }]) {
        const boulder = new THREE.Mesh(
          new THREE.DodecahedronGeometry(mr.s),
          new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.9 })
        );
        boulder.position.set(mr.x, mr.s * 0.8 - 1.2, mr.z);
        lunarSurfaceScene.add(boulder);
        activeObstacles.push({ x: mr.x, z: mr.z, radius: mr.s + 0.6, name: 'Basalt Highland Boulder', type: 'boulder' });
      }

      // 3. ELECTROSTATIC DUST PLUMES
      for (const ep of [{ x: 14, z: -16 }, { x: -16, z: -14 }, { x: 6, z: 18 }]) {
        const dustCol = new THREE.Mesh(
          new THREE.CylinderGeometry(0.8, 1.4, 3.5, 12),
          new THREE.MeshBasicMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.35, wireframe: true })
        );
        dustCol.position.set(ep.x, 0.6, ep.z);
        lunarSurfaceScene.add(dustCol);
        activeObstacles.push({ x: ep.x, z: ep.z, radius: 2.2, name: 'Electrostatic Dust Plume', type: 'dust' });
      }

      // 4. SHADOWED COLD-TRAP ICE CREVASSES
      for (const ip of [{ x: -6, z: 12 }, { x: 10, z: -6 }]) {
        const fissure = new THREE.Mesh(
          new THREE.BoxGeometry(6.5, 0.1, 1.4),
          new THREE.MeshBasicMaterial({ color: 0x0284c7, transparent: true, opacity: 0.7 })
        );
        fissure.position.set(ip.x, -1.18, ip.z);
        lunarSurfaceScene.add(fissure);
        activeObstacles.push({ x: ip.x, z: ip.z, radius: 2.5, name: 'Shadowed Cold-Trap Ice Crevasse', type: 'crevasse' });
      }
    }

    // WAYPOINT 1: American Flag Site / MOXIE / GPS Beacon / Sea Collar (6.5, -3.0)
    const flagGroup = new THREE.Group();
    flagGroup.position.set(6.5, -1.2, -3.0);
    if (destination === 'MOON') {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.6, 8), new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.9 }));
      pole.position.y = 1.3;
      flagGroup.add(pole);
      const flagCanvas = document.createElement('canvas');
      flagCanvas.width = 256;
      flagCanvas.height = 160;
      const fctx = flagCanvas.getContext('2d')!;
      fctx.fillStyle = '#b91c1c';
      fctx.fillRect(0, 0, 256, 160);
      fctx.fillStyle = '#ffffff';
      for (let s = 1; s < 7; s += 2) fctx.fillRect(0, (s * 160) / 7, 256, 160 / 14);
      fctx.fillStyle = '#1e3a8a';
      fctx.fillRect(0, 0, 100, 80);
      const flagMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.8), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(flagCanvas), side: THREE.DoubleSide }));
      flagMesh.position.set(0.65, 2.1, 0);
      flagGroup.add(flagMesh);
    } else if (destination === 'MARS') {
      const moxieBox = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.2, 1.1), new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.85, roughness: 0.2 }));
      moxieBox.position.y = 0.6;
      const intakePipe = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.8, 12), new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.9 }));
      intakePipe.position.set(0, 1.3, 0);
      flagGroup.add(moxieBox, intakePipe);
    } else if (destination === 'SUBORBITAL') {
      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 2.5, 8), new THREE.MeshStandardMaterial({ color: 0x22c55e, metalness: 0.8 }));
      mast.position.y = 1.25;
      const beaconHead = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 8), new THREE.MeshBasicMaterial({ color: 0x22c55e }));
      beaconHead.position.y = 2.6;
      flagGroup.add(mast, beaconHead);
    } else {
      const collar = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.35, 12, 24), new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.3 }));
      collar.rotation.x = -Math.PI / 2;
      collar.position.y = 0.4;
      flagGroup.add(collar);
    }
    lunarSurfaceScene.add(flagGroup);

    // Glowing Waypoint Ring for Flag / WP1
    const flagRing = new THREE.Mesh(new THREE.RingGeometry(1.5, 1.8, 32), new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide }));
    flagRing.rotation.x = -Math.PI / 2;
    flagRing.position.set(6.5, -1.18, -3.0);
    lunarSurfaceScene.add(flagRing);

    // WAYPOINT 2: Lunar Core Drill Rocks Site / Delta Clay / Crystal Pod / Black Box (-7.0, 8.0)
    const drillRocksGroup = new THREE.Group();
    drillRocksGroup.position.set(-7.0, -1.2, 8.0);
    if (destination === 'MARS') {
      for (let dr = 0; dr < 4; dr++) {
        const dRock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.7 + dr * 0.2), new THREE.MeshStandardMaterial({ color: 0x7f1d1d, roughness: 0.95 }));
        dRock.position.set((dr % 2) * 1.2 - 0.6, 0.4, Math.floor(dr / 2) * 1.2 - 0.6);
        drillRocksGroup.add(dRock);
      }
    } else if (destination === 'SUBORBITAL') {
      const pod = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 1.4, 12), new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.8 }));
      pod.position.y = 0.7;
      drillRocksGroup.add(pod);
    } else if (destination === 'ORBITAL') {
      const fdr = new THREE.Mesh(new THREE.SphereGeometry(0.6, 12, 12), new THREE.MeshStandardMaterial({ color: 0xf97316, metalness: 0.7 }));
      fdr.position.y = 0.6;
      drillRocksGroup.add(fdr);
    } else {
      for (let dr = 0; dr < 4; dr++) {
        const dRock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.7 + dr * 0.2), new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.95 }));
        dRock.position.set((dr % 2) * 1.2 - 0.6, 0.4, Math.floor(dr / 2) * 1.2 - 0.6);
        drillRocksGroup.add(dRock);
      }
    }
    const drillRing = new THREE.Mesh(new THREE.RingGeometry(1.6, 1.9, 32), new THREE.MeshBasicMaterial({ color: 0x22c55e, side: THREE.DoubleSide }));
    drillRing.rotation.x = -Math.PI / 2;
    drillRing.position.y = 0.02;
    drillRocksGroup.add(drillRing);
    lunarSurfaceScene.add(drillRocksGroup);

    // WAYPOINT 3: Apollo Passive Seismic Experiment / Ingenuity Copter / Parachute / Winch (10.0, 6.0)
    const pseStationGroup = new THREE.Group();
    pseStationGroup.position.set(10.0, -1.2, 6.0);
    if (destination === 'MARS') {
      const copterBody = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.4), new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9 }));
      copterBody.position.y = 0.5;
      const rotor = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.04, 0.15), new THREE.MeshBasicMaterial({ color: 0x0f172a }));
      rotor.position.y = 0.85;
      pseStationGroup.add(copterBody, rotor);
    } else if (destination === 'SUBORBITAL') {
      const chute = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.1, 0.6, 12), new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.5 }));
      chute.position.y = 0.3;
      pseStationGroup.add(chute);
    } else if (destination === 'ORBITAL') {
      const hook = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.15, 8, 16), new THREE.MeshStandardMaterial({ color: 0xeab308, metalness: 0.9 }));
      hook.position.y = 0.7;
      pseStationGroup.add(hook);
    } else {
      const pseCentral = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.8, 0.7, 16), new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9 }));
      pseCentral.position.y = 0.35;
      pseStationGroup.add(pseCentral);
      for (let s = -1; s <= 1; s += 2) {
        const pseWing = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.04, 0.8), new THREE.MeshStandardMaterial({ color: 0x1e3a8a, metalness: 0.9 }));
        pseWing.position.set(s * 1.1, 0.35, 0);
        pseStationGroup.add(pseWing);
      }
    }
    const pseRing = new THREE.Mesh(new THREE.RingGeometry(1.5, 1.8, 32), new THREE.MeshBasicMaterial({ color: 0xa855f7, side: THREE.DoubleSide }));
    pseRing.rotation.x = -Math.PI / 2;
    pseRing.position.y = 0.02;
    pseStationGroup.add(pseRing);
    lunarSurfaceScene.add(pseStationGroup);

    // 10. ACTIVE WALKABLE ASTRONAUT (NEIL ARMSTRONG)
    const astronautGroup = new THREE.Group();
    astronautGroup.position.set(2.2, -1.2, 2.2);
    lunarSurfaceScene.add(astronautGroup);

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
        const scale = 1.9 / Math.max(size.x, size.y, size.z);
        astroModel.scale.setScalar(scale);
        box.setFromObject(astroModel);
        astroModel.position.set(0, -box.min.y, 0);
        suitTorso.visible = false;
        helmet.visible = false;
        plssBackpack.visible = false;
        astronautGroup.add(astroModel);
      },
      undefined,
      () => {}
    );

    // MOUSE DRAG ORBIT CAMERA CONTROLLER
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
    let walkStepTimer = 0;

    const animate = (time: number) => {
      animId = requestAnimationFrame(animate);
      const rawDt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      const p = simRef.current;
      const dt = rawDt * p.timeWarp;

      starPoints.rotation.y += 0.0001;

      // Rotate Earth & Moon
      earthMesh.rotation.y += 0.0003;
      moonMesh.position.x = 680 * Math.cos(p.orbitTheta * 0.2 + 0.5);
      moonMesh.position.z = -680 * Math.sin(p.orbitTheta * 0.2 + 0.5);

      // Animate active obstacles (e.g. Swirling Mars Dust Devils)
      dynamicAnimatedObstacles.forEach((obs) => obs.update(dt, time));

      // ─── ACTIVE SURFACE WALKING CONTROLS & OBSTACLE COLLISION ───
      if (p.missionPhase === 'SURFACE_EVA') {
        const keys = keysDownRef.current;
        let moveX = 0;
        let moveZ = 0;
        if (keys['w'] || keys['arrowup']) moveZ -= 1;
        if (keys['s'] || keys['arrowdown']) moveZ += 1;
        if (keys['a'] || keys['arrowleft']) moveX -= 1;
        if (keys['d'] || keys['arrowright']) moveX += 1;

        if (moveX !== 0 || moveZ !== 0) {
          const len = Math.hypot(moveX, moveZ);
          const normX = moveX / len;
          const normZ = moveZ / len;
          const walkSpeed = (destination === 'ORBITAL' ? 2.8 : destination === 'MARS' ? 3.4 : 3.6) * dt;
          const testX = p.astroX + normX * walkSpeed;
          const testZ = p.astroZ + normZ * walkSpeed;

          // Check collisions with active surface obstacles!
          let collidedObs: typeof activeObstacles[0] | null = null;
          for (const obs of activeObstacles) {
            const dist = Math.hypot(testX - obs.x, testZ - obs.z);
            if (dist < obs.radius + 0.6) {
              collidedObs = obs;
              break;
            }
          }

          if (!collidedObs) {
            p.astroX = testX;
            p.astroZ = testZ;
            setObstacleAlert(null);
          } else {
            // Collision physically blocks movement and displays alert
            setObstacleAlert(`⚠️ OBSTACLE: ${collidedObs.name.toUpperCase()} · NAVIGATE AROUND WITH [A]/[D]`);
          }

          p.astroRot = Math.atan2(normX, normZ);
          walkStepTimer += dt * 7;
          const bounceHeight = destination === 'MOON' ? 0.16 : destination === 'MARS' ? 0.11 : 0.06;
          p.astroBounceY = Math.abs(Math.sin(walkStepTimer)) * bounceHeight;
          p.isWalking = true;
        } else {
          p.astroBounceY = 0;
          p.isWalking = false;
        }

        astronautGroup.position.set(p.astroX, -1.2 + p.astroBounceY, p.astroZ);
        astronautGroup.rotation.y = p.astroRot;

        // Check proximity to mission waypoints
        const dFlag = Math.hypot(p.astroX - 6.5, p.astroZ - (-3.0));
        const dDrill = Math.hypot(p.astroX - (-7.0), p.astroZ - 8.0);
        const dSeismic = Math.hypot(p.astroX - 10.0, p.astroZ - 6.0);
        const dLm = Math.hypot(p.astroX - 2.2, p.astroZ - 2.2);

        const currentTasks = evaTasksRef.current;
        if (dFlag < 3.0 && !currentTasks.flagPlanted) {
          setActiveEvaPrompt(taskInfo.prompt1);
        } else if (dDrill < 3.0 && !currentTasks.sampleDrilled) {
          setActiveEvaPrompt(taskInfo.prompt2);
        } else if (dSeismic < 3.0 && !currentTasks.seismicDeployed) {
          setActiveEvaPrompt(taskInfo.prompt3);
        } else if (dLm < 3.2 && currentTasks.flagPlanted && currentTasks.sampleDrilled && currentTasks.seismicDeployed) {
          setActiveEvaPrompt(taskInfo.promptBoard);
        } else {
          setActiveEvaPrompt(null);
        }

        setAstroWalkPos({ x: p.astroX, z: p.astroZ, rot: p.astroRot });
      }

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

        const density = Math.exp(-p.altM / 8500);
        const dragN = 0.5 * density * 1.225 * (p.velMs ** 2) * 0.28 * 6.0;
        const aDrag = (dragN / 1000) / massTons;

        const ay = aThrust * Math.sin(pitchRad) - (aDrag * (p.vyMs / Math.max(1, p.velMs))) - g;
        const ax = aThrust * Math.cos(pitchRad) - (aDrag * (p.vxMs / Math.max(1, p.velMs)));

        p.vyMs += ay * dt;
        p.vxMs += ax * dt;
        p.velMs = Math.sqrt(p.vyMs ** 2 + p.vxMs ** 2);
        p.altM = Math.max(0, p.altM + p.vyMs * dt);

        armPivots.forEach((arm) => {
          arm.rotation.y = THREE.MathUtils.lerp(arm.rotation.y, -Math.PI / 3, dt * 1.5);
        });

        if (p.altM < 400) {
          smokeMat.opacity = Math.max(0, 0.7 - p.altM / 500);
        } else {
          smokeMat.opacity = 0;
        }

        if (p.boostersSeparated) {
          p.boosterOffset += dt * 5;
          bLeft.position.x = -2.25 - p.boosterOffset;
          bRight.position.x = 2.25 + p.boosterOffset;
          bLeft.position.y -= dt * 4;
          bRight.position.y -= dt * 4;
        }

        if (p.velMs >= 7750 && p.altM >= 180000 && p.missionPhase === 'ASCENT') {
          p.missionPhase = 'ORBIT_COAST';
          setMissionPhase('ORBIT_COAST');
          setDirectorCallout('🌍 STABLE 200x200 km LOW EARTH ORBIT (LEO) ACHIEVED! READY FOR TRANS-LUNAR INJECTION (TLI)');
          confetti({ particleCount: 120, spread: 80 });
          if (soundEnabled) soundFx.playVictory();
        }
      }
      else if (p.missionPhase === 'TLI_BURN') {
        if (p.fuelPct > 0 && throttleNorm > 0) {
          p.fuelPct = Math.max(0, p.fuelPct - throttleNorm * 0.15 * dt);
          p.velMs += 22.0 * throttleNorm * dt;
        }
        if (p.velMs >= 10800) {
          p.missionPhase = 'DEEP_CRUISE';
          setMissionPhase('DEEP_CRUISE');
          setDirectorCallout('🌕 TLI BURN COMPLETE! ENGAGE [TIME WARP 100x] TO FLY ALONG 3D TRANSLUNAR TRAJECTORY');
          confetti({ particleCount: 150, spread: 90 });
          if (soundEnabled) soundFx.playVictory();
        }
      }
      else if (p.missionPhase === 'DEEP_CRUISE') {
        // Spacecraft flies smoothly along the 3D Keplerian translunar transfer curve!
        p.cislunarProgress = Math.min(1.0, p.cislunarProgress + dt * 0.035);
        p.lunarDistanceM = Math.max(80000, 384400000 * (1.0 - p.cislunarProgress));

        const pt = transferCurve.getPoint(p.cislunarProgress);
        rocketMasterGroup.position.copy(pt);

        if (p.cislunarProgress >= 1.0) {
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
        p.vyMs += (14.0 - 1.62) * dt;
        p.altM += p.vyMs * dt;
        p.velMs = p.vyMs;
        if (p.altM >= 60000) {
          p.missionPhase = 'TEI_RETURN';
          setMissionPhase('TEI_RETURN');
          setDirectorCallout('🌍 TRANS-EARTH INJECTION (TEI) FIRED! RETURNING HOME ALONG RETURN TRAJECTORY AT 11.2 KM/S');
          if (soundEnabled) soundFx.playVictory();
        }
      }
      else if (p.missionPhase === 'REENTRY_PLASMA' || p.missionPhase === 'PARACHUTE_DESCENT') {
        const terminalVel = p.chutesDeployed ? -6.5 : -140;
        p.vyMs += (terminalVel - p.vyMs) * dt * 0.7;
        p.altM = Math.max(0, p.altM + p.vyMs * dt * 4);
        p.velMs = Math.abs(p.vyMs);

        if (p.missionPhase === 'REENTRY_PLASMA') {
          plasmaMesh.material.opacity = Math.min(0.9, 0.4 + Math.random() * 0.5);
        } else {
          plasmaMesh.material.opacity = 0;
        }

        if (p.altM <= 0) {
          p.altM = 0;
          p.missionPhase = 'SPLASHDOWN';
          setMissionPhase('SPLASHDOWN');
          setDirectorCallout('🏆 PACIFIC OCEAN SPLASHDOWN NOMINAL! USS HORNET RETRIEVAL COMPLETE · MISSION ACCOMPLISHED');
          confetti({ particleCount: 220, spread: 100 });
          if (soundEnabled) soundFx.playVictory();
          awardCadetCredits(1500);
          onMissionCompleted?.(destination, 1500);
        }
      }

      // ─── 3D MESH VISUALS & STAGE VISIBILITY ───
      const visualPitch = (p.pitchDeg * Math.PI) / 180;
      rocketMasterGroup.rotation.z = -visualPitch + Math.PI / 2;

      const isFiring = p.fuelPct > 0 && throttleNorm > 0 && !['VAB_BUILD', 'PAD_READY', 'SURFACE_LANDED', 'SURFACE_EVA', 'SPLASHDOWN'].includes(p.missionPhase);
      flameMesh.material.opacity = isFiring ? 0.95 : 0;
      flameMesh.scale.set(throttleNorm, throttleNorm * (1.2 + Math.random() * 0.4), throttleNorm);
      exhaustPointLight.intensity = isFiring ? 4.0 * throttleNorm : 0;

      chuteGroup.visible = p.chutesDeployed;

      // Group Visibilities
      vabHangarGroup.visible = p.missionPhase === 'VAB_BUILD';
      groundSceneGroup.visible = ['PAD_READY', 'ASCENT'].includes(p.missionPhase) && p.altM < 45000;
      trajectoryCurveGroup.visible = ['TLI_BURN', 'DEEP_CRUISE', 'TEI_RETURN'].includes(p.missionPhase);

      const isLunarSurfaceMode = ['LUNAR_CAPTURE', 'RETRO_DESCENT', 'SURFACE_LANDED', 'SURFACE_EVA', 'SURFACE_ASCENT'].includes(p.missionPhase);
      rocketMasterGroup.visible = !isLunarSurfaceMode && p.missionPhase !== 'VAB_BUILD';
      apolloLmGroup.visible = isLunarSurfaceMode;
      lunarSurfaceScene.visible = isLunarSurfaceMode;
      astronautGroup.visible = p.missionPhase === 'SURFACE_EVA';
      (flagRing.material as THREE.MeshBasicMaterial).color.setHex(evaTasksRef.current.flagPlanted ? 0x22c55e : 0x38bdf8);
      (drillRing.material as THREE.MeshBasicMaterial).color.setHex(evaTasksRef.current.sampleDrilled ? 0x22c55e : 0xfbbf24);
      (pseRing.material as THREE.MeshBasicMaterial).color.setHex(evaTasksRef.current.seismicDeployed ? 0x22c55e : 0xa855f7);

      if (p.missionPhase === 'VAB_BUILD') {
        rocketMasterGroup.visible = true;
        rocketMasterGroup.position.set(0, 8.5, 0);
        earthMesh.visible = false;
        moonMesh.visible = false;
      } else if (p.missionPhase === 'PAD_READY') {
        rocketMasterGroup.position.set(0, 10.5, 0);
        earthMesh.visible = false;
        moonMesh.visible = false;
      } else if (isLunarSurfaceMode) {
        earthMesh.visible = false;
        moonMesh.visible = true;
        if (p.missionPhase === 'RETRO_DESCENT') {
          apolloLmGroup.position.set(0, Math.max(0, p.altM / 250), 0);
        } else if (['SURFACE_LANDED', 'SURFACE_EVA'].includes(p.missionPhase)) {
          apolloLmGroup.position.set(0, 0, 0);
        } else if (p.missionPhase === 'SURFACE_ASCENT') {
          ascentGroup.position.y = 2.1 + (p.altM / 200);
          dStage.visible = true;
        }
      }

      // ─── 3D CAMERA CONTROLLER ───
      if (p.missionPhase === 'SURFACE_EVA') {
        // Third-Person Orbit / Follow Camera smoothly framing walking Neil Armstrong
        const camDist = 6.5;
        const phi = Math.max(0.18, Math.min(1.15, p.cameraAngleY + 0.35));
        const theta = p.cameraAngleX + p.astroRot;
        camera.position.x = THREE.MathUtils.lerp(camera.position.x, p.astroX - camDist * Math.cos(phi) * Math.sin(theta), dt * 8);
        camera.position.y = THREE.MathUtils.lerp(camera.position.y, -1.2 + 1.2 + camDist * Math.sin(phi), dt * 8);
        camera.position.z = THREE.MathUtils.lerp(camera.position.z, p.astroZ - camDist * Math.cos(phi) * Math.cos(theta), dt * 8);
        camera.lookAt(p.astroX, -1.2 + 1.2, p.astroZ);
      } else {
        const camDist = p.viewMode === 'PAD_CAM' ? 55 : p.viewMode === 'ORBIT_MAP' ? 700 : 34;
        const phi = p.cameraAngleY;
        const theta = p.cameraAngleX;
        const targetPos = isLunarSurfaceMode ? apolloLmGroup.position : rocketMasterGroup.position;
        camera.position.x = targetPos.x + camDist * Math.cos(phi) * Math.sin(theta);
        camera.position.y = targetPos.y + camDist * Math.sin(phi);
        camera.position.z = targetPos.z + camDist * Math.cos(phi) * Math.cos(theta);
        camera.lookAt(targetPos.clone().add(new THREE.Vector3(0, 2.5, 0)));
      }

      // Sync React telemetry states
      setFlightAltM(p.altM);
      setFlightSpeedMs(p.velMs);
      setFlightVyMs(p.vyMs);
      setFlightVxMs(p.vxMs);
      setFlightFuelPct(p.fuelPct);

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(animate);

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

  // Attitude Navball Canvas Renderer
  useEffect(() => {
    if (!isOpen || !navballCanvasRef.current) return;
    const canvas = navballCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, 96, 96);
    const cx = 48;
    const cy = 48;
    const r = 42;

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();

    const pitchOffset = ((90 - pitchDeg) / 90) * (r * 0.9);
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(0, 0, 96, cy + pitchOffset);
    ctx.fillStyle = '#92400e';
    ctx.fillRect(0, cy + pitchOffset, 96, 96);

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(6, cy + pitchOffset);
    ctx.lineTo(90, cy + pitchOffset);
    ctx.stroke();

    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(cx, cy, 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

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
          {/* Mission Selectors */}
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
                  }}
                >
                  <span>{prof.badge}</span>
                  <span>{idx + 1}. {prof.name.split(':')[0]}</span>
                </button>
              );
            })}
          </div>

          {/* Right Header Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <button
              onClick={() => setIsNasaModalOpen(true)}
              style={{
                background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.35), rgba(30, 58, 138, 0.55))',
                border: '1px solid #38bdf8',
                color: '#38bdf8',
                borderRadius: '8px',
                padding: '6px 10px',
                fontWeight: 800,
                fontSize: '10.5px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                boxShadow: '0 0 10px rgba(56, 189, 248, 0.25)',
                whiteSpace: 'nowrap',
              }}
              title="Open NASA Open Data Plan (2 Moon + 2 Mars Survival Missions)"
            >
              <ShieldCheck size={13} />
              <span>NASA PLAN</span>
            </button>

            <button
              onClick={() => setSoundEnabled((v) => !v)}
              style={{
                background: 'rgba(15, 23, 42, 0.75)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: soundEnabled ? '#38bdf8' : '#64748b',
                borderRadius: '8px',
                padding: '6px 9px',
                cursor: 'pointer',
                flexShrink: 0,
              }}
              title="Toggle Audio"
            >
              {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.4), rgba(185, 28, 28, 0.8))',
                border: '1.5px solid #ef4444',
                color: '#ffffff',
                borderRadius: '8px',
                padding: '6px 14px',
                fontWeight: 900,
                fontSize: '11px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                flexShrink: 0,
                boxShadow: '0 0 14px rgba(239, 68, 68, 0.5)',
              }}
            >
              <X size={14} /> EXIT
            </button>
          </div>
        </div>

        {/* Phase Breadcrumbs / Interactive Quick Phase Jumper */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
          {(destination === 'MARS'
            ? [
                { phase: 'PAD_READY', label: '1. 🚀 Pad 39A Launch (Earth)' },
                { phase: 'ASCENT', label: '2. 🔥 Staged Liftoff' },
                { phase: 'ORBIT_COAST', label: '3. 🌍 Earth Orbit' },
                { phase: 'TLI_BURN', label: '4. 🎯 Trans-Mars Injection (TMI)' },
                { phase: 'RETRO_DESCENT', label: '5. 🔴 Mars EDL & Delta Landing' },
                { phase: 'SURFACE_EVA', label: '6. 🧑‍🚀 Walk on Mars (EVA Sortie)' },
                { phase: 'SURFACE_ASCENT', label: '7. 🚀 Mars Ascent (MAV Liftoff)' },
                { phase: 'SPLASHDOWN', label: '8. 🌊 Pacific Return' },
                { phase: 'VAB_BUILD', label: '🔧 Custom VAB Stages' },
              ]
            : destination === 'SUBORBITAL'
            ? [
                { phase: 'PAD_READY', label: '1. 🚀 Pad 39A Launch (Earth)' },
                { phase: 'ASCENT', label: '2. 🔥 Sub-Orbital Boost' },
                { phase: 'ORBIT_COAST', label: '3. 🌌 100 km Kármán Apogee' },
                { phase: 'TLI_BURN', label: '4. 🎯 Microgravity Coast' },
                { phase: 'RETRO_DESCENT', label: '5. 🏜️ Desert Descent & Touchdown' },
                { phase: 'SURFACE_EVA', label: '6. 🧑‍🚀 Ground Sortie & Recovery' },
                { phase: 'SURFACE_ASCENT', label: '7. 🚙 Recovery Transport' },
                { phase: 'SPLASHDOWN', label: '8. 🏁 Mission Accomplished' },
                { phase: 'VAB_BUILD', label: '🔧 Custom VAB Stages' },
              ]
            : destination === 'ORBITAL'
            ? [
                { phase: 'PAD_READY', label: '1. 🚀 Pad 39A Launch (Earth)' },
                { phase: 'ASCENT', label: '2. 🔥 Multi-Stage Ascent' },
                { phase: 'ORBIT_COAST', label: '3. 🛰️ 200 km LEO Orbit Insertion' },
                { phase: 'TLI_BURN', label: '4. 🔄 De-Orbit Retrograde Burn' },
                { phase: 'RETRO_DESCENT', label: '5. 🌊 Pacific Ocean Parachute Entry' },
                { phase: 'SURFACE_EVA', label: '6. 🧑‍🚀 Ocean Flotation & Retrieval' },
                { phase: 'SURFACE_ASCENT', label: '7. 🚁 Helicopter Winch Airlift' },
                { phase: 'SPLASHDOWN', label: '8. 🚢 Carrier USS Hornet Recovery' },
                { phase: 'VAB_BUILD', label: '🔧 Custom VAB Stages' },
              ]
            : [
                { phase: 'PAD_READY', label: '1. 🚀 Pad 39A Launch (Earth)' },
                { phase: 'ASCENT', label: '2. 🔥 Staged Liftoff' },
                { phase: 'ORBIT_COAST', label: '3. 🌍 Earth Orbit' },
                { phase: 'TLI_BURN', label: '4. 🌕 TLI to Moon' },
                { phase: 'RETRO_DESCENT', label: '5. 🦿 Lunar Landing' },
                { phase: 'SURFACE_EVA', label: '6. 🧑‍🚀 Walk on Moon (EVA)' },
                { phase: 'SURFACE_ASCENT', label: '7. 🚀 Lunar Ascent' },
                { phase: 'SPLASHDOWN', label: '8. 🪂 Earth Return' },
                { phase: 'VAB_BUILD', label: '🔧 Custom VAB Stages' },
              ]
          ).map((item) => {
            const isActive = missionPhase === item.phase;
            return (
              <button
                key={item.phase}
                onClick={() => jumpToPhase(item.phase as MissionPhase)}
                title={`Jump directly to ${item.label}`}
                style={{
                  padding: '5px 11px',
                  borderRadius: '7px',
                  fontSize: '10px',
                  fontWeight: 900,
                  fontFamily: 'monospace',
                  background: isActive ? 'linear-gradient(135deg, #0284c7, #0369a1)' : 'rgba(15, 23, 42, 0.75)',
                  border: `1.5px solid ${isActive ? '#38bdf8' : 'rgba(255,255,255,0.12)'}`,
                  color: isActive ? '#ffffff' : '#94a3b8',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  boxShadow: isActive ? '0 0 16px rgba(56, 189, 248, 0.6)' : 'none',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* CENTER TOP: FLIGHT DIRECTOR GUIDANCE CALLOUT BANNER                 */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          top: '124px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(15, 23, 42, 0.92)',
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
      {/* VAB ROCKET BUILDER & EQUIPMENT SELECTION OVERLAY (PHASE 1)          */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {missionPhase === 'VAB_BUILD' && (
        <div
          style={{
            position: 'absolute',
            top: '140px',
            right: '20px',
            width: '420px',
            background: 'rgba(15, 23, 42, 0.95)',
            border: '2px solid #38bdf8',
            borderRadius: '16px',
            padding: '20px',
            zIndex: 120,
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            boxShadow: '0 12px 48px rgba(0,0,0,0.85)',
            maxHeight: 'calc(100vh - 240px)',
            overflowY: 'auto',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#38bdf8', fontWeight: 900, fontSize: '14px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px' }}>
            <Wrench size={18} />
            VAB ROCKET ASSEMBLY & EQUIPMENT BUILDER
          </div>

          {/* 1. Strap-on Boosters */}
          <div>
            <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 800, marginBottom: '6px' }}>1. STRAP-ON BOOSTERS</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {VAB_BOOSTERS.map((b) => (
                <button
                  key={b.id}
                  onClick={() => setSelectedBooster(b)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '8px',
                    background: selectedBooster.id === b.id ? 'rgba(2, 132, 199, 0.35)' : 'rgba(255,255,255,0.05)',
                    border: `1.5px solid ${selectedBooster.id === b.id ? '#38bdf8' : 'rgba(255,255,255,0.1)'}`,
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

          {/* 2. Core Stage */}
          <div>
            <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 800, marginBottom: '6px' }}>2. CORE PROPULSION STAGE</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {VAB_CORE_STAGES.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCore(c)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '8px',
                    background: selectedCore.id === c.id ? 'rgba(2, 132, 199, 0.35)' : 'rgba(255,255,255,0.05)',
                    border: `1.5px solid ${selectedCore.id === c.id ? '#38bdf8' : 'rgba(255,255,255,0.1)'}`,
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

          {/* 3. Science Equipment Checklist */}
          <div>
            <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 800, marginBottom: '6px' }}>3. MOON SURFACE MISSION EQUIPMENT</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {VAB_SCIENCE_EQUIPMENT.map((eq) => {
                const isSelected = selectedEquip.some((e) => e.id === eq.id);
                return (
                  <button
                    key={eq.id}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedEquip((prev) => prev.filter((e) => e.id !== eq.id));
                      } else {
                        setSelectedEquip((prev) => [...prev, eq]);
                      }
                    }}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '8px',
                      background: isSelected ? 'rgba(34, 197, 94, 0.25)' : 'rgba(255,255,255,0.05)',
                      border: `1.5px solid ${isSelected ? '#22c55e' : 'rgba(255,255,255,0.1)'}`,
                      color: '#ffffff',
                      textAlign: 'left',
                      fontSize: '11px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 800 }}>{eq.icon} {eq.name}</div>
                      <div style={{ fontSize: '9px', color: '#94a3b8' }}>Mass: {eq.massKg} kg · {eq.description}</div>
                    </div>
                    <span style={{ color: isSelected ? '#22c55e' : '#64748b', fontWeight: 900 }}>
                      {isSelected ? 'EQUIPPED ✓' : '+ EQUIP'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Rocket Physics Stats */}
          <div style={{ background: 'rgba(0,0,0,0.4)', padding: '10px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
            <div>
              <div style={{ color: '#94a3b8' }}>TOTAL LIFTOFF MASS</div>
              <div style={{ fontWeight: 900, color: '#ffffff' }}>{rocketPhysics.totalLiftoffMassTons.toFixed(0)} TONS</div>
            </div>
            <div>
              <div style={{ color: '#94a3b8' }}>TOTAL DELTA-V (Δv)</div>
              <div style={{ fontWeight: 900, color: '#38bdf8' }}>{rocketPhysics.totalDeltaVmS.toFixed(0)} m/s</div>
            </div>
            <div>
              <div style={{ color: '#94a3b8' }}>TWR RATIO</div>
              <div style={{ fontWeight: 900, color: '#22c55e' }}>{rocketPhysics.liftoffTWR.toFixed(2)}</div>
            </div>
          </div>

          {/* Action Rollout Button */}
          <button
            onClick={() => {
              setMissionPhase('PAD_READY');
              setDirectorCallout('ROCKET ROLLED OUT TO PAD 39A · CHECK WEATHER CLEARANCE AND IGNITE!');
              if (soundEnabled) soundFx.playReactorStart();
            }}
            style={{
              padding: '12px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              border: 'none',
              color: '#ffffff',
              fontWeight: 900,
              fontSize: '13px',
              cursor: 'pointer',
              boxShadow: '0 0 25px rgba(16, 185, 129, 0.5)',
            }}
          >
            🚀 ROLL OUT TO LAUNCH PAD 39A
          </button>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* MOON SURFACE EVA OBJECTIVES & ASTRONAUT HUD (PHASE: SURFACE_EVA)    */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {missionPhase === 'SURFACE_EVA' && (
        <div
          style={{
            position: 'absolute',
            top: '170px',
            right: '20px',
            width: '390px',
            background: 'rgba(15, 23, 42, 0.94)',
            border: '2px solid #38bdf8',
            borderRadius: '16px',
            padding: '18px',
            zIndex: 120,
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            boxShadow: '0 12px 48px rgba(0,0,0,0.85), 0 0 24px rgba(56, 189, 248, 0.3)',
            maxHeight: 'calc(100vh - 270px)',
            overflowY: 'auto',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#38bdf8', fontWeight: 900, fontSize: '13px' }}>
              <span>🧑‍🚀</span>
              <span>{destProfile.name.toUpperCase()}</span>
            </div>
            <span style={{ fontSize: '10px', background: 'rgba(34, 197, 94, 0.2)', border: '1px solid #22c55e', color: '#4ade80', padding: '2px 8px', borderRadius: '4px', fontWeight: 800 }}>
              {destination === 'MARS' ? 'CADET COMMANDER' : destination === 'SUBORBITAL' ? 'CHIEF PILOT' : destination === 'ORBITAL' ? 'MISSION COMMANDER' : 'NEIL ARMSTRONG'}
            </span>
          </div>

          <div style={{ fontSize: '11px', color: '#94a3b8' }}>
            {taskInfo.subtitle} — Navigate around terrain obstacles and press <strong style={{ color: '#38bdf8' }}>[E]</strong> to interact:
          </div>

          {/* Checklist */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* Task 1 */}
            <div
              onClick={() => {
                if (!evaTasks.flagPlanted) {
                  simRef.current.astroX = 6.0;
                  simRef.current.astroZ = -2.5;
                  setAstroWalkPos({ x: 6.0, z: -2.5, rot: simRef.current.astroRot });
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderRadius: '8px',
                background: evaTasks.flagPlanted ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                border: `1.5px solid ${evaTasks.flagPlanted ? '#22c55e' : 'rgba(255, 255, 255, 0.1)'}`,
                cursor: 'pointer',
              }}
              title="Click to warp astronaut near Task 1 waypoint"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '16px' }}>{taskInfo.task1.icon}</span>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#f8fafc' }}>{taskInfo.task1.title}</div>
                  <div style={{ fontSize: '9.5px', color: '#94a3b8' }}>{taskInfo.task1.desc}</div>
                </div>
              </div>
              <span style={{ fontSize: '11px', fontWeight: 900, color: evaTasks.flagPlanted ? '#4ade80' : '#fbbf24' }}>
                {evaTasks.flagPlanted ? taskInfo.task1.doneLabel : 'PENDING'}
              </span>
            </div>

            {/* Task 2 */}
            <div
              onClick={() => {
                if (!evaTasks.sampleDrilled) {
                  simRef.current.astroX = -6.5;
                  simRef.current.astroZ = 7.5;
                  setAstroWalkPos({ x: -6.5, z: 7.5, rot: simRef.current.astroRot });
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderRadius: '8px',
                background: evaTasks.sampleDrilled ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                border: `1.5px solid ${evaTasks.sampleDrilled ? '#22c55e' : 'rgba(255, 255, 255, 0.1)'}`,
                cursor: 'pointer',
              }}
              title="Click to warp astronaut near Task 2 waypoint"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '16px' }}>{taskInfo.task2.icon}</span>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#f8fafc' }}>{taskInfo.task2.title}</div>
                  <div style={{ fontSize: '9.5px', color: '#94a3b8' }}>{taskInfo.task2.desc}</div>
                </div>
              </div>
              <span style={{ fontSize: '11px', fontWeight: 900, color: evaTasks.sampleDrilled ? '#4ade80' : '#fbbf24' }}>
                {evaTasks.sampleDrilled ? taskInfo.task2.doneLabel : 'PENDING'}
              </span>
            </div>

            {/* Task 3 */}
            <div
              onClick={() => {
                if (!evaTasks.seismicDeployed) {
                  simRef.current.astroX = 9.5;
                  simRef.current.astroZ = 5.5;
                  setAstroWalkPos({ x: 9.5, z: 5.5, rot: simRef.current.astroRot });
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderRadius: '8px',
                background: evaTasks.seismicDeployed ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                border: `1.5px solid ${evaTasks.seismicDeployed ? '#22c55e' : 'rgba(255, 255, 255, 0.1)'}`,
                cursor: 'pointer',
              }}
              title="Click to warp astronaut near Task 3 waypoint"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '16px' }}>{taskInfo.task3.icon}</span>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#f8fafc' }}>{taskInfo.task3.title}</div>
                  <div style={{ fontSize: '9.5px', color: '#94a3b8' }}>{taskInfo.task3.desc}</div>
                </div>
              </div>
              <span style={{ fontSize: '11px', fontWeight: 900, color: evaTasks.seismicDeployed ? '#4ade80' : '#fbbf24' }}>
                {evaTasks.seismicDeployed ? taskInfo.task3.doneLabel : 'PENDING'}
              </span>
            </div>

            {/* Task 4 */}
            <div
              onClick={() => {
                if (evaTasks.flagPlanted && evaTasks.sampleDrilled && evaTasks.seismicDeployed) {
                  simRef.current.astroX = 2.2;
                  simRef.current.astroZ = 2.2;
                  setAstroWalkPos({ x: 2.2, z: 2.2, rot: simRef.current.astroRot });
                  handleEvaInteract();
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderRadius: '8px',
                background: (evaTasks.flagPlanted && evaTasks.sampleDrilled && evaTasks.seismicDeployed) ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                border: `1.5px solid ${(evaTasks.flagPlanted && evaTasks.sampleDrilled && evaTasks.seismicDeployed) ? '#38bdf8' : 'rgba(255, 255, 255, 0.08)'}`,
                cursor: (evaTasks.flagPlanted && evaTasks.sampleDrilled && evaTasks.seismicDeployed) ? 'pointer' : 'default',
              }}
              title={taskInfo.vehicle.title}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '16px' }}>{taskInfo.vehicle.icon}</span>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#f8fafc' }}>{taskInfo.vehicle.title}</div>
                  <div style={{ fontSize: '9.5px', color: '#94a3b8' }}>{taskInfo.vehicle.desc}</div>
                </div>
              </div>
              <span style={{ fontSize: '11px', fontWeight: 900, color: (evaTasks.flagPlanted && evaTasks.sampleDrilled && evaTasks.seismicDeployed) ? '#38bdf8' : '#64748b' }}>
                {(evaTasks.flagPlanted && evaTasks.sampleDrilled && evaTasks.seismicDeployed) ? taskInfo.vehicle.readyLabel : 'LOCKED'}
              </span>
            </div>
          </div>

          {/* Controls Footer */}
          <div style={{ background: 'rgba(0,0,0,0.4)', padding: '10px', borderRadius: '8px', fontSize: '10px', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ fontWeight: 800, color: '#38bdf8' }}>🎮 EVA CONTROLS:</div>
            <div>• <strong>[W][A][S][D] / Arrows</strong>: 3D Surface Walk & Low-G Hop</div>
            <div>• <strong>[E] / Interact Button</strong>: Deploy / Sample / Board</div>
            <div>• <strong>Terrain Obstacles</strong>: Physical Collision Blocking</div>
            <div>• <strong>Mouse Drag</strong>: 360° Panoramic Orbit Camera</div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* LEFT: FLIGHT TELEMETRY HUD & ATTITUDE NAVBALL (DURING FLIGHT)       */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {missionPhase !== 'VAB_BUILD' && missionPhase !== 'SURFACE_EVA' && (
        <div
          style={{
            position: 'absolute',
            top: '170px',
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

          {/* Attitude Navball */}
          <div style={{ marginTop: '6px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '8px' }}>
            <span style={{ fontSize: '9px', fontWeight: 800, color: '#94a3b8' }}>ATTITUDE NAVBALL</span>
            <canvas ref={navballCanvasRef} width={96} height={96} style={{ width: '84px', height: '84px' }} />
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* LEFT: APOLLO 11 SPACESUIT VITALS (DURING MOON SURFACE EVA)          */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {missionPhase === 'SURFACE_EVA' && (
        <div
          style={{
            position: 'absolute',
            top: '170px',
            left: '20px',
            background: 'rgba(15, 23, 42, 0.92)',
            border: '1.5px solid #38bdf8',
            borderRadius: '12px',
            padding: '14px 16px',
            width: '220px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
            zIndex: 80,
            pointerEvents: 'auto',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '6px' }}>
            <span style={{ fontSize: '10px', fontWeight: 900, color: '#38bdf8', fontFamily: 'monospace' }}>{taskInfo.suitTitle}</span>
            <span style={{ fontSize: '9px', color: '#22c55e', fontWeight: 800 }}>NOMINAL</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
            <span style={{ color: '#94a3b8' }}>ASTRONAUT:</span>
            <strong style={{ color: '#ffffff', fontFamily: 'monospace' }}>
              {destination === 'MARS' ? 'CADET ARTEMIS' : destination === 'SUBORBITAL' ? 'CHIEF PILOT' : destination === 'ORBITAL' ? 'CDR. ARMSTRONG' : 'NEIL ARMSTRONG'}
            </strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
            <span style={{ color: '#94a3b8' }}>LIFE SUPPORT:</span>
            <strong style={{ color: '#38bdf8', fontFamily: 'monospace' }}>100% (4.2 PSI)</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
            <span style={{ color: '#94a3b8' }}>SUIT BATTERY:</span>
            <strong style={{ color: '#22c55e', fontFamily: 'monospace' }}>98% (4.5 HRS)</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
            <span style={{ color: '#94a3b8' }}>SURFACE TEMP:</span>
            <strong style={{ color: '#fbbf24', fontFamily: 'monospace' }}>{taskInfo.temp}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
            <span style={{ color: '#94a3b8' }}>GRAVITY:</span>
            <strong style={{ color: '#a855f7', fontFamily: 'monospace' }}>{taskInfo.gravity}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
            <span style={{ color: '#94a3b8' }}>ATMOSPHERE:</span>
            <strong style={{ color: '#38bdf8', fontFamily: 'monospace' }}>{taskInfo.atmo}</strong>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* OBSTACLE WARNING ALERT BANNER                                       */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {missionPhase === 'SURFACE_EVA' && obstacleAlert && (
        <div
          style={{
            position: 'absolute',
            bottom: '160px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.95), rgba(185, 28, 28, 0.95))',
            border: '2px solid #f87171',
            borderRadius: '12px',
            padding: '10px 22px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: '0 0 35px rgba(239, 68, 68, 0.7)',
            zIndex: 110,
          }}
        >
          <AlertTriangle size={20} color="#ffffff" />
          <span style={{ fontWeight: 900, fontSize: '12.5px', color: '#ffffff', letterSpacing: '0.04em' }}>
            {obstacleAlert}
          </span>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* PROXIMITY PROMPT FOR ACTIVE ASTRONAUT EVA MISSION TASKS             */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {missionPhase === 'SURFACE_EVA' && activeEvaPrompt && (
        <div
          style={{
            position: 'absolute',
            bottom: '120px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.95), rgba(15, 23, 42, 0.95))',
            border: '2px solid #38bdf8',
            borderRadius: '12px',
            padding: '12px 24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            boxShadow: '0 0 35px rgba(56, 189, 248, 0.6)',
            zIndex: 110,
            cursor: 'pointer',
          }}
          onClick={handleEvaInteract}
        >
          <Sparkles size={20} color="#fde047" />
          <span style={{ fontWeight: 900, fontSize: '13px', color: '#ffffff', letterSpacing: '0.04em' }}>
            {activeEvaPrompt}
          </span>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* BOTTOM CONTROL DECK: DYNAMIC ACTIONS & STEERING                     */}
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
        {/* Left: View Switcher */}
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
              {mode === 'CHASE' ? '🎥 CHASE' : mode === 'ORBIT_MAP' ? '🌍 3D TRAJECTORY' : '🚀 PAD / SURFACE'}
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
                setDirectorCallout('⏩ FLYING ALONG 3D TRANSLUNAR TRAJECTORY (100x TIME WARP)!');
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
              <span>⏩</span> TIME WARP ALONG 3D TRAJECTORY (100x)
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
                setDirectorCallout(
                  destination === 'MARS'
                    ? '🔴 COMMENCE MARS SURFACE EVA! WALK WITH [W][A][S][D] / ARROWS TO ACTIVATE MOXIE & SAMPLE DELTA'
                    : destination === 'SUBORBITAL'
                    ? '🏜️ COMMENCE DESERT RECOVERY SORTIE! WALK WITH [W][A][S][D] / ARROWS TO SECURE PAYLOAD'
                    : destination === 'ORBITAL'
                    ? '🌊 COMMENCE PACIFIC RETRIEVAL! SWIM/RAFT WITH [W][A][S][D] / ARROWS TO SECURE BLACK BOX'
                    : '🧑‍🚀 NEIL ARMSTRONG ON MOON! WALK WITH [W][A][S][D] / ARROWS TO OBJECTIVES'
                );
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
              <span>🧑‍🚀</span>{' '}
              {destination === 'MARS'
                ? 'COMMENCE MARS SURFACE EVA (WALK WITH WASD)'
                : destination === 'SUBORBITAL'
                ? 'COMMENCE DESERT SORTIE (WALK WITH WASD)'
                : destination === 'ORBITAL'
                ? 'COMMENCE OCEAN RETRIEVAL (SWIM/RAFT WITH WASD)'
                : 'STEP OUT ON MOON EVA (WALK WITH WASD)'}
            </button>
          )}

          {missionPhase === 'SURFACE_EVA' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={handleEvaInteract}
                style={{
                  padding: '12px 20px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  border: '2px solid #34d399',
                  color: '#ffffff',
                  fontWeight: 900,
                  fontSize: '12px',
                  cursor: 'pointer',
                  boxShadow: '0 0 25px rgba(16, 185, 129, 0.6)',
                }}
              >
                <span>⚡</span> INTERACT [E]
              </button>

              {/* On-screen Directional Touch/Click Walk Pads */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px', background: 'rgba(0,0,0,0.5)', padding: '6px', borderRadius: '8px' }}>
                <div />
                <button
                  onMouseDown={() => { keysDownRef.current['w'] = true; }}
                  onMouseUp={() => { keysDownRef.current['w'] = false; }}
                  style={{ padding: '6px', background: '#38bdf8', border: 'none', borderRadius: '4px', color: '#000', cursor: 'pointer' }}
                >
                  <ArrowUp size={14} />
                </button>
                <div />
                <button
                  onMouseDown={() => { keysDownRef.current['a'] = true; }}
                  onMouseUp={() => { keysDownRef.current['a'] = false; }}
                  style={{ padding: '6px', background: '#38bdf8', border: 'none', borderRadius: '4px', color: '#000', cursor: 'pointer' }}
                >
                  <ArrowLeft size={14} />
                </button>
                <button
                  onMouseDown={() => { keysDownRef.current['s'] = true; }}
                  onMouseUp={() => { keysDownRef.current['s'] = false; }}
                  style={{ padding: '6px', background: '#38bdf8', border: 'none', borderRadius: '4px', color: '#000', cursor: 'pointer' }}
                >
                  <ArrowDown size={14} />
                </button>
                <button
                  onMouseDown={() => { keysDownRef.current['d'] = true; }}
                  onMouseUp={() => { keysDownRef.current['d'] = false; }}
                  style={{ padding: '6px', background: '#38bdf8', border: 'none', borderRadius: '4px', color: '#000', cursor: 'pointer' }}
                >
                  <ArrowRight size={14} />
                </button>
              </div>
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

        {/* Right: Flight Controls (Throttle & Pitch) */}
        {missionPhase !== 'VAB_BUILD' && missionPhase !== 'SURFACE_EVA' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(15, 23, 42, 0.88)', padding: '10px 14px', borderRadius: '12px', border: '1px solid rgba(56, 189, 248, 0.3)', pointerEvents: 'auto' }}>
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
        )}
      </div>

      {/* NASA 4-Platform Open Survival Data Plan Modal */}
      <NasaDataModal isOpen={isNasaModalOpen} onClose={() => setIsNasaModalOpen(false)} />
    </div>
  );
};
