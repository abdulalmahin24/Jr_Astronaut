import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import {
  X,
  Play,
  RotateCcw,
  Sparkles,
  Rocket,
  Compass,
  Zap,
  Shield,
  Activity,
  Layers,
  Award,
  Radio,
  Sliders,
  ChevronRight,
  Maximize2,
  Minimize2,
  Info,
  CheckCircle2,
  Volume2,
  VolumeX,
  Bot,
  Crosshair,
  Eye,
  Flame,
  Globe,
  Radar,
  FastForward,
  Gauge,
  Cpu,
  Target,
  BatteryCharging,
  ExternalLink,
  Film,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundFx } from '../utils/audioEffects';
import { disposeThreeScene } from '../utils/threeDisposeHelper';
import {
  NASA_MAPS,
  NASA_VEHICLES,
  NASA_30_MISSIONS,
} from '../data/nasaInteractiveMissions';
import type {
  PlanetMapConfig,
  VehicleConfig,
  NasaLevelMission,
} from '../data/nasaInteractiveMissions';
import { MissionCinematicIntro } from './MissionCinematicIntro';

export type GameSuiteMode = 'HUB' | 'MISSION_INTRO' | 'CADET_NMS' | 'OFFICER_KSP' | 'COMMANDER_SC';

interface SpaceGamesHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialGame?: GameSuiteMode;
}

// ─────────────────────────────────────────────────────────────────────────────
// PROCEDURAL CANVAS TEXTURE HELPERS (Zero external image dependencies)
// ─────────────────────────────────────────────────────────────────────────────
const createProceduralStarTexture = (): THREE.Texture => {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
  grad.addColorStop(0.2, 'rgba(165, 243, 252, 0.9)');
  grad.addColorStop(0.5, 'rgba(56, 189, 248, 0.4)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
};

const createEarthTexture = (): THREE.Texture => {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#0a2e4a';
  ctx.fillRect(0, 0, 512, 256);

  // Continents
  ctx.fillStyle = '#1e7b49';
  const continents = [
    { x: 90, y: 80, w: 90, h: 60 },
    { x: 130, y: 150, w: 60, h: 70 },
    { x: 260, y: 70, w: 90, h: 50 },
    { x: 275, y: 130, w: 90, h: 80 },
    { x: 380, y: 80, w: 100, h: 90 },
    { x: 410, y: 180, w: 60, h: 40 },
  ];
  continents.forEach(c => {
    ctx.beginPath();
    ctx.ellipse(c.x, c.y, c.w / 2, c.h / 2, 0, 0, Math.PI * 2);
    ctx.fill();
  });

  // Cloud swirls
  ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
  for (let i = 0; i < 24; i++) {
    ctx.beginPath();
    ctx.arc((i * 43) % 512, 40 + ((i * 29) % 180), 22 + (i % 14), 0, Math.PI * 2);
    ctx.fill();
  }

  return new THREE.CanvasTexture(canvas);
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN MODAL CONTAINER COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export const SpaceGamesHubModal: React.FC<SpaceGamesHubModalProps> = ({
  isOpen,
  onClose,
  initialGame = 'HUB',
}) => {
  const [activeGame, setActiveGame] = useState<GameSuiteMode>(initialGame);
  const [selectedMission, setSelectedMission] = useState<NasaLevelMission>(NASA_30_MISSIONS[0]);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleConfig>(NASA_VEHICLES[0]);
  const [isHangarOpen, setIsHangarOpen] = useState(false);

  const handleSelectMission = (mission: NasaLevelMission, directLaunch: boolean = false) => {
    setSelectedMission(mission);
    // Find recommended vehicle for this mission if current vehicle category doesn't match
    const recVeh = NASA_VEHICLES.find((v) => v.id === mission.recommendedVehicleId);
    if (recVeh && recVeh.category !== selectedVehicle.category) {
      setSelectedVehicle(recVeh);
    }
    if (directLaunch) {
      setActiveGame(mission.simulatorType);
      soundFx.playReactorStart();
    } else {
      setActiveGame('MISSION_INTRO');
      soundFx.playClick(800);
    }
  };
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);

  // High Scores / Progression
  const [scores, setScores] = useState({
    cadetCrystals: 0,
    cadetScans: 0,
    officerOrbitReached: false,
    officerDeltaV: 4850,
    commanderFaTime: 0,
    commanderKills: 0,
  });

  const handleSelectGame = (mode: GameSuiteMode) => {
    setActiveGame(mode);
    soundFx.playReactorStart();
  };

  const handleReturnToHub = () => {
    setActiveGame('HUB');
    soundFx.playClick(750);
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(2, 6, 23, 0.96)',
        backdropFilter: 'blur(16px)',
        display: 'flex',
        flexDirection: 'column',
        color: '#f8fafc',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      {/* ─── TOP MASTER NAVIGATION HEADER ─── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 24px',
          background: 'rgba(15, 23, 42, 0.88)',
          borderBottom: '1px solid rgba(56, 189, 248, 0.3)',
          backdropFilter: 'blur(12px)',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #0284c7, #7c3aed)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 16px rgba(56, 189, 248, 0.45)',
            }}
          >
            <Sparkles size={20} color="#fff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '15px', fontWeight: 900, letterSpacing: '0.04em', color: '#f8fafc' }}>
                NASA ASTRONAUT FLIGHT SIMULATION ACADEMY
              </span>
              <span
                style={{
                  fontSize: '9px',
                  fontWeight: 800,
                  background: 'rgba(56, 189, 248, 0.2)',
                  border: '1px solid #38bdf8',
                  color: '#38bdf8',
                  padding: '2px 8px',
                  borderRadius: '12px',
                }}
              >
                PRO NASA 3D ENGINE
              </span>
            </div>
            <div style={{ fontSize: '10.5px', color: '#94a3b8' }}>
              NASA Space Apps Challenge 2026 · Official Artemis &amp; Deep Space Missions
            </div>
          </div>
        </div>

        {/* Center Game Switcher Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => handleSelectGame('HUB')}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              border: activeGame === 'HUB' ? '1.5px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)',
              background: activeGame === 'HUB' ? 'rgba(56, 189, 248, 0.25)' : 'transparent',
              color: activeGame === 'HUB' ? '#38bdf8' : '#94a3b8',
              fontSize: '11px',
              fontWeight: 800,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            🏠 MISSION HUB
          </button>
          <button
            onClick={() => handleSelectGame('CADET_NMS')}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              border: activeGame === 'CADET_NMS' ? '1.5px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)',
              background: activeGame === 'CADET_NMS' ? 'rgba(56, 189, 248, 0.25)' : 'transparent',
              color: activeGame === 'CADET_NMS' ? '#38bdf8' : '#94a3b8',
              fontSize: '11px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>🧑‍🚀</span>
            <span>ARTEMIS EXPEDITION (CADET 6–10)</span>
          </button>
          <button
            onClick={() => handleSelectGame('OFFICER_KSP')}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              border: activeGame === 'OFFICER_KSP' ? '1.5px solid #fbbf24' : '1px solid rgba(255,255,255,0.1)',
              background: activeGame === 'OFFICER_KSP' ? 'rgba(251, 191, 36, 0.25)' : 'transparent',
              color: activeGame === 'OFFICER_KSP' ? '#fbbf24' : '#94a3b8',
              fontSize: '11px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>🚀</span>
            <span>SLS ORBITAL ASCENT (OFFICER 11–15)</span>
          </button>
          <button
            onClick={() => handleSelectGame('COMMANDER_SC')}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              border: activeGame === 'COMMANDER_SC' ? '1.5px solid #c084fc' : '1px solid rgba(255,255,255,0.1)',
              background: activeGame === 'COMMANDER_SC' ? 'rgba(192, 132, 252, 0.25)' : 'transparent',
              color: activeGame === 'COMMANDER_SC' ? '#c084fc' : '#94a3b8',
              fontSize: '11px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>🛰️</span>
            <span>GATEWAY INTERCEPTOR (COMMANDER 16+)</span>
          </button>
        </div>

        {/* Right Action Icons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setIsAudioMuted(!isAudioMuted)}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: isAudioMuted ? '#f87171' : '#38bdf8',
              borderRadius: '8px',
              padding: '7px 10px',
              cursor: 'pointer',
            }}
            title={isAudioMuted ? 'Unmute Audio FX' : 'Mute Audio FX'}
          >
            {isAudioMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>

          <button
            onClick={() => {
              if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(() => {});
                setIsFullscreen(true);
              } else {
                document.exitFullscreen().catch(() => {});
                setIsFullscreen(false);
              }
            }}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#cbd5e1',
              borderRadius: '8px',
              padding: '7px 10px',
              cursor: 'pointer',
            }}
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#fca5a5',
              borderRadius: '8px',
              padding: '7px 14px',
              cursor: 'pointer',
              fontWeight: 800,
              fontSize: '12px',
            }}
          >
            ✕ CLOSE
          </button>
        </div>
      </div>

      {/* ─── MAIN VIEWPORT AREA ─── */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {activeGame === 'HUB' && (
          <GameHubMenu
            onSelectMission={handleSelectMission}
            selectedVehicle={selectedVehicle}
            onSelectVehicle={setSelectedVehicle}
            scores={scores}
          />
        )}
        {activeGame === 'MISSION_INTRO' && (
          <MissionCinematicIntro
            mission={selectedMission}
            vehicle={selectedVehicle}
            map={NASA_MAPS[selectedMission.mapId] || NASA_MAPS['map-moon-aitken']}
            onLaunchGame={() => {
              setActiveGame(selectedMission.simulatorType);
              soundFx.playReactorStart();
            }}
            onBackToHub={handleReturnToHub}
            isMuted={isAudioMuted}
            onToggleMute={() => setIsAudioMuted(!isAudioMuted)}
          />
        )}
        {activeGame === 'CADET_NMS' && (
          <JuniorCadetNmsGame
            isMuted={isAudioMuted}
            onBack={handleReturnToHub}
            onUpdateScores={(crystals, scans) =>
              setScores((s) => ({ ...s, cadetCrystals: crystals, cadetScans: scans }))
            }
            mission={selectedMission}
            vehicle={selectedVehicle}
            map={NASA_MAPS[selectedMission.mapId] || NASA_MAPS['map-moon-aitken']}
          />
        )}
        {activeGame === 'OFFICER_KSP' && (
          <FlightOfficerKspGame
            isMuted={isAudioMuted}
            onBack={handleReturnToHub}
            onUpdateScores={(orbitReached, deltaV) =>
              setScores((s) => ({ ...s, officerOrbitReached: orbitReached, officerDeltaV: deltaV }))
            }
            mission={selectedMission}
            vehicle={selectedVehicle}
            map={NASA_MAPS[selectedMission.mapId] || NASA_MAPS['map-earth-lc39b']}
          />
        )}
        {activeGame === 'COMMANDER_SC' && (
          <MasterCommanderScGame
            isMuted={isAudioMuted}
            onBack={handleReturnToHub}
            onUpdateScores={(faTime, kills) =>
              setScores((s) => ({ ...s, commanderFaTime: faTime, commanderKills: kills }))
            }
            mission={selectedMission}
            vehicle={selectedVehicle}
            map={NASA_MAPS[selectedMission.mapId] || NASA_MAPS['map-psyche-belt']}
          />
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 1. ADVANCED SPACE GAMES REFERENCE DATABASE (DIRECT STEAM & RSI LINKS)
// ─────────────────────────────────────────────────────────────────────────────
export interface NasaMissionLevel {
  id: string;
  levelNumber: number;
  tier: 'CADET' | 'OFFICER' | 'COMMANDER';
  tierLabel: string;
  difficultyStars: number;
  difficultyRating: string;
  recommendedAge: string;
  codeName: string;
  title: string;
  nasaAgency: string;
  icon: string;
  accentColor: string;
  bgGradient: string;
  targetSimulator: 'CADET_NMS' | 'OFFICER_KSP' | 'COMMANDER_SC';
  targetSimulatorName: string;
  gameMechanicsInspiration: string;
  flightDirectives: string[];
  physicsEngineDetails: string;
  controlsSummary: string[];
  description: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. GAME HUB MENU (30 MISSIONS · 8 MAPS · 9 SPACECRAFT HANGAR)
// ─────────────────────────────────────────────────────────────────────────────
interface GameHubMenuProps {
  onSelectMission: (mission: NasaLevelMission, directLaunch?: boolean) => void;
  selectedVehicle: VehicleConfig;
  onSelectVehicle: (vehicle: VehicleConfig) => void;
  scores: any;
}

const GameHubMenu: React.FC<GameHubMenuProps> = ({
  onSelectMission,
  selectedVehicle,
  onSelectVehicle,
  scores,
}) => {
  const [activeTier, setActiveTier] = useState<
    'ALL' | 'RANK_1' | 'RANK_2' | 'RANK_3' | 'RANK_4' | 'RANK_5' | 'RANK_6' | 'CADET' | 'OFFICER' | 'COMMANDER'
  >('ALL');
  const [selectedMapFilter, setSelectedMapFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isHangarOpen, setIsHangarOpen] = useState(false);
  const [hangarCategory, setHangarCategory] = useState<'ROVER' | 'ROCKET' | 'STARSHIP'>('ROVER');

  // Filter 30 missions based on Tier, Map, and Search
  const filteredMissions = NASA_30_MISSIONS.filter((m) => {
    if (activeTier === 'RANK_1' && (m.missionNumber < 1 || m.missionNumber > 5)) return false;
    if (activeTier === 'RANK_2' && (m.missionNumber < 6 || m.missionNumber > 10)) return false;
    if (activeTier === 'RANK_3' && (m.missionNumber < 11 || m.missionNumber > 15)) return false;
    if (activeTier === 'RANK_4' && (m.missionNumber < 16 || m.missionNumber > 20)) return false;
    if (activeTier === 'RANK_5' && (m.missionNumber < 21 || m.missionNumber > 25)) return false;
    if (activeTier === 'RANK_6' && (m.missionNumber < 26 || m.missionNumber > 30)) return false;
    if (activeTier === 'CADET' && m.tier !== 'CADET') return false;
    if (activeTier === 'OFFICER' && m.tier !== 'OFFICER') return false;
    if (activeTier === 'COMMANDER' && m.tier !== 'COMMANDER') return false;
    if (selectedMapFilter !== 'ALL' && m.mapId !== selectedMapFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        m.title.toLowerCase().includes(q) ||
        m.codeName.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        m.difficultyLabel.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div
      style={{
        height: '100%',
        overflowY: 'auto',
        padding: '28px 36px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '22px',
        background: 'radial-gradient(ellipse at center, rgba(14, 165, 233, 0.08) 0%, rgba(2, 6, 23, 0.98) 100%)',
      }}
    >
      {/* ── TOP ACADEMY HEADER ── */}
      <div style={{ textAlign: 'center', maxWidth: '980px', width: '100%' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(56, 189, 248, 0.12)',
            border: '1px solid rgba(56, 189, 248, 0.35)',
            padding: '5px 18px',
            borderRadius: '24px',
            fontSize: '11px',
            fontWeight: 800,
            color: '#38bdf8',
            marginBottom: '10px',
          }}
        >
          <Sparkles size={14} />
          <span>NASA SPACE APPS CHALLENGE · ASTRONAUT FLIGHT ACADEMY: 30 MISSIONS · 8 MAPS · 9 VEHICLES</span>
        </div>
        <h1
          style={{
            fontSize: '32px',
            fontWeight: 900,
            letterSpacing: '-0.02em',
            margin: '0 0 8px 0',
            background: 'linear-gradient(135deg, #ffffff 30%, #7dd3fc 70%, #a855f7 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          NASA ASTRONAUT ACADEMY: PROGRESSIVE FLIGHT MISSIONS
        </h1>
        <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: '1.6', margin: '0 auto 18px auto', maxWidth: '820px' }}>
          Select your spacecraft, venture across 8 real planetary destinations (Moon, Mars, Europa, Titan, LC-39B, Psyche Belt, Lunar Gateway &amp; Deep Space), and progress through 30 top-notch missions from novice cadet to master flight commander.
        </p>

        {/* ── VEHICLE HANGAR BANNER (QUICK SELECTOR) ── */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(8, 14, 28, 0.98))',
            border: '1.5px solid rgba(56, 189, 248, 0.4)',
            borderRadius: '16px',
            padding: '14px 22px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            boxShadow: '0 8px 26px rgba(0,0,0,0.5)',
            marginBottom: '18px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #0284c7, #38bdf8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                boxShadow: '0 0 16px rgba(56, 189, 248, 0.5)',
              }}
            >
              {selectedVehicle.icon}
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '9.5px', fontWeight: 900, background: 'rgba(56, 189, 248, 0.2)', border: '1px solid #38bdf8', color: '#38bdf8', padding: '2px 8px', borderRadius: '10px' }}>
                  EQUIPPED: {selectedVehicle.badge}
                </span>
                <span style={{ fontSize: '11px', color: '#64748b' }}>{selectedVehicle.category}</span>
              </div>
              <div style={{ fontSize: '16px', fontWeight: 900, color: '#f8fafc', marginTop: '2px' }}>
                {selectedVehicle.name}
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8', display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '2px' }}>
                <span>⚡ {selectedVehicle.thrust}</span>
                <span>💨 {selectedVehicle.topSpeed}</span>
                <span>📡 {selectedVehicle.sensorSuite}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              setIsHangarOpen(true);
              soundFx.playClick(850);
            }}
            style={{
              background: 'linear-gradient(135deg, #0284c7, #7c3aed)',
              border: '1px solid #38bdf8',
              color: '#ffffff',
              padding: '10px 18px',
              borderRadius: '10px',
              fontSize: '12px',
              fontWeight: 900,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)',
              transition: 'all 0.15s ease',
            }}
          >
            <span>🔧</span>
            <span>CHOOSE SPACECRAFT / OPEN HANGAR</span>
          </button>
        </div>

        {/* ── AGE TIER FILTERS (10 MISSIONS PER AGE TIER) ── */}
        <div
          style={{
            display: 'inline-flex',
            gap: '8px',
            background: 'rgba(15, 23, 42, 0.85)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: '12px',
            padding: '4px',
            boxShadow: '0 0 20px rgba(0,0,0,0.4)',
            flexWrap: 'wrap',
            justifyContent: 'center',
            marginBottom: '14px',
          }}
        >
          {[
            { id: 'ALL', label: 'ALL 30 MISSIONS', icon: '🌌', sub: 'All 6 Ranks' },
            { id: 'RANK_1', label: 'L1: STARGAZER (6–8 YRS)', icon: '🔭', sub: 'Missions 1–5' },
            { id: 'RANK_2', label: 'L2: ASCAN (9–11 YRS)', icon: '🪖', sub: 'Missions 6–10' },
            { id: 'RANK_3', label: 'L3: FLIGHT ENGINEER (12–14 YRS)', icon: '🛠️', sub: 'Missions 11–15' },
            { id: 'RANK_4', label: 'L4: LUNAR NAVIGATOR (15–17 YRS)', icon: '🚜', sub: 'Missions 16–20' },
            { id: 'RANK_5', label: 'L5: OUTPOST COMMANDER (18–21 YRS)', icon: '👑', sub: 'Missions 21–25' },
            { id: 'RANK_6', label: 'L6: SUPREME MASTER (22+ YRS & ADULTS)', icon: '🌌', sub: 'Missions 26–30' },
          ].map((tab) => {
            const active = activeTier === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTier(tab.id as any);
                  soundFx.playClick(750);
                }}
                style={{
                  padding: '7px 14px',
                  borderRadius: '9px',
                  fontSize: '11px',
                  fontWeight: 800,
                  border: active ? '1.5px solid #38bdf8' : '1px solid rgba(255,255,255,0.08)',
                  background: active ? 'linear-gradient(135deg, #0284c7, #0369a1)' : 'rgba(15, 23, 42, 0.6)',
                  color: active ? '#ffffff' : '#94a3b8',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                  boxShadow: active ? '0 0 14px rgba(56, 189, 248, 0.4)' : 'none',
                }}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ── MAP DESTINATION FILTER PILLS ── */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
          {[
            { id: 'ALL', label: 'All 8 Destinations', icon: '🪐' },
            { id: 'map-moon-aitken', label: 'Moon (Aitken Basin)', icon: '🌕' },
            { id: 'map-mars-jezero', label: 'Mars (Jezero Crater)', icon: '🔴' },
            { id: 'map-europa-rift', label: 'Europa (Ice Ocean)', icon: '🧊' },
            { id: 'map-titan-kraken', label: 'Titan (Methane Sea)', icon: '🪐' },
            { id: 'map-earth-lc39b', label: 'Earth (Kennedy LC-39B)', icon: '🌍' },
            { id: 'map-psyche-belt', label: 'Asteroid 16 Psyche', icon: '☄️' },
            { id: 'map-gateway-nrho', label: 'Lunar Gateway Orbit', icon: '🛰️' },
            { id: 'map-nebula-eagle', label: 'Eagle Nebula Deep Space', icon: '🌌' },
          ].map((mp) => {
            const active = selectedMapFilter === mp.id;
            return (
              <button
                key={mp.id}
                onClick={() => {
                  setSelectedMapFilter(mp.id);
                  soundFx.playClick(650);
                }}
                style={{
                  padding: '4px 10px',
                  borderRadius: '8px',
                  fontSize: '10.5px',
                  fontWeight: 700,
                  border: active ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.08)',
                  background: active ? 'rgba(56, 189, 248, 0.2)' : 'rgba(15, 23, 42, 0.6)',
                  color: active ? '#38bdf8' : '#94a3b8',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span>{mp.icon}</span>
                <span>{mp.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 30 MISSIONS GRID ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
          gap: '20px',
          width: '100%',
          maxWidth: '1360px',
        }}
      >
        {filteredMissions.map((mission) => {
          const mapConfig = NASA_MAPS[mission.mapId] || NASA_MAPS['map-moon-aitken'];
          const recVehicle = NASA_VEHICLES.find((v) => v.id === mission.recommendedVehicleId) || NASA_VEHICLES[0];
          const starsString = '⭐'.repeat(mission.difficultyStars);

          return (
            <div
              key={mission.id}
              style={{
                background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.94) 0%, rgba(8, 14, 28, 0.98) 100%)',
                border: `1.5px solid ${mapConfig.accentColor}55`,
                borderRadius: '18px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '14px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                position: 'relative',
                overflow: 'hidden',
                transition: 'transform 0.2s ease, border-color 0.2s ease',
              }}
            >
              {/* Top Accent Gradient Line */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '3px',
                  background: `linear-gradient(90deg, transparent, ${mapConfig.accentColor}, transparent)`,
                }}
              />

              {/* Header: Mission Number, Stars, Age */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 900,
                        background: `${mapConfig.accentColor}22`,
                        border: `1px solid ${mapConfig.accentColor}`,
                        color: mapConfig.accentColor,
                        padding: '2px 8px',
                        borderRadius: '10px',
                        letterSpacing: '0.04em',
                      }}
                    >
                      MISSION #{mission.missionNumber.toString().padStart(2, '0')}
                    </span>
                    <span style={{ fontSize: '11px', color: '#fbbf24', letterSpacing: '1px' }}>
                      {starsString}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span
                      style={{
                        fontSize: '9.5px',
                        fontWeight: 800,
                        color: '#38bdf8',
                        background: 'rgba(56, 189, 248, 0.16)',
                        border: '1px solid rgba(56, 189, 248, 0.4)',
                        padding: '2px 7px',
                        borderRadius: '6px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <Film size={11} /> 3D VIDEO
                    </span>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 800,
                        color: '#cbd5e1',
                        background: 'rgba(255, 255, 255, 0.08)',
                        padding: '2px 8px',
                        borderRadius: '8px',
                      }}
                    >
                      {mission.ageGroup}
                    </span>
                  </div>
                </div>

                {/* Map Destination Banner */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'rgba(0, 0, 0, 0.35)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '8px',
                    padding: '5px 10px',
                    marginBottom: '10px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '14px' }}>{mission.simulatorType === 'CADET_NMS' ? '🌕' : mission.simulatorType === 'OFFICER_KSP' ? '🚀' : '⚡'}</span>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: mapConfig.accentColor }}>
                      {mapConfig.name}
                    </span>
                  </div>
                  <span style={{ fontSize: '9.5px', color: '#94a3b8' }}>
                    {mapConfig.gravityLabel} · {mapConfig.atmospherePressure}
                  </span>
                </div>

                {/* Identity Title */}
                <div style={{ marginBottom: '8px' }}>
                  <div style={{ fontSize: '10px', fontWeight: 800, color: mapConfig.accentColor, letterSpacing: '0.04em' }}>
                    {mission.codeName}
                  </div>
                  <h3 style={{ fontSize: '16px', fontWeight: 900, color: '#f8fafc', margin: '2px 0 2px 0', lineHeight: '1.25' }}>
                    {mission.title}
                  </h3>
                  <div style={{ fontSize: '10.5px', color: '#64748b' }}>{mission.nasaDepartment}</div>
                </div>

                {/* Difficulty Label */}
                <div
                  style={{
                    background: 'rgba(0,0,0,0.25)',
                    borderRadius: '6px',
                    padding: '3px 8px',
                    fontSize: '9.5px',
                    fontWeight: 800,
                    color: mapConfig.accentColor,
                    display: 'inline-block',
                    marginBottom: '8px',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  DIFFICULTY: {mission.difficultyLabel.toUpperCase()}
                </div>

                <p style={{ fontSize: '11.5px', color: '#cbd5e1', lineHeight: '1.5', margin: '0 0 10px 0' }}>
                  {mission.description}
                </p>

                {/* Physics Highlight */}
                <div
                  style={{
                    background: 'rgba(56, 189, 248, 0.06)',
                    borderRadius: '8px',
                    padding: '7px 10px',
                    marginBottom: '10px',
                    borderLeft: `3px solid ${mapConfig.accentColor}`,
                  }}
                >
                  <div style={{ fontSize: '9px', color: mapConfig.accentColor, fontWeight: 900, marginBottom: '2px' }}>
                    ⚛️ SIMULATION &amp; PHYSICS HIGHLIGHT:
                  </div>
                  <div style={{ fontSize: '10.5px', color: '#e2e8f0', fontWeight: 600, lineHeight: '1.4' }}>
                    {mission.physicsHighlight}
                  </div>
                </div>

                {/* Flight Directives Checklist */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '10px' }}>
                  <div style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 800, letterSpacing: '0.04em' }}>
                    FLIGHT DIRECTIVES:
                  </div>
                  {mission.objectives.map((directive, dIdx) => (
                    <div key={dIdx} style={{ fontSize: '10.5px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CheckCircle2 size={12} color="#10b981" style={{ flexShrink: 0 }} />
                      <span>{directive}</span>
                    </div>
                  ))}
                </div>

                {/* Recommended Vehicle */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', color: '#cbd5e1', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 800, color: '#94a3b8' }}>RECOMMENDED:</span>
                  <span style={{ background: 'rgba(255,255,255,0.08)', padding: '2px 7px', borderRadius: '6px', color: '#38bdf8', fontWeight: 700 }}>
                    {recVehicle.icon} {recVehicle.name}
                  </span>
                </div>
              </div>

              {/* Unified Movie-Style Mission Launch (3D Cinematic Trailer -> Flight Simulation) */}
              <button
                onClick={() => {
                  soundFx.playReactorStart();
                  onSelectMission(mission);
                }}
                style={{
                  width: '100%',
                  background: `linear-gradient(135deg, ${mapConfig.accentColor}, #0284c7)`,
                  border: 'none',
                  color: '#ffffff',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  boxShadow: `0 4px 18px ${mapConfig.accentColor}44`,
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = `0 6px 24px ${mapConfig.accentColor}66`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = `0 4px 18px ${mapConfig.accentColor}44`;
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 900, letterSpacing: '0.04em' }}>
                  <Play size={14} fill="currentColor" />
                  <span>LAUNCH MISSION #{mission.missionNumber.toString().padStart(2, '0')}</span>
                </div>
                <div style={{ fontSize: '9.5px', color: 'rgba(255, 255, 255, 0.85)', fontWeight: 700, letterSpacing: '0.04em' }}>
                  🎬 3D CINEMATIC TRAILER &rarr; 🚀 FLIGHT SIMULATOR
                </div>
              </button>
            </div>
          );
        })}
      </div>

      {/* ── INTERACTIVE SPACECRAFT HANGAR MODAL ── */}
      {isHangarOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            background: 'rgba(2, 6, 23, 0.92)',
            backdropFilter: 'blur(16px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
          }}
        >
          <div
            style={{
              background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.98), rgba(8, 14, 28, 0.99))',
              border: '2px solid rgba(56, 189, 248, 0.5)',
              borderRadius: '20px',
              padding: '28px',
              maxWidth: '1040px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
            }}
          >
            {/* Hangar Top Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 900, color: '#38bdf8', letterSpacing: '0.05em' }}>
                  NASA ASTRONAUT ACADEMY SPACECRAFT HANGAR
                </div>
                <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#f8fafc', margin: '4px 0 0 0' }}>
                  CHOOSE YOUR EXPLORATION VEHICLE
                </h2>
              </div>
              <button
                onClick={() => setIsHangarOpen(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#f8fafc',
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  fontSize: '16px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ✕
              </button>
            </div>

            {/* Hangar Category Tabs */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              {[
                { id: 'ROVER', label: '🚜 SURFACE ROVERS & CRAWLERS (3)', desc: 'Planetary Regolith, Ice, & Dunes' },
                { id: 'ROCKET', label: '🚀 HEAVY LAUNCH VEHICLES (3)', desc: 'Suborbital Staging & Keplerian Ascent' },
                { id: 'STARSHIP', label: '🛸 DEEP SPACE STARFIGHTERS (3)', desc: '6-DOF FA-OFF Drift & Kinetic Defense' },
              ].map((cTab) => {
                const active = hangarCategory === cTab.id;
                return (
                  <button
                    key={cTab.id}
                    onClick={() => {
                      setHangarCategory(cTab.id as any);
                      soundFx.playClick(750);
                    }}
                    style={{
                      padding: '10px 20px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 900,
                      border: active ? '1.5px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)',
                      background: active ? 'linear-gradient(135deg, #0284c7, #0369a1)' : 'rgba(15, 23, 42, 0.7)',
                      color: active ? '#ffffff' : '#94a3b8',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '2px',
                    }}
                  >
                    <span>{cTab.label}</span>
                    <span style={{ fontSize: '9.5px', color: active ? '#bae6fd' : '#64748b' }}>{cTab.desc}</span>
                  </button>
                );
              })}
            </div>

            {/* 3 Vehicles Cards for Selected Category */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '18px',
              }}
            >
              {NASA_VEHICLES.filter((v) => v.category === hangarCategory).map((veh) => {
                const isSelected = selectedVehicle.id === veh.id;
                return (
                  <div
                    key={veh.id}
                    style={{
                      background: isSelected
                        ? 'linear-gradient(180deg, rgba(2, 132, 199, 0.25) 0%, rgba(15, 23, 42, 0.95) 100%)'
                        : 'rgba(15, 23, 42, 0.75)',
                      border: isSelected ? '2px solid #38bdf8' : '1px solid rgba(255,255,255,0.12)',
                      borderRadius: '16px',
                      padding: '20px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '14px',
                      boxShadow: isSelected ? '0 0 24px rgba(56, 189, 248, 0.4)' : 'none',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <span style={{ fontSize: '32px' }}>{veh.icon}</span>
                        <span
                          style={{
                            fontSize: '9.5px',
                            fontWeight: 900,
                            background: isSelected ? '#10b981' : 'rgba(255,255,255,0.08)',
                            color: '#ffffff',
                            padding: '3px 8px',
                            borderRadius: '8px',
                          }}
                        >
                          {isSelected ? '✓ ACTIVE EQUIPPED' : veh.badge}
                        </span>
                      </div>

                      <h3 style={{ fontSize: '17px', fontWeight: 900, color: '#f8fafc', margin: '0 0 4px 0' }}>
                        {veh.name}
                      </h3>
                      <p style={{ fontSize: '11.5px', color: '#94a3b8', lineHeight: '1.5', margin: '0 0 12px 0' }}>
                        {veh.description}
                      </p>

                      {/* Stats Table */}
                      <div
                        style={{
                          background: 'rgba(0,0,0,0.3)',
                          borderRadius: '10px',
                          padding: '10px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px',
                          fontSize: '11px',
                          marginBottom: '12px',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#64748b' }}>Thrust / Power:</span>
                          <span style={{ color: '#e2e8f0', fontWeight: 700 }}>{veh.thrust}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#64748b' }}>Top Velocity:</span>
                          <span style={{ color: '#38bdf8', fontWeight: 700 }}>{veh.topSpeed}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#64748b' }}>Handling:</span>
                          <span style={{ color: '#cbd5e1' }}>{veh.handling}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#64748b' }}>Sensors:</span>
                          <span style={{ color: '#a855f7' }}>{veh.sensorSuite}</span>
                        </div>
                      </div>

                      {/* Flight Features Checklist */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {veh.flightCharacteristics.map((feat, fIdx) => (
                          <div key={fIdx} style={{ fontSize: '10.5px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <CheckCircle2 size={12} color="#38bdf8" style={{ flexShrink: 0 }} />
                            <span>{feat}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        onSelectVehicle(veh);
                        soundFx.playSuccess();
                      }}
                      style={{
                        width: '100%',
                        background: isSelected
                          ? 'linear-gradient(135deg, #059669, #10b981)'
                          : 'linear-gradient(135deg, #0284c7, #0369a1)',
                        border: 'none',
                        color: '#ffffff',
                        padding: '11px',
                        borderRadius: '10px',
                        fontSize: '12px',
                        fontWeight: 900,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        boxShadow: isSelected ? '0 4px 14px rgba(16, 185, 129, 0.4)' : 'none',
                      }}
                    >
                      <span>{isSelected ? '✓ CURRENTLY EQUIPPED' : 'SELECT & EQUIP THIS SPACECRAFT'}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
interface CadetGameProps {
  isMuted: boolean;
  onBack: () => void;
  onUpdateScores: (crystals: number, scans: number) => void;
  mission?: NasaLevelMission;
  vehicle?: VehicleConfig;
  map?: PlanetMapConfig;
}

const JuniorCadetNmsGame: React.FC<CadetGameProps> = ({ isMuted, onBack, onUpdateScores, mission, vehicle, map }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [crystalCount, setCrystalCount] = useState(0);
  const [scannedArtifacts, setScannedArtifacts] = useState<string[]>([]);
  const [laserActive, setLaserActive] = useState(false);
  const [laserHeat, setLaserHeat] = useState(0);
  const [jetpackFuel, setJetpackFuel] = useState(100);
  const [hazardShield, setHazardShield] = useState(100);
  const [discoveryPopup, setDiscoveryPopup] = useState<string | null>(null);
  const [speedKmh, setSpeedKmh] = useState(0);
  const [evaMode, setEvaMode] = useState(false);
  const [evaDone, setEvaDone] = useState(false);
  const [roverDistance, setRoverDistance] = useState(0);
  const [missionComplete, setMissionComplete] = useState(false);
  const [isVisorScanning, setIsVisorScanning] = useState(false);
  const [flagPlanted, setFlagPlanted] = useState(false);
  const [showSpectrometer, setShowSpectrometer] = useState(false);
  const [analyzedMinerals, setAnalyzedMinerals] = useState<string[]>([]);

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    const activeMap = map || NASA_MAPS['map-moon-aitken'];
    const activeVehicle = vehicle || NASA_VEHICLES[0];

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(activeMap.skyColor);
    scene.fog = new THREE.FogExp2(activeMap.fogColor, activeMap.fogDensity);

    // Optimized camera for dynamic action view of the rover
    const camera = new THREE.PerspectiveCamera(54, width / height, 0.1, 1000);
    camera.position.set(3.2, 5.0, 11.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // ─── Procedural Starfield & Sky ───
    const starGeo = new THREE.BufferGeometry();
    const starCount = 1400;
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      const r = 260 + Math.random() * 100;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      starPos[i] = r * Math.sin(phi) * Math.cos(theta);
      starPos[i + 1] = Math.abs(r * Math.cos(phi)) + 12;
      starPos[i + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 2.2,
      map: createProceduralStarTexture(),
      transparent: true,
      blending: THREE.AdditiveBlending,
    });
    const starPoints = new THREE.Points(starGeo, starMat);
    scene.add(starPoints);

    // Dynamic Celestial Body Tailored to Active Map (Earth, Jupiter, Saturn, Phobos, Sun)
    const celestGeo = new THREE.SphereGeometry(activeMap.celestialBody.size * 0.45, 32, 32);
    let celestMat: THREE.Material;
    if (activeMap.celestialBody.type === 'EARTH') {
      celestMat = new THREE.MeshStandardMaterial({
        map: createEarthTexture(),
        roughness: 0.6,
        metalness: 0.1,
      });
    } else {
      celestMat = new THREE.MeshStandardMaterial({
        color: activeMap.celestialBody.color,
        emissive: activeMap.celestialBody.color,
        emissiveIntensity: 0.35,
        roughness: 0.7,
      });
    }
    const celestialMesh = new THREE.Mesh(celestGeo, celestMat);
    celestialMesh.position.set(...activeMap.celestialBody.position);
    scene.add(celestialMesh);

    // If Saturn, render tilted particle ring system
    if (activeMap.celestialBody.type === 'SATURN') {
      const saturnRingGeo = new THREE.RingGeometry(activeMap.celestialBody.size * 0.55, activeMap.celestialBody.size * 0.95, 64);
      const saturnRingMat = new THREE.MeshBasicMaterial({ color: 0xfde047, side: THREE.DoubleSide, transparent: true, opacity: 0.65 });
      const saturnRing = new THREE.Mesh(saturnRingGeo, saturnRingMat);
      saturnRing.rotation.x = Math.PI / 2.6;
      celestialMesh.add(saturnRing);
    }

    // Dynamic solar and ambient illumination matching map profile
    const ambientLight = new THREE.AmbientLight(activeMap.ambientLight.color, activeMap.ambientLight.intensity * 2.2);
    scene.add(ambientLight);
    const sunLight = new THREE.DirectionalLight(activeMap.sunLight.color, activeMap.sunLight.intensity * 2.2);
    sunLight.position.set(...activeMap.sunLight.position);
    sunLight.castShadow = true;
    scene.add(sunLight);

    // ─── Procedural Realistic Martian Soil & Regolith Canvas Texture ───
    const createMartianSoilTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 1024;
      const ctx = canvas.getContext('2d')!;

      // Base Martian Red-Ochre Clay Soil Gradient
      const grad = ctx.createLinearGradient(0, 0, 1024, 1024);
      grad.addColorStop(0, '#9a3412');
      grad.addColorStop(0.25, '#c2410c');
      grad.addColorStop(0.6, '#7c2d12');
      grad.addColorStop(0.85, '#8c3116');
      grad.addColorStop(1, '#631f0c');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1024, 1024);

      // Fine Regolith Dust Grains & Sand Streaks (Per-pixel noise)
      const imgData = ctx.getImageData(0, 0, 1024, 1024);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        const noise = (Math.random() - 0.5) * 55;
        data[i] = Math.min(255, Math.max(0, data[i] + noise * 1.3));
        data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise * 0.7));
        data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise * 0.4));
      }
      ctx.putImageData(imgData, 0, 0);

      // Sand Dune Ripples & Wind Striations
      ctx.lineWidth = 14;
      for (let y = 0; y < 1024; y += 32) {
        ctx.strokeStyle = y % 64 === 0 ? 'rgba(234, 88, 12, 0.28)' : 'rgba(124, 45, 18, 0.32)';
        ctx.beginPath();
        ctx.moveTo(0, y);
        for (let x = 0; x <= 1024; x += 64) {
          const cy = y + Math.sin(x * 0.02 + y * 0.015) * 14;
          ctx.lineTo(x, cy);
        }
        ctx.stroke();
      }

      // Pebbles, Gravel & Crushed Basalt Flecks
      for (let p = 0; p < 900; p++) {
        const px = Math.random() * 1024;
        const py = Math.random() * 1024;
        const pr = 1.2 + Math.random() * 3.8;
        const isDark = Math.random() > 0.45;
        ctx.fillStyle = isDark ? 'rgba(41, 15, 8, 0.75)' : 'rgba(251, 146, 60, 0.65)';
        ctx.beginPath();
        ctx.arc(px, py, pr, 0, Math.PI * 2);
        ctx.fill();
      }

      // Embedded Crag Stones & Impact Chits
      for (let s = 0; s < 140; s++) {
        const sx = Math.random() * 1024;
        const sy = Math.random() * 1024;
        const sw = 6 + Math.random() * 18;
        const sh = 4 + Math.random() * 12;
        ctx.fillStyle = 'rgba(28, 12, 8, 0.8)';
        ctx.beginPath();
        ctx.ellipse(sx, sy, sw, sh, Math.random() * Math.PI, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(253, 186, 116, 0.45)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      const texture = new THREE.CanvasTexture(canvas);
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(70, 70);
      return texture;
    };

    const createMartianSoilBumpTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#808080';
      ctx.fillRect(0, 0, 512, 512);

      const imgData = ctx.getImageData(0, 0, 512, 512);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        const n = Math.floor(128 + (Math.random() - 0.5) * 85);
        data[i] = n;
        data[i + 1] = n;
        data[i + 2] = n;
      }
      ctx.putImageData(imgData, 0, 0);

      for (let g = 0; g < 450; g++) {
        const gx = Math.random() * 512;
        const gy = Math.random() * 512;
        const gr = 1.5 + Math.random() * 5.5;
        ctx.fillStyle = Math.random() > 0.5 ? '#ffffff' : '#222222';
        ctx.beginPath();
        ctx.arc(gx, gy, gr, 0, Math.PI * 2);
        ctx.fill();
      }

      const bumpTex = new THREE.CanvasTexture(canvas);
      bumpTex.wrapS = THREE.RepeatWrapping;
      bumpTex.wrapT = THREE.RepeatWrapping;
      bumpTex.repeat.set(70, 70);
      return bumpTex;
    };

    // ─── Procedural No Man's Sky / Morphite Alien Terrain ───
    const getTerrainHeight = (x: number, z: number): number => {
      const d1 = Math.sin(x * 0.032) * Math.cos(z * 0.032) * 5.0;
      const d2 = Math.sin(x * 0.075 + z * 0.055) * 1.8;
      const d3 = Math.cos(x * 0.016 - z * 0.022) * 1.6;
      return d1 + d2 + d3;
    };

    // Vast 1600x1600m planetary terrain — rover will NEVER drive off the edge
    const terrainGeo = new THREE.PlaneGeometry(1600, 1600, 140, 140);
    const pos = terrainGeo.attributes.position;

    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vy = pos.getY(i);
      const h = getTerrainHeight(vx, -vy);
      pos.setZ(i, h);
    }
    pos.needsUpdate = true;
    terrainGeo.computeVertexNormals();

    const soilTexture = createMartianSoilTexture();
    const soilBump = createMartianSoilBumpTexture();

    const terrainMat = new THREE.MeshStandardMaterial({
      map: soilTexture,
      bumpMap: soilBump,
      bumpScale: activeMap.terrainBumpScale,
      color: activeMap.surfaceColor,
      roughness: 0.88,
      metalness: 0.08,
      side: THREE.DoubleSide,
    });
    const terrain = new THREE.Mesh(terrainGeo, terrainMat);
    terrain.rotation.x = -Math.PI / 2;
    terrain.receiveShadow = true;
    scene.add(terrain);

    // ─── Alien Bioluminescent Flora & Giant Mushrooms (Surface Clamped) ───
    const decorGroup = new THREE.Group();
    for (let m = 0; m < 55; m++) {
      const mx = (Math.random() - 0.5) * 450;
      const mz = (Math.random() - 0.5) * 450;
      if (Math.hypot(mx, mz) < 18) continue;
      const my = getTerrainHeight(mx, mz);

      // Stem anchored into terrain
      const stemGeo = new THREE.CylinderGeometry(0.6, 1.1, 5.5, 8);
      const stemMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
      const stem = new THREE.Mesh(stemGeo, stemMat);
      stem.position.set(mx, my + 2.75, mz);
      decorGroup.add(stem);

      // Glowing Cap
      const capGeo = new THREE.ConeGeometry(3.6, 2.0, 14);
      const capMat = new THREE.MeshStandardMaterial({
        color: m % 2 === 0 ? 0x06b6d4 : 0xa855f7,
        emissive: m % 2 === 0 ? 0x06b6d4 : 0xa855f7,
        emissiveIntensity: 0.8,
        roughness: 0.2,
      });
      const cap = new THREE.Mesh(capGeo, capMat);
      cap.position.set(mx, my + 5.5, mz);
      decorGroup.add(cap);
    }

    // ─── Realistic Martian Surface Boulders & Crags ───
    const boulderMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.92,
      metalness: 0.15,
    });
    for (let b = 0; b < 65; b++) {
      const bx = (Math.random() - 0.5) * 500;
      const bz = (Math.random() - 0.5) * 500;
      if (Math.hypot(bx, bz) < 12) continue;
      const by = getTerrainHeight(bx, bz);
      const bScale = 0.8 + Math.random() * 2.5;
      const bGeo = new THREE.DodecahedronGeometry(bScale, 1);
      const boulder = new THREE.Mesh(bGeo, boulderMat);
      boulder.position.set(bx, by + bScale * 0.5, bz);
      boulder.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      decorGroup.add(boulder);
    }
    scene.add(decorGroup);

    // ─── Harvestable Glowing Mineral Crystals (Surface Clamped) ───
    const crystalGroup = new THREE.Group();
    const crystals: THREE.Mesh[] = [];
    const crystalColors = [0x38bdf8, 0xa855f7, 0x34d399, 0xfbbf24, 0xf43f5e];

    for (let c = 0; c < 50; c++) {
      const cGeo = new THREE.OctahedronGeometry(1.8 + Math.random() * 0.9, 0);
      const col = crystalColors[c % crystalColors.length];
      const cMat = new THREE.MeshStandardMaterial({
        color: col,
        emissive: col,
        emissiveIntensity: 0.9,
        roughness: 0.1,
        metalness: 0.9,
      });
      const crystal = new THREE.Mesh(cGeo, cMat);
      const cx = (Math.random() - 0.5) * 200;
      const cz = (Math.random() - 0.5) * 200;
      const cy = getTerrainHeight(cx, cz);
      crystal.position.set(cx, cy + 1.2, cz);
      crystal.rotation.set(Math.random(), Math.random(), Math.random());
      crystalGroup.add(crystal);
      crystals.push(crystal);
    }
    scene.add(crystalGroup);

    // ─── Wandering Alien Fauna (Surface Clamped) ───
    const creatures: { mesh: THREE.Group; dir: THREE.Vector3; speed: number }[] = [];
    for (let k = 0; k < 8; k++) {
      const creature = new THREE.Group();
      const body = new THREE.Mesh(
        new THREE.DodecahedronGeometry(1.4, 0),
        new THREE.MeshStandardMaterial({ color: 0xec4899, roughness: 0.2, emissive: 0xdb2777, emissiveIntensity: 0.6 })
      );
      body.position.y = 1.4;
      creature.add(body);

      // Scanning Visor Eye
      const eye = new THREE.Mesh(
        new THREE.SphereGeometry(0.4, 14, 14),
        new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
      );
      eye.position.set(0, 1.6, -1.1);
      creature.add(eye);

      const kx = (Math.random() - 0.5) * 160;
      const kz = (Math.random() - 0.5) * 160;
      const ky = getTerrainHeight(kx, kz);
      creature.position.set(kx, ky, kz);
      scene.add(creature);
      creatures.push({
        mesh: creature,
        dir: new THREE.Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize(),
        speed: 2.2 + Math.random() * 2.8,
      });
    }

    // ─── Guidance Torus Gates Corridor (Terrain Following) ───
    const gateGroup = new THREE.Group();
    for (let g = 0; g < 10; g++) {
      const gGeo = new THREE.TorusGeometry(5.2, 0.32, 16, 32);
      const gMat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x0284c7,
        emissiveIntensity: 0.9,
      });
      const gate = new THREE.Mesh(gGeo, gMat);
      const gx = Math.sin(g * 0.7) * 22;
      const gz = -22 - g * 30;
      const gy = getTerrainHeight(gx, gz) + 5.5;
      gate.position.set(gx, gy, gz);
      gateGroup.add(gate);
    }
    scene.add(gateGroup);

    // ─── NASA Planetary Exploration Rover (Artemis-VI Science Rover) ───
    const rover = new THREE.Group();

    // 1. Warm Electronics Box (WEB) with Gold Kapton / MLI Thermal Insulation Blanket
    const mliMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 0.88,
      roughness: 0.32,
      emissive: 0x78350f,
      emissiveIntensity: 0.18,
    });
    const chassisGeo = new THREE.BoxGeometry(2.3, 0.72, 3.4);
    const chassis = new THREE.Mesh(chassisGeo, mliMat);
    chassis.position.y = 0.82;
    rover.add(chassis);

    // 2. Titanium Avionics & Equipment Upper Deck
    const deckMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.8,
      roughness: 0.28,
    });
    const deckGeo = new THREE.BoxGeometry(2.5, 0.14, 3.6);
    const deck = new THREE.Mesh(deckGeo, deckMat);
    deck.position.y = 1.24;
    rover.add(deck);

    // 3. Monocrystalline Solar Panel Array Deck
    const solarMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      metalness: 0.92,
      roughness: 0.12,
    });
    const solarGeo = new THREE.BoxGeometry(1.9, 0.04, 1.5);
    const solar = new THREE.Mesh(solarGeo, solarMat);
    solar.position.set(0, 1.33, 0.5);
    rover.add(solar);

    // 4. MMRTG (Multi-Mission Radioisotope Thermoelectric Generator) Power Unit
    const rtgGroup = new THREE.Group();
    const rtgBodyMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.85, roughness: 0.4 });
    const rtgBody = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 1.05, 16), rtgBodyMat);
    rtgBody.rotation.x = Math.PI / 2;
    rtgGroup.add(rtgBody);
    // Radial Cooling Fins
    for (let f = 0; f < 8; f++) {
      const fin = new THREE.Mesh(
        new THREE.BoxGeometry(0.04, 1.0, 0.95),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9, roughness: 0.3 })
      );
      fin.rotation.z = (f * Math.PI) / 4;
      rtgGroup.add(fin);
    }
    // Subtle internal thermal core glow
    const coreGlow = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0xef4444 })
    );
    rtgGroup.add(coreGlow);
    rtgGroup.position.set(0, 1.28, 1.85);
    rover.add(rtgGroup);

    // 5. Remote Sensing Mast (Mastcam-Z & SuperCam Spectrometer Head)
    const mastGroup = new THREE.Group();
    const mastPole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.065, 0.08, 1.55, 8),
      new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.85, roughness: 0.25 })
    );
    mastPole.position.y = 0.77;
    mastGroup.add(mastPole);

    // Mast Camera Head
    const camHead = new THREE.Mesh(
      new THREE.BoxGeometry(0.65, 0.28, 0.32),
      new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.8, roughness: 0.2 })
    );
    camHead.position.y = 1.55;
    mastGroup.add(camHead);

    // Dual Stereoscopic Lenses (Mastcam-Z)
    const lensMat = new THREE.MeshBasicMaterial({ color: 0x0284c7 });
    const lensGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.16, 12);
    const leftLens = new THREE.Mesh(lensGeo, lensMat);
    leftLens.rotation.x = Math.PI / 2;
    leftLens.position.set(-0.2, 1.55, -0.2);
    mastGroup.add(leftLens);

    const rightLens = new THREE.Mesh(lensGeo, lensMat);
    rightLens.rotation.x = Math.PI / 2;
    rightLens.position.set(0.2, 1.55, -0.2);
    mastGroup.add(rightLens);

    // SuperCam Laser Spectrometer Aperture
    const superCam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 0.18, 8),
      new THREE.MeshBasicMaterial({ color: 0xef4444 })
    );
    superCam.rotation.x = Math.PI / 2;
    superCam.position.set(0, 1.62, -0.2);
    mastGroup.add(superCam);

    mastGroup.position.set(0.65, 1.25, -1.1);
    rover.add(mastGroup);

    // 6. Steerable High-Gain Antenna (HGA) Dish
    const dishGroup = new THREE.Group();
    const dishPole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 0.65),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8 })
    );
    dishPole.position.y = 0.32;
    dishGroup.add(dishPole);
    const dish = new THREE.Mesh(
      new THREE.CylinderGeometry(0.52, 0.08, 0.16, 16),
      new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9, roughness: 0.25 })
    );
    dish.position.y = 0.65;
    dish.rotation.x = Math.PI / 3.5;
    dishGroup.add(dish);
    dishGroup.position.set(-0.65, 1.25, 0.75);
    rover.add(dishGroup);

    // 7. Articulated Robotic Sample Corer Arm (Front-Left)
    const armGroup = new THREE.Group();
    const armMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.85, roughness: 0.3 });
    const armBase = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.4), armMat);
    armBase.position.y = 0.2;
    armGroup.add(armBase);
    const armFore = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.75), armMat);
    armFore.position.set(0, 0.35, -0.35);
    armFore.rotation.x = -Math.PI / 6;
    armGroup.add(armFore);
    const armTurret = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.14, 0.22, 12),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.9 })
    );
    armTurret.rotation.z = Math.PI / 2;
    armTurret.position.set(0, 0.2, -0.75);
    armGroup.add(armTurret);
    armGroup.position.set(-0.75, 1.15, -1.35);
    rover.add(armGroup);

    // 8. Dual Rugged Xenon Headlights + Dynamic Point Light
    const spotGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.32, 12);
    const spotMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0x38bdf8,
      emissiveIntensity: 0.95,
      roughness: 0.1,
    });
    const spotL = new THREE.Mesh(spotGeo, spotMat);
    spotL.rotation.x = Math.PI / 2;
    spotL.position.set(-0.85, 0.95, -1.82);
    const spotR = new THREE.Mesh(spotGeo, spotMat);
    spotR.rotation.x = Math.PI / 2;
    spotR.position.set(0.85, 0.95, -1.82);
    rover.add(spotL);
    rover.add(spotR);

    // High intensity forward ground beam
    const headlight = new THREE.SpotLight(0xbae6fd, 5.5, 45, Math.PI / 3.8, 0.5, 1.4);
    headlight.position.set(0, 1.1, -1.8);
    headlight.target.position.set(0, 0, -18);
    rover.add(headlight);
    rover.add(headlight.target);

    // 9. Rocker-Bogie Suspension & 6 Machined Cleated Titanium Wheels
    const wheels: THREE.Mesh[] = [];
    const wheelDrumGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.44, 20);
    const wheelTireMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.45 });
    const wheelRimMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.92, roughness: 0.2 });
    const strutMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.85, roughness: 0.3 });

    const wheelPositions = [
      [-1.52, 0.55, -1.35],
      [1.52, 0.55, -1.35],
      [-1.52, 0.55, 0.0],
      [1.52, 0.55, 0.0],
      [-1.52, 0.55, 1.35],
      [1.52, 0.55, 1.35],
    ];

    wheelPositions.forEach(([wx, wy, wz]) => {
      const wheelAssembly = new THREE.Group();

      // Outer cleated wheel drum
      const wDrum = new THREE.Mesh(wheelDrumGeo, wheelTireMat);
      wDrum.rotation.z = Math.PI / 2;
      wheelAssembly.add(wDrum);

      // Inner Hub Rim
      const wHub = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.46, 12), wheelRimMat);
      wHub.rotation.z = Math.PI / 2;
      wheelAssembly.add(wHub);

      // Chevron Traction Cleats (Grousers)
      for (let g = 0; g < 10; g++) {
        const cleat = new THREE.Mesh(
          new THREE.BoxGeometry(0.42, 0.06, 0.07),
          new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.9 })
        );
        const angle = (g * Math.PI * 2) / 10;
        cleat.position.set(0, Math.cos(angle) * 0.55, Math.sin(angle) * 0.55);
        cleat.rotation.x = angle;
        wheelAssembly.add(cleat);
      }

      wheelAssembly.position.set(wx, wy, wz);
      rover.add(wheelAssembly);
      wheels.push(wDrum);

      // Suspension connecting strut from chassis to wheel
      const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.65), strutMat);
      strut.position.set(wx > 0 ? wx - 0.25 : wx + 0.25, wy + 0.22, wz);
      strut.rotation.z = wx > 0 ? -Math.PI / 6 : Math.PI / 6;
      rover.add(strut);
    });

    // Multi-Tool Mining Laser Visual Beam
    const laserMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, linewidth: 5 });
    const laserGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 1.25, -2.0),
      new THREE.Vector3(0, 1.25, -26.0),
    ]);
    const laserBeam = new THREE.Line(laserGeo, laserMat);
    laserBeam.visible = false;
    rover.add(laserBeam);

    // Scanner Pulse Wave Ring
    const pulseGeo = new THREE.RingGeometry(0.1, 1.5, 32);
    const pulseMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide, transparent: true, opacity: 0.9 });
    const pulseRing = new THREE.Mesh(pulseGeo, pulseMat);
    pulseRing.rotation.x = -Math.PI / 2;
    pulseRing.visible = false;
    scene.add(pulseRing);

    // Anchored directly on terrain surface from start
    const initGroundY = getTerrainHeight(0, 0);
    rover.position.set(0, initGroundY + 0.65, 0);
    scene.add(rover);

    // ─── 3D Astronaut in NASA Artemis xEMU Spacesuit ───
    const astroGroup = new THREE.Group();
    const suitMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.35, metalness: 0.15 });
    const visorMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.98, roughness: 0.05, emissive: 0xd97706, emissiveIntensity: 0.35 });
    const darkBootMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7, metalness: 0.3 });

    // Torso (Hard Upper Torso HUT)
    const aTorso = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.32, 0.68, 16), suitMat);
    aTorso.position.y = 1.05;
    astroGroup.add(aTorso);

    // Red NASA mission stripe across chest
    const aStripe = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.08, 0.38), new THREE.MeshStandardMaterial({ color: 0xef4444 }));
    aStripe.position.set(0, 1.25, 0.02);
    astroGroup.add(aStripe);

    // Chest DCM Console
    const aDcm = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.22, 0.12), new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.85 }));
    aDcm.position.set(0, 1.06, -0.22);
    astroGroup.add(aDcm);

    // Helmet with Golden Visor
    const aHead = new THREE.Group();
    aHead.position.set(0, 1.62, 0);
    const aHelmet = new THREE.Mesh(new THREE.SphereGeometry(0.34, 20, 20), suitMat);
    aHead.add(aHelmet);
    const aVisor = new THREE.Mesh(new THREE.SphereGeometry(0.28, 20, 20), visorMat);
    aVisor.position.set(0, 0, -0.12);
    aVisor.scale.set(1, 0.92, 1.15);
    aHead.add(aVisor);
    astroGroup.add(aHead);

    // PLSS Life Support Backpack with dual O2 cylinders & jet nozzles
    const aPack = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.8, 0.32), new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.35, roughness: 0.3 }));
    aPack.position.set(0, 1.15, 0.28);
    astroGroup.add(aPack);

    const aJetFlames: THREE.Mesh[] = [];
    [-0.2, 0.2].forEach((jx) => {
      const aJet = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.14, 12), new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.9 }));
      aJet.position.set(jx, 1.5, 0.28);
      astroGroup.add(aJet);
      const aFlame = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.5, 12), new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0 }));
      aFlame.position.set(jx, 1.76, 0.28);
      aFlame.rotation.x = Math.PI;
      astroGroup.add(aFlame);
      aJetFlames.push(aFlame);
    });

    // Articulated Arms
    const aArmL = new THREE.Group();
    aArmL.position.set(-0.44, 1.25, 0);
    const aSleeveL = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.44, 10), suitMat);
    aSleeveL.position.y = -0.22;
    aArmL.add(aSleeveL);
    const aGloveL = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 12), new THREE.MeshStandardMaterial({ color: 0x0284c7 }));
    aGloveL.position.y = -0.48;
    aArmL.add(aGloveL);
    astroGroup.add(aArmL);

    const aArmR = new THREE.Group();
    aArmR.position.set(0.44, 1.25, 0);
    const aSleeveR = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.44, 10), suitMat);
    aSleeveR.position.y = -0.22;
    aArmR.add(aSleeveR);
    const aGloveR = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 12), new THREE.MeshStandardMaterial({ color: 0x0284c7 }));
    aGloveR.position.y = -0.48;
    aArmR.add(aGloveR);

    // Handheld EVA Multi-Tool Geological Scanner & Laser
    const aTool = new THREE.Group();
    aTool.position.set(0, -0.48, -0.16);
    const aToolBody = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, 0.28), new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.85 }));
    const aToolNozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.12, 8), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
    aToolNozzle.rotation.x = Math.PI / 2;
    aToolNozzle.position.z = -0.16;
    aTool.add(aToolBody);
    aTool.add(aToolNozzle);
    aArmR.add(aTool);

    const aLaserMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, linewidth: 4 });
    const aLaserGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, -0.22),
      new THREE.Vector3(0, 0, -32.0),
    ]);
    const aLaserBeam = new THREE.Line(aLaserGeo, aLaserMat);
    aLaserBeam.visible = false;
    aTool.add(aLaserBeam);

    astroGroup.add(aArmR);

    // Articulated Legs & Boots
    const aLegL = new THREE.Group();
    aLegL.position.set(-0.2, 0.72, 0);
    const aPantsL = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.11, 0.52, 10), suitMat);
    aPantsL.position.y = -0.26;
    aLegL.add(aPantsL);
    const aBootL = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.18, 0.38), darkBootMat);
    aBootL.position.set(0, -0.56, -0.06);
    aLegL.add(aBootL);
    astroGroup.add(aLegL);

    const aLegR = new THREE.Group();
    aLegR.position.set(0.2, 0.72, 0);
    const aPantsR = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.11, 0.52, 10), suitMat);
    aPantsR.position.y = -0.26;
    aLegR.add(aPantsR);
    const aBootR = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.18, 0.38), darkBootMat);
    aBootR.position.set(0, -0.56, -0.06);
    aLegR.add(aBootR);
    astroGroup.add(aLegR);

    // Default: Stationed on rover deck helm
    astroGroup.position.set(0, 0.72, 0.15);
    rover.add(astroGroup);

    // ─── Input & Physics State ───
    const keys: Record<string, boolean> = {};
    let localCrystals = 0;
    let localScans = 0;
    let isPulsing = false;
    let pulseRadius = 0;
    let roverSpeed = 0;
    let heat = 0;
    let fuel = 100;
    let isEva = false;
    let astroPos = new THREE.Vector3(0, initGroundY, 0);
    let astroYaw = 0;
    let astroSpeed = 0;
    let astroWalkTime = 0;
    let astroJumpVel = 0;
    let isAstroJumping = false;

    const toggleEva = () => {
      if (!isEva) {
        // Disembark rover onto surface
        isEva = true;
        setEvaMode(true);
        setEvaDone(true);
        rover.remove(astroGroup);
        const exitOffset = new THREE.Vector3(2.6, 0, 0).applyQuaternion(rover.quaternion);
        astroPos.copy(rover.position).add(exitOffset);
        astroPos.y = getTerrainHeight(astroPos.x, astroPos.z);
        astroYaw = rover.rotation.y;
        astroGroup.position.copy(astroPos);
        astroGroup.rotation.y = astroYaw;
        scene.add(astroGroup);
        if (!isMuted) soundFx.playReactorStart();
        setDiscoveryPopup('🧑‍🚀 EVA SPACEWALK ACTIVATED: ASTRONAUT ON FOOT!');
        setTimeout(() => setDiscoveryPopup(null), 2500);
      } else {
        // Board rover if close enough
        if (astroPos.distanceTo(rover.position) < 6.5) {
          isEva = false;
          setEvaMode(false);
          scene.remove(astroGroup);
          astroGroup.position.set(0, 0.72, 0.15);
          astroGroup.rotation.set(0, 0, 0);
          rover.add(astroGroup);
          if (!isMuted) soundFx.playVictory();
          setDiscoveryPopup('🚜 EMBARKED ON ARTEMIS ROVER!');
          setTimeout(() => setDiscoveryPopup(null), 2000);
        } else {
          setDiscoveryPopup('⚠️ TOO FAR FROM ROVER TO BOARD (< 6.5M REQUIRED)');
          setTimeout(() => setDiscoveryPopup(null), 2000);
        }
      }
    };

    let isHeadlightsOn = true;
    const toggleHeadlights = () => {
      isHeadlightsOn = !isHeadlightsOn;
      headlight.visible = isHeadlightsOn;
      if (!isMuted) soundFx.playClick(650);
      setDiscoveryPopup(isHeadlightsOn ? '💡 ARTEMIS ROVER DUAL XENON HEADLIGHTS: ACTIVE' : '💡 HEADLIGHTS: DEACTIVATED');
      setTimeout(() => setDiscoveryPopup(null), 2000);
    };

    const deployScienceBeacon = () => {
      const bPos = (isEva ? astroPos : rover.position).clone();
      const beaconGroup = new THREE.Group();
      const bBase = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.5, 0.45, 12), new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.85 }));
      bBase.position.y = 0.22;
      const bAntenna = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.6, 8), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
      bAntenna.position.y = 1.0;
      const bPulse = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 12), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
      bPulse.position.y = 1.8;
      beaconGroup.add(bBase);
      beaconGroup.add(bAntenna);
      beaconGroup.add(bPulse);
      beaconGroup.position.set(bPos.x, getTerrainHeight(bPos.x, bPos.z), bPos.z);
      scene.add(beaconGroup);
      if (!isMuted) soundFx.playTelemetryChirp();
      setDiscoveryPopup('📡 NASA RTG SURFACE SCIENCE BEACON DEPLOYED & TRANSMITTING TELEMETRY!');
      setTimeout(() => setDiscoveryPopup(null), 3000);
    };

    const createNasaFlagTexture = (): THREE.Texture => {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 160;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#0b1329';
      ctx.fillRect(0, 0, 256, 160);
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(0, 0, 256, 42);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText('NASA', 18, 30);
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText('ARTEMIS', 95, 30);
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(18, 125);
      ctx.lineTo(128, 65);
      ctx.lineTo(238, 125);
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      for (let s = 0; s < 12; s++) {
        ctx.fillRect(25 + s * 18, 85 + (s % 3) * 14, 3, 3);
      }
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 10px monospace';
      ctx.fillText('SHACKLETON BASE // 89.9°S', 18, 148);
      const tex = new THREE.CanvasTexture(canvas);
      tex.needsUpdate = true;
      return tex;
    };

    let flagMesh: THREE.Group | null = null;
    const plantNasaFlag = () => {
      if (flagMesh) scene.remove(flagMesh);
      const fPos = (isEva ? astroPos : rover.position).clone();
      const flagGroup = new THREE.Group();

      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.05, 3.4, 12),
        new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.2 })
      );
      pole.position.y = 1.7;
      flagGroup.add(pole);

      const spear = new THREE.Mesh(
        new THREE.ConeGeometry(0.09, 0.24, 10),
        new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.95 })
      );
      spear.position.y = 3.5;
      flagGroup.add(spear);

      const crossbar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.02, 0.02, 1.5, 8),
        new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.8 })
      );
      crossbar.rotation.z = Math.PI / 2;
      crossbar.position.set(0.75, 3.32, 0);
      flagGroup.add(crossbar);

      const banner = new THREE.Mesh(
        new THREE.PlaneGeometry(1.5, 0.9, 8, 4),
        new THREE.MeshStandardMaterial({
          map: createNasaFlagTexture(),
          side: THREE.DoubleSide,
          roughness: 0.5,
        })
      );
      banner.position.set(0.75, 2.85, 0);
      flagGroup.add(banner);

      flagGroup.position.set(fPos.x, getTerrainHeight(fPos.x, fPos.z), fPos.z);
      scene.add(flagGroup);
      flagMesh = flagGroup;

      setFlagPlanted(true);
      if (!isMuted) soundFx.playVictory();
      confetti({ particleCount: 75, spread: 60, origin: { y: 0.7 } });
      setDiscoveryPopup('🚩 OFFICIAL NASA ARTEMIS EXPEDITION FLAG PLANTED AT SHACKLETON CRATER!');
      setTimeout(() => setDiscoveryPopup(null), 3500);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      keys[k] = true;
      if (k === 'f') fireMiningLaser();
      if (k === 'e') triggerSonarScan();
      if (k === 'v') toggleEva();
      if (k === 'h') toggleHeadlights();
      if (k === 'b') deployScienceBeacon();
      if (k === 'p') plantNasaFlag();
      if (k === 'x') setShowSpectrometer((prev) => !prev);
      if (k === ' ' || e.code === 'Space') {
        if (!isEva) jetpackJump();
        else astroJetpackJump();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keys[e.key.toLowerCase()] = false;
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    const nasaMinerals = [
      '💎 NASA CORE #01: Ilmenite (FeTiO₃ · Extraterrestrial Titanium & Oxygen Extractable)',
      '💎 NASA CORE #02: Anorthosite (CaAl₂Si₂O₈ · Lunar Highlands Ancient Crust)',
      '💎 NASA CORE #03: Cryogenic Water-Ice Regolith (Polar Volatile Deposit)',
      '💎 NASA CORE #04: Olivine Basalt (Mantle Volcanic Core Sample)',
      '💎 NASA CORE #05: Pyroxene Silicate Matrix (Artemis Landing Zone)',
    ];

    const fireMiningLaser = () => {
      if (heat > 85) {
        setDiscoveryPopup('⚠️ SPECTROMETER CORE DRILL OVERHEATING! COOLING REQUIRED');
        setTimeout(() => setDiscoveryPopup(null), 1800);
        return;
      }
      heat = Math.min(100, heat + 18);
      setLaserHeat(Math.round(heat));

      if (isEva) {
        aLaserBeam.visible = true;
        setLaserActive(true);
        if (!isMuted) soundFx.playReactorStart();
        setTimeout(() => {
          aLaserBeam.visible = false;
          setLaserActive(false);
        }, 350);

        // Hit check nearby crystals relative to astronaut position
        crystals.forEach((c) => {
          if (c.visible && astroPos.distanceTo(c.position) < 28) {
            c.visible = false;
            localCrystals += 1;
            setCrystalCount(localCrystals);
            onUpdateScores(localCrystals, localScans);
            if (!isMuted) soundFx.playVictory();
            const minDesc = nasaMinerals[(localCrystals - 1) % nasaMinerals.length];
            setDiscoveryPopup(`[xEMU EVA SPECTROMETER] ${minDesc}`);
            setTimeout(() => setDiscoveryPopup(null), 3000);
          }
        });
      } else {
        laserBeam.visible = true;
        setLaserActive(true);
        if (!isMuted) soundFx.playReactorStart();

        setTimeout(() => {
          laserBeam.visible = false;
          setLaserActive(false);
        }, 350);

        // Hit check nearby crystals relative to rover position
        crystals.forEach((c) => {
          if (c.visible && rover.position.distanceTo(c.position) < 24) {
            c.visible = false;
            localCrystals += 1;
            setCrystalCount(localCrystals);
            onUpdateScores(localCrystals, localScans);
            if (!isMuted) soundFx.playVictory();
            const minDesc = nasaMinerals[(localCrystals - 1) % nasaMinerals.length];
            setDiscoveryPopup(`[ARTEMIS ROVER DRILL] ${minDesc}`);
            setTimeout(() => setDiscoveryPopup(null), 3000);
          }
        });
      }
    };

    const triggerSonarScan = () => {
      if (isPulsing) return;
      isPulsing = true;
      pulseRadius = 0;
      pulseRing.visible = true;
      setIsVisorScanning(true);
      setTimeout(() => setIsVisorScanning(false), 2400);
      if (!isMuted) soundFx.playTelemetryChirp();

      const scanOrigin = isEva ? astroPos : rover.position;
      creatures.forEach((creature, idx) => {
        if (scanOrigin.distanceTo(creature.mesh.position) < 42) {
          localScans += 1;
          const name = `Alien Fauna Specimen #0${idx + 1} (Cristata Sporepod)`;
          setScannedArtifacts((prev) => [...prev, name]);
          onUpdateScores(localCrystals, localScans);
          setDiscoveryPopup(`🔍 [${isEva ? 'EVA SCAN' : 'ROVER SCAN'}]: ${name} · 100% DISCOVERY!`);
          setTimeout(() => setDiscoveryPopup(null), 3000);
        }
      });
    };

    let isJumping = false;
    let jumpVel = 0;
    const jetpackJump = () => {
      if (isJumping || fuel < 20) return;
      isJumping = true;
      jumpVel = 9.5;
      fuel = Math.max(0, fuel - 25);
      setJetpackFuel(Math.round(fuel));
      if (!isMuted) soundFx.playReactorStart();
    };

    const astroJetpackJump = () => {
      if (isAstroJumping || fuel < 20) return;
      isAstroJumping = true;
      astroJumpVel = 11.5;
      fuel = Math.max(0, fuel - 25);
      setJetpackFuel(Math.round(fuel));
      aJetFlames.forEach((f) => ((f.material as THREE.MeshBasicMaterial).opacity = 0.95));
      if (!isMuted) soundFx.playReactorStart();
    };

    // ─── Animation Loop ───
    let animId: number;
    let lastT = performance.now();

    const animate = (t: number) => {
      animId = requestAnimationFrame(animate);
      const dt = Math.min((t - lastT) / 1000, 0.1);
      lastT = t;

      // Passive cooling and fuel recharge
      if (heat > 0) {
        heat = Math.max(0, heat - 15 * dt);
        setLaserHeat(Math.round(heat));
      }
      if (fuel < 100 && !isJumping && !isAstroJumping) {
        fuel = Math.min(100, fuel + 20 * dt);
        setJetpackFuel(Math.round(fuel));
      }

      if (!isEva) {
        // ── ROVER DRIVING PHYSICS ──
        const maxSpeed = 24;
        const accel = 38;
        const friction = 22;

        if (keys['w'] || keys['arrowup']) {
          roverSpeed = Math.min(maxSpeed, roverSpeed + accel * dt);
        } else if (keys['s'] || keys['arrowdown']) {
          roverSpeed = Math.max(-maxSpeed * 0.5, roverSpeed - accel * dt);
        } else {
          if (roverSpeed > 0) roverSpeed = Math.max(0, roverSpeed - friction * dt);
          else if (roverSpeed < 0) roverSpeed = Math.min(0, roverSpeed + friction * dt);
        }
        setSpeedKmh(Math.round(Math.abs(roverSpeed) * 3.6));

        const turnSpeed = 2.4;
        if (keys['a'] || keys['arrowleft']) {
          rover.rotation.y += turnSpeed * dt;
        }
        if (keys['d'] || keys['arrowright']) {
          rover.rotation.y -= turnSpeed * dt;
        }

        rover.translateZ(-roverSpeed * dt);
        rover.position.x = THREE.MathUtils.clamp(rover.position.x, -760, 760);
        rover.position.z = THREE.MathUtils.clamp(rover.position.z, -760, 760);

        // Terrain surface height clamping & suspension physics
        const groundY = getTerrainHeight(rover.position.x, rover.position.z);

        // Jetpack jump physics
        if (isJumping) {
          rover.position.y += jumpVel * dt;
          jumpVel -= 19.6 * dt;
          if (rover.position.y <= groundY + 0.65) {
            rover.position.y = groundY + 0.65;
            isJumping = false;
            jumpVel = 0;
          }
        } else {
          rover.position.y = THREE.MathUtils.lerp(rover.position.y, groundY + 0.65, 0.45);
        }

        // Dynamic terrain slope conforming (Pitch & Roll)
        const heading = rover.rotation.y;
        const fwdX = -Math.sin(heading);
        const fwdZ = -Math.cos(heading);
        const rightX = Math.cos(heading);
        const rightZ = -Math.sin(heading);

        const frontY = getTerrainHeight(rover.position.x + fwdX * 2.2, rover.position.z + fwdZ * 2.2);
        const backY = getTerrainHeight(rover.position.x - fwdX * 2.2, rover.position.z - fwdZ * 2.2);
        const leftY = getTerrainHeight(rover.position.x - rightX * 1.5, rover.position.z - rightZ * 1.5);
        const rightY = getTerrainHeight(rover.position.x + rightX * 1.5, rover.position.z + rightZ * 1.5);

        const targetPitch = Math.atan2(frontY - backY, 4.4);
        const targetRoll = Math.atan2(rightY - leftY, 3.0);

        rover.rotation.x = THREE.MathUtils.lerp(rover.rotation.x, targetPitch, 0.22);
        rover.rotation.z = THREE.MathUtils.lerp(rover.rotation.z, targetRoll, 0.22);

        // Rotate wheels & radar dish
        wheels.forEach((w) => {
          w.rotation.x += roverSpeed * dt * 2.2;
        });
        dishGroup.rotation.y += dt * 1.5;

        // Astronaut seated on rover helm: head turns slightly with steering
        aHead.rotation.y = -roverSpeed * 0.03;

        // Dynamic action camera trailing rover
        const camOffset = new THREE.Vector3(2.5, 4.8, 11).applyQuaternion(rover.quaternion);
        const targetCamPos = rover.position.clone().add(camOffset);
        const camGroundY = getTerrainHeight(targetCamPos.x, targetCamPos.z);
        if (targetCamPos.y < camGroundY + 1.8) {
          targetCamPos.y = camGroundY + 1.8;
        }
        camera.position.lerp(targetCamPos, 0.14);
        camera.lookAt(rover.position.clone().add(new THREE.Vector3(0, 1.2, -1).applyQuaternion(rover.quaternion)));
      } else {
        // ── EVA ASTRONAUT ON-FOOT WALKING PHYSICS ──
        const walkSpeed = 8.5;
        let isWalking = false;

        if (keys['w'] || keys['arrowup']) {
          astroPos.x -= Math.sin(astroYaw) * walkSpeed * dt;
          astroPos.z -= Math.cos(astroYaw) * walkSpeed * dt;
          isWalking = true;
        }
        if (keys['s'] || keys['arrowdown']) {
          astroPos.x += Math.sin(astroYaw) * walkSpeed * 0.5 * dt;
          astroPos.z += Math.cos(astroYaw) * walkSpeed * 0.5 * dt;
          isWalking = true;
        }
        if (keys['a'] || keys['arrowleft']) astroYaw += 2.8 * dt;
        if (keys['d'] || keys['arrowright']) astroYaw -= 2.8 * dt;

        astroGroup.rotation.y = astroYaw;
        const groundY = getTerrainHeight(astroPos.x, astroPos.z);

        if (isAstroJumping) {
          astroPos.y += astroJumpVel * dt;
          astroJumpVel -= 18.0 * dt;
          if (astroPos.y <= groundY) {
            astroPos.y = groundY;
            isAstroJumping = false;
            astroJumpVel = 0;
            aJetFlames.forEach((f) => ((f.material as THREE.MeshBasicMaterial).opacity = 0));
          }
        } else {
          astroPos.y = THREE.MathUtils.lerp(astroPos.y, groundY, 0.45);
        }
        astroGroup.position.copy(astroPos);

        if (isWalking && !isAstroJumping) {
          astroWalkTime += dt * 10;
          aLegL.rotation.x = Math.sin(astroWalkTime) * 0.55;
          aLegR.rotation.x = -Math.sin(astroWalkTime) * 0.55;
          aArmL.rotation.x = -Math.sin(astroWalkTime) * 0.4;
          aArmR.rotation.x = Math.sin(astroWalkTime) * 0.4;
          setSpeedKmh(Math.round(walkSpeed * 1.5));
        } else if (!isAstroJumping) {
          aLegL.rotation.x = 0;
          aLegR.rotation.x = 0;
          aArmL.rotation.x = 0;
          aArmR.rotation.x = 0;
          setSpeedKmh(0);
        }

        // Camera smoothly follows walking astronaut
        const camOffset = new THREE.Vector3(0, 3.2, 7.5).applyAxisAngle(new THREE.Vector3(0, 1, 0), astroYaw);
        const targetCamPos = astroPos.clone().add(camOffset);
        const camGroundY = getTerrainHeight(targetCamPos.x, targetCamPos.z);
        if (targetCamPos.y < camGroundY + 1.4) {
          targetCamPos.y = camGroundY + 1.4;
        }
        camera.position.lerp(targetCamPos, 0.16);
        camera.lookAt(astroPos.clone().add(new THREE.Vector3(0, 1.4, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), astroYaw)));
        setRoverDistance(Math.round(astroPos.distanceTo(rover.position)));
      }

      // Check Mission Completion Goal (3 crystals, 1 scan, EVA tried)
      if (!missionComplete && localCrystals >= 3 && localScans >= 1 && evaDone) {
        setMissionComplete(true);
        confetti({ particleCount: 110, spread: 80, origin: { y: 0.6 } });
        if (!isMuted) soundFx.playVictory();
      }

      // Rotate gates
      gateGroup.children.forEach((g, idx) => {
        g.rotation.z += dt * (0.6 + idx * 0.1);
      });

      // Wander creatures on terrain surface
      creatures.forEach((c) => {
        c.mesh.position.addScaledVector(c.dir, c.speed * dt);
        if (Math.hypot(c.mesh.position.x, c.mesh.position.z) > 100) {
          c.dir.negate();
        }
        c.mesh.position.y = getTerrainHeight(c.mesh.position.x, c.mesh.position.z);
        c.mesh.rotation.y += dt * 0.8;
      });

      // Sonar pulse wave expansion
      if (isPulsing) {
        pulseRadius += dt * 40;
        pulseRing.position.copy(rover.position);
        pulseRing.position.y = rover.position.y + 0.1;
        pulseRing.scale.set(pulseRadius, pulseRadius, pulseRadius);
        (pulseRing.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 1 - pulseRadius / 40);
        if (pulseRadius >= 40) {
          isPulsing = false;
          pulseRing.visible = false;
        }
      }

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      disposeThreeScene(renderer, scene, container);
    };
  }, [isMuted, map, vehicle, mission]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div ref={mountRef} style={{ width: '100%', height: '100%' }} />

      {/* Top Active Mission & Destination Telemetry Bar */}
      <div
        style={{
          position: 'absolute',
          top: '16px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(15, 23, 42, 0.92)',
          border: '1.5px solid rgba(56, 189, 248, 0.45)',
          borderRadius: '12px',
          padding: '6px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
          backdropFilter: 'blur(10px)',
          zIndex: 20,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', fontWeight: 900, color: '#38bdf8' }}>
          <span>🪐</span>
          <span>{map?.name || 'Moon: South Pole Aitken Basin'}</span>
        </div>
        <div style={{ width: '1px', height: '14px', background: 'rgba(255,255,255,0.2)' }} />
        <div style={{ fontSize: '11px', color: '#fbbf24', fontWeight: 800 }}>
          {vehicle?.icon} {vehicle?.name || 'NASA Artemis LTV'}
        </div>
        <div style={{ width: '1px', height: '14px', background: 'rgba(255,255,255,0.2)' }} />
        <div style={{ fontSize: '10px', color: '#94a3b8' }}>
          {map?.gravityLabel} · {map?.atmospherePressure}
        </div>
      </div>

      {/* Top Cadet HUD with No Man's Sky gauges */}
      <div
        style={{
          position: 'absolute',
          top: '16px',
          left: '20px',
          background: 'rgba(15, 23, 42, 0.88)',
          border: '1.5px solid #38bdf8',
          borderRadius: '12px',
          padding: '12px 20px',
          display: 'flex',
          gap: '24px',
          boxShadow: '0 0 20px rgba(56, 189, 248, 0.3)',
        }}
      >
        <div>
          <div style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 800 }}>NASA REGOLITH CORES</div>
          <div style={{ fontSize: '20px', fontWeight: 900, color: '#38bdf8' }}>💎 {crystalCount}/3</div>
        </div>
        <div>
          <div style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 800 }}>EXOBIOLOGY CODEX</div>
          <div style={{ fontSize: '20px', fontWeight: 900, color: '#a855f7' }}>🔍 {scannedArtifacts.length}</div>
        </div>
        <div>
          <div style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 800 }}>CORE DRILL TEMP</div>
          <div style={{ fontSize: '13px', fontWeight: 900, color: laserHeat > 75 ? '#f87171' : '#38bdf8' }}>
            {laserHeat}% {laserHeat > 75 ? '⚠️ HOT' : 'NOMINAL'}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 800 }}>PLSS JETPACK O2</div>
          <div style={{ fontSize: '13px', fontWeight: 900, color: '#10b981' }}>{jetpackFuel}%</div>
        </div>
        <div>
          <div style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 800 }}>ARTEMIS ROVER SPEED</div>
          <div style={{ fontSize: '13px', fontWeight: 800, color: '#38bdf8' }}>{speedKmh} KM/H</div>
        </div>
      </div>

      {/* Planetary Mission Objectives Checklist HUD */}
      <div
        style={{
          position: 'absolute',
          top: '16px',
          right: '80px',
          background: 'rgba(10, 15, 30, 0.88)',
          border: '1.5px solid #a855f7',
          borderRadius: '12px',
          padding: '12px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          minWidth: '260px',
          boxShadow: '0 0 25px rgba(168, 85, 247, 0.25)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <div style={{ fontSize: '10px', color: '#c084fc', fontWeight: 900, letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Target size={13} color="#c084fc" /> NASA ARTEMIS EXPEDITION DIRECTIVES
        </div>
        <div style={{ fontSize: '11px', color: crystalCount >= 3 ? '#4ade80' : '#e2e8f0', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>{crystalCount >= 3 ? '✅' : '⬜'}</span>
          <span>Extract 3 NASA Regolith Mineral Cores ({crystalCount}/3)</span>
        </div>
        <div style={{ fontSize: '11px', color: scannedArtifacts.length > 0 ? '#4ade80' : '#e2e8f0', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>{scannedArtifacts.length > 0 ? '✅' : '⬜'}</span>
          <span>Bio-Scan Flora/Fauna Specimen [E] ({scannedArtifacts.length}/1)</span>
        </div>
        <div style={{ fontSize: '11px', color: flagPlanted ? '#4ade80' : '#e2e8f0', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>{flagPlanted ? '✅' : '⬜'}</span>
          <span>Plant Official NASA Artemis Flag [P] ({flagPlanted ? 'PLANTED' : 'PENDING'})</span>
        </div>
        <div style={{ fontSize: '11px', color: showSpectrometer ? '#38bdf8' : '#e2e8f0', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>🔬</span>
          <span>Mass Spectrometer Core Laboratory [X]</span>
        </div>
        <div style={{ fontSize: '11px', color: '#93c5fd', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>📡</span>
          <span>Deploy Surface Science RTG Beacon [B]</span>
        </div>
        <div style={{ fontSize: '11px', color: '#93c5fd', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>💡</span>
          <span>Dual Xenon Headlights [H]</span>
        </div>
      </div>

      {/* No Man's Sky Analysis Visor Holographic Reticle Overlay */}
      {isVisorScanning && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 25,
            background: 'radial-gradient(circle, transparent 40%, rgba(14, 165, 233, 0.12) 100%)',
          }}
        >
          {/* Cyan Corner Framing Lines (Visor Grid) */}
          <div
            style={{
              position: 'relative',
              width: '320px',
              height: '320px',
              border: '1px dashed rgba(56, 189, 248, 0.5)',
              borderRadius: '24px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'inset 0 0 40px rgba(56, 189, 248, 0.25)',
            }}
          >
            <div style={{ position: 'absolute', top: '-14px', background: '#0284c7', color: '#fff', fontSize: '10px', fontWeight: 900, padding: '2px 10px', borderRadius: '4px', letterSpacing: '0.1em' }}>
              NASA ARTEMIS SPECTROMETRIC VISOR // TAXONOMY ACTIVE
            </div>
            <Crosshair size={68} color="#38bdf8" />
            <div style={{ marginTop: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '12px', fontWeight: 900, color: '#38bdf8', letterSpacing: '0.05em' }}>
                NASA EXOBIOLOGICAL &amp; MINERAL SAMPLE SCANNING...
              </div>
              <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>
                CLASSIFICATION: EXTRATERRESTRIAL BIO-TAXONOMY &amp; REGOLITH CORE
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Discovery Alert Popup */}
      {discoveryPopup && (
        <div
          style={{
            position: 'absolute',
            top: '80px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.95), rgba(99, 102, 241, 0.95))',
            color: '#fff',
            padding: '10px 24px',
            borderRadius: '24px',
            fontWeight: 900,
            fontSize: '13px',
            boxShadow: '0 0 25px rgba(56, 189, 248, 0.6)',
            border: '1px solid #ffffff',
            animation: 'pulse 1s infinite',
          }}
        >
          {discoveryPopup}
        </div>
      )}

      {/* Mission Accomplished Victory Banner */}
      {missionComplete && (
        <div
          style={{
            position: 'absolute',
            top: '35%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(88, 28, 135, 0.95))',
            border: '2px solid #a855f7',
            borderRadius: '18px',
            padding: '24px 36px',
            textAlign: 'center',
            boxShadow: '0 0 50px rgba(168, 85, 247, 0.6)',
            backdropFilter: 'blur(10px)',
            zIndex: 30,
          }}
        >
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>🏆</div>
          <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#f8fafc', margin: '0 0 6px 0' }}>
            PLANETARY SORTIE ACCOMPLISHED!
          </h2>
          <p style={{ fontSize: '13px', color: '#c084fc', margin: '0 0 16px 0', fontWeight: 700 }}>
            Rank Promotion: Advanced Planetary Scout · All Mission Directives Satisfied!
          </p>
          <button
            onClick={() => setMissionComplete(false)}
            style={{
              background: 'linear-gradient(135deg, #a855f7, #7c3aed)',
              border: 'none',
              color: '#fff',
              padding: '8px 22px',
              borderRadius: '10px',
              fontWeight: 900,
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            CONTINUE EXPEDITION
          </button>
        </div>
      )}

      {/* Real-time 3D Spacesuit EVA Telemetry HUD */}
      {evaMode && (
        <div
          style={{
            position: 'absolute',
            bottom: '76px',
            left: '20px',
            background: 'rgba(11, 17, 32, 0.94)',
            border: '1.5px solid #10b981',
            borderRadius: '12px',
            padding: '10px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '18px',
            boxShadow: '0 0 25px rgba(16, 185, 129, 0.35)',
            backdropFilter: 'blur(8px)',
            zIndex: 10,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '22px' }}>🧑‍🚀</span>
            <div>
              <div style={{ fontSize: '9px', color: '#10b981', fontWeight: 900 }}>EVA SPACESUIT ACTIVE</div>
              <div style={{ fontSize: '12px', fontWeight: 900, color: '#f8fafc' }}>NASA xEMU PRESSURIZED</div>
            </div>
          </div>

          <div style={{ borderLeft: '1px solid rgba(255,255,255,0.15)', paddingLeft: '14px' }}>
            <div style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 800 }}>SUIT PRESSURE</div>
            <div style={{ fontSize: '13px', fontWeight: 900, color: '#38bdf8' }}>29.6 kPa (4.3 PSI)</div>
          </div>

          <div style={{ borderLeft: '1px solid rgba(255,255,255,0.15)', paddingLeft: '14px' }}>
            <div style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 800 }}>O2 PURITY</div>
            <div style={{ fontSize: '13px', fontWeight: 900, color: '#4ade80' }}>99.4% [PLSS NOMINAL]</div>
          </div>

          <div style={{ borderLeft: '1px solid rgba(255,255,255,0.15)', paddingLeft: '14px' }}>
            <div style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 800 }}>CORE TEMP</div>
            <div style={{ fontSize: '13px', fontWeight: 900, color: '#c084fc' }}>21.2°C</div>
          </div>

          <div style={{ borderLeft: '1px solid rgba(255,255,255,0.15)', paddingLeft: '14px' }}>
            <div style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 800 }}>ROVER BEACON</div>
            <div style={{ fontSize: '13px', fontWeight: 900, color: roverDistance < 6.5 ? '#10b981' : '#f59e0b' }}>
              📍 {roverDistance}M {roverDistance < 6.5 ? '· READY TO BOARD [V]' : '· WALK CLOSER'}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Control Bar */}
      <div
        style={{
          position: 'absolute',
          bottom: '16px',
          left: '20px',
          right: '20px',
          background: 'rgba(15, 23, 42, 0.88)',
          border: '1px solid rgba(56, 189, 248, 0.35)',
          borderRadius: '12px',
          padding: '10px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => {
              const e = new KeyboardEvent('keydown', { key: 'v' });
              window.dispatchEvent(e);
            }}
            style={{
              background: evaMode ? 'linear-gradient(135deg, #ea580c, #c2410c)' : 'linear-gradient(135deg, #10b981, #059669)',
              border: '1px solid #ffffff',
              color: '#fff',
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '11px',
              fontWeight: 900,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 0 15px rgba(16, 185, 129, 0.4)',
            }}
          >
            <span>🧑‍🚀</span> {evaMode ? 'BOARD ROVER [V]' : 'EVA SPACEWALK [V]'}
          </button>
          <button
            onClick={() => {
              const e = new KeyboardEvent('keydown', { key: 'f' });
              window.dispatchEvent(e);
            }}
            style={{
              background: 'linear-gradient(135deg, #0284c7, #0369a1)',
              border: '1px solid #38bdf8',
              color: '#fff',
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '11px',
              fontWeight: 900,
              cursor: 'pointer',
            }}
          >
            ⚡ CORE DRILL [F]
          </button>
          <button
            onClick={() => {
              const e = new KeyboardEvent('keydown', { key: 'e' });
              window.dispatchEvent(e);
            }}
            style={{
              background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
              border: '1px solid #c084fc',
              color: '#fff',
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '11px',
              fontWeight: 900,
              cursor: 'pointer',
            }}
          >
            🔍 SPECTROMETER [E]
          </button>
          <button
            onClick={() => {
              const e = new KeyboardEvent('keydown', { key: 'b' });
              window.dispatchEvent(e);
            }}
            style={{
              background: 'linear-gradient(135deg, #059669, #047857)',
              border: '1px solid #34d399',
              color: '#fff',
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '11px',
              fontWeight: 900,
              cursor: 'pointer',
            }}
          >
            📡 DEPLOY BEACON [B]
          </button>
          <button
            onClick={() => {
              const e = new KeyboardEvent('keydown', { key: 'p' });
              window.dispatchEvent(e);
            }}
            style={{
              background: 'linear-gradient(135deg, #b91c1c, #991b1b)',
              border: '1px solid #f87171',
              color: '#fff',
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '11px',
              fontWeight: 900,
              cursor: 'pointer',
            }}
          >
            🚩 PLANT FLAG [P]
          </button>
          <button
            onClick={() => setShowSpectrometer(true)}
            style={{
              background: 'linear-gradient(135deg, #0284c7, #0369a1)',
              border: '1px solid #38bdf8',
              color: '#fff',
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '11px',
              fontWeight: 900,
              cursor: 'pointer',
            }}
          >
            🔬 CORE LAB [X]
          </button>
          <button
            onClick={() => {
              const e = new KeyboardEvent('keydown', { key: 'h' });
              window.dispatchEvent(e);
            }}
            style={{
              background: 'rgba(56, 189, 248, 0.2)',
              border: '1px solid #38bdf8',
              color: '#38bdf8',
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '11px',
              fontWeight: 900,
              cursor: 'pointer',
            }}
          >
            💡 HEADLIGHTS [H]
          </button>
          <button
            onClick={() => {
              const e = new KeyboardEvent('keydown', { key: ' ' });
              window.dispatchEvent(e);
            }}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              color: '#fff',
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '11px',
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            🚀 JETPACK JUMP [SPACE]
          </button>
        </div>

        <button
          onClick={onBack}
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: '#cbd5e1',
            padding: '6px 14px',
            borderRadius: '8px',
            fontSize: '11px',
            fontWeight: 800,
            cursor: 'pointer',
          }}
        >
          ← BACK TO HUB
        </button>
      </div>

      {/* NASA Artemis Mass Spectrometer & Core Sample Laboratory Modal */}
      {showSpectrometer && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(2, 6, 23, 0.90)',
            backdropFilter: 'blur(16px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 40,
            padding: '24px',
          }}
        >
          <div
            style={{
              background: 'linear-gradient(180deg, #0f172a 0%, #090e1d 100%)',
              border: '1.5px solid #38bdf8',
              borderRadius: '20px',
              maxWidth: '820px',
              width: '100%',
              padding: '28px',
              boxShadow: '0 0 50px rgba(56, 189, 248, 0.4)',
              color: '#f8fafc',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', borderBottom: '1px solid rgba(56, 189, 248, 0.3)', paddingBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(56, 189, 248, 0.2)', border: '1px solid #38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>
                  🔬
                </div>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#f8fafc', margin: 0, letterSpacing: '0.04em' }}>
                    NASA ARTEMIS MASS SPECTROMETER &amp; CORE LAB
                  </h3>
                  <div style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 800 }}>
                    SHACKLETON CRATER VOLATILE &amp; MINERALOGY TAXONOMY ANALYSIS
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowSpectrometer(false)}
                style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#cbd5e1', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', fontWeight: 800, fontSize: '11px' }}
              >
                ✕ CLOSE [X]
              </button>
            </div>

            {/* 3 Authentic NASA Lunar Sample Cores */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '24px' }}>
              {/* Sample 1: Water-Ice */}
              <div style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(56, 189, 248, 0.35)', borderRadius: '14px', padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 900, color: '#38bdf8' }}>CORE #01: VOLATILE ICE</span>
                  <span style={{ fontSize: '9px', background: 'rgba(56, 189, 248, 0.2)', color: '#7dd3fc', padding: '2px 6px', borderRadius: '4px', fontWeight: 800 }}>PSR DEPOSIT</span>
                </div>
                <div style={{ fontSize: '13px', fontWeight: 900, color: '#e0f2fe', marginBottom: '6px' }}>
                  Cryogenic Water-Ice Regolith
                </div>
                <div style={{ fontSize: '10.5px', color: '#94a3b8', lineHeight: '1.5', marginBottom: '10px' }}>
                  Extracted from permanently shadowed crater floor at 40 Kelvin (-233°C). Essential for rocket fuel (Liquid H₂ + Liquid O₂ electrolysis).
                </div>
                <div style={{ background: 'rgba(2, 6, 23, 0.7)', borderRadius: '8px', padding: '8px', fontSize: '10px', color: '#7dd3fc', fontFamily: 'monospace' }}>
                  • H₂O Ice: 14.2%<br />
                  • Ilmenite: 28.0%<br />
                  • Regolith Breccia: 57.8%
                </div>
              </div>

              {/* Sample 2: Anorthosite */}
              <div style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(251, 191, 36, 0.35)', borderRadius: '14px', padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 900, color: '#fbbf24' }}>CORE #02: HIGHLAND CRUST</span>
                  <span style={{ fontSize: '9px', background: 'rgba(251, 191, 36, 0.2)', color: '#fef08a', padding: '2px 6px', borderRadius: '4px', fontWeight: 800 }}>4.4 GYR OLD</span>
                </div>
                <div style={{ fontSize: '13px', fontWeight: 900, color: '#fef3c7', marginBottom: '6px' }}>
                  Genesis Highland Anorthosite
                </div>
                <div style={{ fontSize: '10.5px', color: '#94a3b8', lineHeight: '1.5', marginBottom: '10px' }}>
                  Primordial lunar highland crust formed as plagioclase feldspar floated to the surface of the early global magma ocean.
                </div>
                <div style={{ background: 'rgba(2, 6, 23, 0.7)', borderRadius: '8px', padding: '8px', fontSize: '10px', color: '#fde047', fontFamily: 'monospace' }}>
                  • Plagioclase (CaAl₂Si₂O₈): 92.4%<br />
                  • Pyroxene: 5.8%<br />
                  • Olivine: 1.8%
                </div>
              </div>

              {/* Sample 3: Ilmenite */}
              <div style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(168, 85, 247, 0.35)', borderRadius: '14px', padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 900, color: '#c084fc' }}>CORE #03: TITANIUM ORE</span>
                  <span style={{ fontSize: '9px', background: 'rgba(168, 85, 247, 0.2)', color: '#e9d5ff', padding: '2px 6px', borderRadius: '4px', fontWeight: 800 }}>ISRU OXYGEN</span>
                </div>
                <div style={{ fontSize: '13px', fontWeight: 900, color: '#f3e8ff', marginBottom: '6px' }}>
                  Titaniferous Basalt Ilmenite
                </div>
                <div style={{ fontSize: '10.5px', color: '#94a3b8', lineHeight: '1.5', marginBottom: '10px' }}>
                  High-titanium mare basalt mineral. Under hydrogen reduction furnaces at 900°C, oxygen gas is directly liberated for life-support!
                </div>
                <div style={{ background: 'rgba(2, 6, 23, 0.7)', borderRadius: '8px', padding: '8px', fontSize: '10px', color: '#d8b4fe', fontFamily: 'monospace' }}>
                  • Ilmenite (FeTiO₃): 42.1%<br />
                  • TiO₂ Content: 18.2%<br />
                  • Iron Oxide (FeO): 34.2%
                </div>
              </div>
            </div>

            {/* Houston Telemetry Uplink Button */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '16px' }}>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                NASA Planetary Science Division · Artemis Base Camp Geological Archive
              </div>
              <button
                onClick={() => {
                  setAnalyzedMinerals(['core1', 'core2', 'core3']);
                  soundFx.playVictory();
                  confetti({ particleCount: 70, spread: 50 });
                  setDiscoveryPopup('🔬 NASA SPECTROMETRY LOGGED: +150 MISSION SCIENCE XP TRANSMITTED TO HOUSTON!');
                  setTimeout(() => setDiscoveryPopup(null), 3500);
                  setShowSpectrometer(false);
                }}
                style={{
                  background: 'linear-gradient(135deg, #0284c7, #7c3aed)',
                  border: '1px solid #38bdf8',
                  color: '#fff',
                  padding: '10px 22px',
                  borderRadius: '10px',
                  fontSize: '12px',
                  fontWeight: 900,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 0 20px rgba(56, 189, 248, 0.4)',
                }}
              >
                <span>📡 TRANSMIT SPECTROMETRY TO HOUSTON (+150 XP)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. GAME 2: FLIGHT OFFICER (KERBAL SPACE PROGRAM & SPACE ENGINEERS)
// ─────────────────────────────────────────────────────────────────────────────
interface OfficerGameProps {
  isMuted: boolean;
  onBack: () => void;
  onUpdateScores: (orbitReached: boolean, deltaV: number) => void;
  mission?: NasaLevelMission;
  vehicle?: VehicleConfig;
  map?: PlanetMapConfig;
}

const FlightOfficerKspGame: React.FC<OfficerGameProps> = ({ isMuted, onBack, onUpdateScores, mission, vehicle, map }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [altitudeKm, setAltitudeKm] = useState(0);
  const [velocityKms, setVelocityKms] = useState(0);
  const [throttle, setThrottle] = useState(0);
  const [deltaV, setDeltaV] = useState(4850);
  const [apoapsisKm, setApoapsisKm] = useState(0);
  const [periapsisKm, setPeriapsisKm] = useState(0);
  const [stage, setStage] = useState(1);
  const [pitchDeg, setPitchDeg] = useState(90);
  const [orbitAchieved, setOrbitAchieved] = useState(false);
  const [mapMode, setMapMode] = useState(false);

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020512);

    const camera = new THREE.PerspectiveCamera(52, width / height, 0.1, 9000);
    camera.position.set(0, 18, 48);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // Dynamic Starfield
    const starGeo = new THREE.BufferGeometry();
    const starCount = 2400;
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starPos[i] = (Math.random() - 0.5) * 4500;
      starPos[i + 1] = (Math.random() - 0.5) * 4500;
      starPos[i + 2] = (Math.random() - 0.5) * 4500;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 2.2,
      map: createProceduralStarTexture(),
      transparent: true,
    });
    const starfield = new THREE.Points(starGeo, starMat);
    scene.add(starfield);

    const hemi = new THREE.HemisphereLight(0xffffff, 0x1e293b, 1.5);
    scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xfffbeb, 2.8);
    sun.position.set(140, 200, 120);
    scene.add(sun);

    // ─── Realistic 3D Textured Earth Globe ───
    const earthRadius = 380;
    const earthGeo = new THREE.SphereGeometry(earthRadius, 64, 64);
    const earthMat = new THREE.MeshStandardMaterial({
      map: createEarthTexture(),
      roughness: 0.55,
      metalness: 0.1,
    });
    const earth = new THREE.Mesh(earthGeo, earthMat);
    earth.position.set(0, -earthRadius, 0);
    scene.add(earth);

    // Atmospheric Glow Halo
    const atmoGeo = new THREE.SphereGeometry(earthRadius + 8, 48, 48);
    const atmoMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.28,
      side: THREE.BackSide,
    });
    const atmosphere = new THREE.Mesh(atmoGeo, atmoMat);
    earth.add(atmosphere);

    // ─── Launch Complex 39B Lattice Truss Tower & Floodlights ───
    const padGroup = new THREE.Group();
    const padBase = new THREE.Mesh(
      new THREE.BoxGeometry(40, 4, 40),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.85, metalness: 0.3 })
    );
    padBase.position.y = -2;
    padGroup.add(padBase);

    // Concrete Flame Trench Cutout
    const trenchMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.95 });
    const trench = new THREE.Mesh(new THREE.BoxGeometry(10, 3.8, 42), trenchMat);
    trench.position.set(0, -1.9, 0);
    padGroup.add(trench);

    // Lattice steel umbilical gantry tower
    const towerGroup = new THREE.Group();
    for (let level = 0; level < 9; level++) {
      const truss = new THREE.Mesh(
        new THREE.BoxGeometry(4.8, 4.0, 4.8),
        new THREE.MeshStandardMaterial({ color: 0xb91c1c, wireframe: true })
      );
      truss.position.set(-8.5, level * 4.0 + 2, 0);
      towerGroup.add(truss);
    }
    // Gantry swing arms
    const swingArm = new THREE.Mesh(
      new THREE.BoxGeometry(6.2, 0.9, 1.4),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.6 })
    );
    swingArm.position.set(-4.5, 26, 0);
    towerGroup.add(swingArm);
    padGroup.add(towerGroup);

    // 4 High-Intensity Pad 39B Xenon Floodlights illuminating the Artemis SLS
    const floodlightCoords = [
      { x: -18, z: -18 },
      { x: 18, z: -18 },
      { x: -18, z: 18 },
      { x: 18, z: 18 },
    ];
    floodlightCoords.forEach(({ x, z }) => {
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35, 0.5, 22, 8),
        new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.75 })
      );
      pole.position.set(x, 11, z);
      padGroup.add(pole);

      const lamp = new THREE.Mesh(
        new THREE.BoxGeometry(1.8, 1.2, 1.4),
        new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfef08a, emissiveIntensity: 2.2 })
      );
      lamp.position.set(x, 22, z);
      lamp.lookAt(0, 16, 0);
      padGroup.add(lamp);

      const spot = new THREE.SpotLight(0xfffbeb, 4.5, 90, Math.PI / 4, 0.45);
      spot.position.set(x, 22, z);
      spot.target.position.set(0, 16, 0);
      scene.add(spot);
      scene.add(spot.target);
    });
    scene.add(padGroup);

    // Launch Pad Flame Trench Billowing Smoke System (Ignition Steam)
    const padSmokeCount = 130;
    const padSmokeGeo = new THREE.BufferGeometry();
    const padSmokePos = new Float32Array(padSmokeCount * 3);
    const padSmokeVels: { x: number; y: number; z: number; life: number; maxLife: number }[] = [];
    for (let s = 0; s < padSmokeCount; s++) {
      padSmokePos[s * 3] = (Math.random() - 0.5) * 6;
      padSmokePos[s * 3 + 1] = -0.5;
      padSmokePos[s * 3 + 2] = (Math.random() - 0.5) * 6;
      padSmokeVels.push({
        x: (Math.random() - 0.5) * 20,
        y: 0.8 + Math.random() * 5.5,
        z: (Math.random() - 0.5) * 20,
        life: Math.random() * 2.5,
        maxLife: 2.5,
      });
    }
    padSmokeGeo.setAttribute('position', new THREE.BufferAttribute(padSmokePos, 3));
    const padSmokeMat = new THREE.PointsMaterial({
      color: 0xcbd5e1,
      size: 5.5,
      transparent: true,
      opacity: 0,
      blending: THREE.NormalBlending,
      depthWrite: false,
    });
    const padLaunchSmoke = new THREE.Points(padSmokeGeo, padSmokeMat);
    scene.add(padLaunchSmoke);

    // ─── Realistic KSP Multistage Rocket (Artemis SLS + Orion) ───
    const rocket = new THREE.Group();

    // 1. Core Stage (Orange Cryogenic Insulation Tank with LOX/LH2 lines)
    const coreStage = new THREE.Group();
    const coreTankGeo = new THREE.CylinderGeometry(2.1, 2.1, 19, 32);
    const coreTankMat = new THREE.MeshStandardMaterial({
      color: 0xca6f1e,
      roughness: 0.65,
      metalness: 0.15,
    });
    const coreTank = new THREE.Mesh(coreTankGeo, coreTankMat);
    coreTank.position.y = 9.5;
    coreStage.add(coreTank);

    // Core Stage Black & White Interstage Decoupler Ring & Feedlines
    const ringGeo = new THREE.TorusGeometry(2.12, 0.08, 12, 32);
    const ringMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8 });
    [-6, 0, 6].forEach((yPos) => {
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.y = 9.5 + yPos;
      ring.rotation.x = Math.PI / 2;
      coreStage.add(ring);
    });
    // Cryo feedline conduit
    const feedline = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.12, 18, 8),
      new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.5 })
    );
    feedline.position.set(2.15, 9.5, 0);
    coreStage.add(feedline);

    // 4 RS-25 Core Engine Bells with Interior Heat Glow
    const coreEnginesGroup = new THREE.Group();
    for (let e = 0; e < 4; e++) {
      const bell = new THREE.Mesh(
        new THREE.ConeGeometry(0.58, 1.8, 20, 1, true),
        new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.9, roughness: 0.25 })
      );
      const ex = e % 2 === 0 ? -0.85 : 0.85;
      const ez = e < 2 ? -0.85 : 0.85;
      bell.position.set(ex, -0.4, ez);
      bell.rotation.x = Math.PI;

      const innerGlow = new THREE.Mesh(
        new THREE.ConeGeometry(0.45, 1.4, 16),
        new THREE.MeshBasicMaterial({ color: 0xff6b35 })
      );
      innerGlow.position.y = -0.2;
      innerGlow.rotation.x = Math.PI;
      bell.add(innerGlow);
      coreEnginesGroup.add(bell);
    }
    coreStage.add(coreEnginesGroup);
    rocket.add(coreStage);

    // 2. Dual 5-Segment Solid Rocket Boosters (SRB-L and SRB-R)
    const createSrb = (posX: number) => {
      const srb = new THREE.Group();
      // White casing body
      const srbBody = new THREE.Mesh(
        new THREE.CylinderGeometry(1.0, 1.0, 17, 24),
        new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.35, metalness: 0.2 })
      );
      srbBody.position.y = 8.5;
      srb.add(srbBody);

      // 5-segment field joint dark rings
      for (let j = -6; j <= 6; j += 3) {
        const joint = new THREE.Mesh(
          new THREE.TorusGeometry(1.02, 0.04, 8, 24),
          new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5 })
        );
        joint.position.y = 8.5 + j;
        joint.rotation.x = Math.PI / 2;
        srb.add(joint);
      }

      // Aerodynamic Forward Nose Cone
      const cone = new THREE.Mesh(
        new THREE.ConeGeometry(1.0, 3.2, 24),
        new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 })
      );
      cone.position.y = 18.6;
      srb.add(cone);

      // Forward separation motors (Sepmotors)
      const sepmotor = new THREE.Mesh(
        new THREE.BoxGeometry(0.35, 0.6, 0.35),
        new THREE.MeshStandardMaterial({ color: 0x475569 })
      );
      sepmotor.position.set(posX > 0 ? 0.9 : -0.9, 17.5, 0);
      srb.add(sepmotor);

      // Aft Skirt & Nozzle
      const skirt = new THREE.Mesh(
        new THREE.CylinderGeometry(1.0, 1.25, 1.4, 20),
        new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8 })
      );
      skirt.position.y = -0.7;
      srb.add(skirt);

      srb.position.set(posX, 0, 0);
      return srb;
    };

    const srbL = createSrb(-3.15);
    const srbR = createSrb(3.15);
    rocket.add(srbL);
    rocket.add(srbR);

    // 3. Stage 2 (ICPS - Interim Cryogenic Propulsion Stage & Orion Spacecraft)
    const s2Group = new THREE.Group();

    // ICPS Cryogenic Upper Stage Body
    const icpsTank = new THREE.Mesh(
      new THREE.CylinderGeometry(1.85, 2.1, 5.5, 32),
      new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3, metalness: 0.4 })
    );
    icpsTank.position.y = 21.8;
    s2Group.add(icpsTank);

    // RL-10 Vacuum Engine Nozzle
    const rl10Nozzle = new THREE.Mesh(
      new THREE.ConeGeometry(0.85, 2.0, 20, 1, true),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.95 })
    );
    rl10Nozzle.position.set(0, 18.2, 0);
    rl10Nozzle.rotation.x = Math.PI;
    s2Group.add(rl10Nozzle);

    // Orion European Service Module (ESM)
    const esm = new THREE.Mesh(
      new THREE.CylinderGeometry(1.85, 1.85, 2.8, 32),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.4, metalness: 0.5 })
    );
    esm.position.y = 25.8;
    s2Group.add(esm);

    // 4 Deployable X-Wing Solar Array Wings on Orion ESM
    const solarWings: THREE.Mesh[] = [];
    for (let w = 0; w < 4; w++) {
      const angle = (w * Math.PI) / 2 + Math.PI / 4;
      const wing = new THREE.Mesh(
        new THREE.BoxGeometry(4.2, 0.08, 0.9),
        new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.8, roughness: 0.2 })
      );
      wing.position.set(Math.cos(angle) * 3.8, 25.8, Math.sin(angle) * 3.8);
      wing.rotation.y = -angle;
      wing.scale.set(0.01, 1, 1); // Starts folded, deploys in orbit!
      s2Group.add(wing);
      solarWings.push(wing);
    }

    // Orion Crew Module Capsule (Command Module with heat shield)
    const capsule = new THREE.Mesh(
      new THREE.ConeGeometry(1.85, 3.2, 32),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2, metalness: 0.85 })
    );
    capsule.position.y = 28.6;
    s2Group.add(capsule);

    // Launch Abort System (LAS) Tower with Jettison Nozzles
    const abortTower = new THREE.Group();
    const mast = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.38, 4.8, 12),
      new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 })
    );
    mast.position.y = 32.4;
    abortTower.add(mast);
    // LAS Motor Nozzle Cluster
    const lasNose = new THREE.Mesh(
      new THREE.ConeGeometry(0.38, 1.2, 12),
      new THREE.MeshStandardMaterial({ color: 0xffffff })
    );
    lasNose.position.y = 35.2;
    abortTower.add(lasNose);
    s2Group.add(abortTower);

    rocket.add(s2Group);

    // 4. Advanced Animated Multi-Stage Rocket Exhaust Plume System
    const plumeGroup = new THREE.Group();
    plumeGroup.position.y = -0.5;
    plumeGroup.visible = false;

    // Outer turbulent incandescent flame
    const outerFlameMat = new THREE.MeshBasicMaterial({
      color: 0xff4500,
      transparent: true,
      opacity: 0.82,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
    const outerFlame = new THREE.Mesh(new THREE.ConeGeometry(2.4, 20, 24, 1, true), outerFlameMat);
    outerFlame.position.y = -10;
    outerFlame.rotation.x = Math.PI;
    plumeGroup.add(outerFlame);

    // Inner supersonic electric blue/white core
    const coreFlameMat = new THREE.MeshBasicMaterial({
      color: 0x67e8f9,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
    });
    const coreFlame = new THREE.Mesh(new THREE.ConeGeometry(1.1, 14, 20), coreFlameMat);
    coreFlame.position.y = -7;
    coreFlame.rotation.x = Math.PI;
    plumeGroup.add(coreFlame);

    // 4 Concentric glowing Mach shock diamond rings
    const shockRings: THREE.Mesh[] = [];
    for (let r = 1; r <= 4; r++) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.55 + r * 0.15, 0.06, 8, 20),
        new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending })
      );
      ring.position.y = -r * 3.2;
      ring.rotation.x = Math.PI / 2;
      plumeGroup.add(ring);
      shockRings.push(ring);
    }

    // Dynamic flickering rocket flame illumination
    const flameLight = new THREE.PointLight(0xff6600, 0, 60);
    flameLight.position.set(0, -3, 0);
    plumeGroup.add(flameLight);

    rocket.add(plumeGroup);

    // 5. Dynamic Rocket Exhaust Particle Sparks & Embers
    const rocketSparkCount = 120;
    const rocketSparkGeo = new THREE.BufferGeometry();
    const rocketSparkPositions = new Float32Array(rocketSparkCount * 3);
    const rocketSparkVels: { x: number; y: number; z: number; life: number; maxLife: number }[] = [];
    for (let sp = 0; sp < rocketSparkCount; sp++) {
      rocketSparkPositions[sp * 3] = (Math.random() - 0.5) * 1.5;
      rocketSparkPositions[sp * 3 + 1] = -1;
      rocketSparkPositions[sp * 3 + 2] = (Math.random() - 0.5) * 1.5;
      rocketSparkVels.push({
        x: (Math.random() - 0.5) * 6,
        y: -15 - Math.random() * 25,
        z: (Math.random() - 0.5) * 6,
        life: Math.random() * 0.8,
        maxLife: 0.8,
      });
    }
    rocketSparkGeo.setAttribute('position', new THREE.BufferAttribute(rocketSparkPositions, 3));
    const rocketSparkMat = new THREE.PointsMaterial({
      color: 0xfbbf24,
      size: 2.8,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const rocketSparks = new THREE.Points(rocketSparkGeo, rocketSparkMat);
    scene.add(rocketSparks);

    // 6. Hypersonic Atmospheric Friction / Re-entry Plasma Sheath
    const reentryPlasmaGeo = new THREE.ConeGeometry(2.6, 12, 24, 1, true);
    const reentryPlasmaMat = new THREE.MeshBasicMaterial({
      color: 0xff3b30,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });
    const reentryPlasmaSheath = new THREE.Mesh(reentryPlasmaGeo, reentryPlasmaMat);
    reentryPlasmaSheath.position.y = 29;
    rocket.add(reentryPlasmaSheath);

    // Transonic Mach 1 Vapor Cone (Prandtl-Glauert singularity)
    const vaporCone = new THREE.Mesh(
      new THREE.ConeGeometry(3.6, 2.2, 32, 1, true),
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
      })
    );
    vaporCone.position.y = 19.5;
    rocket.add(vaporCone);

    // Discarded physical stages tracking array for realistic physical separation
    const discardedStages: {
      mesh: THREE.Object3D;
      vel: THREE.Vector3;
      rot: THREE.Vector3;
    }[] = [];

    // 3D Orbital Trajectory Map Spline
    const orbitCurve = new THREE.EllipseCurve(0, 0, 60, 95, 0, 2 * Math.PI, false, 0);
    const orbitPoints = orbitCurve.getPoints(64);
    const orbitGeo = new THREE.BufferGeometry().setFromPoints(
      orbitPoints.map((p) => new THREE.Vector3(p.x, 0, p.y))
    );
    const orbitLine = new THREE.Line(orbitGeo, new THREE.LineBasicMaterial({ color: 0x38bdf8, linewidth: 3 }));
    orbitLine.visible = false;
    scene.add(orbitLine);

    rocket.position.set(0, 0, 0);
    scene.add(rocket);

    // ─── Flight Controls & Orbital Telemetry ───
    let currentAlt = 0;
    let currentVel = 0;
    let currentThrottle = 0;
    let currentDeltaV = 4850;
    let currentAp = 0;
    let currentPe = 0;
    let currentStage = 1;
    let pitch = 90;

    const keys: Record<string, boolean> = {};
    const onKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      keys[k] = true;
      if (k === ' ' || e.code === 'Space') executeStaging();
      if (k === 'm') {
        setMapMode((m) => !m);
        orbitLine.visible = !orbitLine.visible;
      }
      if (k === 'x') currentThrottle = 0;
      if (k === 'z') currentThrottle = 100;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keys[e.key.toLowerCase()] = false;
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    // 360° Interactive Mouse Orbit & Scroll Zoom Camera System
    let camDistance = 84;
    let camYaw = 0.52;
    let camPitch = 0.22;
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;

    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - prevMouseX;
      const dy = e.clientY - prevMouseY;
      camYaw -= dx * 0.007;
      camPitch = Math.max(-0.25, Math.min(1.25, camPitch + dy * 0.007));
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };
    const onPointerUp = () => {
      isDragging = false;
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      camDistance = Math.max(32, Math.min(220, camDistance + e.deltaY * 0.08));
    };

    container.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    container.addEventListener('wheel', onWheel, { passive: false });

    const separatePart = (part: THREE.Object3D, impulse: THREE.Vector3, tumble: THREE.Vector3) => {
      const worldPos = new THREE.Vector3();
      const worldQuat = new THREE.Quaternion();
      part.getWorldPosition(worldPos);
      part.getWorldQuaternion(worldQuat);

      if (part.parent) part.parent.remove(part);
      part.position.copy(worldPos);
      part.quaternion.copy(worldQuat);
      scene.add(part);

      const rocketDir = new THREE.Vector3(0, 1, 0).applyEuler(rocket.rotation);
      const stageVel = rocketDir.multiplyScalar(currentVel * 0.18).add(impulse);

      discardedStages.push({
        mesh: part,
        vel: stageVel,
        rot: tumble,
      });
    };

    const executeStaging = () => {
      if (currentStage === 1) {
        currentStage = 2;
        setStage(2);
        // Stage 1: Dual SRB Separation - tumble laterally away
        separatePart(srbL, new THREE.Vector3(-12, -5, -2), new THREE.Vector3(0.5, 0.2, 0.4));
        separatePart(srbR, new THREE.Vector3(12, -5, -2), new THREE.Vector3(-0.5, -0.2, -0.4));
        if (!isMuted) soundFx.playImpact();
      } else if (currentStage === 2) {
        currentStage = 3;
        setStage(3);
        // Stage 2: Core Stage Separation & LAS Abort Tower Jettison
        separatePart(coreStage, new THREE.Vector3(0, -16, -3), new THREE.Vector3(0.12, 0.05, 0.15));
        separatePart(abortTower, new THREE.Vector3(0, 24, 0), new THREE.Vector3(0.25, 0.1, 0));
        // Switch plume to Vacuum RL-10 Cyan Plume
        outerFlameMat.color.setHex(0x38bdf8);
        coreFlameMat.color.setHex(0xffffff);
        plumeGroup.scale.set(0.65, 0.85, 0.65);
        if (!isMuted) soundFx.playReactorStart();
      } else if (currentStage === 3) {
        currentStage = 4;
        setStage(4);
        // Stage 3: Orbit Insertion - Unfold Orion X-Wing Solar Panels
        solarWings.forEach((w) => w.scale.set(1, 1, 1));
        if (!isMuted) soundFx.playVictory();
      }
    };

    // ─── Animation Loop ───
    let animId: number;
    let lastT = performance.now();

    const animate = (t: number) => {
      animId = requestAnimationFrame(animate);
      const dt = Math.min((t - lastT) / 1000, 0.1);
      lastT = t;

      // Throttle adjustments
      if (keys['w'] || keys['arrowup']) currentThrottle = Math.min(100, currentThrottle + 45 * dt);
      if (keys['s'] || keys['arrowdown']) currentThrottle = Math.max(0, currentThrottle - 45 * dt);
      setThrottle(Math.round(currentThrottle));

      // Pitch steering (Gravity Turn from 90° down to 0°)
      if (keys['d'] || keys['arrowright']) pitch = Math.max(0, pitch - 18 * dt);
      if (keys['a'] || keys['arrowleft']) pitch = Math.min(90, pitch + 18 * dt);
      setPitchDeg(Math.round(pitch));

      const rad = (90 - pitch) * (Math.PI / 180);
      rocket.rotation.z = -rad;

      // Thrust Acceleration
      // Thrust Acceleration & Animated Exhaust System
      if (currentThrottle > 0 && currentDeltaV > 0) {
        plumeGroup.visible = true;
        const thrustFraction = currentThrottle / 100;
        const turbulentPulse = 0.85 + Math.random() * 0.35;
        outerFlame.scale.set(1.0 + Math.random() * 0.25, thrustFraction * turbulentPulse, 1.0 + Math.random() * 0.25);
        coreFlame.scale.set(0.9 + Math.random() * 0.2, thrustFraction * (0.95 + Math.random() * 0.25), 0.9 + Math.random() * 0.2);
        shockRings.forEach((r, idx) => {
          r.scale.setScalar(0.9 + Math.sin(t * 0.3 + idx) * 0.2);
        });
        flameLight.intensity = thrustFraction * (5.5 + Math.random() * 3.0);

        // Update animated exhaust sparks in world space
        const sparkPosAttr = rocketSparkGeo.attributes.position as THREE.BufferAttribute;
        for (let sp = 0; sp < rocketSparkCount; sp++) {
          const spv = rocketSparkVels[sp];
          spv.life += dt;
          if (spv.life > spv.maxLife) {
            spv.life = 0;
            sparkPosAttr.setXYZ(
              sp,
              rocket.position.x + (Math.random() - 0.5) * 2.0,
              rocket.position.y - 1.5,
              rocket.position.z + (Math.random() - 0.5) * 2.0
            );
            spv.x = (Math.random() - 0.5) * 8;
            spv.y = -20 - Math.random() * 35;
            spv.z = (Math.random() - 0.5) * 8;
          } else {
            const sx = sparkPosAttr.getX(sp) + spv.x * dt;
            const sy = sparkPosAttr.getY(sp) + spv.y * dt;
            const sz = sparkPosAttr.getZ(sp) + spv.z * dt;
            sparkPosAttr.setXYZ(sp, sx, sy, sz);
          }
        }
        rocketSparkGeo.attributes.position.needsUpdate = true;
        rocketSparkMat.opacity = Math.min(1.0, thrustFraction * 0.95);

        const thrustAcc = (currentThrottle / 100) * 32.0;
        currentVel += thrustAcc * dt;
        currentDeltaV = Math.max(0, currentDeltaV - thrustAcc * dt * 7.5);

        const vz = Math.sin(pitch * (Math.PI / 180)) * currentVel;
        const vx = Math.cos(pitch * (Math.PI / 180)) * currentVel;

        currentAlt += (vz * dt * 0.22);
        currentAp = Math.max(currentAp, currentAlt * 1.6 + currentVel * 0.4);
        if (currentAlt > 70 && pitch < 50) {
          currentPe = Math.max(0, (currentVel - 4.2) * 50);
        }

        // Circular Orbit Condition
        if (currentPe > 160 && !orbitAchieved) {
          setOrbitAchieved(true);
          solarWings.forEach((w) => w.scale.set(1, 1, 1));
          onUpdateScores(true, currentDeltaV);
          confetti({ particleCount: 90, spread: 75, origin: { y: 0.6 } });
        }
      } else {
        plumeGroup.visible = false;
        flameLight.intensity = 0;
        rocketSparkMat.opacity = 0;
        if (currentAlt > 0) currentVel = Math.max(0, currentVel - 9.8 * dt * 0.04);
      }

      // Hypersonic Atmospheric Friction / Re-entry Plasma Sheath
      if (currentAlt < 85 && currentVel > 8) {
        const plasmaOpacity = Math.min(0.85, (currentVel - 8) * 0.05);
        reentryPlasmaMat.opacity = plasmaOpacity * (0.8 + Math.random() * 0.4);
        reentryPlasmaSheath.scale.set(1.0 + Math.sin(t * 0.5) * 0.06, 1.0, 1.0 + Math.sin(t * 0.5) * 0.06);
      } else {
        reentryPlasmaMat.opacity = 0;
      }

      // Smoothly unfold solar panels if in stage 4 or orbit
      if (currentStage >= 4 || orbitAchieved) {
        solarWings.forEach((w) => {
          if (w.scale.x < 1.0) w.scale.x = Math.min(1.0, w.scale.x + dt * 0.8);
        });
      }

      // Physical Discarded Stages Tumbling & Decay
      for (let i = discardedStages.length - 1; i >= 0; i--) {
        const s = discardedStages[i];
        s.mesh.position.addScaledVector(s.vel, dt);
        s.mesh.rotation.x += s.rot.x * dt;
        s.mesh.rotation.y += s.rot.y * dt;
        s.mesh.rotation.z += s.rot.z * dt;
        s.vel.y -= 9.8 * dt; // Gravity pulling stages down
        if (s.mesh.position.y < -350) {
          scene.remove(s.mesh);
          discardedStages.splice(i, 1);
        }
      }

      // Transonic Mach 1 Vapor Cone (between 0.8km and 2.6km)
      if (currentAlt > 0.8 && currentAlt < 2.6 && currentVel > 20) {
        const coneOpacity = Math.sin(((currentAlt - 0.8) / 1.8) * Math.PI) * 0.7;
        (vaporCone.material as THREE.MeshBasicMaterial).opacity = coneOpacity;
        vaporCone.scale.set(1.0 + Math.sin(t * 0.04) * 0.08, 1.0, 1.0 + Math.sin(t * 0.04) * 0.08);
      } else {
        (vaporCone.material as THREE.MeshBasicMaterial).opacity = 0;
      }

      // Dynamic Atmospheric Scattering Sky Color
      const skyProg = Math.min(1, currentAlt / 60);
      const rSky = Math.round((1 - skyProg) * 16 + skyProg * 2);
      const gSky = Math.round((1 - skyProg) * 55 + skyProg * 5);
      const bSky = Math.round((1 - skyProg) * 120 + skyProg * 18);
      scene.background = new THREE.Color(`rgb(${rSky},${gSky},${bSky})`);

      setAltitudeKm(Math.round(currentAlt));
      setVelocityKms(Number((currentVel * 0.08).toFixed(2)));
      setDeltaV(Math.round(currentDeltaV));
      setApoapsisKm(Math.round(currentAp));
      setPeriapsisKm(Math.round(currentPe));

      rocket.position.y = currentAlt * 0.2;

      // Update Launch Pad billowing smoke during liftoff (alt < 25km)
      if (currentThrottle > 0 && currentAlt < 25) {
        padSmokeMat.opacity = Math.min(0.72, padSmokeMat.opacity + dt * 1.8);
        const sPosAttr = padSmokeGeo.attributes.position as THREE.BufferAttribute;
        for (let s = 0; s < padSmokeCount; s++) {
          const sv = padSmokeVels[s];
          sv.life += dt;
          if (sv.life > sv.maxLife) {
            sv.life = 0;
            sPosAttr.setXYZ(s, (Math.random() - 0.5) * 5, -0.5, (Math.random() - 0.5) * 5);
            sv.x = (Math.random() - 0.5) * 24;
            sv.y = 1.0 + Math.random() * 6.5;
            sv.z = (Math.random() - 0.5) * 24;
          } else {
            const x = sPosAttr.getX(s) + sv.x * dt;
            const y = sPosAttr.getY(s) + sv.y * dt;
            const z = sPosAttr.getZ(s) + sv.z * dt;
            sPosAttr.setXYZ(s, x, y, z);
          }
        }
        padSmokeGeo.attributes.position.needsUpdate = true;
      } else {
        if (padSmokeMat.opacity > 0) padSmokeMat.opacity = Math.max(0, padSmokeMat.opacity - dt * 0.9);
      }

      // Rotate Earth slowly
      earth.rotation.y += dt * 0.02;

      // Dynamic 360° Orbital Camera Chasing with Throttle Vibration
      if (!mapMode) {
        const targetLook = rocket.position.clone().add(new THREE.Vector3(0, 16, 0));
        const cx = targetLook.x + Math.sin(camYaw) * Math.cos(camPitch) * camDistance;
        const cy = targetLook.y + Math.sin(camPitch) * camDistance;
        const cz = targetLook.z + Math.cos(camYaw) * Math.cos(camPitch) * camDistance;

        const rumble = currentThrottle > 0 ? (currentThrottle / 100) * (currentAlt < 25 ? 0.32 : 0.06) : 0;
        const shakeX = (Math.random() - 0.5) * rumble;
        const shakeY = (Math.random() - 0.5) * rumble;
        const shakeZ = (Math.random() - 0.5) * rumble;

        camera.position.lerp(new THREE.Vector3(cx + shakeX, cy + shakeY, cz + shakeZ), 0.14);
        camera.lookAt(targetLook);
      } else {
        camera.position.set(0, 260, 360);
        camera.lookAt(0, 0, 0);
      }

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      container.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      container.removeEventListener('wheel', onWheel);
      disposeThreeScene(renderer, scene, container);
    };
  }, [isMuted, orbitAchieved]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', backgroundColor: '#020512', cursor: 'grab' }}>
      <div ref={mountRef} style={{ width: '100%', height: '100%', backgroundColor: '#020512' }} />

      {/* Camera Orbit Control Hint Badge */}
      <div
        style={{
          position: 'absolute',
          top: '16px',
          right: '80px',
          background: 'rgba(15, 23, 42, 0.75)',
          border: '1px solid rgba(251, 191, 36, 0.4)',
          borderRadius: '20px',
          padding: '6px 14px',
          color: '#fbbf24',
          fontSize: '11px',
          fontWeight: 700,
          letterSpacing: '0.04em',
          pointerEvents: 'none',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        <RotateCcw size={13} /> DRAG MOUSE TO ORBIT 360° • SCROLL TO ZOOM
      </div>

      {/* Flight Officer Kerbal HUD */}
      <div
        style={{
          position: 'absolute',
          top: '16px',
          left: '20px',
          background: 'rgba(15, 23, 42, 0.88)',
          border: '1.5px solid #fbbf24',
          borderRadius: '12px',
          padding: '14px 22px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          boxShadow: '0 0 25px rgba(251, 191, 36, 0.35)',
          minWidth: '240px',
        }}
      >
        <div style={{ fontSize: '10.5px', color: '#fbbf24', fontWeight: 900, letterSpacing: '0.08em' }}>
          NASA SLS &amp; ORION ORBITAL TELEMETRY
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
          <span style={{ color: '#94a3b8' }}>ALTITUDE:</span>
          <span style={{ color: '#38bdf8', fontWeight: 900 }}>{altitudeKm} KM</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
          <span style={{ color: '#94a3b8' }}>VELOCITY:</span>
          <span style={{ color: '#38bdf8', fontWeight: 900 }}>{velocityKms} KM/S</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
          <span style={{ color: '#94a3b8' }}>Δv BUDGET:</span>
          <span style={{ color: deltaV > 1200 ? '#10b981' : '#f87171', fontWeight: 900 }}>{deltaV} M/S</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
          <span style={{ color: '#94a3b8' }}>AP / PE:</span>
          <span style={{ color: '#cbd5e1', fontWeight: 800 }}>{apoapsisKm}K / {periapsisKm}K</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
          <span style={{ color: '#94a3b8' }}>PITCH ANGLE:</span>
          <span style={{ color: '#fbbf24', fontWeight: 900 }}>{pitchDeg}° (GRAVITY TURN)</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
          <span style={{ color: '#94a3b8' }}>MACH NUMBER:</span>
          <span style={{ color: '#38bdf8', fontWeight: 900 }}>
            {velocityKms < 0.34 ? 'SUB-SONIC' : `MACH ${(velocityKms / 0.34).toFixed(1)}`}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
          <span style={{ color: '#94a3b8' }}>AERO DYNAMIC PRESSURE:</span>
          <span style={{ color: altitudeKm > 10 && altitudeKm < 25 ? '#f87171' : '#4ade80', fontWeight: 900 }}>
            {altitudeKm > 10 && altitudeKm < 25 ? '⚠️ MAX-Q (PEAK DRAG)' : 'NOMINAL Q'}
          </span>
        </div>

        {orbitAchieved && (
          <div
            style={{
              marginTop: '6px',
              padding: '6px 10px',
              background: 'rgba(16, 185, 129, 0.25)',
              border: '1px solid #10b981',
              borderRadius: '6px',
              color: '#6ee7b7',
              fontSize: '11px',
              fontWeight: 900,
              textAlign: 'center',
            }}
          >
            🏆 STABLE LUNAR ORBIT NOMINAL (PE &gt; 160 KM)
          </div>
        )}
      </div>

      {/* Right Side: NASA Orion Subsystems Grid Panel */}
      <div
        style={{
          position: 'absolute',
          top: '16px',
          right: '20px',
          background: 'rgba(15, 23, 42, 0.88)',
          border: '1px solid rgba(251, 191, 36, 0.4)',
          borderRadius: '12px',
          padding: '12px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          minWidth: '220px',
        }}
      >
        <div style={{ fontSize: '10px', color: '#fbbf24', fontWeight: 800 }}>NASA ORION ECLSS &amp; POWER BUS</div>
        <div style={{ fontSize: '11px', color: '#e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
          <span>HYDROGEN FUEL CELLS:</span>
          <span style={{ color: '#10b981', fontWeight: 800 }}>3.2 MW (NOMINAL)</span>
        </div>
        <div style={{ fontSize: '11px', color: '#e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
          <span>O₂ SCRUBBERS:</span>
          <span style={{ color: '#38bdf8', fontWeight: 800 }}>101.3 kPa (100%)</span>
        </div>
        <div style={{ fontSize: '11px', color: '#e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
          <span>RCS MONOPROP:</span>
          <span style={{ color: '#fbbf24', fontWeight: 800 }}>450 KG</span>
        </div>

        <div style={{ marginTop: '8px', paddingTop: '6px', borderTop: '1px dashed rgba(251, 191, 36, 0.35)', display: 'flex', flexDirection: 'column', gap: '3px' }}>
          <div style={{ fontSize: '9px', color: '#cbd5e1', fontWeight: 800 }}>NASA SLS FLIGHT DIRECTIVES:</div>
          <div style={{ fontSize: '10px', color: '#94a3b8' }}>• <strong>Stage 1</strong>: Korolev Cross SRB Separation [SPACE]</div>
          <div style={{ fontSize: '10px', color: '#94a3b8' }}>• <strong>Stage 2</strong>: RS-25 Core Sustainer Cutoff (MECO)</div>
          <div style={{ fontSize: '10px', color: '#94a3b8' }}>• <strong>Stage 3</strong>: Orion ICPS Circularization Burn</div>
          <div style={{ fontSize: '10px', color: '#94a3b8' }}>• <strong>Stage 4</strong>: Trans-Lunar Injection (TLI) to Moon</div>
        </div>
      </div>

      {/* Interactive KSP NavBall (Center Bottom HUD) */}
      <div
        style={{
          position: 'absolute',
          bottom: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '90px',
          height: '90px',
          borderRadius: '50%',
          background: 'radial-gradient(circle at 45% 45%, #0284c7 48%, #d97706 52%)',
          border: '3px solid #fbbf24',
          boxShadow: '0 0 20px rgba(251, 191, 36, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}
      >
        <div style={{ color: '#fff', fontSize: '9px', fontWeight: 900, textShadow: '0 0 4px #000' }}>
          (·) PROGRADE
        </div>
      </div>

      {/* Bottom KSP Controls */}
      <div
        style={{
          position: 'absolute',
          bottom: '16px',
          left: '20px',
          right: '20px',
          background: 'rgba(15, 23, 42, 0.88)',
          border: '1px solid rgba(251, 191, 36, 0.35)',
          borderRadius: '12px',
          padding: '10px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Current Stage Indicator Badge */}
          <div
            style={{
              padding: '5px 10px',
              borderRadius: '6px',
              background: 'rgba(251, 191, 36, 0.15)',
              border: '1px solid #fbbf24',
              color: '#fbbf24',
              fontSize: '11px',
              fontWeight: 900,
            }}
          >
            {stage === 1 && 'STAGE 1: SLS CORE (4x RS-25) + DUAL 5-SEGMENT SRBs'}
            {stage === 2 && 'STAGE 2: CORE SUSTAINER CRYOGENIC LH2/LOX BURN'}
            {stage === 3 && 'STAGE 3: ORION ICPS (RL-10B-2) VACUUM BURN'}
            {stage >= 4 && 'STAGE 4: LUNAR ORBIT INSERTION NOMINAL'}
          </div>

          {/* Staging Button */}
          <button
            onClick={() => {
              const e = new KeyboardEvent('keydown', { key: ' ' });
              window.dispatchEvent(e);
            }}
            style={{
              background: 'linear-gradient(135deg, #d97706, #ea580c)',
              border: '1px solid #fbbf24',
              color: '#fff',
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '11px',
              fontWeight: 900,
              cursor: 'pointer',
              boxShadow: '0 0 12px rgba(234, 88, 12, 0.4)',
            }}
          >
            🚀 STAGING [SPACE] (STAGE {stage})
          </button>

          {/* Throttle Controls */}
          <button
            onClick={() => {
              const e = new KeyboardEvent('keydown', { key: 'z' });
              window.dispatchEvent(e);
            }}
            style={{
              background: 'rgba(16, 185, 129, 0.25)',
              border: '1px solid #10b981',
              color: '#6ee7b7',
              padding: '6px 10px',
              borderRadius: '8px',
              fontSize: '11px',
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            MAX BURN 100% [Z]
          </button>
          <button
            onClick={() => {
              const e = new KeyboardEvent('keydown', { key: 'w' });
              window.dispatchEvent(e);
            }}
            style={{
              background: 'rgba(56, 189, 248, 0.2)',
              border: '1px solid #38bdf8',
              color: '#38bdf8',
              padding: '6px 10px',
              borderRadius: '8px',
              fontSize: '11px',
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            THR + [W]
          </button>
          <button
            onClick={() => {
              const e = new KeyboardEvent('keydown', { key: 's' });
              window.dispatchEvent(e);
            }}
            style={{
              background: 'rgba(56, 189, 248, 0.2)',
              border: '1px solid #38bdf8',
              color: '#38bdf8',
              padding: '6px 10px',
              borderRadius: '8px',
              fontSize: '11px',
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            THR - [S]
          </button>
          <button
            onClick={() => {
              const e = new KeyboardEvent('keydown', { key: 'x' });
              window.dispatchEvent(e);
            }}
            style={{
              background: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid #ef4444',
              color: '#fca5a5',
              padding: '6px 10px',
              borderRadius: '8px',
              fontSize: '11px',
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            CUTOFF 0% [X]
          </button>

          {/* Pitch Steering */}
          <button
            onClick={() => {
              const e = new KeyboardEvent('keydown', { key: 'd' });
              window.dispatchEvent(e);
            }}
            style={{
              background: 'rgba(251, 191, 36, 0.2)',
              border: '1px solid #fbbf24',
              color: '#fde68a',
              padding: '6px 10px',
              borderRadius: '8px',
              fontSize: '11px',
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            GRAVITY TURN ↘ [D]
          </button>

          {/* Map View Toggle */}
          <button
            onClick={() => setMapMode(!mapMode)}
            style={{
              background: mapMode ? 'rgba(56, 189, 248, 0.4)' : 'rgba(56, 189, 248, 0.15)',
              border: '1px solid #38bdf8',
              color: '#38bdf8',
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '11px',
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            🗺️ ORBIT MAP [M]
          </button>
        </div>

        <button
          onClick={onBack}
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: '#cbd5e1',
            padding: '6px 14px',
            borderRadius: '8px',
            fontSize: '11px',
            fontWeight: 800,
            cursor: 'pointer',
          }}
        >
          ← BACK TO HUB
        </button>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. GAME 3: MASTER COMMANDER (STAR CITIZEN, EVE ECHOES, ELITE DANGEROUS)
// ─────────────────────────────────────────────────────────────────────────────
interface CommanderGameProps {
  isMuted: boolean;
  onBack: () => void;
  onUpdateScores: (faTime: number, kills: number) => void;
  mission?: NasaLevelMission;
  vehicle?: VehicleConfig;
  map?: PlanetMapConfig;
}

const MasterCommanderScGame: React.FC<CommanderGameProps> = ({ isMuted, onBack, onUpdateScores, mission, vehicle, map }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [faOff, setFaOff] = useState(true);
  const [speedKms, setSpeedKms] = useState(4.2);
  const [kills, setKills] = useState(0);
  const [pwrPips, setPwrPips] = useState<'SYS' | 'ENG' | 'WEP'>('WEP');
  const [radarPingCount, setRadarPingCount] = useState(0);
  const [viewMode, setViewMode] = useState<'CHASE' | 'COCKPIT'>('CHASE');
  const [nearestTargetDist, setNearestTargetDist] = useState<number>(145);
  const [shield, setShield] = useState<number>(100);
  const [hull, setHull] = useState<number>(100);
  const [missiles, setMissiles] = useState<number>(6);
  const [bountyCredits, setBountyCredits] = useState<number>(0);
  const [damageFlash, setDamageFlash] = useState<'shield' | 'hull' | null>(null);

  const viewModeRef = useRef<'CHASE' | 'COCKPIT'>('CHASE');
  useEffect(() => {
    viewModeRef.current = viewMode;
  }, [viewMode]);

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x01020a);

    // Dynamic camera with cockpit / third-person chase support
    const camera = new THREE.PerspectiveCamera(54, width / height, 0.1, 12000);
    camera.position.set(0, 3.2, 11.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // ─── 1. Breathtaking Interstellar Backdrop ───
    // Multi-color Cosmic Nebula Dust Clouds
    const nebulaCount = 320;
    const nebGeo = new THREE.BufferGeometry();
    const nebPos = new Float32Array(nebulaCount * 3);
    const nebCols = new Float32Array(nebulaCount * 3);
    for (let i = 0; i < nebulaCount * 3; i += 3) {
      nebPos[i] = (Math.random() - 0.5) * 2200;
      nebPos[i + 1] = (Math.random() - 0.5) * 1100;
      nebPos[i + 2] = (Math.random() - 0.5) * 2200;
      // High-vibrancy purple/cyan/magenta interstellar dust
      const randColor = Math.random();
      if (randColor < 0.4) {
        nebCols[i] = 0.55; nebCols[i + 1] = 0.15; nebCols[i + 2] = 0.95; // Deep Violet
      } else if (randColor < 0.7) {
        nebCols[i] = 0.05; nebCols[i + 1] = 0.65; nebCols[i + 2] = 0.95; // Cyan
      } else {
        nebCols[i] = 0.90; nebCols[i + 1] = 0.15; nebCols[i + 2] = 0.55; // Magenta
      }
    }
    nebGeo.setAttribute('position', new THREE.BufferAttribute(nebPos, 3));
    nebGeo.setAttribute('color', new THREE.BufferAttribute(nebCols, 3));
    const nebMat = new THREE.PointsMaterial({
      size: 34.0,
      vertexColors: true,
      map: createProceduralStarTexture(),
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const nebula = new THREE.Points(nebGeo, nebMat);
    scene.add(nebula);

    // Deep Space Starfield (3,200 layered stars)
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(3200 * 3);
    for (let i = 0; i < 3200 * 3; i += 3) {
      starPos[i] = (Math.random() - 0.5) * 6000;
      starPos[i + 1] = (Math.random() - 0.5) * 6000;
      starPos[i + 2] = (Math.random() - 0.5) * 6000;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starfield = new THREE.Points(
      starGeo,
      new THREE.PointsMaterial({ color: 0xffffff, size: 2.2, map: createProceduralStarTexture(), transparent: true })
    );
    scene.add(starfield);

    // ─── 2. Photorealistic Celestial Gas Giant with Planetary Rings ───
    const planetGroup = new THREE.Group();
    const planetRadius = 420;
    const planetGeo = new THREE.SphereGeometry(planetRadius, 64, 64);
    const planetMat = new THREE.MeshStandardMaterial({
      color: 0x1d4ed8,
      emissive: 0x0c2560,
      emissiveIntensity: 0.25,
      roughness: 0.6,
      metalness: 0.2,
    });
    const planetMesh = new THREE.Mesh(planetGeo, planetMat);
    planetGroup.add(planetMesh);

    // Glowing Atmospheric Aura
    const auraGeo = new THREE.SphereGeometry(planetRadius * 1.035, 48, 48);
    const auraMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.22,
      side: THREE.BackSide,
    });
    planetGroup.add(new THREE.Mesh(auraGeo, auraMat));

    // Massive Planetary Rings
    const ringGeo = new THREE.RingGeometry(planetRadius * 1.35, planetRadius * 2.1, 64);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x93c5fd,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.45,
      roughness: 0.7,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 2.5;
    planetGroup.add(ringMesh);

    planetGroup.position.set(-650, -180, -1600);
    scene.add(planetGroup);

    // ─── 3. Dramatic Aerospace Lighting ───
    const sunLight = new THREE.DirectionalLight(0xfffbeb, 2.6);
    sunLight.position.set(280, 220, 240);
    scene.add(sunLight);

    const shipKeyLight = new THREE.DirectionalLight(0xe0f2fe, 2.0);
    shipKeyLight.position.set(-60, 90, 70);
    scene.add(shipKeyLight);

    const hemiLight = new THREE.HemisphereLight(0x818cf8, 0x0f172a, 1.4);
    scene.add(hemiLight);

    // ─── 4. 85+ Tumbling 3D Asteroids ───
    const asteroidGroup = new THREE.Group();
    for (let a = 0; a < 85; a++) {
      const aGeo = new THREE.DodecahedronGeometry(3.0 + Math.random() * 5.0, 1);
      const aMat = new THREE.MeshStandardMaterial({
        color: 0x475569,
        roughness: 0.85,
        metalness: 0.35,
        flatShading: true,
      });
      const ast = new THREE.Mesh(aGeo, aMat);
      ast.position.set((Math.random() - 0.5) * 650, (Math.random() - 0.5) * 180, (Math.random() - 0.5) * 650);
      ast.rotation.set(Math.random(), Math.random(), Math.random());
      asteroidGroup.add(ast);
    }
    scene.add(asteroidGroup);

    // ─── 5. Citadel Orbital Megastation in Distance ───
    const station = new THREE.Group();
    const hub = new THREE.Mesh(
      new THREE.CylinderGeometry(24, 24, 60, 24),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9, roughness: 0.2 })
    );
    station.add(hub);

    const stationRing = new THREE.Mesh(
      new THREE.TorusGeometry(60, 3.2, 16, 48),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, emissive: 0x0369a1, emissiveIntensity: 0.85 })
    );
    stationRing.rotation.x = Math.PI / 2;
    station.add(stationRing);

    // Solar array panels
    for (let p = 0; p < 4; p++) {
      const angle = (p * Math.PI) / 2;
      const arm = new THREE.Mesh(
        new THREE.BoxGeometry(4.0, 0.4, 45),
        new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.2, metalness: 0.9 })
      );
      arm.position.set(Math.cos(angle) * 72, 0, Math.sin(angle) * 72);
      arm.rotation.y = angle;
      station.add(arm);
    }
    station.position.set(-240, 60, -480);
    scene.add(station);

    // ─── 6. REALISTIC HIGH-FIDELITY AEROSPACE INTERCEPTOR SPACECRAFT ───
    const ship = new THREE.Group();

    // Fuselage Central Core (Angular multi-faceted titanium body)
    const bodyGeo = new THREE.CylinderGeometry(0.5, 1.45, 8.2, 6);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.92,
      roughness: 0.22,
      flatShading: true,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.rotation.x = Math.PI / 2;
    ship.add(body);

    // Chined Carbon Stealth Deck Plating
    const upperDeck = new THREE.Mesh(
      new THREE.BoxGeometry(1.85, 0.45, 6.4),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.85, roughness: 0.35 })
    );
    upperDeck.position.set(0, 0.38, 0.4);
    ship.add(upperDeck);

    // Aerodynamic Titanium Needle Nose Radome
    const nose = new THREE.Mesh(
      new THREE.ConeGeometry(0.52, 3.8, 8),
      new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.95, roughness: 0.15 })
    );
    nose.rotation.x = -Math.PI / 2;
    nose.position.set(0, 0, -4.8);
    ship.add(nose);

    // Gold Plated Pitot Airspeed/Avionics Sensor Tip
    const probe = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.08, 1.4, 8),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.95, roughness: 0.1 })
    );
    probe.rotation.x = -Math.PI / 2;
    probe.position.set(0, 0, -7.2);
    ship.add(probe);

    // Polarized Crystalline Cockpit Canopy & Holographic Interior
    const canopy = new THREE.Mesh(
      new THREE.ConeGeometry(0.68, 2.8, 6),
      new THREE.MeshPhysicalMaterial({
        color: 0x38bdf8,
        emissive: 0x0284c7,
        emissiveIntensity: 0.45,
        metalness: 0.9,
        roughness: 0.08,
        transmission: 0.35,
        transparent: true,
        opacity: 0.92,
        clearcoat: 1.0,
      })
    );
    canopy.rotation.x = -Math.PI / 2;
    canopy.scale.set(1.0, 1.0, 0.46);
    canopy.position.set(0, 0.68, -1.9);
    ship.add(canopy);

    // Pilot HUD Hologram Ring
    const pilotHud = new THREE.Mesh(
      new THREE.RingGeometry(0.12, 0.24, 16),
      new THREE.MeshBasicMaterial({ color: 0x22c55e, side: THREE.DoubleSide })
    );
    pilotHud.position.set(0, 0.62, -2.2);
    ship.add(pilotHud);

    // Swept Tactical Delta Wings
    const wingShape = new THREE.Shape();
    wingShape.moveTo(0, 0);
    wingShape.lineTo(6.2, 2.8);
    wingShape.lineTo(6.0, 4.0);
    wingShape.lineTo(0.9, 3.6);
    wingShape.lineTo(0, 0);
    const extrudeSettings = { depth: 0.18, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.06, bevelThickness: 0.06 };
    const wingGeo = new THREE.ExtrudeGeometry(wingShape, extrudeSettings);
    const wingMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.88,
      roughness: 0.26,
    });

    const rightWing = new THREE.Mesh(wingGeo, wingMat);
    rightWing.rotation.x = Math.PI / 2;
    rightWing.position.set(0.6, 0.06, -1.1);
    ship.add(rightWing);

    const leftWing = new THREE.Mesh(wingGeo, wingMat);
    leftWing.rotation.x = Math.PI / 2;
    leftWing.scale.set(-1, 1, 1);
    leftWing.position.set(-0.6, 0.06, -1.1);
    ship.add(leftWing);

    // Gold/Titanium Leading Edge Armor Strips
    const slatMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.95, roughness: 0.18 });
    const slatR = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 6.6, 8), slatMat);
    slatR.rotation.z = -Math.PI / 4.2;
    slatR.rotation.y = 0.28;
    slatR.position.set(3.4, 0.08, 0.2);
    ship.add(slatR);

    const slatL = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 6.6, 8), slatMat);
    slatL.rotation.z = Math.PI / 4.2;
    slatL.rotation.y = -0.28;
    slatL.position.set(-3.4, 0.08, 0.2);
    ship.add(slatL);

    // Wingtip Canted Stabilizers / Winglets
    const finMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.85, roughness: 0.3 });
    const finR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.9, 2.4), finMat);
    finR.position.set(6.2, 0.9, 2.5);
    finR.rotation.z = -0.22;
    ship.add(finR);

    const finL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.9, 2.4), finMat);
    finL.position.set(-6.2, 0.9, 2.5);
    finL.rotation.z = 0.22;
    ship.add(finL);

    // Dual Dorsal V-Tail Stabilizers
    const tailR = new THREE.Mesh(new THREE.BoxGeometry(0.15, 2.4, 2.6), finMat);
    tailR.position.set(0.75, 1.3, 2.9);
    tailR.rotation.z = -0.32;
    ship.add(tailR);

    const tailL = new THREE.Mesh(new THREE.BoxGeometry(0.15, 2.4, 2.6), finMat);
    tailL.position.set(-0.75, 1.3, 2.9);
    tailL.rotation.z = 0.32;
    ship.add(tailL);

    // Flashing Navigation Strobe LEDs (Port: Red, Starboard: Green)
    const navLightPort = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xef4444 })
    );
    navLightPort.position.set(-6.3, 1.8, 2.9);
    ship.add(navLightPort);

    const navLightStbd = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0x10b981 })
    );
    navLightStbd.position.set(6.3, 1.8, 2.9);
    ship.add(navLightStbd);

    // Underslung Dual Heavy Plasma Railguns
    const cannonGeo = new THREE.CylinderGeometry(0.16, 0.18, 3.6, 12);
    const cannonMat = new THREE.MeshStandardMaterial({ color: 0x020617, metalness: 0.95, roughness: 0.18 });
    const cannonR = new THREE.Mesh(cannonGeo, cannonMat);
    cannonR.rotation.x = Math.PI / 2;
    cannonR.position.set(2.5, -0.42, 0.8);
    ship.add(cannonR);

    const cannonL = cannonR.clone();
    cannonL.position.set(-2.5, -0.42, 0.8);
    ship.add(cannonL);

    // Glowing Cyan Magnetic Accelerator Coils
    [-2.5, 2.5].forEach((cx) => {
      [0.2, -0.6, -1.4].forEach((cz) => {
        const coil = new THREE.Mesh(
          new THREE.TorusGeometry(0.24, 0.045, 8, 16),
          new THREE.MeshBasicMaterial({ color: 0x00f0ff })
        );
        coil.position.set(cx, -0.42, cz);
        ship.add(coil);
      });
    });

    // Dual Machined Titanium Engine Bell Nozzles
    const nozzleMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.95,
      roughness: 0.15,
    });
    const nozzleL = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.94, 1.6, 24, 1, true), nozzleMat);
    nozzleL.rotation.x = Math.PI / 2;
    nozzleL.position.set(-1.45, 0.1, 4.2);
    ship.add(nozzleL);

    const nozzleR = nozzleL.clone();
    nozzleR.position.set(1.45, 0.1, 4.2);
    ship.add(nozzleR);

    // Volumetric 3D Recessed Engine Turbine Manifolds (No flat 2D white circles!)
    const manifoldGeo = new THREE.CylinderGeometry(0.52, 0.62, 0.9, 20);
    const manifoldMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      emissive: 0x0ea5e9,
      emissiveIntensity: 1.5,
      metalness: 0.85,
      roughness: 0.25,
    });
    const manifoldL = new THREE.Mesh(manifoldGeo, manifoldMat);
    manifoldL.rotation.x = Math.PI / 2;
    manifoldL.position.set(-1.45, 0.1, 3.8);
    ship.add(manifoldL);

    const manifoldR = manifoldL.clone();
    manifoldR.position.set(1.45, 0.1, 3.8);
    ship.add(manifoldR);

    // Glowing Concentric Accelerator Nozzle Rings
    [-1.45, 1.45].forEach((nx) => {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.68, 0.04, 8, 24),
        new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
      );
      ring.position.set(nx, 0.1, 4.3);
      ship.add(ring);
    });

    // 3D Hexagonal Deflector Shield Bubble (Flares bright cyan when impacted)
    const shieldBubbleGeo = new THREE.SphereGeometry(5.2, 24, 20);
    const shieldBubbleMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      wireframe: true,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
    });
    const shieldBubble = new THREE.Mesh(shieldBubbleGeo, shieldBubbleMat);
    ship.add(shieldBubble);

    // Real dynamic PointLights in engine bells illuminating the hull and space
    const engineLightL = new THREE.PointLight(0x38bdf8, 3.2, 16);
    engineLightL.position.set(-1.45, 0.1, 4.6);
    ship.add(engineLightL);

    const engineLightR = new THREE.PointLight(0x38bdf8, 3.2, 16);
    engineLightR.position.set(1.45, 0.1, 4.6);
    ship.add(engineLightR);

    // Volumetric Translucent Supersonic Engine Plumes (NO SOLID PLASTIC CONES!)
    const plumeMatOuter = new THREE.MeshBasicMaterial({
      color: 0x0284c7,
      transparent: true,
      opacity: 0.32,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const plumeMatInner = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const coreMatWhite = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const createExhaustPlume = (xPos: number) => {
      const plumeGroup = new THREE.Group();
      plumeGroup.position.set(xPos, 0.1, 4.4);

      // Outer volumetric blue supersonic cone (tapering backward)
      const outerCone = new THREE.Mesh(new THREE.ConeGeometry(0.72, 3.8, 16, 1, true), plumeMatOuter);
      outerCone.rotation.x = Math.PI / 2;
      outerCone.position.z = 1.9;
      plumeGroup.add(outerCone);

      // Mid electric-blue flame
      const midCone = new THREE.Mesh(new THREE.ConeGeometry(0.44, 2.6, 16, 1, true), plumeMatInner);
      midCone.rotation.x = Math.PI / 2;
      midCone.position.z = 1.3;
      plumeGroup.add(midCone);

      // Inner intense core
      const coreCone = new THREE.Mesh(new THREE.ConeGeometry(0.24, 1.5, 12), coreMatWhite);
      coreCone.rotation.x = Math.PI / 2;
      coreCone.position.z = 0.75;
      plumeGroup.add(coreCone);

      // 3D Supersonic Shock Diamond Concentric Rings (Faces correctly along exhaust vector)
      for (let s = 1; s <= 3; s++) {
        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(0.12 * s, 0.025, 6, 16),
          new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.75, blending: THREE.AdditiveBlending })
        );
        ring.position.z = 0.65 * s;
        plumeGroup.add(ring);
      }

      ship.add(plumeGroup);
      return plumeGroup;
    };

    const plumeL = createExhaustPlume(-1.45);
    const plumeR = createExhaustPlume(1.45);

    // Trailing Engine Ion Exhaust Sparks (Fine sub-pixel ion dust)
    const trailCount = 65;
    const trailGeo = new THREE.BufferGeometry();
    const trailPos = new Float32Array(trailCount * 3);
    for (let i = 0; i < trailCount * 3; i += 3) {
      trailPos[i] = (Math.random() - 0.5) * 2.5;
      trailPos[i + 1] = (Math.random() - 0.5) * 1.2;
      trailPos[i + 2] = 5 + Math.random() * 22;
    }
    trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPos, 3));
    const trailMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.4,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const trailPoints = new THREE.Points(trailGeo, trailMat);
    ship.add(trailPoints);

    ship.position.set(0, 0, 0);
    scene.add(ship);

    // ─── 7. Active Hostile Pirate Raider Gunships (AI Dogfight Engine) ───
    interface EnemyRaider {
      mesh: THREE.Group;
      vel: THREE.Vector3;
      hp: number;
      maxHp: number;
      fireCooldown: number;
      alive: boolean;
      hpBarGroup: THREE.Group;
      hpBarFill: THREE.Mesh;
    }
    const enemies: EnemyRaider[] = [];

    for (let e = 0; e < 7; e++) {
      const drone = new THREE.Group();
      // Faceted predator stealth hull (dark crimson gunmetal)
      const dHull = new THREE.Mesh(
        new THREE.OctahedronGeometry(2.2, 0),
        new THREE.MeshStandardMaterial({
          color: 0x881337,
          emissive: 0x4c0519,
          emissiveIntensity: 0.8,
          metalness: 0.9,
          roughness: 0.2,
        })
      );
      drone.add(dHull);

      // Glowing targeting sensor eye
      const eye = new THREE.Mesh(
        new THREE.SphereGeometry(0.5, 14, 14),
        new THREE.MeshBasicMaterial({ color: 0xff0033 })
      );
      eye.position.set(0, 0, -2.0);
      drone.add(eye);

      // Swept forward attack blades with crimson edge glows
      [-2.6, 2.6].forEach((wx) => {
        const wing = new THREE.Mesh(
          new THREE.BoxGeometry(3.8, 0.14, 1.8),
          new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.95, roughness: 0.15 })
        );
        wing.position.set(wx, 0, -0.4);
        wing.rotation.y = wx > 0 ? -0.25 : 0.25;
        drone.add(wing);

        // Wing plasma emitter
        const emitter = new THREE.Mesh(
          new THREE.CylinderGeometry(0.12, 0.12, 1.6, 8),
          new THREE.MeshBasicMaterial({ color: 0xff1744 })
        );
        emitter.rotation.x = Math.PI / 2;
        emitter.position.set(wx > 0 ? wx + 1.2 : wx - 1.2, -0.1, -1.2);
        drone.add(emitter);
      });

      // Twin red thruster cones
      [-0.8, 0.8].forEach((tx) => {
        const thruster = new THREE.Mesh(
          new THREE.ConeGeometry(0.35, 1.4, 12),
          new THREE.MeshBasicMaterial({ color: 0xff2200 })
        );
        thruster.rotation.x = -Math.PI / 2;
        thruster.position.set(tx, 0, 1.8);
        drone.add(thruster);
      });

      // Crimson combat beacon light on each enemy raider
      const redLight = new THREE.PointLight(0xff0033, 2.8, 35);
      redLight.position.set(0, 0, -1.0);
      drone.add(redLight);

      // 3D Floating Holographic Health Bar Bracket (Faces Camera)
      const hpBarGroup = new THREE.Group();
      hpBarGroup.position.set(0, 3.2, 0);

      const hpBg = new THREE.Mesh(
        new THREE.PlaneGeometry(3.6, 0.45),
        new THREE.MeshBasicMaterial({ color: 0x020617, side: THREE.DoubleSide })
      );
      hpBarGroup.add(hpBg);

      const hpFill = new THREE.Mesh(
        new THREE.PlaneGeometry(3.4, 0.32),
        new THREE.MeshBasicMaterial({ color: 0xef4444, side: THREE.DoubleSide })
      );
      hpFill.position.z = 0.02;
      hpBarGroup.add(hpFill);

      const diamondMarker = new THREE.Mesh(
        new THREE.RingGeometry(0.35, 0.55, 4),
        new THREE.MeshBasicMaterial({ color: 0xf43f5e, side: THREE.DoubleSide })
      );
      diamondMarker.position.y = 0.85;
      hpBarGroup.add(diamondMarker);

      drone.add(hpBarGroup);

      // Strategic forward spawn layout so hostile raiders are immediately visible and engaging
      if (e === 0) drone.position.set(-16, 2, -45);
      else if (e === 1) drone.position.set(16, -2, -55);
      else if (e === 2) drone.position.set(0, 6, -70);
      else {
        drone.position.set(
          (Math.random() - 0.5) * 140,
          (Math.random() - 0.5) * 40,
          -70 - Math.random() * 100
        );
      }
      scene.add(drone);
      enemies.push({
        mesh: drone,
        vel: new THREE.Vector3((Math.random() - 0.5) * 4, (Math.random() - 0.5) * 2, -5),
        hp: 70,
        maxHp: 70,
        fireCooldown: 1.5 + Math.random() * 2.0,
        alive: true,
        hpBarGroup,
        hpBarFill: hpFill,
      });
    }

    // ─── 8. Combat Projectiles, Missiles, & Explosions ───
    // Player Azure Plasma Lasers
    const lasers: { mesh: THREE.Mesh; vel: THREE.Vector3; life: number }[] = [];
    const laserGeo = new THREE.CylinderGeometry(0.16, 0.16, 4.6, 8);
    const laserMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });

    // Player Homing Missiles
    interface HomingMissile {
      mesh: THREE.Group;
      target: EnemyRaider;
      vel: THREE.Vector3;
      life: number;
    }
    const missilesInFlight: HomingMissile[] = [];

    // Enemy Crimson Plasma Lasers
    const enemyLasers: { mesh: THREE.Mesh; vel: THREE.Vector3; life: number }[] = [];
    const enemyLaserGeo = new THREE.CylinderGeometry(0.2, 0.2, 4.2, 8);
    const enemyLaserMat = new THREE.MeshBasicMaterial({ color: 0xff0044 });

    // Multi-particle Fireball Explosions
    const activeExplosions: { points: THREE.Points; vels: Float32Array; life: number; maxLife: number }[] = [];

    const spawnExplosion = (pos: THREE.Vector3) => {
      const pCount = 36;
      const pGeo = new THREE.BufferGeometry();
      const pPositions = new Float32Array(pCount * 3);
      const pVels = new Float32Array(pCount * 3);
      for (let i = 0; i < pCount; i++) {
        pPositions[i * 3] = pos.x;
        pPositions[i * 3 + 1] = pos.y;
        pPositions[i * 3 + 2] = pos.z;
        pVels[i * 3] = (Math.random() - 0.5) * 28;
        pVels[i * 3 + 1] = (Math.random() - 0.5) * 28;
        pVels[i * 3 + 2] = (Math.random() - 0.5) * 28;
      }
      pGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
      const pMat = new THREE.PointsMaterial({
        color: 0xff6600,
        size: 3.2,
        transparent: true,
        opacity: 0.95,
        blending: THREE.AdditiveBlending,
      });
      const pMesh = new THREE.Points(pGeo, pMat);
      scene.add(pMesh);
      activeExplosions.push({ points: pMesh, vels: pVels, life: 1.0, maxLife: 1.0 });

      // Salvage Cargo Container
      const crate = new THREE.Mesh(
        new THREE.BoxGeometry(1.4, 1.4, 1.4),
        new THREE.MeshStandardMaterial({
          color: 0xf59e0b,
          emissive: 0xd97706,
          emissiveIntensity: 0.7,
          metalness: 0.9,
        })
      );
      crate.position.copy(pos);
      scene.add(crate);
      salvageCrates.push({ mesh: crate, value: 250 });
    };

    // Salvage Crates
    const salvageCrates: { mesh: THREE.Mesh; value: number }[] = [];

    // ─── 9. Flight Controls & Combat Systems ───
    const vel = new THREE.Vector3(0, 0, -4.5);
    let localFaOff = true;
    let localKills = 0;
    let localShield = 100;
    let localHull = 100;
    let localMissiles = 6;
    let localCredits = 0;
    let shieldRechargeTimer = 0;

    const keys: Record<string, boolean> = {};
    const onKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      keys[k] = true;
      if (k === 'z') {
        localFaOff = !localFaOff;
        setFaOff(localFaOff);
        if (!isMuted) soundFx.playClick(1050);
      }
      if (k === 'v') {
        setViewMode((m) => (m === 'CHASE' ? 'COCKPIT' : 'CHASE'));
        if (!isMuted) soundFx.playClick(900);
      }
      if (k === ' ' || e.code === 'Space') firePlasmaCannons();
      if (k === 'm' || k === 'x') fireHomingMissile();
      if (k === 'r') pingEveRadar();
      if (k === 'c') cyclePowerPips();
      if (k === 'j') triggerHyperspaceWarp();
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keys[e.key.toLowerCase()] = false;
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    const firePlasmaCannons = () => {
      // Twin hyper-velocity plasma bolts from wing railguns
      [-2.5, 2.5].forEach((wx) => {
        const bolt = new THREE.Mesh(laserGeo, laserMat);
        bolt.rotation.x = Math.PI / 2;
        bolt.position.copy(ship.position).add(new THREE.Vector3(wx, -0.42, -2.8).applyQuaternion(ship.quaternion));
        const boltVel = new THREE.Vector3(0, 0, -75).applyQuaternion(ship.quaternion).add(vel);
        scene.add(bolt);
        lasers.push({ mesh: bolt, vel: boltVel, life: 1.8 });
      });
      if (!isMuted) soundFx.playClick(1300);
    };

    const fireHomingMissile = () => {
      if (localMissiles <= 0) return;
      // Find closest alive enemy
      let closest: EnemyRaider | null = null;
      let closestDist = 9999;
      enemies.forEach((e) => {
        if (e.alive) {
          const d = ship.position.distanceTo(e.mesh.position);
          if (d < closestDist) {
            closestDist = d;
            closest = e;
          }
        }
      });
      if (!closest) return;

      localMissiles -= 1;
      setMissiles(localMissiles);

      const mGroup = new THREE.Group();
      const mBody = new THREE.Mesh(
        new THREE.CylinderGeometry(0.22, 0.22, 2.4, 12),
        new THREE.MeshStandardMaterial({ color: 0xf1f5f9, metalness: 0.85 })
      );
      mBody.rotation.x = Math.PI / 2;
      mGroup.add(mBody);
      // Rocket exhaust flame
      const mFlame = new THREE.Mesh(
        new THREE.ConeGeometry(0.3, 1.2, 8),
        new THREE.MeshBasicMaterial({ color: 0xff5500 })
      );
      mFlame.rotation.x = -Math.PI / 2;
      mFlame.position.z = 1.4;
      mGroup.add(mFlame);

      mGroup.position.copy(ship.position).add(new THREE.Vector3(0, -0.8, -2.5).applyQuaternion(ship.quaternion));
      scene.add(mGroup);

      const mVel = new THREE.Vector3(0, 0, -35).applyQuaternion(ship.quaternion).add(vel);
      missilesInFlight.push({
        mesh: mGroup,
        target: closest,
        vel: mVel,
        life: 4.5,
      });

      if (!isMuted) soundFx.playReactorStart();
    };

    const pingEveRadar = () => {
      setRadarPingCount((c) => c + 1);
      if (!isMuted) soundFx.playTelemetryChirp();
    };

    const cyclePowerPips = () => {
      setPwrPips((p) => (p === 'WEP' ? 'SYS' : p === 'SYS' ? 'ENG' : 'WEP'));
      if (!isMuted) soundFx.playClick(850);
    };

    const triggerHyperspaceWarp = () => {
      vel.multiplyScalar(3.4);
      camera.fov = 88;
      camera.updateProjectionMatrix();
      if (!isMuted) soundFx.playReactorStart();
      setTimeout(() => {
        vel.multiplyScalar(0.29);
        camera.fov = 54;
        camera.updateProjectionMatrix();
      }, 1400);
    };

    // ─── 10. Animation & Render Loop ───
    let animId: number;
    let lastT = performance.now();

    const animate = (t: number) => {
      animId = requestAnimationFrame(animate);
      const dt = Math.min((t - lastT) / 1000, 0.1);
      lastT = t;

      const rotSpeed = 2.4;
      if (keys['a'] || keys['arrowleft']) ship.rotation.y += rotSpeed * dt;
      if (keys['d'] || keys['arrowright']) ship.rotation.y -= rotSpeed * dt;
      if (keys['w'] || keys['arrowup']) ship.rotation.x += rotSpeed * 0.7 * dt;
      if (keys['s'] || keys['arrowdown']) ship.rotation.x -= rotSpeed * 0.7 * dt;
      if (keys['q']) ship.rotation.z += rotSpeed * dt;
      if (keys['e']) ship.rotation.z -= rotSpeed * dt;

      // In Decoupled FA-OFF: Ship drifts along momentum vector independently from heading
      if (localFaOff) {
        ship.position.addScaledVector(vel, dt * 5.0);
      } else {
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(ship.quaternion);
        vel.lerp(forward.multiplyScalar(4.8), 0.08);
        ship.position.addScaledVector(vel, dt * 5.0);
      }
      setSpeedKms(Number((vel.length() * 0.8).toFixed(1)));

      // Dynamic Plume Pulsing and Throttle Scaling
      const pulseScale = 1.0 + Math.sin(t * 0.02) * 0.12;
      plumeL.scale.set(1.0, 1.0, pulseScale);
      plumeR.scale.set(1.0, 1.0, pulseScale);

      // Trailing ion sparks drifting back
      const posAttr = trailGeo.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < trailCount; i++) {
        let z = posAttr.getZ(i);
        z += dt * 35;
        if (z > 30) z = 4.5 + Math.random() * 2;
        posAttr.setZ(i, z);
      }
      posAttr.needsUpdate = true;

      // Update Enemy Raiders AI: aggressive flight pursuit, crimson lasers, and wave respawn
      let minDist = 9999;
      let aliveCount = 0;
      enemies.forEach((e) => {
        if (e.alive) {
          aliveCount++;
          // Face player
          e.mesh.lookAt(ship.position);

          // Update 3D holographic health bar bracket
          e.hpBarGroup.quaternion.copy(camera.quaternion);
          const hpRatio = Math.max(0.01, e.hp / e.maxHp);
          e.hpBarFill.scale.set(hpRatio, 1, 1);
          e.hpBarFill.position.x = -1.7 * (1 - hpRatio);

          const toPlayer = ship.position.clone().sub(e.mesh.position);
          let d = toPlayer.length();

          // Flight AI: Close distance aggressively, strafe when in close quarters
          const dir = toPlayer.clone().normalize();
          if (d > 40) {
            e.vel.lerp(dir.multiplyScalar(32.0), 0.08);
          } else {
            const flank = new THREE.Vector3(-dir.z, 0, dir.x).multiplyScalar(16.0);
            e.vel.lerp(flank, 0.08);
          }
          e.mesh.position.addScaledVector(e.vel, dt);

          // If raider drifts too far behind (>130m), tactical warp into player front arc
          if (d > 130) {
            const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(ship.quaternion);
            const sideOffset = new THREE.Vector3((Math.random() - 0.5) * 32, (Math.random() - 0.5) * 14, 0).applyQuaternion(ship.quaternion);
            e.mesh.position.copy(ship.position).addScaledVector(fwd, 40 + Math.random() * 25).add(sideOffset);
            e.vel.set(0, 0, 0);
            d = ship.position.distanceTo(e.mesh.position);
          }

          if (d < minDist) minDist = d;

          // Firing AI: Shoot crimson plasma laser towards player
          e.fireCooldown -= dt;
          if (e.fireCooldown <= 0 && d < 150) {
            e.fireCooldown = 2.0 + Math.random() * 1.0;
            const eBolt = new THREE.Mesh(enemyLaserGeo, enemyLaserMat);
            eBolt.rotation.x = Math.PI / 2;
            eBolt.position.copy(e.mesh.position);
            const currentDir = ship.position.clone().sub(e.mesh.position).normalize();
            const eBoltVel = currentDir.multiplyScalar(75);
            scene.add(eBolt);
            enemyLasers.push({ mesh: eBolt, vel: eBoltVel, life: 2.2 });
            if (!isMuted && d < 90) soundFx.playClick(600);
          }
        }
      });

      // Wave Respawn if all raiders in current fleet destroyed
      if (aliveCount === 0 && enemies.length > 0) {
        enemies.forEach((e, idx) => {
          e.alive = true;
          e.hp = e.maxHp;
          e.mesh.visible = true;
          const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(ship.quaternion);
          e.mesh.position.copy(ship.position).addScaledVector(fwd, 45 + idx * 12).add(
            new THREE.Vector3((Math.random() - 0.5) * 35, (Math.random() - 0.5) * 16, 0).applyQuaternion(ship.quaternion)
          );
        });
        if (!isMuted) soundFx.playVictory();
      }

      setNearestTargetDist(minDist < 9000 ? Math.round(minDist) : 0);

      // Deflector Shield Bubble Decay & Rotation
      if (shieldBubbleMat.opacity > 0) {
        shieldBubbleMat.opacity = Math.max(0, shieldBubbleMat.opacity - dt * 2.4);
      }
      shieldBubble.rotation.y += dt * 1.4;

      // Update Enemy Lasers & Hit Player Ship
      for (let i = enemyLasers.length - 1; i >= 0; i--) {
        const el = enemyLasers[i];
        el.life -= dt;
        el.mesh.position.addScaledVector(el.vel, dt);

        if (el.mesh.position.distanceTo(ship.position) < 4.2) {
          el.life = 0;
          if (localShield > 0) {
            localShield = Math.max(0, localShield - 14);
            setShield(Math.round(localShield));
            shieldBubbleMat.opacity = 0.7; // Flare holographic deflector bubble
            setDamageFlash('shield');
            setTimeout(() => setDamageFlash(null), 90);
            if (!isMuted) soundFx.playImpact();
          } else {
            localHull = Math.max(0, localHull - 16);
            setHull(Math.round(localHull));
            setDamageFlash('hull');
            setTimeout(() => setDamageFlash(null), 90);
            if (!isMuted) soundFx.playWarningAlarm();
          }
          shieldRechargeTimer = 4.0;
        }

        if (el.life <= 0) {
          scene.remove(el.mesh);
          enemyLasers.splice(i, 1);
        }
      }

      // Shield Passive Recharge after 4 seconds without hits
      if (shieldRechargeTimer > 0) {
        shieldRechargeTimer -= dt;
      } else if (localShield < 100) {
        localShield = Math.min(100, localShield + 15 * dt);
        setShield(Math.round(localShield));
      }

      // Update Homing Missiles
      for (let m = missilesInFlight.length - 1; m >= 0; m--) {
        const miss = missilesInFlight[m];
        miss.life -= dt;
        if (miss.target && miss.target.alive) {
          const steerDir = miss.target.mesh.position.clone().sub(miss.mesh.position).normalize();
          miss.vel.lerp(steerDir.multiplyScalar(85), 0.08);
          miss.mesh.lookAt(miss.target.mesh.position);
        }
        miss.mesh.position.addScaledVector(miss.vel, dt);

        if (miss.target && miss.target.alive && miss.mesh.position.distanceTo(miss.target.mesh.position) < 6.0) {
          miss.life = 0;
          miss.target.alive = false;
          miss.target.mesh.visible = false;
          spawnExplosion(miss.target.mesh.position);
          localKills += 1;
          setKills(localKills);
          onUpdateScores(15, localKills);
          if (!isMuted) soundFx.playImpact();
        }

        if (miss.life <= 0) {
          scene.remove(miss.mesh);
          missilesInFlight.splice(m, 1);
        }
      }

      // Update Player Lasers & Collisions
      for (let i = lasers.length - 1; i >= 0; i--) {
        const l = lasers[i];
        l.life -= dt;
        l.mesh.position.addScaledVector(l.vel, dt);

        enemies.forEach((enemy) => {
          if (enemy.alive && l.mesh.position.distanceTo(enemy.mesh.position) < 5.0) {
            enemy.hp -= 35;
            l.life = 0;
            if (enemy.hp <= 0) {
              enemy.alive = false;
              enemy.mesh.visible = false;
              spawnExplosion(enemy.mesh.position);
              localKills += 1;
              setKills(localKills);
              onUpdateScores(12, localKills);
            }
            if (!isMuted) soundFx.playImpact();
          }
        });

        if (l.life <= 0) {
          scene.remove(l.mesh);
          lasers.splice(i, 1);
        }
      }

      // Update Explosions
      for (let x = activeExplosions.length - 1; x >= 0; x--) {
        const exp = activeExplosions[x];
        exp.life -= dt;
        const posAttr = exp.points.geometry.attributes.position as THREE.BufferAttribute;
        for (let p = 0; p < 36; p++) {
          posAttr.setXYZ(
            p,
            posAttr.getX(p) + exp.vels[p * 3] * dt,
            posAttr.getY(p) + exp.vels[p * 3 + 1] * dt,
            posAttr.getZ(p) + exp.vels[p * 3 + 2] * dt
          );
        }
        posAttr.needsUpdate = true;
        (exp.points.material as THREE.PointsMaterial).opacity = exp.life / exp.maxLife;

        if (exp.life <= 0) {
          scene.remove(exp.points);
          activeExplosions.splice(x, 1);
        }
      }

      // Collect Salvage Crates
      for (let c = salvageCrates.length - 1; c >= 0; c--) {
        const crate = salvageCrates[c];
        crate.mesh.rotation.y += dt * 1.5;
        if (crate.mesh.position.distanceTo(ship.position) < 14) {
          localCredits += crate.value;
          setBountyCredits(localCredits);
          scene.remove(crate.mesh);
          salvageCrates.splice(c, 1);
          if (!isMuted) soundFx.playVictory();
        }
      }

      // Rotate Celestial bodies & Asteroids
      planetGroup.rotation.y += dt * 0.015;
      station.rotation.y += dt * 0.08;
      asteroidGroup.children.forEach((ast) => {
        ast.rotation.x += dt * 0.14;
        ast.rotation.y += dt * 0.11;
      });

      // Dynamic Camera: Smooth Chase Cam vs Immersive Cockpit Cam
      if (viewModeRef.current === 'COCKPIT') {
        const cockpitPos = ship.position.clone().add(new THREE.Vector3(0, 0.72, -1.8).applyQuaternion(ship.quaternion));
        camera.position.copy(cockpitPos);
        const forwardLook = ship.position.clone().add(new THREE.Vector3(0, 0.6, -40).applyQuaternion(ship.quaternion));
        camera.lookAt(forwardLook);
      } else {
        const camTarget = ship.position.clone().add(new THREE.Vector3(0, 4.4, 13.8).applyQuaternion(ship.quaternion));
        camera.position.lerp(camTarget, 0.15);
        camera.lookAt(ship.position.clone().add(new THREE.Vector3(0, 0.8, -8).applyQuaternion(ship.quaternion)));
      }

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(animate);

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('resize', handleResize);
      disposeThreeScene(renderer, scene, container);
    };
  }, [isMuted]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', backgroundColor: '#01020a' }}>
      <div ref={mountRef} style={{ width: '100%', height: '100%', backgroundColor: '#01020a' }} />

      {/* Damage Impact Flash Overlay */}
      {damageFlash && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            background: damageFlash === 'hull' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(56, 189, 248, 0.10)',
            boxShadow: damageFlash === 'hull' ? 'inset 0 0 55px rgba(220, 38, 38, 0.45)' : 'inset 0 0 55px rgba(2, 132, 199, 0.35)',
            zIndex: 10,
            transition: 'opacity 0.08s ease-out',
          }}
        />
      )}

      {/* Commander Tactical Avionics HUD */}
      <div
        style={{
          position: 'absolute',
          top: '16px',
          left: '20px',
          background: 'rgba(10, 15, 30, 0.88)',
          border: '1.5px solid #38bdf8',
          borderRadius: '12px',
          padding: '14px 22px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          boxShadow: '0 0 30px rgba(56, 189, 248, 0.25)',
          minWidth: '290px',
          backdropFilter: 'blur(8px)',
        }}
      >
        <div style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 900, letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Rocket size={13} color="#38bdf8" /> NASA LUNAR GATEWAY // PLANETARY DEFENSE INTERCEPTOR
        </div>

        {/* Shield Bar */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '3px' }}>
            <span style={{ color: '#38bdf8', fontWeight: 800 }}>DEFLECTOR SHIELD:</span>
            <span style={{ color: '#38bdf8', fontWeight: 900 }}>{shield}%</span>
          </div>
          <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ width: `${shield}%`, height: '100%', background: 'linear-gradient(90deg, #0284c7, #38bdf8)' }} />
          </div>
        </div>

        {/* Hull Integrity Bar */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '3px' }}>
            <span style={{ color: hull > 35 ? '#10b981' : '#ef4444', fontWeight: 800 }}>HULL INTEGRITY:</span>
            <span style={{ color: hull > 35 ? '#10b981' : '#ef4444', fontWeight: 900 }}>{hull}%</span>
          </div>
          <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ width: `${hull}%`, height: '100%', background: hull > 35 ? '#10b981' : '#ef4444' }} />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginTop: '4px' }}>
          <span style={{ color: '#94a3b8' }}>FLIGHT ASSIST [Z]:</span>
          <span style={{ color: faOff ? '#fbbf24' : '#10b981', fontWeight: 900 }}>
            {faOff ? 'FA-OFF (DECOUPLED 6-DOF)' : 'FA-ON (COUPLED)'}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
          <span style={{ color: '#94a3b8' }}>VECTOR VELOCITY:</span>
          <span style={{ color: '#38bdf8', fontWeight: 900 }}>{speedKms} KM/S</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
          <span style={{ color: '#94a3b8' }}>NEO ASTEROIDS INTERCEPTED:</span>
          <span style={{ color: '#f43f5e', fontWeight: 900 }}>💥 {kills} DEFLECTED</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
          <span style={{ color: '#94a3b8' }}>KINETIC MISSILES [M]:</span>
          <span style={{ color: missiles > 0 ? '#10b981' : '#ef4444', fontWeight: 900 }}>🚀 {missiles} ARMED</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
          <span style={{ color: '#94a3b8' }}>DEFENSE COMMENDATIONS:</span>
          <span style={{ color: '#fbbf24', fontWeight: 900 }}>💰 {bountyCredits} CR</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
          <span style={{ color: '#94a3b8' }}>NEAREST ASTEROID:</span>
          <span style={{ color: '#f59e0b', fontWeight: 900 }}>🎯 {nearestTargetDist} M</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
          <span style={{ color: '#94a3b8' }}>POWER PIPS [C]:</span>
          <span style={{ color: '#c084fc', fontWeight: 900 }}>PRIORITY: {pwrPips}</span>
        </div>

        <div style={{ marginTop: '8px', paddingTop: '6px', borderTop: '1px dashed rgba(56, 189, 248, 0.35)', display: 'flex', flexDirection: 'column', gap: '3px' }}>
          <div style={{ fontSize: '9px', color: '#cbd5e1', fontWeight: 800 }}>NASA PLANETARY DEFENSE (PDCO) DIRECTIVES:</div>
          <div style={{ fontSize: '10px', color: '#94a3b8' }}>• <strong>Target NEO</strong>: 2026-AP5 Potentially Hazardous Asteroid</div>
          <div style={{ fontSize: '10px', color: '#94a3b8' }}>• <strong>DART Interception</strong>: Fire Kinetic Missiles [M]</div>
          <div style={{ fontSize: '10px', color: '#94a3b8' }}>• <strong>Lunar Gateway Station</strong>: Maintain Docking Proximity</div>
          <div style={{ fontSize: '10px', color: '#94a3b8' }}>• <strong>Flight Assist</strong>: Decoupled 6-DOF Vector Drift [Z]</div>
        </div>
      </div>

      {/* Holographic Combat Crosshair Reticle with Lock-on Rings */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
          opacity: 0.9,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px',
        }}
      >
        <Crosshair size={44} color="#00f0ff" />
        <div style={{ fontSize: '9px', color: '#00f0ff', letterSpacing: '0.12em', fontWeight: 900 }}>
          NASA PDCO ASTEROID LOCK [{nearestTargetDist}M]
        </div>
      </div>

      {/* Bottom Commander Controls Toolbar */}
      <div
        style={{
          position: 'absolute',
          bottom: '16px',
          left: '20px',
          right: '20px',
          background: 'rgba(10, 15, 30, 0.88)',
          border: '1px solid rgba(56, 189, 248, 0.35)',
          borderRadius: '12px',
          padding: '10px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backdropFilter: 'blur(8px)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => {
              const e = new KeyboardEvent('keydown', { key: ' ' });
              window.dispatchEvent(e);
            }}
            style={{
              background: 'linear-gradient(135deg, #0284c7, #0369a1)',
              border: '1px solid #38bdf8',
              color: '#fff',
              padding: '6px 13px',
              borderRadius: '8px',
              fontSize: '11px',
              fontWeight: 900,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Zap size={13} /> FIRE CANNONS [SPACE]
          </button>
          <button
            onClick={() => {
              const e = new KeyboardEvent('keydown', { key: 'm' });
              window.dispatchEvent(e);
            }}
            style={{
              background: missiles > 0 ? 'linear-gradient(135deg, #dc2626, #b91c1c)' : 'rgba(100, 116, 139, 0.3)',
              border: '1px solid #f87171',
              color: '#fff',
              padding: '6px 13px',
              borderRadius: '8px',
              fontSize: '11px',
              fontWeight: 900,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Rocket size={13} /> HOMING MISSILE ({missiles}) [M]
          </button>
          <button
            onClick={() => {
              const e = new KeyboardEvent('keydown', { key: 'z' });
              window.dispatchEvent(e);
            }}
            style={{
              background: faOff ? 'linear-gradient(135deg, #d97706, #ea580c)' : 'linear-gradient(135deg, #059669, #10b981)',
              border: '1px solid #fbbf24',
              color: '#fff',
              padding: '6px 13px',
              borderRadius: '8px',
              fontSize: '11px',
              fontWeight: 900,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Compass size={13} /> {faOff ? 'FA-OFF (DECOUPLED)' : 'FA-ON'} [Z]
          </button>
          <button
            onClick={() => {
              const e = new KeyboardEvent('keydown', { key: 'v' });
              window.dispatchEvent(e);
            }}
            style={{
              background: 'linear-gradient(135deg, #4f46e5, #4338ca)',
              border: '1px solid #818cf8',
              color: '#fff',
              padding: '6px 13px',
              borderRadius: '8px',
              fontSize: '11px',
              fontWeight: 900,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Eye size={13} /> {viewMode === 'CHASE' ? 'COCKPIT VIEW' : 'CHASE VIEW'} [V]
          </button>
          <button
            onClick={() => {
              const e = new KeyboardEvent('keydown', { key: 'j' });
              window.dispatchEvent(e);
            }}
            style={{
              background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
              border: '1px solid #c084fc',
              color: '#fff',
              padding: '6px 13px',
              borderRadius: '8px',
              fontSize: '11px',
              fontWeight: 900,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Flame size={13} /> WARP JUMP [J]
          </button>
        </div>

        <button
          onClick={onBack}
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: '#cbd5e1',
            padding: '6px 14px',
            borderRadius: '8px',
            fontSize: '11px',
            fontWeight: 800,
            cursor: 'pointer',
          }}
        >
          ← BACK TO HUB
        </button>
      </div>
    </div>
  );
};
