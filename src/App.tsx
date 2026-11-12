import React, { useState, useEffect, Suspense, lazy } from 'react';
import type { GameState, ChoiceOption, SolHistoryEntry, DifficultyMode } from './types/game';
import type { DifficultyTier } from './data/difficultyTiers';
import { getMissionScenarioDeck } from './utils/missionScenarioEngine';
import { NASA_MISSIONS, type NasaMission } from './data/nasaMissions';
import { TEACHING_FLASHCARDS, type TeachingFlashcard } from './data/teachingFlashcards';
import { useAppRouter, type AppRoute } from './router/useAppRouter';
import { GlobalNavBar } from './components/GlobalNavBar';
import { authService } from './utils/authService';
import type { User } from './types/auth';
import { spaceMusicEngine } from './utils/spaceMusicEngine';
import { studentActivityService } from './utils/studentActivityService';
import {
  computeDailySimulationTurn,
  saveGameStateToStorage,
  loadGameStateFromStorage,
  DEFAULT_LUNAR_OUTPOST,
  DEFAULT_MARS_OUTPOST,
  generateMissionObjectives,
} from './utils/simulationEngine';
import { DIFFICULTY_PROFILES, CREW_SPECIALTY_BONUSES } from './config/outpostBalanceConfig';
import type { OutpostConfiguration } from './types/game';
import { soundFx } from './utils/audioEffects';
import { speechEngine } from './utils/speechEngine';
import { JudgePreviewBadge, JudgePreviewModal } from './components/JudgePreviewMode';

// Code-split Dedicated Pages
const GameLandingHomePage = lazy(() => import('./pages/GameLandingHomePage'));
const ExploreSpacePage = lazy(() => import('./pages/ExploreSpacePage'));
const OrreryHomePage = lazy(() => import('./pages/OrreryHomePage'));
const MissionControlPage = lazy(() => import('./pages/MissionControlPage'));
const AstronautAcademyPage = lazy(() => import('./pages/AstronautAcademyPage'));
const SimulatorsHubPage = lazy(() => import('./pages/SimulatorsHubPage'));
const MissionCampaignPage = lazy(() => import('./pages/MissionCampaignPage'));
const LearningHubPage = lazy(() => import('./pages/LearningHubPage'));
const TeacherHubPage = lazy(() => import('./pages/TeacherHubPage'));

// Code-split Transient Utility Modals
const AuthModal = lazy(() => import('./components/AuthModal').then(m => ({ default: m.AuthModal })));
const SettingsModal = lazy(() => import('./components/SettingsModal').then(m => ({ default: m.SettingsModal })));
const HowToPlayModal = lazy(() => import('./components/HowToPlayModal').then(m => ({ default: m.HowToPlayModal })));
const FlightCertificateModal = lazy(() => import('./components/FlightCertificateModal').then(m => ({ default: m.FlightCertificateModal })));
const NasaTelemetryPanel = lazy(() => import('./components/NasaTelemetryPanel').then(m => ({ default: m.NasaTelemetryPanel })));
const AboutModal = lazy(() => import('./components/AboutModal').then(m => ({ default: m.AboutModal })));
const AIDisclosureModal = lazy(() => import('./components/AIDisclosureModal').then(m => ({ default: m.AIDisclosureModal })));
const NasaDataModal = lazy(() => import('./components/NasaDataModal').then(m => ({ default: m.NasaDataModal })));
const PlanetaryCommandMap = lazy(() => import('./components/PlanetaryCommandMap').then(m => ({ default: m.PlanetaryCommandMap })));
const AstronautBriefingModal = lazy(() => import('./components/AstronautBriefingModal').then(m => ({ default: m.AstronautBriefingModal })));
const OutpostConstructionModal = lazy(() => import('./components/OutpostConstructionModal').then(m => ({ default: m.OutpostConstructionModal })));
const AstronautCharacterModal = lazy(() => import('./components/AstronautCharacterModal').then(m => ({ default: m.AstronautCharacterModal })));
const LiveMissionActivityModal = lazy(() => import('./components/LiveMissionActivityModal').then(m => ({ default: m.LiveMissionActivityModal })));
const MissionGameModal = lazy(() => import('./components/MissionGameModal').then(m => ({ default: m.MissionGameModal })));
const MultiplayerLobbyModal = lazy(() => import('./components/MultiplayerLobbyModal').then(m => ({ default: m.MultiplayerLobbyModal })));
const AudioTeachingFlashcard = lazy(() => import('./components/AudioTeachingFlashcard').then(m => ({ default: m.AudioTeachingFlashcard })));

export const ARTEMIS_LUNAR_BASE_MISSION: NasaMission =
  NASA_MISSIONS.find((m) => m.id === 'NASA-M049') || NASA_MISSIONS[48];

export const MARS_JEZERO_BASE_MISSION: NasaMission =
  NASA_MISSIONS.find((m) => m.id === 'NASA-M057') || NASA_MISSIONS[56];

const INITIAL_GAME_STATE: GameState = {
  destination: 'MOON',
  difficultyMode: 'CADET',
  currentSol: 1,
  totalSols: 30,
  buildPoints: 12,
  resources: {
    power: DIFFICULTY_PROFILES.CADET.startingResources.power,
    water: DIFFICULTY_PROFILES.CADET.startingResources.water,
    oxygen: DIFFICULTY_PROFILES.CADET.startingResources.oxygen,
    food: DIFFICULTY_PROFILES.CADET.startingResources.food,
    radiation: 12,
    science: DIFFICULTY_PROFILES.CADET.startingResources.science,
    crewHealth: DIFFICULTY_PROFILES.CADET.startingResources.crewHealth,
    crewMorale: DIFFICULTY_PROFILES.CADET.startingResources.crewMorale ?? 95,
    shielding: DIFFICULTY_PROFILES.CADET.startingResources.shielding,
  },
  modules: {
    habitat: { status: 'NOMINAL', lifeSupportLoadKw: 12 },
    powerStation: { status: 'NOMINAL', activeSource: 'SOLAR', currentOutputKw: 25 },
    greenhouse: { status: 'NOMINAL', growthCycleDays: 3, lightEfficiency: 85 },
    stormVault: { status: 'NOMINAL', isSealed: false, regolithShieldCm: 180 }
  },
  outpostConfig: DEFAULT_LUNAR_OUTPOST,
  objectives: generateMissionObjectives('MOON'),
  equipmentCondition: 100,
  netPowerKw: 15,
  activeEvent: getMissionScenarioDeck(ARTEMIS_LUNAR_BASE_MISSION, 'CADET')[0],
  history: [],
  isGameOver: false,
  gameOutcome: 'IN_PROGRESS'
};

const PageFallback: React.FC = () => (
  <div style={{
    minHeight: 'calc(100vh - 52px)',
    background: 'var(--color-space-950, #050814)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#38bdf8',
    fontFamily: 'var(--font-mono, monospace)',
    fontSize: '13px',
    letterSpacing: '0.1em',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#38bdf8', animation: 'pulse 1.2s infinite' }} />
      <span>INITIALIZING AEROSPACE TELEMETRY...</span>
    </div>
  </div>
);

export const App: React.FC = () => {
  const { route, params, navigate } = useAppRouter();

  // Persistent Game Simulation State
  const [gameState, setGameState] = useState<GameState>(() => {
    const saved = loadGameStateFromStorage();
    return saved || INITIAL_GAME_STATE;
  });
  const [savedGameInfo, setSavedGameInfo] = useState<GameState | null>(loadGameStateFromStorage);
  const [currentMission, setCurrentMission] = useState<NasaMission>(() => {
    const saved = loadGameStateFromStorage();
    if (saved?.destination === 'MARS') return MARS_JEZERO_BASE_MISSION;
    return ARTEMIS_LUNAR_BASE_MISSION;
  });
  const [lastConsequence, setLastConsequence] = useState<{
    narrative: string;
    insight: string;
    choiceTitle: string;
    choiceOption?: ChoiceOption;
  } | null>(null);

  // Viewport Settings (Default to 2D Outpost Overview as requested)
  const [is3DView, setIs3DView] = useState(false);
  const [isTheaterMode, setIsTheaterMode] = useState(true);
  const [isShieldActive, setIsShieldActive] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  // User Authentication & Progression
  const [currentUser, setCurrentUser] = useState<User | null>(() => authService.getCurrentUser());
  const [collectedFlashcards, setCollectedFlashcards] = useState<TeachingFlashcard[]>([TEACHING_FLASHCARDS[0]]);
  const [activeFlashcard, setActiveFlashcard] = useState<TeachingFlashcard | null>(null);
  const [completedMissions, setCompletedMissions] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('astro_camp_completed_missions');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Judge Mode
  const [isJudgeMode, setIsJudgeMode] = useState(() => {
    try { return localStorage.getItem('astro_camp_judge_mode') === 'true'; } catch { return false; }
  });

  // Transient Modal Dialogs State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);
  const [isCertificateOpen, setIsCertificateOpen] = useState(false);
  const [isJudgeModalOpen, setIsJudgeModalOpen] = useState(false);
  const [isTelemetryOpen, setIsTelemetryOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isNasaDataOpen, setIsNasaDataOpen] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isCharacterModalOpen, setIsCharacterModalOpen] = useState(false);
  const [isLiveActivityModalOpen, setIsLiveActivityModalOpen] = useState(false);
  const [isPlanetaryMapOpen, setIsPlanetaryMapOpen] = useState(false);
  const [isBriefingModalOpen, setIsBriefingModalOpen] = useState(false);
  const [selectedBriefingMission, setSelectedBriefingMission] = useState<NasaMission | null>(null);
  const [isConstructionModalOpen, setIsConstructionModalOpen] = useState(false);
  const [isFlashcardOpen, setIsFlashcardOpen] = useState(false);

  // Active Mini-Game / Multiplayer Lobby State
  const [activeMissionGameId, setActiveMissionGameId] = useState<string | null>(null);
  const [isMultiplayerLobbyOpen, setIsMultiplayerLobbyOpen] = useState(false);
  const [isCoopActive, setIsCoopActive] = useState(false);
  const [coopRole, setCoopRole] = useState<import('./utils/multiplayerMissionService').CrewRole>('CDR');

  // Auto-save Game State
  useEffect(() => {
    if (!gameState.isGameOver) {
      saveGameStateToStorage(gameState);
      setSavedGameInfo(gameState);
    }
  }, [gameState]);

  // Route change: dismiss all transient overlay modals so the user lands cleanly on the chosen page
  useEffect(() => {
    setActiveMissionGameId(null);
    setIsMultiplayerLobbyOpen(false);
    setIsBriefingModalOpen(false);
    setIsConstructionModalOpen(false);
    setIsFlashcardOpen(false);
    setIsAuthModalOpen(false);
    setIsSettingsOpen(false);
    setIsHowToPlayOpen(false);
    setIsCertificateOpen(false);
    setIsJudgeModalOpen(false);
    setIsTelemetryOpen(false);
    setIsAboutOpen(false);
    setIsNasaDataOpen(false);
    setIsAIModalOpen(false);
    setIsCharacterModalOpen(false);
    setIsLiveActivityModalOpen(false);
    setIsPlanetaryMapOpen(false);
  }, [route]);

  // Auto-open Multiplayer Lobby if URL has ?room= or ?coop=true
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('room') || params.get('coop') === 'true' || window.location.hash.includes('coop')) {
        setIsMultiplayerLobbyOpen(true);
      }
    }
  }, []);

  // Listen for destination & difficulty switch in route params e.g. #/mission?dest=mars&diff=CADET
  useEffect(() => {
    if (route === 'mission') {
      if (params.dest) {
        const targetDest = params.dest.toUpperCase() === 'MARS' ? 'MARS' : 'MOON';
        if (gameState.destination !== targetDest) {
          handleSwitchOutpostDestination(targetDest);
        }
      }
      if (params.diff) {
        const targetDiff = params.diff.toUpperCase() as DifficultyMode;
        if (gameState.difficultyMode !== targetDiff) {
          handleSelectDifficulty(targetDiff);
        }
      }
    }
  }, [route, params.dest, params.diff]);

  const triggerScreenShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 460);
  };

  // Event Audio Triggers
  useEffect(() => {
    if (!gameState.activeEvent) return;
    if (gameState.activeEvent.urgency === 'CRITICAL') {
      soundFx.playAlarm();
      triggerScreenShake();
    } else if (gameState.activeEvent.id === 'sol-20-meteoroid-strike') {
      soundFx.playImpact();
      triggerScreenShake();
    } else if (gameState.activeEvent.id === 'sol-24-ice-core-breakthrough') {
      soundFx.playTelemetryChirp();
    }
  }, [gameState.activeEvent?.id]);

  const handleSelectDifficulty = (mode: DifficultyMode) => {
    const newDeck = getMissionScenarioDeck(currentMission, mode as DifficultyTier);
    const currentSol = gameState.activeEvent ? gameState.activeEvent.sol : gameState.currentSol;
    const matchedEvent = newDeck.find((e) => e.sol === currentSol) || newDeck[0];
    setGameState((prev) => ({
      ...prev,
      difficultyMode: mode,
      activeEvent: prev.isGameOver ? prev.activeEvent : matchedEvent
    }));
  };

  const handleBuildModule = (spec: import('./data/outpostBalanceConfig').BuildableModuleSpec) => {
    setGameState((prev) => {
      const currentBP = prev.buildPoints ?? (prev.difficultyMode === 'CADET' ? 12 : 8);
      if (currentBP < spec.buildCostBP) return prev;

      const nextBP = currentBP - spec.buildCostBP;
      const nextRes = {
        ...prev.resources,
        power: Math.min(100, Math.max(0, prev.resources.power + (spec.statDeltas.power || 0))),
        oxygen: Math.min(100, Math.max(0, prev.resources.oxygen + (spec.statDeltas.oxygen || 0))),
        water: Math.min(100, Math.max(0, prev.resources.water + (spec.statDeltas.water || 0))),
        food: Math.max(0, prev.resources.food + (spec.statDeltas.food || 0)),
        shielding: Math.min(100, Math.max(0, (prev.resources.shielding ?? 70) + (spec.statDeltas.shielding || 0))),
        crewHealth: Math.min(100, Math.max(0, prev.resources.crewHealth + (spec.statDeltas.crewHealth || 0))),
        crewMorale: Math.min(100, Math.max(0, (prev.resources.crewMorale ?? 85) + (spec.statDeltas.crewMorale || 0))),
      };

      const nextState: GameState = {
        ...prev,
        buildPoints: nextBP,
        resources: nextRes,
        builtModules: [...(prev.builtModules || []), spec.id],
      };
      saveGameStateToStorage(nextState);
      return nextState;
    });
  };

  const handleSelectChoice = (choice: ChoiceOption) => {
    if (gameState.isGameOver || !gameState.activeEvent) return;

    const turnResult = computeDailySimulationTurn(gameState);

    const updatedResources = {
      power: Math.min(100, Math.max(0, turnResult.updatedResources.power + (choice.resourceDelta.power || 0))),
      water: Math.min(100, Math.max(0, turnResult.updatedResources.water + (choice.resourceDelta.water || 0))),
      oxygen: Math.min(100, Math.max(0, turnResult.updatedResources.oxygen + (choice.resourceDelta.oxygen || 0))),
      food: Math.max(0, turnResult.updatedResources.food + (choice.resourceDelta.food || 0)),
      radiation: Math.max(0, turnResult.updatedResources.radiation + (choice.resourceDelta.radiation || 0)),
      science: turnResult.updatedResources.science + (choice.resourceDelta.science || 0),
      crewHealth: Math.min(100, Math.max(0, turnResult.updatedResources.crewHealth + (choice.resourceDelta.crewHealth || 0))),
      crewMorale: Math.min(100, Math.max(0, (turnResult.updatedResources.crewMorale ?? 85) + (choice.resourceDelta.crewMorale || 0))),
      shielding: Math.min(100, Math.max(0, (turnResult.updatedResources.shielding ?? 70) + (choice.resourceDelta.shielding || 0))),
    };

    const historyEntry: SolHistoryEntry = {
      sol: gameState.currentSol,
      eventTitle: gameState.activeEvent.title,
      chosenOption: choice,
      resourcesSnapshot: updatedResources,
      chainReactionNote: choice.educationalInsight
    };

    const newHistory = [...gameState.history, historyEntry];

    let isGameOver = turnResult.isGameOver;
    let outcome: 'IN_PROGRESS' | 'VICTORY' | 'CRITICAL_FAILURE' = turnResult.outcome === 'PARTIAL_SUCCESS' ? 'VICTORY' : turnResult.outcome;
    let endingScenarioId = turnResult.endingScenarioId;

    if (
      updatedResources.oxygen <= 0 ||
      updatedResources.power <= 0 ||
      updatedResources.water <= 0 ||
      updatedResources.radiation >= 100 ||
      updatedResources.crewHealth <= 0 ||
      (updatedResources.crewMorale ?? 85) <= 0
    ) {
      isGameOver = true;
      outcome = 'CRITICAL_FAILURE';
      if (updatedResources.oxygen <= 0) endingScenarioId = 'DEPRESSURIZATION_HYPOXIA';
      else if (updatedResources.power <= 0) endingScenarioId = 'LIFE_SUPPORT_FREEZE';
      else if (updatedResources.water <= 0) endingScenarioId = 'DESICCATION_DEHYDRATION';
      else if (updatedResources.radiation >= 100) endingScenarioId = 'RADIATION_CASUALTY';
      else endingScenarioId = 'CREW_MORALE_COLLAPSE';
    }

    if (choice.id === 'opt-magnetic-shield' || choice.id.includes('shield')) {
      soundFx.playShieldHum();
      setIsShieldActive(true);
    } else if (choice.id === 'opt-spin-up-kilopower' || choice.id === 'opt-kilopower') {
      soundFx.playReactorStart();
    } else if (choice.id.includes('ice') || choice.id.includes('science')) {
      soundFx.playTelemetryChirp();
    } else {
      soundFx.playClick(680);
    }

    const currentDeck = getMissionScenarioDeck(currentMission, gameState.difficultyMode as DifficultyTier);
    const nextEventIndex = currentDeck.findIndex((e) => e.id === gameState.activeEvent?.id) + 1;
    const nextEvent = currentDeck[nextEventIndex] || null;

    if (!isGameOver && !nextEvent) {
      isGameOver = true;
      outcome = 'VICTORY';
      endingScenarioId = updatedResources.crewHealth >= 75 && (updatedResources.crewMorale ?? 85) >= 70 ? 'GOLDEN_TRIUMPH' : 'SURVIVAL_VICTORY';
    }

    setLastConsequence({
      narrative: choice.consequenceNarrative,
      insight: choice.educationalInsight,
      choiceTitle: choice.title
    });

    const nextBP = (gameState.buildPoints ?? 8) + turnResult.buildPointsEarned;

    setGameState((prev) => ({
      ...prev,
      resources: updatedResources,
      currentSol: nextEvent ? nextEvent.sol : prev.totalSols,
      activeEvent: nextEvent,
      history: newHistory,
      objectives: turnResult.updatedObjectives,
      netPowerKw: turnResult.telemetry.netPowerKw,
      buildPoints: nextBP,
      activeWarning: turnResult.activeWarning,
      endingScenarioId,
      isGameOver,
      gameOutcome: outcome,
    }));
  };

  const handleRestart = () => {
    setGameState(INITIAL_GAME_STATE);
    saveGameStateToStorage(INITIAL_GAME_STATE);
    setLastConsequence(null);
    soundFx.playReactorStart();
  };

  const handleSwitchOutpostDestination = (dest: 'MOON' | 'MARS', diff?: DifficultyMode, cargoId?: string) => {
    const targetMission = dest === 'MARS' ? MARS_JEZERO_BASE_MISSION : ARTEMIS_LUNAR_BASE_MISSION;
    setCurrentMission(targetMission);
    const chosenDifficulty = diff || gameState.difficultyMode || 'CADET';
    const diffKey: 'CADET' | 'OFFICER' | 'COMMANDER' =
      chosenDifficulty === 'CADET' || (chosenDifficulty as any) === 'EXPLORER'
        ? 'CADET'
        : chosenDifficulty === 'COMMANDER' || (chosenDifficulty as any) === 'SCIENTIST'
          ? 'COMMANDER'
          : 'OFFICER';
    const diffProfile = DIFFICULTY_PROFILES[diffKey];
    const missionDeck = getMissionScenarioDeck(targetMission, chosenDifficulty as DifficultyTier);
    const initialObjectives = generateMissionObjectives(dest);
    const config = dest === 'MARS' ? DEFAULT_MARS_OUTPOST : DEFAULT_LUNAR_OUTPOST;

    let powerBonus = 0;
    let waterBonus = 0;
    let foodBonus = 0;
    let shieldBonus = 0;

    if (cargoId === 'battery') powerBonus = 20;
    else if (cargoId === 'water_filter' || cargoId === 'water') waterBonus = 20;
    else if (cargoId === 'seed_vault' || cargoId === 'food') foodBonus = 8;
    else if (cargoId === 'regolith_shield' || cargoId === 'shield') shieldBonus = 15;

    const nextState: GameState = {
      destination: dest,
      difficultyMode: chosenDifficulty,
      currentSol: 1,
      totalSols: dest === 'MARS' ? 40 : 30,
      buildPoints: diffProfile.initialBuildPoints,
      resources: {
        power: Math.min(100, diffProfile.startingResources.power + powerBonus),
        water: Math.min(100, diffProfile.startingResources.water + waterBonus),
        oxygen: diffProfile.startingResources.oxygen,
        food: (dest === 'MARS' ? diffProfile.startingResources.food + 6 : diffProfile.startingResources.food) + foodBonus,
        radiation: dest === 'MARS' ? 8 : 12,
        science: diffProfile.startingResources.science,
        crewHealth: diffProfile.startingResources.crewHealth,
        crewMorale: Math.min(100, (diffProfile.startingResources.crewMorale ?? 90) + CREW_SPECIALTY_BONUSES.COMMANDER.moraleBonusPct),
        shielding: Math.min(100, diffProfile.startingResources.shielding + shieldBonus),
      },
      modules: {
        habitat: { status: 'NOMINAL', lifeSupportLoadKw: 12 },
        powerStation: { status: 'NOMINAL', activeSource: 'SOLAR', currentOutputKw: 25 },
        greenhouse: { status: 'NOMINAL', growthCycleDays: 3, lightEfficiency: 85 },
        stormVault: { status: 'NOMINAL', isSealed: false, regolithShieldCm: 180 }
      },
      outpostConfig: config,
      objectives: initialObjectives,
      equipmentCondition: 100,
      netPowerKw: 15,
      activeEvent: missionDeck[0],
      history: [],
      isGameOver: false,
      gameOutcome: 'IN_PROGRESS'
    };

    setGameState(nextState);
    saveGameStateToStorage(nextState);
    setLastConsequence(null);
    soundFx.playReactorStart();
  };

  const handleLaunchMissionGame = (missionId: string) => {
    setActiveMissionGameId(missionId);
    soundFx.playClick(900);
  };

  const handleCompleteMission = (missionId: string, score: number) => {
    setCompletedMissions((prev) => {
      if (prev.includes(missionId)) return prev;
      const next = [...prev, missionId];
      try { localStorage.setItem('astro_camp_completed_missions', JSON.stringify(next)); } catch {}
      return next;
    });

    if (currentUser) {
      const updatedUser = authService.recordMissionComplete(currentUser.id, missionId, 200);
      if (updatedUser) setCurrentUser(updatedUser);
    }
    soundFx.playTelemetryChirp();
  };

  const handleConfirmConstruction = (config: OutpostConfiguration) => {
    setIsConstructionModalOpen(false);
    const missionDeck = getMissionScenarioDeck(currentMission, gameState.difficultyMode as DifficultyTier);
    const initialObjectives = generateMissionObjectives(currentMission.destination === 'MARS' ? 'MARS' : 'MOON');

    const startingResources = {
      power: config.energyStorage === 'KILOPOWER_REACTOR' ? 90 : 75,
      water: config.waterRecycling === 'THERMO_ELECTRIC_MEMBRANE' ? 95 : 80,
      oxygen: 90,
      food: config.greenhouse === 'FULL_CROP_BIOME' ? 35 : 24,
      radiation: config.radiationShielding === 'SINTERED_REGOLITH_VAULT' ? 5 : 12,
      science: 10,
      crewHealth: 95
    };

    const nextState: GameState = {
      ...INITIAL_GAME_STATE,
      destination: (currentMission.destination === 'MARS' ? 'MARS' : 'MOON') as 'MOON' | 'MARS',
      difficultyMode: gameState.difficultyMode,
      currentSol: 1,
      totalSols: currentMission.destination === 'MARS' ? 40 : 30,
      resources: startingResources,
      outpostConfig: config,
      objectives: initialObjectives,
      activeEvent: missionDeck[0],
      history: [],
      isGameOver: false,
      gameOutcome: 'IN_PROGRESS',
    };

    setGameState(nextState);
    saveGameStateToStorage(nextState);
    navigate('simulators');
    soundFx.playReactorStart();
  };

  const handleCompleteRoverEVA = (earnedScience: number, earnedXp: number, summary: string) => {
    setGameState((prev) => {
      const nextResources = {
        ...prev.resources,
        science: prev.resources.science + earnedScience,
      };
      const roverOption: ChoiceOption = {
        id: `rover-eva-sol-${prev.currentSol}`,
        title: 'Surface Rover EVA Exploration Run',
        description: summary,
        tradeOffText: `Harvested volatile ice and rock samples (+${earnedScience} Science, +${earnedXp} XP)`,
        resourceDelta: { science: earnedScience },
        consequenceNarrative: `Rover successfully traversed ${currentMission.destinationName}, drilling core samples and returning telemetry to base.`,
        educationalInsight: `Planetary rovers serve as mobile field laboratories, extending the scientific reach of human outposts into cryogenic permanently shadowed regions.`
      };
      const historyEntry: SolHistoryEntry = {
        sol: prev.currentSol,
        eventTitle: `Sol ${prev.currentSol}: Surface Rover Exploration Sortie`,
        chosenOption: roverOption,
        resourcesSnapshot: nextResources,
        chainReactionNote: roverOption.educationalInsight,
      };
      const nextState: GameState = {
        ...prev,
        resources: nextResources,
        history: [...prev.history, historyEntry],
      };
      saveGameStateToStorage(nextState);
      return nextState;
    });
    soundFx.playTelemetryChirp();
  };

  const handleActivateJudgeMode = () => {
    setIsJudgeMode(true);
    try { localStorage.setItem('astro_camp_judge_mode', 'true'); } catch {}
    const allMissionIds = NASA_MISSIONS.map(m => m.id);
    setCompletedMissions(allMissionIds);
    try { localStorage.setItem('astro_camp_completed_missions', JSON.stringify(allMissionIds)); } catch {}
  };

  const handleDeactivateJudgeMode = () => {
    setIsJudgeMode(false);
    try { localStorage.removeItem('astro_camp_judge_mode'); } catch {}
  };

  const renderActivePage = () => {
    switch (route) {
      case 'home':
        return (
          <GameLandingHomePage
            onNavigate={navigate}
            hasSavedGame={!!savedGameInfo}
            savedGameSol={savedGameInfo?.currentSol}
            savedGameDest={savedGameInfo?.destination === 'MARS' ? 'Mars' : 'Moon'}
            currentUser={currentUser}
            onUserUpdate={setCurrentUser}
            onOpenAuth={() => setIsAuthModalOpen(true)}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenHowToPlay={() => setIsHowToPlayOpen(true)}
            onOpenCertificate={() => setIsCertificateOpen(true)}
            isJudgeMode={isJudgeMode}
            onOpenJudgePreview={() => setIsJudgeModalOpen(true)}
            onOpenTelemetry={() => setIsTelemetryOpen(true)}
            onOpenScienceHub={() => setIsNasaDataOpen(true)}
            onOpenCredits={() => setIsAboutOpen(true)}
            onOpenCharacterLocker={() => setIsCharacterModalOpen(true)}
            onOpenLiveActivity={() => setIsLiveActivityModalOpen(true)}
            onOpenMultiplayerLobby={() => setIsMultiplayerLobbyOpen(true)}
            onStartMission={() => setIsConstructionModalOpen(true)}
            onBuildOutpost={(dest, diff, cargoId) => {
              handleSwitchOutpostDestination(dest, diff, cargoId);
              navigate('mission');
            }}
            onContinueMission={() => {
              const saved = loadGameStateFromStorage() || savedGameInfo;
              if (saved) setGameState(saved);
              navigate('simulators');
            }}
          />
        );

      case 'explore':
        return (
          <ExploreSpacePage
            onNavigate={navigate}
            hasSavedGame={!!savedGameInfo}
            savedGameSol={savedGameInfo?.currentSol}
            savedGameDest={savedGameInfo?.destination === 'MARS' ? 'Mars' : 'Moon'}
            currentUser={currentUser}
            onUserUpdate={setCurrentUser}
            onOpenAuth={() => setIsAuthModalOpen(true)}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenHowToPlay={() => setIsHowToPlayOpen(true)}
            onOpenCertificate={() => setIsCertificateOpen(true)}
            isJudgeMode={isJudgeMode}
            onOpenJudgePreview={() => setIsJudgeModalOpen(true)}
            onOpenTelemetry={() => setIsTelemetryOpen(true)}
            onOpenScienceHub={() => setIsNasaDataOpen(true)}
            onOpenCredits={() => setIsAboutOpen(true)}
            onOpenCharacterLocker={() => setIsCharacterModalOpen(true)}
            onOpenLiveActivity={() => setIsLiveActivityModalOpen(true)}
            onOpenMultiplayerLobby={() => setIsMultiplayerLobbyOpen(true)}
            onStartMission={() => setIsConstructionModalOpen(true)}
            onBuildOutpost={(dest, diff) => {
              handleSwitchOutpostDestination(dest, diff);
              navigate('mission');
            }}
            onContinueMission={() => {
              const saved = loadGameStateFromStorage() || savedGameInfo;
              if (saved) setGameState(saved);
              navigate('simulators');
            }}
          />
        );

      case 'mission':
        return (
          <MissionControlPage
            gameState={gameState}
            currentMission={currentMission}
            lastConsequence={lastConsequence}
            is3DView={is3DView}
            onToggle3DView={setIs3DView}
            isTheaterMode={isTheaterMode}
            onToggleTheaterMode={setIsTheaterMode}
            isShieldActive={isShieldActive}
            isShaking={isShaking}
            onSelectChoice={handleSelectChoice}
            onSelectDifficulty={handleSelectDifficulty}
            onRestart={handleRestart}
            onNavigate={navigate}
            onOpenRoverEVA={() => navigate('simulators', { sim: 'rover' })}
            onOpenPlanetaryMap={() => setIsPlanetaryMapOpen(true)}
            onOpenOutpostConstruction={() => setIsConstructionModalOpen(true)}
            onSwitchDestination={handleSwitchOutpostDestination}
            onOpenAutopsyHelp={() => setIsHowToPlayOpen(true)}
            onBuildModule={handleBuildModule}
          />
        );

      case 'academy':
        return (
          <AstronautAcademyPage
            initialTab={params.tab || 'CURRICULUM'}
            completedMissions={completedMissions}
            onLaunchMission={handleLaunchMissionGame}
            onNavigate={navigate}
          />
        );

      case 'simulators':
        return (
          <SimulatorsHubPage
            initialSimulator={params.sim}
            onNavigate={navigate}
            onCompleteRoverMission={handleCompleteRoverEVA}
          />
        );

      case 'campaign':
        return (
          <MissionCampaignPage
            completedMissions={completedMissions}
            onLaunchMission={handleLaunchMissionGame}
            onNavigate={navigate}
          />
        );

      case 'learning':
        return (
          <LearningHubPage
            initialTab={(params.tab as any) || 'NOTEBOOK'}
            initialIssueId={params.issue}
            activeEvent={gameState.activeEvent}
            collectedFlashcards={collectedFlashcards}
            activeMissionId={currentMission.id}
            onLaunchMission={handleLaunchMissionGame}
            completedMissions={completedMissions}
            onOpenComicReader={(issueId) => navigate('learning', { tab: 'COMIC', issue: issueId || '' })}
            onNavigate={navigate}
          />
        );

      case 'teacher':
        return (
          <TeacherHubPage
            currentUser={currentUser}
            onOpenAuth={() => setIsAuthModalOpen(true)}
            onNavigate={navigate}
          />
        );

      default:
        return (
          <OrreryHomePage
            onNavigate={navigate}
            hasSavedGame={!!savedGameInfo}
            savedGameSol={savedGameInfo?.currentSol}
            savedGameDest={savedGameInfo?.destination === 'MARS' ? 'Mars' : 'Moon'}
            currentUser={currentUser}
            onUserUpdate={setCurrentUser}
            onOpenAuth={() => setIsAuthModalOpen(true)}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenHowToPlay={() => setIsHowToPlayOpen(true)}
            onOpenCertificate={() => setIsCertificateOpen(true)}
            isJudgeMode={isJudgeMode}
            onOpenJudgePreview={() => setIsJudgeModalOpen(true)}
            onOpenTelemetry={() => setIsTelemetryOpen(true)}
            onOpenScienceHub={() => setIsNasaDataOpen(true)}
            onOpenCredits={() => setIsAboutOpen(true)}
            onOpenCharacterLocker={() => setIsCharacterModalOpen(true)}
            onOpenLiveActivity={() => setIsLiveActivityModalOpen(true)}
            onOpenMultiplayerLobby={() => setIsMultiplayerLobbyOpen(true)}
          />
        );
    }
  };

  return (
    <div
      className="app-root-shell"
      style={{
        minHeight: '100vh',
        height: route === 'home' || route === 'mission' ? '100vh' : 'auto',
        overflow: route === 'home' || route === 'mission' ? 'hidden' : 'visible',
        background: 'var(--color-space-950, #04070e)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      
      {/* Universal Quiet Aerospace Navigation Bar (Hidden during full-immersion Outpost Mission) */}
      {route !== 'mission' && (
        <GlobalNavBar
          currentRoute={route}
          onNavigate={navigate}
          currentUser={currentUser}
          onOpenAuth={() => setIsAuthModalOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenHowToPlay={() => setIsHowToPlayOpen(true)}
          onOpenCertificate={() => setIsCertificateOpen(true)}
          isJudgeMode={isJudgeMode}
          onOpenJudgePreview={() => setIsJudgeModalOpen(true)}
          completedMissionsCount={completedMissions.length}
          onOpenTelemetry={() => setIsTelemetryOpen(true)}
          onOpenPlanetaryMap={() => setIsPlanetaryMapOpen(true)}
          onOpenNasaData={() => setIsNasaDataOpen(true)}
          onOpenAIDisclosure={() => setIsAIModalOpen(true)}
          onOpenAbout={() => setIsAboutOpen(true)}
          onOpenMultiplayerLobby={() => setIsMultiplayerLobbyOpen(true)}
        />
      )}

      {/* Main Page Area Mounted via URL Router */}
      <main style={{ flex: 1, position: 'relative', paddingTop: route === 'mission' ? 0 : 'var(--header-height, 56px)' }}>
        <Suspense fallback={<PageFallback />}>
          {renderActivePage()}
        </Suspense>
      </main>

      {/* Global Transient Utility Dialogs */}
      <Suspense fallback={null}>
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          currentUser={currentUser}
          onAuthChange={setCurrentUser}
          onOpenTeacherDossier={() => navigate('teacher')}
          onOpenCharacterLocker={() => {
            setIsAuthModalOpen(false);
            setIsCharacterModalOpen(true);
          }}
          onOpenLiveActivity={() => {
            setIsAuthModalOpen(false);
            setIsLiveActivityModalOpen(true);
          }}
        />

        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          is3DView={is3DView}
          onToggle3DView={setIs3DView}
          onResetAllData={() => {
            setGameState(INITIAL_GAME_STATE);
            setSavedGameInfo(null);
          }}
        />

        <HowToPlayModal
          isOpen={isHowToPlayOpen}
          onClose={() => setIsHowToPlayOpen(false)}
        />

        <FlightCertificateModal
          isOpen={isCertificateOpen}
          onClose={() => setIsCertificateOpen(false)}
          cadetName={currentUser?.username || 'Junior Astronaut'}
          completedMissions={completedMissions}
          currentMissionName={currentMission.name}
        />

        <JudgePreviewBadge isActive={isJudgeMode} onActivate={handleActivateJudgeMode} />
        <JudgePreviewModal
          isOpen={isJudgeModalOpen}
          onClose={() => setIsJudgeModalOpen(false)}
          onActivate={handleActivateJudgeMode}
          isJudgeMode={isJudgeMode}
          onDeactivate={handleDeactivateJudgeMode}
        />

        <NasaTelemetryPanel
          isOpen={isTelemetryOpen}
          onClose={() => setIsTelemetryOpen(false)}
        />

        <AboutModal
          isOpen={isAboutOpen}
          onClose={() => setIsAboutOpen(false)}
        />

        <AIDisclosureModal
          isOpen={isAIModalOpen}
          onClose={() => setIsAIModalOpen(false)}
        />

        <NasaDataModal
          isOpen={isNasaDataOpen}
          onClose={() => setIsNasaDataOpen(false)}
        />

        <AstronautCharacterModal
          isOpen={isCharacterModalOpen}
          onClose={() => setIsCharacterModalOpen(false)}
          currentUser={currentUser}
          onUserUpdate={setCurrentUser}
        />

        <LiveMissionActivityModal
          isOpen={isLiveActivityModalOpen}
          onClose={() => setIsLiveActivityModalOpen(false)}
          currentUsername={currentUser?.username}
        />

        <OutpostConstructionModal
          isOpen={isConstructionModalOpen}
          destination={currentMission.destination === 'MARS' ? 'MARS' : 'MOON'}
          initialConfig={gameState.outpostConfig}
          onConfirm={handleConfirmConstruction}
          onCancel={() => setIsConstructionModalOpen(false)}
        />

        <PlanetaryCommandMap
          isOpen={isPlanetaryMapOpen}
          onClose={() => setIsPlanetaryMapOpen(false)}
          onSelectMission={(m) => {
            setSelectedBriefingMission(m);
            setIsBriefingModalOpen(true);
            setIsPlanetaryMapOpen(false);
          }}
          activeMissionId={currentMission.id}
        />

        {selectedBriefingMission && (
          <AstronautBriefingModal
            isOpen={isBriefingModalOpen}
            onClose={() => setIsBriefingModalOpen(false)}
            mission={selectedBriefingMission}
            onLaunchMission={(m) => {
              setIsBriefingModalOpen(false);
              if (m.id === 'NASA-M049' || (m.destination === 'MOON' && m.era === 'ARTEMIS_ERA')) {
                handleSwitchOutpostDestination('MOON');
                navigate('simulators', { sim: 'moonbase' });
              } else if (m.id === 'NASA-M057' || m.id === 'NASA-M075' || (m.destination === 'MARS' && m.era === 'MARS_FLEET')) {
                handleSwitchOutpostDestination('MARS');
                navigate('simulators', { sim: 'mars-edl' });
              } else {
                handleLaunchMissionGame(m.id);
              }
            }}
          />
        )}

        <MultiplayerLobbyModal
          isOpen={isMultiplayerLobbyOpen}
          onClose={() => setIsMultiplayerLobbyOpen(false)}
          onLaunchMission={(missionId, role) => {
            setIsMultiplayerLobbyOpen(false);
            setIsCoopActive(true);
            setCoopRole(role);
            setActiveMissionGameId(missionId);
          }}
        />

        {activeMissionGameId && (
          <MissionGameModal
            missionId={activeMissionGameId}
            onClose={() => {
              setActiveMissionGameId(null);
              setIsCoopActive(false);
            }}
            onCompleteMission={handleCompleteMission}
            onSelectNextMission={(nextId) => setActiveMissionGameId(nextId)}
            completedMissions={completedMissions}
            isCoopMode={isCoopActive}
            coopRole={coopRole}
            onOpenMoonquakeMap={() => navigate('simulators', { sim: 'moonquake' })}
            onOpenLobby={() => {
              setActiveMissionGameId(null);
              setIsMultiplayerLobbyOpen(true);
            }}
            onExitToLobby={() => {
              setActiveMissionGameId(null);
              setIsCoopActive(false);
              setIsMultiplayerLobbyOpen(true);
            }}
          />
        )}

        {isFlashcardOpen && activeFlashcard && (
          <AudioTeachingFlashcard
            card={activeFlashcard}
            isOpen={isFlashcardOpen}
            onClose={() => setIsFlashcardOpen(false)}
            tier={gameState.difficultyMode as DifficultyTier}
            onSaveToNotebook={(card: TeachingFlashcard) => {
              if (!collectedFlashcards.some(c => c.id === card.id)) {
                setCollectedFlashcards(prev => [...prev, card]);
              }
            }}
          />
        )}
      </Suspense>

      {/* Global Aerospace Footer */}
      <footer className="main-footer" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', padding: '12px 20px', background: '#03050c' }}>
        <div>
          <span>Jr_AstroCamp: Beyond Earth / <strong>NASA International Space Apps Challenge 2026</strong></span>
        </div>
        <div className="footer-credits">
          <span>By <strong>Team Mysterio</strong> / "Train. Build. Survive. Explore."</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
