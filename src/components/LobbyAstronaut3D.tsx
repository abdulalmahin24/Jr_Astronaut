import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { soundFx } from '../utils/audioEffects';

export type SuitOption = 'EMU' | 'ARTEMIS' | 'ACES';

interface SuitConfig {
  id: SuitOption;
  label: string;
  subLabel: string;
  modelPath: string;
  icon: string;
  color: string;
}

const SUIT_OPTIONS: SuitConfig[] = [
  {
    id: 'EMU',
    label: 'NASA EMU',
    subLabel: 'ISS & Spacewalk EVA',
    modelPath: '/models/NASA_EMU_Realistic.glb',
    icon: '👨‍🚀',
    color: '#00d2ff',
  },
  {
    id: 'ARTEMIS',
    label: 'xEMU ARTEMIS',
    subLabel: 'Lunar Surface Exploration',
    modelPath: '/models/NASA_Neil_Apollo11_HD.glb',
    icon: '🚀',
    color: '#38bdf8',
  },
  {
    id: 'ACES',
    label: 'ACES ORANGE',
    subLabel: 'Launch & Ascent Escape',
    modelPath: '/models/ACES_Suit.glb',
    icon: '🧡',
    color: '#f97316',
  },
];

interface LobbyAstronaut3DProps {
  characterId?: string;
  astronautName?: string;
  isInspectionMode?: boolean;
  envMapUrl?: string;
  onInteract?: () => void;
  onSuitChange?: (suit: string) => void;
}

export const LobbyAstronaut3D: React.FC<LobbyAstronaut3DProps> = ({
  characterId,
  astronautName = 'Kalpana Chawla',
  isInspectionMode = false,
  onInteract,
  onSuitChange,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [activeSuit, setActiveSuit] = useState<SuitOption>(() => {
    if (characterId === 'kalpana_chawla') return 'ACES';
    return 'EMU';
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const isInspectionModeRef = useRef(isInspectionMode);
  const activeSuitRef = useRef<SuitOption>(activeSuit);
  const modelRootRef = useRef<THREE.Group | null>(null);

  // Drag-to-rotate states
  const isDraggingRef = useRef(false);
  const lastXRef = useRef(0);
  const targetRotationYRef = useRef(0);
  const currentRotationYRef = useRef(0);

  useEffect(() => {
    isInspectionModeRef.current = isInspectionMode;
  }, [isInspectionMode]);

  useEffect(() => {
    activeSuitRef.current = activeSuit;
  }, [activeSuit]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 640;
    const height = container.clientHeight || 750;

    // 1. Three.js Scene
    const scene = new THREE.Scene();

    // 2. Camera with dolly zoom
    const camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 50);
    camera.position.set(0, 0.95, 3.4);
    const currentLookAt = new THREE.Vector3(0, 0.92, 0);
    camera.lookAt(currentLookAt);

    // 3. WebGL Renderer with Alpha
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // 4. Lighting: Heroic Studio Key + Rim + Visor Glint Spot
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xfff8ee, 3.2);
    keyLight.position.set(2.5, 4.0, 3.0);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x38bdf8, 1.6);
    fillLight.position.set(-2.5, 2.0, 2.0);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0x00d2ff, 2.8);
    rimLight.position.set(0, 3.0, -3.2);
    scene.add(rimLight);

    const spotLight = new THREE.SpotLight(0xfffaed, 3.5, 12, Math.PI / 6, 0.4);
    spotLight.position.set(0.4, 2.4, 2.2);
    spotLight.target.position.set(0, 1.45, 0);
    scene.add(spotLight);
    scene.add(spotLight.target);

    // 5. Glowing 3D Pedestal Floor Rings in Three.js
    const pedestalGroup = new THREE.Group();
    pedestalGroup.position.set(0, 0.02, 0);

    // Outer cyan dashed ring
    const ringGeo1 = new THREE.RingGeometry(0.85, 0.89, 64);
    const ringMat1 = new THREE.MeshBasicMaterial({
      color: 0x00d2ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
    });
    const ring1 = new THREE.Mesh(ringGeo1, ringMat1);
    ring1.rotation.x = -Math.PI / 2;
    pedestalGroup.add(ring1);

    // Inner amber neon ring
    const ringGeo2 = new THREE.RingGeometry(0.62, 0.65, 48);
    const ringMat2 = new THREE.MeshBasicMaterial({
      color: 0xff9e1b,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    });
    const ring2 = new THREE.Mesh(ringGeo2, ringMat2);
    ring2.rotation.x = -Math.PI / 2;
    pedestalGroup.add(ring2);

    // Center circular glow disc
    const discGeo = new THREE.CircleGeometry(0.55, 32);
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

    // 6. Gold Visor Specular Sparkle Sprite
    const glintCanvas = document.createElement('canvas');
    glintCanvas.width = 64;
    glintCanvas.height = 64;
    const gCtx = glintCanvas.getContext('2d');
    if (gCtx) {
      const grad = gCtx.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0, 'rgba(255, 230, 140, 1)');
      grad.addColorStop(0.3, 'rgba(255, 170, 40, 0.7)');
      grad.addColorStop(0.7, 'rgba(0, 210, 255, 0.2)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      gCtx.fillStyle = grad;
      gCtx.fillRect(0, 0, 64, 64);
    }
    const glintTex = new THREE.CanvasTexture(glintCanvas);
    const glintMat = new THREE.SpriteMaterial({
      map: glintTex,
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 0.85,
    });
    const glintSprite = new THREE.Sprite(glintMat);
    glintSprite.position.set(0.08, 1.48, 0.45);
    glintSprite.scale.set(0.24, 0.24, 0.24);
    scene.add(glintSprite);

    // 7. Floating Dust Motes
    const particleCount = 100;
    const particleGeo = new THREE.BufferGeometry();
    const particlePos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePos[i] = (Math.random() - 0.5) * 4;
      particlePos[i + 1] = Math.random() * 2.8;
      particlePos[i + 2] = (Math.random() - 0.5) * 3;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0xffd27d,
      size: 0.024,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // 8. GLTF Loader Setup
    const modelContainer = new THREE.Group();
    scene.add(modelContainer);
    modelRootRef.current = modelContainer;

    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('/draco/');
    const gltfLoader = new GLTFLoader();
    gltfLoader.setDRACOLoader(dracoLoader);

    // Load active suit model
    const loadSuitModel = (suitKey: SuitOption) => {
      setIsLoading(true);
      while (modelContainer.children.length > 0) {
        modelContainer.remove(modelContainer.children[0]);
      }

      const config = SUIT_OPTIONS.find((s) => s.id === suitKey) || SUIT_OPTIONS[0];

      gltfLoader.load(
        config.modelPath,
        (gltf) => {
          const root = gltf.scene;

          // Compute bounding box for auto-scaling and pedestal alignment
          const box = new THREE.Box3().setFromObject(root);
          const size = box.getSize(new THREE.Vector3());
          const targetHeight = 1.72;
          const scale = targetHeight / (size.y || 1);
          root.scale.setScalar(scale);

          // Center horizontally and rest on the pedestal floor
          box.setFromObject(root);
          root.position.x = -(box.min.x + box.max.x) / 2;
          root.position.z = -(box.min.z + box.max.z) / 2;
          root.position.y = -box.min.y + 0.04;

          // Material enhancement: Visor 24K gold mirror + PBR suit fabric
          root.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const mesh = child as THREE.Mesh;
              mesh.castShadow = true;
              mesh.receiveShadow = true;

              const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
              mats.forEach((mat) => {
                if (mat && (mat as THREE.MeshStandardMaterial).isMeshStandardMaterial) {
                  const stdMat = mat as THREE.MeshStandardMaterial;
                  const nameLower = (stdMat.name || '').toLowerCase();
                  if (nameLower.includes('visor') || nameLower.includes('glass')) {
                    stdMat.color.setHex(0xffd700);
                    stdMat.metalness = 0.98;
                    stdMat.roughness = 0.05;
                    stdMat.emissive.setHex(0xb45309);
                    stdMat.emissiveIntensity = 0.2;
                  } else {
                    stdMat.roughness = 0.55;
                    stdMat.metalness = 0.15;
                  }
                }
              });
            }
          });

          modelContainer.add(root);
          setIsLoading(false);
        },
        undefined,
        (err) => {
          console.warn('Failed to load suit GLB, using fallback geometry:', err);
          setIsLoading(false);
        }
      );
    };

    loadSuitModel(activeSuit);

    // 9. Interactive 360° Drag Controls
    const handlePointerDown = (e: PointerEvent) => {
      isDraggingRef.current = true;
      lastXRef.current = e.clientX;
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isDraggingRef.current) return;
      const deltaX = e.clientX - lastXRef.current;
      targetRotationYRef.current += deltaX * 0.012;
      lastXRef.current = e.clientX;
    };

    const handlePointerUp = () => {
      isDraggingRef.current = false;
    };

    container.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    // 10. Animation Loop
    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Smooth horizontal rotation lerp
      currentRotationYRef.current +=
        (targetRotationYRef.current - currentRotationYRef.current) * 0.08;
      if (modelContainer) {
        modelContainer.rotation.y = currentRotationYRef.current;
        // Idle breathing oscillation
        modelContainer.position.y = Math.sin(elapsedTime * 1.8) * 0.005;
      }

      // Floating dust particles
      const positions = particleGeo.attributes.position.array as Float32Array;
      for (let i = 1; i < particleCount * 3; i += 3) {
        positions[i] += Math.sin(elapsedTime * 0.5 + positions[i]) * 0.0012;
      }
      particleGeo.attributes.position.needsUpdate = true;

      // Pedestal rotation animation
      ring1.rotation.z = elapsedTime * 0.15;
      ring2.rotation.z = -elapsedTime * 0.25;

      // Visor sparkle pulse
      const pulse = Math.sin(elapsedTime * 2.2) * 0.5 + 0.5;
      glintSprite.scale.setScalar(0.20 + pulse * 0.10);
      glintMat.opacity = 0.45 + pulse * 0.45;

      // Camera dolly lerp between standard view and inspection zoom
      const targetY = isInspectionModeRef.current ? 1.35 : 0.95;
      const targetZ = isInspectionModeRef.current ? 2.35 : 3.4;
      camera.position.y += (targetY - camera.position.y) * 0.06;
      camera.position.z += (targetZ - camera.position.z) * 0.06;

      const targetLookAt = isInspectionModeRef.current
        ? new THREE.Vector3(0, 1.35, 0)
        : new THREE.Vector3(0, 0.92, 0);
      currentLookAt.lerp(targetLookAt, 0.06);
      camera.lookAt(currentLookAt);

      spotLight.intensity = isInspectionModeRef.current ? 4.2 : 3.0;

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
      cancelAnimationFrame(animId);
      container.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('resize', handleResize);
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      renderer.dispose();
      dracoLoader.dispose();
    };
  }, [activeSuit]);

  const handleSuitSelect = (suit: SuitOption) => {
    soundFx.playClick(900);
    setActiveSuit(suit);
    if (onSuitChange) onSuitChange(suit);
  };

  const handleContainerClick = (e: React.MouseEvent) => {
    // Only trigger inspect modal if user didn't perform a 360° drag
    if (onInteract) {
      soundFx.playHydroPressureSwoosh();
      onInteract();
    }
  };

  return (
    <div
      ref={mountRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="astronaut-rim-highlight"
      style={{
        width: '100%',
        maxWidth: '780px',
        height: 'calc(100vh - 240px)',
        maxHeight: '610px',
        position: 'relative',
        cursor: 'grab',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 14,
        userSelect: 'none',
        transform: isInspectionMode ? 'scale(1.08)' : 'scale(1.0)',
        transition: 'transform 0.65s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      title="Drag 360° to Rotate Astronaut • Click to Inspect Gear"
    >
      {/* Loading Spinner */}
      {isLoading && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(7, 9, 14, 0.85)',
            border: '1px solid #00d2ff',
            borderRadius: '12px',
            padding: '12px 24px',
            color: '#00d2ff',
            fontSize: '12px',
            fontFamily: 'var(--font-mono)',
            fontWeight: 800,
            letterSpacing: '0.08em',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: '0 0 25px rgba(0, 210, 255, 0.4)',
            zIndex: 30,
            pointerEvents: 'none',
          }}
        >
          <span style={{ animation: 'spin 1.5s linear infinite' }}>⚙</span>
          <span>CALIBRATING 3D SPACESUIT...</span>
        </div>
      )}

      {/* Top Authentic NASA Suit Badge */}
      <div
        style={{
          position: 'absolute',
          top: '6px',
          background: 'rgba(7, 9, 14, 0.88)',
          border: '1px solid rgba(0, 210, 255, 0.45)',
          borderRadius: '20px',
          padding: '5px 16px',
          fontSize: '10px',
          fontFamily: 'var(--font-mono)',
          color: '#38bdf8',
          letterSpacing: '0.08em',
          pointerEvents: 'none',
          backdropFilter: 'blur(8px)',
          opacity: isHovered || isInspectionMode ? 1 : 0.85,
          transition: 'opacity 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 4px 15px rgba(0, 210, 255, 0.25)',
          zIndex: 20,
        }}
      >
        <span style={{ color: '#10b981', animation: 'pulse 1.8s infinite' }}>●</span>
        <span>
          {isInspectionMode
            ? `INSPECTION MODE · ${astronautName.toUpperCase()}`
            : 'AUTHENTIC NASA EMU SPACESUIT · ARTEMIS FLIGHT GEAR'}
        </span>
      </div>

      {/* Bottom Tactical HUD Controls: Drag Hint & Suit Switcher Tabs */}
      {!isInspectionMode && (
        <div
          style={{
            position: 'absolute',
            bottom: '12px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            zIndex: 25,
            pointerEvents: 'auto',
          }}
        >
          {/* Drag & Inspect Callout */}
          <div
            onClick={handleContainerClick}
            style={{
              background: 'rgba(7, 9, 14, 0.90)',
              border: '1px solid #ff9e1b',
              clipPath:
                'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)',
              padding: '6px 20px',
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              fontWeight: 800,
              color: '#ff9e1b',
              letterSpacing: '0.08em',
              cursor: 'pointer',
              backdropFilter: 'blur(10px)',
              opacity: isHovered ? 1 : 0.85,
              transform: isHovered ? 'scale(1.04)' : 'scale(1)',
              transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 0 20px rgba(255, 158, 27, 0.45)',
            }}
          >
            <span>DRAG 360° TO ROTATE</span>
            <span style={{ color: '#00d2ff' }}>•</span>
            <span style={{ color: '#00d2ff' }}>CLICK TO INSPECT GEAR</span>
            <span style={{ color: '#ff9e1b' }}>▶</span>
          </div>

          {/* Authentic Spacesuit Model Switcher Pills */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(7, 9, 14, 0.88)',
              border: '1px solid rgba(0, 210, 255, 0.35)',
              borderRadius: '24px',
              padding: '4px 8px',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 4px 18px rgba(0, 0, 0, 0.8)',
            }}
          >
            {SUIT_OPTIONS.map((suit) => {
              const isSelected = activeSuit === suit.id;
              return (
                <button
                  key={suit.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSuitSelect(suit.id);
                  }}
                  style={{
                    background: isSelected
                      ? `linear-gradient(135deg, ${suit.color}33, rgba(15, 23, 42, 0.95))`
                      : 'transparent',
                    border: isSelected
                      ? `1px solid ${suit.color}`
                      : '1px solid transparent',
                    borderRadius: '16px',
                    padding: '4px 12px',
                    color: isSelected ? '#ffffff' : '#94a3b8',
                    fontSize: '10px',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: isSelected ? 800 : 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    transition: 'all 0.2s ease',
                    boxShadow: isSelected ? `0 0 12px ${suit.color}55` : 'none',
                  }}
                  title={suit.subLabel}
                >
                  <span>{suit.icon}</span>
                  <span>{suit.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
