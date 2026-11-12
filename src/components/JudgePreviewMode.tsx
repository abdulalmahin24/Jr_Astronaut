import React, { useState, useEffect, useCallback } from 'react';

/* ──────────────────────────────────────────────────────────
   🚀 Space Apps Judge Preview Mode
   ────────────────────────────────────────────────────────── 
   One-click button that instantly unlocks everything so
   judges can evaluate every corner of the app in < 2 min.
   ────────────────────────────────────────────────────────── */

interface JudgePreviewProps {
  onActivate: () => void;
  isActive: boolean;
}

const JUDGE_CODE = 'SPACEAPPS2026';

export const JudgePreviewBadge: React.FC<JudgePreviewProps> = ({ isActive }) => {
  if (!isActive) return null;
  return (
    <div style={{
      position: 'fixed',
      top: '52px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 99999,
      background: 'linear-gradient(180deg, #d97706, #b45309)',
      border: '1px solid rgba(251, 191, 36, 0.45)',
      color: '#fff',
      padding: '4px 18px',
      borderRadius: '0 0 8px 8px',
      fontSize: '0.7rem',
      fontWeight: 800,
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.6)',
      animation: 'judgeGlow 2s ease-in-out infinite alternate',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      pointerEvents: 'none',
    }}>
      <span style={{ fontSize: '14px' }}>🏆</span>
      <span>Judge Preview Mode — All Features Unlocked</span>
      <span style={{ fontSize: '14px' }}>🏆</span>
    </div>
  );
};

interface JudgePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onActivate: () => void;
  isJudgeMode: boolean;
  onDeactivate: () => void;
  onStartTour?: () => void;
}

export const JudgePreviewModal: React.FC<JudgePreviewModalProps> = ({
  isOpen,
  onClose,
  onActivate,
  isJudgeMode,
  onDeactivate,
  onStartTour,
}) => {
  const [code, setCode] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [activatingStage, setActivatingStage] = useState(0);

  const handleActivate = useCallback(() => {
    if (code.toUpperCase() === JUDGE_CODE || code === '') {
      setShowError(false);
      setActivatingStage(1);
      // Animate activation sequence
      const stages = [
        () => setActivatingStage(2), // Unlocking missions
        () => setActivatingStage(3), // Granting credits
        () => setActivatingStage(4), // Enabling badges
        () => {
          setActivatingStage(5);
          setShowSuccess(true);
          onActivate();
        },
      ];
      stages.forEach((fn, i) => setTimeout(fn, (i + 1) * 600));
    } else {
      setShowError(true);
    }
  }, [code, onActivate]);

  useEffect(() => {
    if (!isOpen) {
      setCode('');
      setShowSuccess(false);
      setShowError(false);
      setActivatingStage(0);
      return;
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const stageLabels = [
    '',
    '⏳ Initializing Judge Sandbox…',
    '🔓 Unlocking all 76 NASA missions…',
    '💰 Granting 999,999 Cadet Credits…',
    '🏅 Enabling all Academy Badges & Certificates…',
    '✅ Judge Preview Mode Active!',
  ];

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 100000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(0,0,0,0.85)',
      backdropFilter: 'blur(12px)',
    }} onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '520px',
          maxWidth: '94vw',
          background: 'linear-gradient(145deg, #0f1629 0%, #1a1040 50%, #0f172a 100%)',
          border: '2px solid rgba(245, 158, 11, 0.5)',
          borderRadius: '20px',
          padding: '32px',
          boxShadow: '0 0 80px rgba(245, 158, 11, 0.15), 0 0 200px rgba(139, 92, 246, 0.1)',
          animation: 'modalFadeIn 0.4s ease-out',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '48px', marginBottom: '8px' }}>🚀</div>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: 900,
            background: 'linear-gradient(90deg, #f59e0b, #ef4444, #8b5cf6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '0.05em',
            margin: 0,
          }}>
            Space Apps Judge Preview
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.82rem', marginTop: '6px' }}>
            Instantly unlock every feature for rapid evaluation
          </p>
        </div>

        {/* Already active */}
        {isJudgeMode && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            borderRadius: '12px',
            padding: '16px',
            textAlign: 'center',
            marginBottom: '16px',
          }}>
            <div style={{ color: '#34d399', fontWeight: 700, fontSize: '0.9rem', marginBottom: '8px' }}>
              ✅ Judge Preview Mode is Active
            </div>
            <p style={{ color: '#94a3b8', fontSize: '0.78rem', margin: '0 0 12px 0' }}>
              All 76 missions, 999,999 credits, and all academy badges are unlocked.
            </p>
            <button
              onClick={() => { onDeactivate(); onClose(); }}
              style={{
                padding: '8px 24px',
                background: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid rgba(239, 68, 68, 0.5)',
                borderRadius: '8px',
                color: '#fca5a5',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Deactivate Judge Mode
            </button>
          </div>
        )}

        {/* Activation */}
        {!isJudgeMode && !showSuccess && (
          <>
            {/* 2-Minute Interactive Highlights Tour Button */}
        <button
          onClick={() => {
            onActivate();
            onClose();
            onStartTour?.();
          }}
          style={{
            width: '100%',
            padding: '13px',
            marginBottom: '16px',
            background: 'linear-gradient(135deg, #0284c7 0%, #3b82f6 50%, #8b5cf6 100%)',
            border: '1px solid rgba(147, 197, 253, 0.5)',
            borderRadius: '12px',
            color: '#fff',
            fontSize: '0.95rem',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: '0 4px 20px rgba(59, 130, 246, 0.4)',
            transition: 'transform 0.2s ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.02)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
        >
          <span>⏱️</span>
          <span>START 2-MINUTE JUDGE HIGHLIGHTS TOUR</span>
        </button>

        {/* What gets unlocked */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '8px',
              marginBottom: '20px',
            }}>
              {[
                { icon: '🎮', label: 'All 76 NASA Missions', color: '#38bdf8' },
                { icon: '💰', label: '999,999 Cadet Credits', color: '#fbbf24' },
                { icon: '🏅', label: 'All Academy Badges', color: '#a78bfa' },
                { icon: '🔬', label: '3D Equipment Viewers', color: '#34d399' },
                { icon: '📖', label: 'All 8 Comic Issues', color: '#fb923c' },
                { icon: '🎓', label: 'Ground School Certs', color: '#c084fc' },
                { icon: '🚜', label: 'Rover EVA Access', color: '#f87171' },
                { icon: '🛰️', label: 'NASA Data Pipeline', color: '#22d3ee' },
              ].map((item) => (
                <div key={item.label} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}>
                  <span style={{ fontSize: '16px' }}>{item.icon}</span>
                  <span style={{ color: item.color, fontSize: '0.75rem', fontWeight: 600 }}>{item.label}</span>
                </div>
              ))}
            </div>

            {/* Activation progress */}
            {activatingStage > 0 && activatingStage < 5 && (
              <div style={{
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: '12px',
                padding: '16px',
                textAlign: 'center',
                marginBottom: '16px',
              }}>
                <div style={{ color: '#fbbf24', fontWeight: 700, fontSize: '0.85rem', marginBottom: '10px' }}>
                  {stageLabels[activatingStage]}
                </div>
                <div style={{
                  height: '4px',
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: '4px',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%',
                    width: `${(activatingStage / 5) * 100}%`,
                    background: 'linear-gradient(90deg, #f59e0b, #ef4444, #8b5cf6)',
                    borderRadius: '4px',
                    transition: 'width 0.5s ease-out',
                  }} />
                </div>
              </div>
            )}

            {/* Access code (optional) */}
            {activatingStage === 0 && (
              <>
                <div style={{
                  display: 'flex',
                  gap: '8px',
                  marginBottom: '12px',
                }}>
                  <input
                    type="text"
                    placeholder="Access code (optional)"
                    value={code}
                    onChange={(e) => { setCode(e.target.value); setShowError(false); }}
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: '10px',
                      color: '#e2e8f0',
                      fontSize: '0.85rem',
                      fontFamily: 'monospace',
                      outline: 'none',
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && handleActivate()}
                  />
                </div>
                {showError && (
                  <p style={{ color: '#f87171', fontSize: '0.75rem', margin: '0 0 8px 0' }}>
                    Invalid code. Leave blank for instant access.
                  </p>
                )}

                <button
                  onClick={handleActivate}
                  style={{
                    width: '100%',
                    padding: '14px',
                    background: 'linear-gradient(135deg, #f59e0b, #ef4444, #8b5cf6)',
                    border: 'none',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '1rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    boxShadow: '0 4px 24px rgba(245, 158, 11, 0.3)',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.02)';
                    e.currentTarget.style.boxShadow = '0 8px 32px rgba(245, 158, 11, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = '0 4px 24px rgba(245, 158, 11, 0.3)';
                  }}
                >
                  🚀 Activate Judge Preview Mode
                </button>
              </>
            )}
          </>
        )}

        {/* Success */}
        {showSuccess && (
          <div style={{
            textAlign: 'center',
            padding: '20px',
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            borderRadius: '14px',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🏆</div>
            <h3 style={{ color: '#34d399', fontWeight: 800, fontSize: '1.1rem', margin: '0 0 8px 0' }}>
              All Features Unlocked!
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '0.82rem', margin: '0 0 16px 0' }}>
              Explore the full Jr_AstroCamp experience. Every mission, comic, academy lesson,
              rover expedition, and equipment item is now accessible.
            </p>
            <button
              onClick={onClose}
              style={{
                padding: '10px 32px',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                border: 'none',
                borderRadius: '10px',
                color: '#fff',
                fontSize: '0.9rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Start Exploring →
            </button>
          </div>
        )}

        {/* Close */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#94a3b8',
            cursor: 'pointer',
            fontSize: '16px',
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
};

/* ── 2-Minute Interactive Demo Tour Floating Controller ── */
export interface JudgeTourFloatingControllerProps {
  activeHighlight: number; // 1 to 4
  onSelectHighlight: (h: number) => void;
  onExitTour: () => void;
}

export const JudgeTourFloatingController: React.FC<JudgeTourFloatingControllerProps> = ({
  activeHighlight,
  onSelectHighlight,
  onExitTour,
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState(120);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const highlights = [
    { id: 1, label: '1. 🛰️ 3D EMU Spacesuit', desc: 'Spacesuit & Life Support Telemetry' },
    { id: 2, label: '2. 🌕 Moonquakes 3D Globe', desc: 'Apollo 11-16 Seismic Visualization' },
    { id: 3, label: '3. 🚀 Multi-Stage Rocket', desc: 'Three.js Orbital Staging Flight' },
    { id: 4, label: '4. 🕳️ Black Hole Lensing', desc: 'Relativistic Doppler & Einstein Ring' },
  ];

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 999999,
        background: 'rgba(8, 14, 26, 0.95)',
        border: '1.5px solid rgba(245, 158, 11, 0.75)',
        borderRadius: '16px',
        padding: '10px 18px',
        boxShadow: '0 16px 48px rgba(0,0,0,0.85), 0 0 35px rgba(245, 158, 11, 0.3)',
        backdropFilter: 'blur(20px)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        animation: 'judgeGlow 2s ease-in-out infinite alternate',
      }}
    >
      {/* Timer badge */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'rgba(245, 158, 11, 0.15)',
          border: '1px solid #f59e0b',
          padding: '5px 12px',
          borderRadius: '8px',
        }}
      >
        <span style={{ fontSize: '13px' }}>⏱️</span>
        <span style={{ fontSize: '12px', fontWeight: 900, color: '#fbbf24', fontFamily: 'monospace' }}>
          TOUR: {formatTime(secondsRemaining)}
        </span>
      </div>

      {/* 4 Highlight buttons */}
      <div style={{ display: 'flex', gap: '6px' }}>
        {highlights.map((h) => {
          const isActive = activeHighlight === h.id;
          return (
            <button
              key={h.id}
              onClick={() => onSelectHighlight(h.id)}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                background: isActive ? 'linear-gradient(135deg, #f59e0b, #ef4444)' : 'rgba(255, 255, 255, 0.05)',
                border: isActive ? '1px solid #f59e0b' : '1px solid rgba(255, 255, 255, 0.12)',
                color: isActive ? '#fff' : '#cbd5e1',
                fontSize: '11px',
                fontWeight: 800,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: isActive ? '0 0 16px rgba(245, 158, 11, 0.4)' : 'none',
              }}
              title={h.desc}
            >
              {h.label}
            </button>
          );
        })}
      </div>

      {/* Prev / Next controls */}
      <div style={{ display: 'flex', gap: '4px' }}>
        <button
          onClick={() => onSelectHighlight(Math.max(1, activeHighlight - 1))}
          disabled={activeHighlight <= 1}
          style={{
            padding: '6px 10px',
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '6px',
            color: activeHighlight <= 1 ? '#64748b' : '#fff',
            cursor: activeHighlight <= 1 ? 'not-allowed' : 'pointer',
            fontSize: '11px',
            fontWeight: 800,
          }}
        >
          ◀ PREV
        </button>
        <button
          onClick={() => onSelectHighlight(Math.min(4, activeHighlight + 1))}
          disabled={activeHighlight >= 4}
          style={{
            padding: '6px 10px',
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '6px',
            color: activeHighlight >= 4 ? '#64748b' : '#fff',
            cursor: activeHighlight >= 4 ? 'not-allowed' : 'pointer',
            fontSize: '11px',
            fontWeight: 800,
          }}
        >
          NEXT ▶
        </button>
      </div>

      {/* Exit */}
      <button
        onClick={onExitTour}
        style={{
          background: 'rgba(239, 68, 68, 0.2)',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          borderRadius: '6px',
          color: '#f87171',
          cursor: 'pointer',
          fontSize: '12px',
          fontWeight: 800,
          padding: '5px 8px',
        }}
        title="Exit Judge Tour"
      >
        ✕ EXIT
      </button>
    </div>
  );
};
const judgeStyles = document.createElement('style');
judgeStyles.textContent = `
  @keyframes judgeGlow {
    0% { box-shadow: 0 4px 24px rgba(245, 158, 11, 0.3); }
    100% { box-shadow: 0 4px 36px rgba(139, 92, 246, 0.5), 0 0 60px rgba(245, 158, 11, 0.2); }
  }
`;
if (!document.getElementById('judge-preview-styles')) {
  judgeStyles.id = 'judge-preview-styles';
  document.head.appendChild(judgeStyles);
}
