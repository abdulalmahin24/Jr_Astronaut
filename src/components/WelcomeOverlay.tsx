import React, { useState, useEffect } from 'react';
import {
  Rocket,
  Compass,
  Play,
  X,
  Sparkles,
  MousePointer,
  HelpCircle,
  GraduationCap,
  Gamepad2,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';
import { soundFx } from '../utils/audioEffects';

interface WelcomeOverlayProps {
  onStartMission: () => void;
  onExploreOrrery: () => void;
}

export const WelcomeOverlay: React.FC<WelcomeOverlayProps> = ({
  onStartMission,
  onExploreOrrery,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);

  useEffect(() => {
    // Check if user has already seen the welcome tutorial
    const hasSeenWelcome = localStorage.getItem('astro_camp_welcomed');
    if (!hasSeenWelcome) {
      setIsOpen(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('astro_camp_welcomed', 'true');
    setIsOpen(false);
    soundFx.playClick(800);
    onExploreOrrery();
  };

  const handleLaunchDirect = () => {
    localStorage.setItem('astro_camp_welcomed', 'true');
    setIsOpen(false);
    soundFx.playReactorStart();
    onStartMission();
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-title"
      className="nasa-eyes-interactive"
      onClick={handleDismiss}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(2, 6, 23, 0.85)',
        padding: '16px',
        animation: 'welcomeFadeIn 0.25s ease-out',
        pointerEvents: 'auto',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '560px',
          background: 'oklch(14% 0.012 75)',
          border: '1px solid rgba(56, 189, 248, 0.35)',
          borderRadius: '12px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.9)',
          padding: '24px',
          color: '#f8fafc',
          position: 'relative',
        }}
      >
        {/* Close button */}
        <button
          onClick={handleDismiss}
          aria-label="Close welcome guide"
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'transparent',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            padding: '6px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <X size={20} />
        </button>

        {/* Header Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <span
            style={{
              padding: '3px 8px',
              borderRadius: '4px',
              backgroundColor: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              color: '#38bdf8',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            NASA Space Apps Challenge 2026
          </span>
          <span style={{ fontSize: '12px', color: '#64748b' }}>Step {step} of 2</span>
        </div>

        {step === 1 ? (
          <>
            <h2
              id="welcome-title"
              style={{
                fontFamily: 'var(--font-display, "Space Grotesk", sans-serif)',
                fontSize: '24px',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                margin: '0 0 10px 0',
                color: '#ffffff',
              }}
            >
              Welcome to Jr_AstroCamp
            </h2>
            <p
              style={{
                fontSize: '14px',
                color: '#cbd5e1',
                lineHeight: '1.6',
                margin: '0 0 20px 0',
              }}
            >
              An authentic NASA simulation experience combining real JPL ephemeris orbital mechanics with
              an interactive astronaut cadet mission trainer.
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '12px',
                marginBottom: '24px',
              }}
            >
              <div
                style={{
                  padding: '12px',
                  background: 'rgba(15, 23, 42, 0.7)',
                  border: '1px solid rgba(56, 189, 248, 0.2)',
                  borderRadius: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#38bdf8', marginBottom: '6px', fontWeight: 600, fontSize: '13px' }}>
                  <Compass size={16} />
                  <span>3D Solar System Orrery</span>
                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8', lineHeight: '1.4' }}>
                  Inspect all 8 planets, ISS, JWST, Voyager & Parker Solar Probe with authentic orbital velocities.
                </div>
              </div>

              <div
                style={{
                  padding: '12px',
                  background: 'rgba(15, 23, 42, 0.7)',
                  border: '1px solid rgba(56, 189, 248, 0.2)',
                  borderRadius: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fbbf24', marginBottom: '6px', fontWeight: 600, fontSize: '13px' }}>
                  <Rocket size={16} />
                  <span>Surface Base Simulators</span>
                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8', lineHeight: '1.4' }}>
                  Survive 30 Sols on Moon or Mars. Manage ECLSS oxygen, power grid, water recycling, and EVA sorties.
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
              <button
                onClick={() => setStep(2)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '9px 18px',
                  background: 'transparent',
                  border: '1px solid rgba(148, 163, 184, 0.3)',
                  borderRadius: '6px',
                  color: '#e2e8f0',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <span>How to Navigate</span>
                <ChevronRight size={14} />
              </button>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={handleDismiss}
                  style={{
                    padding: '9px 16px',
                    background: 'rgba(15, 23, 42, 0.9)',
                    border: '1px solid rgba(56, 189, 248, 0.4)',
                    borderRadius: '6px',
                    color: '#38bdf8',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Explore Orrery
                </button>
                <button
                  onClick={handleLaunchDirect}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '9px 18px',
                    background: '#0284c7',
                    border: '1px solid #38bdf8',
                    borderRadius: '6px',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  <Play size={13} />
                  <span>Launch Mission</span>
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <h2
              id="welcome-title"
              style={{
                fontFamily: 'var(--font-display, "Space Grotesk", sans-serif)',
                fontSize: '22px',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                margin: '0 0 10px 0',
                color: '#ffffff',
              }}
            >
              Interactive Orbit Navigation
            </h2>
            <p
              style={{
                fontSize: '14px',
                color: '#cbd5e1',
                lineHeight: '1.5',
                margin: '0 0 16px 0',
              }}
            >
              Control the camera and time simulation with simple mouse or touch gestures:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', background: 'rgba(15, 23, 42, 0.6)', borderRadius: '6px' }}>
                <MousePointer size={18} style={{ color: '#38bdf8', flexShrink: 0 }} />
                <div style={{ fontSize: '13px', color: '#cbd5e1' }}>
                  <strong style={{ color: '#ffffff' }}>Drag to Orbit: </strong> Click & drag left/right/up/down to rotate perspective around any target.
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', background: 'rgba(15, 23, 42, 0.6)', borderRadius: '6px' }}>
                <Sparkles size={18} style={{ color: '#fbbf24', flexShrink: 0 }} />
                <div style={{ fontSize: '13px', color: '#cbd5e1' }}>
                  <strong style={{ color: '#ffffff' }}>Click Planet to Inspect: </strong> Click any celestial body or search in topbar to open live telemetry.
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', background: 'rgba(15, 23, 42, 0.6)', borderRadius: '6px' }}>
                <RotateCcw size={18} style={{ color: '#4ade80', flexShrink: 0 }} />
                <div style={{ fontSize: '13px', color: '#cbd5e1' }}>
                  <strong style={{ color: '#ffffff' }}>Timeline Scrubber: </strong> Drag the bottom timeline (1975–2045) or use speed buttons (10x, 100x) to run ephemeris fast.
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
              <button
                onClick={() => setStep(1)}
                style={{
                  padding: '9px 14px',
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                ← Back
              </button>

              <button
                onClick={handleDismiss}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '9px 20px',
                  background: '#0284c7',
                  border: '1px solid #38bdf8',
                  borderRadius: '6px',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <span>Enter System</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
