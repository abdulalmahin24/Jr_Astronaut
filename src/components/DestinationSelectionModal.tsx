import React, { useState } from 'react';
import type { DifficultyMode } from '../types/game';
import { Rocket, Shield, AlertTriangle, Moon, Globe, Check, Sparkles, X, Activity } from 'lucide-react';
import { soundFx } from '../utils/audioEffects';

export interface DestinationSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDestination: (destination: 'MOON' | 'MARS', difficulty: DifficultyMode) => void;
}

export const DestinationSelectionModal: React.FC<DestinationSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelectDestination,
}) => {
  const [selectedDest, setSelectedDest] = useState<'MOON' | 'MARS'>('MOON');
  const [difficulty, setDifficulty] = useState<DifficultyMode>('CADET');

  if (!isOpen) return null;

  const handleLaunch = () => {
    soundFx.playReactorStart();
    onSelectDestination(selectedDest, difficulty);
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: 'rgba(2, 6, 23, 0.88)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease',
      }}
    >
      <div
        style={{
          background: 'linear-gradient(145deg, #090e24, #040713)',
          border: '1.5px solid rgba(56, 189, 248, 0.4)',
          borderRadius: '16px',
          maxWidth: '860px',
          width: '100%',
          overflow: 'hidden',
          boxShadow: '0 0 50px rgba(2, 132, 199, 0.35), 0 20px 40px rgba(0,0,0,0.8)',
          color: '#f8fafc',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '92vh',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #1e293b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(15, 23, 42, 0.7)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #0284c7, #2563eb)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Rocket size={20} className="text-white" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 900, letterSpacing: '0.02em', color: '#f8fafc' }}>
                Select Your Outpost Destination
              </h2>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                NASA Space Apps 2026 Junior Astronaut Mission Trainer · Guest Mode Enabled
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px',
            }}
            title="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Destination Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '18px' }}>
            
            {/* 1. MOON CARD */}
            <div
              onClick={() => {
                setSelectedDest('MOON');
                soundFx.playClick(700);
              }}
              style={{
                background: selectedDest === 'MOON' ? 'rgba(14, 165, 233, 0.12)' : 'rgba(15, 23, 42, 0.6)',
                border: selectedDest === 'MOON' ? '2px solid #38bdf8' : '1px solid #1e293b',
                borderRadius: '12px',
                padding: '18px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                position: 'relative',
              }}
            >
              {selectedDest === 'MOON' && (
                <div
                  style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    background: '#0284c7',
                    borderRadius: '50%',
                    width: '22px',
                    height: '22px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Check size={14} className="text-white" />
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <div style={{ fontSize: '28px' }}>🌙</div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#f1f5f9' }}>
                    Moon: Shackleton Crater Rim
                  </h3>
                  <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 700, fontFamily: 'monospace' }}>
                    ARTEMIS POLAR EXPEDITION · 30 SOLS
                  </span>
                </div>
              </div>

              <p style={{ fontSize: '12.5px', color: '#cbd5e1', lineHeight: 1.5, marginBottom: '14px' }}>
                Establish a base at the lunar South Pole. Leverage continuous sunlight on high crater peaks while mining cryogenic water ice trapped in permanent shadows.
              </p>

              {/* Real NASA Fact Card */}
              <div
                style={{
                  background: '#070b19',
                  border: '1px solid #1e293b',
                  borderRadius: '8px',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
              >
                <div style={{ fontSize: '10.5px', fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  📡 NASA Scientific Baselines (LRO LOLA)
                </div>
                <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                  • <strong style={{ color: '#f1f5f9' }}>Gravity:</strong> 0.166g (1/6th of Earth)
                </div>
                <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                  • <strong style={{ color: '#f1f5f9' }}>Atmosphere:</strong> Hard Vacuum (&lt; 10⁻¹² Pa)
                </div>
                <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                  • <strong style={{ color: '#f1f5f9' }}>Primary Hazard:</strong> 354-hour Lunar Night (14 Earth days of 0 kW solar power &amp; -130°C freeze!)
                </div>
                <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                  • <strong style={{ color: '#f1f5f9' }}>Water Resource:</strong> Cryogenic sub-surface ice in cold traps (&lt; 40 K)
                </div>
              </div>
            </div>

            {/* 2. MARS CARD */}
            <div
              onClick={() => {
                setSelectedDest('MARS');
                soundFx.playClick(700);
              }}
              style={{
                background: selectedDest === 'MARS' ? 'rgba(249, 115, 22, 0.12)' : 'rgba(15, 23, 42, 0.6)',
                border: selectedDest === 'MARS' ? '2px solid #f97316' : '1px solid #1e293b',
                borderRadius: '12px',
                padding: '18px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                position: 'relative',
              }}
            >
              {selectedDest === 'MARS' && (
                <div
                  style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    background: '#ea580c',
                    borderRadius: '50%',
                    width: '22px',
                    height: '22px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Check size={14} className="text-white" />
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <div style={{ fontSize: '28px' }}>🔴</div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#f1f5f9' }}>
                    Jezero Crater
                  </h3>
                  <span style={{ fontSize: '11px', color: '#f97316', fontWeight: 700, fontFamily: 'monospace' }}>
                    ASTROCAMP MARS OUTPOST · 40 SOLS
                  </span>
                </div>
              </div>

              <p style={{ fontSize: '12.5px', color: '#cbd5e1', lineHeight: 1.5, marginBottom: '14px' }}>
                Command the first human settlement in Jezero Crater. Survive thin carbon dioxide air, abrasive regolith, and massive global dust storms.
              </p>

              {/* Real NASA Fact Card */}
              <div
                style={{
                  background: '#070b19',
                  border: '1px solid #1e293b',
                  borderRadius: '8px',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
              >
                <div style={{ fontSize: '10.5px', fontWeight: 800, color: '#f97316', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  📡 NASA Scientific Baselines (MSL &amp; M2020)
                </div>
                <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                  • <strong style={{ color: '#f1f5f9' }}>Gravity:</strong> 0.379g (38% of Earth)
                </div>
                <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                  • <strong style={{ color: '#f1f5f9' }}>Atmosphere:</strong> 95% CO₂, 610 Pa (0.6% Earth pressure)
                </div>
                <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                  • <strong style={{ color: '#f1f5f9' }}>Primary Hazard:</strong> Global Dust Storms (block up to 75% of solar power!)
                </div>
                <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                  • <strong style={{ color: '#f1f5f9' }}>Radio Delay:</strong> 4 to 24 minute speed-of-light lag to Houston
                </div>
              </div>
            </div>

          </div>

          {/* Difficulty Selection */}
          <div style={{ background: '#070c18', border: '1px solid #1e293b', borderRadius: '12px', padding: '16px' }}>
            <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#e2e8f0', marginBottom: '10px' }}>
              Select Training Difficulty:
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
              
              <button
                type="button"
                onClick={() => setDifficulty('CADET')}
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  background: difficulty === 'CADET' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(15, 23, 42, 0.6)',
                  border: difficulty === 'CADET' ? '1.5px solid #22c55e' : '1px solid #1e293b',
                  color: difficulty === 'CADET' ? '#4ade80' : '#94a3b8',
                  textAlign: 'left',
                  cursor: 'pointer',
                }}
              >
                <div style={{ fontWeight: 800, fontSize: '13px', color: '#f1f5f9' }}>🟢 Cadet (Recommended)</div>
                <div style={{ fontSize: '11px', marginTop: '4px', lineHeight: 1.4 }}>
                  Generous safety margins, 6 Build Points/day, slower resource decay.
                </div>
              </button>

              <button
                type="button"
                onClick={() => setDifficulty('ENGINEER')}
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  background: difficulty === 'ENGINEER' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(15, 23, 42, 0.6)',
                  border: difficulty === 'ENGINEER' ? '1.5px solid #38bdf8' : '1px solid #1e293b',
                  color: difficulty === 'ENGINEER' ? '#38bdf8' : '#94a3b8',
                  textAlign: 'left',
                  cursor: 'pointer',
                }}
              >
                <div style={{ fontWeight: 800, fontSize: '13px', color: '#f1f5f9' }}>🔵 Officer / Engineer</div>
                <div style={{ fontSize: '11px', marginTop: '4px', lineHeight: 1.4 }}>
                  Official NASA BVAD metabolic consumption rates, 4 Build Points/day.
                </div>
              </button>

              <button
                type="button"
                onClick={() => setDifficulty('COMMANDER')}
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  background: difficulty === 'COMMANDER' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(15, 23, 42, 0.6)',
                  border: difficulty === 'COMMANDER' ? '1.5px solid #ef4444' : '1px solid #1e293b',
                  color: difficulty === 'COMMANDER' ? '#f87171' : '#94a3b8',
                  textAlign: 'left',
                  cursor: 'pointer',
                }}
              >
                <div style={{ fontWeight: 800, fontSize: '13px', color: '#f1f5f9' }}>🔴 Commander (Hardcore)</div>
                <div style={{ fontSize: '11px', marginTop: '4px', lineHeight: 1.4 }}>
                  Harsh environment, 3 Build Points/day, severe radiation and dust penalties.
                </div>
              </button>

            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid #1e293b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(15, 23, 42, 0.8)',
          }}
        >
          <div style={{ fontSize: '12px', color: '#64748b' }}>
            Selected: <strong style={{ color: selectedDest === 'MOON' ? '#38bdf8' : '#f97316' }}>{selectedDest === 'MOON' ? 'Moon (Artemis Base Camp)' : 'Mars (Jezero Crater Outpost)'}</strong> · Difficulty: <strong style={{ color: '#f8fafc' }}>{difficulty}</strong>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={onClose}
              style={{
                padding: '10px 18px',
                borderRadius: '8px',
                background: 'transparent',
                border: '1px solid #334155',
                color: '#cbd5e1',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleLaunch}
              style={{
                padding: '10px 24px',
                borderRadius: '8px',
                background: selectedDest === 'MOON' ? 'linear-gradient(135deg, #0284c7, #2563eb)' : 'linear-gradient(135deg, #ea580c, #c2410c)',
                border: 'none',
                color: '#fff',
                fontWeight: 900,
                fontSize: '13.5px',
                letterSpacing: '0.03em',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: selectedDest === 'MOON' ? '0 0 20px rgba(2, 132, 199, 0.5)' : '0 0 20px rgba(234, 88, 12, 0.5)',
              }}
            >
              <Rocket size={16} />
              <span>LAUNCH MISSION: BUILD {selectedDest === 'MOON' ? 'LUNAR' : 'MARTIAN'} OUTPOST</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

