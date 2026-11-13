// ============================================================================
// HardcoreSurvivalSimulator.tsx — 3D Spaceflight & Orbital Rocket Simulator
// Full Newtonian Gravity, Keplerian Calculations, Real-Time Trajectory,
// Dynamic Camera Shake, Glassmorphic Mission Selector & HUD
// References: benjamin-awd/solar-system-threejs, jakerunzer/space-flight
// ============================================================================

import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
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
  evaluateMissionRules,
  type HardcoreMissionId,
  type HardcoreMissionConfig,
  type HardcoreTelemetryState,
  type DebrisObject,
} from '../missions/survivalMissions';
import { soundFx } from '../utils/audioEffects';
import { awardCadetCredits } from '../utils/gearBonusHelper';
import { disposeThreeScene } from '../utils/threeDisposeHelper';
import { NasaDataModal } from './NasaDataModal';

// ============================================================================
// PHOTOREALISTIC AEROSPACE CRAFT & PLANETARY RENDERING ENGINE
// ============================================================================

interface RealisticCraft {
  shipGroup: THREE.Group;
  plumeCore: THREE.Mesh;
  plumeOuter: THREE.Mesh;
  shockDiamonds: THREE.Mesh[];
  engineLight: THREE.PointLight;
  engineThroat: THREE.Mesh;
  heatShieldMesh: THREE.Mesh;
  rcsPuffs: Record<string, THREE.Mesh>;
  solarWings: THREE.Group[];
  update: (throttle: number, time: number, rcsActive: boolean, heatAblationPct: number) => void;
}

function createPhotorealisticSpacecraft(): RealisticCraft {
  const shipGroup = new THREE.Group();

  // ─── 1. COMMAND / CREW MODULE (ORION / APOLLO STYLE CAPSULE) ───
  const cmGroup = new THREE.Group();
  cmGroup.position.y = 1.05;

  // Truncated Conic Aerodynamic Capsule Hull
  const cmGeo = new THREE.CylinderGeometry(0.5, 1.25, 1.35, 32);
  const cmMat = new THREE.MeshStandardMaterial({
    color: 0xf1f5f9,
    metalness: 0.28,
    roughness: 0.35,
  });
  const cmMesh = new THREE.Mesh(cmGeo, cmMat);
  cmMesh.castShadow = true;
  cmMesh.receiveShadow = true;
  cmGroup.add(cmMesh);

  // Aft Heat Shield (PICA-X / Phenolic Carbon Ablative Shield)
  const hsGeo = new THREE.CylinderGeometry(1.28, 1.25, 0.18, 32);
  const hsMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    metalness: 0.75,
    roughness: 0.35,
    emissive: 0x000000,
    emissiveIntensity: 0,
  });
  const heatShieldMesh = new THREE.Mesh(hsGeo, hsMat);
  heatShieldMesh.position.y = -0.72;
  cmGroup.add(heatShieldMesh);

  // Forward Docking Ring (IDA - International Docking Adapter)
  const dockRingGeo = new THREE.TorusGeometry(0.38, 0.05, 16, 32);
  const dockRingMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.85, roughness: 0.2 });
  const dockRing = new THREE.Mesh(dockRingGeo, dockRingMat);
  dockRing.rotation.x = Math.PI / 2;
  dockRing.position.y = 0.72;
  cmGroup.add(dockRing);

  // Docking Alignment Target Cross
  const crossMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
  const crossBar1 = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.03, 0.02), crossMat);
  crossBar1.position.y = 0.73;
  const crossBar2 = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.32, 0.02), crossMat);
  crossBar2.position.y = 0.73;
  cmGroup.add(crossBar1);
  cmGroup.add(crossBar2);

  // Forward Astronaut Observation Viewports (Tinted reflective glass)
  const windowMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.05,
    metalness: 0.95,
    emissive: 0x0284c7,
    emissiveIntensity: 0.45,
  });
  for (let w = -1; w <= 1; w += 2) {
    const winGeo = new THREE.BoxGeometry(0.24, 0.18, 0.04);
    const winMesh = new THREE.Mesh(winGeo, windowMat);
    winMesh.position.set(w * 0.38, 0.22, 0.82);
    winMesh.rotation.y = w * 0.38;
    winMesh.rotation.x = -0.45;
    cmGroup.add(winMesh);
  }

  // NASA Red Insignia Stripe
  const stripeGeo = new THREE.BoxGeometry(0.75, 0.08, 0.03);
  const stripeMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.5 });
  const stripe = new THREE.Mesh(stripeGeo, stripeMat);
  stripe.position.set(0, -0.15, 1.08);
  cmGroup.add(stripe);

  shipGroup.add(cmGroup);

  // ─── 2. SERVICE MODULE (PROPULSION & POWER STAGE) ───
  const smGroup = new THREE.Group();
  smGroup.position.y = -0.75;

  // Main Radiator Body
  const smGeo = new THREE.CylinderGeometry(1.22, 1.22, 2.1, 32);
  const smMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    metalness: 0.35,
    roughness: 0.42,
  });
  const smMesh = new THREE.Mesh(smGeo, smMat);
  smMesh.castShadow = true;
  smMesh.receiveShadow = true;
  smGroup.add(smMesh);

  // Gold Kapton MLI Foil Wrap (Propulsion Bay)
  const mliGeo = new THREE.CylinderGeometry(1.23, 1.23, 0.55, 32);
  const mliMat = new THREE.MeshStandardMaterial({
    color: 0xd97706,
    metalness: 0.9,
    roughness: 0.22,
  });
  const mliMesh = new THREE.Mesh(mliGeo, mliMat);
  mliMesh.position.y = -0.75;
  smGroup.add(mliMesh);

  // High-Gain S-Band / X-Band Communication Dish
  const hgaGroup = new THREE.Group();
  hgaGroup.position.set(1.42, 0.4, 0);
  const hgaBoom = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.03, 0.65, 8),
    new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.8 })
  );
  hgaBoom.rotation.z = Math.PI / 2.8;
  hgaGroup.add(hgaBoom);

  const dishGeo = new THREE.SphereGeometry(0.48, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2.3);
  const dishMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    metalness: 0.75,
    roughness: 0.25,
    side: THREE.DoubleSide,
  });
  const dishMesh = new THREE.Mesh(dishGeo, dishMat);
  dishMesh.position.set(0.45, 0.35, 0);
  dishMesh.rotation.z = -Math.PI / 3;
  hgaGroup.add(dishMesh);
  smGroup.add(hgaGroup);

  // 4 Quad RCS Thruster Pods
  const rcsPuffs: Record<string, THREE.Mesh> = {};
  const rcsPositions = [
    { name: 'POS_X', x: 1.25, z: 0 },
    { name: 'NEG_X', x: -1.25, z: 0 },
    { name: 'POS_Z', x: 0, z: 1.25 },
    { name: 'NEG_Z', x: 0, z: -1.25 },
  ];
  const rcsBlockMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.85, roughness: 0.2 });
  const puffMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 });

  rcsPositions.forEach((rcs) => {
    const block = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.18), rcsBlockMat);
    block.position.set(rcs.x, -0.2, rcs.z);
    smGroup.add(block);

    // Micro nozzles
    for (let n = -1; n <= 1; n += 2) {
      const noz = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.12, 8), rcsBlockMat);
      noz.position.set(rcs.x * 1.05, -0.2 + n * 0.06, rcs.z * 1.05);
      smGroup.add(noz);
    }

    // RCS gas puff cone
    const puff = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.75, 12), puffMat);
    puff.position.set(rcs.x * 1.35, -0.2, rcs.z * 1.35);
    puff.rotation.z = rcs.x > 0 ? -Math.PI / 2 : (rcs.x < 0 ? Math.PI / 2 : 0);
    puff.rotation.x = rcs.z > 0 ? Math.PI / 2 : (rcs.z < 0 ? -Math.PI / 2 : 0);
    smGroup.add(puff);
    rcsPuffs[rcs.name] = puff;
  });

  // ─── 3. 4 ULTRAFLEX SOLAR ARRAY WINGS (X-FORMATION) ───
  const solarWings: THREE.Group[] = [];
  const solarCellMat = new THREE.MeshStandardMaterial({
    color: 0x1e3a8a,
    metalness: 0.9,
    roughness: 0.12,
    emissive: 0x0f172a,
    emissiveIntensity: 0.3,
  });

  for (let wing = 0; wing < 4; wing++) {
    const wingAngle = (wing * Math.PI) / 2 + Math.PI / 4;
    const wingGroup = new THREE.Group();
    wingGroup.position.set(Math.cos(wingAngle) * 1.25, 0.1, Math.sin(wingAngle) * 1.25);
    wingGroup.rotation.y = -wingAngle;

    // Articulated boom arm
    const boomGeo = new THREE.BoxGeometry(0.85, 0.06, 0.06);
    const boom = new THREE.Mesh(boomGeo, rcsBlockMat);
    boom.position.x = 0.42;
    wingGroup.add(boom);

    // 3 Solar Array Panels
    for (let p = 0; p < 3; p++) {
      const panelGroup = new THREE.Group();
      panelGroup.position.set(1.1 + p * 0.92, 0, 0);

      const panelGeo = new THREE.BoxGeometry(0.86, 0.02, 0.52);
      const panelMesh = new THREE.Mesh(panelGeo, solarCellMat);
      panelMesh.castShadow = true;
      panelGroup.add(panelMesh);

      // Gold copper busbars
      const busbar = new THREE.Mesh(
        new THREE.BoxGeometry(0.86, 0.025, 0.04),
        new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9, roughness: 0.2 })
      );
      panelGroup.add(busbar);

      wingGroup.add(panelGroup);
    }

    smGroup.add(wingGroup);
    solarWings.push(wingGroup);
  }

  shipGroup.add(smGroup);

  // ─── 4. HIGH-PERFORMANCE AJ10 / RS-25 ROCKET ENGINE BELL ───
  const engineGroup = new THREE.Group();
  engineGroup.position.y = -2.1;

  // Gimbal Ring
  const gimbalRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.36, 0.04, 16, 24),
    new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.9, roughness: 0.2 })
  );
  gimbalRing.rotation.x = Math.PI / 2;
  engineGroup.add(gimbalRing);

  // Flared Niobium Bell Nozzle
  const bellGeo = new THREE.CylinderGeometry(0.28, 0.72, 1.15, 32, 1, true);
  const bellMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    metalness: 0.94,
    roughness: 0.15,
    side: THREE.DoubleSide,
  });
  const bellMesh = new THREE.Mesh(bellGeo, bellMat);
  bellMesh.position.y = -0.58;
  engineGroup.add(bellMesh);

  // Hot Ceramic Interior Throat (Glows at high throttle)
  const throatGeo = new THREE.ConeGeometry(0.26, 0.5, 24);
  const throatMat = new THREE.MeshStandardMaterial({
    color: 0x111827,
    emissive: 0xef4444,
    emissiveIntensity: 0,
    roughness: 0.5,
  });
  const engineThroat = new THREE.Mesh(throatGeo, throatMat);
  engineThroat.position.y = -0.22;
  engineGroup.add(engineThroat);

  // ─── 5. VOLUMETRIC SUPERSONIC EXHAUST PLUME ───
  // Layer 1: Supersonic Core Flame (Blinding Cyan/White)
  const corePlumeGeo = new THREE.ConeGeometry(0.32, 3.2, 24);
  const corePlumeMat = new THREE.MeshBasicMaterial({
    color: 0x67e8f9,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
  });
  const plumeCore = new THREE.Mesh(corePlumeGeo, corePlumeMat);
  plumeCore.rotation.x = Math.PI;
  plumeCore.position.y = -2.7;
  engineGroup.add(plumeCore);

  // Layer 2: Mach Shock Diamonds (3 Nodes)
  const shockDiamonds: THREE.Mesh[] = [];
  const diamondMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
  });
  for (let s = 0; s < 3; s++) {
    const diaMesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.12, 0), diamondMat);
    diaMesh.position.y = -1.8 - s * 0.7;
    engineGroup.add(diaMesh);
    shockDiamonds.push(diaMesh);
  }

  // Layer 3: Expanding Vacuum Plume Envelope (Amber-Orange)
  const outerPlumeGeo = new THREE.ConeGeometry(0.75, 4.8, 24);
  const outerPlumeMat = new THREE.MeshBasicMaterial({
    color: 0xf97316,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
  });
  const plumeOuter = new THREE.Mesh(outerPlumeGeo, outerPlumeMat);
  plumeOuter.rotation.x = Math.PI;
  plumeOuter.position.y = -3.5;
  engineGroup.add(plumeOuter);

  // Layer 4: Engine Light
  const engineLight = new THREE.PointLight(0xf97316, 0, 45);
  engineLight.position.y = -1.2;
  engineGroup.add(engineLight);

  shipGroup.add(engineGroup);

  // Dynamic Update Method
  const update = (throttle: number, time: number, rcsActive: boolean, heatAblationPct: number) => {
    const thrNorm = Math.max(0, Math.min(100, throttle)) / 100;

    // Plumes
    if (thrNorm > 0) {
      const flicker = 1 + (Math.random() - 0.5) * 0.15;
      (plumeCore.material as THREE.MeshBasicMaterial).opacity = (0.45 + thrNorm * 0.55) * flicker;
      plumeCore.scale.set(1, (0.5 + thrNorm * 1.8) * flicker, 1);

      (plumeOuter.material as THREE.MeshBasicMaterial).opacity = (0.2 + thrNorm * 0.65) * flicker;
      plumeOuter.scale.set(1 + thrNorm * 0.4, (0.5 + thrNorm * 1.8) * flicker, 1 + thrNorm * 0.4);

      shockDiamonds.forEach((dia, idx) => {
        (dia.material as THREE.MeshBasicMaterial).opacity = (0.35 + thrNorm * 0.65) * (1 - idx * 0.2);
        dia.scale.setScalar(0.8 + thrNorm * 0.6 + Math.sin(time * 25 + idx) * 0.15);
      });

      (engineThroat.material as THREE.MeshStandardMaterial).emissiveIntensity = thrNorm * 2.5;
      engineLight.intensity = thrNorm * 12;
    } else {
      (plumeCore.material as THREE.MeshBasicMaterial).opacity = 0;
      (plumeOuter.material as THREE.MeshBasicMaterial).opacity = 0;
      shockDiamonds.forEach((dia) => {
        (dia.material as THREE.MeshBasicMaterial).opacity = 0;
      });
      (engineThroat.material as THREE.MeshStandardMaterial).emissiveIntensity = 0;
      engineLight.intensity = 0;
    }

    // RCS Puffs
    puffMat.opacity = rcsActive ? 0.8 : 0;

    // Heat Shield incandescence during re-entry or Oberth atmospheric heating
    if (heatAblationPct > 0) {
      (heatShieldMesh.material as THREE.MeshStandardMaterial).emissive.setHex(0xef4444);
      (heatShieldMesh.material as THREE.MeshStandardMaterial).emissiveIntensity = Math.min(3.0, heatAblationPct * 3.0);
    } else {
      (heatShieldMesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0;
    }

    // Gentle solar array tracking
    solarWings.forEach((w, i) => {
      w.rotation.z = Math.sin(time * 0.2 + i * 0.5) * 0.04;
    });
  };

  return {
    shipGroup,
    plumeCore,
    plumeOuter,
    shockDiamonds,
    engineLight,
    engineThroat,
    heatShieldMesh,
    rcsPuffs,
    solarWings,
    update,
  };
}

function createPhotorealisticPlanet(
  bodyType: string,
  textureLoader: THREE.TextureLoader
) {
  const planetGroup = new THREE.Group();
  let surfaceMesh: THREE.Mesh;
  let cloudsMesh: THREE.Mesh | undefined;
  let atmoHalo: THREE.Mesh | undefined;
  let outerHaze: THREE.Mesh | undefined;
  let atmoInterfaceRing: THREE.Mesh | undefined;

  if (bodyType === 'EARTH') {
    const R = 36;
    const earthGeo = new THREE.SphereGeometry(R, 96, 96);
    const earthTex = textureLoader.load('/assets/earth_orbit.jpg');
    earthTex.wrapS = THREE.RepeatWrapping;
    earthTex.wrapT = THREE.ClampToEdgeWrapping;

    const earthMat = new THREE.MeshStandardMaterial({
      map: earthTex,
      roughness: 0.65,
      metalness: 0.12,
      emissive: 0x021020,
      emissiveIntensity: 0.18,
    });
    surfaceMesh = new THREE.Mesh(earthGeo, earthMat);
    surfaceMesh.receiveShadow = true;
    planetGroup.add(surfaceMesh);

    // Drifting Cloud Deck
    const cloudsGeo = new THREE.SphereGeometry(R * 1.008, 64, 64);
    const cloudsTex = textureLoader.load('/assets/planets/earth_clouds.png');
    cloudsTex.wrapS = THREE.RepeatWrapping;
    const cloudsMat = new THREE.MeshStandardMaterial({
      map: cloudsTex,
      transparent: true,
      opacity: 0.45,
      blending: THREE.NormalBlending,
      roughness: 0.9,
    });
    cloudsMesh = new THREE.Mesh(cloudsGeo, cloudsMat);
    planetGroup.add(cloudsMesh);

    // Inner Rayleigh Scattering Atmospheric Limb
    const atmoGeo = new THREE.SphereGeometry(R * 1.025, 64, 64);
    const atmoMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.42,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
    });
    atmoHalo = new THREE.Mesh(atmoGeo, atmoMat);
    planetGroup.add(atmoHalo);

    // Outer Soft Stratospheric Haze
    const hazeGeo = new THREE.SphereGeometry(R * 1.055, 48, 48);
    const hazeMat = new THREE.MeshBasicMaterial({
      color: 0x0284c7,
      transparent: true,
      opacity: 0.18,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
    });
    outerHaze = new THREE.Mesh(hazeGeo, hazeMat);
    planetGroup.add(outerHaze);

    // 120km Atmospheric Entry Interface Guide Ring
    const ringGeo = new THREE.RingGeometry(R * 1.018, R * 1.022, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.45,
    });
    atmoInterfaceRing = new THREE.Mesh(ringGeo, ringMat);
    atmoInterfaceRing.rotation.x = -Math.PI / 2;
    planetGroup.add(atmoInterfaceRing);
  } else if (bodyType === 'MOON') {
    const R = 24;
    const moonGeo = new THREE.SphereGeometry(R, 96, 96);
    const moonTex = textureLoader.load('/assets/moon_texture.jpg');
    const moonMat = new THREE.MeshStandardMaterial({
      map: moonTex,
      bumpMap: moonTex,
      bumpScale: 0.45,
      roughness: 0.94,
      metalness: 0.04,
    });
    surfaceMesh = new THREE.Mesh(moonGeo, moonMat);
    surfaceMesh.receiveShadow = true;
    planetGroup.add(surfaceMesh);
  } else if (bodyType === 'GAS_GIANT') {
    const R = 48;
    const jupGeo = new THREE.SphereGeometry(R, 96, 96);
    const jupTex = textureLoader.load('/assets/planets/jupiter.jpg');
    const jupMat = new THREE.MeshStandardMaterial({
      map: jupTex,
      roughness: 0.72,
      metalness: 0.08,
    });
    surfaceMesh = new THREE.Mesh(jupGeo, jupMat);
    surfaceMesh.receiveShadow = true;
    planetGroup.add(surfaceMesh);

    // Jovian Amber Atmospheric Glow
    const jupAtmoGeo = new THREE.SphereGeometry(R * 1.035, 64, 64);
    const jupAtmoMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.35,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
    });
    atmoHalo = new THREE.Mesh(jupAtmoGeo, jupAtmoMat);
    planetGroup.add(atmoHalo);
  } else {
    // MARS
    const R = 28;
    const marsGeo = new THREE.SphereGeometry(R, 96, 96);
    const marsTex = textureLoader.load('/assets/mars_texture.jpg');
    const marsMat = new THREE.MeshStandardMaterial({
      map: marsTex,
      bumpMap: marsTex,
      bumpScale: 0.35,
      roughness: 0.88,
      metalness: 0.05,
    });
    surfaceMesh = new THREE.Mesh(marsGeo, marsMat);
    surfaceMesh.receiveShadow = true;
    planetGroup.add(surfaceMesh);

    const marsAtmoGeo = new THREE.SphereGeometry(R * 1.02, 48, 48);
    const marsAtmoMat = new THREE.MeshBasicMaterial({
      color: 0xf97316,
      transparent: true,
      opacity: 0.25,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
    });
    atmoHalo = new THREE.Mesh(marsAtmoGeo, marsAtmoMat);
    planetGroup.add(atmoHalo);
  }

  return { planetGroup, surfaceMesh, cloudsMesh, atmoHalo, outerHaze, atmoInterfaceRing };
}

function createDebrisMeshes(scene: THREE.Scene, count: number): THREE.Mesh[] {
  const meshes: THREE.Mesh[] = [];

  const panelMat = new THREE.MeshStandardMaterial({
    color: 0x1e3a8a,
    metalness: 0.9,
    roughness: 0.15,
  });
  const goldFoilMat = new THREE.MeshStandardMaterial({
    color: 0xd97706,
    metalness: 0.95,
    roughness: 0.25,
  });
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    metalness: 0.85,
    roughness: 0.3,
  });
  const charredMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    metalness: 0.6,
    roughness: 0.7,
  });

  for (let i = 0; i < count; i++) {
    let mesh: THREE.Mesh;
    const variant = i % 4;

    if (variant === 0) {
      // Shattered Solar Array Panel
      mesh = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.04, 0.65), panelMat);
    } else if (variant === 1) {
      // Rocket Tank / Interstage Cylinder
      mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 1.4, 12), metalMat);
    } else if (variant === 2) {
      // Defunct Satellite Body
      mesh = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.65, 0.85), goldFoilMat);
    } else {
      // Jagged Titanium Fragment
      mesh = new THREE.Mesh(new THREE.DodecahedronGeometry(0.48, 1), charredMat);
      mesh.scale.set(1.5, 0.45, 1.2);
    }

    mesh.castShadow = true;
    mesh.visible = false;
    scene.add(mesh);
    meshes.push(mesh);
  }

  return meshes;
}

interface HardcoreSurvivalSimulatorProps {
  initialMissionId?: HardcoreMissionId;
  onClose: () => void;
  onMissionCompleted?: (missionId: HardcoreMissionId, credits: number) => void;
}

export const HardcoreSurvivalSimulator: React.FC<HardcoreSurvivalSimulatorProps> = ({
  initialMissionId = 'kessler-syndrome',
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
  const [autopilotMode, setAutopilotMode] = useState<'OFF' | 'PROGRADE' | 'RETROGRADE' | 'CIRCULARIZE'>('OFF');
  const [timeWarp, setTimeWarp] = useState<number>(1);

  const autopilotModeRef = useRef<'OFF' | 'PROGRADE' | 'RETROGRADE' | 'CIRCULARIZE'>('OFF');
  autopilotModeRef.current = autopilotMode;
  const timeWarpRef = useRef<number>(1);
  timeWarpRef.current = timeWarp;

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
    rcsTimer: 0,
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
      rcsTimer: 0,
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

    setAutopilotMode('OFF');
    setTimeWarp(1);

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
        physStateRef.current.rcsTimer = 0.3;
        setAutopilotMode('OFF');
        if (physStateRef.current.pitchRad > Math.PI) physStateRef.current.pitchRad -= Math.PI * 2;
        setTelemetry((prev) => ({ ...prev, pitchDeg: (physStateRef.current.pitchRad * 180) / Math.PI }));
      } else if (key === 'd') {
        physStateRef.current.pitchRad -= 0.05;
        physStateRef.current.rcsTimer = 0.3;
        setAutopilotMode('OFF');
        if (physStateRef.current.pitchRad < -Math.PI) physStateRef.current.pitchRad += Math.PI * 2;
        setTelemetry((prev) => ({ ...prev, pitchDeg: (physStateRef.current.pitchRad * 180) / Math.PI }));
      } else if (key === ' ' || e.code === 'Space') {
        // RCS Translation Pulse
        e.preventDefault();
        physStateRef.current.rcsTimer = 0.3;
        if (activeMission.rcsOnly) {
          physStateRef.current.pitchRad += 0.04;
          physStateRef.current.vxKms += 0.06;
          physStateRef.current.countdownTimer = Math.max(0, physStateRef.current.countdownTimer - 1.2);
        }
        if (soundEnabled) soundFx.playThruster();
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

    // 2. Realistic Space Lighting
    const sunLight = new THREE.DirectionalLight(0xfffbeb, 3.2);
    sunLight.position.set(250, 180, 220);
    sunLight.castShadow = true;
    scene.add(sunLight);

    // Planetary Albedo Bounce Light (Soft blue light bouncing from Earth onto the underside of the spacecraft)
    const albedoColor = activeMission.targetBody === 'EARTH' ? 0x38bdf8 : (activeMission.targetBody === 'GAS_GIANT' ? 0xf59e0b : 0x94a3b8);
    const albedoLight = new THREE.DirectionalLight(albedoColor, 0.75);
    albedoLight.position.set(0, -100, 0);
    scene.add(albedoLight);

    const ambientLight = new THREE.AmbientLight(0x0f172a, 0.4);
    scene.add(ambientLight);

    // 3. Multi-Spectral Deep Space Starfield (4,000 Stars with Realistic Stellar Spectral Types)
    const starCount = 4000;
    const starsGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const idx = i * 3;
      const r = 2500 + Math.random() * 2000;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      starPositions[idx] = r * Math.sin(phi) * Math.cos(theta);
      starPositions[idx + 1] = r * Math.sin(phi) * Math.sin(theta);
      starPositions[idx + 2] = r * Math.cos(phi);

      const spec = Math.random();
      if (spec > 0.85) {
        // Hot blue star (O/B type)
        starColors[idx] = 0.65;
        starColors[idx + 1] = 0.85;
        starColors[idx + 2] = 1.0;
      } else if (spec > 0.6) {
        // White star (A/F type)
        starColors[idx] = 0.95;
        starColors[idx + 1] = 0.95;
        starColors[idx + 2] = 1.0;
      } else if (spec > 0.25) {
        // Yellow solar analogue (G type)
        starColors[idx] = 1.0;
        starColors[idx + 1] = 0.95;
        starColors[idx + 2] = 0.75;
      } else {
        // Red dwarf (M type)
        starColors[idx] = 1.0;
        starColors[idx + 1] = 0.6;
        starColors[idx + 2] = 0.45;
      }
    }
    starsGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starsGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
    const starsMat = new THREE.PointsMaterial({
      size: 2.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      sizeAttenuation: false,
    });
    const starField = new THREE.Points(starsGeo, starsMat);
    scene.add(starField);

    // 4. Central Photorealistic Celestial Body
    const bodyConfig = CELESTIAL_BODIES[activeMission.targetBody];
    const textureLoader = new THREE.TextureLoader();
    const planet = createPhotorealisticPlanet(activeMission.targetBody, textureLoader);
    scene.add(planet.planetGroup);

    // 5. Authentic NASA Spacecraft (Command Capsule + Service Module + Solar Wings + Engine)
    const craft = createPhotorealisticSpacecraft();
    scene.add(craft.shipGroup);

    // Interactive 360° OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 3.5;
    controls.maxDistance = 140;

    // 6. Orbital Trajectory Prediction Line
    const trajectoryPoints = 120;
    const trajPositions = new Float32Array(trajectoryPoints * 3);
    const trajGeo = new THREE.BufferGeometry();
    trajGeo.setAttribute('position', new THREE.BufferAttribute(trajPositions, 3));
    const trajMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: activeMission.hideTrajectoryLine ? 0 : 0.8,
      linewidth: 2,
    });
    const trajLine = new THREE.Line(trajGeo, trajMat);
    scene.add(trajLine);

    // 7. Debris Meshes for Kessler Syndrome
    debrisMeshesRef.current = [];
    if (activeMission.hasDebrisField) {
      debrisMeshesRef.current = createDebrisMeshes(scene, 45);
    }

    // 3D Threat Target Reticle (Snaps to nearest approaching debris hazard)
    const reticleGeo = new THREE.OctahedronGeometry(1.2, 0);
    const reticleMat = new THREE.MeshBasicMaterial({ color: 0xef4444, wireframe: true });
    const threatReticle = new THREE.Mesh(reticleGeo, reticleMat);
    threatReticle.visible = false;
    scene.add(threatReticle);

    // 7.5 Cosmic Motion Streaks / Space Dust Particle Field (High-Velocity Orbital Warp)
    const speedParticleCount = 650;
    const speedParticleGeo = new THREE.BufferGeometry();
    const speedParticlePos = new Float32Array(speedParticleCount * 3);
    const speedParticleVels = new Float32Array(speedParticleCount);
    for (let i = 0; i < speedParticleCount; i++) {
      speedParticlePos[i * 3] = (Math.random() - 0.5) * 60;
      speedParticlePos[i * 3 + 1] = (Math.random() - 0.5) * 40;
      speedParticlePos[i * 3 + 2] = (Math.random() - 0.5) * 110;
      speedParticleVels[i] = 0.6 + Math.random() * 1.6;
    }
    speedParticleGeo.setAttribute('position', new THREE.BufferAttribute(speedParticlePos, 3));
    const speedParticleMat = new THREE.PointsMaterial({
      color: 0x93c5fd,
      size: 1.5,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    });
    const speedParticles = new THREE.Points(speedParticleGeo, speedParticleMat);
    scene.add(speedParticles);

    // 8. 60FPS Physics Simulation & Render Loop
    let animId: number;
    let lastTime = performance.now();
    let lastHudTime = 0;

    const renderLoop = () => {
      animId = requestAnimationFrame(renderLoop);
      const now = performance.now();
      const rawDt = Math.min((now - lastTime) / 1000, 0.05); // cap delta-time
      lastTime = now;
      const warp = timeWarpRef.current || 1;
      const dt = rawDt * warp;

      const p = physStateRef.current;
      let nearestDebrisList: Array<{ x: number; y: number; z: number; distanceKm: number }> = [];

      // Autopilot / Flight Computer Steering
      if (autopilotModeRef.current === 'PROGRADE') {
        p.pitchRad = THREE.MathUtils.lerp(p.pitchRad, 0, dt * 5);
      } else if (autopilotModeRef.current === 'RETROGRADE') {
        p.pitchRad = THREE.MathUtils.lerp(p.pitchRad, Math.PI, dt * 5);
      } else if (autopilotModeRef.current === 'CIRCULARIZE') {
        p.pitchRad = THREE.MathUtils.lerp(p.pitchRad, 0, dt * 5);
        if (p.altKm < 535) {
          if (p.rKm < bodyConfig.radiusKm + 540) {
            p.throttle = 100;
          } else {
            p.throttle = 0;
          }
        } else {
          // Circularization burn
          if (p.vxKms < 7.58) {
            p.throttle = 80;
          } else {
            p.throttle = 0;
            setAutopilotMode('OFF');
          }
        }
      }

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

        // Debris collision & proximity tracking for Mission 1 (Kessler Syndrome)
        if (p.invulnTimer > 0) p.invulnTimer -= dt;
        if (activeMission.hasDebrisField && debrisFieldRef.current.length > 0) {
          const px = p.rKm * Math.cos(p.orbitalTheta);
          const pz = p.rKm * Math.sin(p.orbitalTheta);
          const py = 0;

          nearestDebrisList = debrisFieldRef.current.map((d) => {
            d.x += d.vx * dt;
            d.y += d.vy * dt;
            d.z += d.vz * dt;

            const dx = d.x - px;
            const dy = d.y - py;
            const dz = d.z - pz;
            const distKm = Math.sqrt(dx * dx + dy * dy + dz * dz);

            if (distKm < 0.12 && p.invulnTimer <= 0) {
              // Collision impact!
              p.hull = Math.max(0, p.hull - 20);
              p.fuelLeak = true;
              p.invulnTimer = 2.0; // 2s invulnerability grace
              p.shakeIntensity = 1.0;
              if (soundEnabled) soundFx.playImpact();
              d.x += 200; // disperse collided fragment
            }

            return { x: dx, y: dy, z: dz, distanceKm: distKm };
          }).sort((a, b) => a.distanceKm - b.distanceKm);

          if (p.hull <= 0 && p.outcome === 'IN_PROGRESS') {
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
        }

        // Evaluate modular mission rules from survivalMissions.js
        const ruleCheck = evaluateMissionRules(
          activeMission,
          {
            altKm: p.altKm,
            vKms: p.vKms,
            vyKms: p.vyKms,
            vxKms: p.vxKms,
            fuel: p.fuel,
            hull: p.hull,
            fuelLeak: p.fuelLeak,
            engineHeat: p.engineHeat,
            engineOverheated: p.overheatCooldown > 0,
            heatShield: p.heatShield,
            countdownTimer: p.countdownTimer,
            time: p.time,
          },
          kepler
        );

        if (ruleCheck.isGameOver && p.outcome === 'IN_PROGRESS') {
          p.outcome = ruleCheck.outcome;
          if (ruleCheck.outcome === 'SUCCESS') {
            p.successMessage = ruleCheck.reason || 'HARDCORE SURVIVAL MISSION ACCOMPLISHED!';
            confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
            if (soundEnabled) soundFx.playVictory();
            awardCadetCredits(500);
            onMissionCompleted?.(activeMission.id, 500);
          } else {
            p.failureReason = ruleCheck.reason || 'MISSION FAILED';
            if (soundEnabled) soundFx.playExplosion();
          }
        }

        // HUD Warnings list
        const warnings: string[] = [...ruleCheck.warnings];
        if (nearestDebrisList[0] && nearestDebrisList[0].distanceKm < 60) {
          warnings.unshift(`⚠️ PROXIMITY ALERT · DEBRIS CLOSING (${nearestDebrisList[0].distanceKm.toFixed(1)} km)`);
        }

        // Update React HUD state (throttled to 10 FPS for optimal performance)
        if (now - lastHudTime > 90 || p.outcome !== 'IN_PROGRESS') {
          lastHudTime = now;

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
            radarDebris: nearestDebrisList.slice(0, 35),
            warningAlerts: warnings,
            cameraShakeIntensity: p.shakeIntensity,
            isGameOver: p.outcome !== 'IN_PROGRESS',
            outcome: p.outcome,
            failureReason: p.failureReason,
            successMessage: p.successMessage,
          });
        }
      }

      // 9. Update Spacecraft Model Visuals & Rocket Engine Dynamics
      const thr = p.throttle;
      const heatAblation = activeMission.hasHeatShield ? (100 - p.heatShield) / 100 : 0;
      const reEntryHeat = (p.altKm < 120 && p.vKms > 6) ? Math.min(1.0, (120 - p.altKm) / 60) : 0;
      craft.update(thr, p.time, p.rcsTimer > 0, Math.max(heatAblation, reEntryHeat));

      // Update 3D Spacecraft orientation & visual response
      // Align 0 rad = Prograde (horizontal +X with engine blasting backwards -X)
      craft.shipGroup.rotation.z = -Math.PI / 2 + p.pitchRad;
      craft.shipGroup.rotation.x = Math.sin(p.time * 2.5) * 0.02;
      craft.shipGroup.rotation.y = (p.yawRad || 0) + Math.cos(p.time * 1.5) * 0.015;

      // Dynamic Spacecraft Recoil & G-Force Drift
      const recoilZ = -(p.throttle / 100) * 0.8;
      craft.shipGroup.position.z = THREE.MathUtils.lerp(craft.shipGroup.position.z, recoilZ, rawDt * 6);
      craft.shipGroup.position.y = THREE.MathUtils.lerp(craft.shipGroup.position.y, Math.sin(p.time * 2.5) * 0.05, rawDt * 4);

      // 10. Update Central Celestial Body Placement & Rotation
      const R = activeMission.targetBody === 'GAS_GIANT' ? 48 : (activeMission.targetBody === 'MOON' ? 24 : 36);
      const altRatio = Math.min(2.5, p.altKm / Math.max(1, bodyConfig.radiusKm));
      const planetDist = R + 4.5 + altRatio * (R * 2.2);
      planet.planetGroup.position.set(0, -planetDist, -8);

      // Visibly roll planet surface & drifting cloud layer beneath spacecraft at orbital velocity!
      const orbitalRollRate = (Math.abs(p.vxKms) / 7.8) * 0.008 * (timeWarpRef.current || 1) * rawDt * 60;
      planet.surfaceMesh.rotation.z += orbitalRollRate;
      if (planet.cloudsMesh) planet.cloudsMesh.rotation.z += orbitalRollRate * 1.15;
      planet.surfaceMesh.rotation.y += 0.0004;
      starField.rotation.y += 0.0001;

      // Stream cosmic speed particles past spacecraft
      const orbitalSpeedMult = Math.max(1.2, (p.vKms / 7.8) * 3.5 + (p.throttle / 100) * 16.0);
      const posArr = speedParticleGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < speedParticleCount; i++) {
        posArr[i * 3 + 2] += orbitalSpeedMult * speedParticleVels[i] * rawDt * 28;
        if (posArr[i * 3 + 2] > 40) {
          posArr[i * 3 + 2] = -70;
          posArr[i * 3] = (Math.random() - 0.5) * 60;
          posArr[i * 3 + 1] = (Math.random() - 0.5) * 40;
        }
      }
      speedParticleGeo.attributes.position.needsUpdate = true;
      speedParticleMat.size = 1.3 + (p.throttle / 100) * 1.6;

      // 11. Update 3D Space Debris Meshes & Threat Reticle (Kessler Syndrome)
      if (activeMission.hasDebrisField && debrisFieldRef.current.length > 0) {
        const px = p.rKm * Math.cos(p.orbitalTheta);
        const pz = p.rKm * Math.sin(p.orbitalTheta);

        let closestVisibleMesh: THREE.Mesh | null = null;
        let closestVisDist = 9999;

        for (let i = 0; i < debrisMeshesRef.current.length; i++) {
          const dMesh = debrisMeshesRef.current[i];
          const dData = debrisFieldRef.current[i];
          if (dMesh && dData) {
            const dx = dData.x - px;
            const dy = dData.y;
            const dz = dData.z - pz;
            const distKm = Math.hypot(dx, dy, dz);

            // Display debris within 160 km in visible frustum range
            if (distKm < 160) {
              dMesh.visible = true;
              const visDist = 3.8 + (distKm / 160) * 44;
              const normX = dx / Math.max(0.1, distKm);
              const normY = dy / Math.max(0.1, distKm);
              const normZ = dz / Math.max(0.1, distKm);

              dMesh.position.set(normX * visDist, normY * visDist, normZ * visDist);
              dMesh.rotation.x += 0.035;
              dMesh.rotation.y += 0.045;

              if (visDist < closestVisDist) {
                closestVisDist = visDist;
                closestVisibleMesh = dMesh;
              }
            } else {
              dMesh.visible = false;
            }
          }
        }

        // Snap 3D Threat Target Reticle to closest approaching debris object
        if (nearestDebrisList[0] && nearestDebrisList[0].distanceKm < 35 && closestVisibleMesh) {
          threatReticle.visible = true;
          threatReticle.position.copy(closestVisibleMesh.position);
          threatReticle.rotation.y += 0.08;
          threatReticle.rotation.z += 0.05;
        } else {
          threatReticle.visible = false;
        }
      }

      // 12. Update Predicted Orbit Trajectory Line (if not blinded)
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
          const rCurve = (a * (1 - e * e)) / Math.max(0.01, 1 + e * Math.cos(theta));
          const scaleR = (rCurve / bodyConfig.radiusKm) * R;

          positions[i * 3] = Math.cos(theta) * scaleR;
          positions[i * 3 + 1] = Math.sin(p.pitchRad * 0.2) * 1.5;
          positions[i * 3 + 2] = Math.sin(theta) * scaleR - 8;
        }
        trajGeo.attributes.position.needsUpdate = true;
      }

      // 13. Camera View & Dynamic Shake
      const shakeX = (Math.random() - 0.5) * p.shakeIntensity * 0.35;
      const shakeY = (Math.random() - 0.5) * p.shakeIntensity * 0.35;

      if (cameraMode === 'orbit') {
        controls.enabled = true;
        controls.target.copy(craft.shipGroup.position);
        controls.update();
      } else if (cameraMode === 'cockpit') {
        controls.enabled = false;
        camera.position.set(0 + shakeX, 1.35 + shakeY, 0.45);
        camera.lookAt(0, 1.2, -30);
      } else {
        // Dynamic Chase Camera with G-force lag
        controls.enabled = false;
        const chasePos = new THREE.Vector3(
          0 + shakeX,
          3.6 + shakeY - p.pitchRad * 1.2,
          11.5 + shakeX
        );
        camera.position.lerp(chasePos, dt * 5.0);
        camera.lookAt(craft.shipGroup.position.clone().add(new THREE.Vector3(0, 0.4, 0)));
      }

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
      controls.dispose();
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
        transform: telemetry.cameraShakeIntensity > 0.05
          ? `translate(${(Math.random() - 0.5) * telemetry.cameraShakeIntensity * 6}px, ${(Math.random() - 0.5) * telemetry.cameraShakeIntensity * 6}px)`
          : 'none',
        transition: telemetry.cameraShakeIntensity > 0.05 ? 'none' : 'transform 0.1s ease',
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
          alignItems: 'center',
          gap: '8px',
          overflowX: 'auto',
          zIndex: 35,
          backdropFilter: 'blur(16px)',
        }}
      >
        <div style={{ fontSize: '10px', fontWeight: 900, color: '#ef4444', letterSpacing: '0.08em', marginRight: '6px', whiteSpace: 'nowrap' }}>
          CHOOSE MISSION:
        </div>
        {HARDCORE_SURVIVAL_MISSIONS.slice(0, 5).map((m) => {
          const isSelected = m.id === selectedMissionId;
          return (
            <button
              key={m.id}
              onClick={() => setSelectedMissionId(m.id)}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: isSelected ? '1.5px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.1)',
                background: isSelected
                  ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.35), rgba(15, 23, 42, 0.95))'
                  : 'rgba(255, 255, 255, 0.03)',
                color: isSelected ? '#ffffff' : '#94a3b8',
                fontSize: '11px',
                fontWeight: 900,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                whiteSpace: 'nowrap',
                boxShadow: isSelected ? '0 0 16px rgba(239, 68, 68, 0.45)' : 'none',
                transition: 'all 0.2s ease',
              }}
            >
              <span style={{ color: '#ef4444', fontWeight: 900 }}>M{m.missionNumber}</span>
              <span>{m.title.includes(':') ? m.title.split(':')[1].trim() : m.title}</span>
            </button>
          );
        })}
      </div>

      {/* ─── SCENARIO & OBJECTIVE QUICK BAR ─── */}
      <div
        style={{
          background: 'rgba(2, 6, 23, 0.85)',
          borderBottom: '1px solid rgba(239, 68, 68, 0.2)',
          padding: '6px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '11px',
          color: '#cbd5e1',
          backdropFilter: 'blur(12px)',
          zIndex: 34,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          <span style={{ color: '#ef4444', fontWeight: 900 }}>SCENARIO:</span>
          <span style={{ color: '#f8fafc', fontWeight: 600 }}>{activeMission.scenario}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap', marginLeft: '16px' }}>
          <span style={{ color: '#38bdf8', fontWeight: 900 }}>🎯 GOAL:</span>
          <span style={{ color: '#e2e8f0', fontWeight: 700 }}>{activeMission.targetObjective}</span>
        </div>
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

        {/* ── REAL-TIME FLIGHT DIRECTOR GUIDANCE BANNER (TOP CENTER) ── */}
        <div
          style={{
            position: 'absolute',
            top: telemetry.warningAlerts.length > 0 ? '66px' : '18px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 58, 138, 0.92))',
            border: '1.5px solid #38bdf8',
            borderRadius: '10px',
            padding: '8px 18px',
            boxShadow: '0 4px 20px rgba(56, 189, 248, 0.35)',
            zIndex: 28,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            maxWidth: '750px',
            backdropFilter: 'blur(16px)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: 900, color: '#38bdf8' }}>
            <span>🧭 GUIDANCE:</span>
            <span style={{ color: '#ffffff', fontWeight: 800 }}>
              {activeMission.id === 'kessler-syndrome' ? (
                telemetry.apoapsisKm < 530 ? (
                  `🔥 PHASE 1: BURN PROGRADE [0°] AT 100% THROTTLE TO RAISE APOAPSIS TO 550 KM (CURRENT AP: ${telemetry.apoapsisKm.toFixed(0)} KM)`
                ) : telemetry.periapsisKm < 515 ? (
                  `🚀 PHASE 2: CIRCULARIZE! BURN PROGRADE [0°] TO RAISE PERIAPSIS TO 550 KM (CURRENT PE: ${telemetry.periapsisKm.toFixed(0)} KM)`
                ) : (
                  `🎉 ORBIT STABILIZED AT 550 KM! MISSION SUCCESS ACHIEVED!`
                )
              ) : activeMission.id === 'solar-storm' ? (
                telemetry.periapsisKm < 120 ? (
                  `☀️ BLIND NAVIGATION: MAINTAIN THROTTLE 65-75% TO ACHIEVE PERIAPSIS > 120 KM WITHOUT OVERHEATING ENGINE!`
                ) : (
                  `🎉 STABLE ORBIT ACHIEVED VIA NUMERICAL TELEMETRY!`
                )
              ) : activeMission.id === 'apollo-13' ? (
                `⏱️ MANUAL RCS BURNS: STEER ENTRY ANGLE TO EXACTLY 5.5° - 7.5° (CURRENT: ${Math.abs(telemetry.flightPathAngleDeg).toFixed(2)}°)`
              ) : activeMission.id === 'oberth-slingshot' ? (
                telemetry.verticalSpeedKms < 0 ? (
                  `⚡ GRAVITY WELL PLUNGE: COASTING TO PERIAPSIS... WAIT FOR CLOSEST APPROACH BEFORE FIRING!`
                ) : (
                  `🔥 EXECUTE FULL THROTTLE NOW! OBERTH EFFECT SLINGSHOT TO ESCAPE VELOCITY (>= 52 KM/S)!`
                )
              ) : (
                telemetry.suicideBurnIgnitionRequired ? (
                  `💥 FULL THROTTLE RETROGRADE NOW! HOVERSLAM TOUCHDOWN < 3.0 M/S!`
                ) : (
                  `DECELERATION RADAR: WAIT FOR IGNITION ALTITUDE (${telemetry.suicideBurnDistanceM.toFixed(0)}m)...`
                )
              )}
            </span>
          </div>

          {activeMission.id === 'kessler-syndrome' && (
            <button
              onClick={() => {
                setAutopilotMode((prev) => (prev === 'CIRCULARIZE' ? 'OFF' : 'CIRCULARIZE'));
                if (soundEnabled) soundFx.playClick(1200);
              }}
              style={{
                background: autopilotMode === 'CIRCULARIZE' ? '#16a34a' : 'linear-gradient(135deg, #0284c7, #2563eb)',
                border: '1px solid #38bdf8',
                borderRadius: '6px',
                padding: '4px 10px',
                color: '#ffffff',
                fontSize: '10px',
                fontWeight: 900,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                boxShadow: '0 0 10px rgba(56, 189, 248, 0.4)',
              }}
            >
              {autopilotMode === 'CIRCULARIZE' ? '⚡ AUTO-PILOT RUNNING' : '🚀 AUTO-CIRCULARIZE (550 KM)'}
            </button>
          )}
        </div>

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

        {/* ── TACTICAL CIRCULAR ORBITAL DEBRIS RADAR (KESSLER & THREAT TRACKER) ── */}
        <div
          style={{
            position: 'absolute',
            bottom: '24px',
            left: '20px',
            width: '260px',
            background: 'rgba(10, 15, 26, 0.90)',
            border: activeMission.hasDebrisField
              ? '1.5px solid rgba(239, 68, 68, 0.55)'
              : '1px solid rgba(56, 189, 248, 0.35)',
            borderRadius: '12px',
            padding: '10px 12px',
            backdropFilter: 'blur(16px)',
            boxShadow: activeMission.hasDebrisField
              ? '0 8px 30px rgba(239, 68, 68, 0.25)'
              : '0 8px 30px rgba(0,0,0,0.7)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '6px',
            zIndex: 25,
          }}
        >
          <div
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              paddingBottom: '4px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', fontWeight: 900, color: activeMission.hasDebrisField ? '#ef4444' : '#38bdf8' }}>
              <Compass size={13} />
              <span>TACTICAL ORBITAL RADAR</span>
            </div>
            <span style={{ fontSize: '8.5px', fontFamily: 'var(--font-mono)', color: '#94a3b8' }}>
              {activeMission.hasDebrisField ? 'DEBRIS: 110' : activeMission.hideTrajectoryLine ? 'OFFLINE' : 'RNG: 500KM'}
            </span>
          </div>

          {/* SVG Radar Display */}
          <div style={{ position: 'relative', width: '150px', height: '150px' }}>
            <svg width="150" height="150" viewBox="0 0 150 150">
              <defs>
                <radialGradient id="radarGrad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#032541" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#020817" stopOpacity="0.95" />
                </radialGradient>
              </defs>
              {/* Background Circle */}
              <circle cx="75" cy="75" r="70" fill="url(#radarGrad)" stroke={activeMission.hasDebrisField ? 'rgba(239, 68, 68, 0.4)' : 'rgba(56, 189, 248, 0.3)'} strokeWidth="1.5" />

              {/* Concentric Range Rings */}
              <circle cx="75" cy="75" r="50" fill="none" stroke="rgba(255, 255, 255, 0.12)" strokeDasharray="3,3" />
              <circle cx="75" cy="75" r="30" fill="none" stroke="rgba(255, 255, 255, 0.12)" strokeDasharray="3,3" />
              <circle cx="75" cy="75" r="10" fill="none" stroke="rgba(255, 255, 255, 0.15)" />

              {/* Crosshairs */}
              <line x1="75" y1="5" x2="75" y2="145" stroke="rgba(255, 255, 255, 0.08)" />
              <line x1="5" y1="75" x2="145" y2="75" stroke="rgba(255, 255, 255, 0.08)" />

              {/* Rotating Radar Sweep Line */}
              {!activeMission.hideTrajectoryLine && (
                <line
                  x1="75"
                  y1="75"
                  x2={75 + 68 * Math.cos(telemetry.timeSec * 2.5)}
                  y2={75 + 68 * Math.sin(telemetry.timeSec * 2.5)}
                  stroke={activeMission.hasDebrisField ? 'rgba(239, 68, 68, 0.7)' : 'rgba(56, 189, 248, 0.7)'}
                  strokeWidth="1.5"
                />
              )}

              {/* Geomagnetic Storm Static Lines (Mission 2) */}
              {activeMission.hideTrajectoryLine && (
                <>
                  <line x1="15" y1="35" x2="135" y2="35" stroke="rgba(245, 158, 11, 0.4)" strokeDasharray="4,6" />
                  <line x1="25" y1="75" x2="125" y2="75" stroke="rgba(245, 158, 11, 0.5)" strokeDasharray="2,5" />
                  <line x1="15" y1="115" x2="135" y2="115" stroke="rgba(245, 158, 11, 0.4)" strokeDasharray="5,8" />
                  <text x="75" y="79" fill="#f59e0b" fontSize="8" fontWeight="bold" textAnchor="middle">SENSOR BLINDED</text>
                </>
              )}

              {/* Debris Blips (Red Dots on Radar for Kessler Syndrome) */}
              {activeMission.hasDebrisField &&
                telemetry.radarDebris.slice(0, 25).map((deb, i) => {
                  const maxRangeKm = 500;
                  const rPx = Math.min(68, (deb.distanceKm / maxRangeKm) * 68);
                  const angle = Math.atan2(deb.z, deb.x);
                  const cx = 75 + rPx * Math.cos(angle);
                  const cy = 75 + rPx * Math.sin(angle);
                  const isThreat = deb.distanceKm < 80;

                  return (
                    <g key={i}>
                      <circle cx={cx} cy={cy} r={isThreat ? 3.5 : 2.2} fill="#ef4444" stroke="#ffffff" strokeWidth="0.6" />
                      {isThreat && (
                        <circle cx={cx} cy={cy} r="5.5" fill="none" stroke="#ef4444" strokeWidth="1" strokeDasharray="2,2" />
                      )}
                    </g>
                  );
                })}

              {/* Center Spacecraft Triangle */}
              <polygon
                points="75,69 71,81 79,81"
                fill="#34d399"
                stroke="#ffffff"
                strokeWidth="0.8"
                transform={`rotate(${telemetry.pitchDeg}, 75, 75)`}
              />
            </svg>

            {/* Range Labels */}
            <div style={{ position: 'absolute', top: '10px', right: '14px', fontSize: '7.5px', color: '#64748b' }}>500km</div>
            <div style={{ position: 'absolute', top: '27px', right: '28px', fontSize: '7.5px', color: '#64748b' }}>250km</div>
            <div style={{ position: 'absolute', top: '45px', right: '44px', fontSize: '7.5px', color: '#64748b' }}>100km</div>
          </div>

          {/* Radar Threat Readout */}
          <div style={{ fontSize: '9px', textAlign: 'center', width: '100%' }}>
            {activeMission.hasDebrisField ? (
              <span style={{ color: telemetry.radarDebris[0]?.distanceKm < 80 ? '#ef4444' : '#fbbf24', fontWeight: 800 }}>
                {telemetry.radarDebris[0]
                  ? `NEAREST DEBRIS: ${telemetry.radarDebris[0].distanceKm.toFixed(1)} km`
                  : 'RADAR SCANNING DEBRIS BELT'}
              </span>
            ) : activeMission.hideTrajectoryLine ? (
              <span style={{ color: '#f59e0b', fontWeight: 800 }}>GEOMAGNETIC CME INTERFERENCE ACTIVE</span>
            ) : activeMission.id === 'apollo-13' ? (
              <span style={{ color: '#38bdf8', fontWeight: 800 }}>FREE-RETURN TRAJECTORY CORRIDOR</span>
            ) : activeMission.id === 'oberth-slingshot' ? (
              <span style={{ color: '#fb923c', fontWeight: 800 }}>PERIAPSIS ESCAPE THRESHOLD: 52.0 km/s</span>
            ) : (
              <span style={{ color: '#34d399', fontWeight: 800 }}>DESCENT RADAR ALTIMETER ONLINE</span>
            )}
          </div>
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
                if (physStateRef.current.pitchRad > Math.PI) physStateRef.current.pitchRad -= Math.PI * 2;
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
                if (physStateRef.current.pitchRad < -Math.PI) physStateRef.current.pitchRad += Math.PI * 2;
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

            {/* Quick SAS Flight Computer Orientations */}
            <button
              onClick={() => {
                physStateRef.current.pitchRad = 0;
                setAutopilotMode('PROGRADE');
                setTelemetry((prev) => ({ ...prev, pitchDeg: 0 }));
                if (soundEnabled) soundFx.playClick(1100);
              }}
              style={{
                background: autopilotMode === 'PROGRADE' ? 'rgba(34, 197, 94, 0.35)' : 'rgba(255, 255, 255, 0.08)',
                border: autopilotMode === 'PROGRADE' ? '1.5px solid #22c55e' : '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '6px',
                padding: '6px 12px',
                color: autopilotMode === 'PROGRADE' ? '#4ade80' : '#cbd5e1',
                fontWeight: 900,
                fontSize: '11px',
                cursor: 'pointer',
              }}
              title="Align nose horizontally forward in orbital direction (Raise Orbit / Accelerate)"
            >
              🎯 PROGRADE [0°]
            </button>

            <button
              onClick={() => {
                physStateRef.current.pitchRad = Math.PI;
                setAutopilotMode('RETROGRADE');
                setTelemetry((prev) => ({ ...prev, pitchDeg: 180 }));
                if (soundEnabled) soundFx.playClick(900);
              }}
              style={{
                background: autopilotMode === 'RETROGRADE' ? 'rgba(239, 68, 68, 0.35)' : 'rgba(255, 255, 255, 0.08)',
                border: autopilotMode === 'RETROGRADE' ? '1.5px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '6px',
                padding: '6px 12px',
                color: autopilotMode === 'RETROGRADE' ? '#f87171' : '#cbd5e1',
                fontWeight: 900,
                fontSize: '11px',
                cursor: 'pointer',
              }}
              title="Align nose backward (Brake / Lower Orbit)"
            >
              🔄 RETROGRADE [180°]
            </button>

            {/* Time Warp Button */}
            <button
              onClick={() => {
                setTimeWarp((prev) => (prev === 1 ? 3 : prev === 3 ? 5 : 1));
                if (soundEnabled) soundFx.playClick(1000);
              }}
              style={{
                background: timeWarp > 1 ? 'linear-gradient(135deg, #d97706, #b45309)' : 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '6px',
                padding: '6px 12px',
                color: timeWarp > 1 ? '#ffffff' : '#94a3b8',
                fontWeight: 900,
                fontSize: '11px',
                cursor: 'pointer',
              }}
              title="Fast-forward orbital propagation time (1X / 3X / 5X)"
            >
              ⏩ WARP {timeWarp}X
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
