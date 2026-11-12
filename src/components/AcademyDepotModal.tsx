import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { getSharedGLTFLoader } from '../utils/modelLoader';
import {
  X,
  Coins,
  Eye,
  ShoppingBag,
  ArrowRightLeft,
  Sparkles,
  Building2,
  CheckCircle2,
  AlertCircle,
  RotateCw,
} from 'lucide-react';
import {
  INITIAL_ACADEMY_FACILITIES,
  EQUIPMENT_CATALOG,
  type AcademyFacility,
  type EquipmentItem,
} from '../data/academyEquipment';
import { soundFx } from '../utils/audioEffects';
import { disposeThreeScene } from '../utils/threeDisposeHelper';

interface AcademyDepotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunchClassroom?: () => void;
}

export const AcademyDepotModal: React.FC<AcademyDepotModalProps> = ({
  isOpen,
  onClose,
  onLaunchClassroom,
}) => {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'MARKET' | 'FACILITIES' | 'CAMPUS_3D' | 'INSPECT_3D'>('MARKET');
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | 'SUITS' | 'LIFE_SUPPORT' | 'POWER' | 'TRAINING' | 'SCIENCE'>('ALL');
  const [facCategory, setFacCategory] = useState<'ALL' | 'TRAINING' | 'LIFE_SUPPORT' | 'SCIENCE' | 'FLIGHT'>('ALL');

  // Persistence State
  const [credits, setCredits] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('astro_camp_cadet_credits');
      return saved ? parseInt(saved, 10) : 32500;
    } catch {
      return 32500;
    }
  });

  const [facilities, setFacilities] = useState<AcademyFacility[]>(() => {
    try {
      const saved = localStorage.getItem('astro_camp_facilities');
      return saved ? JSON.parse(saved) : INITIAL_ACADEMY_FACILITIES;
    } catch {
      return INITIAL_ACADEMY_FACILITIES;
    }
  });

  const [catalog, setCatalog] = useState<EquipmentItem[]>(() => {
    try {
      const saved = localStorage.getItem('astro_camp_equipment_catalog');
      return saved ? JSON.parse(saved) : EQUIPMENT_CATALOG;
    } catch {
      return EQUIPMENT_CATALOG;
    }
  });

  const [selectedItem, setSelectedItem] = useState<EquipmentItem>(catalog[0]);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // 3D Canvas Refs
  const inspectCanvasRef = useRef<HTMLCanvasElement>(null);
  const campusCanvasRef = useRef<HTMLCanvasElement>(null);
  const inspectRendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const campusRendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const [wireframeMode, setWireframeMode] = useState(false);

  // Save changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('astro_camp_cadet_credits', credits.toString());
      localStorage.setItem('astro_camp_facilities', JSON.stringify(facilities));
      localStorage.setItem('astro_camp_equipment_catalog', JSON.stringify(catalog));
    } catch (e) {
      console.warn('Storage save failed', e);
    }
  }, [credits, facilities, catalog]);

  // Listen for real-time Cadet Credits updates across the application
  useEffect(() => {
    const handleCreditsEvent = (e: Event) => {
      const custom = e as CustomEvent<{ credits: number }>;
      if (custom.detail && typeof custom.detail.credits === 'number') {
        setCredits(custom.detail.credits);
      }
    };
    window.addEventListener('cadet-credits-updated', handleCreditsEvent);
    return () => {
      window.removeEventListener('cadet-credits-updated', handleCreditsEvent);
    };
  }, []);

  // Sync on modal open
  useEffect(() => {
    if (isOpen) {
      try {
        const saved = localStorage.getItem('astro_camp_cadet_credits');
        if (saved) setCredits(parseInt(saved, 10));
      } catch {}
    }
  }, [isOpen]);

  // Flash feedback message
  const triggerFeedback = (msg: string) => {
    setActionFeedback(msg);
    setTimeout(() => setActionFeedback(null), 3000);
  };

  // ── BUY EQUIPMENT ─────────────────────────────────────────────────────────────
  const handleBuyItem = (item: EquipmentItem) => {
    if (credits < item.buyPrice) {
      soundFx.playAlarm();
      triggerFeedback(`❌ Insufficient Funds! You need ${item.buyPrice - credits} more Cadet Credits.`);
      return;
    }
    soundFx.playReactorStart();
    setCredits((prev) => prev - item.buyPrice);
    setCatalog((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, equipped: true } : i))
    );
    triggerFeedback(`✅ Purchased ${item.name} for ${item.buyPrice} CC! Equipping to Academy.`);
  };

  // ── SELL EQUIPMENT ────────────────────────────────────────────────────────────
  const handleSellItem = (item: EquipmentItem) => {
    soundFx.playTelemetryChirp();
    setCredits((prev) => prev + item.sellPrice);
    setCatalog((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, equipped: false } : i))
    );
    triggerFeedback(`💰 Sold ${item.name} back to NASA Depot for +${item.sellPrice} CC.`);
  };

  // ── UPGRADE FACILITY ──────────────────────────────────────────────────────────
  const handleUpgradeFacility = (fac: AcademyFacility) => {
    if (credits < fac.costToUpgrade) {
      soundFx.playAlarm();
      triggerFeedback(`❌ Insufficient Funds! You need ${fac.costToUpgrade - credits} more CC to upgrade.`);
      return;
    }
    soundFx.playReactorStart();
    setCredits((prev) => prev - fac.costToUpgrade);
    setFacilities((prev) =>
      prev.map((f) =>
        f.id === fac.id
          ? {
              ...f,
              level: f.level + 1,
              isConstructed: true,
              costToUpgrade: Math.round(f.costToUpgrade * 1.5),
            }
          : f
      )
    );
    triggerFeedback(`🚀 ${fac.name} successfully upgraded to Level ${fac.level + 1}!`);
  };

  // ── 3D EQUIPMENT INSPECTOR ENGINE (Three.js) ───────────────────────────────────
  useEffect(() => {
    if (!isOpen || (activeTab !== 'INSPECT_3D' && activeTab !== 'MARKET')) return;
    const canvas = inspectCanvasRef.current;
    if (!canvas) return;

    const width = canvas.parentElement?.clientWidth || 460;
    const height = canvas.parentElement?.clientHeight || 340;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060912);
    scene.fog = new THREE.FogExp2(0x060912, 0.04);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 1.6, 3.8);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    inspectRendererRef.current = renderer;

    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 8.0;
    controls.minDistance = 1.0;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.2;

    // Lighting (Studio Key + Blue Rim + Gold Fill)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(5, 8, 5);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.8);
    rimLight.position.set(-5, 3, -5);
    scene.add(rimLight);

    const warmLight = new THREE.PointLight(0xf59e0b, 1.2, 10);
    warmLight.position.set(0, -2, 2);
    scene.add(warmLight);

    // Grid Floor
    const gridHelper = new THREE.GridHelper(10, 20, 0x38bdf8, 0x1e293b);
    gridHelper.position.y = -1.2;
    scene.add(gridHelper);

    // Holographic Pedestal
    const pedestalGeo = new THREE.CylinderGeometry(1.6, 1.8, 0.25, 32);
    const pedestalMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.8,
      roughness: 0.2,
    });
    const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
    pedestal.position.y = -1.3;
    scene.add(pedestal);

    const ringGeo = new THREE.RingGeometry(1.62, 1.72, 32);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = -1.17;
    scene.add(ring);

    // Load Model or Procedural Fallback
    const modelGroup = new THREE.Group();
    scene.add(modelGroup);

    let isDisposed = false;

    if (selectedItem.modelPath.endsWith('.glb')) {
      const loader = getSharedGLTFLoader();
      loader.load(
        selectedItem.modelPath,
        (gltf) => {
          if (isDisposed) return;
          const root = gltf.scene;
          const box = new THREE.Box3().setFromObject(root);
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z) || 1;
          const scale = (2.0 / maxDim) * (selectedItem.modelScale || 1.0);

          root.position.sub(center);
          root.position.y -= 0.1;
          root.scale.setScalar(scale);

          root.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const mesh = child as THREE.Mesh;
              mesh.castShadow = true;
              mesh.receiveShadow = true;
              if (wireframeMode && mesh.material && 'wireframe' in (mesh.material as object)) {
                (mesh.material as unknown as { wireframe: boolean }).wireframe = true;
              }
            }
          });

          modelGroup.add(root);
        },
        undefined,
        () => {
          // Fallback to high-tech procedural mesh
          buildProcedural3DModel(modelGroup, selectedItem.id, wireframeMode);
        }
      );
    } else {
      buildProcedural3DModel(modelGroup, selectedItem.id, wireframeMode);
    }

    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      controls.update();
      ring.rotation.z += 0.01;
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!canvas.parentElement) return;
      const w = canvas.parentElement.clientWidth;
      const h = canvas.parentElement.clientHeight || 340;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      isDisposed = true;
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      disposeThreeScene(renderer, scene);
    };
  }, [isOpen, activeTab, selectedItem, wireframeMode]);

  // ── 3D CAMPUS VISUALIZATION ENGINE (Three.js) ──────────────────────────────────
  useEffect(() => {
    if (!isOpen || activeTab !== 'CAMPUS_3D') return;
    const canvas = campusCanvasRef.current;
    if (!canvas) return;

    const width = canvas.parentElement?.clientWidth || 760;
    const height = canvas.parentElement?.clientHeight || 460;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x04060f);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 200);
    camera.position.set(0, 18, 30);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    campusRendererRef.current = renderer;

    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.maxPolarAngle = Math.PI / 2.1;
    controls.target.set(0, 2, 0);

    // Stars
    const starGeo = new THREE.BufferGeometry();
    const starCoords = [];
    for (let i = 0; i < 1500; i++) {
      starCoords.push(
        (Math.random() - 0.5) * 400,
        Math.random() * 200 + 10,
        (Math.random() - 0.5) * 400
      );
    }
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starCoords, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.8, transparent: true, opacity: 0.8 });
    scene.add(new THREE.Points(starGeo, starMat));

    // Ground Plane with Lunar/Earth-Analog Soil
    const groundGeo = new THREE.PlaneGeometry(80, 80, 40, 40);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.85,
      metalness: 0.15,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    // Grid Overlay
    const grid = new THREE.GridHelper(80, 40, 0x38bdf8, 0x334155);
    grid.position.y = 0.05;
    scene.add(grid);

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const sun = new THREE.DirectionalLight(0xfffbeb, 2.0);
    sun.position.set(25, 40, 20);
    scene.add(sun);

    // Build Campus Modules in 3D
    const campusGroup = new THREE.Group();
    scene.add(campusGroup);

    // 1. Central Admin & Flight Sim Dome
    const domeGeo = new THREE.SphereGeometry(4.5, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const domeMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.3, metalness: 0.7 });
    const dome = new THREE.Mesh(domeGeo, domeMat);
    dome.position.set(0, 0, 0);
    campusGroup.add(dome);

    // 2. High-G Centrifuge Ring (Rotates)
    const centrifugeGroup = new THREE.Group();
    centrifugeGroup.position.set(-18, 0, -8);
    const ringBase = new THREE.Mesh(new THREE.CylinderGeometry(5.5, 5.5, 0.6, 32), new THREE.MeshStandardMaterial({ color: 0x0f172a }));
    const centrifugeArm = new THREE.Mesh(new THREE.BoxGeometry(10, 0.5, 0.8), new THREE.MeshStandardMaterial({ color: 0xa78bfa }));
    centrifugeArm.position.y = 1.2;
    const podL = new THREE.Mesh(new THREE.CapsuleGeometry(0.8, 1.2, 8, 16), new THREE.MeshStandardMaterial({ color: 0x7c3aed }));
    podL.position.set(4.8, 1.2, 0);
    const podR = podL.clone();
    podR.position.set(-4.8, 1.2, 0);
    centrifugeGroup.add(ringBase, centrifugeArm, podL, podR);
    campusGroup.add(centrifugeGroup);

    // 3. Neutral Buoyancy Tank (Translucent Cyan Cylinder)
    const nblGroup = new THREE.Group();
    nblGroup.position.set(18, 0, -8);
    const poolGeo = new THREE.CylinderGeometry(5, 5, 4, 32);
    const poolMat = new THREE.MeshPhysicalMaterial({
      color: 0x0284c7,
      transparent: true,
      opacity: 0.65,
      roughness: 0.1,
      transmission: 0.7,
    });
    const pool = new THREE.Mesh(poolGeo, poolMat);
    pool.position.y = 2;
    const poolRim = new THREE.Mesh(new THREE.TorusGeometry(5, 0.3, 16, 32), new THREE.MeshStandardMaterial({ color: 0x94a3b8 }));
    poolRim.rotation.x = Math.PI / 2;
    poolRim.position.y = 4;
    nblGroup.add(pool, poolRim);
    campusGroup.add(nblGroup);

    // 4. 70-Meter Parabolic Dish
    const dishGroup = new THREE.Group();
    dishGroup.position.set(-16, 0, 14);
    const pMast = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.6, 5, 16), new THREE.MeshStandardMaterial({ color: 0x64748b }));
    pMast.position.y = 2.5;
    const dishHead = new THREE.Mesh(new THREE.SphereGeometry(3.2, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2.8), new THREE.MeshStandardMaterial({ color: 0xf8fafc, side: THREE.DoubleSide }));
    dishHead.rotation.x = Math.PI / 3;
    dishHead.position.set(0, 5, 0);
    dishGroup.add(pMast, dishHead);
    campusGroup.add(dishGroup);

    // 5. Hydroponic Greenhouse Domes
    const ghGroup = new THREE.Group();
    ghGroup.position.set(16, 0, 14);
    const ghDome = new THREE.Mesh(new THREE.SphereGeometry(3.5, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshPhysicalMaterial({ color: 0x43ffa0, transparent: true, opacity: 0.5 }));
    ghGroup.add(ghDome);
    campusGroup.add(ghGroup);

    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      controls.update();
      centrifugeArm.rotation.y += 0.03;
      podL.rotation.y += 0.03;
      podR.rotation.y += 0.03;
      dishHead.rotation.y += 0.003;
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!canvas.parentElement) return;
      const w = canvas.parentElement.clientWidth;
      const h = canvas.parentElement.clientHeight || 460;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      disposeThreeScene(renderer, scene);
    };
  }, [isOpen, activeTab]);

  // Accessibility: Esc key closes modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredCatalog = catalog.filter(
    (item) => selectedCategory === 'ALL' || item.category === selectedCategory
  );

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 11000 }}>
      <div
        className="modal-container"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '1280px',
          width: '96vw',
          maxHeight: '94vh',
          backgroundColor: '#060913',
          border: '1px solid rgba(56, 189, 248, 0.45)',
          borderRadius: '20px',
          display: 'flex',
          flexDirection: 'column',
          padding: '0',
          overflow: 'hidden',
          boxShadow: '0 0 60px rgba(0, 0, 0, 0.9), 0 0 30px rgba(56, 189, 248, 0.25)',
        }}
      >
        {/* TOP STATUS BAR */}
        <div
          style={{
            padding: '16px 24px',
            backgroundColor: '#090d1a',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #0284c7, #7c3aed)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.4rem',
                boxShadow: '0 0 15px rgba(56, 189, 248, 0.4)',
              }}
            >
              🏛️
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#38bdf8', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                NASA Junior Astronaut Academy &amp; Flight Depot
              </div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
                Academy Campus Builder &amp; Equipment Exchange
              </h2>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Cadet Credits Balance */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                backgroundColor: 'rgba(251, 191, 36, 0.12)',
                border: '1px solid rgba(251, 191, 36, 0.35)',
                borderRadius: '12px',
              }}
            >
              <Coins size={18} className="text-amber-400" />
              <div>
                <div style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Cadet Credits</div>
                <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#fbbf24', fontFamily: 'monospace' }}>
                  {credits.toLocaleString()} <span style={{ fontSize: '0.75rem' }}>CC</span>
                </div>
              </div>
            </div>

            {onLaunchClassroom && (
              <button
                onClick={() => {
                  soundFx.playClick(800);
                  onClose();
                  onLaunchClassroom();
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #7c3aed, #4338ca)',
                  border: '1px solid rgba(196, 181, 253, 0.4)',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  boxShadow: '0 0 15px rgba(124, 58, 237, 0.35)',
                }}
              >
                <span>🎓 Join Ground School</span>
              </button>
            )}

            <button
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: 'none',
                color: '#94a3b8',
                borderRadius: '10px',
                padding: '8px',
                cursor: 'pointer',
              }}
              title="Close Depot"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* FEEDBACK POPUP NOTICE */}
        {actionFeedback && (
          <div
            style={{
              padding: '10px 24px',
              backgroundColor: actionFeedback.includes('❌') ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              color: actionFeedback.includes('❌') ? '#fca5a5' : '#86efac',
              fontSize: '0.85rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              animation: 'fadeIn 0.2s ease',
            }}
          >
            {actionFeedback.includes('❌') ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
            <span>{actionFeedback}</span>
          </div>
        )}

        {/* NAVIGATION TABS */}
        <div
          style={{
            display: 'flex',
            backgroundColor: '#0a0f1d',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '0 16px',
            gap: '8px',
          }}
        >
          <button
            onClick={() => { setActiveTab('MARKET'); soundFx.playClick(700); }}
            style={{
              padding: '14px 20px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'MARKET' ? '3px solid #38bdf8' : '3px solid transparent',
              color: activeTab === 'MARKET' ? '#38bdf8' : '#94a3b8',
              fontWeight: activeTab === 'MARKET' ? 800 : 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.9rem',
            }}
          >
            <ShoppingBag size={16} />
            <span>Equipment Market (Buy / Sell)</span>
          </button>

          <button
            onClick={() => { setActiveTab('FACILITIES'); soundFx.playClick(700); }}
            style={{
              padding: '14px 20px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'FACILITIES' ? '3px solid #a78bfa' : '3px solid transparent',
              color: activeTab === 'FACILITIES' ? '#a78bfa' : '#94a3b8',
              fontWeight: activeTab === 'FACILITIES' ? 800 : 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.9rem',
            }}
          >
            <Building2 size={16} />
            <span>Academy Facilities ({facilities.filter(f => f.isConstructed).length}/{facilities.length})</span>
          </button>

          <button
            onClick={() => { setActiveTab('CAMPUS_3D'); soundFx.playClick(750); }}
            style={{
              padding: '14px 20px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'CAMPUS_3D' ? '3px solid #43ffa0' : '3px solid transparent',
              color: activeTab === 'CAMPUS_3D' ? '#43ffa0' : '#94a3b8',
              fontWeight: activeTab === 'CAMPUS_3D' ? 800 : 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.9rem',
            }}
          >
            <Eye size={16} />
            <span>3D Interactive Campus View</span>
          </button>

          <button
            onClick={() => { setActiveTab('INSPECT_3D'); soundFx.playClick(750); }}
            style={{
              padding: '14px 20px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'INSPECT_3D' ? '3px solid #f59e0b' : '3px solid transparent',
              color: activeTab === 'INSPECT_3D' ? '#f59e0b' : '#94a3b8',
              fontWeight: activeTab === 'INSPECT_3D' ? 800 : 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.9rem',
            }}
          >
            <RotateCw size={16} />
            <span>Realistic 3D Equipment Inspector</span>
          </button>
        </div>

        {/* ── TAB 1: EQUIPMENT MARKET (BUY & SELL) ─────────────────────────────────── */}
        {activeTab === 'MARKET' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 440px', flex: 1, minHeight: 0, overflow: 'hidden' }}>
            {/* Left Inventory & Catalog */}
            <div style={{ padding: '20px', overflowY: 'auto', borderRight: '1px solid rgba(255, 255, 255, 0.08)' }}>
              {/* Category Filter Pills */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                {(['ALL', 'SUITS', 'LIFE_SUPPORT', 'POWER', 'TRAINING', 'SCIENCE'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => { setSelectedCategory(cat); soundFx.playClick(650); }}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '8px',
                      border: selectedCategory === cat ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.1)',
                      backgroundColor: selectedCategory === cat ? 'rgba(56, 189, 248, 0.18)' : 'rgba(255, 255, 255, 0.04)',
                      color: selectedCategory === cat ? '#38bdf8' : '#94a3b8',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {cat.replace('_', ' ')}
                  </button>
                ))}
              </div>

              {/* Items Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '14px' }}>
                {filteredCatalog.map((item) => {
                  const isSelected = selectedItem.id === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => { setSelectedItem(item); soundFx.playClick(750); }}
                      style={{
                        padding: '16px',
                        borderRadius: '14px',
                        backgroundColor: isSelected ? 'rgba(56, 189, 248, 0.12)' : '#0d1322',
                        border: isSelected ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '12px',
                        transition: 'all 0.18s ease',
                        boxShadow: isSelected ? '0 0 20px rgba(56, 189, 248, 0.25)' : 'none',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                          <span style={{ fontSize: '1.8rem' }}>{item.icon}</span>
                          <span
                            style={{
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '4px',
                              backgroundColor: item.equipped ? 'rgba(16, 185, 129, 0.2)' : 'rgba(148, 163, 184, 0.15)',
                              color: item.equipped ? '#43ffa0' : '#94a3b8',
                              border: `1px solid ${item.equipped ? '#10b981' : 'rgba(255, 255, 255, 0.1)'}`,
                            }}
                          >
                            {item.equipped ? '✓ EQUIPPED' : 'UNOWNED'}
                          </span>
                        </div>
                        <h4 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#f8fafc', margin: '0 0 6px 0' }}>
                          {item.name}
                        </h4>
                        <p style={{ fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.4, margin: 0, height: '38px', overflow: 'hidden' }}>
                          {item.description}
                        </p>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                        <div>
                          <div style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase' }}>Buy / Sell</div>
                          <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#fbbf24', fontFamily: 'monospace' }}>
                            {item.buyPrice} <span style={{ color: '#64748b' }}>/</span> +{item.sellPrice} CC
                          </div>
                        </div>

                        {item.equipped ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSellItem(item);
                            }}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '8px',
                              backgroundColor: 'rgba(239, 68, 68, 0.15)',
                              border: '1px solid rgba(239, 68, 68, 0.4)',
                              color: '#fca5a5',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <ArrowRightLeft size={12} />
                            <span>Sell (+{item.sellPrice})</span>
                          </button>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleBuyItem(item);
                            }}
                            disabled={credits < item.buyPrice}
                            style={{
                              padding: '6px 14px',
                              borderRadius: '8px',
                              backgroundColor: credits < item.buyPrice ? 'rgba(255, 255, 255, 0.05)' : '#0284c7',
                              border: 'none',
                              color: credits < item.buyPrice ? '#64748b' : '#ffffff',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              cursor: credits < item.buyPrice ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <ShoppingBag size={12} />
                            <span>Buy ({item.buyPrice})</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Live 3D Equipment Inspector & Specs Panel */}
            <div style={{ backgroundColor: '#090d19', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
              {/* 3D Canvas Viewport */}
              <div style={{ height: '310px', position: 'relative', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <canvas ref={inspectCanvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
                <div
                  style={{
                    position: 'absolute',
                    top: '12px',
                    left: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(15, 23, 42, 0.85)',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    fontSize: '0.7rem',
                    color: '#38bdf8',
                    fontWeight: 700,
                  }}
                >
                  <RotateCw size={12} />
                  <span>Interactive 3D Inspector · Drag to rotate, Scroll to zoom</span>
                </div>

                <button
                  onClick={() => setWireframeMode(!wireframeMode)}
                  style={{
                    position: 'absolute',
                    bottom: '12px',
                    right: '12px',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    backgroundColor: wireframeMode ? '#38bdf8' : 'rgba(15, 23, 42, 0.85)',
                    color: wireframeMode ? '#020617' : '#94a3b8',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {wireframeMode ? 'Wireframe ON' : 'Wireframe OFF'}
                </button>
              </div>

              {/* Item Details & Specs Sheet */}
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.7rem', color: '#a78bfa', fontWeight: 800, textTransform: 'uppercase' }}>
                      {selectedItem.category} CLASSIFICATION
                    </span>
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                      Mass: {selectedItem.massKg} kg
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc', margin: '4px 0 8px 0' }}>
                    {selectedItem.name}
                  </h3>
                  <p style={{ fontSize: '0.82rem', color: '#cbd5e1', lineHeight: 1.5, margin: 0 }}>
                    {selectedItem.description}
                  </p>
                </div>

                {/* NASA Baseline Technical Specs Table */}
                <div
                  style={{
                    backgroundColor: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '10px',
                    padding: '12px',
                  }}
                >
                  <div style={{ fontSize: '0.7rem', color: '#38bdf8', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px' }}>
                    NASA Engineering Specifications
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {Object.entries(selectedItem.specs).map(([key, val]) => (
                      <div key={key} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                        <span style={{ color: '#94a3b8' }}>{key}:</span>
                        <span style={{ color: '#f1f5f9', fontWeight: 700, fontFamily: 'monospace' }}>{val}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* NASA Historical Fact Card */}
                <div
                  style={{
                    backgroundColor: 'rgba(56, 189, 248, 0.06)',
                    border: '1px solid rgba(56, 189, 248, 0.2)',
                    borderRadius: '10px',
                    padding: '12px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                  }}
                >
                  <Sparkles size={18} className="text-sky-400 shrink-0 mt-0.5" />
                  <div style={{ fontSize: '0.78rem', color: '#cbd5e1', lineHeight: 1.45 }}>
                    <strong style={{ color: '#38bdf8' }}>NASA Mission Archive: </strong>
                    {selectedItem.nasaFact}
                  </div>
                </div>

                {/* Purchase / Resale Action Bar */}
                <div style={{ marginTop: 'auto', paddingTop: '10px' }}>
                  {selectedItem.equipped ? (
                    <button
                      onClick={() => handleSellItem(selectedItem)}
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '10px',
                        backgroundColor: 'rgba(239, 68, 68, 0.2)',
                        border: '1px solid #ef4444',
                        color: '#fca5a5',
                        fontWeight: 800,
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                      }}
                    >
                      <ArrowRightLeft size={16} />
                      <span>Sell Back to NASA Depot (+{selectedItem.sellPrice} CC)</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleBuyItem(selectedItem)}
                      disabled={credits < selectedItem.buyPrice}
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '10px',
                        background: credits < selectedItem.buyPrice ? 'rgba(255, 255, 255, 0.1)' : 'linear-gradient(135deg, #0284c7, #10b981)',
                        border: 'none',
                        color: credits < selectedItem.buyPrice ? '#64748b' : '#ffffff',
                        fontWeight: 800,
                        fontSize: '0.95rem',
                        cursor: credits < selectedItem.buyPrice ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        boxShadow: credits < selectedItem.buyPrice ? 'none' : '0 0 20px rgba(56, 189, 248, 0.4)',
                      }}
                    >
                      <ShoppingBag size={18} />
                      <span>Purchase &amp; Equip to Academy ({selectedItem.buyPrice} CC)</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 2: ACADEMY FACILITIES (BUILD & UPGRADE) ─────────────────────────── */}
        {activeTab === 'FACILITIES' && (
          <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
            <div style={{ maxWidth: '1080px', margin: '0 auto' }}>
              {/* Academy Master Blueprint Progress Banner */}
              {(() => {
                const builtCount = facilities.filter((f) => f.isConstructed).length;
                const pct = Math.round((builtCount / facilities.length) * 100);
                const isFullyAccredited = builtCount === facilities.length;

                return (
                  <div
                    style={{
                      padding: '18px 22px',
                      borderRadius: '16px',
                      background: isFullyAccredited
                        ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(6, 182, 212, 0.2))'
                        : 'linear-gradient(135deg, rgba(124, 58, 237, 0.18), rgba(56, 189, 248, 0.15))',
                      border: `1px solid ${isFullyAccredited ? '#10b981' : 'rgba(167, 139, 250, 0.35)'}`,
                      marginBottom: '20px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '1.4rem' }}>{isFullyAccredited ? '🏆' : '🏛️'}</span>
                        <div>
                          <div style={{ fontSize: '0.68rem', fontWeight: 800, color: isFullyAccredited ? '#43ffa0' : '#c4b5fd', textTransform: 'uppercase' }}>
                            {isFullyAccredited ? 'NASA FULL ASTRONAUT ACADEMY ACCREDITED' : 'ACADEMY MASTER BLUEPRINT IN PROGRESS'}
                          </div>
                          <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#f8fafc' }}>
                            Full Academy Campus: {builtCount} / {facilities.length} Stations Active ({pct}%)
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '1.2rem', fontWeight: 900, color: isFullyAccredited ? '#43ffa0' : '#fbbf24', fontFamily: 'monospace' }}>
                          {pct}% COMPLETE
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div style={{ width: '100%', height: '8px', backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '999px', overflow: 'hidden', marginBottom: '8px' }}>
                      <div
                        style={{
                          width: `${pct}%`,
                          height: '100%',
                          background: isFullyAccredited ? 'linear-gradient(90deg, #10b981, #06b6d4)' : 'linear-gradient(90deg, #7c3aed, #38bdf8)',
                          boxShadow: '0 0 10px rgba(56, 189, 248, 0.5)',
                          transition: 'width 0.3s ease',
                        }}
                      />
                    </div>

                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      To complete a world-class Academy, construct all 12 Earth Analog Conditioning Chambers and Deep-Space Research Outposts.
                    </div>
                  </div>
                );
              })()}

              {/* Facility Category Filter Buttons */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '18px' }}>
                {(['ALL', 'TRAINING', 'LIFE_SUPPORT', 'SCIENCE', 'FLIGHT'] as const).map((cat) => {
                  const count = cat === 'ALL' ? facilities.length : facilities.filter((f) => f.category === cat).length;
                  return (
                    <button
                      key={cat}
                      onClick={() => { setFacCategory(cat); soundFx.playClick(650); }}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '8px',
                        border: facCategory === cat ? '1px solid #7c3aed' : '1px solid rgba(255, 255, 255, 0.1)',
                        backgroundColor: facCategory === cat ? 'rgba(124, 58, 237, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                        color: facCategory === cat ? '#c4b5fd' : '#94a3b8',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      {cat.replace('_', ' ')} ({count})
                    </button>
                  );
                })}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
                {facilities
                  .filter((fac) => facCategory === 'ALL' || fac.category === facCategory)
                  .map((fac) => (
                  <div
                    key={fac.id}
                    style={{
                      padding: '20px',
                      borderRadius: '16px',
                      backgroundColor: fac.isConstructed ? '#0b1120' : 'rgba(15, 23, 42, 0.5)',
                      border: fac.isConstructed ? '1px solid rgba(167, 139, 250, 0.4)' : '1px dashed rgba(255, 255, 255, 0.15)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '14px',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <span style={{ fontSize: '2rem' }}>{fac.icon}</span>
                        <div
                          style={{
                            padding: '3px 10px',
                            borderRadius: '999px',
                            backgroundColor: fac.isConstructed ? 'rgba(167, 139, 250, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                            color: fac.isConstructed ? '#c4b5fd' : '#64748b',
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            fontFamily: 'monospace',
                          }}
                        >
                          {fac.isConstructed ? `LEVEL ${fac.level} / ${fac.maxLevel}` : 'UNBUILT'}
                        </div>
                      </div>

                      <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc', margin: '0 0 6px 0' }}>
                        {fac.name}
                      </h4>
                      <p style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.5, margin: '0 0 10px 0' }}>
                        {fac.description}
                      </p>

                      {/* Stat Bonus Tag */}
                      <div
                        style={{
                          padding: '6px 10px',
                          borderRadius: '8px',
                          backgroundColor: 'rgba(67, 255, 160, 0.08)',
                          border: '1px solid rgba(67, 255, 160, 0.25)',
                          color: '#43ffa0',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          marginBottom: '10px',
                        }}
                      >
                        ⚡ Bonus: {fac.bonus}
                      </div>

                      <div style={{ fontSize: '0.72rem', color: '#64748b', lineHeight: 1.4 }}>
                        <strong style={{ color: '#94a3b8' }}>NASA Analog: </strong>
                        {fac.realNasaContext}
                      </div>
                    </div>

                    <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '12px' }}>
                      {fac.level >= fac.maxLevel ? (
                        <div style={{ textAlign: 'center', padding: '10px', color: '#43ffa0', fontWeight: 800, fontSize: '0.85rem' }}>
                          ✓ Maximum Facility Tier Achieved
                        </div>
                      ) : (
                        <button
                          onClick={() => handleUpgradeFacility(fac)}
                          disabled={credits < fac.costToUpgrade}
                          style={{
                            width: '100%',
                            padding: '10px 18px',
                            borderRadius: '10px',
                            backgroundColor: credits < fac.costToUpgrade ? 'rgba(255, 255, 255, 0.06)' : '#7c3aed',
                            border: 'none',
                            color: credits < fac.costToUpgrade ? '#64748b' : '#ffffff',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            cursor: credits < fac.costToUpgrade ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            boxShadow: credits < fac.costToUpgrade ? 'none' : '0 0 16px rgba(124, 58, 237, 0.4)',
                          }}
                        >
                          <Building2 size={16} />
                          <span>{fac.isConstructed ? `Upgrade to Tier ${fac.level + 1}` : 'Construct Facility'} ({fac.costToUpgrade.toLocaleString()} CC)</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 3: 3D INTERACTIVE CAMPUS VIEW ──────────────────────────────────── */}
        {activeTab === 'CAMPUS_3D' && (
          <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column' }}>
            <canvas ref={campusCanvasRef} style={{ width: '100%', height: '100%', flex: 1, display: 'block' }} />
            {/* Campus HUD Overlay */}
            <div
              style={{
                position: 'absolute',
                top: '16px',
                left: '20px',
                padding: '12px 18px',
                backgroundColor: 'rgba(6, 9, 19, 0.85)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                borderRadius: '12px',
                backdropFilter: 'blur(12px)',
                maxWidth: '340px',
              }}
            >
              <div style={{ fontSize: '0.7rem', color: '#38bdf8', fontWeight: 800, textTransform: 'uppercase' }}>
                Junior Astronaut Training Complex
              </div>
              <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#f8fafc', margin: '4px 0' }}>
                Houston Space Center Campus Analog
              </h4>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0, lineHeight: 1.4 }}>
                Left-Click + Drag to rotate orbital camera · Right-Click to pan · Scroll wheel to zoom in on training pods.
              </p>
            </div>
          </div>
        )}

        {/* ── TAB 4: REALISTIC 3D EQUIPMENT INSPECTOR ────────────────────────────── */}
        {activeTab === 'INSPECT_3D' && (
          <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column' }}>
            <canvas ref={inspectCanvasRef} style={{ width: '100%', height: '100%', flex: 1, display: 'block' }} />
            {/* Inspector Selector Overlay */}
            <div
              style={{
                position: 'absolute',
                bottom: '20px',
                left: '20px',
                right: '20px',
                display: 'flex',
                gap: '10px',
                overflowX: 'auto',
                padding: '10px',
                backgroundColor: 'rgba(6, 9, 19, 0.85)',
                borderRadius: '14px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(12px)',
              }}
            >
              {catalog.map((item) => (
                <button
                  key={item.id}
                  onClick={() => { setSelectedItem(item); soundFx.playClick(750); }}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: selectedItem.id === item.id ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.1)',
                    backgroundColor: selectedItem.id === item.id ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                    color: selectedItem.id === item.id ? '#38bdf8' : '#cbd5e1',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span>{item.icon}</span>
                  <span>{item.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ── PROCEDURAL 3D FALLBACK GENERATOR ──────────────────────────────────────────
function buildProcedural3DModel(group: THREE.Group, itemId: string, isWireframe: boolean) {
  group.clear();

  if (itemId === 'item-kilopower-reactor') {
    // Nuclear Core Cylinder + Stirling Radiators
    const coreMat = new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.9, roughness: 0.2, wireframe: isWireframe });
    const core = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 1.4, 24), coreMat);
    core.position.y = 0.2;

    const radMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.7, roughness: 0.3, wireframe: isWireframe });
    const cone = new THREE.Mesh(new THREE.ConeGeometry(1.4, 1.2, 24, 1, true), radMat);
    cone.position.y = 1.0;

    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.0, 0.4, 24), new THREE.MeshStandardMaterial({ color: 0x334155, wireframe: isWireframe }));
    base.position.y = -0.6;
    group.add(core, cone, base);
  } else if (itemId === 'item-spectrometer-drill') {
    // Rotary Drill Mast + Sample Pod
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.0, 16), new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8, wireframe: isWireframe }));
    const drillBit = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.4, 16), new THREE.MeshStandardMaterial({ color: 0x0284c7, wireframe: isWireframe }));
    drillBit.position.y = -1.1;
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.8, 0.5), new THREE.MeshStandardMaterial({ color: 0x1e293b, wireframe: isWireframe }));
    body.position.y = 0.4;
    group.add(mast, drillBit, body);
  } else {
    // High-tech futuristic sensor module
    const mainGeo = new THREE.DodecahedronGeometry(1.0, 0);
    const mainMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.85, roughness: 0.25, wireframe: isWireframe });
    const mesh = new THREE.Mesh(mainGeo, mainMat);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.4, 0.06, 16, 64), new THREE.MeshStandardMaterial({ color: 0xf59e0b, wireframe: isWireframe }));
    group.add(mesh, ring);
  }
}
