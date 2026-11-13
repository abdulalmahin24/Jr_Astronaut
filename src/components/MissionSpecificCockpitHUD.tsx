// ============================================================================
// MissionSpecificCockpitHUD.tsx — 4 Distinct Aerospace Interfaces (2 Moon + 2 Mars)
// Specialized HUDs for the 4 NASA Survival Expeditions:
// 1. MOON 1: Authentic Apollo 11 AGC DSKY & LM Eagle Flight Panel (Green Nixies, FDAI, DPS Bingo)
// 2. MOON 2: Artemis South Pole Glass Cockpit & Solar Flare Radiation Dosimeter MFD
// 3. MARS 1: JPL Astrobiology MFD & live MOXIE O2 Generation Plant Panel
// 4. MARS 2: Deep Canyon Terrain Sonar, FLIR Thermal Radar & RTG Nuclear Power Console
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
  Battery,
  CloudRain,
  Crosshair,
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
  // Live animated sweep angles & sensor feeds
  const [radarAngle, setRadarAngle] = useState(0);
  const [moxieOxygenProduced, setMoxieOxygenProduced] = useState(14.8);
  const [dskyAlarmBlink, setDskyAlarmBlink] = useState(false);
  const [rtgWattage, setRtgWattage] = useState(2480);
  const [solarProtonFlux, setSolarProtonFlux] = useState(12.4);

  useEffect(() => {
    const timer = setInterval(() => {
      setRadarAngle((prev) => (prev + 6) % 360);
      setMoxieOxygenProduced((prev) => +(prev + 0.02).toFixed(2));
      setDskyAlarmBlink((prev) => !prev);
      setRtgWattage((prev) => Math.round(2450 + Math.random() * 50));
      setSolarProtonFlux((prev) => +(12.0 + Math.random() * 2.5).toFixed(1));
    }, 120);
    return () => clearInterval(timer);
  }, []);

  const isMoon1 = destination === 'MOON_APOLLO' || destination === 'MOON';
  const isMoon2 = destination === 'MOON_ARTEMIS' || destination === 'SUBORBITAL';
  const isMars1 = destination === 'MARS_JEZERO' || destination === 'MARS';
  const isMars2 = destination === 'MARS_VALLES' || destination === 'ORBITAL';

  // ───────────────────────────────────────────────────────────────────────────
  // INTERFACE 1: MOON 1 — APOLLO 11 TRANQUILITY BASE (AGC DSKY & LM EAGLE)
  // ───────────────────────────────────────────────────────────────────────────
  if (isMoon1) {
    const isDescentPhase = missionPhase === 'RETRO_DESCENT' || missionPhase === 'SURFACE_LANDED';
    return (
      <>
        {/* Left: Authentic Apollo Guidance Computer (AGC) DSKY Display */}
        <div
          style={{
            position: 'absolute',
            top: '170px',
            left: '20px',
            width: '275px',
            background: '#18181b',
            border: '3px solid #d97706',
            borderRadius: '12px',
            padding: '16px',
            boxShadow: '0 0 35px rgba(217, 119, 6, 0.4), inset 0 0 20px rgba(0,0,0,0.9)',
            zIndex: 90,
            color: '#f8fafc',
            fontFamily: "'Courier New', monospace",
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #3f3f46', paddingBottom: '6px', marginBottom: '8px' }}>
            <span style={{ fontSize: '10px', fontWeight: 900, color: '#f59e0b', letterSpacing: '0.08em' }}>
              APOLLO 11 // LM EAGLE AGC DSKY
            </span>
            <span style={{ fontSize: '9px', background: '#d97706', color: '#ffffff', padding: '1px 6px', borderRadius: '4px', fontWeight: 900 }}>
              1969
            </span>
          </div>

          {/* DSKY Program / Verb / Noun Header */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginBottom: '10px', background: '#09090b', padding: '8px', borderRadius: '6px', border: '1px solid #27272a' }}>
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
          <div style={{ background: '#09090b', border: '1.5px solid #27272a', borderRadius: '8px', padding: '10px', marginBottom: '10px' }}>
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
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', padding: '2px 0' }}>
            <span style={{ color: '#a1a1aa' }}>DPS PROPELLANT:</span>
            <strong style={{ color: flightFuelPct < 15 ? '#ef4444' : '#fbbf24' }}>{flightFuelPct.toFixed(0)}%</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', padding: '2px 0' }}>
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

        {/* Right: Tranquility Base Scientific Objectives (Flag, Scoop, ALSEP) */}
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
            boxShadow: '0 0 35px rgba(217, 119, 6, 0.4)',
            zIndex: 90,
            color: '#f8fafc',
            fontFamily: "'Courier New', monospace",
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #3f3f46', paddingBottom: '6px', marginBottom: '10px' }}>
            <span style={{ fontSize: '11px', fontWeight: 900, color: '#f59e0b' }}>TRANQUILITY BASE DIRECTIVES</span>
            <span style={{ fontSize: '9px', background: 'rgba(34, 197, 94, 0.2)', border: '1px solid #22c55e', color: '#4ade80', padding: '1px 6px', borderRadius: '4px' }}>
              MARE BASALT
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
              <span>⛏️ 2. Collect Basalt Core Sample</span>
              <strong style={{ color: evaTasks.sampleDrilled ? '#4ade80' : '#f59e0b' }}>
                {evaTasks.sampleDrilled ? 'COLLECTED' : 'PENDING'}
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
              <span>📡 3. Deploy ALSEP S11 Seismic Station</span>
              <strong style={{ color: evaTasks.seismicDeployed ? '#4ade80' : '#f59e0b' }}>
                {evaTasks.seismicDeployed ? 'ONLINE' : 'PENDING'}
              </strong>
            </button>
          </div>

          <div style={{ fontSize: '10px', color: '#a1a1aa', borderTop: '1px solid #27272a', paddingTop: '8px' }}>
            <div>• SUIT: <strong>APOLLO A7L (3.8 PSI O2)</strong></div>
            <div>• SUBLIMATOR: <strong>WATER COOLING NOMINAL</strong></div>
            <div>• MOONQUAKE ALERT: <strong>SHALLOW SEISMIC RECORDING</strong></div>
          </div>
        </div>
      </>
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // INTERFACE 2: MOON 2 — ARTEMIS SOUTH POLE & SHACKLETON CRYO ICE
  // ───────────────────────────────────────────────────────────────────────────
  if (isMoon2) {
    return (
      <>
        {/* Left: Modern Artemis Glass Cockpit & Solar Proton Dosimeter */}
        <div
          style={{
            position: 'absolute',
            top: '170px',
            left: '20px',
            width: '270px',
            background: 'linear-gradient(180deg, rgba(8, 28, 50, 0.95) 0%, rgba(2, 6, 23, 0.98) 100%)',
            border: '2px solid #38bdf8',
            borderRadius: '12px',
            padding: '16px',
            boxShadow: '0 0 35px rgba(56, 189, 248, 0.35)',
            zIndex: 90,
            color: '#f8fafc',
            fontFamily: "'Inter', sans-serif",
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(56, 189, 248, 0.3)', paddingBottom: '8px', marginBottom: '10px' }}>
            <span style={{ fontSize: '11px', fontWeight: 900, color: '#38bdf8', letterSpacing: '0.08em' }}>
              ARTEMIS POLAR DESCENT MFD
            </span>
            <span style={{ fontSize: '9px', background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', padding: '1px 6px', borderRadius: '4px', fontWeight: 900 }}>
              MALAPERT RIDGE
            </span>
          </div>

          {/* Polar Radar Altitude & Descent Velocity */}
          <div style={{ background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '8px', padding: '10px', marginBottom: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#94a3b8' }}>
              <span>POLAR RADAR ALTITUDE</span>
              <span style={{ color: '#38bdf8', fontWeight: 800 }}>SHACKLETON RIM</span>
            </div>
            <div style={{ fontSize: '20px', fontWeight: 900, color: '#ffffff', fontFamily: 'monospace' }}>
              {flightAltM >= 1000 ? `${(flightAltM / 1000).toFixed(1)} km` : `${Math.round(flightAltM)} m`}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginTop: '4px' }}>
              <span style={{ color: '#94a3b8' }}>VERTICAL Vy:</span>
              <strong style={{ color: flightVyMs < -4 ? '#ef4444' : '#4ade80', fontFamily: 'monospace' }}>
                {flightVyMs.toFixed(1)} m/s
              </strong>
            </div>
          </div>

          {/* Solar Proton Radiation Dosimeter & Cryo Boil-off */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '10px', fontSize: '11px' }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '6px' }}>
              <span style={{ color: '#94a3b8', fontSize: '9px', display: 'block' }}>PROTON FLUX</span>
              <strong style={{ color: solarProtonFlux > 13 ? '#ef4444' : '#4ade80', fontFamily: 'monospace' }}>
                {solarProtonFlux} MeV
              </strong>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '6px' }}>
              <span style={{ color: '#94a3b8', fontSize: '9px', display: 'block' }}>CRYO TEMPERATURE</span>
              <strong style={{ color: '#38bdf8', fontFamily: 'monospace' }}>-230°C PSR</strong>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', padding: '2px 0' }}>
            <span style={{ color: '#94a3b8' }}>HLS PROPELLANT:</span>
            <strong style={{ color: flightFuelPct < 20 ? '#ef4444' : '#38bdf8', fontFamily: 'monospace' }}>{flightFuelPct.toFixed(0)}%</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', padding: '2px 0' }}>
            <span style={{ color: '#94a3b8' }}>SOLAR FLARE RISK:</span>
            <strong style={{ color: '#f59e0b', fontFamily: 'monospace' }}>CLASS X7.2 INBOUND</strong>
          </div>

          {/* Attitude Navball */}
          <div style={{ marginTop: '10px', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '8px' }}>
            <span style={{ fontSize: '9px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>POLAR DESCENT ATTITUDE</span>
            <canvas ref={navballCanvasRef} width={84} height={84} style={{ width: '74px', height: '74px', borderRadius: '50%', border: '2px solid #38bdf8' }} />
          </div>
        </div>

        {/* Right: Shackleton Cryo Ice Sonar & Solar Tower Console */}
        <div
          style={{
            position: 'absolute',
            top: '170px',
            right: '20px',
            width: '280px',
            background: 'linear-gradient(180deg, rgba(8, 28, 50, 0.95) 0%, rgba(2, 6, 23, 0.98) 100%)',
            border: '2px solid #38bdf8',
            borderRadius: '12px',
            padding: '16px',
            boxShadow: '0 0 35px rgba(56, 189, 248, 0.35)',
            zIndex: 90,
            color: '#f8fafc',
            fontFamily: "'Inter', sans-serif",
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(56, 189, 248, 0.3)', paddingBottom: '6px', marginBottom: '10px' }}>
            <span style={{ fontSize: '11px', fontWeight: 900, color: '#38bdf8' }}>SHACKLETON POLAR DIRECTIVES</span>
            <span style={{ fontSize: '9px', background: '#0284c7', color: '#ffffff', padding: '1px 6px', borderRadius: '4px', fontWeight: 900 }}>
              ARTEMIS HLS
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
                background: evaTasks.flagPlanted ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                border: `1.5px solid ${evaTasks.flagPlanted ? '#22c55e' : 'rgba(255, 255, 255, 0.1)'}`,
                color: '#ffffff',
                fontSize: '11px',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <span>⛏️ 1. Drill Cryogenic Water-Ice Core</span>
              <strong style={{ color: evaTasks.flagPlanted ? '#4ade80' : '#38bdf8' }}>
                {evaTasks.flagPlanted ? 'HARVESTED' : 'PENDING'}
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
                background: evaTasks.sampleDrilled ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                border: `1.5px solid ${evaTasks.sampleDrilled ? '#22c55e' : 'rgba(255, 255, 255, 0.1)'}`,
                color: '#ffffff',
                fontSize: '11px',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <span>🗼 2. Erect 20m Solar Tower Mast</span>
              <strong style={{ color: evaTasks.sampleDrilled ? '#4ade80' : '#38bdf8' }}>
                {evaTasks.sampleDrilled ? 'ONLINE (48 kW)' : 'PENDING'}
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
                background: evaTasks.seismicDeployed ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                border: `1.5px solid ${evaTasks.seismicDeployed ? '#22c55e' : 'rgba(255, 255, 255, 0.1)'}`,
                color: '#ffffff',
                fontSize: '11px',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <span>🚨 3. Evacuate to Storm Bunker</span>
              <strong style={{ color: evaTasks.seismicDeployed ? '#4ade80' : '#f59e0b' }}>
                {evaTasks.seismicDeployed ? 'SECURED' : 'PENDING'}
              </strong>
            </button>
          </div>

          <div style={{ fontSize: '10px', color: '#cbd5e1', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '8px' }}>
            <div>• SUIT: <strong>ARTEMIS xEMU (HEADLIGHT ON)</strong></div>
            <div>• WATER ICE PURITY: <strong>94.6% PROPELLANT GRADE</strong></div>
            <div>• VAULT RADIATION SHIELD: <strong>2.0M COMPACTED REGOLITH</strong></div>
          </div>
        </div>
      </>
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // INTERFACE 3: MARS 1 — JEZERO CRATER DELTA (MOXIE & ASTROBIOLOGY)
  // ───────────────────────────────────────────────────────────────────────────
  if (isMars1) {
    return (
      <>
        {/* Left: Jezero Crater Astrobiology MFD */}
        <div
          style={{
            position: 'absolute',
            top: '170px',
            left: '20px',
            width: '275px',
            background: 'linear-gradient(180deg, rgba(30, 10, 10, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%)',
            border: '2px solid #ef4444',
            borderRadius: '12px',
            padding: '16px',
            boxShadow: '0 0 35px rgba(239, 68, 68, 0.35)',
            zIndex: 90,
            color: '#f8fafc',
            fontFamily: "'Inter', sans-serif",
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(239, 68, 68, 0.4)', paddingBottom: '8px', marginBottom: '10px' }}>
            <span style={{ fontSize: '11px', fontWeight: 900, color: '#ef4444', letterSpacing: '0.08em' }}>
              JEZERO DELTA DESCENT MFD
            </span>
            <span style={{ fontSize: '9px', background: 'rgba(239, 68, 68, 0.25)', color: '#fca5a5', padding: '1px 6px', borderRadius: '4px', fontWeight: 800 }}>
              MARS 2020
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
              SUPERSONIC CHUTE & SKY-CRANE
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

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', padding: '2px 0' }}>
            <span style={{ color: '#94a3b8' }}>RADAR ALTITUDE:</span>
            <strong style={{ color: '#ffffff', fontFamily: 'monospace' }}>
              {flightAltM >= 1000 ? `${(flightAltM / 1000).toFixed(1)} km` : `${Math.round(flightAltM)} m`}
            </strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', padding: '2px 0' }}>
            <span style={{ color: '#94a3b8' }}>DESCENT RATE (Vy):</span>
            <strong style={{ color: flightVyMs < -5 ? '#ef4444' : '#4ade80', fontFamily: 'monospace' }}>
              {flightVyMs.toFixed(1)} m/s
            </strong>
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
            border: '2px solid #ef4444',
            borderRadius: '12px',
            padding: '16px',
            boxShadow: '0 0 35px rgba(239, 68, 68, 0.35)',
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

          {/* Mars Surface EVA Tasks */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px' }}>
            <button
              onClick={() => onWarpAstroToTask('task1')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 10px',
                borderRadius: '6px',
                background: evaTasks.flagPlanted ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                border: `1.5px solid ${evaTasks.flagPlanted ? '#22c55e' : 'rgba(255, 255, 255, 0.1)'}`,
                color: '#ffffff',
                fontSize: '11px',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <span>⚡ 1. Activate MOXIE O2 Plant</span>
              <strong style={{ color: evaTasks.flagPlanted ? '#4ade80' : '#ef4444' }}>
                {evaTasks.flagPlanted ? 'ACTIVE (10g/h)' : 'PENDING'}
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
                background: evaTasks.sampleDrilled ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                border: `1.5px solid ${evaTasks.sampleDrilled ? '#22c55e' : 'rgba(255, 255, 255, 0.1)'}`,
                color: '#ffffff',
                fontSize: '11px',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <span>🧪 2. Drill Ancient Delta Clays</span>
              <strong style={{ color: evaTasks.sampleDrilled ? '#4ade80' : '#ef4444' }}>
                {evaTasks.sampleDrilled ? 'CACHED' : 'PENDING'}
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
                background: evaTasks.seismicDeployed ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                border: `1.5px solid ${evaTasks.seismicDeployed ? '#22c55e' : 'rgba(255, 255, 255, 0.1)'}`,
                color: '#ffffff',
                fontSize: '11px',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <span>🌡️ 3. Deploy REMS Weather Mast</span>
              <strong style={{ color: evaTasks.seismicDeployed ? '#4ade80' : '#ef4444' }}>
                {evaTasks.seismicDeployed ? 'ONLINE (-63°C)' : 'PENDING'}
              </strong>
            </button>
          </div>

          <div style={{ fontSize: '10px', color: '#cbd5e1', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '8px' }}>
            <div>• DUST OPACITY (τ): <strong style={{ color: '#f59e0b' }}>0.85 (MODERATE)</strong></div>
            <div>• MAV PROPULSION: <strong style={{ color: '#4ade80' }}>100% READY</strong></div>
            <div>• EARTH RETURN WINDOW: <strong style={{ color: '#ffffff' }}>OPEN IN 18 DAYS</strong></div>
          </div>
        </div>
      </>
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // INTERFACE 4: MARS 2 — VALLES MARINERIS CANYON & GLOBAL DUST STORM
  // ───────────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Left: Deep Canyon FLIR Sonar & Storm Navigation HUD */}
      <div
        style={{
          position: 'absolute',
          top: '170px',
          left: '20px',
          width: '280px',
          background: 'linear-gradient(180deg, rgba(30, 5, 5, 0.96) 0%, rgba(15, 10, 20, 0.98) 100%)',
          border: '2px solid #dc2626',
          borderRadius: '12px',
          padding: '16px',
          boxShadow: '0 0 35px rgba(220, 38, 38, 0.45)',
          zIndex: 90,
          color: '#f8fafc',
          fontFamily: "'Courier New', monospace",
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(220, 38, 38, 0.4)', paddingBottom: '8px', marginBottom: '10px' }}>
          <span style={{ fontSize: '11px', fontWeight: 900, color: '#dc2626', letterSpacing: '0.08em' }}>
            COPRATES CHASMA CANYON SONAR
          </span>
          <span style={{ fontSize: '9px', background: '#dc2626', color: '#ffffff', padding: '1px 6px', borderRadius: '4px', fontWeight: 900 }}>
            -6.8 KM DEPTH
          </span>
        </div>

        {/* Severe Storm Opacity Warning */}
        <div style={{ background: 'rgba(220, 38, 38, 0.15)', border: '1.5px solid #dc2626', borderRadius: '8px', padding: '8px', marginBottom: '10px', textAlign: 'center' }}>
          <div style={{ fontSize: '9.5px', color: '#fca5a5', fontWeight: 900 }}>GLOBAL DUST STORM OPACITY</div>
          <div style={{ fontSize: '18px', fontWeight: 900, color: '#ffffff', letterSpacing: '0.05em' }}>
            τ = 3.5 (ZERO VISIBILITY)
          </div>
          <div style={{ fontSize: '8.5px', color: '#f87171' }}>
            FLIR INFRARED TERRAIN RADAR ACTIVE
          </div>
        </div>

        {/* Canyon Wall Proximity Sonar */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '10px', fontSize: '11px' }}>
          <div style={{ background: '#1c1917', border: '1px solid #44403c', borderRadius: '6px', padding: '6px' }}>
            <span style={{ color: '#a8a29e', fontSize: '9px', display: 'block' }}>LEFT WALL BLUFF</span>
            <strong style={{ color: '#4ade80' }}>1,240 M CLEAR</strong>
          </div>
          <div style={{ background: '#1c1917', border: '1px solid #44403c', borderRadius: '6px', padding: '6px' }}>
            <span style={{ color: '#a8a29e', fontSize: '9px', display: 'block' }}>RIGHT WALL BLUFF</span>
            <strong style={{ color: '#4ade80' }}>1,860 M CLEAR</strong>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', padding: '2px 0' }}>
          <span style={{ color: '#a8a29e' }}>CANYON FLOOR ALT:</span>
          <strong style={{ color: '#ffffff' }}>
            {flightAltM >= 1000 ? `${(flightAltM / 1000).toFixed(1)} km` : `${Math.round(flightAltM)} m`}
          </strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', padding: '2px 0' }}>
          <span style={{ color: '#a8a29e' }}>KATABATIC WIND:</span>
          <strong style={{ color: '#ef4444' }}>140 km/h GUSTS</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', padding: '2px 0' }}>
          <span style={{ color: '#a8a29e' }}>CANYON PRESSURE:</span>
          <strong style={{ color: '#fbbf24' }}>1,150 Pa (DENSE)</strong>
        </div>

        {/* FLIR Attitude Navball */}
        <div style={{ marginTop: '10px', textAlign: 'center', borderTop: '1px solid #44403c', paddingTop: '8px' }}>
          <span style={{ fontSize: '9px', color: '#a8a29e', display: 'block', marginBottom: '4px' }}>FLIR CANYON ATTITUDE</span>
          <canvas ref={navballCanvasRef} width={84} height={84} style={{ width: '74px', height: '74px', borderRadius: '50%', border: '2px solid #dc2626' }} />
        </div>
      </div>

      {/* Right: 2.5 kW RTG Nuclear Reactor & Canyon Escape Console */}
      <div
        style={{
          position: 'absolute',
          top: '170px',
          right: '20px',
          width: '280px',
          background: 'linear-gradient(180deg, rgba(30, 5, 5, 0.96) 0%, rgba(15, 10, 20, 0.98) 100%)',
          border: '2px solid #dc2626',
          borderRadius: '12px',
          padding: '16px',
          boxShadow: '0 0 35px rgba(220, 38, 38, 0.45)',
          zIndex: 90,
          color: '#f8fafc',
          fontFamily: "'Courier New', monospace",
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(220, 38, 38, 0.4)', paddingBottom: '6px', marginBottom: '10px' }}>
          <span style={{ fontSize: '11px', fontWeight: 900, color: '#dc2626' }}>CANYON SURVIVAL DIRECTIVES</span>
          <span style={{ fontSize: '9px', background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', color: '#fca5a5', padding: '1px 6px', borderRadius: '4px' }}>
            CRITICAL
          </span>
        </div>

        {/* RTG Nuclear Power Box */}
        <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '8px', padding: '8px', marginBottom: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9.5px', color: '#fbbf24', fontWeight: 800 }}>
            <span>2.5 kW RTG NUCLEAR POWER</span>
            <span>SOLAR: 0% CHOKED</span>
          </div>
          <div style={{ fontSize: '17px', fontWeight: 900, color: '#ffffff', margin: '2px 0' }}>
            {rtgWattage} WATTS THERMAL
          </div>
          <div style={{ fontSize: '9px', color: '#fde68a' }}>
            Pu-238 heat source powering base life support
          </div>
        </div>

        {/* Canyon Survival EVA Tasks */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px' }}>
          <button
            onClick={() => onWarpAstroToTask('task1')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 10px',
              borderRadius: '6px',
              background: evaTasks.flagPlanted ? 'rgba(34, 197, 94, 0.2)' : '#1c1917',
              border: `1.5px solid ${evaTasks.flagPlanted ? '#22c55e' : '#44403c'}`,
              color: '#ffffff',
              fontSize: '11px',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <span>☢️ 1. Start RTG Nuclear Power</span>
            <strong style={{ color: evaTasks.flagPlanted ? '#4ade80' : '#dc2626' }}>
              {evaTasks.flagPlanted ? 'ONLINE (2.5kW)' : 'PENDING'}
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
              background: evaTasks.sampleDrilled ? 'rgba(34, 197, 94, 0.2)' : '#1c1917',
              border: `1.5px solid ${evaTasks.sampleDrilled ? '#22c55e' : '#44403c'}`,
              color: '#ffffff',
              fontSize: '11px',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <span>🌪️ 2. Purge Clogged Air Intakes</span>
            <strong style={{ color: evaTasks.sampleDrilled ? '#4ade80' : '#dc2626' }}>
              {evaTasks.sampleDrilled ? 'PURGED' : 'PENDING'}
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
              background: evaTasks.seismicDeployed ? 'rgba(34, 197, 94, 0.2)' : '#1c1917',
              border: `1.5px solid ${evaTasks.seismicDeployed ? '#22c55e' : '#44403c'}`,
              color: '#ffffff',
              fontSize: '11px',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <span>🚀 3. Fire MAV Canyon Escape</span>
            <strong style={{ color: evaTasks.seismicDeployed ? '#4ade80' : '#dc2626' }}>
              {evaTasks.seismicDeployed ? 'READY' : 'PENDING'}
            </strong>
          </button>
        </div>

        <div style={{ fontSize: '10px', color: '#cbd5e1', borderTop: '1px solid #44403c', paddingTop: '8px' }}>
          <div>• STORM VISOR: <strong>ORANGE THERMAL ACTIVE</strong></div>
          <div>• AIR INTAKE STATUS: <strong>PERCHLORATE DUST BLOWN</strong></div>
          <div>• MAV HYPERGOLIC THRUST: <strong>100% READY</strong></div>
        </div>
      </div>
    </>
  );
};
