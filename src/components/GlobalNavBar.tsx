import React, { useState } from 'react';
import type { AppRoute } from '../router/useAppRouter';
import type { User } from '../types/auth';
import { spaceMusicEngine } from '../utils/spaceMusicEngine';
import { soundFx } from '../utils/audioEffects';
import {
  Compass,
  Rocket,
  GraduationCap,
  Gamepad2,
  BookOpen,
  Users,
  Volume2,
  VolumeX,
  Sliders,
  Award,
  Eye,
  Menu,
  X,
  ShieldCheck,
  Zap,
  Activity,
  Layers,
} from 'lucide-react';

export interface GlobalNavBarProps {
  currentRoute: AppRoute;
  onNavigate: (route: AppRoute, params?: Record<string, string>) => void;
  currentUser: User | null;
  onOpenAuth: () => void;
  onOpenSettings: () => void;
  onOpenHowToPlay: () => void;
  onOpenCertificate: () => void;
  isJudgeMode: boolean;
  onOpenJudgePreview: () => void;
  completedMissionsCount: number;
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
  isJudgeMode,
  onOpenJudgePreview,
  completedMissionsCount,
  onOpenTelemetry,
  onOpenPlanetaryMap,
  onOpenNasaData,
  onOpenAIDisclosure,
  onOpenAbout,
  onOpenMultiplayerLobby,
}) => {
  const [isAudioMuted, setIsAudioMuted] = useState(() => spaceMusicEngine.getIsMuted());
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isToolsDropdownOpen, setIsToolsDropdownOpen] = useState(false);

  const navLinks: { route: AppRoute; label: string; icon: React.ReactNode; badge?: string }[] = [
    { route: 'home', label: 'Home', icon: <Compass size={14} /> },
    { route: 'academy', label: 'Cadet Academy', icon: <GraduationCap size={14} /> },
    { route: 'simulators', label: 'Simulators', icon: <Gamepad2 size={14} /> },
    { route: 'campaign', label: '76 Missions', icon: <Zap size={14} />, badge: `${completedMissionsCount}/76` },
    { route: 'learning', label: 'Comics & Hub', icon: <BookOpen size={14} /> },
    { route: 'teacher', label: 'Educators', icon: <Users size={14} /> },
  ];

  const handleNavClick = (route: AppRoute) => {
    soundFx.playClick(750);
    onNavigate(route);
    setIsMobileMenuOpen(false);
  };

  const handleToggleAudio = () => {
    const muted = spaceMusicEngine.toggleMute();
    setIsAudioMuted(muted);
    soundFx.playClick(800);
  };

  return (
    <header className="global-aerospace-nav" style={{
      position: 'sticky',
      top: 0,
      zIndex: 999,
      background: 'var(--color-paper-alpha)',
      borderBottom: 'var(--rule-hair) solid var(--color-rule)',
      height: '52px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 16px',
      userSelect: 'none',
    }}>
      {/* Brand Cluster */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button
          onClick={() => handleNavClick('home')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            color: 'inherit',
          }}
          title="Return to Solar System Orrery Home"
        >
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: 'var(--radius-card)',
            background: 'var(--color-paper-2)',
            border: 'var(--rule-hair) solid var(--color-rule)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <svg width="20" height="20" viewBox="0 0 100 100" fill="none">
              <circle cx="50" cy="50" r="48" fill="#0B3D91" />
              <path d="M18 64 Q50 20 82 64 Q50 48 18 64Z" fill="#E03C31" />
              <ellipse cx="50" cy="50" rx="38" ry="12" stroke="#ffffff" strokeWidth="3" fill="none" transform="rotate(-25 50 50)" />
              <circle cx="34" cy="36" r="3.5" fill="#ffffff" />
              <circle cx="68" cy="42" r="3" fill="#ffffff" />
              <circle cx="54" cy="62" r="2.5" fill="#ffffff" />
            </svg>
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: '13px',
              letterSpacing: 'normal',
              color: 'var(--color-ink)',
              lineHeight: 1.1,
            }}>
              Jr_AstroCamp
            </div>
            <div style={{
              fontFamily: 'var(--font-body)',
              fontSize: '10px',
              color: 'var(--color-accent-2)',
              letterSpacing: 'normal',
              fontWeight: 500,
            }}>
              NASA Space Apps 2026
            </div>
          </div>
        </button>
      </div>

      {/* Center Navigation Links (Desktop) */}
      <nav className="global-nav-links" style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
      }}>
        {navLinks.map((link) => {
          const isActive = currentRoute === link.route;
          return (
            <button
              key={link.route}
              onClick={() => handleNavClick(link.route)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: 'var(--radius-card)',
                fontSize: '11.5px',
                fontWeight: isActive ? 700 : 500,
                color: isActive ? 'var(--color-accent-ink)' : 'var(--color-muted)',
                background: isActive ? 'var(--color-accent)' : 'transparent',
                border: isActive ? '1px solid var(--color-accent)' : '1px solid transparent',
                cursor: 'pointer',
                transition: 'opacity 0.15s ease, background-color 0.15s ease, border-color 0.15s ease',
                position: 'relative',
              }}
              className="global-nav-link-btn"
            >
              <span style={{ color: isActive ? 'var(--color-accent-ink)' : 'var(--color-accent-2)' }}>{link.icon}</span>
              <span>{link.label}</span>
              {link.badge && (
                <span style={{
                  fontSize: '9.5px',
                  fontWeight: 700,
                  padding: '2px 6px',
                  borderRadius: 'var(--radius-pill)',
                  background: isActive ? 'var(--color-accent-ink)' : 'var(--color-paper-card)',
                  color: isActive ? 'var(--color-accent)' : 'var(--color-ink)',
                  border: '1px solid var(--color-rule)',
                }}>
                  {link.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Right Utility Cluster */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Co-Op Multiplayer Bridge */}
        {onOpenMultiplayerLobby && (
          <button
            onClick={() => { onOpenMultiplayerLobby(); soundFx.playClick(1000); }}
            style={{
              padding: '4px 10px',
              borderRadius: 'var(--radius-card)',
              background: 'rgba(34, 197, 94, 0.12)',
              border: '1px solid var(--color-accent-green)',
              color: 'var(--color-accent-green)',
              fontSize: '11px',
              fontWeight: 800,
              fontFamily: 'var(--font-mono)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            }}
            title="NASA Co-Op Multiplayer Bridge & 2-Player Split-Screen Ready Room"
          >
            <Users size={13} />
            <span>CO-OP</span>
          </button>
        )}

        {/* Judge Mode indicator */}
        {isJudgeMode && (
          <button
            onClick={() => { onOpenJudgePreview(); soundFx.playClick(900); }}
            style={{
              padding: '4px 8px',
              borderRadius: 'var(--radius-card)',
              background: 'var(--color-paper-card)',
              border: 'var(--rule-hair) solid var(--color-accent-amber)',
              color: 'var(--color-accent-amber)',
              fontSize: '10.5px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
            className="global-nav-judge-btn"
            title="NASA Space Apps Judge Preview Mode"
          >
            <Eye size={12} />
            <span>Judge Mode</span>
          </button>
        )}

        {/* Audio Ambience Toggle */}
        <button
          onClick={handleToggleAudio}
          style={{
            width: '32px',
            height: '32px',
            borderRadius: 'var(--radius-card)',
            border: isAudioMuted ? 'var(--rule-hair) solid var(--color-rule)' : 'var(--rule-hair) solid var(--color-rule-highlight)',
            background: isAudioMuted ? 'var(--color-paper-2)' : 'var(--color-accent-2-alpha)',
            color: isAudioMuted ? 'var(--color-muted)' : 'var(--color-accent-2)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title={isAudioMuted ? 'Unmute Deep Space Audio' : 'Mute Deep Space Audio'}
        >
          {isAudioMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
        </button>

        {/* Field Guide / Help */}
        <button
          onClick={() => { onOpenHowToPlay(); soundFx.playClick(700); }}
          style={{
            width: '32px',
            height: '32px',
            borderRadius: 'var(--radius-card)',
            border: 'var(--rule-hair) solid var(--color-rule)',
            background: 'var(--color-paper-2)',
            color: 'var(--color-ink)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          className="global-nav-desktop-tool"
          title="Field Survival Guide"
        >
          <BookOpen size={14} />
        </button>

        {/* Flight Certificate */}
        <button
          onClick={() => { onOpenCertificate(); soundFx.playVictory(); }}
          style={{
            width: '32px',
            height: '32px',
            borderRadius: 'var(--radius-card)',
            border: 'var(--rule-hair) solid var(--color-rule)',
            background: 'var(--color-paper-2)',
            color: 'var(--color-accent)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          className="global-nav-desktop-tool"
          title="Astronaut Flight Certificate"
        >
          <Award size={14} />
        </button>

        {/* Settings */}
        <button
          onClick={() => { onOpenSettings(); soundFx.playClick(700); }}
          style={{
            width: '32px',
            height: '32px',
            borderRadius: 'var(--radius-card)',
            border: 'var(--rule-hair) solid var(--color-rule)',
            background: 'var(--color-paper-2)',
            color: 'var(--color-ink)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          className="global-nav-desktop-tool"
          title="System Settings"
        >
          <Sliders size={14} />
        </button>

        {/* Science & Telemetry Panels Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => { setIsToolsDropdownOpen(!isToolsDropdownOpen); soundFx.playClick(750); }}
            style={{
              padding: '5px 10px',
              borderRadius: 'var(--radius-card)',
              border: isToolsDropdownOpen ? 'var(--rule-hair) solid var(--color-accent-2)' : 'var(--rule-hair) solid var(--color-rule)',
              background: isToolsDropdownOpen ? 'var(--color-accent-2-alpha)' : 'var(--color-paper-2)',
              color: isToolsDropdownOpen ? 'var(--color-accent-2)' : 'var(--color-ink)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '11px',
              fontWeight: 700,
            }}
            className="global-nav-desktop-tool"
            title="Access NASA Panels: Telemetry, Targets Map, Data Sources & AI Disclosures"
          >
            <Activity size={14} />
            <span>Panels</span>
          </button>

          {isToolsDropdownOpen && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: '240px',
                background: 'var(--color-paper-2)',
                border: 'var(--rule-hair) solid var(--color-rule)',
                borderRadius: 'var(--radius-card)',
                padding: '6px',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
                zIndex: 1000,
              }}
            >
              {onOpenTelemetry && (
                <button
                  onClick={() => { setIsToolsDropdownOpen(false); onOpenTelemetry(); soundFx.playTelemetryChirp(); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', borderRadius: 'var(--radius-card)', background: 'transparent', border: 'none', color: 'var(--color-success)', cursor: 'pointer', textAlign: 'left', fontSize: '11.5px', fontWeight: 600 }}
                >
                  <Zap size={14} />
                  <span>Live NASA Telemetry</span>
                </button>
              )}
              {onOpenPlanetaryMap && (
                <button
                  onClick={() => { setIsToolsDropdownOpen(false); onOpenPlanetaryMap(); soundFx.playClick(800); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', borderRadius: 'var(--radius-card)', background: 'transparent', border: 'none', color: 'var(--color-accent-2)', cursor: 'pointer', textAlign: 'left', fontSize: '11.5px', fontWeight: 600 }}
                >
                  <Compass size={14} />
                  <span>Target Command Map</span>
                </button>
              )}
              {onOpenNasaData && (
                <button
                  onClick={() => { setIsToolsDropdownOpen(false); onOpenNasaData(); soundFx.playClick(750); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', borderRadius: 'var(--radius-card)', background: 'transparent', border: 'none', color: 'var(--color-ink)', cursor: 'pointer', textAlign: 'left', fontSize: '11.5px', fontWeight: 600 }}
                >
                  <Rocket size={14} />
                  <span>NASA Data Sources</span>
                </button>
              )}
              {onOpenAIDisclosure && (
                <button
                  onClick={() => { setIsToolsDropdownOpen(false); onOpenAIDisclosure(); soundFx.playClick(750); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', borderRadius: 'var(--radius-card)', background: 'transparent', border: 'none', color: 'var(--color-muted)', cursor: 'pointer', textAlign: 'left', fontSize: '11.5px', fontWeight: 600 }}
                >
                  <ShieldCheck size={14} />
                  <span>AI Disclosure</span>
                </button>
              )}
              {onOpenAbout && (
                <button
                  onClick={() => { setIsToolsDropdownOpen(false); onOpenAbout(); soundFx.playClick(750); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', borderRadius: 'var(--radius-card)', background: 'transparent', border: 'none', color: 'var(--color-muted)', cursor: 'pointer', textAlign: 'left', fontSize: '11.5px', fontWeight: 600 }}
                >
                  <Users size={14} />
                  <span>About Team Mysterio</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Cadet User Profile Pill */}
        <button
          onClick={() => { onOpenAuth(); soundFx.playClick(800); }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: 'var(--radius-card)',
            background: 'var(--color-paper-2)',
            border: 'var(--rule-hair) solid var(--color-rule)',
            color: 'var(--color-ink)',
            cursor: 'pointer',
            fontSize: '11px',
            fontWeight: 700,
          }}
          title={currentUser ? `Cadet @${currentUser.username}` : 'Cadet Log In / Character Locker'}
        >
          <span style={{ fontSize: '13px' }}>{currentUser?.avatar || '🧑‍🚀'}</span>
          <span style={{ maxWidth: '90px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {currentUser ? `@${currentUser.username}` : 'Cadet Login'}
          </span>
        </button>

        {/* Mobile Hamburger Trigger */}
        <button
          onClick={() => { setIsMobileMenuOpen(!isMobileMenuOpen); soundFx.playClick(750); }}
          style={{
            display: 'none',
            width: '32px',
            height: '32px',
            borderRadius: 'var(--radius-card)',
            border: 'var(--rule-hair) solid var(--color-rule)',
            background: 'var(--color-paper-2)',
            color: 'var(--color-ink)',
            cursor: 'pointer',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          className="global-nav-hamburger"
          aria-label="Toggle mobile navigation menu"
        >
          {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* Mobile Slide-in Drawer */}
      {isMobileMenuOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            top: '52px',
            zIndex: 998,
            background: 'var(--color-paper-2)',
            borderTop: 'var(--rule-hair) solid var(--color-rule)',
            display: 'flex',
            flexDirection: 'column',
            padding: '16px',
            gap: '8px',
            overflowY: 'auto',
          }}
        >
          <div style={{
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: 'normal',
            color: 'var(--color-accent-2)',
            fontFamily: 'var(--font-body)',
            marginBottom: '4px',
          }}>
            Flight Sectors
          </div>

          {navLinks.map((link) => {
            const isActive = currentRoute === link.route;
            return (
              <button
                key={link.route}
                onClick={() => handleNavClick(link.route)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-card)',
                  fontSize: '13px',
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? 'var(--color-accent-ink)' : 'var(--color-ink)',
                  background: isActive ? 'var(--color-accent)' : 'transparent',
                  border: isActive ? '1px solid var(--color-accent)' : '1px solid var(--color-rule)',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ color: isActive ? 'var(--color-accent-ink)' : 'var(--color-accent-2)' }}>{link.icon}</span>
                  <span>{link.label}</span>
                </div>
                {link.badge && (
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '2px 7px',
                    borderRadius: 'var(--radius-pill)',
                    background: isActive ? 'var(--color-accent-ink)' : 'var(--color-paper-card)',
                    color: isActive ? 'var(--color-accent)' : 'var(--color-ink)',
                    border: '1px solid var(--color-rule)',
                  }}>
                    {link.badge}
                  </span>
                )}
              </button>
            );
          })}

          <div style={{ height: '1px', background: 'var(--color-rule)', margin: '8px 0' }} />

          <div style={{
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: 'normal',
            color: 'var(--color-muted)',
            fontFamily: 'var(--font-body)',
            marginBottom: '4px',
          }}>
            Quick Tools
          </div>

          <button
            onClick={() => { onOpenHowToPlay(); setIsMobileMenuOpen(false); soundFx.playClick(700); }}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px',
              borderRadius: 'var(--radius-card)', fontSize: '12px', fontWeight: 600, color: 'var(--color-ink)',
              background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left',
            }}
          >
            <BookOpen size={16} /><span>Field Survival Guide</span>
          </button>

          <button
            onClick={() => { onOpenCertificate(); setIsMobileMenuOpen(false); soundFx.playVictory(); }}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px',
              borderRadius: 'var(--radius-card)', fontSize: '12px', fontWeight: 600, color: 'var(--color-accent)',
              background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left',
            }}
          >
            <Award size={16} /><span>Flight Certificate</span>
          </button>

          <button
            onClick={() => { onOpenSettings(); setIsMobileMenuOpen(false); soundFx.playClick(700); }}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px',
              borderRadius: 'var(--radius-card)', fontSize: '12px', fontWeight: 600, color: 'var(--color-ink)',
              background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left',
            }}
          >
            <Sliders size={16} /><span>System Settings</span>
          </button>
        </div>
      )}
    </header>
  );
};
