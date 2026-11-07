import assert from 'node:assert/strict';
import { spawn, type ChildProcess } from 'node:child_process';
import { createServer as createTcpServer } from 'node:net';
import { setTimeout as delay } from 'node:timers/promises';
import { resolve } from 'node:path';
import { Client, type Room } from '@colyseus/sdk';

type Snapshot = {
  roomId: string;
  started: boolean;
  sol: number;
  members: Array<{ id: string; role: string; isBot: boolean }>;
  dashboard: Record<string, unknown> | null;
  myRole: string;
};

function watchSnapshots(room: Room) {
  const seen: Snapshot[] = [];
  room.onMessage('crew:snapshot', (snapshot: Snapshot) => seen.push(snapshot));
  return {
    seen,
    waitFor(predicate: (snapshot: Snapshot) => boolean, timeoutMs = 4000): Promise<Snapshot> {
      const start = Date.now();
      return new Promise((resolvePromise, rejectPromise) => {
        const check = () => {
          const found = seen.find(predicate);
          if (found) {
            resolvePromise(found);
            return;
          }
          if (Date.now() - start > timeoutMs) {
            rejectPromise(new Error('Timed out waiting for a private crew snapshot.'));
            return;
          }
          setTimeout(check, 25);
        };
        check();
      });
    },
  };
}

async function getFreePort(): Promise<number> {
  const listener = createTcpServer();
  await new Promise<void>((resolvePromise, rejectPromise) => {
    listener.once('error', rejectPromise);
    listener.listen(0, '127.0.0.1', () => resolvePromise());
  });
  const address = listener.address();
  if (!address || typeof address === 'string') throw new Error('Could not reserve a local test port.');
  await new Promise<void>((resolvePromise, rejectPromise) => listener.close((error) => error ? rejectPromise(error) : resolvePromise()));
  return address.port;
}

async function waitForText(child: ChildProcess, target: string, timeoutMs = 10000): Promise<void> {
  return new Promise((resolvePromise, rejectPromise) => {
    const timer = setTimeout(() => rejectPromise(new Error(`Crew server did not start: ${target}`)), timeoutMs);
    child.stdout?.on('data', (data: Buffer) => {
      if (data.toString().includes(target)) {
        clearTimeout(timer);
        resolvePromise();
      }
    });
    child.once('error', (error) => {
      clearTimeout(timer);
      rejectPromise(error);
    });
    child.once('exit', (code) => {
      clearTimeout(timer);
      rejectPromise(new Error(`Crew server exited before starting (code ${code}).`));
    });
  });
}

const port = await getFreePort();
const projectRoot = process.cwd();
const server = spawn(process.execPath, [
  '--import',
  'tsx',
  resolve(projectRoot, 'server/src/index.ts'),
], {
  cwd: projectRoot,
  env: { ...process.env, COOP_PORT: String(port), COOP_HOST: '127.0.0.1' },
  stdio: ['ignore', 'pipe', 'pipe'],
});
const clients: Array<{ client: Client; room: Room }> = [];
let serverOutput = '';
server.stderr?.on('data', (data: Buffer) => { serverOutput += data.toString(); });

try {
  await waitForText(server, `:${port}`);
  const endpoint = `ws://127.0.0.1:${port}`;
  const firstClient = new Client(endpoint);
  const firstRoom = await firstClient.create('crew-coop', {
    destination: 'MARS',
    missionId: 'mars-outpost',
    resumeId: 'test-cadet-one',
  });
  clients.push({ client: firstClient, room: firstRoom });
  const firstWatch = watchSnapshots(firstRoom);

  firstRoom.send('mission:start', {});
  const started = await firstWatch.waitFor((snapshot) => snapshot.started);
  assert.equal(started.members.length, 4, 'Each room reserves four roles, using bots for unfilled seats.');
  assert.equal(started.members.filter((member) => member.isBot).length, 3);
  assert.ok(started.dashboard && !('resources' in started.dashboard), 'The server must not send a full resource state to each player.');

  firstRoom.send('mission:propose', { action: 'STANDARD_OPERATIONS' });
  const firstTurn = await firstWatch.waitFor((snapshot) => snapshot.sol === 1);
  assert.equal(firstTurn.myRole, 'CDR');
  assert.ok(firstTurn.dashboard && 'powerPct' in firstTurn.dashboard);
  assert.ok(!('oxygenPct' in (firstTurn.dashboard ?? {})), 'Commander only receives the power dashboard.');

  for (const [index, expectedRole] of ['EECOM', 'FDO', 'CAPCOM'].entries()) {
    const client = new Client(endpoint);
    const room = await client.joinById(firstRoom.roomId, { resumeId: `test-cadet-${index + 2}` });
    clients.push({ client, room });
    const watcher = watchSnapshots(room);
    const snapshot = await watcher.waitFor((next) => next.members.filter((member) => !member.isBot).length === index + 2);
    assert.ok(snapshot.members.some((member) => member.role === expectedRole && !member.isBot));
  }

  const roleWatchers = clients.map(({ room }) => watchSnapshots(room));
  firstRoom.send('crew:settings', { voiceEnabled: true });
  const roleSnapshots = await Promise.all(roleWatchers.map((watcher) => watcher.waitFor((snapshot) => Boolean(snapshot.dashboard))));
  assert.deepEqual(new Set(roleSnapshots.map((snapshot) => snapshot.myRole)).size, 4);
  const lifeSupport = roleSnapshots.find((snapshot) => snapshot.myRole === 'EECOM');
  assert.ok(lifeSupport?.dashboard && 'oxygenPct' in lifeSupport.dashboard);
  assert.ok(!('powerPct' in (lifeSupport?.dashboard ?? {})));

  clients.forEach(({ room }) => {
    room.onMessage('crew:chat', () => undefined);
    room.onMessage('crew:error', () => undefined);
    room.onMessage('voice:signal', () => undefined);
    room.onMessage('voice:disabled', () => undefined);
  });
  let quickMessage: { phraseId?: string; en?: string; bn?: string } | undefined;
  const secondRoom = clients[1].room;
  const quickMessagePromise = new Promise<void>((resolvePromise, rejectPromise) => {
    const timer = setTimeout(() => rejectPromise(new Error('Quick message was not relayed.')), 2500);
    secondRoom.onMessage('crew:chat', (message: typeof quickMessage) => {
      quickMessage = message;
      clearTimeout(timer);
      resolvePromise();
    });
  });
  firstRoom.send('crew:chat', { text: 'free text should be rejected' });
  await delay(120);
  assert.equal(quickMessage, undefined, 'Free-text chat is rejected by the server.');
  firstRoom.send('crew:chat', { phraseId: 'READY' });
  await quickMessagePromise;
  assert.equal(quickMessage?.en, 'Ready to help!');
  assert.ok(quickMessage?.bn);

  const voiceSignalPromise = new Promise<void>((resolvePromise, rejectPromise) => {
    const timer = setTimeout(() => rejectPromise(new Error('Voice signalling was not relayed.')), 2500);
    secondRoom.onMessage('voice:signal', (message: { from: string; signal: { type: string } }) => {
      assert.equal(message.from, firstRoom.sessionId);
      assert.equal(message.signal.type, 'candidate');
      clearTimeout(timer);
      resolvePromise();
    });
  });
  firstRoom.send('voice:signal', {
    to: secondRoom.sessionId,
    signal: { type: 'candidate', candidate: { candidate: 'test-candidate' } },
  });
  await voiceSignalPromise;

  const botReplacement = firstWatch.waitFor((snapshot) => snapshot.members.some((member) => member.role === 'CAPCOM' && member.isBot));
  await clients[3].room.leave(true);
  await botReplacement;

  const thirdRoom = clients[2].room;
  await delay(5100);
  let reconnected = false;
  const reconnectPromise = new Promise<void>((resolvePromise, rejectPromise) => {
    const timer = setTimeout(() => rejectPromise(new Error('Dropped client did not reconnect.')), 8000);
    thirdRoom.onReconnect(() => {
      reconnected = true;
      clearTimeout(timer);
      resolvePromise();
    });
  });
  void thirdRoom.leave(false);
  await reconnectPromise;
  assert.equal(reconnected, true);

  console.log('[PASS] Colyseus room: four roles, server simulation, private dashboards, votes, preset chat, voice relay, bot replacement, reconnect.');
} catch (error) {
  const details = error instanceof Error ? error.message : String(error);
  throw new Error(`${details}${serverOutput ? `\nCrew server output:\n${serverOutput}` : ''}`);
} finally {
  await Promise.race([
    Promise.all(clients.map(({ room }) => room.leave(true).catch(() => undefined))),
    delay(2500),
  ]);
  if (server.exitCode === null) {
    server.kill('SIGTERM');
    await Promise.race([
      new Promise<void>((resolvePromise) => server.once('exit', () => resolvePromise())),
      delay(1500),
    ]);
    if (server.exitCode === null) server.kill('SIGKILL');
  }
}
