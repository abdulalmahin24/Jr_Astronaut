import React, { useEffect } from 'react';
import type { GameState } from '../types/game';
import type { NasaMission } from '../data/nasaMissions';
import {
  Award,
  AlertOctagon,
  RotateCcw,
  GitBranch,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface MissionAutopsyProps {
  gameState: GameState;
  onRestartMission: () => void;
  currentMission?: NasaMission;
}

export const MissionAutopsy: React.FC<MissionAutopsyProps> = ({ gameState, onRestartMission, currentMission }) => {
  const outcome = gameState.gameOutcome;
  const isVictory = outcome === 'VICTORY';
  const isPartial = outcome === 'PARTIAL_SUCCESS';

  const destName = currentMission?.destinationName ?? 'Shackleton Crater (Lunar South Pole)';

  useEffect(() => {
    if (isVictory) {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      });
    }
  }, [isVictory]);

  // Compute transparent grades
  const res = gameState.resources;
  const healthGrade = res.crewHealth >= 80 ? 'A+' : res.crewHealth >= 60 ? 'B' : res.crewHealth >= 40 ? 'C' : 'F';
  const powerGrade = res.power >= 70 ? 'A' : res.power >= 40 ? 'B' : res.power >= 20 ? 'C' : 'F';
  const scienceGoal = 150;

  return (
    <div className="autopsy-overlay" style={{ zIndex: 1400 }}>
      <div className="autopsy-modal" style={{ maxWidth: '880px', maxHeight: '92vh', overflowY: 'auto' }}>
        {/* Banner Header */}
        <div
          className="autopsy-banner"
          style={{
            background: isVictory
              ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(6, 182, 212, 0.25))'
              : isPartial
              ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(217, 119, 6, 0.25))'
              : 'linear-gradient(135deg, rgba(239, 68, 68, 0.25), rgba(185, 28, 28, 0.25))',
            borderBottom: `2px solid ${isVictory ? '#10b981' : isPartial ? '#f59e0b' : '#ef4444'}`,
            padding: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <div className="banner-icon">
            {isVictory ? (
              <Award size={48} className="text-amber-300 animate-bounce" />
            ) : isPartial ? (
              <ShieldCheck size={48} className="text-amber-400" />
            ) : (
              <AlertOctagon size={48} className="text-rose-400 animate-pulse" />
            )}
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: isVictory ? '#43ffa0' : isPartial ? '#fbbf24' : '#f87171', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              NASA Flight Debriefing Report · Sol {gameState.currentSol} of {gameState.totalSols}
            </div>
            <h2 className="banner-title" style={{ fontSize: '1.4rem', fontWeight: 800, margin: '4px 0' }}>
              {isVictory
                ? `MISSION ACCOMPLISHED: ${currentMission?.name?.toUpperCase() || 'LUNAR OUTPOST'} CERTIFIED!`
                : isPartial
                ? `MISSION COMPLETED WITH CASUALTY MARGINS: PARTIAL SUCCESS`
                : 'MISSION TERMINATED: ACCIDENT INVESTIGATION BOARD (AIB)'}
            </h2>
            <p className="banner-subtitle" style={{ fontSize: '0.88rem', color: '#cbd5e1' }}>
              {isVictory
                ? `Commander Dadu and Cadet Maya successfully sustained outpost operations across 30 Sols at ${destName}, logging ${res.science} Science Research Points!`
                : isPartial
                ? `The outpost survived all mission Sols, but experienced severe resource depletion or uncompleted secondary objectives.`
                : `Operations halted on Sol ${gameState.currentSol}. Root Cause: ${gameState.failureReason || 'Critical Subsystem Collapse'}`}
            </p>
          </div>
        </div>

        {/* Scorecard Grid */}
        <div style={{ padding: '20px 24px', backgroundColor: 'rgba(15, 23, 42, 0.7)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', marginBottom: '12px' }}>
            Transparent Mission Performance Metrics
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
            <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>CREW HEALTH</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: res.crewHealth >= 60 ? '#43ffa0' : '#f87171' }}>
                {res.crewHealth}% (Grade {healthGrade})
              </div>
            </div>

            <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>POWER GRID RESERVE</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: res.power >= 30 ? '#fbbf24' : '#ef4444' }}>
                {res.power}% (Grade {powerGrade})
              </div>
            </div>

            <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>SCIENCE COLLECTED</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#38bdf8' }}>
                {res.science} / {scienceGoal} Pts
              </div>
            </div>

            <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>CUMULATIVE RADIATION</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: res.radiation < 50 ? '#43ffa0' : '#f59e0b' }}>
                {res.radiation} mSv {res.radiation < 50 ? '(ALARA Safe)' : '(Elevated)'}
              </div>
            </div>
          </div>
        </div>

        {/* Explainable AI / Chain-Reaction Attribution Tree */}
        <div className="chain-reaction-section" style={{ padding: '24px' }}>
          <div className="section-heading" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <GitBranch size={18} className="text-emerald-400" />
            <span style={{ fontWeight: 800, color: '#f1f5f9', fontSize: '1.05rem' }}>
              Root-Cause Chain Reaction Trace (Explainable Mission Log)
            </span>
          </div>
          <p className="section-caption" style={{ fontSize: '0.82rem', color: '#94a3b8', marginBottom: '16px' }}>
            In space systems engineering, disasters and triumphs are never single isolated events—they are cascading chain reactions of trade-offs.
          </p>

          <div className="chain-timeline" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {gameState.history.map((entry, idx) => (
              <div key={idx} className="timeline-node" style={{ display: 'flex', gap: '12px' }}>
                <div
                  className="node-sol-badge"
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(56, 189, 248, 0.15)',
                    color: '#38bdf8',
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    height: 'fit-content',
                    whiteSpace: 'nowrap',
                  }}
                >
                  SOL {entry.sol}
                </div>
                <div
                  className="node-card"
                  style={{
                    backgroundColor: 'rgba(15, 23, 42, 0.7)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    flex: 1,
                  }}
                >
                  <div className="node-event-title" style={{ fontWeight: 700, fontSize: '0.9rem', color: '#f1f5f9' }}>
                    {entry.eventTitle}
                  </div>
                  <div className="node-choice-title" style={{ fontSize: '0.82rem', color: '#cbd5e1', margin: '4px 0' }}>
                    <span className="text-emerald-400 font-semibold">Decision: </span>
                    {entry.chosenOption.title}
                  </div>
                  <p className="node-consequence" style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.4 }}>
                    {entry.chosenOption.consequenceNarrative}
                  </p>
                  <div
                    className="node-insight"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '0.75rem',
                      color: '#38bdf8',
                      backgroundColor: 'rgba(56, 189, 248, 0.08)',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      marginTop: '8px',
                    }}
                  >
                    <ArrowRight size={13} className="text-cyan-400 shrink-0" />
                    <span>{entry.chosenOption.educationalInsight}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Lessons Learned & Recommendations */}
        <div style={{ padding: '20px 24px', backgroundColor: 'rgba(10, 15, 26, 0.95)', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '16px' }}>
            {isVictory ? (
              <ShieldCheck size={28} className="text-emerald-400 shrink-0 mt-1" />
            ) : (
              <AlertOctagon size={28} className="text-amber-400 shrink-0 mt-1" />
            )}
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', color: isVictory ? '#43ffa0' : '#fbbf24' }}>
                {isVictory ? 'NASA Flight Certification & Engineering Mastery:' : 'NASA Engineering Recommendations for Next Flight:'}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.5, marginTop: '4px' }}>
                {isVictory
                  ? `Congratulations! You successfully balanced ECLSS life-support chemistry, navigated the 354-hour lunar night, and demonstrated deep understanding of space exploration trade-offs at ${destName}.`
                  : `Review your power grid sizing in the Outpost Construction phase. Consider adding the 10 kWe Kilopower Fission Reactor or constructing the 2-meter Sintered Regolith Vault to prevent thermal freeze and radiation cascades during lunar night.`}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              onClick={onRestartMission}
              className="restart-btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 24px',
                borderRadius: '8px',
                backgroundColor: isVictory ? '#0284c7' : '#ea580c',
                border: 'none',
                color: '#ffffff',
                fontWeight: 800,
                cursor: 'pointer',
                fontSize: '0.95rem',
              }}
            >
              <RotateCcw size={16} />
              <span>{isVictory ? 'Command Another Mission' : 'Replay & Retry Mission'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
