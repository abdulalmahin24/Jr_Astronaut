import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Sparkles,
  Activity,
  Heart,
  Eye,
  Shield,
  Zap,
  Radio,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Sliders,
  ChevronRight,
  Layers,
  Thermometer,
  Compass,
  ArrowRight,
  Sun,
  Globe,
  Dna,
  FlaskConical,
} from 'lucide-react';
import { soundFx } from '../utils/audioEffects';

export interface NasaSpaceScienceLabProps {
  isOpen?: boolean;
  onClose?: () => void;
  embedded?: boolean;
  initialModule?: 'PHYSIOLOGY' | 'ORBITAL' | 'RADIATION' | 'ISRU' | 'DSN';
}

export const NasaSpaceScienceLabModal: React.FC<NasaSpaceScienceLabProps> = ({
  isOpen = true,
  onClose,
  embedded = false,
  initialModule = 'PHYSIOLOGY',
}) => {
  const [activeTab, setActiveTab] = useState<'PHYSIOLOGY' | 'ORBITAL' | 'RADIATION' | 'ISRU' | 'DSN'>(initialModule);

  // ── MODULE 1: PHYSIOLOGY STATE ──
  const [missionMonths, setMissionMonths] = useState(6);
  const [exerciseDoneToday, setExerciseDoneToday] = useState(false);
  const [showSANSBlur, setShowSANSBlur] = useState(false);

  // ── MODULE 2: ORBITAL PHYSICS STATE ──
  const [orbitEccentricity, setOrbitEccentricity] = useState(0.45);
  const [slingshotTriggered, setSlingshotTriggered] = useState(false);
  const [hohmannProgress, setHohmannProgress] = useState(0);
  const [isHohmannLaunching, setIsHohmannLaunching] = useState(false);
  const orbitCanvasRef = useRef<HTMLCanvasElement>(null);

  // ── MODULE 3: RADIATION & EMU SUIT STATE ──
  const [activeSuitLayer, setActiveSuitLayer] = useState<'ALL' | 'LCVG' | 'BLADDER' | 'TMG'>('ALL');
  const [solarFlareActive, setSolarFlareActive] = useState(false);
  const [shelterMaterial, setShelterMaterial] = useState<'POLYETHYLENE' | 'WATER' | 'LEAD'>('POLYETHYLENE');

  // ── MODULE 4: ISRU LAB STATE ──
  const [co2InputGrams, setCo2InputGrams] = useState(440);
  const [h2InputGrams, setH2InputGrams] = useState(80);
  const [sabatierRunning, setSabatierRunning] = useState(false);
  const [sabatierResult, setSabatierResult] = useState<{ ch4: number; h2o: number } | null>(null);
  const [sinteringProgress, setSinteringProgress] = useState(0);
  const [isSintering, setIsSintering] = useState(false);

  // ── MODULE 5: DSN & LIGHT DELAY STATE ──
  const [pingDestination, setPingDestination] = useState<'MOON' | 'MARS_CLOSE' | 'MARS_FAR'>('MARS_CLOSE');
  const [isPinging, setIsPinging] = useState(false);
  const [commandDelivered, setCommandDelivered] = useState(false);

  // ── CANVAS ORBIT ANIMATION (KEPLER'S LAWS) ──
  useEffect(() => {
    if (activeTab !== 'ORBITAL') return;
    const canvas = orbitCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let angle = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const a = 140; // Semi-major axis
      const e = orbitEccentricity;
      const b = a * Math.sqrt(Math.max(0.1, 1 - e * e)); // Semi-minor axis
      const c = a * e; // Focus offset

      // Draw Orbit Ellipse
      ctx.beginPath();
      ctx.ellipse(cx, cy, a, b, 0, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw Central Body (Sun / Planet at Focus F1)
      const focusX = cx - c;
      const focusY = cy;
      const sunGrad = ctx.createRadialGradient(focusX, focusY, 2, focusX, focusY, 18);
      sunGrad.addColorStop(0, '#ffffff');
      sunGrad.addColorStop(0.3, '#f59e0b');
      sunGrad.addColorStop(1, 'rgba(234, 88, 12, 0)');
      ctx.fillStyle = sunGrad;
      ctx.beginPath();
      ctx.arc(focusX, focusY, 18, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(focusX, focusY, 8, 0, Math.PI * 2);
      ctx.fill();

      // Periapsis & Apoapsis Markers
      const periX = cx - a;
      const periY = cy;
      const apoX = cx + a;
      const apoY = cy;

      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(periX, periY, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = '10px Inter, sans-serif';
      ctx.fillText('Periapsis (Fastest)', periX - 45, periY - 10);

      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(apoX, apoY, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillText('Apoapsis (Slowest)', apoX - 35, apoY - 10);

      // Kepler's 2nd Law: Angular velocity depends on distance to focus
      const shipX = cx + a * Math.cos(angle);
      const shipY = cy + b * Math.sin(angle);
      const distToFocus = Math.hypot(shipX - focusX, shipY - focusY);

      // Angular speed proportional to 1 / (r^2)
      const angularSpeed = 0.04 * (120 / Math.max(40, distToFocus));
      angle += angularSpeed;

      // Area sweep sector (Equal Area visualization)
      ctx.beginPath();
      ctx.moveTo(focusX, focusY);
      ctx.lineTo(shipX, shipY);
      ctx.lineTo(cx + a * Math.cos(angle - 0.25), cy + b * Math.sin(angle - 0.25));
      ctx.closePath();
      ctx.fillStyle = 'rgba(56, 189, 248, 0.22)';
      ctx.fill();

      // Draw Orbiting Spacecraft
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.arc(shipX, shipY, 6, 0, Math.PI * 2);
      ctx.fill();

      // Velocity Vector Arrow
      const speedMagnitude = (250 / distToFocus) * 12;
      const tanX = -a * Math.sin(angle);
      const tanY = b * Math.cos(angle);
      const tanLen = Math.hypot(tanX, tanY);
      const vx = (tanX / tanLen) * speedMagnitude;
      const vy = (tanY / tanLen) * speedMagnitude;

      ctx.beginPath();
      ctx.moveTo(shipX, shipY);
      ctx.lineTo(shipX + vx, shipY + vy);
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [activeTab, orbitEccentricity]);

  // ── HOHMANN TRANSFER RUNNER ──
  useEffect(() => {
    if (!isHohmannLaunching) return;
    const interval = setInterval(() => {
      setHohmannProgress((p) => {
        if (p >= 100) {
          setIsHohmannLaunching(false);
          soundFx.playVictory();
          return 100;
        }
        return p + 2;
      });
    }, 50);
    return () => clearInterval(interval);
  }, [isHohmannLaunching]);

  if (!isOpen && !embedded) return null;

  const contentLayout = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        color: '#f8fafc',
        fontFamily: 'Inter, system-ui, sans-serif',
        background: embedded ? 'transparent' : 'rgba(2, 6, 23, 0.96)',
      }}
    >
      {/* ── TOP HEADER (ONLY SHOWN WHEN NOT EMBEDDED) ── */}
      {!embedded && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 28px',
            background: 'var(--color-paper-2)',
            borderBottom: '1px solid var(--rule-subtle)',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: 0,
                background: 'var(--color-paper-3)',
                border: '1px solid var(--rule-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FlaskConical size={20} style={{ color: 'var(--color-accent)' }} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-ink)', margin: 0, letterSpacing: '-0.01em' }}>
                  NASA Space Science &amp; Biology Laboratory
                </h2>
                <span
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    fontFamily: 'var(--font-mono)',
                    border: '1px solid var(--color-accent-green)',
                    color: 'var(--color-accent-green)',
                    padding: '2px 8px',
                    borderRadius: 0,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  Aerospace Curriculum Verified
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-ink-faint)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                Interactive Simulation of Human Microgravity Physiology, Orbital Physics, Radiation, ISRU &amp; Deep Space Comms
              </div>
            </div>
          </div>

          {onClose && (
            <button
              onClick={() => {
                soundFx.playClick(600);
                onClose();
              }}
              aria-label="Close Laboratory"
              style={{
                background: 'transparent',
                border: '1px solid var(--rule-subtle)',
                color: 'var(--color-ink-muted)',
                width: '32px',
                height: '32px',
                borderRadius: 0,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={16} />
            </button>
          )}
        </div>
      )}

      {/* ── 5 MODULE TABS NAVIGATION ── */}
      <div
        style={{
          display: 'flex',
          gap: '4px',
          padding: embedded ? '10px 16px' : '8px 24px',
          background: 'var(--color-paper-3)',
          borderBottom: '1px solid var(--rule-subtle)',
          overflowX: 'auto',
          flexShrink: 0,
        }}
      >
        {[
          { id: 'PHYSIOLOGY', label: '1. Human Physiology', sub: 'Microgravity Bio Transformations', icon: Dna },
          { id: 'ORBITAL', label: '2. Orbital Mechanics', sub: "Kepler's Laws & Hohmann Transfer", icon: Globe },
          { id: 'RADIATION', label: '3. Radiation & Shielding', sub: 'Van Allen, SPE Flare & EMU Suit', icon: Shield },
          { id: 'ISRU', label: '4. In-Situ Utilization', sub: 'Sabatier, Regolith & Water-Ice', icon: Flame },
          { id: 'DSN', label: '5. Deep Space Comms', sub: 'Speed-of-Light Lag & DSN Dishes', icon: Radio },
        ].map((tab) => {
          const active = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                soundFx.playClick(750);
              }}
              style={{
                flex: 1,
                minWidth: '200px',
                padding: '8px 14px',
                borderRadius: 0,
                border: active ? '1px solid var(--color-accent)' : '1px solid transparent',
                background: active ? 'var(--color-paper-2)' : 'transparent',
                color: active ? 'var(--color-accent)' : 'var(--color-ink-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                textAlign: 'left',
              }}
            >
              <Icon size={18} style={{ color: active ? 'var(--color-accent)' : 'var(--color-ink-muted)', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.04em', color: active ? 'var(--color-accent)' : 'var(--color-ink)' }}>
                  {tab.label}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-ink-faint)' }}>{tab.sub}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* ── MODULE WORKSPACE VIEWPORT ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: embedded ? '20px 24px' : '24px 32px' }}>
        {/* ═══════════════════════════════════════════════════════════════════
            MODULE 1: HUMAN PHYSIOLOGY IN MICROGRAVITY
            ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'PHYSIOLOGY' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '22px', maxWidth: '1280px', margin: '0 auto' }}>
            {/* Module Overview Banner */}
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(15, 23, 42, 0.9))',
                border: '1.5px solid rgba(16, 185, 129, 0.4)',
                borderRadius: '16px',
                padding: '20px 24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '16px',
              }}
            >
              <div>
                <div style={{ fontSize: '11px', fontWeight: 900, color: '#10b981', letterSpacing: '0.05em' }}>
                  NASA HUMAN RESEARCH PROGRAM (HRP) · SPACE BIOLOGY DIRECTIVE
                </div>
                <h3 style={{ fontSize: '22px', fontWeight: 900, color: '#f8fafc', margin: '4px 0 6px 0' }}>
                  Human Physiological Adaptations in Microgravity
                </h3>
                <p style={{ fontSize: '12.5px', color: '#cbd5e1', lineHeight: '1.6', margin: 0, maxWidth: '820px' }}>
                  On Earth, gravitational stress stimulates bone remodeling and pulls fluid downward. In microgravity, bones demineralize at ~1% per month, ~2 liters of bodily fluid shift upward into the chest and head (Cephalad Fluid Shift), and inner ear otolith confusion induces acute space adaptation motion sickness.
                </p>
              </div>

              {/* Mission Duration Slider */}
              <div
                style={{
                  background: 'rgba(0,0,0,0.4)',
                  padding: '14px 20px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  minWidth: '260px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 800, marginBottom: '6px' }}>
                  <span style={{ color: '#94a3b8' }}>Mission Duration:</span>
                  <span style={{ color: '#38bdf8' }}>{missionMonths} Months</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="12"
                  value={missionMonths}
                  onChange={(e) => setMissionMonths(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#10b981', cursor: 'pointer' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9.5px', color: '#64748b', marginTop: '4px' }}>
                  <span>0 Months (Earth)</span>
                  <span>6 Months (ISS)</span>
                  <span>12 Months (Mars Transit)</span>
                </div>
              </div>
            </div>

            {/* 3 Interactive Physiology Diagnostic Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
              {/* Card 1: Bone Demineralization & Muscle Atrophy */}
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.9)',
                  border: '1.5px solid rgba(239, 68, 68, 0.4)',
                  borderRadius: '16px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '24px' }}>🦴</span>
                    <h4 style={{ fontSize: '16px', fontWeight: 900, color: '#f8fafc', margin: 0 }}>
                      Bone Demineralization &amp; Muscle Atrophy
                    </h4>
                  </div>
                  <span style={{ fontSize: '10px', fontWeight: 900, background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', padding: '3px 8px', borderRadius: '8px' }}>
                    -1% Density / Month
                  </span>
                </div>

                <p style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: '1.6', margin: 0 }}>
                  Without weight-bearing mechanical stress, osteoclasts break down bone matrix faster than osteoblasts can rebuild it. Excess calcium is leached into the bloodstream and renal filtration system, sharply increasing kidney stone risks.
                </p>

                {/* Live Biomarker Meters */}
                <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '10px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 800 }}>
                      <span style={{ color: '#94a3b8' }}>Bone Mineral Density:</span>
                      <span style={{ color: exerciseDoneToday ? '#10b981' : '#f87171' }}>
                        {exerciseDoneToday ? (100 - missionMonths * 0.2).toFixed(1) : (100 - missionMonths * 1.0).toFixed(1)}%
                      </span>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden', marginTop: '4px' }}>
                      <div
                        style={{
                          width: `${exerciseDoneToday ? 100 - missionMonths * 0.2 : 100 - missionMonths * 1.0}%`,
                          height: '100%',
                          background: exerciseDoneToday ? '#10b981' : 'linear-gradient(90deg, #ef4444, #f59e0b)',
                          transition: 'width 0.3s ease',
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 800 }}>
                      <span style={{ color: '#94a3b8' }}>Kidney Stone Formation Risk:</span>
                      <span style={{ color: missionMonths > 4 && !exerciseDoneToday ? '#ef4444' : '#f59e0b' }}>
                        {missionMonths > 4 && !exerciseDoneToday ? '⚠️ HIGH (Hypercalciuria)' : 'MODERATE / MANAGED'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Counter-measure Exercise Button (ARED) */}
                <button
                  onClick={() => {
                    setExerciseDoneToday(!exerciseDoneToday);
                    soundFx.playSuccess();
                  }}
                  style={{
                    background: exerciseDoneToday ? 'linear-gradient(135deg, #059669, #10b981)' : 'linear-gradient(135deg, #0284c7, #0369a1)',
                    border: 'none',
                    color: '#fff',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    fontSize: '11.5px',
                    fontWeight: 900,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                  }}
                >
                  <span>🏋️</span>
                  <span>{exerciseDoneToday ? '✓ ARED 2.5-Hour Resistive Workout Completed' : 'Perform 2.5-Hour ARED Counter-Measure Workout'}</span>
                </button>
              </div>

              {/* Card 2: Cephalad Fluid Shift & SANS */}
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.9)',
                  border: '1.5px solid rgba(56, 189, 248, 0.4)',
                  borderRadius: '16px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '24px' }}>🩸</span>
                    <h4 style={{ fontSize: '16px', fontWeight: 900, color: '#f8fafc', margin: 0 }}>
                      Cephalad Fluid Shift &amp; SANS Syndrome
                    </h4>
                  </div>
                  <span style={{ fontSize: '10px', fontWeight: 900, background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', padding: '3px 8px', borderRadius: '8px' }}>
                    ~2L Venous Shift
                  </span>
                </div>

                <p style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: '1.6', margin: 0 }}>
                  Without downward hydrostatic gradient, vascular fluids migrate into the upper thoracic and cranial compartments, producing facial edema (&quot;Puffy Face&quot;) and calf volume reduction (&quot;Bird Legs&quot;).
                </p>

                {/* SANS Simulation Toggle */}
                <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '10px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#38bdf8' }}>
                    👁️ SANS (Spaceflight-Associated Neuro-ocular Syndrome):
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#cbd5e1', lineHeight: '1.5' }}>
                    Elevated intracranial fluid pressure inflates the optic nerve sheath and flattens the posterior globe of the eye, inducing hyperopic visual blurring.
                  </div>

                  <button
                    onClick={() => {
                      setShowSANSBlur(!showSANSBlur);
                      soundFx.playClick(700);
                    }}
                    style={{
                      marginTop: '4px',
                      background: showSANSBlur ? 'rgba(239, 68, 68, 0.3)' : 'rgba(56, 189, 248, 0.15)',
                      border: showSANSBlur ? '1px solid #ef4444' : '1px solid #38bdf8',
                      color: showSANSBlur ? '#fca5a5' : '#7dd3fc',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontSize: '11px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                    }}
                  >
                    <Eye size={14} />
                    <span>{showSANSBlur ? '✓ SANS Blurry Vision Preview Active' : 'Simulate SANS Blurred Vision Effect'}</span>
                  </button>
                </div>

                {showSANSBlur && (
                  <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px dashed #ef4444', borderRadius: '8px', padding: '10px', textAlign: 'center', filter: 'blur(1.5px)' }}>
                    <div style={{ fontSize: '12px', fontWeight: 900, color: '#f87171' }}>
                      [SANS SIMULATION] Optic nerve sheath pressure causes globe flattening and visual acuity loss!
                    </div>
                  </div>
                )}
              </div>

              {/* Card 3: Vestibular Disorientation & SAS */}
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.9)',
                  border: '1.5px solid rgba(168, 85, 247, 0.4)',
                  borderRadius: '16px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '24px' }}>🌀</span>
                    <h4 style={{ fontSize: '16px', fontWeight: 900, color: '#f8fafc', margin: 0 }}>
                      Vestibular Disorientation &amp; Space Adaptation (SAS)
                    </h4>
                  </div>
                  <span style={{ fontSize: '10px', fontWeight: 900, background: 'rgba(168, 85, 247, 0.2)', color: '#c084fc', padding: '3px 8px', borderRadius: '8px' }}>
                    80% Astronaut Incidence
                  </span>
                </div>

                <p style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: '1.6', margin: 0 }}>
                  Otoconial crystals in the inner ear utricle and saccule lose their gravity vector reference. Sensory conflict between visual input and vestibular signals triggers acute nausea and vertigo during initial orbital insertion.
                </p>

                <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '10px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#c084fc' }}>
                    🧠 Neuro-Vestibular Adaptation Timeline:
                  </div>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                    • Days 1–3: Acute Space Motion Sickness (SAS) and disorientation
                  </div>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                    • Days 4–7: Cerebellar re-weighting relies primarily on visual cues
                  </div>
                  <div style={{ fontSize: '11px', color: '#4ade80', fontWeight: 700 }}>
                    • Day 7+: Complete sensory-motor habituation achieved!
                  </div>
                </div>

                <div style={{ fontSize: '11px', color: '#cbd5e1', background: 'rgba(168, 85, 247, 0.1)', padding: '8px 12px', borderRadius: '8px', borderLeft: '3px solid #c084fc' }}>
                  💡 <strong>NASA Protocol:</strong> Astronauts utilize transdermal scopolamine patches and restrict rapid head rotations during early flight operations.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            MODULE 2: ORBITAL PHYSICS & KEPLER'S LAWS
            ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'ORBITAL' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '22px', maxWidth: '1280px', margin: '0 auto' }}>
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.15), rgba(15, 23, 42, 0.9))',
                border: '1.5px solid rgba(56, 189, 248, 0.4)',
                borderRadius: '16px',
                padding: '20px 24px',
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: 900, color: '#38bdf8', letterSpacing: '0.05em' }}>
                ASTRODYNAMICS &amp; CELESTIAL MECHANICS
              </div>
              <h3 style={{ fontSize: '22px', fontWeight: 900, color: '#f8fafc', margin: '4px 0 6px 0' }}>
                Orbital Mechanics &amp; Astrodynamic Navigation
              </h3>
              <p style={{ fontSize: '12.5px', color: '#cbd5e1', lineHeight: '1.6', margin: 0 }}>
                Navigating space differs fundamentally from terrestrial aerodynamics. Spaceflight is governed by Keplerian orbital geometry, Hohmann transfer ellipses, and planetary gravitational slingshots.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '20px' }}>
              {/* Simulator 1: Kepler's Laws Canvas */}
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.9)',
                  border: '1.5px solid rgba(56, 189, 248, 0.4)',
                  borderRadius: '16px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ fontSize: '16px', fontWeight: 900, color: '#f8fafc', margin: 0 }}>
                    🪐 Kepler&apos;s Laws of Planetary Motion (Live Physics)
                  </h4>
                  <span style={{ fontSize: '10px', color: '#38bdf8', fontWeight: 800 }}>LIVE PHYSICS</span>
                </div>

                <div style={{ width: '100%', height: '240px', background: '#020617', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'center' }}>
                  <canvas ref={orbitCanvasRef} width={380} height={240} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
                  <span style={{ color: '#94a3b8' }}>Orbital Eccentricity (e):</span>
                  <span style={{ color: '#38bdf8', fontWeight: 800 }}>{orbitEccentricity.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="0.75"
                  step="0.05"
                  value={orbitEccentricity}
                  onChange={(e) => setOrbitEccentricity(Number(e.target.value))}
                  style={{ accentColor: '#38bdf8', cursor: 'pointer' }}
                />

                <div style={{ fontSize: '11.5px', color: '#cbd5e1', lineHeight: '1.5' }}>
                  • <strong>1st Law (Elliptical Orbits):</strong> Orbits are ellipses with the central gravitating body at one focus.<br />
                  • <strong>2nd Law (Equal Areas in Equal Time):</strong> A line joining the spacecraft sweeps equal areas in equal intervals. Velocity surges at Periapsis and decelerates at Apoapsis.
                </div>
              </div>

              {/* Simulator 2: Hohmann Transfer Orbit */}
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.9)',
                  border: '1.5px solid rgba(234, 179, 8, 0.4)',
                  borderRadius: '16px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ fontSize: '16px', fontWeight: 900, color: '#f8fafc', margin: 0 }}>
                    🚀 Hohmann Transfer Orbit (Earth to Mars)
                  </h4>
                  <span style={{ fontSize: '10px', color: '#fbbf24', fontWeight: 800 }}>MINIMUM DELTA-V</span>
                </div>

                <p style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: '1.6', margin: 0 }}>
                  Mars travels continuously around the Sun at 24.1 km/s. Spacecraft cannot fly in a straight line. The Hohmann transfer represents the minimum energy semi-elliptical trajectory between planetary orbits.
                </p>

                <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '10px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 800 }}>
                    <span style={{ color: '#94a3b8' }}>Launch Window Alignment:</span>
                    <span style={{ color: '#fbbf24' }}>Occurs once every 26 Months</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 800 }}>
                    <span style={{ color: '#94a3b8' }}>Total Delta-V (Δv):</span>
                    <span style={{ color: '#38bdf8' }}>5.7 km/s (Dep: 3.6 + Arr: 2.1)</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 800 }}>
                    <span style={{ color: '#94a3b8' }}>Transit Duration:</span>
                    <span style={{ color: '#4ade80' }}>7–9 Months (~260 Days)</span>
                  </div>

                  <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden', marginTop: '4px' }}>
                    <div style={{ width: `${hohmannProgress}%`, height: '100%', background: 'linear-gradient(90deg, #38bdf8, #f59e0b)', transition: 'width 0.1s' }} />
                  </div>
                </div>

                <button
                  onClick={() => {
                    setHohmannProgress(0);
                    setIsHohmannLaunching(true);
                    soundFx.playReactorStart();
                  }}
                  disabled={isHohmannLaunching}
                  style={{
                    background: isHohmannLaunching ? 'rgba(234, 179, 8, 0.2)' : 'linear-gradient(135deg, #d97706, #ea580c)',
                    border: 'none',
                    color: '#fff',
                    padding: '10px',
                    borderRadius: '10px',
                    fontSize: '11.5px',
                    fontWeight: 900,
                    cursor: isHohmannLaunching ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  <Play size={14} />
                  <span>{isHohmannLaunching ? `Transfer in progress... ${hohmannProgress}%` : 'Execute Hohmann Transfer Burn Simulation'}</span>
                </button>
              </div>

              {/* Simulator 3: Gravitational Slingshot */}
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.9)',
                  border: '1.5px solid rgba(192, 132, 252, 0.4)',
                  borderRadius: '16px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ fontSize: '16px', fontWeight: 900, color: '#f8fafc', margin: 0 }}>
                    ⚡ Gravitational Slingshot (Gravity Assist)
                  </h4>
                  <span style={{ fontSize: '10px', color: '#c084fc', fontWeight: 800 }}>MOMENTUM TRANSFER</span>
                </div>

                <p style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: '1.6', margin: 0 }}>
                  Passing through the gravitational well of a massive body like Jupiter transfers orbital momentum from the planet to the spacecraft, boosting velocity without consuming propellant (as used by Voyager, Cassini, and New Horizons).
                </p>

                <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '10px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 800 }}>
                    <span style={{ color: '#94a3b8' }}>Inbound Flyby Velocity:</span>
                    <span style={{ color: '#94a3b8' }}>14.2 km/s</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 800 }}>
                    <span style={{ color: '#94a3b8' }}>Post-Slingshot Outbound Velocity:</span>
                    <span style={{ color: slingshotTriggered ? '#4ade80' : '#f59e0b', fontSize: '13px' }}>
                      {slingshotTriggered ? '26.8 km/s (+12.6 km/s Free Boost!)' : '14.2 km/s (Standby)'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 800 }}>
                    <span style={{ color: '#94a3b8' }}>Propellant Expended:</span>
                    <span style={{ color: '#10b981' }}>0 Liters (Pure Celestial Mechanics)</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSlingshotTriggered(!slingshotTriggered);
                    soundFx.playVictory();
                  }}
                  style={{
                    background: slingshotTriggered ? 'linear-gradient(135deg, #059669, #10b981)' : 'linear-gradient(135deg, #7c3aed, #9333ea)',
                    border: 'none',
                    color: '#fff',
                    padding: '10px',
                    borderRadius: '10px',
                    fontSize: '11.5px',
                    fontWeight: 900,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  <Zap size={14} />
                  <span>{slingshotTriggered ? '✓ Slingshot Successful! Velocity Boosted' : 'Execute Jupiter Gravity Slingshot Flyby'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            MODULE 3: RADIATION & EMU SPACESUIT SHIELDING
            ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'RADIATION' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '22px', maxWidth: '1280px', margin: '0 auto' }}>
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(15, 23, 42, 0.9))',
                border: '1.5px solid rgba(239, 68, 68, 0.4)',
                borderRadius: '16px',
                padding: '20px 24px',
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: 900, color: '#f87171', letterSpacing: '0.05em' }}>
                COSMIC RADIATION &amp; EXTRAVEHICULAR MOBILITY UNIT (EMU)
              </div>
              <h3 style={{ fontSize: '22px', fontWeight: 900, color: '#f8fafc', margin: '4px 0 6px 0' }}>
                Deep Space Radiation Shielding &amp; Spacesuit Architecture
              </h3>
              <p style={{ fontSize: '12.5px', color: '#cbd5e1', lineHeight: '1.6', margin: 0 }}>
                Beyond Earth&apos;s protective atmosphere and magnetosphere, crews encounter ionizing Galactic Cosmic Rays (GCR), Solar Proton Events (SPE), and the Van Allen belts. An EVA spacesuit serves as a personal life-support spacecraft.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '20px' }}>
              {/* EMU Spacesuit 3 Layers */}
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.9)',
                  border: '1.5px solid rgba(56, 189, 248, 0.4)',
                  borderRadius: '16px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ fontSize: '16px', fontWeight: 900, color: '#f8fafc', margin: 0 }}>
                    🧑‍🚀 NASA EMU Spacesuit Multi-Layer Cutaway
                  </h4>
                  <span style={{ fontSize: '10px', color: '#38bdf8', fontWeight: 800 }}>NASA SPACESUIT</span>
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  {(['ALL', 'LCVG', 'BLADDER', 'TMG'] as const).map((layer) => (
                    <button
                      key={layer}
                      onClick={() => {
                        setActiveSuitLayer(layer);
                        soundFx.playClick(650);
                      }}
                      style={{
                        flex: 1,
                        padding: '6px 10px',
                        borderRadius: '8px',
                        fontSize: '10.5px',
                        fontWeight: 800,
                        border: activeSuitLayer === layer ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)',
                        background: activeSuitLayer === layer ? 'rgba(56, 189, 248, 0.25)' : 'transparent',
                        color: activeSuitLayer === layer ? '#38bdf8' : '#94a3b8',
                        cursor: 'pointer',
                      }}
                    >
                      {layer === 'ALL' ? 'Full Stack' : layer}
                    </button>
                  ))}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {/* Layer 1: LCVG */}
                  {(activeSuitLayer === 'ALL' || activeSuitLayer === 'LCVG') && (
                    <div style={{ background: 'rgba(6, 182, 212, 0.12)', borderLeft: '3px solid #06b6d4', padding: '10px 12px', borderRadius: '8px' }}>
                      <div style={{ fontSize: '11.5px', fontWeight: 900, color: '#22d3ee' }}>
                        1. Liquid Cooling and Ventilation Garment (LCVG)
                      </div>
                      <div style={{ fontSize: '11px', color: '#cbd5e1', marginTop: '2px', lineHeight: '1.5' }}>
                        Worn directly against skin, 90 meters of flexible polyurethane tubing circulate chilled water to reject up to 400W of astronaut metabolic body heat.
                      </div>
                    </div>
                  )}

                  {/* Layer 2: Pressure Bladder */}
                  {(activeSuitLayer === 'ALL' || activeSuitLayer === 'BLADDER') && (
                    <div style={{ background: 'rgba(56, 189, 248, 0.12)', borderLeft: '3px solid #38bdf8', padding: '10px 12px', borderRadius: '8px' }}>
                      <div style={{ fontSize: '11.5px', fontWeight: 900, color: '#38bdf8' }}>
                        2. Urethane Pressure Bladder (4.3 PSI Pure O₂)
                      </div>
                      <div style={{ fontSize: '11px', color: '#cbd5e1', marginTop: '2px', lineHeight: '1.5' }}>
                        Maintains 29.6 kPa (4.3 psi) of pure oxygen pressure in hard vacuum, preventing ebullism (subcutaneous bodily fluids boiling at body temperature).
                      </div>
                    </div>
                  )}

                  {/* Layer 3: TMG */}
                  {(activeSuitLayer === 'ALL' || activeSuitLayer === 'TMG') && (
                    <div style={{ background: 'rgba(234, 179, 8, 0.12)', borderLeft: '3px solid #eab308', padding: '10px 12px', borderRadius: '8px' }}>
                      <div style={{ fontSize: '11.5px', fontWeight: 900, color: '#facc15' }}>
                        3. Thermal Micrometeoroid Garment (TMG)
                      </div>
                      <div style={{ fontSize: '11px', color: '#cbd5e1', marginTop: '2px', lineHeight: '1.5' }}>
                        Multi-layer aluminized Mylar insulation shields the crew member across extreme temperature swings (-150°C to +120°C) and arrests hypervelocity micrometeoroids traveling at 20 km/s.
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Van Allen & Storm Shelter Material Comparison */}
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.9)',
                  border: '1.5px solid rgba(239, 68, 68, 0.4)',
                  borderRadius: '16px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ fontSize: '16px', fontWeight: 900, color: '#f8fafc', margin: 0 }}>
                    🛡️ Solar Proton Event (SPE) Storm Shelter
                  </h4>
                  <span style={{ fontSize: '10px', color: '#f87171', fontWeight: 800 }}>RADIATION ATTENUATION</span>
                </div>

                <p style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: '1.6', margin: 0 }}>
                  Coronal Mass Ejections (CME) bombard spacecraft with lethal relativistic proton fluxes. Hydrogen-rich materials attenuate cosmic radiation far more effectively than dense heavy metals.
                </p>

                {/* Shelter Material Selector */}
                <div style={{ display: 'flex', gap: '6px' }}>
                  {[
                    { id: 'POLYETHYLENE', label: 'Polyethylene (CH₂)', eff: '88% Shielding' },
                    { id: 'WATER', label: 'Water Wall (H₂O)', eff: '82% Shielding' },
                    { id: 'LEAD', label: 'Heavy Lead (Pb)', eff: '52% Shielding (Bremsstrahlung)' },
                  ].map((mat) => (
                    <button
                      key={mat.id}
                      onClick={() => {
                        setShelterMaterial(mat.id as any);
                        soundFx.playClick(700);
                      }}
                      style={{
                        flex: 1,
                        padding: '8px 10px',
                        borderRadius: '8px',
                        fontSize: '10.5px',
                        fontWeight: 800,
                        border: shelterMaterial === mat.id ? '1px solid #10b981' : '1px solid rgba(255,255,255,0.1)',
                        background: shelterMaterial === mat.id ? 'rgba(16, 185, 129, 0.25)' : 'transparent',
                        color: shelterMaterial === mat.id ? '#34d399' : '#94a3b8',
                        cursor: 'pointer',
                      }}
                    >
                      {mat.label}
                    </button>
                  ))}
                </div>

                <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '10px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 800 }}>
                    <span style={{ color: '#94a3b8' }}>Radiation Attenuation Efficiency:</span>
                    <span style={{ color: shelterMaterial === 'LEAD' ? '#f59e0b' : '#4ade80' }}>
                      {shelterMaterial === 'POLYETHYLENE' ? '88% Shielding (High hydrogen nuclear cross-section)' : shelterMaterial === 'WATER' ? '82% Shielding (Dual-use potable water storage & shield)' : '52% (Heavy nuclei generate secondary Bremsstrahlung X-rays)'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 800 }}>
                    <span style={{ color: '#94a3b8' }}>Van Allen Belts Transit Protocol:</span>
                    <span style={{ color: '#38bdf8' }}>High-inclination rapid hyperbolic trajectory</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSolarFlareActive(!solarFlareActive);
                    if (!solarFlareActive) soundFx.playAlarm();
                    else soundFx.playSuccess();
                  }}
                  style={{
                    background: solarFlareActive ? 'linear-gradient(135deg, #dc2626, #b91c1c)' : 'linear-gradient(135deg, #0284c7, #0369a1)',
                    border: 'none',
                    color: '#fff',
                    padding: '10px',
                    borderRadius: '10px',
                    fontSize: '11.5px',
                    fontWeight: 900,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  <Sun size={14} />
                  <span>{solarFlareActive ? '⚠️ Solar Storm Active! Crew Secured in Storm Shelter' : 'Simulate Solar Proton Event (SPE Flare Alarm)'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            MODULE 4: IN-SITU RESOURCE UTILIZATION (ISRU)
            ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'ISRU' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '22px', maxWidth: '1280px', margin: '0 auto' }}>
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.15), rgba(15, 23, 42, 0.9))',
                border: '1.5px solid rgba(234, 179, 8, 0.4)',
                borderRadius: '16px',
                padding: '20px 24px',
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: 900, color: '#eab308', letterSpacing: '0.05em' }}>
                IN-SITU RESOURCE UTILIZATION (ISRU) · LIVING OFF THE LAND
              </div>
              <h3 style={{ fontSize: '22px', fontWeight: 900, color: '#f8fafc', margin: '4px 0 6px 0' }}>
                Planetary Resource Extraction &amp; Sabatier Synthesis
              </h3>
              <p style={{ fontSize: '12.5px', color: '#cbd5e1', lineHeight: '1.6', margin: 0 }}>
                Hauling all consumable propellants and life-support water from Earth is economically prohibitive. ISRU converts atmospheric CO₂ and lunar regolith into return-rocket fuel and structural habitat modules.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '20px' }}>
              {/* Sabatier Reactor Simulator */}
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.9)',
                  border: '1.5px solid rgba(16, 185, 129, 0.4)',
                  borderRadius: '16px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ fontSize: '16px', fontWeight: 900, color: '#f8fafc', margin: 0 }}>
                    ⚗️ Sabatier Chemical Synthesis Reactor
                  </h4>
                  <span style={{ fontSize: '10px', color: '#10b981', fontWeight: 800 }}>METHANE FUEL + WATER</span>
                </div>

                {/* Formula Highlight */}
                <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', padding: '10px 14px', borderRadius: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '15px', fontWeight: 900, color: '#4ade80', letterSpacing: '0.05em' }}>
                    CO₂ + 4H₂ → CH₄ (Methane Fuel) + 2H₂O (Water)
                  </div>
                  <div style={{ fontSize: '10.5px', color: '#94a3b8', marginTop: '2px' }}>
                    Operates at 400°C over a ruthenium-on-alumina or nickel catalyst bed
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 800 }}>
                      <span style={{ color: '#94a3b8' }}>Exhaled / Atmospheric CO₂ Input:</span>
                      <span style={{ color: '#38bdf8' }}>{co2InputGrams} grams</span>
                    </div>
                    <input
                      type="range"
                      min="100"
                      max="1000"
                      step="20"
                      value={co2InputGrams}
                      onChange={(e) => setCo2InputGrams(Number(e.target.value))}
                      style={{ width: '100%', accentColor: '#38bdf8' }}
                    />
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 800 }}>
                      <span style={{ color: '#94a3b8' }}>Electrolyzed H₂ Hydrogen Input:</span>
                      <span style={{ color: '#a855f7' }}>{h2InputGrams} grams</span>
                    </div>
                    <input
                      type="range"
                      min="20"
                      max="200"
                      step="5"
                      value={h2InputGrams}
                      onChange={(e) => setH2InputGrams(Number(e.target.value))}
                      style={{ width: '100%', accentColor: '#a855f7' }}
                    />
                  </div>
                </div>

                {sabatierResult && (
                  <div style={{ background: 'rgba(0,0,0,0.35)', borderRadius: '10px', padding: '12px', display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
                    <div>
                      <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 800 }}>Synthesized Methane (CH₄ Fuel)</div>
                      <div style={{ fontSize: '18px', fontWeight: 900, color: '#f59e0b' }}>🔥 {sabatierResult.ch4} g</div>
                    </div>
                    <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)' }} />
                    <div>
                      <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 800 }}>Potable Water Yield (H₂O)</div>
                      <div style={{ fontSize: '18px', fontWeight: 900, color: '#38bdf8' }}>💧 {sabatierResult.h2o} ml</div>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => {
                    setSabatierRunning(true);
                    soundFx.playReactorStart();
                    setTimeout(() => {
                      const ch4Out = Math.round((co2InputGrams / 44) * 16 * 0.95);
                      const h2oOut = Math.round((co2InputGrams / 44) * 36 * 0.95);
                      setSabatierResult({ ch4: ch4Out, h2o: h2oOut });
                      setSabatierRunning(false);
                      soundFx.playSuccess();
                    }, 800);
                  }}
                  disabled={sabatierRunning}
                  style={{
                    background: sabatierRunning ? 'rgba(16, 185, 129, 0.2)' : 'linear-gradient(135deg, #059669, #10b981)',
                    border: 'none',
                    color: '#fff',
                    padding: '10px',
                    borderRadius: '10px',
                    fontSize: '11.5px',
                    fontWeight: 900,
                    cursor: sabatierRunning ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  <span>⚡</span>
                  <span>{sabatierRunning ? 'Reactor Heating & Synthesizing (400°C)...' : 'Initiate Sabatier Catalyst Reaction (400°C)'}</span>
                </button>
              </div>

              {/* Regolith Sintering & Shackleton Water-Ice */}
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.9)',
                  border: '1.5px solid rgba(234, 179, 8, 0.4)',
                  borderRadius: '16px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ fontSize: '16px', fontWeight: 900, color: '#f8fafc', margin: 0 }}>
                    🧱 Regolith Sintering &amp; Shackleton Water-Ice (PSR)
                  </h4>
                  <span style={{ fontSize: '10px', color: '#fbbf24', fontWeight: 800 }}>3D PRINTED HABITAT</span>
                </div>

                <div style={{ fontSize: '11.5px', color: '#cbd5e1', lineHeight: '1.6' }}>
                  • <strong>Microwave Sintering (1,100°C):</strong> Fuses abrasive, toxic lunar/Martian regolith dust into dense ceramic masonry blocks for 3D-printed radiation-proof habitat shells.<br />
                  • <strong>Permanently Shadowed Regions (PSR):</strong> Shackleton Crater volatile ice is extracted and electrolyzed into cryogenic Liquid Hydrogen (LH₂) and Liquid Oxygen (LOX) rocket propellants.
                </div>

                {/* Sintering Progress */}
                <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '10px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 800 }}>
                    <span style={{ color: '#94a3b8' }}>Regolith Sintering Status:</span>
                    <span style={{ color: sinteringProgress === 100 ? '#4ade80' : '#fbbf24' }}>
                      {sinteringProgress === 100 ? '✓ 3D Basaltic Shield Block Printed' : `${sinteringProgress}% Induction Heating`}
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${sinteringProgress}%`, height: '100%', background: 'linear-gradient(90deg, #ea580c, #f59e0b)', transition: 'width 0.2s' }} />
                  </div>
                </div>

                <button
                  onClick={() => {
                    setIsSintering(true);
                    soundFx.playReactorStart();
                    let p = 0;
                    const iv = setInterval(() => {
                      p += 20;
                      setSinteringProgress(p);
                      if (p >= 100) {
                        clearInterval(iv);
                        setIsSintering(false);
                        soundFx.playVictory();
                      }
                    }, 250);
                  }}
                  disabled={isSintering}
                  style={{
                    background: isSintering ? 'rgba(234, 179, 8, 0.2)' : 'linear-gradient(135deg, #d97706, #b45309)',
                    border: 'none',
                    color: '#fff',
                    padding: '10px',
                    borderRadius: '10px',
                    fontSize: '11.5px',
                    fontWeight: 900,
                    cursor: isSintering ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  <span>🧱</span>
                  <span>{isSintering ? 'Microwave Heating Regolith (1,100°C)...' : 'Initiate Regolith Microwave Sintering (1,100°C)'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            MODULE 5: DEEP SPACE NETWORK & SPEED-OF-LIGHT DELAY
            ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'DSN' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '22px', maxWidth: '1280px', margin: '0 auto' }}>
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.15), rgba(15, 23, 42, 0.9))',
                border: '1.5px solid rgba(168, 85, 247, 0.4)',
                borderRadius: '16px',
                padding: '20px 24px',
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: 900, color: '#c084fc', letterSpacing: '0.05em' }}>
                DEEP SPACE NETWORK (DSN) &amp; SPEED-OF-LIGHT LATENCY
              </div>
              <h3 style={{ fontSize: '22px', fontWeight: 900, color: '#f8fafc', margin: '4px 0 6px 0' }}>
                Interplanetary Speed-of-Light Latency &amp; NASA DSN
              </h3>
              <p style={{ fontSize: '12.5px', color: '#cbd5e1', lineHeight: '1.6', margin: 0 }}>
                Radio waves travel at the speed of light (299,792 km/s). While lunar round-trip latency is only ~2.6 seconds, signal transit to Mars ranges between 3.1 and 22.3 minutes, rendering real-time joystick driving impossible and mandating onboard AI autonomy.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '20px' }}>
              {/* Interactive Signal Ping Lag Tool */}
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.9)',
                  border: '1.5px solid rgba(56, 189, 248, 0.4)',
                  borderRadius: '16px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ fontSize: '16px', fontWeight: 900, color: '#f8fafc', margin: 0 }}>
                    📡 Signal Propagation Time-Lag Test
                  </h4>
                  <span style={{ fontSize: '10px', color: '#38bdf8', fontWeight: 800 }}>LIGHT SPEED (c)</span>
                </div>

                {/* Destination Selector */}
                <div style={{ display: 'flex', gap: '6px' }}>
                  {[
                    { id: 'MOON', label: 'Moon (384,400 km)', delay: '1.28 Seconds' },
                    { id: 'MARS_CLOSE', label: 'Mars Perigee (56M km)', delay: '3.1 Minutes' },
                    { id: 'MARS_FAR', label: 'Mars Apogee (401M km)', delay: '22.3 Minutes' },
                  ].map((dst) => (
                    <button
                      key={dst.id}
                      onClick={() => {
                        setPingDestination(dst.id as any);
                        setCommandDelivered(false);
                        soundFx.playClick(650);
                      }}
                      style={{
                        flex: 1,
                        padding: '8px 10px',
                        borderRadius: '8px',
                        fontSize: '10.5px',
                        fontWeight: 800,
                        border: pingDestination === dst.id ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)',
                        background: pingDestination === dst.id ? 'rgba(56, 189, 248, 0.25)' : 'transparent',
                        color: pingDestination === dst.id ? '#38bdf8' : '#94a3b8',
                        cursor: 'pointer',
                      }}
                    >
                      {dst.label}
                    </button>
                  ))}
                </div>

                <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '10px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 800 }}>
                    <span style={{ color: '#94a3b8' }}>One-Way Light Travel Time:</span>
                    <span style={{ color: '#fbbf24' }}>
                      {pingDestination === 'MOON' ? '1.28 Seconds' : pingDestination === 'MARS_CLOSE' ? '3.1 Minutes (186 sec)' : '22.3 Minutes (1,338 sec)'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 800 }}>
                    <span style={{ color: '#94a3b8' }}>Real-Time Ground Joystick Control:</span>
                    <span style={{ color: pingDestination === 'MOON' ? '#4ade80' : '#ef4444' }}>
                      {pingDestination === 'MOON' ? '✓ Feasible (Low latency lag)' : '❌ Impossible! Full Onboard AI Autonomy Required'}
                    </span>
                  </div>
                </div>

                {commandDelivered && (
                  <div style={{ background: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10b981', padding: '10px', borderRadius: '8px', textAlign: 'center', fontSize: '11.5px', fontWeight: 800, color: '#4ade80' }}>
                    ✓ Telemetry uplink received! (Rover autonomous navigation hazard computer averted crater edge)
                  </div>
                )}

                <button
                  onClick={() => {
                    setIsPinging(true);
                    setCommandDelivered(false);
                    soundFx.playReactorStart();
                    setTimeout(() => {
                      setIsPinging(false);
                      setCommandDelivered(true);
                      soundFx.playSuccess();
                    }, pingDestination === 'MOON' ? 1300 : 3000);
                  }}
                  disabled={isPinging}
                  style={{
                    background: isPinging ? 'rgba(56, 189, 248, 0.2)' : 'linear-gradient(135deg, #0284c7, #0369a1)',
                    border: 'none',
                    color: '#fff',
                    padding: '10px',
                    borderRadius: '10px',
                    fontSize: '11.5px',
                    fontWeight: 900,
                    cursor: isPinging ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  <Radio size={14} />
                  <span>{isPinging ? 'Radio Packet Propagating at Light Speed (c)...' : 'Send Emergency Hazard Stop Ping (Light Speed)'}</span>
                </button>
              </div>

              {/* DSN 3 Giant Dishes 24/7 Coverage */}
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.9)',
                  border: '1.5px solid rgba(168, 85, 247, 0.4)',
                  borderRadius: '16px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ fontSize: '16px', fontWeight: 900, color: '#f8fafc', margin: 0 }}>
                    🌐 NASA Deep Space Network (DSN)
                  </h4>
                  <span style={{ fontSize: '10px', color: '#c084fc', fontWeight: 800 }}>70-METER PARABOLIC DISHES</span>
                </div>

                <p style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: '1.6', margin: 0 }}>
                  Because Earth continuously rotates on its axis, NASA maintains three equidistant 70-meter deep-space communication antenna complexes separated by approximately 120° of longitude:
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    { id: 'GOLDSTONE', name: '🇺🇸 Goldstone Complex (California, USA)', status: 'ACTIVE UPLINK (70m Deep Space)' },
                    { id: 'MADRID', name: '🇪🇸 Madrid Complex (Spain)', status: 'ACTIVE STANDBY (70m Secondary)' },
                    { id: 'CANBERRA', name: '🇦🇺 Canberra Complex (Australia)', status: 'TRACKING VOYAGER & ARTEMIS' },
                  ].map((station) => (
                    <div
                      key={station.id}
                      style={{
                        background: 'rgba(168, 85, 247, 0.1)',
                        border: '1px solid rgba(168, 85, 247, 0.3)',
                        borderRadius: '8px',
                        padding: '10px 14px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#f8fafc' }}>{station.name}</span>
                      <span style={{ fontSize: '9.5px', fontWeight: 900, color: '#c084fc', background: 'rgba(168, 85, 247, 0.2)', padding: '2px 8px', borderRadius: '6px' }}>
                        {station.status}
                      </span>
                    </div>
                  ))}
                </div>

                <div style={{ fontSize: '11px', color: '#cbd5e1', background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '8px', borderLeft: '3px solid #10b981' }}>
                  ✓ <strong>Uninterrupted 24/7 Deep Space Link:</strong> Regardless of Earth&apos;s axial rotation, at least one 70-meter parabolic reflector retains continuous line of sight toward Mars, Jupiter, or deep space probe trajectories.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (embedded) {
    return contentLayout;
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        background: 'var(--color-paper)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {contentLayout}
    </div>
  );
};
