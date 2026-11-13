// ============================================================================
// MissionSpecificCockpitHUD.tsx — 4 Distinct Aerospace Interfaces
// Specialized HUDs for the 4 NASA Survival Expeditions:
// 1. SUBORBITAL: 1960s Project Mercury / X-15 Analog Flight Deck (Analog Dials & Mach Meter)
// 2. ORBITAL: Modern Glass Cockpit MFD (Keplerian Elements, Kessler Radar, 7.8 km/s Vector)
// 3. MOON: Authentic Apollo 11 DSKY & LM Eagle Flight Panel (Green Nixies, FDAI, DPS Bingo)
// 4. MARS: Next-Gen Interplanetary Tactical HUD (MOXIE O2 Plant, Supersonic CO2 EDL, REMS)
// Built for NASA Space Apps Challenge 2026 · Team Mysterio
// ============================================================================

import React, { useEffect, useState } from 'react';
import {
  Gauge,
  Compass,
  AlertTriangle,
  Flame,
  Radio,
  Footprints,
  Shield,
  Zap,
  Activity,
  Wind,
  Layers,
  Sparkles,
  ChevronRight,
  Sun,
  Eye,
  Sliders,
} from 'lucide-react';
import type { ExpeditionDestination } from '../missions/fullMissionLifecycle';
import type { MissionPhase } from './FullMissionLifecycleModal';
import { soundFx } from '../utils/audioEffects';

export interface MissionSpecificCockpitHUDProps {
  destination: ExpeditionDestination;
  missionPhase: MissionPhase;
  flightAltM: number;
  flightSpeedMs: number;
  flightVyMs: number;
  flightVxMs: number;
  flightFuelPct: number;
  pitchDeg: number;
  throttle: number;
  onThrottleChange: (val: number) => void;
  timeWarp: number;
  onTimeWarpChange: (warp: number) => void;
  touchdownStatus: 'SAFE' | 'CRASHED' | 'FLYING';
  evaTasks: { flagPlanted: boolean; sampleDrilled: boolean; seismicDeployed: boolean };
  onWarpAstroToTask: (taskKey: 'task1' | 'task2' | 'task3') => void;
  obstacleAlert: string | null;
  activeEvaPrompt: string | null;
  onExecuteActiveEvaPrompt: () => void;
  navballCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  directorCallout: string;
}

export const MissionSpecificCockpitHUD: React.FC<MissionSpecificCockpitHUDProps> = ({
  destination,
  missionPhase,
  flightAltM,
  flightSpeedMs,
  flightVyMs,
  flightVxMs,
  flightFuelPct,
  pitchDeg,
  throttle,
  onThrottleChange,
  timeWarp,
  onTimeWarpChange,
  touchdownStatus,
  evaTasks,
  onWarpAstroToTask,
  obstacleAlert,
  activeEvaPrompt,
  onExecuteActiveEvaPrompt,
  navballCanvasRef,
  directorCallout,
}) => {
  // Live animated radar sweep angle & simulation clock
  const [radarAngle, setRadarAngle] = useState(0);
  const [moxieOxygenProduced, setMoxieOxygenProduced] = useState(14.8);
  const [dskyAlarmBlink, setDskyAlarmBlink] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setRadarAngle((prev) => (prev + 6) % 360);
      setMoxieOxygenProduced((prev) => +(prev + 0.02).toFixed(2));
      setDskyAlarmBlink((prev) => !prev);
    }, 120);
    return () => clearInterval(timer);
  }, []);

  const machNumber = (flightSpeedMs / 343).toFixed(1);
  const dynamicPressureKPa = Math.min(42, (0.5 * 1.225 * Math.pow(Math.min(flightSpeedMs, 750), 2)) / 1000).toFixed(1);
  const currentGForce = Math.max(1.0, 1.0 + (throttle / 100) * 3.8 + (flightAltM < 15000 && flightSpeedMs > 400 ? 1.8 : 0)).toFixed(1);

  // ───────────────────────────────────────────────────────────────────────────
  // INTERFACE 1: SUB-ORBITAL PIONEER (1960s MERCURY / X-15 ANALOG FLIGHT DECK)
  // ───────────────────────────────────────────────────────────────────────────
  if (destination === 'SUBORBITAL') {
    return (
      <>
        {/* Left: 1960s Analog Instrument Panel */}
        <div
          style={{
            position: 'absolute',
            top: '170px',
            left: '20px',
            width: '240px',
            background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
            border: '2px solid #475569',
            borderRadius: '12px',
            padding: '14px',
            boxShadow: 'inset 0 0 15px rgba(0,0,0,0.8), 0 8px 32px rgba(0,0,0,0.7)',
            zIndex: 90,
            color: '#e2e8f0',
            fontFamily: "'Courier New', monospace",
          }}
        >
          {/* Header Strip with Vintage Rivets */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid #334155', paddingBottom: '6px', marginBottom: '10px' }}>
            <span style={{ fontSize: '10px', fontWeight: 900, color: '#f59e0b', letterSpacing: '0.08em' }}>
              MERCURY-REDSTONE FLIGHT DECK
            </span>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px #22c55e' }} />
          </div>

          {/* Mach Dial */}
          <div style={{ background: '#090d16', border: '1px solid #334155', borderRadius: '8px', padding: '8px', marginBottom: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '9px', color: '#94a3b8' }}>MACH SPEED INDICATOR</div>
            <div style={{ fontSize: '20px', fontWeight: 900, color: +machNumber > 1 ? '#ef4444' : '#38bdf8' }}>
              MACH {machNumber}
            </div>
            <div style={{ fontSize: '8.5px', color: '#64748b' }}>
              {+machNumber > 5 ? 'HYPERSONIC REGIME' : +machNumber > 1 ? 'SUPERSONIC FLIGHT' : 'SUBSONIC CLIMB'}
            </div>
          </div>

          {/* Max-Q & G-Force Dials */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '8px' }}>
            <div style={{ background: '#090d16', border: '1px solid #334155', borderRadius: '6px', padding: '6px', textAlign: 'center' }}>
              <div style={{ fontSize: '8.5px', color: '#94a3b8' }}>MAX-Q DRAG</div>
              <strong style={{ fontSize: '13px', color: +dynamicPressureKPa > 30 ? '#ef4444' : '#fbbf24' }}>
                {dynamicPressureKPa} kPa
              </strong>
            </div>
            <div style={{ background: '#090d16', border: '1px solid #334155', borderRadius: '6px', padding: '6px', textAlign: 'center' }}>
              <div style={{ fontSize: '8.5px', color: '#94a3b8' }}>G-METER</div>
              <strong style={{ fontSize: '13px', color: +currentGForce > 5 ? '#ef4444' : '#38bdf8' }}>
                {currentGForce} G
              </strong>
            </div>
          </div>

          {/* Altitude Barometer & Kármán Line Target */}
          <div style={{ background: '#090d16', border: '1px solid #334155', borderRadius: '8px', padding: '8px', marginBottom: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#94a3b8' }}>
              <span>ALTITUDE</span>
              <span style={{ color: flightAltM >= 100000 ? '#4ade80' : '#38bdf8' }}>
                {flightAltM >= 100000 ? '✅ SPACE (KÁRMÁN)' : 'TARGET: 100 KM'}
              </span>
            </div>
            <div style={{ fontSize: '17px', fontWeight: 900, color: '#ffffff', margin: '2px 0' }}>
              {(flightAltM / 1000).toFixed(1)} km
            </div>
            {/* Progress bar towards 100 km */}
            <div style={{ height: '6px', background: '#1e293b', borderRadius: '3px', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${Math.min(100, (flightAltM / 100000) * 100)}%`,
                  background: flightAltM >= 100000 ? '#22c55e' : 'linear-gradient(90deg, #f59e0b, #38bdf8)',
                }}
              />
            </div>
          </div>

          {/* Vertical Velocity & Attitude */}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', padding: '3px 0' }}>
            <span style={{ color: '#94a3b8' }}>VERTICAL Vy:</span>
            <strong style={{ color: flightVyMs < -5 ? '#ef4444' : '#4ade80' }}>
              {flightVyMs.toFixed(1)} m/s
            </strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', padding: '3px 0' }}>
            <span style={{ color: '#94a3b8' }}>PITCH TILT:</span>
            <strong style={{ color: '#fbbf24' }}>{Math.round(pitchDeg)}°</strong>
          </div>

          {/* Mechanical Switches Status */}
          <div style={{ borderTop: '1px solid #334155', paddingTop: '8px', marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '9px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>BOOSTER TOWER:</span>
              <span style={{ color: flightAltM > 65000 ? '#4ade80' : '#fbbf24', fontWeight: 900 }}>
                {flightAltM > 65000 ? 'JETTISONED' : 'ARMED'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>MAIN CHUTES:</span>
              <span style={{ color: flightAltM < 4000 && missionPhase === 'PARACHUTE_DESCENT' ? '#4ade80' : '#64748b', fontWeight: 900 }}>
                {flightAltM < 4000 ? 'DEPLOYED (4,000M)' : 'STANDBY'}
              </span>
            </div>
          </div>

          {/* Vintage Navball Canvas */}
          <div style={{ marginTop: '8px', textAlign: 'center', borderTop: '1px solid #334155', paddingTop: '6px' }}>
            <span style={{ fontSize: '8.5px', color: '#64748b', display: 'block', marginBottom: '4px' }}>ATTITUDE GYRO</span>
            <canvas ref={navballCanvasRef} width={80} height={80} style={{ width: '70px', height: '70px', borderRadius: '50%', border: '2px solid #475569' }} />
          </div>
        </div>

        {/* Right: Recovery Telemetry & ACES Life Support */}
        <div
          style={{
            position: 'absolute',
            top: '170px',
            right: '20px',
            width: '260px',
            background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
            border: '2px solid #475569',
            borderRadius: '12px',
            padding: '14px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.7)',
            zIndex: 90,
            color: '#e2e8f0',
            fontFamily: "'Courier New', monospace",
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid #334155', paddingBottom: '6px', marginBottom: '8px' }}>
            <span style={{ fontSize: '10px', fontWeight: 900, color: '#38bdf8' }}>ATLANTIC RECOVERY SECTOR</span>
            <Radio size={14} color="#38bdf8" />
          </div>
          <div style={{ fontSize: '10px', color: '#cbd5e1', lineHeight: 1.4 }}>
            <div>• BEACON FREQ: <strong>243.0 MHz (VHF)</strong></div>
            <div>• RETRIEVAL SHIP: <strong>USS ENTERPRISE</strong></div>
            <div>• SUIT PRESSURE: <strong>3.5 PSI (100% O2)</strong></div>
            <div>• CO2 SCRUBBER: <strong>NOMINAL</strong></div>
          </div>

          {missionPhase === 'SURFACE_EVA' && (
            <div style={{ marginTop: '12px', borderTop: '1px solid #334155', paddingTop: '10px' }}>
              <span style={{ fontSize: '10px', fontWeight: 900, color: '#f59e0b', display: 'block', marginBottom: '6px' }}>
                RECOVERY SORTIE TASKS:
              </span>
              <button
                onClick={() => onWarpAstroToTask('task1')}
                style={{
                  width: '100%',
                  padding: '6px',
                  borderRadius: '6px',
                  background: evaTasks.flagPlanted ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                  border: `1px solid ${evaTasks.flagPlanted ? '#22c55e' : '#475569'}`,
                  color: evaTasks.flagPlanted ? '#4ade80' : '#ffffff',
                  fontSize: '10px',
                  cursor: 'pointer',
                  marginBottom: '4px',
                  textAlign: 'left',
                }}
              >
                1. Secure Capsule Beacon {evaTasks.flagPlanted ? '✅' : '⏳'}
              </button>
              <button
                onClick={() => onWarpAstroToTask('task2')}
                style={{
                  width: '100%',
                  padding: '6px',
                  borderRadius: '6px',
                  background: evaTasks.sampleDrilled ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                  border: `1px solid ${evaTasks.sampleDrilled ? '#22c55e' : '#475569'}`,
                  color: evaTasks.sampleDrilled ? '#4ade80' : '#ffffff',
                  fontSize: '10px',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                2. Extract Data Black Box {evaTasks.sampleDrilled ? '✅' : '⏳'}
              </button>
            </div>
          )}
        </div>
      </>
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // INTERFACE 2: ORBITAL PIONEER (MODERN GLASS COCKPIT MFD // 200 KM LEO)
  // ───────────────────────────────────────────────────────────────────────────
  if (destination === 'ORBITAL') {
    const isOrbitalSpeed = flightSpeedMs >= 7600;
    return (
      <>
        {/* Left: Glass Cockpit Orbital MFD */}
        <div
          style={{
            position: 'absolute',
            top: '170px',
            left: '20px',
            width: '260px',
            background: 'linear-gradient(180deg, rgba(10, 17, 40, 0.95) 0%, rgba(2, 6, 23, 0.98) 100%)',
            border: '1.5px solid #00f0ff',
            borderRadius: '12px',
            padding: '16px',
            boxShadow: '0 0 25px rgba(0, 240, 255, 0.25), inset 0 0 15px rgba(0, 240, 255, 0.05)',
            zIndex: 90,
            color: '#f8fafc',
            fontFamily: "'Inter', sans-serif",
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(0, 240, 255, 0.3)', paddingBottom: '8px', marginBottom: '10px' }}>
            <span style={{ fontSize: '11px', fontWeight: 900, color: '#00f0ff', letterSpacing: '0.08em' }}>
              LEO ORBITAL FLIGHT DIRECTOR
            </span>
            <span style={{ fontSize: '9px', background: 'rgba(0, 240, 255, 0.2)', color: '#00f0ff', padding: '1px 6px', borderRadius: '4px', fontWeight: 800 }}>
              MFD-1
            </span>
          </div>

          {/* Orbital Velocity Vector */}
          <div style={{ background: 'rgba(0, 240, 255, 0.05)', border: '1px solid rgba(0, 240, 255, 0.25)', borderRadius: '8px', padding: '10px', marginBottom: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#94a3b8' }}>
              <span>ORBITAL SPEED (v)</span>
              <span style={{ color: isOrbitalSpeed ? '#4ade80' : '#00f0ff', fontWeight: 800 }}>
                {isOrbitalSpeed ? 'CIRCULAR ORBIT' : 'TARGET: 7.8 KM/S'}
              </span>
            </div>
            <div style={{ fontSize: '20px', fontWeight: 900, color: '#ffffff', fontFamily: 'monospace' }}>
              {(flightSpeedMs / 1000).toFixed(2)} km/s
            </div>
            <div style={{ height: '5px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden', marginTop: '4px' }}>
              <div style={{ height: '100%', width: `${Math.min(100, (flightSpeedMs / 7800) * 100)}%`, background: isOrbitalSpeed ? '#22c55e' : '#00f0ff' }} />
            </div>
          </div>

          {/* Keplerian Orbit Elements */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '10px', fontSize: '11px' }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '6px' }}>
              <span style={{ color: '#64748b', fontSize: '9px', display: 'block' }}>APOAPSIS (Ap)</span>
              <strong style={{ color: '#38bdf8', fontFamily: 'monospace' }}>
                {flightAltM > 50000 ? `${(flightAltM / 1000 + 12).toFixed(0)} km` : '--'}
              </strong>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '6px' }}>
              <span style={{ color: '#64748b', fontSize: '9px', display: 'block' }}>PERIAPSIS (Pe)</span>
              <strong style={{ color: '#38bdf8', fontFamily: 'monospace' }}>
                {flightAltM > 150000 ? '192 km' : '--'}
              </strong>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', padding: '3px 0' }}>
            <span style={{ color: '#94a3b8' }}>ECCENTRICITY (e):</span>
            <strong style={{ color: '#4ade80', fontFamily: 'monospace' }}>0.0012 (CIRCULAR)</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', padding: '3px 0' }}>
            <span style={{ color: '#94a3b8' }}>ORBIT PERIOD:</span>
            <strong style={{ color: '#f59e0b', fontFamily: 'monospace' }}>90.4 MIN</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', padding: '3px 0' }}>
            <span style={{ color: '#94a3b8' }}>RETROGRADE BURN:</span>
            <strong style={{ color: '#00f0ff', fontFamily: 'monospace' }}>-250 m/s Δv</strong>
          </div>

          {/* Attitude Navball */}
          <div style={{ marginTop: '10px', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '8px' }}>
            <span style={{ fontSize: '9px', color: '#64748b', display: 'block', marginBottom: '4px' }}>ORBITAL ATTITUDE VECTOR</span>
            <canvas ref={navballCanvasRef} width={84} height={84} style={{ width: '74px', height: '74px', borderRadius: '50%', border: '1.5px solid #00f0ff' }} />
          </div>
        </div>

        {/* Right: Active Kessler Space Debris Radar & Electrical Bus */}
        <div
          style={{
            position: 'absolute',
            top: '170px',
            right: '20px',
            width: '260px',
            background: 'linear-gradient(180deg, rgba(10, 17, 40, 0.95) 0%, rgba(2, 6, 23, 0.98) 100%)',
            border: '1.5px solid #00f0ff',
            borderRadius: '12px',
            padding: '16px',
            boxShadow: '0 0 25px rgba(0, 240, 255, 0.25)',
            zIndex: 90,
            color: '#f8fafc',
            fontFamily: "'Inter', sans-serif', monospace",
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(0, 240, 255, 0.3)', paddingBottom: '6px', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 900, color: '#00f0ff' }}>KESSLER DEBRIS SCANNER</span>
            <Activity size={14} color="#00f0ff" />
          </div>

          {/* Sweeping Radar Circle */}
          <div style={{ position: 'relative', width: '100px', height: '100px', margin: '0 auto 10px auto', borderRadius: '50%', border: '1px solid rgba(0, 240, 255, 0.4)', background: 'radial-gradient(circle, rgba(0,240,255,0.1) 0%, transparent 70%)', overflow: 'hidden' }}>
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                transform: `rotate(${radarAngle}deg)`,
                transformOrigin: '50% 50%',
                background: 'conic-gradient(from 0deg, rgba(0, 240, 255, 0.4) 0deg, transparent 60deg)',
              }}
            />
            {/* Blips */}
            <div style={{ position: 'absolute', top: '35%', left: '60%', width: '4px', height: '4px', borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 6px #ef4444' }} />
            <div style={{ position: 'absolute', top: '70%', left: '25%', width: '4px', height: '4px', borderRadius: '50%', background: '#f59e0b', boxShadow: '0 0 6px #f59e0b' }} />
          </div>

          <div style={{ fontSize: '10px', color: '#cbd5e1', lineHeight: 1.4 }}>
            <div>• TRACKED TARGETS: <strong>2 WITHIN 40 KM</strong></div>
            <div>• RELATIVE VELOCITY: <strong>14.2 KM/S</strong></div>
            <div>• SOLAR BUS POWER: <strong>4.4 kW (NOMINAL)</strong></div>
            <div>• CABIN OXYGEN: <strong>21.2% (101.3 kPa)</strong></div>
          </div>
        </div>
      </>
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // INTERFACE 3: LUNAR VOYAGER (APOLLO 11 AGC DSKY & LM EAGLE PANEL)
  // ───────────────────────────────────────────────────────────────────────────
  if (destination === 'MOON') {
    const isDescentPhase = missionPhase === 'RETRO_DESCENT' || missionPhase === 'SURFACE_LANDED';
    return (
      <>
        {/* Left: Authentic Apollo Guidance Computer (AGC) DSKY Display */}
        <div
          style={{
            position: 'absolute',
            top: '170px',
            left: '20px',
            width: '270px',
            background: '#18181b',
            border: '3px solid #d97706',
            borderRadius: '12px',
            padding: '16px',
            boxShadow: '0 0 30px rgba(217, 119, 6, 0.35), inset 0 0 20px rgba(0,0,0,0.9)',
            zIndex: 90,
            color: '#f8fafc',
            fontFamily: "'Courier New', monospace",
          }}
        >
          {/* DSKY Program / Verb / Noun Header */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginBottom: '12px', background: '#09090b', padding: '8px', borderRadius: '6px', border: '1px solid #27272a' }}>
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '9px', color: '#a1a1aa', display: 'block' }}>PROG</span>
              <strong style={{ fontSize: '16px', color: '#22c55e', letterSpacing: '0.1em' }}>
                {missionPhase === 'SURFACE_LANDED' || missionPhase === 'SURFACE_EVA' ? '68' : isDescentPhase ? '64' : '11'}
              </strong>
            </div>
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '9px', color: '#a1a1aa', display: 'block' }}>VERB</span>
              <strong style={{ fontSize: '16px', color: '#22c55e', letterSpacing: '0.1em' }}>06</strong>
            </div>
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '9px', color: '#a1a1aa', display: 'block' }}>NOUN</span>
              <strong style={{ fontSize: '16px', color: '#22c55e', letterSpacing: '0.1em' }}>62</strong>
            </div>
          </div>

          {/* DSKY 7-Segment Numerical Nixie Readouts */}
          <div style={{ background: '#09090b', border: '1.5px solid #27272a', borderRadius: '8px', padding: '10px', marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '9.5px', color: '#71717a' }}>R1 (ALT):</span>
              <strong style={{ fontSize: '15px', color: '#4ade80', letterSpacing: '0.08em' }}>
                +{Math.round(flightAltM).toString().padStart(6, '0')} M
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '9.5px', color: '#71717a' }}>R2 (Vy):</span>
              <strong style={{ fontSize: '15px', color: flightVyMs < -5 ? '#ef4444' : '#4ade80', letterSpacing: '0.08em' }}>
                {flightVyMs < 0 ? '-' : '+'}{Math.abs(flightVyMs).toFixed(1).padStart(5, '0')} M/S
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '9.5px', color: '#71717a' }}>R3 (H-VEL):</span>
              <strong style={{ fontSize: '15px', color: '#4ade80', letterSpacing: '0.08em' }}>
                +{Math.round(flightSpeedMs).toString().padStart(5, '0')} M/S
              </strong>
            </div>
          </div>

          {/* Apollo Annunciator Caution Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px', marginBottom: '10px', fontSize: '8.5px', fontWeight: 900, textAlign: 'center' }}>
            <div style={{ background: '#27272a', padding: '4px', borderRadius: '3px', color: '#22c55e' }}>UPLINK</div>
            <div style={{ background: '#27272a', padding: '4px', borderRadius: '3px', color: '#4ade80' }}>RADAR OK</div>
            <div style={{ background: dskyAlarmBlink && isDescentPhase ? '#ef4444' : '#27272a', padding: '4px', borderRadius: '3px', color: dskyAlarmBlink && isDescentPhase ? '#ffffff' : '#71717a' }}>
              1202 ALM
            </div>
          </div>

          {/* DPS Descent Throttle & Fuel */}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', padding: '3px 0' }}>
            <span style={{ color: '#a1a1aa' }}>DPS FUEL:</span>
            <strong style={{ color: flightFuelPct < 15 ? '#ef4444' : '#fbbf24' }}>{flightFuelPct.toFixed(0)}%</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', padding: '3px 0' }}>
            <span style={{ color: '#a1a1aa' }}>BINGO TIMER:</span>
            <strong style={{ color: flightFuelPct < 10 ? '#ef4444' : '#22c55e' }}>
              {Math.max(0, Math.round((flightFuelPct / 100) * 120))} SEC
            </strong>
          </div>

          {/* Apollo FDAI 8-Ball Horizon Ball */}
          <div style={{ marginTop: '10px', textAlign: 'center', borderTop: '1px solid #27272a', paddingTop: '8px' }}>
            <span style={{ fontSize: '9px', color: '#a1a1aa', display: 'block', marginBottom: '4px' }}>APOLLO FDAI 8-BALL</span>
            <canvas ref={navballCanvasRef} width={84} height={84} style={{ width: '74px', height: '74px', borderRadius: '50%', border: '2px solid #d97706' }} />
          </div>
        </div>

        {/* Right: Tranquility Base Scientific Objectives (Flag, Drill, ALSEP) */}
        <div
          style={{
            position: 'absolute',
            top: '170px',
            right: '20px',
            width: '280px',
            background: '#18181b',
            border: '2px solid #d97706',
            borderRadius: '12px',
            padding: '16px',
            boxShadow: '0 0 30px rgba(217, 119, 6, 0.35)',
            zIndex: 90,
            color: '#f8fafc',
            fontFamily: "'Courier New', monospace",
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #3f3f46', paddingBottom: '6px', marginBottom: '10px' }}>
            <span style={{ fontSize: '11px', fontWeight: 900, color: '#f59e0b' }}>TRANQUILITY BASE OPS</span>
            <span style={{ fontSize: '9px', background: '#d97706', color: '#ffffff', padding: '1px 6px', borderRadius: '4px', fontWeight: 900 }}>
              APOLLO 11
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px' }}>
            <button
              onClick={() => onWarpAstroToTask('task1')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 10px',
                borderRadius: '6px',
                background: evaTasks.flagPlanted ? 'rgba(34, 197, 94, 0.2)' : '#27272a',
                border: `1.5px solid ${evaTasks.flagPlanted ? '#22c55e' : '#3f3f46'}`,
                color: '#ffffff',
                fontSize: '11px',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <span>🇺🇸 1. Plant American Flag</span>
              <strong style={{ color: evaTasks.flagPlanted ? '#4ade80' : '#f59e0b' }}>
                {evaTasks.flagPlanted ? 'PLANTED' : 'PENDING'}
              </strong>
            </button>

            <button
              onClick={() => onWarpAstroToTask('task2')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 10px',
                borderRadius: '6px',
                background: evaTasks.sampleDrilled ? 'rgba(34, 197, 94, 0.2)' : '#27272a',
                border: `1.5px solid ${evaTasks.sampleDrilled ? '#22c55e' : '#3f3f46'}`,
                color: '#ffffff',
                fontSize: '11px',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <span>⛏️ 2. Core Drill Basalt</span>
              <strong style={{ color: evaTasks.sampleDrilled ? '#4ade80' : '#f59e0b' }}>
                {evaTasks.sampleDrilled ? 'DRILLED' : 'PENDING'}
              </strong>
            </button>

            <button
              onClick={() => onWarpAstroToTask('task3')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 10px',
                borderRadius: '6px',
                background: evaTasks.seismicDeployed ? 'rgba(34, 197, 94, 0.2)' : '#27272a',
                border: `1.5px solid ${evaTasks.seismicDeployed ? '#22c55e' : '#3f3f46'}`,
                color: '#ffffff',
                fontSize: '11px',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <span>📡 3. Deploy ALSEP Station</span>
              <strong style={{ color: evaTasks.seismicDeployed ? '#4ade80' : '#f59e0b' }}>
                {evaTasks.seismicDeployed ? 'ONLINE' : 'PENDING'}
              </strong>
            </button>
          </div>

          <div style={{ fontSize: '10px', color: '#a1a1aa', borderTop: '1px solid #27272a', paddingTop: '8px' }}>
            <div>• SUIT: <strong>APOLLO A7L (3.8 PSI O2)</strong></div>
            <div>• SUBLIMATOR: <strong>WATER COOLING NOMINAL</strong></div>
            <div>• SURFACE GRAVITY: <strong>1.62 m/s² (1/6th g)</strong></div>
          </div>
        </div>
      </>
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // INTERFACE 4: MARS INTERPLANETARY VOYAGER (NEXT-GEN ARES TACTICAL HUD)
  // ───────────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Left: Ares-4 Mars Interplanetary Tactical HUD */}
      <div
        style={{
          position: 'absolute',
          top: '170px',
          left: '20px',
          width: '270px',
          background: 'linear-gradient(180deg, rgba(30, 10, 10, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%)',
          border: '1.5px solid #ef4444',
          borderRadius: '12px',
          padding: '16px',
          boxShadow: '0 0 30px rgba(239, 68, 68, 0.35)',
          zIndex: 90,
          color: '#f8fafc',
          fontFamily: "'Inter', sans-serif",
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(239, 68, 68, 0.4)', paddingBottom: '8px', marginBottom: '10px' }}>
          <span style={{ fontSize: '11px', fontWeight: 900, color: '#ef4444', letterSpacing: '0.08em' }}>
            ARES-4 MARS TACTICAL HUD
          </span>
          <span style={{ fontSize: '9px', background: 'rgba(239, 68, 68, 0.25)', color: '#fca5a5', padding: '1px 6px', borderRadius: '4px', fontWeight: 800 }}>
            JEZERO EDL
          </span>
        </div>

        {/* Mars Entry & Deceleration Velocity */}
        <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', padding: '10px', marginBottom: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#fca5a5' }}>
            <span>ENTRY VELOCITY</span>
            <span style={{ color: '#ef4444', fontWeight: 900 }}>MACH 22 EDL</span>
          </div>
          <div style={{ fontSize: '20px', fontWeight: 900, color: '#ffffff', fontFamily: 'monospace' }}>
            {flightSpeedMs >= 1000 ? `${(flightSpeedMs / 1000).toFixed(2)} km/s` : `${Math.round(flightSpeedMs)} m/s`}
          </div>
          <div style={{ fontSize: '9px', color: '#f87171', marginTop: '2px' }}>
            SUPERSONIC RETRO-PROPULSION
          </div>
        </div>

        {/* Martian Atmosphere & Jezero Terrain Elevation */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '10px', fontSize: '11px' }}>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '6px' }}>
            <span style={{ color: '#94a3b8', fontSize: '9px', display: 'block' }}>ATMOSPHERE (CO2)</span>
            <strong style={{ color: '#f97316', fontFamily: 'monospace' }}>610 Pa</strong>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '6px' }}>
            <span style={{ color: '#94a3b8', fontSize: '9px', display: 'block' }}>SURFACE GRAVITY</span>
            <strong style={{ color: '#fca5a5', fontFamily: 'monospace' }}>3.72 m/s²</strong>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', padding: '3px 0' }}>
          <span style={{ color: '#94a3b8' }}>JEZERO RADAR ALT:</span>
          <strong style={{ color: '#ffffff', fontFamily: 'monospace' }}>
            {flightAltM >= 1000 ? `${(flightAltM / 1000).toFixed(1)} km` : `${Math.round(flightAltM)} m`}
          </strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', padding: '3px 0' }}>
          <span style={{ color: '#94a3b8' }}>DESCENT RATE (Vy):</span>
          <strong style={{ color: flightVyMs < -5 ? '#ef4444' : '#4ade80', fontFamily: 'monospace' }}>
            {flightVyMs.toFixed(1)} m/s
          </strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', padding: '3px 0' }}>
          <span style={{ color: '#94a3b8' }}>KATABATIC WIND:</span>
          <strong style={{ color: '#f59e0b', fontFamily: 'monospace' }}>45 km/h NNE</strong>
        </div>

        {/* Mars Attitude Navball */}
        <div style={{ marginTop: '10px', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '8px' }}>
          <span style={{ fontSize: '9px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>EDL ATTITUDE VECTOR</span>
          <canvas ref={navballCanvasRef} width={84} height={84} style={{ width: '74px', height: '74px', borderRadius: '50%', border: '2px solid #ef4444' }} />
        </div>
      </div>

      {/* Right: MOXIE Oxygen Plant & REMS Weather Console */}
      <div
        style={{
          position: 'absolute',
          top: '170px',
          right: '20px',
          width: '280px',
          background: 'linear-gradient(180deg, rgba(30, 10, 10, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%)',
          border: '1.5px solid #ef4444',
          borderRadius: '12px',
          padding: '16px',
          boxShadow: '0 0 30px rgba(239, 68, 68, 0.35)',
          zIndex: 90,
          color: '#f8fafc',
          fontFamily: "'Inter', sans-serif",
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(239, 68, 68, 0.4)', paddingBottom: '6px', marginBottom: '10px' }}>
          <span style={{ fontSize: '11px', fontWeight: 900, color: '#ef4444' }}>MOXIE & REMS TELEMETRY</span>
          <span style={{ fontSize: '9px', background: '#ef4444', color: '#ffffff', padding: '1px 6px', borderRadius: '4px', fontWeight: 900 }}>
            JPL DATA
          </span>
        </div>

        {/* MOXIE Oxygen Production Box */}
        <div style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)', borderRadius: '8px', padding: '8px', marginBottom: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9.5px', color: '#4ade80', fontWeight: 800 }}>
            <span>MOXIE CO2 ➔ O2 PLANT</span>
            <span>CELL: 800°C</span>
          </div>
          <div style={{ fontSize: '17px', fontWeight: 900, color: '#ffffff', fontFamily: 'monospace', margin: '2px 0' }}>
            {moxieOxygenProduced} g O₂ PRODUCED
          </div>
          <div style={{ fontSize: '9px', color: '#86efac' }}>
            Rate: 10.2 g/hr breathable oxygen extracted
          </div>
        </div>

        {/* REMS Weather Feed */}
        <div style={{ fontSize: '10.5px', color: '#cbd5e1', lineHeight: 1.4, marginBottom: '10px' }}>
          <div>• AMBIENT TEMP: <strong style={{ color: '#38bdf8' }}>-63°C</strong></div>
          <div>• DUST OPACITY (τ): <strong style={{ color: '#f59e0b' }}>0.85 (MODERATE)</strong></div>
          <div>• MAV PROPULSION: <strong style={{ color: '#4ade80' }}>100% READY</strong></div>
          <div>• EARTH WINDOW: <strong style={{ color: '#ffffff' }}>OPEN IN 18 DAYS</strong></div>
        </div>

        {/* Mars Surface EVA Tasks */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <button
            onClick={() => onWarpAstroToTask('task1')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 8px',
              borderRadius: '6px',
              background: evaTasks.flagPlanted ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${evaTasks.flagPlanted ? '#22c55e' : 'rgba(255,255,255,0.1)'}`,
              color: '#ffffff',
              fontSize: '10px',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <span>1. Deploy MOXIE Sabatier {evaTasks.flagPlanted ? '✅' : '⏳'}</span>
          </button>
          <button
            onClick={() => onWarpAstroToTask('task2')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 8px',
              borderRadius: '6px',
              background: evaTasks.sampleDrilled ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${evaTasks.sampleDrilled ? '#22c55e' : 'rgba(255,255,255,0.1)'}`,
              color: '#ffffff',
              fontSize: '10px',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <span>2. Drill Ancient Delta Clays {evaTasks.sampleDrilled ? '✅' : '⏳'}</span>
          </button>
        </div>
      </div>
    </>
  );
};
