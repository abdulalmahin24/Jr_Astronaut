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
  onUserUpdate,
}) => {
  // Active historical astronaut selected by cadet
  const activeAstronaut = ASTRONAUT_CHARACTERS.find((c) => c.id === currentUser?.selectedCharacterId) || ASTRONAUT_CHARACTERS[0];

  // Cinematic Astronaut Inspection Mode & Camera Dolly
  const [isInspectionMode, setIsInspectionMode] = useState(false);
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
  const [selectedMatchMode, setSelectedMatchMode] = useState<'SPACE_GAMES' | 'HARDCORE_SURVIVAL' | 'MARS_SURVIVAL' | 'EARTH_TO_MOON' | 'SOL1_SURVIVAL' | 'NEW_CAMPAIGN' | 'MOONBASE_ALPHA' | 'BLACK_HOLE' | 'JUDGE_DEMO' | 'MARS_EDL'>('HARDCORE_SURVIVAL');
  const [showModeDropdown, setShowModeDropdown] = useState(false);
  const [showIntelDossier, setShowIntelDossier] = useState(false);
  const [isSimsHubOpen, setIsSimsHubOpen] = useState(false);
  const [isAcademyHubOpen, setIsAcademyHubOpen] = useState(false);
  const [isCrewHubOpen, setIsCrewHubOpen] = useState(false);
  const [audioMuted, setAudioMuted] = useState(false);
  const [musicMuted, setMusicMuted] = useState(() => spaceMusicEngine.getIsMuted());

  const [cadetProg] = useState(() => getCadetProgression());
  const rankInfo = getRankProgress(cadetProg.xp);

  const handleStart = () => {
    soundFx.playReactorStart();
    setWarping(true);
    setTimeout(() => {
      setWarping(false);
      if (selectedMatchMode === 'HARDCORE_SURVIVAL' && onOpenHardcoreSurvival) {
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

  return (
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

      {/* ── TOP TACTICAL STATUS BAR (PUBG / COD MOBILE STYLE) ── */}
      <header
        className="tactical-top-bar"
        style={{
          opacity: isInspectionMode ? 0 : 1,
          pointerEvents: isInspectionMode ? 'none' : 'auto',
          transition: 'all 0.4s ease',
        }}
      >
        {/* Left: Player Profile Card */}
        <div 
          className="tactical-player-card" 
          onClick={() => handleNavClick(onOpenAuth || onOpenAcademy)}
          title="Manage Callsign, Security Level & Credentials"
        >
          <div className="tactical-avatar-ring" style={{ borderColor: rankInfo.currentRank.color }}>
            <span>{currentUser?.avatar || rankInfo.currentRank.badgeEmoji}</span>
            <span className="tactical-level-badge" style={{ backgroundColor: rankInfo.currentRank.color }}>
              LV.{rankInfo.currentRank.level}
            </span>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '13px', fontWeight: 900, fontFamily: 'var(--font-mono)', color: '#ffffff' }}>
                {currentUser ? (currentUser.role === 'teacher' ? `👩‍🏫 ${currentUser.username}` : `@${currentUser.username}`) : 'CALLSIGN: CADET-01'}
              </span>
              <span 
                style={{ 
                  fontSize: '9px', 
                  background: 'rgba(148, 163, 184, 0.16)', 
                  color: '#e2e8f0', 
                  fontWeight: 800, 
                  padding: '1px 5px', 
                  borderRadius: '3px',
                  border: '1px solid rgba(148, 163, 184, 0.25)',
                }}
              >
                {currentUser?.role === 'teacher' ? 'INSTRUCTOR' : rankInfo.currentRank.titleEn.split('&')[0].trim().toUpperCase()}
              </span>
            </div>
            <div style={{ fontSize: '10px', color: '#94a3b8', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '1px' }}>
              <span>XP: {cadetProg.xp} / {rankInfo.nextRank ? rankInfo.nextRank.minXp : 'MAX'}</span>
              <span style={{ color: '#10b981', fontWeight: 700 }}>● ONLINE</span>
            </div>
          </div>
        </div>

        {/* Center: Mission Operations & Fast Tools (Replaced old Sector Shackleton & Ping text) */}
        <div 
          className="hidden md:flex"
          style={{ 
            alignItems: 'center', 
            gap: '6px',
            background: 'rgba(10, 15, 26, 0.75)',
            border: '1px solid rgba(0, 210, 255, 0.22)',
            borderRadius: '20px',
            padding: '3px 8px',
            backdropFilter: 'blur(8px)',
          }}
        >
          {/* 1. SCHOOL */}
          <button
            onClick={() => handleNavClick(onOpenTrainingCenter || onOpenAcademy, 'chirp')}
            className="tactical-badge-pill"
            style={{
              cursor: 'pointer',
              background: 'linear-gradient(180deg, rgba(0, 210, 255, 0.2), rgba(15, 23, 42, 0.8))',
              borderColor: 'rgba(0, 210, 255, 0.45)',
              color: '#38bdf8',
              fontWeight: 800,
              fontSize: '11px',
              padding: '4px 10px',
              gap: '5px',
            }}
            title="Junior Astronaut 3D Realistic Training Center (NBL, ECLSS, Habitat & Emergency Drills)"
          >
            <span>🏫</span>
            <span>SCHOOL</span>
          </button>

          {/* 2. RADAR */}
          {onOpenTelemetry && (
            <button
              id="pubg-btn-telemetry-radar"
              onClick={() => handleNavClick(onOpenTelemetry, 'chirp')}
              className="tactical-badge-pill"
              style={{
                cursor: 'pointer',
                background: 'rgba(15, 23, 42, 0.8)',
                borderColor: 'rgba(0, 210, 255, 0.25)',
                color: '#e2e8f0',
                fontWeight: 800,
                fontSize: '11px',
                padding: '4px 10px',
                gap: '5px',
              }}
              title="NASA Live Telemetry Pipeline & Space Weather"
            >
              <span>🛰️</span>
              <span>RADAR</span>
            </button>
          )}

          {/* 3. SCORES */}
          {onOpenTeacherGradebook && (
            <button
              onClick={() => handleNavClick(onOpenTeacherGradebook, 'chirp')}
              className="tactical-badge-pill"
              style={{
                cursor: 'pointer',
                background: 'rgba(15, 23, 42, 0.8)',
                borderColor: currentUser?.role === 'teacher' ? '#ff9e1b' : 'rgba(0, 210, 255, 0.25)',
                color: currentUser?.role === 'teacher' ? '#ff9e1b' : '#e2e8f0',
                fontWeight: 800,
                fontSize: '11px',
                padding: '4px 10px',
                gap: '5px',
              }}
              title="Classroom Scores, Student Progress & Gradebook"
            >
              <span>📊</span>
              <span>SCORES</span>
            </button>
          )}

          {/* 4. JUDGE */}
          {onOpenJudgePreview && (
            <button
              onClick={() => handleNavClick(onOpenJudgePreview, 'chirp')}
              className="tactical-badge-pill"
              style={{
                cursor: 'pointer',
                background: 'rgba(255, 158, 27, 0.18)',
                borderColor: '#ff9e1b',
                color: '#ff9e1b',
                fontWeight: 900,
                fontSize: '11px',
                padding: '4px 10px',
                gap: '5px',
              }}
              title="Space Apps Challenge Judge Speedrun (Instant 1-Click Win)"
            >
              <span>🏆</span>
              <span>JUDGE</span>
            </button>
          )}

          {/* 5. DIPLOMA */}
          {onOpenCertificate && (
            <button
              onClick={() => handleNavClick(onOpenCertificate, 'chirp')}
              className="tactical-badge-pill"
              style={{
                cursor: 'pointer',
                background: 'rgba(15, 23, 42, 0.8)',
                borderColor: 'rgba(0, 210, 255, 0.25)',
                color: '#e2e8f0',
                fontWeight: 800,
                fontSize: '11px',
                padding: '4px 10px',
                gap: '5px',
              }}
              title="NASA Junior Astronaut Flight Certificate"
            >
              <span>📜</span>
              <span>DIPLOMA</span>
            </button>
          )}

          {/* 6. INTEL */}
          {onOpenComics && (
            <button
              onClick={() => handleNavClick(onOpenComics, 'chirp')}
              className="tactical-badge-pill"
              style={{
                cursor: 'pointer',
                background: 'rgba(15, 23, 42, 0.8)',
                borderColor: 'rgba(0, 210, 255, 0.25)',
                color: '#e2e8f0',
                fontWeight: 800,
                fontSize: '11px',
                padding: '4px 10px',
                gap: '5px',
              }}
              title="Graphic Intel Briefings & Interactive Comics"
            >
              <span>📖</span>
              <span>INTEL</span>
            </button>
          )}

          {/* 7. MARS SURVIVAL (4 MISSIONS) */}
          {onOpenMarsSurvival && (
            <button
              onClick={() => handleNavClick(onOpenMarsSurvival, 'reactor')}
              className="tactical-badge-pill"
              style={{
                cursor: 'pointer',
                background: 'linear-gradient(180deg, rgba(239, 68, 68, 0.35), rgba(15, 23, 42, 0.95))',
                borderColor: '#ef4444',
                color: '#fca5a5',
                fontWeight: 900,
                fontSize: '11px',
                padding: '4px 12px',
                gap: '6px',
                boxShadow: '0 0 14px rgba(239, 68, 68, 0.45)',
              }}
              title="NASA Mars Planetary Survival Operations (4 Missions: MOXIE, REMS Storm, Ice Core, Marsquake)"
            >
              <span>🔴</span>
              <span>MARS SURVIVAL (4 OPS)</span>
            </button>
          )}

          {/* 8. HARDCORE ORBITAL SURVIVAL (5 MISSIONS) */}
          {onOpenHardcoreSurvival && (
            <button
              onClick={() => handleNavClick(onOpenHardcoreSurvival, 'reactor')}
              className="tactical-badge-pill"
              style={{
                cursor: 'pointer',
                background: 'linear-gradient(180deg, rgba(234, 88, 12, 0.4), rgba(15, 23, 42, 0.95))',
                borderColor: '#f97316',
                color: '#fed7aa',
                fontWeight: 900,
                fontSize: '11px',
                padding: '4px 12px',
                gap: '6px',
                boxShadow: '0 0 16px rgba(249, 115, 22, 0.5)',
              }}
              title="5 Hardcore Orbital Survival Missions: Kessler Syndrome, Solar Storm, Apollo 13, Oberth Slingshot & Suicide Burn"
            >
              <span>🔥</span>
              <span>HARDCORE SURVIVAL (5 OPS)</span>
            </button>
          )}

          {/* 7. CONFIG */}
          {onOpenSettings && (
            <button
              onClick={() => handleNavClick(onOpenSettings, 'chirp')}
              className="tactical-badge-pill"
              style={{
                cursor: 'pointer',
                background: 'rgba(15, 23, 42, 0.8)',
                borderColor: 'rgba(148, 163, 184, 0.28)',
                color: '#cbd5e1',
                fontWeight: 800,
                fontSize: '11px',
                padding: '4px 10px',
                gap: '5px',
              }}
              title="Audio, Graphics & Control Settings"
            >
              <span>⚙️</span>
              <span>CONFIG</span>
            </button>
          )}
        </div>

        {/* Right: Tactical Vitals & Fast Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Cadet Coins */}
          <button
            onClick={() => handleNavClick(onOpenCharacterLocker || onOpenDepot || onOpenAcademy)}
            className="tactical-badge-pill"
            style={{ color: '#fcd34d', borderColor: 'rgba(245, 158, 11, 0.35)', background: 'rgba(15, 23, 42, 0.8)', cursor: 'pointer' }}
            title="Cadet In-Game Coins (Earn from Missions & Exams)"
          >
            <span>🪙 {(currentUser?.coins ?? 500).toLocaleString()} COINS</span>
          </button>

          {/* Famous Astronaut Character Locker */}
          {onOpenCharacterLocker && (
            <button
              onClick={() => handleNavClick(onOpenCharacterLocker)}
              className="tactical-badge-pill"
              style={{ color: '#f8fafc', borderColor: 'rgba(148, 163, 184, 0.25)', background: 'rgba(15, 23, 42, 0.8)', cursor: 'pointer', fontWeight: 800 }}
              title="Historic Astronaut Hangar & Character Selector"
            >
              <span>🧑‍🚀 CREW</span>
            </button>
          )}

          {/* Live Mission Radar */}
          {onOpenLiveActivity && (
            <button
              onClick={() => handleNavClick(onOpenLiveActivity)}
              className="tactical-badge-pill"
              style={{ color: '#6ee7b7', borderColor: 'rgba(16, 185, 129, 0.35)', background: 'rgba(15, 23, 42, 0.8)', cursor: 'pointer', fontWeight: 800 }}
              title="Synchronized Real-Time Cadet Mission Radar"
            >
              <span>📡 LIVE RADAR</span>
            </button>
          )}

          {/* Base Vitals */}
          <div className="tactical-badge-pill hidden lg:flex" style={{ color: '#6ee7b7', borderColor: 'rgba(16, 185, 129, 0.25)' }} title="Base Power Grid">
            <span>⚡ 100%</span>
          </div>
          <div className="tactical-badge-pill hidden lg:flex" style={{ color: '#7dd3fc', borderColor: 'rgba(2, 132, 199, 0.25)' }} title="Life Support Reserves">
            <span>💧 850L</span>
          </div>

          {/* Sign In / Switch Account Button */}
          {onOpenAuth && (
            <button
              onClick={() => handleNavClick(onOpenAuth)}
              className="tactical-badge-pill"
              style={{
                cursor: 'pointer',
                background: currentUser ? 'rgba(15, 23, 42, 0.8)' : 'linear-gradient(180deg, #334155, #1e293b)',
                color: '#fff',
                borderColor: 'rgba(148, 163, 184, 0.28)',
                fontWeight: 800,
              }}
              title="Switch Account / Sign In / Register"
            >
              {currentUser ? '👤 ACCOUNT' : '🔒 SIGN IN'}
            </button>
          )}

          {/* Multiplayer Co-Op Mission Lobby */}
          {onOpenMultiplayerLobby && (
            <button
              onClick={() => handleNavClick(onOpenMultiplayerLobby, 'chirp')}
              className="tactical-badge-pill"
              id="landing-top-btn-coop"
              style={{
                cursor: 'pointer',
                background: 'linear-gradient(180deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.3))',
                color: '#6ee7b7',
                borderColor: 'rgba(16, 185, 129, 0.4)',
                fontWeight: 800,
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
              }}
              title="NASA Multi-Crew Co-Op Mission Lobby · Fly Missions Together"
            >
              👥 CO-OP LOBBY
            </button>
          )}

          {/* NASA Eyes 3D Solar Orrery Quick Launch */}
          {onOpenOrrery && (
            <button
              onClick={() => handleNavClick(onOpenOrrery, 'chirp')}
              className="tactical-badge-pill"
              id="landing-top-btn-orrery"
              style={{
                cursor: 'pointer',
                background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.9), rgba(30, 41, 59, 0.7))',
                color: '#f8fafc',
                borderColor: 'rgba(148, 163, 184, 0.25)',
                fontWeight: 800,
              }}
              title="NASA Eyes: 3D Interactive Solar System Orrery & Space Stations"
            >
              🪐 3D SOLAR EYES
            </button>
          )}


          {/* Background Space Music Toggle */}
          <button
            onClick={() => {
              const muted = spaceMusicEngine.toggleMute();
              setMusicMuted(muted);
              soundFx.playClick(850);
            }}
            className="tactical-badge-pill"
            style={{
              cursor: 'pointer',
              background: !musicMuted ? 'rgba(56, 189, 248, 0.25)' : 'rgba(15, 23, 42, 0.8)',
              borderColor: !musicMuted ? '#38bdf8' : 'rgba(148, 163, 184, 0.3)',
              color: !musicMuted ? '#38bdf8' : '#94a3b8',
              fontWeight: 800,
            }}
            title={musicMuted ? 'Turn Space Music ON' : 'Turn Space Music OFF'}
          >
            {!musicMuted ? '🎵 MUSIC: ON' : '🔇 MUSIC: OFF'}
          </button>

          {/* Quick Sound Toggle */}
          <button
            onClick={() => {
              setAudioMuted(!audioMuted);
              soundFx.playClick(900);
            }}
            className="tactical-badge-pill"
            style={{ cursor: 'pointer', background: audioMuted ? 'rgba(239, 68, 68, 0.2)' : 'rgba(15, 23, 42, 0.8)' }}
            title={audioMuted ? 'Unmute Audio FX' : 'Mute Audio FX'}
          >
            {audioMuted ? '🔇 FX' : '🔊 FX'}
          </button>
        </div>
      </header>

      {/* ── MAIN TACTICAL BATTLE ARENA (3-COLUMN LAYOUT) ── */}
      <main style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '4px 20px 8px 20px', width: '100%', overflow: 'hidden', position: 'relative', zIndex: 10 }}>
        
        {/* Top Capcom Urgent Directive Bar */}
        <div 
          style={{ 
            background: 'linear-gradient(90deg, rgba(7, 9, 14, 0.94) 0%, rgba(17, 22, 34, 0.88) 50%, rgba(7, 9, 14, 0.94) 100%)',
            border: '1px solid rgba(0, 210, 255, 0.3)',
            clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)',
            padding: '5px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backdropFilter: 'blur(10px)',
            zIndex: 25,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '14px', animation: 'spin 12s linear infinite' }}>📡</span>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#ff9e1b', fontWeight: 900 }}>
              HOUSTON CAPCOM DIRECTIVE:
            </span>
            <span style={{ fontSize: '11.5px', color: '#cbd5e1' }}>
              NASA Artemis III directives active at Shackleton Rim (-89.9°S). Maintain Kilopower grid, drill volatile ice in crater shadows, and survive polar night.
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Direct Animation Video & Ground School Launcher */}
            <button
              id="pubg-btn-training-center"
              onClick={() => handleNavClick(onOpenTrainingCenter || onOpenAcademy, 'chirp')}
              style={{
                background: 'linear-gradient(135deg, rgba(0, 210, 255, 0.28) 0%, rgba(59, 130, 246, 0.35) 100%)',
                border: '1px solid #00d2ff',
                color: '#ffffff',
                padding: '4px 14px',
                borderRadius: '6px',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                fontWeight: 900,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 0 15px rgba(0, 210, 255, 0.45)',
                transition: 'all 0.2s ease',
              }}
              title="Watch Space Animation Videos & 3D Ground School"
            >
              <span style={{ fontSize: '13px' }}>🎬</span>
              <span>ANIMATION VIDEOS & 3D GROUND SCHOOL</span>
              <span style={{ color: '#00d2ff', fontWeight: 900 }}>▶</span>
            </button>
            {currentUser?.role === 'teacher' && onOpenTeacherGradebook && (
              <button
                onClick={() => handleNavClick(onOpenTeacherGradebook, 'chirp')}
                style={{
                  background: 'rgba(255, 158, 27, 0.2)',
                  border: '1px solid #ff9e1b',
                  color: '#ffb03a',
                  padding: '2px 8px',
                  borderRadius: '3px',
                  fontSize: '10px',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                📊 TEACHER GRADEBOOK READY →
              </button>
            )}

          </div>
        </div>

        {/* Guided 5-Step Cadet Journey Progression Banner */}
        {!isInspectionMode && (
          <div style={{ width: '100%', padding: '0 24px', margin: '4px 0 8px 0', zIndex: 30 }}>
            <GuidedCadetJourney
              completedMissionsCount={currentUser?.completedMissions?.length || (hasSavedGame ? 1 : 0)}
              onOpenStep={(step) => {
                if (step === 1) (onOpenClassroom || onOpenAcademy)?.();
                else if (step === 2) (onOpenDepot || onOpenTrainingCenter)?.();
                else if (step === 3) onOpenExpedition?.();
                else if (step === 4) onOpenRover?.();
                else if (step === 5) onOpenCertificate?.();
              }}
            />
          </div>
        )}

        {/* ── PANORAMIC MID-SECTION (PUBG MOBILE HUD OVERLAYS) ── */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', width: '100%', minHeight: 0, overflow: 'hidden' }}>
          
          {/* ── LEFT COLUMN: GAME MODE SELECTOR (FADES IN INSPECTION MODE) ── */}
          <div
            style={{
              zIndex: 20,
              alignSelf: 'flex-start',
              marginTop: '10px',
              marginLeft: '20px',
              opacity: isInspectionMode ? 0 : 1,
              pointerEvents: isInspectionMode ? 'none' : 'auto',
              transform: isInspectionMode ? 'translateX(-30px)' : 'none',
              transition: 'all 0.45s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            {/* PUBG MODE SELECTOR CARD */}
            <div 
              className="pubg-mode-card"
              onClick={() => {
                const modes: ('HARDCORE_SURVIVAL' | 'MARS_SURVIVAL' | 'SPACE_GAMES' | 'EARTH_TO_MOON' | 'SOL1_SURVIVAL' | 'NEW_CAMPAIGN' | 'MOONBASE_ALPHA' | 'BLACK_HOLE' | 'JUDGE_DEMO' | 'MARS_EDL')[] = [
                  'HARDCORE_SURVIVAL',
                  'MARS_SURVIVAL',
                  'SPACE_GAMES',
                  'EARTH_TO_MOON',
                  'SOL1_SURVIVAL',
                  'MOONBASE_ALPHA',
                  'BLACK_HOLE',
                  'NEW_CAMPAIGN',
                  'JUDGE_DEMO',
                  'MARS_EDL'
                ];
                const nextIdx = (modes.indexOf(selectedMatchMode) + 1) % modes.length;
                setSelectedMatchMode(modes[nextIdx]);
                soundFx.playClick(900);
              }}
              title="Click to Switch Mission Mode"
              style={{ width: '270px' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: '#ff9e1b', fontWeight: 900, letterSpacing: '0.06em' }}>
                  {selectedMatchMode === 'HARDCORE_SURVIVAL' && '🔥 HARDCORE ORBITAL SURVIVAL (5 MISSIONS)'}
                  {selectedMatchMode === 'MARS_SURVIVAL' && '🔴 MARS SURVIVAL SUITE (4 MISSIONS)'}
                  {selectedMatchMode === 'SPACE_GAMES' && '🪐 DEDICATED SPACE GAMES ARCADE (3 AGE TIERS)'}
                  {selectedMatchMode === 'EARTH_TO_MOON' && '🚀 ADVANCED ASTRONAUT EXPEDITIONS (LEVEL 5)'}
                  {selectedMatchMode === 'SOL1_SURVIVAL' && '🌕 LUNAR EXPEDITION'}
                  {selectedMatchMode === 'MOONBASE_ALPHA' && '🧑‍🚀 MOONBASE ALPHA (EVA)'}
                  {selectedMatchMode === 'BLACK_HOLE' && '🕳️ BLACK HOLE RELATIVITY'}
                  {selectedMatchMode === 'NEW_CAMPAIGN' && '🚀 NASA 76 MISSIONS'}
                  {selectedMatchMode === 'JUDGE_DEMO' && '🏆 JUDGE SPEEDRUN'}
                  {selectedMatchMode === 'MARS_EDL' && '🔴 MARS 2020 EDL'}
                </span>
                <span style={{ fontSize: '9px', color: '#00d2ff', fontFamily: 'var(--font-mono)', fontWeight: 800 }}>
                  SWITCH ▾
                </span>
              </div>
              <div style={{ fontSize: '13px', fontWeight: 900, color: '#f8fafc', fontFamily: 'var(--font-space)' }}>
                {selectedMatchMode === 'HARDCORE_SURVIVAL' && 'Kessler Syndrome · Solar Storm · Apollo 13 · Oberth · Suicide Burn'}
                {selectedMatchMode === 'MARS_SURVIVAL' && "Jezero Delta · Gale REMS Storm · Valles Marineris · Elysium SEIS"}
                {selectedMatchMode === 'SPACE_GAMES' && "No Man's Sky · KSP · Space Engineers · Star Citizen"}
                {selectedMatchMode === 'EARTH_TO_MOON' && 'New Shepard (10 Min to Space), Artemis V, Apollo 11'}
                {selectedMatchMode === 'SOL1_SURVIVAL' && 'Moon Base Survival (Sol 1)'}
                {selectedMatchMode === 'MOONBASE_ALPHA' && 'Outpost Crisis: Low-G EVA Repair'}
                {selectedMatchMode === 'BLACK_HOLE' && 'SpaceEngine Relativistic Lensing'}
                {selectedMatchMode === 'NEW_CAMPAIGN' && 'All 76 Flight Missions'}
                {selectedMatchMode === 'JUDGE_DEMO' && '1-Click Judge Victory Demo'}
                {selectedMatchMode === 'MARS_EDL' && 'Jezero Crater Sky Crane EDL'}
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '6px', fontSize: '10px', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
                <span>📍 {selectedMatchMode === 'HARDCORE_SURVIVAL' ? 'Newtonian Gravity, Keplerian Solver & Real Telemetry' : selectedMatchMode === 'MARS_SURVIVAL' ? 'NASA PDS, REMS, Mars Trek GIS & Eyes Data' : selectedMatchMode === 'SPACE_GAMES' ? 'Dedicated Arcade Suite (Ages 6-10 / 11-15 / 16+)' : selectedMatchMode === 'EARTH_TO_MOON' ? 'Classified: Advanced Astronauts Only' : selectedMatchMode === 'BLACK_HOLE' ? 'Kerr Event Horizon' : 'Shackleton Rim'}</span>
                <span>•</span>
                <span style={{ color: '#10b981' }}>● Real-Time 3D Simulation</span>
              </div>
            </div>
          </div>

          {/* ── CENTER: LIVE 3D MOVING FULL-BODY ARTEMIS ASTRONAUT (PUBG LOBBY STYLE) ── */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%', position: 'relative', zIndex: 15, paddingBottom: '0px' }}>
            
            {/* Live Interactive Full-Body 3D Real NASA Astronaut Character (Moving, Idle Breathing, Drag 360°, Zero Weapons) */}
            <LobbyAstronaut3D 
              characterId={inspectingAstronaut.id}
              astronautName={inspectingAstronaut.name} 
              isInspectionMode={isInspectionMode}
              envMapUrl="/assets/artemis_lobby_clean_hangar.png"
              onInteract={() => {
                if (!isInspectionMode) {
                  handleOpenInspection(inspectingAstronaut.id);
                }
              }} 
            />

            {/* Astronaut Overhead Nameplate & Switch Suit Action (Faded in Inspection Mode) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '2px', opacity: isInspectionMode ? 0 : 1, pointerEvents: isInspectionMode ? 'none' : 'auto', transition: 'all 0.3s ease' }}>
              <div 
                style={{ 
                  background: 'rgba(17, 22, 34, 0.9)', 
                  border: '1px solid rgba(0, 210, 255, 0.45)', 
                  clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)',
                  padding: '5px 20px', 
                  backdropFilter: 'blur(12px)',
                  textAlign: 'center',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.85), 0 0 20px rgba(0, 210, 255, 0.3)',
                }}
              >
                <div style={{ fontSize: '13px', fontWeight: 900, color: '#f8fafc', fontFamily: 'var(--font-space)', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <span>{inspectingAstronaut.avatar}</span>
                  <span>{inspectingAstronaut.name.toUpperCase()}</span>
                  <span style={{ fontSize: '11px', color: '#38bdf8' }}>{inspectingAstronaut.countryFlag.split(' ')[0]}</span>
                </div>
                <div style={{ fontSize: '10px', color: '#00d2ff', fontFamily: 'var(--font-mono)', marginTop: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <span>SUIT: NASA EMU EVA SPACESUIT</span>
                  <span>•</span>
                  <span style={{ color: '#10b981' }}>O₂: 100% NOMINAL</span>
                  <span>•</span>
                  <span>RAD: 0.12 mSv</span>
                </div>
              </div>

              {/* Character Locker / Switch Astronaut Action Button */}
              <button
                onClick={() => handleOpenInspection(inspectingAstronaut.id)}
                style={{
                  background: 'rgba(22, 30, 46, 0.92)',
                  border: '1px solid rgba(255, 158, 27, 0.55)',
                  clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)',
                  padding: '8px 16px',
                  color: '#ff9e1b',
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.6)',
                  backdropFilter: 'blur(8px)',
                  transition: 'all 0.2s ease',
                  height: '100%',
                }}
                title="Inspect Astronaut on Glowing Pedestal"
              >
                <span>🔍</span>
                <span>INSPECT & SWITCH</span>
              </button>
            </div>
          </div>

          {/* ── RIGHT COLUMN: 5 FLIGHT HUBS STACKED DIRECTLY ABOVE START BUTTON (FADES IN INSPECTION MODE) ── */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              zIndex: 25,
              alignSelf: 'flex-end',
              marginBottom: '10px',
              marginRight: '20px',
              width: '240px',
              opacity: isInspectionMode ? 0 : 1,
              pointerEvents: isInspectionMode ? 'none' : 'auto',
              transform: isInspectionMode ? 'translateX(30px)' : 'none',
              transition: 'all 0.45s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            {/* Mission Hubs Header Tag */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px 2px 4px' }}>
              <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: '#00d2ff', fontWeight: 900, letterSpacing: '0.08em' }}>
                ✦ MISSION HUBS
              </span>
              <span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', color: '#10b981', fontWeight: 700 }}>
                ● 5 HUBS READY
              </span>
            </div>

            {/* 1. Missions Campaign (76 Missions) */}
            <button
              className="pubg-bottom-tab"
              onClick={() => handleNavClick(onOpenCampaign, 'reactor')}
              id="pubg-tab-missions"
              title="Browse all 76 NASA Flight Missions (Mercury to Artemis)"
              style={{
                borderColor: 'rgba(0, 210, 255, 0.6)',
                background: 'linear-gradient(90deg, rgba(0, 210, 255, 0.22), rgba(15, 23, 42, 0.95))',
                width: '100%',
                boxSizing: 'border-box',
                justifyContent: 'space-between',
                padding: '7px 12px',
                height: '38px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '16px' }}>🚀</span>
                <span>76 MISSIONS</span>
              </div>
              <div className="pubg-tab-badge" style={{ position: 'static', background: '#00d2ff', width: '7px', height: '7px' }} />
            </button>

            {/* 2. Simulation Labs Hub (Dropdown Menu) */}
            <div style={{ position: 'relative', width: '100%' }}>
              <button
                className={`pubg-bottom-tab ${isSimsHubOpen ? 'active' : ''}`}
                onClick={() => {
                  setIsSimsHubOpen(!isSimsHubOpen);
                  setIsAcademyHubOpen(false);
                  setIsCrewHubOpen(false);
                  soundFx.playClick(800);
                }}
                id="pubg-tab-sims-hub"
                style={{
                  borderColor: 'rgba(168, 85, 247, 0.65)',
                  background: 'linear-gradient(90deg, rgba(168, 85, 247, 0.22), rgba(15, 23, 42, 0.95))',
                  width: '100%',
                  boxSizing: 'border-box',
                  justifyContent: 'space-between',
                  padding: '7px 12px',
                  height: '38px',
                }}
                title="Open 3D Real-Time Simulation Labs"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '16px' }}>🧪</span>
                  <span>SIMULATION LABS</span>
                </div>
                <span style={{ fontSize: '10px', color: '#c084fc' }}>{isSimsHubOpen ? '◀' : '▼'}</span>
              </button>

              {/* Flyout menu to the LEFT */}
              {isSimsHubOpen && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 'calc(100% + 12px)',
                    background: 'rgba(10, 15, 26, 0.96)',
                    border: '1px solid rgba(168, 85, 247, 0.5)',
                    borderRadius: '12px',
                    padding: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    minWidth: '290px',
                    backdropFilter: 'blur(20px)',
                    boxShadow: '0 16px 40px rgba(0,0,0,0.9), 0 0 30px rgba(168, 85, 247, 0.35)',
                    zIndex: 100,
                    animation: 'characterSlideIn 0.2s ease-out',
                  }}
                >
                  <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: '#c084fc', letterSpacing: '0.1em', fontWeight: 800, paddingBottom: '6px', borderBottom: '1px solid rgba(168, 85, 247, 0.2)', display: 'flex', justifyContent: 'space-between' }}>
                    <span>✦ 3D PLANETARY SIMULATION LABS</span>
                    <span style={{ cursor: 'pointer', color: '#94a3b8' }} onClick={() => setIsSimsHubOpen(false)}>✕</span>
                  </div>
                  {onOpenHardcoreSurvival && (
                    <button
                      className="pubg-hub-subitem"
                      style={{ border: '1px solid rgba(249, 115, 22, 0.5)', background: 'linear-gradient(90deg, rgba(249, 115, 22, 0.22), rgba(15, 23, 42, 0.95))' }}
                      onClick={() => { setIsSimsHubOpen(false); handleNavClick(onOpenHardcoreSurvival, 'reactor'); }}
                    >
                      <span style={{ fontSize: '20px' }}>🔥</span>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontWeight: 800, color: '#fed7aa', fontSize: '12px' }}>Hardcore Survival Mode (5 Ops)</div>
                        <div style={{ fontSize: '10px', color: '#fb923c' }}>Newtonian Gravity · Kessler · Oberth · Suicide Burn</div>
                      </div>
                    </button>
                  )}
                  {onOpenMarsSurvival && (
                    <button
                      className="pubg-hub-subitem"
                      style={{ border: '1px solid rgba(239, 68, 68, 0.5)', background: 'linear-gradient(90deg, rgba(239, 68, 68, 0.2), rgba(15, 23, 42, 0.9))' }}
                      onClick={() => { setIsSimsHubOpen(false); handleNavClick(onOpenMarsSurvival, 'reactor'); }}
                    >
                      <span style={{ fontSize: '20px' }}>🔴</span>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontWeight: 800, color: '#fca5a5', fontSize: '12px' }}>Mars Planetary Survival (4 Ops)</div>
                        <div style={{ fontSize: '10px', color: '#f87171' }}>MOXIE · Gale Storm · Valles Ice · Marsquake</div>
                      </div>
                    </button>
                  )}
                  {onOpenMoonbaseAlpha && (
                    <button
                      className="pubg-hub-subitem"
                      onClick={() => { setIsSimsHubOpen(false); handleNavClick(onOpenMoonbaseAlpha, 'reactor'); }}
                    >
                      <span style={{ fontSize: '20px' }}>🌕</span>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontWeight: 800, color: '#f8fafc', fontSize: '12px' }}>Moonbase Alpha 3D</div>
                        <div style={{ fontSize: '10px', color: '#94a3b8' }}>Lunar South Pole EVA Crisis Outpost</div>
                      </div>
                    </button>
                  )}
                  {onOpenBlackHole && (
                    <button
                      className="pubg-hub-subitem"
                      onClick={() => { setIsSimsHubOpen(false); handleNavClick(onOpenBlackHole, 'chirp'); }}
                    >
                      <span style={{ fontSize: '20px' }}>🕳️</span>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontWeight: 800, color: '#f8fafc', fontSize: '12px' }}>Relativistic Black Hole</div>
                        <div style={{ fontSize: '10px', color: '#94a3b8' }}>Gravitational Lensing & Event Horizon Lab</div>
                      </div>
                    </button>
                  )}
                  {onOpenOrrery && (
                    <button
                      className="pubg-hub-subitem"
                      onClick={() => { setIsSimsHubOpen(false); handleNavClick(onOpenOrrery, 'chirp'); }}
                    >
                      <span style={{ fontSize: '20px' }}>🪐</span>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontWeight: 800, color: '#f8fafc', fontSize: '12px' }}>3D Solar System Orrery</div>
                        <div style={{ fontSize: '10px', color: '#94a3b8' }}>Real Trajectories & Orbital Mechanics</div>
                      </div>
                    </button>
                  )}
                  {onOpenRover && (
                    <button
                      className="pubg-hub-subitem"
                      onClick={() => { setIsSimsHubOpen(false); handleNavClick(onOpenRover, 'chirp'); }}
                    >
                      <span style={{ fontSize: '20px' }}>🚜</span>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontWeight: 800, color: '#f8fafc', fontSize: '12px' }}>Mars Rover Surface EVA</div>
                        <div style={{ fontSize: '10px', color: '#94a3b8' }}>Perseverance Sample Return Mission</div>
                      </div>
                    </button>
                  )}
                  {onOpenMarsEDL && (
                    <button
                      className="pubg-hub-subitem"
                      onClick={() => { setIsSimsHubOpen(false); handleNavClick(onOpenMarsEDL, 'reactor'); }}
                    >
                      <span style={{ fontSize: '20px' }}>🔥</span>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontWeight: 800, color: '#f8fafc', fontSize: '12px' }}>Mars 2020 EDL Simulator</div>
                        <div style={{ fontSize: '10px', color: '#94a3b8' }}>7 Minutes of Terror Entry & Landing</div>
                      </div>
                    </button>
                  )}
                  {onOpenExpedition && (
                    <button
                      className="pubg-hub-subitem"
                      onClick={() => { setIsSimsHubOpen(false); handleNavClick(onOpenExpedition, 'reactor'); }}
                    >
                      <span style={{ fontSize: '20px' }}>🚀</span>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontWeight: 800, color: '#f8fafc', fontSize: '12px' }}>Earth to Moon Expedition</div>
                        <div style={{ fontSize: '10px', color: '#94a3b8' }}>Artemis Multi-Stage Lunar Mission</div>
                      </div>
                    </button>
                  )}
                  {onOpenSpaceGamesHub && (
                    <button
                      className="pubg-hub-subitem"
                      onClick={() => { setIsSimsHubOpen(false); handleNavClick(onOpenSpaceGamesHub, 'reactor'); }}
                    >
                      <span style={{ fontSize: '20px' }}>🎮</span>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontWeight: 800, color: '#f8fafc', fontSize: '12px' }}>Dedicated Space Games</div>
                        <div style={{ fontSize: '10px', color: '#94a3b8' }}>KSP, Space Engineers, Star Citizen Suite</div>
                      </div>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* 3. Astronaut Academy & Training Hub (Dropdown Menu) */}
            <div style={{ position: 'relative', width: '100%' }}>
              <button
                className={`pubg-bottom-tab ${isAcademyHubOpen ? 'active' : ''}`}
                onClick={() => {
                  setIsAcademyHubOpen(!isAcademyHubOpen);
                  setIsSimsHubOpen(false);
                  setIsCrewHubOpen(false);
                  soundFx.playClick(800);
                }}
                id="pubg-tab-academy-hub"
                style={{
                  borderColor: 'rgba(59, 130, 246, 0.65)',
                  background: 'linear-gradient(90deg, rgba(59, 130, 246, 0.22), rgba(15, 23, 42, 0.95))',
                  width: '100%',
                  boxSizing: 'border-box',
                  justifyContent: 'space-between',
                  padding: '7px 12px',
                  height: '38px',
                }}
                title="Open Cadet Training Academy"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '16px' }}>🪖</span>
                  <span>ACADEMY</span>
                </div>
                <span style={{ fontSize: '10px', color: '#60a5fa' }}>{isAcademyHubOpen ? '◀' : '▼'}</span>
              </button>

              {/* Flyout menu to the LEFT */}
              {isAcademyHubOpen && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 'calc(100% + 12px)',
                    background: 'rgba(10, 15, 26, 0.96)',
                    border: '1px solid rgba(59, 130, 246, 0.5)',
                    borderRadius: '12px',
                    padding: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    minWidth: '270px',
                    backdropFilter: 'blur(20px)',
                    boxShadow: '0 16px 40px rgba(0,0,0,0.9), 0 0 30px rgba(59, 130, 246, 0.35)',
                    zIndex: 100,
                    animation: 'characterSlideIn 0.2s ease-out',
                  }}
                >
                  <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: '#60a5fa', letterSpacing: '0.1em', fontWeight: 800, paddingBottom: '6px', borderBottom: '1px solid rgba(59, 130, 246, 0.2)', display: 'flex', justifyContent: 'space-between' }}>
                    <span>✦ CADET TRAINING ACADEMY</span>
                    <span style={{ cursor: 'pointer', color: '#94a3b8' }} onClick={() => setIsAcademyHubOpen(false)}>✕</span>
                  </div>
                  <button
                    className="pubg-hub-subitem"
                    onClick={() => { setIsAcademyHubOpen(false); handleNavClick(onOpenTrainingCenter || onOpenAcademy, 'chirp'); }}
                    style={{ border: '1px solid #00d2ff', background: 'rgba(0, 210, 255, 0.12)' }}
                  >
                    <span style={{ fontSize: '20px' }}>🏫</span>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontWeight: 800, color: '#00d2ff', fontSize: '12px' }}>3D Realistic Training Center</div>
                      <div style={{ fontSize: '10px', color: '#cbd5e1' }}>NBL Pool, ECLSS, 4.3 psi Suit, Habitat & Drills</div>
                    </div>
                  </button>
                  {onOpenAcademy && (
                    <button
                      className="pubg-hub-subitem"
                      onClick={() => { setIsAcademyHubOpen(false); handleNavClick(onOpenAcademy, 'chirp'); }}
                    >
                      <span style={{ fontSize: '20px' }}>🪖</span>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontWeight: 800, color: '#f8fafc', fontSize: '12px' }}>Astronaut Academy</div>
                        <div style={{ fontSize: '10px', color: '#94a3b8' }}>Rank Exams, Flight Certification</div>
                      </div>
                    </button>
                  )}
                  {onOpenClassroom && (
                    <button
                      className="pubg-hub-subitem"
                      onClick={() => { setIsAcademyHubOpen(false); handleNavClick(onOpenClassroom, 'chirp'); }}
                    >
                      <span style={{ fontSize: '20px' }}>🎓</span>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontWeight: 800, color: '#f8fafc', fontSize: '12px' }}>Ground School Classroom</div>
                        <div style={{ fontSize: '10px', color: '#94a3b8' }}>Educator Dossier & Gradebook</div>
                      </div>
                    </button>
                  )}
                  {onOpenLearningHub && (
                    <button
                      className="pubg-hub-subitem"
                      onClick={() => { setIsAcademyHubOpen(false); handleNavClick(() => onOpenLearningHub('NOTEBOOK'), 'chirp'); }}
                    >
                      <span style={{ fontSize: '20px' }}>📓</span>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontWeight: 800, color: '#f8fafc', fontSize: '12px' }}>Flight Notes & Journal</div>
                        <div style={{ fontSize: '10px', color: '#94a3b8' }}>Student Mission Debrief Logs</div>
                      </div>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* 4. Crew Locker & Lunar Depot Hub (Dropdown Menu) */}
            <div style={{ position: 'relative', width: '100%' }}>
              <button
                className={`pubg-bottom-tab ${isCrewHubOpen ? 'active' : ''}`}
                onClick={() => {
                  setIsCrewHubOpen(!isCrewHubOpen);
                  setIsSimsHubOpen(false);
                  setIsAcademyHubOpen(false);
                  soundFx.playClick(800);
                }}
                id="pubg-tab-crew-hub"
                style={{
                  borderColor: 'rgba(245, 158, 11, 0.65)',
                  background: 'linear-gradient(90deg, rgba(245, 158, 11, 0.22), rgba(15, 23, 42, 0.95))',
                  width: '100%',
                  boxSizing: 'border-box',
                  justifyContent: 'space-between',
                  padding: '7px 12px',
                  height: '38px',
                }}
                title="Open Crew Locker & Depot Hub"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '16px' }}>🧑‍🚀</span>
                  <span>CREW & DEPOT</span>
                </div>
                <span style={{ fontSize: '10px', color: '#fbbf24' }}>{isCrewHubOpen ? '◀' : '▼'}</span>
              </button>

              {/* Flyout menu to the LEFT */}
              {isCrewHubOpen && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 'calc(100% + 12px)',
                    background: 'rgba(10, 15, 26, 0.96)',
                    border: '1px solid rgba(245, 158, 11, 0.5)',
                    borderRadius: '12px',
                    padding: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    minWidth: '270px',
                    backdropFilter: 'blur(20px)',
                    boxShadow: '0 16px 40px rgba(0,0,0,0.9), 0 0 30px rgba(245, 158, 11, 0.35)',
                    zIndex: 100,
                    animation: 'characterSlideIn 0.2s ease-out',
                  }}
                >
                  <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: '#fbbf24', letterSpacing: '0.1em', fontWeight: 800, paddingBottom: '6px', borderBottom: '1px solid rgba(245, 158, 11, 0.2)', display: 'flex', justifyContent: 'space-between' }}>
                    <span>✦ CREW LOCKER & LUNAR DEPOT</span>
                    <span style={{ cursor: 'pointer', color: '#94a3b8' }} onClick={() => setIsCrewHubOpen(false)}>✕</span>
                  </div>
                  {onOpenCharacterLocker && (
                    <button
                      className="pubg-hub-subitem"
                      onClick={() => { setIsCrewHubOpen(false); handleNavClick(onOpenCharacterLocker, 'chirp'); }}
                    >
                      <span style={{ fontSize: '20px' }}>🧑‍🚀</span>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontWeight: 800, color: '#f8fafc', fontSize: '12px' }}>Astronaut Crew Locker</div>
                        <div style={{ fontSize: '10px', color: '#94a3b8' }}>Switch Characters, EVA Perks</div>
                      </div>
                    </button>
                  )}
                  {onOpenDepot && (
                    <button
                      className="pubg-hub-subitem"
                      onClick={() => { setIsCrewHubOpen(false); handleNavClick(onOpenDepot, 'chirp'); }}
                    >
                      <span style={{ fontSize: '20px' }}>🏗️</span>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontWeight: 800, color: '#f8fafc', fontSize: '12px' }}>3D Base Depot</div>
                        <div style={{ fontSize: '10px', color: '#94a3b8' }}>Inspect & Buy Lunar Hardware</div>
                      </div>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* 5. Science & Intel Dossier (Modal Toggle) */}
            <button
              className="pubg-bottom-tab"
              onClick={() => {
                setShowIntelDossier(true);
                soundFx.playClick(750);
              }}
              id="pubg-tab-dossier"
              style={{
                borderColor: 'rgba(0, 210, 255, 0.5)',
                color: '#00d2ff',
                width: '100%',
                boxSizing: 'border-box',
                justifyContent: 'flex-start',
                padding: '7px 12px',
                height: '38px',
                gap: '8px',
              }}
              title="Open NASA Open Science & Intel Dossier"
            >
              <span style={{ fontSize: '16px' }}>🔬</span>
              <span>SCIENCE DOSSIER</span>
            </button>

            {/* 6. Dedicated Mars Survival Operations Button */}
            {onOpenMarsSurvival && (
              <button
                className="pubg-bottom-tab"
                onClick={() => handleNavClick(onOpenMarsSurvival, 'reactor')}
                id="pubg-tab-mars-survival-ops"
                style={{
                  borderColor: '#ef4444',
                  background: 'linear-gradient(90deg, rgba(239, 68, 68, 0.35), rgba(15, 23, 42, 0.98))',
                  color: '#fca5a5',
                  width: '100%',
                  boxSizing: 'border-box',
                  justifyContent: 'space-between',
                  padding: '7px 12px',
                  height: '40px',
                  borderWidth: '1.5px',
                  boxShadow: '0 0 16px rgba(239, 68, 68, 0.35)',
                }}
                title="Launch NASA Mars Planetary Survival Operations (4 Missions)"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '16px' }}>🔴</span>
                  <span style={{ fontWeight: 900, color: '#ffffff', letterSpacing: '0.04em' }}>MARS SURVIVAL</span>
                </div>
                <span style={{ fontSize: '9px', background: '#ef4444', color: '#ffffff', fontWeight: 900, padding: '2px 6px', borderRadius: '4px' }}>
                  4 OPS
                </span>
              </button>
            )}

            {/* 7. Dedicated Hardcore Survival Mode Button */}
            {onOpenHardcoreSurvival && (
              <button
                className="pubg-bottom-tab"
                onClick={() => handleNavClick(onOpenHardcoreSurvival, 'reactor')}
                id="pubg-tab-hardcore-survival"
                style={{
                  borderColor: '#f97316',
                  background: 'linear-gradient(90deg, rgba(249, 115, 22, 0.38), rgba(15, 23, 42, 0.98))',
                  color: '#fed7aa',
                  width: '100%',
                  boxSizing: 'border-box',
                  justifyContent: 'space-between',
                  padding: '7px 12px',
                  height: '42px',
                  borderWidth: '1.5px',
                  boxShadow: '0 0 18px rgba(249, 115, 22, 0.4)',
                }}
                title="Launch 5 Hardcore Orbital Survival Missions (Kessler, Solar Storm, Apollo 13, Oberth, Suicide Burn)"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '18px' }}>🔥</span>
                  <span style={{ fontWeight: 900, color: '#ffffff', letterSpacing: '0.04em' }}>HARDCORE SURVIVAL</span>
                </div>
                <span style={{ fontSize: '9px', background: '#f97316', color: '#ffffff', fontWeight: 900, padding: '2px 6px', borderRadius: '4px' }}>
                  5 OPS
                </span>
              </button>
            )}

            {/* ── MASTER PUBG START BUTTON (DIRECTLY BELOW THE 5 HUBS) ── */}
            <button
              className="pubg-start-btn"
              onClick={handleStart}
              id="pubg-main-start-btn"
              title="Launch Selected Mission / Expedition"
              style={{
                width: '100%',
                height: '52px',
                fontSize: '22px',
                boxShadow: '0 0 32px rgba(255, 158, 27, 0.75), 0 6px 20px rgba(0,0,0,0.85)',
                margin: 0,
                marginTop: '4px',
                flexShrink: 0,
              }}
            >
              <span style={{ fontSize: '22px' }}>▶</span>
              <span>{hasSavedGame && selectedMatchMode === 'SOL1_SURVIVAL' ? 'CONTINUE' : 'START'}</span>
            </button>
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
      </main>
    </div>
  );
};
