import React, { useState } from 'react';
import type { ResourceState, DifficultyMode } from '../types/game';
import { TIER_PROFILES } from '../data/difficultyTiers';
import { Zap, Droplets, Wind, Apple, ShieldCheck, Award, HeartPulse, Sparkles } from 'lucide-react';
import { soundFx } from '../utils/audioEffects';

interface ResourceHUDProps {
  sol: number;
  totalSols: number;
  resources: ResourceState;
  difficultyMode: DifficultyMode;
  onSelectDifficulty?: (mode: DifficultyMode) => void;
  onToggleDifficulty?: () => void;
}

export const ResourceHUD: React.FC<ResourceHUDProps> = ({
  sol,
  totalSols,
  resources,
  difficultyMode,
  onSelectDifficulty,
}) => {
  const currentTier = TIER_PROFILES[difficultyMode] || TIER_PROFILES.CADET;
  const isDefaultKidMode = difficultyMode === 'EXPLORER' || difficultyMode === 'CADET';
  const [kidFriendlyView, setKidFriendlyView] = useState<boolean>(isDefaultKidMode);

  const getMeterColor = (val: number, isReverse = false) => {
    if (isReverse) {
      if (val > 60) return '#ef4444'; // Red for high radiation
      if (val > 30) return '#f59e0b'; // Amber
      return '#34d399'; // Safe Green
    }
    if (val < 25) return '#ef4444'; // Danger
    if (val < 50) return '#f59e0b'; // Caution
    return '#34d399'; // Nominal
  };

  const getMeterStatusText = (val: number, type: 'energy' | 'water' | 'air' | 'food' | 'shield' | 'health') => {
    if (type === 'shield') {
      if (val > 40) return '⚠️ High Rays';
      if (val > 20) return '🛡️ Shielded';
      return '✅ 100% Safe';
    }
    if (val >= 75) return 'Great!';
    if (val >= 40) return 'Good';
    if (val >= 25) return 'Low';
    return 'Critical!';
  };

  const primaryTiers: { id: DifficultyMode; label: string; age: string; emoji: string }[] = [
    { id: 'EXPLORER', label: 'Junior Explorer', age: 'Ages 3–7', emoji: '🧒' },
    { id: 'CADET', label: 'Space Cadet', age: 'Ages 8–12', emoji: '🚀' },
    { id: 'COMMANDER', label: 'Mission Commander', age: 'Ages 13+', emoji: '🛰️' },
  ];

  return (
    <div className="hud-container" style={{
      background: 'linear-gradient(180deg, rgba(14, 20, 30, 0.95) 0%, rgba(9, 13, 20, 0.98) 100%)',
      borderRadius: '12px',
      border: '1px solid rgba(148, 163, 184, 0.18)',
      boxShadow: '0 12px 36px rgba(0, 0, 0, 0.65)',
      padding: '16px 20px',
    }}>
      {/* ── TOP HEADER: Sol Progress & Age Selector ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '14px',
        paddingBottom: '12px',
        borderBottom: '1px solid rgba(148, 163, 184, 0.14)',
      }}>
        {/* Outpost Day / Sol Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            background: 'rgba(15, 23, 42, 0.85)',
            border: '1px solid rgba(245, 158, 11, 0.35)',
            borderRadius: '8px',
            padding: '6px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
          }}>
            <span style={{ fontSize: '15px' }}>🌕</span>
            <div>
              <span style={{ fontSize: '12px', fontWeight: 900, color: '#f8fafc', fontFamily: 'var(--font-mono)' }}>
                DAY {sol} OF {totalSols}
              </span>
              <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block', margin: 0 }}>
                Moon Outpost · Shackleton Rim
              </span>
            </div>
          </div>
        </div>

        {/* Center: Kid Friendly vs NASA Pro View Mode Toggle */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          background: 'rgba(11, 16, 24, 0.9)',
          padding: '3px',
          borderRadius: '8px',
          border: '1px solid rgba(148, 163, 184, 0.2)',
        }}>
          <button
            onClick={() => { setKidFriendlyView(true); soundFx.playClick(850); }}
            style={{
              padding: '5px 12px',
              borderRadius: '6px',
              border: 'none',
              background: kidFriendlyView ? 'linear-gradient(180deg, #334155, #1e293b)' : 'transparent',
              color: kidFriendlyView ? '#ffffff' : '#94a3b8',
              fontSize: '11px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              transition: 'all 0.15s',
              boxShadow: kidFriendlyView ? '0 2px 6px rgba(0,0,0,0.4)' : 'none',
            }}
          >
            <Sparkles size={12} />
            <span>🧒 Kid-Friendly View</span>
          </button>
          <button
            onClick={() => { setKidFriendlyView(false); soundFx.playClick(750); }}
            style={{
              padding: '5px 12px',
              borderRadius: '6px',
              border: 'none',
              background: !kidFriendlyView ? 'linear-gradient(180deg, #334155, #1e293b)' : 'transparent',
              color: !kidFriendlyView ? '#ffffff' : '#94a3b8',
              fontSize: '11px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              transition: 'all 0.15s',
              boxShadow: !kidFriendlyView ? '0 2px 6px rgba(0,0,0,0.4)' : 'none',
            }}
          >
            <span>🔬 NASA Pro Units</span>
          </button>
        </div>

        {/* Right: Clean 3-Tier Age Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
            Age Mode:
          </span>
          {primaryTiers.map((t) => {
            const active = difficultyMode === t.id;
            return (
              <button
                key={t.id}
                onClick={() => {
                  if (onSelectDifficulty) onSelectDifficulty(t.id);
                  if (t.id === 'EXPLORER' || t.id === 'CADET') setKidFriendlyView(true);
                  soundFx.playClick(800);
                }}
                style={{
                  padding: '5px 10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: active ? '1px solid #f59e0b' : '1px solid rgba(148, 163, 184, 0.18)',
                  background: active ? 'rgba(245, 158, 11, 0.16)' : 'rgba(15, 23, 42, 0.7)',
                  color: active ? '#f8fafc' : '#94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  transition: 'all 0.15s',
                }}
              >
                <span>{t.emoji}</span>
                <span>{t.label}</span>
                <span style={{ fontSize: '9.5px', opacity: 0.7 }}>({t.age})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── RESOURCE METERS GRID (Clean, Colorful, Kid-Friendly) ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '12px',
      }}>
        {/* 1. POWER / ENERGY */}
        <div style={{
          background: 'rgba(9, 14, 26, 0.7)',
          border: `1px solid ${getMeterColor(resources.power)}44`,
          borderRadius: '12px',
          padding: '10px 14px',
          boxShadow: `0 0 14px ${getMeterColor(resources.power)}15`,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Zap size={14} color="#f59e0b" />
              <span>{kidFriendlyView ? 'ENERGY' : 'POWER'}</span>
            </span>
            <span style={{ fontSize: '11px', fontWeight: 800, color: getMeterColor(resources.power), fontFamily: 'var(--font-mono)' }}>
              {kidFriendlyView
                ? `${resources.power}% · ${getMeterStatusText(resources.power, 'energy')}`
                : `${(resources.power * 0.4).toFixed(1)} kWh (${resources.power}%)`}
            </span>
          </div>
          <div style={{ width: '100%', height: '8px', background: 'rgba(30, 41, 59, 0.6)', borderRadius: '9999px', overflow: 'hidden' }}>
            <div style={{ width: `${Math.min(100, Math.max(0, resources.power))}%`, height: '100%', background: getMeterColor(resources.power), borderRadius: '9999px', transition: 'width 0.4s ease' }} />
          </div>
        </div>

        {/* 2. WATER */}
        <div style={{
          background: 'rgba(9, 14, 26, 0.7)',
          border: `1px solid ${getMeterColor(resources.water)}44`,
          borderRadius: '12px',
          padding: '10px 14px',
          boxShadow: `0 0 14px ${getMeterColor(resources.water)}15`,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Droplets size={14} color="#38bdf8" />
              <span>WATER</span>
            </span>
            <span style={{ fontSize: '11px', fontWeight: 800, color: getMeterColor(resources.water), fontFamily: 'var(--font-mono)' }}>
              {kidFriendlyView
                ? `${resources.water}% · ${getMeterStatusText(resources.water, 'water')}`
                : `${Math.round(resources.water * 2.5)} L (${resources.water}%)`}
            </span>
          </div>
          <div style={{ width: '100%', height: '8px', background: 'rgba(30, 41, 59, 0.6)', borderRadius: '9999px', overflow: 'hidden' }}>
            <div style={{ width: `${Math.min(100, Math.max(0, resources.water))}%`, height: '100%', background: getMeterColor(resources.water), borderRadius: '9999px', transition: 'width 0.4s ease' }} />
          </div>
        </div>

        {/* 3. OXYGEN / AIR */}
        <div style={{
          background: 'rgba(9, 14, 26, 0.7)',
          border: `1px solid ${getMeterColor(resources.oxygen)}44`,
          borderRadius: '12px',
          padding: '10px 14px',
          boxShadow: `0 0 14px ${getMeterColor(resources.oxygen)}15`,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Wind size={14} color="#67e8f9" />
              <span>{kidFriendlyView ? 'FRESH AIR' : 'OXYGEN'}</span>
            </span>
            <span style={{ fontSize: '11px', fontWeight: 800, color: getMeterColor(resources.oxygen), fontFamily: 'var(--font-mono)' }}>
              {kidFriendlyView
                ? `${resources.oxygen}% · ${getMeterStatusText(resources.oxygen, 'air')}`
                : `${(resources.oxygen * 0.21).toFixed(1)} kPa (${resources.oxygen}%)`}
            </span>
          </div>
          <div style={{ width: '100%', height: '8px', background: 'rgba(30, 41, 59, 0.6)', borderRadius: '9999px', overflow: 'hidden' }}>
            <div style={{ width: `${Math.min(100, Math.max(0, resources.oxygen))}%`, height: '100%', background: getMeterColor(resources.oxygen), borderRadius: '9999px', transition: 'width 0.4s ease' }} />
          </div>
        </div>

        {/* 4. FOOD */}
        <div style={{
          background: 'rgba(9, 14, 26, 0.7)',
          border: `1px solid ${getMeterColor(resources.food * 5)}44`,
          borderRadius: '12px',
          padding: '10px 14px',
          boxShadow: `0 0 14px ${getMeterColor(resources.food * 5)}15`,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Apple size={14} color="#4ade80" />
              <span>FOOD MEALS</span>
            </span>
            <span style={{ fontSize: '11px', fontWeight: 800, color: getMeterColor(resources.food * 5), fontFamily: 'var(--font-mono)' }}>
              {kidFriendlyView
                ? `${resources.food} Days Left`
                : `${resources.food} Sols`}
            </span>
          </div>
          <div style={{ width: '100%', height: '8px', background: 'rgba(30, 41, 59, 0.6)', borderRadius: '9999px', overflow: 'hidden' }}>
            <div style={{ width: `${Math.min(100, Math.max(0, resources.food * 4.5))}%`, height: '100%', background: getMeterColor(resources.food * 5), borderRadius: '9999px', transition: 'width 0.4s ease' }} />
          </div>
        </div>

        {/* 5. RADIATION SHIELD */}
        <div style={{
          background: 'rgba(9, 14, 26, 0.7)',
          border: `1px solid ${getMeterColor(resources.radiation, true)}44`,
          borderRadius: '12px',
          padding: '10px 14px',
          boxShadow: `0 0 14px ${getMeterColor(resources.radiation, true)}15`,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <ShieldCheck size={14} color="#a78bfa" />
              <span>{kidFriendlyView ? 'SHIELD SAFETY' : 'DOSIMETER'}</span>
            </span>
            <span style={{ fontSize: '11px', fontWeight: 800, color: getMeterColor(resources.radiation, true), fontFamily: 'var(--font-mono)' }}>
              {kidFriendlyView
                ? getMeterStatusText(resources.radiation, 'shield')
                : `${resources.radiation} mSv`}
            </span>
          </div>
          <div style={{ width: '100%', height: '8px', background: 'rgba(30, 41, 59, 0.6)', borderRadius: '9999px', overflow: 'hidden' }}>
            <div style={{ width: `${Math.min(100, Math.max(0, resources.radiation))}%`, height: '100%', background: getMeterColor(resources.radiation, true), borderRadius: '9999px', transition: 'width 0.4s ease' }} />
          </div>
        </div>

        {/* 6. SCIENCE STARS */}
        <div style={{
          background: 'rgba(245, 158, 11, 0.08)',
          border: '1px solid rgba(245, 158, 11, 0.4)',
          borderRadius: '12px',
          padding: '10px 14px',
          boxShadow: '0 0 14px rgba(245, 158, 11, 0.15)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#fde047', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Award size={14} color="#facc15" />
              <span>{kidFriendlyView ? 'SCIENCE STARS' : 'RESEARCH (RP)'}</span>
            </span>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#facc15', fontFamily: 'var(--font-mono)' }}>
              {resources.science} / 300 ⭐
            </span>
          </div>
          <div style={{ width: '100%', height: '8px', background: 'rgba(30, 41, 59, 0.6)', borderRadius: '9999px', overflow: 'hidden' }}>
            <div style={{ width: `${Math.min(100, (resources.science / 300) * 100)}%`, height: '100%', background: 'linear-gradient(90deg, #f59e0b, #fbbf24)', borderRadius: '9999px', transition: 'width 0.4s ease' }} />
          </div>
        </div>

        {/* 7. ASTRONAUT HEALTH */}
        <div style={{
          background: 'rgba(9, 14, 26, 0.7)',
          border: `1px solid ${getMeterColor(resources.crewHealth)}44`,
          borderRadius: '12px',
          padding: '10px 14px',
          boxShadow: `0 0 14px ${getMeterColor(resources.crewHealth)}15`,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <HeartPulse size={14} color="#fb7185" />
              <span>{kidFriendlyView ? 'CREW HEALTH' : 'VITALS'}</span>
            </span>
            <span style={{ fontSize: '11px', fontWeight: 800, color: getMeterColor(resources.crewHealth), fontFamily: 'var(--font-mono)' }}>
              {resources.crewHealth}% · {getMeterStatusText(resources.crewHealth, 'health')}
            </span>
          </div>
          <div style={{ width: '100%', height: '8px', background: 'rgba(30, 41, 59, 0.6)', borderRadius: '9999px', overflow: 'hidden' }}>
            <div style={{ width: `${Math.min(100, Math.max(0, resources.crewHealth))}%`, height: '100%', background: getMeterColor(resources.crewHealth), borderRadius: '9999px', transition: 'width 0.4s ease' }} />
          </div>
        </div>
      </div>
    </div>
  );
};
