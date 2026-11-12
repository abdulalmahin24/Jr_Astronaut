import React, { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  X,
  Shield,
  Activity,
  Wind,
  Flame,
  Zap,
  ExternalLink,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Play,
  Volume2,
  VolumeX,
  Compass,
  Layers,
  Thermometer,
  Radio,
  Award,
} from 'lucide-react';
import {
  MARS_SURVIVAL_MISSIONS,
  type MarsSurvivalMission,
  type MarsSurvivalChoice,
} from '../data/marsSurvivalMissions';
import { soundFx } from '../utils/audioEffects';
import { awardCadetCredits } from '../utils/gearBonusHelper';

interface MarsSurvivalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMissionCompleted?: (missionId: string, creditsEarned: number) => void;
}

export const MarsSurvivalModal: React.FC<MarsSurvivalModalProps> = ({
  isOpen,
  onClose,
  onMissionCompleted,
}) => {
  const [selectedMissionIndex, setSelectedMissionIndex] = useState(0);
  const activeMission: MarsSurvivalMission = MARS_SURVIVAL_MISSIONS[selectedMissionIndex];

  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [resources, setResources] = useState(activeMission.initialResources);
  const [selectedChoice, setSelectedChoice] = useState<MarsSurvivalChoice | null>(null);
  const [isDecisionSubmitted, setIsDecisionSubmitted] = useState(false);
  const [missionOutcome, setMissionOutcome] = useState<'IN_PROGRESS' | 'SUCCESS' | 'FAILED'>('IN_PROGRESS');
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Reset when active mission changes or modal opens
  const resetMission = useCallback((mission: MarsSurvivalMission) => {
    setCurrentEventIndex(0);
    setResources(mission.initialResources);
    setSelectedChoice(null);
    setIsDecisionSubmitted(false);
    setMissionOutcome('IN_PROGRESS');
  }, []);

  useEffect(() => {
    if (isOpen) {
      resetMission(MARS_SURVIVAL_MISSIONS[selectedMissionIndex]);
    }
  }, [isOpen, selectedMissionIndex, resetMission]);

  // Accessibility: Esc key closes modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentEvent = activeMission.events[currentEventIndex];

  const handleApplyChoice = (choice: MarsSurvivalChoice) => {
    if (isDecisionSubmitted || missionOutcome !== 'IN_PROGRESS') return;
    setSelectedChoice(choice);
    setIsDecisionSubmitted(true);

    if (soundEnabled) {
      if (choice.isOptimal) soundFx.playReactorStart();
      else soundFx.playAlarm();
    }

    // Apply resource deltas
    setResources((prev) => {
      const nextOxygen = Math.min(100, Math.max(0, prev.oxygen + (choice.resourceDelta.oxygen || 0)));
      const nextPower = Math.min(100, Math.max(0, prev.power + (choice.resourceDelta.power || 0)));
      const nextThermal = Math.min(100, Math.max(0, prev.thermal + (choice.resourceDelta.thermal || 0)));
      const nextIntegrity = Math.min(100, Math.max(0, prev.integrity + (choice.resourceDelta.integrity || 0)));
      const nextScience = prev.science + (choice.resourceDelta.science || 0);

      // Check failure conditions
      if (nextOxygen <= 0 || nextPower <= 0 || nextIntegrity <= 0) {
        setMissionOutcome('FAILED');
        if (soundEnabled) soundFx.playAlarm();
      }

      return {
        oxygen: nextOxygen,
        power: nextPower,
        thermal: nextThermal,
        integrity: nextIntegrity,
        science: nextScience,
      };
    });
  };

  const handleAdvanceEvent = () => {
    if (currentEventIndex + 1 < activeMission.events.length) {
      setCurrentEventIndex((prev) => prev + 1);
      setSelectedChoice(null);
      setIsDecisionSubmitted(false);
      if (soundEnabled) soundFx.playClick(900);
    } else {
      // Mission Victory!
      setMissionOutcome('SUCCESS');
      if (soundEnabled) soundFx.playVictory();
      confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
      const credits = 350;
      awardCadetCredits(credits);
      try {
        localStorage.setItem(`astro_camp_mars_survive_${activeMission.id}`, 'true');
      } catch {}
      onMissionCompleted?.(activeMission.id, credits);
    }
  };

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 12000,
        backgroundColor: 'rgba(3, 5, 12, 0.94)',
        backdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        fontFamily: 'var(--font-mono, monospace)',
      }}
    >
      <div
        className="modal-container"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '1240px',
          maxWidth: '96vw',
          maxHeight: '94vh',
          backgroundColor: '#050811',
          border: '1.5px solid rgba(239, 68, 68, 0.45)',
          borderRadius: '18px',
          boxShadow: '0 25px 80px rgba(0, 0, 0, 0.95), 0 0 50px rgba(239, 68, 68, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Top Header */}
        <div
          style={{
            padding: '14px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            background: 'linear-gradient(90deg, #0f172a, #1a0f0f, #0f172a)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1.5px solid #ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                boxShadow: '0 0 20px rgba(239, 68, 68, 0.3)',
              }}
            >
              {activeMission.missionBadge}
            </div>
            <div>
              <div style={{ fontSize: '9.5px', color: '#f87171', fontWeight: 900, letterSpacing: '0.08em' }}>
                NASA PLANETARY DATA SYSTEM & REMS · MARS SURVIVAL SUITE
              </div>
              <h2
                style={{
                  fontSize: '18px',
                  fontWeight: 900,
                  color: '#f8fafc',
                  margin: 0,
                  fontFamily: 'var(--font-space, sans-serif)',
                }}
              >
                {activeMission.title}
              </h2>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '8px',
                padding: '6px 12px',
                color: soundEnabled ? '#38bdf8' : '#64748b',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '11px',
                fontWeight: 800,
              }}
            >
              {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
              <span>{soundEnabled ? 'AUDIO ON' : 'MUTED'}</span>
            </button>

            <button
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '8px',
                padding: '6px 12px',
                color: '#cbd5e1',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
              title="Close [ESC]"
            >
              <X size={16} />
              <span>ESC</span>
            </button>
          </div>
        </div>

        {/* 4 Mission Tab Selector Strip */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '8px',
            padding: '10px 20px',
            background: 'rgba(8, 12, 22, 0.95)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          {MARS_SURVIVAL_MISSIONS.map((m, idx) => {
            const isSelected = idx === selectedMissionIndex;
            return (
              <button
                key={m.id}
                onClick={() => {
                  setSelectedMissionIndex(idx);
                  if (soundEnabled) soundFx.playClick(850);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  borderRadius: '10px',
                  background: isSelected ? 'rgba(239, 68, 68, 0.18)' : 'rgba(255, 255, 255, 0.03)',
                  border: isSelected ? '1.5px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.08)',
                  color: isSelected ? '#ffffff' : '#94a3b8',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                }}
              >
                <span style={{ fontSize: '18px' }}>{m.missionBadge}</span>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: '11px', fontWeight: 900, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {m.title.split(':')[1]?.trim() || m.title}
                  </div>
                  <div style={{ fontSize: '9px', color: isSelected ? '#fca5a5' : '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {m.destinationName.split('·')[1]?.trim()}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Main Content Area */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Left Column: Environmental Telemetry & NASA Citation */}
          <div
            style={{
              width: '360px',
              borderRight: '1px solid rgba(255, 255, 255, 0.08)',
              background: 'rgba(6, 9, 18, 0.75)',
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              overflowY: 'auto',
            }}
          >
            {/* Mission Intel Badge */}
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '10px',
                padding: '12px',
              }}
            >
              <div style={{ fontSize: '10px', fontWeight: 900, color: '#f87171', marginBottom: '4px' }}>
                📍 SITE TELEMETRY (MARS TREK GIS)
              </div>
              <div style={{ fontSize: '12px', color: '#f8fafc', fontWeight: 800 }}>{activeMission.landingSite}</div>
              <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>
                Coords: {activeMission.coordinates} · Alt: {activeMission.elevationMeters}m
              </div>
            </div>

            {/* REMS Real-Time Environmental Telemetry Grid */}
            <div>
              <div style={{ fontSize: '10px', fontWeight: 900, color: '#38bdf8', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Activity size={12} />
                <span>REMS SENSOR LOG (GALE / JEZERO PDS)</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '8px', padding: '8px 10px' }}>
                  <div style={{ fontSize: '8.5px', color: '#64748b' }}>PRESSURE</div>
                  <div style={{ fontSize: '13px', fontWeight: 900, color: '#fbbf24' }}>{activeMission.atmosphericPressurePa} Pa</div>
                  <div style={{ fontSize: '8px', color: '#94a3b8' }}>~0.6% Earth bar</div>
                </div>

                <div style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '8px', padding: '8px 10px' }}>
                  <div style={{ fontSize: '8.5px', color: '#64748b' }}>TEMPERATURE</div>
                  <div style={{ fontSize: '12px', fontWeight: 900, color: '#38bdf8' }}>{activeMission.surfaceTempC}</div>
                  <div style={{ fontSize: '8px', color: '#94a3b8' }}>Cryogenic swing</div>
                </div>

                <div style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '8px', padding: '8px 10px' }}>
                  <div style={{ fontSize: '8.5px', color: '#64748b' }}>WIND VELOCITY</div>
                  <div style={{ fontSize: '13px', fontWeight: 900, color: '#4ade80' }}>{activeMission.windSpeedMs} m/s</div>
                  <div style={{ fontSize: '8px', color: '#94a3b8' }}>REMS Anemometer</div>
                </div>

                <div style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '8px', padding: '8px 10px' }}>
                  <div style={{ fontSize: '8.5px', color: '#64748b' }}>DUST OPACITY (τ)</div>
                  <div style={{ fontSize: '13px', fontWeight: 900, color: activeMission.dustOpacityTau > 2 ? '#f87171' : '#c084fc' }}>
                    {activeMission.dustOpacityTau}
                  </div>
                  <div style={{ fontSize: '8px', color: '#94a3b8' }}>Optical depth</div>
                </div>
              </div>
            </div>

            {/* Scientific Grounding & Context */}
            <div style={{ fontSize: '10px', color: '#94a3b8', lineHeight: 1.5, background: 'rgba(255, 255, 255, 0.02)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <div style={{ color: '#f8fafc', fontWeight: 800, marginBottom: '4px' }}>🔬 SCIENTIFIC DIRECTIVE</div>
              {activeMission.scientificContext}
            </div>

            {/* Official NASA Source Link */}
            <div style={{ marginTop: 'auto', paddingTop: '8px' }}>
              <a
                href={activeMission.nasaDatasetUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  background: 'rgba(14, 165, 233, 0.12)',
                  border: '1px solid rgba(56, 189, 248, 0.35)',
                  borderRadius: '8px',
                  color: '#38bdf8',
                  fontSize: '9.5px',
                  fontWeight: 800,
                  textDecoration: 'none',
                }}
              >
                <span>OPEN OFFICIAL NASA ARCHIVE</span>
                <ExternalLink size={12} />
              </a>
              <div style={{ fontSize: '8px', color: '#64748b', marginTop: '4px', textAlign: 'center' }}>
                {activeMission.nasaDataSourceLabel}
              </div>
            </div>
          </div>

          {/* Right Column: Mission Gameplay, Resource Gauges & Decision Events */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              padding: '20px 24px',
              overflowY: 'auto',
              background: 'radial-gradient(ellipse at 50% 20%, rgba(30, 15, 15, 0.35) 0%, rgba(5, 8, 17, 0.95) 100%)',
            }}
          >
            {/* Top Vital Gauges */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '12px',
                marginBottom: '20px',
              }}
            >
              {/* Oxygen */}
              <div style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: '10px', padding: '10px 12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', fontWeight: 800, color: '#94a3b8' }}>
                  <span>🫁 OXYGEN (MOXIE)</span>
                  <span style={{ color: resources.oxygen < 30 ? '#ef4444' : '#38bdf8' }}>{resources.oxygen}%</span>
                </div>
                <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', marginTop: '6px', overflow: 'hidden' }}>
                  <div style={{ width: `${resources.oxygen}%`, height: '100%', background: resources.oxygen < 30 ? '#ef4444' : 'linear-gradient(90deg, #0284c7, #38bdf8)' }} />
                </div>
              </div>

              {/* Power */}
              <div style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(251, 191, 36, 0.25)', borderRadius: '10px', padding: '10px 12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', fontWeight: 800, color: '#94a3b8' }}>
                  <span>⚡ POWER (MMRTG)</span>
                  <span style={{ color: resources.power < 25 ? '#ef4444' : '#fbbf24' }}>{resources.power}%</span>
                </div>
                <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', marginTop: '6px', overflow: 'hidden' }}>
                  <div style={{ width: `${resources.power}%`, height: '100%', background: resources.power < 25 ? '#ef4444' : 'linear-gradient(90deg, #d97706, #fbbf24)' }} />
                </div>
              </div>

              {/* Thermal Balance */}
              <div style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(244, 63, 94, 0.25)', borderRadius: '10px', padding: '10px 12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', fontWeight: 800, color: '#94a3b8' }}>
                  <span>🌡️ THERMAL LOOP</span>
                  <span style={{ color: resources.thermal < 30 ? '#ef4444' : '#f43f5e' }}>{resources.thermal}%</span>
                </div>
                <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', marginTop: '6px', overflow: 'hidden' }}>
                  <div style={{ width: `${resources.thermal}%`, height: '100%', background: resources.thermal < 30 ? '#ef4444' : 'linear-gradient(90deg, #e11d48, #fb7185)' }} />
                </div>
              </div>

              {/* Hull Integrity */}
              <div style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(52, 211, 153, 0.25)', borderRadius: '10px', padding: '10px 12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', fontWeight: 800, color: '#94a3b8' }}>
                  <span>🛡️ HULL INTEGRITY</span>
                  <span style={{ color: resources.integrity < 30 ? '#ef4444' : '#34d399' }}>{resources.integrity}%</span>
                </div>
                <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', marginTop: '6px', overflow: 'hidden' }}>
                  <div style={{ width: `${resources.integrity}%`, height: '100%', background: resources.integrity < 30 ? '#ef4444' : 'linear-gradient(90deg, #059669, #34d399)' }} />
                </div>
              </div>
            </div>

            {/* In-Progress Event Stage */}
            {missionOutcome === 'IN_PROGRESS' && currentEvent && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Event Header Banner */}
                <div
                  style={{
                    background: 'rgba(15, 23, 42, 0.95)',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    borderRadius: '12px',
                    padding: '16px 20px',
                    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.5)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <div style={{ fontSize: '10px', color: '#f87171', fontWeight: 900 }}>
                      STAGE {currentEventIndex + 1} OF {activeMission.events.length} · {currentEvent.timeString}
                    </div>
                    <div style={{ fontSize: '9.5px', color: '#cbd5e1', background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: '4px' }}>
                      {currentEvent.environmentalNotice}
                    </div>
                  </div>

                  <h3 style={{ fontSize: '17px', fontWeight: 900, color: '#f8fafc', margin: '0 0 8px 0', fontFamily: 'var(--font-space, sans-serif)' }}>
                    {currentEvent.title}
                  </h3>

                  <p style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: 1.6, margin: 0 }}>
                    {currentEvent.incidentReport}
                  </p>
                </div>

                {/* Choices Grid */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ fontSize: '10px', fontWeight: 900, color: '#fcd34d', letterSpacing: '0.08em' }}>
                    SELECT COMMANDER PROTOCOL ACTION:
                  </div>

                  {currentEvent.choices.map((choice) => {
                    const isSelected = selectedChoice?.id === choice.id;
                    return (
                      <button
                        key={choice.id}
                        disabled={isDecisionSubmitted}
                        onClick={() => handleApplyChoice(choice)}
                        style={{
                          background: isSelected
                            ? choice.isOptimal
                              ? 'rgba(16, 185, 129, 0.18)'
                              : 'rgba(239, 68, 68, 0.18)'
                            : 'rgba(15, 23, 42, 0.75)',
                          border: isSelected
                            ? choice.isOptimal
                              ? '1.5px solid #10b981'
                              : '1.5px solid #ef4444'
                            : '1px solid rgba(255, 255, 255, 0.12)',
                          borderRadius: '12px',
                          padding: '14px 18px',
                          textAlign: 'left',
                          cursor: isDecisionSubmitted ? 'default' : 'pointer',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '13px', fontWeight: 900, color: isSelected ? '#fff' : '#f1f5f9' }}>
                            {choice.title}
                          </span>
                          <span style={{ fontSize: '9px', color: '#94a3b8', background: 'rgba(0,0,0,0.4)', padding: '2px 8px', borderRadius: '4px' }}>
                            {choice.scientificTradeOff}
                          </span>
                        </div>

                        <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: 1.4 }}>
                          {choice.description}
                        </div>

                        {isSelected && (
                          <div
                            style={{
                              marginTop: '8px',
                              padding: '8px 12px',
                              borderRadius: '8px',
                              background: choice.isOptimal ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                              border: `1px solid ${choice.isOptimal ? '#10b981' : '#ef4444'}`,
                              fontSize: '11px',
                              fontWeight: 800,
                              color: choice.isOptimal ? '#34d399' : '#fca5a5',
                            }}
                          >
                            {choice.consequenceText}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Advance Button */}
                {isDecisionSubmitted && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'auto', paddingTop: '12px' }}>
                    <button
                      onClick={handleAdvanceEvent}
                      style={{
                        padding: '12px 28px',
                        background: 'linear-gradient(135deg, #ef4444, #b91c1c)',
                        border: 'none',
                        borderRadius: '10px',
                        color: '#fff',
                        fontSize: '12px',
                        fontWeight: 900,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        boxShadow: '0 4px 20px rgba(239, 68, 68, 0.4)',
                      }}
                    >
                      <span>CONTINUE TO NEXT SOL INCIDENT</span>
                      <span>→</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Victory Screen */}
            {missionOutcome === 'SUCCESS' && (
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  padding: '24px',
                  background: 'rgba(16, 185, 129, 0.08)',
                  border: '1.5px solid #10b981',
                  borderRadius: '16px',
                  boxShadow: '0 0 50px rgba(16, 185, 129, 0.2)',
                }}
              >
                <div style={{ fontSize: '48px', marginBottom: '10px' }}>🏆</div>
                <h3 style={{ fontSize: '22px', fontWeight: 900, color: '#34d399', margin: '0 0 8px 0', fontFamily: 'var(--font-space, sans-serif)' }}>
                  MARS EXPEDITION SURVIVED!
                </h3>
                <p style={{ fontSize: '13px', color: '#cbd5e1', maxWidth: '580px', lineHeight: 1.6, marginBottom: '20px' }}>
                  Commander, your rigorous NASA scientific decision-making saved the expedition. All life-support and mission objectives nominal.
                </p>

                <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
                  <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '10px 18px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ fontSize: '9px', color: '#94a3b8' }}>AWARDED REWARD</div>
                    <div style={{ fontSize: '18px', fontWeight: 900, color: '#fbbf24' }}>+350 CADET CREDITS</div>
                  </div>
                  <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '10px 18px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ fontSize: '9px', color: '#94a3b8' }}>SCIENCE DISCOVERY</div>
                    <div style={{ fontSize: '18px', fontWeight: 900, color: '#38bdf8' }}>+{resources.science} XP POINTS</div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={() => resetMission(activeMission)}
                    style={{
                      padding: '10px 20px',
                      background: 'rgba(255,255,255,0.08)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '10px',
                      color: '#fff',
                      fontSize: '11px',
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    REPLAY MISSION
                  </button>

                  <button
                    onClick={() => {
                      const nextIdx = (selectedMissionIndex + 1) % MARS_SURVIVAL_MISSIONS.length;
                      setSelectedMissionIndex(nextIdx);
                    }}
                    style={{
                      padding: '10px 24px',
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      border: 'none',
                      borderRadius: '10px',
                      color: '#fff',
                      fontSize: '11px',
                      fontWeight: 900,
                      cursor: 'pointer',
                    }}
                  >
                    NEXT SURVIVAL MISSION →
                  </button>
                </div>
              </div>
            )}

            {/* Failure Screen */}
            {missionOutcome === 'FAILED' && (
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  padding: '24px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1.5px solid #ef4444',
                  borderRadius: '16px',
                }}
              >
                <div style={{ fontSize: '48px', marginBottom: '10px' }}>⚠️</div>
                <h3 style={{ fontSize: '22px', fontWeight: 900, color: '#f87171', margin: '0 0 8px 0' }}>
                  CRITICAL EXPEDITION FAILURE
                </h3>
                <p style={{ fontSize: '13px', color: '#cbd5e1', maxWidth: '540px', lineHeight: 1.6, marginBottom: '20px' }}>
                  A vital life-support or structural system reached zero percent. Review the REMS environmental logs and adjust commander protocol trade-offs.
                </p>

                <button
                  onClick={() => resetMission(activeMission)}
                  style={{
                    padding: '12px 28px',
                    background: 'linear-gradient(135deg, #ef4444, #b91c1c)',
                    border: 'none',
                    borderRadius: '10px',
                    color: '#fff',
                    fontSize: '12px',
                    fontWeight: 900,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <RotateCcw size={16} />
                  <span>RETRY SURVIVAL PROTOCOL</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

