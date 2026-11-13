// ============================================================================
// SurvivalMissionsSelectorModal.tsx — NASA Survival Missions (4 Ops) Selector Matrix
// Tactical Mission Operations Hub for the 4 Distinct Spaceflight Expeditions:
// 1. Sub-Orbital Pioneer (100 km Kármán Boundary Flight)
// 2. Orbital Pioneer (200 km Low Earth Orbit Insertion)
// 3. Lunar Voyager (Apollo 11 Full Moon Expedition — Ellipse Reference)
// 4. Mars Interplanetary Voyager (Jezero Crater EDL & MOXIE Operations)
// Built for NASA Space Apps Challenge 2026 · Team Mysterio
// ============================================================================

import React, { useState } from 'react';
import {
  X,
  Rocket,
  Shield,
  AlertTriangle,
  ChevronRight,
  MapPin,
  Footprints,
} from 'lucide-react';
import type { ExpeditionDestination } from '../missions/fullMissionLifecycle';
import type { MissionPhase } from './FullMissionLifecycleModal';
import { soundFx } from '../utils/audioEffects';

export interface SurvivalMissionDossier {
  id: ExpeditionDestination;
  code: string;
  name: string;
  badge: string;
  tagline: string;
  targetDestination: string;
  flightProfile: string;
  vehicleStack: string;
  transitTime: string;
  deltaV: string;
  targetAltitudeOrDistance: string;
  gravityWell: string;
  atmosphericPressure: string;
  difficultyRating: number; // 1 to 5
  difficultyLabel: string;
  primaryDirectives: string[];
  hazardsAndObstacles: string[];
  surfaceEvaHighlight: string;
  colorTheme: {
    primary: string;
    border: string;
    glow: string;
    bgGradient: string;
    accentBadge: string;
  };
  directJumpPhase: MissionPhase;
  directJumpLabel: string;
}

export const SURVIVAL_4_OPS_DOSSIERS: SurvivalMissionDossier[] = [
  {
    id: 'MOON_APOLLO',
    code: 'OP-01 // LUN-1',
    name: 'Moon 1: Apollo 11 Tranquility Base',
    badge: '🌕 MOON 1: APOLLO 11',
    tagline: 'Historic 1969 lunar landing: Saturn V launch, LM Eagle powered descent & Neil Armstrong Moonwalk EVA',
    targetDestination: 'Mare Tranquillitatis (0.67°N, 23.47°E)',
    flightProfile: 'Earth Pad 39A ➔ Trans-Lunar Injection ➔ Moon Surface ➔ Earth Return',
    vehicleStack: '3-Stage Saturn V Super Heavy + CSM Columbia + LM Eagle',
    transitTime: '3.5 Days (Simulated with Time Warp)',
    deltaV: '11.2 km/s (Escape) + 1.8 km/s (Descent)',
    targetAltitudeOrDistance: '384,400 km Trans-Lunar Corridor',
    gravityWell: '1.62 m/s² (1/6th Earth Gravity)',
    atmosphericPressure: '0 Pa (Hard Vacuum)',
    difficultyRating: 4,
    difficultyLabel: 'APOLLO LEGEND',
    primaryDirectives: [
      'Ignite Saturn V S-IC first stage with 34.5 MN thrust rollout',
      'Execute Trans-Lunar Injection (TLI) Keplerian burn into lunar corridor',
      'Pilot LM Eagle powered descent to touchdown (< 2.5 m/s) avoiding boulder fields',
      'Walk as Neil Armstrong (WASD), plant American Flag, drill basalt sample & deploy ALSEP',
      'Ascent stage lunar liftoff, Trans-Earth return burn & ocean splashdown',
    ],
    hazardsAndObstacles: [
      'Unforgiving Basalt Crater Rims & Sharp Boulder Fields',
      'Shallow Moonquake Acoustic Regolith Resonance',
      'Historic Apollo 1202 Program Alarm & Radar Dust Blinding',
    ],
    surfaceEvaHighlight: 'Third-Person Walkable Neil Armstrong EVA: Plant Flag, Scoop Basalt, Deploy ALSEP S11',
    colorTheme: {
      primary: '#f59e0b',
      border: 'rgba(245, 158, 11, 0.6)',
      glow: 'rgba(245, 158, 11, 0.25)',
      bgGradient: 'linear-gradient(135deg, rgba(217, 119, 6, 0.18) 0%, rgba(15, 23, 42, 0.95) 100%)',
      accentBadge: '#d97706',
    },
    directJumpPhase: 'SURFACE_EVA',
    directJumpLabel: '🧑‍🚀 JUMP DIRECT TO MOONWALK EVA',
  },
  {
    id: 'MOON_ARTEMIS',
    code: 'OP-02 // LUN-2',
    name: 'Moon 2: Artemis South Pole & Shackleton Ice',
    badge: '🌕 MOON 2: ARTEMIS SOUTH POLE',
    tagline: 'Survive extreme cryogenic shadows (-230°C), harvest water-ice cores, and outrun a Class X7.2 solar flare',
    targetDestination: 'Shackleton Crater Connecting Ridge (-89.9°S, 0.0°E)',
    flightProfile: 'Earth Pad 39A ➔ Polar Lunar Insertion ➔ Malapert Ridge Landing',
    vehicleStack: 'SLS Block 2 + Orion + Starship HLS Lander',
    transitTime: '3.5 Days',
    deltaV: '11.4 km/s (Polar TLI & Landing)',
    targetAltitudeOrDistance: '384,400 km Polar Track',
    gravityWell: '1.62 m/s² (0.166 g - 1/6th Earth)',
    atmosphericPressure: '0 Pa (Hard Vacuum)',
    difficultyRating: 5,
    difficultyLabel: 'ARTEMIS COMMANDER',
    primaryDirectives: [
      'SLS Heavy launch and precision touchdown on razor-thin Malapert ridge',
      'Walk into pitch-black Permanently Shadowed Region with helmet floodlights',
      'Drill cryogenic water-ice core sample for rocket propellant synthesis',
      'Erect 20-meter vertical solar tower mast & evacuate ahead of Class X7.2 solar flare',
    ],
    hazardsAndObstacles: [
      'Class X7.2 Solar Storm Relativistic Proton Flux',
      'Extreme Cryogenic Darkness (-230°C Shadow Crater Pits)',
      'Perpetual Low-Angle Polar Sun Blinding & Shadow Traps',
    ],
    surfaceEvaHighlight: 'Artemis xEMU South Pole EVA: Cryogenic Water-Ice Drill, 20m Solar Tower, Storm Vault',
    colorTheme: {
      primary: '#38bdf8',
      border: 'rgba(56, 189, 248, 0.6)',
      glow: 'rgba(56, 189, 248, 0.25)',
      bgGradient: 'linear-gradient(135deg, rgba(14, 165, 233, 0.18) 0%, rgba(15, 23, 42, 0.95) 100%)',
      accentBadge: '#0284c7',
    },
    directJumpPhase: 'SURFACE_EVA',
    directJumpLabel: '⛏️ JUMP DIRECT TO SOUTH POLE ICE DRILL',
  },
  {
    id: 'MARS_JEZERO',
    code: 'OP-03 // MRS-1',
    name: 'Mars 1: Jezero Crater Ancient River Delta',
    badge: '🔴 MARS 1: JEZERO CRATER',
    tagline: 'Supersonic entry in thin CO2, sky-crane touchdown, MOXIE O2 plant startup & ancient delta rock sampling',
    targetDestination: 'Jezero Crater River Delta (18.38°N, 77.58°E)',
    flightProfile: 'Earth Pad 39A ➔ Trans-Mars Injection ➔ Jezero EDL ➔ MAV Liftoff',
    vehicleStack: 'Heavy Deep Space Stack + Perseverance Sky-Crane + MAV',
    transitTime: '6 to 7 Months (Simulated with Time Warp)',
    deltaV: '12.5 km/s (TMI) + 4.1 km/s (Mars Entry & EDL)',
    targetAltitudeOrDistance: '225,000,000 km Interplanetary Track',
    gravityWell: '3.72 m/s² (38% Earth Gravity)',
    atmosphericPressure: '610 Pa (~0.6% Earth - 95% CO₂)',
    difficultyRating: 5,
    difficultyLabel: 'ASTROBIOLOGY VETERAN',
    primaryDirectives: [
      'Trans-Mars Injection cruise and hypersonic atmospheric entry at Mach 22',
      'Deploy supersonic 21.5m parachute and execute sky-crane powered descent',
      'Power on MOXIE solid oxide electrolyzer to produce breathable O2 from CO2 (10.2 g/hr)',
      'Drill ancient delta clay mudstones for fossil biosignatures & deploy REMS weather station',
    ],
    hazardsAndObstacles: [
      'Supersonic Shockwaves in Thin 610 Pa CO₂ Atmosphere',
      'Active Swirling Dust Devils & Iron Oxide Sand Dunes',
      'Katabatic Canyon Down-Draft Winds & Perchlorate Dust',
    ],
    surfaceEvaHighlight: 'Mars Commander Walkable EVA: Activate MOXIE O₂ Plant, Delta Core Drill, REMS Weather',
    colorTheme: {
      primary: '#ef4444',
      border: 'rgba(239, 68, 68, 0.6)',
      glow: 'rgba(239, 68, 68, 0.25)',
      bgGradient: 'linear-gradient(135deg, rgba(220, 38, 38, 0.18) 0%, rgba(15, 23, 42, 0.95) 100%)',
      accentBadge: '#dc2626',
    },
    directJumpPhase: 'SURFACE_EVA',
    directJumpLabel: '🔴 JUMP DIRECT TO JEZERO CRATER & MOXIE',
  },
  {
    id: 'MARS_VALLES',
    code: 'OP-04 // MRS-2',
    name: 'Mars 2: Valles Marineris Canyon & Global Dust Storm',
    badge: '🔴 MARS 2: VALLES MARINERIS',
    tagline: 'Deep canyon aerocapture into -6.8km Coprates Chasma, blinding global sandstorm, RTG nuclear restart & MAV escape',
    targetDestination: 'Coprates Chasma Canyon Floor (-14.5°S, Depth: -6.8 km)',
    flightProfile: 'Interplanetary Aerocapture ➔ 7,000m Canyon Dive ➔ Deep Gorge Landing',
    vehicleStack: 'Nuclear Thermal Mars Transport + Heavy Ares MAV',
    transitTime: '6 Months',
    deltaV: '13.2 km/s (Canyon Aerocapture & Descent)',
    targetAltitudeOrDistance: '225,000,000 km Interplanetary Track',
    gravityWell: '3.72 m/s² (0.38 g)',
    atmosphericPressure: '1,150 Pa (Dense Canyon Microclimate)',
    difficultyRating: 5,
    difficultyLabel: 'EXTREME PLANETARY SURVIVOR',
    primaryDirectives: [
      'Pilot steep canyon aerocapture between 7,000-meter sheer rock bluffs in blinding dust',
      'Navigate using FLIR terrain sonar against 140 km/h katabatic canyon wind shear',
      'Fire up emergency 2.5 kW RTG nuclear generator as solar panels are blinded (tau = 3.5)',
      'Purge toxic perchlorate dust from air intakes and fire MAV vertically out of canyon gorge',
    ],
    hazardsAndObstacles: [
      'Sheer 7-Kilometer Vertical Canyon Rock Walls',
      'Blinding Planet-Encircling Dust Storm (Optical Depth tau = 3.5)',
      'Howling 140 km/h Supersonic Wind Shear & Electrostatic Discharges',
    ],
    surfaceEvaHighlight: 'Extreme Canyon Storm EVA: Start RTG Nuclear Power, Clear Air Intakes, Launch MAV',
    colorTheme: {
      primary: '#dc2626',
      border: 'rgba(220, 38, 38, 0.7)',
      glow: 'rgba(220, 38, 38, 0.3)',
      bgGradient: 'linear-gradient(135deg, rgba(185, 28, 28, 0.22) 0%, rgba(15, 23, 42, 0.95) 100%)',
      accentBadge: '#991b1b',
    },
    directJumpPhase: 'SURFACE_EVA',
    directJumpLabel: '☢️ JUMP DIRECT TO CANYON FLOOR & RTG',
  },
];

interface SurvivalMissionsSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunchMission: (destination: ExpeditionDestination, startingPhase: MissionPhase) => void;
}

export const SurvivalMissionsSelectorModal: React.FC<SurvivalMissionsSelectorModalProps> = ({
  isOpen,
  onClose,
  onLaunchMission,
}) => {
  const [selectedDestId, setSelectedDestId] = useState<ExpeditionDestination>('MOON_APOLLO');

  if (!isOpen) return null;

  const currentDossier =
    SURVIVAL_4_OPS_DOSSIERS.find((d) => d.id === selectedDestId || (selectedDestId === 'MOON' && d.id === 'MOON_APOLLO')) ||
    SURVIVAL_4_OPS_DOSSIERS[0];

  const handleLaunchFullFlight = (dest: ExpeditionDestination) => {
    soundFx.playReactorStart();
    onLaunchMission(dest, 'PAD_READY');
  };

  const handleLaunchDirectJump = (dest: ExpeditionDestination, phase: MissionPhase) => {
    soundFx.playThruster();
    onLaunchMission(dest, phase);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'radial-gradient(ellipse at 50% 20%, rgba(15, 23, 42, 0.92) 0%, rgba(2, 6, 23, 0.98) 100%)',
        backdropFilter: 'blur(16px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        color: '#f8fafc',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* Outer Tactical Window Container */}
      <div
        style={{
          width: '100%',
          maxWidth: '1280px',
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.95) 0%, rgba(2, 6, 23, 0.98) 100%)',
          border: '1.5px solid rgba(56, 189, 248, 0.35)',
          borderRadius: '16px',
          boxShadow: '0 0 60px rgba(14, 165, 233, 0.25), 0 25px 50px -12px rgba(0, 0, 0, 0.9)',
          overflow: 'hidden',
        }}
      >
        {/* Header HUD Bar */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid rgba(56, 189, 248, 0.25)',
            background: 'linear-gradient(90deg, rgba(30, 58, 138, 0.45) 0%, rgba(15, 23, 42, 0.8) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #0284c7, #2563eb)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 16px rgba(56, 189, 248, 0.5)',
                border: '1px solid #38bdf8',
              }}
            >
              <Shield size={24} color="#ffffff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span
                  style={{
                    fontSize: '11px',
                    fontFamily: 'monospace',
                    fontWeight: 900,
                    letterSpacing: '0.12em',
                    color: '#38bdf8',
                    textTransform: 'uppercase',
                  }}
                >
                  NASA SURVIVAL EXPEDITIONS // TACTICAL 4-OPS MATRIX
                </span>
                <span
                  style={{
                    fontSize: '9.5px',
                    background: 'rgba(34, 197, 94, 0.2)',
                    border: '1px solid #22c55e',
                    color: '#4ade80',
                    fontWeight: 800,
                    padding: '1px 6px',
                    borderRadius: '4px',
                    letterSpacing: '0.05em',
                  }}
                >
                  4 CERTIFIED FLIGHT PATHS
                </span>
              </div>
              <h1
                style={{
                  margin: '2px 0 0 0',
                  fontSize: '20px',
                  fontWeight: 900,
                  letterSpacing: '0.02em',
                  color: '#ffffff',
                }}
              >
                Manual Flight & Planetary Surface Operations
              </h1>
            </div>
          </div>

          <button
            onClick={() => {
              soundFx.playClick();
              onClose();
            }}
            style={{
              background: 'rgba(30, 41, 59, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#94a3b8',
              borderRadius: '8px',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            title="Close Tactical Matrix"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body: Left 4 Mission Navigation Grid + Right Dossier Detail Preview */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px',
            display: 'grid',
            gridTemplateColumns: 'repeat(12, 1fr)',
            gap: '24px',
          }}
        >
          {/* Left Column: 4 Operation Selectable Cards (7 Cols) */}
          <div style={{ gridColumn: 'span 7', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.06em' }}>
                SELECT A FLIGHT DIRECTIVE:
              </span>
              <span style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace' }}>
                CLICK CARD TO VIEW TELEMETRY & LAUNCH
              </span>
            </div>

            {SURVIVAL_4_OPS_DOSSIERS.map((dossier, idx) => {
              const isSelected = selectedDestId === dossier.id;
              return (
                <div
                  key={dossier.id}
                  onClick={() => {
                    soundFx.playClick();
                    setSelectedDestId(dossier.id);
                  }}
                  style={{
                    padding: '16px 20px',
                    borderRadius: '12px',
                    background: isSelected
                      ? dossier.colorTheme.bgGradient
                      : 'linear-gradient(135deg, rgba(30, 41, 59, 0.45) 0%, rgba(15, 23, 42, 0.65) 100%)',
                    border: `1.5px solid ${isSelected ? dossier.colorTheme.border : 'rgba(255, 255, 255, 0.1)'}`,
                    boxShadow: isSelected ? `0 0 25px ${dossier.colorTheme.glow}` : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    position: 'relative',
                  }}
                >
                  {/* Top Bar: Code, Badge, Rating */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          fontFamily: 'monospace',
                          fontWeight: 900,
                          color: isSelected ? dossier.colorTheme.primary : '#94a3b8',
                          background: 'rgba(0,0,0,0.4)',
                          padding: '2px 6px',
                          borderRadius: '4px',
                        }}
                      >
                        {dossier.code}
                      </span>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 800,
                          color: '#ffffff',
                          background: dossier.colorTheme.accentBadge,
                          padding: '2px 8px',
                          borderRadius: '4px',
                        }}
                      >
                        {dossier.badge}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ fontSize: '10px', color: '#e2e8f0', fontWeight: 800 }}>
                        {dossier.difficultyLabel}
                      </span>
                      <span style={{ color: '#f59e0b', fontSize: '12px' }}>
                        {'★'.repeat(dossier.difficultyRating)}
                        {'☆'.repeat(5 - dossier.difficultyRating)}
                      </span>
                    </div>
                  </div>

                  {/* Title & Tagline */}
                  <div>
                    <h3
                      style={{
                        margin: 0,
                        fontSize: '17px',
                        fontWeight: 900,
                        color: isSelected ? '#ffffff' : '#e2e8f0',
                        letterSpacing: '0.02em',
                      }}
                    >
                      {idx + 1}. {dossier.name}
                    </h3>
                    <p
                      style={{
                        margin: '4px 0 0 0',
                        fontSize: '12px',
                        color: isSelected ? '#cbd5e1' : '#94a3b8',
                        lineHeight: 1.4,
                      }}
                    >
                      {dossier.tagline}
                    </p>
                  </div>

                  {/* Bottom Quick Telemetry Strip */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: '8px',
                      background: 'rgba(0, 0, 0, 0.35)',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      fontSize: '11px',
                    }}
                  >
                    <div>
                      <span style={{ color: '#64748b', fontSize: '9.5px', textTransform: 'uppercase', display: 'block' }}>
                        TRANSIT / APEX
                      </span>
                      <strong style={{ color: '#f8fafc', fontFamily: 'monospace' }}>
                        {dossier.transitTime}
                      </strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b', fontSize: '9.5px', textTransform: 'uppercase', display: 'block' }}>
                        DELTA-V BUDGET
                      </span>
                      <strong style={{ color: dossier.colorTheme.primary, fontFamily: 'monospace' }}>
                        {dossier.deltaV}
                      </strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b', fontSize: '9.5px', textTransform: 'uppercase', display: 'block' }}>
                        SURFACE GRAVITY
                      </span>
                      <strong style={{ color: '#f8fafc', fontFamily: 'monospace' }}>
                        {dossier.gravityWell}
                      </strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Detailed Selected Dossier Intel & Two Launch Buttons (5 Cols) */}
          <div
            style={{
              gridColumn: 'span 5',
              display: 'flex',
              flexDirection: 'column',
              background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.85) 100%)',
              borderRadius: '12px',
              border: `1.5px solid ${currentDossier.colorTheme.border}`,
              padding: '20px',
              gap: '16px',
              boxShadow: `0 0 30px ${currentDossier.colorTheme.glow}`,
            }}
          >
            {/* Dossier Header */}
            <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span
                  style={{
                    fontSize: '10.5px',
                    fontFamily: 'monospace',
                    fontWeight: 900,
                    letterSpacing: '0.08em',
                    color: currentDossier.colorTheme.primary,
                  }}
                >
                  MISSION INTEL DOSSIER
                </span>
                <span
                  style={{
                    fontSize: '10px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: '#e2e8f0',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontWeight: 800,
                  }}
                >
                  {currentDossier.vehicleStack.split('+')[0]}
                </span>
              </div>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 900, color: '#ffffff' }}>
                {currentDossier.name}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', color: '#94a3b8', fontSize: '11.5px' }}>
                <MapPin size={13} color={currentDossier.colorTheme.primary} />
                <span>{currentDossier.flightProfile}</span>
              </div>
            </div>

            {/* Directives Checklist */}
            <div>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.05em', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                PRIMARY FLIGHT DIRECTIVES:
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {currentDossier.primaryDirectives.map((dir, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '8px',
                      fontSize: '11.5px',
                      color: '#cbd5e1',
                      lineHeight: 1.35,
                    }}
                  >
                    <span style={{ color: currentDossier.colorTheme.primary, fontWeight: 900 }}>•</span>
                    <span>{dir}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Obstacles & Hazards Box */}
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                padding: '10px 14px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f87171', fontSize: '11px', fontWeight: 800, marginBottom: '6px' }}>
                <AlertTriangle size={14} />
                <span>ACTIVE ENVIRONMENTAL HAZARDS:</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px', color: '#fca5a5' }}>
                {currentDossier.hazardsAndObstacles.map((h, i) => (
                  <div key={i}>⚠️ {h}</div>
                ))}
              </div>
            </div>

            {/* Walkable EVA / Recovery Highlight */}
            <div
              style={{
                background: 'rgba(34, 197, 94, 0.1)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                borderRadius: '8px',
                padding: '10px 14px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#4ade80', fontSize: '11px', fontWeight: 800, marginBottom: '4px' }}>
                <Footprints size={14} />
                <span>SURFACE EVA / RECOVERY SORTIE:</span>
              </div>
              <p style={{ margin: 0, fontSize: '11px', color: '#bbf7d0', lineHeight: 1.35 }}>
                {currentDossier.surfaceEvaHighlight}
              </p>
            </div>

            {/* Launch Action Buttons (Full Flight vs Direct Jump) */}
            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '10px' }}>
              {/* Button 1: Full Flight from Pad 39A */}
              <button
                onClick={() => handleLaunchFullFlight(currentDossier.id)}
                style={{
                  width: '100%',
                  padding: '14px 18px',
                  borderRadius: '10px',
                  background: `linear-gradient(135deg, ${currentDossier.colorTheme.primary}, #1d4ed8)`,
                  border: 'none',
                  color: '#ffffff',
                  fontWeight: 900,
                  fontSize: '13px',
                  letterSpacing: '0.04em',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  boxShadow: `0 0 20px ${currentDossier.colorTheme.glow}`,
                  transition: 'all 0.15s ease',
                }}
              >
                <Rocket size={18} />
                <span>LAUNCH FROM PAD 39A (FULL FLIGHT)</span>
                <ChevronRight size={16} />
              </button>

              {/* Button 2: Direct Jump into Descent / EVA */}
              <button
                onClick={() => handleLaunchDirectJump(currentDossier.id, currentDossier.directJumpPhase)}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  background: 'rgba(30, 41, 59, 0.75)',
                  border: `1px solid ${currentDossier.colorTheme.border}`,
                  color: '#e2e8f0',
                  fontWeight: 800,
                  fontSize: '11px',
                  letterSpacing: '0.03em',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>{currentDossier.directJumpLabel}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Bar */}
        <div
          style={{
            padding: '12px 24px',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            background: 'rgba(2, 6, 23, 0.95)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '11px',
            color: '#64748b',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span>Scientific Data: Apollo 11 PSE, NASA DONKI, JPL REMS & MOLA</span>
            <span>•</span>
            <span style={{ color: '#94a3b8' }}>All 4 missions feature real 3D physics & collision bounds</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => {
                soundFx.playClick();
                onClose();
              }}
              style={{
                background: 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#94a3b8',
                borderRadius: '6px',
                padding: '6px 14px',
                fontWeight: 700,
                fontSize: '11px',
                cursor: 'pointer',
              }}
            >
              Cancel / Back to Lobby
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
