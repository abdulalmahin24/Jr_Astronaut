import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const source = await readFile(new URL('../src/utils/shackletonProgress.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
});
const dataUrl = `data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`;
const progressModule = await import(dataUrl);
const {
  INITIAL_SHACKLETON_PROGRESS,
  SHACKLETON_PROGRESS_STORAGE_KEY,
  bankShackletonReward,
  loadShackletonProgress,
  parseShackletonProgress,
  recordShackletonAttempt,
  saveShackletonProgress,
} = progressModule;

const failedAttempt = recordShackletonAttempt(INITIAL_SHACKLETON_PROGRESS, {
  success: false,
  iceSamples: 2,
});
assert.equal(failedAttempt.attempts, 1);
assert.equal(failedAttempt.bestIceSamples, 2);
assert.equal(failedAttempt.iceFinderBadgeEarned, false);

const bankedRun = bankShackletonReward(failedAttempt, {
  iceSamples: 3,
  waterUnits: 15,
  fuelUnits: 6,
});
assert.equal(bankedRun.successfulRuns, 1);
assert.equal(bankedRun.returnedIceSamples, 3);
assert.equal(bankedRun.waterStockUnits, 15);
assert.equal(bankedRun.fuelStockUnits, 6);
assert.equal(bankedRun.iceFinderBadgeEarned, true);

const storage = {
  value: null,
  getItem(key) {
    assert.equal(key, SHACKLETON_PROGRESS_STORAGE_KEY);
    return this.value;
  },
  setItem(key, value) {
    assert.equal(key, SHACKLETON_PROGRESS_STORAGE_KEY);
    this.value = value;
  },
};
saveShackletonProgress(bankedRun, storage);
assert.deepEqual(parseShackletonProgress(storage.value), bankedRun);
assert.deepEqual(loadShackletonProgress(storage).progress, bankedRun);
assert.match(loadShackletonProgress({ getItem: () => '{bad json' }).error, /could not be loaded/);
assert.throws(
  () => bankShackletonReward(bankedRun, { iceSamples: -1, waterUnits: 5, fuelUnits: 2 }),
  /non-negative whole-number/,
);

console.log('Shackleton progress, inventory, badge, and storage tests passed.');
