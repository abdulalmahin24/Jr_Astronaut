import React, { useState } from 'react';
import {
  X,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  RotateCcw,
  Sliders
} from 'lucide-react';
import { soundFx } from '../utils/audioEffects';
import { speechEngine } from '../utils/speechEngine';
import { clearGameSave } from '../utils/simulationEngine';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  is3DView: boolean;
  onToggle3DView: (enable: boolean) => void;
  onResetAllData: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  is3DView,
  onToggle3DView,
  onResetAllData,
}) => {
  const [isMuted, setIsMuted] = useState(soundFx.getMuted());
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [graphicsQuality, setGraphicsQuality] = useState<'HIGH' | 'PERFORMANCE' | 'FALLBACK_2D'>(is3DView ? 'HIGH' : 'FALLBACK_2D');

  if (!isOpen) return null;

  const handleToggleSound = () => {
    const next = soundFx.toggleMute();
    setIsMuted(next);
  };

  const handleToggleVoice = () => {
    const next = !voiceEnabled;
    speechEngine.setMuted(!next);
    setVoiceEnabled(next);
  };

  const handleQualityChange = (mode: 'HIGH' | 'PERFORMANCE' | 'FALLBACK_2D') => {
    setGraphicsQuality(mode);
    soundFx.playClick(850);
    if (mode === 'FALLBACK_2D') {
      onToggle3DView(false);
    } else {
      onToggle3DView(true);
    }
  };

  const handleExecuteReset = () => {
    clearGameSave();
    try {
      localStorage.removeItem('astro_camp_completed_missions');
      localStorage.removeItem('jr_astrocamp_cadet_xp');
      localStorage.removeItem('jr_astrocamp_completed_lessons');
      sessionStorage.removeItem('astro_camp_launched');
    } catch {}
    soundFx.playImpact();
    setShowResetConfirm(false);
    onResetAllData();
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1300 }}>
      <div
        className="modal-container"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '560px',
          backgroundColor: '#0a0f1d',
          border: '1px solid rgba(56, 189, 248, 0.4)',
          borderRadius: '16px',
        }}
      >
        {/* Header */}
        <div className="modal-header" style={{ padding: '16px 22px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sliders size={20} className="text-cyan-400" />
            <h2 className="modal-title" style={{ fontSize: '1.2rem', fontWeight: 800 }}>
              Flight Computer Configuration &amp; Settings
            </h2>
          </div>
          <button onClick={onClose} className="modal-close-btn">
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Audio Controls */}
          <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', marginBottom: '12px' }}>
              Sound Effects &amp; CapCom Voice Audio
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {isMuted ? <VolumeX size={18} className="text-rose-400" /> : <Volume2 size={18} className="text-emerald-400" />}
                <span style={{ fontSize: '0.9rem', color: '#e2e8f0' }}>Master Sound FX</span>
              </div>
              <button
                onClick={handleToggleSound}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  backgroundColor: isMuted ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                  border: `1px solid ${isMuted ? '#ef4444' : '#10b981'}`,
                  color: isMuted ? '#f87171' : '#43ffa0',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                }}
              >
                {isMuted ? 'Muted' : 'Enabled'}
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {voiceEnabled ? <Mic size={18} className="text-cyan-400" /> : <MicOff size={18} className="text-slate-500" />}
                <span style={{ fontSize: '0.9rem', color: '#e2e8f0' }}>Speech Synthesis Briefings</span>
              </div>
              <button
                onClick={handleToggleVoice}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  backgroundColor: voiceEnabled ? 'rgba(56, 189, 248, 0.15)' : 'rgba(100, 116, 139, 0.15)',
                  border: `1px solid ${voiceEnabled ? '#38bdf8' : '#64748b'}`,
                  color: voiceEnabled ? '#38bdf8' : '#94a3b8',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                }}
              >
                {voiceEnabled ? 'Active' : 'Off'}
              </button>
            </div>
          </div>

          {/* Graphics Quality */}
          <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', marginBottom: '12px' }}>
              Rendering Engine &amp; Low-End Device Support
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {[
                { id: 'HIGH', label: '3D High', desc: 'Full Three.js WebGL with shadows & particles' },
                { id: 'PERFORMANCE', label: '3D Fast', desc: 'Optimized polygon count for Chromebooks' },
                { id: 'FALLBACK_2D', label: '2D Base', desc: 'Ultra-fast isometric SVG base schematic' },
              ].map((opt) => {
                const active = graphicsQuality === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => handleQualityChange(opt.id as any)}
                    style={{
                      padding: '10px 8px',
                      borderRadius: '8px',
                      border: active ? '1.5px solid #a78bfa' : '1px solid rgba(255, 255, 255, 0.1)',
                      backgroundColor: active ? 'rgba(167, 139, 250, 0.15)' : 'rgba(30, 41, 59, 0.4)',
                      color: active ? '#ffffff' : '#94a3b8',
                      cursor: 'pointer',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{opt.label}</div>
                    <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '3px', lineHeight: 1.2 }}>{opt.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Reset Progress */}
          <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f87171', textTransform: 'uppercase', marginBottom: '8px' }}>
              Mission Progression Reset
            </div>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '12px', lineHeight: 1.4 }}>
              Clear active outpost saved games, cadet academy XP, and mission certificates from this browser.
            </p>

            {!showResetConfirm ? (
              <button
                onClick={() => setShowResetConfirm(true)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid #ef4444',
                  color: '#f87171',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <RotateCcw size={14} />
                <span>Reset All Local Mission Data</span>
              </button>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  onClick={handleExecuteReset}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    backgroundColor: '#ef4444',
                    border: 'none',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                  }}
                >
                  Confirm Reset
                </button>
                <button
                  onClick={() => setShowResetConfirm(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    backgroundColor: 'transparent',
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: '#94a3b8',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
