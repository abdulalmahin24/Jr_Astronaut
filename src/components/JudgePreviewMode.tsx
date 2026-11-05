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
}

export const JudgePreviewModal: React.FC<JudgePreviewModalProps> = ({
  isOpen,
  onClose,
  onActivate,
  isJudgeMode,
  onDeactivate,
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
    }
  }, [isOpen]);

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

/* ── Helper: Judge preview CSS keyframes ── */
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
