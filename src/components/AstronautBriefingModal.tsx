import React, { useState, useEffect } from 'react';
import type { NasaMission } from '../data/nasaMissions';
import {
  X,
  Rocket,
  Volume2,
  VolumeX,
  Compass,
  CheckCircle2,
  Radio,
  FileText,
  MapPin,
  Thermometer,
  Shield
} from 'lucide-react';
import { soundFx } from '../utils/audioEffects';
import { speechEngine } from '../utils/speechEngine';

interface AstronautBriefingModalProps {
  mission: NasaMission | null;
  isOpen: boolean;
  onClose: () => void;
  onLaunchMission: (mission: NasaMission) => void;
}

export const AstronautBriefingModal: React.FC<AstronautBriefingModalProps> = ({
  mission,
  isOpen,
  onClose,
  onLaunchMission
}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      speechEngine.stop();
      setIsSpeaking(false);
    }
  }, [isOpen]);

  if (!isOpen || !mission) return null;

  const handleSpeakBriefing = () => {
    if (isSpeaking) {
      speechEngine.stop();
      setIsSpeaking(false);
      return;
    }

    setIsSpeaking(true);
    speechEngine.speak(
      mission.scientificProblem.briefingAudio,
      'COMMANDER_DADU',
      () => setIsSpeaking(false),
      () => setIsSpeaking(false)
    );
  };

  const handleLaunch = () => {
    speechEngine.stop();
    soundFx.playReactorStart();
    onLaunchMission(mission);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1000 }}>
      <div
        className="modal-container"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '780px',
          maxHeight: '90dvh',
          overflowY: 'auto',
          backgroundColor: 'var(--color-paper-2)',
          border: 'var(--rule-hair) solid var(--color-rule)',
          borderRadius: '0px',
        }}
      >
        {/* Top Header */}
        <div className="modal-header" style={{ padding: '16px 22px', borderBottom: 'var(--rule-hair) solid var(--color-rule)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.8rem' }}>{mission.missionPatchEmoji}</span>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--color-accent-2)', fontFamily: 'var(--font-outlier)' }}>
                NASA FLIGHT BRIEFING · MISSION #{mission.number}
              </div>
              <h2 className="modal-title" style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--color-ink)' }}>
                {mission.name}
              </h2>
            </div>
          </div>
          <button onClick={onClose} className="modal-close-btn">
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '24px' }}>
          {/* Audio Voice Briefing Player Banner */}
          <div style={{
            backgroundColor: 'var(--color-paper-card)',
            border: 'var(--rule-hair) solid var(--color-rule)',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-paper-3)', border: 'var(--rule-hair) solid var(--color-rule)' }}>
                <Radio size={18} color="var(--color-accent-2)" />
              </div>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-ink)', fontFamily: 'var(--font-display)' }}>
                  ASTRONAUT HOLOGRAPHIC VOICE BRIEFING
                </div>
                <div style={{ fontSize: '11px', color: 'var(--color-muted)', fontFamily: 'var(--font-outlier)' }}>
                  {isSpeaking ? 'CapCom transmitting flight briefing' : 'Click to hear NASA CapCom voice narration'}
                </div>
              </div>
            </div>

            <button
              onClick={handleSpeakBriefing}
              className={isSpeaking ? 'hm-btn-secondary' : 'hm-btn-primary'}
              style={{ padding: '6px 14px', fontSize: '11px', fontFamily: 'var(--font-outlier)' }}
            >
              {isSpeaking ? <VolumeX size={14} /> : <Volume2 size={14} />}
              <span>{isSpeaking ? 'Stop Audio' : 'Play Briefing'}</span>
            </button>
          </div>

          {/* Location & Mission Telemetry */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '10px',
            marginBottom: '20px'
          }}>
            <div style={{ backgroundColor: 'var(--color-paper-card)', padding: '12px 14px', border: 'var(--rule-hair) solid var(--color-rule)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-muted)', fontSize: '11px', fontFamily: 'var(--font-outlier)' }}>
                <MapPin size={13} color="var(--color-error)" />
                <span>Target Site</span>
              </div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-ink)', marginTop: '2px', fontFamily: 'var(--font-display)' }}>
                {mission.targetLocation}
              </div>
              <div style={{ fontSize: '10.5px', color: 'var(--color-muted)', fontFamily: 'var(--font-outlier)' }}>
                {mission.coordinates}
              </div>
            </div>

            <div style={{ backgroundColor: 'var(--color-paper-card)', padding: '12px 14px', border: 'var(--rule-hair) solid var(--color-rule)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-muted)', fontSize: '11px', fontFamily: 'var(--font-outlier)' }}>
                <Thermometer size={13} color="var(--color-accent)" />
                <span>Environment</span>
              </div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-ink)', marginTop: '2px', fontFamily: 'var(--font-display)' }}>
                {mission.surfaceTempC}
              </div>
              <div style={{ fontSize: '10.5px', color: 'var(--color-muted)', fontFamily: 'var(--font-outlier)' }}>
                Gravity: {mission.gravityG}g · {mission.atmosphere}
              </div>
            </div>

            <div style={{ backgroundColor: 'var(--color-paper-card)', padding: '12px 14px', border: 'var(--rule-hair) solid var(--color-rule)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-muted)', fontSize: '11px', fontFamily: 'var(--font-outlier)' }}>
                <Shield size={13} color="var(--color-accent-green)" />
                <span>Primary Instrument</span>
              </div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-ink)', marginTop: '2px', fontFamily: 'var(--font-display)' }}>
                {mission.primaryInstrument}
              </div>
            </div>
          </div>

          {/* Section 1: Astronaut First-Person Perspective */}
          <div style={{ marginBottom: '18px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-accent-2)', fontFamily: 'var(--font-outlier)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Compass size={14} />
              <span>ASTRONAUT FIRST-PERSON TELEMETRY</span>
            </div>
            <blockquote style={{
              margin: 0,
              padding: '12px 16px',
              backgroundColor: 'var(--color-paper-3)',
              borderLeft: '2px solid var(--color-accent-2)',
              fontStyle: 'italic',
              fontSize: '13px',
              color: 'var(--color-ink-2)',
              lineHeight: 1.5
            }}>
              "{mission.scientificProblem.astronautPOV}"
            </blockquote>
          </div>

          {/* Section 2: Real Scientific Problem */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-accent)', fontFamily: 'var(--font-outlier)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={14} />
              <span>THE ENGINEERING &amp; SCIENTIFIC PROBLEM</span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--color-ink-2)', lineHeight: 1.5, margin: 0 }}>
              {mission.scientificProblem.summary}
            </p>
          </div>

          {/* Section 3: Official NASA Citation */}
          <div style={{
            backgroundColor: 'var(--color-paper-3)',
            padding: '10px 14px',
            border: 'var(--rule-hair) solid var(--color-rule)',
            fontSize: '11px',
            color: 'var(--color-muted)',
            fontFamily: 'var(--font-outlier)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '24px'
          }}>
            <FileText size={15} color="var(--color-accent-2)" style={{ flexShrink: 0 }} />
            <div>
              <strong style={{ color: 'var(--color-ink)' }}>NASA Document: </strong>
              <span style={{ color: 'var(--color-ink-2)' }}>{mission.nasaCitation.title}</span> ({mission.nasaCitation.docNumber})
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button onClick={onClose} className="hm-btn-secondary hm-nowrap" style={{ padding: '8px 16px' }}>
              Cancel
            </button>
            <button
              onClick={handleLaunch}
              className="hm-btn-primary hm-nowrap"
              style={{ padding: '8px 20px' }}
            >
              <Rocket size={16} />
              <span>Accept Mission &amp; Commence EVA</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
