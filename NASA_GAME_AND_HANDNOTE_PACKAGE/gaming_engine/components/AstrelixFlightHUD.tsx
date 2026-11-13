import React, { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX, BookOpen, Wrench, X, Radar } from 'lucide-react';
import type { MissionGameConfig } from '../game/missionGameData';
import { soundFx } from '../utils/audioEffects';

export type AstrelixSASMode = 'HOLD' | 'PROGRADE' | 'RETROGRADE' | 'GRAV_TURN' | 'AUTOPILOT';
export type AstrelixCameraMode = 'orbit' | 'chase' | 'cockpit' | 'distant' | 'pad';

export interface AstrelixFlightHUDProps {
  mission: MissionGameConfig;
  telemetry: {
    altitudeKm: number;
    velocityKms: number;
    throttle: number;
    propellantPct: number;
    pitchDeg: number;
    rollDeg: number;
    stage: number;
    gForce: number;
    apoapsisKm: number;
    periapsisKm: number;
    deltaVKms: number;
    dynamicPressureQ: number;
    vertSpeedMs: number;
    horizSpeedKms: number;
    distanceM: number;
    sampleCount: number;
    telescopeFocus: number;
    statusText?: string;
    statusColor?: string;
    roverLandingPhase?: 'sky_crane' | 'airbag_bounce' | 'ramp_deploy' | 'landed';
  };
  navballCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  timeWarp: number;
  onChangeTimeWarp: (warp: number) => void;
  sasMode: AstrelixSASMode;
  onChangeSASMode: (mode: AstrelixSASMode) => void;
  cameraMode: AstrelixCameraMode;
  onSelectCameraMode: (mode: AstrelixCameraMode) => void;
  orbitMapOpen: boolean;
  onToggleOrbitMap: () => void;
  boosterSeparated: boolean;
  fairingSeparated: boolean;
  hasSideBoosters: boolean;
  isMercury?: boolean;
  isLunarMission?: boolean;
  tliActive?: boolean;
  tliComplete?: boolean;
  stageActionLabel: string;
  onSetThrottle: (val: number) => void;
  onStageAction: () => void;
  onSteerInput: (pitchDelta: number, rollDelta: number) => void;
  onKeyHold: (key: string, pressed: boolean) => void;
  onSimAction: (action: string) => void;
  onCircularizeOrbit: () => void;
  onWarpToApoapsis: () => void;
  onTriggerScanner?: () => void;
  scannerActive?: boolean;
  roverAutoNav?: boolean;
  onTriggerRoverLanding?: (mode: 'sky_crane' | 'airbag_bounce' | 'ramp_deploy') => void;
  onSkipToDrive?: () => void;
  soundEnabled?: boolean;
  onToggleSound?: () => void;
  showBriefing?: boolean;
  onToggleBriefing?: () => void;
  onOpenVabLifecycle?: () => void;
  onExit?: () => void;
}

export const AstrelixFlightHUD: React.FC<AstrelixFlightHUDProps> = ({
  mission,
  telemetry,
  navballCanvasRef,
  timeWarp,
  onChangeTimeWarp,
  sasMode,
  onChangeSASMode,
  cameraMode,
  onSelectCameraMode,
  orbitMapOpen,
  onToggleOrbitMap,
  boosterSeparated,
  fairingSeparated,
  hasSideBoosters,
  isMercury = false,
  isLunarMission = false,
  tliActive = false,
  tliComplete = false,
  stageActionLabel,
  onSetThrottle,
  onStageAction,
  onSteerInput,
  onKeyHold,
  onSimAction,
  onCircularizeOrbit,
  onWarpToApoapsis,
  onTriggerScanner,
  scannerActive = false,
  roverAutoNav = false,
  onTriggerRoverLanding,
  onSkipToDrive,
  soundEnabled = true,
  onToggleSound,
  showBriefing = false,
  onToggleBriefing,
  onOpenVabLifecycle,
  onExit,
}) => {
  const orbitCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [draggingThrottle, setDraggingThrottle] = useState(false);
  const [gimbalPos, setGimbalPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [draggingGimbal, setDraggingGimbal] = useState(false);

  const isLunar =
    mission.gameType === 'lunar_landing' ||
    mission.missionName.toLowerCase().includes('apollo') ||
    mission.missionName.toLowerCase().includes('artemis') ||
    mission.missionName.toLowerCase().includes('moon') ||
    mission.missionName.toLowerCase().includes('surveyor');
  const isMars =
    mission.missionName.toLowerCase().includes('mars') ||
    mission.missionName.toLowerCase().includes('viking') ||
    mission.missionName.toLowerCase().includes('curiosity') ||
    mission.missionName.toLowerCase().includes('perseverance') ||
    mission.missionName.toLowerCase().includes('sojourner') ||
    mission.missionName.toLowerCase().includes('spirit') ||
    mission.missionName.toLowerCase().includes('opportunity');

  // Render live Astrelix Conic Orbital Trajectory Map Canvas
  useEffect(() => {
    if (!orbitMapOpen || !orbitCanvasRef.current) return;
    const canvas = orbitCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const renderOrbitMap = (now: number) => {
      animId = requestAnimationFrame(renderOrbitMap);
      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;

      ctx.fillStyle = '#02050e';
      ctx.fillRect(0, 0, w, h);

      // Subtle space coordinate grid
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
      ctx.lineWidth = 1;
      for (let gx = 0; gx < w; gx += 36) {
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, h);
        ctx.stroke();
      }
      for (let gy = 0; gy < h; gy += 36) {
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(w, gy);
        ctx.stroke();
      }

      // Target Orbit Dashed Reference Circle
      const targetRadius = 112;
      ctx.save();
      ctx.setLineDash([6, 5]);
      ctx.strokeStyle = 'rgba(34, 197, 94, 0.55)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, targetRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Conic Section Orbit Ellipse (Calculated from live Apoapsis & Periapsis)
      const planetR = 52;
      const apScaled = Math.min(150, planetR + 16 + (telemetry.apoapsisKm / 220) * 66);
      const peScaled = Math.max(planetR * 0.68, Math.min(apScaled, planetR + (telemetry.periapsisKm / 220) * 62));
      const semiMajorA = (apScaled + peScaled) / 2;
      const semiMinorB = Math.sqrt(apScaled * peScaled);
      const focusOffsetC = apScaled - semiMajorA;

      // Glowing Conic Orbit Path
      ctx.save();
      ctx.strokeStyle = '#38bdf8';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 12;
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.ellipse(cx - focusOffsetC, cy, semiMajorA, semiMinorB, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Central Celestial Body (Earth / Moon / Mars)
      const atmoGrad = ctx.createRadialGradient(cx, cy, planetR * 0.85, cx, cy, planetR + 18);
      if (isMars) {
        atmoGrad.addColorStop(0, 'rgba(234, 88, 12, 0.45)');
        atmoGrad.addColorStop(1, 'rgba(234, 88, 12, 0)');
      } else if (isLunar && mission.gameType !== 'launch') {
        atmoGrad.addColorStop(0, 'rgba(148, 163, 184, 0.25)');
        atmoGrad.addColorStop(1, 'rgba(148, 163, 184, 0)');
      } else {
        atmoGrad.addColorStop(0, 'rgba(56, 189, 248, 0.6)');
        atmoGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
      }
      ctx.fillStyle = atmoGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, planetR + 18, 0, Math.PI * 2);
      ctx.fill();

      const bodyGrad = ctx.createRadialGradient(cx - 14, cy - 14, 8, cx, cy, planetR);
      if (isMars) {
        bodyGrad.addColorStop(0, '#ea580c');
        bodyGrad.addColorStop(1, '#7c2d12');
      } else if (isLunar && mission.gameType !== 'launch') {
        bodyGrad.addColorStop(0, '#94a3b8');
        bodyGrad.addColorStop(1, '#334155');
      } else {
        bodyGrad.addColorStop(0, '#0284c7');
        bodyGrad.addColorStop(0.6, '#1d4ed8');
        bodyGrad.addColorStop(1, '#0f172a');
      }
      ctx.fillStyle = bodyGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, planetR, 0, Math.PI * 2);
      ctx.fill();

      // Apoapsis (AP) Marker Node
      const apX = cx - focusOffsetC + semiMajorA;
      const apY = cy;
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(apX, apY, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = 'bold 10px monospace';
      ctx.fillText(`AP ${telemetry.apoapsisKm} km`, apX + 8, apY + 3);

      // Periapsis (PE) Marker Node
      const peX = cx - focusOffsetC - semiMajorA;
      const peY = cy;
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(peX, peY, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillText(`PE ${telemetry.periapsisKm} km`, peX - 78, peY + 3);

      // Live Spacecraft Position & Velocity Vector on Conic Orbit
      const shipAngle = -Math.PI / 2 + ((now * 0.0006 * timeWarp) % (Math.PI * 2));
      const shipX = cx - focusOffsetC + Math.cos(shipAngle) * semiMajorA;
      const shipY = cy + Math.sin(shipAngle) * semiMinorB;

      ctx.save();
      ctx.translate(shipX, shipY);
      ctx.rotate(shipAngle + Math.PI / 2);
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.moveTo(0, -8);
      ctx.lineTo(-5, 6);
      ctx.lineTo(5, 6);
      ctx.closePath();
      ctx.fill();

      // Prograde Velocity Vector Arrow
      ctx.strokeStyle = '#4ade80';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(0, -8);
      ctx.lineTo(0, -24);
      ctx.stroke();
      ctx.restore();
    };

    animId = requestAnimationFrame(renderOrbitMap);
    return () => cancelAnimationFrame(animId);
  }, [orbitMapOpen, telemetry.apoapsisKm, telemetry.periapsisKm, timeWarp, isMars, isLunar, mission.gameType]);

  const updateThrottleFromPointer = (clientY: number, rect: DOMRect) => {
    const pct = Math.max(0, Math.min(1, 1 - (clientY - rect.top) / rect.height));
    onSetThrottle(pct);
  };

  // Format primary altitude & velocity readouts cleanly like @Astrelix (Ellipse: Rocket Simulator)
  const formattedAltitude =
    mission.gameType === 'lunar_landing'
      ? `${telemetry.altitudeKm.toFixed(1)} m`
      : telemetry.altitudeKm >= 1
      ? `${telemetry.altitudeKm.toFixed(1)} km`
      : `${(telemetry.altitudeKm * 1000).toFixed(0)} m`;

  const formattedVelocity =
    mission.gameType === 'lunar_landing'
      ? `${Math.abs(telemetry.velocityKms).toFixed(1)} m/s`
      : telemetry.velocityKms >= 1
      ? `${telemetry.velocityKms.toFixed(2)} km/s`
      : `${Math.round(telemetry.velocityKms * 1000)} m/s`;

  // Launch sequence steps for @Astrelix top timeline
  const launchSteps = isMercury
    ? [
        { id: 'liftoff', label: 'LIFTOFF', done: telemetry.altitudeKm > 0.05 },
        { id: 'les', label: 'LES SEP', done: fairingSeparated },
        { id: 'meco', label: 'MECO', done: telemetry.stage === 2 },
        { id: 'space', label: '100 KM APOGEE', done: telemetry.altitudeKm >= 100 },
      ]
    : isLunarMission
    ? [
        { id: 'liftoff', label: 'LIFTOFF', done: telemetry.altitudeKm > 0.05 },
        { id: 'boosters', label: 'SRB SEP', done: boosterSeparated },
        { id: 'fairing', label: 'FAIRING', done: fairingSeparated },
        { id: 'meco', label: 'STAGE 2', done: telemetry.stage === 2 },
        { id: 'orbit', label: 'LEO ORBIT', done: telemetry.altitudeKm >= 135 },
        { id: 'tli', label: 'TLI BURN', done: tliComplete },
      ]
    : [
        { id: 'liftoff', label: 'LIFTOFF', done: telemetry.altitudeKm > 0.05 },
        { id: 'boosters', label: 'SRB SEP', done: boosterSeparated },
        { id: 'fairing', label: 'FAIRING', done: fairingSeparated },
        { id: 'meco', label: 'STAGE 2', done: telemetry.stage === 2 },
        { id: 'orbit', label: 'ORBIT (185 KM)', done: telemetry.altitudeKm >= 140 },
      ];

  return (
    <>
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* 1. TOP-LEFT: @ASTRELIX (ELLIPSE) DIGITAL TELEMETRY & MISSION READOUT    */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div
        style={{
          position: 'absolute',
          top: '12px',
          left: '14px',
          zIndex: 35,
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          pointerEvents: 'auto',
          fontFamily: 'var(--font-mono)',
        }}
      >
        {/* Mission Header Pill */}
        <div
          style={{
            background: 'rgba(3, 8, 20, 0.88)',
            border: '1px solid rgba(56, 189, 248, 0.42)',
            borderRadius: '12px',
            padding: '6px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backdropFilter: 'blur(14px)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.75)',
          }}
        >
          <span
            style={{
              background: 'linear-gradient(135deg, #0284c7, #0369a1)',
              color: '#ffffff',
              fontSize: '9px',
              fontWeight: 900,
              padding: '2px 7px',
              borderRadius: '6px',
              letterSpacing: '0.06em',
            }}
          >
            ELLIPSE 3D
          </span>
          <span style={{ fontSize: '11.5px', fontWeight: 900, color: '#f8fafc', letterSpacing: '0.03em' }}>
            {mission.missionName.toUpperCase()}
          </span>
          <span style={{ fontSize: '9.5px', color: '#38bdf8', fontWeight: 800 }}>[{mission.year}]</span>
        </div>

        {/* Sleek @Astrelix Telemetry Cards Row */}
        <div
          style={{
            background: 'rgba(3, 8, 20, 0.88)',
            border: '1px solid rgba(56, 189, 248, 0.35)',
            borderRadius: '12px',
            padding: '8px 12px',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, auto)',
            gap: '8px 14px',
            backdropFilter: 'blur(14px)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.7)',
          }}
        >
          <div>
            <div style={{ fontSize: '8px', color: '#94a3b8', fontWeight: 800 }}>ALTITUDE</div>
            <div style={{ fontSize: '13px', fontWeight: 900, color: '#38bdf8' }}>{formattedAltitude}</div>
          </div>
          <div>
            <div style={{ fontSize: '8px', color: '#94a3b8', fontWeight: 800 }}>VELOCITY</div>
            <div style={{ fontSize: '13px', fontWeight: 900, color: '#fbbf24' }}>{formattedVelocity}</div>
          </div>
          <div>
            <div style={{ fontSize: '8px', color: '#94a3b8', fontWeight: 800 }}>DELTA-V</div>
            <div style={{ fontSize: '13px', fontWeight: 900, color: '#4ade80' }}>
              {(telemetry.deltaVKms * 1000).toFixed(0)} m/s
            </div>
          </div>
          <div>
            <div style={{ fontSize: '8px', color: '#94a3b8', fontWeight: 800 }}>APOAPSIS</div>
            <div style={{ fontSize: '11px', fontWeight: 900, color: '#e2e8f0' }}>{telemetry.apoapsisKm} km</div>
          </div>
          <div>
            <div style={{ fontSize: '8px', color: '#94a3b8', fontWeight: 800 }}>PERIAPSIS</div>
            <div style={{ fontSize: '11px', fontWeight: 900, color: '#e2e8f0' }}>{telemetry.periapsisKm} km</div>
          </div>
          <div>
            <div style={{ fontSize: '8px', color: '#94a3b8', fontWeight: 800 }}>
              {mission.gameType === 'rover'
                ? 'SAMPLES'
                : mission.gameType === 'docking'
                ? 'DOCK RANGE'
                : mission.gameType === 'telescope'
                ? 'OPTICS FOCUS'
                : mission.gameType === 'deep_space'
                ? 'TARGET DIST'
                : 'G-FORCE'}
            </div>
            <div style={{ fontSize: '11px', fontWeight: 900, color: '#c084fc' }}>
              {mission.gameType === 'rover'
                ? `${telemetry.sampleCount} / 3`
                : mission.gameType === 'docking'
                ? `${telemetry.distanceM.toFixed(1)} m`
                : mission.gameType === 'telescope'
                ? `${Math.round(telemetry.telescopeFocus)}%`
                : mission.gameType === 'deep_space'
                ? `${telemetry.distanceM.toFixed(1)} km`
                : `${telemetry.gForce.toFixed(1)} G`}
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* 2. TOP-CENTER: @ASTRELIX TIME WARP, 3D ORBIT MAP & PHASE BAR           */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div
        style={{
          position: 'absolute',
          top: '12px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 35,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '6px',
          pointerEvents: 'auto',
          fontFamily: 'var(--font-mono)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(3, 8, 20, 0.92)',
            border: '1px solid rgba(56, 189, 248, 0.48)',
            borderRadius: '22px',
            padding: '5px 14px',
            boxShadow: '0 8px 28px rgba(0, 0, 0, 0.8), 0 0 18px rgba(56, 189, 248, 0.22)',
            backdropFilter: 'blur(14px)',
          }}
        >
          {/* Astrelix Time Warp Selector (1x, 2x, 5x, 10x, 25x) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
            <span style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 900, marginRight: '3px' }}>⏩ TIME WARP:</span>
            {[1, 2, 5, 10, 25].map((w) => (
              <button
                key={w}
                onClick={() => {
                  onChangeTimeWarp(w);
                  soundFx.playClick(700 + w * 25);
                }}
                style={{
                  background: timeWarp === w ? 'linear-gradient(135deg, #0284c7, #0369a1)' : 'rgba(15, 23, 42, 0.85)',
                  border: `1px solid ${timeWarp === w ? '#38bdf8' : 'rgba(148, 163, 184, 0.28)'}`,
                  color: timeWarp === w ? '#ffffff' : '#94a3b8',
                  borderRadius: '6px',
                  padding: '3px 7px',
                  fontSize: '9.5px',
                  fontWeight: 900,
                  cursor: 'pointer',
                }}
                title={`Set Time Warp to ${w}x (Hotkeys: [,] slower, [.] faster)`}
              >
                {w}x
              </button>
            ))}
          </div>

          <div style={{ width: '1px', height: '16px', background: 'rgba(148,163,184,0.25)' }} />

          {/* 3D Conic Orbit Map View Button [M] */}
          <button
            onClick={() => {
              onToggleOrbitMap();
              soundFx.playClick(920);
            }}
            style={{
              background: orbitMapOpen
                ? 'linear-gradient(135deg, #16a34a, #15803d)'
                : 'linear-gradient(135deg, rgba(56, 189, 248, 0.25), rgba(2, 132, 199, 0.35))',
              border: `1.5px solid ${orbitMapOpen ? '#4ade80' : '#38bdf8'}`,
              color: '#ffffff',
              borderRadius: '14px',
              padding: '3px 11px',
              fontSize: '9.5px',
              fontWeight: 900,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              boxShadow: orbitMapOpen ? '0 0 14px rgba(34, 197, 94, 0.5)' : 'none',
            }}
            title="Toggle @Astrelix 3D Planetary Orbit & Conic Trajectory Map [M]"
          >
            <span>🪐</span>
            <span>3D ORBIT MAP [M]</span>
          </button>
        </div>

        {/* Launch Sequence Stepper OR Mission Status Guidance Pill */}
        {mission.gameType === 'launch' ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              background: 'rgba(3, 8, 20, 0.85)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: '18px',
              padding: '3px 12px',
              backdropFilter: 'blur(10px)',
            }}
          >
            {launchSteps.map((st, idx) => (
              <React.Fragment key={st.id}>
                <span
                  style={{
                    fontSize: '8.5px',
                    fontWeight: 900,
                    color: st.done ? '#4ade80' : '#94a3b8',
                    padding: '1px 5px',
                    borderRadius: '8px',
                    background: st.done ? 'rgba(34, 197, 94, 0.16)' : 'transparent',
                  }}
                >
                  {st.done ? '✓ ' : `${idx + 1}. `}
                  {st.label}
                </span>
                {idx < launchSteps.length - 1 && <span style={{ color: '#475569', fontSize: '8px' }}>›</span>}
              </React.Fragment>
            ))}
          </div>
        ) : (
          telemetry.statusText && (
            <div
              style={{
                background: 'rgba(3, 8, 20, 0.88)',
                border: `1px solid ${telemetry.statusColor || '#38bdf8'}`,
                borderRadius: '16px',
                padding: '4px 14px',
                fontSize: '9.5px',
                fontWeight: 900,
                color: telemetry.statusColor || '#38bdf8',
                backdropFilter: 'blur(10px)',
                maxWidth: '560px',
                textAlign: 'center',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {telemetry.statusText}
            </div>
          )
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* 3. TOP-RIGHT: CAMERA VIEWS, VAB BUILDER & SYSTEM ACTIONS               */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div
        style={{
          position: 'absolute',
          top: '12px',
          right: '14px',
          zIndex: 35,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          pointerEvents: 'auto',
          fontFamily: 'var(--font-mono)',
        }}
      >
        {/* Camera Switcher */}
        <div
          style={{
            background: 'rgba(3, 8, 20, 0.88)',
            border: '1px solid rgba(56, 189, 248, 0.38)',
            borderRadius: '10px',
            padding: '3px',
            display: 'flex',
            gap: '3px',
            backdropFilter: 'blur(12px)',
          }}
        >
          {(
            [
              { id: 'chase', label: '🚀 CHASE' },
              { id: 'orbit', label: '🌐 360°' },
              { id: 'cockpit', label: '👨‍🚀 COCKPIT' },
              { id: 'pad', label: '🗼 PAD/CAM' },
            ] as { id: AstrelixCameraMode; label: string }[]
          ).map((cam) => (
            <button
              key={cam.id}
              onClick={() => {
                onSelectCameraMode(cam.id);
                soundFx.playClick(820);
              }}
              style={{
                background: cameraMode === cam.id ? '#0284c7' : 'transparent',
                color: cameraMode === cam.id ? '#ffffff' : '#94a3b8',
                border: 'none',
                borderRadius: '6px',
                padding: '4px 8px',
                fontSize: '9px',
                fontWeight: 900,
                cursor: 'pointer',
              }}
            >
              {cam.label}
            </button>
          ))}
        </div>

        {/* Open Full VAB Rocket Builder & Walkable EVA Mode */}
        {onOpenVabLifecycle && (
          <button
            onClick={() => {
              onOpenVabLifecycle();
              soundFx.playReactorStart();
            }}
            style={{
              background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
              border: '1.5px solid #c084fc',
              borderRadius: '10px',
              padding: '6px 11px',
              color: '#ffffff',
              fontSize: '9.5px',
              fontWeight: 900,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              boxShadow: '0 0 18px rgba(168, 85, 247, 0.45)',
            }}
            title="Switch to Full @Astrelix 17-Phase VAB Rocket Builder, Launch, 3D Trajectory & Walkable EVA Mode"
          >
            <Wrench size={12} />
            <span>VAB &amp; FULL EVA</span>
          </button>
        )}

        {/* Multi-Spectral Scanner [F] */}
        {onTriggerScanner && (
          <button
            onClick={onTriggerScanner}
            style={{
              background: scannerActive ? 'rgba(34, 197, 94, 0.3)' : 'rgba(3, 8, 20, 0.88)',
              border: `1px solid ${scannerActive ? '#4ade80' : 'rgba(56, 189, 248, 0.38)'}`,
              borderRadius: '10px',
              padding: '6px 9px',
              color: scannerActive ? '#4ade80' : '#38bdf8',
              fontSize: '9.5px',
              fontWeight: 900,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
            title="Trigger NASA Multi-Spectral Scanner [F]"
          >
            <Radar size={13} />
            <span>SCAN [F]</span>
          </button>
        )}

        {/* Sound Toggle */}
        {onToggleSound && (
          <button
            onClick={onToggleSound}
            style={{
              background: 'rgba(3, 8, 20, 0.88)',
              border: '1px solid rgba(56, 189, 248, 0.38)',
              borderRadius: '10px',
              padding: '6px 9px',
              color: soundEnabled ? '#38bdf8' : '#ef4444',
              cursor: 'pointer',
            }}
            title="Toggle Flight Audio"
          >
            {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
          </button>
        )}

        {/* Briefing Toggle */}
        {onToggleBriefing && (
          <button
            onClick={onToggleBriefing}
            style={{
              background: showBriefing ? '#0284c7' : 'rgba(3, 8, 20, 0.88)',
              border: '1px solid rgba(56, 189, 248, 0.38)',
              borderRadius: '10px',
              padding: '6px 9px',
              color: '#ffffff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '9.5px',
              fontWeight: 900,
            }}
            title="Mission Directive & STEM Physics Briefing"
          >
            <BookOpen size={13} />
          </button>
        )}

        {/* Exit Mission Button */}
        {onExit && (
          <button
            onClick={onExit}
            style={{
              background: 'rgba(239, 68, 68, 0.22)',
              border: '1px solid rgba(239, 68, 68, 0.6)',
              borderRadius: '10px',
              padding: '6px 10px',
              color: '#fca5a5',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '9.5px',
              fontWeight: 900,
            }}
            title="Exit Simulation"
          >
            <X size={14} />
            <span>EXIT</span>
          </button>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* 4. BOTTOM-LEFT: @ASTRELIX VERTICAL THROTTLE LEVER & STAGE STACK        */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div
        style={{
          position: 'absolute',
          left: '14px',
          bottom: '18px',
          zIndex: 35,
          display: 'flex',
          alignItems: 'flex-end',
          gap: '10px',
          pointerEvents: 'auto',
          fontFamily: 'var(--font-mono)',
        }}
      >
        {/* Vertical Throttle Lever (0% - 100%) */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(3, 8, 20, 0.92)',
            padding: '10px 8px',
            borderRadius: '14px',
            border: '1px solid rgba(56, 189, 248, 0.42)',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(14px)',
            width: '58px',
          }}
        >
          <button
            onClick={() => {
              onSetThrottle(1.0);
              soundFx.playClick(950);
              soundFx.playReactorStart();
            }}
            style={{
              width: '100%',
              padding: '4px 0',
              borderRadius: '6px',
              background: telemetry.throttle >= 0.98 ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'rgba(30, 41, 59, 0.9)',
              border: '1px solid rgba(239, 68, 68, 0.65)',
              color: '#ffffff',
              fontSize: '9px',
              fontWeight: 900,
              cursor: 'pointer',
            }}
            title="100% Full Thrust [Z]"
          >
            MAX
          </button>

          {/* Draggable Vertical Track */}
          <div
            onPointerDown={(e) => {
              setDraggingThrottle(true);
              e.currentTarget.setPointerCapture(e.pointerId);
              updateThrottleFromPointer(e.clientY, e.currentTarget.getBoundingClientRect());
            }}
            onPointerMove={(e) => {
              if (!draggingThrottle) return;
              updateThrottleFromPointer(e.clientY, e.currentTarget.getBoundingClientRect());
            }}
            onPointerUp={() => setDraggingThrottle(false)}
            style={{
              position: 'relative',
              width: '24px',
              height: '132px',
              background: '#020617',
              borderRadius: '10px',
              border: '1.5px solid rgba(56, 189, 248, 0.45)',
              cursor: 'ns-resize',
              overflow: 'hidden',
            }}
            title="Drag to set Engine Throttle (or use W / S keys)"
          >
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: `${telemetry.throttle * 100}%`,
                background:
                  telemetry.throttle > 0.8
                    ? 'linear-gradient(to top, #10b981, #f59e0b, #ef4444)'
                    : 'linear-gradient(to top, #10b981, #38bdf8)',
                transition: draggingThrottle ? 'none' : 'height 0.06s ease-out',
                boxShadow: telemetry.throttle > 0 ? '0 0 12px rgba(56, 189, 248, 0.8)' : 'none',
              }}
            />
            {[0.25, 0.5, 0.75].map((tick) => (
              <div
                key={tick}
                style={{
                  position: 'absolute',
                  bottom: `${tick * 100}%`,
                  left: 0,
                  right: 0,
                  height: '1px',
                  background: 'rgba(255, 255, 255, 0.22)',
                  pointerEvents: 'none',
                }}
              />
            ))}
            <div
              style={{
                position: 'absolute',
                bottom: `calc(${telemetry.throttle * 100}% - 4px)`,
                left: '-2px',
                right: '-2px',
                height: '8px',
                background: '#ffffff',
                borderRadius: '4px',
                boxShadow: '0 0 8px #ffffff',
                pointerEvents: 'none',
              }}
            />
          </div>

          <button
            onClick={() => {
              onSetThrottle(0.0);
              soundFx.playClick(600);
            }}
            style={{
              width: '100%',
              padding: '4px 0',
              borderRadius: '6px',
              background: telemetry.throttle === 0 ? 'rgba(56, 189, 248, 0.3)' : 'rgba(30, 41, 59, 0.9)',
              border: '1px solid rgba(148, 163, 184, 0.45)',
              color: '#cbd5e1',
              fontSize: '9px',
              fontWeight: 900,
              cursor: 'pointer',
            }}
            title="Cut Engine Thrust [X]"
          >
            OFF
          </button>

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '11px', fontWeight: 900, color: '#38bdf8' }}>
              {Math.round(telemetry.throttle * 100)}%
            </div>
            <div style={{ fontSize: '7.5px', color: '#64748b' }}>THRUST</div>
          </div>
        </div>

        {/* Visual Rocket Stage Tree & Propellant Gauge */}
        <div
          style={{
            background: 'rgba(3, 8, 20, 0.9)',
            border: '1px solid rgba(56, 189, 248, 0.38)',
            borderRadius: '14px',
            padding: '10px 12px',
            width: '152px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            backdropFilter: 'blur(14px)',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.75)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '9px', color: '#38bdf8', fontWeight: 900, letterSpacing: '0.06em' }}>
              🚀 STAGING TREE
            </span>
            <span
              style={{
                fontSize: '8.5px',
                background: 'rgba(56, 189, 248, 0.2)',
                color: '#7dd3fc',
                padding: '1px 6px',
                borderRadius: '6px',
                fontWeight: 900,
              }}
            >
              STG {telemetry.stage}
            </span>
          </div>

          {mission.gameType === 'launch' && hasSideBoosters && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '8.5px',
                padding: '3px 6px',
                borderRadius: '5px',
                background: boosterSeparated ? 'rgba(15, 23, 42, 0.5)' : 'rgba(245, 158, 11, 0.15)',
                color: boosterSeparated ? '#64748b' : '#fbbf24',
                border: `1px solid ${boosterSeparated ? 'rgba(100,116,139,0.2)' : 'rgba(245,158,11,0.4)'}`,
              }}
            >
              <span>SRB BOOSTERS</span>
              <strong>{boosterSeparated ? 'SEP ✓' : 'ACTIVE'}</strong>
            </div>
          )}

          {mission.gameType === 'launch' && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '8.5px',
                padding: '3px 6px',
                borderRadius: '5px',
                background: fairingSeparated ? 'rgba(15, 23, 42, 0.5)' : 'rgba(56, 189, 248, 0.14)',
                color: fairingSeparated ? '#64748b' : '#38bdf8',
                border: `1px solid ${fairingSeparated ? 'rgba(100,116,139,0.2)' : 'rgba(56,189,248,0.35)'}`,
              }}
            >
              <span>{isMercury ? 'LES TOWER' : 'AERO FAIRING'}</span>
              <strong>{fairingSeparated ? 'JETTISON ✓' : 'LOCKED'}</strong>
            </div>
          )}

          {/* Active Propellant Tank Progress Bar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8.5px', color: '#e2e8f0' }}>
              <span>{telemetry.stage === 1 ? 'LOX / RP-1 TANK' : 'VACUUM LH2'}</span>
              <strong style={{ color: telemetry.propellantPct < 20 ? '#ef4444' : '#4ade80' }}>
                {Math.round(telemetry.propellantPct)}%
              </strong>
            </div>
            <div style={{ width: '100%', height: '7px', background: '#0f172a', borderRadius: '4px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div
                style={{
                  width: `${telemetry.propellantPct}%`,
                  height: '100%',
                  background:
                    telemetry.propellantPct < 20
                      ? '#ef4444'
                      : 'linear-gradient(90deg, #22c55e, #38bdf8)',
                  transition: 'width 0.1s linear',
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* 5. BOTTOM-CENTER: @ASTRELIX 3D NAVBALL & SAS FLIGHT COMPUTER DOCK      */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div
        style={{
          position: 'absolute',
          bottom: '14px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 35,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          background: 'rgba(3, 8, 20, 0.92)',
          border: '1.5px solid rgba(56, 189, 248, 0.45)',
          borderRadius: '20px',
          padding: '8px 16px',
          boxShadow: '0 12px 36px rgba(0, 0, 0, 0.85), 0 0 24px rgba(56, 189, 248, 0.2)',
          backdropFilter: 'blur(16px)',
          pointerEvents: 'auto',
          fontFamily: 'var(--font-mono)',
        }}
      >
        {/* Left SAS Attitude Mode Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '88px' }}>
          <div style={{ fontSize: '8px', color: '#38bdf8', fontWeight: 900, letterSpacing: '0.08em' }}>
            🧭 SAS MODES
          </div>
          {(
            [
              { id: 'HOLD', label: 'SAS HOLD', color: '#38bdf8' },
              { id: 'PROGRADE', label: 'PROGRADE', color: '#22c55e' },
              { id: 'RETROGRADE', label: 'RETROGRADE', color: '#f59e0b' },
              { id: 'GRAV_TURN', label: 'GRAV TURN', color: '#a855f7' },
            ] as { id: AstrelixSASMode; label: string; color: string }[]
          ).map((m) => {
            const active = sasMode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => {
                  onChangeSASMode(m.id);
                  soundFx.playClick(860);
                }}
                style={{
                  background: active ? `${m.color}33` : 'rgba(15, 23, 42, 0.85)',
                  border: `1px solid ${active ? m.color : 'rgba(148, 163, 184, 0.25)'}`,
                  color: active ? '#ffffff' : '#94a3b8',
                  borderRadius: '6px',
                  padding: '3px 7px',
                  fontSize: '8.5px',
                  fontWeight: 900,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                {active ? '● ' : '○ '}
                {m.label}
              </button>
            );
          })}
        </div>

        {/* Center 3D Attitude Navball Sphere */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
          <div
            style={{
              padding: '3px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(56,189,248,0.2), rgba(2,6,23,0.95))',
              border: '2px solid rgba(56, 189, 248, 0.6)',
              boxShadow: '0 0 18px rgba(56, 189, 248, 0.35)',
            }}
          >
            <canvas
              ref={navballCanvasRef}
              width={96}
              height={96}
              style={{ display: 'block', borderRadius: '50%' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '10px', fontSize: '8.5px', fontWeight: 900, color: '#cbd5e1' }}>
            <span>PITCH {telemetry.pitchDeg.toFixed(0)}°</span>
            <span>ROLL {telemetry.rollDeg.toFixed(0)}°</span>
          </div>
        </div>

        {/* Right AI Autopilot & Velocity Vectors */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', minWidth: '105px' }}>
          <button
            onClick={() => {
              onChangeSASMode(sasMode === 'AUTOPILOT' ? 'HOLD' : 'AUTOPILOT');
              soundFx.playReactorStart();
            }}
            style={{
              background:
                sasMode === 'AUTOPILOT'
                  ? 'linear-gradient(135deg, #16a34a, #15803d)'
                  : 'linear-gradient(135deg, #0284c7, #0369a1)',
              border: `1.5px solid ${sasMode === 'AUTOPILOT' ? '#4ade80' : '#38bdf8'}`,
              color: '#ffffff',
              borderRadius: '8px',
              padding: '6px 8px',
              fontSize: '8.5px',
              fontWeight: 900,
              cursor: 'pointer',
              boxShadow: sasMode === 'AUTOPILOT' ? '0 0 16px rgba(34, 197, 94, 0.65)' : '0 0 12px rgba(2, 132, 199, 0.4)',
              textAlign: 'center',
            }}
            title="Engage @Astrelix Full Mission AI Autopilot"
          >
            {sasMode === 'AUTOPILOT' ? '🤖 AI AUTOPILOT: ON' : '🤖 AI AUTOPILOT'}
          </button>

          <div
            style={{
              background: 'rgba(15, 23, 42, 0.85)',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              borderRadius: '6px',
              padding: '4px 7px',
              fontSize: '8px',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>V-SPD:</span>
              <strong style={{ color: '#38bdf8' }}>{telemetry.vertSpeedMs} m/s</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>H-SPD:</span>
              <strong style={{ color: '#fbbf24' }}>{telemetry.horizSpeedKms.toFixed(2)} km/s</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>MAX-Q:</span>
              <strong style={{ color: '#4ade80' }}>{telemetry.dynamicPressureQ} kPa</strong>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* 6. BOTTOM-RIGHT: @ASTRELIX STAGE / ACTION DECK + TVC GIMBAL & STEERING */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div
        style={{
          position: 'absolute',
          right: '14px',
          bottom: '18px',
          zIndex: 35,
          display: 'flex',
          alignItems: 'flex-end',
          gap: '10px',
          pointerEvents: 'auto',
          fontFamily: 'var(--font-mono)',
        }}
      >
        {/* Rover Landing Sequence Switcher (for Rover Missions) */}
        {mission.gameType === 'rover' && onTriggerRoverLanding && (
          <div
            style={{
              background: 'rgba(3, 8, 20, 0.9)',
              border: '1px solid rgba(245, 158, 11, 0.45)',
              borderRadius: '12px',
              padding: '7px 8px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              backdropFilter: 'blur(12px)',
            }}
          >
            <span style={{ fontSize: '8px', fontWeight: 900, color: '#fbbf24' }}>🎬 EDL SYSTEM</span>
            <button
              onClick={() => onTriggerRoverLanding('sky_crane')}
              style={{
                background: telemetry.roverLandingPhase === 'sky_crane' ? 'rgba(249, 115, 22, 0.45)' : 'rgba(15, 23, 42, 0.85)',
                border: '1px solid #f97316',
                color: '#ffedd5',
                borderRadius: '5px',
                padding: '3px 7px',
                fontSize: '8px',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              🏗️ SKY CRANE
            </button>
            <button
              onClick={() => onTriggerRoverLanding('airbag_bounce')}
              style={{
                background: telemetry.roverLandingPhase === 'airbag_bounce' ? 'rgba(245, 158, 11, 0.45)' : 'rgba(15, 23, 42, 0.85)',
                border: '1px solid #f59e0b',
                color: '#fef3c7',
                borderRadius: '5px',
                padding: '3px 7px',
                fontSize: '8px',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              🎈 AIRBAG EDL
            </button>
            <button
              onClick={() => onSimAction('rover_autonav')}
              style={{
                background: roverAutoNav ? 'linear-gradient(135deg, #16a34a, #15803d)' : 'rgba(56, 189, 248, 0.2)',
                border: '1px solid #38bdf8',
                color: '#ffffff',
                borderRadius: '5px',
                padding: '3px 7px',
                fontSize: '8px',
                fontWeight: 900,
                cursor: 'pointer',
              }}
            >
              🤖 {roverAutoNav ? 'AUTONAV ON' : 'AUTONAV AI'}
            </button>
            {telemetry.roverLandingPhase !== 'landed' && onSkipToDrive && (
              <button
                onClick={onSkipToDrive}
                style={{
                  background: 'rgba(34, 197, 94, 0.3)',
                  border: '1px solid #22c55e',
                  color: '#86efac',
                  borderRadius: '5px',
                  padding: '3px 7px',
                  fontSize: '8px',
                  fontWeight: 900,
                  cursor: 'pointer',
                }}
              >
                ⏩ SKIP EDL
              </button>
            )}
          </div>
        )}

        {/* 2-Axis TVC Gimbal Joystick */}
        <div
          style={{
            background: 'rgba(3, 8, 20, 0.9)',
            border: '1px solid rgba(56, 189, 248, 0.38)',
            borderRadius: '14px',
            padding: '7px 9px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            backdropFilter: 'blur(12px)',
          }}
        >
          <span style={{ fontSize: '8px', color: '#38bdf8', fontWeight: 900 }}>🕹️ TVC GIMBAL</span>
          <div
            onPointerDown={(e) => {
              setDraggingGimbal(true);
              e.currentTarget.setPointerCapture(e.pointerId);
            }}
            onPointerMove={(e) => {
              if (!draggingGimbal) return;
              const rect = e.currentTarget.getBoundingClientRect();
              const nx = Math.max(-1, Math.min(1, ((e.clientX - rect.left) / rect.width) * 2 - 1));
              const ny = Math.max(-1, Math.min(1, ((e.clientY - rect.top) / rect.height) * 2 - 1));
              setGimbalPos({ x: nx, y: ny });
              onSteerInput(-ny * 4, nx * 4);
            }}
            onPointerUp={() => {
              setDraggingGimbal(false);
              setGimbalPos({ x: 0, y: 0 });
            }}
            style={{
              width: '62px',
              height: '62px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(15,23,42,0.95) 0%, rgba(2,6,23,0.98) 100%)',
              border: '1.5px solid rgba(56, 189, 248, 0.45)',
              position: 'relative',
              cursor: 'grab',
            }}
            title="Drag to deflect Engine TVC Gimbal / Attitude Thrusters"
          >
            <div style={{ position: 'absolute', top: '50%', left: '6px', right: '6px', height: '1px', background: 'rgba(56,189,248,0.2)' }} />
            <div style={{ position: 'absolute', left: '50%', top: '6px', bottom: '6px', width: '1px', background: 'rgba(56,189,248,0.2)' }} />
            <div
              style={{
                position: 'absolute',
                left: `calc(50% + ${gimbalPos.x * 19}px - 8px)`,
                top: `calc(50% + ${gimbalPos.y * 19}px - 8px)`,
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, #38bdf8, #0284c7)',
                border: '1.5px solid #ffffff',
                boxShadow: '0 0 10px #38bdf8',
                pointerEvents: 'none',
              }}
            />
          </div>
          <span style={{ fontSize: '7.5px', color: '#94a3b8' }}>
            {(gimbalPos.x * 8.5).toFixed(1)}° / {(gimbalPos.y * 8.5).toFixed(1)}°
          </span>
        </div>

        {/* Primary Steering + Big @Astrelix Stage/Action Button */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '154px' }}>
          {/* Directional Pitch / RCS / Drive Buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>
            <button
              onMouseDown={() => onKeyHold('a', true)}
              onMouseUp={() => onKeyHold('a', false)}
              onMouseLeave={() => onKeyHold('a', false)}
              onClick={() => {
                if (mission.gameType === 'launch') onSteerInput(10, 0);
                else if (mission.gameType === 'lunar_landing') onSimAction('lunar_left');
                else if (mission.gameType === 'rover') onSimAction('rover_left');
                else if (mission.gameType === 'docking') onSimAction('dock_port');
                else if (mission.gameType === 'deep_space') onSimAction('deep_rcs_left');
                else onSimAction('focus_in');
              }}
              style={{
                padding: '6px 0',
                background: 'rgba(3, 8, 20, 0.92)',
                border: '1px solid rgba(56, 189, 248, 0.45)',
                borderRadius: '8px',
                color: '#38bdf8',
                fontSize: '9px',
                fontWeight: 900,
                cursor: 'pointer',
              }}
            >
              {mission.gameType === 'telescope' ? '🔍 FOCUS+ [W]' : '◀ LEFT [A]'}
            </button>
            <button
              onMouseDown={() => onKeyHold('d', true)}
              onMouseUp={() => onKeyHold('d', false)}
              onMouseLeave={() => onKeyHold('d', false)}
              onClick={() => {
                if (mission.gameType === 'launch') onSteerInput(-10, 0);
                else if (mission.gameType === 'lunar_landing') onSimAction('lunar_right');
                else if (mission.gameType === 'rover') onSimAction('rover_right');
                else if (mission.gameType === 'docking') onSimAction('dock_starboard');
                else if (mission.gameType === 'deep_space') onSimAction('deep_rcs_right');
                else onSimAction('focus_out');
              }}
              style={{
                padding: '6px 0',
                background: 'rgba(3, 8, 20, 0.92)',
                border: '1px solid rgba(245, 158, 11, 0.45)',
                borderRadius: '8px',
                color: '#fbbf24',
                fontSize: '9px',
                fontWeight: 900,
                cursor: 'pointer',
              }}
            >
              {mission.gameType === 'telescope' ? '🔎 FOCUS- [S]' : 'RIGHT [D] ▶'}
            </button>
          </div>

          {/* Primary @Astrelix STAGE / ACTION Button */}
          <button
            onMouseDown={() => {
              if (mission.gameType === 'lunar_landing') onKeyHold('w', true);
            }}
            onMouseUp={() => {
              if (mission.gameType === 'lunar_landing') onKeyHold('w', false);
            }}
            onClick={() => {
              onStageAction();
              soundFx.playClick(900);
            }}
            style={{
              width: '100%',
              height: '78px',
              borderRadius: '16px',
              background:
                mission.gameType === 'launch' && (telemetry.throttle === 0 || telemetry.altitudeKm < 0.05)
                  ? 'linear-gradient(135deg, #16a34a 0%, #15803d 50%, #14532d 100%)'
                  : 'linear-gradient(135deg, #0284c7 0%, #0369a1 50%, #1e3a8a 100%)',
              border:
                mission.gameType === 'launch' && (telemetry.throttle === 0 || telemetry.altitudeKm < 0.05)
                  ? '2px solid rgba(134, 239, 172, 0.95)'
                  : '2px solid rgba(56, 189, 248, 0.9)',
              color: '#ffffff',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow:
                mission.gameType === 'launch' && (telemetry.throttle === 0 || telemetry.altitudeKm < 0.05)
                  ? '0 0 28px rgba(34, 197, 94, 0.7), inset 0 2px 4px rgba(255, 255, 255, 0.35)'
                  : '0 0 24px rgba(56, 189, 248, 0.6), inset 0 2px 4px rgba(255, 255, 255, 0.35)',
              transition: 'all 0.15s ease',
            }}
            title="Press [SPACE] or Click to Execute Primary Flight Stage / Action"
          >
            <div
              style={{
                fontSize: '9px',
                fontWeight: 900,
                letterSpacing: '0.1em',
                color: '#bae6fd',
              }}
            >
              {mission.gameType === 'launch'
                ? telemetry.throttle === 0 || telemetry.altitudeKm < 0.05
                  ? 'PAD 39A READY'
                  : `STAGE ${telemetry.stage}`
                : mission.gameType.toUpperCase()}
            </div>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 900,
                letterSpacing: '0.03em',
                textAlign: 'center',
                lineHeight: 1.2,
                padding: '2px 6px',
              }}
            >
              {stageActionLabel}
            </div>
            <div style={{ fontSize: '8.5px', fontWeight: 800, color: 'rgba(255, 255, 255, 0.85)' }}>
              [SPACE]
            </div>
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* 7. @ASTRELIX INTERACTIVE 3D CONIC ORBITAL TRAJECTORY MAP MODAL [M]     */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {orbitMapOpen && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 55,
            background: 'rgba(3, 7, 18, 0.94)',
            border: '1.5px solid #38bdf8',
            borderRadius: '18px',
            padding: '16px 20px',
            width: '460px',
            maxWidth: '92vw',
            boxShadow: '0 24px 60px rgba(0,0,0,0.92), 0 0 35px rgba(56, 189, 248, 0.35)',
            backdropFilter: 'blur(16px)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            pointerEvents: 'auto',
            fontFamily: 'var(--font-mono)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid rgba(56,189,248,0.25)',
              paddingBottom: '6px',
            }}
          >
            <div>
              <div style={{ fontSize: '11.5px', fontWeight: 900, color: '#38bdf8', letterSpacing: '0.06em' }}>
                🪐 ELLIPSE 3D CONIC ORBITAL TRAJECTORY MAP
              </div>
              <div style={{ fontSize: '9px', color: '#94a3b8' }}>
                Real-Time Keplerian Two-Body Conic Projection · {mission.missionName}
              </div>
            </div>
            <button
              onClick={onToggleOrbitMap}
              style={{
                background: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid #ef4444',
                color: '#fca5a5',
                borderRadius: '6px',
                padding: '3px 8px',
                fontSize: '10px',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              CLOSE [M]
            </button>
          </div>

          <canvas
            ref={orbitCanvasRef}
            width={420}
            height={250}
            style={{
              width: '100%',
              height: '250px',
              borderRadius: '10px',
              border: '1px solid rgba(56,189,248,0.25)',
            }}
          />

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '6px',
              fontSize: '9px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                background: 'rgba(15,23,42,0.8)',
                padding: '5px',
                borderRadius: '6px',
                border: '1px solid rgba(56,189,248,0.25)',
              }}
            >
              <div style={{ color: '#94a3b8', fontSize: '8px' }}>APOAPSIS</div>
              <strong style={{ color: '#38bdf8' }}>{telemetry.apoapsisKm} km</strong>
            </div>
            <div
              style={{
                background: 'rgba(15,23,42,0.8)',
                padding: '5px',
                borderRadius: '6px',
                border: '1px solid rgba(251,191,36,0.25)',
              }}
            >
              <div style={{ color: '#94a3b8', fontSize: '8px' }}>PERIAPSIS</div>
              <strong style={{ color: '#fbbf24' }}>{telemetry.periapsisKm} km</strong>
            </div>
            <div
              style={{
                background: 'rgba(15,23,42,0.8)',
                padding: '5px',
                borderRadius: '6px',
                border: '1px solid rgba(34,197,94,0.25)',
              }}
            >
              <div style={{ color: '#94a3b8', fontSize: '8px' }}>DELTA-V</div>
              <strong style={{ color: '#4ade80' }}>{(telemetry.deltaVKms * 1000).toFixed(0)} m/s</strong>
            </div>
            <div
              style={{
                background: 'rgba(15,23,42,0.8)',
                padding: '5px',
                borderRadius: '6px',
                border: '1px solid rgba(168,85,247,0.25)',
              }}
            >
              <div style={{ color: '#94a3b8', fontSize: '8px' }}>VELOCITY</div>
              <strong style={{ color: '#c084fc' }}>{telemetry.velocityKms.toFixed(2)} km/s</strong>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => {
                onWarpToApoapsis();
                soundFx.playReactorStart();
              }}
              style={{
                flex: 1,
                background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                border: '1px solid #38bdf8',
                color: '#ffffff',
                borderRadius: '8px',
                padding: '8px 10px',
                fontSize: '9.5px',
                fontWeight: 900,
                cursor: 'pointer',
              }}
            >
              ⏩ WARP TO APOAPSIS
            </button>
            <button
              onClick={() => {
                onCircularizeOrbit();
                soundFx.playVictory();
              }}
              style={{
                flex: 1,
                background: 'linear-gradient(135deg, #16a34a, #15803d)',
                border: '1px solid #4ade80',
                color: '#ffffff',
                borderRadius: '8px',
                padding: '8px 10px',
                fontSize: '9.5px',
                fontWeight: 900,
                cursor: 'pointer',
              }}
            >
              🔥 CIRCULARIZE ORBIT BURN
            </button>
          </div>
        </div>
      )}
    </>
  );
};
