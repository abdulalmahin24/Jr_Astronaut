export const MISSION_DOSE_BUDGET_LIMIT_PERCENT = 100;

export function isMissionDoseBudgetExceeded(value: number): boolean {
  return value >= MISSION_DOSE_BUDGET_LIMIT_PERCENT;
}
