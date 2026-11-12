import React, { useState, useEffect } from 'react';
import type { GameState, ChoiceOption, DifficultyMode } from '../types/game';
import type { NasaMission } from '../data/nasaMissions';
import { OutpostMap } from '../components/OutpostMap';
import { Outpost3DView } from '../components/Outpost3DView';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { MissionAutopsy } from '../components/MissionAutopsy';
import type { AppRoute } from '../router/useAppRouter';
import { soundFx } from '../utils/audioEffects';
import { BUILDABLE_MODULES, type BuildableModuleSpec } from '../data/outpostBalanceConfig';
import { DestinationSelectionModal } from '../components/DestinationSelectionModal';
import {
  Rocket,
  Activity,
  AlertTriangle,
  Sparkles,
  ChevronRight,
  TrendingUp,
  ShieldAlert,
  HelpCircle,
  Hammer,
  Zap,
  CheckCircle2,
  X,
  Sun,
  Shield,
  Volume2,
  VolumeX,
  Pause,
  Play,
  ArrowLeft,
  Wind,
  Droplets,
  Apple,
  Heart,
  CloudLightning,
  Compass,
} from 'lucide-react';

export interface MissionControlPageProps {
  gameState: GameState;
  currentMission: NasaMission;
  lastConsequence: {
    narrative: string;
    insight: string;
    choiceTitle: string;
    choiceOption?: ChoiceOption;
  } | null;
  is3DView: boolean;
  onToggle3DView: (val: boolean) => void;
  isTheaterMode: boolean;
  onToggleTheaterMode: (val: boolean) => void;
  isShieldActive: boolean;
  isShaking: boolean;
  onSelectChoice: (choice: ChoiceOption) => void;
  onSelectDifficulty: (mode: DifficultyMode) => void;
  onRestart: () => void;
  onNavigate: (route: AppRoute, params?: Record<string, string>) => void;
  onOpenRoverEVA: () => void;
  onOpenPlanetaryMap: () => void;
  onOpenOutpostConstruction?: () => void;
  onSwitchDestination?: (dest: 'MOON' | 'MARS') => void;
  onOpenAutopsyHelp?: () => void;
  onBuildModule?: (moduleSpec: BuildableModuleSpec) => void;
  onAdvanceSol?: () => void;
}

export const MissionControlPage: React.FC<MissionControlPageProps> = ({
  gameState,
  currentMission,
  lastConsequence,
  is3DView,
  onToggle3DView,
  isTheaterMode,
  onToggleTheaterMode,
  isShieldActive,
  isShaking,
  onSelectChoice,
  onSelectDifficulty,
  onRestart,
  onNavigate,
  onOpenRoverEVA,
  onOpenPlanetaryMap,
  onOpenOutpostConstruction,
  onSwitchDestination,
  onOpenAutopsyHelp,
  onBuildModule,
  onAdvanceSol,
}) => {
  const isMars = gameState.destination === 'MARS';
  const outpostName = isMars ? 'AstroCamp Mars Outpost' : 'Artemis Base Camp';
  const outpostLocation = isMars
    ? 'Jezero Crater Delta (18.38°N, 77.58°E)'
    : 'Shackleton Crater Rim (89.9°S, 0.0°E)';
  const dayTerm = isMars ? 'Sol' : 'Day';
  const maxDays = isMars ? 40 : 30;
  const isLunarNight = !isMars && gameState.currentSol >= 16 && gameState.currentSol <= 27;

  // In-Game HUD States
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [isAAROpen, setIsAAROpen] = useState(false);
  const [buildNotice, setBuildNotice] = useState<string | null>(null);
  const [hoveredResource, setHoveredResource] = useState<string | null>(null);
  const [hoveredModule, setHoveredModule] = useState<string | null>(null);

  // Requirement 6: Skippable First 3 Days Tutorial
  const [isTutorialSkipped, setIsTutorialSkipped] = useState(false);

  // Requirement 7: How to Prepare Hint Popover
  const [isPrepareHintOpen, setIsPrepareHintOpen] = useState(false);

  // Requirement 1: Player has made choice for today
  const [hasChosenChoiceToday, setHasChosenChoiceToday] = useState(false);

  useEffect(() => {
    setHasChosenChoiceToday(false);
    setIsPrepareHintOpen(false);
  }, [gameState.currentSol]);

  const hasNothingLeftToDo =
    !gameState.activeEvent?.options?.length || hasChosenChoiceToday;

  // 4 Power Share Sliders State
  const [powerAllocations, setPowerAllocations] = useState({
    lifeSupport: 40,
    greenhouse: 25,
    waterRecycler: 20,
    radiationShield: 15,
  });

  const totalPowerPercent =
    powerAllocations.lifeSupport +
    powerAllocations.greenhouse +
    powerAllocations.waterRecycler +
    powerAllocations.radiationShield;

  const handleSliderChange = (key: keyof typeof powerAllocations, val: number) => {
    setPowerAllocations((prev) => ({
      ...prev,
      [key]: val,
    }));
  };

  // Subsystems starved when over power budget
  const starvedSubsystems: string[] = [];
  if (totalPowerPercent > 100) {
    if (powerAllocations.greenhouse < 20) starvedSubsystems.push('Greenhouse Crops');
    if (powerAllocations.radiationShield < 20) starvedSubsystems.push('Radiation Shield');
    if (powerAllocations.waterRecycler < 20) starvedSubsystems.push('Water Recycler');
    if (powerAllocations.lifeSupport < 25) starvedSubsystems.push('Life Support / Air');
    if (starvedSubsystems.length === 0) starvedSubsystems.push('Battery Reserve Charging');
  }

  const isCadet =
    (gameState.difficultyMode as any) === 'CADET' || gameState.difficultyMode === 'EXPLORER';
  const isCommander =
    gameState.difficultyMode === 'COMMANDER' || (gameState.difficultyMode as any) === 'SCIENTIST';
  const availableBP =
    gameState.buildPoints ?? (isCadet ? 12 : 8);
  const dailyBP =
    isCadet ? 6 : isCommander ? 3 : 4;

  const handleBuild = (spec: BuildableModuleSpec) => {
    if (availableBP < spec.buildCostBP) {
      soundFx.playAlarm();
      setBuildNotice(`Not enough Build Points! Need ${spec.buildCostBP - availableBP} more points.`);
      setTimeout(() => setBuildNotice(null), 3000);
      return;
    }

    if (onBuildModule) {
      onBuildModule(spec);
    }
    soundFx.playVictory();
    setBuildNotice(`Constructed ${spec.name}! ${spec.simpleEffect}`);
    setTimeout(() => setBuildNotice(null), 3500);
  };

  const handleEndDay = () => {
    if (isPaused) {
      soundFx.playClick(600);
      return;
    }
    soundFx.playClick(850);
    if (onAdvanceSol) {
      onAdvanceSol();
    } else if (
      gameState.activeEvent?.options &&
      gameState.activeEvent.options.length > 0
    ) {
      onSelectChoice(gameState.activeEvent.options[0]);
    }
  };

  // Requirement 4: Kid-friendly names with technical term in tooltip
  const getModuleKidDisplay = (mod: BuildableModuleSpec) => {
    switch (mod.id) {
      case 'SOLAR_ARRAY':
        return { kidName: 'Solar Panels', techTerm: 'Photovoltaic (PV) Wing', icon: '☀️' };
      case 'BATTERY_STORAGE':
        return { kidName: 'Battery', techTerm: 'Lithium-Ion Energy Storage', icon: '🔋' };
      case 'KILOPOWER_REACTOR':
        return { kidName: 'Mini Nuclear Power', techTerm: 'Kilopower Stirling Fission Reactor', icon: '⚛️' };
      case 'O2_SABATIER':
        return { kidName: 'Air Maker', techTerm: 'Sabatier O2 Generator & Scrubber', icon: '💨' };
      case 'WATER_RECYCLER':
        return { kidName: 'Water Cleaner', techTerm: 'Thermo-Electric Water Recovery System', icon: '💧' };
      case 'GREENHOUSE_POD':
        return { kidName: 'Greenhouse', techTerm: 'Bioregenerative Hydroponic Salad Machine', icon: '🌱' };
      case 'REGOLITH_VAULT':
        return { kidName: 'Radiation Wall', techTerm: 'Sintered Regolith Shield Berm', icon: '🛡️' };
      case 'REC_HABITAT':
        return { kidName: 'Crew Gym & Lounge', techTerm: 'Countermeasure Exercise & Behavioral Hab', icon: '🎮' };
      case 'HABITAT_EXPANSION':
        return { kidName: 'Habitat Dome', techTerm: 'Pressurized Multi-Chamber Inflatable Hab', icon: '🏠' };
      default:
        return { kidName: mod.name, techTerm: mod.name, icon: mod.icon || '🏗️' };
    }
  };

  // Custom crew names from wizard Step 3
  const savedCrewNames: Record<string, string> = (() => {
    try {
      const raw = localStorage.getItem('astro_crew_names');
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  })();

  const res = gameState.resources;

  // Requirement 3: Color by value (>=60% green, 30-59% yellow, <30% red, pulsing warning below 30%)
  const getResourceColor = (val: number) => {
    if (val >= 60) return '#22c55e'; // Green
    if (val >= 30) return '#eab308'; // Yellow
    return '#ef4444'; // Red
  };

  const getFoodColor = (meals: number) => {
    const pct = Math.round((meals / 30) * 100);
    return getResourceColor(pct);
  };

  // 7 Resources Specification with trend arrows and hover reasons
  const RESOURCES_LIST = [
    {
      id: 'power',
      label: 'POWER',
      friendlyName: 'Power & Energy',
      value: res.power,
      unit: '%',
      icon: <Zap size={14} />,
      color: getResourceColor(res.power),
      isCritical: res.power < 30,
      trend: totalPowerPercent > 65 ? '↓' : res.power >= 70 ? '↑' : '→',
      hoverReason:
        powerAllocations.greenhouse >= 25
          ? `Power is falling because Greenhouse uses 25% and Life Support uses 40%`
          : `Power is stable from active solar array generation`,
      tooltip:
        'Power & Energy: Generated by solar arrays or nuclear Kilopower. Low power causes life support blackouts!',
      nasaTerm: 'Kilowatt Electrical Bus (BVAD)',
    },
    {
      id: 'oxygen',
      label: 'AIR / O2',
      friendlyName: 'Breathable Air',
      value: res.oxygen,
      unit: '%',
      icon: <Wind size={14} />,
      color: getResourceColor(res.oxygen),
      isCritical: res.oxygen < 30,
      trend: powerAllocations.lifeSupport >= 25 ? '↑' : '↓',
      hoverReason:
        powerAllocations.lifeSupport >= 25
          ? 'Air is stable at 95% because Sabatier scrubber has sufficient power'
          : 'Air is falling because Life Support power allocation is under 25%',
      tooltip:
        'Breathable Air: Produced by Sabatier electrolysis and scrubbed of toxic CO2. Falls fast if power drops!',
      nasaTerm: 'O2 Partial Pressure & Sabatier ECLSS',
    },
    {
      id: 'water',
      label: 'WATER',
      friendlyName: 'Clean Water',
      value: res.water,
      unit: '%',
      icon: <Droplets size={14} />,
      color: getResourceColor(res.water),
      isCritical: res.water < 30,
      trend: powerAllocations.waterRecycler >= 20 ? '↑' : '↓',
      hoverReason:
        powerAllocations.waterRecycler >= 20
          ? 'Water is stable because recovery loop cleans 98% of crew moisture'
          : 'Water is falling because water recycler allocation is reduced',
      tooltip:
        'Clean Water: 98% recycled closed-loop from moisture and sweat. Essential for drinking and greenhouse crops!',
      nasaTerm: 'Water Recovery System (WRS)',
    },
    {
      id: 'food',
      label: 'FOOD',
      friendlyName: 'Crops & Rations',
      value: res.food,
      unit: ' Meals',
      icon: <Apple size={14} />,
      color: getFoodColor(res.food),
      isCritical: res.food < 9,
      trend: powerAllocations.greenhouse >= 25 ? '↑' : '↓',
      hoverReason:
        powerAllocations.greenhouse >= 25
          ? 'Food is steady: Space Greenhouse produces +2 fresh meals every sol'
          : 'Food is falling because 4 astronauts consume 4 meals each sol',
      tooltip:
        'Crops & Rations: Fresh hydroponic greens and shelf-stable meals. Hunger weakens astronaut stamina and morale!',
      nasaTerm: 'Hydroponic Salad Machine & Calorie Pool',
    },
    {
      id: 'shielding',
      label: 'SHIELD',
      friendlyName: 'Radiation Shield',
      value: res.shielding ?? 75,
      unit: '%',
      icon: <ShieldAlert size={14} />,
      color: getResourceColor(res.shielding ?? 75),
      isCritical: (res.shielding ?? 75) < 30,
      trend: powerAllocations.radiationShield >= 20 ? '↑' : '↓',
      hoverReason:
        powerAllocations.radiationShield >= 20
          ? 'Shield is strong: Sintered regolith berm blocks 85% of cosmic rays'
          : 'Shield is weakened: High solar cosmic ray radiation exposure',
      tooltip:
        'Melted Regolith Dust Shield: Heavy space dirt wall protects astronauts from solar flares and cosmic rays!',
      nasaTerm: 'Sintered Regolith Radiation Vault',
    },
    {
      id: 'health',
      label: 'HEALTH',
      friendlyName: 'Crew Health',
      value: res.crewHealth,
      unit: '%',
      icon: <Activity size={14} />,
      color: getResourceColor(res.crewHealth),
      isCritical: res.crewHealth < 30,
      trend: res.crewHealth >= 80 ? '↑' : '↓',
      hoverReason:
        res.crewHealth >= 70
          ? 'Crew vitals are normal: 4 astronauts receive full air, water, and food'
          : 'Crew health is dropping: Shortages in life support or space radiation',
      tooltip:
        'Astronaut Vitals: Vital signs of your 4-astronaut crew. Drops if air, water, or food run out!',
      nasaTerm: 'Physiological Homeostasis Monitoring',
    },
    {
      id: 'morale',
      label: 'MORALE',
      friendlyName: 'Crew Morale',
      value: res.crewMorale ?? 85,
      unit: '%',
      icon: <Sparkles size={14} />,
      color: getResourceColor(res.crewMorale ?? 85),
      isCritical: (res.crewMorale ?? 85) < 30,
      trend: (res.crewMorale ?? 85) >= 70 ? '↑' : '↓',
      hoverReason:
        (res.crewMorale ?? 85) >= 70
          ? 'Morale is high: Boosted by Commander leadership (+15%) and salad crops'
          : 'Morale is falling from harsh space hazards and exhaustion',
      tooltip:
        'Team Spirit & Morale: High morale speeds up repairs and science. Exhaustion causes critical mistakes!',
      nasaTerm: 'Behavioral Health & Performance (BHP)',
    },
  ];

  const isOutpostCritical =
    res.power < 30 || res.oxygen < 30 || res.crewHealth < 40 || !!gameState.activeWarning;

  // Requirement 2: Render Outpost Viewport with Tab Switcher
  const renderOutpostViewport = () => (
    <div
      style={{
        background: '#070d1e',
        border: isOutpostCritical ? '2px solid #ef4444' : '1px solid #1e3a8a',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: isOutpostCritical
          ? '0 0 25px rgba(239, 68, 68, 0.45)'
          : '0 8px 30px rgba(0, 0, 0, 0.6)',
        transition: 'all 0.3s ease',
      }}
    >
      {/* Viewport Header with Tabs: Default Outpost Overview vs Optional Explore */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '10px 16px',
          background: 'rgba(15, 23, 42, 0.92)',
          borderBottom: '1px solid #1e293b',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Rocket size={15} className={isMars ? 'text-orange-400' : 'text-cyan-400'} />
          <span style={{ fontWeight: 800, fontSize: '13px', color: '#f8fafc' }}>
            {outpostName}
          </span>
          <span style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace' }}>
            ({outpostLocation})
          </span>
        </div>

        {/* View Selection Tabs */}
        <div style={{ display: 'flex', gap: '6px', background: '#09122a', padding: '3px', borderRadius: '8px' }}>
          <button
            id="btn-tab-outpost-overview"
            onClick={() => {
              onToggle3DView(false);
              soundFx.playClick(700);
            }}
            style={{
              background: !is3DView ? '#0284c7' : 'transparent',
              border: 'none',
              color: !is3DView ? '#fff' : '#94a3b8',
              padding: '5px 12px',
              borderRadius: '6px',
              fontSize: '11.5px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              transition: 'all 0.15s ease',
            }}
          >
            <span>🏠 Outpost Overview</span>
          </button>

          <button
            id="btn-tab-explore-eva"
            onClick={() => {
              onToggle3DView(true);
              soundFx.playClick(800);
            }}
            style={{
              background: is3DView ? '#0284c7' : 'transparent',
              border: 'none',
              color: is3DView ? '#fff' : '#94a3b8',
              padding: '5px 12px',
              borderRadius: '6px',
              fontSize: '11.5px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              transition: 'all 0.15s ease',
            }}
          >
            <span>🧑‍🚀 Explore (EVA)</span>
          </button>
        </div>
      </div>

      <div style={{ position: 'relative', minHeight: '340px' }}>
        {is3DView ? (
          <ErrorBoundary fallbackTitle="3D Outpost Viewport" onFallback2D={() => onToggle3DView(false)}>
            <Outpost3DView
              currentSol={gameState.currentSol}
              modules={gameState.modules}
              resources={gameState.resources}
              activeEventId={gameState.activeEvent?.id}
              isShieldActive={isShieldActive}
              mission={currentMission}
              taskChoices={gameState.activeEvent?.options}
              onSelectChoice={(choice) => {
                onSelectChoice(choice);
                setHasChosenChoiceToday(true);
              }}
              activeEventTitle={gameState.activeEvent?.title}
            />
          </ErrorBoundary>
        ) : (
          <OutpostMap
            currentSol={gameState.currentSol}
            modules={gameState.modules}
            resources={gameState.resources}
            destination={gameState.destination}
            builtModules={gameState.builtModules}
            equipmentCondition={gameState.equipmentCondition}
          />
        )}

        {/* Critical Habitat Warning */}
        {isOutpostCritical && (
          <div
            style={{
              position: 'absolute',
              top: '12px',
              left: '12px',
              background: 'rgba(239, 68, 68, 0.92)',
              color: '#fff',
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              animation: 'pulseWarning 1.5s infinite',
              zIndex: 10,
            }}
          >
            <AlertTriangle size={14} />
            <span>CRITICAL HABITAT WARNING</span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div
      className={`page-mission-control ${isShaking ? 'screen-shake' : ''}`}
      style={{
        minHeight: '100vh',
        background: '#040711',
        color: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "'Fredoka', 'Baloo 2', system-ui, sans-serif",
      }}
    >
      <style>{`
        @keyframes gentlePulse {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 0 25px rgba(249, 115, 22, 0.65);
          }
          50% {
            transform: scale(1.04);
            box-shadow: 0 0 45px rgba(249, 115, 22, 0.95);
          }
        }
        @keyframes pulseWarning {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.6;
            transform: scale(0.98);
          }
        }
        @keyframes tutorialGlow {
          0%, 100% {
            box-shadow: 0 0 15px rgba(56, 189, 248, 0.45);
          }
          50% {
            box-shadow: 0 0 32px rgba(56, 189, 248, 0.9);
          }
        }
        @media (max-width: 1024px) {
          .mission-control-main-grid {
            grid-template-columns: 1fr !important;
          }
          .mission-control-footer-content {
            flex-direction: column !important;
            align-items: stretch !important;
          }
        }
      `}</style>

      {/* ════════════════════════════════════════════════════════════════════
          1. IN-GAME TOP HUD BAR (Pure Video Game HUD)
         ════════════════════════════════════════════════════════════════════ */}
      <header
        style={{
          height: '56px',
          background: 'rgba(7, 14, 34, 0.95)',
          borderBottom: '1px solid #1e3a8a',
          padding: '0 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backdropFilter: 'blur(10px)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        {/* Left: Exit button & Destination Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => {
              soundFx.playClick(750);
              onNavigate('home');
            }}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid #334155',
              color: '#cbd5e1',
              borderRadius: '8px',
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
            title="Exit Mission and return to Main Menu"
          >
            <ArrowLeft size={14} />
            <span>Exit</span>
          </button>

          {/* Planet Location Badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: '#0b1638',
              border: '1px solid #1e3a8a',
              borderRadius: '8px',
              padding: '5px 12px',
            }}
          >
            <span style={{ fontSize: '15px' }}>{isMars ? '🔴' : '🌙'}</span>
            <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#fff' }}>
              {isMars ? 'Mars Outpost' : 'Moon Base'}
            </span>
            <span style={{ fontSize: '11px', color: '#38bdf8', fontFamily: 'monospace' }}>
              {isMars ? 'Jezero' : 'Shackleton'}
            </span>
          </div>

          {/* Day / Sol Counter */}
          <div
            style={{
              background: 'linear-gradient(135deg, #0284c7, #2563eb)',
              color: '#fff',
              padding: '5px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 900,
              letterSpacing: '0.04em',
              boxShadow: '0 0 15px rgba(2, 132, 199, 0.4)',
            }}
          >
            {dayTerm.toUpperCase()} {gameState.currentSol} / {maxDays}
          </div>
        </div>

        {/* Center: Difficulty Tier */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid #334155',
            borderRadius: '8px',
            padding: '5px 12px',
            fontSize: '12px',
            fontWeight: 800,
            color: '#fbbf24',
          }}
        >
          <span>⭐</span>
          <span>{gameState.difficultyMode} MODE</span>
        </div>

        {/* Right: Pause, Sound, Guide, Report */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => {
              setIsPaused(!isPaused);
              soundFx.playClick(800);
            }}
            style={{
              background: isPaused ? '#ef4444' : 'rgba(255, 255, 255, 0.08)',
              border: '1px solid #334155',
              color: '#fff',
              borderRadius: '8px',
              padding: '6px 10px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
            title={isPaused ? 'Resume Simulation' : 'Pause Simulation'}
          >
            {isPaused ? <Play size={14} /> : <Pause size={14} />}
            <span>{isPaused ? 'Paused' : 'Pause'}</span>
          </button>

          <button
            onClick={() => {
              setIsMuted(!isMuted);
              soundFx.playClick(750);
            }}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid #334155',
              color: isMuted ? '#94a3b8' : '#38bdf8',
              borderRadius: '8px',
              padding: '6px 10px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
          >
            {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
          </button>

          <button
            onClick={() => {
              soundFx.playClick(800);
              setIsTutorialOpen(true);
            }}
            style={{
              background: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.45)',
              color: '#fbbf24',
              borderRadius: '8px',
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            }}
            title="Cadet Survival Guide"
          >
            <HelpCircle size={14} />
            <span>Guide</span>
          </button>

          <button
            id="btn-open-report"
            onClick={() => {
              soundFx.playClick(800);
              setIsAAROpen(true);
            }}
            style={{
              background: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              color: '#38bdf8',
              borderRadius: '8px',
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            }}
            title="Open Mission Report"
          >
            <TrendingUp size={14} />
            <span>Report</span>
          </button>
        </div>
      </header>

      {/* ════════════════════════════════════════════════════════════════════
          2. ROW OF 7 RESOURCE BARS (Color Coded, Trend Arrows, Pulsing Warning)
         ════════════════════════════════════════════════════════════════════ */}
      <div
        style={{
          background: '#060d22',
          borderBottom: '1px solid #1e293b',
          padding: '10px 20px',
        }}
      >
        <div
          style={{
            maxWidth: '1440px',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))',
            gap: '8px',
          }}
        >
          {RESOURCES_LIST.map((r) => {
            const isHovered = hoveredResource === r.id;
            return (
              <div
                key={r.id}
                onMouseEnter={() => setHoveredResource(r.id)}
                onMouseLeave={() => setHoveredResource(null)}
                style={{
                  background: isHovered ? '#0e1c42' : '#09132b',
                  border: `1.5px solid ${isHovered ? r.color : r.isCritical ? '#ef4444' : '#1e293b'}`,
                  borderRadius: '10px',
                  padding: '8px 10px',
                  position: 'relative',
                  cursor: 'help',
                  transition: 'all 0.15s ease',
                  animation: r.isCritical ? 'pulseWarning 1.2s infinite' : 'none',
                }}
              >
                {/* Header: Icon, Label, Trend */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '4px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: r.color }}>
                    {r.icon}
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 800,
                        color: '#cbd5e1',
                        letterSpacing: '0.04em',
                      }}
                    >
                      {r.label}
                    </span>
                  </div>
                  {/* Trend Indicator Arrow */}
                  <span
                    style={{
                      fontSize: '13px',
                      fontWeight: 900,
                      color:
                        r.trend === '↑'
                          ? '#22c55e'
                          : r.trend === '↓'
                          ? '#ef4444'
                          : '#94a3b8',
                    }}
                    title={`Trend: ${r.trend === '↑' ? 'Rising' : r.trend === '↓' ? 'Falling' : 'Stable'}`}
                  >
                    {r.trend}
                  </span>
                </div>

                {/* Value & Unit */}
                <div
                  style={{
                    fontSize: '15px',
                    fontWeight: 900,
                    color: r.isCritical ? '#ef4444' : '#f8fafc',
                    marginBottom: '5px',
                  }}
                >
                  {r.value}
                  <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>
                    {r.unit}
                  </span>
                </div>

                {/* Progress Bar (Color Coded >=60 green, 30-59 yellow, <30 red) */}
                <div
                  style={{
                    width: '100%',
                    height: '5px',
                    background: '#1e293b',
                    borderRadius: '3px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${Math.min(100, Math.max(0, r.id === 'food' ? Math.round((r.value / 30) * 100) : r.value))}%`,
                      height: '100%',
                      background: r.color,
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>

                {/* Hover Tooltip: Dynamic Reason + Science Info */}
                {isHovered && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      zIndex: 300,
                      marginTop: '6px',
                      width: '250px',
                      background: '#040b1e',
                      border: `1.5px solid ${r.color}`,
                      borderRadius: '10px',
                      padding: '10px 12px',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.85)',
                      pointerEvents: 'none',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 800, color: r.color }}>
                        {r.friendlyName}
                      </span>
                      <span
                        style={{
                          fontSize: '9.5px',
                          fontWeight: 900,
                          padding: '1px 6px',
                          borderRadius: '4px',
                          background: `${r.color}22`,
                          color: r.color,
                          border: `1px solid ${r.color}`,
                        }}
                      >
                        {r.isCritical ? 'CRITICAL' : r.value < 60 ? 'CAUTION' : 'OPTIMAL'}
                      </span>
                    </div>

                    <div style={{ fontSize: '11.5px', color: '#fbbf24', fontWeight: 700, margin: '0 0 6px 0', lineHeight: 1.35 }}>
                      💡 {r.hoverReason}
                    </div>

                    <p style={{ fontSize: '11px', color: '#cbd5e1', lineHeight: 1.4, margin: '0 0 6px 0' }}>
                      {r.tooltip}
                    </p>
                    <div style={{ fontSize: '10px', color: '#94a3b8', fontFamily: 'monospace' }}>
                      NASA: {r.nasaTerm}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          3. MAIN 3-COLUMN TACTICAL STAGE
         ════════════════════════════════════════════════════════════════════ */}
      <main
        className="mission-control-main-grid"
        style={{
          flex: 1,
          maxWidth: '1440px',
          width: '100%',
          margin: '0 auto',
          padding: '16px 20px 24px',
          display: 'grid',
          gridTemplateColumns: 'minmax(270px, 320px) 1fr minmax(260px, 300px)',
          gap: '16px',
          alignItems: 'start',
        }}
      >
        {/* ── LEFT COLUMN: BUILD & ENGINEERING DEPOT (Requirement 4 & 6) ── */}
        <section
          style={{
            background: '#070f26',
            border:
              !isTutorialSkipped && gameState.currentSol === 1
                ? '2px solid #38bdf8'
                : '1px solid #1e3a8a',
            borderRadius: '16px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            animation:
              !isTutorialSkipped && gameState.currentSol === 1
                ? 'tutorialGlow 2s infinite ease-in-out'
                : 'none',
          }}
        >
          {/* Day 1 Tutorial Highlight Message (Skippable) */}
          {!isTutorialSkipped && gameState.currentSol === 1 && (
            <div
              style={{
                background: 'linear-gradient(90deg, #0284c7, #2563eb)',
                borderRadius: '8px',
                padding: '8px 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
                color: '#fff',
                fontSize: '11.5px',
                fontWeight: 800,
              }}
            >
              <span>👉 Sol 1: Look at the Build Panel here! Use your 12 Build Points to construct Solar Panels or a Battery.</span>
              <button
                onClick={() => setIsTutorialSkipped(true)}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  color: '#fff',
                  borderRadius: '4px',
                  padding: '2px 8px',
                  fontSize: '10px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                Skip ✕
              </button>
            </div>
          )}

          {/* Prominent Build Points Budget Header */}
          <div
            style={{
              background: 'linear-gradient(135deg, #0369a1, #1d4ed8)',
              borderRadius: '10px',
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 0 15px rgba(2, 132, 199, 0.4)',
            }}
          >
            <div>
              <div style={{ fontSize: '10px', fontWeight: 800, color: '#e0f2fe', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Engineering Budget
              </div>
              <div style={{ fontSize: '16px', fontWeight: 900, color: '#ffffff' }}>
                🏗️ {availableBP} Build Points
              </div>
            </div>
            <div style={{ fontSize: '11px', color: '#bae6fd', fontWeight: 800 }}>
              +{dailyBP} BP / Sol
            </div>
          </div>

          {buildNotice && (
            <div
              style={{
                background: 'rgba(16, 185, 129, 0.2)',
                border: '1px solid #10b981',
                color: '#43ffa0',
                padding: '6px 10px',
                borderRadius: '8px',
                fontSize: '11.5px',
                fontWeight: 700,
              }}
            >
              {buildNotice}
            </div>
          )}

          {/* Module Cards List with Kid Names & Technical Tooltips */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              maxHeight: 'calc(100vh - 300px)',
              overflowY: 'auto',
              paddingRight: '4px',
            }}
          >
            {BUILDABLE_MODULES.map((mod) => {
              const { kidName, techTerm, icon } = getModuleKidDisplay(mod);
              const canAfford = availableBP >= mod.buildCostBP;
              const needPoints = mod.buildCostBP - availableBP;
              const isHovered = hoveredModule === mod.id;

              return (
                <div
                  key={mod.id}
                  onMouseEnter={() => setHoveredModule(mod.id)}
                  onMouseLeave={() => setHoveredModule(null)}
                  style={{
                    background: '#091433',
                    border: `1px solid ${canAfford ? '#1e3a8a' : '#334155'}`,
                    borderRadius: '10px',
                    padding: '10px 12px',
                    opacity: canAfford ? 1 : 0.55,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '6px',
                    position: 'relative',
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '3px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '14px' }}>{icon}</span>
                        <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#fff' }}>
                          {kidName}
                        </span>
                        <span
                          style={{
                            fontSize: '9.5px',
                            color: '#94a3b8',
                            fontFamily: 'monospace',
                            cursor: 'help',
                          }}
                          title={`Technical NASA term: ${techTerm}`}
                        >
                          ({techTerm.split(' ')[0]})
                        </span>
                      </div>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 800,
                          background: canAfford ? '#0284c7' : '#475569',
                          color: '#fff',
                          padding: '2px 7px',
                          borderRadius: '4px',
                        }}
                      >
                        {mod.buildCostBP} BP
                      </span>
                    </div>

                    <div style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 700 }}>
                      {mod.simpleEffect}
                    </div>
                  </div>

                  {/* Build Action Button */}
                  <button
                    id={`btn-build-module-${mod.id}`}
                    onClick={() => handleBuild(mod)}
                    disabled={!canAfford}
                    style={{
                      width: '100%',
                      padding: '7px',
                      borderRadius: '6px',
                      background: canAfford ? '#059669' : '#1e293b',
                      border: 'none',
                      color: canAfford ? '#fff' : '#64748b',
                      fontSize: '11.5px',
                      fontWeight: 800,
                      cursor: canAfford ? 'pointer' : 'not-allowed',
                      transition: 'background 0.15s ease',
                    }}
                  >
                    {canAfford
                      ? `Build (${mod.buildCostBP} BP)`
                      : `Need ${needPoints} more point${needPoints > 1 ? 's' : ''}`}
                  </button>

                  {/* Technical Tooltip on Hover */}
                  {isHovered && (
                    <div
                      style={{
                        position: 'absolute',
                        left: '102%',
                        top: 0,
                        width: '220px',
                        background: '#040b1e',
                        border: '1px solid #38bdf8',
                        borderRadius: '8px',
                        padding: '8px 10px',
                        boxShadow: '0 8px 25px rgba(0,0,0,0.85)',
                        zIndex: 400,
                        pointerEvents: 'none',
                      }}
                    >
                      <div style={{ fontSize: '11px', fontWeight: 800, color: '#38bdf8', marginBottom: '2px' }}>
                        NASA Term: {techTerm}
                      </div>
                      <p style={{ fontSize: '10.5px', color: '#cbd5e1', lineHeight: 1.35, margin: 0 }}>
                        {mod.description}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ── CENTER COLUMN: OUTPOST VIEWPORT & EVENT DILEMMAS ── */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Outpost Interactive Viewport (Default: Bright Outpost Overview) */}
          {renderOutpostViewport()}

          {/* Active Event / Dilemma Card */}
          {gameState.activeEvent && (
            <div
              style={{
                background: '#091024',
                border: '1.5px solid #1e3a8a',
                borderRadius: '16px',
                padding: '18px 20px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '10px',
                }}
              >
                <div>
                  <span
                    style={{
                      fontSize: '10.5px',
                      fontWeight: 800,
                      color: '#38bdf8',
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {dayTerm.toUpperCase()} {gameState.activeEvent.sol} DILEMMA // {gameState.destination}
                  </span>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#fff', margin: '2px 0 0 0' }}>
                    {gameState.activeEvent.title}
                  </h3>
                </div>
              </div>

              {/* Event Description */}
              <p style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: 1.5, margin: '0 0 14px 0' }}>
                {gameState.activeEvent.weatherNotice ||
                  gameState.activeEvent.comicPanels[0]?.dialogue ||
                  gameState.activeEvent.nasaCitation.description}
              </p>

              {/* Engineering Choices Grid */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {gameState.activeEvent.options.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => {
                      soundFx.playClick(850);
                      onSelectChoice(opt);
                      setHasChosenChoiceToday(true);
                    }}
                    style={{
                      background: '#070d1e',
                      border: '1.5px solid #334155',
                      borderRadius: '10px',
                      padding: '12px 14px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#0284c7';
                      e.currentTarget.style.background = '#0a1533';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#334155';
                      e.currentTarget.style.background = '#070d1e';
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: '13px', color: '#38bdf8' }}>{opt.title}</strong>
                      <ChevronRight size={16} className="text-cyan-400" />
                    </div>
                    <p style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: 1.4, margin: 0 }}>
                      {opt.description}
                    </p>
                    <div
                      style={{
                        fontSize: '11px',
                        color: '#fbbf24',
                        background: 'rgba(245, 158, 11, 0.1)',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        marginTop: '4px',
                      }}
                    >
                      <strong>Trade-off:</strong> {opt.tradeOffText}
                    </div>
                  </button>
                ))}
              </div>

              {/* Real NASA Citation */}
              {gameState.activeEvent.nasaCitation && (
                <div
                  style={{
                    marginTop: '14px',
                    background: '#060b1a',
                    border: '1px solid #1e293b',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    fontSize: '11px',
                    color: '#94a3b8',
                  }}
                >
                  <strong style={{ color: '#38bdf8' }}>NASA Citation: </strong>
                  {gameState.activeEvent.nasaCitation.title} (
                  <span style={{ color: '#f59e0b' }}>{gameState.activeEvent.nasaCitation.docNumber}</span>)
                </div>
              )}
            </div>
          )}

          {/* Last Consequence Narrative (if available) */}
          {lastConsequence && (
            <div
              style={{
                background: '#09122a',
                border: '1.5px solid #f59e0b',
                borderRadius: '12px',
                padding: '14px 16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', fontWeight: 800, color: '#f59e0b', marginBottom: '4px' }}>
                <AlertTriangle size={15} />
                <span>AFTERMATH: {lastConsequence.choiceTitle}</span>
              </div>
              <p style={{ fontSize: '12.5px', color: '#f1f5f9', lineHeight: 1.45, margin: 0 }}>
                {lastConsequence.narrative}
              </p>
              <div style={{ fontSize: '11.5px', color: '#34d399', marginTop: '6px' }}>
                💡 <strong>NASA Science Principle: </strong>{lastConsequence.insight}
              </div>
            </div>
          )}
        </section>

        {/* ── RIGHT COLUMN: 4 POWER SHARE SLIDERS & CREW ROSTER (Requirement 5 & 6) ── */}
        <section
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          {/* 4 Power Share Sliders */}
          <div
            style={{
              background: '#070f26',
              border:
                !isTutorialSkipped && gameState.currentSol === 2
                  ? '2px solid #f59e0b'
                  : '1px solid #1e3a8a',
              borderRadius: '16px',
              padding: '16px',
              animation:
                !isTutorialSkipped && gameState.currentSol === 2
                  ? 'tutorialGlow 2s infinite ease-in-out'
                  : 'none',
            }}
          >
            {/* Day 2 Tutorial Highlight Message */}
            {!isTutorialSkipped && gameState.currentSol === 2 && (
              <div
                style={{
                  background: 'linear-gradient(90deg, #d97706, #ea580c)',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                  color: '#fff',
                  fontSize: '11.5px',
                  fontWeight: 800,
                  marginBottom: '12px',
                }}
              >
                <span>👉 Sol 2: Balance your Power Share sliders! Make sure Life Support and Greenhouse get enough watts.</span>
                <button
                  onClick={() => setIsTutorialSkipped(true)}
                  style={{
                    background: 'rgba(255,255,255,0.2)',
                    border: 'none',
                    color: '#fff',
                    borderRadius: '4px',
                    padding: '2px 8px',
                    fontSize: '10px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Skip ✕
                </button>
              </div>
            )}

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '12px',
                paddingBottom: '8px',
                borderBottom: '1px solid #1e293b',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Zap size={16} className="text-amber-400" />
                <strong style={{ fontSize: '13px', color: '#f8fafc' }}>
                  Power Share Grid
                </strong>
              </div>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 900,
                  color: totalPowerPercent > 100 ? '#ef4444' : '#10b981',
                }}
              >
                {totalPowerPercent}% / 100%
              </span>
            </div>

            {/* Over-allocation Warning with Starved Subsystem Breakdown */}
            {totalPowerPercent > 100 && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid #ef4444',
                  color: '#fca5a5',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  fontSize: '11px',
                  fontWeight: 700,
                  marginBottom: '12px',
                  lineHeight: 1.4,
                }}
              >
                <div style={{ color: '#ef4444', fontWeight: 900, marginBottom: '2px' }}>
                  ⚠️ OVER POWER BUDGET (+{totalPowerPercent - 100}%)
                </div>
                <div>
                  Generators overloaded! System brownouts will starve:{' '}
                  <strong style={{ color: '#ffffff' }}>{starvedSubsystems.join(' & ')}</strong>.
                </div>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Slider 1: Life Support */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', marginBottom: '2px' }}>
                  <span style={{ color: '#06b6d4', fontWeight: 700 }}>💨 Life Support / O2</span>
                  <span style={{ fontWeight: 800 }}>{powerAllocations.lifeSupport}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="60"
                  value={powerAllocations.lifeSupport}
                  onChange={(e) => handleSliderChange('lifeSupport', parseInt(e.target.value))}
                  style={{ width: '100%', accentColor: '#06b6d4', cursor: 'pointer' }}
                />
                <div style={{ fontSize: '10.5px', color: powerAllocations.lifeSupport >= 25 ? '#38bdf8' : '#ef4444', fontWeight: 700, marginTop: '2px' }}>
                  {powerAllocations.lifeSupport >= 25
                    ? `💨 Life Support ${powerAllocations.lifeSupport}% ➔ Clean Air nominal (+1% / sol)`
                    : `⚠️ Low Power ➔ Air drops by -2% / sol`}
                </div>
              </div>

              {/* Slider 2: Greenhouse (Farm) */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', marginBottom: '2px' }}>
                  <span style={{ color: '#10b981', fontWeight: 700 }}>🌱 Space Greenhouse</span>
                  <span style={{ fontWeight: 800 }}>{powerAllocations.greenhouse}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="50"
                  value={powerAllocations.greenhouse}
                  onChange={(e) => handleSliderChange('greenhouse', parseInt(e.target.value))}
                  style={{ width: '100%', accentColor: '#10b981', cursor: 'pointer' }}
                />
                <div style={{ fontSize: '10.5px', color: powerAllocations.greenhouse >= 25 ? '#4ade80' : powerAllocations.greenhouse >= 15 ? '#fbbf24' : '#ef4444', fontWeight: 700, marginTop: '2px' }}>
                  {powerAllocations.greenhouse >= 25
                    ? `🌱 Farm ${powerAllocations.greenhouse}% ➔ Food +2 meals per day`
                    : powerAllocations.greenhouse >= 15
                    ? `🌱 Farm ${powerAllocations.greenhouse}% ➔ Food +1 meal per day`
                    : `⚠️ Farm <15% ➔ Food 0 (Crops wilt without light)`}
                </div>
              </div>

              {/* Slider 3: Water Recycler */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', marginBottom: '2px' }}>
                  <span style={{ color: '#38bdf8', fontWeight: 700 }}>💧 Water Recycler</span>
                  <span style={{ fontWeight: 800 }}>{powerAllocations.waterRecycler}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="40"
                  value={powerAllocations.waterRecycler}
                  onChange={(e) => handleSliderChange('waterRecycler', parseInt(e.target.value))}
                  style={{ width: '100%', accentColor: '#38bdf8', cursor: 'pointer' }}
                />
                <div style={{ fontSize: '10.5px', color: powerAllocations.waterRecycler >= 20 ? '#38bdf8' : '#ef4444', fontWeight: 700, marginTop: '2px' }}>
                  {powerAllocations.waterRecycler >= 20
                    ? `💧 Recycler ${powerAllocations.waterRecycler}% ➔ Water +1% per day`
                    : `⚠️ Recycler <20% ➔ Water drops by -2% per day`}
                </div>
              </div>

              {/* Slider 4: Shield Berm */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', marginBottom: '2px' }}>
                  <span style={{ color: '#ef4444', fontWeight: 700 }}>🛡️ Shield Berm</span>
                  <span style={{ fontWeight: 800 }}>{powerAllocations.radiationShield}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="40"
                  value={powerAllocations.radiationShield}
                  onChange={(e) => handleSliderChange('radiationShield', parseInt(e.target.value))}
                  style={{ width: '100%', accentColor: '#ef4444', cursor: 'pointer' }}
                />
                <div style={{ fontSize: '10.5px', color: powerAllocations.radiationShield >= 20 ? '#f87171' : '#ef4444', fontWeight: 700, marginTop: '2px' }}>
                  {powerAllocations.radiationShield >= 20
                    ? `🛡️ Shield ${powerAllocations.radiationShield}% ➔ Absorbs 85% cosmic rays`
                    : `⚠️ Shield <20% ➔ High radiation danger!`}
                </div>
              </div>
            </div>
          </div>

          {/* Astronaut Crew of 4 Status Roster */}
          <div
            style={{
              background: '#070f26',
              border: '1px solid #1e3a8a',
              borderRadius: '16px',
              padding: '16px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginBottom: '10px',
                paddingBottom: '8px',
                borderBottom: '1px solid #1e293b',
              }}
            >
              <Heart size={16} className="text-red-400" />
              <strong style={{ fontSize: '13px', color: '#f8fafc' }}>
                Astronaut Crew (4)
              </strong>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#091433', padding: '6px 10px', borderRadius: '8px' }}>
                <span style={{ fontSize: '16px' }}>🧑‍✈️</span>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#fff' }}>
                    {savedCrewNames['crew_commander'] || 'Alex Rivera'}
                  </div>
                  <div style={{ fontSize: '10.5px', color: '#38bdf8' }}>Commander (+15% Morale)</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#091433', padding: '6px 10px', borderRadius: '8px' }}>
                <span style={{ fontSize: '16px' }}>👩‍🔧</span>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#fff' }}>
                    {savedCrewNames['crew_engineer'] || 'Maya Lin'}
                  </div>
                  <div style={{ fontSize: '10.5px', color: '#38bdf8' }}>Systems Engineer (Fast Repairs)</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#091433', padding: '6px 10px', borderRadius: '8px' }}>
                <span style={{ fontSize: '16px' }}>👨‍⚕️</span>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#fff' }}>
                    {savedCrewNames['crew_doctor'] || 'Dr. Sam Okonjo'}
                  </div>
                  <div style={{ fontSize: '10.5px', color: '#38bdf8' }}>Medical Officer (Health Shield)</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#091433', padding: '6px 10px', borderRadius: '8px' }}>
                <span style={{ fontSize: '16px' }}>👩‍🌾</span>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#fff' }}>
                    {savedCrewNames['crew_scientist'] || 'Chloe Patel'}
                  </div>
                  <div style={{ fontSize: '10.5px', color: '#38bdf8' }}>Botanist (+25% Crops)</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ════════════════════════════════════════════════════════════════════
          4. BOTTOM BAR: TOMORROW'S FORECAST & BIGGEST "END DAY" BUTTON (Req 1 & 7)
         ════════════════════════════════════════════════════════════════════ */}
      <footer
        style={{
          background: 'rgba(7, 14, 34, 0.98)',
          borderTop: '2px solid #1e3a8a',
          padding: '12px 24px',
          position: 'sticky',
          bottom: 0,
          zIndex: 100,
          border:
            !isTutorialSkipped && gameState.currentSol === 3
              ? '2px solid #10b981'
              : undefined,
          animation:
            !isTutorialSkipped && gameState.currentSol === 3
              ? 'tutorialGlow 2s infinite ease-in-out'
              : 'none',
        }}
      >
        {/* Day 3 Tutorial Banner */}
        {!isTutorialSkipped && gameState.currentSol === 3 && (
          <div
            style={{
              maxWidth: '1440px',
              margin: '0 auto 8px auto',
              background: 'linear-gradient(90deg, #059669, #0d9488)',
              borderRadius: '8px',
              padding: '6px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              color: '#fff',
              fontSize: '11.5px',
              fontWeight: 800,
            }}
          >
            <span>👉 Sol 3: Inspect Tomorrow’s Forecast, check your preparations, then click the big orange "END DAY" button!</span>
            <button
              onClick={() => setIsTutorialSkipped(true)}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                color: '#fff',
                borderRadius: '4px',
                padding: '2px 8px',
                fontSize: '10px',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              Skip ✕
            </button>
          </div>
        )}

        <div
          className="mission-control-footer-content"
          style={{
            maxWidth: '1440px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          {/* Tomorrow's 24-Hour Forecast + How to Prepare Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: '300px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                background: gameState.activeWarning ? 'rgba(239, 68, 68, 0.2)' : 'rgba(2, 132, 199, 0.2)',
                border: `1.5px solid ${gameState.activeWarning ? '#ef4444' : '#0284c7'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {gameState.activeWarning ? (
                <AlertTriangle size={20} className="text-red-400 animate-pulse" />
              ) : isMars ? (
                <Wind size={20} className="text-amber-400" />
              ) : (
                <Sun size={20} className="text-amber-400" />
              )}
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: gameState.activeWarning ? '#ef4444' : '#38bdf8', letterSpacing: '0.04em' }}>
                  TOMORROW'S FORECAST // {dayTerm.toUpperCase()} {gameState.currentSol + 1}
                </span>

                {/* Requirement 7: How to prepare hint button */}
                <button
                  id="btn-how-to-prepare"
                  onClick={() => setIsPrepareHintOpen(!isPrepareHintOpen)}
                  style={{
                    background: isPrepareHintOpen ? '#0284c7' : 'rgba(56, 189, 248, 0.15)',
                    border: '1px solid rgba(56, 189, 248, 0.45)',
                    color: isPrepareHintOpen ? '#fff' : '#38bdf8',
                    borderRadius: '6px',
                    padding: '2px 8px',
                    fontSize: '11px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.15s ease',
                  }}
                  title="Click for mission preparation advice"
                >
                  <HelpCircle size={12} />
                  <span>How to prepare</span>
                </button>
              </div>

              <div style={{ fontSize: '12.5px', color: '#f1f5f9', fontWeight: 600, marginTop: '2px' }}>
                {gameState.activeWarning
                  ? `${gameState.activeWarning.title}: ${gameState.activeWarning.message}`
                  : isMars
                  ? 'Atmospheric haze nominal. Solar irradiance at 43% Earth level. No dust storm activity detected.'
                  : 'Sunlit polar ridge. Temperature -130°C. Solar arrays generating nominal power.'}
              </div>
            </div>
          </div>

          {/* Requirement 1: Big END DAY button with 24px right margin, gentle pulse when ready */}
          <div style={{ marginRight: '24px' }}>
            <button
              id="btn-end-day"
              onClick={handleEndDay}
              style={{
                padding: '16px 42px',
                borderRadius: '9999px',
                background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                border: '2px solid rgba(254, 215, 170, 0.8)',
                color: '#ffffff',
                fontSize: '16px',
                fontWeight: 900,
                letterSpacing: '0.04em',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                boxShadow: hasNothingLeftToDo
                  ? '0 0 35px rgba(249, 115, 22, 0.85)'
                  : '0 0 20px rgba(249, 115, 22, 0.5)',
                animation: hasNothingLeftToDo ? 'gentlePulse 2s infinite ease-in-out' : 'none',
                transition: 'all 0.2s ease',
              }}
              title={`Advance simulation to ${dayTerm} ${gameState.currentSol + 1}`}
            >
              <span>END {dayTerm.toUpperCase()} {gameState.currentSol}</span>
              <ChevronRight size={22} />
            </button>
          </div>
        </div>

        {/* How to Prepare Advice Drawer Popover */}
        {isPrepareHintOpen && (
          <div
            style={{
              maxWidth: '1440px',
              margin: '10px auto 0 auto',
              background: '#09153a',
              border: '1.5px solid #38bdf8',
              borderRadius: '10px',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              boxShadow: '0 8px 25px rgba(0,0,0,0.7)',
            }}
          >
            <div>
              <div style={{ fontSize: '12px', fontWeight: 900, color: '#38bdf8', marginBottom: '2px' }}>
                💡 Mission Specialist Advice for {dayTerm} {gameState.currentSol + 1}:
              </div>
              <div style={{ fontSize: '11.5px', color: '#e2e8f0', lineHeight: 1.4 }}>
                {gameState.activeWarning ? (
                  <>
                    ⚠️ Storm detected! Allocate at least <strong>25% power to Shield Berm</strong> in the right panel, or build a <strong>Radiation Wall</strong> on the left before ending the day.
                  </>
                ) : isLunarNight ? (
                  <>
                    🌑 Darkness freeze ahead! Solar arrays drop to 0 kW. Make sure you have built a <strong>Battery Bank</strong> or <strong>Kilopower Reactor</strong> to keep air and heat flowing!
                  </>
                ) : (
                  <>
                    ☀️ Clear skies and nominal power! Great day to allocate 25%+ power to the <strong>Space Greenhouse</strong> (+2 meals) and spend your Build Points on extra panels or batteries.
                  </>
                )}
              </div>
            </div>
            <button
              onClick={() => setIsPrepareHintOpen(false)}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                color: '#cbd5e1',
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              Close ✕
            </button>
          </div>
        )}
      </footer>

      {/* ════════════════════════════════════════════════════════════════════
          5. FIRST-TIME CADET TUTORIAL MODAL
         ════════════════════════════════════════════════════════════════════ */}
      {isTutorialOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 2200,
            background: 'rgba(3, 7, 18, 0.92)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            style={{
              background: '#070f26',
              border: '2px solid #38bdf8',
              borderRadius: '20px',
              padding: '24px',
              maxWidth: '600px',
              width: '100%',
              boxShadow: '0 25px 60px rgba(0,0,0,0.85)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '24px' }}>🧑‍🚀</span>
                <strong style={{ fontSize: '1.25rem', color: '#fff' }}>
                  Junior Astronaut Quickstart Guide
                </strong>
              </div>
              <button
                onClick={() => setIsTutorialOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', lineHeight: 1.5, color: '#e2e8f0' }}>
              <div style={{ background: '#091433', padding: '10px 14px', borderRadius: '10px', borderLeft: '4px solid #f59e0b' }}>
                <strong style={{ color: '#fbbf24' }}>1. ⚡ Power is King:</strong> Solar arrays produce power by day. When night or dust storms strike, solar power drops to 0! Build Batteries or a Kilopower Reactor.
              </div>
              <div style={{ background: '#091433', padding: '10px 14px', borderRadius: '10px', borderLeft: '4px solid #06b6d4' }}>
                <strong style={{ color: '#67e8f9' }}>2. 💨 Air &amp; Water:</strong> Sabatier air cleaners remove toxic CO2, and water recyclers clean moisture. Never let them hit 0%!
              </div>
              <div style={{ background: '#091433', padding: '10px 14px', borderRadius: '10px', borderLeft: '4px solid #ef4444' }}>
                <strong style={{ color: '#f87171' }}>3. 🛡️ 24-Hour Warnings:</strong> When you see an advance storm alert in Tomorrow’s Forecast, build regolith shielding immediately!
              </div>
              <div style={{ background: '#091433', padding: '10px 14px', borderRadius: '10px', borderLeft: '4px solid #a855f7' }}>
                <strong style={{ color: '#c084fc' }}>4. 🧠 Crew Health &amp; Morale:</strong> Keep your astronauts happy with greenhouse greens and exercise to prevent costly errors.
              </div>
            </div>

            <button
              onClick={() => {
                setIsTutorialOpen(false);
                soundFx.playReactorStart();
              }}
              style={{
                marginTop: '18px',
                width: '100%',
                padding: '12px',
                background: 'linear-gradient(135deg, #0284c7, #2563eb)',
                border: 'none',
                borderRadius: '10px',
                color: '#fff',
                fontWeight: 900,
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              🚀 Resume Outpost Command!
            </button>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          6. AFTER-ACTION REPORT MODAL
         ════════════════════════════════════════════════════════════════════ */}
      {(gameState.isGameOver || isAAROpen) && (
        <MissionAutopsy
          gameState={gameState}
          onRestartMission={onRestart}
          onClose={() => setIsAAROpen(false)}
          currentMission={currentMission}
          onSwitchDestination={onSwitchDestination}
          onSelectDifficulty={onSelectDifficulty}
        />
      )}
    </div>
  );
};

export default MissionControlPage;
