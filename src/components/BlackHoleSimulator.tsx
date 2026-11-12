// ============================================================
// BlackHoleSimulator.tsx — Relativistic Gravitational Lensing & Accretion Disk
// Based on SpaceEngine / Interstellar Black Hole (YouTube: F7_18-VPqSc)
// 3D Three.js Simulation with Einstein Ring, Warped Accretion Disk,
// Relativistic Doppler Beaming, and General Relativity Telemetry
// ============================================================

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  X,
  Volume2,
  VolumeX,
  Eye,
  RotateCcw,
  Info,
  Clock,
  Compass,
  Zap,
  Sparkles,
  Activity,
} from 'lucide-react';
import { soundFx } from '../utils/audioEffects';

interface BlackHoleSimulatorProps {
  isOpen: boolean;
  onClose: () => void;
}

interface BlackHolePreset {
  name: string;
  type: string;
  massSolar: number;
  spinA: number;
  accretionRate: number;
  description: string;
  funFact: string;
}

const PRESETS: BlackHolePreset[] = [
  {
    name: 'Gargantua (Interstellar)',
    type: 'Supermassive Kerr Black Hole',
    massSolar: 100000000,
    spinA: 0.998,
    accretionRate: 0.9,
    description: 'Rapidly rotating extreme Kerr black hole surrounded by a luminous Keplerian accretion disk.',
    funFact: "Miller's planet orbits near the ISCO where 1 hour on the surface equals 7 years on Earth!",
  },
  {
    name: 'Sagittarius A*',
    type: 'Milky Way Supermassive',
    massSolar: 4154000,
    spinA: 0.9,
    accretionRate: 0.45,
    description: 'The supermassive black hole at the center of our Milky Way, imaged by the Event Horizon Telescope.',
    funFact: 'Its Schwarzschild radius is ~12.3 million km (~17 times the radius of our Sun).',
  },
  {
    name: 'M87* (Messier 87)',
    type: 'Giant Elliptical Supermassive',
    massSolar: 6500000000,
    spinA: 0.95,
    accretionRate: 0.95,
    description: 'First ever directly imaged black hole by EHT in 2019, possessing a 5,000 light-year relativistic jet.',
    funFact: 'Its event horizon shadow is larger than our entire Solar System out past Pluto!',
  },
  {
    name: 'Cygnus X-1',
    type: 'Stellar-Mass Black Hole',
    massSolar: 21.2,
    spinA: 0.97,
    accretionRate: 0.75,
    description: 'First confirmed black hole candidate discovered in 1964, devouring companion supergiant HDE 226868.',
    funFact: 'Produces ultra-hot X-ray flares reaching millions of Kelvin from supersonic infalling plasma.',
  },
];

export const BlackHoleSimulator: React.FC<BlackHoleSimulatorProps> = ({ isOpen, onClose }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedPreset, setSelectedPreset] = useState<number>(0);
  const [blackHoleMass, setBlackHoleMass] = useState<number>(PRESETS[0].massSolar);
  const [spinParameter, setSpinParameter] = useState<number>(PRESETS[0].spinA);
  const [diskBrightness, setDiskBrightness] = useState<number>(1.2);
  const [lensingStrength, setLensingStrength] = useState<number>(1.0);
  const [showOverlays, setShowOverlays] = useState<boolean>(true);
  const [orbitSpeed, setOrbitSpeed] = useState<number>(0.25);
  const [cameraDistance, setCameraDistance] = useState<number>(14.0);
  const [timeDilationRatio, setTimeDilationRatio] = useState<number>(1.0);
  const [schwarzschildRadiusKm, setSchwarzschildRadiusKm] = useState<number>(0);
  const [hawkingTempKelvin, setHawkingTempKelvin] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'TELEMETRY' | 'PHYSICS' | 'PRESETS'>('TELEMETRY');

  const isDraggingRef = useRef(false);
  const prevMouseRef = useRef({ x: 0, y: 0 });
  const cameraAnglesRef = useRef({ theta: 0.35, phi: 0.22 });

  const paramsRef = useRef({
    cameraDistance,
    orbitSpeed,
    spinParameter,
    diskBrightness,
    lensingStrength,
  });

  useEffect(() => {
    paramsRef.current = {
      cameraDistance,
      orbitSpeed,
      spinParameter,
      diskBrightness,
      lensingStrength,
    };
  }, [cameraDistance, orbitSpeed, spinParameter, diskBrightness, lensingStrength]);

  // Update physical calculations
  useEffect(() => {
    const rs = 2.953 * blackHoleMass;
    setSchwarzschildRadiusKm(rs);
    const tempH = 6.17e-8 / Math.max(1, blackHoleMass);
    setHawkingTempKelvin(tempH);

    // Relativistic gravitational time dilation
    const rOverRs = Math.max(1.08, cameraDistance / 2.2);
    const factor = Math.sqrt(Math.max(0.001, 1.0 - 1.0 / rOverRs));
    setTimeDilationRatio(factor);
  }, [blackHoleMass, cameraDistance]);

  const handleSelectPreset = (idx: number) => {
    setSelectedPreset(idx);
    const p = PRESETS[idx];
    setBlackHoleMass(p.massSolar);
    setSpinParameter(p.spinA);
    setDiskBrightness(p.accretionRate * 1.3);
    paramsRef.current.spinParameter = p.spinA;
    paramsRef.current.diskBrightness = p.accretionRate * 1.3;
    if (soundEnabled) soundFx.playSuccess();
  };

  // Main Three.js Setup
  useEffect(() => {
    if (!isOpen || !mountRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(0, 3, 14);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);

    // 1. STARFIELD SKYBOX
    const starGeo = new THREE.SphereGeometry(300, 48, 48);
    const starCanvas = document.createElement('canvas');
    starCanvas.width = 2048;
    starCanvas.height = 1024;
    const ctx = starCanvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#03050c';
      ctx.fillRect(0, 0, 2048, 1024);

      // Deep space galactic dust clouds
      for (let i = 0; i < 300; i++) {
        const x = Math.random() * 2048;
        const y = 512 + (Math.random() - 0.5) * 320;
        const r = Math.random() * 80 + 30;
        const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
        grad.addColorStop(0, 'rgba(40, 80, 220, 0.08)');
        grad.addColorStop(0.5, 'rgba(160, 90, 240, 0.04)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Stars
      for (let i = 0; i < 4000; i++) {
        const x = Math.random() * 2048;
        const y = Math.random() * 1024;
        const rad = Math.random() < 0.95 ? Math.random() * 1.2 : Math.random() * 2.2 + 0.8;
        const alpha = Math.random() * 0.8 + 0.2;
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(x, y, rad, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    const starTexture = new THREE.CanvasTexture(starCanvas);
    const starMat = new THREE.MeshBasicMaterial({
      map: starTexture,
      side: THREE.BackSide,
    });
    const starMesh = new THREE.Mesh(starGeo, starMat);
    scene.add(starMesh);

    // 2. EVENT HORIZON (THE PITCH-BLACK RELATIVISTIC SHADOW)
    const bhRadius = 2.2;
    const shadowGeo = new THREE.SphereGeometry(bhRadius, 64, 64);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    scene.add(shadowMesh);

    // 3. EINSTEIN PHOTON SPHERE RING (Infinitesimally thin brilliant incandescent filament)
    const photonRingGeo = new THREE.RingGeometry(bhRadius * 1.01, bhRadius * 1.12, 192);
    const photonRingMat = new THREE.ShaderMaterial({
      side: THREE.DoubleSide,
      transparent: true,
      blending: THREE.AdditiveBlending,
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        void main() {
          float dist = distance(vUv, vec2(0.5));
          float alpha = smoothstep(0.49, 0.465, dist) * smoothstep(0.38, 0.44, dist);
          vec3 col = vec3(1.0, 0.95, 0.82) * 4.2;
          gl_FragColor = vec4(col, alpha * 0.98);
        }
      `,
    });
    const photonRingMesh = new THREE.Mesh(photonRingGeo, photonRingMat);
    scene.add(photonRingMesh);

    // 4. KIP THORNE / INTERSTELLAR RELATIVISTIC ACCRETION DISK SHADER
    // Multi-octave Simplex noise, differential Keplerian shear, and exact relativistic Doppler beaming
    const accretionVertexShader = `
      varying vec3 vWorldPos;
      varying vec2 vUv;
      varying vec3 vNormal;

      void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPos = worldPos.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `;

    const accretionFragmentShader = `
      uniform float uTime;
      uniform float uSpin;
      uniform float uBrightness;
      uniform float uLensing;
      uniform vec3 uCameraPos;
      uniform float uInnerRadius;
      uniform float uOuterRadius;

      varying vec3 vWorldPos;
      varying vec2 vUv;
      varying vec3 vNormal;

      vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

      float snoise(vec2 v) {
        const vec4 C = vec4(0.211324865405187,
                            0.366025403784439,
                           -0.577350269189626,
                            0.024390243902439);
        vec2 i  = floor(v + dot(v, C.yy));
        vec2 x0 = v -   i + dot(i, C.xx);
        vec2 i1;
        i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
        i = mod289(i);
        vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
              + i.x + vec3(0.0, i1.x, 1.0));
        vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
        m = m*m;
        m = m*m;
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
        m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
        vec3 g;
        g.x  = a0.x  * x0.x  + h.x  * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
      }

      float fbm(vec2 p) {
        float total = 0.0;
        float amp = 0.52;
        for (int i = 0; i < 4; i++) {
          total += snoise(p) * amp;
          p *= 2.12;
          amp *= 0.46;
        }
        return total;
      }

      void main() {
        float r = length(vWorldPos.xz);
        if (r < 0.01) r = length(vWorldPos.xy);

        // Sharp ISCO inner edge, soft outer boundary
        float innerFade = smoothstep(uInnerRadius * 0.98, uInnerRadius + 0.32, r);
        float outerFade = smoothstep(uOuterRadius, uOuterRadius - 1.6, r);
        float diskAlpha = innerFade * outerFade;
        if (diskAlpha <= 0.001) discard;

        // Keplerian differential shear
        float phi = atan(vWorldPos.z, vWorldPos.x);
        float omega = (3.2 / pow(max(0.5, r), 1.35)) * (1.0 + uSpin * 0.65);
        float shearedAngle = phi + uTime * omega;

        // Turbulent plasma filaments
        vec2 plasmaUv = vec2(shearedAngle * 3.6, r * 2.1);
        float turbulence = fbm(plasmaUv);
        float density = clamp(0.42 + turbulence * 0.68, 0.0, 1.6);

        // Relativistic Doppler Beaming (Special Relativity)
        // Counter-clockwise plasma rotation in XZ plane
        vec3 orbitVelocity = normalize(vec3(-vWorldPos.z, 0.0, vWorldPos.x));
        vec3 toCam = normalize(uCameraPos - vWorldPos);
        float betaParallel = dot(orbitVelocity, toCam) * clamp(1.65 / sqrt(max(1.0, r)), 0.15, 0.82) * (1.0 + uSpin * 0.25);
        
        float beta2 = clamp(betaParallel * betaParallel, 0.0, 0.85);
        float gamma = 1.0 / sqrt(1.0 - beta2);
        float doppler = 1.0 / (gamma * (1.0 - betaParallel * 0.94));
        float beaming = pow(clamp(doppler, 0.12, 5.2), 3.8 * uLensing);

        // Gravitational Redshift (General Relativity)
        float gravRedshift = sqrt(clamp(1.0 - (uInnerRadius * 0.82) / max(0.1, r), 0.06, 1.0));

        // Blackbody Color Spectrum
        float normR = clamp((r - uInnerRadius) / max(0.1, uOuterRadius - uInnerRadius), 0.0, 1.0);
        vec3 colorCore = vec3(1.25, 1.2, 1.1) * 4.5;   // 10^7 K ISCO incandescent white
        vec3 colorInner = vec3(1.0, 0.9, 0.58) * 2.6;   // 10^6 K pale electric gold
        vec3 colorMid = vec3(1.0, 0.52, 0.18) * 1.7;    // 10^5 K stellar amber
        vec3 colorOuter = vec3(0.72, 0.14, 0.04);       // 10^4 K deep crimson outer gas

        vec3 baseColor;
        if (normR < 0.16) {
          baseColor = mix(colorCore, colorInner, normR / 0.16);
        } else if (normR < 0.52) {
          baseColor = mix(colorInner, colorMid, (normR - 0.16) / 0.36);
        } else {
          baseColor = mix(colorMid, colorOuter, (normR - 0.52) / 0.48);
        }

        // Doppler Color Shift: Approaching side boosted white/blue; Receding side dimmed dark amber/red
        if (beaming > 1.0) {
          baseColor = mix(baseColor, vec3(0.85, 1.15, 1.5) * 3.0, clamp((beaming - 1.0) * 0.45, 0.0, 0.85));
        } else {
          baseColor = mix(baseColor, vec3(0.45, 0.08, 0.015), clamp((1.0 - beaming) * 0.75, 0.0, 0.92));
        }

        vec3 finalColor = baseColor * density * beaming * gravRedshift * uBrightness;
        float finalAlpha = clamp(diskAlpha * (0.68 + density * 0.42) * min(2.5, beaming), 0.0, 0.96);

        gl_FragColor = vec4(finalColor, finalAlpha);
      }
    `;

    // 4.1 Horizontal Equatorial Accretion Disk
    const innerRadius = bhRadius * 1.25;
    const outerRadius = bhRadius * 4.8;
    const diskGeo = new THREE.RingGeometry(innerRadius, outerRadius, 192, 32);
    const diskShaderMat = new THREE.ShaderMaterial({
      side: THREE.DoubleSide,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uSpin: { value: paramsRef.current.spinParameter },
        uBrightness: { value: paramsRef.current.diskBrightness },
        uLensing: { value: paramsRef.current.lensingStrength },
        uCameraPos: { value: camera.position.clone() },
        uInnerRadius: { value: innerRadius },
        uOuterRadius: { value: outerRadius },
      },
      vertexShader: accretionVertexShader,
      fragmentShader: accretionFragmentShader,
    });
    const diskMesh = new THREE.Mesh(diskGeo, diskShaderMat);
    diskMesh.rotation.x = Math.PI / 2;
    scene.add(diskMesh);

    // 4.2 Helper to construct Kip Thorne Upper & Lower Lensed Accretion Arches
    const createLensingArchGeometry = (isUpper: boolean, inR: number, outR: number) => {
      const segs = 144;
      const radSegs = 20;
      const geom = new THREE.BufferGeometry();
      const positions: number[] = [];
      const uvs: number[] = [];
      const indices: number[] = [];

      for (let j = 0; j <= radSegs; j++) {
        const v = j / radSegs;
        const r = inR + v * (outR - inR);
        for (let i = 0; i <= segs; i++) {
          const u = i / segs;
          const angle = Math.PI * u; // 0 to PI (sweep from left to right flank)
          const x = -r * Math.cos(angle);
          const archY = (isUpper ? 1.0 : -1.0) * r * Math.sin(angle) * 0.96;
          const archZ = -Math.sin(angle) * (r * 0.38); // curved behind the black hole shadow
          positions.push(x, archY, archZ);
          uvs.push(u, v);
        }
      }

      for (let j = 0; j < radSegs; j++) {
        for (let i = 0; i < segs; i++) {
          const a = j * (segs + 1) + i;
          const b = (j + 1) * (segs + 1) + i;
          const c = (j + 1) * (segs + 1) + (i + 1);
          const d = j * (segs + 1) + (i + 1);
          indices.push(a, b, d);
          indices.push(b, c, d);
        }
      }

      geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
      geom.setIndex(indices);
      geom.computeVertexNormals();
      return geom;
    };

    // Upper Lensed Arch (light bent over the top of the event horizon)
    const upperArchGeo = createLensingArchGeometry(true, innerRadius * 0.98, outerRadius * 0.88);
    const upperArchMesh = new THREE.Mesh(upperArchGeo, diskShaderMat);
    scene.add(upperArchMesh);

    // Lower Lensed Arch (light bent beneath the event horizon)
    const lowerArchGeo = createLensingArchGeometry(false, innerRadius * 0.98, outerRadius * 0.88);
    const lowerArchMesh = new THREE.Mesh(lowerArchGeo, diskShaderMat);
    scene.add(lowerArchMesh);

    // 5. KERR RELATIVISTIC POLAR PLASMA JETS (Blandford-Znajek Synchrotron Emission)
    const jetGeo = new THREE.CylinderGeometry(0.35, 4.2, 24, 32, 1, true);
    const jetMat = new THREE.ShaderMaterial({
      side: THREE.DoubleSide,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uSpin: { value: paramsRef.current.spinParameter },
        uBrightness: { value: paramsRef.current.diskBrightness },
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vPos;
        void main() {
          vUv = uv;
          vPos = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uSpin;
        uniform float uBrightness;
        varying vec2 vUv;
        varying vec3 vPos;
        void main() {
          float distY = abs(vUv.y - 0.5) * 2.0;
          float helical = sin(vUv.x * 24.0 + uTime * 6.0 + distY * 12.0) * 0.5 + 0.5;
          float alpha = smoothstep(1.0, 0.1, distY) * smoothstep(0.0, 0.35, distY) * (0.35 + helical * 0.65);
          vec3 jetCol = mix(vec3(0.0, 0.85, 1.0), vec3(0.7, 0.25, 1.0), distY);
          float intensity = uSpin * uBrightness * 1.8;
          gl_FragColor = vec4(jetCol * 2.5 * intensity, alpha * min(0.85, intensity));
        }
      `,
    });
    const northJet = new THREE.Mesh(jetGeo, jetMat);
    northJet.position.y = 12;
    scene.add(northJet);

    const southJet = new THREE.Mesh(jetGeo, jetMat);
    southJet.position.y = -12;
    southJet.rotation.x = Math.PI;
    scene.add(southJet);

    // 6. ACCRETION DISK PARTICLES (INSPIRALING HIGH ENERGY IONS WITH CIRCULAR GLOW SPRITES)
    const pCanvas = document.createElement('canvas');
    pCanvas.width = 64;
    pCanvas.height = 64;
    const pCtx = pCanvas.getContext('2d');
    if (pCtx) {
      const pGrad = pCtx.createRadialGradient(32, 32, 0, 32, 32, 32);
      pGrad.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
      pGrad.addColorStop(0.25, 'rgba(255, 220, 140, 0.85)');
      pGrad.addColorStop(0.6, 'rgba(255, 120, 30, 0.35)');
      pGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      pCtx.fillStyle = pGrad;
      pCtx.fillRect(0, 0, 64, 64);
    }
    const pTexture = new THREE.CanvasTexture(pCanvas);

    const particleCount = 2000;
    const pGeo = new THREE.BufferGeometry();
    const pPositions = new Float32Array(particleCount * 3);
    const pColors = new Float32Array(particleCount * 3);
    const pAngles = new Float32Array(particleCount);
    const pRadii = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      const r = innerRadius + Math.random() * (outerRadius - innerRadius);
      const angle = Math.random() * Math.PI * 2;
      const y = (Math.random() - 0.5) * 0.18 * (r / bhRadius);

      pRadii[i] = r;
      pAngles[i] = angle;
      pPositions[i * 3] = Math.cos(angle) * r;
      pPositions[i * 3 + 1] = y;
      pPositions[i * 3 + 2] = Math.sin(angle) * r;

      const norm = (r - innerRadius) / (outerRadius - innerRadius);
      pColors[i * 3] = 1.0;
      pColors[i * 3 + 1] = Math.max(0.2, 0.95 - norm * 0.7);
      pColors[i * 3 + 2] = Math.max(0.1, 0.8 - norm * 0.8);
    }

    pGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
    pGeo.setAttribute('color', new THREE.BufferAttribute(pColors, 3));

    const pMat = new THREE.PointsMaterial({
      size: 0.22,
      map: pTexture,
      vertexColors: true,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const particleMesh = new THREE.Points(pGeo, pMat);
    scene.add(particleMesh);

    // Mouse Interaction
    const dom = mountRef.current;
    const onMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      prevMouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const dx = (e.clientX - prevMouseRef.current.x) * 0.005;
      const dy = (e.clientY - prevMouseRef.current.y) * 0.005;

      cameraAnglesRef.current.theta += dx;
      cameraAnglesRef.current.phi = Math.max(-0.55, Math.min(0.55, cameraAnglesRef.current.phi - dy));
      prevMouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDraggingRef.current = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setCameraDistance((prev) => Math.max(6.5, Math.min(30.0, prev + e.deltaY * 0.02)));
    };

    dom.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    dom.addEventListener('wheel', onWheel, { passive: false });

    // Resize Handler
    const handleResize = () => {
      if (!mountRef.current || !renderer || !camera) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Animation Loop
    let animId: number;
    let lastTime = performance.now();
    let totalElapsedSec = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const now = performance.now();
      const delta = Math.min(0.1, (now - lastTime) / 1000);
      lastTime = now;
      totalElapsedSec += delta;

      const p = paramsRef.current;

      // Camera Position on Orbital Sphere
      if (!isDraggingRef.current && p.orbitSpeed > 0) {
        cameraAnglesRef.current.theta += delta * p.orbitSpeed * 0.25;
      }

      const dist = p.cameraDistance;
      const theta = cameraAnglesRef.current.theta;
      const phi = cameraAnglesRef.current.phi;

      camera.position.set(
        dist * Math.cos(phi) * Math.sin(theta),
        dist * Math.sin(phi),
        dist * Math.cos(phi) * Math.cos(theta)
      );
      camera.lookAt(0, 0, 0);

      // Update Relativistic Accretion Shader Uniforms
      diskShaderMat.uniforms.uTime.value = totalElapsedSec;
      diskShaderMat.uniforms.uCameraPos.value.copy(camera.position);
      diskShaderMat.uniforms.uSpin.value = p.spinParameter;
      diskShaderMat.uniforms.uBrightness.value = p.diskBrightness;
      diskShaderMat.uniforms.uLensing.value = p.lensingStrength;

      // Update Polar Jets
      jetMat.uniforms.uTime.value = totalElapsedSec;
      jetMat.uniforms.uSpin.value = p.spinParameter;
      jetMat.uniforms.uBrightness.value = p.diskBrightness;
      northJet.visible = p.spinParameter > 0.25;
      southJet.visible = p.spinParameter > 0.25;

      // Photon ring always faces camera normal
      photonRingMesh.lookAt(camera.position);

      // Animate orbiting plasma particles (Keplerian speed ~ 1/r^1.35)
      const posAttr = pGeo.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < particleCount; i++) {
        const r = pRadii[i];
        const vOmega = (3.5 / Math.pow(r, 1.35)) * (1.0 + p.spinParameter * 0.65);
        pAngles[i] += delta * vOmega;
        posAttr.setX(i, Math.cos(pAngles[i]) * r);
        posAttr.setZ(i, Math.sin(pAngles[i]) * r);
      }
      posAttr.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      dom.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      dom.removeEventListener('wheel', onWheel);

      renderer.dispose();
      starGeo.dispose();
      starMat.dispose();
      starTexture.dispose();
      shadowGeo.dispose();
      shadowMat.dispose();
      photonRingGeo.dispose();
      photonRingMat.dispose();
      diskGeo.dispose();
      diskShaderMat.dispose();
      upperArchGeo.dispose();
      lowerArchGeo.dispose();
      jetGeo.dispose();
      jetMat.dispose();
      pGeo.dispose();
      pMat.dispose();
      pTexture.dispose();

      if (dom.contains(renderer.domElement)) {
        dom.removeChild(renderer.domElement);
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: '#040711',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'var(--font-space), -apple-system, sans-serif',
        userSelect: 'none',
        overflow: 'hidden',
        color: '#f8fafc',
      }}
      id="black-hole-lab-container"
    >
      {/* ── TOP HUD HEADER (ARTEMIS MISSION CONTROL AESTHETICS) ── */}
      <header
        style={{
          height: '56px',
          background: 'linear-gradient(180deg, rgba(14, 20, 36, 0.98) 0%, rgba(8, 12, 22, 0.92) 100%)',
          borderBottom: '1px solid rgba(0, 210, 255, 0.35)',
          padding: '0 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backdropFilter: 'blur(16px)',
          zIndex: 30,
          flexShrink: 0,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.6)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #a855f7, #00d2ff)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 16px rgba(0, 210, 255, 0.4)',
            }}
          >
            <Sparkles size={18} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', fontWeight: 900, color: '#00d2ff', letterSpacing: '0.08em' }}>
                SPACEENGINE / RELATIVISTIC ASTROPHYSICS LAB
              </span>
              <span
                style={{
                  fontSize: '9.5px',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 800,
                  background: 'rgba(255, 158, 27, 0.2)',
                  border: '1px solid #ff9e1b',
                  color: '#ffb03a',
                  padding: '1px 6px',
                  borderRadius: '3px',
                }}
              >
                EINSTEIN LENSING
              </span>
            </div>
            <div style={{ fontSize: '13px', fontWeight: 900, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>Kerr Black Hole & Gravitational Ray Deflection</span>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#94a3b8', fontWeight: 600 }}>
                [ M = {blackHoleMass >= 1e6 ? `${(blackHoleMass / 1e6).toFixed(1)}M M☉` : `${blackHoleMass} M☉`} ]
              </span>
            </div>
          </div>
        </div>

        {/* Center Mode Switcher Tabs */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: 'rgba(15, 23, 42, 0.85)',
            border: '1px solid rgba(0, 210, 255, 0.25)',
            borderRadius: '8px',
            padding: '3px',
          }}
        >
          {(['TELEMETRY', 'PHYSICS', 'PRESETS'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                if (soundEnabled) soundFx.playClick(850);
              }}
              style={{
                padding: '4px 14px',
                borderRadius: '6px',
                border: 'none',
                background: activeTab === tab ? '#00d2ff' : 'transparent',
                color: activeTab === tab ? '#07090e' : '#cbd5e1',
                fontSize: '11px',
                fontWeight: 900,
                fontFamily: 'var(--font-mono)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => {
              setShowOverlays((v) => !v);
              if (soundEnabled) soundFx.playClick(800);
            }}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid rgba(0, 210, 255, 0.3)',
              background: showOverlays ? 'rgba(0, 210, 255, 0.15)' : 'rgba(15, 23, 42, 0.6)',
              color: showOverlays ? '#00d2ff' : '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              fontWeight: 800,
            }}
            title="Toggle Telemetry HUD Overlays"
          >
            <Eye size={14} />
            <span>HUD</span>
          </button>

          <button
            onClick={() => setSoundEnabled((v) => !v)}
            style={{
              padding: '6px 10px',
              borderRadius: '6px',
              border: '1px solid rgba(148, 163, 184, 0.25)',
              background: 'rgba(15, 23, 42, 0.6)',
              color: soundEnabled ? '#00d2ff' : '#94a3b8',
              cursor: 'pointer',
            }}
            title="Toggle Sound"
          >
            {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
          </button>

          <button
            onClick={onClose}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: '1px solid rgba(239, 68, 68, 0.5)',
              background: 'rgba(239, 68, 68, 0.18)',
              color: '#fca5a5',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              fontWeight: 900,
            }}
          >
            <X size={14} />
            <span>EXIT LAB</span>
          </button>
        </div>
      </header>

      {/* ── 3D SIMULATION CANVAS VIEWPORT ── */}
      <div style={{ position: 'relative', flex: 1, width: '100%', height: '100%', overflow: 'hidden' }}>
        <div ref={mountRef} style={{ width: '100%', height: '100%', cursor: 'grab' }} />

        {/* OVERLAYS (WHEN HUD IS ENABLED) */}
        {showOverlays && (
          <>
            {/* Top-Left General Relativity Telemetry Panel */}
            <div
              style={{
                position: 'absolute',
                top: '16px',
                left: '16px',
                width: '320px',
                background: 'rgba(11, 17, 30, 0.88)',
                border: '1px solid rgba(0, 210, 255, 0.35)',
                clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)',
                padding: '14px',
                backdropFilter: 'blur(12px)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.7)',
                zIndex: 20,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0, 210, 255, 0.25)', paddingBottom: '8px', marginBottom: '10px' }}>
                <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 900, color: '#00d2ff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Activity size={14} color="#00d2ff" />
                  RELATIVISTIC METRIC TELEMETRY
                </span>
                <span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', border: '1px solid #10b981', padding: '1px 5px', borderRadius: '3px', fontWeight: 800 }}>
                  ACTIVE
                </span>
              </div>

              {/* Time Dilation Gauge */}
              <div style={{ background: 'rgba(17, 24, 39, 0.9)', border: '1px solid rgba(148, 163, 184, 0.25)', borderRadius: '6px', padding: '10px', marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#ffb03a', fontWeight: 800 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Clock size={13} />
                    Time Dilation (t'/t):
                  </span>
                  <span style={{ fontSize: '12px', color: '#ff9e1b', fontWeight: 900 }}>
                    {timeDilationRatio.toFixed(3)}
                  </span>
                </div>
                <div style={{ width: '100%', height: '6px', background: '#1e293b', borderRadius: '3px', overflow: 'hidden', marginTop: '6px' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${Math.min(100, (1.0 - timeDilationRatio) * 100)}%`,
                      background: 'linear-gradient(90deg, #10b981, #ff9e1b, #ef4444)',
                    }}
                  />
                </div>
                <div style={{ fontSize: '9.5px', color: '#94a3b8', marginTop: '6px', fontFamily: 'var(--font-mono)' }}>
                  {timeDilationRatio < 0.5
                    ? '⚠️ Extreme Spacetime Warp: 1 hr here = years on Earth!'
                    : 'Subtle gravitational redshift at current orbit radius.'}
                </div>
              </div>

              {/* Telemetry Metrics Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '10.5px', fontFamily: 'var(--font-mono)' }}>
                <div style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(148, 163, 184, 0.2)', borderRadius: '4px', padding: '6px 8px' }}>
                  <div style={{ color: '#94a3b8', fontSize: '9px' }}>Schwarzschild (R_s)</div>
                  <div style={{ color: '#00d2ff', fontWeight: 900, marginTop: '2px' }}>
                    {schwarzschildRadiusKm > 1e6 ? `${(schwarzschildRadiusKm / 1e6).toFixed(2)}M km` : `${schwarzschildRadiusKm.toFixed(0)} km`}
                  </div>
                </div>

                <div style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(148, 163, 184, 0.2)', borderRadius: '4px', padding: '6px 8px' }}>
                  <div style={{ color: '#94a3b8', fontSize: '9px' }}>Photon Ring (1.5 R_s)</div>
                  <div style={{ color: '#00d2ff', fontWeight: 900, marginTop: '2px' }}>
                    {(schwarzschildRadiusKm * 1.5) > 1e6 ? `${((schwarzschildRadiusKm * 1.5) / 1e6).toFixed(2)}M km` : `${(schwarzschildRadiusKm * 1.5).toFixed(0)} km`}
                  </div>
                </div>

                <div style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(148, 163, 184, 0.2)', borderRadius: '4px', padding: '6px 8px' }}>
                  <div style={{ color: '#94a3b8', fontSize: '9px' }}>Kerr Spin (a/M)</div>
                  <div style={{ color: '#a855f7', fontWeight: 900, marginTop: '2px' }}>
                    {spinParameter.toFixed(3)} c
                  </div>
                </div>

                <div style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(148, 163, 184, 0.2)', borderRadius: '4px', padding: '6px 8px' }}>
                  <div style={{ color: '#94a3b8', fontSize: '9px' }}>Hawking Temp</div>
                  <div style={{ color: '#f8fafc', fontWeight: 900, marginTop: '2px' }}>
                    {hawkingTempKelvin.toExponential(2)} K
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom-Left Controls Explanation */}
            <div
              style={{
                position: 'absolute',
                bottom: '16px',
                left: '16px',
                maxWidth: '340px',
                background: 'rgba(11, 17, 30, 0.88)',
                border: '1px solid rgba(0, 210, 255, 0.3)',
                borderRadius: '8px',
                padding: '12px 14px',
                backdropFilter: 'blur(12px)',
                fontSize: '11px',
                color: '#cbd5e1',
                zIndex: 20,
              }}
            >
              <div style={{ color: '#00d2ff', fontWeight: 900, fontFamily: 'var(--font-mono)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Info size={14} color="#00d2ff" />
                HOW TO READ THIS 3D SIMULATION:
              </div>
              <ul style={{ margin: 0, paddingLeft: '16px', lineHeight: '1.45', fontSize: '10.5px' }}>
                <li><strong style={{ color: '#f8fafc' }}>Central Shadow:</strong> The event horizon where spacetime curvature traps light forever.</li>
                <li><strong style={{ color: '#ffb03a' }}>Warped Accretion Disk:</strong> Gravitational lensing bends light from the rear into upper/lower rings!</li>
                <li><strong style={{ color: '#00d2ff' }}>Doppler Boosting:</strong> Approaching gas blueshifts and brightens; receding gas redshifts.</li>
                <li><strong style={{ color: '#f8fafc' }}>Interaction:</strong> Drag with Left Mouse to orbit 360°. Scroll wheel to zoom in/out.</li>
              </ul>
            </div>

            {/* Right Interactive Drawer */}
            <div
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                width: '310px',
                background: 'rgba(11, 17, 30, 0.92)',
                border: '1px solid rgba(0, 210, 255, 0.35)',
                borderRadius: '8px',
                padding: '16px',
                backdropFilter: 'blur(14px)',
                zIndex: 20,
                maxHeight: 'calc(100vh - 120px)',
                overflowY: 'auto',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.8)',
              }}
            >
              {activeTab === 'PRESETS' ? (
                <div>
                  <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 900, color: '#00d2ff', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Zap size={14} color="#00d2ff" />
                    FAMOUS BLACK HOLE PRESETS
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {PRESETS.map((p, idx) => (
                      <button
                        key={p.name}
                        onClick={() => handleSelectPreset(idx)}
                        style={{
                          textAlign: 'left',
                          padding: '10px 12px',
                          borderRadius: '6px',
                          border: selectedPreset === idx ? '1px solid #00d2ff' : '1px solid rgba(148, 163, 184, 0.25)',
                          background: selectedPreset === idx ? 'rgba(0, 210, 255, 0.18)' : 'rgba(15, 23, 42, 0.7)',
                          color: '#f8fafc',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 900, color: '#00d2ff' }}>{p.name}</span>
                          <span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', background: 'rgba(148, 163, 184, 0.2)', color: '#94a3b8', padding: '1px 5px', borderRadius: '3px' }}>
                            {p.type.split(' ')[0]}
                          </span>
                        </div>
                        <div style={{ fontSize: '10.5px', color: '#cbd5e1', lineHeight: '1.35', marginBottom: '4px' }}>
                          {p.description}
                        </div>
                        <div style={{ fontSize: '9.5px', color: '#ffb03a', fontStyle: 'italic' }}>
                          💡 {p.funFact}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : activeTab === 'PHYSICS' ? (
                <div>
                  <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 900, color: '#00d2ff', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Compass size={14} color="#00d2ff" />
                    GENERAL RELATIVITY CONCEPTS
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '11px', color: '#cbd5e1' }}>
                    <div style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(148, 163, 184, 0.2)', borderRadius: '6px', padding: '10px' }}>
                      <div style={{ fontWeight: 900, color: '#00d2ff', marginBottom: '3px' }}>Einstein Ring</div>
                      <p style={{ margin: 0, fontSize: '10.5px', color: '#94a3b8', lineHeight: '1.4' }}>
                        Gravitational deflection bends null geodesics (light paths) around the mass center, producing a circular Einstein ring when aligned with observer.
                      </p>
                    </div>
                    <div style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(148, 163, 184, 0.2)', borderRadius: '6px', padding: '10px' }}>
                      <div style={{ fontWeight: 900, color: '#ff9e1b', marginBottom: '3px' }}>ISCO & Accretion Infall</div>
                      <p style={{ margin: 0, fontSize: '10.5px', color: '#94a3b8', lineHeight: '1.4' }}>
                        The Innermost Stable Circular Orbit defines the boundary where friction heats gas to X-ray temperatures before plunging across the event horizon.
                      </p>
                    </div>
                    <div style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(148, 163, 184, 0.2)', borderRadius: '6px', padding: '10px' }}>
                      <div style={{ fontWeight: 900, color: '#a855f7', marginBottom: '3px' }}>Frame Dragging (Ergosphere)</div>
                      <p style={{ margin: 0, fontSize: '10.5px', color: '#94a3b8', lineHeight: '1.4' }}>
                        Rotating Kerr black holes drag spacetime itself in the direction of spin (Lense-Thirring effect), powering relativistic plasma jets.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                /* SIMULATION TUNERS */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 900, color: '#00d2ff' }}>
                      SIMULATION TUNERS
                    </span>
                    <button
                      onClick={() => {
                        setCameraDistance(14.0);
                        setLensingStrength(1.0);
                        setDiskBrightness(1.2);
                        setOrbitSpeed(0.25);
                        cameraAnglesRef.current = { theta: 0.35, phi: 0.22 };
                        if (soundEnabled) soundFx.playSuccess();
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#94a3b8',
                        fontSize: '10px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <RotateCcw size={12} /> Reset
                    </button>
                  </div>

                  {/* Lensing Strength Slider */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontFamily: 'var(--font-mono)', marginBottom: '4px' }}>
                      <span style={{ color: '#cbd5e1' }}>Gravitational Lensing:</span>
                      <span style={{ color: '#00d2ff', fontWeight: 900 }}>{lensingStrength.toFixed(2)}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.2"
                      max="2.5"
                      step="0.05"
                      value={lensingStrength}
                      onChange={(e) => setLensingStrength(parseFloat(e.target.value))}
                      style={{ width: '100%', accentColor: '#00d2ff', cursor: 'pointer' }}
                    />
                  </div>

                  {/* Accretion Disk Brightness */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontFamily: 'var(--font-mono)', marginBottom: '4px' }}>
                      <span style={{ color: '#cbd5e1' }}>Accretion Disk Flux:</span>
                      <span style={{ color: '#ff9e1b', fontWeight: 900 }}>{diskBrightness.toFixed(2)}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.2"
                      max="2.5"
                      step="0.05"
                      value={diskBrightness}
                      onChange={(e) => setDiskBrightness(parseFloat(e.target.value))}
                      style={{ width: '100%', accentColor: '#ff9e1b', cursor: 'pointer' }}
                    />
                  </div>

                  {/* Observer Distance */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontFamily: 'var(--font-mono)', marginBottom: '4px' }}>
                      <span style={{ color: '#cbd5e1' }}>Observer Orbit Distance:</span>
                      <span style={{ color: '#00d2ff', fontWeight: 900 }}>{(cameraDistance / 2.2).toFixed(1)} R_s</span>
                    </div>
                    <input
                      type="range"
                      min="6.5"
                      max="30.0"
                      step="0.5"
                      value={cameraDistance}
                      onChange={(e) => setCameraDistance(parseFloat(e.target.value))}
                      style={{ width: '100%', accentColor: '#00d2ff', cursor: 'pointer' }}
                    />
                  </div>

                  {/* Kerr Spin */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontFamily: 'var(--font-mono)', marginBottom: '4px' }}>
                      <span style={{ color: '#cbd5e1' }}>Kerr Spin Parameter (a):</span>
                      <span style={{ color: '#a855f7', fontWeight: 900 }}>{spinParameter.toFixed(3)}</span>
                    </div>
                    <input
                      type="range"
                      min="0.0"
                      max="0.998"
                      step="0.005"
                      value={spinParameter}
                      onChange={(e) => setSpinParameter(parseFloat(e.target.value))}
                      style={{ width: '100%', accentColor: '#a855f7', cursor: 'pointer' }}
                    />
                  </div>

                  {/* Auto Orbit Velocity */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontFamily: 'var(--font-mono)', marginBottom: '4px' }}>
                      <span style={{ color: '#cbd5e1' }}>Auto Orbit Speed:</span>
                      <span style={{ color: '#94a3b8', fontWeight: 900 }}>{orbitSpeed.toFixed(2)} rad/s</span>
                    </div>
                    <input
                      type="range"
                      min="0.0"
                      max="1.5"
                      step="0.05"
                      value={orbitSpeed}
                      onChange={(e) => setOrbitSpeed(parseFloat(e.target.value))}
                      style={{ width: '100%', accentColor: '#00d2ff', cursor: 'pointer' }}
                    />
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── FOOTER STATUS BAR ── */}
      <footer
        style={{
          height: '36px',
          background: '#07090e',
          borderTop: '1px solid rgba(0, 210, 255, 0.25)',
          padding: '0 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '10.5px',
          fontFamily: 'var(--font-mono)',
          color: '#94a3b8',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 8px #10b981' }} />
          <span style={{ color: '#10b981', fontWeight: 800 }}>EINSTEIN RELATIVISTIC RENDERER: 60 FPS NOMINAL</span>
          <span>·</span>
          <span>KERR-SCHWARZSCHILD PHOTON DEFLECTION GEOMETRY</span>
        </div>
        <div>
          <span>NASA ADS & EVENT HORIZON TELESCOPE (EHT) CALIBRATION</span>
        </div>
      </footer>
    </div>
  );
};
