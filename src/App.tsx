import React, { useState, useEffect } from 'react';
import type { GameState, ChoiceOption, SolHistoryEntry, DifficultyMode } from './types/game';
import type { DifficultyTier } from './data/difficultyTiers';
import { getMissionScenarioDeck } from './utils/missionScenarioEngine';
import { NASA_MISSIONS, type NasaMission } from './data/nasaMissions';
import { TEACHING_FLASHCARDS, type TeachingFlashcard } from './data/teachingFlashcards';
import { LandingPage } from './components/LandingPage';
import { LearningHubModal } from './components/LearningHubModal';
import { AboutModal } from './components/AboutModal';
import { ViewportToggle } from './components/ViewportToggle';
import { ResourceHUD } from './components/ResourceHUD';
import { OutpostMap } from './components/OutpostMap';
import { Outpost3DView } from './components/Outpost3DView';
import { ErrorBoundary } from './components/ErrorBoundary';
import { CinematicScene } from './components/CinematicScene';
import { MissionAutopsy } from './components/MissionAutopsy';
import { NasaDataModal } from './components/NasaDataModal';
import { TeacherDossierModal } from './components/TeacherDossierModal';
import { TeacherGradebookModal } from './components/TeacherGradebookModal';
import { AIDisclosureModal } from './components/AIDisclosureModal';
import { PlanetaryCommandMap } from './components/PlanetaryCommandMap';
import { AstronautBriefingModal } from './components/AstronautBriefingModal';
import { AudioTeachingFlashcard } from './components/AudioTeachingFlashcard';
import { MissionNotebookModal } from './components/MissionNotebookModal';
import { MissionGameModal } from './components/MissionGameModal';
import { MissionCampaignModal } from './components/MissionCampaignModal';
import { ComicBookModal } from './components/ComicBookModal';
import { OutpostConstructionModal } from './components/OutpostConstructionModal';
import { AstronautAcademyModal } from './components/AstronautAcademyModal';
import { RealisticTrainingCenterModal } from './components/RealisticTrainingCenterModal';
import { RoverExplorationModal } from './components/RoverExplorationModal';
import { SettingsModal } from './components/SettingsModal';
import { HowToPlayModal } from './components/HowToPlayModal';
import { AcademyDepotModal } from './components/AcademyDepotModal';
import { AstronautClassroomModal } from './components/AstronautClassroomModal';
import { AuthModal } from './components/AuthModal';
import { authService } from './utils/authService';
import type { User } from './types/auth';
import { JudgePreviewBadge, JudgePreviewModal } from './components/JudgePreviewMode';
import { NasaTelemetryPanel } from './components/NasaTelemetryPanel';
import { FlightCertificateModal } from './components/FlightCertificateModal';
import { SolarSystemOrreryModal } from './components/SolarSystemOrreryModal';
import { MarsEDLSimulatorModal } from './components/MarsEDLSimulatorModal';
import { AstronautCharacterModal } from './components/AstronautCharacterModal';
import { LiveMissionActivityModal } from './components/LiveMissionActivityModal';
import { MultiplayerLobbyModal } from './components/MultiplayerLobbyModal';
import { MoonbaseAlphaSimulator } from './components/MoonbaseAlphaSimulator';
import { BlackHoleSimulator } from './components/BlackHoleSimulator';
import { MoonquakeMapModal } from './components/MoonquakeMapModal';
import { EarthToMoonExpeditionModal } from './components/EarthToMoonExpeditionModal';
import { SpaceGamesHubModal } from './components/SpaceGamesHubModal';
import { spaceMusicEngine } from './utils/spaceMusicEngine';
import { studentActivityService } from './utils/studentActivityService';
import {
  computeDailySimulationTurn,
  saveGameStateToStorage,
  loadGameStateFromStorage,
  DEFAULT_LUNAR_OUTPOST,
  generateMissionObjectives,
} from './utils/simulationEngine';
import type { OutpostConfiguration } from './types/game';
import { soundFx } from './utils/audioEffects';
import { speechEngine } from './utils/speechEngine';
import {
  Rocket,
  Database,
  GraduationCap,
  Bot,
  RotateCcw,
  ChevronRight,
  AlertTriangle,
  Sparkles,
  Volume2,
  VolumeX,
  Compass,
  BookOpen,
  Activity,
  Users,
  Home,
  Gamepad2,
  Award,
  Zap,
  Eye,
  Menu,
  X,
  Sliders,
  Scale,
  Building2,
  Flame,
} from 'lucide-react';

const INITIAL_GAME_STATE: GameState = {
  destination: 'MOON',
  difficultyMode: 'CADET',
  currentSol: 1,
  totalSols: 30,
  resources: {
    power: 75,
    water: 80,
    oxygen: 90,
    food: 24,
    radiation: 12,
    science: 10,
    crewHealth: 95
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
  activeEvent: getMissionScenarioDeck(NASA_MISSIONS[0], 'CADET')[0],
  history: [],
  isGameOver: false,
  gameOutcome: 'IN_PROGRESS'
};

export const App: React.FC = () => {
  const [hasLaunched, setHasLaunched] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('astro_camp_launched') === 'true';
    }
    return false;
  });
  const [gameState, setGameState] = useState<GameState>(() => {
    const saved = loadGameStateFromStorage();
    return saved || INITIAL_GAME_STATE;
  });
  const [lastConsequence, setLastConsequence] = useState<{
    narrative: string;
    insight: string;
    choiceTitle: string;
    choiceOption?: ChoiceOption;
  } | null>(null);

  // Active Mission & Multi-World
  const [currentMission, setCurrentMission] = useState<NasaMission>(NASA_MISSIONS[0]);
  const [isPlanetaryMapOpen, setIsPlanetaryMapOpen] = useState(false);
  const [isBriefingModalOpen, setIsBriefingModalOpen] = useState(false);
  const [selectedBriefingMission, setSelectedBriefingMission] = useState<NasaMission | null>(null);

  // Flashcards & Notebook
  const [activeFlashcard, setActiveFlashcard] = useState<TeachingFlashcard | null>(null);
  const [isFlashcardOpen, setIsFlashcardOpen] = useState(false);
  const [isNotebookOpen, setIsNotebookOpen] = useState(false);
  const [collectedFlashcards, setCollectedFlashcards] = useState<TeachingFlashcard[]>([TEACHING_FLASHCARDS[0]]);

  // Viewport mode: 3D Simulator vs 2D Schematic
  const [is3DView, setIs3DView] = useState(true);
  const [isTheaterMode, setIsTheaterMode] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isShieldActive, setIsShieldActive] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  // New Astro Camp Modals & Activities
  const [isConstructionModalOpen, setIsConstructionModalOpen] = useState(false);
  const [isAcademyModalOpen, setIsAcademyModalOpen] = useState(false);
  const [isTrainingCenterOpen, setIsTrainingCenterOpen] = useState(false);
  const [isRoverModalOpen, setIsRoverModalOpen] = useState(false);
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDepotOpen, setIsDepotOpen] = useState(false);
  const [isClassroomOpen, setIsClassroomOpen] = useState(false);
  const [savedGameInfo, setSavedGameInfo] = useState<GameState | null>(loadGameStateFromStorage);

  const [isLearningHubOpen, setIsLearningHubOpen] = useState(false);
  const [learningHubInitialTab, setLearningHubInitialTab] = useState<'NOTEBOOK' | 'AUDIO' | 'VIDEO' | 'COMIC' | 'BRIEFINGS' | 'CATALOG'>('NOTEBOOK');
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isComicBookOpen, setIsComicBookOpen] = useState(false);
  const [selectedComicIssueId, setSelectedComicIssueId] = useState<string | undefined>(undefined);

  // General Modals
  const [isNasaModalOpen, setIsNasaModalOpen] = useState(false);
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(() => authService.getCurrentUser());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(() => {
    try {
      if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('guest')) return false;
    } catch {}
    return !authService.getCurrentUser();
  });
  const [isCharacterModalOpen, setIsCharacterModalOpen] = useState(false);
  const [isLiveActivityModalOpen, setIsLiveActivityModalOpen] = useState(false);
  const [isJudgeMode, setIsJudgeMode] = useState(() => {
    try { return localStorage.getItem('astro_camp_judge_mode') === 'true'; } catch { return false; }
  });
  const [isJudgeModalOpen, setIsJudgeModalOpen] = useState(false);
  const [isTelemetryOpen, setIsTelemetryOpen] = useState(false);
  const [isCertificateOpen, setIsCertificateOpen] = useState(false);
  const [isOrreryOpen, setIsOrreryOpen] = useState(false);
  const [isMarsEDLOpen, setIsMarsEDLOpen] = useState(false);
  const [isMoonbaseAlphaOpen, setIsMoonbaseAlphaOpen] = useState(false);
  const [isBlackHoleOpen, setIsBlackHoleOpen] = useState(false);
  const [isMoonquakeMapOpen, setIsMoonquakeMapOpen] = useState(false);
  const [isExpeditionOpen, setIsExpeditionOpen] = useState(false);
  const [isSpaceGamesHubOpen, setIsSpaceGamesHubOpen] = useState(false);
  const [isMusicMuted, setIsMusicMuted] = useState(() => spaceMusicEngine.getIsMuted());
  const [isHubDropdownOpen, setIsHubDropdownOpen] = useState(false);
  const [isToolsDropdownOpen, setIsToolsDropdownOpen] = useState(false);

  // Auto-save game state to localStorage
  useEffect(() => {
    if (hasLaunched && !gameState.isGameOver) {
      saveGameStateToStorage(gameState);
      setSavedGameInfo(gameState);
    }
  }, [gameState, hasLaunched]);

  // 76 Playable NASA Mission Games State
  const [completedMissions, setCompletedMissions] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('astro_camp_completed_missions');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [activeMissionGameId, setActiveMissionGameId] = useState<string | null>(null);
  const [isCampaignMapOpen, setIsCampaignMapOpen] = useState(false);
  const [isMultiplayerLobbyOpen, setIsMultiplayerLobbyOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.has('room') || params.has('lobby');
    }
    return false;
  });
  const [initialRoomCode] = useState<string | undefined>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('room') || params.get('lobby') || undefined;
    }
    return undefined;
  });
  const [isCoopActive, setIsCoopActive] = useState(false);
  const [coopRole, setCoopRole] = useState<import('./utils/multiplayerMissionService').CrewRole>('CDR');

  const handleCompleteMission = (missionId: string, score: number) => {
    setCompletedMissions((prev) => {
      if (prev.includes(missionId)) return prev;
      const next = [...prev, missionId];
      try {
        localStorage.setItem('astro_camp_completed_missions', JSON.stringify(next));
      } catch (err) {
        console.warn('Failed to save completed mission', err);
      }
      return next;
    });

    const targetMission = NASA_MISSIONS.find((m) => m.id === missionId);
    const missionName = targetMission ? targetMission.name : `NASA Mission: ${missionId}`;
    const destination = targetMission?.destination === 'MARS' ? 'MARS' : 'MOON';

    if (currentUser) {
      studentActivityService.logActivity({
        studentUsername: currentUser.username,
        studentFullName: currentUser.fullName || currentUser.username,
        studentAvatar: currentUser.avatar,
        characterName: currentUser.selectedCharacterId || 'Neil Armstrong',
        actionType: 'MISSION_COMPLETED',
        missionTitle: missionName,
        destination: destination,
        durationSeconds: 210,
        scoreXp: score || 150,
        coinsEarned: 200,
        outcomeStatus: 'SUCCESS',
        notes: `Executed nominal spaceflight mission with score of ${score || 150}.`,
      });
      const updatedUser = authService.recordMissionComplete(currentUser.id, missionId, 200);
      if (updatedUser) setCurrentUser(updatedUser);
    }
    soundFx.playTelemetryChirp();
  };

  const handleLaunchMissionGame = (missionId: string) => {
    setActiveMissionGameId(missionId);
    soundFx.playClick(900);
  };

  const triggerScreenShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 460);
  };

  // Play sound when crisis event activates
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

  const handleOpenBriefing = (mission: NasaMission) => {
    setSelectedBriefingMission(mission);
    setIsBriefingModalOpen(true);
    setIsPlanetaryMapOpen(false);
  };

  const handleLaunchMission = (mission: NasaMission) => {
    setCurrentMission(mission);
    const missionDeck = getMissionScenarioDeck(mission, gameState.difficultyMode as DifficultyTier);
    setGameState((prev) => ({
      ...INITIAL_GAME_STATE,
      destination: (mission.destination === 'MARS' ? 'MARS' : 'MOON') as 'MOON' | 'MARS',
      difficultyMode: prev.difficultyMode,
      activeEvent: missionDeck[0]
    }));
    setLastConsequence(null);
    setIsBriefingModalOpen(false);
    setIsPlanetaryMapOpen(false);
  };

  const handleSaveFlashcard = (card: TeachingFlashcard) => {
    if (!collectedFlashcards.some((c) => c.id === card.id)) {
      setCollectedFlashcards((prev) => [...prev, card]);
    }
  };

  const handleOpenFlashcardForChoice = (choice?: ChoiceOption) => {
    let matchedCard = TEACHING_FLASHCARDS[0];
    if (choice) {
      if (choice.id.includes('shield') || choice.id.includes('vault')) {
        matchedCard = TEACHING_FLASHCARDS.find((c) => c.id === 'card-regolith-shielding') || TEACHING_FLASHCARDS[1];
      } else if (choice.id.includes('kilopower')) {
        matchedCard = TEACHING_FLASHCARDS.find((c) => c.id === 'card-kilopower') || TEACHING_FLASHCARDS[2];
      } else if (choice.id.includes('moxie') || currentMission.destination === 'MARS') {
        matchedCard = TEACHING_FLASHCARDS.find((c) => c.id === 'card-moxie') || TEACHING_FLASHCARDS[3];
      } else if (currentMission.destination === 'EUROPA') {
        matchedCard = TEACHING_FLASHCARDS.find((c) => c.id === 'card-ocean-habitability') || TEACHING_FLASHCARDS[4];
      } else if (choice.id.includes('laser') || choice.id.includes('downlink') || choice.id.includes('telemetry')) {
        matchedCard = TEACHING_FLASHCARDS.find((c) => c.id === 'card-laser-comm') || TEACHING_FLASHCARDS[5];
      }
    }
    setActiveFlashcard(matchedCard);
    setIsFlashcardOpen(true);
  };

  const handleSelectChoice = (choice: ChoiceOption) => {
    if (gameState.isGameOver || !gameState.activeEvent) return;

    // Calculate new resource balances
    const updatedResources = {
      power: Math.min(100, Math.max(0, gameState.resources.power + (choice.resourceDelta.power || 0))),
      water: Math.min(100, Math.max(0, gameState.resources.water + (choice.resourceDelta.water || 0))),
      oxygen: Math.min(100, Math.max(0, gameState.resources.oxygen + (choice.resourceDelta.oxygen || 0))),
      food: Math.max(0, gameState.resources.food + (choice.resourceDelta.food || 0)),
      radiation: Math.max(0, gameState.resources.radiation + (choice.resourceDelta.radiation || 0)),
      science: gameState.resources.science + (choice.resourceDelta.science || 0),
      crewHealth: Math.min(100, Math.max(0, gameState.resources.crewHealth + (choice.resourceDelta.crewHealth || 0)))
    };

    // Authoritative daily turn calculations
    const turnResult = computeDailySimulationTurn(gameState);

    // Store in history
    const historyEntry: SolHistoryEntry = {
      sol: gameState.currentSol,
      eventTitle: gameState.activeEvent.title,
      chosenOption: choice,
      resourcesSnapshot: updatedResources,
      chainReactionNote: choice.educationalInsight
    };

    const newHistory = [...gameState.history, historyEntry];

    // Check failure conditions
    let isGameOver = false;
    let outcome: 'IN_PROGRESS' | 'VICTORY' | 'CRITICAL_FAILURE' = 'IN_PROGRESS';
    let failureReason = '';

    if (updatedResources.oxygen <= 0) {
      isGameOver = true;
      outcome = 'CRITICAL_FAILURE';
      failureReason = 'Hypoxia: Atmospheric oxygen reserves completely exhausted.';
    } else if (updatedResources.power <= 0) {
      isGameOver = true;
      outcome = 'CRITICAL_FAILURE';
      failureReason = 'Catastrophic Freeze: Battery and surface power hit zero during the lunar night.';
    } else if (updatedResources.water <= 0) {
      isGameOver = true;
      outcome = 'CRITICAL_FAILURE';
      failureReason = 'Dehydration: Water recovery loops failed to supply minimum metabolic requirement.';
    } else if (updatedResources.radiation >= 100) {
      isGameOver = true;
      outcome = 'CRITICAL_FAILURE';
      failureReason = 'Acute Radiation Syndrome: Cumulative crew dosimeter exceeded safe biological ceiling (100 mSv).';
    } else if (updatedResources.crewHealth <= 0) {
      isGameOver = true;
      outcome = 'CRITICAL_FAILURE';
      failureReason = 'Medical Incapacitation: Crew vitals collapsed under compounded mission stresses.';
    }

    // Audio thrill effects
    if (choice.id === 'opt-magnetic-shield') {
      soundFx.playShieldHum();
      setIsShieldActive(true);
    } else if (choice.id === 'opt-spin-up-kilopower' || choice.id === 'opt-kilopower') {
      soundFx.playReactorStart();
    } else if (choice.id.includes('ice') || choice.id.includes('science')) {
      soundFx.playTelemetryChirp();
    } else {
      soundFx.playClick(680);
    }

    // Open flashcard for educational insight
    handleOpenFlashcardForChoice(choice);

    // Advance Sol and find next event in current mission scenario deck
    const currentDeck = getMissionScenarioDeck(currentMission, gameState.difficultyMode as DifficultyTier);
    const nextEventIndex = currentDeck.findIndex((e) => e.id === gameState.activeEvent?.id) + 1;
    const nextEvent = currentDeck[nextEventIndex] || null;

    if (!isGameOver && !nextEvent) {
      // Completed all authored events -> Victory if survived!
      isGameOver = true;
      outcome = 'VICTORY';
    }

    setLastConsequence({
      narrative: choice.consequenceNarrative,
      insight: choice.educationalInsight,
      choiceTitle: choice.title
    });

    setGameState((prev) => ({
      ...prev,
      resources: updatedResources,
      currentSol: nextEvent ? nextEvent.sol : prev.totalSols,
      activeEvent: nextEvent,
      history: newHistory,
      objectives: turnResult.updatedObjectives,
      netPowerKw: turnResult.telemetry.netPowerKw,
      isLunarNight: turnResult.telemetry.isLunarNight,
      isGameOver,
      gameOutcome: outcome,
      failureReason
    }));
  };

  const handleRestart = () => {
    const missionDeck = getMissionScenarioDeck(currentMission, gameState.difficultyMode as DifficultyTier);
    setGameState({
      ...INITIAL_GAME_STATE,
      destination: (currentMission.destination === 'MARS' ? 'MARS' : 'MOON') as 'MOON' | 'MARS',
      difficultyMode: gameState.difficultyMode,
      activeEvent: missionDeck[0]
    });
    setLastConsequence(null);
    setIsShieldActive(false);
  };

  const handleActivateJudgeMode = () => {
    setIsJudgeMode(true);
    try { localStorage.setItem('astro_camp_judge_mode', 'true'); } catch {}
    // Unlock all 76 missions
    const allMissionIds = NASA_MISSIONS.map(m => m.id);
    setCompletedMissions(allMissionIds);
    try { localStorage.setItem('astro_camp_completed_missions', JSON.stringify(allMissionIds)); } catch {}
  };

  const handleDeactivateJudgeMode = () => {
    setIsJudgeMode(false);
    try { localStorage.removeItem('astro_camp_judge_mode'); } catch {}
  };

  const closeAllModals = () => {
    setIsConstructionModalOpen(false);
    setIsAcademyModalOpen(false);
    setIsTrainingCenterOpen(false);
    setIsRoverModalOpen(false);
    setIsHowToPlayOpen(false);
    setIsSettingsOpen(false);
    setIsNasaModalOpen(false);
    setIsAboutOpen(false);
    setIsComicBookOpen(false);
    setIsLearningHubOpen(false);
    setIsFlashcardOpen(false);
    setIsNotebookOpen(false);
    setIsPlanetaryMapOpen(false);
    setIsBriefingModalOpen(false);
    setIsDepotOpen(false);
    setIsClassroomOpen(false);
    setIsTelemetryOpen(false);
    setIsCertificateOpen(false);
    setIsOrreryOpen(false);
    setIsMarsEDLOpen(false);
    setIsMoonbaseAlphaOpen(false);
    setIsBlackHoleOpen(false);
    setIsMoonquakeMapOpen(false);
    setIsExpeditionOpen(false);
    setIsSpaceGamesHubOpen(false);
    setIsCharacterModalOpen(false);
    setIsLiveActivityModalOpen(false);
    setIsMultiplayerLobbyOpen(false);
  };

  const handleStartNewMission = () => {
    closeAllModals();
    setIsConstructionModalOpen(true);
    soundFx.playClick(600);
  };

  const handleContinueMission = () => {
    const saved = loadGameStateFromStorage() || savedGameInfo;
    if (saved) {
      setGameState(saved);
    }
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('astro_camp_launched', 'true');
    }
    setHasLaunched(true);
    soundFx.playTelemetryChirp();
  };

  const handleConfirmConstruction = (config: OutpostConfiguration) => {
    setIsConstructionModalOpen(false);
    const missionDeck = getMissionScenarioDeck(currentMission, gameState.difficultyMode as DifficultyTier);
    const initialObjectives = generateMissionObjectives(currentMission.destination === 'MARS' ? 'MARS' : 'MOON');
    
    // Initial resources influenced by construction choices
    const startingResources = {
      power: config.energyStorage === 'KILOPOWER_REACTOR' ? 90 : 75,
      water: config.waterRecycling === 'THERMO_ELECTRIC_MEMBRANE' ? 95 : 80,
      oxygen: config.lifeSupport === 'CLOSED_LOOP_SABATIER' ? 98 : 90,
      food: config.greenhouse === 'FULL_CROP_BIOME' ? 35 : 24,
      radiation: config.radiationShielding === 'SINTERED_REGOLITH_VAULT' ? 5 : 12,
      science: config.communications === 'DEEP_SPACE_LASER_DSOC' ? 25 : 10,
      crewHealth: config.habitatType === 'HEAVY_REGOLITH_DOME' ? 98 : 95,
    };

    const nextState: GameState = {
      destination: (currentMission.destination === 'MARS' ? 'MARS' : 'MOON') as 'MOON' | 'MARS',
      difficultyMode: gameState.difficultyMode,
      currentSol: 1,
      totalSols: currentMission.destination === 'MARS' ? 40 : 30,
      resources: startingResources,
      modules: {
        habitat: { status: 'NOMINAL', lifeSupportLoadKw: config.habitatType === 'HEAVY_REGOLITH_DOME' ? 10 : 6 },
        powerStation: {
          status: 'NOMINAL',
          activeSource: config.energyStorage === 'KILOPOWER_REACTOR' ? 'KILOPOWER_NUCLEAR' : 'SOLAR',
          currentOutputKw: config.energyStorage === 'KILOPOWER_REACTOR' ? 25 : 35,
        },
        greenhouse: { status: 'NOMINAL', growthCycleDays: 3, lightEfficiency: config.greenhouse === 'FULL_CROP_BIOME' ? 95 : 85 },
        stormVault: {
          status: 'NOMINAL',
          isSealed: config.radiationShielding === 'SINTERED_REGOLITH_VAULT',
          regolithShieldCm: config.radiationShielding === 'SINTERED_REGOLITH_VAULT' ? 200 : 80,
        },
      },
      outpostConfig: config,
      objectives: initialObjectives,
      activeEvent: missionDeck[0],
      history: [],
      isGameOver: false,
      gameOutcome: 'IN_PROGRESS',
    };

    setGameState(nextState);
    saveGameStateToStorage(nextState);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('astro_camp_launched', 'true');
    }
    setHasLaunched(true);
    soundFx.playReactorStart();
  };

  const handleCompleteRoverEVA = (earnedScience: number, earnedXp: number, summary: string) => {
    setIsRoverModalOpen(false);
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

  const handleEnterMissionControl = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('astro_camp_launched', 'true');
    }
    setHasLaunched(true);
  };

  // Show landing page on first visit (placed safely after all hooks)
  if (!hasLaunched) {
    return (
      <>
        <LandingPage 
          onEnter={handleEnterMissionControl}
          onStartMission={handleStartNewMission}
          onContinueMission={handleContinueMission}
          hasSavedGame={!!savedGameInfo}
          savedGameSol={savedGameInfo?.currentSol}
          savedGameDest={savedGameInfo?.destination === 'MARS' ? 'Mars' : 'Moon'}
          onOpenAcademy={() => { closeAllModals(); setIsAcademyModalOpen(true); }}
          onOpenTrainingCenter={() => { closeAllModals(); setIsTrainingCenterOpen(true); }}
          onOpenRover={() => { closeAllModals(); setIsRoverModalOpen(true); }}
          onOpenHowToPlay={() => { closeAllModals(); setIsHowToPlayOpen(true); }}
          onOpenSettings={() => { closeAllModals(); setIsSettingsOpen(true); }}
          onOpenScienceHub={() => { closeAllModals(); setIsNasaModalOpen(true); }}
          onOpenCredits={() => { closeAllModals(); setIsAboutOpen(true); }}
          onOpenComics={() => {
            closeAllModals();
            setSelectedComicIssueId(undefined);
            setIsComicBookOpen(true);
            soundFx.playClick(750);
          }}
          onOpenLearningHub={(tab) => {
            closeAllModals();
            setLearningHubInitialTab(tab);
            setIsLearningHubOpen(true);
            soundFx.playClick(700);
          }}
          onOpenDepot={() => {
            closeAllModals();
            setIsDepotOpen(true);
            soundFx.playClick(800);
          }}
          onOpenClassroom={() => {
            closeAllModals();
            setIsClassroomOpen(true);
            soundFx.playClick(800);
          }}
          currentUser={currentUser}
          onUserUpdate={(u) => setCurrentUser(u)}
          onOpenAuth={() => {
            closeAllModals();
            setIsAuthModalOpen(true);
            soundFx.playClick(800);
          }}
          onOpenJudgePreview={() => {
            closeAllModals();
            setIsJudgeModalOpen(true);
            soundFx.playClick(900);
          }}
          onOpenTelemetry={() => {
            closeAllModals();
            setIsTelemetryOpen(true);
            soundFx.playTelemetryChirp();
          }}
          onOpenCertificate={() => {
            closeAllModals();
            setIsCertificateOpen(true);
            soundFx.playVictory();
          }}
          onOpenOrrery={() => {
            closeAllModals();
            setIsOrreryOpen(true);
            soundFx.playClick(850);
          }}
          onOpenMarsEDL={() => {
            closeAllModals();
            setIsMarsEDLOpen(true);
            soundFx.playReactorStart();
          }}
          onOpenMoonbaseAlpha={() => {
            closeAllModals();
            setIsMoonbaseAlphaOpen(true);
            soundFx.playReactorStart();
          }}
          onOpenBlackHole={() => {
            closeAllModals();
            setIsBlackHoleOpen(true);
            soundFx.playClick(850);
          }}
          onOpenExpedition={() => {
            closeAllModals();
            setIsExpeditionOpen(true);
            soundFx.playReactorStart();
          }}
          isJudgeMode={isJudgeMode}
          onOpenTeacherGradebook={() => {
            closeAllModals();
            setIsTeacherModalOpen(true);
            soundFx.playClick(850);
          }}
          onOpenCharacterLocker={() => {
            closeAllModals();
            setIsCharacterModalOpen(true);
            soundFx.playClick(850);
          }}
          onOpenLiveActivity={() => {
            closeAllModals();
            setIsLiveActivityModalOpen(true);
            soundFx.playTelemetryChirp();
          }}
          onOpenMultiplayerLobby={() => {
            closeAllModals();
            setIsMultiplayerLobbyOpen(true);
            soundFx.playClick(900);
          }}
          onOpenCampaign={() => {
            closeAllModals();
            setIsCampaignMapOpen(true);
            soundFx.playReactorStart();
          }}
          onOpenSpaceGamesHub={() => {
            closeAllModals();
            setIsSpaceGamesHubOpen(true);
            soundFx.playReactorStart();
          }}
        />
        {currentUser?.role === 'teacher' ? (
          <TeacherGradebookModal
            isOpen={isTeacherModalOpen}
            onClose={() => setIsTeacherModalOpen(false)}
            currentUser={currentUser}
          />
        ) : (
          <TeacherDossierModal
            isOpen={isTeacherModalOpen}
            onClose={() => setIsTeacherModalOpen(false)}
            currentUser={currentUser}
            onOpenAuth={() => setIsAuthModalOpen(true)}
          />
        )}
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          currentUser={currentUser}
          onAuthChange={(u) => setCurrentUser(u)}
          onOpenTeacherDossier={() => setIsTeacherModalOpen(true)}
          onOpenCharacterLocker={() => {
            setIsAuthModalOpen(false);
            setIsCharacterModalOpen(true);
          }}
          onOpenLiveActivity={() => {
            setIsAuthModalOpen(false);
            setIsLiveActivityModalOpen(true);
          }}
        />
        <AstronautCharacterModal
          isOpen={isCharacterModalOpen}
          onClose={() => setIsCharacterModalOpen(false)}
          currentUser={currentUser}
          onUserUpdate={(u) => setCurrentUser(u)}
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
        <MultiplayerLobbyModal
          isOpen={isMultiplayerLobbyOpen}
          onClose={() => setIsMultiplayerLobbyOpen(false)}
          onLaunchMission={(missionId, role) => {
            setIsMultiplayerLobbyOpen(false);
            setIsCoopActive(true);
            setCoopRole(role);
            setActiveMissionGameId(missionId);
          }}
          initialRoomCode={initialRoomCode}
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
            onOpenMoonquakeMap={() => setIsMoonquakeMapOpen(true)}
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
        <AstronautAcademyModal
          isOpen={isAcademyModalOpen || isCampaignMapOpen}
          initialTab={
            isCampaignMapOpen
              ? 'NASA_76_CAMPAIGN'
              : 'CURRICULUM'
          }
          onClose={() => {
            setIsAcademyModalOpen(false);
            setIsCampaignMapOpen(false);
          }}
          completedMissions={completedMissions}
          onLaunchMission={(missionId) => {
            setIsAcademyModalOpen(false);
            setIsCampaignMapOpen(false);
            handleLaunchMissionGame(missionId);
          }}
          onOpenComics={() => {
            setIsAcademyModalOpen(false);
            setSelectedComicIssueId(undefined);
            setIsComicBookOpen(true);
            soundFx.playClick(750);
          }}
          onOpenClassroom={() => {
            setIsAcademyModalOpen(false);
            setIsClassroomOpen(true);
            soundFx.playClick(800);
          }}
          onOpenDepot={() => {
            setIsAcademyModalOpen(false);
            setIsDepotOpen(true);
            soundFx.playClick(800);
          }}
        />
        <RealisticTrainingCenterModal
          isOpen={isTrainingCenterOpen}
          onClose={() => setIsTrainingCenterOpen(false)}
          onOpenClassroom={() => {
            closeAllModals();
            setIsClassroomOpen(true);
          }}
          onOpenAcademy={() => {
            closeAllModals();
            setIsAcademyModalOpen(true);
          }}
        />
        <RoverExplorationModal
          isOpen={isRoverModalOpen}
          onClose={() => setIsRoverModalOpen(false)}
          destinationName={currentMission.destinationName}
          isMoon={currentMission.destination !== 'MARS'}
          onCompleteRoverMission={handleCompleteRoverEVA}
        />
        <HowToPlayModal
          isOpen={isHowToPlayOpen}
          onClose={() => setIsHowToPlayOpen(false)}
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
        <NasaDataModal
          isOpen={isNasaModalOpen}
          onClose={() => setIsNasaModalOpen(false)}
        />
        <AboutModal
          isOpen={isAboutOpen}
          onClose={() => setIsAboutOpen(false)}
        />
        <ComicBookModal
          isOpen={isComicBookOpen}
          onClose={() => setIsComicBookOpen(false)}
          initialIssueId={selectedComicIssueId}
        />
        <LearningHubModal
          isOpen={isLearningHubOpen}
          onClose={() => setIsLearningHubOpen(false)}
          activeEvent={gameState.activeEvent}
          collectedFlashcards={collectedFlashcards}
          activeMissionId={currentMission.id}
          onLaunchMission={handleLaunchMissionGame}
          completedMissions={completedMissions}
          onOpenComicReader={(issueId) => {
            closeAllModals();
            setSelectedComicIssueId(issueId);
            setIsComicBookOpen(true);
          }}
          initialTab={learningHubInitialTab}
        />
        <MissionNotebookModal
          isOpen={isNotebookOpen}
          onClose={() => setIsNotebookOpen(false)}
          mission={currentMission}
          history={gameState.history}
          collectedFlashcards={collectedFlashcards}
          resources={gameState.resources}
        />
        <AcademyDepotModal
          isOpen={isDepotOpen}
          onClose={() => setIsDepotOpen(false)}
          onLaunchClassroom={() => {
            setIsDepotOpen(false);
            setIsClassroomOpen(true);
          }}
        />
        <AstronautClassroomModal
          isOpen={isClassroomOpen}
          onClose={() => setIsClassroomOpen(false)}
          onOpenDepot={() => {
            setIsClassroomOpen(false);
            setIsDepotOpen(true);
          }}
        />
        {/* Competition Polish: Judge Preview Mode */}
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
        <FlightCertificateModal
          isOpen={isCertificateOpen}
          onClose={() => setIsCertificateOpen(false)}
          cadetName={currentUser?.username || 'Junior Astronaut'}
          completedMissions={completedMissions}
          currentMissionName={currentMission.name}
        />
        <SolarSystemOrreryModal
          isOpen={isOrreryOpen}
          onClose={() => setIsOrreryOpen(false)}
        />
        <MarsEDLSimulatorModal
          isOpen={isMarsEDLOpen}
          onClose={() => setIsMarsEDLOpen(false)}
        />
        <MoonbaseAlphaSimulator
          isOpen={isMoonbaseAlphaOpen}
          onClose={() => setIsMoonbaseAlphaOpen(false)}
        />
        <BlackHoleSimulator
          isOpen={isBlackHoleOpen}
          onClose={() => setIsBlackHoleOpen(false)}
        />
        <MoonquakeMapModal
          isOpen={isMoonquakeMapOpen}
          onClose={() => setIsMoonquakeMapOpen(false)}
        />
        <EarthToMoonExpeditionModal
          isOpen={isExpeditionOpen}
          onClose={() => setIsExpeditionOpen(false)}
          onOpenMoonquakeMap={() => {
            setIsExpeditionOpen(false);
            setIsMoonquakeMapOpen(true);
          }}
        />
        <SpaceGamesHubModal
          isOpen={isSpaceGamesHubOpen}
          onClose={() => setIsSpaceGamesHubOpen(false)}
        />
      </>
    );
  }

  return (
    <div className={`app-shell ${isShaking ? 'shake-active' : ''}`}>
      {/* Top Navbar */}
      <header className="main-nav">
        <div className="nav-brand">
          <div className="brand-logo-glow">
            <Rocket size={20} className="text-emerald-400" />
          </div>
          <div>
            <div className="brand-title">JR_ASTROCAMP</div>
            <div className="brand-subtitle nav-subtitle-desktop">Junior Astronaut Mission Trainer · Team Mysterio · Space Apps 2026</div>
          </div>
        </div>

        {/* Kid-Friendly Age Tier Selector (Horizontal, never wrapping vertically) */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          padding: '3px 8px',
          borderRadius: '10px',
          background: 'rgba(15, 23, 42, 0.85)',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          flexShrink: 0,
        }} className="nav-desktop-only">
          <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', paddingRight: '4px' }}>
            Age:
          </span>
          <button
            onClick={() => handleSelectDifficulty('EXPLORER')}
            style={{
              padding: '4px 8px', borderRadius: '6px', border: 'none', cursor: 'pointer',
              background: gameState.difficultyMode === 'EXPLORER' ? '#059669' : 'transparent',
              color: gameState.difficultyMode === 'EXPLORER' ? '#ffffff' : '#34d399',
              fontSize: '11px', fontWeight: 800, fontFamily: 'var(--font-mono)',
            }}
            title="Junior Explorer (Ages 3–7)"
          >
            🧒 3–7
          </button>
          <button
            onClick={() => handleSelectDifficulty('CADET')}
            style={{
              padding: '4px 8px', borderRadius: '6px', border: 'none', cursor: 'pointer',
              background: gameState.difficultyMode === 'CADET' ? '#0284c7' : 'transparent',
              color: gameState.difficultyMode === 'CADET' ? '#ffffff' : '#38bdf8',
              fontSize: '11px', fontWeight: 800, fontFamily: 'var(--font-mono)',
            }}
            title="Space Cadet (Ages 8–12)"
          >
            🚀 8–12
          </button>
          <button
            onClick={() => handleSelectDifficulty('COMMANDER')}
            style={{
              padding: '4px 8px', borderRadius: '6px', border: 'none', cursor: 'pointer',
              background: gameState.difficultyMode === 'COMMANDER' ? '#7c3aed' : 'transparent',
              color: gameState.difficultyMode === 'COMMANDER' ? '#ffffff' : '#c084fc',
              fontSize: '11px', fontWeight: 800, fontFamily: 'var(--font-mono)',
            }}
            title="Mission Commander (Ages 13+)"
          >
            🛰️ 13+
          </button>
        </div>

        {/* Backdrop overlay for closing dropdowns when clicking outside */}
        {(isHubDropdownOpen || isToolsDropdownOpen) && (
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 90 }}
            onClick={() => { setIsHubDropdownOpen(false); setIsToolsDropdownOpen(false); }}
          />
        )}

        {/* Desktop Nav Actions — Clean, Kid-Friendly, Well-Grouped */}
        <div className="nav-actions nav-desktop-only">
          {/* 1. Home */}
          <button onClick={() => { if (typeof window !== 'undefined') sessionStorage.removeItem('astro_camp_launched'); setHasLaunched(false); soundFx.playClick(600); }} className="nav-link-btn" title="Back to Hangar Lobby">
            <Home size={15} className="text-slate-400" /><span>Home</span>
          </button>

          {/* 1B. Earth to Moon Full Expedition Simulator */}
          <button
            onClick={() => { setIsExpeditionOpen(true); soundFx.playReactorStart(); }}
            className="nav-link-btn"
            style={{
              background: 'linear-gradient(135deg, rgba(234, 88, 12, 0.35), rgba(220, 38, 38, 0.25))',
              border: '1px solid #ea580c',
              color: '#fed7aa',
              fontWeight: 800,
              boxShadow: '0 0 12px rgba(234, 88, 12, 0.3)',
            }}
            title="Artemis V: Earth Pad 39B Launch to Moon Touchdown"
          >
            <Rocket size={15} className="text-orange-400" />
            <span>🚀 Earth ➔ Moon Flight</span>
          </button>

          {/* 1B2. NASA 3D Mission Flight Simulator Suite */}
          <button
            onClick={() => { setIsSpaceGamesHubOpen(true); soundFx.playReactorStart(); }}
            className="nav-link-btn"
            style={{
              background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.4), rgba(59, 130, 246, 0.3))',
              border: '1px solid #c084fc',
              color: '#f3e8ff',
              fontWeight: 800,
              boxShadow: '0 0 14px rgba(168, 85, 247, 0.35)',
            }}
            title="NASA 3D Mission Flight Simulators (Artemis Rover & EVA, SLS Orion, Gateway)"
          >
            <Gamepad2 size={15} className="text-purple-400" />
            <span>🧑‍🚀 NASA 3D Flight Academy</span>
          </button>

          {/* 1C. Background Space Ambient Music */}
          <button
            onClick={() => {
              const muted = spaceMusicEngine.toggleMute();
              setIsMusicMuted(muted);
              soundFx.playClick(850);
            }}
            className="nav-link-btn"
            style={{
              background: !isMusicMuted ? 'rgba(14, 165, 233, 0.25)' : 'rgba(15, 23, 36, 0.85)',
              border: !isMusicMuted ? '1px solid #38bdf8' : '1px solid rgba(148, 163, 184, 0.22)',
              color: !isMusicMuted ? '#38bdf8' : '#94a3b8',
              fontWeight: 800,
            }}
            title={isMusicMuted ? 'Turn Procedural Space Music ON' : 'Turn Space Music OFF'}
          >
            <span>{!isMusicMuted ? '🎵 Music: ON' : '🔇 Music: OFF'}</span>
          </button>

          {/* 2. 76 Playable Mini-Games */}
          <button
            onClick={() => { setIsCampaignMapOpen(true); soundFx.playClick(850); }}
            className="nav-link-btn"
            style={{
              background: 'rgba(15, 23, 36, 0.85)',
              border: '1px solid rgba(148, 163, 184, 0.22)',
              color: '#f8fafc',
              fontWeight: 800,
            }}
            title="76 Interactive NASA Mini-Games"
          >
            <Gamepad2 size={15} className="text-slate-300" />
            <span>🎮 76 Games ({completedMissions.length}/76)</span>
          </button>

          {/* 2B. Co-Op Multiplayer Mission Lobby */}
          <button
            onClick={() => { setIsMultiplayerLobbyOpen(true); soundFx.playClick(900); }}
            className="nav-link-btn"
            style={{
              background: 'rgba(15, 23, 36, 0.85)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              color: '#6ee7b7',
              fontWeight: 800,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
            }}
            title="Multiplayer Co-Op Mission Lobby · Fly Missions with Crew"
          >
            <Users size={15} className="text-emerald-400" />
            <span>👥 Co-Op Lobby</span>
          </button>

          {/* 3. STEM Graphic Novels & Comics */}
          <button
            onClick={() => { setSelectedComicIssueId(undefined); setIsComicBookOpen(true); soundFx.playClick(750); }}
            className="nav-link-btn"
            style={{ 
              background: 'rgba(15, 23, 36, 0.85)', 
              border: '1px solid rgba(148, 163, 184, 0.22)', 
              color: '#f8fafc', 
              fontWeight: 700 
            }}
            title="NASA STEM Graphic Novels (8 Issues)"
          >
            <BookOpen size={15} className="text-slate-300" /><span>📖 Comics</span>
          </button>

          {/* 4. 3D Solar Eyes (Orrery & Space Stations) */}
          <button
            onClick={() => { setIsOrreryOpen(true); soundFx.playClick(850); }}
            className="nav-link-btn"
            style={{
              background: 'rgba(15, 23, 36, 0.85)',
              border: '1px solid rgba(148, 163, 184, 0.22)',
              color: '#f8fafc',
              fontWeight: 800,
            }}
            title="NASA Eyes 3D Solar System & Space Stations"
          >
            <Compass size={15} className="text-slate-300" /><span>🪐 3D Solar Eyes</span>
          </button>

          {/* 5. ASTRONAUT HUB DROPDOWN */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => { setIsHubDropdownOpen(!isHubDropdownOpen); setIsToolsDropdownOpen(false); soundFx.playClick(700); }}
              className="nav-link-btn"
              style={{
                background: isHubDropdownOpen ? 'rgba(30, 41, 59, 0.85)' : 'rgba(15, 23, 36, 0.85)',
                border: '1px solid rgba(148, 163, 184, 0.25)',
                color: '#f8fafc',
                fontWeight: 700,
              }}
              title="Astronaut Academy, Ground School, Surface Rover & Depot"
            >
              <GraduationCap size={15} className="text-slate-300" />
              <span>🎒 Astronaut Hub ▾</span>
            </button>
            {isHubDropdownOpen && (
              <div style={{
                position: 'absolute', top: '100%', right: 0, marginTop: '8px', zIndex: 100,
                background: 'rgba(15, 23, 42, 0.98)', border: '1px solid rgba(148, 163, 184, 0.25)',
                borderRadius: '10px', padding: '8px', width: '250px', boxShadow: '0 12px 40px rgba(0,0,0,0.85)',
                backdropFilter: 'blur(16px)', display: 'flex', flexDirection: 'column', gap: '4px',
              }}>
                <button
                  onClick={() => { setIsRoverModalOpen(true); setIsHubDropdownOpen(false); soundFx.playClick(800); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', borderRadius: '6px', border: 'none', background: 'transparent', color: '#f8fafc', cursor: 'pointer', textAlign: 'left', fontSize: '12px', fontWeight: 600 }}
                >
                  <Compass size={14} className="text-amber-400" />
                  <div>
                    <div style={{ fontWeight: 700, color: '#fcd34d' }}>🚜 Surface Rover EVA</div>
                    <div style={{ fontSize: '10px', color: '#94a3b8' }}>Drive rovers & drill ice</div>
                  </div>
                </button>
                <button
                  onClick={() => { setIsClassroomOpen(true); setIsHubDropdownOpen(false); soundFx.playClick(800); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', borderRadius: '6px', border: 'none', background: 'transparent', color: '#f8fafc', cursor: 'pointer', textAlign: 'left', fontSize: '12px', fontWeight: 600 }}
                >
                  <GraduationCap size={14} className="text-slate-300" />
                  <div>
                    <div style={{ fontWeight: 700, color: '#f8fafc' }}>🎓 Ground School (Class 101)</div>
                    <div style={{ fontSize: '10px', color: '#94a3b8' }}>Interactive lessons & audio</div>
                  </div>
                </button>
                <button
                  onClick={() => { setIsAcademyModalOpen(true); setIsHubDropdownOpen(false); soundFx.playClick(700); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', borderRadius: '6px', border: 'none', background: 'transparent', color: '#f8fafc', cursor: 'pointer', textAlign: 'left', fontSize: '12px', fontWeight: 600 }}
                >
                  <Building2 size={14} className="text-slate-300" />
                  <div>
                    <div style={{ fontWeight: 700, color: '#f8fafc' }}>🧑‍🚀 Astronaut Academy</div>
                    <div style={{ fontSize: '10px', color: '#94a3b8' }}>Spacesuit gear & ASCAN exam</div>
                  </div>
                </button>
                <button
                  onClick={() => { setIsDepotOpen(true); setIsHubDropdownOpen(false); soundFx.playClick(800); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', borderRadius: '6px', border: 'none', background: 'transparent', color: '#f8fafc', cursor: 'pointer', textAlign: 'left', fontSize: '12px', fontWeight: 600 }}
                >
                  <Building2 size={14} className="text-slate-300" />
                  <div>
                    <div style={{ fontWeight: 700, color: '#f8fafc' }}>🏛️ Equipment Depot</div>
                    <div style={{ fontSize: '10px', color: '#94a3b8' }}>Buy & sell outpost gear</div>
                  </div>
                </button>
                <button
                  onClick={() => { setIsConstructionModalOpen(true); setIsHubDropdownOpen(false); soundFx.playClick(750); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', borderRadius: '6px', border: 'none', background: 'transparent', color: '#f8fafc', cursor: 'pointer', textAlign: 'left', fontSize: '12px', fontWeight: 600 }}
                >
                  <Scale size={14} className="text-slate-300" />
                  <div>
                    <div style={{ fontWeight: 700, color: '#f8fafc' }}>🏗️ Outpost Cargo Manifest</div>
                    <div style={{ fontSize: '10px', color: '#94a3b8' }}>Mass budget & modules</div>
                  </div>
                </button>
                <button
                  onClick={() => { setIsPlanetaryMapOpen(true); setIsHubDropdownOpen(false); soundFx.playClick(700); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', borderRadius: '6px', border: 'none', background: 'transparent', color: '#f8fafc', cursor: 'pointer', textAlign: 'left', fontSize: '12px', fontWeight: 600 }}
                >
                  <Compass size={14} className="text-slate-300" />
                  <div>
                    <div style={{ fontWeight: 700, color: '#f8fafc' }}>🗺️ Missions Campaign</div>
                    <div style={{ fontSize: '10px', color: '#94a3b8' }}>Explore Moon & Mars</div>
                  </div>
                </button>
                <button
                  onClick={() => { setIsExpeditionOpen(true); setIsHubDropdownOpen(false); soundFx.playReactorStart(); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', borderRadius: '6px', border: 'none', background: 'transparent', color: '#f8fafc', cursor: 'pointer', textAlign: 'left', fontSize: '12px', fontWeight: 600 }}
                >
                  <Rocket size={14} className="text-orange-400" />
                  <div>
                    <div style={{ fontWeight: 700, color: '#fb923c' }}>🚀 Earth-to-Moon Expedition</div>
                    <div style={{ fontSize: '10px', color: '#94a3b8' }}>5-stage flight to Shackleton Rim</div>
                  </div>
                </button>
                <button
                  onClick={() => { setIsMoonquakeMapOpen(true); setIsHubDropdownOpen(false); soundFx.playReactorStart(); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', borderRadius: '6px', border: 'none', background: 'transparent', color: '#f8fafc', cursor: 'pointer', textAlign: 'left', fontSize: '12px', fontWeight: 600 }}
                >
                  <Compass size={14} className="text-amber-400" />
                  <div>
                    <div style={{ fontWeight: 700, color: '#fcd34d' }}>🌕 Moonquake 3D Globe</div>
                    <div style={{ fontSize: '10px', color: '#94a3b8' }}>Apollo 11–16 Seismic Map</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* 6. MISSION CONTROL & TOOLS DROPDOWN */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => { setIsToolsDropdownOpen(!isToolsDropdownOpen); setIsHubDropdownOpen(false); soundFx.playClick(700); }}
              className="nav-link-btn"
              style={{
                background: isToolsDropdownOpen ? 'rgba(30, 41, 59, 0.85)' : 'rgba(15, 23, 36, 0.85)',
                border: '1px solid rgba(148, 163, 184, 0.25)',
                color: '#f8fafc',
                fontWeight: 600,
              }}
              title="NASA Mission Tools & Settings"
            >
              <Sliders size={15} className="text-slate-400" />
              <span>🛠️ Tools ▾</span>
            </button>
            {isToolsDropdownOpen && (
              <div style={{
                position: 'absolute', top: '100%', right: 0, marginTop: '8px', zIndex: 100,
                background: 'rgba(15, 23, 42, 0.98)', border: '1px solid rgba(148, 163, 184, 0.25)',
                borderRadius: '10px', padding: '8px', width: '230px', boxShadow: '0 12px 40px rgba(0,0,0,0.85)',
                backdropFilter: 'blur(16px)', display: 'flex', flexDirection: 'column', gap: '4px',
              }}>
                <button
                  onClick={() => { setIsTelemetryOpen(true); setIsToolsDropdownOpen(false); soundFx.playTelemetryChirp(); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', borderRadius: '6px', border: 'none', background: 'transparent', color: '#f8fafc', cursor: 'pointer', textAlign: 'left', fontSize: '11.5px', fontWeight: 600 }}
                >
                  <Zap size={14} className="text-emerald-400" /><span>🛰️ NASA Live Telemetry</span>
                </button>
                <button
                  onClick={() => { setIsMarsEDLOpen(true); setIsToolsDropdownOpen(false); soundFx.playReactorStart(); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', borderRadius: '6px', border: 'none', background: 'transparent', color: '#f87171', cursor: 'pointer', textAlign: 'left', fontSize: '11.5px', fontWeight: 600 }}
                >
                  <Flame size={14} /><span>🔴 Mars 2020 EDL</span>
                </button>
                <button
                  onClick={() => { setIsExpeditionOpen(true); setIsToolsDropdownOpen(false); soundFx.playReactorStart(); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', borderRadius: '6px', border: 'none', background: 'transparent', color: '#fb923c', cursor: 'pointer', textAlign: 'left', fontSize: '11.5px', fontWeight: 700 }}
                >
                  <span>🚀</span><span>Earth ➔ Moon Flight (Artemis V)</span>
                </button>
                <button
                  onClick={() => { setIsMoonbaseAlphaOpen(true); setIsToolsDropdownOpen(false); soundFx.playReactorStart(); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', borderRadius: '6px', border: 'none', background: 'transparent', color: '#ffb03a', cursor: 'pointer', textAlign: 'left', fontSize: '11.5px', fontWeight: 600 }}
                >
                  <span>🌕</span><span>Moonbase Alpha (EVA Crisis)</span>
                </button>
                <button
                  onClick={() => { setIsMoonquakeMapOpen(true); setIsToolsDropdownOpen(false); soundFx.playReactorStart(); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', borderRadius: '6px', border: 'none', background: 'transparent', color: '#38bdf8', cursor: 'pointer', textAlign: 'left', fontSize: '11.5px', fontWeight: 600 }}
                >
                  <span>🌕</span><span>3D Moonquake Globe (Apollo Data)</span>
                </button>
                <button
                  onClick={() => { setIsBlackHoleOpen(true); setIsToolsDropdownOpen(false); soundFx.playClick(850); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', borderRadius: '6px', border: 'none', background: 'transparent', color: '#c084fc', cursor: 'pointer', textAlign: 'left', fontSize: '11.5px', fontWeight: 600 }}
                >
                  <span>🕳️</span><span>Black Hole (Relativistic Lensing)</span>
                </button>
                <button
                  onClick={() => { setIsCertificateOpen(true); setIsToolsDropdownOpen(false); soundFx.playVictory(); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', borderRadius: '6px', border: 'none', background: 'transparent', color: '#fcd34d', cursor: 'pointer', textAlign: 'left', fontSize: '11.5px', fontWeight: 600 }}
                >
                  <Award size={14} /><span>🎖️ Flight Certificate</span>
                </button>
                <button
                  onClick={() => { setIsJudgeModalOpen(true); setIsToolsDropdownOpen(false); soundFx.playClick(900); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', borderRadius: '6px', border: 'none', background: 'transparent', color: '#fcd34d', cursor: 'pointer', textAlign: 'left', fontSize: '11.5px', fontWeight: 600 }}
                >
                  <Eye size={14} /><span>🏆 Space Apps Judge Preview</span>
                </button>
                <button
                  onClick={() => { setIsHowToPlayOpen(true); setIsToolsDropdownOpen(false); soundFx.playClick(700); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', borderRadius: '6px', border: 'none', background: 'transparent', color: '#cbd5e1', cursor: 'pointer', textAlign: 'left', fontSize: '11.5px', fontWeight: 600 }}
                >
                  <BookOpen size={14} /><span>❓ Gameplay Guide</span>
                </button>
                <button
                  onClick={() => { const m = soundFx.toggleMute(); speechEngine.setMuted(m); setIsMuted(m); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', borderRadius: '6px', border: 'none', background: 'transparent', color: isMuted ? '#f87171' : '#6ee7b7', cursor: 'pointer', textAlign: 'left', fontSize: '11.5px', fontWeight: 600 }}
                >
                  {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                  <span>{isMuted ? 'Unmute Sound' : 'Mute Sound'}</span>
                </button>
                <button
                  onClick={() => { setIsSettingsOpen(true); setIsToolsDropdownOpen(false); soundFx.playClick(700); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', borderRadius: '6px', border: 'none', background: 'transparent', color: '#cbd5e1', cursor: 'pointer', textAlign: 'left', fontSize: '11.5px', fontWeight: 600 }}
                >
                  <Sliders size={14} /><span>⚙️ Settings</span>
                </button>
                <button
                  onClick={() => { handleRestart(); setIsToolsDropdownOpen(false); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', borderRadius: '6px', border: 'none', background: 'transparent', color: '#94a3b8', cursor: 'pointer', textAlign: 'left', fontSize: '11.5px', fontWeight: 600 }}
                >
                  <RotateCcw size={14} /><span>🔄 Reset Outpost</span>
                </button>
              </div>
            )}
          </div>

          {/* Teacher Gradebook (Only if Teacher) */}
          {currentUser?.role === 'teacher' && (
            <button
              onClick={() => { setIsTeacherModalOpen(true); soundFx.playClick(850); }}
              className="nav-link-btn"
              style={{
                background: 'rgba(15, 23, 36, 0.85)',
                border: '1px solid rgba(148, 163, 184, 0.25)',
                color: '#f8fafc',
                fontWeight: 800,
              }}
              title="Open Classroom Student Scores & Gradebook"
            >
              <GraduationCap size={15} className="text-slate-300" />
              <span>👩‍🏫 Gradebook</span>
            </button>
          )}

          {/* User Account / Sign In */}
          <button
            onClick={() => { setIsAuthModalOpen(true); soundFx.playClick(800); }}
            className="nav-link-btn"
            style={{
              background: 'rgba(15, 23, 36, 0.85)',
              border: '1px solid rgba(148, 163, 184, 0.25)',
              color: '#f8fafc',
              fontWeight: 800,
            }}
          >
            <span>{currentUser?.avatar || '👤'}</span>
            <span>{currentUser ? (currentUser.role === 'teacher' ? `👩‍🏫 ${currentUser.username}` : `@${currentUser.username}`) : 'Sign In'}</span>
          </button>
        </div>

        {/* Mobile: Quick Actions + Hamburger */}
        <div className="nav-mobile-right">
          {/* Quick-access auth button (Mobile) */}
          <button
            onClick={() => { setIsAuthModalOpen(true); soundFx.playClick(800); }}
            className="nav-link-btn nav-game-btn-mobile"
            style={{
              padding: '6px 10px',
              border: currentUser?.role === 'teacher' ? '1px solid rgba(168, 85, 247, 0.5)' : '1px solid rgba(6, 182, 212, 0.5)',
              color: currentUser?.role === 'teacher' ? '#c084fc' : '#38bdf8',
              fontWeight: 700
            }}
            title="Astronaut ID"
          >
            <span>{currentUser?.avatar || '🔐'}</span>
            <span className="nav-game-label">{currentUser ? `@${currentUser.username}` : 'Sign In'}</span>
          </button>

          {/* Quick-access comic button */}
          <button
            onClick={() => { setSelectedComicIssueId(undefined); setIsComicBookOpen(true); soundFx.playClick(750); }}
            className="nav-link-btn nav-game-btn-mobile"
            style={{ 
              background: 'linear-gradient(90deg, rgba(245, 158, 11, 0.22), rgba(234, 88, 12, 0.22))', 
              border: '1px solid rgba(245, 158, 11, 0.5)', 
              color: '#fbbf24', 
              fontWeight: 700, 
              padding: '6px 10px' 
            }}
            title="Read Comics"
          >
            <BookOpen size={14} className="text-amber-400" />
            <span className="nav-game-label">Comics</span>
          </button>

          {/* Quick-access game button always visible */}
          <button
            onClick={() => { setIsCampaignMapOpen(true); soundFx.playClick(850); }}
            className="nav-link-btn nav-game-btn-mobile"
            style={{ background: 'linear-gradient(90deg, rgba(6,182,212,0.2), rgba(59,130,246,0.2))', border: '1px solid rgba(6,182,212,0.4)', color: '#38bdf8', fontWeight: 700, padding: '6px 10px' }}
          >
            <Gamepad2 size={14} className="text-cyan-400" />
            <span className="nav-game-label">Play ({completedMissions.length}/76)</span>
          </button>
          <button
            onClick={() => setIsMobileMenuOpen((v) => !v)}
            className="nav-hamburger"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      {/* Mobile Dropdown Menu */}
      {isMobileMenuOpen && (
        <div className="mobile-menu-overlay" onClick={() => setIsMobileMenuOpen(false)}>
          <nav className="mobile-menu-panel" onClick={(e) => e.stopPropagation()}>
            {/* Age Mode Selector */}
            <div className="mobile-menu-section">
              <div className="mobile-menu-section-label">Age Mode</div>
              <div className="mobile-age-btns">
                {(['CADET', 'EXPLORER', 'COMMANDER'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => { handleSelectDifficulty(mode); setIsMobileMenuOpen(false); }}
                    className={`mobile-age-btn ${gameState.difficultyMode === mode ? 'mobile-age-btn-active' : ''}`}
                  >
                    {mode === 'CADET' ? '🧒 Cadet (3–7)' : mode === 'EXPLORER' ? '🚀 Explorer (8–13)' : '🛰️ Commander (14–19)'}
                  </button>
                ))}
              </div>
            </div>
            <div className="mobile-menu-divider" />
            {/* Nav Links */}
            {[
              { icon: <Home size={16} />, label: 'Home', color: '#94a3b8', action: () => { if (typeof window !== 'undefined') sessionStorage.removeItem('astro_camp_launched'); setHasLaunched(false); } },
              { icon: <Compass size={16} />, label: '🚜 Deploy Rover EVA', color: '#fb923c', action: () => setIsRoverModalOpen(true) },
              { icon: <Scale size={16} />, label: '🏗️ Outpost Cargo Manifest', color: '#38bdf8', action: () => setIsConstructionModalOpen(true) },
              { icon: <GraduationCap size={16} />, label: '🧑‍🚀 Astronaut Academy', color: '#a78bfa', action: () => setIsAcademyModalOpen(true) },
              { icon: <GraduationCap size={16} />, label: '🎓 Ground School (How to Fly)', color: '#c4b5fd', action: () => setIsClassroomOpen(true) },
              { icon: <Building2 size={16} />, label: '🏛️ Equipment Depot (Buy/Sell)', color: '#38bdf8', action: () => setIsDepotOpen(true) },
              { icon: <BookOpen size={16} />, label: '❓ Survival Guide', color: '#43ffa0', action: () => setIsHowToPlayOpen(true) },
              { icon: <Sliders size={16} />, label: '⚙️ Settings', color: '#94a3b8', action: () => setIsSettingsOpen(true) },
              { icon: <BookOpen size={16} />, label: '📖 Comic Books (8 Issues)', color: '#fbbf24', action: () => { setSelectedComicIssueId(undefined); setIsComicBookOpen(true); } },
              { icon: <BookOpen size={16} />, label: 'Learning Hub', color: '#a78bfa', action: () => setIsLearningHubOpen(true) },
              { icon: <Compass size={16} />, label: 'Mission Map', color: '#a78bfa', action: () => setIsPlanetaryMapOpen(true) },
              { icon: <Gamepad2 size={16} />, label: '🧑‍🚀 NASA 3D Mission Simulator Suite', color: '#c084fc', action: () => setIsSpaceGamesHubOpen(true) },
              { icon: <Gamepad2 size={16} />, label: `76 Mission Games (${completedMissions.length}/76)`, color: '#38bdf8', action: () => setIsCampaignMapOpen(true) },
              { icon: isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />, label: isMuted ? 'Unmute Audio' : 'Mute Audio', color: isMuted ? '#f87171' : '#34d399', action: () => { const m = soundFx.toggleMute(); speechEngine.setMuted(m); setIsMuted(m); } },
              { icon: <Database size={16} />, label: 'NASA Data Sources', color: '#34d399', action: () => setIsNasaModalOpen(true) },
              { icon: <GraduationCap size={16} />, label: 'Curriculum Guide', color: '#38bdf8', action: () => setIsTeacherModalOpen(true) },
              { icon: <Bot size={16} />, label: 'AI Disclosure', color: '#fbbf24', action: () => setIsAIModalOpen(true) },
              { icon: <Users size={16} />, label: 'About Team Mysterio', color: '#c4b5fd', action: () => setIsAboutOpen(true) },
              { icon: <Eye size={16} />, label: '🏆 Judge Preview Mode', color: '#fbbf24', action: () => setIsJudgeModalOpen(true) },
              { icon: <Zap size={16} />, label: '🛰️ Live NASA Telemetry', color: '#22d3ee', action: () => setIsTelemetryOpen(true) },
              { icon: <Award size={16} />, label: '🎖️ Flight Certificate', color: '#f59e0b', action: () => setIsCertificateOpen(true) },
              { icon: <Compass size={16} />, label: '🌌 NASA Eyes Orrery 3D', color: '#38bdf8', action: () => setIsOrreryOpen(true) },
              { icon: <Flame size={16} />, label: '🔴 Mars 2020 EDL (7 Min)', color: '#f87171', action: () => setIsMarsEDLOpen(true) },
              { icon: <RotateCcw size={16} />, label: 'Reset Simulation', color: '#94a3b8', action: handleRestart },
            ].map((item) => (
              <button
                key={item.label}
                onClick={() => { item.action(); soundFx.playClick(700); setIsMobileMenuOpen(false); }}
                className="mobile-menu-item"
                style={{ '--item-color': item.color } as React.CSSProperties}
              >
                <span className="mobile-menu-icon" style={{ color: item.color }}>{item.icon}</span>
                <span className="mobile-menu-label">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
      )}

      {/* Main HUD */}
      <main className="main-content-layout">
        <ResourceHUD
          sol={gameState.currentSol}
          totalSols={gameState.totalSols}
          resources={gameState.resources}
          difficultyMode={gameState.difficultyMode}
          onSelectDifficulty={handleSelectDifficulty}
        />

        {/* Current Mission Banner */}
        <div className="mission-banner-bar">
          <div className="mission-banner-info">
            <Rocket size={13} className="text-violet-400 shrink-0" />
            <span style={{ fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#a78bfa' }}>
              Active Mission:
            </span>
            <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{currentMission.name}</span>
            <span style={{ color: '#64748b' }}>·</span>
            <span style={{ color: '#94a3b8' }}>{currentMission.destinationName} · {currentMission.coordinates}</span>
          </div>

          <div className="mission-banner-controls">
            {/* Cinema Theater vs Tactical Bridge Viewport Toggle */}
            <div style={{ display: 'flex', gap: '4px', background: 'rgba(15,23,42,0.7)', padding: '2px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <button
                onClick={() => { setIsTheaterMode(true); soundFx.playClick(900); }}
                style={{
                  padding: '3px 10px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  borderRadius: '4px',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: isTheaterMode ? '#38bdf8' : 'transparent',
                  color: isTheaterMode ? '#070a0e' : '#94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'all 0.2s',
                }}
              >
                <span>🎬 Cinema Theater</span>
              </button>
              <button
                onClick={() => { setIsTheaterMode(false); soundFx.playClick(800); }}
                style={{
                  padding: '3px 10px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  borderRadius: '4px',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: !isTheaterMode ? '#38bdf8' : 'transparent',
                  color: !isTheaterMode ? '#070a0e' : '#94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'all 0.2s',
                }}
              >
                <span>🛰️ Tactical Bridge</span>
              </button>
            </div>

            <button
              onClick={() => { setIsRoverModalOpen(true); soundFx.playClick(800); }}
              style={{
                padding: '4px 12px',
                background: 'linear-gradient(135deg, rgba(234, 88, 12, 0.3), rgba(249, 115, 22, 0.3))',
                border: '1px solid rgba(249, 115, 22, 0.6)',
                borderRadius: '6px',
                color: '#fed7aa',
                fontSize: '0.74rem',
                cursor: 'pointer',
                fontWeight: 700,
                letterSpacing: '0.04em',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
              title="Deploy Surface Rover Expedition"
            >
              <span>🚜 Drive Rover EVA</span>
            </button>

            <button
              onClick={() => { setSelectedComicIssueId(undefined); setIsComicBookOpen(true); soundFx.playClick(750); }}
              style={{
                padding: '4px 11px',
                background: 'rgba(245, 158, 11, 0.2)',
                border: '1px solid rgba(245, 158, 11, 0.5)',
                borderRadius: '6px',
                color: '#fbbf24',
                fontSize: '0.74rem',
                cursor: 'pointer',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
              title="Read Mission Graphic Novel"
            >
              <span>📖 Mission Comic</span>
            </button>

            <button
              onClick={() => setIsPlanetaryMapOpen(true)}
              style={{
                padding: '4px 12px',
                background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.3), rgba(139, 92, 246, 0.3))',
                border: '1px solid rgba(139, 92, 246, 0.6)',
                borderRadius: '6px',
                color: '#ddd6fe',
                fontSize: '0.74rem',
                cursor: 'pointer',
                fontWeight: 800,
                letterSpacing: '0.04em',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <span>🔄 Switch Mission</span>
            </button>
          </div>
        </div>

        {/* ── CINEMA THEATER MODE (Full Screen Narrative Immersion) ── */}
        {isTheaterMode ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* 1. Cinematic Stage */}
            {gameState.activeEvent && (
              <div className="event-dilemma-card" style={{ padding: '18px 22px' }}>
                <div className="event-headline-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <div className="event-badge">SOL {gameState.activeEvent.sol} MISSION BRIEFING</div>
                    <h2 className="event-title">{gameState.activeEvent.title}</h2>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      onClick={() => {
                        setSelectedComicIssueId(undefined);
                        setIsComicBookOpen(true);
                        soundFx.playClick(750);
                      }}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '5px 12px',
                        background: 'rgba(245, 158, 11, 0.18)',
                        border: '1px solid rgba(245, 158, 11, 0.45)',
                        borderRadius: '6px',
                        color: '#fbbf24',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                      title="Read NASA STEM Graphic Novel"
                    >
                      <BookOpen size={13} className="text-amber-400" />
                      <span>📖 STEM Graphic Novel</span>
                    </button>
                    <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#64748b' }}>
                      NARRATIVE STAGE
                    </span>
                  </div>
                </div>

                {/* Photorealistic Interstellar Scene */}
                <CinematicScene
                  panels={gameState.activeEvent.comicPanels}
                  urgency={gameState.activeEvent.urgency}
                  isTheaterMode={true}
                  onToggleTheaterMode={() => setIsTheaterMode(false)}
                />

                {/* Tactical Strategic Command Actions Grid */}
                <div className="choices-block" style={{ marginTop: '16px' }}>
                  <div className="choices-instruction" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Activity size={14} className="text-cyan-400" />
                    <span>SELECT TACTICAL COMMAND ACTION PROTOCOL:</span>
                  </div>
                  <div
                    className="choices-list"
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))',
                      gap: '12px',
                    }}
                  >
                    {gameState.activeEvent.options.map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => handleSelectChoice(opt)}
                        className="choice-card-btn"
                        style={{
                          padding: '16px 18px',
                          border: '1px solid rgba(56, 189, 248, 0.25)',
                          background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.85) 0%, rgba(8, 14, 26, 0.95) 100%)',
                          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.6)',
                        }}
                      >
                        <div className="choice-header-row">
                          <span className="choice-title" style={{ fontSize: '14px', color: '#38bdf8' }}>{opt.title}</span>
                          <ChevronRight size={18} className="text-cyan-400 choice-arrow" />
                        </div>
                        <p className="choice-desc" style={{ fontSize: '12.5px', color: '#cbd5e1' }}>{opt.description}</p>
                        <div className="choice-tradeoff" style={{ marginTop: '6px' }}>
                          <span className="tradeoff-label" style={{ color: '#fbbf24', fontWeight: 700 }}>Telemetry Trade-off: </span>
                          <span style={{ color: '#94a3b8' }}>{opt.tradeOffText}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 2. Tactical Sensor Deck & Scientific Citation Array */}
            <div className="theater-bottom-grid">
              {/* Outpost Viewport */}
              <div className="panel-box">
                <div className="panel-box-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="panel-box-title">🛰️ Outpost Sensor Viewport</span>
                    <span className="text-xs text-slate-400 font-mono">{currentMission.destinationName} ({currentMission.coordinates})</span>
                  </div>

                  <ViewportToggle is3DView={is3DView} onSetView={setIs3DView} />
                </div>

                {is3DView ? (
                  <ErrorBoundary fallbackTitle="3D Outpost Sensor Viewport" onFallback2D={() => setIs3DView(false)}>
                    <Outpost3DView
                      currentSol={gameState.currentSol}
                      modules={gameState.modules}
                      resources={gameState.resources}
                      activeEventId={gameState.activeEvent?.id}
                      isShieldActive={isShieldActive}
                      mission={currentMission}
                      taskChoices={gameState.activeEvent?.options}
                      onSelectChoice={handleSelectChoice}
                      activeEventTitle={gameState.activeEvent?.title}
                    />
                  </ErrorBoundary>
                ) : (
                  <OutpostMap
                    currentSol={gameState.currentSol}
                    modules={gameState.modules}
                    resources={gameState.resources}
                  />
                )}
              </div>

              {/* NASA Science & Decision History */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {gameState.activeEvent && (
                  <div className="nasa-context-card" style={{ flex: 1 }}>
                    <div className="context-header">
                      <span className="context-tag">NASA DATA CITATION</span>
                      <span className="context-doc font-mono">{gameState.activeEvent.nasaCitation.docNumber}</span>
                    </div>
                    <div className="context-title">{gameState.activeEvent.nasaCitation.title}</div>
                    <p className="context-desc">{gameState.activeEvent.nasaCitation.description}</p>
                    {gameState.activeEvent.weatherNotice && (
                      <div className="weather-alert-strip">
                        <AlertTriangle size={14} className="text-amber-400 shrink-0" />
                        <span>{gameState.activeEvent.weatherNotice}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Previous Consequence Feed */}
                {lastConsequence && (
                  <div className="consequence-feed-card">
                    <div className="feed-header">
                      <Sparkles size={16} className="text-cyan-400" />
                      <span>Previous Decision Result: {lastConsequence.choiceTitle}</span>
                    </div>
                    <p className="feed-narrative">{lastConsequence.narrative}</p>
                    <div className="feed-insight">
                      <strong>Physics Insight: </strong>
                      {lastConsequence.insight}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* ── TACTICAL BRIDGE (Split 2-Column View) ── */
          <div className="game-columns-grid">
            {/* Left Column: 3D Simulator or 2D Isometric Base Map */}
            <div className="left-panel-col">
              <div className="panel-box">
                <div className="panel-box-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="panel-box-title">🛰️ Outpost Viewport</span>
                    <span className="text-xs text-slate-400 font-mono">{currentMission.destinationName} ({currentMission.coordinates})</span>
                  </div>

                  <ViewportToggle is3DView={is3DView} onSetView={setIs3DView} />
                </div>

                {is3DView ? (
                  <ErrorBoundary fallbackTitle="3D Outpost Viewport" onFallback2D={() => setIs3DView(false)}>
                    <Outpost3DView
                      currentSol={gameState.currentSol}
                      modules={gameState.modules}
                      resources={gameState.resources}
                      activeEventId={gameState.activeEvent?.id}
                      isShieldActive={isShieldActive}
                      mission={currentMission}
                      taskChoices={gameState.activeEvent?.options}
                      onSelectChoice={handleSelectChoice}
                      activeEventTitle={gameState.activeEvent?.title}
                    />
                  </ErrorBoundary>
                ) : (
                  <OutpostMap
                    currentSol={gameState.currentSol}
                    modules={gameState.modules}
                    resources={gameState.resources}
                  />
                )}
              </div>

              {/* NASA Weather & Scientific Context Box */}
              {gameState.activeEvent && (
                <div className="nasa-context-card">
                  <div className="context-header">
                    <span className="context-tag">NASA DATA CITATION</span>
                    <span className="context-doc font-mono">{gameState.activeEvent.nasaCitation.docNumber}</span>
                  </div>
                  <div className="context-title">{gameState.activeEvent.nasaCitation.title}</div>
                  <p className="context-desc">{gameState.activeEvent.nasaCitation.description}</p>
                  {gameState.activeEvent.weatherNotice && (
                    <div className="weather-alert-strip">
                      <AlertTriangle size={14} className="text-amber-400 shrink-0" />
                      <span>{gameState.activeEvent.weatherNotice}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Column: Living Comic Panels & Tactical Choice Options */}
            <div className="right-panel-col">
              {gameState.activeEvent ? (
                <div className="event-dilemma-card">
                  <div className="event-headline-row">
                    <div className="event-badge">SOL {gameState.activeEvent.sol} MISSION BRIEFING</div>
                    <h2 className="event-title">{gameState.activeEvent.title}</h2>
                  </div>

                  {/* 🎬 Cinematic Mission Dialogue Scene */}
                  <CinematicScene
                    panels={gameState.activeEvent.comicPanels}
                    urgency={gameState.activeEvent.urgency}
                    isTheaterMode={false}
                    onToggleTheaterMode={() => setIsTheaterMode(true)}
                  />

                  {/* Interactive Strategic Choices */}
                  <div className="choices-block">
                    <div className="choices-instruction">
                      <span>Select Tactical Command Action:</span>
                    </div>
                    <div className="choices-list">
                      {gameState.activeEvent.options.map((opt) => (
                        <button
                          key={opt.id}
                          onClick={() => handleSelectChoice(opt)}
                          className="choice-card-btn"
                        >
                          <div className="choice-header-row">
                            <span className="choice-title">{opt.title}</span>
                            <ChevronRight size={18} className="text-emerald-400 choice-arrow" />
                          </div>
                          <p className="choice-desc">{opt.description}</p>
                          <div className="choice-tradeoff">
                            <span className="tradeoff-label">Trade-off: </span>
                            <span>{opt.tradeOffText}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Last Consequence Feed */}
              {lastConsequence && (
                <div className="consequence-feed-card">
                  <div className="feed-header">
                    <Sparkles size={16} className="text-cyan-400" />
                    <span>Previous Decision Result: {lastConsequence.choiceTitle}</span>
                  </div>
                  <p className="feed-narrative">{lastConsequence.narrative}</p>
                  <div className="feed-insight">
                    <strong>Physics Insight: </strong>
                    {lastConsequence.insight}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Game Over / Mission Autopsy Overlay */}
      {gameState.isGameOver && (
        <MissionAutopsy gameState={gameState} onRestartMission={handleRestart} currentMission={currentMission} />
      )}

      {/* ═══ Full-Screen Modals ═══ */}

      {/* Planetary Mission Command Map */}
      <PlanetaryCommandMap
        isOpen={isPlanetaryMapOpen}
        onClose={() => setIsPlanetaryMapOpen(false)}
        onSelectMission={(mission) => { handleOpenBriefing(mission); }}
        activeMissionId={currentMission.id}
        onOpenMoonquakeMap={() => setIsMoonquakeMapOpen(true)}
      />

      {/* Astronaut Briefing Room */}
      <AstronautBriefingModal
        isOpen={isBriefingModalOpen}
        mission={selectedBriefingMission}
        onClose={() => setIsBriefingModalOpen(false)}
        onLaunchMission={handleLaunchMission}
      />

      {/* Audio Teaching Flashcard (shown after each choice) */}
      <AudioTeachingFlashcard
        isOpen={isFlashcardOpen}
        card={activeFlashcard}
        onClose={() => setIsFlashcardOpen(false)}
        tier={gameState.difficultyMode as DifficultyTier}
        onSaveToNotebook={handleSaveFlashcard}
        isSaved={activeFlashcard ? collectedFlashcards.some(c => c.id === activeFlashcard.id) : false}
      />

      {/* Mission Notebook */}
      <MissionNotebookModal
        isOpen={isNotebookOpen}
        onClose={() => setIsNotebookOpen(false)}
        mission={currentMission}
        history={gameState.history}
        collectedFlashcards={collectedFlashcards}
        resources={gameState.resources}
      />

      {/* Utility Modals */}
      <NasaDataModal isOpen={isNasaModalOpen} onClose={() => setIsNasaModalOpen(false)} />
      {currentUser?.role === 'teacher' ? (
        <TeacherGradebookModal
          isOpen={isTeacherModalOpen}
          onClose={() => setIsTeacherModalOpen(false)}
          currentUser={currentUser}
        />
      ) : (
        <TeacherDossierModal
          isOpen={isTeacherModalOpen}
          onClose={() => setIsTeacherModalOpen(false)}
          currentUser={currentUser}
          onOpenAuth={() => setIsAuthModalOpen(true)}
        />
      )}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onAuthChange={(u) => setCurrentUser(u)}
        onOpenTeacherDossier={() => setIsTeacherModalOpen(true)}
      />
      <AIDisclosureModal isOpen={isAIModalOpen} onClose={() => setIsAIModalOpen(false)} />

      {/* Astro Camp — Learning Hub */}
      <LearningHubModal
        isOpen={isLearningHubOpen}
        onClose={() => setIsLearningHubOpen(false)}
        activeEvent={gameState.activeEvent}
        collectedFlashcards={collectedFlashcards}
        activeMissionId={currentMission.id}
        onLaunchMission={handleLaunchMissionGame}
        completedMissions={completedMissions}
        onOpenComicReader={(issueId) => {
          setSelectedComicIssueId(issueId);
          setIsComicBookOpen(true);
        }}
        initialTab={learningHubInitialTab}
      />

      {/* NASA STEM Graphic Novel Comic Book Reader Modal */}
      <ComicBookModal
        isOpen={isComicBookOpen}
        onClose={() => setIsComicBookOpen(false)}
        initialIssueId={selectedComicIssueId}
      />


      <MultiplayerLobbyModal
        isOpen={isMultiplayerLobbyOpen}
        onClose={() => setIsMultiplayerLobbyOpen(false)}
        onLaunchMission={(missionId, role) => {
          setIsMultiplayerLobbyOpen(false);
          setIsCoopActive(true);
          setCoopRole(role);
          setActiveMissionGameId(missionId);
        }}
        initialRoomCode={initialRoomCode}
      />

      {/* Active Phaser 3 / 3D Mission Mini-Game Modal */}
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
          onOpenMoonquakeMap={() => setIsMoonquakeMapOpen(true)}
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

      {/* About / Team Mysterio */}
      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />

      {/* Outpost Management & Training Modals */}
      <OutpostConstructionModal
        isOpen={isConstructionModalOpen}
        destination={currentMission.destination === 'MARS' ? 'MARS' : 'MOON'}
        initialConfig={gameState.outpostConfig}
        onConfirm={handleConfirmConstruction}
        onCancel={() => setIsConstructionModalOpen(false)}
      />

      <AstronautAcademyModal
        isOpen={isAcademyModalOpen || isCampaignMapOpen}
        initialTab={
          isCampaignMapOpen
            ? 'NASA_76_CAMPAIGN'
            : 'CURRICULUM'
        }
        onClose={() => {
          setIsAcademyModalOpen(false);
          setIsCampaignMapOpen(false);
        }}
        completedMissions={completedMissions}
        onLaunchMission={(missionId) => {
          setIsAcademyModalOpen(false);
          setIsCampaignMapOpen(false);
          handleLaunchMissionGame(missionId);
        }}
        onOpenComics={() => {
          setIsAcademyModalOpen(false);
          setSelectedComicIssueId(undefined);
          setIsComicBookOpen(true);
          soundFx.playClick(750);
        }}
        onOpenClassroom={() => {
          setIsAcademyModalOpen(false);
          setIsClassroomOpen(true);
          soundFx.playClick(800);
        }}
        onOpenDepot={() => {
          setIsAcademyModalOpen(false);
          setIsDepotOpen(true);
          soundFx.playClick(800);
        }}
      />

      <RealisticTrainingCenterModal
        isOpen={isTrainingCenterOpen}
        onClose={() => setIsTrainingCenterOpen(false)}
        onOpenClassroom={() => {
          closeAllModals();
          setIsClassroomOpen(true);
        }}
        onOpenAcademy={() => {
          closeAllModals();
          setIsAcademyModalOpen(true);
        }}
      />

      <RoverExplorationModal
        isOpen={isRoverModalOpen}
        onClose={() => setIsRoverModalOpen(false)}
        destinationName={currentMission.destinationName}
        isMoon={currentMission.destination !== 'MARS'}
        onCompleteRoverMission={handleCompleteRoverEVA}
      />

      <HowToPlayModal
        isOpen={isHowToPlayOpen}
        onClose={() => setIsHowToPlayOpen(false)}
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

      {/* Academy Campus Builder & Equipment Depot (Buy/Sell) */}
      <AcademyDepotModal
        isOpen={isDepotOpen}
        onClose={() => setIsDepotOpen(false)}
        onLaunchClassroom={() => {
          setIsDepotOpen(false);
          setIsClassroomOpen(true);
        }}
      />

      {/* Astronaut Ground School & Mission Masterclass */}
      <AstronautClassroomModal
        isOpen={isClassroomOpen}
        onClose={() => setIsClassroomOpen(false)}
        onOpenDepot={() => {
          setIsClassroomOpen(false);
          setIsDepotOpen(true);
        }}
      />

      {/* Competition Polish: Judge Preview Mode + Telemetry + Certificates */}
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
      <FlightCertificateModal
        isOpen={isCertificateOpen}
        onClose={() => setIsCertificateOpen(false)}
        cadetName={currentUser?.username || 'Junior Astronaut'}
        completedMissions={completedMissions}
        currentMissionName={currentMission.name}
      />
      <SolarSystemOrreryModal
        isOpen={isOrreryOpen}
        onClose={() => setIsOrreryOpen(false)}
      />
      <MarsEDLSimulatorModal
        isOpen={isMarsEDLOpen}
        onClose={() => setIsMarsEDLOpen(false)}
      />
      <MoonbaseAlphaSimulator
        isOpen={isMoonbaseAlphaOpen}
        onClose={() => setIsMoonbaseAlphaOpen(false)}
      />
      <BlackHoleSimulator
        isOpen={isBlackHoleOpen}
        onClose={() => setIsBlackHoleOpen(false)}
      />
      <MoonquakeMapModal
        isOpen={isMoonquakeMapOpen}
        onClose={() => setIsMoonquakeMapOpen(false)}
      />
      <EarthToMoonExpeditionModal
        isOpen={isExpeditionOpen}
        onClose={() => setIsExpeditionOpen(false)}
        onOpenMoonquakeMap={() => {
          setIsExpeditionOpen(false);
          setIsMoonquakeMapOpen(true);
        }}
      />
      <SpaceGamesHubModal
        isOpen={isSpaceGamesHubOpen}
        onClose={() => setIsSpaceGamesHubOpen(false)}
      />

      <AstronautCharacterModal
        isOpen={isCharacterModalOpen}
        onClose={() => setIsCharacterModalOpen(false)}
        currentUser={currentUser}
        onUserUpdate={(u) => setCurrentUser(u)}
      />
      <LiveMissionActivityModal
        isOpen={isLiveActivityModalOpen}
        onClose={() => setIsLiveActivityModalOpen(false)}
        currentUsername={currentUser?.username}
      />

      {/* Footer */}
      <footer className="main-footer">
        <div>
          <span>Jr_AstroCamp: Beyond Earth · <strong>NASA International Space Apps Challenge 2026</strong></span>
        </div>
        <div className="footer-credits">
          <span>By <strong>Team Mysterio</strong> · "Train. Build. Survive. Explore."</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
