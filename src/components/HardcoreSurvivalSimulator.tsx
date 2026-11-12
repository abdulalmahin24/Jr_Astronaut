// ============================================================================
// HardcoreSurvivalSimulator.tsx — 3D Spaceflight & Orbital Rocket Simulator
// Full Newtonian Gravity, Keplerian Calculations, Real-Time Trajectory,
// Dynamic Camera Shake, Glassmorphic Mission Selector & HUD
// References: benjamin-awd/solar-system-threejs, jakerunzer/space-flight
// ============================================================================

import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import confetti from 'canvas-confetti';
import {
  X,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
  ShieldAlert,
  ShieldCheck,
  Flame,
  Radio,
  ExternalLink,
  Camera,
  CheckCircle2,
  AlertTriangle,
  Award,
  Zap,
  Gauge,
  Compass,
} from 'lucide-react';
import {
  HARDCORE_SURVIVAL_MISSIONS,
  CELESTIAL_BODIES,
  computeKeplerianElements,
  calculateSuicideBurnAltitude,
  generateOrbitalDebrisField,
  createInitialTelemetry,
  type HardcoreMissionId,
  type HardcoreMissionConfig,
  type HardcoreTelemetryState,
  type DebrisObject,
} from '../missions/survivalMissions';
import { soundFx } from '../utils/audioEffects';
import { awardCadetCredits } from '../utils/gearBonusHelper';
import { disposeThreeScene } from '../utils/threeDisposeHelper';
import { NasaDataModal } from './NasaDataModal';

interface HardcoreSurvivalSimulatorProps {
  initialMissionId?: HardcoreMissionId;
  onClose: () => void;
  onMissionCompleted?: (missionId: HardcoreMissionId, credits: number) => void;
}

export const HardcoreSurvivalSimulator: React.FC<HardcoreSurvivalSimulatorProps> = ({
  initialMissionId = 'suborbital-pioneer',
  onClose,
  onMissionCompleted,
}) => {
  const [selectedMissionId, setSelectedMissionId] = useState<HardcoreMissionId>(initialMissionId);
  const activeMission = HARDCORE_SURVIVAL_MISSIONS.find((m) => m.id === selectedMissionId) || HARDCORE_SURVIVAL_MISSIONS[0];

  const [telemetry, setTelemetry] = useState<HardcoreTelemetryState>(() => createInitialTelemetry(activeMission));
  const [isPaused, setIsPaused] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [cameraMode, setCameraMode] = useState<'orbit' | 'chase' | 'cockpit'>('chase');
  const [isNasaModalOpen, setIsNasaModalOpen] = useState(false);

  const mountRef = useRef<HTMLDivElement>(null);
  const debrisFieldRef = useRef<DebrisObject[]>([]);
  const debrisMeshesRef = useRef<THREE.Mesh[]>([]);

  // Simulation physics state mutable refs for 60fps Three.js loop
  const physStateRef = useRef({
    time: 0,
    rKm: 0,
    altKm: 0,
    vKms: 0,
    vyKms: 0,
    vxKms: 0,
    pitchRad: 0,
    yawRad: 0,
    orbitalTheta: 0,
    invulnTimer: 0,
    throttle: 0,
    fuel: 100,
    hull: 100,
    fuelLeak: false,
    engineHeat: 20,
    overheatCooldown: 0,
    heatShield: 100,
    countdownTimer: 300,
    shakeIntensity: 0,
    maxAltitudeKm: 0,
    outcome: 'IN_PROGRESS' as 'IN_PROGRESS' | 'SUCCESS' | 'FAILED',
    failureReason: '',
    successMessage: '',
  });

  // Reset physics state whenever active mission changes
  const resetMission = useCallback((mission: HardcoreMissionConfig) => {
    const init = createInitialTelemetry(mission);
    setTelemetry(init);
    setIsPaused(false);

    const body = CELESTIAL_BODIES[mission.targetBody];
    const rKm = body.radiusKm + mission.initialAltitudeKm;

    physStateRef.current = {
      time: 0,
      rKm,
      altKm: mission.initialAltitudeKm,
      vKms: mission.initialVelocityKms,
      vyKms: mission.initialVerticalSpeedKms,
      vxKms: Math.sqrt(Math.max(0, mission.initialVelocityKms ** 2 - mission.initialVerticalSpeedKms ** 2)),
      pitchRad: (mission.initialPitchDeg * Math.PI) / 180,
      yawRad: 0,
      orbitalTheta: 0,
      invulnTimer: 0,
      throttle: 0,
      fuel: mission.initialFuelPct,
      hull: 100,
      fuelLeak: false,
      engineHeat: 20,
      overheatCooldown: 0,
      heatShield: 100,
      countdownTimer: mission.hasCountdownTimer ? mission.countdownDurationSec : 300,
      shakeIntensity: 0,
      maxAltitudeKm: mission.initialAltitudeKm,
      outcome: 'IN_PROGRESS',
      failureReason: '',
      successMessage: '',
    };

    if (mission.hasDebrisField) {
      debrisFieldRef.current = generateOrbitalDebrisField(110, body.radiusKm);
    } else {
      debrisFieldRef.current = [];
    }

    if (soundEnabled) soundFx.playReactorStart();
  }, [soundEnabled]);

  useEffect(() => {
    resetMission(activeMission);
  }, [activeMission, resetMission]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (physStateRef.current.outcome !== 'IN_PROGRESS') return;

      const key = e.key.toLowerCase();
      if (key === 'w') {
        if (!activeMission.mainEngineAvailable) return;
        physStateRef.current.throttle = Math.min(100, physStateRef.current.throttle + 10);
        setTelemetry((prev) => ({ ...prev, throttlePct: physStateRef.current.throttle }));
      } else if (key === 's') {
        physStateRef.current.throttle = Math.max(0, physStateRef.current.throttle - 10);
        setTelemetry((prev) => ({ ...prev, throttlePct: physStateRef.current.throttle }));
      } else if (key === 'z') {
        if (activeMission.mainEngineAvailable && physStateRef.current.overheatCooldown <= 0) {
          physStateRef.current.throttle = 100;
          setTelemetry((prev) => ({ ...prev, throttlePct: 100 }));
        }
      } else if (key === 'x') {
        physStateRef.current.throttle = 0;
        setTelemetry((prev) => ({ ...prev, throttlePct: 0 }));
      } else if (key === 'a') {
        physStateRef.current.pitchRad += 0.05;
        setTelemetry((prev) => ({ ...prev, pitchDeg: (physStateRef.current.pitchRad * 180) / Math.PI }));
      } else if (key === 'd') {
        physStateRef.current.pitchRad -= 0.05;
        setTelemetry((prev) => ({ ...prev, pitchDeg: (physStateRef.current.pitchRad * 180) / Math.PI }));
      } else if (key === ' ' || e.code === 'Space') {
        // RCS Pulse
        e.preventDefault();
        if (activeMission.rcsOnly) {
          physStateRef.current.pitchRad += 0.04;
          physStateRef.current.vxKms += 0.06;
          physStateRef.current.countdownTimer = Math.max(0, physStateRef.current.countdownTimer - 1.2);
          if (soundEnabled) soundFx.playThruster();
        }
      } else if (key === 'c') {
        setCameraMode((prev) => (prev === 'orbit' ? 'chase' : prev === 'chase' ? 'cockpit' : 'orbit'));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeMission, soundEnabled]);

  // ============================================================================
  // Three.js 3D Aerospace Engine Mounting Loop
  // ============================================================================
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x02040a, 0.0003);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 10000);
    camera.position.set(0, 5, 22);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 2. Lighting
    const sunLight = new THREE.DirectionalLight(0xffffff, 2.2);
    sunLight.position.set(200, 150, 300);
    scene.add(sunLight);

    const ambientLight = new THREE.AmbientLight(0x1e293b, 0.8);
    scene.add(ambientLight);

    const exhaustLight = new THREE.PointLight(0xf97316, 0, 50);
    scene.add(exhaustLight);

    // 3. Deep Space Starfield
    const starsGeo = new THREE.BufferGeometry();
    const starCount = 2500;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starPositions[i] = (Math.random() - 0.5) * 4000;
      starPositions[i + 1] = (Math.random() - 0.5) * 4000;
      starPositions[i + 2] = (Math.random() - 0.5) * 4000;
    }
    starsGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starsMat = new THREE.PointsMaterial({ color: 0xffffff, size: 1.8, transparent: true, opacity: 0.85 });
    const starField = new THREE.Points(starsGeo, starsMat);
    scene.add(starField);

    // 4. Central Celestial Body Mesh
    const bodyConfig = CELESTIAL_BODIES[activeMission.targetBody];
    const bodyRadiusScale = 12; // Scaled for 3D viewport
    const bodyGeo = new THREE.SphereGeometry(bodyRadiusScale, 64, 64);

    let bodyMat: THREE.Material;
    if (activeMission.targetBody === 'EARTH') {
      bodyMat = new THREE.MeshStandardMaterial({
        color: 0x1d4ed8,
        roughness: 0.6,
        metalness: 0.1,
        emissive: 0x0a192f,
        emissiveIntensity: 0.2,
      });
    } else if (activeMission.targetBody === 'MOON') {
      bodyMat = new THREE.MeshStandardMaterial({
        color: 0x94a3b8,
        roughness: 0.9,
        metalness: 0.05,
      });
    } else {
      // GAS GIANT (Striped Jovian atmosphere)
      bodyMat = new THREE.MeshStandardMaterial({
        color: 0xd97706,
        roughness: 0.7,
        metalness: 0.1,
        emissive: 0x451a03,
        emissiveIntensity: 0.3,
      });
    }

    const planetMesh = new THREE.Mesh(bodyGeo, bodyMat);
    planetMesh.position.set(0, -bodyRadiusScale - 10, -30);
    scene.add(planetMesh);

    // Atmosphere Glow Mesh
    if (bodyConfig.atmosphereHeightKm > 0) {
      const atmoGeo = new THREE.SphereGeometry(bodyRadiusScale * 1.035, 48, 48);
      const atmoMat = new THREE.MeshBasicMaterial({
        color: activeMission.targetBody === 'GAS_GIANT' ? 0xf59e0b : 0x38bdf8,
        transparent: true,
        opacity: 0.25,
        side: THREE.BackSide,
      });
      const atmoMesh = new THREE.Mesh(atmoGeo, atmoMat);
      planetMesh.add(atmoMesh);
    }

    // 5. 3D Spacecraft Group
    const shipGroup = new THREE.Group();

    // Command Module (Cone)
    const cmGeo = new THREE.ConeGeometry(0.7, 1.4, 16);
    const cmMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.8, roughness: 0.2 });
    const cmMesh = new THREE.Mesh(cmGeo, cmMat);
    cmMesh.position.y = 1.0;
    shipGroup.add(cmMesh);

    // Service Module (Cylinder)
    const smGeo = new THREE.CylinderGeometry(0.7, 0.7, 1.8, 16);
    const smMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.4, roughness: 0.4 });
    const smMesh = new THREE.Mesh(smGeo, smMat);
    smMesh.position.y = -0.4;
    shipGroup.add(smMesh);

    // Engine Bell
    const bellGeo = new THREE.CylinderGeometry(0.25, 0.55, 0.6, 16);
    const bellMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.9, roughness: 0.1 });
    const bellMesh = new THREE.Mesh(bellGeo, bellMat);
    bellMesh.position.y = -1.6;
    shipGroup.add(bellMesh);

    // Fiery Engine Plume
    const plumeGeo = new THREE.ConeGeometry(0.45, 2.4, 16);
    const plumeMat = new THREE.MeshBasicMaterial({ color: 0xf97316, transparent: true, opacity: 0 });
    const plumeMesh = new THREE.Mesh(plumeGeo, plumeMat);
    plumeMesh.rotation.x = Math.PI;
    plumeMesh.position.y = -3.0;
    shipGroup.add(plumeMesh);

    scene.add(shipGroup);

    // 6. Orbital Trajectory Prediction Line
    const trajectoryPoints = 120;
    const trajPositions = new Float32Array(trajectoryPoints * 3);
    const trajGeo = new THREE.BufferGeometry();
    trajGeo.setAttribute('position', new THREE.BufferAttribute(trajPositions, 3));
    const trajMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: activeMission.hideTrajectoryLine ? 0 : 0.7,
      linewidth: 2,
    });
    const trajLine = new THREE.Line(trajGeo, trajMat);
    scene.add(trajLine);

    // 7. Debris Meshes for Kessler Syndrome
    debrisMeshesRef.current = [];
    if (activeMission.hasDebrisField) {
      const debMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
      for (let i = 0; i < 70; i++) {
        const dGeo = new THREE.DodecahedronGeometry(0.25 + Math.random() * 0.4);
        const dMesh = new THREE.Mesh(dGeo, debMat);
        scene.add(dMesh);
        debrisMeshesRef.current.push(dMesh);
      }
    }

    // 8. 60FPS Physics Simulation & Render Loop
    let animId: number;
    let lastTime = performance.now();
    let lastHudTime = 0;

    const renderLoop = () => {
      animId = requestAnimationFrame(renderLoop);
      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.05); // cap delta-time
      lastTime = now;

      const p = physStateRef.current;

      if (!isPaused && p.outcome === 'IN_PROGRESS') {
        p.time += dt;

        // Gravity acceleration a_g = -mu / r^2
        const mu = bodyConfig.mu;
        const rKm = p.rKm;
        const gravAccelKms2 = mu / (rKm * rKm);

        // Throttle & Fuel physics
        let effectiveThrottle = p.throttle;
        if (!activeMission.mainEngineAvailable) effectiveThrottle = 0;
        if (p.fuel <= 0) effectiveThrottle = 0;

        // Engine Overheat check for Mission 2 (Solar Storm)
        if (activeMission.hasEngineHeat) {
          if (p.throttle > 80) {
            p.engineHeat = Math.min(100, p.engineHeat + (p.throttle / 100) * 18 * dt);
          } else {
            p.engineHeat = Math.max(15, p.engineHeat - 12 * dt);
          }

          if (p.engineHeat >= 100 && p.overheatCooldown <= 0) {
            p.overheatCooldown = 8.0; // 8 seconds lock
            p.throttle = 0;
            if (soundEnabled) soundFx.playWarningAlarm();
          }

          if (p.overheatCooldown > 0) {
            p.overheatCooldown -= dt;
            effectiveThrottle = 0;
          }
        }

        // Fuel consumption: 0.18%/s at 100% throttle + leak
        const burnRate = (effectiveThrottle / 100) * 0.22 * dt;
        const leakRate = p.fuelLeak ? 0.75 * dt : 0;
        p.fuel = Math.max(0, p.fuel - burnRate - leakRate);

        // Countdown timer for Mission 3 (Apollo 13)
        if (activeMission.hasCountdownTimer) {
          p.countdownTimer = Math.max(0, p.countdownTimer - dt);
          if (p.countdownTimer <= 0) {
            p.outcome = 'FAILED';
            p.failureReason = 'CRITICAL ECLSS FAILURE: OXYGEN & BATTERY DEPLETED BEFORE RE-ENTRY INTERFACE';
            if (soundEnabled) soundFx.playAlarm();
          }
        }

        // Heat shield ablation for Mission 4 (Oberth Slingshot)
        if (activeMission.hasHeatShield) {
          if (p.altKm < 3500) {
            const meltRate = ((3500 - p.altKm) / 3500) * 14 * dt;
            p.heatShield = Math.max(0, p.heatShield - meltRate);
            p.shakeIntensity = Math.min(1.0, (100 - p.heatShield) / 70);

            if (p.heatShield <= 0) {
              p.outcome = 'FAILED';
              p.failureReason = 'HEAT SHIELD ABLATED TO 0% — SPACECRAFT VAPORIZED IN UPPER ATMOSPHERE';
              if (soundEnabled) soundFx.playExplosion();
            }
          }
        }

        // Thrust force: ~0.035 km/s^2 at max
        const thrustAccelKms2 = (effectiveThrottle / 100) * (activeMission.id === 'suicide-burn' ? 0.0285 : 0.038);

        // Vector updates
        const thrustY = thrustAccelKms2 * Math.sin(p.pitchRad);
        const thrustX = thrustAccelKms2 * Math.cos(p.pitchRad);

        // Realistic Newtonian gravity + Centrifugal & Coriolis orbital acceleration
        const centrifugalKms2 = (p.vxKms * p.vxKms) / Math.max(10, rKm);
        const coriolisKms2 = (p.vxKms * p.vyKms) / Math.max(10, rKm);

        p.vyKms += (thrustY - gravAccelKms2 + centrifugalKms2) * dt;
        p.vxKms += (thrustX - coriolisKms2) * dt;

        p.altKm += p.vyKms * dt;
        p.maxAltitudeKm = Math.max(p.maxAltitudeKm || 0, p.altKm);
        p.rKm = bodyConfig.radiusKm + p.altKm;
        p.vKms = Math.sqrt(p.vyKms * p.vyKms + p.vxKms * p.vxKms);

        // Orbital angular position for 3D navigation
        p.orbitalTheta = (p.orbitalTheta || 0) + (p.vxKms / Math.max(100, p.rKm)) * dt;

        // Ground crash check (except landing missions which handle their own touchdown)
        const isLandingMission = activeMission.id === 'suicide-burn' || activeMission.id === 'lunar-voyager' || activeMission.id === 'mars-voyager';
        if (p.altKm <= 0 && !isLandingMission) {
          p.altKm = 0;
          p.outcome = 'FAILED';
          p.failureReason = 'CRASH IMPACT: Spacecraft crashed into the planetary surface.';
          if (soundEnabled) soundFx.playExplosion();
        }

        // Keplerian orbit elements computation
        const kepler = computeKeplerianElements(p.rKm, p.vKms, p.vyKms, bodyConfig);

        // Camera shake computation
        if (effectiveThrottle > 85) {
          p.shakeIntensity = Math.max(p.shakeIntensity, (effectiveThrottle / 100) * 0.4);
        } else {
          p.shakeIntensity = Math.max(0, p.shakeIntensity - 1.2 * dt);
        }

        // Debris collision physics for Mission 1 (Kessler Syndrome)
        if (p.invulnTimer > 0) p.invulnTimer -= dt;
        if (activeMission.hasDebrisField && debrisFieldRef.current.length > 0) {
          const px = p.rKm * Math.cos(p.orbitalTheta);
          const pz = p.rKm * Math.sin(p.orbitalTheta);
          const py = 0;

          for (const d of debrisFieldRef.current) {
            d.x += d.vx * dt;
            d.y += d.vy * dt;
            d.z += d.vz * dt;

            const dx = d.x - px;
            const dy = d.y - py;
            const dz = d.z - pz;
            const distKm = Math.sqrt(dx * dx + dy * dy + dz * dz);
            if (distKm < 0.12 && p.invulnTimer <= 0) {
              // Collision!
              p.hull = Math.max(0, p.hull - 18);
              p.fuelLeak = true;
              p.invulnTimer = 2.0; // 2 seconds invulnerability grace period
              p.shakeIntensity = 1.0;
              if (soundEnabled) soundFx.playImpact();
              d.x += 200; // disperse collided debris
              break;
            }
          }

          if (p.hull <= 0) {
            p.outcome = 'FAILED';
            p.failureReason = 'CATASTROPHIC HULL BREACH: SHIP DESTROYED BY HIGH-VELOCITY SPACE DEBRIS IMPACTS';
            if (soundEnabled) soundFx.playExplosion();
          }
        }

        // Suicide Burn calculation for Mission 5
        let suicideBurnAltM = 0;
        let suicideIgnitionRequired = false;
        if (activeMission.id === 'suicide-burn') {
          const suicideCalc = calculateSuicideBurnAltitude(p.vyKms * 1000, 28.5, 1.62);
          suicideBurnAltM = suicideCalc.suicideBurnDistanceM;
          const currentAltM = p.altKm * 1000;
          if (currentAltM <= suicideBurnAltM * 1.05 && currentAltM > 5) {
            suicideIgnitionRequired = true;
          }

          // Touchdown check
          if (p.altKm <= 0.002) {
            p.altKm = 0;
            const impactSpeedMs = Math.abs(p.vyKms * 1000);
            const horizSpeedMs = Math.abs(p.vxKms * 1000);

            if (impactSpeedMs <= 3.0 && horizSpeedMs <= 1.0) {
              p.outcome = 'SUCCESS';
              p.successMessage = `PINPOINT SUICIDE BURN SUCCESSFUL! Touchdown speed: ${impactSpeedMs.toFixed(1)} m/s (Remaining Fuel: ${p.fuel.toFixed(1)}%)`;
            } else if (impactSpeedMs > 3.0) {
              p.outcome = 'FAILED';
              p.failureReason = `HARD IMPACT CRASH: Touchdown vertical speed was ${impactSpeedMs.toFixed(1)} m/s (Structural limit is 3.0 m/s)`;
              if (soundEnabled) soundFx.playExplosion();
            } else {
              p.outcome = 'FAILED';
              p.failureReason = `LANDER TIPPED: Horizontal drift was ${horizSpeedMs.toFixed(1)} m/s (Limit: 1.0 m/s)`;
              if (soundEnabled) soundFx.playExplosion();
            }
          }
        }

        // Mission 1 Win Condition: Sub-Orbital Pioneer (Kármán 100 km Boundary)
        if (activeMission.id === 'suborbital-pioneer') {
          if (p.altKm >= 100 || (kepler.apoapsisAltitudeKm >= 100 && p.altKm >= 80)) {
            p.outcome = 'SUCCESS';
            p.successMessage = `KÁRMÁN BOUNDARY BREACHED! Sub-orbital apogee achieved: ${Math.max(p.altKm, kepler.apoapsisAltitudeKm).toFixed(1)} km (> 100 km target). Microgravity reached!`;
          }
        }

        // Mission 2 Win Condition: Orbital Pioneer (Low Earth Orbit 200 km)
        if (activeMission.id === 'orbital-pioneer') {
          if (kepler.periapsisAltitudeKm >= 140 && p.vKms >= 7.6) {
            p.outcome = 'SUCCESS';
            p.successMessage = `LOW EARTH ORBIT INSERTION CONFIRMED! Periapsis: ${kepler.periapsisAltitudeKm.toFixed(0)} km, Velocity: ${p.vKms.toFixed(2)} km/s (Target: >= 7.6 km/s). Multi-stage ascent complete!`;
          }
        }

        // Mission 3 Win Condition: Lunar Voyager (Powered Retro Landing)
        if (activeMission.id === 'lunar-voyager') {
          if (p.altKm <= 0.005) {
            p.altKm = 0;
            const impactSpeedMs = Math.abs(p.vyKms * 1000);
            const horizSpeedMs = Math.abs(p.vxKms * 1000);
            if (impactSpeedMs <= 3.5 && horizSpeedMs <= 1.5) {
              p.outcome = 'SUCCESS';
              p.successMessage = `TOUCHDOWN CONFIRMED! Lunar Voyager landed safely on Moon surface! Vertical speed: ${impactSpeedMs.toFixed(1)} m/s, Remaining Fuel: ${p.fuel.toFixed(1)}%. Ready for Neil Armstrong EVA!`;
            } else if (impactSpeedMs > 3.5) {
              p.outcome = 'FAILED';
              p.failureReason = `LUNAR HARD CRASH: Touchdown vertical speed was ${impactSpeedMs.toFixed(1)} m/s (Structural safety limit: 3.5 m/s). Lander crushed!`;
              if (soundEnabled) soundFx.playExplosion();
            } else {
              p.outcome = 'FAILED';
              p.failureReason = `LANDER TIPPED: Horizontal drift was ${horizSpeedMs.toFixed(1)} m/s on crater slope (Limit: 1.5 m/s).`;
              if (soundEnabled) soundFx.playExplosion();
            }
          }
        }

        // Mission 4 Win Condition: Mars Interplanetary Voyager (EDL Touchdown)
        if (activeMission.id === 'mars-voyager') {
          if (p.altKm <= 0.005) {
            p.altKm = 0;
            const impactSpeedMs = Math.abs(p.vyKms * 1000);
            const horizSpeedMs = Math.abs(p.vxKms * 1000);
            if (impactSpeedMs <= 4.0 && horizSpeedMs <= 2.0 && p.heatShield > 0) {
              p.outcome = 'SUCCESS';
              p.successMessage = `MARS JEZERO CRATER TOUCHDOWN! Velocity: ${impactSpeedMs.toFixed(1)} m/s, Heat Shield: ${p.heatShield.toFixed(0)}%. Planetary survival mission active!`;
            } else if (p.heatShield <= 0) {
              p.outcome = 'FAILED';
              p.failureReason = `HEAT SHIELD FAILURE: Atmospheric entry temperatures breached structural bulkheads!`;
              if (soundEnabled) soundFx.playExplosion();
            } else {
              p.outcome = 'FAILED';
              p.failureReason = `MARS CRASH IMPACT: Touchdown vertical speed was ${impactSpeedMs.toFixed(1)} m/s (Structural limit: 4.0 m/s).`;
              if (soundEnabled) soundFx.playExplosion();
            }
          }
        }

        // Mission 1 Win Condition (Circular 550 km orbit)
        if (activeMission.id === 'kessler-syndrome') {
          const apDist = Math.abs(kepler.apoapsisAltitudeKm - 550);
          const peDist = Math.abs(kepler.periapsisAltitudeKm - 550);
          if (apDist <= 35 && peDist <= 35 && kepler.eccentricity < 0.06 && p.hull > 0) {
            p.outcome = 'SUCCESS';
            p.successMessage = `KESSLER SYNDROME ESCAPED! Stabilized in ${kepler.periapsisAltitudeKm.toFixed(0)}x${kepler.apoapsisAltitudeKm.toFixed(0)} km safe orbit with ${p.hull.toFixed(0)}% hull intact!`;
          }
        }

        // Mission 2 Win Condition (Blind Telemetry)
        if (activeMission.id === 'solar-storm') {
          if (kepler.periapsisAltitudeKm > 120 && kepler.apoapsisAltitudeKm >= 180 && kepler.apoapsisAltitudeKm <= 380) {
            p.outcome = 'SUCCESS';
            p.successMessage = `SOLAR STORM BLIND NAVIGATION SUCCESSFUL! Orbit insertion achieved: Pe ${kepler.periapsisAltitudeKm.toFixed(0)} km / Ap ${kepler.apoapsisAltitudeKm.toFixed(0)} km!`;
          }
        }

        // Mission 3 Win Condition (Apollo 13 Re-Entry Corridor)
        if (activeMission.id === 'apollo-13') {
          if (p.altKm <= 120) {
            // Re-entry interface!
            const entryAngle = Math.abs(kepler.flightPathAngleDeg);
            if (entryAngle >= 5.5 && entryAngle <= 7.5) {
              p.outcome = 'SUCCESS';
              p.successMessage = `APOLLO 13 SAVED! Precision re-entry corridor hit at ${entryAngle.toFixed(2)}° (Target: 5.5° - 7.5°). Capsule safely landed!`;
            } else if (entryAngle < 5.5) {
              p.outcome = 'FAILED';
              p.failureReason = `SKIPPED OFF ATMOSPHERE: Entry angle was ${entryAngle.toFixed(2)}° (< 5.5°). Capsule ricocheted into deep space!`;
              if (soundEnabled) soundFx.playAlarm();
            } else {
              p.outcome = 'FAILED';
              p.failureReason = `ENTRY TOO STEEP: Entry angle was ${entryAngle.toFixed(2)}° (> 7.5°). Deceleration exceeded 30 Gs; heat shield destroyed!`;
              if (soundEnabled) soundFx.playExplosion();
            }
          }
        }

        // Mission 4 Win Condition (Oberth Effect Slingshot)
        if (activeMission.id === 'oberth-slingshot') {
          if (kepler.isHyperbolic && p.vKms >= 52.0 && p.heatShield > 0) {
            p.outcome = 'SUCCESS';
            p.successMessage = `OBERTH SLINGSHOT ACHIEVED! Escaped Gas Giant gravity well at ${p.vKms.toFixed(1)} km/s with ${p.heatShield.toFixed(0)}% heat shield remaining!`;
          }
        }

        // Victory celebration trigger
        if (p.outcome === 'SUCCESS') {
          confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
          if (soundEnabled) soundFx.playVictory();
          awardCadetCredits(500);
          onMissionCompleted?.(activeMission.id, 500);
        }

        // HUD Warnings list
        const warnings: string[] = [];
        if (p.overheatCooldown > 0) warnings.push('⚠️ ENGINE OVERHEAT · COOLDOWN LOCK');
        if (p.fuelLeak) warnings.push('⚠️ HULL BREACH · FUEL LEAK DETECTED');
        if (activeMission.hasCountdownTimer && p.countdownTimer < 90) warnings.push('⚠️ LOW O2 / BATTERY CRITICAL');
        if (activeMission.hasHeatShield && p.heatShield < 35) warnings.push('⚠️ HEAT SHIELD CRITICAL');
        if (suicideIgnitionRequired) warnings.push('⚠️ SUICIDE BURN IGNITION POINT REACHED [FULL THROTTLE NOW]');
        if (activeMission.id === 'apollo-13' && p.altKm < 2000) {
          const ang = Math.abs(kepler.flightPathAngleDeg);
          if (ang < 5.5) warnings.push(`⚠️ RE-ENTRY SHALLOW (${ang.toFixed(1)}° < 5.5° - WILL SKIP)`);
          else if (ang > 7.5) warnings.push(`⚠️ RE-ENTRY STEEP (${ang.toFixed(1)}° > 7.5° - WILL BURN)`);
        }

        // Update React HUD state (throttled to 10 FPS for optimal performance)
        if (now - lastHudTime > 90 || p.outcome !== 'IN_PROGRESS') {
          lastHudTime = now;
          const px = p.rKm * Math.cos(p.orbitalTheta);
          const pz = p.rKm * Math.sin(p.orbitalTheta);

          setTelemetry({
            missionId: activeMission.id,
            timeSec: p.time,
            altitudeKm: p.altKm,
            velocityKms: p.vKms,
            verticalSpeedKms: p.vyKms,
            horizontalSpeedKms: p.vxKms,
            pitchDeg: (p.pitchRad * 180) / Math.PI,
            yawDeg: 0,
            rollDeg: 0,
            throttlePct: p.throttle,
            fuelPct: p.fuel,
            hullIntegrityPct: p.hull,
            fuelLeakActive: p.fuelLeak,
            engineHeatPct: p.engineHeat,
            engineOverheated: p.overheatCooldown > 0,
            heatShieldPct: p.heatShield,
            oxygenBatteryTimerSec: p.countdownTimer,
            apoapsisKm: kepler.apoapsisAltitudeKm,
            periapsisKm: kepler.periapsisAltitudeKm,
            eccentricity: kepler.eccentricity,
            flightPathAngleDeg: kepler.flightPathAngleDeg,
            suicideBurnDistanceM: suicideBurnAltM,
            suicideBurnIgnitionRequired: suicideIgnitionRequired,
            radarDebris: debrisFieldRef.current.slice(0, 15).map((d) => ({
              x: d.x - px,
              y: d.y,
              z: d.z - pz,
              distanceKm: Math.sqrt((d.x - px) ** 2 + d.y ** 2 + (d.z - pz) ** 2),
            })),
            warningAlerts: warnings,
            cameraShakeIntensity: p.shakeIntensity,
            isGameOver: p.outcome !== 'IN_PROGRESS',
            outcome: p.outcome,
            failureReason: p.failureReason,
            successMessage: p.successMessage,
          });
        }
      }

      // 9. Three.js Visual Plume & Exhaust Light
      const thr = p.throttle;
      plumeMat.opacity = thr > 0 ? 0.3 + (thr / 100) * 0.7 : 0;
      plumeMesh.scale.set(1, 0.6 + (thr / 100) * 2.0, 1);
      exhaustLight.intensity = (thr / 100) * 8.0;

      // Update 3D Spacecraft orientation & visual response
      shipGroup.rotation.z = -p.pitchRad;
      shipGroup.rotation.x = Math.sin(p.time * 2.5) * 0.03;
      shipGroup.rotation.y = (p.yawRad || 0) + Math.cos(p.time * 1.5) * 0.02;

      // 10. Update 3D Debris Meshes
      if (activeMission.hasDebrisField && debrisFieldRef.current.length > 0) {
        const px = p.rKm * Math.cos(p.orbitalTheta);
        const pz = p.rKm * Math.sin(p.orbitalTheta);
        for (let i = 0; i < debrisMeshesRef.current.length; i++) {
          const dMesh = debrisMeshesRef.current[i];
          const dData = debrisFieldRef.current[i];
          if (dMesh && dData) {
            dMesh.position.set((dData.x - px) * 0.08, dData.y * 0.08, (dData.z - pz) * 0.08);
            dMesh.rotation.x += 0.02;
            dMesh.rotation.y += 0.03;
          }
        }
      }

      // 11. Update Predicted Orbit Trajectory Line (if not blinded)
      if (!activeMission.hideTrajectoryLine) {
        const positions = trajGeo.attributes.position.array as Float32Array;
        const trajMu = bodyConfig.mu;
        const trajR = p.rKm;
        const trajV = p.vKms;
        const trajKepler = computeKeplerianElements(trajR, trajV, p.vyKms, bodyConfig);

        const a = Math.min(trajKepler.semiMajorAxisKm, 80000);
        const e = Math.min(trajKepler.eccentricity, 0.95);

        for (let i = 0; i < trajectoryPoints; i++) {
          const theta = (i / trajectoryPoints) * Math.PI * 2;
          const rCurve = (a * (1 - e * e)) / (1 + e * Math.cos(theta));
          const scaleR = (rCurve / bodyConfig.radiusKm) * bodyRadiusScale;

          positions[i * 3] = Math.cos(theta) * scaleR;
          positions[i * 3 + 1] = 0;
          positions[i * 3 + 2] = Math.sin(theta) * scaleR - 30;
        }
        trajGeo.attributes.position.needsUpdate = true;
      }

      // 12. Camera View & Dynamic Shake
      const shakeX = (Math.random() - 0.5) * p.shakeIntensity * 0.35;
      const shakeY = (Math.random() - 0.5) * p.shakeIntensity * 0.35;

      if (cameraMode === 'chase') {
        camera.position.set(0 + shakeX, 3.5 + shakeY, 12);
        camera.lookAt(shipGroup.position);
      } else if (cameraMode === 'cockpit') {
        camera.position.set(0 + shakeX, 1.2 + shakeY, 0.5);
        camera.lookAt(0, 5, -20);
      } else {
        camera.position.set(0 + shakeX, 18 + shakeY, 32);
        camera.lookAt(planetMesh.position);
      }

      // Slowly rotate planet & stars
      planetMesh.rotation.y += 0.0008;
      starField.rotation.y += 0.0001;

      renderer.render(scene, camera);
    };

    renderLoop();

    // Resize handler
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
  }, [activeMission, cameraMode, isPaused, soundEnabled]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 14000,
        background: '#020617',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'var(--font-mono, monospace)',
        overflow: 'hidden',
      }}
    >
      {/* ─── TOP HEADER BAR ─── */}
      <header
        style={{
          height: '62px',
          background: 'rgba(10, 15, 26, 0.95)',
          borderBottom: '1px solid rgba(239, 68, 68, 0.35)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          backdropFilter: 'blur(16px)',
          zIndex: 40,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.3), rgba(220, 38, 38, 0.8))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              border: '1px solid #ef4444',
              boxShadow: '0 0 15px rgba(239, 68, 68, 0.5)',
            }}
          >
            🔥
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 900, color: '#f8fafc', letterSpacing: '0.06em', fontFamily: 'var(--font-space)' }}>
              HARDCORE SURVIVAL MISSIONS <span style={{ color: '#ef4444' }}>[REAL ORBITAL MECHANICS]</span>
            </div>
            <div style={{ fontSize: '10px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>NEWTONIAN GRAVITY: F = G·M·m/r²</span>
              <span>•</span>
              <span style={{ color: '#38bdf8' }}>KEPLERIAN SOLVER (Ap/Pe)</span>
              <span>•</span>
              <span style={{ color: '#4ade80' }}>NASA DATA-GROUNDED</span>
            </div>
          </div>
        </div>

        {/* Header Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => setIsNasaModalOpen(true)}
            style={{
              background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.4), rgba(30, 58, 138, 0.6))',
              border: '1.5px solid #38bdf8',
              borderRadius: '8px',
              padding: '6px 12px',
              color: '#38bdf8',
              fontSize: '11px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 0 12px rgba(56, 189, 248, 0.3)',
            }}
            title="Open NASA Open Data Plan (2 Moon + 2 Mars Survival Missions)"
          >
            <ShieldCheck size={14} />
            <span>NASA SURVIVAL DATA PLAN (2 MOON + 2 MARS)</span>
          </button>

          <button
            onClick={() => setCameraMode((prev) => (prev === 'orbit' ? 'chase' : prev === 'chase' ? 'cockpit' : 'orbit'))}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              padding: '6px 12px',
              color: '#e2e8f0',
              fontSize: '11px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
            title="Cycle Camera: Chase / Cockpit / Orbit View"
          >
            <Camera size={14} />
            <span style={{ textTransform: 'uppercase' }}>{cameraMode} VIEW</span>
          </button>

          <button
            onClick={() => resetMission(activeMission)}
            style={{
              background: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '8px',
              padding: '6px 12px',
              color: '#fca5a5',
              fontSize: '11px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
            title="Restart Mission (R)"
          >
            <RotateCcw size={14} />
            <span>RESTART</span>
          </button>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '8px',
              padding: '6px 10px',
              color: soundEnabled ? '#38bdf8' : '#ef4444',
              cursor: 'pointer',
            }}
          >
            {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
          </button>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(239, 68, 68, 0.85)',
              border: 'none',
              borderRadius: '8px',
              padding: '6px 14px',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 900,
              cursor: 'pointer',
            }}
            aria-label="Close"
          >
            ✕ EXIT
          </button>
        </div>
      </header>

      {/* ─── 5-MISSION GLASSMORPHIC SELECTOR TABS ─── */}
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.92)',
          borderBottom: '1px solid rgba(148, 163, 184, 0.15)',
          padding: '8px 24px',
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          zIndex: 35,
          backdropFilter: 'blur(10px)',
        }}
      >
        {HARDCORE_SURVIVAL_MISSIONS.map((m) => {
          const isSelected = m.id === selectedMissionId;
          return (
            <button
              key={m.id}
              onClick={() => setSelectedMissionId(m.id)}
              style={{
                padding: '7px 14px',
                borderRadius: '8px',
                border: isSelected ? '1.5px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.08)',
                background: isSelected
                  ? 'linear-gradient(90deg, rgba(239, 68, 68, 0.35), rgba(15, 23, 42, 0.95))'
                  : 'rgba(255, 255, 255, 0.03)',
                color: isSelected ? '#ffffff' : '#94a3b8',
                fontSize: '11px',
                fontWeight: 900,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                whiteSpace: 'nowrap',
                boxShadow: isSelected ? '0 0 16px rgba(239, 68, 68, 0.4)' : 'none',
                transition: 'all 0.2s ease',
              }}
            >
              <span style={{ color: '#ef4444', fontWeight: 900 }}>M{m.missionNumber}</span>
              <span>{m.title.includes(':') ? m.title.split(':')[1].trim() : m.title}</span>
            </button>
          );
        })}
      </div>

      {/* ─── 3D VIEWPORT CONTAINER & HUD OVERLAYS ─── */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {/* Three.js Canvas Container */}
        <div ref={mountRef} style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }} />

        {/* ── FLASHING RED WARNING ALERTS (TOP CENTER) ── */}
        {telemetry.warningAlerts.length > 0 && (
          <div
            style={{
              position: 'absolute',
              top: '18px',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              zIndex: 30,
              pointerEvents: 'none',
            }}
          >
            {telemetry.warningAlerts.map((warn, i) => (
              <div
                key={i}
                style={{
                  background: 'rgba(220, 38, 38, 0.92)',
                  border: '1.5px solid #ffffff',
                  color: '#ffffff',
                  padding: '7px 18px',
                  borderRadius: '8px',
                  fontSize: '11.5px',
                  fontWeight: 900,
                  letterSpacing: '0.04em',
                  boxShadow: '0 0 25px rgba(239, 68, 68, 0.85)',
                  animation: 'pulse 0.8s infinite alternate',
                  textAlign: 'center',
                }}
              >
                {warn}
              </div>
            ))}
          </div>
        )}

        {/* ── LEFT HUD: NUMERICAL TELEMETRY INSTRUMENTS ── */}
        <div
          style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            width: '260px',
            background: 'rgba(10, 15, 26, 0.88)',
            border: '1px solid rgba(56, 189, 248, 0.35)',
            borderRadius: '12px',
            padding: '14px',
            backdropFilter: 'blur(16px)',
            boxShadow: '0 12px 35px rgba(0,0,0,0.8)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            zIndex: 25,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(56, 189, 248, 0.2)', paddingBottom: '6px' }}>
            <span style={{ fontSize: '10px', fontWeight: 900, color: '#38bdf8', letterSpacing: '0.08em' }}>
              📡 PRIMARY TELEMETRY HUD
            </span>
            <span style={{ fontSize: '9px', color: '#10b981', fontWeight: 800 }}>● 60 FPS REAL-TIME</span>
          </div>

          {/* Numerical Values Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11px' }}>
            <div>
              <div style={{ fontSize: '8.5px', color: '#94a3b8' }}>ALTITUDE</div>
              <div style={{ fontSize: '14px', fontWeight: 900, color: '#f8fafc' }}>
                {telemetry.altitudeKm < 10
                  ? `${(telemetry.altitudeKm * 1000).toFixed(0)} m`
                  : `${telemetry.altitudeKm.toFixed(1)} km`}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '8.5px', color: '#94a3b8' }}>TOTAL VELOCITY</div>
              <div style={{ fontSize: '14px', fontWeight: 900, color: '#38bdf8' }}>
                {telemetry.velocityKms.toFixed(2)} km/s
              </div>
            </div>

            <div>
              <div style={{ fontSize: '8.5px', color: '#94a3b8' }}>VERT SPEED (Vy)</div>
              <div style={{ fontSize: '12.5px', fontWeight: 800, color: telemetry.verticalSpeedKms >= 0 ? '#4ade80' : '#f87171' }}>
                {(telemetry.verticalSpeedKms * 1000).toFixed(0)} m/s
              </div>
            </div>

            <div>
              <div style={{ fontSize: '8.5px', color: '#94a3b8' }}>PITCH ANGLE</div>
              <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#fbbf24' }}>
                {telemetry.pitchDeg.toFixed(1)}°
              </div>
            </div>
          </div>

          {/* Keplerian Elements (Apoapsis / Periapsis) */}
          <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '8px', padding: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#cbd5e1', marginBottom: '4px' }}>
              <span>APOAPSIS (Ap): <strong style={{ color: '#38bdf8' }}>{telemetry.apoapsisKm === Infinity ? 'ESC' : `${telemetry.apoapsisKm.toFixed(0)} km`}</strong></span>
              <span>PERIAPSIS (Pe): <strong style={{ color: telemetry.periapsisKm < 120 ? '#ef4444' : '#4ade80' }}>{telemetry.periapsisKm.toFixed(0)} km</strong></span>
            </div>
            <div style={{ fontSize: '9px', color: '#94a3b8' }}>
              ECCENTRICITY (e): <span style={{ color: '#fbbf24', fontWeight: 800 }}>{telemetry.eccentricity.toFixed(4)}</span>
            </div>
          </div>

          {/* Suicide Burn Gauge for Mission 5 */}
          {activeMission.id === 'suicide-burn' && (
            <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', borderRadius: '8px', padding: '8px' }}>
              <div style={{ fontSize: '9px', fontWeight: 900, color: '#fca5a5', display: 'flex', justifyContent: 'space-between' }}>
                <span>HOVER SLAM / SUICIDE BURN</span>
                <span>{telemetry.suicideBurnIgnitionRequired ? 'IGNITE NOW!' : 'CALCULATING'}</span>
              </div>
              <div style={{ fontSize: '13px', fontWeight: 900, color: '#ffffff', marginTop: '2px' }}>
                Burn Alt: {telemetry.suicideBurnDistanceM.toFixed(0)} m
              </div>
              <div style={{ fontSize: '8.5px', color: '#cbd5e1', marginTop: '2px' }}>
                Current Alt: {(telemetry.altitudeKm * 1000).toFixed(0)} m (Margin: {((telemetry.altitudeKm * 1000) - telemetry.suicideBurnDistanceM).toFixed(0)} m)
              </div>
            </div>
          )}

          {/* Flight Path Angle for Mission 3 (Apollo 13) */}
          {activeMission.id === 'apollo-13' && (
            <div style={{ background: 'rgba(245, 158, 11, 0.15)', border: '1px solid #f59e0b', borderRadius: '8px', padding: '8px' }}>
              <div style={{ fontSize: '9px', fontWeight: 900, color: '#fbbf24', display: 'flex', justifyContent: 'space-between' }}>
                <span>RE-ENTRY CORRIDOR</span>
                <span>TARGET: 5.5° – 7.5°</span>
              </div>
              <div style={{ fontSize: '14px', fontWeight: 900, color: Math.abs(telemetry.flightPathAngleDeg) >= 5.5 && Math.abs(telemetry.flightPathAngleDeg) <= 7.5 ? '#4ade80' : '#ef4444', marginTop: '2px' }}>
                {Math.abs(telemetry.flightPathAngleDeg).toFixed(2)}°
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT HUD: SPACECRAFT VITALS & SYSTEMS GAUGES ── */}
        <div
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            width: '280px',
            background: 'rgba(10, 15, 26, 0.88)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            borderRadius: '12px',
            padding: '14px',
            backdropFilter: 'blur(16px)',
            boxShadow: '0 12px 35px rgba(0,0,0,0.8)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            zIndex: 25,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(239, 68, 68, 0.25)', paddingBottom: '6px' }}>
            <span style={{ fontSize: '10px', fontWeight: 900, color: '#fca5a5', letterSpacing: '0.08em' }}>
              🛡️ SHIP SYSTEMS & VITALS
            </span>
            <span style={{ fontSize: '9px', color: '#f59e0b', fontWeight: 800 }}>M{activeMission.missionNumber} ACTIVE</span>
          </div>

          {/* 1. Fuel Meter */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', fontWeight: 800, color: '#cbd5e1' }}>
              <span>PROPELLANT (LH2/LOX)</span>
              <span style={{ color: telemetry.fuelPct < 15 ? '#ef4444' : '#38bdf8' }}>{telemetry.fuelPct.toFixed(1)}%</span>
            </div>
            <div style={{ height: '7px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', marginTop: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${telemetry.fuelPct}%`, height: '100%', background: telemetry.fuelPct < 15 ? '#ef4444' : 'linear-gradient(90deg, #0284c7, #38bdf8)' }} />
            </div>
          </div>

          {/* 2. Hull Integrity & Fuel Leak (Mission 1) */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', fontWeight: 800, color: '#cbd5e1' }}>
              <span>HULL INTEGRITY</span>
              <span style={{ color: telemetry.hullIntegrityPct < 40 ? '#ef4444' : '#4ade80' }}>{telemetry.hullIntegrityPct.toFixed(0)}%</span>
            </div>
            <div style={{ height: '7px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', marginTop: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${telemetry.hullIntegrityPct}%`, height: '100%', background: telemetry.hullIntegrityPct < 40 ? '#ef4444' : 'linear-gradient(90deg, #16a34a, #4ade80)' }} />
            </div>
            {telemetry.fuelLeakActive && (
              <div style={{ fontSize: '8.5px', color: '#ef4444', fontWeight: 800, marginTop: '2px' }}>
                ⚠️ RAPID FUEL LEAK ACTIVE (-0.75%/s)
              </div>
            )}
          </div>

          {/* 3. Engine Heat Gauge (Mission 2) */}
          {activeMission.hasEngineHeat && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', fontWeight: 800, color: '#cbd5e1' }}>
                <span>ENGINE HEAT</span>
                <span style={{ color: telemetry.engineHeatPct > 80 ? '#ef4444' : '#fbbf24' }}>{telemetry.engineHeatPct.toFixed(0)}%</span>
              </div>
              <div style={{ height: '7px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', marginTop: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${telemetry.engineHeatPct}%`, height: '100%', background: telemetry.engineHeatPct > 80 ? '#ef4444' : 'linear-gradient(90deg, #d97706, #fbbf24)' }} />
              </div>
            </div>
          )}

          {/* 4. Heat Shield Gauge (Mission 4) */}
          {activeMission.hasHeatShield && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', fontWeight: 800, color: '#cbd5e1' }}>
                <span>HEAT SHIELD (ABLATION)</span>
                <span style={{ color: telemetry.heatShieldPct < 30 ? '#ef4444' : '#fb923c' }}>{telemetry.heatShieldPct.toFixed(0)}%</span>
              </div>
              <div style={{ height: '7px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', marginTop: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${telemetry.heatShieldPct}%`, height: '100%', background: telemetry.heatShieldPct < 30 ? '#ef4444' : 'linear-gradient(90deg, #ea580c, #fb923c)' }} />
              </div>
            </div>
          )}

          {/* 5. 5-Minute Countdown Timer (Mission 3) */}
          {activeMission.hasCountdownTimer && (
            <div style={{ background: 'rgba(220, 38, 38, 0.15)', border: '1px solid #ef4444', borderRadius: '8px', padding: '8px' }}>
              <div style={{ fontSize: '9px', color: '#fca5a5', fontWeight: 800 }}>OXYGEN & BATTERY LIFE</div>
              <div style={{ fontSize: '18px', fontWeight: 900, color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
                {Math.floor(telemetry.oxygenBatteryTimerSec / 60)}:
                {(Math.floor(telemetry.oxygenBatteryTimerSec % 60)).toString().padStart(2, '0')}
              </div>
            </div>
          )}

          {/* Interactive Keyboard Flight Instructions */}
          <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '8px', padding: '8px', fontSize: '9.5px', color: '#94a3b8', lineHeight: 1.5 }}>
            <div style={{ fontWeight: 800, color: '#f8fafc', marginBottom: '2px' }}>FLIGHT CONTROLS</div>
            <div><strong style={{ color: '#38bdf8' }}>[W] / [S]</strong>: Throttle Up / Down</div>
            <div><strong style={{ color: '#fbbf24' }}>[A] / [D]</strong>: Pitch Guidance</div>
            <div><strong style={{ color: '#4ade80' }}>[Z] / [X]</strong>: 100% Full Burn / Cutoff</div>
            <div><strong style={{ color: '#c084fc' }}>[SPACE]</strong>: RCS Translation Thruster</div>
          </div>
        </div>

        {/* ── BOTTOM THROTTLE SLIDER & PITCH CONTROLLER (ON-SCREEN) ── */}
        <div
          style={{
            position: 'absolute',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(10, 15, 26, 0.92)',
            border: '1px solid rgba(56, 189, 248, 0.35)',
            borderRadius: '16px',
            padding: '12px 24px',
            backdropFilter: 'blur(16px)',
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            zIndex: 25,
            boxShadow: '0 12px 40px rgba(0,0,0,0.85)',
          }}
        >
          {/* Throttle Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => {
                physStateRef.current.throttle = 0;
                setTelemetry((prev) => ({ ...prev, throttlePct: 0 }));
              }}
              style={{
                background: '#dc2626',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 12px',
                color: '#ffffff',
                fontWeight: 900,
                fontSize: '11px',
                cursor: 'pointer',
              }}
            >
              CUT [X]
            </button>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
              <div style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 800 }}>THROTTLE: {telemetry.throttlePct}%</div>
              <input
                type="range"
                min="0"
                max="100"
                value={telemetry.throttlePct}
                onChange={(e) => {
                  if (activeMission.mainEngineAvailable && physStateRef.current.overheatCooldown <= 0) {
                    const val = parseInt(e.target.value, 10);
                    physStateRef.current.throttle = val;
                    setTelemetry((prev) => ({ ...prev, throttlePct: val }));
                  }
                }}
                disabled={!activeMission.mainEngineAvailable || telemetry.engineOverheated}
                style={{ width: '150px', cursor: 'pointer' }}
              />
            </div>

            <button
              onClick={() => {
                if (activeMission.mainEngineAvailable && physStateRef.current.overheatCooldown <= 0) {
                  physStateRef.current.throttle = 100;
                  setTelemetry((prev) => ({ ...prev, throttlePct: 100 }));
                }
              }}
              style={{
                background: '#16a34a',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 12px',
                color: '#ffffff',
                fontWeight: 900,
                fontSize: '11px',
                cursor: 'pointer',
              }}
            >
              MAX [Z]
            </button>
          </div>

          <div style={{ width: '1px', height: '32px', background: 'rgba(255, 255, 255, 0.15)' }} />

          {/* Pitch Steering Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => {
                physStateRef.current.pitchRad += 0.08;
                setTelemetry((prev) => ({ ...prev, pitchDeg: (physStateRef.current.pitchRad * 180) / Math.PI }));
              }}
              style={{
                background: 'rgba(56, 189, 248, 0.15)',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                borderRadius: '6px',
                padding: '6px 12px',
                color: '#38bdf8',
                fontWeight: 800,
                fontSize: '11px',
                cursor: 'pointer',
              }}
            >
              ◀ PITCH [A]
            </button>

            <button
              onClick={() => {
                physStateRef.current.pitchRad -= 0.08;
                setTelemetry((prev) => ({ ...prev, pitchDeg: (physStateRef.current.pitchRad * 180) / Math.PI }));
              }}
              style={{
                background: 'rgba(56, 189, 248, 0.15)',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                borderRadius: '6px',
                padding: '6px 12px',
                color: '#38bdf8',
                fontWeight: 800,
                fontSize: '11px',
                cursor: 'pointer',
              }}
            >
              PITCH [D] ▶
            </button>

            {activeMission.rcsOnly && (
              <button
                onClick={() => {
                  physStateRef.current.pitchRad += 0.04;
                  physStateRef.current.vxKms += 0.06;
                  physStateRef.current.countdownTimer = Math.max(0, physStateRef.current.countdownTimer - 1.2);
                  if (soundEnabled) soundFx.playThruster();
                }}
                style={{
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 14px',
                  color: '#ffffff',
                  fontWeight: 900,
                  fontSize: '11px',
                  cursor: 'pointer',
                }}
              >
                ⚡ RCS PULSE [SPACE]
              </button>
            )}
          </div>
        </div>

        {/* ── MISSION OUTCOME OVERLAY (VICTORY OR DEFEAT) ── */}
        {telemetry.isGameOver && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(2, 6, 23, 0.92)',
              backdropFilter: 'blur(20px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px',
              zIndex: 50,
              animation: 'fadeIn 0.3s ease',
            }}
          >
            <div
              style={{
                maxWidth: '560px',
                width: '100%',
                background: telemetry.outcome === 'SUCCESS' ? 'rgba(6, 78, 59, 0.9)' : 'rgba(88, 28, 28, 0.9)',
                border: telemetry.outcome === 'SUCCESS' ? '2px solid #34d399' : '2px solid #ef4444',
                borderRadius: '16px',
                padding: '28px',
                textAlign: 'center',
                boxShadow: telemetry.outcome === 'SUCCESS' ? '0 0 50px rgba(52, 211, 153, 0.4)' : '0 0 50px rgba(239, 68, 68, 0.4)',
              }}
            >
              <div style={{ fontSize: '48px', marginBottom: '8px' }}>
                {telemetry.outcome === 'SUCCESS' ? '🏆' : '💥'}
              </div>

              <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#ffffff', fontFamily: 'var(--font-space)' }}>
                {telemetry.outcome === 'SUCCESS' ? 'HARDCORE MISSION ACCOMPLISHED!' : 'MISSION FAILED'}
              </h2>

              <p style={{ fontSize: '13px', color: '#e2e8f0', marginTop: '10px', lineHeight: 1.6 }}>
                {telemetry.outcome === 'SUCCESS' ? telemetry.successMessage : telemetry.failureReason}
              </p>

              {telemetry.outcome === 'SUCCESS' && (
                <div style={{ margin: '18px 0', padding: '10px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', color: '#fbbf24', fontSize: '13px', fontWeight: 800 }}>
                  🎖️ +500 CADET CREDITS AWARDED!
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '20px' }}>
                <button
                  onClick={() => resetMission(activeMission)}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    background: '#38bdf8',
                    border: 'none',
                    color: '#0f172a',
                    fontWeight: 900,
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  RETRY MISSION
                </button>

                <button
                  onClick={() => {
                    // Advance to next mission
                    const currentIndex = HARDCORE_SURVIVAL_MISSIONS.findIndex((m) => m.id === selectedMissionId);
                    const nextMission = HARDCORE_SURVIVAL_MISSIONS[(currentIndex + 1) % HARDCORE_SURVIVAL_MISSIONS.length];
                    setSelectedMissionId(nextMission.id);
                  }}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.15)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  NEXT HARDCORE MISSION ▶
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── SCIENTIFIC GROUNDING & NASA DATA PORTAL FOOTER ─── */}
      <footer
        style={{
          background: 'rgba(10, 15, 26, 0.95)',
          borderTop: '1px solid rgba(148, 163, 184, 0.15)',
          padding: '8px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '10px',
          color: '#94a3b8',
          zIndex: 35,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <span style={{ fontWeight: 800, color: '#f8fafc' }}>NASA DATA INTEGRATION:</span>
          {activeMission.nasaDataSources.map((ds, idx) => (
            <a
              key={idx}
              href={ds.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: '#38bdf8',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontWeight: 700,
              }}
            >
              <span>{ds.title}</span>
              <ExternalLink size={10} />
            </a>
          ))}
        </div>

        <div style={{ color: '#cbd5e1' }}>
          Open NASA Portals: <strong style={{ color: '#4ade80' }}>data.nasa.gov</strong> · <strong style={{ color: '#38bdf8' }}>api.nasa.gov</strong> · <strong style={{ color: '#fb923c' }}>earthdata.nasa.gov</strong> · <strong style={{ color: '#c084fc' }}>jpl.nasa.gov</strong>
        </div>
      </footer>

      {/* NASA 4-Platform Open Survival Data Plan Modal */}
      <NasaDataModal isOpen={isNasaModalOpen} onClose={() => setIsNasaModalOpen(false)} />
    </div>
  );
};
