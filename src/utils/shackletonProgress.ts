export interface ShackletonProgress {
  attempts: number;
  successfulRuns: number;
  bestIceSamples: number;
  returnedIceSamples: number;
  waterStockUnits: number;
  fuelStockUnits: number;
  iceFinderBadgeEarned: boolean;
}

export interface ShackletonAttemptResult {
  success: boolean;
  iceSamples: number;
  reason?: string;
}

export interface ShackletonReward {
  iceSamples: number;
  waterUnits: number;
  fuelUnits: number;
}

export interface ShackletonProgressReadResult {
  progress: ShackletonProgress;
  error: string | null;
}

export const SHACKLETON_PROGRESS_STORAGE_KEY = 'astro_shackleton_progress';

export const INITIAL_SHACKLETON_PROGRESS: ShackletonProgress = {
  attempts: 0,
  successfulRuns: 0,
  bestIceSamples: 0,
  returnedIceSamples: 0,
  waterStockUnits: 0,
  fuelStockUnits: 0,
  iceFinderBadgeEarned: false,
};

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}

export function parseShackletonProgress(serialized: string | null): ShackletonProgress {
  if (serialized === null) return { ...INITIAL_SHACKLETON_PROGRESS };

  const parsed: unknown = JSON.parse(serialized);
  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !('attempts' in parsed) ||
    !('successfulRuns' in parsed) ||
    !('bestIceSamples' in parsed) ||
    !('returnedIceSamples' in parsed) ||
    !('waterStockUnits' in parsed) ||
    !('fuelStockUnits' in parsed) ||
    !('iceFinderBadgeEarned' in parsed)
  ) {
    throw new Error('Saved Shackleton progress has an invalid shape.');
  }

  const value = parsed as Record<string, unknown>;
  if (
    !isNonNegativeInteger(value.attempts) ||
    !isNonNegativeInteger(value.successfulRuns) ||
    !isNonNegativeInteger(value.bestIceSamples) ||
    !isNonNegativeInteger(value.returnedIceSamples) ||
    !isNonNegativeInteger(value.waterStockUnits) ||
    !isNonNegativeInteger(value.fuelStockUnits) ||
    typeof value.iceFinderBadgeEarned !== 'boolean'
  ) {
    throw new Error('Saved Shackleton progress contains invalid values.');
  }

  return {
    attempts: value.attempts,
    successfulRuns: value.successfulRuns,
    bestIceSamples: value.bestIceSamples,
    returnedIceSamples: value.returnedIceSamples,
    waterStockUnits: value.waterStockUnits,
    fuelStockUnits: value.fuelStockUnits,
    iceFinderBadgeEarned: value.iceFinderBadgeEarned,
  };
}

export function recordShackletonAttempt(
  progress: ShackletonProgress,
  result: ShackletonAttemptResult,
): ShackletonProgress {
  if (!isNonNegativeInteger(result.iceSamples)) {
    throw new Error('Ice sample count must be a non-negative integer.');
  }

  return {
    ...progress,
    attempts: progress.attempts + 1,
    bestIceSamples: Math.max(progress.bestIceSamples, result.iceSamples),
  };
}

export function bankShackletonReward(
  progress: ShackletonProgress,
  reward: ShackletonReward,
): ShackletonProgress {
  if (
    !isNonNegativeInteger(reward.iceSamples) ||
    !isNonNegativeInteger(reward.waterUnits) ||
    !isNonNegativeInteger(reward.fuelUnits)
  ) {
    throw new Error('Shackleton rewards must be non-negative whole-number game units.');
  }

  return {
    ...progress,
    successfulRuns: progress.successfulRuns + 1,
    returnedIceSamples: progress.returnedIceSamples + reward.iceSamples,
    waterStockUnits: progress.waterStockUnits + reward.waterUnits,
    fuelStockUnits: progress.fuelStockUnits + reward.fuelUnits,
    iceFinderBadgeEarned: true,
  };
}

export function loadShackletonProgress(
  storage: Pick<Storage, 'getItem'> = localStorage,
): ShackletonProgressReadResult {
  try {
    return {
      progress: parseShackletonProgress(storage.getItem(SHACKLETON_PROGRESS_STORAGE_KEY)),
      error: null,
    };
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unknown browser storage error.';
    return {
      progress: { ...INITIAL_SHACKLETON_PROGRESS },
      error: `Shackleton progress could not be loaded: ${detail}`,
    };
  }
}

export function saveShackletonProgress(
  progress: ShackletonProgress,
  storage: Pick<Storage, 'setItem'> = localStorage,
): void {
  storage.setItem(SHACKLETON_PROGRESS_STORAGE_KEY, JSON.stringify(progress));
}
