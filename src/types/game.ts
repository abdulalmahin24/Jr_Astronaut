export type Destination = 'MOON' | 'MARS';
export type DifficultyMode = 'EXPLORER' | 'CADET' | 'ENGINEER' | 'SCIENTIST' | 'COMMANDER';

export interface ResourceState {
  power: number;      // 0 - 100 (%) or kWh
  water: number;      // 0 - 100 (%) or Liters
  oxygen: number;     // 0 - 100 (%)
  food: number;       // Sols of rations remaining
  radiation: number;  // Simulated percentage of mission dose budget (0-100+%)
  science: number;    // Accumulated Research Points (Goal: 300)
  crewHealth: number; // 0 - 100 (%)
}

export type ModuleStatus = 'NOMINAL' | 'WARNING' | 'CRITICAL' | 'OFFLINE';

export interface OutpostModules {
  habitat: {
    status: ModuleStatus;
    lifeSupportLoadKw: number;
  };
  powerStation: {
    status: ModuleStatus;
    activeSource: 'SOLAR' | 'BATTERY' | 'KILOPOWER_NUCLEAR';
    currentOutputKw: number;
  };
  greenhouse: {
    status: ModuleStatus;
    growthCycleDays: number;
    lightEfficiency: number;
  };
  stormVault: {
    status: ModuleStatus;
    isSealed: boolean;
    regolithShieldCm: number;
  };
}

export interface ChoiceOption {
  id: string;
  title: string;
  description: string;
  tradeOffText: string;
  resourceDelta: {
    power?: number;
    water?: number;
    oxygen?: number;
    food?: number;
    radiation?: number;
    science?: number;
    crewHealth?: number;
  };
  consequenceNarrative: string;
  educationalInsight: string;
}

export type SpeakerRole = 'CADET_MAYA' | 'COMMANDER_DADU' | 'HOUSTON_CAPCOM' | 'SYSTEM_AI';
export type IllustrationType =
  | 'SUN_FLARE'
  | 'LUNAR_NIGHT'
  | 'ICE_DISCOVERY'
  | 'GREENHOUSE_BLOOM'
  | 'DUST_STORM'
  | 'REGOLITH_BUILD'
  | 'WATER_LEAK'
  | 'ROVER_SURVEY'
  | 'AIRLOCK'
  | 'MISSION_VICTORY';

export interface ComicPanelData {
  speaker: SpeakerRole;
  dialogue: string;
  mood: 'curious' | 'warning' | 'excited' | 'heroic' | 'worried';
  illustrationType: IllustrationType;
}

export interface MissionEvent {
  id: string;
  sol: number;
  title: string;
  urgency: 'INFO' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  weatherNotice?: string;
  dataAttribution?: {
    label: 'LIVE' | 'ARCHIVED' | 'GAME SIMULATION';
    recordId?: string;
    sourceUrl?: string;
    fetchedAt?: string;
    error?: string;
  };
  nasaCitation: {
    title: string;
    docNumber: string;
    description: string;
  };
  comicPanels: ComicPanelData[];
  options: ChoiceOption[];
}

export interface SolHistoryEntry {
  sol: number;
  eventTitle: string;
  chosenOption: ChoiceOption;
  resourcesSnapshot: ResourceState;
  chainReactionNote: string;
}

export interface OutpostConfiguration {
  habitatType: 'INFLATABLE_TRANSHAB' | 'HEAVY_REGOLITH_DOME';
  powerGeneration: 'FOLDABLE_PV_ARRAY' | 'VERTICAL_SOLAR_TOWERS';
  energyStorage: 'LI_ION_BATTERY_BANK' | 'KILOPOWER_REACTOR';
  lifeSupport: 'STANDARD_ECLSS' | 'CLOSED_LOOP_SABATIER';
  waterRecycling: 'VACUUM_DISTILLATION' | 'THERMO_ELECTRIC_MEMBRANE';
  greenhouse: 'COMPACT_SALAD_POD' | 'FULL_CROP_BIOME';
  radiationShielding: 'POLYETHYLENE_LINERS' | 'SINTERED_REGOLITH_VAULT';
  communications: 'HIGH_GAIN_SBAND' | 'DEEP_SPACE_LASER_DSOC';
  maintenanceEquipment: 'MANUAL_TOOL_LOCKER' | 'AUTOMATED_3D_FABRICATOR';
  surfaceRover: 'UNPRESSURIZED_LTV' | 'PRESSURIZED_SCIENCE_ROVER';
  allocatedCargoKg: number;
  maxCargoBudgetKg: number;
}

export interface MissionObjective {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  requiredValue: number;
  currentValue: number;
  unit: string;
}

export type ShiftActionType = 
  | 'STANDARD_OPERATIONS'
  | 'POWER_CONSERVATION'
  | 'SCIENCE_INTENSIVE'
  | 'ECLSS_MAINTENANCE'
  | 'GREENHOUSE_SURGE'
  | 'ROVER_EVA';

export interface ShiftAction {
  type: ShiftActionType;
  label: string;
  description: string;
  powerDeltaKw: number;
  resourceImpactSummary: string;
}

export interface GameState {
  destination: Destination;
  difficultyMode: DifficultyMode;
  currentSol: number;
  totalSols: number;
  resources: ResourceState;
  modules: OutpostModules;
  activeEvent: MissionEvent | null;
  history: SolHistoryEntry[];
  isGameOver: boolean;
  gameOutcome: 'IN_PROGRESS' | 'VICTORY' | 'PARTIAL_SUCCESS' | 'CRITICAL_FAILURE';
  failureReason?: string;
  outpostConfig?: OutpostConfiguration;
  activeShift?: ShiftActionType;
  objectives?: MissionObjective[];
  equipmentCondition?: number; // 0 - 100%
  netPowerKw?: number;
  solarOutputKw?: number;
  isLunarNight?: boolean;
}
