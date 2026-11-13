import React, { useEffect, useRef, useState } from 'react';
import { soundFx } from '../utils/audioEffects';
import { getCurrentRank, getRankProgress } from '../data/astronautRanks';
import { getCadetProgression } from '../utils/simulationEngine';
import { MovableCharacter } from './MovableCharacter';
import { LobbyAstronaut3D } from './LobbyAstronaut3D';
import { ASTRONAUT_CHARACTERS } from '../data/astronautCharacters';
import { GuidedCadetJourney } from './GuidedCadetJourney';

import { spaceMusicEngine } from '../utils/spaceMusicEngine';
import { authService } from '../utils/authService';
import { studentActivityService } from '../utils/studentActivityService';
import type { User } from '../types/auth';

type LearningHubTab = 'NOTEBOOK' | 'AUDIO' | 'VIDEO' | 'COMIC' | 'BRIEFINGS' | 'CATALOG';

interface LandingPageProps {
  onEnter: () => void;
  onStartMission?: () => void;
  onContinueMission?: () => void;
  hasSavedGame?: boolean;
  savedGameSol?: number;
  savedGameDest?: string;
  onOpenAcademy?: () => void;
  onOpenTrainingCenter?: () => void;
  onOpenRover?: () => void;
  onOpenHowToPlay?: () => void;
  onOpenSettings?: () => void;
  onOpenScienceHub?: () => void;
  onOpenCredits?: () => void;
  onOpenComics?: () => void;
  onOpenLearningHub?: (tab: LearningHubTab) => void;
  onOpenDepot?: () => void;
  onOpenClassroom?: () => void;
  currentUser?: User | null;
  onUserUpdate?: (updatedUser: User) => void;
  onOpenAuth?: () => void;
  onOpenJudgePreview?: () => void;
  onOpenTelemetry?: () => void;
  onOpenCertificate?: () => void;
  isJudgeMode?: boolean;
  onOpenOrrery?: () => void;
  onOpenMarsEDL?: () => void;
  onOpenTeacherGradebook?: () => void;
  onOpenCharacterLocker?: () => void;
  onOpenLiveActivity?: () => void;
  onOpenMultiplayerLobby?: () => void;
  onOpenMoonbaseAlpha?: () => void;
  onOpenBlackHole?: () => void;
  onOpenExpedition?: () => void;
  onOpenCampaign?: () => void;
  onOpenSpaceGamesHub?: () => void;
  onOpenMarsSurvival?: () => void;
  onOpenHardcoreSurvival?: (missionId?: any) => void;
  onOpenFullExpedition?: () => void;
}

// ── Starfield Canvas ──────────────────────────────────────────────────────────
const StarfieldCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const stars: { x: number; y: number; r: number; opacity: number; speed: number; phase: number }[] = [];

    const init = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      stars.length = 0;
      const count = Math.floor((canvas.width * canvas.height) / 5000);
      for (let i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          r: Math.random() * 1.5 + 0.2,
          opacity: Math.random() * 0.7 + 0.2,
          speed: Math.random() * 0.004 + 0.001,
          phase: Math.random() * Math.PI * 2,
        });
      }
    };

    const draw = (t: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const s of stars) {
        const alpha = s.opacity * (0.5 + 0.5 * Math.sin(t * s.speed * 1000 + s.phase));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${alpha})`;
        ctx.fill();
      }
      animId = requestAnimationFrame(draw);
    };

    init();
    animId = requestAnimationFrame(draw);
    const onResize = () => init();
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="landing-starfield" />;
};

// ── Data ──────────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: '🎮',
    title: 'Outpost Command & Resource Management',
    desc: 'Run humanity’s permanent outpost on the Moon or Mars. Balance power grids, Sabatier life support, and crop biomes across 30 Sols of unforgiving space conditions.',
  },
  {
    icon: '🚜',
    title: 'Playable Rover Exploration',
    desc: 'Pilot the lunar terrain vehicle across crater rims. Navigate boulder fields, drill volatile ice cores in permanently shadowed regions, and beam data to base.',
  },
  {
    icon: '🔬',
    title: 'NASA Science & Transparent Scoring',
    desc: 'Every simulation constant and failure mode is mathematically grounded in official NASA BVAD life support and Kilopower engineering documents.',
  },
];

const STEPS = [
  { emoji: '🌍', title: '1. Select Mission', desc: 'Choose between Lunar Artemis Base Camp (Shackleton Crater) or Martian Ares Base (Jezero Crater).', color: '#a78bfa' },
  { emoji: '🏗️', title: '2. Outpost Construction', desc: 'Allocate a limited 45,000 kg cargo mass budget across habitat, nuclear Kilopower, and life support.', color: '#38bdf8' },
  { emoji: '⚡', title: '3. Survive Hard Decisions', desc: 'Manage daily shifts. Weather the 354-hour lunar night, solar particle storms, and cascading subsystem wear.', color: '#43ffa0' },
  { emoji: '🔬', title: '4. Rover EVA & Debrief', desc: 'Deploy the surface rover for ice core sampling, earn research points, and review your explainable AIB debrief.', color: '#f59e0b' },
];

export const LandingPage: React.FC<LandingPageProps> = ({
  onEnter,
  onStartMission,
  onContinueMission,
  hasSavedGame = false,
  savedGameSol = 1,
  savedGameDest = 'Moon',
  onOpenAcademy,
  onOpenTrainingCenter,
  onOpenRover,
  onOpenHowToPlay,
  onOpenSettings,
  onOpenScienceHub,
  onOpenCredits,
  onOpenComics,
  onOpenLearningHub,
  onOpenDepot,
  onOpenClassroom,
  currentUser,
  onOpenAuth,
  onOpenJudgePreview,
  onOpenTelemetry,
  onOpenCertificate,
  isJudgeMode = false,


  onOpenOrrery,
  onOpenMarsEDL,
  onOpenTeacherGradebook,
  onOpenCharacterLocker,
  onOpenLiveActivity,
  onOpenMultiplayerLobby,
  onOpenMoonbaseAlpha,
  onOpenBlackHole,
  onOpenExpedition,
  onOpenCampaign,
  onOpenSpaceGamesHub,
  onOpenMarsSurvival,
  onOpenHardcoreSurvival,
  onOpenFullExpedition,
  onUserUpdate,
}) => {
  // Active historical astronaut selected by cadet
  const activeAstronaut = ASTRONAUT_CHARACTERS.find((c) => c.id === currentUser?.selectedCharacterId) || ASTRONAUT_CHARACTERS[0];

  // Cinematic Astronaut Inspection Mode & Camera Dolly
  const [isInspectionMode, setIsInspectionMode] = useState(false);
  const [isMonitorPhotoView, setIsMonitorPhotoView] = useState(true);
  const [previewAstronautId, setPreviewAstronautId] = useState<string | null>(null);
  const [toastFeedback, setToastFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const inspectingAstronaut = ASTRONAUT_CHARACTERS.find((c) => c.id === (previewAstronautId || currentUser?.selectedCharacterId || 'neil_armstrong')) || ASTRONAUT_CHARACTERS[0];
  const unlockedIds = currentUser?.unlockedCharacterIds || ['neil_armstrong', 'kalpana_chawla'];
  const isSelectedActive = (currentUser?.selectedCharacterId || 'neil_armstrong') === inspectingAstronaut.id;
  const isSelectedUnlocked = unlockedIds.includes(inspectingAstronaut.id) || inspectingAstronaut.costCoins === 0;

  const showToast = (text: string, type: 'success' | 'error') => {
    setToastFeedback({ text, type });
    setTimeout(() => setToastFeedback(null), 3500);
  };

  const handleOpenInspection = (charId?: string) => {
    soundFx.playHydroPressureSwoosh();
    setPreviewAstronautId(charId || activeAstronaut.id);
    setIsInspectionMode(true);
  };

  const handleCloseInspection = () => {
    soundFx.playHydroPressureSwoosh();
    setIsInspectionMode(false);
  };

  const handleEquipAstronaut = (char: typeof ASTRONAUT_CHARACTERS[0]) => {
    if (!currentUser) {
      soundFx.playClick(900);
      showToast(`🧑‍🚀 Previewing ${char.name}. Sign in at top-right to save to cadet dossier!`, 'success');
      return;
    }
    const res = authService.selectCharacter(currentUser.id, char.id, char.avatar);
    if (res.success && res.user) {
      soundFx.playClick(950);
      if (onUserUpdate) onUserUpdate(res.user);
      showToast(`🧑‍🚀 ${char.name.toUpperCase()} is now your Active Flight Astronaut!`, 'success');
    }
  };

  const handleUnlockAstronaut = (char: typeof ASTRONAUT_CHARACTERS[0]) => {
    if (!currentUser) {
      soundFx.playAlarm();
      showToast('Cadet Profile required to unlock with coins. Sign in at top-right!', 'error');
      return;
    }
    const userCoins = currentUser.coins ?? 500;
    if (userCoins < char.costCoins) {
      soundFx.playAlarm();
      showToast(`Insufficient Coins! Need ${char.costCoins - userCoins} more Coins. Complete missions to earn!`, 'error');
      return;
    }
    const res = authService.unlockCharacter(currentUser.id, char.id, char.costCoins);
    if (res.success && res.user) {
      soundFx.playVictory();
      if (onUserUpdate) onUserUpdate(res.user);
      studentActivityService.logActivity({
        studentUsername: res.user.username,
        studentFullName: res.user.fullName || res.user.username,
        studentAvatar: char.avatar,
        characterName: char.name,
        actionType: 'CHARACTER_UNLOCKED',
        missionTitle: `Unlocked Historic Astronaut: ${char.name}`,
        destination: 'CAMPUS',
        durationSeconds: 0,
        scoreXp: 50,
        coinsEarned: 0,
        outcomeStatus: 'UNLOCKED',
        notes: `Equipped ${char.specialPerk.name} (${char.specialPerk.statBonus}).`,
      });
      showToast(`🎉 Successfully unlocked ${char.name}! Perk: ${char.specialPerk.statBonus}`, 'success');
    } else {
      showToast(res.error || 'Failed to unlock astronaut.', 'error');
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isInspectionMode) {
        handleCloseInspection();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isInspectionMode]);

  // Global first-interaction unlock for Web Audio policy and ambient space music
  useEffect(() => {
    const handleFirstInteraction = () => {
      soundFx.unlock();
      if (!spaceMusicEngine.getIsPlaying() && !spaceMusicEngine.getIsMuted()) {
        spaceMusicEngine.start();
      }
    };
    window.addEventListener('pointerdown', handleFirstInteraction, { once: true });
    window.addEventListener('keydown', handleFirstInteraction, { once: true });
    window.addEventListener('touchstart', handleFirstInteraction, { once: true });
    return () => {
      window.removeEventListener('pointerdown', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
    };
  }, []);

  const [warping, setWarping] = useState(false);
  const [hangarAsset, setHangarAsset] = useState<'ASTRONAUT' | 'ROVER' | 'SPACECRAFT' | 'OUTPOST'>('ASTRONAUT');
  const [selectedMatchMode, setSelectedMatchMode] = useState<'FULL_EXPEDITION' | 'SPACE_GAMES' | 'HARDCORE_SURVIVAL' | 'MARS_SURVIVAL' | 'EARTH_TO_MOON' | 'SOL1_SURVIVAL' | 'NEW_CAMPAIGN' | 'MOONBASE_ALPHA' | 'BLACK_HOLE' | 'JUDGE_DEMO' | 'MARS_EDL'>('FULL_EXPEDITION');
  const [showModeDropdown, setShowModeDropdown] = useState(false);
  const [showIntelDossier, setShowIntelDossier] = useState(false);
  const [isSimsHubOpen, setIsSimsHubOpen] = useState(false);
  const [isAcademyHubOpen, setIsAcademyHubOpen] = useState(false);
  const [isCrewHubOpen, setIsCrewHubOpen] = useState(false);
  const [audioMuted, setAudioMuted] = useState(false);
  const [musicMuted, setMusicMuted] = useState(() => spaceMusicEngine.getIsMuted());

  // Modern UI specific state matching monitor screenshot
  const [selectedCharIndex, setSelectedCharIndex] = useState(0);
  const [selectedSuitOption, setSelectedSuitOption] = useState<'EMU' | 'ARTEMIS' | 'ACES'>('EMU');
  const [isCadetJourneyOpen, setIsCadetJourneyOpen] = useState(true);
  const [activeNavTab, setActiveNavTab] = useState<'LOBBY' | 'ACADEMY' | 'SUIT_DEPOT' | 'LEADERBOARD' | 'STORY'>('LOBBY');

  const AVAILABLE_MODES: {
    id: typeof selectedMatchMode;
    title: string;
    sub: string;
    badge: string;
  }[] = [
    { id: 'FULL_EXPEDITION', title: 'SURVIVAL MISSIONS', sub: '(4 OPS)', badge: '4 OPS MANUAL' },
    { id: 'HARDCORE_SURVIVAL', title: 'HARDCORE SURVIVAL', sub: '(5 OPS)', badge: '5 OPS ORBITAL' },
    { id: 'MARS_SURVIVAL', title: 'MARS SURVIVAL', sub: '(4 OPS)', badge: '4 OPS MARS' },
    { id: 'SPACE_GAMES', title: 'SPACE GAMES ARCADE', sub: '(3 TIERS)', badge: 'ARCADE SUITE' },
    { id: 'EARTH_TO_MOON', title: 'EARTH TO MOON', sub: '(LEVEL 5)', badge: 'LUNAR FLIGHT' },
    { id: 'NEW_CAMPAIGN', title: 'NASA MISSIONS', sub: '(76 OPS)', badge: 'HISTORIC OPS' },
    { id: 'MOONBASE_ALPHA', title: 'MOONBASE ALPHA', sub: '(3D EVA)', badge: 'LUNAR OUTPOST' },
    { id: 'BLACK_HOLE', title: 'RELATIVITY LAB', sub: '(KERR BH)', badge: 'PHYSICS LAB' },
  ];

  const currentModeConfig = AVAILABLE_MODES.find((m) => m.id === selectedMatchMode) || AVAILABLE_MODES[0];

  const handleCycleMode = (e: React.MouseEvent) => {
    e.stopPropagation();
    soundFx.playClick(880);
    const currIdx = AVAILABLE_MODES.findIndex((m) => m.id === selectedMatchMode);
    const nextIdx = (currIdx + 1) % AVAILABLE_MODES.length;
    setSelectedMatchMode(AVAILABLE_MODES[nextIdx].id);
  };

  const handlePrevAstronaut = (e: React.MouseEvent) => {
    e.stopPropagation();
    soundFx.playClick(850);
    const nextIdx = (selectedCharIndex - 1 + ASTRONAUT_CHARACTERS.length) % ASTRONAUT_CHARACTERS.length;
    setSelectedCharIndex(nextIdx);
    setPreviewAstronautId(ASTRONAUT_CHARACTERS[nextIdx].id);
    if (ASTRONAUT_CHARACTERS[nextIdx].id === 'kalpana_chawla') {
      setSelectedSuitOption('ACES');
    } else {
      setSelectedSuitOption(nextIdx % 2 === 0 ? 'EMU' : 'ARTEMIS');
    }
  };

  const handleNextAstronaut = (e: React.MouseEvent) => {
    e.stopPropagation();
    soundFx.playClick(900);
    const nextIdx = (selectedCharIndex + 1) % ASTRONAUT_CHARACTERS.length;
    setSelectedCharIndex(nextIdx);
    setPreviewAstronautId(ASTRONAUT_CHARACTERS[nextIdx].id);
    if (ASTRONAUT_CHARACTERS[nextIdx].id === 'kalpana_chawla') {
      setSelectedSuitOption('ACES');
    } else {
      setSelectedSuitOption(nextIdx % 2 === 0 ? 'EMU' : 'ARTEMIS');
    }
  };

  const [cadetProg] = useState(() => getCadetProgression());
  const rankInfo = getRankProgress(cadetProg.xp);

  const handleStart = () => {
    soundFx.playReactorStart();
    setWarping(true);
    setTimeout(() => {
      setWarping(false);
      if (selectedMatchMode === 'FULL_EXPEDITION' && onOpenFullExpedition) {
        onOpenFullExpedition();
      } else if (selectedMatchMode === 'HARDCORE_SURVIVAL' && onOpenHardcoreSurvival) {
        onOpenHardcoreSurvival();
      } else if (selectedMatchMode === 'MARS_SURVIVAL' && onOpenMarsSurvival) {
        onOpenMarsSurvival();
      } else if (selectedMatchMode === 'SPACE_GAMES' && onOpenSpaceGamesHub) {
        onOpenSpaceGamesHub();
      } else if (selectedMatchMode === 'EARTH_TO_MOON' && onOpenExpedition) {
        onOpenExpedition();
      } else if (selectedMatchMode === 'NEW_CAMPAIGN') {
        if (onOpenCampaign) {
          onOpenCampaign();
        } else if (onStartMission) {
          onStartMission();
        }
      } else if (selectedMatchMode === 'MOONBASE_ALPHA' && onOpenMoonbaseAlpha) {
        onOpenMoonbaseAlpha();
      } else if (selectedMatchMode === 'BLACK_HOLE' && onOpenBlackHole) {
        onOpenBlackHole();
      } else if (selectedMatchMode === 'JUDGE_DEMO' && onOpenJudgePreview) {
        onOpenJudgePreview();
      } else if (selectedMatchMode === 'MARS_EDL' && onOpenMarsEDL) {
        onOpenMarsEDL();
      } else if (hasSavedGame && onContinueMission) {
        onContinueMission();
      } else if (onStartMission) {
        onStartMission();
      } else {
        onEnter();
      }
    }, 500);
  };

  const handleNavClick = (callback?: () => void, sound: 'click' | 'chirp' | 'reactor' = 'click') => {
    if (!callback) return;
    if (sound === 'chirp') soundFx.playTelemetryChirp();
    else if (sound === 'reactor') soundFx.playReactorStart();
    else soundFx.playClick(800);
    callback();
  };

  const lobbyViewport = (
    <div className="pubg-lobby-viewport" id="astro-camp-landing">
      {/* GPU Accelerated Cinematic Background Layer with Dolly Zoom */}
      <div className={`pubg-lobby-bg-layer ${isInspectionMode ? 'inspection-active' : ''}`} />
      <StarfieldCanvas />
      <div className="tactical-grid-overlay" />
      <div className="tactical-vignette" />

      {/* Military Corner Brackets */}
      <div className="tactical-bracket-tl" />
      <div className="tactical-bracket-tr" />
      <div className="tactical-bracket-bl" />
      <div className="tactical-bracket-br" />

      {warping && <div className="landing-warp-overlay" />}

      {/* Real-time Feedback Toast for Inspection / Equip */}
      {toastFeedback && (
        <div
          style={{
            position: 'fixed',
            top: '75px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 100000,
            background: toastFeedback.type === 'success' ? 'rgba(16, 185, 129, 0.95)' : 'rgba(239, 68, 68, 0.95)',
            color: '#ffffff',
            padding: '10px 24px',
            borderRadius: '8px',
            fontFamily: 'var(--font-mono)',
            fontSize: '13px',
            fontWeight: 800,
            boxShadow: '0 8px 25px rgba(0,0,0,0.8)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            animation: 'fadeInDown 0.3s ease',
          }}
        >
          <span>{toastFeedback.type === 'success' ? '🚀' : '⚠️'}</span>
          <span>{toastFeedback.text}</span>
        </div>
      )}

      {/* Top Inspection Mode Header Bar */}
      {isInspectionMode && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '68px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 32px',
            background: 'linear-gradient(180deg, rgba(7, 9, 14, 0.96) 0%, rgba(7, 9, 14, 0.5) 80%, transparent 100%)',
            zIndex: 60,
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid rgba(0, 210, 255, 0.25)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'rgba(0, 210, 255, 0.15)', border: '1px solid #00d2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', boxShadow: '0 0 15px rgba(0, 210, 255, 0.3)' }}>
              🛰️
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 900, color: '#f8fafc', fontFamily: 'var(--font-space)', letterSpacing: '0.08em' }}>
                HANGAR BAY 04 · CREW INSPECTION PEDESTAL
              </div>
              <div style={{ fontSize: '10px', color: '#ff9e1b', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>● RAY-TRACED SPECULAR PEDESTAL</span>
                <span>•</span>
                <span style={{ color: '#00d2ff' }}>NASA EMU SUIT TELEMETRY</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div className="tactical-badge-pill" style={{ color: '#fcd34d', borderColor: 'rgba(245, 158, 11, 0.35)', background: 'rgba(15, 23, 42, 0.8)' }}>
              <span>🪙 {(currentUser?.coins ?? 500).toLocaleString()} COINS</span>
            </div>
            <button
              className="inspection-back-btn"
              onClick={handleCloseInspection}
              id="btn-back-lobby-esc"
              title="Return to Main Lobby (Press ESC)"
            >
              <span>✕</span>
              <span>BACK TO LOBBY [ESC]</span>
            </button>
          </div>
        </div>
      )}

      {/* ── TOP MODERN SCI-FI STATUS BAR (SCREENSHOT MATCH) ── */}
      <header
        className="lobby-hud-topbar"
        style={{
          opacity: isInspectionMode ? 0 : 1,
          pointerEvents: isInspectionMode ? 'none' : 'auto',
          transition: 'all 0.4s ease',
        }}
      >
        {/* Left: Player Profile Card */}
        <div
          className="lobby-profile-card"
          onClick={() => handleNavClick(onOpenAuth || onOpenAcademy)}
          title="Manage Callsign, Security Level & Credentials"
        >
          <div className="lobby-profile-avatar-box">
            <span>{currentUser?.avatar || '👨‍🚀'}</span>
          </div>
          <div>
            <div className="lobby-profile-name">
              <span>{currentUser ? `@${currentUser.username}` : '@CadetArtemis'}</span>
              <span className="lobby-profile-lvl">[LVL {rankInfo.currentRank.level || 1}]</span>
            </div>
            <div className="lobby-profile-bar">
              <div
                className="lobby-profile-bar-fill"
                style={{
                  width: `${Math.min(100, Math.max(20, (cadetProg.xp / (rankInfo.nextRank?.minXp || 500)) * 100))}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Center: Glowing Navigation Pill Tabs */}
        <nav className="lobby-nav-pills">
          <button
            className={`lobby-nav-pill-btn ${activeNavTab === 'LOBBY' ? 'active' : ''}`}
            onClick={() => {
              setActiveNavTab('LOBBY');
              soundFx.playClick(800);
            }}
          >
            LOBBY
          </button>
          <button
            className="lobby-nav-pill-btn"
            onClick={() => handleNavClick(onOpenTrainingCenter || onOpenAcademy, 'chirp')}
          >
            ACADEMY
          </button>
          <button
            className="lobby-nav-pill-btn"
            onClick={() => handleNavClick(onOpenDepot, 'chirp')}
          >
            SUIT DEPOT
          </button>
          <button
            className="lobby-nav-pill-btn"
            onClick={() => handleNavClick(onOpenTeacherGradebook, 'chirp')}
          >
            LEADERBOARD
          </button>
          <button
            className="lobby-nav-pill-btn"
            onClick={() => handleNavClick(onOpenCampaign || onOpenComics, 'chirp')}
          >
            STORY
          </button>
        </nav>

        {/* Right: Status Indicators & Quick Actions */}
        <div className="lobby-top-right-group">
          <div className="lobby-stat-badge">
            <span style={{ color: '#10b981' }}>⚡ 100% FUEL</span>
            <span style={{ color: '#00d2ff' }}>🔋 850L</span>
          </div>

          <button
            className="lobby-currency-pill"
            onClick={() => handleNavClick(onOpenCharacterLocker || onOpenDepot)}
            title="Cadet In-Game Currency"
          >
            <span style={{ fontSize: '13px' }}>🍁</span>
            <span style={{ color: '#fcd34d', fontWeight: 800 }}>
              {(currentUser?.coins ?? 2820).toLocaleString()}
            </span>
          </button>

          {onOpenMultiplayerLobby && (
            <button
              className="lobby-icon-square-btn"
              onClick={() => handleNavClick(onOpenMultiplayerLobby, 'chirp')}
              title="Multiplayer Crew (+)"
            >
              <span>👤+</span>
            </button>
          )}

          <button
            className="lobby-icon-square-btn"
            onClick={() => {
              const muted = spaceMusicEngine.toggleMute();
              setMusicMuted(muted);
              soundFx.playClick(850);
            }}
            title={musicMuted ? 'Turn Sound ON' : 'Turn Sound OFF'}
          >
            <span>{musicMuted ? '🔇' : '🔊'}</span>
          </button>

          {onOpenSettings && (
            <button
              className="lobby-icon-square-btn"
              onClick={() => handleNavClick(onOpenSettings, 'chirp')}
              title="Game Settings"
            >
              <span>⚙️</span>
            </button>
          )}

          {/* PC Monitor Photo Frame View Toggle (Matches Reference Photo on PC Monitor) */}
          <button
            className="lobby-icon-square-btn"
            onClick={() => {
              setIsMonitorPhotoView(!isMonitorPhotoView);
              soundFx.playClick(900);
            }}
            style={{
              width: 'auto',
              padding: '0 10px',
              gap: '6px',
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              fontWeight: 800,
              borderColor: isMonitorPhotoView ? '#00d2ff' : 'rgba(255, 255, 255, 0.18)',
              color: isMonitorPhotoView ? '#00d2ff' : '#cbd5e1',
              background: isMonitorPhotoView ? 'rgba(0, 210, 255, 0.15)' : 'rgba(10, 16, 28, 0.82)',
            }}
            title={
              isMonitorPhotoView
                ? 'Switch to Clean Fullscreen View'
                : 'Switch to Authentic PC Monitor Photo View (matches user reference photo)'
            }
          >
            <span>{isMonitorPhotoView ? '⛶' : '🖥️'}</span>
            <span>{isMonitorPhotoView ? 'FULLSCREEN' : 'MONITOR VIEW'}</span>
          </button>
        </div>
      </header>

      {/* ── PANORAMIC GAME LOBBY ARENA ── */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'relative',
          width: '100%',
          minHeight: 0,
          overflow: 'hidden',
        }}
      >
        {/* ── LEFT PANEL: HUD BLOCKS (SEMI-TRANSPARENT BLUE) ── */}
        <div
          className="lobby-left-column"
          style={{
            opacity: isInspectionMode ? 0 : 1,
            pointerEvents: isInspectionMode ? 'none' : 'auto',
            transform: isInspectionMode ? 'translateX(-30px)' : 'none',
            transition: 'all 0.45s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {/* Top Block: CADET JOURNEY (80% Complete) */}
          <div className="lobby-hud-card">
            <div
              className="lobby-hud-card-header"
              onClick={() => {
                setIsCadetJourneyOpen(!isCadetJourneyOpen);
                soundFx.playClick(800);
              }}
              title="Toggle Cadet Journey Checklist"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#f97316', fontSize: '12px' }}>●</span>
                <span>CADET JOURNEY (80% Complete)</span>
              </div>
              <span style={{ color: '#94a3b8', fontSize: '11px' }}>{isCadetJourneyOpen ? '▲' : '▼'}</span>
            </div>

            {isCadetJourneyOpen && (
              <div style={{ marginTop: '10px' }}>
                <div style={{ fontSize: '10px', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
                  Current Objective:
                </div>
                <div
                  style={{
                    fontSize: '12px',
                    fontWeight: 800,
                    color: '#f8fafc',
                    fontFamily: 'var(--font-space)',
                    marginTop: '2px',
                  }}
                >
                  Step 4 - Moonquake Lab
                </div>

                <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div
                    className="lobby-hud-step-item"
                    onClick={() => (onOpenClassroom || onOpenAcademy)?.()}
                    title="Open Step 1 Ground School"
                  >
                    <span style={{ color: '#10b981', fontWeight: 900 }}>✓</span>
                    <span>Step 1 - Moonquake</span>
                  </div>
                  <div
                    className="lobby-hud-step-item"
                    onClick={() => (onOpenDepot || onOpenTrainingCenter)?.()}
                    title="Open Step 2 Training Center"
                  >
                    <span style={{ color: '#10b981', fontWeight: 900 }}>✓</span>
                    <span>Step 2 - Moonquake Lab</span>
                  </div>
                  <div
                    className="lobby-hud-step-item"
                    onClick={() => onOpenExpedition?.()}
                    title="Open Step 3 Lunar Expedition"
                  >
                    <span style={{ color: '#10b981', fontWeight: 900 }}>✓</span>
                    <span>Step 3 - Moonquake Lab</span>
                  </div>
                  <div
                    className="lobby-hud-step-item"
                    onClick={() => onOpenRover?.()}
                    title="Open Step 4 Moonquake Lab & Rover"
                  >
                    <span style={{ color: '#10b981', fontWeight: 900 }}>✓</span>
                    <span style={{ fontWeight: 800, color: '#38bdf8' }}>Step 4 - Moonquake Lab</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Lower Block: SURVIVAL EXPEDITIONS (MANUAL MISSIONS) */}
          <div className="lobby-hud-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ color: '#f97316', fontSize: '12px' }}>●</span>
              <div>
                <div
                  style={{
                    fontFamily: 'var(--font-space)',
                    fontWeight: 800,
                    fontSize: '11px',
                    color: '#f8fafc',
                    letterSpacing: '0.04em',
                  }}
                >
                  SURVIVAL EXPEDITIONS
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: '#94a3b8' }}>
                  (MANUAL MISSIONS)
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div
                className={`lobby-hud-expedition-item ${selectedMatchMode === 'FULL_EXPEDITION' ? 'active' : ''}`}
                onClick={() => {
                  setSelectedMatchMode('FULL_EXPEDITION');
                  soundFx.playClick(850);
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: '#10b981', fontWeight: 900 }}>✓</span>
                  <span style={{ fontSize: '11px', color: '#e2e8f0', fontFamily: 'var(--font-space)', fontWeight: 700 }}>
                    Sub-Orbital
                  </span>
                </div>
                <span style={{ fontSize: '9px', color: '#38bdf8', fontFamily: 'var(--font-mono)', fontWeight: 800 }}>
                  STATUS
                </span>
              </div>

              <div
                className={`lobby-hud-expedition-item ${selectedMatchMode === 'HARDCORE_SURVIVAL' ? 'active' : ''}`}
                onClick={() => {
                  setSelectedMatchMode('HARDCORE_SURVIVAL');
                  soundFx.playClick(850);
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: '#10b981', fontWeight: 900 }}>✓</span>
                  <span style={{ fontSize: '11px', color: '#e2e8f0', fontFamily: 'var(--font-space)', fontWeight: 700 }}>
                    Sub-Orbital
                  </span>
                </div>
                <span style={{ fontSize: '9px', color: '#38bdf8', fontFamily: 'var(--font-mono)', fontWeight: 800 }}>
                  STATUS
                </span>
              </div>

              <div
                className={`lobby-hud-expedition-item ${selectedMatchMode === 'MARS_SURVIVAL' ? 'active' : ''}`}
                onClick={() => {
                  setSelectedMatchMode('MARS_SURVIVAL');
                  soundFx.playClick(850);
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: '#00d2ff', fontSize: '12px' }}>●</span>
                  <span style={{ fontSize: '11px', color: '#38bdf8', fontFamily: 'var(--font-space)', fontWeight: 800 }}>
                    Mars Voyager
                  </span>
                </div>
                <span style={{ fontSize: '9px', color: '#10b981', fontFamily: 'var(--font-mono)', fontWeight: 800 }}>
                  ACTIVE
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── VERY BOTTOM LEFT: HOUSTON CAPCON DIRECTIVE TICKER ── */}
        <div
          className="lobby-houston-ticker"
          style={{
            opacity: isInspectionMode ? 0 : 1,
            pointerEvents: isInspectionMode ? 'none' : 'auto',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#f97316', fontSize: '11px' }}>●</span>
            <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: '#ff9e1b', fontWeight: 900 }}>
              HOUSTON CAPCON DIRECTIVE:
            </span>
            <span style={{ fontSize: '10.5px', color: '#cbd5e1' }}>
              Artemis III active at Shackleton Rim. Maintain Kilopower grid.
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '9.5px',
              color: '#38bdf8',
              fontFamily: 'var(--font-mono)',
              whiteSpace: 'nowrap',
            }}
          >
            <span>• Sol: 0.15</span>
            <span>• RAD: 550%</span>
            <span>• G-Force: 6.27%</span>
            <span>• RAD: 0.20V</span>
          </div>
        </div>

        {/* ── 3D ANIMATED ASTRONAUT IN SPACE HANGAR (EXACT 65% HORIZONTAL ALIGNMENT MATCHING PHOTO) ── */}
        <div
          style={{
            position: 'absolute',
            left: isInspectionMode ? '50%' : '65%',
            top: 0,
            bottom: isInspectionMode ? 0 : '72px',
            transform: 'translateX(-50%)',
            width: isInspectionMode ? '100%' : '560px',
            height: isInspectionMode ? '100%' : 'calc(100% - 72px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 15,
            pointerEvents: 'auto',
            transition: 'left 0.45s cubic-bezier(0.16, 1, 0.3, 1), width 0.45s ease',
          }}
        >
          <LobbyAstronaut3D
            characterId={inspectingAstronaut.id}
            astronautName={inspectingAstronaut.name}
            currentSuit={selectedSuitOption}
            isInspectionMode={isInspectionMode}
            hideOverlays={true}
            onInteract={() => {
              if (!isInspectionMode) {
                handleOpenInspection(inspectingAstronaut.id);
              }
            }}
            onSuitChange={(s) => setSelectedSuitOption(s)}
          />
        </div>

        {/* ── CENTER-BOTTOM: SELECTION CAPSULE READ-OUT & VITALS ── */}
        <div
          className="lobby-center-bottom"
          style={{
            opacity: isInspectionMode ? 0 : 1,
            pointerEvents: isInspectionMode ? 'none' : 'auto',
          }}
        >
          {/* Top Vitals Pill */}
          <div className="lobby-vitals-pill">
            <span style={{ color: '#00d2ff' }}>💧 Oxygen 100%</span>
            <span style={{ color: '#f59e0b' }}>☢️ RAD 1.00%</span>
            <span style={{ color: '#ef4444' }}>❤️ RAD: 0.12%</span>
          </div>

          {/* Selection Capsule Read-Out */}
          <div className="lobby-astronaut-capsule">
            <button
              className="lobby-capsule-arrow"
              onClick={handlePrevAstronaut}
              title="Previous Astronaut / Suit"
            >
              ◄
            </button>
            <div
              className="lobby-capsule-name"
              onClick={() => handleOpenInspection(inspectingAstronaut.id)}
              title="Click to Inspect Flight Gear"
            >
              {inspectingAstronaut.name.toUpperCase()} /{' '}
              {selectedSuitOption === 'EMU'
                ? 'xEMU ARTEMIS'
                : selectedSuitOption === 'ARTEMIS'
                ? 'APOLLO 11 HD'
                : 'ACES ORANGE'}
            </div>
            <button
              className="lobby-capsule-arrow"
              onClick={handleNextAstronaut}
              title="Next Astronaut / Suit"
            >
              ►
            </button>
          </div>

          <div className="lobby-drag-hint">
            DRAG 360° TO INSPECT GEAR
          </div>
        </div>

        {/* ── RIGHT PANEL: HIGH-TECH STACKED BUTTONS + MODE SELECTOR + LAUNCH ── */}
        <div
          className="lobby-right-column"
          style={{
            opacity: isInspectionMode ? 0 : 1,
            pointerEvents: isInspectionMode ? 'none' : 'auto',
            transform: isInspectionMode ? 'translateX(30px)' : 'none',
            transition: 'all 0.45s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {/* High-Tech Stacked Pills */}
          <div className="lobby-right-stacked-pills">
            <button
              className="lobby-action-pill-btn"
              onClick={() => handleNavClick(onOpenCampaign, 'reactor')}
              title="Browse all 78 Active NASA Flight Missions"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#00d2ff' }}>●</span>
                <span>MISSIONS ACTIVE (78)</span>
              </div>
              <span style={{ fontSize: '13px' }}>🎯</span>
            </button>

            <div style={{ position: 'relative', width: '100%' }}>
              <button
                className="lobby-action-pill-btn"
                onClick={() => {
                  setIsSimsHubOpen(!isSimsHubOpen);
                  soundFx.playClick(800);
                }}
                title="Open 3D Planetary Simulation Labs"
                style={{ borderColor: isSimsHubOpen ? '#a855f7' : undefined }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#a855f7' }}>●</span>
                  <span>SIMULATION LABS</span>
                </div>
                <span style={{ fontSize: '13px' }}>🧪</span>
              </button>

              {/* Flyout menu if opened */}
              {isSimsHubOpen && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: '100%',
                    right: 0,
                    marginBottom: '8px',
                    background: 'rgba(10, 15, 26, 0.96)',
                    border: '1px solid rgba(168, 85, 247, 0.5)',
                    borderRadius: '12px',
                    padding: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    minWidth: '280px',
                    backdropFilter: 'blur(20px)',
                    boxShadow: '0 16px 40px rgba(0,0,0,0.9), 0 0 30px rgba(168, 85, 247, 0.35)',
                    zIndex: 100,
                  }}
                >
                  <div
                    style={{
                      fontSize: '10px',
                      fontFamily: 'var(--font-mono)',
                      color: '#c084fc',
                      fontWeight: 800,
                      display: 'flex',
                      justifyContent: 'space-between',
                      paddingBottom: '4px',
                      borderBottom: '1px solid rgba(168, 85, 247, 0.2)',
                    }}
                  >
                    <span>✦ 3D SIMULATION LABS</span>
                    <span
                      style={{ cursor: 'pointer', color: '#94a3b8' }}
                      onClick={() => setIsSimsHubOpen(false)}
                    >
                      ✕
                    </span>
                  </div>
                  {onOpenHardcoreSurvival && (
                    <button
                      className="pubg-hub-subitem"
                      onClick={() => {
                        setIsSimsHubOpen(false);
                        handleNavClick(onOpenHardcoreSurvival, 'reactor');
                      }}
                    >
                      <span style={{ fontSize: '18px' }}>🔥</span>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontWeight: 800, color: '#fed7aa', fontSize: '11px' }}>
                          Hardcore Survival (5 Ops)
                        </div>
                        <div style={{ fontSize: '9px', color: '#fb923c' }}>
                          Kessler · Solar Storm · Oberth · Suicide Burn
                        </div>
                      </div>
                    </button>
                  )}
                  {onOpenMarsSurvival && (
                    <button
                      className="pubg-hub-subitem"
                      onClick={() => {
                        setIsSimsHubOpen(false);
                        handleNavClick(onOpenMarsSurvival, 'reactor');
                      }}
                    >
                      <span style={{ fontSize: '18px' }}>🔴</span>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontWeight: 800, color: '#fca5a5', fontSize: '11px' }}>
                          Mars Planetary Survival (4 Ops)
                        </div>
                        <div style={{ fontSize: '9px', color: '#f87171' }}>
                          MOXIE · Gale Storm · Valles Ice · Marsquake
                        </div>
                      </div>
                    </button>
                  )}
                  {onOpenMoonbaseAlpha && (
                    <button
                      className="pubg-hub-subitem"
                      onClick={() => {
                        setIsSimsHubOpen(false);
                        handleNavClick(onOpenMoonbaseAlpha, 'reactor');
                      }}
                    >
                      <span style={{ fontSize: '18px' }}>🌕</span>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontWeight: 800, color: '#f8fafc', fontSize: '11px' }}>
                          Moonbase Alpha 3D
                        </div>
                        <div style={{ fontSize: '9px', color: '#94a3b8' }}>
                          Lunar South Pole EVA Crisis Outpost
                        </div>
                      </div>
                    </button>
                  )}
                  {onOpenBlackHole && (
                    <button
                      className="pubg-hub-subitem"
                      onClick={() => {
                        setIsSimsHubOpen(false);
                        handleNavClick(onOpenBlackHole, 'chirp');
                      }}
                    >
                      <span style={{ fontSize: '18px' }}>🕳️</span>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontWeight: 800, color: '#f8fafc', fontSize: '11px' }}>
                          Relativistic Black Hole
                        </div>
                        <div style={{ fontSize: '9px', color: '#94a3b8' }}>
                          Gravitational Lensing & Event Horizon
                        </div>
                      </div>
                    </button>
                  )}
                  {onOpenRover && (
                    <button
                      className="pubg-hub-subitem"
                      onClick={() => {
                        setIsSimsHubOpen(false);
                        handleNavClick(onOpenRover, 'chirp');
                      }}
                    >
                      <span style={{ fontSize: '18px' }}>🚜</span>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontWeight: 800, color: '#f8fafc', fontSize: '11px' }}>
                          Mars Rover Surface EVA
                        </div>
                        <div style={{ fontSize: '9px', color: '#94a3b8' }}>
                          Perseverance Sample Return Mission
                        </div>
                      </div>
                    </button>
                  )}
                  {onOpenMarsEDL && (
                    <button
                      className="pubg-hub-subitem"
                      onClick={() => {
                        setIsSimsHubOpen(false);
                        handleNavClick(onOpenMarsEDL, 'reactor');
                      }}
                    >
                      <span style={{ fontSize: '18px' }}>🔥</span>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontWeight: 800, color: '#f8fafc', fontSize: '11px' }}>
                          Mars 2020 EDL Simulator
                        </div>
                        <div style={{ fontSize: '9px', color: '#94a3b8' }}>
                          7 Minutes of Terror Entry & Landing
                        </div>
                      </div>
                    </button>
                  )}
                </div>
              )}
            </div>

            <button
              className="lobby-action-pill-btn"
              onClick={() => handleNavClick(onOpenAcademy, 'chirp')}
              title="View Cadet Certification & Academy Progress"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#eab308' }}>●</span>
                <span>ACADEMY PROGRESS</span>
              </div>
              <span style={{ fontSize: '13px' }}>🎓</span>
            </button>
          </div>

          {/* Mode Selector Card & Prominent Glowing LAUNCH Button */}
          <div className="lobby-mode-launch-group">
            <div style={{ fontSize: '10px', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
              Mode Selector
            </div>

            <div
              className="lobby-mode-card"
              onClick={handleCycleMode}
              title="Click to Switch Mission Mode"
            >
              <img
                src="/assets/lobby_mode_survival_thumb.png"
                alt="Mission Preview"
                className="lobby-mode-thumb"
              />
              <div className="lobby-mode-info">
                <div>
                  <div className="lobby-mode-title">{currentModeConfig.title}</div>
                  <div className="lobby-mode-sub">{currentModeConfig.sub}</div>
                </div>
                <span style={{ fontSize: '14px', color: '#00d2ff' }}>🎛️</span>
              </div>
            </div>

            {/* Glowing Orange-Yellow LAUNCH CTA Button */}
            <button
              className="lobby-launch-cta-btn"
              onClick={handleStart}
              title="Launch Selected Mission / Expedition"
            >
              <span style={{ fontSize: '20px' }}>▶</span>
              <span>LAUNCH</span>
            </button>
          </div>
        </div>

          {/* ═══════════════════════════════════════════════════════════════
              HOLOGRAPHIC INSPECTION HUD OVERLAYS (EXPANDS WHEN ASTRONAUT CLICKED)
              ═══════════════════════════════════════════════════════════════ */}

          {/* 1. LEFT SIDE: FLOATING SEMI-TRANSPARENT STAT CARD */}
          {isInspectionMode && (
            <div
              className="hologram-stat-card"
              style={{
                position: 'absolute',
                left: '20px',
                top: '12px',
                zIndex: 45,
                maxHeight: 'calc(100vh - 225px)',
                overflowY: 'auto',
              }}
            >
              {/* Header: Avatar, Name, Flag & Pricing Tag */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '26px' }}>{inspectingAstronaut.avatar}</span>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 900, color: '#f8fafc', fontFamily: 'var(--font-space)', letterSpacing: '0.06em' }}>
                      {inspectingAstronaut.name.toUpperCase()}
                    </div>
                    <div style={{ fontSize: '10.5px', color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
                      {inspectingAstronaut.countryFlag} · {inspectingAstronaut.agency}
                    </div>
                  </div>
                </div>

                {/* Price / Unlock Tag */}
                {isSelectedActive ? (
                  <span style={{ background: 'rgba(16, 185, 129, 0.25)', border: '1px solid #10b981', color: '#34d399', fontSize: '10px', fontWeight: 900, padding: '3px 8px', borderRadius: '4px', fontFamily: 'var(--font-mono)' }}>
                    ● DEPLOYED
                  </span>
                ) : isSelectedUnlocked ? (
                  <span style={{ background: 'rgba(0, 210, 255, 0.2)', border: '1px solid #00d2ff', color: '#38bdf8', fontSize: '10px', fontWeight: 900, padding: '3px 8px', borderRadius: '4px', fontFamily: 'var(--font-mono)' }}>
                    UNLOCKED
                  </span>
                ) : (
                  <span style={{ background: 'rgba(255, 158, 27, 0.2)', border: '1px solid #ff9e1b', color: '#fbbf24', fontSize: '10px', fontWeight: 900, padding: '3px 8px', borderRadius: '4px', fontFamily: 'var(--font-mono)' }}>
                    🪙 {inspectingAstronaut.costCoins.toLocaleString()} COINS
                  </span>
                )}
              </div>

              {/* Historical Role & Title */}
              <div style={{ marginTop: '10px', fontSize: '11px', color: '#e2e8f0', fontWeight: 700, fontFamily: 'var(--font-space)', lineHeight: 1.4 }}>
                {inspectingAstronaut.historicalTitle}
              </div>

              {/* Special Perk Card with Sci-Fi Badge Icons */}
              <div style={{ marginTop: '14px', background: 'rgba(15, 23, 42, 0.75)', border: '1px solid rgba(0, 210, 255, 0.35)', borderRadius: '6px', padding: '12px' }}>
                <div style={{ fontSize: '11px', color: '#ff9e1b', fontWeight: 800, fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>⚡ SPECIAL FLIGHT PERK:</span>
                  <span>{inspectingAstronaut.specialPerk.name}</span>
                </div>
                <div style={{ fontSize: '10.5px', color: '#cbd5e1', marginTop: '6px', lineHeight: 1.45 }}>
                  {inspectingAstronaut.specialPerk.description}
                </div>
                <div style={{ marginTop: '8px', display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(0, 210, 255, 0.15)', border: '1px solid rgba(0, 210, 255, 0.4)', padding: '3px 8px', borderRadius: '4px', color: '#38bdf8', fontSize: '10px', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                  <span>🛡️ {inspectingAstronaut.specialPerk.statBonus}</span>
                </div>
              </div>

              {/* Sci-Fi Spec Badges Grid */}
              <div style={{ marginTop: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '10px', fontFamily: 'var(--font-mono)' }}>
                <div style={{ background: 'rgba(17, 24, 39, 0.75)', border: '1px solid rgba(148, 163, 184, 0.2)', padding: '6px 8px', borderRadius: '4px' }}>
                  <div style={{ color: '#94a3b8' }}>EVA O₂ STABILITY</div>
                  <div style={{ color: '#10b981', fontWeight: 800, marginTop: '2px' }}>+25% NOMINAL</div>
                </div>
                <div style={{ background: 'rgba(17, 24, 39, 0.75)', border: '1px solid rgba(148, 163, 184, 0.2)', padding: '6px 8px', borderRadius: '4px' }}>
                  <div style={{ color: '#94a3b8' }}>RAD SHIELDING</div>
                  <div style={{ color: '#38bdf8', fontWeight: 800, marginTop: '2px' }}>TIER-4 LUNAR</div>
                </div>
                <div style={{ background: 'rgba(17, 24, 39, 0.75)', border: '1px solid rgba(148, 163, 184, 0.2)', padding: '6px 8px', borderRadius: '4px' }}>
                  <div style={{ color: '#94a3b8' }}>SPACE DURATION</div>
                  <div style={{ color: '#fcd34d', fontWeight: 800, marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {inspectingAstronaut.totalTimeInSpace || 'Orbital Specialist'}
                  </div>
                </div>
                <div style={{ background: 'rgba(17, 24, 39, 0.75)', border: '1px solid rgba(148, 163, 184, 0.2)', padding: '6px 8px', borderRadius: '4px' }}>
                  <div style={{ color: '#94a3b8' }}>SPACEWALKS</div>
                  <div style={{ color: '#fcd34d', fontWeight: 800, marginTop: '2px' }}>
                    {inspectingAstronaut.spacewalkCount ?? 0} EVA Sorties
                  </div>
                </div>
              </div>

              {/* Historic Quote */}
              <div style={{ marginTop: '12px', fontSize: '10.5px', fontStyle: 'italic', color: '#94a3b8', borderLeft: '2px solid #ff9e1b', paddingLeft: '8px', lineHeight: 1.4 }}>
                "{inspectingAstronaut.famousQuote}"
              </div>
            </div>
          )}

          {/* 2. BOTTOM HORIZONTAL SCROLLING CAROUSEL */}
          {isInspectionMode && (
            <div
              style={{
                position: 'absolute',
                bottom: '10px',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 45,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <div style={{ fontSize: '10px', color: '#ff9e1b', fontFamily: 'var(--font-mono)', fontWeight: 800, letterSpacing: '0.08em', textShadow: '0 0 8px rgba(255, 158, 27, 0.6)' }}>
                ◄ SELECT HISTORIC ASTRONAUT TO INSPECT & EQUIP ({ASTRONAUT_CHARACTERS.length} CANDIDATES) ►
              </div>
              <div className="hologram-carousel-bar">
                {ASTRONAUT_CHARACTERS.map((char) => {
                  const isCharActive = char.id === inspectingAstronaut.id;
                  const isCharEquipped = (currentUser?.selectedCharacterId || 'neil_armstrong') === char.id;
                  const isCharUnlocked = unlockedIds.includes(char.id) || char.costCoins === 0;

                  return (
                    <div
                      key={char.id}
                      className={`carousel-astronaut-card ${isCharActive ? 'active' : ''}`}
                      onClick={() => {
                        soundFx.playClick(920);
                        setPreviewAstronautId(char.id);
                      }}
                      title={`Preview ${char.name} (${char.historicalTitle})`}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '20px' }}>{char.avatar}</span>
                        {isCharEquipped ? (
                          <span style={{ fontSize: '8.5px', color: '#10b981', fontWeight: 900, fontFamily: 'var(--font-mono)', background: 'rgba(16, 185, 129, 0.2)', padding: '1px 5px', borderRadius: '3px' }}>
                            EQUIPPED
                          </span>
                        ) : isCharUnlocked ? (
                          <span style={{ fontSize: '8.5px', color: '#38bdf8', fontWeight: 900, fontFamily: 'var(--font-mono)', background: 'rgba(0, 210, 255, 0.15)', padding: '1px 5px', borderRadius: '3px' }}>
                            READY
                          </span>
                        ) : (
                          <span style={{ fontSize: '8.5px', color: '#fbbf24', fontWeight: 900, fontFamily: 'var(--font-mono)', background: 'rgba(255, 158, 27, 0.2)', padding: '1px 5px', borderRadius: '3px' }}>
                            🔒 {char.costCoins}
                          </span>
                        )}
                      </div>

                      <div>
                        <div style={{ fontSize: '11px', fontWeight: 900, color: '#f8fafc', fontFamily: 'var(--font-space)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {char.name}
                        </div>
                        <div style={{ fontSize: '9px', color: '#94a3b8', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '1px' }}>
                          {char.countryFlag.split(' ')[0]} · {char.historicFlight.split('(')[0].trim()}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. BOTTOM-RIGHT: GLOWING HIGH-CONTRAST "EQUIP / UNLOCK" MASTER BUTTON */}
          {isInspectionMode && (
            <div style={{ position: 'absolute', right: '28px', bottom: '24px', zIndex: 45, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
              <button
                className={`inspection-master-btn ${isSelectedActive ? 'equipped' : isSelectedUnlocked ? '' : 'locked'}`}
                id="btn-inspection-equip-unlock"
                onClick={() => {
                  if (isSelectedActive) {
                    soundFx.playClick(700);
                    showToast(`🧑‍🚀 ${inspectingAstronaut.name} is already deployed for this mission!`, 'success');
                  } else if (isSelectedUnlocked) {
                    handleEquipAstronaut(inspectingAstronaut);
                  } else {
                    handleUnlockAstronaut(inspectingAstronaut);
                  }
                }}
                title={isSelectedActive ? 'Currently Deployed' : isSelectedUnlocked ? 'Equip Selected Astronaut' : `Unlock for ${inspectingAstronaut.costCoins} Coins`}
              >
                {isSelectedActive ? (
                  <>
                    <span style={{ fontSize: '20px' }}>✓</span>
                    <span>CURRENTLY DEPLOYED</span>
                  </>
                ) : isSelectedUnlocked ? (
                  <>
                    <span style={{ fontSize: '20px' }}>⚡</span>
                    <span>EQUIP ASTRONAUT</span>
                  </>
                ) : (
                  <>
                    <span style={{ fontSize: '20px' }}>🔓</span>
                    <span>UNLOCK · {inspectingAstronaut.costCoins.toLocaleString()} COINS</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>




      {/* ── EXPANDABLE NASA OPEN SCIENCE INTEL DOSSIER (MODAL DIALOG - NEVER STRETCHES LOBBY) ── */}
        {showIntelDossier && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 999999,
              background: 'rgba(5, 7, 12, 0.94)',
              backdropFilter: 'blur(20px)',
              overflowY: 'auto',
              padding: '40px 24px 60px 24px',
              animation: 'characterSlideIn 0.25s ease-out',
            }}
          >
            {/* Modal Header & Close Button */}
            <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', borderBottom: '1px solid rgba(0, 210, 255, 0.3)', paddingBottom: '16px' }}>
              <div>
                <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#00d2ff', letterSpacing: '0.12em', fontWeight: 800 }}>
                  NASA INTERNATIONAL SPACE APPS CHALLENGE 2026 · TEAM MYSTERIO
                </div>
                <h1 style={{ fontSize: '26px', fontWeight: 900, color: '#f8fafc', fontFamily: 'var(--font-space)', margin: '4px 0 0 0' }}>
                  Jr_AstroCamp: Mission Dossier & Science Architecture
                </h1>
              </div>
              <button
                onClick={() => setShowIntelDossier(false)}
                style={{
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid rgba(239, 68, 68, 0.6)',
                  color: '#f87171',
                  padding: '10px 24px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 800,
                  fontFamily: 'var(--font-mono)',
                  fontSize: '13px',
                }}
              >
                ✕ CLOSE DOSSIER [ESC]
              </button>
            </div>

            <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
              {/* WHAT IS ASTRO CAMP */}
              <section className="landing-section" style={{ padding: '0 0 40px 0' }}>
                <h2 className="landing-section-title">
                  One Platform.{' '}
                  <span style={{ background: 'linear-gradient(90deg,#a78bfa,#38bdf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                    Real Engineering. Real Science.
                  </span>
                </h2>
                <p className="landing-section-sub">
                  Jr_AstroCamp transforms space science education from passive reading into an active, high-stakes planetary outpost simulation and flight trainer.
                </p>
                <div className="landing-features-grid">
                  {FEATURES.map((f) => (
                    <div key={f.title} className="landing-feature-card">
                      <span className="feature-icon">{f.icon}</span>
                      <div className="feature-title">{f.title}</div>
                      <p className="feature-desc">{f.desc}</p>
                    </div>
                  ))}
                </div>
              </section>

              <hr className="landing-divider" />

              {/* HOW IT WORKS */}
              <section className="landing-section" style={{ padding: '40px 0' }}>
                <h2 className="landing-section-title">
                  The 4-Stage Astronaut Journey
                </h2>
                <p className="landing-section-sub">
                  From payload budgeting to crisis survival, experience the real engineering trade-offs of human deep space exploration.
                </p>
                <div className="landing-steps-grid">
                  {STEPS.map((s) => (
                    <div key={s.title} className="landing-step-card" style={{ borderTop: `3px solid ${s.color}` }}>
                      <span className="step-emoji">{s.emoji}</span>
                      <div className="step-title" style={{ color: s.color }}>{s.title}</div>
                      <p className="step-desc">{s.desc}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* FOOTER */}
              <footer className="landing-footer" style={{ borderTop: '1px solid rgba(148, 163, 184, 0.15)', paddingTop: '32px' }}>
                <div className="landing-brand">
                  <div className="landing-logo-ring">🚀</div>
                  <div>
                    <div className="landing-brand-name">Jr_AstroCamp: Beyond Earth</div>
                    <div className="landing-brand-sub">NASA International Space Apps Challenge 2026 · Team Mysterio</div>
                  </div>
                </div>
                <p className="landing-footer-copy">
                  Built for the NASA Space Apps Challenge 2026: "Build a Junior Astronaut Mission Trainer". Grounded in open NASA research and open data.
                </p>
              </footer>
            </div>
          </div>
        )}
    </div>
  );

  if (isMonitorPhotoView) {
    return (
      <div className="pc-monitor-photo-container">
        {/* Floating Expand Fullscreen Toggle */}
        <button
          className="pc-monitor-floating-toggle"
          onClick={() => {
            setIsMonitorPhotoView(false);
            soundFx.playClick(900);
          }}
          title="Expand Project to Clean Fullscreen View"
        >
          <span>⛶</span>
          <span>EXPAND FULLSCREEN</span>
        </button>

        {/* 4:3 Aspect Ratio Box fitting the user's reference monitor photo */}
        <div className="pc-monitor-photo-aspect-box">
          {/* Live Screen Portal where the project runs */}
          <div className="pc-monitor-live-screen-portal">
            <div className="pc-monitor-photo-glare" />
            {lobbyViewport}
          </div>
        </div>
      </div>
    );
  }

  return lobbyViewport;
};
