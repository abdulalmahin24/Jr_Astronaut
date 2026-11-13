// ============================================================================
// NASA_SURVIVAL_MISSIONS — Standalone Survival Missions Module & Data Package
// NASA International Space Apps Challenge 2026 · Team Mysterio
// ============================================================================

// 1. Official NASA Scientific Survival Data Plan (2 Moon + 2 Mars)
export {
  NASA_SURVIVAL_DATA_PLAN,
  type NasaSurvivalDataPlanMission,
  type NasaDatasetCitation,
  type MathematicalModel,
  type TelemetryThreshold,
} from './data/nasaSurvivalDataPlan';

// 2. Orbital Mechanics Engine, Newtonian Gravity & Keplerian Solvers
export {
  HARDCORE_SURVIVAL_MISSIONS,
  BONUS_ORBITAL_CHALLENGE_MISSIONS,
  CELESTIAL_BODIES,
  computeKeplerianElements,
  calculateSuicideBurnAltitude,
  generateOrbitalDebrisField,
  createInitialTelemetry,
  type HardcoreMissionId,
  type HardcoreMissionConfig,
  type HardcoreTelemetryState,
  type DebrisObject,
} from './data/survivalMissions';

// 3. Full 8-Phase Mission Lifecycle Engine (VAB, Staging, Lunar Touchdown, EVA)
export {
  VAB_BOOSTERS,
  VAB_CORE_STAGES,
  VAB_UPPER_STAGES,
  VAB_SCIENCE_EQUIPMENT,
  VAB_REENTRY_CONFIGS,
  DESTINATION_PROFILES,
  calculateRocketPhysics,
  generateLaunchWeather,
  type ExpeditionDestination,
  type RocketBooster,
  type RocketCoreStage,
  type RocketUpperStage,
  type ScienceEquipment,
  type HeatShieldParachuteConfig,
} from './data/fullMissionLifecycle';

// 4. Standalone UI Components & 3D Video Simulators
export { NasaSurvivalPlanViewer } from './components/NasaSurvivalPlanViewer';
export { HardcoreSurvivalSimulator } from './components/HardcoreSurvivalSimulator';
export { FullMissionLifecycleModal } from './components/FullMissionLifecycleModal';
export { ThreeCurriculumVideoStage } from './components/ThreeCurriculumVideoStage';
export { VideoLessonPlayerView } from './components/VideoLessonPlayerView';
export { MissionBriefingDebriefingView } from './components/MissionBriefingDebriefingView';
export { CURRICULUM_NASA_VIDEO_SOURCES } from './data/curriculumNasaVideoSources';

