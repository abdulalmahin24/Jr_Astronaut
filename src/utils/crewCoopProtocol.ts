import type { GameState, ShiftActionType } from '../types/game';
import {
  DEFAULT_LUNAR_OUTPOST,
  DEFAULT_MARS_OUTPOST,
  computeDailySimulationTurn,
  generateMissionObjectives,
} from './simulationEngine';
import type { CrewRole } from './multiplayerMissionService';

export const CREW_ROLES_ORDER: CrewRole[] = ['CDR', 'EECOM', 'FDO', 'CAPCOM'];

export const QUICK_CHAT_PHRASES = {
  READY: { en: 'Ready to help!', bn: 'আমি সাহায্য করতে প্রস্তুত!' },
  POWER: { en: 'How is the power?', bn: 'বিদ্যুৎ কেমন আছে?' },
  LIFE_SUPPORT: { en: 'Check air and water.', bn: 'বাতাস ও পানি দেখো।' },
  SHIELD: { en: 'Check the storm shield.', bn: 'ঝড়ের ঢাল পরীক্ষা করো।' },
  COMMS: { en: 'Please send an Earth update.', bn: 'পৃথিবীতে খবর পাঠাও।' },
  VOTE: { en: 'Let’s vote on the plan.', bn: 'চলো পরিকল্পনায় ভোট দিই।' },
  THANKS: { en: 'Great teamwork!', bn: 'দারুণ দলগত কাজ!' },
  NEED_HELP: { en: 'I need help.', bn: 'আমার সাহায্য দরকার।' },
} as const;

export type QuickChatPhraseId = keyof typeof QUICK_CHAT_PHRASES;

const NICKNAME_WORDS = [
  'Comet', 'Nova', 'Orbit', 'Luna', 'Rocket', 'Starlight', 'Cosmos', 'Pioneer',
];
const NICKNAME_COLORS = ['Blue', 'Gold', 'Green', 'Silver', 'Coral', 'Violet', 'Amber', 'Teal'];

export function nicknameForId(id: string): string {
  let hash = 2166136261;
  for (const char of id) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  const word = NICKNAME_WORDS[(hash >>> 0) % NICKNAME_WORDS.length];
  const color = NICKNAME_COLORS[((hash >>> 8) >>> 0) % NICKNAME_COLORS.length];
  return `${word}-${color}`;
}

export function createSeededRandom(seed: number): () => number {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let mixed = value;
    mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

export function createCoopMissionState(destination: GameState['destination']): GameState {
  const outpostConfig = destination === 'MOON' ? DEFAULT_LUNAR_OUTPOST : DEFAULT_MARS_OUTPOST;
  return {
    destination,
    difficultyMode: 'CADET',
    currentSol: 0,
    totalSols: 10,
    resources: {
      power: 75,
      water: 80,
      oxygen: 90,
      food: 24,
      radiation: 12,
      science: 10,
      crewHealth: 95,
    },
    modules: {
      habitat: { status: 'NOMINAL', lifeSupportLoadKw: 6 },
      powerStation: { status: 'NOMINAL', activeSource: 'SOLAR', currentOutputKw: 35 },
      greenhouse: { status: 'NOMINAL', growthCycleDays: 0, lightEfficiency: 1 },
      stormVault: { status: 'NOMINAL', isSealed: false, regolithShieldCm: 0 },
    },
    activeEvent: null,
    history: [],
    isGameOver: false,
    gameOutcome: 'IN_PROGRESS',
    outpostConfig,
    objectives: generateMissionObjectives(destination),
    equipmentCondition: 100,
    netPowerKw: 0,
    solarOutputKw: 35,
    isLunarNight: false,
    activeShift: 'STANDARD_OPERATIONS',
  };
}

export function advanceCoopMission(
  state: GameState,
  action: ShiftActionType,
  seed: number,
): { state: GameState; eventRoll: number } {
  const nextSol = state.currentSol + 1;
  const result = computeDailySimulationTurn({ ...state, currentSol: nextSol }, action);
  const eventRoll = createSeededRandom(seed ^ nextSol)();
  const nextState: GameState = {
    ...state,
    currentSol: nextSol,
    resources: result.updatedResources,
    objectives: result.updatedObjectives,
    isGameOver: result.isGameOver,
    gameOutcome: result.outcome,
    failureReason: result.failureReason || undefined,
    activeShift: action,
    netPowerKw: result.telemetry.netPowerKw,
    solarOutputKw: result.telemetry.powerGeneratedKw,
    isLunarNight: result.telemetry.isLunarNight,
    equipmentCondition: Math.min(100, Math.max(0, (state.equipmentCondition ?? 100) + result.telemetry.equipmentWearDeltaPct)),
  };
  return { state: nextState, eventRoll };
}

export type CrewDashboard =
  | { role: 'CDR'; sol: number; powerPct: number; netPowerKw: number; action: ShiftActionType | null }
  | { role: 'EECOM'; sol: number; oxygenPct: number; waterPct: number; foodRations: number; crewHealthPct: number }
  | { role: 'FDO'; sol: number; doseBudgetPct: number; trainingStorm: string; shieldAdvice: string }
  | { role: 'CAPCOM'; sol: number; mission: string; earthReplyInSols: number | null; lastReply: string };

export function dashboardForRole(
  role: CrewRole,
  state: GameState,
  earthReplyDueSol: number | null,
  lastEarthReply: string,
  seed: number,
): CrewDashboard {
  switch (role) {
    case 'CDR':
      return {
        role,
        sol: state.currentSol,
        powerPct: state.resources.power,
        netPowerKw: state.netPowerKw ?? 0,
        action: state.activeShift ?? null,
      };
    case 'EECOM':
      return {
        role,
        sol: state.currentSol,
        oxygenPct: state.resources.oxygen,
        waterPct: state.resources.water,
        foodRations: state.resources.food,
        crewHealthPct: state.resources.crewHealth,
      };
    case 'FDO': {
      const random = createSeededRandom(seed ^ state.currentSol);
      const alert = random() > 0.62 ? 'Training storm watch' : 'No training storm alert';
      return {
        role,
        sol: state.currentSol,
        doseBudgetPct: state.resources.radiation,
        trainingStorm: alert,
        shieldAdvice: state.resources.radiation > 35 ? 'Consider shelter and a team vote.' : 'Shield level is within the game budget.',
      };
    }
    case 'CAPCOM':
      return {
        role,
        sol: state.currentSol,
        mission: state.destination === 'MOON' ? 'Lunar outpost' : 'Mars outpost',
        earthReplyInSols: earthReplyDueSol === null ? null : Math.max(0, earthReplyDueSol - state.currentSol),
        lastReply: lastEarthReply,
      };
  }
}

export function resolveBotVote(
  action: ShiftActionType,
  state: GameState,
  role: CrewRole,
): boolean {
  if (role === 'CDR' && state.resources.power < 40) return action === 'POWER_CONSERVATION';
  if (role === 'EECOM' && (state.resources.oxygen < 45 || state.resources.water < 35)) {
    return action === 'ECLSS_MAINTENANCE';
  }
  if (role === 'FDO' && state.resources.radiation > 35) return action === 'POWER_CONSERVATION';
  if (role === 'CAPCOM') return action !== 'ROVER_EVA';
  return action === 'STANDARD_OPERATIONS';
}
