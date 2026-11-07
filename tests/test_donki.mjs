import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ts = require('typescript');

async function loadTypeScriptModule(relativePath) {
  const source = await readFile(new URL(relativePath, import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  });
  const dataUrl = `data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`;
  return import(dataUrl);
}

const mapper = await loadTypeScriptModule('../src/utils/donkiMapper.ts');
const radiation = await loadTypeScriptModule('../src/utils/radiationScale.ts');
const events = await loadTypeScriptModule('../src/data/events.ts');

const livePayload = {
  cme: [{
    activityID: '2026-10-01T10:00:00-CME-001',
    startTime: '2026-10-01T10:00Z',
    link: 'https://kauai.ccmc.gsfc.nasa.gov/DONKI/view/CME/1',
    cmeAnalyses: [
      { speed: 900, isMostAccurate: false },
      { speed: 1850, isMostAccurate: true },
    ],
    linkedEvents: [{ activityID: '2026-10-01T08:00:00-FLR-001', catalog: 'FLR' }],
  }],
  flr: [{
    flrID: '2026-10-01T08:00:00-FLR-001',
    classType: 'X1.2',
    beginTime: '2026-10-01T08:00Z',
  }],
  sep: [],
  gst: [],
};

const storm = mapper.mapDonkiPayloadToStorm(livePayload);
assert.equal(storm.recordId, '2026-10-01T10:00:00-CME-001');
assert.equal(storm.flareClass, 'X1.2');
assert.equal(storm.stormStrength, 'EXTREME');
assert.equal(storm.cmeSpeedKmPerSecond, 1850);
assert.equal(storm.warningHours, 22, 'Warning time should approximate 1 AU divided by the accurate CME speed.');
const generatedEvent = events.createSolarStormMissionEvent(
  events.MISSION_EVENTS.find((event) => event.id === 'sol-12-solar-flare'),
  { source: 'ARCHIVED', summary: storm, fetchedAt: '2026-10-02T00:00:00Z' }
);
assert.match(generatedEvent.title, /X1\.2/);
assert.equal(generatedEvent.dataAttribution.label, 'ARCHIVED');
assert.equal(generatedEvent.dataAttribution.recordId, storm.recordId);
assert.match(generatedEvent.weatherNotice, /22 h/);
const simulatedEvent = events.createSolarStormMissionEvent(
  events.MISSION_EVENTS.find((event) => event.id === 'sol-12-solar-flare'),
  { source: 'UNAVAILABLE', error: 'network offline' }
);
assert.equal(simulatedEvent.dataAttribution.label, 'GAME SIMULATION');
assert.match(simulatedEvent.weatherNotice, /network offline/);

const archived = mapper.selectDonkiSource(undefined, storm, '2026-10-02T00:00:00Z');
assert.equal(archived.source, 'ARCHIVED');
assert.equal(archived.summary.recordId, storm.recordId);
assert.equal(archived.fetchedAt, '2026-10-02T00:00:00Z');

const live = mapper.selectDonkiSource(storm, undefined);
assert.equal(live.source, 'LIVE');

const unavailable = mapper.selectDonkiSource(undefined, undefined);
assert.equal(unavailable.source, 'UNAVAILABLE');

const resolvedArchive = await mapper.resolveDonkiDataSources(
  async () => { throw new Error('network offline'); },
  async () => ({ ...livePayload, fetchedAt: '2026-10-02T00:00:00Z' })
);
assert.equal(resolvedArchive.source, 'ARCHIVED');
assert.equal(resolvedArchive.summary.recordId, storm.recordId);

const resolvedUnavailable = await mapper.resolveDonkiDataSources(
  async () => { throw new Error('network offline'); },
  async () => ({ cme: [], flr: [], sep: [], gst: [], fetchedAt: null })
);
assert.equal(resolvedUnavailable.source, 'UNAVAILABLE');
assert.match(resolvedUnavailable.error, /network offline/);

assert.equal(radiation.MISSION_DOSE_BUDGET_LIMIT_PERCENT, 100);
assert.equal(radiation.isMissionDoseBudgetExceeded(99.9), false);
assert.equal(radiation.isMissionDoseBudgetExceeded(100), true);

console.log('DONKI mapping, source fallback, and radiation-scale tests passed.');
