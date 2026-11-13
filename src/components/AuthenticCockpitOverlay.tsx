import React, { useMemo } from 'react';
import type { MissionGameConfig } from '../game/missionGameData';
import { soundFx } from '../utils/audioEffects';

export type CockpitEra = 'MERCURY_GEMINI' | 'APOLLO' | 'SPACE_SHUTTLE' | 'ARTEMIS_ORION' | 'ROVER_EVA';

export interface CockpitTelemetry {
  altitudeKm: number;
  velocityKms: number;
  throttle: number; // 0 to 1
  propellantPct: number; // 0 to 100
  pitchDeg: number;
  rollDeg: number;
  gForce: number;
  flightPhase: string;
  targetAltitudeKm: number;
  targetVelocityKms: number;
  isLunarMission: boolean;
  isMarsMission: boolean;
  destinationName: string;
}

interface AuthenticCockpitOverlayProps {
  mission: MissionGameConfig;
  telemetry: CockpitTelemetry;
  cockpitLookYaw: number;
  cockpitLookPitch: number;
  onSetCockpitLook: (yaw: number, pitch: number) => void;
  onThrottleChange?: (delta: number) => void;
  onStageTrigger?: () => void;
  onAbort?: () => void;
}

/**
 * Determines the historic NASA era and cockpit architecture for the given mission.
 */
export function getMissionCockpitEra(mission: MissionGameConfig): CockpitEra {
  if (mission.gameType === 'rover') return 'ROVER_EVA';

  const id = mission.id || '';
  const prog = (mission.programName || '').toLowerCase();
  const name = (mission.missionName || '').toLowerCase();
  const num = parseInt(id.replace('NASA-M', ''), 10);

  // 1. Mercury & Gemini (1961 - 1966)
  if (prog.includes('mercury') || prog.includes('gemini') || (!isNaN(num) && num <= 17)) {
    return 'MERCURY_GEMINI';
  }

  // 2. Apollo & Skylab (1968 - 1975)
  if (prog.includes('apollo') || prog.includes('skylab') || name.includes('saturn') || name.includes('apollo') || (!isNaN(num) && num >= 18 && num <= 32)) {
    return 'APOLLO';
  }

  // 3. Space Shuttle (1981 - 2011)
  if (prog.includes('shuttle') || name.includes('sts-') || (!isNaN(num) && num >= 33 && num <= 44)) {
    return 'SPACE_SHUTTLE';
  }

  // 4. Artemis / Orion / Commercial Crew (2020+)
  return 'ARTEMIS_ORION';
}

export const AuthenticCockpitOverlay: React.FC<AuthenticCockpitOverlayProps> = ({
  mission,
  telemetry,
  cockpitLookYaw,
  cockpitLookPitch,
  onSetCockpitLook,
  onAbort,
}) => {
  const era = useMemo(() => getMissionCockpitEra(mission), [mission]);

  // Cockpit freelook parallax displacement (smoothly shifts the interior frame as user looks around)
  const lookX = Math.sin(cockpitLookYaw) * 120;
  const lookY = Math.sin(cockpitLookPitch) * 80;

  // Sound helper
  const handleButtonBeep = (freq = 800) => {
    soundFx.playClick(freq);
  };

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 16,
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      {/* ─────────────────────────────────────────────────────────────
          1. ERA-SPECIFIC COCKPIT CANOPY FRAME & INSTRUMENT CONSOLE
          ───────────────────────────────────────────────────────────── */}
      {era === 'MERCURY_GEMINI' && (
        <MercuryGeminiCockpit
          telemetry={telemetry}
          lookX={lookX}
          lookY={lookY}
          onButtonBeep={handleButtonBeep}
          onAbort={onAbort}
        />
      )}

      {era === 'APOLLO' && (
        <ApolloCommandModuleCockpit
          telemetry={telemetry}
          lookX={lookX}
          lookY={lookY}
          onButtonBeep={handleButtonBeep}
          onAbort={onAbort}
        />
      )}

      {era === 'SPACE_SHUTTLE' && (
        <SpaceShuttleCockpit
          telemetry={telemetry}
          lookX={lookX}
          lookY={lookY}
          onButtonBeep={handleButtonBeep}
          onAbort={onAbort}
        />
      )}

      {era === 'ARTEMIS_ORION' && (
        <ArtemisOrionGlassCockpit
          telemetry={telemetry}
          lookX={lookX}
          lookY={lookY}
          onButtonBeep={handleButtonBeep}
          onAbort={onAbort}
        />
      )}

      {era === 'ROVER_EVA' && (
        <RoverDriverStationCockpit
          telemetry={telemetry}
          lookX={lookX}
          lookY={lookY}
          onButtonBeep={handleButtonBeep}
        />
      )}

      {/* ─────────────────────────────────────────────────────────────
          2. QUICK LOOK PAN-HEAD NAVIGATION BAR (TOP-CENTER CANOPY)
          ───────────────────────────────────────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          top: '84px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'rgba(5, 10, 20, 0.92)',
          border: '1px solid rgba(56, 189, 248, 0.45)',
          borderRadius: '24px',
          padding: '4px 12px',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.85), 0 0 15px rgba(56, 189, 248, 0.3)',
          pointerEvents: 'auto',
          backdropFilter: 'blur(10px)',
          zIndex: 25,
        }}
      >
        <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 800, paddingRight: '4px', letterSpacing: '0.05em' }}>
          👀 COCKPIT SIGHT:
        </span>
        <button
          onClick={() => { onSetCockpitLook(-Math.PI / 2.5, 0); handleButtonBeep(700); }}
          className="cockpit-nav-pill"
          title="Turn head left 75° to see left window & side breaker panels"
          style={quickLookPillStyle(cockpitLookYaw < -0.4)}
        >
          ◀ LEFT VIEW
        </button>
        <button
          onClick={() => { onSetCockpitLook(0, 0); handleButtonBeep(850); }}
          className="cockpit-nav-pill"
          title="Look straight ahead through front flight window"
          style={quickLookPillStyle(Math.abs(cockpitLookYaw) < 0.2 && Math.abs(cockpitLookPitch) < 0.2)}
        >
          ▲ FORWARD FLIGHT
        </button>
        <button
          onClick={() => { onSetCockpitLook(Math.PI / 2.5, 0); handleButtonBeep(700); }}
          className="cockpit-nav-pill"
          title="Turn head right 75° to see right window & avionics"
          style={quickLookPillStyle(cockpitLookYaw > 0.4)}
        >
          RIGHT VIEW ▶
        </button>
        <button
          onClick={() => { onSetCockpitLook(0, -0.45); handleButtonBeep(650); }}
          className="cockpit-nav-pill"
          title="Look down at primary instrument panel & computer keyboard"
          style={quickLookPillStyle(cockpitLookPitch < -0.3)}
        >
          ▼ CONSOLE / DSKY
        </button>
        <button
          onClick={() => { onSetCockpitLook(0, 0.4); handleButtonBeep(900); }}
          className="cockpit-nav-pill"
          title="Look up at overhead switchboard & rendezvous window"
          style={quickLookPillStyle(cockpitLookPitch > 0.3)}
        >
          ▲ OVERHEAD
        </button>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 1. PROJECT MERCURY & GEMINI (1961 - 1966) RETRO ANALOG COCKPIT
// ─────────────────────────────────────────────────────────────────────────────
const MercuryGeminiCockpit: React.FC<{
  telemetry: CockpitTelemetry;
  lookX: number;
  lookY: number;
  onButtonBeep: (f: number) => void;
  onAbort?: () => void;
}> = ({ telemetry, lookX, lookY, onButtonBeep, onAbort }) => {
  const gClamped = Math.min(10, Math.max(1, telemetry.gForce));
  const gAngle = -120 + (gClamped / 10) * 240; // Needle angle
  const altMiles = telemetry.altitudeKm * 0.621371;
  const velMph = telemetry.velocityKms * 2236.94;

  return (
    <div
      style={{
        position: 'absolute',
        inset: '-20px',
        transform: `translate(${-lookX * 0.4}px, ${-lookY * 0.4}px)`,
        transition: 'transform 0.08s ease-out',
        pointerEvents: 'none',
      }}
    >
      {/* Heavy Riveted Capsule Forward Window Frame */}
      <svg
        viewBox="0 0 1600 900"
        preserveAspectRatio="none"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          filter: 'drop-shadow(0 15px 35px rgba(0, 0, 0, 0.95))',
        }}
      >
        <defs>
          <linearGradient id="mercuryMetal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1e2430" />
            <stop offset="50%" stopColor="#2b3445" />
            <stop offset="100%" stopColor="#121720" />
          </linearGradient>
          <radialGradient id="periscopeGlass" cx="50%" cy="50%" r="50%">
            <stop offset="85%" stopColor="rgba(56, 189, 248, 0)" />
            <stop offset="97%" stopColor="rgba(56, 189, 248, 0.15)" />
            <stop offset="100%" stopColor="rgba(30, 41, 59, 0.85)" />
          </radialGradient>
        </defs>

        {/* Outer Dark Capsule Hull */}
        <path
          d="M 0,0 L 1600,0 L 1600,900 L 0,900 Z M 480,140 Q 800,80 1120,140 L 1160,540 Q 800,590 440,540 Z"
          fill="url(#mercuryMetal)"
          fillRule="evenodd"
          stroke="#0f172a"
          strokeWidth="6"
        />

        {/* Window Bezel Rivets */}
        {[520, 640, 760, 880, 1000, 1080].map((x, i) => (
          <circle key={i} cx={x} cy={125 + Math.sin(i * 0.6) * 10} r="4" fill="#64748b" stroke="#0f172a" strokeWidth="1.5" />
        ))}
        {[470, 590, 710, 830, 950, 1070, 1130].map((x, i) => (
          <circle key={'b' + i} cx={x} cy={555 + Math.sin(i * 0.5) * 8} r="4" fill="#64748b" stroke="#0f172a" strokeWidth="1.5" />
        ))}

        {/* Optical Glass Horizon Etchings */}
        <line x1="720" y1="340" x2="880" y2="340" stroke="#38bdf8" strokeWidth="1.5" strokeOpacity="0.4" />
        <line x1="800" y1="260" x2="800" y2="420" stroke="#38bdf8" strokeWidth="1.5" strokeOpacity="0.4" />
        <circle cx="800" cy="340" r="120" fill="none" stroke="#38bdf8" strokeWidth="1.2" strokeDasharray="6 4" strokeOpacity="0.3" />
        <circle cx="800" cy="340" r="220" fill="url(#periscopeGlass)" />
      </svg>

      {/* ─── BOTTOM RETRO DASHBOARD / ANALOG GAUGES ─── */}
      <div
        style={{
          position: 'absolute',
          bottom: '68px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '92%',
          maxWidth: '1240px',
          background: 'linear-gradient(180deg, #1f2735 0%, #0d121a 100%)',
          border: '3px solid #334155',
          borderRadius: '16px',
          padding: '12px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 -10px 40px rgba(0,0,0,0.9), inset 0 2px 4px rgba(255,255,255,0.1)',
          pointerEvents: 'auto',
          zIndex: 18,
        }}
      >
        {/* Left: Project Mercury Mission Tag & Sequencer Light Bank */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 900, color: '#f8fafc', letterSpacing: '0.08em', fontFamily: 'monospace' }}>
              PROJECT MERCURY / GEMINI FLIGHT COMPUTER
            </span>
            <span style={{ fontSize: '9px', background: '#0284c7', color: '#fff', padding: '1px 6px', borderRadius: '4px', fontWeight: 800 }}>
              ANALOG TAPE
            </span>
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            <AnnunciatorLamp label="LAUNCH SEQ" active={telemetry.throttle > 0} color="#22c55e" />
            <AnnunciatorLamp label="MAX-Q" active={telemetry.altitudeKm >= 12 && telemetry.altitudeKm <= 20} color="#f59e0b" />
            <AnnunciatorLamp label="BOOSTER SEP" active={telemetry.altitudeKm > 45} color="#38bdf8" />
            <AnnunciatorLamp label="TOWER JETT" active={telemetry.altitudeKm > 60} color="#a855f7" />
            <AnnunciatorLamp label="0.05G SENSE" active={telemetry.gForce >= 1.05} color="#ec4899" />
            <AnnunciatorLamp label="ORBIT NOMINAL" active={telemetry.velocityKms >= 7.8} color="#10b981" />
          </div>
        </div>

        {/* Center: Triple Round Analog Dials */}
        <div style={{ display: 'flex', gap: '18px', alignItems: 'center' }}>
          <RoundDialGauge label="G-FORCE" value={`${telemetry.gForce.toFixed(1)} G`} sub="ACCELEROMETER" angle={gAngle} min="1G" max="10G" />
          <RoundDialGauge label="ALTITUDE" value={`${altMiles.toFixed(0)} NM`} sub={`${telemetry.altitudeKm.toFixed(0)} KM`} angle={-120 + Math.min(240, (altMiles / 150) * 240)} min="0" max="150" />
          <RoundDialGauge label="VELOCITY" value={`${velMph.toFixed(0)} MPH`} sub={`${telemetry.velocityKms.toFixed(1)} KM/S`} angle={-120 + Math.min(240, (telemetry.velocityKms / 8.0) * 240)} min="0" max="18K" />
          <RoundDialGauge label="PROPELLANT" value={`${telemetry.propellantPct.toFixed(0)}%`} sub="HYDROGEN/LOX" angle={-120 + (telemetry.propellantPct / 100) * 240} min="0%" max="100%" />
        </div>

        {/* Right: Retro Emergency Abort Handle */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
          {onAbort && (
            <button
              onClick={() => { onButtonBeep(450); onAbort(); }}
              style={{
                width: '64px',
                height: '48px',
                background: 'linear-gradient(180deg, #dc2626 0%, #991b1b 100%)',
                border: '3px solid #fecaca',
                borderRadius: '8px',
                color: '#ffffff',
                fontWeight: 900,
                fontSize: '11px',
                letterSpacing: '0.06em',
                cursor: 'pointer',
                boxShadow: '0 0 20px rgba(239, 68, 68, 0.7), inset 0 2px 2px rgba(255,255,255,0.4)',
              }}
              title="Pull Emergency Tower Escape System (LES)"
            >
              ABORT
            </button>
          )}
          <span style={{ fontSize: '8px', color: '#94a3b8', fontWeight: 800 }}>T-HANDLE</span>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. APOLLO COMMAND MODULE & SATURN V COCKPIT (1968 - 1972)
// ─────────────────────────────────────────────────────────────────────────────
const ApolloCommandModuleCockpit: React.FC<{
  telemetry: CockpitTelemetry;
  lookX: number;
  lookY: number;
  onButtonBeep: (f: number) => void;
  onAbort?: () => void;
}> = ({ telemetry, lookX, lookY, onButtonBeep, onAbort }) => {
  // Determine Apollo AGC Program
  const agcProg = telemetry.flightPhase === 'pad'
    ? '11' // Pad liftoff
    : telemetry.altitudeKm < 160
    ? '11' // Saturn V Ascent
    : telemetry.isLunarMission && telemetry.flightPhase === 'tli_burn'
    ? '15' // TLI Burn
    : telemetry.isLunarMission && telemetry.flightPhase === 'lunar_orbit'
    ? '63' // Lunar Descent / LOI
    : '02'; // Earth Orbit Insertion

  return (
    <div
      style={{
        position: 'absolute',
        inset: '-20px',
        transform: `translate(${-lookX * 0.4}px, ${-lookY * 0.4}px)`,
        transition: 'transform 0.08s ease-out',
        pointerEvents: 'none',
      }}
    >
      {/* Apollo CM Dual Angled Windows Silhouette */}
      <svg
        viewBox="0 0 1600 900"
        preserveAspectRatio="none"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          filter: 'drop-shadow(0 20px 45px rgba(0, 0, 0, 0.98))',
        }}
      >
        <defs>
          <linearGradient id="apolloAnodized" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#1e2229" />
            <stop offset="50%" stopColor="#2d333e" />
            <stop offset="100%" stopColor="#13171e" />
          </linearGradient>
        </defs>

        {/* Dual Forward Triangular Windows of Command Module */}
        <path
          d="M 0,0 L 1600,0 L 1600,900 L 0,900 Z 
             M 240,120 L 740,100 L 740,560 L 210,540 Z
             M 860,100 L 1360,120 L 1390,540 L 860,560 Z"
          fill="url(#apolloAnodized)"
          fillRule="evenodd"
          stroke="#0b0e14"
          strokeWidth="8"
        />

        {/* Center Structural Strut Window Divider */}
        <rect x="740" y="80" width="120" height="500" fill="#1e2430" stroke="#0f172a" strokeWidth="2" />

        {/* Optical Sight COAS Crosshairs in Left Window */}
        <circle cx="490" cy="330" r="110" fill="none" stroke="#22c55e" strokeWidth="1.2" strokeOpacity="0.4" strokeDasharray="6 4" />
        <line x1="380" y1="330" x2="600" y2="330" stroke="#22c55e" strokeWidth="1.5" strokeOpacity="0.5" />
        <line x1="490" y1="220" x2="490" y2="440" stroke="#22c55e" strokeWidth="1.5" strokeOpacity="0.5" />
      </svg>

      {/* ─── APOLLO MAIN DISPLAY CONSOLE (MDC) ─── */}
      <div
        style={{
          position: 'absolute',
          bottom: '68px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '94%',
          maxWidth: '1280px',
          background: 'linear-gradient(180deg, #2a313d 0%, #151a22 100%)',
          border: '3px solid #475569',
          borderRadius: '14px',
          padding: '10px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 -15px 50px rgba(0,0,0,0.95), inset 0 2px 4px rgba(255,255,255,0.15)',
          pointerEvents: 'auto',
          zIndex: 18,
        }}
      >
        {/* Left: Apollo FDAI (The 8-Ball Attitude Gyro) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '9px', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.08em' }}>FDAI 8-BALL</span>
            <div
              style={{
                width: '74px',
                height: '74px',
                borderRadius: '50%',
                background: 'radial-gradient(circle at 40% 40%, #ffffff 0%, #cbd5e1 45%, #1e293b 85%)',
                border: '3px solid #0f172a',
                boxShadow: 'inset 0 0 15px rgba(0,0,0,0.8), 0 0 12px rgba(0,0,0,0.6)',
                position: 'relative',
                overflow: 'hidden',
                transform: `rotate(${telemetry.rollDeg}deg)`,
                transition: 'transform 0.1s ease-out',
              }}
            >
              {/* Artificial Horizon Equator Bar */}
              <div
                style={{
                  position: 'absolute',
                  top: `${50 - (telemetry.pitchDeg - 45) * 0.6}%`,
                  left: 0,
                  right: 0,
                  height: '2px',
                  background: '#ef4444',
                  boxShadow: '0 0 4px #ef4444',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '12px',
                  height: '12px',
                  border: '1.5px solid #0284c7',
                  borderRadius: '50%',
                }}
              />
            </div>
            <span style={{ fontSize: '8px', color: '#38bdf8', fontWeight: 800 }}>PITCH {telemetry.pitchDeg.toFixed(0)}°</span>
          </div>

          {/* Master Alarm illuminated button */}
          <button
            onClick={() => { onButtonBeep(980); soundFx.playClick(900); }}
            style={{
              padding: '8px 12px',
              background: telemetry.propellantPct < 15 ? '#ef4444' : '#7f1d1d',
              border: '2px solid #fca5a5',
              borderRadius: '6px',
              color: '#ffffff',
              fontWeight: 900,
              fontSize: '10px',
              letterSpacing: '0.08em',
              cursor: 'pointer',
              animation: telemetry.propellantPct < 15 ? 'pulse 0.8s infinite' : 'none',
              boxShadow: telemetry.propellantPct < 15 ? '0 0 20px #ef4444' : 'none',
            }}
            title="Apollo Master Alarm Warning Light (Click to acknowledge)"
          >
            MASTER<br />ALARM
          </button>
        </div>

        {/* Center: THE FAMOUS APOLLO DSKY (DISPLAY & KEYBOARD) */}
        <div
          style={{
            background: '#090d12',
            border: '2px solid #334155',
            borderRadius: '10px',
            padding: '8px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '24px',
            boxShadow: 'inset 0 0 20px rgba(0,0,0,0.9), 0 0 15px rgba(34, 197, 94, 0.15)',
          }}
        >
          {/* AGC Status Lights */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '4px', fontSize: '8px', fontWeight: 900 }}>
            <span style={{ color: '#22c55e', background: 'rgba(34, 197, 94, 0.15)', padding: '2px 4px', borderRadius: '3px' }}>UPLINK</span>
            <span style={{ color: '#22c55e', background: 'rgba(34, 197, 94, 0.15)', padding: '2px 4px', borderRadius: '3px' }}>NO ATT</span>
            <span style={{ color: '#fbbf24', background: 'rgba(251, 191, 36, 0.15)', padding: '2px 4px', borderRadius: '3px' }}>GDC ALIGN</span>
            <span style={{ color: '#38bdf8', background: 'rgba(56, 189, 248, 0.15)', padding: '2px 4px', borderRadius: '3px' }}>TRACKER</span>
          </div>

          {/* DSKY 7-Segment Green Displays */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 800 }}>PROG</div>
              <div style={{ fontSize: '20px', fontFamily: 'monospace', fontWeight: 900, color: '#22c55e', textShadow: '0 0 8px #22c55e' }}>
                {agcProg}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 800 }}>VERB</div>
              <div style={{ fontSize: '20px', fontFamily: 'monospace', fontWeight: 900, color: '#22c55e', textShadow: '0 0 8px #22c55e' }}>
                37
              </div>
            </div>
            <div>
              <div style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 800 }}>NOUN</div>
              <div style={{ fontSize: '20px', fontFamily: 'monospace', fontWeight: 900, color: '#22c55e', textShadow: '0 0 8px #22c55e' }}>
                01
              </div>
            </div>
          </div>

          {/* DSKY R1, R2, R3 Registers */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', borderLeft: '1px solid #1e293b', paddingLeft: '16px' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <span style={{ fontSize: '9px', color: '#64748b', fontWeight: 800, width: '20px' }}>R1:</span>
              <span style={{ fontSize: '13px', fontFamily: 'monospace', color: '#22c55e', fontWeight: 900, textShadow: '0 0 6px #22c55e' }}>
                +{telemetry.altitudeKm.toFixed(1).padStart(7, '0')} KM
              </span>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <span style={{ fontSize: '9px', color: '#64748b', fontWeight: 800, width: '20px' }}>R2:</span>
              <span style={{ fontSize: '13px', fontFamily: 'monospace', color: '#22c55e', fontWeight: 900, textShadow: '0 0 6px #22c55e' }}>
                +{telemetry.velocityKms.toFixed(2).padStart(7, '0')} KM/S
              </span>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <span style={{ fontSize: '9px', color: '#64748b', fontWeight: 800, width: '20px' }}>R3:</span>
              <span style={{ fontSize: '13px', fontFamily: 'monospace', color: '#22c55e', fontWeight: 900, textShadow: '0 0 6px #22c55e' }}>
                +{telemetry.propellantPct.toFixed(0).padStart(3, '0')}% FUEL
              </span>
            </div>
          </div>
        </div>

        {/* Right: Saturn V Stage Indicators & Abort */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', fontWeight: 900, color: '#f8fafc', letterSpacing: '0.06em' }}>
              SATURN V / APOLLO CSM
            </div>
            <div style={{ fontSize: '9.5px', color: '#38bdf8', fontWeight: 800 }}>
              {telemetry.isLunarMission ? '🌕 TARGET: MOON ORBIT' : '🌍 TARGET: LOW EARTH ORBIT'}
            </div>
          </div>

          {onAbort && (
            <button
              onClick={() => { onButtonBeep(450); onAbort(); }}
              style={{
                padding: '8px 14px',
                background: 'linear-gradient(180deg, #dc2626 0%, #991b1b 100%)',
                border: '2px solid #fecaca',
                borderRadius: '8px',
                color: '#ffffff',
                fontWeight: 900,
                fontSize: '11px',
                cursor: 'pointer',
                boxShadow: '0 0 16px rgba(239, 68, 68, 0.7)',
              }}
              title="Initiate Launch Escape Tower Abort"
            >
              ABORT
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. SPACE SHUTTLE ORBITER COCKPIT (1981 - 2011)
// ─────────────────────────────────────────────────────────────────────────────
const SpaceShuttleCockpit: React.FC<{
  telemetry: CockpitTelemetry;
  lookX: number;
  lookY: number;
  onButtonBeep: (f: number) => void;
  onAbort?: () => void;
}> = ({ telemetry, lookX, lookY }) => {
  return (
    <div
      style={{
        position: 'absolute',
        inset: '-20px',
        transform: `translate(${-lookX * 0.4}px, ${-lookY * 0.4}px)`,
        transition: 'transform 0.08s ease-out',
        pointerEvents: 'none',
      }}
    >
      {/* Space Shuttle 6-Window Angular Canopy Frame */}
      <svg
        viewBox="0 0 1600 900"
        preserveAspectRatio="none"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          filter: 'drop-shadow(0 20px 40px rgba(0, 0, 0, 0.95))',
        }}
      >
        <defs>
          <linearGradient id="shuttleGlare" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1a202c" />
            <stop offset="40%" stopColor="#2d3748" />
            <stop offset="100%" stopColor="#171923" />
          </linearGradient>
        </defs>

        {/* 6 Forward & Overhead Orbiter Windows */}
        <path
          d="M 0,0 L 1600,0 L 1600,900 L 0,900 Z 
             M 180,180 L 480,140 L 460,540 L 140,510 Z
             M 510,135 L 780,110 L 770,555 L 490,540 Z
             M 820,110 L 1090,135 L 1110,540 L 830,555 Z
             M 1120,140 L 1420,180 L 1460,510 L 1140,540 Z"
          fill="url(#shuttleGlare)"
          fillRule="evenodd"
          stroke="#0d1117"
          strokeWidth="10"
        />

        {/* Center Pilot HUD Combiner Glass Plate */}
        <polygon
          points="460,190 740,170 730,470 450,450"
          fill="rgba(34, 197, 94, 0.04)"
          stroke="#22c55e"
          strokeWidth="2"
          strokeOpacity="0.4"
        />

        {/* HUD Green Vector Symbology */}
        <circle cx="590" cy="320" r="16" fill="none" stroke="#22c55e" strokeWidth="2" />
        <line x1="560" y1="320" x2="574" y2="320" stroke="#22c55e" strokeWidth="2" />
        <line x1="606" y1="320" x2="620" y2="320" stroke="#22c55e" strokeWidth="2" />
        <line x1="590" y1="304" x2="590" y2="310" stroke="#22c55e" strokeWidth="2" />
      </svg>

      {/* ─── SHUTTLE GLASS COCKPIT MFD FLIGHT DECK ─── */}
      <div
        style={{
          position: 'absolute',
          bottom: '68px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '92%',
          maxWidth: '1240px',
          background: 'linear-gradient(180deg, #242c38 0%, #111620 100%)',
          border: '3px solid #3b4555',
          borderRadius: '14px',
          padding: '10px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 -15px 45px rgba(0,0,0,0.95)',
          pointerEvents: 'auto',
          zIndex: 18,
        }}
      >
        {/* Left MFD: Primary Flight Display (PFD) */}
        <div
          style={{
            width: '240px',
            background: '#040810',
            border: '2px solid #22c55e',
            borderRadius: '8px',
            padding: '8px 12px',
            boxShadow: '0 0 15px rgba(34, 197, 94, 0.25)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#22c55e', fontWeight: 800 }}>
            <span>ORBITER PFD</span>
            <span>GNC-20</span>
          </div>
          <div style={{ marginTop: '6px', fontSize: '11px', color: '#f8fafc', fontFamily: 'monospace' }}>
            <div>ALT: <span style={{ color: '#38bdf8', fontWeight: 900 }}>{telemetry.altitudeKm.toFixed(1)} KM</span></div>
            <div>VEL: <span style={{ color: '#22c55e', fontWeight: 900 }}>{telemetry.velocityKms.toFixed(2)} KM/S</span></div>
            <div>PITCH: <span style={{ color: '#fbbf24', fontWeight: 900 }}>{telemetry.pitchDeg.toFixed(0)}°</span></div>
            <div>G-LOAD: <span style={{ color: '#f43f5e', fontWeight: 900 }}>{telemetry.gForce.toFixed(1)} G</span></div>
          </div>
        </div>

        {/* Center: Master Caution & Warning Indicator Strip */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <div style={{ fontSize: '11px', fontWeight: 900, color: '#f8fafc', letterSpacing: '0.08em' }}>
            NASA SPACE SHUTTLE ORBITER FLIGHT DECK
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <AnnunciatorLamp label="SSME 104%" active={telemetry.throttle > 0.8} color="#22c55e" />
            <AnnunciatorLamp label="SRB SEP" active={telemetry.altitudeKm > 45} color="#38bdf8" />
            <AnnunciatorLamp label="ET SEPARATION" active={telemetry.altitudeKm > 110} color="#a855f7" />
            <AnnunciatorLamp label="OMS-1 BURN" active={telemetry.altitudeKm >= 140} color="#f59e0b" />
            <AnnunciatorLamp label="LEO STABLE" active={telemetry.velocityKms >= 7.8} color="#10b981" />
          </div>
        </div>

        {/* Right MFD: Orbital Trajectory & Subsystems */}
        <div
          style={{
            width: '240px',
            background: '#040810',
            border: '2px solid #38bdf8',
            borderRadius: '8px',
            padding: '8px 12px',
            boxShadow: '0 0 15px rgba(56, 189, 248, 0.25)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#38bdf8', fontWeight: 800 }}>
            <span>TRAJECTORY MFD</span>
            <span>LEO 51.6°</span>
          </div>
          <div style={{ marginTop: '6px', fontSize: '11px', color: '#f8fafc', fontFamily: 'monospace' }}>
            <div>TARGET ALT: <span style={{ color: '#38bdf8' }}>{telemetry.targetAltitudeKm} KM</span></div>
            <div>TARGET VEL: <span style={{ color: '#22c55e' }}>{telemetry.targetVelocityKms.toFixed(1)} KM/S</span></div>
            <div>OMS FUEL: <span style={{ color: '#fbbf24' }}>{telemetry.propellantPct.toFixed(0)}%</span></div>
            <div>PAYLOAD BAY: <span style={{ color: '#10b981' }}>READY</span></div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. ARTEMIS ORION & MODERN COMMERCIAL CREW (2020 - 2026+) GLASS COCKPIT
// ─────────────────────────────────────────────────────────────────────────────
const ArtemisOrionGlassCockpit: React.FC<{
  telemetry: CockpitTelemetry;
  lookX: number;
  lookY: number;
  onButtonBeep: (f: number) => void;
  onAbort?: () => void;
}> = ({ telemetry, lookX, lookY }) => {
  return (
    <div
      style={{
        position: 'absolute',
        inset: '-20px',
        transform: `translate(${-lookX * 0.4}px, ${-lookY * 0.4}px)`,
        transition: 'transform 0.08s ease-out',
        pointerEvents: 'none',
      }}
    >
      {/* Sleek Carbon-Fiber Wrap-Around Canopy Frame */}
      <svg
        viewBox="0 0 1600 900"
        preserveAspectRatio="none"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          filter: 'drop-shadow(0 25px 50px rgba(0, 0, 0, 0.98))',
        }}
      >
        <defs>
          <linearGradient id="carbonGloss" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#0b0f19" />
            <stop offset="40%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#090d16" />
          </linearGradient>
        </defs>

        {/* Dual Wide Panoramic Viewport Cutouts */}
        <path
          d="M 0,0 L 1600,0 L 1600,900 L 0,900 Z 
             M 160,110 Q 770,70 770,110 L 760,540 Q 400,560 140,540 Z
             M 830,110 Q 830,70 1440,110 L 1460,540 Q 1200,560 840,540 Z"
          fill="url(#carbonGloss)"
          fillRule="evenodd"
          stroke="#0284c7"
          strokeWidth="3"
        />

        {/* Center HUD Reticle */}
        <circle cx="800" cy="320" r="80" fill="none" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="6 4" strokeOpacity="0.4" />
        <circle cx="800" cy="320" r="4" fill="#38bdf8" />
        <line x1="700" y1="320" x2="740" y2="320" stroke="#38bdf8" strokeWidth="2" strokeOpacity="0.7" />
        <line x1="860" y1="320" x2="900" y2="320" stroke="#38bdf8" strokeWidth="2" strokeOpacity="0.7" />
      </svg>

      {/* ─── TRIPLE MODERN TOUCHSCREEN GLASS COCKPIT ─── */}
      <div
        style={{
          position: 'absolute',
          bottom: '68px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '92%',
          maxWidth: '1240px',
          background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.95) 0%, rgba(2, 6, 23, 0.98) 100%)',
          border: '2px solid rgba(56, 189, 248, 0.4)',
          borderRadius: '16px',
          padding: '12px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 -15px 50px rgba(0,0,0,0.95), 0 0 30px rgba(56, 189, 248, 0.2)',
          pointerEvents: 'auto',
          backdropFilter: 'blur(16px)',
          zIndex: 18,
        }}
      >
        {/* Left Screen: Trajectory Path & Flight Director */}
        <div
          style={{
            width: '260px',
            background: 'rgba(2, 6, 23, 0.85)',
            border: '1px solid rgba(56, 189, 248, 0.5)',
            borderRadius: '10px',
            padding: '10px 14px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#38bdf8', fontWeight: 900 }}>
            <span>TRAJECTORY PREDICTOR</span>
            <span style={{ color: '#22c55e' }}>NOMINAL</span>
          </div>
          <div style={{ marginTop: '8px', fontSize: '11.5px', color: '#f8fafc', fontFamily: 'monospace' }}>
            <div>ALTITUDE: <span style={{ color: '#38bdf8', fontWeight: 900 }}>{telemetry.altitudeKm.toFixed(1)} KM</span></div>
            <div>VELOCITY: <span style={{ color: '#22c55e', fontWeight: 900 }}>{telemetry.velocityKms.toFixed(2)} KM/S</span></div>
            <div>TARGET ALT: <span style={{ color: '#cbd5e1' }}>{telemetry.targetAltitudeKm} KM</span></div>
            <div>TARGET VEL: <span style={{ color: '#cbd5e1' }}>{telemetry.targetVelocityKms.toFixed(1)} KM/S</span></div>
          </div>
        </div>

        {/* Center Screen: 3D Attitude Indicator (Synthetic Vision) */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
          <div style={{ fontSize: '12px', fontWeight: 900, color: '#f8fafc', letterSpacing: '0.08em' }}>
            NASA ARTEMIS ORION // ADVANCED GLASS COCKPIT
          </div>
          <div style={{ fontSize: '10px', color: '#38bdf8', fontWeight: 800 }}>
            {telemetry.isLunarMission ? '🌕 TRANS-LUNAR INJECTION (TLI) ARCHITECTURE' : '🌍 EARTH ORBITAL INSERTION PROFILE'}
          </div>
          <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
            <AnnunciatorLamp label="SLS RS-25" active={telemetry.throttle > 0} color="#22c55e" />
            <AnnunciatorLamp label="SRB JETTISON" active={telemetry.altitudeKm > 45} color="#38bdf8" />
            <AnnunciatorLamp label="CORE MECO" active={telemetry.altitudeKm > 120} color="#a855f7" />
            <AnnunciatorLamp label="LEO INSERT" active={telemetry.velocityKms >= 7.8} color="#10b981" />
          </div>
        </div>

        {/* Right Screen: ECLSS & Life Support Telemetry */}
        <div
          style={{
            width: '260px',
            background: 'rgba(2, 6, 23, 0.85)',
            border: '1px solid rgba(168, 85, 247, 0.5)',
            borderRadius: '10px',
            padding: '10px 14px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#c084fc', fontWeight: 900 }}>
            <span>ECLSS &amp; POWER</span>
            <span style={{ color: '#22c55e' }}>100% O₂</span>
          </div>
          <div style={{ marginTop: '8px', fontSize: '11.5px', color: '#f8fafc', fontFamily: 'monospace' }}>
            <div>PROPELLANT: <span style={{ color: '#fbbf24', fontWeight: 900 }}>{telemetry.propellantPct.toFixed(0)}%</span></div>
            <div>CABIN PRESS: <span style={{ color: '#38bdf8' }}>101.3 kPa</span></div>
            <div>G-FORCE: <span style={{ color: telemetry.gForce > 3.5 ? '#ef4444' : '#22c55e', fontWeight: 900 }}>{telemetry.gForce.toFixed(1)} G</span></div>
            <div>THROTTLE: <span style={{ color: '#22c55e', fontWeight: 900 }}>{(telemetry.throttle * 100).toFixed(0)}%</span></div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 5. ROVER EVA DRIVER STATION
// ─────────────────────────────────────────────────────────────────────────────
const RoverDriverStationCockpit: React.FC<{
  telemetry: CockpitTelemetry;
  lookX: number;
  lookY: number;
  onButtonBeep: (f: number) => void;
}> = ({ lookX, lookY }) => {
  return (
    <div
      style={{
        position: 'absolute',
        inset: '-20px',
        transform: `translate(${-lookX * 0.4}px, ${-lookY * 0.4}px)`,
        transition: 'transform 0.08s ease-out',
        pointerEvents: 'none',
      }}
    >
      <svg
        viewBox="0 0 1600 900"
        preserveAspectRatio="none"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      >
        <path
          d="M 0,0 L 1600,0 L 1600,900 L 0,900 Z M 200,100 L 1400,100 L 1400,600 L 200,600 Z"
          fill="#111827"
          fillRule="evenodd"
          stroke="#374151"
          strokeWidth="6"
        />
        <circle cx="800" cy="350" r="90" fill="none" stroke="#22c55e" strokeWidth="1.5" strokeDasharray="8 6" strokeOpacity="0.4" />
      </svg>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPER UI COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────
const AnnunciatorLamp: React.FC<{ label: string; active: boolean; color: string }> = ({ label, active, color }) => (
  <div
    style={{
      padding: '3px 8px',
      borderRadius: '4px',
      background: active ? color : 'rgba(30, 41, 59, 0.6)',
      color: active ? '#ffffff' : '#64748b',
      fontSize: '8.5px',
      fontWeight: 900,
      letterSpacing: '0.06em',
      border: `1px solid ${active ? color : 'rgba(51, 65, 85, 0.6)'}`,
      boxShadow: active ? `0 0 12px ${color}` : 'none',
      transition: 'all 0.2s ease',
    }}
  >
    {label}
  </div>
);

const RoundDialGauge: React.FC<{
  label: string;
  value: string;
  sub: string;
  angle: number;
  min: string;
  max: string;
}> = ({ label, value, sub, angle }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
    <span style={{ fontSize: '8.5px', fontWeight: 800, color: '#94a3b8' }}>{label}</span>
    <div
      style={{
        width: '68px',
        height: '68px',
        borderRadius: '50%',
        background: '#090d14',
        border: '2.5px solid #475569',
        boxShadow: 'inset 0 0 10px rgba(0,0,0,0.9), 0 0 10px rgba(0,0,0,0.5)',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Dial Needle */}
      <div
        style={{
          position: 'absolute',
          top: '8px',
          left: '50%',
          width: '2px',
          height: '26px',
          background: '#ef4444',
          transformOrigin: 'bottom center',
          transform: `translateX(-50%) rotate(${angle}deg)`,
          transition: 'transform 0.08s ease-out',
          boxShadow: '0 0 4px #ef4444',
        }}
      />
      {/* Center cap */}
      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#cbd5e1', zIndex: 2 }} />
      <div style={{ fontSize: '9px', fontWeight: 900, color: '#f8fafc', marginTop: '6px', fontFamily: 'monospace' }}>
        {value}
      </div>
    </div>
    <span style={{ fontSize: '7.5px', color: '#64748b', fontWeight: 800 }}>{sub}</span>
  </div>
);

const quickLookPillStyle = (active: boolean): React.CSSProperties => ({
  background: active ? '#0284c7' : 'rgba(15, 23, 42, 0.7)',
  border: active ? '1px solid #38bdf8' : '1px solid rgba(148, 163, 184, 0.3)',
  color: active ? '#ffffff' : '#94a3b8',
  borderRadius: '16px',
  padding: '3px 9px',
  fontSize: '9px',
  fontWeight: 800,
  cursor: 'pointer',
  transition: 'all 0.15s ease',
});
