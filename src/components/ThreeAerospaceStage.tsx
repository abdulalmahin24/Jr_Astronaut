import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { getSharedGLTFLoader } from '../utils/modelLoader';
import { RefreshCw } from 'lucide-react';

interface ThreeAerospaceStageProps {
  moduleId: number;
  stepIndex: number;
  stepType: string;
}

export const ThreeAerospaceStage: React.FC<ThreeAerospaceStageProps> = ({
  moduleId,
  stepIndex,
  stepType,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // References for animation
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animatedGroupRef = useRef<THREE.Group | null>(null);
  const stageEntitiesRef = useRef<{
    rocketBooster?: THREE.Mesh;
    rocketCore?: THREE.Mesh;
    particles?: THREE.Points;
  }>({});

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 300;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x05070a);
    scene.fog = new THREE.FogExp2(0x05070a, 0.025);

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 1.2, 3.8);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    rendererRef.current = renderer;

    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);

    // Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 8.0;
    controls.minDistance = 1.0;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.0;
    controlsRef.current = controls;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 2.0);
    dirLight.position.set(5, 8, 6);
    scene.add(dirLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.2);
    rimLight.position.set(-6, -2, -5);
    scene.add(rimLight);

    // Deep Space Starfield
    const starGeo = new THREE.BufferGeometry();
    const starCount = 350;
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 18 + Math.random() * 6;
      starPos[i] = r * Math.sin(phi) * Math.cos(theta);
      starPos[i + 1] = r * Math.sin(phi) * Math.sin(theta);
      starPos[i + 2] = r * Math.cos(phi);
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({ color: 0x94a3b8, size: 0.06 });
    const starPoints = new THREE.Points(starGeo, starMat);
    scene.add(starPoints);

    // Animation Loop
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      controls.update();
      starPoints.rotation.y += 0.0004;

      // Rocket flame particle jitter for module 1
      if (stageEntitiesRef.current.particles) {
        const positions = stageEntitiesRef.current.particles.geometry.attributes.position.array as Float32Array;
        for (let i = 0; i < positions.length; i += 3) {
          positions[i + 1] -= 0.06; // Downward thrust flame
          if (positions[i + 1] < -1.8) {
            positions[i + 1] = -0.3;
            positions[i] = (Math.random() - 0.5) * 0.15;
            positions[i + 2] = (Math.random() - 0.5) * 0.15;
          }
        }
        stageEntitiesRef.current.particles.geometry.attributes.position.needsUpdate = true;
      }

      // Staging separation animation for module 1 step 3+
      if (stageEntitiesRef.current.rocketBooster) {
        if (stepIndex >= 2) {
          stageEntitiesRef.current.rocketBooster.position.y -= 0.008;
          stageEntitiesRef.current.rocketBooster.position.x += 0.004;
          stageEntitiesRef.current.rocketBooster.rotation.z += 0.003;
        } else {
          stageEntitiesRef.current.rocketBooster.position.set(0, -0.6, 0);
          stageEntitiesRef.current.rocketBooster.rotation.set(0, 0, 0);
        }
      }

      // Gentle floating oscillation for models
      if (animatedGroupRef.current) {
        animatedGroupRef.current.position.y += Math.sin(elapsedTime * 1.5) * 0.0006;
      }

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight || 300;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      starGeo.dispose();
      starMat.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Load appropriate 3D model whenever moduleId changes
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    setIsLoading(true);

    // Clean up previous stage entities
    if (animatedGroupRef.current) {
      scene.remove(animatedGroupRef.current);
      animatedGroupRef.current.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          mesh.geometry?.dispose();
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((m) => m.dispose());
          } else {
            mesh.material?.dispose();
          }
        }
      });
      animatedGroupRef.current = null;
    }
    stageEntitiesRef.current = {};

    const group = new THREE.Group();
    animatedGroupRef.current = group;
    scene.add(group);

    let isDisposed = false;

    // Module 1: High-fidelity Multi-Stage Saturn/Falcon Rocket with Particle Thrust Engine
    if (moduleId === 1) {
      const rocketGroup = new THREE.Group();

      // Rocket Upper Stage (Payload / Core)
      const coreGeo = new THREE.CylinderGeometry(0.18, 0.18, 1.1, 32);
      const coreMat = new THREE.MeshStandardMaterial({
        color: 0xf8fafc,
        metalness: 0.3,
        roughness: 0.2,
      });
      const coreMesh = new THREE.Mesh(coreGeo, coreMat);
      coreMesh.position.y = 0.45;
      rocketGroup.add(coreMesh);

      // Nose Cone
      const coneGeo = new THREE.ConeGeometry(0.18, 0.45, 32);
      const coneMat = new THREE.MeshStandardMaterial({
        color: 0xef4444,
        metalness: 0.2,
        roughness: 0.3,
      });
      const coneMesh = new THREE.Mesh(coneGeo, coneMat);
      coneMesh.position.y = 1.22;
      rocketGroup.add(coneMesh);

      // Lower Booster Stage (Separable)
      const boosterGeo = new THREE.CylinderGeometry(0.18, 0.2, 0.9, 32);
      const boosterMat = new THREE.MeshStandardMaterial({
        color: 0x94a3b8,
        metalness: 0.6,
        roughness: 0.4,
      });
      const boosterMesh = new THREE.Mesh(boosterGeo, boosterMat);
      boosterMesh.position.y = -0.55;
      rocketGroup.add(boosterMesh);
      stageEntitiesRef.current.rocketBooster = boosterMesh;

      // Fins
      for (let i = 0; i < 4; i++) {
        const finGeo = new THREE.BoxGeometry(0.04, 0.28, 0.32);
        const finMat = new THREE.MeshStandardMaterial({ color: 0x1e293b });
        const fin = new THREE.Mesh(finGeo, finMat);
        fin.position.y = -0.85;
        fin.rotation.y = (i * Math.PI) / 2;
        boosterMesh.add(fin);
      }

      // Exhaust Nozzle
      const nozzleGeo = new THREE.ConeGeometry(0.14, 0.2, 16);
      const nozzleMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8 });
      const nozzle = new THREE.Mesh(nozzleGeo, nozzleMat);
      nozzle.rotation.x = Math.PI;
      nozzle.position.y = -0.98;
      boosterMesh.add(nozzle);

      // Particle Flame Plume
      const flameCount = 120;
      const flameGeo = new THREE.BufferGeometry();
      const flamePositions = new Float32Array(flameCount * 3);
      for (let i = 0; i < flameCount * 3; i += 3) {
        flamePositions[i] = (Math.random() - 0.5) * 0.15;
        flamePositions[i + 1] = -1.0 - Math.random() * 0.9;
        flamePositions[i + 2] = (Math.random() - 0.5) * 0.15;
      }
      flameGeo.setAttribute('position', new THREE.BufferAttribute(flamePositions, 3));
      const flameMat = new THREE.PointsMaterial({
        color: 0xf59e0b,
        size: 0.09,
        transparent: true,
        opacity: 0.9,
      });
      const flamePoints = new THREE.Points(flameGeo, flameMat);
      rocketGroup.add(flamePoints);
      stageEntitiesRef.current.particles = flamePoints;

      // Earth Curved Horizon at bottom
      const earthGeo = new THREE.SphereGeometry(4.5, 32, 16);
      const earthMat = new THREE.MeshStandardMaterial({
        color: 0x0284c7,
        roughness: 0.7,
        metalness: 0.1,
      });
      const earth = new THREE.Mesh(earthGeo, earthMat);
      earth.position.set(0, -5.6, -1.0);
      rocketGroup.add(earth);

      rocketGroup.position.set(0, 0, 0);
      group.add(rocketGroup);
      setIsLoading(false);
      return;
    }

    // Determine 3D model asset path based on Module
    let modelPath = '/models/Apollo_Lunar_Module.glb';
    let targetSize = 2.0;

    if (moduleId === 2) {
      modelPath = '/models/Agena_Target.glb';
      targetSize = 2.1;
    } else if (moduleId === 3) {
      modelPath = '/models/Apollo_Lunar_Module.glb';
      targetSize = 1.9;
    } else if (moduleId === 4) {
      modelPath = '/models/Mars_Perseverance_Rover.glb';
      targetSize = 2.2;
    } else if (moduleId === 5) {
      modelPath = '/models/EMU_Suit_Clean.glb';
      targetSize = 2.0;
    } else if (moduleId === 6) {
      modelPath = '/models/Dish_70m.glb';
      targetSize = 2.1;
    } else if (moduleId === 7) {
      modelPath = '/models/Habitat_Unit.glb';
      targetSize = 2.2;
    } else if (moduleId === 8) {
      modelPath = '/models/Satellite.glb';
      targetSize = 2.0;
    }

    const loader = getSharedGLTFLoader();
    loader.load(
      modelPath,
      (gltf) => {
        if (isDisposed) return;
        const root = gltf.scene;

        // Auto-center and normalize size
        const box = new THREE.Box3().setFromObject(root);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z) || 1;
        const scale = targetSize / maxDim;

        root.position.sub(center.multiplyScalar(scale));
        root.scale.setScalar(scale);

        // Ground / environment details
        if (moduleId === 3) {
          // Lunar crater surface
          const moonGeo = new THREE.CylinderGeometry(2.4, 2.5, 0.2, 32);
          const moonMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.9 });
          const moonSurface = new THREE.Mesh(moonGeo, moonMat);
          moonSurface.position.y = -1.05;
          group.add(moonSurface);
        } else if (moduleId === 4) {
          // Red Mars terrain
          const marsGeo = new THREE.CylinderGeometry(2.4, 2.5, 0.2, 32);
          const marsMat = new THREE.MeshStandardMaterial({ color: 0x9a3412, roughness: 0.85 });
          const marsSurface = new THREE.Mesh(marsGeo, marsMat);
          marsSurface.position.y = -1.05;
          group.add(marsSurface);
        } else if (moduleId === 7) {
          // Lunar South Pole Shackleton Rim with Frost/Ice patches
          const moonGeo = new THREE.CylinderGeometry(2.6, 2.8, 0.25, 32);
          const moonMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.95 });
          const moonSurface = new THREE.Mesh(moonGeo, moonMat);
          moonSurface.position.y = -1.1;
          group.add(moonSurface);

          // Cryogenic ice glitter patches
          const iceGeo = new THREE.CircleGeometry(0.8, 16);
          const iceMat = new THREE.MeshStandardMaterial({
            color: 0x38bdf8,
            roughness: 0.1,
            metalness: 0.8,
            side: THREE.DoubleSide
          });
          const icePatch = new THREE.Mesh(iceGeo, iceMat);
          icePatch.rotation.x = -Math.PI / 2;
          icePatch.position.set(0.4, -0.96, 0.3);
          group.add(icePatch);
        } else if (moduleId === 8) {
          // Golden hexagonal primary mirror ring backdrop for JWST L2 observatory
          const ringGeo = new THREE.RingGeometry(1.3, 1.45, 6);
          const ringMat = new THREE.MeshStandardMaterial({
            color: 0xf59e0b,
            metalness: 0.95,
            roughness: 0.1,
            side: THREE.DoubleSide
          });
          const hexRing = new THREE.Mesh(ringGeo, ringMat);
          hexRing.position.z = -0.8;
          group.add(hexRing);
        } else if (moduleId === 2) {
          // Docking Target Reticle Rings
          const ringGeo = new THREE.RingGeometry(1.2, 1.25, 32);
          const ringMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide });
          const reticle = new THREE.Mesh(ringGeo, ringMat);
          reticle.position.z = -1.2;
          group.add(reticle);
        }

        group.add(root);
        setIsLoading(false);
      },
      undefined,
      (err) => {
        if (isDisposed) return;
        console.warn('ThreeAerospaceStage fallback model load error:', err);
        setIsLoading(false);
      }
    );

    return () => {
      isDisposed = true;
    };
  }, [moduleId, stepIndex]);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '300px',
        overflow: 'hidden',
        background: '#05070a',
      }}
    >
      <div ref={mountRef} style={{ width: '100%', height: '100%' }} />

      {/* Loading Overlay */}
      {isLoading && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(5, 7, 10, 0.8)',
            gap: '8px',
            color: '#f59e0b',
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
          }}
        >
          <RefreshCw size={18} className="animate-spin" />
          <span>INITIALIZING 3D AEROSPACE STAGE...</span>
        </div>
      )}

      {/* Orbit Hint */}
      <div
        style={{
          position: 'absolute',
          bottom: '8px',
          right: '10px',
          fontSize: '9.5px',
          fontFamily: 'var(--font-mono)',
          color: '#64748b',
          background: 'rgba(7, 9, 12, 0.7)',
          padding: '3px 6px',
          pointerEvents: 'none',
        }}
      >
        🛰️ 3D INTERACTIVE · DRAG TO ROTATE
      </div>
    </div>
  );
};
