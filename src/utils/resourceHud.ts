import type { DifficultyMode } from '../types/game';

export type HudMeter =
  | 'power'
  | 'lifeSupport'
  | 'water'
  | 'oxygen'
  | 'food'
  | 'radiation'
  | 'science'
  | 'crewHealth';

const CADET_METERS: readonly HudMeter[] = ['power', 'lifeSupport', 'radiation'];
const EXPLORER_METERS: readonly HudMeter[] = ['power', 'water', 'food'];
const ADVANCED_METERS: readonly HudMeter[] = [
  'power',
  'water',
  'oxygen',
  'food',
  'radiation',
  'science',
  'crewHealth',
];

export function getVisibleHudMeters(mode: DifficultyMode): readonly HudMeter[] {
  if (mode === 'CADET') return CADET_METERS;
  if (mode === 'EXPLORER') return EXPLORER_METERS;
  return ADVANCED_METERS;
}

export function getLifeSupportLevel(oxygen: number, water: number): number {
  return Math.min(oxygen, water);
}
