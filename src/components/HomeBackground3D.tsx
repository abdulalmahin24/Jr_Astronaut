import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { HomeBackground } from './HomeBackground';

export interface HomeBackground3DProps {
  activeHover?: 'MOON' | 'MARS' | null;
}

export const HomeBackground3D: React.FC<HomeBackground3DProps> = ({ activeHover = null }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [is3DReady, setIs3DReady] = useState(false);
  const [hasWebGLFallback, setHasWebGLFallback] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Detect WebGL Support
    try {
      const testCanvas = document.createElement('canvas');
      const gl = testCanvas.getContext('webgl2') || testCanvas.getContext('webgl');
      if (!gl) {
        console.warn('[HomeBackground3D] WebGL not supported, falling back to photo poster.');
        setHasWebGLFallback(true);
        return;
      }
    } catch {
      setHasWebGLFallback(true);
      return;
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let width = container.clientWidth || window.innerWidth;
    let height = container.clientHeight || window.innerHeight;

    // 2. Three.js Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const fogColor = new THREE.Color(0x070e24);
    scene.fog = new THREE.FogExp2(fogColor, 0.012);

    const camera = new THREE.PerspectiveCamera(46, width / height, 0.5, 600);
    const defaultCamPos = new THREE.Vector3(0, 11, 38);
    const defaultLookAt = new THREE.Vector3(0, 3.5, 0);
    camera.position.copy(defaultCamPos);
    camera.lookAt(defaultLookAt);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: 'high-performance',
        alpha: true,
      });
      // Cap DPR at 1.5 for performance
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.setSize(width, height);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.1;
      container.appendChild(renderer.domElement);
    } catch (e) {
      console.warn('[HomeBackground3D] Renderer initialization failed:', e);
      setHasWebGLFallback(true);
      return;
    }

    // 3. Lighting (Sunlight + Ambient + Ground bounce)
    const ambientLight = new THREE.AmbientLight(0x2a3858, 0.85);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffedd5, 2.2);
    sunLight.position.set(38, 45, 28);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 130;
    sunLight.shadow.camera.left = -40;
    sunLight.shadow.camera.right = 40;
    sunLight.shadow.camera.top = 35;
    sunLight.shadow.camera.bottom = -30;
    sunLight.shadow.bias = -0.001;
    scene.add(sunLight);

    // Subtle blue Earth reflection light
    const earthLight = new THREE.PointLight(0x38bdf8, 1.2, 80);
    earthLight.position.set(-28, 22, -10);
    scene.add(earthLight);

    // 4. Starfield & Milky Way
    const starsCount = 1100;
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starsCount * 3);
    const starColors = new Float32Array(starsCount * 3);

    const cWhite = new THREE.Color(0xf8fafc);
    const cBlue = new THREE.Color(0x93c5fd);
    const cAmber = new THREE.Color(0xfde68a);

    for (let i = 0; i < starsCount; i++) {
      const idx = i * 3;
      // Sky dome distribution
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 0.9 + 0.08); // upper hemisphere
      const dist = Math.random() * 220 + 200;

      starPositions[idx] = dist * Math.sin(phi) * Math.cos(theta);
      starPositions[idx + 1] = dist * Math.cos(phi) + 10;
      starPositions[idx + 2] = dist * Math.sin(phi) * Math.sin(theta);

      const color = Math.random() < 0.25 ? cBlue : Math.random() < 0.2 ? cAmber : cWhite;
      starColors[idx] = color.r;
      starColors[idx + 1] = color.g;
      starColors[idx + 2] = color.b;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

    const starMat = new THREE.PointsMaterial({
      size: 1.8,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      fog: false,
    });
    const starPoints = new THREE.Points(starGeo, starMat);
    scene.add(starPoints);

    // 5. 3D Earth Sphere in Upper-Left Sky
    const earthGroup = new THREE.Group();
    earthGroup.position.set(-26, 22, -45);
    scene.add(earthGroup);

    const textureLoader = new THREE.TextureLoader();

    // Earth Body (Daymap)
    const earthRadius = 4.6;
    const earthGeo = new THREE.SphereGeometry(earthRadius, 40, 40);
    const earthMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.7,
      metalness: 0.1,
    });
    textureLoader.load(
      '/assets/planets/2k_earth_daymap.jpg',
      (tex) => {
        earthMat.map = tex;
        earthMat.needsUpdate = true;
      },
      undefined,
      () => {
        // Procedural fallback color if texture is missing
        earthMat.color.setHex(0x0284c7);
      }
    );
    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    earthGroup.add(earthMesh);

    // Earth Clouds Sphere
    const cloudsGeo = new THREE.SphereGeometry(earthRadius * 1.015, 36, 36);
    const cloudsMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.45,
      blending: THREE.NormalBlending,
    });
    textureLoader.load(
      '/assets/planets/2k_earth_clouds.jpg',
      (cloudTex) => {
        cloudsMat.map = cloudTex;
        cloudsMat.alphaMap = cloudTex;
        cloudsMat.needsUpdate = true;
      },
      undefined,
      () => {
        cloudsMat.opacity = 0;
      }
    );
    const cloudsMesh = new THREE.Mesh(cloudsGeo, cloudsMat);
    earthGroup.add(cloudsMesh);

    // Atmosphere Rim Glow Shell
    const atmoGeo = new THREE.SphereGeometry(earthRadius * 1.08, 32, 32);
    const atmoMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.22,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      fog: false,
    });
    const atmoMesh = new THREE.Mesh(atmoGeo, atmoMat);
    earthGroup.add(atmoMesh);

    // 6. 3D Terrain Mesh (Displacement & Vertex Colors: Moon Left, Mars Right)
    const terrainWidth = 130;
    const terrainDepth = 70;
    const segX = 128;
    const segZ = 64;
    const terrainGeo = new THREE.PlaneGeometry(terrainWidth, terrainDepth, segX, segZ);
    terrainGeo.rotateX(-Math.PI / 2);

    const posAttr = terrainGeo.attributes.position;
    const colors = new Float32Array(posAttr.count * 3);

    // Moon and Mars Palette
    const cMoonBase = new THREE.Color(0x646974); // Lunar regolith grey
    const cMoonDark = new THREE.Color(0x353840); // Lunar crater shadow
    const cMarsBase = new THREE.Color(0xbf4d24); // Mars iron-oxide rust
    const cMarsRock = new THREE.Color(0x6c2512); // Mars dark volcanic rock

    // Craters on Moon side (x < 0)
    const craters = [
      { x: -28, z: 2, r: 9, d: 3.2 },
      { x: -16, z: -10, r: 6.5, d: 2.2 },
      { x: -38, z: -14, r: 12, d: 4.0 },
      { x: -8, z: 12, r: 5, d: 1.8 },
      { x: -22, z: 16, r: 7.5, d: 2.6 },
    ];

    for (let i = 0; i < posAttr.count; i++) {
      const vx = posAttr.getX(i);
      const vz = posAttr.getZ(i);

      // Base undulating landscape
      let vy = Math.sin(vx * 0.08) * 1.5 + Math.cos(vz * 0.12) * 1.2;

      // Distance from center blend line (-12 to +12)
      const tBlend = THREE.MathUtils.smoothstep(vx, -12, 12);

      let isCraterDepression = 0;
      if (vx < 4) {
        // Apply Moon crater depressions
        for (const c of craters) {
          const dist = Math.hypot(vx - c.x, vz - c.z);
          if (dist < c.r * 1.4) {
            const relDist = dist / c.r;
            if (relDist < 1.0) {
              // Basin drop
              const drop = -Math.cos((relDist * Math.PI) / 2) * c.d;
              vy += drop;
              isCraterDepression = Math.max(isCraterDepression, 1.0 - relDist);
            } else {
              // Raised crater rim
              const rim = Math.sin(((relDist - 1.0) / 0.4) * Math.PI) * (c.d * 0.35);
              vy += rim;
            }
          }
        }
      }

      if (vx > -4) {
        // Mars wind dunes & rocky ripple ridges
        vy += Math.sin(vx * 0.6 + vz * 0.4) * 0.6 * tBlend;
        vy += Math.cos(vx * 0.2 - vz * 0.3) * 0.9 * tBlend;
      }

      // Edge fade
      const edgeFactor = Math.cos((vz / (terrainDepth * 0.5)) * (Math.PI / 2.5));
      vy *= Math.max(0.2, edgeFactor);

      posAttr.setY(i, vy);

      // Vertex Coloring
      const moonCol = cMoonBase.clone().lerp(cMoonDark, Math.min(isCraterDepression * 0.8, 1));
      const marsCol = cMarsBase.clone().lerp(cMarsRock, (Math.sin(vx * 0.5) + 1) * 0.25);
      const vertexColor = moonCol.lerp(marsCol, tBlend);

      colors[i * 3] = vertexColor.r;
      colors[i * 3 + 1] = vertexColor.g;
      colors[i * 3 + 2] = vertexColor.b;
    }

    terrainGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    terrainGeo.computeVertexNormals();

    const terrainMat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.88,
      metalness: 0.08,
    });
    const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
    terrainMesh.receiveShadow = true;
    terrainMesh.position.set(0, -2.5, 0);
    scene.add(terrainMesh);

    // 7. Moon Side Habitat Group (x ≈ -18)
    const moonBaseGroup = new THREE.Group();
    moonBaseGroup.position.set(-18, 0.5, 0);
    scene.add(moonBaseGroup);

    // Dome Habitat
    const moonDomeGeo = new THREE.SphereGeometry(3.6, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const habMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.4,
      metalness: 0.6,
    });
    const moonDome = new THREE.Mesh(moonDomeGeo, habMat);
    moonDome.castShadow = true;
    moonDome.receiveShadow = true;
    moonBaseGroup.add(moonDome);

    // Warm Window Lights (Emissive Mesh)
    const windowGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.2, 12);
    const windowMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      emissive: 0xf59e0b,
      emissiveIntensity: 1.2,
      roughness: 0.2,
    });
    const windowMesh = new THREE.Mesh(windowGeo, windowMat);
    windowMesh.rotation.x = Math.PI / 2;
    windowMesh.position.set(0, 1.8, 3.4);
    moonBaseGroup.add(windowMesh);

    // Regolith Wall Radiation Shield Berm (Surrounding habitat)
    const bermGeo = new THREE.TorusGeometry(5.2, 0.9, 12, 28, Math.PI * 1.3);
    const bermMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.95,
      metalness: 0.05,
    });
    const bermMesh = new THREE.Mesh(bermGeo, bermMat);
    bermMesh.rotation.x = -Math.PI / 2;
    bermMesh.rotation.z = 0.4;
    bermMesh.position.set(0, 0.4, 0);
    bermMesh.castShadow = true;
    bermMesh.receiveShadow = true;
    moonBaseGroup.add(bermMesh);

    // 2 Solar Panel Arrays (Moon Side)
    const solarMat = new THREE.MeshStandardMaterial({
      color: 0x0369a1,
      roughness: 0.15,
      metalness: 0.85,
    });

    const createSolarArray = (x: number, z: number, rotY: number) => {
      const g = new THREE.Group();
      g.position.set(x, 0, z);
      g.rotation.y = rotY;

      // Pylon
      const pylonGeo = new THREE.CylinderGeometry(0.12, 0.15, 2.2, 8);
      const pylonMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.7 });
      const pylon = new THREE.Mesh(pylonGeo, pylonMat);
      pylon.position.y = 1.1;
      pylon.castShadow = true;
      g.add(pylon);

      // Panel wing
      const panelGeo = new THREE.BoxGeometry(4.5, 0.15, 2.2);
      const panel = new THREE.Mesh(panelGeo, solarMat);
      panel.position.set(0, 2.2, 0);
      panel.rotation.x = -0.35;
      panel.castShadow = true;
      g.add(panel);

      return g;
    };

    const moonSolar1 = createSolarArray(-7.5, -2, -0.2);
    const moonSolar2 = createSolarArray(7.5, 2, 0.3);
    moonBaseGroup.add(moonSolar1);
    moonBaseGroup.add(moonSolar2);

    // 8. Mars Side Habitat Group (x ≈ +18)
    const marsBaseGroup = new THREE.Group();
    marsBaseGroup.position.set(18, 0.2, 0);
    scene.add(marsBaseGroup);

    // Mars Dome
    const marsDome = new THREE.Mesh(moonDomeGeo, habMat);
    marsDome.castShadow = true;
    marsDome.receiveShadow = true;
    marsBaseGroup.add(marsDome);

    // Mars Hab Window
    const marsWindow = new THREE.Mesh(windowGeo, windowMat);
    marsWindow.rotation.x = Math.PI / 2;
    marsWindow.position.set(0, 1.8, 3.4);
    marsBaseGroup.add(marsWindow);

    // Greenhouse Module with Green Inner Glow
    const ghGeo = new THREE.CylinderGeometry(1.6, 1.6, 3.8, 16);
    const ghMat = new THREE.MeshStandardMaterial({
      color: 0x86efac,
      emissive: 0x22c55e,
      emissiveIntensity: 1.4,
      transparent: true,
      opacity: 0.85,
      roughness: 0.3,
    });
    const ghMesh = new THREE.Mesh(ghGeo, ghMat);
    ghMesh.rotation.z = Math.PI / 2;
    ghMesh.position.set(5.2, 1.4, 1);
    ghMesh.castShadow = true;
    marsBaseGroup.add(ghMesh);

    // Communication Antenna Mast with Blinking Red Light
    const antennaGroup = new THREE.Group();
    antennaGroup.position.set(-4.5, 0, -2);
    const antPoleGeo = new THREE.CylinderGeometry(0.08, 0.12, 6.5, 8);
    const antPole = new THREE.Mesh(antPoleGeo, habMat);
    antPole.position.y = 3.25;
    antPole.castShadow = true;
    antennaGroup.add(antPole);

    const antDishGeo = new THREE.SphereGeometry(1.0, 16, 8, 0, Math.PI * 2, 0, Math.PI * 0.4);
    const antDish = new THREE.Mesh(antDishGeo, habMat);
    antDish.rotation.x = Math.PI * 0.7;
    antDish.position.set(0.3, 4.8, 0);
    antennaGroup.add(antDish);

    // Blinking Red LED Beacon
    const beaconGeo = new THREE.SphereGeometry(0.3, 12, 12);
    const beaconMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const beaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
    beaconMesh.position.set(0, 6.6, 0);
    antennaGroup.add(beaconMesh);
    marsBaseGroup.add(antennaGroup);

    // Mars Solar Arrays
    const marsSolar1 = createSolarArray(-7.5, 3, -0.4);
    const marsSolar2 = createSolarArray(8.5, -3, 0.25);
    marsBaseGroup.add(marsSolar1);
    marsBaseGroup.add(marsSolar2);

    // 9. Surface Rover (Driving along a curved path)
    const roverGroup = new THREE.Group();
    scene.add(roverGroup);

    const roverBodyGeo = new THREE.BoxGeometry(1.6, 0.7, 2.2);
    const roverBodyMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5, metalness: 0.7 });
    const roverBody = new THREE.Mesh(roverBodyGeo, roverBodyMat);
    roverBody.position.y = 0.65;
    roverBody.castShadow = true;
    roverGroup.add(roverBody);

    // Rover Solar Roof
    const roverSolarGeo = new THREE.BoxGeometry(1.4, 0.08, 1.8);
    const roverSolar = new THREE.Mesh(roverSolarGeo, solarMat);
    roverSolar.position.set(0, 1.05, 0);
    roverGroup.add(roverSolar);

    // Rover Mast & Camera Head
    const rMastGeo = new THREE.CylinderGeometry(0.05, 0.05, 1.1, 8);
    const rMast = new THREE.Mesh(rMastGeo, habMat);
    rMast.position.set(0.4, 1.5, 0.6);
    roverGroup.add(rMast);

    const rHeadGeo = new THREE.BoxGeometry(0.35, 0.22, 0.45);
    const rHead = new THREE.Mesh(rHeadGeo, windowMat);
    rHead.position.set(0.4, 2.05, 0.6);
    roverGroup.add(rHead);

    // 6 Wheels
    const wheelGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.24, 12);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.9 });
    const wheelPositions = [
      [-0.95, 0.32, -0.75],
      [-0.95, 0.32, 0],
      [-0.95, 0.32, 0.75],
      [0.95, 0.32, -0.75],
      [0.95, 0.32, 0],
      [0.95, 0.32, 0.75],
    ];
    for (const [wx, wy, wz] of wheelPositions) {
      const w = new THREE.Mesh(wheelGeo, wheelMat);
      w.rotation.z = Math.PI / 2;
      w.position.set(wx, wy, wz);
      w.castShadow = true;
      roverGroup.add(w);
    }

    // 10. Atmospheric Dust Particles (denser on Mars side)
    const dustCount = 260;
    const dustGeo = new THREE.BufferGeometry();
    const dustPos = new Float32Array(dustCount * 3);
    const dustCols = new Float32Array(dustCount * 3);
    const dustVelocities: { x: number; y: number; z: number }[] = [];

    const cDustMars = new THREE.Color(0xfb923c);
    const cDustMoon = new THREE.Color(0x94a3b8);

    for (let i = 0; i < dustCount; i++) {
      const isM = Math.random() < 0.68;
      const dx = isM ? Math.random() * 50 - 2 : Math.random() * -50 + 2;
      const dy = Math.random() * 8 + 0.5;
      const dz = Math.random() * 50 - 20;

      dustPos[i * 3] = dx;
      dustPos[i * 3 + 1] = dy;
      dustPos[i * 3 + 2] = dz;

      const col = isM ? cDustMars : cDustMoon;
      dustCols[i * 3] = col.r;
      dustCols[i * 3 + 1] = col.g;
      dustCols[i * 3 + 2] = col.b;

      dustVelocities.push({
        x: (Math.random() - 0.4) * 0.04,
        y: (Math.random() - 0.5) * 0.015,
        z: (Math.random() - 0.4) * 0.03,
      });
    }

    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
    dustGeo.setAttribute('color', new THREE.BufferAttribute(dustCols, 3));

    const dustMat = new THREE.PointsMaterial({
      size: 1.4,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      fog: true,
    });
    const dustParticles = new THREE.Points(dustGeo, dustMat);
    scene.add(dustParticles);

    // 11. Mouse Parallax & Dynamic Hover Camera Targets
    let targetCamPos = defaultCamPos.clone();
    let targetLookAt = defaultLookAt.clone();
    const currentLookAt = defaultLookAt.clone();

    let mouseNormX = 0;
    let mouseNormY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      if (prefersReducedMotion) return;
      mouseNormX = (e.clientX / width - 0.5) * 2;
      mouseNormY = (e.clientY / height - 0.5) * 2;
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    const handleResize = () => {
      if (!container) return;
      width = container.clientWidth || window.innerWidth;
      height = container.clientHeight || window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);

    let isVisible = true;
    let animId: number;
    let lastTime = performance.now();

    // FPS measurement for automatic quality fallback
    let frameCount = 0;
    let fpsTimer = performance.now();
    let lowFpsSeconds = 0;

    const handleVisibilityChange = () => {
      isVisible = !document.hidden;
      if (isVisible && !prefersReducedMotion) {
        lastTime = performance.now();
        animId = requestAnimationFrame(animate);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 12. Main 60 FPS Render Loop
    const animate = (time: number) => {
      if (!isVisible) return;

      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      // FPS Quality Guard
      frameCount++;
      if (time - fpsTimer > 1000) {
        const measuredFps = (frameCount * 1000) / (time - fpsTimer);
        frameCount = 0;
        fpsTimer = time;
        if (measuredFps < 30) {
          lowFpsSeconds++;
          if (lowFpsSeconds >= 3) {
            console.warn('[HomeBackground3D] Sustained low FPS detected (<30fps), reducing quality.');
            sunLight.castShadow = false;
            renderer.shadowMap.enabled = false;
            dustMat.size = 1.0;
          }
          if (lowFpsSeconds >= 6) {
            console.warn('[HomeBackground3D] Switching to photo poster fallback for smooth experience.');
            setHasWebGLFallback(true);
            return;
          }
        } else {
          lowFpsSeconds = Math.max(0, lowFpsSeconds - 1);
        }
      }

      const elapsed = time * 0.001;

      // ── A. 60-Second Day/Night Cycle ──
      const cycleTime = (elapsed % 60) / 60; // 0 to 1
      const sunAngle = cycleTime * Math.PI * 2;
      const sunHeight = Math.sin(sunAngle); // -1 (midnight) to +1 (noon)

      // Orbit Sun
      sunLight.position.x = Math.cos(sunAngle) * 45;
      sunLight.position.y = Math.max(-10, sunHeight * 45);
      sunLight.position.z = Math.sin(sunAngle * 0.5) * 25 + 15;

      const isNight = sunHeight < 0.05;
      const dayFactor = Math.max(0.08, (sunHeight + 1) / 2);

      // Night vs Day Trade-off: Lights & Solar Reflection
      sunLight.intensity = Math.max(0, sunHeight * 2.5);
      ambientLight.intensity = 0.4 + dayFactor * 0.55;

      // Nighttime: Solar panels go dark, habitat window lights & battery glow brighter!
      if (isNight) {
        solarMat.metalness = 0.3;
        solarMat.roughness = 0.9;
        solarMat.color.setHex(0x0a1628);
        windowMat.emissiveIntensity = 2.4;
        ghMat.emissiveIntensity = 2.2;
        starMat.opacity = 0.95;
      } else {
        solarMat.metalness = 0.85;
        solarMat.roughness = 0.15;
        solarMat.color.setHex(0x0284c7);
        windowMat.emissiveIntensity = 0.9;
        ghMat.emissiveIntensity = 1.3;
        starMat.opacity = Math.max(0.4, 0.9 - dayFactor * 0.4);
      }

      // ── B. Mars Dust-Storm Pulse (Every ~40s for ~8s) ──
      const stormCycle = elapsed % 40;
      const isStorm = stormCycle < 8;
      if (isStorm) {
        const stormT = Math.sin((stormCycle / 8) * Math.PI); // 0 -> 1 -> 0
        if (scene.fog) {
          scene.fog.color.lerpColors(fogColor, new THREE.Color(0x5a2312), stormT * 0.65);
        }
        sunLight.intensity *= 1 - stormT * 0.6; // Dims sun by up to 60%
        solarMat.color.lerp(new THREE.Color(0x451a0d), stormT * 0.5);
      } else {
        if (scene.fog) {
          scene.fog.color.copy(fogColor);
        }
      }

      // ── C. Blinking Red Beacon Light on Mars Antenna (1.0s cycle) ──
      const isBeaconOn = (elapsed % 1.0) < 0.55;
      beaconMat.color.setHex(isBeaconOn ? 0xef4444 : 0x450a0a);

      // ── D. Earth Sphere & Clouds Rotation ──
      earthGroup.rotation.y = elapsed * 0.04;
      cloudsMesh.rotation.y = elapsed * 0.055;

      // ── E. Animated Rover Driving along Curved Path ──
      const roverAngle = elapsed * 0.15;
      const rPathX = Math.sin(roverAngle) * 8 + 14;
      const rPathZ = Math.cos(roverAngle * 0.8) * 5 + 6;
      roverGroup.position.set(rPathX, 0.2, rPathZ);
      roverGroup.rotation.y = Math.cos(roverAngle) * 0.6 + Math.PI;

      // ── F. Atmospheric Dust Drift ──
      const dustPositionsAttr = dustGeo.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < dustCount; i++) {
        let dx = dustPositionsAttr.getX(i);
        let dy = dustPositionsAttr.getY(i);
        let dz = dustPositionsAttr.getZ(i);

        const vel = dustVelocities[i];
        dx += vel.x * (isStorm ? 2.2 : 1.0);
        dy += vel.y;
        dz += vel.z;

        if (dx > 65) dx = -65;
        if (dx < -65) dx = 65;
        if (dy > 12) dy = 0.5;
        if (dy < 0.2) dy = 10;

        dustPositionsAttr.setXYZ(i, dx, dy, dz);
      }
      dustPositionsAttr.needsUpdate = true;

      // ── G. Camera Orbit, Dolly & Chip Hover Framing ──
      if (activeHover === 'MOON') {
        // Dolly/pan smoothly toward Moon habitat
        targetCamPos.set(-17, 8, 22);
        targetLookAt.set(-17, 2.5, 0);
      } else if (activeHover === 'MARS') {
        // Dolly/pan smoothly toward Mars habitat
        targetCamPos.set(17, 8, 22);
        targetLookAt.set(17, 2.5, 0);
      } else {
        // Gentle cinematic ambient dolly
        const cinX = Math.sin(elapsed * 0.08) * 2.2;
        const cinY = Math.cos(elapsed * 0.06) * 0.8;
        targetCamPos.set(defaultCamPos.x + cinX, defaultCamPos.y + cinY, defaultCamPos.z);
        targetLookAt.copy(defaultLookAt);
      }

      // Mouse Parallax Offset (Max ~12px equivalent camera shift)
      const parallaxShiftX = mouseNormX * 2.0;
      const parallaxShiftY = -mouseNormY * 1.2;

      camera.position.x += (targetCamPos.x + parallaxShiftX - camera.position.x) * 0.045;
      camera.position.y += (targetCamPos.y + parallaxShiftY - camera.position.y) * 0.045;
      camera.position.z += (targetCamPos.z - camera.position.z) * 0.045;

      currentLookAt.lerp(targetLookAt, 0.05);
      camera.lookAt(currentLookAt);

      renderer.render(scene, camera);

      if (!prefersReducedMotion) {
        animId = requestAnimationFrame(animate);
      }
    };

    // First frame render & mark 3D as ready for smooth cross-fade
    renderer.render(scene, camera);
    setIs3DReady(true);

    if (!prefersReducedMotion) {
      animId = requestAnimationFrame(animate);
    }

    // 13. Resource Cleanup on Unmount
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);

      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry?.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose());
          } else if (obj.material) {
            obj.material.dispose();
          }
        }
      });
      renderer.dispose();
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [activeHover]);

  return (
    <div
      data-testid="space-background-canvas"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >
      {/* ── 1. POSTER / FALLBACK LAYER (Photos + Procedural Backdrop) ── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: hasWebGLFallback ? 1 : is3DReady ? 0 : 1,
          transition: 'opacity 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
          zIndex: 1,
          pointerEvents: 'none',
        }}
      >
        <HomeBackground activeHover={activeHover} />
      </div>

      {/* ── 2. REAL-TIME 3D THREE.JS WEBGL CANVAS CONTAINER ── */}
      {!hasWebGLFallback && (
        <div
          ref={containerRef}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            opacity: is3DReady ? 1 : 0,
            transition: 'opacity 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
            zIndex: 2,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* ── 3. READABILITY: Radial Dark Vignette Behind Central Text Area (~0.55 opacity) ── */}
      <div
        style={{
          position: 'absolute',
          top: '40%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'min(92vw, 840px)',
          height: 'min(70vh, 520px)',
          borderRadius: '50%',
          background:
            'radial-gradient(ellipse at center, rgba(2, 6, 23, 0.58) 0%, rgba(2, 6, 23, 0.42) 55%, rgba(2, 6, 23, 0) 80%)',
          pointerEvents: 'none',
          zIndex: 3,
        }}
      />
    </div>
  );
};

export default HomeBackground3D;
