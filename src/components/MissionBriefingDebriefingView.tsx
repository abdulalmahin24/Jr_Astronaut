// ============================================================================
// MissionBriefingDebriefingView.tsx
// Comprehensive NASA Pre-Flight Briefing & Post-Flight Debriefing Center
// Includes: Holographic CapCom Audio, Systems GO/NO-GO Checklist,
// Flight Directives, Pre-Flight Hypothesis, Telemetry Scorecard,
// AIB Causal Autopsy, and Student Reflection Logs
// Built for NASA International Space Apps Challenge 2026 · Team Mysterio
// ============================================================================

import React, { useState, useEffect } from 'react';
import { NASA_MISSIONS, type NasaMission } from '../data/nasaMissions';
import {
  Radio,
  CheckCircle2,
  Award,
  FileText,
  Compass,
  Rocket,
  Shield,
  RotateCcw,
  HelpCircle,
} from 'lucide-react';
import { soundFx } from '../utils/audioEffects';
import { speechEngine } from '../utils/speechEngine';
import { awardCadetCredits } from '../utils/gearBonusHelper';

interface MissionBriefingDebriefingViewProps {
  initialMissionId?: string;
  onLaunchMission?: (missionId: string) => void;
  onOpenCertificate?: (missionName: string) => void;
}

export type BriefingRoomMode = 'PRE_FLIGHT_BRIEFING' | 'POST_FLIGHT_DEBRIEFING';

export const MissionBriefingDebriefingView: React.FC<MissionBriefingDebriefingViewProps> = ({
  initialMissionId = 'apollo-11',
  onLaunchMission,
  onOpenCertificate,
}) => {
  const [selectedMissionId, setSelectedMissionId] = useState<string>(initialMissionId);
  const [roomMode, setRoomMode] = useState<BriefingRoomMode>('PRE_FLIGHT_BRIEFING');
  const [filterEra, setFilterEra] = useState<string>('ALL');
  const [isCapcomSpeaking, setIsCapcomSpeaking] = useState<boolean>(false);

  // Pre-flight Systems Checklist state
  const [systemsChecklist, setSystemsChecklist] = useState<Record<string, boolean>>({
    propellantUllage: true,
    gyroGuidance: true,
    eclssLifeSupport: true,
    stagingPyros: true,
    rcsThrusters: true,
    heatShieldTiles: true,
  });

  // Student Hypothesis (Pre-flight) & Reflection (Post-flight) state
  const [studentHypothesis, setStudentHypothesis] = useState<string>('');
  const [studentReflection, setStudentReflection] = useState<string>('');
  const [savedNotification, setSavedNotification] = useState<string | null>(null);

  // Active Mission
  const activeMission: NasaMission =
    NASA_MISSIONS.find((m) => m.id === selectedMissionId) || NASA_MISSIONS[0];

  // Load saved hypothesis/reflection from localStorage when mission changes
  useEffect(() => {
    try {
      const savedHypo = localStorage.getItem(`astrocamp_hypo_${selectedMissionId}`) || '';
      const savedRefl = localStorage.getItem(`astrocamp_refl_${selectedMissionId}`) || '';
      setStudentHypothesis(savedHypo);
      setStudentReflection(savedRefl);
    } catch {}
    speechEngine.stop();
    setIsCapcomSpeaking(false);
  }, [selectedMissionId]);

  // Clean up speech on unmount
  useEffect(() => {
    return () => {
      speechEngine.stop();
    };
  }, []);

  // Filtered Mission List
  const filteredMissions = NASA_MISSIONS.filter((m) => {
    if (filterEra === 'ALL') return true;
    if (filterEra === 'MOON') return m.destination === 'MOON';
    if (filterEra === 'MARS') return m.destination === 'MARS';
    if (filterEra === 'EARTH') return m.destination === 'EARTH' || m.era === 'PIONEERS' || m.era === 'SHUTTLE_ISS';
    if (filterEra === 'DEEP_SPACE') return m.destination === 'DEEP_SPACE' || m.era === 'DEEP_WORLDS' || m.era === 'COSMIC_SENTINELS';
    return true;
  });

  // Toggle CapCom voiceover
  const handleToggleCapcomSpeech = () => {
    if (isCapcomSpeaking) {
      speechEngine.stop();
      setIsCapcomSpeaking(false);
      soundFx.playClick(650);
    } else {
      setIsCapcomSpeaking(true);
      speechEngine.speak(
        activeMission.scientificProblem.briefingAudio,
        'HOUSTON_CAPCOM',
        () => setIsCapcomSpeaking(false),
        () => setIsCapcomSpeaking(false)
      );
      soundFx.playRadioChirp();
    }
  };

  // Save student reflection/hypothesis
  const handleSaveHypothesis = () => {
    try {
      localStorage.setItem(`astrocamp_hypo_${selectedMissionId}`, studentHypothesis);
      setSavedNotification('Pre-Flight Hypothesis Saved to Flight Manifest ✓');
      soundFx.playTelemetryChirp();
      setTimeout(() => setSavedNotification(null), 3000);
    } catch {}
  };

  const handleSaveReflection = () => {
    try {
      localStorage.setItem(`astrocamp_refl_${selectedMissionId}`, studentReflection);
      awardCadetCredits(150);
      setSavedNotification('Post-Flight Reflection Logged (+150 Cadet Credits awarded) ✓');
      soundFx.playVictory();
      setTimeout(() => setSavedNotification(null), 3000);
    } catch {}
  };

  const allSystemsGo = Object.values(systemsChecklist).every(Boolean);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        width: '100%',
        maxWidth: '1100px',
        margin: '0 auto',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: '#f8fafc',
      }}
    >
      {/* ── TOP ROOM SWITCHER: PRE-FLIGHT BRIEFING vs POST-FLIGHT DEBRIEFING ── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          background: 'rgba(15, 23, 42, 0.95)',
          padding: '12px 20px',
          borderRadius: '14px',
          border: '1.5px solid rgba(56, 189, 248, 0.25)',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.6)',
        }}
      >
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => {
              setRoomMode('PRE_FLIGHT_BRIEFING');
              soundFx.playClick(850);
            }}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              background:
                roomMode === 'PRE_FLIGHT_BRIEFING'
                  ? 'linear-gradient(135deg, #0284c7, #2563eb)'
                  : 'rgba(255, 255, 255, 0.05)',
              border: `1.5px solid ${roomMode === 'PRE_FLIGHT_BRIEFING' ? '#38bdf8' : 'rgba(255, 255, 255, 0.1)'}`,
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: roomMode === 'PRE_FLIGHT_BRIEFING' ? '0 0 16px rgba(56, 189, 248, 0.4)' : 'none',
            }}
          >
            <Compass size={16} />
            <span>📋 1. PRE-FLIGHT BRIEFING ROOM</span>
          </button>

          <button
            onClick={() => {
              setRoomMode('POST_FLIGHT_DEBRIEFING');
              soundFx.playClick(850);
            }}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              background:
                roomMode === 'POST_FLIGHT_DEBRIEFING'
                  ? 'linear-gradient(135deg, #059669, #0d9488)'
                  : 'rgba(255, 255, 255, 0.05)',
              border: `1.5px solid ${roomMode === 'POST_FLIGHT_DEBRIEFING' ? '#34d399' : 'rgba(255, 255, 255, 0.1)'}`,
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: roomMode === 'POST_FLIGHT_DEBRIEFING' ? '0 0 16px rgba(52, 211, 153, 0.4)' : 'none',
            }}
          >
            <Award size={16} />
            <span>🎯 2. POST-FLIGHT DEBRIEFING ROOM</span>
          </button>
        </div>

        {/* Destination Filter Pills */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {[
            { id: 'ALL', label: 'All 76' },
            { id: 'MOON', label: '🌕 Moon' },
            { id: 'MARS', label: '🔴 Mars' },
            { id: 'EARTH', label: '🌍 Earth Orbit' },
            { id: 'DEEP_SPACE', label: '🪐 Deep Space' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => {
                setFilterEra(f.id);
                soundFx.playClick(700);
              }}
              style={{
                padding: '5px 10px',
                borderRadius: '6px',
                background: filterEra === f.id ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${filterEra === f.id ? '#38bdf8' : 'rgba(255,255,255,0.1)'}`,
                color: filterEra === f.id ? '#38bdf8' : '#94a3b8',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── MISSION ROSTER HORIZONTAL STRIP ── */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '6px',
        }}
      >
        {filteredMissions.slice(0, 18).map((m) => {
          const isSelected = m.id === activeMission.id;
          return (
            <button
              key={m.id}
              onClick={() => {
                setSelectedMissionId(m.id);
                soundFx.playClick(750);
              }}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                background: isSelected ? 'rgba(15, 23, 42, 0.95)' : 'rgba(15, 23, 42, 0.5)',
                border: `1.5px solid ${isSelected ? '#38bdf8' : 'rgba(255, 255, 255, 0.1)'}`,
                color: isSelected ? '#ffffff' : '#94a3b8',
                fontSize: '11px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                whiteSpace: 'nowrap',
                boxShadow: isSelected ? '0 0 14px rgba(56, 189, 248, 0.35)' : 'none',
              }}
            >
              <span>{m.missionPatchEmoji}</span>
              <span>#{m.number} {m.name}</span>
            </button>
          );
        })}
      </div>

      {/* ── NOTIFICATION TOAST ── */}
      {savedNotification && (
        <div
          style={{
            background: 'rgba(16, 185, 129, 0.2)',
            border: '1px solid #10b981',
            borderRadius: '8px',
            padding: '10px 18px',
            color: '#4ade80',
            fontWeight: 800,
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <CheckCircle2 size={16} />
          <span>{savedNotification}</span>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────
          VIEW 1: PRE-FLIGHT BRIEFING ROOM
          ──────────────────────────────────────────────────────────────────── */}
      {roomMode === 'PRE_FLIGHT_BRIEFING' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Header Banner: Mission Overview & CapCom Audio Comms */}
          <div
            style={{
              padding: '24px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 58, 138, 0.3))',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div
                style={{
                  fontSize: '40px',
                  width: '64px',
                  height: '64px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '14px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                {activeMission.missionPatchEmoji}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 900,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: 'rgba(56, 189, 248, 0.2)',
                      color: '#38bdf8',
                    }}
                  >
                    NASA {activeMission.nasaProgram.toUpperCase()} · FLIGHT #{activeMission.number}
                  </span>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>Launch Year: {activeMission.launchYear}</span>
                </div>
                <h2 style={{ fontSize: '22px', fontWeight: 900, margin: 0, color: '#ffffff' }}>
                  {activeMission.name}
                </h2>
                <p style={{ fontSize: '13px', color: '#38bdf8', margin: '4px 0 0', fontWeight: 600 }}>
                  {activeMission.tagline}
                </p>
              </div>
            </div>

            {/* CapCom Voice Comms Button */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                onClick={handleToggleCapcomSpeech}
                style={{
                  padding: '10px 18px',
                  borderRadius: '8px',
                  background: isCapcomSpeaking ? 'rgba(239, 68, 68, 0.25)' : 'rgba(56, 189, 248, 0.15)',
                  border: `1.5px solid ${isCapcomSpeaking ? '#ef4444' : '#38bdf8'}`,
                  color: isCapcomSpeaking ? '#fca5a5' : '#38bdf8',
                  fontSize: '12px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: isCapcomSpeaking ? '0 0 16px rgba(239, 68, 68, 0.4)' : 'none',
                }}
              >
                <Radio size={16} className={isCapcomSpeaking ? 'animate-pulse' : ''} />
                <span>{isCapcomSpeaking ? 'STOP CAPCOM COMMS' : 'TRANSMIT HOUSTON CAPCOM BRIEFING'}</span>
              </button>

              {onLaunchMission && (
                <button
                  onClick={() => {
                    soundFx.playReactorStart();
                    onLaunchMission(activeMission.id);
                  }}
                  disabled={!allSystemsGo}
                  style={{
                    padding: '10px 22px',
                    borderRadius: '8px',
                    background: allSystemsGo
                      ? 'linear-gradient(135deg, #0284c7, #2563eb)'
                      : 'rgba(255, 255, 255, 0.1)',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '12px',
                    fontWeight: 900,
                    cursor: allSystemsGo ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: allSystemsGo ? '0 0 20px rgba(56, 189, 248, 0.5)' : 'none',
                  }}
                >
                  <Rocket size={16} />
                  <span>{allSystemsGo ? 'GO FOR LAUNCH ➔ 3D COCKPIT' : 'COMPLETE PRE-FLIGHT CHECKLIST'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Grid: Directive & Astronaut POV */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '16px' }}>
            {/* Left: Flight Directive */}
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.8)',
                padding: '20px',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: 900, color: '#f59e0b', textTransform: 'uppercase', marginBottom: '8px' }}>
                NASA Flight Directive & Scientific Objective
              </div>
              <p style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: 1.6, margin: '0 0 12px' }}>
                {activeMission.scientificProblem.summary}
              </p>
              <div
                style={{
                  background: 'rgba(245, 158, 11, 0.08)',
                  padding: '12px 14px',
                  borderRadius: '8px',
                  borderLeft: '3px solid #f59e0b',
                  fontSize: '12px',
                  color: '#e2e8f0',
                }}
              >
                <strong style={{ color: '#fbbf24' }}>Primary Target: </strong>
                {activeMission.targetLocation} ({activeMission.coordinates})
              </div>
            </div>

            {/* Right: Astronaut POV */}
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.8)',
                padding: '20px',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: 900, color: '#38bdf8', textTransform: 'uppercase', marginBottom: '8px' }}>
                Commander's Eye View & Operational POV
              </div>
              <p style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: 1.6, margin: '0 0 12px', fontStyle: 'italic' }}>
                "{activeMission.scientificProblem.astronautPOV}"
              </p>
              <div
                style={{
                  background: 'rgba(56, 189, 248, 0.08)',
                  padding: '12px 14px',
                  borderRadius: '8px',
                  borderLeft: '3px solid #38bdf8',
                  fontSize: '12px',
                  color: '#e2e8f0',
                }}
              >
                <strong style={{ color: '#38bdf8' }}>Primary Instrument: </strong>
                {activeMission.primaryInstrument}
              </div>
            </div>
          </div>

          {/* Environmental Conditions Grid */}
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.8)',
              padding: '18px 20px',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <div style={{ fontSize: '11px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '12px' }}>
              Target Environment Telemetry & Physical Constraints
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px 14px', borderRadius: '8px' }}>
                <div style={{ fontSize: '10px', color: '#94a3b8' }}>SURFACE GRAVITY</div>
                <div style={{ fontSize: '16px', fontWeight: 900, color: '#ffffff' }}>{activeMission.gravityG} G</div>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px 14px', borderRadius: '8px' }}>
                <div style={{ fontSize: '10px', color: '#94a3b8' }}>ATMOSPHERE</div>
                <div style={{ fontSize: '14px', fontWeight: 900, color: '#38bdf8' }}>{activeMission.atmosphere}</div>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px 14px', borderRadius: '8px' }}>
                <div style={{ fontSize: '10px', color: '#94a3b8' }}>SURFACE TEMPERATURE</div>
                <div style={{ fontSize: '16px', fontWeight: 900, color: '#fbbf24' }}>{activeMission.surfaceTempC}</div>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px 14px', borderRadius: '8px' }}>
                <div style={{ fontSize: '10px', color: '#94a3b8' }}>DESTINATION BODY</div>
                <div style={{ fontSize: '16px', fontWeight: 900, color: '#4ade80' }}>{activeMission.destinationName}</div>
              </div>
            </div>
          </div>

          {/* Interactive Pre-Flight Systems GO/NO-GO Checklist */}
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.9)',
              padding: '20px',
              borderRadius: '12px',
              border: `1.5px solid ${allSystemsGo ? 'rgba(74, 222, 128, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Shield size={16} color={allSystemsGo ? '#4ade80' : '#ef4444'} />
                <strong style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  PRE-FLIGHT SYSTEMS GO / NO-GO CHECKLIST
                </strong>
              </div>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 900,
                  padding: '3px 10px',
                  borderRadius: '4px',
                  background: allSystemsGo ? 'rgba(74, 222, 128, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                  color: allSystemsGo ? '#4ade80' : '#f87171',
                }}
              >
                {allSystemsGo ? 'STATUS: ALL SYSTEMS GO FOR LAUNCH' : 'STATUS: PENDING CREW VERIFICATION'}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px' }}>
              {[
                { key: 'propellantUllage', label: 'Propellant Mass & Cryo Ullage Pressurization' },
                { key: 'gyroGuidance', label: '3-Axis Inertial Guidance Platform & Gyros Aligned' },
                { key: 'eclssLifeSupport', label: 'ECLSS Oxygen Loop & Lithium Battery Reserves Nominal' },
                { key: 'stagingPyros', label: 'Stage Separation Pyrotechnic Collets Armed' },
                { key: 'rcsThrusters', label: 'RCS Quads & Reaction Wheels Calibrated' },
                { key: 'heatShieldTiles', label: 'Thermal Protection System (TPS) Verified' },
              ].map((item) => (
                <label
                  key={item.key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    background: systemsChecklist[item.key] ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    border: `1px solid ${systemsChecklist[item.key] ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: 700,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={systemsChecklist[item.key]}
                    onChange={(e) => {
                      setSystemsChecklist((prev) => ({ ...prev, [item.key]: e.target.checked }));
                      soundFx.playClick(800);
                    }}
                    style={{ accentColor: '#10b981', cursor: 'pointer' }}
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Student Pre-Flight Hypothesis Input */}
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.85)',
              padding: '20px',
              borderRadius: '12px',
              border: '1px solid rgba(56, 189, 248, 0.3)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#38bdf8', fontSize: '12px', fontWeight: 900 }}>
                <HelpCircle size={15} />
                <span>CADET PRE-FLIGHT HYPOTHESIS & PREDICTION</span>
              </div>
              <button
                onClick={handleSaveHypothesis}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  background: 'rgba(56, 189, 248, 0.2)',
                  border: '1px solid #38bdf8',
                  color: '#38bdf8',
                  fontSize: '11px',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                Save Hypothesis
              </button>
            </div>
            <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 10px' }}>
              Predict your flight profile before launch: What throttle schedule and pitch curve will you use to achieve orbit or landing without exhausting your propellant reserve?
            </p>
            <textarea
              value={studentHypothesis}
              onChange={(e) => setStudentHypothesis(e.target.value)}
              placeholder="e.g., I predict that initiating the gravity turn at 50 km and throttling down to 40% in the terminal descent will leave at least 15% fuel margin upon touchdown..."
              style={{
                width: '100%',
                height: '75px',
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '8px',
                padding: '10px',
                color: '#f8fafc',
                fontSize: '12px',
                fontFamily: 'inherit',
                resize: 'none',
              }}
            />
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────
          VIEW 2: POST-FLIGHT DEBRIEFING ROOM
          ──────────────────────────────────────────────────────────────────── */}
      {roomMode === 'POST_FLIGHT_DEBRIEFING' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Top Debrief Banner */}
          <div
            style={{
              padding: '24px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, rgba(6, 78, 59, 0.4), rgba(15, 23, 42, 0.95))',
              border: '1.5px solid rgba(16, 185, 129, 0.4)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 900,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: 'rgba(16, 185, 129, 0.25)',
                    color: '#4ade80',
                  }}
                >
                  NASA FLIGHT INVESTIGATION & DEBRIEF REPORT
                </span>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>Mission #{activeMission.number}</span>
              </div>
              <h2 style={{ fontSize: '22px', fontWeight: 900, margin: 0, color: '#ffffff' }}>
                {activeMission.name} · Post-Flight Telemetry Cross-Examination
              </h2>
              <p style={{ fontSize: '12px', color: '#6ee7b7', margin: '4px 0 0' }}>
                Accident Investigation Board (AIB) Telemetry Analysis & Systems Performance Review
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              {onOpenCertificate && (
                <button
                  onClick={() => {
                    soundFx.playVictory();
                    onOpenCertificate(activeMission.name);
                  }}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '12px',
                    fontWeight: 900,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 0 16px rgba(245, 158, 11, 0.4)',
                  }}
                >
                  <Award size={16} />
                  <span>VIEW OFFICIAL FLIGHT CERTIFICATE</span>
                </button>
              )}

              {onLaunchMission && (
                <button
                  onClick={() => onLaunchMission(activeMission.id)}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: '#ffffff',
                    fontSize: '12px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <RotateCcw size={14} />
                  <span>RE-FLY MISSION</span>
                </button>
              )}
            </div>
          </div>

          {/* Telemetry Scorecard Metrics */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '12px',
            }}
          >
            <div style={{ background: 'rgba(15, 23, 42, 0.85)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 800 }}>ORBIT INSERTION DELTA-V</div>
              <div style={{ fontSize: '20px', fontWeight: 900, color: '#4ade80', margin: '4px 0' }}>NOMINAL (98.4%)</div>
              <div style={{ fontSize: '11px', color: '#cbd5e1' }}>Trajectory error &lt; 0.04%</div>
            </div>

            <div style={{ background: 'rgba(15, 23, 42, 0.85)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 800 }}>PROPELLANT RESERVE MARGIN</div>
              <div style={{ fontSize: '20px', fontWeight: 900, color: '#38bdf8', margin: '4px 0' }}>18.2% REMAINING</div>
              <div style={{ fontSize: '11px', color: '#cbd5e1' }}>Exceeded 10% NASA safety gate</div>
            </div>

            <div style={{ background: 'rgba(15, 23, 42, 0.85)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 800 }}>PEAK CREW ACCELERATION</div>
              <div style={{ fontSize: '20px', fontWeight: 900, color: '#fbbf24', margin: '4px 0' }}>3.8 G MAX</div>
              <div style={{ fontSize: '11px', color: '#cbd5e1' }}>Well below 6.0 G blackout limit</div>
            </div>

            <div style={{ background: 'rgba(15, 23, 42, 0.85)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 800 }}>TOUCHDOWN VELOCITY</div>
              <div style={{ fontSize: '20px', fontWeight: 900, color: '#a78bfa', margin: '4px 0' }}>1.4 m/s</div>
              <div style={{ fontSize: '11px', color: '#cbd5e1' }}>Landing gear stress &lt; 25% max</div>
            </div>
          </div>

          {/* NASA Accident Investigation Board (AIB) Causal Diagnostic */}
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.9)',
              padding: '22px',
              borderRadius: '12px',
              border: '1.5px solid rgba(56, 189, 248, 0.3)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#38bdf8', marginBottom: '10px' }}>
              <Shield size={18} />
              <strong style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                ACCIDENT INVESTIGATION BOARD (AIB) // CAUSAL FLIGHT ANALYSIS
              </strong>
            </div>

            <p style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: 1.6, margin: '0 0 14px' }}>
              Flight telemetry logs confirm successful staging and orbital entry profile.
              The pilot maintained positive attitude stabilization and avoided excessive aerodynamic heating through the Max-Q pressure regime.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px 16px', borderRadius: '8px', borderLeft: '3px solid #10b981' }}>
                <strong style={{ color: '#4ade80', fontSize: '12px' }}>✓ STAGING SEPARATION: </strong>
                <span style={{ fontSize: '12px', color: '#cbd5e1' }}>Pyro release at T+140s cleanly cleared the core without debris re-contact.</span>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px 16px', borderRadius: '8px', borderLeft: '3px solid #38bdf8' }}>
                <strong style={{ color: '#38bdf8', fontSize: '12px' }}>✓ GRAVITY TURN OPTIMIZATION: </strong>
                <span style={{ fontSize: '12px', color: '#cbd5e1' }}>Pitch angle transitioned smoothly from 90° to 10°, minimizing gravity losses.</span>
              </div>
            </div>
          </div>

          {/* Prediction vs Actual Reality Comparison */}
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.85)',
              padding: '20px',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <div style={{ fontSize: '12px', fontWeight: 900, color: '#f59e0b', textTransform: 'uppercase', marginBottom: '10px' }}>
              Pre-Flight Hypothesis vs Actual Flight Reality
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '14px' }}>
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '14px', borderRadius: '8px' }}>
                <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 800, marginBottom: '4px' }}>YOUR PRE-FLIGHT HYPOTHESIS:</div>
                <div style={{ fontSize: '12px', color: studentHypothesis ? '#ffffff' : '#64748b', fontStyle: studentHypothesis ? 'normal' : 'italic' }}>
                  {studentHypothesis || 'No hypothesis recorded prior to launch. Complete pre-flight briefing to log predictions.'}
                </div>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '14px', borderRadius: '8px' }}>
                <div style={{ fontSize: '11px', color: '#4ade80', fontWeight: 800, marginBottom: '4px' }}>ACTUAL TELEMETRY OUTCOME:</div>
                <div style={{ fontSize: '12px', color: '#cbd5e1' }}>
                  Trajectory achieved stable orbital circularization at 185 km with 18.2% fuel reserve. Velocity reached 7.82 km/s.
                </div>
              </div>
            </div>
          </div>

          {/* Student Post-Flight Reflection & Debrief Journal */}
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.85)',
              padding: '20px',
              borderRadius: '12px',
              border: '1px solid rgba(16, 185, 129, 0.3)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#4ade80', fontSize: '12px', fontWeight: 900 }}>
                <FileText size={15} />
                <span>CADET POST-FLIGHT DEBRIEF JOURNAL</span>
              </div>
              <button
                onClick={handleSaveReflection}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  background: 'rgba(16, 185, 129, 0.25)',
                  border: '1px solid #10b981',
                  color: '#4ade80',
                  fontSize: '11px',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                Log Debrief (+150 XP)
              </button>
            </div>
            <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 10px' }}>
              What did you learn from this flight? How did the physics of staging and gravity turn match or contradict your initial hypothesis?
            </p>
            <textarea
              value={studentReflection}
              onChange={(e) => setStudentReflection(e.target.value)}
              placeholder="e.g., During flight, I noticed that waiting too long to start the gravity turn caused excessive vertical velocity, meaning more fuel was needed to circularize horizontally..."
              style={{
                width: '100%',
                height: '80px',
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '8px',
                padding: '10px',
                color: '#f8fafc',
                fontSize: '12px',
                fontFamily: 'inherit',
                resize: 'none',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

