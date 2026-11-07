import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const source = await readFile(new URL('../src/utils/resourceHud.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
});
const dataUrl = `data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`;
const hud = await import(dataUrl);

async function loadCommonJsTypeScript(relativePath, localRequire = () => {
  throw new Error('Unexpected module import');
}) {
  const moduleSource = await readFile(new URL(relativePath, import.meta.url), 'utf8');
  const transpiled = ts.transpileModule(moduleSource, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  });
  const module = { exports: {} };
  new Function('require', 'exports', 'module', transpiled.outputText)(
    localRequire,
    module.exports,
    module
  );
  return module.exports;
}

assert.deepEqual(hud.getVisibleHudMeters('CADET'), ['power', 'lifeSupport', 'radiation']);
assert.deepEqual(hud.getVisibleHudMeters('EXPLORER'), ['power', 'water', 'food']);
assert.deepEqual(hud.getVisibleHudMeters('ENGINEER'), [
  'power',
  'water',
  'oxygen',
  'food',
  'radiation',
  'science',
  'crewHealth',
]);
assert.equal(hud.getLifeSupportLevel(72, 81), 72);
assert.equal(hud.getLifeSupportLevel(90, 90), 90);

const baseEvents = await loadCommonJsTypeScript('../src/data/events.ts');
const tierEvents = await loadCommonJsTypeScript(
  '../src/data/tierEvents.ts',
  (specifier) => {
    if (specifier === './events') return baseEvents;
    throw new Error(`Unexpected tier event import: ${specifier}`);
  }
);
const missionEngine = await loadCommonJsTypeScript(
  '../src/utils/missionScenarioEngine.ts',
  (specifier) => {
    if (specifier === '../data/tierEvents') return tierEvents;
    throw new Error(`Unexpected mission engine import: ${specifier}`);
  }
);
const cadetDecks = [
  tierEvents.getEventDeck('CADET'),
  missionEngine.getMissionScenarioDeck({ destination: 'MARS' }, 'CADET'),
];
for (const deck of cadetDecks) {
  for (const event of deck) {
    for (const option of event.options) {
      assert.ok(option.tradeOffText.trim(), `${event.id}/${option.id} must explain its trade-off`);
      assert.ok(
        Object.values(option.resourceDelta).some((delta) => delta < 0),
        `${event.id}/${option.id} must spend at least one resource`
      );
    }
  }
}

console.log('Cadet, Explorer, Advanced HUD, and Cadet-choice cost tests passed.');
