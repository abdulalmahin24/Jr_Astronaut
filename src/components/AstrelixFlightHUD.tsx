import React, { useEffect, useRef, useState } from 'react';
import type { MissionGameConfig } from '../game/missionGameData';
import { soundFx } from '../utils/audioEffects';

export type AstrelixSASMode = 'HOLD' | 'PROGRADE' | 'RETROGRADE' | 'GRAV_TURN' | 'AUTOPILOT';

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
  };
  timeWarp: number;
  onChangeTimeWarp: (warp: number) => void;
  sasMode: AstrelixSASMode;
  onChangeSASMode: (mode: AstrelixSASMode) => void;
  orbitMapOpen: boolean;
  onToggleOrbitMap: () => void;
  boosterSeparated: boolean;
  fairingSeparated: boolean;
  hasSideBoosters: boolean;
  onSetThrottle: (val: number) => void;
  onStageAction: () => void;
  onSteerInput: (pitchDelta: number, rollDelta: number) => void;
  onCircularizeOrbit: () => void;
  onWarpToApoapsis: () => void;
}

export const AstrelixFlightHUD: React.FC<AstrelixFlightHUDProps> = ({
  mission,
  telemetry,
  timeWarp,
  onChangeTimeWarp,
  sasMode,
  onChangeSASMode,
  orbitMapOpen,
  onToggleOrbitMap,
  boosterSeparated,
  fairingSeparated,
  hasSideBoosters,
  onSetThrottle,
  onStageAction,
  onSteerInput,
  onCircularizeOrbit,
  onWarpToApoapsis,
}) => {
  const orbitCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [draggingThrottle, setDraggingThrottle] = useState(false);
  const [gimbalPos, setGimbalPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [draggingGimbal, setDraggingGimbal] = useState(false);

  const isLunar =
    mission.gameType === 'lunar_landing' ||
    mission.missionName.toLowerCase().includes('apollo') ||
    mission.missionName.toLowerCase().includes('artemis') ||
    mission.missionName.toLowerCase().includes('moon');
  const isMars =
    mission.missionName.toLowerCase().includes('mars') ||
    mission.missionName.toLowerCase().includes('viking') ||
    mission.missionName.toLowerCase().includes('curiosity') ||
    mission.missionName.toLowerCase().includes('perseverance') ||
    mission.missionName.toLowerCase().includes('sojourner') ||
    mission.missionName.toLowerCase().includes('spirit');

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

      ctx.fillStyle = '#030712';
      ctx.fillRect(0, 0, w, h);

      // Subtle space coordinate grid
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
      ctx.lineWidth = 1;
      for (let gx = 0; gx < w; gx += 40) {
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, h);
        ctx.stroke();
      }
      for (let gy = 0; gy < h; gy += 40) {
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(w, gy);
        ctx.stroke();
      }

      // Target Orbit Dashed Reference Circle
      const targetRadius = 118;
      ctx.save();
      ctx.setLineDash([6, 5]);
      ctx.strokeStyle = 'rgba(34, 197, 94, 0.55)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, targetRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Conic Section Orbit Ellipse (Calculated from live Apoapsis & Periapsis)
      const planetR = 54;
      const apScaled = Math.min(155, planetR + 14 + (telemetry.apoapsisKm / 220) * 68);
      const peScaled = Math.max(planetR * 0.65, Math.min(apScaled, planetR + (telemetry.periapsisKm / 220) * 64));
      const semiMajorA = (apScaled + peScaled) / 2;
      const semiMinorB = Math.sqrt(apScaled * peScaled);
      const focusOffsetC = apScaled - semiMajorA;

      // Glowing Conic Orbit Path
      ctx.save();
      ctx.strokeStyle = '#38bdf8';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 10;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.ellipse(cx - focusOffsetC, cy, semiMajorA, semiMinorB, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Central Celestial Body (Earth / Moon / Mars)
      const atmoGrad = ctx.createRadialGradient(cx, cy, planetR * 0.85, cx, cy, planetR + 16);
      if (isMars) {
        atmoGrad.addColorStop(0, 'rgba(234, 88, 12, 0.45)');
        atmoGrad.addColorStop(1, 'rgba(234, 88, 12, 0)');
      } else if (isLunar && mission.gameType !== 'launch') {
        atmoGrad.addColorStop(0, 'rgba(148, 163, 184, 0.25)');
        atmoGrad.addColorStop(1, 'rgba(148, 163, 184, 0)');
      } else {
        atmoGrad.addColorStop(0, 'rgba(56, 189, 248, 0.55)');
        atmoGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
      }
      ctx.fillStyle = atmoGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, planetR + 16, 0, Math.PI * 2);
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
      const shipAngle = -Math.PI / 2 + (now * 0.0006 * timeWarp) % (Math.PI * 2);
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

  return (
    <>
      {/* ─── 1. ASTRELIX TOP-CENTER CONIC ORBIT & TIME WARP RIBBON ─── */}
      <div
        style={{
          position: 'absolute',
          top: mission.gameType === 'launch' ? '82px' : '48px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 29,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: 'rgba(4, 9, 20, 0.92)',
          border: '1px solid rgba(56, 189, 248, 0.45)',
          borderRadius: '20px',
          padding: '4px 14px',
          boxShadow: '0 8px 28px rgba(0, 0, 0, 0.8), 0 0 18px rgba(56, 189, 248, 0.2)',
          backdropFilter: 'blur(12px)',
          fontFamily: 'var(--font-mono)',
          pointerEvents: 'auto',
          flexWrap: 'wrap',
        }}
      >
        {/* Conic Apoapsis / Periapsis / Delta-V Readout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '10px', borderRight: '1px solid rgba(148,163,184,0.25)', paddingRight: '10px' }}>
          <span>
            <strong style={{ color: '#38bdf8' }}>AP:</strong>{' '}
            <span style={{ color: '#f8fafc', fontWeight: 800 }}>{telemetry.apoapsisKm} km</span>
          </span>
          <span>
            <strong style={{ color: '#fbbf24' }}>PE:</strong>{' '}
            <span style={{ color: '#f8fafc', fontWeight: 800 }}>{telemetry.periapsisKm} km</span>
          </span>
          <span>
            <strong style={{ color: '#4ade80' }}>Δv:</strong>{' '}
            <span style={{ color: '#f8fafc', fontWeight: 800 }}>{(telemetry.deltaVKms * 1000).toFixed(0)} m/s</span>
          </span>
        </div>

        {/* Astrelix Time Warp Selector (1x, 2x, 5x, 10x) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
          <span style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 800, marginRight: '3px' }}>⏩ WARP:</span>
          {[1, 2, 5, 10].map((w) => (
            <button
              key={w}
              onClick={() => {
                onChangeTimeWarp(w);
                soundFx.playClick(700 + w * 40);
              }}
              style={{
                background: timeWarp === w ? 'linear-gradient(135deg, #0284c7, #0369a1)' : 'rgba(15, 23, 42, 0.85)',
                border: `1px solid ${timeWarp === w ? '#38bdf8' : 'rgba(148, 163, 184, 0.3)'}`,
                color: timeWarp === w ? '#ffffff' : '#94a3b8',
                borderRadius: '6px',
                padding: '2px 7px',
                fontSize: '9.5px',
                fontWeight: 900,
                cursor: 'pointer',
              }}
              title={`Set Simulation Time Warp to ${w}x (Hotkeys: [,] slower, [.] faster)`}
            >
              {w}x
            </button>
          ))}
        </div>

        {/* 3D Conic Orbit Map View Button [M] */}
        <button
          onClick={() => {
            onToggleOrbitMap();
            soundFx.playClick(920);
          }}
          style={{
            background: orbitMapOpen ? 'linear-gradient(135deg, #16a34a, #15803d)' : 'rgba(56, 189, 248, 0.18)',
            border: `1px solid ${orbitMapOpen ? '#4ade80' : '#38bdf8'}`,
            color: orbitMapOpen ? '#ffffff' : '#7dd3fc',
            borderRadius: '12px',
            padding: '3px 10px',
            fontSize: '9.5px',
            fontWeight: 900,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
          title="Toggle Astrelix 3D Conic Orbital Trajectory Map (Hotkey: [M])"
        >
          <span>🪐</span>
          <span>ORBIT MAP [M]</span>
        </button>
      </div>

      {/* ─── 2. ASTRELIX SAS ATTITUDE & AUTOPILOT COMPUTER BAR ─── */}
      <div
        style={{
          position: 'absolute',
          left: mission.gameType === 'launch' ? '202px' : '136px',
          bottom: mission.gameType === 'launch' ? '24px' : '84px',
          zIndex: 27,
          background: 'rgba(6, 12, 26, 0.9)',
          border: '1px solid rgba(56, 189, 248, 0.38)',
          borderRadius: '12px',
          padding: '7px 9px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.7)',
          pointerEvents: 'auto',
        }}
      >
        <div style={{ fontSize: '8.5px', color: '#38bdf8', fontWeight: 900, letterSpacing: '0.08em' }}>
          🧭 SAS FLIGHT COMPUTER
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '4px' }}>
          {(
            [
              { id: 'HOLD', label: 'SAS HOLD', color: '#38bdf8' },
              { id: 'PROGRADE', label: 'PROGRADE', color: '#22c55e' },
              { id: 'RETROGRADE', label: 'RETRO', color: '#f59e0b' },
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
                  borderRadius: '5px',
                  padding: '3px 6px',
                  fontSize: '8.5px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                {m.label}
              </button>
            );
          })}
        </div>
        <button
          onClick={() => {
            onChangeSASMode(sasMode === 'AUTOPILOT' ? 'HOLD' : 'AUTOPILOT');
            soundFx.playReactorStart();
          }}
          style={{
            background:
              sasMode === 'AUTOPILOT'
                ? 'linear-gradient(135deg, #16a34a, #15803d)'
                : 'linear-gradient(135deg, rgba(14, 165, 233, 0.25), rgba(2, 132, 199, 0.35))',
            border: `1.5px solid ${sasMode === 'AUTOPILOT' ? '#4ade80' : '#38bdf8'}`,
            color: '#ffffff',
            borderRadius: '6px',
            padding: '4px 8px',
            fontSize: '9px',
            fontWeight: 900,
            cursor: 'pointer',
            boxShadow: sasMode === 'AUTOPILOT' ? '0 0 14px rgba(34, 197, 94, 0.6)' : 'none',
          }}
          title="Engage Astrelix Full Mission AI Autopilot"
        >
          {sasMode === 'AUTOPILOT' ? '🤖 AI AUTOPILOT: ACTIVE' : '🤖 ENGAGE AI AUTOPILOT'}
        </button>
      </div>

      {/* ─── 3. UNIVERSAL ASTRELIX VERTICAL THROTTLE SLIDER (FOR NON-LAUNCH MISSIONS TOO) ─── */}
      {mission.gameType !== 'launch' && (
        <div
          style={{
            position: 'absolute',
            left: '14px',
            bottom: '215px',
            zIndex: 27,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '5px',
            background: 'rgba(8, 14, 28, 0.9)',
            padding: '8px 6px',
            borderRadius: '12px',
            border: '1px solid rgba(56, 189, 248, 0.38)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.7)',
            backdropFilter: 'blur(10px)',
            width: '52px',
            pointerEvents: 'auto',
          }}
        >
          <button
            onClick={() => {
              onSetThrottle(1.0);
              soundFx.playClick(950);
            }}
            style={{
              width: '100%',
              padding: '3px 0',
              borderRadius: '5px',
              background: telemetry.throttle >= 0.95 ? '#ef4444' : 'rgba(30, 41, 59, 0.9)',
              border: '1px solid rgba(239, 68, 68, 0.6)',
              color: '#fff',
              fontSize: '8.5px',
              fontWeight: 900,
              cursor: 'pointer',
            }}
            title="100% Max Thrust / Drive Power [Z]"
          >
            MAX
          </button>

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
              width: '20px',
              height: '95px',
              background: '#020617',
              borderRadius: '8px',
              border: '1px solid rgba(56, 189, 248, 0.45)',
              cursor: 'ns-resize',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: `${telemetry.throttle * 100}%`,
                background: 'linear-gradient(to top, #10b981, #f59e0b, #ef4444)',
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
              padding: '3px 0',
              borderRadius: '5px',
              background: 'rgba(30, 41, 59, 0.9)',
              border: '1px solid rgba(148, 163, 184, 0.4)',
              color: '#cbd5e1',
              fontSize: '8.5px',
              fontWeight: 900,
              cursor: 'pointer',
            }}
            title="Cut Engine Thrust [X]"
          >
            CUT
          </button>
          <div style={{ fontSize: '9.5px', fontWeight: 900, color: '#38bdf8' }}>
            {Math.round(telemetry.throttle * 100)}%
          </div>
        </div>
      )}

      {/* ─── 4. ASTRELIX STAGE TREE & PROPELLANT STACK (LEFT PANEL) ─── */}
      {mission.gameType === 'launch' && (
        <div
          style={{
            position: 'absolute',
            left: '14px',
            top: '235px',
            zIndex: 25,
            background: 'rgba(6, 12, 26, 0.88)',
            border: '1px solid rgba(56, 189, 248, 0.35)',
            borderRadius: '10px',
            padding: '8px 10px',
            width: '155px',
            display: 'flex',
            flexDirection: 'column',
            gap: '5px',
            backdropFilter: 'blur(10px)',
            pointerEvents: 'auto',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '8.5px', color: '#38bdf8', fontWeight: 900, letterSpacing: '0.06em' }}>
              🚀 STAGE STACK
            </span>
            <span style={{ fontSize: '8px', color: '#94a3b8' }}>STG {telemetry.stage}</span>
          </div>

          {hasSideBoosters && (
            <div style={{ fontSize: '8.5px', color: boosterSeparated ? '#64748b' : '#fbbf24', display: 'flex', justifyContent: 'space-between' }}>
              <span>SRB BOOSTERS</span>
              <strong>{boosterSeparated ? 'SEP ✓' : 'ACTIVE'}</strong>
            </div>
          )}

          <div style={{ fontSize: '8.5px', color: fairingSeparated ? '#64748b' : '#38bdf8', display: 'flex', justifyContent: 'space-between' }}>
            <span>AERO FAIRING</span>
            <strong>{fairingSeparated ? 'JETTISON ✓' : 'LOCKED'}</strong>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8.5px', color: '#e2e8f0' }}>
              <span>{telemetry.stage === 1 ? 'S-I CORE LOX/RP1' : 'S-II VACUUM LH2'}</span>
              <strong>{Math.round(telemetry.propellantPct)}%</strong>
            </div>
            <div style={{ width: '100%', height: '6px', background: '#0f172a', borderRadius: '3px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${telemetry.propellantPct}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #22c55e, #38bdf8)',
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ─── 5. ASTRELIX 2-AXIS TVC GIMBAL / ATTITUDE STICK (BOTTOM-RIGHT) ─── */}
      <div
        style={{
          position: 'absolute',
          right: '175px',
          bottom: mission.gameType === 'launch' ? '24px' : '84px',
          zIndex: 27,
          background: 'rgba(6, 12, 26, 0.9)',
          border: '1px solid rgba(56, 189, 248, 0.38)',
          borderRadius: '12px',
          padding: '6px 8px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px',
          backdropFilter: 'blur(10px)',
          pointerEvents: 'auto',
        }}
      >
        <span style={{ fontSize: '8px', color: '#38bdf8', fontWeight: 900, letterSpacing: '0.06em' }}>
          🕹️ TVC GIMBAL [WASD]
        </span>
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
            width: '64px',
            height: '64px',
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
              left: `calc(50% + ${gimbalPos.x * 20}px - 8px)`,
              top: `calc(50% + ${gimbalPos.y * 20}px - 8px)`,
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

      {/* ─── 6. ASTRELIX INTERACTIVE 3D CONIC ORBITAL TRAJECTORY MAP MODAL [M] ─── */}
      {orbitMapOpen && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 55,
            background: 'rgba(3, 7, 18, 0.95)',
            border: '1.5px solid #38bdf8',
            borderRadius: '16px',
            padding: '14px 18px',
            width: '440px',
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(56,189,248,0.25)', paddingBottom: '6px' }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 900, color: '#38bdf8', letterSpacing: '0.06em' }}>
                🪐 ASTRELIX CONIC ORBITAL TRAJECTORY MAP
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
            width={404}
            height={250}
            style={{ width: '100%', height: '250px', borderRadius: '10px', border: '1px solid rgba(56,189,248,0.25)' }}
          />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', fontSize: '9px', textAlign: 'center' }}>
            <div style={{ background: 'rgba(15,23,42,0.8)', padding: '5px', borderRadius: '6px', border: '1px solid rgba(56,189,248,0.25)' }}>
              <div style={{ color: '#94a3b8', fontSize: '8px' }}>APOAPSIS</div>
              <strong style={{ color: '#38bdf8' }}>{telemetry.apoapsisKm} km</strong>
            </div>
            <div style={{ background: 'rgba(15,23,42,0.8)', padding: '5px', borderRadius: '6px', border: '1px solid rgba(251,191,36,0.25)' }}>
              <div style={{ color: '#94a3b8', fontSize: '8px' }}>PERIAPSIS</div>
              <strong style={{ color: '#fbbf24' }}>{telemetry.periapsisKm} km</strong>
            </div>
            <div style={{ background: 'rgba(15,23,42,0.8)', padding: '5px', borderRadius: '6px', border: '1px solid rgba(34,197,94,0.25)' }}>
              <div style={{ color: '#94a3b8', fontSize: '8px' }}>DELTA-V</div>
              <strong style={{ color: '#4ade80' }}>{(telemetry.deltaVKms * 1000).toFixed(0)} m/s</strong>
            </div>
            <div style={{ background: 'rgba(15,23,42,0.8)', padding: '5px', borderRadius: '6px', border: '1px solid rgba(168,85,247,0.25)' }}>
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
                padding: '7px 10px',
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
                padding: '7px 10px',
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
