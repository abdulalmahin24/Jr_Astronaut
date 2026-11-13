import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Rocket,
  Shield,
  Radio,
  Target,
  ChevronRight,
  Maximize2,
  Sparkles,
  Compass,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Film,
  FastForward,
} from 'lucide-react';
import { soundFx } from '../utils/audioEffects';
import { disposeThreeScene } from '../utils/threeDisposeHelper';
import type {
  NasaLevelMission,
  VehicleConfig,
  PlanetMapConfig,
} from '../data/nasaInteractiveMissions';

export interface MissionCinematicIntroProps {
  mission: NasaLevelMission;
  vehicle: VehicleConfig;
  map: PlanetMapConfig;
  onLaunchGame: () => void;
  onBackToHub: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// PHOTOREALISTIC PROCEDURAL TEXTURE GENERATORS
// ─────────────────────────────────────────────────────────────────────────────

// 1. Soft glowing circular particle texture (Eliminates square pixels!)
const createGlowParticleTexture = (): THREE.Texture => {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
  grad.addColorStop(0.25, 'rgba(186, 230, 253, 0.9)');
  grad.addColorStop(0.55, 'rgba(56, 189, 248, 0.35)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
};

// 2. High-Fidelity Solar Array Texture
const createSolarArrayTexture = (): THREE.Texture => {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#090d16';
  ctx.fillRect(0, 0, 512, 128);

  const cols = 16;
  const rows = 4;
  const cellW = 512 / cols;
  const cellH = 128 / rows;
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      ctx.fillStyle = '#1e3a8a';
      ctx.fillRect(c * cellW + 1.5, r * cellH + 1.5, cellW - 3, cellH - 3);
      // Photovoltaic cell reflection line
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(c * cellW + 3, r * cellH + 3, cellW - 6, 1.5);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
};

// 3. Spacecraft Metallic Plating Texture
const createHullPlatingTexture = (): THREE.Texture => {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#cbd5e1';
  ctx.fillRect(0, 0, 512, 512);

  // Subtle panel rivets and grid
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1.5;
  for (let i = 64; i < 512; i += 64) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 512);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(512, i);
    ctx.stroke();
  }

  // NASA Insignia Blue Banner
  ctx.fillStyle = '#0284c7';
  ctx.fillRect(190, 220, 132, 44);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px system-ui, sans-serif';
  ctx.fillText('NASA', 224, 252);

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
};

// 4. Realistic Planetary Surface Texture (1024x512 with craters, maria, or clouds)
const createRealisticPlanetTexture = (terrainType: string, accentColor: string): THREE.Texture => {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  if (terrainType.includes('LUNAR') || terrainType.includes('MOON')) {
    // 🌕 Moon / Regolith Surface
    ctx.fillStyle = '#475569';
    ctx.fillRect(0, 0, 1024, 512);

    // Dark Maria Basins
    ctx.fillStyle = '#1e293b';
    const maria = [
      { x: 300, y: 180, r: 120 },
      { x: 450, y: 220, r: 90 },
      { x: 220, y: 300, r: 80 },
      { x: 750, y: 250, r: 110 },
      { x: 620, y: 160, r: 95 },
    ];
    maria.forEach((m) => {
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Realistic Impact Craters with Bright Ejecta Rays
    for (let c = 0; c < 75; c++) {
      const cx = (c * 137.5) % 1024;
      const cy = (c * 79.3) % 512;
      const rad = 4 + (c % 18);

      // Shadow rim
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(cx, cy, rad, 0, Math.PI * 2);
      ctx.fill();

      // Highlight rim
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      ctx.arc(cx - rad * 0.25, cy - rad * 0.25, rad * 0.85, 0, Math.PI * 2);
      ctx.fill();

      // Crater floor
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.arc(cx, cy, rad * 0.65, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (terrainType.includes('MARS')) {
    // 🪐 Mars Surface
    const grad = ctx.createLinearGradient(0, 0, 1024, 512);
    grad.addColorStop(0, '#991b1b');
    grad.addColorStop(0.3, '#c2410c');
    grad.addColorStop(0.7, '#b45309');
    grad.addColorStop(1, '#7f1d1d');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 512);

    // Canyons and dark dunes (Valles Marineris)
    ctx.strokeStyle = '#450a0a';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(150, 250);
    ctx.bezierCurveTo(400, 230, 600, 270, 850, 250);
    ctx.stroke();

    // Polar Ice Cap
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.beginPath();
    ctx.arc(512, 10, 110, 0, Math.PI * 2);
    ctx.fill();
  } else if (terrainType.includes('ICE') || terrainType.includes('EUROPA')) {
    // ❄️ Europa / Enceladus Cracked Ice
    ctx.fillStyle = '#e0f2fe';
    ctx.fillRect(0, 0, 1024, 512);

    // Deep Reddish-Brown Fissures (Lineae)
    ctx.strokeStyle = '#7c2d12';
    ctx.lineWidth = 3;
    for (let f = 0; f < 35; f++) {
      ctx.beginPath();
      const sx = (f * 140) % 1024;
      const sy = (f * 85) % 512;
      ctx.moveTo(sx, sy);
      ctx.bezierCurveTo(sx + 100, sy + 60, sx + 200, sy - 40, sx + 300, sy + 80);
      ctx.stroke();
    }
  } else if (terrainType.includes('TITAN') || terrainType.includes('METHANE')) {
    // 🪐 Titan Atmospheric Bands
    const grad = ctx.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0, '#78350f');
    grad.addColorStop(0.25, '#d97706');
    grad.addColorStop(0.5, '#f59e0b');
    grad.addColorStop(0.75, '#b45309');
    grad.addColorStop(1, '#451a03');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 512);

    // Swirling methane bands
    ctx.fillStyle = 'rgba(251, 191, 36, 0.15)';
    for (let b = 0; b < 12; b++) {
      ctx.fillRect(0, b * 42, 1024, 18);
    }
  } else {
    // 🌍 Earth / Orbit or General Deep Space Body
    ctx.fillStyle = '#0369a1'; // Deep Ocean
    ctx.fillRect(0, 0, 1024, 512);

    // Green/Brown Continents
    ctx.fillStyle = '#15803d';
    const continents = [
      { x: 260, y: 180, w: 180, h: 140 },
      { x: 320, y: 320, w: 140, h: 150 },
      { x: 560, y: 160, w: 220, h: 160 },
      { x: 620, y: 300, w: 160, h: 120 },
      { x: 780, y: 340, w: 100, h: 80 },
    ];
    continents.forEach((ct) => {
      ctx.beginPath();
      ctx.ellipse(ct.x, ct.y, ct.w / 2, ct.h / 2, 0.2, 0, Math.PI * 2);
      ctx.fill();
    });

    // Swirling White Clouds
    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    for (let c = 0; c < 25; c++) {
      const cx = (c * 180) % 1024;
      const cy = (c * 95) % 512;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 70, 25, 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT IMPLEMENTATION
// ─────────────────────────────────────────────────────────────────────────────
export const MissionCinematicIntro: React.FC<MissionCinematicIntroProps> = ({
  mission,
  vehicle,
  map,
  onLaunchGame,
  onBackToHub,
  isMuted,
  onToggleMute,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Cinematic Trailer Voiceover Script
  const briefingScript = `Flight Director to Artemis Flight Command. Mission #${mission.missionNumber}: "${mission.title}". Destination vector locked: ${map.name}. Primary Directive: ${mission.objectives[0] || 'Execute planetary flight mission'}. Spacecraft ignition confirmed. Prepare for entry.`;

  // Dynamic duration estimation: SpeechSynthesis rate ~0.52s per word + 4s climactic warp burn
  const words = briefingScript.split(/\s+/).filter(Boolean).length;
  const estimatedSpeechDuration = Math.max(15, Math.ceil(words * 0.52));
  const initialCountdown = estimatedSpeechDuration + 4;

  const [typedCaption, setTypedCaption] = useState('');
  const [countdown, setCountdown] = useState(initialCountdown);
  const [isVoiceSpeaking, setIsVoiceSpeaking] = useState(false);
  const [isNarrationFinished, setIsNarrationFinished] = useState(false);
  const [isClimaxIgnition, setIsClimaxIgnition] = useState(false);
  const [trailerPhase, setTrailerPhase] = useState<'ORBIT_APPROACH' | 'SPACECRAFT_FLYBY' | 'FINAL_BURN' | 'HYPERSPACE_INGRESS'>('ORBIT_APPROACH');
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Animation sync refs
  const isClimaxRef = useRef(false);
  const climaxStartTimeRef = useRef<number | null>(null);
  const hasTriggeredLaunchRef = useRef(false);

  // ─── 1. SPEECH SYNTHESIS NARRATION (NASA CAPCOM RADIO) ───
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window) || isMuted) {
      setIsVoiceSpeaking(false);
      return;
    }

    try {
      window.speechSynthesis.cancel();
    } catch {}
    soundFx.playReactorStart();

    const utterance = new SpeechSynthesisUtterance(briefingScript);
    utterance.rate = 1.0;
    utterance.pitch = 0.94;

    const assignVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      const flightVoice = voices.find(
        (v) => v.lang.startsWith('en') && (v.name.includes('David') || v.name.includes('George') || v.name.includes('Male') || v.name.includes('Natural'))
      ) || voices.find((v) => v.lang.startsWith('en'));
      if (flightVoice) utterance.voice = flightVoice;
    };

    if (window.speechSynthesis.getVoices().length > 0) {
      assignVoice();
    } else {
      window.speechSynthesis.onvoiceschanged = assignVoice;
    }

    utterance.onstart = () => {
      setIsVoiceSpeaking(true);
    };

    utterance.onend = () => {
      setIsVoiceSpeaking(false);
      setIsNarrationFinished(true);
    };

    utterance.onerror = (e) => {
      // Ignore user-initiated cancellation
      if (e.error !== 'canceled' && e.error !== 'interrupted') {
        setIsVoiceSpeaking(false);
        setIsNarrationFinished(true);
      }
    };

    try {
      window.speechSynthesis.speak(utterance);
    } catch {}

    // Chromium speech synthesis bug workaround: keep-alive heartbeat every 4.5s
    const keepAlive = setInterval(() => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      }
    }, 4500);

    return () => {
      clearInterval(keepAlive);
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
        } catch {}
      }
    };
  }, [briefingScript, isMuted]);

  // ─── 2. TYPEWRITER SUBTITLES ───
  useEffect(() => {
    let charIndex = 0;
    setTypedCaption('');
    const charInterval = Math.max(26, Math.min(38, Math.floor((estimatedSpeechDuration * 1000) / (briefingScript.length || 1))));
    const timer = setInterval(() => {
      charIndex++;
      if (charIndex <= briefingScript.length) {
        setTypedCaption(briefingScript.slice(0, charIndex));
      } else {
        clearInterval(timer);
        // If voice is muted or speech API unavailable, finish narration after readable pause
        if (isMuted || typeof window === 'undefined' || !('speechSynthesis' in window)) {
          setTimeout(() => {
            setIsNarrationFinished(true);
          }, 2200);
        }
      }
    }, charInterval);
    return () => clearInterval(timer);
  }, [briefingScript, estimatedSpeechDuration, isMuted]);

  // Fallback safety timer: ensures intro completes even if browser speech synthesis hangs
  useEffect(() => {
    const safetyTimer = setTimeout(() => {
      setIsNarrationFinished(true);
    }, (estimatedSpeechDuration + 5) * 1000);
    return () => clearTimeout(safetyTimer);
  }, [estimatedSpeechDuration]);

  // ─── 3. STEADY COUNTDOWN TIMELINE BEFORE CLIMAX ───
  useEffect(() => {
    if (isNarrationFinished) return;
    const timer = setInterval(() => {
      setCountdown((c) => {
        const elapsedEstimate = initialCountdown - c;
        if (elapsedEstimate < 6) {
          setTrailerPhase('ORBIT_APPROACH');
        } else if (elapsedEstimate < 13) {
          setTrailerPhase('SPACECRAFT_FLYBY');
        } else {
          setTrailerPhase('FINAL_BURN');
        }

        // Never cut off early: hold at T-04 until speech/subtitles officially conclude
        if (c <= 4) {
          return 4;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isNarrationFinished, initialCountdown]);

  // ─── 4. GRAND CLIMAX: HYPERSPACE ENTRY BURN (3.5 SECONDS) ───
  useEffect(() => {
    if (!isNarrationFinished || hasTriggeredLaunchRef.current) return;

    setTrailerPhase('HYPERSPACE_INGRESS');
    setIsClimaxIgnition(true);
    isClimaxRef.current = true;
    soundFx.playReactorStart();
    soundFx.playShieldHum();

    setTypedCaption('🚀 ALL SYSTEMS NOMINAL · MAXIMUM THRUST CONFIRMED · ENTERING COCKPIT...');

    let climaxSecs = 3;
    setCountdown(3);
    const climaxTimer = setInterval(() => {
      climaxSecs--;
      if (climaxSecs <= 0) {
        clearInterval(climaxTimer);
        triggerLaunch();
      } else {
        setCountdown(climaxSecs);
      }
    }, 1000);

    return () => clearInterval(climaxTimer);
  }, [isNarrationFinished]);

  const triggerLaunch = () => {
    if (hasTriggeredLaunchRef.current) return;
    hasTriggeredLaunchRef.current = true;
    setIsTransitioning(true);
    soundFx.playReactorStart();
    soundFx.playTelemetryChirp();
    setTimeout(() => {
      onLaunchGame();
    }, 650);
  };

  // ─── 4. THREE.JS PHOTOREALISTIC 3D CINEMATIC TRAILER STAGE ───
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const getViewportSize = () => {
      const parent = canvas.parentElement;
      const w = parent && parent.clientWidth > 0 ? parent.clientWidth : window.innerWidth;
      const h = parent && parent.clientHeight > 0 ? parent.clientHeight : window.innerHeight;
      return { width: Math.max(320, w), height: Math.max(240, h) };
    };

    const { width, height } = getViewportSize();

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020617);
    scene.fog = new THREE.FogExp2(0x030712, 0.0007);

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 5000);
    camera.position.set(0, 8, 70);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        powerPreference: 'high-performance',
        alpha: false,
      });
    } catch (e) {
      console.warn('WebGL initialization failed in MissionCinematicIntro:', e);
      return;
    }
    renderer.setSize(width, height, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;

    const particleTexture = createGlowParticleTexture();

    // ── 1. PINPOINT STARFIELD (SOFT GLOWING STARS, NO SQUARES!) ──
    const starCount = 3500;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starPos[i] = (Math.random() - 0.5) * 3200;
      starPos[i + 1] = (Math.random() - 0.5) * 3200;
      starPos[i + 2] = (Math.random() - 0.5) * 3200;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({
      map: particleTexture,
      color: 0xffffff,
      size: 3.5,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const starfield = new THREE.Points(starGeo, starMat);
    scene.add(starfield);

    // ── 2. COSMIC NEBULA STARDUST CLOUDS ──
    const dustCount = 200;
    const dustGeo = new THREE.BufferGeometry();
    const dustPos = new Float32Array(dustCount * 3);
    for (let d = 0; d < dustCount * 3; d += 3) {
      dustPos[d] = (Math.random() - 0.5) * 220;
      dustPos[d + 1] = (Math.random() - 0.5) * 120;
      dustPos[d + 2] = (Math.random() - 0.5) * 220;
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
    const dustMat = new THREE.PointsMaterial({
      map: particleTexture,
      color: new THREE.Color(map.accentColor),
      size: 6.5,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const dustParticles = new THREE.Points(dustGeo, dustMat);
    scene.add(dustParticles);

    // ── 3. DESTINATION CELESTIAL PLANET (PHOTOREALISTIC 3D SHADING) ──
    const planetGroup = new THREE.Group();
    const planetRadius = 36;

    const planetTex = createRealisticPlanetTexture(map.terrainType, map.accentColor);
    const planetGeo = new THREE.SphereGeometry(planetRadius, 64, 64);
    const planetMat = new THREE.MeshStandardMaterial({
      map: planetTex,
      roughness: 0.75,
      metalness: 0.15,
    });
    const planetMesh = new THREE.Mesh(planetGeo, planetMat);
    planetGroup.add(planetMesh);

    // Atmospheric Scattering Rim Halo (Realistic Limb Glow)
    const atmoGeo = new THREE.SphereGeometry(planetRadius * 1.035, 48, 48);
    const atmoMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(map.accentColor),
      transparent: true,
      opacity: 0.32,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
    });
    const atmoMesh = new THREE.Mesh(atmoGeo, atmoMat);
    planetGroup.add(atmoMesh);

    // Planetary Rings for Gas Giants / Asteroid Belts
    if (map.id.includes('titan') || map.id.includes('psyche') || map.id.includes('saturn')) {
      const ringGeo = new THREE.RingGeometry(planetRadius * 1.35, planetRadius * 2.2, 64);
      const ringMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(map.accentColor),
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.42,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2.35;
      planetGroup.add(ring);
    }

    planetGroup.position.set(45, -12, -75);
    scene.add(planetGroup);

    // ── 4. DETAILED NASA SPACECRAFT MODEL ──
    const shipGroup = new THREE.Group();
    const hullTexture = createHullPlatingTexture();
    const solarTexture = createSolarArrayTexture();

    // Fuselage / Command Module (Metallic aerodynamic capsule)
    const bodyGeo = new THREE.CylinderGeometry(2.2, 3.2, 14, 24);
    const bodyMat = new THREE.MeshStandardMaterial({
      map: hullTexture,
      metalness: 0.85,
      roughness: 0.25,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.rotation.x = Math.PI / 2;
    shipGroup.add(body);

    // Forward Command Nosecone & Heat Shield
    const noseGeo = new THREE.ConeGeometry(2.2, 5.0, 24);
    const noseMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.95,
      roughness: 0.2,
    });
    const nose = new THREE.Mesh(noseGeo, noseMat);
    nose.rotation.x = -Math.PI / 2;
    nose.position.set(0, 0, -9.5);
    shipGroup.add(nose);

    // Cockpit Specular Viewport
    const visorGeo = new THREE.BoxGeometry(2.0, 0.7, 2.2);
    const visorMat = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.6,
      metalness: 0.9,
      roughness: 0.1,
      transparent: true,
      opacity: 0.9,
    });
    const visor = new THREE.Mesh(visorGeo, visorMat);
    visor.position.set(0, 1.4, -6.5);
    shipGroup.add(visor);

    // Dual Extended Solar Panel Trusses
    [-1, 1].forEach((side) => {
      const panelArm = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.2, 4, 8),
        new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.9 })
      );
      panelArm.rotation.z = (Math.PI / 2) * side;
      panelArm.position.set(side * 4.2, 0, 1.5);
      shipGroup.add(panelArm);

      const panelWing = new THREE.Mesh(
        new THREE.BoxGeometry(10, 0.15, 3.8),
        new THREE.MeshStandardMaterial({
          map: solarTexture,
          metalness: 0.9,
          roughness: 0.2,
        })
      );
      panelWing.position.set(side * 10.5, 0, 1.5);
      shipGroup.add(panelWing);
    });

    // Main Engine Bell Nozzle with Tungsten Core
    const engineBell = new THREE.Mesh(
      new THREE.CylinderGeometry(1.2, 1.8, 2.5, 24, 1, true),
      new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        metalness: 0.98,
        roughness: 0.2,
      })
    );
    engineBell.rotation.x = Math.PI / 2;
    engineBell.position.set(0, 0, 8.2);
    shipGroup.add(engineBell);

    // Supersonic Mach Shock Diamonds Rocket Flame Plume
    const flameGroup = new THREE.Group();
    flameGroup.position.set(0, 0, 9.5);

    // Outer plasma expansion plume
    const outerFlameMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });
    const outerFlame = new THREE.Mesh(new THREE.ConeGeometry(1.4, 12, 24), outerFlameMat);
    outerFlame.rotation.x = -Math.PI / 2;
    outerFlame.position.set(0, 0, 6);
    flameGroup.add(outerFlame);

    // Inner bright white core
    const innerFlameMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
    });
    const innerFlame = new THREE.Mesh(new THREE.ConeGeometry(0.7, 7, 16), innerFlameMat);
    innerFlame.rotation.x = -Math.PI / 2;
    innerFlame.position.set(0, 0, 3.5);
    flameGroup.add(innerFlame);

    // 3 Mach Shock Diamond Rings
    const diamonds: THREE.Mesh[] = [];
    [2.2, 4.5, 6.8].forEach((zPos) => {
      const dGeo = new THREE.OctahedronGeometry(0.45, 0);
      const dMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        blending: THREE.AdditiveBlending,
      });
      const dMesh = new THREE.Mesh(dGeo, dMat);
      dMesh.position.set(0, 0, zPos);
      flameGroup.add(dMesh);
      diamonds.push(dMesh);
    });

    shipGroup.add(flameGroup);

    // Dynamic Engine Lighting
    const shipLight = new THREE.PointLight(0x38bdf8, 4.5, 50);
    shipLight.position.set(0, 0, 10);
    shipGroup.add(shipLight);

    shipGroup.position.set(-28, 4, 18);
    shipGroup.rotation.set(0.1, 0.45, -0.15);
    scene.add(shipGroup);

    // ── 5. SCENE LIGHTING (KEY & AMBIENT) ──
    const sunLight = new THREE.DirectionalLight(0xffffff, 2.6);
    sunLight.position.set(150, 90, 60);
    scene.add(sunLight);

    const ambientLight = new THREE.AmbientLight(0x1e293b, 0.8);
    scene.add(ambientLight);

    // ── 6. CINEMATIC MOVIE CAMERA ANIMATION LOOP ──
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Planet gentle axial rotation
      planetMesh.rotation.y += 0.0022;

      // Climax state sync
      const isClimax = isClimaxRef.current;
      if (isClimax && climaxStartTimeRef.current === null) {
        climaxStartTimeRef.current = elapsed;
      }
      const climaxT = climaxStartTimeRef.current !== null ? elapsed - climaxStartTimeRef.current : 0;

      // Rocket flame pulsation & shock diamond jitter
      const pulseRate = isClimax ? 45 : 25;
      const pulseScale = isClimax ? 1.55 : 1.0;
      const pulse = (1 + Math.sin(elapsed * pulseRate) * 0.12) * pulseScale;
      outerFlame.scale.set(pulse, (1 + Math.cos(elapsed * 30) * 0.08 + (isClimax ? climaxT * 0.9 : 0)) * pulseScale, pulse);
      innerFlame.scale.set(pulse, (1 + Math.sin(elapsed * 28) * 0.1 + (isClimax ? climaxT * 0.7 : 0)) * pulseScale, pulse);
      diamonds.forEach((d, idx) => {
        d.scale.setScalar((1 + Math.sin(elapsed * 35 + idx) * 0.2) * (isClimax ? 1.75 : 1.0));
      });

      // Stardust drift & warp speed in climax
      const dustAttr = dustGeo.attributes.position as THREE.BufferAttribute;
      const driftSpeed = isClimax ? 2.8 + climaxT * 3.0 : 0.35;
      for (let i = 2; i < dustCount * 3; i += 3) {
        dustAttr.array[i] += driftSpeed;
        if (dustAttr.array[i] > 100) {
          dustAttr.array[i] = -120;
        }
      }
      dustAttr.needsUpdate = true;

      // ── CINEMATIC CAMERA & SHIP CHOREOGRAPHY ──
      if (isClimax) {
        // PHASE 4: CLIMAX HYPERSPACE INGRESS
        shipGroup.position.z -= (0.42 + climaxT * 0.65);
        shipLight.intensity = 8.5 + Math.sin(elapsed * 45) * 2.5;

        // Camera smoothly surges into the cockpit view
        camera.position.lerp(
          new THREE.Vector3(shipGroup.position.x, shipGroup.position.y + 2.2, shipGroup.position.z + 10),
          0.06
        );
        camera.lookAt(planetGroup.position);
      } else if (elapsed < 6.0) {
        // PHASE 1: ORBIT APPROACH (Wide cinematic sweep of planet)
        camera.position.x = 8 + Math.cos(elapsed * 0.32) * 14;
        camera.position.y = 12 + Math.sin(elapsed * 0.22) * 4;
        camera.position.z = 65 - elapsed * 2.0;
        camera.lookAt(planetGroup.position.x * 0.3, planetGroup.position.y * 0.3, planetGroup.position.z * 0.3);

        shipGroup.position.x = -24 + elapsed * 1.6;
        shipGroup.position.y = 5 + Math.sin(elapsed * 1.5) * 0.4;
        shipGroup.position.z = 22 - elapsed * 0.8;
      } else if (elapsed < 13.0) {
        // PHASE 2: SPACECRAFT FLYBY (Dramatic camera pan across ship hull)
        const t2 = elapsed - 6.0;
        shipGroup.position.x = -14.4 + t2 * 3.2;
        shipGroup.position.y = 4.5 + Math.sin(t2 * 1.1) * 0.6;
        shipGroup.position.z = 17.2 - t2 * 1.4;
        shipGroup.rotation.z = -0.15 + Math.sin(t2 * 0.7) * 0.14;

        camera.position.x = shipGroup.position.x * 0.45 + 11;
        camera.position.y = 8 + Math.sin(elapsed * 0.45) * 1.8;
        camera.position.z = 42;
        camera.lookAt(shipGroup.position.x, shipGroup.position.y, shipGroup.position.z);
      } else {
        // PHASE 3: FINAL BURN (Camera settles into cockpit trajectory)
        const t3 = elapsed - 13.0;
        shipGroup.position.x = 8.0 + Math.sin(t3 * 0.4) * 0.6;
        shipGroup.position.y = 4.0 + Math.cos(t3 * 0.5) * 0.3;
        shipGroup.position.z = 7.4 - t3 * 0.5;
        shipGroup.rotation.set(0.08, 0.15, 0);

        camera.position.lerp(new THREE.Vector3(shipGroup.position.x, shipGroup.position.y + 4.2, shipGroup.position.z + 18), 0.06);
        camera.lookAt(planetGroup.position);

        shipLight.intensity = 5.5 + Math.sin(elapsed * 35) * 1.2;
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!canvas) return;
      const parent = canvas.parentElement;
      const w = parent && parent.clientWidth > 0 ? parent.clientWidth : window.innerWidth;
      const h = parent && parent.clientHeight > 0 ? parent.clientHeight : window.innerHeight;
      if (w <= 0 || h <= 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };

    handleResize();
    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
      disposeThreeScene(renderer, scene);
    };
  }, [map]);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 50,
        background: '#020617',
        color: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      {/* 3D WebGL Canvas */}
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />

      {/* ── 21:9 CINEMATIC LETTERBOX BARS (ANAMORPHIC MOVIE LOOK) ── */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '52px',
          background: 'linear-gradient(180deg, rgba(2, 6, 23, 0.96) 0%, rgba(2, 6, 23, 0.7) 70%, transparent 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 28px',
          zIndex: 10,
          pointerEvents: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Film size={18} color="#38bdf8" />
          <span style={{ fontSize: '11px', fontWeight: 900, letterSpacing: '0.15em', color: '#94a3b8' }}>
            NASA ARTEMIS CINEMATIC TRAILER · 21:9 SCOPE
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', pointerEvents: 'auto' }}>
          <button
            onClick={triggerLaunch}
            style={{
              background: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid rgba(56, 189, 248, 0.6)',
              color: '#38bdf8',
              borderRadius: '8px',
              padding: '6px 14px',
              fontSize: '11px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease',
            }}
            title="Skip Intro Trailer and Fly Immediately"
          >
            <FastForward size={13} />
            <span>SKIP INTRO ➔ 3D</span>
          </button>

          <button
            onClick={onToggleMute}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: isMuted ? '#f87171' : '#38bdf8',
              borderRadius: '8px',
              padding: '6px 12px',
              fontSize: '11px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
            <span>{isMuted ? 'UNMUTE AUDIO' : 'AUDIO ON'}</span>
          </button>

          <button
            onClick={onBackToHub}
            style={{
              background: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#fca5a5',
              borderRadius: '8px',
              padding: '6px 14px',
              fontSize: '11px',
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            ✕ EXIT
          </button>
        </div>
      </div>

      {/* ── TOP MISSION TITLE & CINEMATIC SLATE ── */}
      <div
        style={{
          position: 'absolute',
          top: '56px',
          left: '28px',
          zIndex: 10,
          pointerEvents: 'none',
          textShadow: '0 2px 16px rgba(0,0,0,0.85)',
          maxWidth: 'calc(100% - 56px)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
          <span
            style={{
              fontSize: '10px',
              fontWeight: 900,
              letterSpacing: '0.1em',
              background: 'rgba(56, 189, 248, 0.2)',
              border: '1px solid #38bdf8',
              color: '#38bdf8',
              padding: '2px 8px',
              borderRadius: '10px',
            }}
          >
            MISSION #{mission.missionNumber.toString().padStart(2, '0')} · {mission.tier} LEVEL
          </span>
          <span
            style={{
              fontSize: '10.5px',
              color: isClimaxIgnition ? '#4ade80' : '#fbbf24',
              fontWeight: 800,
              letterSpacing: '0.05em',
            }}
          >
            {trailerPhase === 'ORBIT_APPROACH'
              ? 'PHASE 1: ORBIT INGRESS'
              : trailerPhase === 'SPACECRAFT_FLYBY'
              ? 'PHASE 2: VEHICLE FLYBY'
              : trailerPhase === 'FINAL_BURN'
              ? 'PHASE 3: TRAJECTORY ALIGNMENT'
              : 'PHASE 4: HYPERSPACE ENTRY'}
          </span>
        </div>

        <h1
          style={{
            fontSize: 'clamp(20px, 2.3vw, 28px)',
            fontWeight: 900,
            letterSpacing: '0.02em',
            margin: '0 0 2px 0',
            lineHeight: '1.2',
            background: 'linear-gradient(180deg, #ffffff 0%, #cbd5e1 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          {mission.title}
        </h1>
        <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>
          {map.name} · {map.destination}
        </div>
      </div>

      {/* ── TELEMETRY FLIGHT CARDS (LEFT & RIGHT) ── */}
      <div
        style={{
          position: 'absolute',
          top: '136px',
          left: '28px',
          right: '28px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          pointerEvents: 'none',
          zIndex: 10,
          gap: '16px',
        }}
      >
        {/* Left: Planetary Destination Card */}
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.85)',
            border: `1.5px solid ${map.accentColor}55`,
            borderRadius: '12px',
            padding: '12px 16px',
            maxWidth: '310px',
            backdropFilter: 'blur(12px)',
            boxShadow: `0 8px 32px rgba(0,0,0,0.6), 0 0 20px ${map.accentColor}22`,
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            maxHeight: 'calc(100vh - 245px)',
            overflowY: 'auto',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '9.5px', fontWeight: 900, color: map.accentColor, letterSpacing: '0.08em' }}>
              TARGET DESTINATION
            </span>
            <span style={{ fontSize: '9px', color: '#cbd5e1', background: 'rgba(255,255,255,0.08)', padding: '2px 5px', borderRadius: '4px' }}>
              {map.badge}
            </span>
          </div>

          <div style={{ fontSize: '15px', fontWeight: 900, color: '#f8fafc' }}>{map.name}</div>
          <div
            style={{
              fontSize: '11px',
              color: '#cbd5e1',
              lineHeight: '1.35',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {map.description}
          </div>

          <div style={{ display: 'flex', gap: '6px', marginTop: '2px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '9.5px', background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: '4px', color: '#38bdf8' }}>
              Gravity: {map.gravityLabel}
            </span>
            <span style={{ fontSize: '9.5px', background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: '4px', color: '#fbbf24' }}>
              Pressure: {map.atmospherePressure}
            </span>
          </div>
        </div>

        {/* Right: Spacecraft & Directives Card */}
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.85)',
            border: '1.5px solid rgba(56, 189, 248, 0.35)',
            borderRadius: '12px',
            padding: '12px 16px',
            maxWidth: '330px',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            maxHeight: 'calc(100vh - 245px)',
            overflowY: 'auto',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '9.5px', fontWeight: 900, color: '#38bdf8', letterSpacing: '0.08em' }}>
              SPACECRAFT VEHICLE
            </span>
            <span style={{ fontSize: '9px', color: '#cbd5e1', background: 'rgba(255,255,255,0.08)', padding: '2px 5px', borderRadius: '4px' }}>
              {vehicle.category}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px' }}>{vehicle.icon}</span>
            <div style={{ fontSize: '14px', fontWeight: 900, color: '#f8fafc' }}>{vehicle.name}</div>
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '6px' }}>
            <div style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 800, marginBottom: '3px' }}>
              PRIMARY FLIGHT OBJECTIVES:
            </div>
            {mission.objectives.slice(0, 2).map((obj, idx) => (
              <div
                key={idx}
                style={{
                  fontSize: '10.5px',
                  color: '#cbd5e1',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  marginBottom: '2px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                <CheckCircle2 size={11} color="#38bdf8" style={{ flexShrink: 0 }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{obj}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── BOTTOM CINEMATIC HUD, LIVE SUBTITLES & LAUNCH TRIGGER ── */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '12px 28px',
          background: 'linear-gradient(0deg, rgba(2, 6, 23, 0.98) 0%, rgba(2, 6, 23, 0.9) 80%, transparent 100%)',
          borderTop: '1px solid rgba(56, 189, 248, 0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '20px',
          zIndex: 20,
        }}
      >
        {/* Left: CapCom Voiceover Subtitles */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '9px',
              background: 'linear-gradient(135deg, #0284c7, #0369a1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 16px rgba(56, 189, 248, 0.4)',
              flexShrink: 0,
            }}
          >
            <Radio size={18} color="#fff" />
          </div>

          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
              <span style={{ fontSize: '9.5px', fontWeight: 900, color: '#38bdf8', letterSpacing: '0.08em' }}>
                HOUSTON CAPCOM · LIVE RADIO TELEMETRY
              </span>
              <span
                style={{
                  fontSize: '8.5px',
                  fontWeight: 800,
                  background: isClimaxIgnition
                    ? 'rgba(245, 158, 11, 0.25)'
                    : isVoiceSpeaking
                    ? 'rgba(34, 197, 94, 0.2)'
                    : 'rgba(56, 189, 248, 0.2)',
                  color: isClimaxIgnition ? '#fbbf24' : isVoiceSpeaking ? '#4ade80' : '#38bdf8',
                  padding: '2px 7px',
                  borderRadius: '8px',
                  border: isClimaxIgnition
                    ? '1px solid #fbbf24'
                    : isVoiceSpeaking
                    ? '1px solid #4ade80'
                    : '1px solid #38bdf8',
                  letterSpacing: '0.04em',
                }}
              >
                {isClimaxIgnition ? '🔥 MAXIMUM OVERDRIVE' : isVoiceSpeaking ? '🎙️ TRANSMITTING' : '✅ DIRECTIVE NOMINAL'}
              </span>
            </div>

            <div
              style={{
                fontSize: '12.5px',
                color: '#f8fafc',
                fontWeight: 600,
                lineHeight: '1.35',
                minHeight: '34px',
                maxHeight: '38px',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textShadow: '0 1px 8px rgba(0,0,0,0.9)',
              }}
            >
              "{typedCaption}"
              <span
                style={{
                  display: 'inline-block',
                  color: isClimaxIgnition ? '#fbbf24' : '#38bdf8',
                  fontWeight: 900,
                  marginLeft: '4px',
                  animation: 'pulse 0.8s infinite',
                }}
              >
                ●
              </span>
            </div>
          </div>
        </div>

        {/* Right: Trailer Scrubber & Big Launch Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '9.5px', color: '#94a3b8', fontWeight: 800 }}>
              {isClimaxIgnition ? 'COCKPIT INGRESS' : 'TRAILER STATUS'}
            </div>
            <div
              style={{
                fontSize: '16px',
                fontWeight: 900,
                color: isClimaxIgnition ? '#4ade80' : '#fbbf24',
                letterSpacing: '0.05em',
              }}
            >
              {isClimaxIgnition ? `T-${countdown.toString().padStart(2, '0')}s WARP` : `T-${countdown.toString().padStart(2, '0')}s`}
            </div>
          </div>

          <button
            onClick={triggerLaunch}
            style={{
              background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 50%, #7c3aed 100%)',
              border: '1.5px solid #38bdf8',
              color: '#ffffff',
              padding: '11px 22px',
              borderRadius: '11px',
              fontSize: '12.5px',
              fontWeight: 900,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 0 24px rgba(56, 189, 248, 0.55)',
              transition: 'all 0.2s ease',
              letterSpacing: '0.04em',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.03)';
              e.currentTarget.style.boxShadow = '0 0 32px rgba(56, 189, 248, 0.85)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1.0)';
              e.currentTarget.style.boxShadow = '0 0 24px rgba(56, 189, 248, 0.55)';
            }}
          >
            <Rocket size={16} />
            <span>ENTER COCKPIT &amp; LAUNCH GAME ➔</span>
          </button>
        </div>
      </div>

      {/* ── CINEMATIC HYPERSPACE OPTICAL FLASH ON COCKPIT TRANSITION ── */}
      {isTransitioning && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 100,
            background:
              'radial-gradient(circle at center, rgba(255,255,255,0.98) 0%, rgba(56,189,248,0.88) 45%, rgba(2,6,23,0.98) 90%)',
            pointerEvents: 'none',
            transition: 'opacity 0.65s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        />
      )}
    </div>
  );
};
