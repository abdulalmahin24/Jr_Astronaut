import React, { useState, useEffect } from 'react';
import type { AppRoute } from '../router/useAppRouter';
import type { DifficultyMode } from '../types/game';
import { soundFx } from '../utils/audioEffects';
import { LaunchMissionWizard } from '../components/LaunchMissionWizard';
import { HomeBackground } from '../components/HomeBackground';
import '../game-landing.css';
import {
  Rocket,
  Zap,
  Wind,
  Droplets,
  Apple,
  ShieldAlert,
  Activity,
  Sparkles,
  Globe,
  HelpCircle,
  X,
  Award,
  Sparkle,
} from 'lucide-react';

export interface GameLandingHomePageProps {
  onNavigate: (route: AppRoute, params?: Record<string, string>) => void;
  onBuildOutpost?: (dest: 'MOON' | 'MARS', difficulty?: DifficultyMode, cargoId?: string) => void;
  currentUser?: any;
  onUserUpdate?: (user: any) => void;
  onOpenAuth?: () => void;
  onOpenSettings?: () => void;
  onOpenHowToPlay?: () => void;
  onOpenCertificate?: () => void;
  isJudgeMode?: boolean;
  onOpenJudgePreview?: () => void;
  onOpenTelemetry?: () => void;
  onOpenScienceHub?: () => void;
  onOpenCredits?: () => void;
  onOpenCharacterLocker?: () => void;
  onOpenLiveActivity?: () => void;
  onOpenMultiplayerLobby?: () => void;
  onStartMission?: () => void;
  hasSavedGame?: boolean;
  savedGameSol?: number;
  savedGameDest?: string;
  onContinueMission?: () => void;
  [key: string]: any;
}

// 7 Life Support Resources for the slim glowing icon circles row
const SEVEN_RESOURCES = [
  {
    id: 'power',
    name: 'Power',
    simpleTooltip: 'Power: Generates electricity for life support & heaters',
    color: '#f59e0b',
    glowColor: 'rgba(245, 158, 11, 0.45)',
    icon: <Zap size={17} className="text-amber-400" />,
  },
  {
    id: 'oxygen',
    name: 'Oxygen',
    simpleTooltip: 'Oxygen: Keeps your astronaut crew breathing',
    color: '#06b6d4',
    glowColor: 'rgba(6, 182, 212, 0.45)',
    icon: <Wind size={17} className="text-cyan-400" />,
  },
  {
    id: 'water',
    name: 'Water',
    simpleTooltip: 'Water: Recycled closed-loop for drinking & crops',
    color: '#38bdf8',
    glowColor: 'rgba(56, 189, 248, 0.45)',
    icon: <Droplets size={17} className="text-sky-400" />,
  },
  {
    id: 'food',
    name: 'Food',
    simpleTooltip: 'Food: Calorie rations & fresh greenhouse salad pods',
    color: '#10b981',
    glowColor: 'rgba(16, 185, 129, 0.45)',
    icon: <Apple size={17} className="text-emerald-400" />,
  },
  {
    id: 'radiation',
    name: 'Radiation Shield',
    simpleTooltip: 'Radiation Shield: Blocks deadly solar flares & cosmic rays',
    color: '#ef4444',
    glowColor: 'rgba(239, 68, 68, 0.45)',
    icon: <ShieldAlert size={17} className="text-red-400" />,
  },
  {
    id: 'health',
    name: 'Crew Health',
    simpleTooltip: 'Crew Health: Vitals, physical stamina & recovery',
    color: '#22c55e',
    glowColor: 'rgba(34, 197, 94, 0.45)',
    icon: <Activity size={17} className="text-green-400" />,
  },
  {
    id: 'morale',
    name: 'Crew Morale',
    simpleTooltip: 'Crew Morale: Team spirit, focus & operational speed',
    color: '#a855f7',
    glowColor: 'rgba(168, 85, 247, 0.45)',
    icon: <Sparkles size={17} className="text-purple-400" />,
  },
];

// Short, rotating, scientifically-accurate NASA facts (rotates every 8s)
const ROTATING_NASA_FACTS = [
  {
    fact: 'On the Moon, night lasts ~14 Earth days and temperatures plunge to -130°C! Kilopower reactors keep outposts warm.',
    source: 'NASA STMD & Artemis',
  },
  {
    fact: "Mars's atmosphere is 95% CO2. NASA's MOXIE instrument on Perseverance successfully made pure oxygen directly from Martian air!",
    source: 'NASA Mars 2020 Mission',
  },
  {
    fact: 'The International Space Station recycles over 98% of all water from crew breath moisture and sweat using closed-loop filtration.',
    source: 'NASA ECLSS Program',
  },
  {
    fact: 'Mars orbits 1.5 AU from the Sun and receives only ~43% of Earth’s solar sunlight, requiring double-sized solar arrays.',
    source: 'NASA Mars Climate Survey',
  },
  {
    fact: 'Moon dirt (regolith) can be melted with concentrated microwaves into radiation-proof bricks without cement from Earth.',
    source: 'NASA In-Situ Utilization (ISRU)',
  },
  {
    fact: 'At the lunar south pole (Shackleton Crater), high peaks receive near-permanent sun while deep crater floors hold water ice.',
    source: 'NASA Lunar Reconnaissance Orbiter',
  },
];

export const GameLandingHomePage: React.FC<GameLandingHomePageProps> = ({
  onNavigate,
  onBuildOutpost,
  onStartMission,
  ...landingProps
}) => {
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardDestination, setWizardDestination] = useState<'MOON' | 'MARS'>('MOON');
  const [hoveredDestination, setHoveredDestination] = useState<'MOON' | 'MARS' | null>(null);
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);
  const [isCreditsOpen, setIsCreditsOpen] = useState(false);
  const [howToPlayTab, setHowToPlayTab] = useState<'STEPS' | 'RESOURCES' | 'VOCAB'>('STEPS');
  const [activeFactIdx, setActiveFactIdx] = useState(0);
  const [hoveredResource, setHoveredResource] = useState<string | null>(null);

  // Rotate NASA fact every 8 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveFactIdx((prev) => (prev + 1) % ROTATING_NASA_FACTS.length);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  const handleOpenWizard = (dest: 'MOON' | 'MARS' = 'MOON') => {
    soundFx.playReactorStart();
    setWizardDestination(dest);
    setIsWizardOpen(true);
  };

  const handleLaunchFromWizard = (dest: 'MOON' | 'MARS', difficulty: DifficultyMode, cargoId: string) => {
    setIsWizardOpen(false);
    if (onBuildOutpost) {
      onBuildOutpost(dest, difficulty, cargoId);
    } else {
      onNavigate('mission', { dest, diff: difficulty, cargo: cargoId });
    }
  };

  const currentFact = ROTATING_NASA_FACTS[activeFactIdx];

  return (
    <div
      className="game-start-menu-root"
      style={{
        position: 'relative',
        width: '100%',
        height: 'calc(100vh - var(--header-height, 56px))',
        maxHeight: 'calc(100vh - var(--header-height, 56px))',
        overflow: 'hidden',
        background: '#020510',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Fredoka', 'Baloo 2', system-ui, sans-serif",
      }}
    >
      {/* ── 1. CINEMATIC 2.5D PARALLAX GAME SCENE (5 Depth Layers, Photo Art, Soft Round Dust, Day/Night) ── */}
      <HomeBackground activeHover={hoveredDestination} />

      {/* ── 2. DARK GRADIENT OVERLAY BEHIND TEXT (Ensures WCAG AA Contrast, No bright glare) ── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 1,
          background:
            'radial-gradient(ellipse at 50% 48%, rgba(2, 6, 23, 0.45) 0%, rgba(2, 5, 16, 0.70) 62%, rgba(1, 3, 10, 0.90) 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* ── 3. CENTERPIECE CONTENT (Single screen, 100vh, NO scrolling) ── */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '16px 24px',
          maxWidth: '860px',
          margin: '0 auto',
        }}
      >
        {/* Requirement 2: Top pill = "NASA SPACE APPS 2026" only */}
        <div
          data-testid="hero-agency-badge"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 18px',
            borderRadius: '9999px',
            background: 'rgba(15, 23, 42, 0.88)',
            border: '1.5px solid rgba(56, 189, 248, 0.45)',
            color: '#38bdf8',
            fontSize: '12px',
            fontWeight: 800,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginBottom: '16px',
            boxShadow: '0 0 20px rgba(56, 189, 248, 0.25)',
          }}
        >
          <Rocket size={14} className="text-sky-400" />
          <span>NASA SPACE APPS 2026</span>
        </div>

        {/* Title */}
        <h1
          style={{
            fontSize: 'clamp(2.6rem, 5.8vw, 4.4rem)',
            fontWeight: 900,
            lineHeight: 1.05,
            margin: '0 0 10px 0',
            letterSpacing: '-0.02em',
            color: '#ffffff',
            textShadow: '0 0 45px rgba(56, 189, 248, 0.45)',
          }}
        >
          Jr. <span style={{ color: '#f97316', textShadow: '0 0 35px rgba(249, 115, 22, 0.6)' }}>AstroCamp</span>
        </h1>

        {/* Requirement 2: Subtitle = ONE line: "Keep your crew alive on the Moon or Mars!" */}
        <p
          data-testid="hero-subtitle"
          style={{
            fontSize: 'clamp(1rem, 2vw, 1.25rem)',
            fontWeight: 600,
            color: '#cbd5e1',
            margin: '0 0 28px 0',
            maxWidth: '680px',
            lineHeight: 1.3,
            textShadow: '0 2px 8px rgba(0, 0, 0, 0.8)',
            whiteSpace: 'nowrap',
          }}
        >
          Keep your crew alive on the Moon or Mars!
        </p>

        {/* Big pulsing orange START MISSION button */}
        <button
          onClick={() => handleOpenWizard('MOON')}
          className="game-hero-start-btn"
          data-testid="start-mission-btn"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '14px',
            padding: '16px 48px',
            borderRadius: '9999px',
            background: 'linear-gradient(135deg, #f97316 0%, #ea580c 50%, #c2410c 100%)',
            border: '2px solid rgba(254, 215, 170, 0.6)',
            color: '#ffffff',
            fontSize: 'clamp(1.2rem, 2.5vw, 1.55rem)',
            fontWeight: 900,
            letterSpacing: '0.04em',
            cursor: 'pointer',
            boxShadow: '0 0 40px rgba(249, 115, 22, 0.75), 0 10px 30px rgba(0, 0, 0, 0.6)',
            transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
            marginBottom: '20px',
          }}
          title="Start Outpost Mission (No login required)"
        >
          <Rocket size={26} />
          <span>START MISSION</span>
        </button>

        {/* Secondary Action Buttons */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            flexWrap: 'wrap',
            marginBottom: '26px',
          }}
        >
          {/* How to Play */}
          <button
            onClick={() => {
              soundFx.playClick(800);
              setIsHowToPlayOpen(true);
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 18px',
              borderRadius: '10px',
              background: 'rgba(15, 23, 42, 0.85)',
              border: '1.5px solid rgba(56, 189, 248, 0.35)',
              color: '#38bdf8',
              fontSize: '13.5px',
              fontWeight: 800,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              backdropFilter: 'blur(8px)',
            }}
            title="Read 3-Step Outpost Survival Guide & Life Support Rules"
          >
            <HelpCircle size={15} />
            <span>How to Play</span>
          </button>

          {/* Explore Solar System */}
          <button
            onClick={() => {
              soundFx.playClick(850);
              onNavigate('explore');
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 18px',
              borderRadius: '10px',
              background: 'rgba(15, 23, 42, 0.85)',
              border: '1.5px solid rgba(148, 163, 184, 0.3)',
              color: '#e2e8f0',
              fontSize: '13.5px',
              fontWeight: 800,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              backdropFilter: 'blur(8px)',
            }}
            title="Freely navigate real-time 3D planetary orbits and celestial bodies"
          >
            <Globe size={15} />
            <span>Explore Solar System</span>
          </button>

          {/* Credits */}
          <button
            onClick={() => {
              soundFx.playClick(750);
              setIsCreditsOpen(true);
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 18px',
              borderRadius: '10px',
              background: 'rgba(15, 23, 42, 0.85)',
              border: '1.5px solid rgba(148, 163, 184, 0.3)',
              color: '#94a3b8',
              fontSize: '13.5px',
              fontWeight: 800,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              backdropFilter: 'blur(8px)',
            }}
            title="View NASA Data Sources, Artemis References, and Space Apps Credits"
          >
            <Award size={15} />
            <span>Credits</span>
          </button>
        </div>

        {/* ── Requirement 3: RESOURCES ROW ──
            Slim row of 7 small glowing icon circles with simple-word tooltips, appearing one by one on load */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            flexWrap: 'wrap',
            position: 'relative',
          }}
        >
          {SEVEN_RESOURCES.map((r, index) => {
            const isHovered = hoveredResource === r.id;
            return (
              <div
                key={r.id}
                className="resource-circle-item"
                data-testid={`resource-circle-${r.id}`}
                title={r.simpleTooltip}
                onMouseEnter={() => setHoveredResource(r.id)}
                onMouseLeave={() => setHoveredResource(null)}
                style={{
                  position: 'relative',
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: 'rgba(15, 23, 42, 0.9)',
                  border: `2px solid ${r.color}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `0 0 14px ${r.glowColor}`,
                  cursor: 'pointer',
                  animationDelay: `${index * 85}ms`,
                }}
              >
                {r.icon}

                {/* Simple-word floating tooltip */}
                {isHovered && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '125%',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: 'rgba(7, 14, 34, 0.96)',
                      border: `1.5px solid ${r.color}`,
                      borderRadius: '8px',
                      padding: '6px 12px',
                      whiteSpace: 'nowrap',
                      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.85)',
                      pointerEvents: 'none',
                      zIndex: 100,
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: '12px', fontWeight: 800, color: r.color }}>
                      {r.name}
                    </div>
                    <div style={{ fontSize: '11px', color: '#cbd5e1', marginTop: '1px' }}>
                      {r.simpleTooltip.split(':')[1]?.trim()}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Requirement 4: FACT (Bottom-Left rotating "Did you know?" NASA fact) ── */}
      <div
        className="cinematic-fact-pill"
        key={activeFactIdx}
        style={{
          position: 'absolute',
          bottom: '20px',
          left: '24px',
          zIndex: 10,
          maxWidth: '420px',
          background: 'rgba(11, 20, 48, 0.88)',
          border: '1.5px solid rgba(56, 189, 248, 0.35)',
          borderRadius: '14px',
          padding: '10px 16px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '10px',
          pointerEvents: 'auto',
        }}
      >
        <Sparkle size={18} className="text-amber-400 shrink-0" style={{ marginTop: '2px' }} />
        <div>
          <div
            style={{
              fontSize: '10.5px',
              fontWeight: 800,
              color: '#38bdf8',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              marginBottom: '2px',
            }}
          >
            DID YOU KNOW? · {currentFact.source}
          </div>
          <div
            style={{
              fontSize: '11.5px',
              color: '#e2e8f0',
              lineHeight: 1.4,
              fontWeight: 500,
            }}
          >
            {currentFact.fact}
          </div>
        </div>
      </div>

      {/* ── Requirement 7: CHIPS BOTTOM-CENTER ("MOON - 30 Days" and "MARS - 40 Sols") ──
          Leaves bottom-right 200x100px corner completely empty */}
      <div
        style={{
          position: 'absolute',
          bottom: '18px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '6px',
          pointerEvents: 'auto',
        }}
      >
        {/* Dynamic one-line NASA fact on hover */}
        {hoveredDestination && (
          <div
            style={{
              padding: '4px 14px',
              borderRadius: '9999px',
              background: 'rgba(3, 7, 18, 0.92)',
              border: hoveredDestination === 'MOON' ? '1px solid #38bdf8' : '1px solid #f97316',
              color: hoveredDestination === 'MOON' ? '#7dd3fc' : '#fdba74',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.02em',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.8)',
              whiteSpace: 'nowrap',
            }}
          >
            {hoveredDestination === 'MOON'
              ? '🔬 NASA Artemis: Shackleton Crater rims receive continuous sunlight while deep floors trap volatile water ice.'
              : '🔬 NASA Perseverance: Jezero Crater delta was once filled with ancient liquid river water 3.5 billion years ago.'}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Moon Chip */}
          <button
            onClick={() => {
              soundFx.playClick(800);
              handleOpenWizard('MOON');
            }}
            onMouseEnter={() => setHoveredDestination('MOON')}
            onMouseOver={() => setHoveredDestination('MOON')}
            onMouseLeave={() => setHoveredDestination(null)}
            onFocus={() => setHoveredDestination('MOON')}
            onBlur={() => setHoveredDestination(null)}
            className="destination-chip-btn"
            data-testid="chip-moon"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 18px',
              borderRadius: '9999px',
              background: 'rgba(15, 23, 42, 0.9)',
              border: '1.5px solid #38bdf8',
              color: '#ffffff',
              fontSize: '12.5px',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 4px 18px rgba(56, 189, 248, 0.35)',
              backdropFilter: 'blur(8px)',
            }}
            title="Start Outpost Mission on the Moon (30 Days)"
          >
            <span style={{ fontSize: '14px' }}>🌙</span>
            <span>MOON - 30 Days</span>
          </button>

          {/* Mars Chip */}
          <button
            onClick={() => {
              soundFx.playClick(850);
              handleOpenWizard('MARS');
            }}
            onMouseEnter={() => setHoveredDestination('MARS')}
            onMouseOver={() => setHoveredDestination('MARS')}
            onMouseLeave={() => setHoveredDestination(null)}
            onFocus={() => setHoveredDestination('MARS')}
            onBlur={() => setHoveredDestination(null)}
            className="destination-chip-btn"
            data-testid="chip-mars"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 18px',
              borderRadius: '9999px',
              background: 'rgba(15, 23, 42, 0.9)',
              border: '1.5px solid #f97316',
              color: '#ffffff',
              fontSize: '12.5px',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 4px 18px rgba(249, 115, 22, 0.35)',
              backdropFilter: 'blur(8px)',
            }}
            title="Start Outpost Mission on Mars (40 Sols)"
          >
            <span style={{ fontSize: '14px' }}>🔴</span>
            <span>MARS - 40 Sols</span>
          </button>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          FULL-SCREEN MULTI-STEP WIZARD
         ════════════════════════════════════════════════════════════════════ */}
      <LaunchMissionWizard
        isOpen={isWizardOpen}
        initialDestination={wizardDestination}
        onClose={() => setIsWizardOpen(false)}
        onLaunch={handleLaunchFromWizard}
      />

      {/* ════════════════════════════════════════════════════════════════════
          "HOW TO PLAY" POPUP MODAL
         ════════════════════════════════════════════════════════════════════ */}
      {isHowToPlayOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 2200,
            background: 'rgba(2, 6, 23, 0.92)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '840px',
              maxHeight: '88vh',
              background: '#070f26',
              border: '2px solid #0284c7',
              borderRadius: '24px',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              boxShadow: '0 25px 60px rgba(0,0,0,0.9), 0 0 35px rgba(2, 132, 199, 0.3)',
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: '18px 24px',
                background: '#0a1638',
                borderBottom: '1px solid #1e293b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <HelpCircle size={22} className="text-sky-400" />
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                  Cadet Mission Briefing & Survival Guide
                </h2>
              </div>
              <button
                onClick={() => {
                  soundFx.playClick(750);
                  setIsHowToPlayOpen(false);
                }}
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid #334155',
                  color: '#cbd5e1',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Sub-tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid #1e293b', background: '#060d20' }}>
              <button
                onClick={() => setHowToPlayTab('STEPS')}
                style={{
                  flex: 1,
                  padding: '12px',
                  fontSize: '13px',
                  fontWeight: 800,
                  border: 'none',
                  background: howToPlayTab === 'STEPS' ? '#0b1942' : 'transparent',
                  color: howToPlayTab === 'STEPS' ? '#38bdf8' : '#94a3b8',
                  borderBottom: howToPlayTab === 'STEPS' ? '3px solid #38bdf8' : '3px solid transparent',
                  cursor: 'pointer',
                }}
              >
                1. How to Play in 3 Steps
              </button>
              <button
                onClick={() => setHowToPlayTab('RESOURCES')}
                style={{
                  flex: 1,
                  padding: '12px',
                  fontSize: '13px',
                  fontWeight: 800,
                  border: 'none',
                  background: howToPlayTab === 'RESOURCES' ? '#0b1942' : 'transparent',
                  color: howToPlayTab === 'RESOURCES' ? '#38bdf8' : '#94a3b8',
                  borderBottom: howToPlayTab === 'RESOURCES' ? '3px solid #38bdf8' : '3px solid transparent',
                  cursor: 'pointer',
                }}
              >
                2. The 7 Life Support Bars
              </button>
              <button
                onClick={() => setHowToPlayTab('VOCAB')}
                style={{
                  flex: 1,
                  padding: '12px',
                  fontSize: '13px',
                  fontWeight: 800,
                  border: 'none',
                  background: howToPlayTab === 'VOCAB' ? '#0b1942' : 'transparent',
                  color: howToPlayTab === 'VOCAB' ? '#38bdf8' : '#94a3b8',
                  borderBottom: howToPlayTab === 'VOCAB' ? '3px solid #38bdf8' : '3px solid transparent',
                  cursor: 'pointer',
                }}
              >
                3. Kid Vocabulary & NASA Terms
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: '24px', overflowY: 'auto', maxHeight: '65vh' }}>
              {howToPlayTab === 'STEPS' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                  <div style={{ background: '#091433', border: '1.5px solid #1e3a8a', borderRadius: '16px', padding: '18px' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 900, color: '#fff', marginBottom: '12px' }}>
                      1
                    </div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc', margin: '0 0 8px 0' }}>
                      Build & Upgrade Modules
                    </h3>
                    <p style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: 1.5, margin: 0 }}>
                      Each Sol, spend your <strong>Engineering Build Points (BP)</strong> to erect solar panels, water recyclers, space greenhouses, and regolith radiation berms.
                    </p>
                  </div>

                  <div style={{ background: '#091433', border: '1.5px solid #1e3a8a', borderRadius: '16px', padding: '18px' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 900, color: '#fff', marginBottom: '12px' }}>
                      2
                    </div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc', margin: '0 0 8px 0' }}>
                      Balance Power & Life Support
                    </h3>
                    <p style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: 1.5, margin: 0 }}>
                      Everything is connected: a power blackout shuts down heaters and air filters! Keep batteries charged before the freezing 14-day lunar night or Martian dust storm hits.
                    </p>
                  </div>

                  <div style={{ background: '#091433', border: '1.5px solid #1e3a8a', borderRadius: '16px', padding: '18px' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 900, color: '#fff', marginBottom: '12px' }}>
                      3
                    </div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc', margin: '0 0 8px 0' }}>
                      Keep Your Crew Alive & Happy
                    </h3>
                    <p style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: 1.5, margin: 0 }}>
                      Solve daily unexpected events like solar flares or air leaks. Keep crew health and morale high to complete the mission and earn your Junior Astronaut Star Rating!
                    </p>
                  </div>
                </div>
              )}

              {howToPlayTab === 'RESOURCES' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {SEVEN_RESOURCES.map((r) => (
                    <div
                      key={r.id}
                      style={{
                        background: '#091433',
                        border: '1px solid #1e3a8a',
                        borderRadius: '12px',
                        padding: '12px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '14px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {r.icon}
                        </div>
                        <div>
                          <strong style={{ fontSize: '14px', color: '#fff' }}>{r.name}</strong>
                          <div style={{ fontSize: '12px', color: '#cbd5e1', marginTop: '2px' }}>
                            {r.simpleTooltip}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {howToPlayTab === 'VOCAB' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ background: 'rgba(2, 132, 199, 0.15)', border: '1px solid #0284c7', borderRadius: '12px', padding: '12px 16px', fontSize: '13px', color: '#e0f2fe' }}>
                    💡 <strong>Kids & Teen Astronaut Translation:</strong> Simple words in the game, but every mechanic is calibrated directly from real NASA engineering manuals!
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {[
                      { simple: 'NASA Life Support Rules', tech: 'Baseline Values for Exploration (BVAD)', note: 'NASA standard human metabolic constants' },
                      { simple: 'Life Support Systems', tech: 'Environmental Control and Life Support System (ECLSS)', note: 'Hardware that keeps astronauts alive' },
                      { simple: 'Melted Moon Dust Bricks', tech: 'Sintered Regolith Radiation Vault', note: 'Microwave-melted lunar dirt for heavy radiation shielding' },
                      { simple: 'Space Greenhouse', tech: 'Hydroponic Plant Growth Chambers', note: 'LED-powered closed-loop vegetable production' },
                      { simple: 'Air Cleaners', tech: 'CO2 Removal Scrubbers / MOXIE', note: 'Filters toxic CO2 out and pumps pure O2 into the cabin' },
                    ].map((item, i) => (
                      <div
                        key={i}
                        style={{
                          background: '#091433',
                          border: '1px solid #1e3a8a',
                          borderRadius: '10px',
                          padding: '12px 16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '12px',
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 800, color: '#f8fafc' }}>
                            {item.simple}
                          </div>
                          <div style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '2px' }}>
                            {item.note}
                          </div>
                        </div>
                        <div
                          style={{
                            background: '#020617',
                            border: '1px solid #334155',
                            padding: '6px 12px',
                            borderRadius: '8px',
                            color: '#38bdf8',
                            fontSize: '11.5px',
                            fontWeight: 700,
                            fontFamily: 'monospace',
                            textAlign: 'right',
                          }}
                        >
                          NASA: {item.tech}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div
              style={{
                padding: '16px 24px',
                background: '#0a1638',
                borderTop: '1px solid #1e293b',
                display: 'flex',
                justifyContent: 'flex-end',
              }}
            >
              <button
                onClick={() => {
                  soundFx.playClick(750);
                  setIsHowToPlayOpen(false);
                  handleOpenWizard('MOON');
                }}
                style={{
                  background: '#f97316',
                  border: 'none',
                  color: '#fff',
                  fontWeight: 800,
                  fontSize: '13px',
                  padding: '10px 24px',
                  borderRadius: '9999px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span>Ready to Launch</span>
                <Rocket size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          "CREDITS" POPUP MODAL
         ════════════════════════════════════════════════════════════════════ */}
      {isCreditsOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 2200,
            background: 'rgba(2, 6, 23, 0.92)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '680px',
              maxHeight: '85vh',
              background: '#070f26',
              border: '2px solid #3b82f6',
              borderRadius: '24px',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              boxShadow: '0 25px 60px rgba(0,0,0,0.9), 0 0 35px rgba(59, 130, 246, 0.25)',
            }}
          >
            <div
              style={{
                padding: '18px 24px',
                background: '#0a1638',
                borderBottom: '1px solid #1e293b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Award size={22} className="text-amber-400" />
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                  NASA Space Apps Credits & Scientific Citations
                </h2>
              </div>
              <button
                onClick={() => {
                  soundFx.playClick(750);
                  setIsCreditsOpen(false);
                }}
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid #334155',
                  color: '#cbd5e1',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: '#091433', border: '1px solid #1e3a8a', borderRadius: '14px', padding: '16px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#f8fafc', margin: '0 0 6px 0' }}>
                  🚀 NASA Space Apps Challenge 2026
                </h3>
                <p style={{ fontSize: '12.5px', color: '#cbd5e1', lineHeight: 1.5, margin: 0 }}>
                  Built for the global challenge <em>"Build a Junior Astronaut Mission Trainer"</em>. Designed to give students aged 10–16 hands-on experience running a lunar or Martian outpost, balancing real life-support trade-offs.
                </p>
                <div style={{ marginTop: '10px', fontSize: '12px', color: '#38bdf8', fontWeight: 700 }}>
                  Created with passion by <strong>Team Mysterio</strong>.
                </div>
              </div>

              <div style={{ background: '#091433', border: '1px solid #1e3a8a', borderRadius: '14px', padding: '16px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#f8fafc', margin: '0 0 8px 0' }}>
                  🔬 Official NASA Data Sources & Calibration
                </h3>
                <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12.5px', color: '#cbd5e1', lineHeight: 1.6 }}>
                  <li><strong>NASA BVAD (Baseline Values for Exploration):</strong> Human metabolic consumption rates: 0.84 kg O2/day, 2.50 L water/day, 0.62 kg dry food/day.</li>
                  <li><strong>NASA Artemis Base Camp:</strong> Shackleton crater polar illumination, 14-day lunar night, water-ice regolith extraction.</li>
                  <li><strong>NASA Perseverance & MOXIE:</strong> Mars in-situ resource utilization producing oxygen directly from CO2 atmosphere.</li>
                  <li><strong>NASA Kilopower STMD:</strong> Compact 1–10 kWe fission Stirling reactor power systems for deep space habitats.</li>
                  <li><strong>NASA ECLSS & ISS:</strong> Water recovery system (WRS) achieving 98%+ closed-loop water recovery.</li>
                </ul>
              </div>

              {/* Requirement 8: NASA Background Image Credits */}
              <div style={{ background: '#091433', border: '1px solid #1e3a8a', borderRadius: '14px', padding: '16px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#f8fafc', margin: '0 0 8px 0' }}>
                  📸 Official NASA Background Image Credits
                </h3>
                <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: '#cbd5e1', lineHeight: 1.6 }}>
                  <li><strong>Moon Surface:</strong> "Moon Shackleton Crater and South Pole Regolith" by NASA / Lunar Reconnaissance Orbiter (LRO) Camera Team / Arizona State University, public domain.</li>
                  <li><strong>Mars Panorama:</strong> "Jezero Crater 360-Degree Panorama" by NASA / JPL-Caltech / ASU / MSSS (Perseverance Mastcam-Z), public domain.</li>
                  <li><strong>Earth from Space:</strong> "Earth Western Hemisphere from Space" by NASA / Apollo / DSCOVR Science Team, public domain.</li>
                </ul>
              </div>
            </div>

            <div
              style={{
                padding: '16px 24px',
                background: '#0a1638',
                borderTop: '1px solid #1e293b',
                display: 'flex',
                justifyContent: 'flex-end',
              }}
            >
              <button
                onClick={() => setIsCreditsOpen(false)}
                style={{
                  background: '#0284c7',
                  border: 'none',
                  color: '#fff',
                  fontWeight: 800,
                  fontSize: '13px',
                  padding: '8px 20px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameLandingHomePage;
