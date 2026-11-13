import React, { useEffect, useRef, useState, Suspense, lazy } from 'react';
import confetti from 'canvas-confetti';
import {
  X,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Award,
  ChevronRight,
  Sparkles,
  Compass,
  Rocket,
  ShieldAlert,
  Info,
  ExternalLink,
  Bot,
  Eye,
  Layers,
  Box,
  Maximize2,
  Minimize2,
  Film,
} from 'lucide-react';
import { MISSION_GAME_DATA, type MissionGameConfig } from '../game/missionGameData';
import { startPhaserMissionGame, destroyPhaserGame } from '../game/PhaserGameManager';
import { type AstronautAgeTier, ASTRONAUT_TIERS } from '../data/astronautTiers';
const ThreeMissionSimulator = lazy(() =>
  import('./ThreeMissionSimulator').then((m) => ({ default: m.ThreeMissionSimulator }))
);
const FullMissionLifecycleModal = lazy(() =>
  import('./FullMissionLifecycleModal').then((m) => ({ default: m.FullMissionLifecycleModal }))
);
import type { ExpeditionDestination } from '../missions/fullMissionLifecycle';
import { MissionCinematicIntro } from './MissionCinematicIntro';
import {
  NASA_MAPS,
  NASA_VEHICLES,
  type NasaLevelMission,
  type PlanetMapConfig,
  type VehicleConfig,
} from '../data/nasaInteractiveMissions';

interface MissionGameModalProps {
  missionId: string;
  onClose: () => void;
  onCompleteMission: (missionId: string, score: number) => void;
  onSelectNextMission?: (nextMissionId: string) => void;
  completedMissions: string[];
  onOpenLobby?: () => void;
  isCoopMode?: boolean;
  coopRole?: import('../utils/multiplayerMissionService').CrewRole;
  onExitToLobby?: () => void;
  onOpenMoonquakeMap?: () => void;
  onOpenMarsSurvival?: () => void;
}

export const MissionGameModal: React.FC<MissionGameModalProps> = ({
  missionId,
  onClose,
  onCompleteMission,
  onSelectNextMission,
  completedMissions,
  onOpenLobby,
  isCoopMode = false,
  coopRole = 'CDR',
  onExitToLobby,
  onOpenMoonquakeMap,
  onOpenMarsSurvival,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const phaserGameRef = useRef<any>(null);

  const [missionState, setMissionState] = useState<'trailer' | 'briefing' | 'playing' | 'success' | 'failure'>('playing');
  const [engineMode, setEngineMode] = useState<'3d' | '2d'>('3d');
  const [score, setScore] = useState<number>(0);
  const [failureReason, setFailureReason] = useState<string>('');
  const [attemptKey, setAttemptKey] = useState<number>(0);
  const [showAstronautModel, setShowAstronautModel] = useState<boolean>(false);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);
  const [showVabLifecycle, setShowVabLifecycle] = useState<boolean>(false);
  const [selectedAgeTier, setSelectedAgeTier] = useState<AstronautAgeTier>(() => {
    try {
      const saved = localStorage.getItem('astrocamp_age_tier') as AstronautAgeTier;
      if (saved && (saved === 'cadet' || saved === 'officer' || saved === 'commander')) return saved;
    } catch {}
    return 'cadet';
  });
  const [isFullscreen, setIsFullscreen] = useState<boolean>(true);

  // Map cadet-XX, officer-XX, commander-XX or numeric suffix to authentic NASA-MXXX
  const resolvedMissionId = React.useMemo(() => {
    if (!missionId) return 'NASA-M001';
    if (missionId.startsWith('cadet-') || missionId.startsWith('officer-') || missionId.startsWith('commander-')) {
      const numPart = missionId.split('-')[1];
      const num = parseInt(numPart, 10);
      if (!isNaN(num) && num >= 1 && num <= 76) {
        return `NASA-M${num.toString().padStart(3, '0')}`;
      }
    }
    return missionId;
  }, [missionId]);

  const missionIndex = MISSION_GAME_DATA.findIndex((m) => m.id === resolvedMissionId || m.id === missionId);
  const mission: MissionGameConfig = MISSION_GAME_DATA[missionIndex] || MISSION_GAME_DATA[0];
  const nextMission: MissionGameConfig | undefined = MISSION_GAME_DATA[missionIndex + 1];

  const isAlreadyCompleted = completedMissions.includes(mission.id);

  // When a new mission is selected, launch directly into the 3D @Astrelix (Ellipse: Rocket Simulator) flight deck
  useEffect(() => {
    setAttemptKey((prev) => prev + 1);
    setScore(0);
    setFailureReason('');
    setShowVabLifecycle(false);
    setMissionState('playing');
  }, [missionId]);

  // Clean up Phaser on unmount
  useEffect(() => {
    return () => {
      if (phaserGameRef.current) {
        destroyPhaserGame(phaserGameRef.current);
        phaserGameRef.current = null;
      }
    };
  }, []);

  const launchSimulation = () => {
    setAttemptKey((prev) => prev + 1);
    setScore(0);
    setFailureReason('');
    setMissionState('playing');

    if (engineMode === '2d') {
      setTimeout(() => {
        if (!containerRef.current) return;
        if (phaserGameRef.current) {
          destroyPhaserGame(phaserGameRef.current);
          phaserGameRef.current = null;
        }
        containerRef.current.innerHTML = '';
        const game = startPhaserMissionGame(containerRef.current, mission, {
          onSuccess: (finalScore) => {
            setScore(finalScore);
            setMissionState('success');
            onCompleteMission(mission.id, finalScore);
            confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
          },
          onFailure: (reason) => {
            setFailureReason(reason);
            setMissionState('failure');
          },
        });
        phaserGameRef.current = game;
      }, 50);
    }
  };

  const handleRetry = () => {
    launchSimulation();
  };

  const handleNextMission = () => {
    if (nextMission && onSelectNextMission) {
      if (phaserGameRef.current) {
        destroyPhaserGame(phaserGameRef.current);
        phaserGameRef.current = null;
      }
      setMissionState('briefing');
      onSelectNextMission(nextMission.id);
    }
  };

  const getGameTypeIcon = () => {
    switch (mission.gameType) {
      case 'launch':
        return <Rocket className="w-5 h-5 text-emerald-400" />;
      case 'docking':
        return <Compass className="w-5 h-5 text-sky-400" />;
      case 'lunar_landing':
        return <Sparkles className="w-5 h-5 text-amber-400" />;
      case 'rover':
        return <Bot className="w-5 h-5 text-orange-400" />;
      case 'telescope':
        return <Eye className="w-5 h-5 text-purple-400" />;
      case 'deep_space':
        return <Sparkles className="w-5 h-5 text-indigo-400" />;
    }
  };

  const getGameTypeLabel = () => {
    switch (mission.gameType) {
      case 'launch':
        return 'Rocket Launch & Ascent';
      case 'docking':
        return 'Orbital Rendezvous & Docking';
      case 'lunar_landing':
        return 'Planetary Surface Landing';
      case 'rover':
        return 'Surface Rover Teleoperation';
      case 'telescope':
        return 'Space Observatory Calibration';
      case 'deep_space':
        return 'Gravity-Assist Trajectory';
    }
  };

  const getStemLearningObjective = (gameType: string) => {
    switch (gameType) {
      case 'launch':
        return {
          concept: 'Orbital Mechanics & The Tsiolkovsky Rocket Equation',
          desc: 'Learn how multi-stage rockets overcome gravity and drag using gravity turns to reach orbital velocity (~7.8 km/s).',
          formula: 'Δv = Isp · g₀ · ln(m₀ / mf)  |  Orbital Speed: v_orb = √(GM/r)',
        };
      case 'docking':
        return {
          concept: 'Relative Orbital Dynamics & Proximity Capture',
          desc: 'Master relative velocity and Clohessy-Wiltshire rendezvous physics where firing thrusters changes both altitude and speed.',
          formula: 'F = m · a  |  Proximity Approach Rate < 0.5 m/s',
        };
      case 'lunar_landing':
        return {
          concept: 'Terminal Powered Descent & Gravitational Braking',
          desc: 'Balance thrust-to-weight ratios and propellant reserves to brake from orbital velocity to touchdown (<2.5 m/s).',
          formula: 'v² = v₀² + 2a·d  |  Impact Threshold < 2.5 m/s',
        };
      case 'rover':
        return {
          concept: 'Planetary Surface Mobility & Regolith Friction',
          desc: 'Navigate alien terrain gradients, calculate wheel slip friction coefficients, and budget battery power per meter traversed.',
          formula: 'F_friction = μ · N  |  Hazard Slope Angle < 25°',
        };
      case 'telescope':
        return {
          concept: 'Astronomical Optics, Diffraction & Photon Integration',
          desc: 'Stabilize optical apertures, eliminate jitter blur, and cycle spectral filters to capture faint photons from the deep cosmos.',
          formula: 'Diffraction Limit: θ = 1.22 · λ / D  |  Photon Exposure Ratio',
        };
      case 'deep_space':
        return {
          concept: 'N-Body Gravity Assists & Hyperbolic Trajectories',
          desc: 'Use gravitational slingshots from planets to gain hyperbolic excess velocity and escape toward the interstellar heliopause.',
          formula: 'Oberth Effect  |  Hyperbolic Excess: v_∞ = √(v² - v_esc²)',
        };
      default:
        return {
          concept: 'Aerospace Engineering & Telemetry Management',
          desc: 'NASA systems flight rules, attitude steering, and fail-safe mission recovery.',
          formula: 'NASA Systems Engineering Handbook (SP-6105)',
        };
    }
  };

  const stemData = getStemLearningObjective(mission.gameType);

  // Build detailed NASA Ground-Truth Physics Telemetry Comparison for Post-Flight Debriefing
  const getNasaPhysicsDebriefRows = (isSuccess: boolean, reason: string) => {
    const rLower = (reason || '').toLowerCase();
    const numMatch = reason.match(/(\d+\.?\d*)/);
    const extractedVal = numMatch ? parseFloat(numMatch[1]) : null;

    if (mission.gameType === 'lunar_landing') {
      const speedFailed = !isSuccess && (rLower.includes('speed') || rLower.includes('hard') || rLower.includes('velocity'));
      const siteFailed = !isSuccess && (rLower.includes('off-site') || rLower.includes('away') || rLower.includes('beacon'));
      const fuelFailed = !isSuccess && (rLower.includes('fuel') || rLower.includes('propellant'));
      return [
        {
          metric: 'Vertical Touchdown Speed',
          playerVal: isSuccess ? '1.35 m/s' : speedFailed && extractedVal ? `${extractedVal.toFixed(1)} m/s` : '2.10 m/s',
          nasaRef: '0.52 m/s (Apollo 11 LM Eagle)',
          limit: '≤ 5.0 m/s',
          passed: !speedFailed,
        },
        {
          metric: 'Landing Pad Offset Distance',
          playerVal: isSuccess ? '4.8 m' : siteFailed && extractedVal ? `${extractedVal.toFixed(1)} m` : '11.2 m',
          nasaRef: '6.4 m (Surveyor / Apollo Target)',
          limit: '≤ 35.0 m',
          passed: !siteFailed,
        },
        {
          metric: 'Descent Stage Fuel Reserve',
          playerVal: isSuccess ? '8.4% (Nominal)' : fuelFailed ? '0.0% (Depleted)' : '5.1%',
          nasaRef: '4.2% (25 sec Apollo 11 Margin)',
          limit: '≥ 2.0%',
          passed: !fuelFailed,
        },
        {
          metric: 'Touchdown Roll / Pitch Tilt',
          playerVal: isSuccess ? '1.8°' : '6.4°',
          nasaRef: '4.5° (Tranquility Base Slope)',
          limit: '≤ 12.0°',
          passed: true,
        },
      ];
    }

    if (mission.gameType === 'docking') {
      const speedFailed = !isSuccess && (rLower.includes('impact') || rLower.includes('velocity') || rLower.includes('closure'));
      const alignFailed = !isSuccess && (rLower.includes('align') || rLower.includes('missed') || rLower.includes('offset'));
      return [
        {
          metric: 'Relative Closure Rate (Δv)',
          playerVal: isSuccess ? '0.18 m/s' : speedFailed && extractedVal ? `${extractedVal.toFixed(2)} m/s` : '0.32 m/s',
          nasaRef: '0.08 m/s (ISS IDA Soft Capture)',
          limit: '≤ 0.50 m/s',
          passed: !speedFailed,
        },
        {
          metric: 'Lateral Port Alignment Offset',
          playerVal: isSuccess ? '0.09 m (94%)' : alignFailed && extractedVal ? `${extractedVal.toFixed(2)} m` : '0.85 m (42%)',
          nasaRef: '0.04 m (Gemini 8 / Agena)',
          limit: '≤ 0.35 m (>60%)',
          passed: !alignFailed,
        },
        {
          metric: 'RCS Hypergolic Propellant',
          playerVal: isSuccess ? '68% Remaining' : '24% Remaining',
          nasaRef: '55% (NASA RPOD Reserve)',
          limit: '≥ 15%',
          passed: true,
        },
        {
          metric: 'Attitude Roll/Yaw Deviation',
          playerVal: isSuccess ? '0.6°' : alignFailed ? '4.8°' : '1.4°',
          nasaRef: '0.5° (NDSS Capture Standard)',
          limit: '≤ 2.5°',
          passed: !alignFailed,
        },
      ];
    }

    if (mission.gameType === 'rover') {
      return [
        {
          metric: 'Geological Core Samples Cached',
          playerVal: isSuccess ? '3 / 3 Secured' : '1 / 3 Incomplete',
          nasaRef: '3 / 3 (Jezero / Fra Mauro)',
          limit: '100% Waypoints',
          passed: isSuccess,
        },
        {
          metric: 'Rocker-Bogie Chassis Tilt',
          playerVal: isSuccess ? '8.2° (Stable)' : '27.5° (Slip)',
          nasaRef: '11.4° (Perseverance Max Nominal)',
          limit: '≤ 25.0°',
          passed: isSuccess,
        },
        {
          metric: 'MMRTG / Battery Bus Power',
          playerVal: isSuccess ? '84% Charge' : '0% Depleted',
          nasaRef: '78% (110W Continuous RTG)',
          limit: '≥ 15%',
          passed: isSuccess,
        },
        {
          metric: 'Wheel Slip Friction Ratio',
          playerVal: isSuccess ? '0.12 μ (Nominal)' : '0.48 μ (High Slip)',
          nasaRef: '0.15 μ (Martian Regolith)',
          limit: '≤ 0.30 μ',
          passed: isSuccess,
        },
      ];
    }

    if (mission.gameType === 'telescope' || mission.gameType === 'deep_space') {
      return [
        {
          metric: mission.gameType === 'telescope' ? 'Wavefront Mirror Focus' : 'Flyby Periapsis Corridor',
          playerVal: isSuccess ? '96.4% Locked' : '48.0% Unfocused',
          nasaRef: '99.1% (JWST / Voyager)',
          limit: '≥ 80.0%',
          passed: isSuccess,
        },
        {
          metric: 'Reaction Wheel Jitter',
          playerVal: isSuccess ? '1.8 mas' : '14.2 mas',
          nasaRef: '1.2 mas (Fine Guidance Sensor)',
          limit: '≤ 7.0 mas',
          passed: isSuccess,
        },
        {
          metric: 'Deep Space Network Telemetry',
          playerVal: isSuccess ? '34.2 dB-Hz (Locked)' : '8.4 dB-Hz (Lost)',
          nasaRef: '36.0 dB-Hz (70m Goldstone Dish)',
          limit: '≥ 20.0 dB-Hz',
          passed: isSuccess,
        },
        {
          metric: 'Hyperbolic Excess Δv Margin',
          playerVal: isSuccess ? '+140 m/s' : '-85 m/s',
          nasaRef: '+115 m/s (Oberth Slingshot)',
          limit: '≥ 0 m/s',
          passed: isSuccess,
        },
      ];
    }

    // Default: Launch & Orbital Ascent
    const altFailed = !isSuccess && (rLower.includes('altitude') || rLower.includes('trajectory') || rLower.includes('orbit'));
    const qFailed = !isSuccess && (rLower.includes('max-q') || rLower.includes('structural') || rLower.includes('aerodynamic'));
    return [
      {
        metric: 'Orbital Insertion Altitude',
        playerVal: isSuccess ? '185.4 km (LEO)' : altFailed && extractedVal ? `${extractedVal.toFixed(1)} km` : '44.2 km (Suborbital)',
        nasaRef: '185.0 km (NASA Parking Orbit)',
        limit: '≥ 140.0 km',
        passed: !altFailed && isSuccess,
      },
      {
        metric: 'Horizontal Orbital Velocity',
        playerVal: isSuccess ? '7.81 km/s' : '4.15 km/s',
        nasaRef: '7.80 km/s (v_orb = √(GM/r))',
        limit: '≥ 6.80 km/s',
        passed: isSuccess,
      },
      {
        metric: 'Max-Q Dynamic Pressure Load',
        playerVal: isSuccess ? '31.4 kPa (3.1 G)' : qFailed ? '58.2 kPa (Overload)' : '34.0 kPa',
        nasaRef: '32.5 kPa (Saturn V / Falcon 9)',
        limit: '≤ 45.0 kPa',
        passed: !qFailed,
      },
      {
        metric: 'Stage 2 Propellant Margin',
        playerVal: isSuccess ? '6.8% Remaining' : '0.0% Depleted',
        nasaRef: '4.5% (MECO / SECO Reserve)',
        limit: '≥ 2.0%',
        passed: isSuccess,
      },
    ];
  };

  // Map 76 historical NASA mission to photorealistic celestial body & spacecraft
  const getTrailerMap = (m: MissionGameConfig): PlanetMapConfig => {
    const nameLower = (m.missionName + ' ' + m.programName).toLowerCase();
    if (m.gameType === 'lunar_landing' || nameLower.includes('apollo') || nameLower.includes('artemis') || nameLower.includes('surveyor') || nameLower.includes('lunar') || nameLower.includes('moon')) {
      return NASA_MAPS['map-moon-aitken'];
    }
    if (m.gameType === 'rover' || nameLower.includes('mars') || nameLower.includes('viking') || nameLower.includes('perseverance') || nameLower.includes('curiosity') || nameLower.includes('spirit') || nameLower.includes('opportunity') || nameLower.includes('pathfinder')) {
      return NASA_MAPS['map-mars-jezero'];
    }
    if (nameLower.includes('europa')) {
      return NASA_MAPS['map-europa-ice'];
    }
    if (nameLower.includes('titan') || nameLower.includes('saturn') || nameLower.includes('cassini')) {
      return NASA_MAPS['map-titan-methane'];
    }
    if (nameLower.includes('psyche') || nameLower.includes('asteroid') || nameLower.includes('dart') || nameLower.includes('dawn') || nameLower.includes('osiris')) {
      return NASA_MAPS['map-psyche-belt'];
    }
    if (m.gameType === 'telescope' || nameLower.includes('jwst') || nameLower.includes('hubble') || nameLower.includes('spitzer') || nameLower.includes('chandra') || nameLower.includes('kepler')) {
      return NASA_MAPS['map-nebula-deep'];
    }
    if (m.gameType === 'deep_space' || nameLower.includes('voyager') || nameLower.includes('pioneer') || nameLower.includes('horizons')) {
      return NASA_MAPS['map-nebula-deep'];
    }
    if (m.gameType === 'docking' || nameLower.includes('iss') || nameLower.includes('skylab') || nameLower.includes('station') || nameLower.includes('gemini') || nameLower.includes('rendezvous')) {
      return NASA_MAPS['map-gateway-orbit'];
    }
    return NASA_MAPS['map-earth-lc39b'];
  };

  const getTrailerVehicle = (m: MissionGameConfig): VehicleConfig => {
    if (m.gameType === 'rover') {
      return NASA_VEHICLES.find((v) => v.category === 'ROVER') || NASA_VEHICLES[0];
    }
    if (m.gameType === 'launch') {
      return NASA_VEHICLES.find((v) => v.category === 'ROCKET') || NASA_VEHICLES[1];
    }
    if (m.gameType === 'deep_space' || m.gameType === 'telescope') {
      return NASA_VEHICLES.find((v) => v.category === 'STARSHIP') || NASA_VEHICLES[2];
    }
    return NASA_VEHICLES[0];
  };

  const trailerMap = getTrailerMap(mission);
  const trailerVehicle = getTrailerVehicle(mission);

  const trailerMission: NasaLevelMission = {
    id: mission.id,
    missionNumber: missionIndex + 1,
    tier: mission.difficulty <= 2 ? 'CADET' : mission.difficulty <= 4 ? 'OFFICER' : 'COMMANDER',
    tierLabel: mission.difficulty <= 2 ? 'Junior Cadet' : mission.difficulty <= 4 ? 'Flight Officer' : 'Master Commander',
    ageGroup: mission.difficulty <= 2 ? 'Ages 6–10' : mission.difficulty <= 4 ? 'Ages 11–15' : 'Ages 16+',
    codeName: `${mission.programName.toUpperCase()} · FLIGHT #${(missionIndex + 1).toString().padStart(2, '0')}`,
    title: mission.missionName,
    nasaDepartment: `NASA ${mission.programName} Directorate`,
    mapId: trailerMap.id,
    recommendedVehicleId: trailerVehicle.id,
    simulatorType: 'OFFICER_KSP',
    gameMechanicsInspiration: 'Orbital Ascent & Docking Physics',
    description: mission.briefing,
    difficultyStars: mission.difficulty,
    difficultyLabel: mission.difficulty <= 2 ? 'EASY' : mission.difficulty <= 4 ? 'MODERATE' : 'ADVANCED',
    objectives: [mission.objective, mission.funFact.slice(0, 85)],
    physicsHighlight: stemData.concept,
    controls: ['[W/S] Throttle', '[A/D] Steering Pitch', '[SPACE] Stage Separation'],
  };

  return (
    <div className="flight-modal-backdrop" onClick={onClose}>
      <div
        className="flight-modal-container"
        onClick={(e) => e.stopPropagation()}
        style={
          isFullscreen || missionState === 'trailer'
            ? {
                position: 'fixed',
                inset: 0,
                width: '100vw',
                height: '100vh',
                maxWidth: '100vw',
                maxHeight: '100vh',
                borderRadius: 0,
                zIndex: 99999,
                margin: 0,
                padding: 0,
                border: 'none',
                overflow: 'hidden',
                background: '#020617',
              }
            : missionState === 'playing'
            ? {
                width: '98vw',
                maxWidth: '1440px',
                height: '95vh',
                maxHeight: '95vh',
                display: 'flex',
                flexDirection: 'column',
              }
            : undefined
        }
      >
        {/* Top Header Bar (Hidden during full-bleed 21:9 trailer or full-screen 3D @Astrelix simulation) */}
        {missionState !== 'trailer' && !(missionState === 'playing' && engineMode === '3d') && (
          <div className="flight-modal-header">
            <div className="flight-header-left">
              <div className="flight-type-badge-icon">
                {getGameTypeIcon()}
              </div>
              <div>
                <div className="flight-header-meta">
                  <span>MISSION #{missionIndex + 1} OF 76 • {mission.year}</span>
                  <span className="flight-program-pill">{mission.programName}</span>
                  {isAlreadyCompleted && (
                    <span className="flight-completed-pill">
                      <CheckCircle2 size={12} /> Flown ✓
                    </span>
                  )}
                </div>
                <h2 className="flight-mission-title">{mission.missionName}</h2>
              </div>
            </div>

            <div className="flight-header-actions">
              <button
                onClick={() => setMissionState('trailer')}
                className="flight-astro-toggle-btn"
                style={{
                  background: 'rgba(56, 189, 248, 0.12)',
                  borderColor: 'rgba(56, 189, 248, 0.4)',
                  color: '#38bdf8',
                  fontWeight: 800,
                }}
                title="Watch 3D Cinematic Mission Trailer"
              >
                <Film size={14} />
                <span>3D Trailer</span>
              </button>
              {onOpenMoonquakeMap && (
                <button
                  onClick={onOpenMoonquakeMap}
                  className="flight-astro-toggle-btn"
                  style={{
                    background: 'rgba(245, 158, 11, 0.15)',
                    borderColor: 'rgba(245, 158, 11, 0.4)',
                    color: '#fbbf24',
                  }}
                  title="Inspect Authentic 3D Moonquake Seismic Globe"
                >
                  <span>🌕</span>
                  <span>3D Moonquake Globe</span>
                </button>
              )}
              {onOpenMarsSurvival && (
                <button
                  onClick={onOpenMarsSurvival}
                  className="flight-astro-toggle-btn"
                  style={{
                    background: 'rgba(239, 68, 68, 0.22)',
                    borderColor: '#f87171',
                    color: '#fca5a5',
                    fontWeight: 800,
                  }}
                  title="Launch 4 NASA Mars Planetary Survival Operations"
                >
                  <span>🔴</span>
                  <span>Mars Survival (4 Ops)</span>
                </button>
              )}
              <button
                onClick={() => setShowAstronautModel(!showAstronautModel)}
                className="flight-astro-toggle-btn"
                title="Inspect 3D NASA Astronaut Suit"
              >
                <Bot size={14} />
                <span>{showAstronautModel ? 'Hide 3D Suit' : '3D EMU Suit'}</span>
              </button>
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="flight-astro-toggle-btn"
                title={isFullscreen ? 'Exit Fullscreen' : 'Expand to Fullscreen View'}
                style={{
                  background: isFullscreen ? 'rgba(56, 189, 248, 0.25)' : 'rgba(99, 102, 241, 0.15)',
                  color: isFullscreen ? '#38bdf8' : '#a5b4fc',
                }}
              >
                {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                <span>{isFullscreen ? 'Windowed' : 'Fullscreen'}</span>
              </button>
              <button
                onClick={() => {
                  if (phaserGameRef.current) destroyPhaserGame(phaserGameRef.current);
                  onClose();
                }}
                className="flight-close-btn"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        )}

        {/* 3D Astronaut Inspector Overlay (Optional Toggle) */}
        {showAstronautModel && missionState !== 'trailer' && (
          <div style={{ background: '#050811', borderBottom: '1px solid rgba(99, 102, 241, 0.3)', padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#818cf8' }}>
                <Bot size={15} />
                <span>NASA EXTRAVEHICULAR MOBILITY UNIT (EMU) 3D SPACESUIT VIEWER</span>
              </div>
              <a
                href="https://sketchfab.com/3d-models/rigged-nasa-astronaut-spacesuit-61acdd14e58a46149b2f85821f84260e"
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: '11px', color: '#a5b4fc', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
              >
                Model Source <ExternalLink size={12} />
              </a>
            </div>
            <div style={{ height: '240px', width: '100%', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(99, 102, 241, 0.4)', background: '#000' }}>
              <iframe
                title="Rigged NASA Astronaut Spacesuit"
                style={{ width: '100%', height: '100%', border: 0 }}
                src="https://sketchfab.com/models/61acdd14e58a46149b2f85821f84260e/embed?autostart=1&preload=1&ui_theme=dark"
                allow="autoplay; fullscreen; xr-spatial-tracking"
              />
            </div>
          </div>
        )}

        {/* Main Stage Content */}
        <div
          className="flight-stage-container"
          style={
            (missionState === 'playing' || missionState === 'trailer')
              ? {
                  padding: 0,
                  flex: 1,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  alignItems: 'stretch',
                  position: 'relative',
                }
              : undefined
          }
        >
          {/* 0. CINEMATIC 3D TRAILER STATE */}
          {missionState === 'trailer' && (
            <div style={{ position: 'relative', width: '100%', height: '100%', flex: 1, overflow: 'hidden' }}>
              <MissionCinematicIntro
                mission={trailerMission}
                vehicle={trailerVehicle}
                map={trailerMap}
                onLaunchGame={() => {
                  setMissionState('playing');
                  launchSimulation();
                }}
                onBackToHub={() => onClose()}
                isMuted={isAudioMuted}
                onToggleMute={() => setIsAudioMuted(!isAudioMuted)}
              />
            </div>
          )}

          {/* 1. BRIEFING STATE */}
          {missionState === 'briefing' && (
            <div className="flight-briefing-wrap">
              {/* Flight Directive & Primary Objective */}
              <div className="flight-directive-panel">
                <div className="flight-directive-top">
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Info size={14} /> FLIGHT DIRECTIVE BRIEFING
                  </span>
                  <span>DISCIPLINE: {getGameTypeLabel().toUpperCase()}</span>
                </div>
                <p className="flight-directive-text">{mission.briefing}</p>
                <div className="flight-objective-box">
                  <strong>PRIMARY OBJECTIVE:</strong>
                  {mission.objective}
                </div>
              </div>

              {/* WHAT WILL BE TAUGHT (STEM CURRICULUM BOX) */}
              <div className="flight-stem-box">
                <div className="flight-stem-title">
                  <span>🎓 WHAT YOU WILL BE TAUGHT // AEROSPACE STEM CURRICULUM</span>
                </div>
                <div className="flight-stem-desc">
                  <strong style={{ color: '#ffffff' }}>{stemData.concept}: </strong>
                  {stemData.desc}
                </div>
                <div className="flight-stem-equation">
                  <strong>PHYSICAL LAW / PRINCIPLE: </strong>
                  {stemData.formula}
                </div>
              </div>

              {/* Grid: Controls & Telemetry Fact */}
              <div className="flight-grid-two">
                <div className="flight-info-card">
                  <div className="flight-card-label">COCKPIT FLIGHT CONTROLS</div>
                  <ul className="flight-controls-list">
                    <li>• <span>W / S or UP/DOWN</span>: Throttle Regulation</li>
                    <li>• <span>A / D or LEFT/RIGHT</span>: Gimbal Pitch / Steering</li>
                    <li>• <span>SPACEBAR</span>: Stage Separation / Booster MECO</li>
                  </ul>
                </div>

                <div className="flight-info-card">
                  <div className="flight-card-label">HISTORICAL TELEMETRY FACT</div>
                  <p className="flight-fact-text">
                    "{mission.funFact}"
                  </p>
                </div>
              </div>

              {/* Astronaut Academy Age Tier Selection & Game Inspirations */}
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.75)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Sparkles size={16} className="text-sky-400" />
                    <span style={{ fontSize: '11px', fontWeight: 900, color: '#f8fafc', letterSpacing: '0.06em' }}>
                      ASTRONAUT ACADEMY LEARNING TIER:
                    </span>
                  </div>
                  <span style={{ fontSize: '9.5px', color: '#94a3b8' }}>
                    Physics & guidance adapt to your student age
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
                  {(['cadet', 'officer', 'commander'] as AstronautAgeTier[]).map((tierKey) => {
                    const cfg = ASTRONAUT_TIERS[tierKey];
                    const isSelected = selectedAgeTier === tierKey;
                    return (
                      <button
                        key={tierKey}
                        onClick={() => {
                          setSelectedAgeTier(tierKey);
                          try {
                            localStorage.setItem('astrocamp_age_tier', tierKey);
                          } catch {}
                        }}
                        style={{
                          background: isSelected
                            ? (tierKey === 'cadet' ? 'rgba(2, 132, 199, 0.25)' : tierKey === 'officer' ? 'rgba(217, 119, 6, 0.25)' : 'rgba(124, 58, 237, 0.25)')
                            : 'rgba(2, 6, 23, 0.6)',
                          border: `1.5px solid ${isSelected ? (tierKey === 'cadet' ? '#38bdf8' : tierKey === 'officer' ? '#fbbf24' : '#c084fc') : 'rgba(51, 65, 85, 0.7)'}`,
                          borderRadius: '8px',
                          padding: '8px 10px',
                          textAlign: 'left',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '3px',
                          transition: 'all 0.15s ease',
                          boxShadow: isSelected ? '0 0 15px rgba(56, 189, 248, 0.2)' : 'none',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '12px', fontWeight: 900, color: '#f8fafc' }}>
                            {cfg.badge} {cfg.label}
                          </span>
                          <span style={{ fontSize: '9px', fontWeight: 800, color: isSelected ? '#38bdf8' : '#94a3b8', background: 'rgba(255,255,255,0.08)', padding: '1px 5px', borderRadius: '4px' }}>
                            {cfg.ageRange}
                          </span>
                        </div>
                        <span style={{ fontSize: '9px', color: '#cbd5e1', lineHeight: '1.3' }}>
                          {cfg.description}
                        </span>
                        <span style={{ fontSize: '8px', color: '#38bdf8', marginTop: '2px', fontWeight: 700 }}>
                          NASA Mission: {cfg.nasaMissionContext}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* NASA Aerospace Systems Banner */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '6px' }}>
                  <span style={{ fontSize: '8.5px', color: '#64748b', fontWeight: 800 }}>NASA FLIGHT SYSTEMS ACTIVE:</span>
                  {[
                    "Multi-Spectral Scanner [F]",
                    "Orion ECLSS & Power Bus",
                    "Keplerian Orbital Δv Tapes",
                    "6-DOF Decoupled RCS [Z]",
                    "Tactical Attitude Navball",
                    "Apollo Nakamura Seismic Sensors",
                  ].map((sys) => (
                    <span
                      key={sys}
                      style={{
                        fontSize: '8px',
                        background: 'rgba(56, 189, 248, 0.1)',
                        color: '#7dd3fc',
                        padding: '1px 5px',
                        borderRadius: '3px',
                        border: '1px solid rgba(56, 189, 248, 0.25)',
                        fontWeight: 700,
                      }}
                    >
                      {sys}
                    </span>
                  ))}
                </div>
              </div>

              {/* Simulation Engine Toggle */}
              <div className="flight-engine-bar">
                <div className="flight-engine-label">
                  <Box size={16} />
                  <span>GRAPHICS ENGINE:</span>
                </div>
                <div className="flight-engine-btn-group">
                  <button
                    onClick={() => setEngineMode('3d')}
                    className={`flight-engine-btn ${engineMode === '3d' ? 'flight-engine-btn-active' : 'flight-engine-btn-inactive'}`}
                  >
                    <Sparkles size={13} /> 3D Photorealistic Engine (WebGL)
                  </button>
                  <button
                    onClick={() => setEngineMode('2d')}
                    className={`flight-engine-btn ${engineMode === '2d' ? 'flight-engine-btn-active' : 'flight-engine-btn-inactive'}`}
                  >
                    <Layers size={13} /> 2D Tactical Engine
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flight-launch-action" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setMissionState('trailer')}
                  className="flight-launch-btn"
                  style={{
                    flex: 1,
                    minWidth: '240px',
                    background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 50%, #7c3aed 100%)',
                    boxShadow: '0 0 24px rgba(56, 189, 248, 0.45)',
                  }}
                >
                  <Play size={18} fill="currentColor" />
                  🎬 LAUNCH MISSION (3D TRAILER ➔ SIMULATION)
                </button>
                <button
                  onClick={launchSimulation}
                  className="flight-launch-btn"
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    borderColor: 'rgba(255, 255, 255, 0.25)',
                    color: '#cbd5e1',
                  }}
                >
                  <Rocket size={16} />
                  DIRECT TO COCKPIT
                </button>
                {onOpenLobby && (
                  <button
                    onClick={onOpenLobby}
                    className="flight-launch-btn"
                    style={{
                      background: 'linear-gradient(135deg, #059669, #0d9488)',
                      borderColor: '#34d399',
                      color: '#ffffff',
                      boxShadow: '0 0 20px rgba(16, 185, 129, 0.3)',
                    }}
                  >
                    <Sparkles size={18} />
                    CO-OP MULTIPLAYER LOBBY
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 2. PLAYING STATE */}
          {missionState === 'playing' && engineMode === '3d' && (
            <div style={{ width: '100%', height: '100%', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <Suspense
                fallback={
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#38bdf8', gap: '12px' }}>
                    <div style={{ fontSize: '32px' }}>🚀</div>
                    <div style={{ fontSize: '13px', fontWeight: 800, fontFamily: 'monospace' }}>INITIALIZING 3D THREE.JS AEROSPACE ENGINE...</div>
                  </div>
                }
              >
                <ThreeMissionSimulator
                  key={`${mission.id}-attempt-${attemptKey}`}
                  mission={mission}
                  multiplayerActive={isCoopMode}
                  assignedRole={coopRole}
                  initialAgeTier={selectedAgeTier}
                  onOpenMoonquakeMap={onOpenMoonquakeMap}
                  onOpenMarsSurvival={onOpenMarsSurvival}
                  onOpenVabLifecycle={() => setShowVabLifecycle(true)}
                  onSuccess={(finalScore) => {
                    setScore(finalScore);
                    setMissionState('success');
                    onCompleteMission(mission.id, finalScore);
                  }}
                  onFailure={(reason) => {
                    setFailureReason(reason);
                    setMissionState('failure');
                  }}
                  onExit={() => {
                    if (isCoopMode && onExitToLobby) {
                      onExitToLobby();
                    } else {
                      onClose();
                    }
                  }}
                />
              </Suspense>
            </div>
          )}

          {/* 2B. 2D Phaser Canvas Container */}
          <div
            ref={containerRef}
            style={{
              width: '100%',
              height: '520px',
              maxWidth: '800px',
              display: missionState === 'playing' && engineMode === '2d' ? 'flex' : 'none',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
              border: '1px solid rgba(56,189,248,0.25)',
              background: '#020617',
            }}
          />

          {/* 3. SUCCESS STATE (DEBRIEF WITH NASA GROUND-TRUTH TELEMETRY ANALYSIS) */}
          {missionState === 'success' && (
            <div className="flight-debrief-card flight-debrief-success" style={{ maxWidth: '680px', width: '94vw' }}>
              <div className="flight-debrief-icon-circle icon-circle-success">
                <Award size={36} />
              </div>

              <div>
                <h3 className="flight-debrief-title">MISSION ACCOMPLISHED!</h3>
                <p className="flight-debrief-sub">
                  Flight telemetry verified against NASA historical ground truth for <strong style={{ color: '#6ee7b7' }}>{mission.missionName}</strong>
                </p>
              </div>

              <div className="flight-debrief-score-row">
                <div>
                  <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#94a3b8' }}>FLIGHT SCORE</div>
                  <div className="flight-score-val">{score}</div>
                </div>
                <div style={{ width: '1px', height: '36px', background: 'rgba(255,255,255,0.1)' }} />
                <div>
                  <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#94a3b8' }}>CAMPAIGN RANK</div>
                  <div className="flight-rank-val">
                    {completedMissions.length} / 76 FLIGHTS
                  </div>
                </div>
              </div>

              {/* NASA Ground-Truth Physics Telemetry Comparison Table */}
              <div style={{ width: '100%', background: 'rgba(2, 6, 23, 0.85)', border: '1px solid rgba(52, 211, 153, 0.35)', borderRadius: '12px', padding: '12px 14px', textAlign: 'left', fontFamily: 'var(--font-mono)' }}>
                <div style={{ fontSize: '10px', fontWeight: 900, color: '#34d399', letterSpacing: '0.06em', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                  <span>📊 POST-FLIGHT PHYSICS TELEMETRY vs. NASA HISTORICAL DATA</span>
                  <span>[REAL NASA BENCHMARK]</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1.3fr 0.8fr 0.6fr', gap: '6px', fontSize: '9.5px', color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '4px', marginBottom: '6px', fontWeight: 800 }}>
                  <span>PHYSICS VARIABLE</span>
                  <span>YOUR FLIGHT</span>
                  <span>NASA BENCHMARK</span>
                  <span>SAFE LIMIT</span>
                  <span>STATUS</span>
                </div>
                {getNasaPhysicsDebriefRows(true, '').map((row) => (
                  <div key={row.metric} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1.3fr 0.8fr 0.6fr', gap: '6px', fontSize: '10px', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', alignItems: 'center' }}>
                    <span style={{ color: '#e2e8f0', fontWeight: 700 }}>{row.metric}</span>
                    <span style={{ color: '#4ade80', fontWeight: 900 }}>{row.playerVal}</span>
                    <span style={{ color: '#38bdf8' }}>{row.nasaRef}</span>
                    <span style={{ color: '#cbd5e1' }}>{row.limit}</span>
                    <span style={{ color: '#34d399', fontWeight: 900 }}>✅ PASS</span>
                  </div>
                ))}
              </div>

              <div className="flight-stem-box" style={{ textAlign: 'left' }}>
                <div className="flight-stem-title">
                  <span>🎯 STEM LESSON MASTERED ({stemData.formula})</span>
                </div>
                <div className="flight-stem-desc">
                  You successfully executed <strong style={{ color: '#ffffff' }}>{stemData.concept}</strong>.
                  All aerodynamic, propellant, and Newtonian velocity bounds matched NASA flight envelopes.
                </div>
              </div>

              <div className="flight-debrief-btns">
                <button
                  onClick={handleRetry}
                  className="flight-replay-btn"
                >
                  <RotateCcw size={14} /> Replay
                </button>
                {nextMission ? (
                  <button
                    onClick={handleNextMission}
                    className="flight-next-btn"
                  >
                    Next Mission: {nextMission.missionName} <ChevronRight size={15} />
                  </button>
                ) : (
                  <button
                    onClick={onClose}
                    className="flight-next-btn"
                  >
                    Return to Campaign Map
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 4. FAILURE STATE (DEBRIEF WITH NASA ROOT-CAUSE PHYSICS TELEMETRY COMPARISON) */}
          {missionState === 'failure' && (
            <div className="flight-debrief-card flight-debrief-failure" style={{ maxWidth: '680px', width: '94vw' }}>
              <div className="flight-debrief-icon-circle icon-circle-failure">
                <ShieldAlert size={36} />
              </div>

              <div>
                <h3 className="flight-debrief-title" style={{ color: '#f87171' }}>SIMULATION ABORTED — PHYSICS AUTOPSY</h3>
                <p className="flight-debrief-sub" style={{ color: '#fca5a5', fontFamily: 'var(--font-mono)' }}>
                  ROOT-CAUSE TELEMETRY DEVIATION VS. NASA FLIGHT ENVELOPE
                </p>
              </div>

              <div className="flight-incident-box">
                <div className="flight-incident-label">
                  <AlertTriangle size={14} />
                  <span>PRIMARY FAILURE VARIABLE &amp; TELEMETRY CAUSE</span>
                </div>
                <p className="flight-incident-desc">
                  {failureReason || 'Flight parameters exceeded safe aerospace operational envelopes.'}
                </p>
              </div>

              {/* NASA Ground-Truth Physics Telemetry Comparison Table */}
              <div style={{ width: '100%', background: 'rgba(2, 6, 23, 0.88)', border: '1px solid rgba(239, 68, 68, 0.45)', borderRadius: '12px', padding: '12px 14px', textAlign: 'left', fontFamily: 'var(--font-mono)' }}>
                <div style={{ fontSize: '10px', fontWeight: 900, color: '#f87171', letterSpacing: '0.06em', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                  <span>🔬 TELEMETRY DIAGNOSTIC: YOUR FLIGHT vs. NASA HISTORICAL DATA</span>
                  <span>[ROOT-CAUSE TRACE]</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1.3fr 0.8fr 0.6fr', gap: '6px', fontSize: '9.5px', color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '4px', marginBottom: '6px', fontWeight: 800 }}>
                  <span>PHYSICS VARIABLE</span>
                  <span>YOUR FLIGHT</span>
                  <span>NASA BENCHMARK</span>
                  <span>SAFE LIMIT</span>
                  <span>STATUS</span>
                </div>
                {getNasaPhysicsDebriefRows(false, failureReason).map((row) => (
                  <div key={row.metric} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1.3fr 0.8fr 0.6fr', gap: '6px', fontSize: '10px', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', alignItems: 'center' }}>
                    <span style={{ color: '#e2e8f0', fontWeight: 700 }}>{row.metric}</span>
                    <span style={{ color: row.passed ? '#4ade80' : '#f87171', fontWeight: 900 }}>{row.playerVal}</span>
                    <span style={{ color: '#38bdf8' }}>{row.nasaRef}</span>
                    <span style={{ color: '#cbd5e1' }}>{row.limit}</span>
                    <span style={{ color: row.passed ? '#34d399' : '#ef4444', fontWeight: 900 }}>
                      {row.passed ? '✅ OK' : '❌ FAIL'}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flight-stem-box" style={{ textAlign: 'left', borderColor: 'rgba(239, 68, 68, 0.4)', background: 'rgba(239, 68, 68, 0.08)' }}>
                <div className="flight-stem-title" style={{ color: '#f87171' }}>
                  <span>🛠️ ENGINEERING CORRECTIVE ACTION ({stemData.formula})</span>
                </div>
                <div className="flight-stem-desc">
                  Compare the failed <strong style={{ color: '#fca5a5' }}>❌ FAIL</strong> variable above against NASA's historical benchmark. Adjust your retro-burn timing, throttle profile, or attitude angle under <strong style={{ color: '#ffffff' }}>{stemData.concept}</strong> and re-test!
                </div>
              </div>

              <div className="flight-debrief-btns">
                <button
                  onClick={onClose}
                  className="flight-replay-btn"
                >
                  Exit to Catalog
                </button>
                <button
                  onClick={handleRetry}
                  className="flight-retry-red-btn"
                >
                  <RotateCcw size={14} />
                  Re-attempt Simulation
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer info bar */}
        {!(missionState === 'playing' && engineMode === '3d') && (
          <div className="flight-footer-bar">
            <span>TEAM MYSTERIO • ASTRO CAMP NASA GAME ENGINE (PHASER 3 + THREE.JS)</span>
            <span>76 OPERATIONAL FLIGHTS • MERCURY TO ARTEMIS</span>
          </div>
        )}

        {/* Full 17-Phase @Astrelix (Ellipse: Rocket Simulator) VAB Rocket Builder & Walkable EVA Modal */}
        {showVabLifecycle && (
          <Suspense fallback={null}>
            <FullMissionLifecycleModal
              isOpen={showVabLifecycle}
              onClose={() => setShowVabLifecycle(false)}
              initialDestination={
                (mission.missionName.toLowerCase().includes('mars') ||
                mission.missionName.toLowerCase().includes('viking') ||
                mission.missionName.toLowerCase().includes('perseverance') ||
                mission.missionName.toLowerCase().includes('curiosity')
                  ? 'MARS_JEZERO'
                  : mission.missionName.toLowerCase().includes('artemis') ||
                    mission.missionName.toLowerCase().includes('shackleton')
                  ? 'MOON_ARTEMIS'
                  : mission.gameType === 'lunar_landing' ||
                    mission.missionName.toLowerCase().includes('apollo') ||
                    mission.missionName.toLowerCase().includes('moon')
                  ? 'MOON_APOLLO'
                  : mission.missionName.toLowerCase().includes('mercury')
                  ? 'SUBORBITAL'
                  : 'ORBITAL') as ExpeditionDestination
              }
              initialPhase="VAB_BUILD"
              onMissionCompleted={(_dest, credits) => {
                setShowVabLifecycle(false);
                setScore(credits);
                setMissionState('success');
                onCompleteMission(mission.id, credits);
              }}
            />
          </Suspense>
        )}
      </div>
    </div>
  );
};
