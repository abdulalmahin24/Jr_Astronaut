/**
 * gearBonusHelper.ts
 * Unified Game Economy & Equipment Bonus Helper
 * Connects Academy Depot purchases to simulation physics across the app:
 * - Advanced Cryogenic O2 Tank: reduces suit/rover oxygen burn rate by 20%
 * - UltraFlex Solar Booster: increases outpost solar power generation by 25%
 */

export interface GearBonuses {
  oxygenBurnReduction: number; // e.g., 0.20 for 20% slower depletion
  powerGenMultiplier: number;  // e.g., 1.25 for +25% power generation
  hasCryoO2Tank: boolean;
  hasSolarBooster: boolean;
}

export function getActiveGearBonuses(): GearBonuses {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('astro_camp_equipment_catalog') : null;
    if (!raw) {
      return {
        oxygenBurnReduction: 0,
        powerGenMultiplier: 1.0,
        hasCryoO2Tank: false,
        hasSolarBooster: false,
      };
    }
    const catalog = JSON.parse(raw);
    const isEquipped = (id: string) =>
      Array.isArray(catalog) &&
      catalog.some((item: { id: string; equipped?: boolean }) => item.id === id && item.equipped);

    const hasCryoO2Tank = isEquipped('item-cryo-o2-tank');
    const hasSolarBooster = isEquipped('item-solar-booster');

    return {
      oxygenBurnReduction: hasCryoO2Tank ? 0.20 : 0,
      powerGenMultiplier: hasSolarBooster ? 1.25 : 1.0,
      hasCryoO2Tank,
      hasSolarBooster,
    };
  } catch {
    return {
      oxygenBurnReduction: 0,
      powerGenMultiplier: 1.0,
      hasCryoO2Tank: false,
      hasSolarBooster: false,
    };
  }
}

/**
 * Adds Cadet Credits to local storage and notifies active views.
 */
export function awardCadetCredits(amount: number): number {
  try {
    const current = parseInt(localStorage.getItem('astro_camp_cadet_credits') || '1200', 10);
    const updated = Math.max(0, current + amount);
    localStorage.setItem('astro_camp_cadet_credits', updated.toString());
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('cadet-credits-updated', { detail: { credits: updated, delta: amount } }));
    }
    return updated;
  } catch {
    return amount;
  }
}

