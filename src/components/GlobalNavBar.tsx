import React, { useState } from 'react';
import type { AppRoute } from '../router/useAppRouter';
import type { User } from '../types/auth';
import { spaceMusicEngine } from '../utils/spaceMusicEngine';
import { soundFx } from '../utils/audioEffects';
import {
  Rocket,
  GraduationCap,
  Gamepad2,
  BookOpen,
  Volume2,
  VolumeX,
  ChevronDown,
  Award,
  Sliders,
  HelpCircle,
  School,
  User as UserIcon,
  Menu,
  X,
  Globe,
} from 'lucide-react';

export interface GlobalNavBarProps {
  currentRoute: AppRoute;
  onNavigate: (route: AppRoute, params?: Record<string, string>) => void;
  currentUser: User | null;
  onOpenAuth: () => void;
  onOpenSettings: () => void;
  onOpenHowToPlay: () => void;
  onOpenCertificate: () => void;
  isJudgeMode?: boolean;
  onOpenJudgePreview?: () => void;
  completedMissionsCount?: number;
  onOpenTelemetry?: () => void;
  onOpenPlanetaryMap?: () => void;
  onOpenNasaData?: () => void;
  onOpenAIDisclosure?: () => void;
  onOpenAbout?: () => void;
  onOpenMultiplayerLobby?: () => void;
}

export const GlobalNavBar: React.FC<GlobalNavBarProps> = ({
  currentRoute,
  onNavigate,
  currentUser,
  onOpenAuth,
  onOpenSettings,
  onOpenHowToPlay,
  onOpenCertificate,
}) => {
  const [isAudioMuted, setIsAudioMuted] = useState(() => spaceMusicEngine.getIsMuted());
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleNavClick = (route: AppRoute, params?: Record<string, string>) => {
    soundFx.playClick(750);
    onNavigate(route, params);
    setIsMoreOpen(false);
    setIsMobileMenuOpen(false);
  };

  const handleToggleAudio = () => {
    const muted = spaceMusicEngine.toggleMute();
    setIsAudioMuted(muted);
    soundFx.playClick(800);
  };

  return (
    <header
      className="global-aerospace-nav"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        background: 'rgba(3, 7, 18, 0.92)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #1e293b',
        height: 'var(--header-height, 56px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        userSelect: 'none',
        fontFamily: "'Fredoka', 'Baloo 2', system-ui, sans-serif",
      }}
    >
      {/* ── 1. LOGO CLUSTER ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <button
          onClick={() => handleNavClick('home')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            color: 'inherit',
          }}
          title="Jr_AstroCamp — Return to Home"
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #0b3d91, #1e3a8a)',
              border: '1px solid #38bdf8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 0 12px rgba(56, 189, 248, 0.4)',
            }}
          >
            <Rocket size={18} className="text-amber-400" />
          </div>
          <div style={{ textAlign: 'left' }}>
            <div
              style={{
                fontSize: '15px',
                fontWeight: 800,
                color: '#ffffff',
                lineHeight: 1.1,
                letterSpacing: '-0.01em',
              }}
            >
              Jr. AstroCamp
            </div>
            <div
              style={{
                fontSize: '10px',
                color: '#38bdf8',
                fontWeight: 700,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              NASA Space Apps 2026
            </div>
          </div>
        </button>

        {/* ── 2. PRIMARY NAV LINKS (Desktop) ── */}
        <nav
          className="global-nav-links"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          {/* PLAY / FLAGSHIP OUTPOST */}
          <button
            onClick={() => handleNavClick('mission')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '9999px',
              fontSize: '13px',
              fontWeight: 800,
              color: currentRoute === 'mission' ? '#ffffff' : '#f97316',
              background: currentRoute === 'mission' ? '#ea580c' : 'rgba(249, 115, 22, 0.14)',
              border: '1.5px solid rgba(249, 115, 22, 0.5)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <Rocket size={14} />
            <span>Play</span>
          </button>

          {/* LEARN */}
          <button
            onClick={() => handleNavClick('learning')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '9999px',
              fontSize: '13px',
              fontWeight: 700,
              color: currentRoute === 'learning' ? '#ffffff' : '#cbd5e1',
              background: currentRoute === 'learning' ? '#0284c7' : 'transparent',
              border: currentRoute === 'learning' ? '1.5px solid #38bdf8' : '1px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <BookOpen size={14} />
            <span>Learn</span>
          </button>

          {/* EXPLORE SPACE (DEDICATED 3D ORRERY) */}
          <button
            onClick={() => handleNavClick('explore')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '9999px',
              fontSize: '13px',
              fontWeight: 700,
              color: currentRoute === 'explore' ? '#ffffff' : '#cbd5e1',
              background: currentRoute === 'explore' ? '#0284c7' : 'transparent',
              border: currentRoute === 'explore' ? '1.5px solid #38bdf8' : '1px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <Globe size={14} />
            <span>Explore Space</span>
          </button>

          {/* MORE DROPDOWN */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setIsMoreOpen(!isMoreOpen)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 12px',
                borderRadius: '9999px',
                fontSize: '13px',
                fontWeight: 700,
                color: isMoreOpen ? '#38bdf8' : '#cbd5e1',
                background: isMoreOpen ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                border: isMoreOpen ? '1px solid #38bdf8' : '1px solid transparent',
                cursor: 'pointer',
              }}
            >
              <span>More</span>
              <ChevronDown size={14} />
            </button>

            {isMoreOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  left: 0,
                  width: '240px',
                  background: '#070d1e',
                  border: '1.5px solid #1e3a8a',
                  borderRadius: '14px',
                  padding: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  zIndex: 1000,
                  boxShadow: '0 20px 45px rgba(0,0,0,0.85)',
                }}
              >
                <button
                  onClick={() => handleNavClick('academy')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: 'transparent',
                    border: 'none',
                    color: '#f8fafc',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: '12.5px',
                    fontWeight: 700,
                  }}
                >
                  <GraduationCap size={15} className="text-cyan-400" />
                  <span>Cadet Academy</span>
                </button>

                <button
                  onClick={() => handleNavClick('simulators')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: 'transparent',
                    border: 'none',
                    color: '#f8fafc',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: '12.5px',
                    fontWeight: 700,
                  }}
                >
                  <Gamepad2 size={15} className="text-emerald-400" />
                  <span>Simulators</span>
                </button>

                <button
                  onClick={() => handleNavClick('learning', { tab: 'COMIC' })}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: 'transparent',
                    border: 'none',
                    color: '#f8fafc',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: '12.5px',
                    fontWeight: 700,
                  }}
                >
                  <BookOpen size={15} className="text-amber-400" />
                  <span>Hub &amp; Comics</span>
                </button>

                <button
                  onClick={() => handleNavClick('teacher')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: 'transparent',
                    border: 'none',
                    color: '#f8fafc',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: '12.5px',
                    fontWeight: 700,
                  }}
                >
                  <School size={15} className="text-pink-400" />
                  <span>Educators</span>
                </button>

                <div style={{ height: '1px', background: '#1e293b', margin: '4px 0' }} />

                <button
                  onClick={() => { setIsMoreOpen(false); onOpenSettings(); soundFx.playClick(700); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: 'transparent',
                    border: 'none',
                    color: '#cbd5e1',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                >
                  <Sliders size={14} />
                  <span>Settings</span>
                </button>

                <button
                  onClick={() => { setIsMoreOpen(false); onOpenCertificate(); soundFx.playVictory(); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: 'transparent',
                    border: 'none',
                    color: '#fbbf24',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                >
                  <Award size={14} />
                  <span>Certificate</span>
                </button>

                <button
                  onClick={() => { setIsMoreOpen(false); onOpenHowToPlay(); soundFx.playClick(700); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: 'transparent',
                    border: 'none',
                    color: '#38bdf8',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                >
                  <HelpCircle size={14} />
                  <span>Guide</span>
                </button>

                <div style={{ height: '1px', background: '#1e293b', margin: '4px 0' }} />

                <button
                  onClick={() => { setIsMoreOpen(false); onOpenAuth(); soundFx.playClick(750); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: 'rgba(56, 189, 248, 0.08)',
                    border: '1px solid rgba(56, 189, 248, 0.25)',
                    color: '#38bdf8',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: 700,
                  }}
                >
                  <UserIcon size={14} />
                  <span>{currentUser ? `@${currentUser.username}` : 'Cadet Login (Optional)'}</span>
                </button>
              </div>
            )}
          </div>
        </nav>
      </div>

      {/* ── 3. RIGHT AUDIO & MOBILE TOGGLE ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Sound Toggle */}
        <button
          onClick={handleToggleAudio}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            borderRadius: '9999px',
            background: isAudioMuted ? 'rgba(15, 23, 42, 0.6)' : 'rgba(56, 189, 248, 0.15)',
            border: isAudioMuted ? '1px solid #334155' : '1px solid #38bdf8',
            color: isAudioMuted ? '#94a3b8' : '#38bdf8',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 700,
            transition: 'all 0.15s ease',
          }}
          title={isAudioMuted ? 'Unmute Deep Space Audio' : 'Mute Deep Space Audio'}
        >
          {isAudioMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
          <span className="hidden sm:inline">{isAudioMuted ? 'Muted' : 'Sound ON'}</span>
        </button>

        {/* Mobile Hamburger */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          style={{
            display: 'none',
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            background: '#09122a',
            border: '1px solid #1e3a8a',
            color: '#ffffff',
            cursor: 'pointer',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          className="global-nav-hamburger"
          aria-label="Toggle navigation menu"
        >
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Slide-down Drawer */}
      {isMobileMenuOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            top: '56px',
            zIndex: 999,
            background: '#030712',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            overflowY: 'auto',
          }}
        >
          <button
            onClick={() => handleNavClick('mission')}
            style={{
              padding: '14px',
              borderRadius: '12px',
              background: '#ea580c',
              border: 'none',
              color: '#ffffff',
              fontSize: '15px',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
            }}
          >
            <Rocket size={18} />
            <span>Play: Build Outpost</span>
          </button>

          <button
            onClick={() => handleNavClick('explore')}
            style={{
              padding: '12px 14px',
              borderRadius: '12px',
              background: '#09122a',
              border: '1px solid #1e3a8a',
              color: '#38bdf8',
              fontSize: '14px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
            }}
          >
            <Globe size={18} />
            <span>Explore Space (3D Orrery)</span>
          </button>

          <button
            onClick={() => handleNavClick('learning')}
            style={{
              padding: '12px 14px',
              borderRadius: '12px',
              background: '#09122a',
              border: '1px solid #1e3a8a',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
            }}
          >
            <BookOpen size={18} />
            <span>Learn: Hub &amp; Comics</span>
          </button>

          <button
            onClick={() => handleNavClick('academy')}
            style={{
              padding: '12px 14px',
              borderRadius: '12px',
              background: '#09122a',
              border: '1px solid #1e3a8a',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
            }}
          >
            <GraduationCap size={18} />
            <span>Cadet Academy</span>
          </button>

          <button
            onClick={() => handleNavClick('simulators')}
            style={{
              padding: '12px 14px',
              borderRadius: '12px',
              background: '#09122a',
              border: '1px solid #1e3a8a',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
            }}
          >
            <Gamepad2 size={18} />
            <span>Simulators</span>
          </button>

          <button
            onClick={() => handleNavClick('teacher')}
            style={{
              padding: '12px 14px',
              borderRadius: '12px',
              background: '#09122a',
              border: '1px solid #1e3a8a',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
            }}
          >
            <School size={18} />
            <span>Educators</span>
          </button>

          <div style={{ height: '1px', background: '#1e293b', margin: '8px 0' }} />

          <button
            onClick={() => { setIsMobileMenuOpen(false); onOpenHowToPlay(); }}
            style={{
              padding: '12px 14px',
              borderRadius: '12px',
              background: 'transparent',
              border: '1px solid #334155',
              color: '#cbd5e1',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            ❓ 30-Sec Guide
          </button>

          <button
            onClick={() => { setIsMobileMenuOpen(false); onOpenCertificate(); }}
            style={{
              padding: '12px 14px',
              borderRadius: '12px',
              background: 'transparent',
              border: '1px solid #334155',
              color: '#fbbf24',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            📜 Flight Certificate
          </button>

          <button
            onClick={() => { setIsMobileMenuOpen(false); onOpenAuth(); }}
            style={{
              padding: '12px 14px',
              borderRadius: '12px',
              background: 'rgba(56, 189, 248, 0.1)',
              border: '1px solid #0284c7',
              color: '#38bdf8',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            🧑‍🚀 {currentUser ? `@${currentUser.username}` : 'Cadet Login (Optional)'}
          </button>
        </div>
      )}
    </header>
  );
};

export default GlobalNavBar;
