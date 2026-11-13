// ============================================================================
// ThreeCurriculumVideoStage.tsx — 3D Real-Time Animated Video Simulation Stage
// High-Fidelity Three.js Spaceflight Animations for NASA Junior Astronaut Curriculum
// Grounded in Real NASA Flight Physics, Orbit Mechanics & Mission Visuals
// References: NASA JPL Seven Minutes of Terror, Apollo Flight Journal, Ellipse Simulator (qXYpltxSTK0)
// ============================================================================

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Camera, Eye, Zap, Flame, Compass, Maximize2, RotateCcw } from 'lucide-react';
import { disposeThreeScene } from '../gaming_engine/utils/threeDisposeHelper';
import { soundFx } from '../gaming_engine/utils/audioEffects';

export type CameraViewMode = 'CINEMATIC' | 'CHASE' | 'COCKPIT' | 'GROUND';

interface ThreeCurriculumVideoStageProps {
  moduleId: number;
  stepNumber: number;
  stepType: string;
  themeColor: string;
  isPlaying: boolean;
  playbackSpeed?: number; // 0.5, 1, 2
  onActionTriggered?: (actionName: string) => void;
}

export const ThreeCurriculumVideoStage: React.FC<ThreeCurriculumVideoStageProps> = ({
  moduleId,
  stepNumber,
  stepType,
  themeColor,
  isPlaying,
  playbackSpeed = 1,
  onActionTriggered,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [cameraMode, setCameraMode] = useState<CameraViewMode>('CINEMATIC');
  const [interactiveState, setInteractiveState] = useState<{
    staged: boolean;
    docked: boolean;
    landed: boolean;
    laserFired: boolean;
    opticsAligned: boolean;
    slingshotFired: boolean;
  }>({
    staged: false,
    docked: false,
    landed: false,
    laserFired: false,
    opticsAligned: false,
    slingshotFired: false,
  });

  // Telemetry HUD state
  const [telemetry, setTelemetry] = useState({
    altKm: 0,
    velKms: 0,
    pitchDeg: 90,
    throttlePct: 100,
    rangeM: 50,
    fuelPct: 100,
  });

  // Reset interactive actions when module changes
  useEffect(() => {
    setInteractiveState({
      staged: false,
      docked: false,
      landed: false,
      laserFired: false,
      opticsAligned: false,
      slingshotFired: false,
    });
  }, [moduleId]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 450;

    // ── 1. SCENE & CAMERA SETUP ──────────────────────────────────────────────
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020617);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 10000);
    camera.position.set(0, 12, 35);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // ── 2. LIGHTING ──────────────────────────────────────────────────────────
    const sunLight = new THREE.DirectionalLight(0xffffff, 2.5);
    sunLight.position.set(150, 100, 200);
    scene.add(sunLight);

    const ambientLight = new THREE.AmbientLight(0x334155, 0.85);
    scene.add(ambientLight);

    const engineLight = new THREE.PointLight(0xf97316, 0, 40);
    scene.add(engineLight);

    // ── 3. DEEP SPACE STARFIELD ──────────────────────────────────────────────
    const starCount = 1800;
    const starsGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starPos[i] = (Math.random() - 0.5) * 3500;
      starPos[i + 1] = (Math.random() - 0.5) * 3500;
      starPos[i + 2] = (Math.random() - 0.5) * 3500;
    }
    starsGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starsMat = new THREE.PointsMaterial({ color: 0xffffff, size: 1.5, transparent: true, opacity: 0.8 });
    const stars = new THREE.Points(starsGeo, starsMat);
    scene.add(stars);

    // ── 4. MODULE-SPECIFIC 3D ASSETS & ACTORS ─────────────────────────────────
    const rootActor = new THREE.Group();
    scene.add(rootActor);

    // Secondary actor (for docking agena or celestial body)
    const secondaryActor = new THREE.Group();
    scene.add(secondaryActor);

    // Particle exhaust / effects system
    const particleCount = 120;
    const particleGeo = new THREE.BufferGeometry();
    const particlePos = new Float32Array(particleCount * 3);
    const particleVel = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      particlePos[i * 3] = 0;
      particlePos[i * 3 + 1] = 0;
      particlePos[i * 3 + 2] = 0;
      particleVel[i * 3] = (Math.random() - 0.5) * 0.4;
      particleVel[i * 3 + 1] = -Math.random() * 1.5 - 0.5;
      particleVel[i * 3 + 2] = (Math.random() - 0.5) * 0.4;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0xf59e0b,
      size: 2.2,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    particles.visible = false;
    scene.add(particles);

    // Laser beam mesh for Module 4 (Mars rover)
    let laserBeamMesh: THREE.Line | null = null;

    // ── BUILD SCENE BASED ON MODULE ──────────────────────────────────────────
    if (moduleId === 1) {
      // 🚀 MODULE 1: LAUNCH & MULTI-STAGE STAGING (Mercury-Atlas / Saturn V)
      // Earth Body beneath
      const earthGeo = new THREE.SphereGeometry(18, 48, 48);
      const earthMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.7, metalness: 0.1 });
      const earth = new THREE.Mesh(earthGeo, earthMat);
      earth.position.set(0, -22, -10);
      scene.add(earth);

      // Rocket Group
      // Stage 1 Core (Orange / White)
      const stage1Geo = new THREE.CylinderGeometry(0.9, 0.9, 7, 16);
      const stage1Mat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.4, roughness: 0.4 });
      const stage1 = new THREE.Mesh(stage1Geo, stage1Mat);
      stage1.name = 'stage1';
      rootActor.add(stage1);

      // Side Boosters (2x)
      const b1 = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 5, 12), new THREE.MeshStandardMaterial({ color: 0xf97316 }));
      b1.position.set(1.1, -1.0, 0);
      b1.name = 'booster1';
      rootActor.add(b1);
      const b2 = b1.clone();
      b2.position.set(-1.1, -1.0, 0);
      b2.name = 'booster2';
      rootActor.add(b2);

      // Upper Stage & Fairing (Cone)
      const fairingGeo = new THREE.ConeGeometry(0.9, 2.8, 16);
      const fairingMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.6, roughness: 0.3 });
      const fairing = new THREE.Mesh(fairingGeo, fairingMat);
      fairing.position.y = 4.8;
      rootActor.add(fairing);

      // Rocket fins
      const finMat = new THREE.MeshStandardMaterial({ color: 0x0f172a });
      for (let i = 0; i < 4; i++) {
        const fin = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.2, 0.8), finMat);
        fin.rotation.y = (i * Math.PI) / 2;
        fin.position.set(Math.cos((i * Math.PI) / 2) * 1.0, -3.2, Math.sin((i * Math.PI) / 2) * 1.0);
        rootActor.add(fin);
      }

      particles.visible = true;
    } else if (moduleId === 2) {
      // 🛰️ MODULE 2: ORBITAL DOCKING (Gemini 8 & Agena Target Vehicle)
      // Rotating Earth in background
      const earthGeo = new THREE.SphereGeometry(35, 64, 64);
      const earthMat = new THREE.MeshStandardMaterial({
        color: 0x0284c7,
        roughness: 0.8,
        metalness: 0.1,
        emissive: 0x03284f,
        emissiveIntensity: 0.2,
      });
      const earth = new THREE.Mesh(earthGeo, earthMat);
      earth.position.set(0, -45, -50);
      scene.add(earth);

      // Gemini 8 Spacecraft (rootActor)
      const geminiGeo = new THREE.ConeGeometry(1.2, 2.8, 16);
      const geminiMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.7, roughness: 0.3 });
      const gemini = new THREE.Mesh(geminiGeo, geminiMat);
      gemini.rotation.x = Math.PI / 2;
      rootActor.add(gemini);

      const cabin = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.4, 1.8, 16), new THREE.MeshStandardMaterial({ color: 0xf8fafc }));
      cabin.rotation.x = Math.PI / 2;
      cabin.position.z = -1.6;
      rootActor.add(cabin);

      // Agena Target Vehicle (secondaryActor)
      const agenaGeo = new THREE.CylinderGeometry(1.1, 1.1, 6.0, 16);
      const agenaMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.5, roughness: 0.4 });
      const agena = new THREE.Mesh(agenaGeo, agenaMat);
      agena.rotation.x = Math.PI / 2;
      secondaryActor.add(agena);

      // Agena Docking Collar
      const collar = new THREE.Mesh(
        new THREE.TorusGeometry(1.2, 0.2, 12, 24),
        new THREE.MeshStandardMaterial({ color: 0x22c55e, metalness: 0.8, roughness: 0.2 })
      );
      collar.position.z = 3.1;
      secondaryActor.add(collar);

      secondaryActor.position.set(0, 0, 15); // Starts 15 units ahead
    } else if (moduleId === 3) {
      // 🌕 MODULE 3: LUNAR LANDER (Apollo 11 Eagle & Artemis Touchdown)
      // Lunar Terrain Floor
      const moonGeo = new THREE.PlaneGeometry(80, 80, 40, 40);
      // procedural crater dips
      const posAttr = moonGeo.attributes.position;
      for (let i = 0; i < posAttr.count; i++) {
        const u = posAttr.getX(i);
        const v = posAttr.getY(i);
        const z = Math.sin(u * 0.15) * Math.cos(v * 0.15) * 0.8 - Math.sin((u * u + v * v) * 0.005) * 1.5;
        posAttr.setZ(i, z);
      }
      moonGeo.computeVertexNormals();
      const moonMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.95 });
      const moonSurface = new THREE.Mesh(moonGeo, moonMat);
      moonSurface.rotation.x = -Math.PI / 2;
      moonSurface.position.y = -6;
      scene.add(moonSurface);

      // Distant Blue Earth in Sky
      const distantEarth = new THREE.Mesh(
        new THREE.SphereGeometry(3.5, 32, 32),
        new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
      );
      distantEarth.position.set(30, 20, -50);
      scene.add(distantEarth);

      // Apollo Lunar Module Eagle
      // Ascent Stage (Top)
      const lmAscent = new THREE.Mesh(new THREE.DodecahedronGeometry(1.2), new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.6, roughness: 0.3 }));
      lmAscent.position.y = 1.3;
      rootActor.add(lmAscent);

      // Descent Stage (Gold foil octahedron)
      const lmDescent = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.2, 2.4), new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.8, roughness: 0.3 }));
      lmDescent.position.y = 0.2;
      rootActor.add(lmDescent);

      // Landing Legs (4x)
      const legMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8 });
      for (let i = 0; i < 4; i++) {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.2), legMat);
        leg.rotation.z = Math.PI / 4;
        leg.rotation.y = (i * Math.PI) / 2;
        leg.position.set(Math.cos((i * Math.PI) / 2) * 1.4, -0.6, Math.sin((i * Math.PI) / 2) * 1.4);
        rootActor.add(leg);

        const footpad = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.1), legMat);
        footpad.position.set(Math.cos((i * Math.PI) / 2) * 2.1, -1.4, Math.sin((i * Math.PI) / 2) * 2.1);
        rootActor.add(footpad);
      }

      rootActor.position.set(0, 12, 0); // starts descending
      particles.visible = true;
    } else if (moduleId === 4) {
      // 🔴 MODULE 4: MARS ROVER (Sojourner, Curiosity & Perseverance)
      // Red Martian Surface
      const marsGeo = new THREE.PlaneGeometry(80, 80, 32, 32);
      const marsMat = new THREE.MeshStandardMaterial({ color: 0x9a3412, roughness: 0.9 });
      const marsFloor = new THREE.Mesh(marsGeo, marsMat);
      marsFloor.rotation.x = -Math.PI / 2;
      marsFloor.position.y = -2;
      scene.add(marsFloor);

      // Boulders (Yogi and Barnacle Bill)
      const rockMat = new THREE.MeshStandardMaterial({ color: 0x431407, roughness: 0.95 });
      const rockYogi = new THREE.Mesh(new THREE.DodecahedronGeometry(1.6), rockMat);
      rockYogi.position.set(6, -0.8, 4);
      scene.add(rockYogi);

      const rockBarnacle = new THREE.Mesh(new THREE.DodecahedronGeometry(1.1), rockMat);
      rockBarnacle.position.set(-7, -1.0, 2);
      scene.add(rockBarnacle);

      // Rover Body
      const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.8, 1.6), new THREE.MeshStandardMaterial({ color: 0x0284c7 }));
      rootActor.add(chassis);

      // Solar Panel top
      const solarDeck = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.1, 1.4), new THREE.MeshStandardMaterial({ color: 0x1e3a8a, metalness: 0.8 }));
      solarDeck.position.y = 0.45;
      rootActor.add(solarDeck);

      // Mastcam
      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.4), new THREE.MeshStandardMaterial({ color: 0x94a3b8 }));
      mast.position.set(0.8, 1.1, 0);
      rootActor.add(mast);
      const mastHead = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, 0.3), new THREE.MeshStandardMaterial({ color: 0x1e293b }));
      mastHead.position.set(0.8, 1.8, 0);
      rootActor.add(mastHead);

      // 6 Wheels
      const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 });
      const wheelGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 16);
      for (let x = -0.9; x <= 0.9; x += 0.9) {
        for (let z = -0.9; z <= 0.9; z += 1.8) {
          const wheel = new THREE.Mesh(wheelGeo, wheelMat);
          wheel.rotation.z = Math.PI / 2;
          wheel.position.set(x, -0.6, z);
          rootActor.add(wheel);
        }
      }

      rootActor.position.set(-4, -1, 4);

      // Spectrometer Laser Line
      const laserGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0.8, 1.8, 0),
        new THREE.Vector3(6, -0.8, 4),
      ]);
      const laserMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, linewidth: 2 });
      laserBeamMesh = new THREE.Line(laserGeo, laserMat);
      laserBeamMesh.visible = false;
      rootActor.add(laserBeamMesh);
    } else if (moduleId === 5) {
      // 🔭 MODULE 5: SPACE TELESCOPE (Hubble Optical Servicing STS-61 & JWST)
      // Rotating Earth beneath
      const earthGeo = new THREE.SphereGeometry(30, 48, 48);
      const earthMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.7 });
      const earth = new THREE.Mesh(earthGeo, earthMat);
      earth.position.set(0, -38, -25);
      scene.add(earth);

      // Hubble Main Cylinder Body
      const body = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 7.5, 24), new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.8, roughness: 0.2 }));
      body.rotation.z = Math.PI / 4;
      rootActor.add(body);

      // Aperture Door (Open)
      const door = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 0.2, 24), new THREE.MeshStandardMaterial({ color: 0x334155 }));
      door.rotation.z = Math.PI / 4;
      door.position.set(-3.2, 3.2, 0);
      rootActor.add(door);

      // Solar Arrays (2 large rectangular wings)
      const wingMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, metalness: 0.9, roughness: 0.1 });
      const wing1 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 5.0, 1.6), wingMat);
      wing1.position.set(0, 0, 2.5);
      rootActor.add(wing1);
      const wing2 = wing1.clone();
      wing2.position.set(0, 0, -2.5);
      rootActor.add(wing2);

      // Space Shuttle Robotic Canadarm & Astronaut
      const armMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 });
      const armSegment1 = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 5.0), armMat);
      armSegment1.position.set(4.5, -1.0, 1.0);
      armSegment1.rotation.z = -Math.PI / 3;
      secondaryActor.add(armSegment1);

      // Astronaut with COSTAR unit
      const astro = new THREE.Mesh(new THREE.SphereGeometry(0.7, 16, 16), new THREE.MeshStandardMaterial({ color: 0xffffff }));
      astro.position.set(6.5, 0.8, 1.0);
      secondaryActor.add(astro);
      const costarBox = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.8, 0.8), new THREE.MeshStandardMaterial({ color: 0x3b82f6 }));
      costarBox.position.set(6.0, 0.8, 1.0);
      secondaryActor.add(costarBox);
    } else {
      // 🪐 MODULE 6: DEEP SPACE SLINGSHOT (Voyager 1 & 2 at Jupiter)
      // Giant Striped Jupiter
      const jupiterGeo = new THREE.SphereGeometry(14, 64, 64);
      const jupiterMat = new THREE.MeshStandardMaterial({
        color: 0xd97706,
        roughness: 0.6,
        metalness: 0.1,
        emissive: 0x78350f,
        emissiveIntensity: 0.2,
      });
      const jupiter = new THREE.Mesh(jupiterGeo, jupiterMat);
      jupiter.position.set(12, 0, -20);
      scene.add(jupiter);

      // Jupiter Atmospheric Swirl Bands (Ring)
      const ringGeo = new THREE.RingGeometry(16, 22, 48);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b, side: THREE.DoubleSide, transparent: true, opacity: 0.35 });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2.5;
      ring.position.copy(jupiter.position);
      scene.add(ring);

      // Voyager Probe (rootActor)
      // High-Gain Parabolic Dish
      const dish = new THREE.Mesh(new THREE.ConeGeometry(2.0, 0.6, 24), new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 }));
      dish.rotation.x = -Math.PI / 2;
      rootActor.add(dish);

      // Bus Box
      const bus = new THREE.Mesh(new THREE.DodecahedronGeometry(0.8), new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.8 }));
      bus.position.z = -0.6;
      rootActor.add(bus);

      // Magnetometer Boom (Long thin rod)
      const boom = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 7.0), new THREE.MeshStandardMaterial({ color: 0x94a3b8 }));
      boom.rotation.z = Math.PI / 3;
      boom.position.set(-2.5, 1.5, -0.6);
      rootActor.add(boom);

      // Hyperbolic trajectory tube arc
      const curve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(-25, 10, -5),
        new THREE.Vector3(4, 8, -12),
        new THREE.Vector3(25, -12, -35)
      );
      const points = curve.getPoints(50);
      const trajGeo = new THREE.BufferGeometry().setFromPoints(points);
      const trajMat = new THREE.LineDashedMaterial({ color: 0x38bdf8, dashSize: 1, gapSize: 0.5, linewidth: 2 });
      const trajLine = new THREE.Line(trajGeo, trajMat);
      trajLine.computeLineDistances();
      scene.add(trajLine);

      rootActor.position.set(-22, 9, -5);
    }

    // ── 5. 60FPS ANIMATION LOOP ──────────────────────────────────────────────
    let animationFrameId: number;
    let simTime = 0;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const dt = 0.016 * playbackSpeed;
      if (isPlaying) {
        simTime += dt;
      }

      // Stars slow rotation
      stars.rotation.y += 0.0003;

      // ── MODULE SPECIFIC FLIGHT DYNAMICS ────────────────────────────────────
      if (moduleId === 1) {
        // Rocket Ascent & Staging
        const t = Math.max(0, simTime % 12);
        const alt = t * 18;
        const vel = Math.min(7.8, t * 0.75);
        const pitch = Math.max(10, 90 - t * 6.5);

        rootActor.position.y = -6 + t * 2.2;
        rootActor.rotation.z = -((90 - pitch) * Math.PI) / 180 * 0.6;

        // Particle exhaust follows rocket engine
        if (particles.visible) {
          const pArr = particleGeo.attributes.position.array as Float32Array;
          for (let i = 0; i < particleCount; i++) {
            pArr[i * 3 + 1] -= 0.6 * playbackSpeed;
            if (pArr[i * 3 + 1] < -8) {
              pArr[i * 3] = rootActor.position.x + (Math.random() - 0.5) * 0.3;
              pArr[i * 3 + 1] = rootActor.position.y - 3.5;
              pArr[i * 3 + 2] = rootActor.position.z + (Math.random() - 0.5) * 0.3;
            }
          }
          particleGeo.attributes.position.needsUpdate = true;
          engineLight.position.set(rootActor.position.x, rootActor.position.y - 3.5, rootActor.position.z);
          engineLight.intensity = isPlaying ? 2.5 + Math.sin(simTime * 20) * 0.8 : 0;
        }

        // Drop side boosters if step >= 3 or staged
        const b1 = rootActor.getObjectByName('booster1');
        const b2 = rootActor.getObjectByName('booster2');
        if (stepNumber >= 3 || interactiveState.staged) {
          if (b1) {
            b1.position.x += 0.04;
            b1.position.y -= 0.06;
            b1.rotation.z += 0.03;
          }
          if (b2) {
            b2.position.x -= 0.04;
            b2.position.y -= 0.06;
            b2.rotation.z -= 0.03;
          }
        }

        setTelemetry({
          altKm: Math.round(alt),
          velKms: Number(vel.toFixed(2)),
          pitchDeg: Math.round(pitch),
          throttlePct: t < 10 ? 100 : 0,
          rangeM: 0,
          fuelPct: Math.max(12, Math.round(100 - t * 7.5)),
        });
      } else if (moduleId === 2) {
        // Docking Approach
        const maxRange = 50;
        const progress = Math.min(1, (simTime % 14) / 10);
        const curRange = interactiveState.docked ? 0 : Math.max(0, maxRange * (1 - progress));

        secondaryActor.position.z = 5 + (curRange / maxRange) * 12;
        rootActor.rotation.y = Math.sin(simTime * 0.4) * 0.08;

        setTelemetry({
          altKm: 380,
          velKms: Number((7.65 + (curRange > 0 ? 0.02 : 0)).toFixed(2)),
          pitchDeg: 0,
          throttlePct: curRange > 0 ? 15 : 0,
          rangeM: Math.round(curRange),
          fuelPct: 88,
        });
      } else if (moduleId === 3) {
        // Apollo Lunar Landing
        const t = simTime % 12;
        const targetY = interactiveState.landed ? -4.5 : Math.max(-4.5, 10 - t * 1.3);
        rootActor.position.y = targetY;

        // Dust kickup when near surface
        if (targetY < -2.0) {
          const pArr = particleGeo.attributes.position.array as Float32Array;
          for (let i = 0; i < particleCount; i++) {
            pArr[i * 3] += (Math.random() - 0.5) * 0.4;
            pArr[i * 3 + 2] += (Math.random() - 0.5) * 0.4;
            pArr[i * 3 + 1] = -5.8 + Math.random() * 0.6;
          }
          particleGeo.attributes.position.needsUpdate = true;
          particles.visible = true;
        }

        setTelemetry({
          altKm: Number(Math.max(0, (targetY + 4.5) * 0.25).toFixed(2)),
          velKms: Number((targetY > -4.4 ? -0.015 : 0).toFixed(3)),
          pitchDeg: 90,
          throttlePct: targetY > -4.4 ? 45 : 0,
          rangeM: 0,
          fuelPct: Math.max(8, Math.round(40 - t * 2.8)),
        });
      } else if (moduleId === 4) {
        // Mars Rover Movement & Laser
        const t = simTime % 10;
        rootActor.position.x = -4 + t * 0.8;
        rootActor.position.z = 4 + Math.sin(t * 0.6) * 0.3;

        // Laser beam pulsing
        if (laserBeamMesh) {
          laserBeamMesh.visible = interactiveState.laserFired || stepNumber >= 4;
        }

        setTelemetry({
          altKm: 0,
          velKms: 0.0001,
          pitchDeg: 0,
          throttlePct: 20,
          rangeM: Math.round(Math.max(0, 15 - t * 1.5)),
          fuelPct: 96,
        });
      } else if (moduleId === 5) {
        // Hubble Telescope Orbit
        rootActor.rotation.y += 0.005;
        secondaryActor.rotation.y = Math.sin(simTime * 0.2) * 0.15;

        setTelemetry({
          altKm: 540,
          velKms: 7.55,
          pitchDeg: 0,
          throttlePct: 0,
          rangeM: 3,
          fuelPct: 100,
        });
      } else {
        // Deep Space Voyager Slingshot
        const t = (simTime * 0.15) % 1;
        // Hyperbolic path interpolation
        const px = -25 + t * 45;
        const py = 10 - Math.sin(t * Math.PI) * 18;
        const pz = -5 - t * 28;
        rootActor.position.set(px, py, pz);
        rootActor.lookAt(px + 1, py - 0.2, pz - 1);

        const currentVel = 14 + Math.sin(t * Math.PI) * 14;
        setTelemetry({
          altKm: Math.round(650000 - Math.sin(t * Math.PI) * 450000),
          velKms: Number(currentVel.toFixed(1)),
          pitchDeg: 45,
          throttlePct: 0,
          rangeM: 0,
          fuelPct: 75,
        });
      }

      // ── CAMERA VIEW CONTROLLER ─────────────────────────────────────────────
      if (cameraMode === 'CINEMATIC') {
        const radius = 26;
        const angle = simTime * 0.25;
        camera.position.x = rootActor.position.x + Math.sin(angle) * radius;
        camera.position.z = rootActor.position.z + Math.cos(angle) * radius;
        camera.position.y = rootActor.position.y + 6;
        camera.lookAt(rootActor.position);
      } else if (cameraMode === 'CHASE') {
        camera.position.set(rootActor.position.x - 0.5, rootActor.position.y - 4, rootActor.position.z + 16);
        camera.lookAt(rootActor.position);
      } else if (cameraMode === 'COCKPIT') {
        camera.position.set(rootActor.position.x, rootActor.position.y + 1.2, rootActor.position.z + 0.4);
        camera.lookAt(rootActor.position.x, rootActor.position.y + 1.2, rootActor.position.z - 20);
      } else {
        // GROUND TELEPHOTO TRACKING
        camera.position.set(15, -4, 25);
        camera.lookAt(rootActor.position);
      }

      renderer.render(scene, camera);
    };

    animate();

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 800;
      const h = container.clientHeight || 450;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      disposeThreeScene(renderer, scene, container);
    };
  }, [moduleId, stepNumber, isPlaying, playbackSpeed, cameraMode, interactiveState]);

  // Handle interactive action trigger
  const handleTriggerAction = () => {
    if (moduleId === 1) {
      setInteractiveState((p) => ({ ...p, staged: true }));
      soundFx.playImpact();
      onActionTriggered?.('STAGE 1 DECOUPLING CONFIRMED');
    } else if (moduleId === 2) {
      setInteractiveState((p) => ({ ...p, docked: true }));
      soundFx.playFlagPlant();
      onActionTriggered?.('AGENA DOCKING LATCH LOCKED');
    } else if (moduleId === 3) {
      setInteractiveState((p) => ({ ...p, landed: true }));
      soundFx.playVictory();
      onActionTriggered?.('EAGLE HAS LANDED · TRANQUILITY BASE');
    } else if (moduleId === 4) {
      setInteractiveState((p) => ({ ...p, laserFired: true }));
      soundFx.playMiningLaser();
      onActionTriggered?.('SPECTROMETER LASER FIRED ON ROCK YOGI');
    } else if (moduleId === 5) {
      setInteractiveState((p) => ({ ...p, opticsAligned: true }));
      soundFx.playScan();
      onActionTriggered?.('COSTAR OPTICS CORRECTED M100 FOCUS');
    } else {
      setInteractiveState((p) => ({ ...p, slingshotFired: true }));
      soundFx.playDsnChirp();
      onActionTriggered?.('OBERTH GRAVITY ASSIST ACCELERATION (+14 km/s)');
    }
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', backgroundColor: '#020617' }}>
      {/* 3D WebGL Canvas */}
      <div ref={mountRef} style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }} />

      {/* ── TOP HUD: LIVE NASA TELEMETRY OVERLAY ── */}
      <div
        style={{
          position: 'absolute',
          top: '12px',
          left: '14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          background: 'rgba(15, 23, 42, 0.8)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '8px',
          padding: '8px 12px',
          fontFamily: 'monospace',
          fontSize: '11px',
          color: '#cbd5e1',
          zIndex: 10,
          pointerEvents: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: themeColor, fontWeight: 800 }}>
          <Compass size={12} />
          <span>FLIGHT TELEMETRY HUD</span>
        </div>
        <div>ALTITUDE: <strong style={{ color: '#ffffff' }}>{telemetry.altKm} km</strong></div>
        <div>VELOCITY: <strong style={{ color: '#4ade80' }}>{telemetry.velKms} km/s</strong></div>
        {telemetry.rangeM > 0 && (
          <div>DOCK RANGE: <strong style={{ color: '#fbbf24' }}>{telemetry.rangeM} m</strong></div>
        )}
        <div>PROPELLANT: <strong style={{ color: telemetry.fuelPct < 20 ? '#ef4444' : '#38bdf8' }}>{telemetry.fuelPct}%</strong></div>
      </div>

      {/* ── TOP RIGHT: CAMERA MODE SELECTOR ── */}
      <div
        style={{
          position: 'absolute',
          top: '12px',
          right: '14px',
          display: 'flex',
          gap: '6px',
          zIndex: 10,
        }}
      >
        {(['CINEMATIC', 'CHASE', 'COCKPIT', 'GROUND'] as CameraViewMode[]).map((mode) => (
          <button
            key={mode}
            onClick={() => {
              setCameraMode(mode);
              soundFx.playClick(750);
            }}
            style={{
              padding: '5px 10px',
              borderRadius: '6px',
              border: cameraMode === mode ? `1.5px solid ${themeColor}` : '1px solid rgba(255, 255, 255, 0.15)',
              background: cameraMode === mode ? 'rgba(15, 23, 42, 0.9)' : 'rgba(15, 23, 42, 0.6)',
              color: cameraMode === mode ? '#ffffff' : '#94a3b8',
              fontSize: '10px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              backdropFilter: 'blur(6px)',
            }}
          >
            <Camera size={11} />
            <span>{mode}</span>
          </button>
        ))}
      </div>

      {/* ── BOTTOM CENTER: INTERACTIVE ACTION BUTTON ── */}
      <div
        style={{
          position: 'absolute',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10,
        }}
      >
        <button
          onClick={handleTriggerAction}
          style={{
            padding: '8px 18px',
            borderRadius: '999px',
            background: `linear-gradient(135deg, ${themeColor}, #0284c7)`,
            border: 'none',
            color: '#ffffff',
            fontWeight: 900,
            fontSize: '11px',
            letterSpacing: '0.05em',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: `0 0 20px ${themeColor}60`,
            transition: 'transform 0.15s ease',
          }}
          onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
          onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <Zap size={14} />
          <span>
            {moduleId === 1 && '🚀 TRIGGER STAGE 1 SEPARATION [SPACE]'}
            {moduleId === 2 && '🎯 LOCK DOCKING COLLAR LATCHES'}
            {moduleId === 3 && '🌕 TOUCHDOWN HOVER SLAM BURN'}
            {moduleId === 4 && '🔬 FIRE APXS SPECTROMETER LASER'}
            {moduleId === 5 && '🔭 ALIGN COSTAR OPTICAL MIRRORS'}
            {moduleId === 6 && '⚡ EXECUTE JUPITER OBERTH SLINGSHOT'}
          </span>
        </button>
      </div>

      {/* NASA Meatball Watermark */}
      <div
        style={{
          position: 'absolute',
          bottom: '12px',
          left: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          opacity: 0.65,
          fontFamily: 'monospace',
          fontSize: '10px',
          color: '#94a3b8',
          pointerEvents: 'none',
        }}
      >
        <span style={{ color: '#ef4444', fontWeight: 900 }}>● NASA</span>
        <span>AEROSPACE SIMULATION ENGINE · 3D WEBGL</span>
      </div>
    </div>
  );
};

