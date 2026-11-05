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
          backgroundColor: 'var(--color-paper-2)',
          border: 'var(--rule-hair) solid var(--color-rule)',
          borderRadius: '0px',
        }}
      >
        {/* Header */}
        <div className="modal-header" style={{ padding: '16px 22px', borderBottom: 'var(--rule-hair) solid var(--color-rule)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sliders size={18} color="var(--color-accent-2)" />
            <h2 className="modal-title" style={{ fontSize: '1.2rem', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--color-ink)' }}>
              Flight Computer Configuration &amp; Settings
            </h2>
          </div>
          <button onClick={onClose} className="modal-close-btn">
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Audio Controls */}
          <div style={{ backgroundColor: 'var(--color-paper-card)', padding: '16px', border: 'var(--rule-hair) solid var(--color-rule)' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-accent-2)', fontFamily: 'var(--font-outlier)', marginBottom: '12px' }}>
              Sound Effects &amp; CapCom Voice Audio
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {isMuted ? <VolumeX size={18} color="var(--color-error)" /> : <Volume2 size={18} color="var(--color-accent-green)" />}
                <span style={{ fontSize: '13px', color: 'var(--color-ink)' }}>Master Sound FX</span>
              </div>
              <button
                onClick={handleToggleSound}
                className={isMuted ? 'hm-btn-secondary' : 'hm-btn-primary'}
                style={{ padding: '6px 14px', fontSize: '11px', fontFamily: 'var(--font-outlier)' }}
              >
                {isMuted ? 'Muted' : 'Enabled'}
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {voiceEnabled ? <Mic size={18} color="var(--color-accent-2)" /> : <MicOff size={18} color="var(--color-muted)" />}
                <span style={{ fontSize: '13px', color: 'var(--color-ink)' }}>Speech Synthesis Briefings</span>
              </div>
              <button
                onClick={handleToggleVoice}
                className={voiceEnabled ? 'hm-btn-secondary' : 'hm-btn-secondary'}
                style={{ padding: '6px 14px', fontSize: '11px', fontFamily: 'var(--font-outlier)' }}
              >
                {voiceEnabled ? 'Active' : 'Off'}
              </button>
            </div>
          </div>

          {/* Graphics Quality */}
          <div style={{ backgroundColor: 'var(--color-paper-card)', padding: '16px', border: 'var(--rule-hair) solid var(--color-rule)' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-accent)', fontFamily: 'var(--font-outlier)', marginBottom: '12px' }}>
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
                    className={active ? 'hm-btn-primary' : 'hm-btn-secondary'}
                    style={{
                      padding: '10px 8px',
                      textAlign: 'center',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '12px' }}>{opt.label}</div>
                    <div style={{ fontSize: '9.5px', color: active ? 'var(--color-accent-ink)' : 'var(--color-muted)', lineHeight: 1.2 }}>{opt.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Reset Progress */}
          <div style={{ backgroundColor: 'var(--color-paper-card)', padding: '16px', border: 'var(--rule-hair) solid var(--color-rule)' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-error)', fontFamily: 'var(--font-outlier)', marginBottom: '8px' }}>
              Mission Progression Reset
            </div>
            <p style={{ fontSize: '12px', color: 'var(--color-muted)', marginBottom: '12px', lineHeight: 1.4 }}>
              Clear active outpost saved games, cadet academy XP, and mission certificates from this browser.
            </p>

            {!showResetConfirm ? (
              <button
                onClick={() => setShowResetConfirm(true)}
                className="hm-btn-secondary hm-nowrap"
                style={{ color: 'var(--color-error)', borderColor: 'var(--color-error)' }}
              >
                <RotateCcw size={14} />
                <span>Reset Local Data</span>
              </button>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  onClick={handleExecuteReset}
                  className="hm-btn-primary hm-nowrap"
                  style={{ backgroundColor: 'var(--color-error)', color: 'var(--color-ink)' }}
                >
                  Confirm Reset
                </button>
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="hm-btn-secondary hm-nowrap"
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
