/**
 * NASA Jr_AstroCamp — Game & Handwritten Notebook Standalone Package
 * Unified Exports for 2D/3D Space Gaming Engines & Interactive Notebook View
 */

// ══════════════════════════════════════════════════════════════════════════════
// 1. 2D PHASER ARCADE / TACTICAL GAMING ENGINE
// ══════════════════════════════════════════════════════════════════════════════
export { startPhaserMissionGame, destroyPhaserGame } from './gaming_engine/game_core/PhaserGameManager';
export { MISSION_GAME_DATA, type MissionGameConfig } from './gaming_engine/game_core/missionGameData';
export { LaunchScene } from './gaming_engine/game_core/scenes/LaunchScene';
export { DockingScene } from './gaming_engine/game_core/scenes/DockingScene';
export { LunarLandingScene } from './gaming_engine/game_core/scenes/LunarLandingScene';
export { RoverScene } from './gaming_engine/game_core/scenes/RoverScene';
export { TelescopeScene } from './gaming_engine/game_core/scenes/TelescopeScene';
export { DeepSpaceScene } from './gaming_engine/game_core/scenes/DeepSpaceScene';

// ══════════════════════════════════════════════════════════════════════════════
// 2. RESOURCE SIMULATION OUTPOST & MULTIPLAYER SERVICE
// ══════════════════════════════════════════════════════════════════════════════
export {
  SimulationEngine,
  type OutpostState,
  type DailyLogEntry,
  type CriticalEvent,
} from './gaming_engine/simulation_outpost/simulationEngine';

export {
  multiplayerMissionService,
  CREW_ROLES,
  type CrewRole,
  type CrewRoleInfo,
  type MultiplayerRoomState,
} from './gaming_engine/multiplayer/multiplayerMissionService';

// ══════════════════════════════════════════════════════════════════════════════
// 3. 3D WEBGL THREE.JS SIMULATORS & INTERACTIVE GAME MODALS
// ══════════════════════════════════════════════════════════════════════════════
export { MissionGameModal } from './gaming_engine/components/MissionGameModal';
export { ThreeMissionSimulator } from './gaming_engine/components/ThreeMissionSimulator';
export { SpaceGamesHubModal } from './gaming_engine/components/SpaceGamesHubModal';
export { MoonbaseAlphaSimulator } from './gaming_engine/components/MoonbaseAlphaSimulator';
export { BlackHoleSimulator } from './gaming_engine/components/BlackHoleSimulator';
export { MoonquakeMapModal } from './gaming_engine/components/MoonquakeMapModal';
export { AuthenticCockpitOverlay } from './gaming_engine/components/AuthenticCockpitOverlay';
export { MissionCinematicIntro } from './gaming_engine/components/MissionCinematicIntro';

// ══════════════════════════════════════════════════════════════════════════════
// 4. INTERACTIVE HANDWRITTEN NOTEBOOK (PENCIL SKETCHES & CURRICULUM)
// ══════════════════════════════════════════════════════════════════════════════
export { HandwrittenNotebookView } from './handwritten_notebook/HandwrittenNotebookView';
export {
  CURRICULUM_MODULES,
  type CurriculumModulePackage,
  type HandwrittenNotebookPage,
  type HandDrawnIdea,
} from './handwritten_notebook/curriculumNotesAudioVideo';

