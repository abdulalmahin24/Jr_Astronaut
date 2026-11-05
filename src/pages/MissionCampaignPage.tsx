import React from 'react';
import type { AppRoute } from '../router/useAppRouter';
import { MissionCampaignMap } from '../components/MissionCampaignMap';
import { MISSION_GAME_DATA } from '../game/missionGameData';
import { Trophy, Rocket, Sparkles, CheckCircle2 } from 'lucide-react';
import { soundFx } from '../utils/audioEffects';

export interface MissionCampaignPageProps {
  completedMissions: string[];
  onLaunchMission: (missionId: string) => void;
  onNavigate: (route: AppRoute, params?: Record<string, string>) => void;
}

export const MissionCampaignPage: React.FC<MissionCampaignPageProps> = ({
  completedMissions,
  onLaunchMission,
  onNavigate,
}) => {
  const completionPct = Math.round((completedMissions.length / MISSION_GAME_DATA.length) * 100);

  return (
    <div className="page-mission-campaign" style={{
      minHeight: 'calc(100dvh - 52px)',
      background: 'var(--color-paper)',
      color: 'var(--color-ink)',
      padding: '20px 24px 60px',
    }}>
      <div style={{ maxWidth: '1440px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Header Hero Banner */}
        <div style={{
          background: 'var(--color-paper-2)',
          border: 'var(--rule-hair) solid var(--color-rule)',
          borderRadius: 'var(--radius-card)',
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}>
          <div>
            <div style={{
              fontSize: '11px',
              fontFamily: 'var(--font-body)',
              fontWeight: 600,
              letterSpacing: 'normal',
              color: 'var(--color-accent-2)',
            }}>
              Team Mysterio • NASA Historical Campaign 1961 — Present
            </div>
            <h1 style={{ fontSize: '20px', fontWeight: 700, margin: '2px 0 0', color: 'var(--color-ink)', fontFamily: 'var(--font-display)' }}>
              Earth to Deep Space · 76 Playable NASA Missions
            </h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {/* Progress Badge */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '6px 14px',
              borderRadius: 'var(--radius-card)',
              background: 'var(--color-paper-card)',
              border: 'var(--rule-hair) solid var(--color-rule)',
            }}>
              <Trophy size={16} style={{ color: 'var(--color-accent)' }} />
              <div>
                <div style={{ fontSize: '10px', color: 'var(--color-accent)', fontWeight: 700, fontFamily: 'var(--font-body)' }}>
                  Campaign Progress
                </div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-ink)', fontFamily: 'var(--font-outlier)' }}>
                  {completedMissions.length} / {MISSION_GAME_DATA.length} Completed ({completionPct}%)
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                onNavigate('academy');
                soundFx.playClick(750);
              }}
              style={{
                padding: '8px 16px',
                borderRadius: 'var(--radius-card)',
                background: 'var(--color-accent)',
                border: '1px solid var(--color-accent)',
                color: 'var(--color-accent-ink)',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Ground School Academy
            </button>
          </div>
        </div>

        {/* Campaign Map Component */}
        <div style={{
          background: 'rgba(7, 12, 22, 0.85)',
          border: '1px solid rgba(56, 189, 248, 0.2)',
          borderRadius: '8px',
          padding: '16px',
        }}>
          <MissionCampaignMap
            completedMissions={completedMissions}
            onLaunchMission={onLaunchMission}
          />
        </div>
      </div>
    </div>
  );
};

export default MissionCampaignPage;
