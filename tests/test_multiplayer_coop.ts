import assert from 'node:assert/strict';
import {
  advanceCoopMission,
  createCoopMissionState,
  createSeededRandom,
  dashboardForRole,
  nicknameForId,
  QUICK_CHAT_PHRASES,
  resolveBotVote,
} from '../src/utils/crewCoopProtocol';

function replay(seed: number) {
  let state = createCoopMissionState('MOON');
  const rolls: number[] = [];
  for (const action of ['STANDARD_OPERATIONS', 'POWER_CONSERVATION', 'ECLSS_MAINTENANCE'] as const) {
    const turn = advanceCoopMission(state, action, seed);
    state = turn.state;
    rolls.push(turn.eventRoll);
  }
  return { state, rolls };
}

const firstReplay = replay(271828);
const repeatedReplay = replay(271828);
assert.deepEqual(firstReplay, repeatedReplay, 'The same mission seed and action sequence must replay identically.');
assert.notDeepEqual(firstReplay, replay(314159), 'A different seed must produce a different seeded event sequence.');
assert.deepEqual(
  Array.from({ length: 5 }, createSeededRandom(42)),
  Array.from({ length: 5 }, createSeededRandom(42)),
  'Seeded random sequences must be repeatable.',
);

const state = createCoopMissionState('MARS');
const commanderView = dashboardForRole('CDR', state, null, 'No reply yet.', 123);
const lifeSupportView = dashboardForRole('EECOM', state, null, 'No reply yet.', 123);
const shieldView = dashboardForRole('FDO', state, null, 'No reply yet.', 123);
const communicationsView = dashboardForRole('CAPCOM', state, 4, 'No reply yet.', 123);
assert.equal(commanderView.role, 'CDR');
assert.equal('oxygenPct' in commanderView, false, 'Power station view must not reveal life-support telemetry.');
assert.equal(lifeSupportView.role, 'EECOM');
assert.equal('powerPct' in lifeSupportView, false, 'Life-support station view must not reveal power telemetry.');
assert.equal(shieldView.role, 'FDO');
assert.equal('waterPct' in shieldView, false, 'Shield station view must not reveal life-support telemetry.');
assert.equal(communicationsView.role, 'CAPCOM');
assert.equal(communicationsView.earthReplyInSols, 4);

assert.equal(nicknameForId('same-id'), nicknameForId('same-id'));
assert.match(nicknameForId('same-id'), /^(Comet|Nova|Orbit|Luna|Rocket|Starlight|Cosmos|Pioneer)-(Blue|Gold|Green|Silver|Coral|Violet|Amber|Teal)$/);
assert.ok(QUICK_CHAT_PHRASES.READY.bn.length > 0, 'Quick chat includes a Bangla translation.');
assert.equal(resolveBotVote('POWER_CONSERVATION', { ...state, resources: { ...state.resources, power: 20 } }, 'CDR'), true);

console.log('[PASS] Crew co-op replay determinism, role-separated dashboards, nicknames, and bot decision rules.');
