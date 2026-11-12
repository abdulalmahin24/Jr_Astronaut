import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import confetti from 'canvas-confetti';
import {
  X,
  Award,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';
import { ASTRONAUT_CLASSES, type ClassroomLesson } from '../data/astronautClasses';
import { soundFx } from '../utils/audioEffects';
import { disposeThreeScene } from '../utils/threeDisposeHelper';
import { NasaSpaceScienceLabModal } from './NasaSpaceScienceLabModal';
import { ComicVideoPlayer } from './ComicVideoPlayer';
import { ComicBookModal } from './ComicBookModal';
import { COMIC_BOOK_ISSUES, type ComicIssue } from '../data/comicBooks';

interface AstronautClassroomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenDepot?: () => void;
  initialTab?: 'LESSONS' | 'COMIC_VIDEOS' | 'SCIENCE_LAB';
  initialComicIssueId?: string;
}

export const AstronautClassroomModal: React.FC<AstronautClassroomModalProps> = ({
  isOpen,
  onClose,
  onOpenDepot,
  initialTab = 'LESSONS',
  initialComicIssueId,
}) => {
  const [activeClassroomTab, setActiveClassroomTab] = useState<'LESSONS' | 'COMIC_VIDEOS' | 'SCIENCE_LAB'>(initialTab);
  const [selectedComicIssueId, setSelectedComicIssueId] = useState<string>(initialComicIssueId || COMIC_BOOK_ISSUES[0].id);
  const [isComicReaderOpen, setIsComicReaderOpen] = useState<boolean>(false);
  const [selectedClassId, setSelectedClassId] = useState<string>(ASTRONAUT_CLASSES[0].id);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);
  const [checklistState, setChecklistState] = useState<Record<string, boolean>>({});

  // Persistence: Completed Classes & Wings
  const [completedClasses, setCompletedClasses] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('astro_camp_completed_classes');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [callsign] = useState<string>(() => {
    try {
      return localStorage.getItem('astro_camp_callsign') || 'Cadet Explorer';
    } catch {
      return 'Cadet Explorer';
    }
  });

  // 3D Canvas Ref for Interactive Classroom View
  const classroomCanvasRef = useRef<HTMLCanvasElement>(null);

  const activeLesson: ClassroomLesson =
    ASTRONAUT_CLASSES.find((c) => c.id === selectedClassId) || ASTRONAUT_CLASSES[0];

  const isClassCompleted = completedClasses.includes(activeLesson.id);
  const hasEarnedWings = completedClasses.length === ASTRONAUT_CLASSES.length;

  // Reset local quiz state when switching lessons
  useEffect(() => {
    setSelectedAnswer(null);
    setQuizSubmitted(isClassCompleted);
    // Initialize checklist
    const initialChecklist: Record<string, boolean> = {};
    activeLesson.flightChecklist.forEach((_, idx) => {
      initialChecklist[`${activeLesson.id}-${idx}`] = isClassCompleted;
    });
    setChecklistState(initialChecklist);
  }, [activeLesson.id, isClassCompleted]);

  // ── 3D CLASSROOM / GROUND SCHOOL ENVIRONMENT (Three.js) ────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    const canvas = classroomCanvasRef.current;
    if (!canvas) return;

    const width = canvas.parentElement?.clientWidth || 500;
    const height = canvas.parentElement?.clientHeight || 300;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050814);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 4, 9);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2.05;
    controls.target.set(0, 1.2, 0);

    // Ambient & Directional Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const spotlight = new THREE.SpotLight(0x38bdf8, 2.5);
    spotlight.position.set(0, 8, 4);
    spotlight.angle = Math.PI / 3;
    scene.add(spotlight);

    // Classroom Floor
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(24, 20),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.6, metalness: 0.3 })
    );
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    // Front Blackboard / Flight Trajectory Screen
    const screenGeo = new THREE.BoxGeometry(10, 4.5, 0.15);
    const screenMat = new THREE.MeshStandardMaterial({
      color: 0x020617,
      metalness: 0.8,
      roughness: 0.2,
    });
    const screenMesh = new THREE.Mesh(screenGeo, screenMat);
    screenMesh.position.set(0, 3.2, -5.5);
    scene.add(screenMesh);

    // Screen Border Glow
    const borderMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const screenBorder = new THREE.Mesh(new THREE.BoxGeometry(10.2, 4.7, 0.1), borderMat);
    screenBorder.position.set(0, 3.2, -5.6);
    scene.add(screenBorder);

    // Central Holographic Platform
    const holoPedestal = new THREE.Mesh(
      new THREE.CylinderGeometry(1.6, 1.8, 0.3, 32),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8 })
    );
    holoPedestal.position.set(0, 0.15, -1);
    scene.add(holoPedestal);

    // Floating Holographic 3D Model Group (switches per lesson)
    const holoGroup = new THREE.Group();
    holoGroup.position.set(0, 1.8, -1);
    scene.add(holoGroup);

    // Dynamic 3D model generation based on activeLesson.id
    if (activeLesson.id === 'class-1-who-becomes-astronaut') {
      // 3D Astronaut Suit & Helmet Model
      // Helmet
      const helmet = new THREE.Mesh(
        new THREE.SphereGeometry(0.7, 32, 24),
        new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.3, metalness: 0.2 })
      );
      helmet.position.set(0, 0.5, 0);
      holoGroup.add(helmet);

      // Gold reflective visor
      const visor = new THREE.Mesh(
        new THREE.SphereGeometry(0.55, 24, 16, 0, Math.PI, 0, Math.PI * 0.7),
        new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.95, roughness: 0.1 })
      );
      visor.rotation.x = Math.PI / 2;
      visor.rotation.z = Math.PI / 2;
      visor.position.set(0, 0.5, 0.25);
      holoGroup.add(visor);

      // Torso
      const torso = new THREE.Mesh(
        new THREE.CylinderGeometry(0.55, 0.65, 0.9, 24),
        new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.5 })
      );
      torso.position.set(0, -0.3, 0);
      holoGroup.add(torso);

      // Life support backpack (PLSS)
      const plss = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 0.9, 0.45),
        new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.5 })
      );
      plss.position.set(0, -0.2, -0.45);
      holoGroup.add(plss);

      // Orbiting Golden Wings Ring
      const wingRing = new THREE.Mesh(
        new THREE.TorusGeometry(1.3, 0.03, 16, 64),
        new THREE.MeshBasicMaterial({ color: 0xfbbf24 })
      );
      wingRing.rotation.x = Math.PI / 3;
      holoGroup.add(wingRing);
    } else if (activeLesson.id === 'class-2-spacecraft-systems') {
      // 3D Spacecraft Habitation & Life-Support Module
      const habCore = new THREE.Mesh(
        new THREE.CylinderGeometry(0.8, 0.8, 1.8, 32),
        new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.2 })
      );
      habCore.rotation.z = Math.PI / 2;
      holoGroup.add(habCore);

      // Glowing ECLSS Flow Loops
      const loopO2 = new THREE.Mesh(
        new THREE.TorusGeometry(1.05, 0.04, 16, 64),
        new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
      );
      holoGroup.add(loopO2);

      const loopH2O = new THREE.Mesh(
        new THREE.TorusGeometry(1.2, 0.04, 16, 64),
        new THREE.MeshBasicMaterial({ color: 0x43ffa0 })
      );
      loopH2O.rotation.x = Math.PI / 2.5;
      holoGroup.add(loopH2O);

      // Solar Array Wings
      const solarL = new THREE.Mesh(
        new THREE.BoxGeometry(1.6, 0.02, 0.6),
        new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.9 })
      );
      solarL.position.set(-1.7, 0, 0);
      holoGroup.add(solarL);

      const solarR = solarL.clone();
      solarR.position.set(1.7, 0, 0);
      holoGroup.add(solarR);
    } else if (activeLesson.id === 'class-3-launch-dynamics') {
      // 3D Heavy Lift Multi-Stage Rocket
      const rocketBody = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35, 0.35, 2.2, 32),
        new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 })
      );
      holoGroup.add(rocketBody);

      // Nose cone
      const noseCone = new THREE.Mesh(
        new THREE.ConeGeometry(0.35, 0.7, 32),
        new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.3 })
      );
      noseCone.position.set(0, 1.45, 0);
      holoGroup.add(noseCone);

      // Twin Solid Rocket Boosters (SRBs)
      const srbL = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.18, 1.8, 24),
        new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.4 })
      );
      srbL.position.set(-0.55, -0.2, 0);
      holoGroup.add(srbL);

      const srbR = srbL.clone();
      srbR.position.set(0.55, -0.2, 0);
      holoGroup.add(srbR);

      // Thrust Engine Plume Fire
      const engineFlame = new THREE.Mesh(
        new THREE.ConeGeometry(0.4, 0.8, 16),
        new THREE.MeshBasicMaterial({ color: 0xf97316 })
      );
      engineFlame.rotation.x = Math.PI;
      engineFlame.position.set(0, -1.5, 0);
      holoGroup.add(engineFlame);
    } else if (activeLesson.id === 'class-4-orbital-docking') {
      // 3D International Docking Adapter (IDA) & Alignment Cone
      const dockingRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.8, 0.12, 16, 48),
        new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.85 })
      );
      holoGroup.add(dockingRing);

      // 3 Guide Petals
      for (let i = 0; i < 3; i++) {
        const petal = new THREE.Mesh(
          new THREE.BoxGeometry(0.15, 0.5, 0.08),
          new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.8 })
        );
        const angle = (i * Math.PI * 2) / 3;
        petal.position.set(Math.cos(angle) * 0.8, Math.sin(angle) * 0.8, 0.2);
        petal.rotation.z = angle + Math.PI / 2;
        petal.rotation.x = -0.3;
        holoGroup.add(petal);
      }

      // Green Laser Guidance Alignment Cone
      const laserCone = new THREE.Mesh(
        new THREE.ConeGeometry(0.75, 1.8, 16, 1, true),
        new THREE.MeshBasicMaterial({ color: 0x22c55e, wireframe: true, transparent: true, opacity: 0.45 })
      );
      laserCone.rotation.x = -Math.PI / 2;
      laserCone.position.set(0, 0, 0.9);
      holoGroup.add(laserCone);
    } else if (activeLesson.id === 'class-5-lunar-landing') {
      // 3D Lunar Lander Descent Module
      const landerCore = new THREE.Mesh(
        new THREE.CylinderGeometry(0.7, 0.75, 0.7, 8),
        new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.9, roughness: 0.2 })
      );
      holoGroup.add(landerCore);

      const cabin = new THREE.Mesh(
        new THREE.CylinderGeometry(0.5, 0.6, 0.6, 16),
        new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.5 })
      );
      cabin.position.set(0, 0.65, 0);
      holoGroup.add(cabin);

      // 4 Landing Struts & Footpads
      for (let i = 0; i < 4; i++) {
        const leg = new THREE.Mesh(
          new THREE.CylinderGeometry(0.04, 0.04, 1.1, 12),
          new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.8 })
        );
        const angle = (i * Math.PI) / 2 + Math.PI / 4;
        leg.position.set(Math.cos(angle) * 0.8, -0.4, Math.sin(angle) * 0.8);
        leg.rotation.z = Math.cos(angle) * 0.6;
        leg.rotation.x = Math.sin(angle) * 0.6;
        holoGroup.add(leg);

        const pad = new THREE.Mesh(
          new THREE.CylinderGeometry(0.18, 0.18, 0.04, 16),
          new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.8 })
        );
        pad.position.set(Math.cos(angle) * 1.15, -0.85, Math.sin(angle) * 1.15);
        holoGroup.add(pad);
      }

      // Descent Engine Plume
      const flame = new THREE.Mesh(
        new THREE.ConeGeometry(0.3, 0.6, 16),
        new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.8 })
      );
      flame.rotation.x = Math.PI;
      flame.position.set(0, -0.65, 0);
      holoGroup.add(flame);
    } else {
      // 3D Planetary Surface Rover
      const roverBody = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 0.5, 0.9),
        new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 })
      );
      holoGroup.add(roverBody);

      // Mast & Camera
      const mast = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.04, 0.8, 12),
        new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8 })
      );
      mast.position.set(0.4, 0.5, 0);
      holoGroup.add(mast);

      const cameraHead = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 0.12, 0.25),
        new THREE.MeshStandardMaterial({ color: 0x0284c7 })
      );
      cameraHead.position.set(0.4, 0.9, 0);
      holoGroup.add(cameraHead);

      // 6 Wheels
      const wheelGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.12, 16);
      const wheelMat = new THREE.MeshStandardMaterial({ color: 0x475569, wireframe: true });
      const wheelPositions = [
        [-0.55, -0.3, 0.55],
        [0, -0.3, 0.55],
        [0.55, -0.3, 0.55],
        [-0.55, -0.3, -0.55],
        [0, -0.3, -0.55],
        [0.55, -0.3, -0.55],
      ];
      wheelPositions.forEach(([x, y, z]) => {
        const w = new THREE.Mesh(wheelGeo, wheelMat);
        w.rotation.x = Math.PI / 2;
        w.position.set(x, y, z);
        holoGroup.add(w);
      });
    }

    let animId: number;
    let t = 0;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      t += 0.015;
      controls.update();
      holoGroup.rotation.y = t * 0.6;
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!canvas.parentElement) return;
      const w = canvas.parentElement.clientWidth;
      const h = canvas.parentElement.clientHeight || 300;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      disposeThreeScene(renderer, scene, canvas.parentElement);
    };
  }, [isOpen, selectedClassId]);

  // ── TOGGLE CHECKLIST ──────────────────────────────────────────────────────────
  const handleToggleChecklist = (key: string) => {
    soundFx.playClick(800);
    setChecklistState((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // ── SUBMIT EXAM ───────────────────────────────────────────────────────────────
  const handleSubmitExam = () => {
    if (selectedAnswer === null) return;
    setQuizSubmitted(true);

    if (selectedAnswer === activeLesson.exam.correctIndex) {
      soundFx.playVictory();
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.65 } });

      if (!completedClasses.includes(activeLesson.id)) {
        const nextCompleted = [...completedClasses, activeLesson.id];
        setCompletedClasses(nextCompleted);
        try {
          localStorage.setItem('astro_camp_completed_classes', JSON.stringify(nextCompleted));
          // Award Cadet Credits
          const currCredits = parseInt(localStorage.getItem('astro_camp_cadet_credits') || '30000', 10);
          localStorage.setItem('astro_camp_cadet_credits', (currCredits + activeLesson.rewardCredits).toString());
        } catch (e) {
          console.warn('Storage save error', e);
        }
      }
    } else {
      soundFx.playImpact();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 11000 }}>
      <div
        className="modal-container"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '1280px',
          width: '96vw',
          maxHeight: '94vh',
          backgroundColor: '#050814',
          border: '1px solid rgba(167, 139, 250, 0.45)',
          borderRadius: '20px',
          display: 'flex',
          flexDirection: 'column',
          padding: '0',
          overflow: 'hidden',
          boxShadow: '0 0 60px rgba(0, 0, 0, 0.95), 0 0 30px rgba(124, 58, 237, 0.25)',
        }}
      >
        {/* TOP STATUS BAR */}
        <div
          style={{
            padding: '16px 24px',
            backgroundColor: '#090d1f',
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
                background: 'linear-gradient(135deg, #7c3aed, #0284c7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.4rem',
                boxShadow: '0 0 15px rgba(124, 58, 237, 0.4)',
              }}
            >
              🎓
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#a78bfa', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                NASA Ground School &amp; Astronaut Flight Academy
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
                {activeClassroomTab === 'LESSONS' && 'Ground School: Flight Training & Spacecraft Systems'}
                {activeClassroomTab === 'COMIC_VIDEOS' && 'Kid Cadet Motion Comic Cinema: 6 Animated STEM Missions'}
                {activeClassroomTab === 'SCIENCE_LAB' && 'NASA Space Science & Biology Laboratory'}
              </h2>
            </div>
          </div>

          {/* Classroom Switcher Tabs */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(255,255,255,0.05)',
              padding: '4px',
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <button
              onClick={() => {
                setActiveClassroomTab('LESSONS');
                soundFx.playClick(750);
              }}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: activeClassroomTab === 'LESSONS' ? '1.5px solid #a855f7' : '1px solid transparent',
                background: activeClassroomTab === 'LESSONS' ? 'rgba(168, 85, 247, 0.28)' : 'transparent',
                color: activeClassroomTab === 'LESSONS' ? '#e9d5ff' : '#94a3b8',
                fontSize: '0.8rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease',
              }}
            >
              <span>📚</span>
              <span>Flight Lessons (6)</span>
            </button>

            <button
              onClick={() => {
                setActiveClassroomTab('COMIC_VIDEOS');
                soundFx.playClick(750);
              }}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: activeClassroomTab === 'COMIC_VIDEOS' ? '1.5px solid #f59e0b' : '1px solid transparent',
                background: activeClassroomTab === 'COMIC_VIDEOS' ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.35), rgba(234, 88, 12, 0.25))' : 'transparent',
                color: activeClassroomTab === 'COMIC_VIDEOS' ? '#fbbf24' : '#94a3b8',
                fontSize: '0.8rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease',
                boxShadow: activeClassroomTab === 'COMIC_VIDEOS' ? '0 0 14px rgba(245, 158, 11, 0.4)' : 'none',
              }}
            >
              <span>🎬</span>
              <span>Animated Comic Videos (6)</span>
            </button>

            <button
              onClick={() => {
                setActiveClassroomTab('SCIENCE_LAB');
                soundFx.playClick(750);
              }}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: activeClassroomTab === 'SCIENCE_LAB' ? '1.5px solid #10b981' : '1px solid transparent',
                background: activeClassroomTab === 'SCIENCE_LAB' ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.3), rgba(6, 182, 212, 0.25))' : 'transparent',
                color: activeClassroomTab === 'SCIENCE_LAB' ? '#6ee7b7' : '#94a3b8',
                fontSize: '0.8rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease',
                boxShadow: activeClassroomTab === 'SCIENCE_LAB' ? '0 0 14px rgba(16, 185, 129, 0.35)' : 'none',
              }}
            >
              <span>🔬</span>
              <span>Space Science &amp; Biology Lab (5)</span>
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Progress Badge Counter */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                backgroundColor: 'rgba(167, 139, 250, 0.12)',
                border: '1px solid rgba(167, 139, 250, 0.35)',
                borderRadius: '10px',
              }}
            >
              <Award size={18} className="text-violet-400" />
              <span style={{ fontSize: '0.8rem', color: '#e2e8f0', fontWeight: 700 }}>
                Syllabus:{' '}
                <span style={{ color: '#43ffa0', fontFamily: 'monospace' }}>
                  {completedClasses.length} / {ASTRONAUT_CLASSES.length} Completed
                </span>
              </span>
            </div>

            {onOpenDepot && (
              <button
                onClick={() => {
                  soundFx.playClick(750);
                  onClose();
                  onOpenDepot();
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #0284c7, #10b981)',
                  border: 'none',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  boxShadow: '0 0 15px rgba(56, 189, 248, 0.35)',
                }}
              >
                <span>🛒 Equipment Depot (Buy/Sell)</span>
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
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* ── MAIN CONTENT LAYOUT (LESSONS VS SCIENCE LAB) ──────────────────── */}
        {activeClassroomTab === 'LESSONS' ? (
          <div style={{ display: 'grid', gridTemplateColumns: '290px 1fr 420px', flex: 1, minHeight: 0, overflow: 'hidden' }}>
            {/* Left Column: Lesson Index Navigation */}
          <div
            style={{
              backgroundColor: '#070b18',
              borderRight: '1px solid rgba(255, 255, 255, 0.08)',
              padding: '16px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>
              Core Ground School Syllabus
            </div>

            {ASTRONAUT_CLASSES.map((lesson) => {
              const isSelected = lesson.id === activeLesson.id;
              const isDone = completedClasses.includes(lesson.id);

              return (
                <button
                  key={lesson.id}
                  onClick={() => { setSelectedClassId(lesson.id); soundFx.playClick(700); }}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '12px',
                    backgroundColor: isSelected ? 'rgba(124, 58, 237, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                    border: isSelected ? '1px solid #7c3aed' : '1px solid rgba(255, 255, 255, 0.06)',
                    color: isSelected ? '#f8fafc' : '#94a3b8',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.65rem', color: isSelected ? '#c4b5fd' : '#64748b', fontWeight: 800 }}>
                      CLASS {lesson.order} · {lesson.category.replace('_', ' ')}
                    </div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: isSelected ? '#ffffff' : '#cbd5e1', lineHeight: 1.3, marginTop: '2px' }}>
                      {lesson.title}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#fbbf24', marginTop: '4px' }}>
                      +{lesson.rewardCredits.toLocaleString()} CC Reward
                    </div>
                  </div>

                  {isDone ? (
                    <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                  ) : (
                    <ChevronRight size={16} className="text-slate-600 shrink-0" />
                  )}
                </button>
              );
            })}

            {/* Astronaut Wings Trophy Card */}
            <div
              style={{
                marginTop: 'auto',
                padding: '14px',
                borderRadius: '12px',
                backgroundColor: hasEarnedWings ? 'rgba(251, 191, 36, 0.15)' : 'rgba(15, 23, 42, 0.6)',
                border: `1px solid ${hasEarnedWings ? '#fbbf24' : 'rgba(255, 255, 255, 0.1)'}`,
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '1.8rem', marginBottom: '4px' }}>{hasEarnedWings ? '🎖️' : '🔒'}</div>
              <div style={{ fontSize: '0.82rem', fontWeight: 800, color: hasEarnedWings ? '#fbbf24' : '#cbd5e1' }}>
                {hasEarnedWings ? 'NASA JUNIOR ASTRONAUT WINGS' : 'Flight Wings Locked'}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '4px' }}>
                {hasEarnedWings ? `Awarded to ${callsign}` : 'Pass all 6 classes to earn your official Wings & +10,000 CC Bonus!'}
              </div>
            </div>
          </div>

          {/* Center Column: Interactive Lecture & Flight Checklists */}
          <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Header / Instructor Profile */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingBottom: '16px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    color: '#38bdf8',
                    backgroundColor: 'rgba(56, 189, 248, 0.15)',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    textTransform: 'uppercase',
                  }}
                >
                  Class {activeLesson.order} of 6
                </span>
                <h3 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#f8fafc', margin: '6px 0 2px 0' }}>
                  {activeLesson.title}
                </h3>
                <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{activeLesson.subtitle}</div>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 14px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <span style={{ fontSize: '1.6rem' }}>{activeLesson.instructorAvatar}</span>
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f1f5f9' }}>{activeLesson.instructor}</div>
                  <div style={{ fontSize: '0.68rem', color: '#38bdf8' }}>{activeLesson.instructorRole}</div>
                </div>
              </div>
            </div>

            {/* ── KID CADET ANIMATED COMIC VIDEO CALLOUT BANNER ── */}
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.16), rgba(124, 58, 237, 0.18))',
                border: '1.5px solid rgba(245, 158, 11, 0.45)',
                borderRadius: '14px',
                padding: '12px 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #f59e0b, #ea580c)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    boxShadow: '0 0 12px rgba(245, 158, 11, 0.5)',
                  }}
                >
                  🎬
                </div>
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 900, color: '#fbbf24', letterSpacing: '0.05em' }}>
                    KID CADET MOTION COMIC VIDEO (AGES 6–10)
                  </div>
                  <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#f8fafc' }}>
                    Prefer animated storytelling? Watch this lesson as a full motion comic video with voice acting!
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  const issueMap: Record<number, string> = {
                    1: 'issue-05-hubble-repair',
                    2: 'issue-05-hubble-repair',
                    3: 'issue-01-friendship-7',
                    4: 'issue-02-gemini-8',
                    5: 'issue-03-apollo-11',
                    6: 'issue-04-mars-pathfinder',
                  };
                  setSelectedComicIssueId(issueMap[activeLesson.order] || COMIC_BOOK_ISSUES[0].id);
                  setActiveClassroomTab('COMIC_VIDEOS');
                  soundFx.playReactorStart();
                }}
                style={{
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  border: '1px solid #fbbf24',
                  color: '#0f172a',
                  fontWeight: 900,
                  fontSize: '11px',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 10px rgba(245, 158, 11, 0.35)',
                  whiteSpace: 'nowrap',
                }}
              >
                <span>▶</span>
                <span>WATCH COMIC VIDEO</span>
              </button>
            </div>

            {/* Lecture Script Blocks */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {activeLesson.lectureScript.map((sec, idx) => (
                <div
                  key={idx}
                  style={{
                    backgroundColor: '#090d1c',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: '12px',
                    padding: '16px',
                  }}
                >
                  <h4 style={{ fontSize: '1.02rem', fontWeight: 800, color: '#38bdf8', margin: '0 0 8px 0' }}>
                    {sec.heading}
                  </h4>
                  <p style={{ fontSize: '0.86rem', color: '#cbd5e1', lineHeight: 1.6, margin: 0 }}>
                    {sec.body}
                  </p>

                  {sec.callout && (
                    <div
                      style={{
                        marginTop: '12px',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(234, 88, 12, 0.12)',
                        borderLeft: '3px solid #f97316',
                        fontSize: '0.82rem',
                        color: '#fed7aa',
                        lineHeight: 1.45,
                      }}
                    >
                      {sec.callout}
                    </div>
                  )}

                  {sec.formulaOrChecklist && (
                    <div
                      style={{
                        marginTop: '12px',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(56, 189, 248, 0.1)',
                        border: '1px dashed #38bdf8',
                        fontSize: '0.82rem',
                        color: '#bae6fd',
                        fontFamily: 'monospace',
                        fontWeight: 700,
                      }}
                    >
                      {sec.formulaOrChecklist}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Step-by-Step Flight Telemetry Checklist */}
            <div
              style={{
                backgroundColor: 'rgba(15, 23, 42, 0.85)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                borderRadius: '14px',
                padding: '18px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase' }}>
                  Interactive Flight Checklists &amp; Mission Protocol
                </div>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                  Click each verification item prior to writing exam
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {activeLesson.flightChecklist.map((item, idx) => {
                  const key = `${activeLesson.id}-${idx}`;
                  const isChecked = checklistState[key];

                  return (
                    <div
                      key={idx}
                      onClick={() => handleToggleChecklist(key)}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '8px',
                        backgroundColor: isChecked ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                        border: `1px solid ${isChecked ? '#10b981' : 'rgba(255, 255, 255, 0.08)'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.84rem', fontWeight: 700, color: isChecked ? '#43ffa0' : '#f1f5f9' }}>
                          {item.step}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>
                          {item.detail}
                        </div>
                      </div>

                      <div
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '6px',
                          border: `2px solid ${isChecked ? '#10b981' : '#64748b'}`,
                          backgroundColor: isChecked ? '#10b981' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#020617',
                          fontWeight: 900,
                          fontSize: '0.75rem',
                        }}
                      >
                        {isChecked ? '✓' : ''}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: 3D Hologram Classroom Viewport + Flight Exam Quiz */}
          <div
            style={{
              backgroundColor: '#070a16',
              borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              overflowY: 'auto',
            }}
          >
            {/* 3D Realistic Classroom Hologram */}
            <div style={{ height: '260px', position: 'relative', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <canvas ref={classroomCanvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
              <div
                style={{
                  position: 'absolute',
                  top: '10px',
                  left: '12px',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(15, 23, 42, 0.85)',
                  fontSize: '0.68rem',
                  color: '#a78bfa',
                  fontWeight: 700,
                  border: '1px solid rgba(167, 139, 250, 0.3)',
                }}
              >
                {activeLesson.id === 'class-1-who-becomes-astronaut' && '3D ASCAN EMU Spacesuit & PLSS Hologram'}
                {activeLesson.id === 'class-2-spacecraft-systems' && '3D Closed-Loop ECLSS Hab Module & Conduits'}
                {activeLesson.id === 'class-3-launch-dynamics' && '3D Multi-Stage Rocket & SRB Plumes'}
                {activeLesson.id === 'class-4-orbital-docking' && '3D Docking Adapter (IDA) & Guidance Cone'}
                {activeLesson.id === 'class-5-lunar-landing' && '3D Lunar Lander Descent Stage & Engine Plume'}
                {activeLesson.id === 'class-6-surface-exploration' && '3D Artemis Polar Surface Rover & Antenna Mast'}
              </div>

              {/* Bottom Telemetry Ticker Overlay */}
              <div
                style={{
                  position: 'absolute',
                  bottom: '8px',
                  left: '10px',
                  right: '10px',
                  padding: '5px 10px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(2, 6, 23, 0.85)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.66rem',
                  fontFamily: 'monospace',
                  color: '#38bdf8',
                }}
              >
                {activeLesson.id === 'class-1-who-becomes-astronaut' && (
                  <>
                    <span>SUIT: 29.6 kPa (100% O2)</span>
                    <span style={{ color: '#43ffa0' }}>NBL: 120h LOGGED</span>
                  </>
                )}
                {activeLesson.id === 'class-2-spacecraft-systems' && (
                  <>
                    <span>RECOVERY: 98.4% CLOSURE</span>
                    <span style={{ color: '#fbbf24' }}>CATALYST: 400°C Ru</span>
                  </>
                )}
                {activeLesson.id === 'class-3-launch-dynamics' && (
                  <>
                    <span>VELOCITY: 7.82 km/s (LEO)</span>
                    <span style={{ color: '#43ffa0' }}>MAX Q: NOMINAL</span>
                  </>
                )}
                {activeLesson.id === 'class-4-orbital-docking' && (
                  <>
                    <span>CLOSURE: -0.04 m/s</span>
                    <span style={{ color: '#43ffa0' }}>ALIGN ERROR: &lt; 0.2°</span>
                  </>
                )}
                {activeLesson.id === 'class-5-lunar-landing' && (
                  <>
                    <span>V-SPEED: -1.2 m/s</span>
                    <span style={{ color: '#43ffa0' }}>H-DRIFT: 0.0 m/s</span>
                  </>
                )}
                {activeLesson.id === 'class-6-surface-exploration' && (
                  <>
                    <span>PSR CORE: H2O (5.4% wt)</span>
                    <span style={{ color: '#43ffa0' }}>WHEEL SLIP: 6% (OK)</span>
                  </>
                )}
              </div>
            </div>

            {/* Flight Certification Exam Panel */}
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.72rem', color: '#fbbf24', fontWeight: 800, textTransform: 'uppercase' }}>
                  Flight Certification Exam
                </span>
                <span style={{ fontSize: '0.75rem', color: '#43ffa0', fontWeight: 700 }}>
                  +{activeLesson.rewardCredits.toLocaleString()} CC
                </span>
              </div>

              <h4 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#f8fafc', margin: 0, lineHeight: 1.4 }}>
                {activeLesson.exam.question}
              </h4>

              {/* Options */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {activeLesson.exam.options.map((opt, idx) => {
                  const isSelected = selectedAnswer === idx;
                  const isCorrect = idx === activeLesson.exam.correctIndex;
                  let bg = 'rgba(255, 255, 255, 0.04)';
                  let border = 'rgba(255, 255, 255, 0.1)';

                  if (quizSubmitted) {
                    if (isCorrect) {
                      bg = 'rgba(16, 185, 129, 0.2)';
                      border = '#10b981';
                    } else if (isSelected) {
                      bg = 'rgba(239, 68, 68, 0.2)';
                      border = '#ef4444';
                    }
                  } else if (isSelected) {
                    bg = 'rgba(124, 58, 237, 0.25)';
                    border = '#7c3aed';
                  }

                  return (
                    <button
                      key={idx}
                      disabled={quizSubmitted}
                      onClick={() => { setSelectedAnswer(idx); soundFx.playClick(750); }}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '10px',
                        backgroundColor: bg,
                        border: `1px solid ${border}`,
                        color: '#e2e8f0',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        textAlign: 'left',
                        cursor: quizSubmitted ? 'default' : 'pointer',
                        lineHeight: 1.4,
                      }}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>

              {/* Submit Button */}
              {!quizSubmitted ? (
                <button
                  onClick={handleSubmitExam}
                  disabled={selectedAnswer === null}
                  style={{
                    padding: '12px',
                    borderRadius: '10px',
                    background: selectedAnswer === null ? 'rgba(255, 255, 255, 0.08)' : 'linear-gradient(135deg, #7c3aed, #0284c7)',
                    border: 'none',
                    color: selectedAnswer === null ? '#64748b' : '#ffffff',
                    fontWeight: 800,
                    fontSize: '0.9rem',
                    cursor: selectedAnswer === null ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: selectedAnswer === null ? 'none' : '0 0 20px rgba(124, 58, 237, 0.4)',
                  }}
                >
                  <Award size={16} />
                  <span>Submit Exam &amp; Claim Badge</span>
                </button>
              ) : (
                <div
                  style={{
                    padding: '12px',
                    borderRadius: '10px',
                    backgroundColor: selectedAnswer === activeLesson.exam.correctIndex ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    border: `1px solid ${selectedAnswer === activeLesson.exam.correctIndex ? '#10b981' : '#ef4444'}`,
                  }}
                >
                  <div style={{ fontWeight: 800, fontSize: '0.85rem', color: selectedAnswer === activeLesson.exam.correctIndex ? '#43ffa0' : '#fca5a5' }}>
                    {selectedAnswer === activeLesson.exam.correctIndex ? '✓ Correct! Exam Passed' : '✗ Incorrect Answer'}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#cbd5e1', marginTop: '6px', lineHeight: 1.45 }}>
                    {activeLesson.exam.explanation}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        ) : activeClassroomTab === 'COMIC_VIDEOS' ? (
          <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', backgroundColor: '#040711' }}>
            {/* Top Comic Video Episode Selector Strip */}
            <div
              style={{
                display: 'flex',
                gap: '8px',
                padding: '10px 20px',
                background: 'rgba(15, 23, 42, 0.95)',
                borderBottom: '1px solid rgba(245, 158, 11, 0.3)',
                overflowX: 'auto',
                flexShrink: 0,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginRight: '6px', color: '#fbbf24', fontSize: '11px', fontWeight: 900, whiteSpace: 'nowrap' }}>
                <span>🎬</span>
                <span>EPISODES:</span>
              </div>
              {COMIC_BOOK_ISSUES.map((issue) => {
                const isSelected = issue.id === selectedComicIssueId;
                return (
                  <button
                    key={issue.id}
                    onClick={() => {
                      setSelectedComicIssueId(issue.id);
                      soundFx.playClick(750);
                    }}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '8px',
                      border: isSelected ? '1.5px solid #f59e0b' : '1px solid rgba(255, 255, 255, 0.1)',
                      background: isSelected ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.35), rgba(234, 88, 12, 0.25))' : 'rgba(15, 23, 42, 0.6)',
                      color: isSelected ? '#ffffff' : '#94a3b8',
                      fontSize: '11px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.15s ease',
                      boxShadow: isSelected ? '0 0 12px rgba(245, 158, 11, 0.4)' : 'none',
                    }}
                  >
                    <span>{issue.coverBadge.split('·')[0].trim()}</span>
                    <span>·</span>
                    <span>{issue.title}</span>
                  </button>
                );
              })}
            </div>

            {/* Video Player Display */}
            <div style={{ flex: 1, minHeight: 0, position: 'relative', display: 'flex', flexDirection: 'column' }}>
              {(() => {
                const currentIssue = COMIC_BOOK_ISSUES.find((i) => i.id === selectedComicIssueId) || COMIC_BOOK_ISSUES[0];
                return (
                  <ComicVideoPlayer
                    key={currentIssue.id}
                    issue={currentIssue}
                    onClose={() => setActiveClassroomTab('LESSONS')}
                    onSwitchToReader={() => setIsComicReaderOpen(true)}
                    autoPlay={true}
                  />
                );
              })()}
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <NasaSpaceScienceLabModal embedded />
          </div>
        )}
      </div>

      {isComicReaderOpen && (
        <ComicBookModal
          isOpen={isComicReaderOpen}
          onClose={() => setIsComicReaderOpen(false)}
          initialIssueId={selectedComicIssueId}
          initialMode="reader"
        />
      )}
    </div>
  );
};
