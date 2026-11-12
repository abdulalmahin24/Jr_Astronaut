// ============================================================
// MissionCampaignModal — NASA Campaign Map Modal (Glassmorphic Design)
// Earth-to-Space 76 Mission Interactive Selection Hub
// ============================================================
import React from 'react';
import { X, Rocket, Trophy, Sparkles } from 'lucide-react';
import { MissionCampaignMap } from './MissionCampaignMap';
import { MISSION_GAME_DATA } from '../game/missionGameData';

interface MissionCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  completedMissions: string[];
  onLaunchMission: (missionId: string) => void;
  onOpenMoonquakeMap?: () => void;
  onOpenMarsSurvival?: () => void;
}

export const MissionCampaignModal: React.FC<MissionCampaignModalProps> = ({
  isOpen,
  onClose,
  completedMissions,
  onLaunchMission,
  onOpenMoonquakeMap,
  onOpenMarsSurvival,
}) => {
  if (!isOpen) return null;

  const completionPct = Math.round((completedMissions.length / MISSION_GAME_DATA.length) * 100);

  return (
    <div className="flight-modal-backdrop" onClick={onClose}>
      <div
        className="flight-modal-container"
        style={{ maxWidth: '1100px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flight-modal-header">
          <div className="flight-header-left">
            <div className="flight-type-badge-icon" style={{ background: 'rgba(6,182,212,0.15)', borderColor: 'rgba(6,182,212,0.4)' }}>
              <Rocket size={20} className="text-cyan-400" />
            </div>
            <div>
              <div className="flight-header-meta">
                <span>TEAM MYSTERIO • NASA HISTORICAL CAMPAIGN</span>
                <span className="flight-program-pill">1961 — PRESENT</span>
              </div>
              <h2 className="flight-mission-title">
                Earth to Deep Space · 76 Playable Missions
              </h2>
            </div>
          </div>

          <div className="flight-header-actions">
            {/* Campaign completion badge */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px 14px',
              background: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: '10px',
            }}>
              <Trophy size={16} style={{ color: '#fbbf24' }} />
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', fontWeight: 800, color: '#fbbf24', lineHeight: 1 }}>
                  {completedMissions.length}
                  <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 400, marginLeft: '4px' }}>/ 76 (+4 Endgame)</span>
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#34d399', fontWeight: 700 }}>
                  {completionPct}% COMPLETE
                </div>
              </div>
            </div>

            {onOpenMoonquakeMap && (
              <button
                onClick={() => {
                  onOpenMoonquakeMap();
                  onClose();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 14px',
                  background: 'rgba(245, 158, 11, 0.15)',
                  border: '1px solid rgba(245, 158, 11, 0.4)',
                  borderRadius: '10px',
                  color: '#fbbf24',
                  fontSize: '11px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-mono)',
                }}
                title="Inspect Authentic 3D Moonquake Seismic Globe"
              >
                <span>🌕</span>
                <span>3D MOONQUAKE GLOBE</span>
              </button>
            )}

            {onOpenMarsSurvival && (
              <button
                onClick={() => {
                  onClose();
                  onOpenMarsSurvival();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 14px',
                  background: 'linear-gradient(90deg, rgba(239, 68, 68, 0.25), rgba(15, 23, 42, 0.9))',
                  border: '1px solid #ef4444',
                  borderRadius: '10px',
                  color: '#fca5a5',
                  fontSize: '11px',
                  fontWeight: 900,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-mono)',
                  boxShadow: '0 0 12px rgba(239, 68, 68, 0.4)',
                }}
                title="Launch 4 NASA Mars Planetary Survival Operations"
              >
                <span>🔴</span>
                <span>4 MARS SURVIVAL OPS</span>
              </button>
            )}

            <button onClick={onClose} className="flight-close-btn" aria-label="Close">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* STEM Banner */}
        <div style={{
          padding: '10px 24px',
          background: 'linear-gradient(90deg, rgba(88,28,135,0.35) 0%, rgba(13,20,36,0.6) 100%)',
          borderBottom: '1px solid rgba(167,139,250,0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontFamily: 'var(--font-mono)',
          fontSize: '12px',
          color: '#c084fc',
        }}>
          <Sparkles size={14} />
          <span>
            Each mission teaches real <strong style={{ color: '#ffffff' }}>aerospace STEM concepts</strong>:
            orbital mechanics · rocket equations · landing physics · regolith friction · optical diffraction · gravity assists
          </span>
        </div>

        {/* Mars Survival Suite Banner */}
        {onOpenMarsSurvival && (
          <div style={{
            margin: '14px 24px 0 24px',
            padding: '12px 18px',
            background: 'linear-gradient(90deg, rgba(239, 68, 68, 0.25) 0%, rgba(15, 23, 42, 0.9) 100%)',
            border: '1px solid rgba(239, 68, 68, 0.5)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            boxShadow: '0 4px 20px rgba(239, 68, 68, 0.2)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '24px' }}>🔴</span>
              <div>
                <div style={{ fontWeight: 900, fontSize: '13px', color: '#fca5a5', fontFamily: 'var(--font-space)' }}>
                  SPECIAL OPERATIONS: 4 NASA MARS PLANETARY SURVIVAL MISSIONS
                </div>
                <div style={{ fontSize: '11px', color: '#cbd5e1', fontFamily: 'var(--font-mono)' }}>
                  Jezero MOXIE O₂ Extraction • Gale REMS Dust Storm • Valles Marineris Ice Core • Elysium Quake
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                onClose();
                onOpenMarsSurvival();
              }}
              style={{
                padding: '8px 16px',
                background: '#ef4444',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 900,
                fontSize: '11px',
                cursor: 'pointer',
                fontFamily: 'var(--font-mono)',
                whiteSpace: 'nowrap',
                boxShadow: '0 0 12px rgba(239, 68, 68, 0.6)',
              }}
            >
              LAUNCH OPS ▶
            </button>
          </div>
        )}

        {/* Scrollable Map Container */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
          <MissionCampaignMap
            completedMissions={completedMissions}
            onLaunchMission={(id) => {
              onLaunchMission(id);
              onClose();
            }}
            onClose={onClose}
          />
        </div>

        <div className="flight-footer-bar">
          <span>TEAM MYSTERIO • 76 HISTORICAL NASA MISSIONS • MERCURY TO ARTEMIS III</span>
          <span>Click any mission card to see the Flight Briefing + STEM Lesson</span>
        </div>
      </div>
    </div>
  );
};
