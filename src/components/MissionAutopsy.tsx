import React, { useEffect, useState } from 'react';
import type { GameState, DifficultyMode } from '../types/game';
import type { NasaMission } from '../data/nasaMissions';
import { ENDING_SCENARIOS, type EndingScenario } from '../data/outpostBalanceConfig';
import { soundFx } from '../utils/audioEffects';
import {
  Award,
  AlertOctagon,
  RotateCcw,
  GitBranch,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  X,
  Zap,
  Droplets,
  Wind,
  Apple,
  Activity,
  Heart,
  Shield,
  HelpCircle,
  Sparkles,
  ExternalLink,
  Flame,
  Globe,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface MissionAutopsyProps {
  gameState: GameState;
  onRestartMission?: () => void;
  onClose?: () => void;
  currentMission?: NasaMission;
  onSwitchDestination?: (dest: 'MOON' | 'MARS') => void;
  onSelectDifficulty?: (mode: DifficultyMode) => void;
}

export const MissionAutopsy: React.FC<MissionAutopsyProps> = ({
  gameState,
  onRestartMission,
  onClose,
  currentMission,
  onSwitchDestination,
  onSelectDifficulty,
}) => {
  const outcome = gameState.gameOutcome;
  const isVictory = outcome === 'VICTORY';
  const isPartial = outcome === 'PARTIAL_SUCCESS';
  const destName =
    currentMission?.destinationName ??
    (gameState.destination === 'MARS'
      ? 'Jezero Crater (Mars)'
      : 'Shackleton Crater (Lunar South Pole)');

  // Determine matching ending scenario from balance config
  const scenarioKey =
    gameState.endingScenarioId ||
    (isVictory ? 'GOLDEN_TRIUMPH' : 'LIFE_SUPPORT_FREEZE');
  const scenario: EndingScenario =
    ENDING_SCENARIOS[scenarioKey] ||
    (isVictory
      ? ENDING_SCENARIOS.GOLDEN_TRIUMPH
      : ENDING_SCENARIOS.SURVIVAL_VICTORY);

  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'GRAPHS' | 'DECISIONS' | 'SCIENCE'>('OVERVIEW');
  const [selectedResourceKey, setSelectedResourceKey] = useState<string>('ALL');

  const res = gameState.resources;

  // Compute Star Rating (1 to 3 Stars)
  const healthScore = res.crewHealth;
  const moraleScore = res.crewMorale ?? 80;
  const starCount = isVictory
    ? healthScore >= 80 && moraleScore >= 75
      ? 3
      : 2
    : isPartial
    ? 2
    : 1;

  useEffect(() => {
    if (isVictory) {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
      });
      soundFx.playVictory();
    } else {
      soundFx.playAlarm();
    }
  }, [isVictory]);

  // Build resource history data array for graphs
  const historyData = [
    {
      sol: 1,
      power: 75,
      oxygen: 90,
      water: 80,
      food: gameState.destination === 'MARS' ? 32 : 24,
      crewHealth: 95,
      crewMorale: 90,
      shielding: 70,
    },
    ...gameState.history.map((h) => ({
      sol: h.sol,
      power: h.resourcesSnapshot.power,
      oxygen: h.resourcesSnapshot.oxygen,
      water: h.resourcesSnapshot.water,
      food: h.resourcesSnapshot.food,
      crewHealth: h.resourcesSnapshot.crewHealth,
      crewMorale: h.resourcesSnapshot.crewMorale ?? 85,
      shielding: h.resourcesSnapshot.shielding ?? 70,
    })),
  ];

  // Extract up to 3 biggest decisions from mission history
  const topDecisions = gameState.history.slice(-3).reverse();

  // SVG Chart rendering helper
  const renderResourceGraph = () => {
    const width = 640;
    const height = 240;
    const padding = 36;
    const maxSol = Math.max(gameState.totalSols, gameState.currentSol, 30);

    const getX = (sol: number) => padding + ((sol - 1) / (maxSol - 1)) * (width - padding * 2);
    const getY = (val: number, maxVal = 100) =>
      height - padding - (Math.max(0, Math.min(maxVal, val)) / maxVal) * (height - padding * 2);

    const lines = [
      { key: 'power', label: 'Power (%)', color: '#f59e0b', max: 100, icon: '⚡' },
      { key: 'oxygen', label: 'Oxygen (%)', color: '#06b6d4', max: 100, icon: '💨' },
      { key: 'water', label: 'Water (%)', color: '#38bdf8', max: 100, icon: '💧' },
      { key: 'food', label: 'Food Rations', color: '#10b981', max: 40, icon: '🌱' },
      { key: 'crewHealth', label: 'Crew Health (%)', color: '#22c55e', max: 100, icon: '❤️' },
      { key: 'crewMorale', label: 'Crew Morale (%)', color: '#a855f7', max: 100, icon: '🧠' },
    ];

    const activeLines =
      selectedResourceKey === 'ALL'
        ? lines
        : lines.filter((l) => l.key === selectedResourceKey);

    return (
      <div style={{ background: '#070c18', border: '1px solid #1e293b', borderRadius: '12px', padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <TrendingUp size={16} className="text-cyan-400" />
            <strong style={{ fontSize: '13px', color: '#f8fafc' }}>
              Resource Trends (Sols 1 to {gameState.currentSol})
            </strong>
          </div>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setSelectedResourceKey('ALL')}
              style={{
                fontSize: '11px',
                padding: '3px 8px',
                borderRadius: '4px',
                border: 'none',
                background: selectedResourceKey === 'ALL' ? '#0284c7' : '#1e293b',
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              All Resources
            </button>
            {lines.map((l) => (
              <button
                key={l.key}
                onClick={() => setSelectedResourceKey(l.key)}
                style={{
                  fontSize: '11px',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  border: 'none',
                  background: selectedResourceKey === l.key ? l.color : '#1e293b',
                  color: selectedResourceKey === l.key ? '#000' : '#cbd5e1',
                  cursor: 'pointer',
                  fontWeight: selectedResourceKey === l.key ? 700 : 500,
                }}
              >
                {l.icon} {l.label.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((tick) => {
            const y = getY(tick, 100);
            return (
              <g key={tick}>
                <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="#1e293b" strokeDasharray="3 3" />
                <text x={padding - 6} y={y + 3} fill="#64748b" fontSize="9" textAnchor="end" fontFamily="monospace">
                  {tick}%
                </text>
              </g>
            );
          })}

          {/* Sol X-Axis */}
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#334155" />
          {[1, 10, 20, 30, 40].filter((s) => s <= maxSol).map((s) => {
            const x = getX(s);
            return (
              <g key={s}>
                <line x1={x} y1={height - padding} x2={x} y2={height - padding + 4} stroke="#475569" />
                <text x={x} y={height - padding + 14} fill="#64748b" fontSize="9" textAnchor="middle" fontFamily="monospace">
                  Sol {s}
                </text>
              </g>
            );
          })}

          {/* Danger Zone */}
          <rect
            x={padding}
            y={getY(20, 100)}
            width={width - padding * 2}
            height={height - padding - getY(20, 100)}
            fill="rgba(239, 68, 68, 0.08)"
          />
          <text x={width - padding - 6} y={getY(10, 100)} fill="#ef4444" fontSize="8" textAnchor="end" opacity="0.6" fontFamily="monospace">
            CRITICAL FAILURE ZONE (&lt;20%)
          </text>

          {/* Polylines */}
          {activeLines.map((l) => {
            const pts = historyData
              .map((d) => {
                const val = (d as any)[l.key] ?? 50;
                return `${getX(d.sol)},${getY(val, l.max)}`;
              })
              .join(' ');

            return (
              <g key={l.key}>
                <polyline
                  points={pts}
                  fill="none"
                  stroke={l.color}
                  strokeWidth={selectedResourceKey === l.key ? '3' : '2'}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {historyData.map((d, idx) => {
                  const val = (d as any)[l.key] ?? 50;
                  return (
                    <circle
                      key={idx}
                      cx={getX(d.sol)}
                      cy={getY(val, l.max)}
                      r={selectedResourceKey === l.key ? 3.5 : 2}
                      fill={l.color}
                    />
                  );
                })}
              </g>
            );
          })}
        </svg>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '10px', fontSize: '11px', color: '#94a3b8' }}>
          {lines.map((l) => (
            <div key={l.key} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: l.color }} />
              <span>{l.label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div
      className="autopsy-overlay"
      style={{
        zIndex: 2500,
        position: 'fixed',
        inset: 0,
        background: 'rgba(3, 7, 18, 0.92)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        fontFamily: "'Fredoka', 'Baloo 2', system-ui, sans-serif",
      }}
    >
      <div
        className="autopsy-modal"
        style={{
          width: '100%',
          maxWidth: '920px',
          maxHeight: '92vh',
          overflowY: 'auto',
          background: '#070f26',
          border: `2px solid ${isVictory ? '#10b981' : isPartial ? '#f59e0b' : '#ef4444'}`,
          borderRadius: '24px',
          boxShadow: '0 25px 70px rgba(0,0,0,0.9), 0 0 40px rgba(56, 189, 248, 0.25)',
          color: '#f8fafc',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Banner Header with Star Rating */}
        <div
          style={{
            background: isVictory
              ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(6, 182, 212, 0.25))'
              : isPartial
              ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(217, 119, 6, 0.25))'
              : 'linear-gradient(135deg, rgba(239, 68, 68, 0.3), rgba(185, 28, 28, 0.3))',
            borderBottom: `2px solid ${isVictory ? '#10b981' : isPartial ? '#f59e0b' : '#ef4444'}`,
            padding: '20px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ fontSize: '40px' }}>
              {isVictory ? '🏆' : isPartial ? '🥈' : '⚠️'}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    color: isVictory ? '#43ffa0' : isPartial ? '#fbbf24' : '#f87171',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                  }}
                >
                  AFTER-ACTION MISSION REPORT · SOL {gameState.currentSol} OF {gameState.totalSols}
                </span>
                {/* Star Rating Display */}
                <div style={{ display: 'flex', gap: '2px', fontSize: '16px' }}>
                  {Array.from({ length: 3 }).map((_, i) => (
                    <span key={i} style={{ opacity: i < starCount ? 1 : 0.3 }}>
                      ⭐
                    </span>
                  ))}
                </div>
              </div>

              <h2 style={{ fontSize: '1.4rem', fontWeight: 900, margin: '2px 0', color: '#fff' }}>
                {scenario.title}
              </h2>
              {/* One-Line Plain English Cause */}
              <div style={{ fontSize: '0.88rem', color: '#cbd5e1', fontWeight: 600 }}>
                {scenario.headline}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Mission Score & Rating */}
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.9)',
                border: '1.5px solid #38bdf8',
                borderRadius: '10px',
                padding: '6px 14px',
                textAlign: 'right',
              }}
            >
              <div style={{ fontSize: '10px', fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                FINAL SCORE
              </div>
              <div style={{ fontSize: '16px', fontWeight: 900, color: '#f8fafc' }}>
                {Math.max(
                  0,
                  Math.round(
                    res.crewHealth * 25 +
                      (res.crewMorale ?? 80) * 20 +
                      res.science * 15 +
                      res.power * 8 +
                      res.oxygen * 8 +
                      res.water * 8 +
                      res.food * 12 +
                      gameState.currentSol * 80
                  )
                ).toLocaleString()}{' '}
                <span style={{ fontSize: '10.5px', color: '#94a3b8' }}>PTS</span>
              </div>
            </div>

            {onClose && (
              <button
                onClick={onClose}
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#fff',
                  borderRadius: '8px',
                  padding: '6px 12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '12px',
                  fontWeight: 700,
                }}
              >
                <X size={14} /> Close
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', borderBottom: '1px solid #1e293b', background: '#050c20', padding: '0 24px' }}>
          <button
            onClick={() => setActiveTab('OVERVIEW')}
            style={{
              padding: '12px 16px',
              fontSize: '12.5px',
              fontWeight: 800,
              border: 'none',
              background: 'transparent',
              color: activeTab === 'OVERVIEW' ? '#38bdf8' : '#94a3b8',
              borderBottom: activeTab === 'OVERVIEW' ? '3px solid #38bdf8' : '3px solid transparent',
              cursor: 'pointer',
            }}
          >
            📋 Plain English Summary
          </button>
          <button
            onClick={() => setActiveTab('DECISIONS')}
            style={{
              padding: '12px 16px',
              fontSize: '12.5px',
              fontWeight: 800,
              border: 'none',
              background: 'transparent',
              color: activeTab === 'DECISIONS' ? '#38bdf8' : '#94a3b8',
              borderBottom: activeTab === 'DECISIONS' ? '3px solid #38bdf8' : '3px solid transparent',
              cursor: 'pointer',
            }}
          >
            🎯 Your 3 Biggest Decisions
          </button>
          <button
            onClick={() => setActiveTab('GRAPHS')}
            style={{
              padding: '12px 16px',
              fontSize: '12.5px',
              fontWeight: 800,
              border: 'none',
              background: 'transparent',
              color: activeTab === 'GRAPHS' ? '#38bdf8' : '#94a3b8',
              borderBottom: activeTab === 'GRAPHS' ? '3px solid #38bdf8' : '3px solid transparent',
              cursor: 'pointer',
            }}
          >
            📈 Resource Graphs Over Time
          </button>
          <button
            onClick={() => setActiveTab('SCIENCE')}
            style={{
              padding: '12px 16px',
              fontSize: '12.5px',
              fontWeight: 800,
              border: 'none',
              background: 'transparent',
              color: activeTab === 'SCIENCE' ? '#38bdf8' : '#94a3b8',
              borderBottom: activeTab === 'SCIENCE' ? '3px solid #38bdf8' : '3px solid transparent',
              cursor: 'pointer',
            }}
          >
            🔬 Real NASA Science & Links
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '24px', overflowY: 'auto', maxHeight: '60vh' }}>
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'OVERVIEW' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Simple Explanation Card */}
              <div style={{ background: '#091538', border: '1.5px solid #1d4ed8', borderRadius: '14px', padding: '16px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Sparkles size={18} className="text-amber-400" />
                  <strong style={{ fontSize: '14px', color: '#93c5fd' }}>In Plain English: What Decided This Mission?</strong>
                </div>
                <p style={{ fontSize: '13.5px', lineHeight: 1.6, color: '#f1f5f9', margin: 0 }}>
                  {scenario.kidFriendlySummary}
                </p>
              </div>

              {/* 3 Pillars */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '14px' }}>
                <div style={{ background: '#08122a', border: '1px solid #1e293b', borderRadius: '10px', padding: '14px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase', marginBottom: '6px' }}>
                    🔍 Key Root Cause
                  </div>
                  <p style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: 1.5, margin: 0 }}>
                    {scenario.rootCauseAnalysis}
                  </p>
                </div>

                <div style={{ background: '#08122a', border: '1px solid #1e293b', borderRadius: '10px', padding: '14px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#06b6d4', textTransform: 'uppercase', marginBottom: '6px' }}>
                    🔬 NASA Engineering Lesson
                  </div>
                  <p style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: 1.5, margin: 0 }}>
                    {scenario.realScienceLesson}
                  </p>
                </div>

                <div style={{ background: '#08122a', border: '1px solid #1e293b', borderRadius: '10px', padding: '14px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#10b981', textTransform: 'uppercase', marginBottom: '6px' }}>
                    🚀 Astronaut Tip for Next Flight
                  </div>
                  <p style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: 1.5, margin: 0 }}>
                    {scenario.nasaTakeaway}
                  </p>
                </div>
              </div>

              {/* Final Telemetry Scorecard */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
                <div style={{ background: '#08122a', border: '1px solid #1e293b', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>⚡ POWER</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: res.power >= 25 ? '#f59e0b' : '#ef4444' }}>{res.power}%</div>
                </div>
                <div style={{ background: '#08122a', border: '1px solid #1e293b', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>💨 OXYGEN</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: res.oxygen >= 25 ? '#06b6d4' : '#ef4444' }}>{res.oxygen}%</div>
                </div>
                <div style={{ background: '#08122a', border: '1px solid #1e293b', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>💧 WATER</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: res.water >= 25 ? '#38bdf8' : '#ef4444' }}>{res.water}%</div>
                </div>
                <div style={{ background: '#08122a', border: '1px solid #1e293b', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>🌱 FOOD</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: res.food >= 5 ? '#10b981' : '#ef4444' }}>{res.food} Meals</div>
                </div>
                <div style={{ background: '#08122a', border: '1px solid #1e293b', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>❤️ HEALTH</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: res.crewHealth >= 50 ? '#22c55e' : '#ef4444' }}>{res.crewHealth}%</div>
                </div>
                <div style={{ background: '#08122a', border: '1px solid #1e293b', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>🧠 MORALE</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: (res.crewMorale ?? 80) >= 40 ? '#a855f7' : '#ef4444' }}>{res.crewMorale ?? 80}%</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: YOUR 3 BIGGEST DECISIONS */}
          {activeTab === 'DECISIONS' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ fontSize: '13px', color: '#cbd5e1', marginBottom: '4px' }}>
                Every command in space triggers a chain reaction. Here are your 3 biggest decision points:
              </div>

              {topDecisions.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', background: '#08122a', borderRadius: '12px' }}>
                  No event choices recorded yet for this session.
                </div>
              ) : (
                topDecisions.map((entry, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: '#091538',
                      border: '1.5px solid #1e3a8a',
                      borderRadius: '12px',
                      padding: '16px',
                      display: 'flex',
                      gap: '14px',
                    }}
                  >
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: '#0284c7',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 900,
                        fontSize: '15px',
                        color: '#fff',
                        flexShrink: 0,
                      }}
                    >
                      {idx + 1}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <strong style={{ fontSize: '14px', color: '#f8fafc' }}>
                          Sol {entry.sol}: {entry.eventTitle}
                        </strong>
                        <span style={{ fontSize: '11px', color: '#38bdf8', fontFamily: 'monospace' }}>
                          YOUR ORDER: {entry.chosenOption.title}
                        </span>
                      </div>
                      <p style={{ fontSize: '12.5px', color: '#cbd5e1', margin: '4px 0 8px 0', lineHeight: 1.45 }}>
                        {entry.chosenOption.consequenceNarrative}
                      </p>
                      <div style={{ fontSize: '11.5px', color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)', padding: '6px 10px', borderRadius: '6px' }}>
                        💡 <strong>Real Science Impact:</strong> {entry.chosenOption.educationalInsight}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 3: GRAPHS */}
          {activeTab === 'GRAPHS' && renderResourceGraph()}

          {/* TAB 4: REAL NASA SCIENCE & LINKS */}
          {activeTab === 'SCIENCE' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ background: '#091538', border: '1.5px solid #0284c7', borderRadius: '12px', padding: '16px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#f8fafc', margin: '0 0 6px 0' }}>
                  🛰️ Direct NASA Engineering Sources
                </h3>
                <p style={{ fontSize: '12.5px', color: '#cbd5e1', lineHeight: 1.5, margin: 0 }}>
                  This mission simulator was calibrated using actual NASA Human Research Program and Space Technology Mission Directorate standards:
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
                <div style={{ background: '#08122a', border: '1px solid #1e293b', borderRadius: '10px', padding: '14px' }}>
                  <strong style={{ fontSize: '13px', color: '#38bdf8' }}>NASA BVAD-2015</strong>
                  <p style={{ fontSize: '11.5px', color: '#94a3b8', margin: '4px 0 8px 0', lineHeight: 1.4 }}>
                    Baseline Values for Exploration: sets the 0.84 kg O2 and 2.5 L water metabolic baseline used in our simulation turn engine.
                  </p>
                  <a
                    href="https://www.nasa.gov"
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: '11.5px', color: '#fbbf24', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 700 }}
                  >
                    <span>Read on NASA.gov</span>
                    <ExternalLink size={12} />
                  </a>
                </div>

                <div style={{ background: '#08122a', border: '1px solid #1e293b', borderRadius: '10px', padding: '14px' }}>
                  <strong style={{ fontSize: '13px', color: '#f97316' }}>NASA MOXIE on Perseverance</strong>
                  <p style={{ fontSize: '11.5px', color: '#94a3b8', margin: '4px 0 8px 0', lineHeight: 1.4 }}>
                    Produced 122 grams of oxygen from Martian CO2 air at Jezero Crater — proving in-situ oxygen generation works.
                  </p>
                  <a
                    href="https://mars.nasa.gov"
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: '11.5px', color: '#fbbf24', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 700 }}
                  >
                    <span>Perseverance Mission</span>
                    <ExternalLink size={12} />
                  </a>
                </div>

                <div style={{ background: '#08122a', border: '1px solid #1e293b', borderRadius: '10px', padding: '14px' }}>
                  <strong style={{ fontSize: '13px', color: '#10b981' }}>NASA Artemis Base Camp</strong>
                  <p style={{ fontSize: '11.5px', color: '#94a3b8', margin: '4px 0 8px 0', lineHeight: 1.4 }}>
                    Artemis polar foundation architecture for surviving 14-day lunar nights using Kilopower nuclear Stirling fission reactors.
                  </p>
                  <a
                    href="https://www.nasa.gov/artemis"
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: '11.5px', color: '#fbbf24', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 700 }}
                  >
                    <span>Artemis Camp Specs</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Action Buttons: Replay / Try other planet / Harder level */}
        <div
          style={{
            padding: '16px 24px',
            background: '#050c20',
            borderTop: '1px solid #1e293b',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          <div style={{ fontSize: '11.5px', color: '#64748b' }}>
            NASA Space Apps Challenge 2026 · Team Mysterio
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {/* 1. Replay Mission */}
            {onRestartMission && (
              <button
                onClick={() => {
                  soundFx.playReactorStart();
                  onRestartMission();
                }}
                style={{
                  padding: '9px 16px',
                  borderRadius: '8px',
                  background: isVictory ? '#0284c7' : '#ea580c',
                  border: 'none',
                  color: '#fff',
                  fontWeight: 800,
                  fontSize: '12.5px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
                title="Replay this mission with the same settings"
              >
                <RotateCcw size={14} />
                <span>Replay Mission</span>
              </button>
            )}

            {/* 2. Try Other Planet */}
            {onSwitchDestination && (
              <button
                onClick={() => {
                  const otherDest = gameState.destination === 'MARS' ? 'MOON' : 'MARS';
                  soundFx.playClick(850);
                  onSwitchDestination(otherDest);
                  if (onRestartMission) onRestartMission();
                }}
                style={{
                  padding: '9px 16px',
                  borderRadius: '8px',
                  background: 'rgba(56, 189, 248, 0.15)',
                  border: '1.5px solid #38bdf8',
                  color: '#38bdf8',
                  fontWeight: 800,
                  fontSize: '12.5px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
                title={`Switch to ${gameState.destination === 'MARS' ? 'the Moon' : 'Mars'}`}
              >
                <Globe size={14} />
                <span>Try {gameState.destination === 'MARS' ? 'Moon Base' : 'Mars Outpost'}</span>
              </button>
            )}

            {/* 3. Harder Level */}
            {onSelectDifficulty && (
              <button
                onClick={() => {
                  const nextDiff: DifficultyMode =
                    gameState.difficultyMode === 'CADET'
                      ? 'ENGINEER'
                      : gameState.difficultyMode === 'ENGINEER'
                      ? 'COMMANDER'
                      : 'COMMANDER';
                  soundFx.playClick(900);
                  onSelectDifficulty(nextDiff);
                  if (onRestartMission) onRestartMission();
                }}
                style={{
                  padding: '9px 16px',
                  borderRadius: '8px',
                  background: 'rgba(245, 158, 11, 0.15)',
                  border: '1.5px solid #f59e0b',
                  color: '#fbbf24',
                  fontWeight: 800,
                  fontSize: '12.5px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
                title="Step up to higher difficulty tier"
              >
                <Flame size={14} />
                <span>Harder Level</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MissionAutopsy;
