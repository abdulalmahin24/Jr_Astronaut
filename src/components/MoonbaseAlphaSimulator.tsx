// ============================================================
// MoonbaseAlphaSimulator.tsx — NASA Moonbase Alpha Outpost Crisis
// Based on NASA's 3D Lunar Base Simulation Game (YouTube: Bae7RGIkEEk)
// Real-time 3D Three.js EVA repair simulation under 1/6th gravity
// ============================================================

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { getSharedGLTFLoader } from '../utils/modelLoader';
import confetti from 'canvas-confetti';
import {
  X,
  Volume2,
  VolumeX,
  Wrench,
  Flame,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Radio,
  Eye,
  Shield,
  Zap,
  Play,
  RotateCcw,
} from 'lucide-react';
import { soundFx } from '../utils/audioEffects';

interface MoonbaseAlphaSimulatorProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: (score: number) => void;
}

type ToolType = 'WELDER' | 'WRENCH' | 'MULTIMETER';

interface BreachPoint {
  id: string;
  name: string;
  position: THREE.Vector3;
  requiredTool: ToolType;
  fixed: boolean;
  progress: number; // 0 to 100
  desc: string;
  subsystem: string;
}

export const MoonbaseAlphaSimulator: React.FC<MoonbaseAlphaSimulatorProps> = ({
  isOpen,
  onClose,
  onComplete,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedTool, setSelectedTool] = useState<ToolType>('WELDER');
  const [headlightOn, setHeadlightOn] = useState(true);
  const [cameraView, setCameraView] = useState<'3RD_PERSON' | '1ST_PERSON'>('3RD_PERSON');
  
  // Game telemetry states
  const [oxygenSeconds, setOxygenSeconds] = useState(180);
  const [baseIntegrity, setBaseIntegrity] = useState(24);
  const [solarPowerKw, setSolarPowerKw] = useState(4.2);
  const [activeBreachNear, setActiveBreachNear] = useState<BreachPoint | null>(null);
  const [isRepairing, setIsRepairing] = useState(false);
  const [repairProgress, setRepairProgress] = useState(0);
  const [missionOutcome, setMissionOutcome] = useState<'PLAYING' | 'SUCCESS' | 'FAILURE'>('PLAYING');
  const [radioLog, setRadioLog] = useState<string[]>([
    '[CAPCOM]: EMERGENCY! Micrometeorite impact at Sector 4.',
    '[ECLSS]: Primary O2 line ruptured. Life support depleted.',
    '[NASA]: Dispatching EVA Engineer. Use Welder & Wrench.',
  ]);

  // Simulation internal state ref
  const simRef = useRef({
    playerPos: new THREE.Vector3(0, 0, 18),
    playerVel: new THREE.Vector3(),
    playerRotY: 0,
    isGrounded: true,
    keys: {} as Record<string, boolean>,
    breaches: [
      {
        id: 'o2_pipe',
        name: 'Primary Oxygen Distribution Manifold',
        position: new THREE.Vector3(-14, 0.8, -6),
        requiredTool: 'WELDER',
        fixed: false,
        progress: 0,
        desc: 'Severed titanium-alloy pipe venting high-pressure O2.',
        subsystem: 'ECLSS Gas Grid',
      },
      {
        id: 'solar_coupler',
        name: 'Kilopower Solar Coupler Bus B',
        position: new THREE.Vector3(16, 1.2, -12),
        requiredTool: 'WRENCH',
        fixed: false,
        progress: 0,
        desc: 'Shattered high-voltage DC junction coupling.',
        subsystem: 'Power Grid',
      },
      {
        id: 'airlock_terminal',
        name: 'Airlock Hermetic Recalibration Node',
        position: new THREE.Vector3(2, 1.0, -22),
        requiredTool: 'MULTIMETER',
        fixed: false,
        progress: 0,
        desc: 'Airlock pressure sensor desynchronized from main habitat.',
        subsystem: 'Pressure Hull',
      },
    ] as BreachPoint[],
  });

  const addRadioLog = useCallback((msg: string) => {
    setRadioLog((prev) => [...prev.slice(-4), msg]);
    soundFx.playTelemetryChirp();
  }, []);

  // Keyboard controls
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      simRef.current.keys[e.key.toLowerCase()] = true;
      simRef.current.keys[e.code] = true;

      if (e.key === '1') setSelectedTool('WELDER');
      if (e.key === '2') setSelectedTool('WRENCH');
      if (e.key === '3') setSelectedTool('MULTIMETER');
      if (e.key.toLowerCase() === 'f') setHeadlightOn((prev) => !prev);
      if (e.key.toLowerCase() === 'v') {
        setCameraView((prev) => (prev === '3RD_PERSON' ? '1ST_PERSON' : '3RD_PERSON'));
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      simRef.current.keys[e.key.toLowerCase()] = false;
      simRef.current.keys[e.code] = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [isOpen]);

  // Main Three.js Scene Setup & Physics Loop
  useEffect(() => {
    if (!isOpen || !mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || 960;
    const height = container.clientHeight || 640;

    // 1. Scene & Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020408);
    scene.fog = new THREE.FogExp2(0x020408, 0.0035);

    const camera = new THREE.PerspectiveCamera(54, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    container.appendChild(renderer.domElement);

    // 2. Realistic Lunar Sun (Unfiltered harsh space sunlight)
    const sunLight = new THREE.DirectionalLight(0xfffaed, 3.2);
    sunLight.position.set(60, 120, 80);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 400;
    sunLight.shadow.camera.left = -60;
    sunLight.shadow.camera.right = 60;
    sunLight.shadow.camera.top = 60;
    sunLight.shadow.camera.bottom = -60;
    scene.add(sunLight);

    // Subtle Earthshine (soft blue fill light)
    const earthLight = new THREE.DirectionalLight(0x38bdf8, 0.45);
    earthLight.position.set(-80, 50, -40);
    scene.add(earthLight);

    const ambientLight = new THREE.AmbientLight(0x0b101d, 0.4);
    scene.add(ambientLight);

    // 3. Earth & Distant Stars in Black Sky
    const earthGeo = new THREE.SphereGeometry(14, 32, 32);
    const earthMat = new THREE.MeshStandardMaterial({
      color: 0x1d4ed8,
      roughness: 0.5,
      emissive: 0x0c2461,
      emissiveIntensity: 0.2,
    });
    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    earthMesh.position.set(-180, 120, -280);
    scene.add(earthMesh);

    // Starfield
    const starCount = 2000;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starPos[i] = (Math.random() - 0.5) * 800;
      starPos[i + 1] = 40 + Math.random() * 400;
      starPos[i + 2] = (Math.random() - 0.5) * 800;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 1.5, sizeAttenuation: false });
    scene.add(new THREE.Points(starGeo, starMat));

    // GLTF Model Loader Helper with Draco decompression
    const gltfLoader = getSharedGLTFLoader();
    const attachGltf = (
      url: string,
      targetGroup: THREE.Group,
      targetSize: number,
      onLoaded?: (mesh: THREE.Group) => void
    ) => {
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
              const m = child as THREE.Mesh;
              m.castShadow = true;
              m.receiveShadow = true;
            }
          });

          targetGroup.add(model);
          if (onLoaded) onLoaded(model);
        },
        undefined,
        (err) => {
          console.warn('Failed to load GLTF model:', url, err);
        }
      );
    };

    // 4. Photorealistic Lunar Regolith Surface & Craters
    const textureLoader = new THREE.TextureLoader();
    const moonTex = textureLoader.load('/assets/moon_texture.jpg');
    moonTex.wrapS = THREE.RepeatWrapping;
    moonTex.wrapT = THREE.RepeatWrapping;
    moonTex.repeat.set(16, 16);

    const terrainGeo = new THREE.PlaneGeometry(360, 360, 128, 128);
    terrainGeo.rotateX(-Math.PI / 2);
    const posAttr = terrainGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const vx = posAttr.getX(i);
      const vz = posAttr.getZ(i);
      const distToCenter = Math.sqrt(vx * vx + vz * vz);
      let y = Math.sin(vx * 0.05) * Math.cos(vz * 0.05) * 1.2;
      if (distToCenter > 30) {
        y += Math.sin(vx * 0.02) * 2.8;
      }
      // Crater rim depression near sector 4
      const dCrater = Math.sqrt((vx + 18) * (vx + 18) + (vz + 10) * (vz + 10));
      if (dCrater < 22) {
        y -= Math.cos((dCrater / 22) * Math.PI) * 2.2;
      }
      posAttr.setY(i, y);
    }
    terrainGeo.computeVertexNormals();

    const terrainMat = new THREE.MeshStandardMaterial({
      map: moonTex,
      bumpMap: moonTex,
      bumpScale: 0.85,
      color: 0xd1d5db,
      roughness: 0.92,
      metalness: 0.05,
    });
    const terrain = new THREE.Mesh(terrainGeo, terrainMat);
    terrain.receiveShadow = true;
    scene.add(terrain);

    // Scattered 3D Lunar Boulders
    for (let b = 0; b < 45; b++) {
      const bGeo = new THREE.DodecahedronGeometry(0.8 + Math.random() * 2.0);
      const bMat = new THREE.MeshStandardMaterial({
        map: moonTex,
        bumpMap: moonTex,
        bumpScale: 0.6,
        roughness: 0.95,
      });
      const boulder = new THREE.Mesh(bGeo, bMat);
      const angle = Math.random() * Math.PI * 2;
      const dist = 16 + Math.random() * 110;
      boulder.position.set(Math.cos(angle) * dist, 0.4, Math.sin(angle) * dist);
      boulder.castShadow = true;
      boulder.receiveShadow = true;
      scene.add(boulder);
    }

    // Earthrise in Lunar Horizon Sky (Earth with atmospheric halo)
    const earthGlowGeo = new THREE.SphereGeometry(18.5, 32, 32);
    const earthGlowMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.BackSide,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
    });
    const earthGlow = new THREE.Mesh(earthGlowGeo, earthGlowMat);
    earthGlow.position.set(-180, 120, -280);
    scene.add(earthGlow);

    // Apollo Flag planted at Moonbase perimeter
    const flagGroup = new THREE.Group();
    flagGroup.position.set(10, 0, 8);
    const poleGeo = new THREE.CylinderGeometry(0.06, 0.06, 4.2, 12);
    const poleMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.9, roughness: 0.2 });
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.y = 2.1;
    flagGroup.add(pole);

    const clothGeo = new THREE.PlaneGeometry(2.2, 1.4);
    const clothMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.5, side: THREE.DoubleSide });
    const cloth = new THREE.Mesh(clothGeo, clothMat);
    cloth.position.set(1.1, 3.4, 0);
    flagGroup.add(cloth);
    scene.add(flagGroup);

    // 5. NASA Moonbase Habitat Modules (Real NASA 3D Models)
    const baseGroup = new THREE.Group();

    // Main NASA Habitat Unit (High-Tech Pressurized Module)
    const habModule = new THREE.Group();
    attachGltf('/models/Habitat_Unit.glb', habModule, 26);
    habModule.position.set(0, 1.2, -26);
    baseGroup.add(habModule);

    // NASA Base Station Comms & Command Hub
    const baseStationHub = new THREE.Group();
    attachGltf('/models/Base_Station.glb', baseStationHub, 9);
    baseStationHub.position.set(18, 0.5, -22);
    baseGroup.add(baseStationHub);

    // Deep Space 70m Telemetry Comms Dish
    const dishModel = new THREE.Group();
    attachGltf('/models/Dish_70m.glb', dishModel, 14);
    dishModel.position.set(-32, 0.5, -48);
    baseGroup.add(dishModel);

    // NASA Surface Rover parked near Moonbase Alpha
    const parkedRover = new THREE.Group();
    attachGltf('/models/Mars_Perseverance_Rover.glb', parkedRover, 5.2);
    parkedRover.position.set(-18, 0.4, 8);
    parkedRover.rotation.y = Math.PI / 4;
    scene.add(parkedRover);

    // Apollo Lunar Module on distant landing rim
    const distantLm = new THREE.Group();
    attachGltf('/models/Apollo_Lunar_Module.glb', distantLm, 12);
    distantLm.position.set(45, 0.8, -65);
    scene.add(distantLm);

    // Solar Panel Array Wings
    const solarWingGeo = new THREE.BoxGeometry(18, 0.2, 8);
    const solarMat = new THREE.MeshStandardMaterial({
      color: 0x1e3a8a,
      roughness: 0.2,
      metalness: 0.8,
      emissive: 0x0c4a6e,
      emissiveIntensity: 0.15,
    });
    const solarArray = new THREE.Mesh(solarWingGeo, solarMat);
    solarArray.position.set(16, 6, -12);
    solarArray.rotation.x = Math.PI / 6;
    solarArray.castShadow = true;
    baseGroup.add(solarArray);

    // Oxygen Storage Tanks & Pipeline
    const tankGeo = new THREE.CylinderGeometry(2, 2, 7, 16);
    const tankMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.4 });
    const tank1 = new THREE.Mesh(tankGeo, tankMat);
    tank1.position.set(-14, 3.5, -6);
    tank1.castShadow = true;
    baseGroup.add(tank1);

    // Oxygen Pipe
    const pipeGeo = new THREE.CylinderGeometry(0.4, 0.4, 16, 12);
    pipeGeo.rotateZ(Math.PI / 2);
    const pipeMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.6 });
    const pipe = new THREE.Mesh(pipeGeo, pipeMat);
    pipe.position.set(-6, 0.8, -6);
    pipe.castShadow = true;
    baseGroup.add(pipe);

    scene.add(baseGroup);

    // 6. Breach Visual Markers & Leak Particles
    const leakGroup = new THREE.Group();
    // Oxygen leak jet particles
    const leakPCount = 120;
    const leakPGeo = new THREE.BufferGeometry();
    const leakPPos = new Float32Array(leakPCount * 3);
    const leakPVel: { x: number; y: number; z: number }[] = [];

    for (let i = 0; i < leakPCount; i++) {
      leakPPos[i * 3] = -14;
      leakPPos[i * 3 + 1] = 0.8;
      leakPPos[i * 3 + 2] = -6;
      leakPVel.push({
        x: (Math.random() - 0.5) * 0.15,
        y: Math.random() * 0.25 + 0.1,
        z: (Math.random() - 0.5) * 0.15,
      });
    }
    leakPGeo.setAttribute('position', new THREE.BufferAttribute(leakPPos, 3));
    const leakPMat = new THREE.PointsMaterial({
      color: 0xe0f2fe,
      size: 0.4,
      transparent: true,
      opacity: 0.8,
    });
    const leakParticles = new THREE.Points(leakPGeo, leakPMat);
    leakGroup.add(leakParticles);

    // Glowing Repair Waypoint Rings on Ground
    const ringGeo = new THREE.RingGeometry(1.2, 1.6, 24);
    ringGeo.rotateX(-Math.PI / 2);
    const rings: THREE.Mesh[] = [];

    simRef.current.breaches.forEach((b) => {
      const ringMat = new THREE.MeshBasicMaterial({
        color: b.requiredTool === 'WELDER' ? 0x00d2ff : b.requiredTool === 'WRENCH' ? 0xff9e1b : 0x10b981,
        side: THREE.DoubleSide,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.copy(b.position);
      ring.position.y = 0.05;
      scene.add(ring);
      rings.push(ring);
    });

    scene.add(leakGroup);

    // 7. Real NASA Astronaut 3D Model
    const playerGroup = new THREE.Group();

    // Load Real NASA Astronaut EVA Suit Model
    attachGltf('/models/Astronaut.glb', playerGroup, 2.4);

    // Suit Headlight (SpotLight attached to astronaut helmet)
    const headLight = new THREE.SpotLight(0xffffff, 5.0, 50, Math.PI / 5, 0.3);
    headLight.position.set(0, 2.2, 0.4);
    headLight.target.position.set(0, 1.2, 10);
    playerGroup.add(headLight);
    playerGroup.add(headLight.target);

    scene.add(playerGroup);

    // 8. Welding Spark Particles
    const sparkCount = 80;
    const sparkGeo = new THREE.BufferGeometry();
    const sparkPos = new Float32Array(sparkCount * 3);
    sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPos, 3));
    const sparkMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.35,
      transparent: true,
      opacity: 0.9,
    });
    const sparkParticles = new THREE.Points(sparkGeo, sparkMat);
    sparkParticles.visible = false;
    scene.add(sparkParticles);

    // Game Loop
    let animId: number;
    let lastTime = performance.now();
    let o2Interval = performance.now();

    const animate = (time: number) => {
      animId = requestAnimationFrame(animate);
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      const state = simRef.current;
      const keys = state.keys;

      // ── Movement & 1/6th Lunar Gravity Physics ──
      const moveSpeed = 6.5;
      const turnSpeed = 2.4;
      let moveZ = 0;
      let moveX = 0;

      if (keys['w'] || keys['arrowup']) moveZ -= 1;
      if (keys['s'] || keys['arrowdown']) moveZ += 1;
      if (keys['a'] || keys['arrowleft']) state.playerRotY += turnSpeed * dt;
      if (keys['d'] || keys['arrowright']) state.playerRotY -= turnSpeed * dt;

      // Jump in 1/6th Lunar Gravity (g = -1.62)
      if ((keys[' '] || keys['space']) && state.isGrounded) {
        state.playerVel.y = 4.2; // High floaty jump
        state.isGrounded = false;
        soundFx.playRadioChirp();
      }

      // Apply low lunar gravity
      state.playerVel.y -= 1.62 * dt * 2.8;

      // Resolve horizontal velocity relative to astronaut rotation
      const forward = new THREE.Vector3(0, 0, moveZ).applyAxisAngle(new THREE.Vector3(0, 1, 0), state.playerRotY);
      state.playerPos.x += forward.x * moveSpeed * dt;
      state.playerPos.z += forward.z * moveSpeed * dt;
      state.playerPos.y += state.playerVel.y * dt;

      // Terrain floor collision
      if (state.playerPos.y <= 0) {
        state.playerPos.y = 0;
        state.playerVel.y = 0;
        state.isGrounded = true;
      }

      // Update 3D player mesh
      playerGroup.position.copy(state.playerPos);
      playerGroup.rotation.y = state.playerRotY;
      headLight.visible = headlightOn;

      // Camera follow
      if (cameraView === '3RD_PERSON') {
        const camOffset = new THREE.Vector3(0, 3.2, 7.5).applyAxisAngle(new THREE.Vector3(0, 1, 0), state.playerRotY);
        camera.position.copy(state.playerPos).add(camOffset);
        camera.lookAt(state.playerPos.x, state.playerPos.y + 1.8, state.playerPos.z);
      } else {
        // 1st person
        const eyePos = state.playerPos.clone().add(new THREE.Vector3(0, 2.5, 0.2));
        camera.position.copy(eyePos);
        const lookTarget = eyePos.clone().add(new THREE.Vector3(0, 0, -10).applyAxisAngle(new THREE.Vector3(0, 1, 0), state.playerRotY));
        camera.lookAt(lookTarget);
      }

      // ── Proximity Check to Breaches ──
      let nearest: BreachPoint | null = null;
      let minDist = 4.5;

      for (const b of state.breaches) {
        if (b.fixed) continue;
        const d = state.playerPos.distanceTo(b.position);
        if (d < minDist) {
          nearest = b;
          break;
        }
      }
      setActiveBreachNear(nearest);

      // ── Interactive Repair Mechanic (Hold 'E' or Space) ──
      const actionKey = keys['e'] || keys['enter'];
      if (nearest && actionKey && nearest.requiredTool === selectedTool) {
        setIsRepairing(true);
        nearest.progress = Math.min(100, nearest.progress + dt * 32);
        setRepairProgress(Math.round(nearest.progress));

        // Welding sparks
        sparkParticles.visible = true;
        sparkParticles.position.copy(nearest.position);
        const sPos = sparkParticles.geometry.attributes.position.array as Float32Array;
        for (let i = 0; i < sparkCount * 3; i += 3) {
          sPos[i] = (Math.random() - 0.5) * 0.8;
          sPos[i + 1] = Math.random() * 0.8;
          sPos[i + 2] = (Math.random() - 0.5) * 0.8;
        }
        sparkParticles.geometry.attributes.position.needsUpdate = true;

        if (nearest.progress >= 100 && !nearest.fixed) {
          nearest.fixed = true;
          soundFx.playPowerUp();
          confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } });
          addRadioLog(`[SUCCESS]: ${nearest.name} restored to nominal!`);

          // Update overall base integrity
          const fixedCount = state.breaches.filter((b) => b.fixed).length;
          setBaseIntegrity(Math.round(24 + (fixedCount / state.breaches.length) * 76));
          if (nearest.id === 'solar_coupler') setSolarPowerKw(12.8);

          // All fixed?
          if (fixedCount === state.breaches.length) {
            setMissionOutcome('SUCCESS');
            soundFx.playMissionSuccess();
            addRadioLog('[MISSION CONTROL]: Moonbase Alpha is secure! Superb EVA teamwork, Commander!');
            if (onComplete) onComplete(100);
          }
        }
      } else {
        setIsRepairing(false);
        sparkParticles.visible = false;
      }

      // Oxygen Depletion Tick
      if (time - o2Interval > 1000 && missionOutcome === 'PLAYING') {
        o2Interval = time;
        setOxygenSeconds((prev) => {
          if (prev <= 1) {
            setMissionOutcome('FAILURE');
            soundFx.playWarningAlarm();
            addRadioLog('[CRITICAL]: Suit O2 depleted. Mission failed.');
            return 0;
          }
          return prev - 1;
        });
      }

      // Oxygen leak jet animation (stops if O2 pipe fixed)
      const o2Breach = state.breaches.find((b) => b.id === 'o2_pipe');
      if (o2Breach && !o2Breach.fixed) {
        leakParticles.visible = true;
        const lPositions = leakParticles.geometry.attributes.position.array as Float32Array;
        for (let i = 0; i < leakPCount; i++) {
          const idx = i * 3;
          lPositions[idx] += leakPVel[i].x;
          lPositions[idx + 1] += leakPVel[i].y;
          lPositions[idx + 2] += leakPVel[i].z;
          if (lPositions[idx + 1] > 3.5) {
            lPositions[idx] = -14;
            lPositions[idx + 1] = 0.8;
            lPositions[idx + 2] = -6;
          }
        }
        leakParticles.geometry.attributes.position.needsUpdate = true;
      } else {
        leakParticles.visible = false;
      }

      // Waypoint ring pulse
      rings.forEach((r, idx) => {
        const b = state.breaches[idx];
        if (b.fixed) {
          (r.material as THREE.MeshBasicMaterial).color.setHex(0x10b981);
        } else {
          r.scale.setScalar(1.0 + Math.sin(time * 0.005 + idx) * 0.15);
        }
      });

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(animate);

    const onResize = () => {
      const w = container.clientWidth || 960;
      const h = container.clientHeight || 640;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [isOpen, soundEnabled, selectedTool, headlightOn, cameraView, missionOutcome, addRadioLog, onComplete]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'var(--color-paper)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* ── TOP HUD NAVIGATION BAR (MOONBASE ALPHA STYLE) ── */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 24px',
          background: 'var(--color-paper-2)',
          borderBottom: '1px solid var(--rule-subtle)',
          zIndex: 20,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: 0, background: 'var(--color-paper-3)', border: '1px solid var(--rule-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield size={18} style={{ color: 'var(--color-accent)' }} />
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-ink)', fontFamily: 'var(--font-space)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>NASA MOONBASE ALPHA // EMERGENCY EVA</span>
              <span style={{ fontSize: '9px', background: 'var(--color-error)', color: '#000', padding: '1px 6px', borderRadius: 0, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>CRISIS ACTIVE</span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-ink-faint)', fontFamily: 'var(--font-mono)' }}>
              Site: Shackleton Outpost Sector 4 / Gravity: 1.62 m/s² / Lunar Night Approaching
            </div>
          </div>
        </div>

        {/* Central Telemetry Meters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* O2 Countdown */}
          <div style={{ background: oxygenSeconds < 60 ? 'rgba(239, 68, 68, 0.2)' : 'var(--color-paper-3)', border: `1px solid ${oxygenSeconds < 60 ? 'var(--color-error)' : 'var(--rule-subtle)'}`, borderRadius: 0, padding: '6px 14px', textAlign: 'center' }}>
            <div style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', color: 'var(--color-ink-faint)', fontWeight: 700 }}>SUIT OXYGEN TIME</div>
            <div style={{ fontSize: '15px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: oxygenSeconds < 60 ? 'var(--color-error)' : 'var(--color-accent-2)', fontVariantNumeric: 'tabular-nums' }}>
              {Math.floor(oxygenSeconds / 60)}:{(oxygenSeconds % 60).toString().padStart(2, '0')}
            </div>
          </div>

          {/* Base Integrity */}
          <div style={{ background: 'var(--color-paper-3)', border: '1px solid var(--rule-subtle)', borderRadius: 0, padding: '6px 14px', textAlign: 'center' }}>
            <div style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', color: 'var(--color-ink-faint)', fontWeight: 700 }}>BASE INTEGRITY</div>
            <div style={{ fontSize: '15px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: baseIntegrity > 75 ? 'var(--color-accent-green)' : 'var(--color-accent)', fontVariantNumeric: 'tabular-nums' }}>
              {baseIntegrity}%
            </div>
          </div>

          {/* Solar Power */}
          <div style={{ background: 'var(--color-paper-3)', border: '1px solid var(--rule-subtle)', borderRadius: 0, padding: '6px 14px', textAlign: 'center' }}>
            <div style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', color: 'var(--color-ink-faint)', fontWeight: 700 }}>POWER BUS</div>
            <div style={{ fontSize: '15px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-accent)', fontVariantNumeric: 'tabular-nums' }}>
              {solarPowerKw} kW
            </div>
          </div>
        </div>

        {/* Right Action Icons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setCameraView((prev) => (prev === '3RD_PERSON' ? '1ST_PERSON' : '3RD_PERSON'))}
            style={{ background: 'var(--color-paper-3)', border: '1px solid var(--rule-subtle)', color: 'var(--color-ink)', padding: '6px 12px', borderRadius: 0, fontSize: '11px', fontFamily: 'var(--font-mono)', cursor: 'pointer', fontWeight: 700, textTransform: 'uppercase' }}
          >
            {cameraView === '3RD_PERSON' ? '3RD PERSON [V]' : '1ST PERSON [V]'}
          </button>

          <button
            onClick={() => setHeadlightOn((prev) => !prev)}
            style={{ background: headlightOn ? 'var(--color-paper-3)' : 'transparent', border: `1px solid ${headlightOn ? 'var(--color-accent)' : 'var(--rule-subtle)'}`, color: headlightOn ? 'var(--color-accent)' : 'var(--color-ink-muted)', padding: '6px 12px', borderRadius: 0, fontSize: '11px', fontFamily: 'var(--font-mono)', cursor: 'pointer', fontWeight: 700, textTransform: 'uppercase' }}
          >
            HEADLIGHT [F]
          </button>

          <button
            onClick={onClose}
            aria-label="Close"
            style={{ width: '32px', height: '32px', borderRadius: 0, background: 'transparent', border: '1px solid var(--rule-subtle)', color: 'var(--color-ink-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <X size={16} />
          </button>
        </div>
      </header>

      {/* ── 3D VIEWPORT CONTAINER ── */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }} ref={mountRef}>
        
        {/* Interactive Repair Prompt Overlay */}
        {activeBreachNear && (
          <div
            style={{
              position: 'absolute',
              top: '20%',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'var(--color-paper-2)',
              border: `1px solid ${activeBreachNear.requiredTool === selectedTool ? 'var(--color-accent)' : 'var(--color-error)'}`,
              borderRadius: 0,
              padding: '14px 24px',
              textAlign: 'center',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.85)',
              zIndex: 30,
            }}
          >
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-ink)', fontFamily: 'var(--font-space)' }}>
              {activeBreachNear.name}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-ink-muted)', marginTop: '2px' }}>
              {activeBreachNear.desc}
            </div>

            <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              {activeBreachNear.requiredTool === selectedTool ? (
                <div style={{ color: 'var(--color-accent)', fontWeight: 700, fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
                  HOLD <strong>[E]</strong> TO WELD &amp; REPAIR ({repairProgress}%)
                </div>
              ) : (
                <div style={{ color: 'var(--color-error)', fontWeight: 700, fontSize: '11.5px', fontFamily: 'var(--font-mono)' }}>
                  WRONG TOOL: SWITCH TO [{activeBreachNear.requiredTool}] (Press 1, 2, or 3)
                </div>
              )}
            </div>

            {/* Repair Progress Bar */}
            <div style={{ width: '100%', height: '4px', background: 'var(--color-paper-3)', borderRadius: 0, marginTop: '8px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${activeBreachNear.progress}%`,
                  height: '100%',
                  background: 'var(--color-accent)',
                  transition: 'width 0.1s linear',
                }}
              />
            </div>
          </div>
        )}

        {/* Radio Comms Dispatch Window (Bottom-Left) */}
        <div
          style={{
            position: 'absolute',
            bottom: '90px',
            left: '24px',
            width: '380px',
            background: 'var(--color-paper-2)',
            border: '1px solid var(--rule-subtle)',
            borderRadius: 0,
            padding: '10px 14px',
            zIndex: 25,
          }}
        >
          <div style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', color: 'var(--color-accent-2)', fontWeight: 700, letterSpacing: '0.08em', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Radio size={12} />
            <span>MOONBASE ALPHA // TELEMETRY COMMS LOG</span>
          </div>
          {radioLog.map((log, idx) => (
            <div key={idx} style={{ fontSize: '10.5px', color: idx === radioLog.length - 1 ? 'var(--color-ink)' : 'var(--color-ink-faint)', fontFamily: 'var(--font-mono)', lineHeight: 1.4 }}>
              {log}
            </div>
          ))}
        </div>

        {/* Controls Cheatsheet (Bottom-Right) */}
        <div
          style={{
            position: 'absolute',
            bottom: '90px',
            right: '24px',
            background: 'var(--color-paper-2)',
            border: '1px solid var(--rule-subtle)',
            borderRadius: 0,
            padding: '10px 14px',
            zIndex: 25,
            fontSize: '10.5px',
            fontFamily: 'var(--font-mono)',
            color: 'var(--color-ink-muted)',
          }}
        >
          <div style={{ color: 'var(--color-accent)', fontWeight: 700, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>EVA ASTRONAUT CONTROLS:</div>
          <div>• <strong>WASD / Arrows</strong>: Walk in 1/6th gravity</div>
          <div>• <strong>Space</strong>: Low-gravity Lunar Hop</div>
          <div>• <strong>E</strong>: Use Equipped Repair Tool</div>
          <div>• <strong>1 / 2 / 3</strong>: Switch Welder / Wrench / Multimeter</div>
          <div>• <strong>V</strong>: 1st / 3rd Person / <strong>F</strong>: Headlight</div>
        </div>

        {/* Mission Outcome Banner */}
        {missionOutcome !== 'PLAYING' && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.85)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 50,
            }}
          >
            <div
              style={{
                background: 'var(--color-paper)',
                border: `1px solid ${missionOutcome === 'SUCCESS' ? 'var(--color-accent-green)' : 'var(--color-error)'}`,
                padding: '32px 48px',
                borderRadius: 0,
                textAlign: 'center',
                maxWidth: '480px',
                boxShadow: '0 24px 48px rgba(0, 0, 0, 0.8)',
              }}
            >
              <div style={{ display: 'inline-flex', padding: '10px', border: '1px solid var(--rule-subtle)', marginBottom: '12px', background: 'var(--color-paper-2)' }}>
                {missionOutcome === 'SUCCESS' ? <Shield size={28} style={{ color: 'var(--color-accent-green)' }} /> : <AlertTriangle size={28} style={{ color: 'var(--color-error)' }} />}
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: missionOutcome === 'SUCCESS' ? 'var(--color-accent-green)' : 'var(--color-error)', fontFamily: 'var(--font-space)' }}>
                {missionOutcome === 'SUCCESS' ? 'MOONBASE ALPHA RESTORED' : 'MISSION FAILED: O2 DEPLETED'}
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-ink-muted)', margin: '12px 0 24px 0', lineHeight: 1.6 }}>
                {missionOutcome === 'SUCCESS'
                  ? 'All 3 critical life support breaches were sealed before oxygen ran out. The lunar habitat crew is safe and Kilopower grid is fully operational!'
                  : 'Suit oxygen fell to zero before all severed lines could be welded. Remember to switch tools rapidly and leap across lunar craters using 1/6th gravity.'}
              </p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button
                  onClick={() => {
                    setMissionOutcome('PLAYING');
                    setOxygenSeconds(180);
                    setBaseIntegrity(24);
                    simRef.current.breaches.forEach((b) => {
                      b.fixed = false;
                      b.progress = 0;
                    });
                  }}
                  style={{ background: 'var(--color-paper-3)', border: '1px solid var(--rule-subtle)', color: 'var(--color-ink)', padding: '10px 20px', borderRadius: 0, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.04em' }}
                >
                  <RotateCcw size={12} style={{ display: 'inline', marginRight: '6px' }} /> Retry EVA Repair
                </button>
                <button
                  onClick={onClose}
                  style={{ background: 'var(--color-accent)', border: '1px solid var(--color-accent)', color: '#000000', padding: '10px 24px', borderRadius: 0, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.04em' }}
                >
                  Return to Lobby
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── BOTTOM EQUIPMENT TOOLBAR (HOTBAR 1, 2, 3) ── */}
      <footer
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          padding: '12px 24px',
          background: 'var(--color-paper-2)',
          borderTop: '1px solid var(--rule-subtle)',
          zIndex: 20,
        }}
      >
        <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--color-ink-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          EQUIPPED TOOL:
        </div>

        {/* Tool 1: Welder */}
        <button
          onClick={() => setSelectedTool('WELDER')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            background: selectedTool === 'WELDER' ? 'var(--color-paper-3)' : 'transparent',
            border: `1px solid ${selectedTool === 'WELDER' ? 'var(--color-accent)' : 'var(--rule-subtle)'}`,
            borderRadius: 0,
            color: selectedTool === 'WELDER' ? 'var(--color-accent)' : 'var(--color-ink-muted)',
            fontFamily: 'var(--font-mono)',
            fontSize: '11.5px',
            fontWeight: 700,
            cursor: 'pointer',
            textTransform: 'uppercase',
          }}
        >
          <Flame size={14} />
          <span>[1] Laser Pipe Welder</span>
        </button>

        {/* Tool 2: Wrench */}
        <button
          onClick={() => setSelectedTool('WRENCH')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            background: selectedTool === 'WRENCH' ? 'var(--color-paper-3)' : 'transparent',
            border: `1px solid ${selectedTool === 'WRENCH' ? 'var(--color-accent)' : 'var(--rule-subtle)'}`,
            borderRadius: 0,
            color: selectedTool === 'WRENCH' ? 'var(--color-accent)' : 'var(--color-ink-muted)',
            fontFamily: 'var(--font-mono)',
            fontSize: '11.5px',
            fontWeight: 700,
            cursor: 'pointer',
            textTransform: 'uppercase',
          }}
        >
          <Wrench size={14} />
          <span>[2] Coupler Wrench</span>
        </button>

        {/* Tool 3: Multimeter */}
        <button
          onClick={() => setSelectedTool('MULTIMETER')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            background: selectedTool === 'MULTIMETER' ? 'var(--color-paper-3)' : 'transparent',
            border: `1px solid ${selectedTool === 'MULTIMETER' ? 'var(--color-accent-green)' : 'var(--rule-subtle)'}`,
            borderRadius: 0,
            color: selectedTool === 'MULTIMETER' ? 'var(--color-accent-green)' : 'var(--color-ink-muted)',
            fontFamily: 'var(--font-mono)',
            fontSize: '11.5px',
            fontWeight: 700,
            cursor: 'pointer',
            textTransform: 'uppercase',
          }}
        >
          <Zap size={14} />
          <span>[3] Hermetic Multimeter</span>
        </button>
      </footer>
    </div>
  );
};
