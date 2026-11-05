import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { getSharedGLTFLoader } from '../utils/modelLoader';
import { soundFx } from '../utils/audioEffects';

interface LobbyAstronaut3DProps {
  characterId?: string;
  astronautName?: string;
  isInspectionMode?: boolean;
  onInteract?: () => void;
}

export type SuitModelType = 'LM' | 'ROVER' | 'SATELLITE' | 'EMU';

interface SuitConfig {
  label: string;
  file: string;
  scaleAdj: number;
  yOffset: number;
  rotY: number;
  name: string;
  badge: string;
  telemetry: string;
}

const SUIT_CONFIGS: Record<SuitModelType, SuitConfig> = {
  LM: {
    label: 'LUNAR MODULE',
    file: '/models/Apollo_Lunar_Module.glb',
    scaleAdj: 0.78,
    yOffset: 0.04,
    rotY: 0,
    name: 'Apollo 11 Lunar Module "Eagle" (Descent & Ascent Stages)',
    badge: 'LM-5 EAGLE',
    telemetry: 'APOLLO LM EAGLE · DESCENT STAGE 100% FUEL · TRANQUILITY BASE READY',
  },
  ROVER: {
    label: 'MARS ROVER',
    file: '/models/Mars_Perseverance_Rover.glb',
    scaleAdj: 0.80,
    yOffset: 0.04,
    rotY: -Math.PI / 4,
    name: 'Mars Perseverance Rover (JPL Surface Astrobiology Lab)',
    badge: 'MARS 2020',
    telemetry: 'MARS 2020 PERSEVERANCE · MOXIE & SHERLOC ACTIVE · 6WD ROCKER-BOGIE',
  },
  SATELLITE: {
    label: 'SATELLITE',
    file: '/models/Satellite.glb',
    scaleAdj: 0.82,
    yOffset: 0.20,
    rotY: Math.PI / 6,
    name: 'Deep Space Relay Satellite (Gateway Orbiter Link)',
    badge: 'GATEWAY RELAY',
    telemetry: 'X-BAND HIGH-GAIN TELEMETRY · GAAS SOLAR ARRAYS · 100% DSN LINK',
  },
  EMU: {
    label: 'ARTEMIS SUIT',
    file: '/models/EMU_Suit_Clean.glb',
    scaleAdj: 0.85,
    yOffset: 0.04,
    rotY: Math.PI,
    name: 'NASA Extravehicular Mobility Unit (Artemis EVA Suit)',
    badge: 'EVA MK-IV',
    telemetry: 'NASA xEMU SUIT MK-IV · 100% O₂ NOMINAL · ARTEMIS EVA CERTIFIED',
  },
};

export const LobbyAstronaut3D: React.FC<LobbyAstronaut3DProps> = ({
  characterId,
  astronautName = 'Neil Armstrong',
  isInspectionMode = false,
  onInteract,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [activeSuit, setActiveSuit] = useState<SuitModelType>('LM');
  const [isLoadingModel, setIsLoadingModel] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const isInspectionModeRef = useRef(isInspectionMode);

  useEffect(() => {
    isInspectionModeRef.current = isInspectionMode;
  }, [isInspectionMode]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let isDisposed = false;
    const width = container.clientWidth || 640;
    const height = container.clientHeight || 750;

    // 1. Scene
    const scene = new THREE.Scene();

    // 2. Camera: Telephoto 34° FOV for true aerospace architectural scale
    const camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 50);
    let zoomDistance = 4.45;
    camera.position.set(0, 1.05, zoomDistance);
    const currentLookAt = new THREE.Vector3(0, 0.72, 0);
    camera.lookAt(currentLookAt);

    // 3. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // 4. Photorealistic Studio Environment Map via PMREM
    const pmrem = new THREE.PMREMGenerator(renderer);
    pmrem.compileEquirectangularShader();
    const roomEnv = new RoomEnvironment();
    const envMap = pmrem.fromScene(roomEnv).texture;
    scene.environment = envMap;

    // 5. Aerospace Studio Key, Fill, Rim & Floor Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
    scene.add(ambientLight);

    // Key Light (Warm Solar Radiance)
    const keyLight = new THREE.DirectionalLight(0xfff7ee, 1.9);
    keyLight.position.set(3.5, 4.5, 4.0);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    scene.add(keyLight);

    // Rim Light (Artemis Lunar Cyan Glow)
    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.5);
    rimLight.position.set(-3.5, 2.5, -2.5);
    scene.add(rimLight);

    // Front Soft Fill Light
    const frontFill = new THREE.DirectionalLight(0xe0f2fe, 0.8);
    frontFill.position.set(0, 1.5, 3.5);
    scene.add(frontFill);

    // Pedestal Upward Cyan Glow
    const pedestalLight = new THREE.PointLight(0x00d2ff, 1.3, 6);
    pedestalLight.position.set(0, 0.3, 0.4);
    scene.add(pedestalLight);

    // 6. Expanded Holographic Pedestal: Broad footprint accommodating spacecraft landing gear
    const pedestalGroup = new THREE.Group();
    pedestalGroup.position.set(0, 0.02, 0);

    // Outer cyan ring (diameter ~2.6m)
    const ringGeo1 = new THREE.RingGeometry(1.26, 1.32, 64);
    const ringMat1 = new THREE.MeshBasicMaterial({
      color: 0x00d2ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    });
    const ring1 = new THREE.Mesh(ringGeo1, ringMat1);
    ring1.rotation.x = -Math.PI / 2;
    pedestalGroup.add(ring1);

    // Inner amber ring (diameter ~1.9m)
    const ringGeo2 = new THREE.RingGeometry(0.92, 0.96, 48);
    const ringMat2 = new THREE.MeshBasicMaterial({
      color: 0xff9e1b,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });
    const ring2 = new THREE.Mesh(ringGeo2, ringMat2);
    ring2.rotation.x = -Math.PI / 2;
    pedestalGroup.add(ring2);

    // Center circular glow disc
    const discGeo = new THREE.CircleGeometry(0.82, 32);
    const discMat = new THREE.MeshBasicMaterial({
      color: 0x00d2ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.15,
      blending: THREE.AdditiveBlending,
    });
    const disc = new THREE.Mesh(discGeo, discMat);
    disc.rotation.x = -Math.PI / 2;
    pedestalGroup.add(disc);

    scene.add(pedestalGroup);

    // 7. Atmospheric Floating Space Dust Particles
    const particleCount = 100;
    const particleGeo = new THREE.BufferGeometry();
    const particlePos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePos[i] = (Math.random() - 0.5) * 5.0;
      particlePos[i + 1] = Math.random() * 3;
      particlePos[i + 2] = (Math.random() - 0.5) * 4.0;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.024,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // 8. GLTF 3D MODEL LOADER WITH PIVOT GROUP & PBR FIXES
    const modelGroup = new THREE.Group();
    scene.add(modelGroup);

    let mixer: THREE.AnimationMixer | null = null;
    let pivotGroup: THREE.Group | null = null;

    setIsLoadingModel(true);
    setLoadError(null);
    const loader = getSharedGLTFLoader();
    const currentConfig = SUIT_CONFIGS[activeSuit];

    // Interactive Drag Orbit & Wheel Zoom Tracking
    let isDragging = false;
    let prevMouseX = 0;
    let manualRotY = currentConfig.rotY;
    const mousePos = { x: 0, y: 0 };

    const setupModel = (root: THREE.Object3D, animations?: THREE.AnimationClip[]) => {
      // Create dedicated pivot group centered at origin
      pivotGroup = new THREE.Group();
      modelGroup.add(pivotGroup);

      // Measure neutral bounding box
      const box = new THREE.Box3().setFromObject(root);
      const size = box.getSize(new THREE.Vector3());

      const maxDim = Math.max(size.x, size.y, size.z);
      // Perfect scale sizing: base reference 1.95m * scaleAdj
      const targetDim = 1.95 * currentConfig.scaleAdj;
      const scale = targetDim / (maxDim || 1);
      root.scale.setScalar(scale);

      // Re-measure scaled box
      box.setFromObject(root);
      const scaledMin = box.min;
      const scaledCenter = box.getCenter(new THREE.Vector3());

      // Center root at origin so pivot rotates cleanly around center
      root.position.x = -scaledCenter.x;
      root.position.y = -scaledMin.y + currentConfig.yOffset;
      root.position.z = -scaledCenter.z;

      pivotGroup.add(root);
      pivotGroup.rotation.y = currentConfig.rotY;
      manualRotY = currentConfig.rotY;

      // PBR MATERIAL ENHANCEMENTS:
      root.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          mesh.castShadow = true;
          mesh.receiveShadow = true;

          const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          materials.forEach((mat) => {
            if (!mat) return;

            // FIX: Eradicate transmissionFactor: 1 glass bug
            if ('transmission' in mat) {
              (mat as THREE.MeshPhysicalMaterial).transmission = 0;
              (mat as THREE.MeshPhysicalMaterial).opacity = 1;
              (mat as THREE.MeshPhysicalMaterial).transparent = false;
            }

            if ('roughness' in mat && 'metalness' in mat) {
              const pbrMat = mat as THREE.MeshStandardMaterial;
              const matName = (pbrMat.name || '').toLowerCase();

              // Gold reflective visor and insulation foil
              if (
                matName.includes('foil_gold') ||
                matName.includes('blinn1sg') ||
                matName.includes('visor') ||
                matName.includes('gold')
              ) {
                pbrMat.metalness = 0.95;
                pbrMat.roughness = 0.12;
                pbrMat.envMapIntensity = 2.2;
              } else if (
                matName.includes('foil_orange') ||
                matName.includes('copper') ||
                matName.includes('bronze')
              ) {
                pbrMat.metalness = 0.85;
                pbrMat.roughness = 0.25;
                pbrMat.envMapIntensity = 1.8;
              } else if (
                matName.includes('aluminum') ||
                matName.includes('metal') ||
                matName.includes('shiny_panel') ||
                matName.includes('antenna')
              ) {
                pbrMat.metalness = 0.75;
                pbrMat.roughness = 0.3;
                pbrMat.envMapIntensity = 1.5;
              } else {
                pbrMat.metalness = 0.08;
                pbrMat.roughness = 0.7;
                pbrMat.envMapIntensity = 0.9;
              }
            }
            mat.needsUpdate = true;
          });
        }
      });

      // Animation mixer if animations present
      if (animations && animations.length > 0) {
        mixer = new THREE.AnimationMixer(root);
        const action = mixer.clipAction(animations[0]);
        action.play();
      }

      setIsLoadingModel(false);
    };

    loader.load(
      currentConfig.file,
      (gltf) => {
        if (isDisposed) return;
        setupModel(gltf.scene, gltf.animations);
      },
      undefined,
      (error) => {
        console.error(`Failed to load ${currentConfig.file}`, error);
        if (!isDisposed) {
          setIsLoadingModel(false);
          setLoadError(`Failed to load 3D model: ${currentConfig.name}`);
        }
      }
    );

    const handleMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mousePos.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mousePos.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      if (isDragging && pivotGroup) {
        const deltaX = e.clientX - prevMouseX;
        manualRotY += deltaX * 0.012;
        prevMouseX = e.clientX;
      }
    };

    const handleMouseUp = () => {
      isDragging = false;
    };

    // Smooth Wheel Zoom within safe bounds [2.8m - 6.2m]
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      zoomDistance += e.deltaY * 0.0025;
      zoomDistance = THREE.MathUtils.clamp(zoomDistance, 2.8, 6.0);
    };

    container.addEventListener('mousedown', handleMouseDown);
    container.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    let animId: number;
    const clock = new THREE.Clock();

    // 9. Animation Render Loop
    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      if (mixer) {
        mixer.update(delta);
      }

      // Slow particle float
      const pos = particleGeo.attributes.position.array as Float32Array;
      for (let i = 1; i < particleCount * 3; i += 3) {
        pos[i] -= 0.0018;
        if (pos[i] < 0) pos[i] = 3.0;
      }
      particleGeo.attributes.position.needsUpdate = true;

      // Rotate glowing floor pedestal
      ring1.rotation.z = elapsed * 0.2;
      ring2.rotation.z = -elapsed * 0.3;
      const pulse = 0.5 + 0.4 * Math.sin(elapsed * 2.2);
      discMat.opacity = 0.12 + 0.1 * pulse;
      ringMat1.opacity = 0.45 + 0.35 * pulse;
      ringMat2.opacity = 0.55 + 0.35 * pulse;

      // Smooth Pivot Rotation: drag orbit + subtle idle sway & mouse parallax
      if (pivotGroup) {
        const targetRotY = manualRotY + (isDragging ? 0 : mousePos.x * 0.25);
        pivotGroup.rotation.y = THREE.MathUtils.lerp(pivotGroup.rotation.y, targetRotY, 0.08);
        pivotGroup.rotation.x = THREE.MathUtils.lerp(pivotGroup.rotation.x, -mousePos.y * 0.04, 0.08);
      }

      // Smooth Camera Dolly & Zoom Lerp
      const targetCamPos = isInspectionModeRef.current
        ? new THREE.Vector3(0, 1.15, 2.5)
        : new THREE.Vector3(0, 1.05, zoomDistance);
      const targetLookAt = isInspectionModeRef.current
        ? new THREE.Vector3(0, 1.0, 0)
        : new THREE.Vector3(0, 0.72, 0);

      camera.position.lerp(targetCamPos, 0.08);
      currentLookAt.lerp(targetLookAt, 0.08);
      camera.lookAt(currentLookAt);

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 640;
      const h = container.clientHeight || 750;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      isDisposed = true;
      cancelAnimationFrame(animId);
      container.removeEventListener('mousedown', handleMouseDown);
      container.removeEventListener('wheel', handleWheel);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('resize', handleResize);
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      roomEnv.dispose();
      pmrem.dispose();
      renderer.dispose();
    };
  }, [activeSuit, characterId]);

  const handleClick = () => {
    soundFx.playHydroPressureSwoosh();
    if (onInteract) onInteract();
  };

  const currentConfig = SUIT_CONFIGS[activeSuit];

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '820px',
        height: isInspectionMode ? 'calc(100vh - 190px)' : '100%',
        maxHeight: isInspectionMode ? '740px' : '100%',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 14,
        userSelect: 'none',
      }}
    >
      {/* 3D Canvas Viewport */}
      <div
        ref={mountRef}
        onClick={handleClick}
        className="astronaut-rim-highlight"
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          cursor: 'grab',
        }}
        title="Click & Drag to Rotate 360° • Scroll to Zoom • Click to Inspect"
      />

      {/* Model Loading State */}
      {isLoadingModel && (
        <div
          style={{
            position: 'absolute',
            top: '40%',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(8, 14, 26, 0.92)',
            border: '1px solid rgba(56, 189, 248, 0.4)',
            borderRadius: '8px',
            padding: '8px 16px',
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: '11px',
            color: '#38bdf8',
            backdropFilter: 'blur(16px)',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.8)',
            zIndex: 30,
          }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#38bdf8',
              boxShadow: '0 0 10px #38bdf8',
              animation: 'pulse 1.2s infinite',
            }}
          />
          STREAMING NASA 3D ASSET: {currentConfig.name.split('(')[0]}...
        </div>
      )}

      {/* Model Load Error Fallback */}
      {loadError && (
        <div
          style={{
            position: 'absolute',
            top: '40%',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: '8px',
            padding: '8px 16px',
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: '11px',
            color: '#f87171',
            backdropFilter: 'blur(12px)',
            zIndex: 30,
          }}
        >
          ⚠️ {loadError}
        </div>
      )}

      {/* Interactive 3D Model Switcher Bar */}
      <div
        data-ui="true"
        style={{
          position: 'absolute',
          top: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          background: 'var(--color-paper-2)',
          padding: '6px 8px',
          zIndex: 25,
        }}
      >
        {(['LM', 'ROVER', 'SATELLITE', 'EMU'] as const).map((suitKey) => {
          const isActive = activeSuit === suitKey;
          const config = SUIT_CONFIGS[suitKey];
          return (
            <button
              key={suitKey}
              onClick={(e) => {
                e.stopPropagation();
                setActiveSuit(suitKey);
                soundFx.playClick(850);
              }}
              style={{
                padding: '6px 12px',
                border: 'none',
                background: isActive ? 'var(--color-accent)' : 'transparent',
                color: isActive ? 'var(--color-accent-ink)' : 'var(--color-ink-2)',
                fontSize: '13.5px',
                fontWeight: 700,
                fontFamily: 'var(--font-body)',
                letterSpacing: '0.02em',
                cursor: 'pointer',
              }}
              title={config.name}
            >
              {config.label}
            </button>
          );
        })}
      </div>

      {/* Dynamic Telemetry Status Plaque */}
      <div
        data-ui="true"
        style={{
          position: 'absolute',
          bottom: '10px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          background: 'var(--color-paper-2)',
          padding: '10px 20px',
          zIndex: 20,
        }}
      >
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-ink)', fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>{currentConfig.badge}</span>
            <span>{currentConfig.name.split('(')[0].toUpperCase()}</span>
          </div>
          <div style={{ fontSize: '13.5px', color: 'var(--color-muted)', fontFamily: 'var(--font-body)', marginTop: '2px' }}>
            {currentConfig.telemetry}
          </div>
        </div>

        {onInteract && (
          <button
            onClick={handleClick}
            style={{
              background: 'var(--color-accent)',
              border: 'none',
              color: 'var(--color-accent-ink)',
              fontFamily: 'var(--font-body)',
              fontSize: '13.5px',
              fontWeight: 700,
              padding: '8px 16px',
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            Inspect
          </button>
        )}
      </div>

      {/* Orbit & Zoom Instruction Tag */}
      <div
        data-ui="true"
        style={{
          position: 'absolute',
          bottom: '72px',
          background: 'var(--color-paper-2)',
          padding: '4px 14px',
          fontFamily: 'var(--font-body)',
          fontSize: '13.5px',
          color: 'var(--color-muted)',
          pointerEvents: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        Drag to rotate 360° · Scroll to zoom · Click to inspect
      </div>
    </div>
  );
};
