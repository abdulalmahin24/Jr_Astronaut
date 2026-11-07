import { useCallback, useEffect, useRef, useState } from 'react';
import type { CrewDashboard } from '../utils/crewCoopProtocol';
import { QUICK_CHAT_PHRASES, type QuickChatPhraseId } from '../utils/crewCoopProtocol';
import type { CrewRole } from '../utils/multiplayerMissionService';
import { ColyseusNetworkTransport } from '../utils/multiplayerTransport';
import { CrewVoiceMesh } from '../utils/crewVoiceMesh';

type CrewSnapshot = {
  roomId: string;
  missionId: string;
  destination: 'MOON' | 'MARS';
  started: boolean;
  sol: number;
  totalSols: number;
  outcome: string;
  isGameOver: boolean;
  members: Array<{ id: string; name: string; role: CrewRole; isHost: boolean; isBot: boolean; connected: boolean }>;
  proposal: null | {
    id: number;
    action: string;
    votesYes: number;
    votesNo: number;
    hasVoted: Record<string, boolean>;
  };
  chatEnabled: boolean;
  voiceEnabled: boolean;
  voiceRelayConfigured: boolean;
  chat: Array<{ id: string; senderId: string; sender: string; role: CrewRole; en: string; bn: string; sentAt: number }>;
  myRole: CrewRole;
  isHost: boolean;
  dashboard: CrewDashboard | null;
  iceServers: RTCIceServer[];
};

const ENDPOINT = import.meta.env.VITE_MULTIPLAYER_SERVER_URL
  || (import.meta.env.DEV ? 'ws://localhost:2567' : '');
const ACTIONS = [
  ['STANDARD_OPERATIONS', 'Standard operations'],
  ['POWER_CONSERVATION', 'Save power'],
  ['SCIENCE_INTENSIVE', 'Do more science'],
  ['ECLSS_MAINTENANCE', 'Service air and water'],
  ['GREENHOUSE_SURGE', 'Grow more food'],
  ['ROVER_EVA', 'Send the rover'],
] as const;
const STATION_NAMES: Record<CrewRole, string> = {
  CDR: 'Power station',
  EECOM: 'Life support station',
  FDO: 'Radiation shield and storm watch',
  CAPCOM: 'Communications station',
};

function getResumeId(): string {
  const key = 'astro_camp_crew_resume_id';
  let resumeId = sessionStorage.getItem(key);
  if (!resumeId) {
    resumeId = globalThis.crypto?.randomUUID?.() ?? `guest-${Math.random().toString(36).slice(2)}`;
    sessionStorage.setItem(key, resumeId);
  }
  return resumeId;
}

export function NetworkCrewPanel({ initialRoomCode }: { initialRoomCode?: string }) {
  const [transport, setTransport] = useState<ColyseusNetworkTransport | null>(null);
  const [snapshot, setSnapshot] = useState<CrewSnapshot | null>(null);
  const [status, setStatus] = useState('Create a private room or enter a room code to join friends.');
  const [error, setError] = useState('');
  const [roomCodeInput, setRoomCodeInput] = useState(initialRoomCode ?? '');
  const [destination, setDestination] = useState<'MOON' | 'MARS'>('MOON');
  const [proposalAction, setProposalAction] = useState<(typeof ACTIONS)[number][0]>('STANDARD_OPERATIONS');
  const [voiceStatus, setVoiceStatus] = useState('Voice is off until you enable it.');
  const [voiceReady, setVoiceReady] = useState(false);
  const [microphoneMuted, setMicrophoneMuted] = useState(false);
  const [pushToTalkActive, setPushToTalkActive] = useState(false);
  const [mutedPlayers, setMutedPlayers] = useState<Set<string>>(() => new Set());
  const voiceRef = useRef<CrewVoiceMesh | null>(null);

  const connect = useCallback((roomCode?: string) => {
    if (!ENDPOINT) {
      setError('Network co-op is not configured for this website yet. Set VITE_MULTIPLAYER_SERVER_URL and start the crew server.');
      return;
    }
    if (transport) return;
    setError('');
    const network = new ColyseusNetworkTransport(ENDPOINT);
    setTransport(network);
    setStatus(roomCode ? 'Joining private crew room…' : 'Creating private crew room…');
    const options = { resumeId: getResumeId() };
    const openRoom = roomCode
      ? network.joinRoom(roomCode.trim(), options)
      : network.createRoom({ destination, missionId: destination === 'MOON' ? 'lunar-outpost' : 'mars-outpost' });
    void openRoom.then((code) => {
      if (typeof code === 'string') setRoomCodeInput(code);
      setStatus('Connected to a private, four-seat crew room.');
    }).catch((joinError: unknown) => {
      const message = joinError instanceof Error ? joinError.message : 'Could not connect to that crew room.';
      setError(message);
      setStatus('Not connected.');
      setTransport(null);
      void network.close();
    });
  }, [destination, transport]);

  useEffect(() => {
    if (!initialRoomCode || transport) return;
    connect(initialRoomCode);
  }, [connect, initialRoomCode, transport]);

  useEffect(() => {
    if (!transport) return;
    const unsubscribe = transport.subscribe(({ type, payload }) => {
      if (type === 'crew:snapshot') {
        const next = payload as CrewSnapshot;
        setSnapshot(next);
        voiceRef.current?.setAllowed(next.voiceEnabled);
        if (transport.sessionId) {
          voiceRef.current?.syncPeers(transport.sessionId, next.members, next.iceServers);
        }
      } else if (type === 'crew:chat') {
        setSnapshot((previous) => previous ? { ...previous, chat: [...previous.chat.slice(-19), payload as CrewSnapshot['chat'][number]] } : previous);
      } else if (type === 'connection:dropped') {
        setStatus('Connection dropped. Trying to reconnect…');
      } else if (type === 'connection:restored') {
        setStatus('Connection restored.');
      } else if (type === 'connection:error') {
        setError(typeof payload === 'string' ? payload : 'The crew connection reported an error.');
      } else if (type === 'crew:error') {
        setError((payload as { message?: string })?.message ?? 'That crew message could not be sent.');
      }
    });
    return unsubscribe;
  }, [transport]);

  useEffect(() => {
    if (!transport || !voiceReady || !snapshot || !transport.sessionId) return;
    voiceRef.current?.syncPeers(transport.sessionId, snapshot.members, snapshot.iceServers);
  }, [transport, voiceReady, snapshot]);

  useEffect(() => () => {
    voiceRef.current?.dispose();
    voiceRef.current = null;
    if (transport) void transport.close();
  }, [transport]);

  useEffect(() => {
    if (!transport) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code !== 'KeyV' || event.repeat || !voiceReady || microphoneMuted || !snapshot?.voiceEnabled || !snapshot.voiceRelayConfigured) return;
      const target = event.target as HTMLElement | null;
      if (target?.isContentEditable || target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') return;
      setPushToTalk(true);
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.code === 'KeyV') setPushToTalk(false);
    };
    const onBlur = () => setPushToTalk(false);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, [transport, voiceReady, microphoneMuted, snapshot?.voiceEnabled, snapshot?.voiceRelayConfigured]);

  const send = (type: string, payload: unknown) => {
    try {
      transport?.send({ type, payload });
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : 'Could not send this crew action.');
    }
  };

  const enableVoice = async () => {
    if (!transport) return;
    if (!voiceRef.current) voiceRef.current = new CrewVoiceMesh(transport, setVoiceStatus);
    await voiceRef.current.unlockAudio();
    setVoiceReady(true);
  };

  const setPushToTalk = (held: boolean) => {
    const canSpeak = Boolean(snapshot?.voiceEnabled && snapshot.voiceRelayConfigured);
    if (held && (microphoneMuted || !canSpeak)) return;
    voiceRef.current?.setPushToTalk(held);
    setPushToTalkActive(held && voiceReady && !microphoneMuted && canSpeak);
  };

  const toggleMicrophoneMute = () => {
    const nextMuted = !microphoneMuted;
    setMicrophoneMuted(nextMuted);
    voiceRef.current?.setMuted(nextMuted);
    if (nextMuted) setPushToTalkActive(false);
  };

  const toggleRemoteMute = (id: string) => {
    setMutedPlayers((previous) => {
      const next = new Set(previous);
      const shouldMute = !next.has(id);
      if (shouldMute) next.add(id);
      else next.delete(id);
      voiceRef.current?.setRemoteMuted(id, shouldMute);
      return next;
    });
  };

  const copyInvite = async () => {
    if (!snapshot) return;
    const url = `${window.location.origin}${window.location.pathname}?crewRoom=${encodeURIComponent(snapshot.roomId)}`;
    try {
      await navigator.clipboard.writeText(url);
      setStatus('Invite link copied. Share it only with your crew.');
    } catch (copyError) {
      setError(copyError instanceof Error ? `Could not copy invite link: ${copyError.message}` : 'Could not copy invite link.');
    }
  };

  const role = snapshot?.dashboard;

  return (
    <section aria-label="Private network crew co-op" style={{ padding: 16, border: 'var(--rule-hair)', background: 'var(--color-paper)' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div>
          <strong style={{ color: 'var(--color-accent-green)' }}>PRIVATE CREW CO-OP</strong>
          <div style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 4 }}>
            2–4 friends · no account · no public matchmaking · chat is preset-only
          </div>
        </div>
        {snapshot && (
          <button type="button" onClick={() => void copyInvite()}>
            Copy invite link · {snapshot.roomId}
          </button>
        )}
      </header>

      {!transport && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
          <label>
            Destination{' '}
            <select value={destination} onChange={(event) => setDestination(event.target.value as 'MOON' | 'MARS')}>
              <option value="MOON">Moon</option>
              <option value="MARS">Mars</option>
            </select>
          </label>
          <button type="button" onClick={() => connect()}>Create private room</button>
          <input
            aria-label="Private room code"
            value={roomCodeInput}
            onChange={(event) => setRoomCodeInput(event.target.value)}
            placeholder="Room code"
            maxLength={32}
          />
          <button type="button" onClick={() => connect(roomCodeInput)}>Join by code</button>
        </div>
      )}

      <p role="status" style={{ fontSize: 12, color: 'var(--color-muted)' }}>{status}</p>
      {error && <p role="alert" style={{ color: 'var(--color-danger, #b42318)', fontSize: 12 }}>{error}</p>}

      {snapshot && transport && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
          <div>
            <h3>{snapshot.destination === 'MOON' ? 'Lunar outpost' : 'Mars outpost'} · Sol {snapshot.sol}/{snapshot.totalSols} [GAME SIMULATION VALUE]</h3>
            <p style={{ fontSize: 12 }}>Mission status: {snapshot.isGameOver ? snapshot.outcome : snapshot.started ? 'In progress' : 'Waiting for the host to start'} [GAME SIMULATION VALUE]</p>
            {!snapshot.started && snapshot.isHost && (
              <button type="button" onClick={() => send('mission:start', {})}>Start shared mission</button>
            )}

            <h4>Your station: {STATION_NAMES[snapshot.myRole]}</h4>
            {role?.role === 'CDR' && (
              <p>Power: {role.powerPct.toFixed(0)}% [GAME SIMULATION VALUE]<br />Net change: {role.netPowerKw.toFixed(1)} kW [GAME SIMULATION VALUE]</p>
            )}
            {role?.role === 'EECOM' && (
              <p>Oxygen: {role.oxygenPct.toFixed(0)}% · Water: {role.waterPct.toFixed(0)}%<br />Food: {role.foodRations.toFixed(1)} rations · Crew health: {role.crewHealthPct.toFixed(0)}% [GAME SIMULATION VALUE]</p>
            )}
            {role?.role === 'FDO' && (
              <p>Dose budget: {role.doseBudgetPct.toFixed(1)}% [GAME SIMULATION VALUE]<br />{role.trainingStorm} [GAME SIMULATION VALUE]<br />{role.shieldAdvice}</p>
            )}
            {role?.role === 'CAPCOM' && (
              <p>{role.mission}<br />Earth reply in: {role.earthReplyInSols === null ? 'No pending reply' : `${role.earthReplyInSols} sols [GAME SIMULATION VALUE]`}<br />{role.lastReply}</p>
            )}

            {snapshot.started && !snapshot.isGameOver && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                <select value={proposalAction} onChange={(event) => setProposalAction(event.target.value as typeof proposalAction)} aria-label="Mission action to propose">
                  {ACTIONS.map(([action, label]) => <option key={action} value={action}>{label}</option>)}
                </select>
                <button type="button" disabled={Boolean(snapshot.proposal)} onClick={() => send('mission:propose', { action: proposalAction })}>
                  Propose · team vote
                </button>
              </div>
            )}

            {snapshot.proposal && (
              <div style={{ padding: 10, marginTop: 10, border: 'var(--rule-hair)' }}>
                <strong>Team vote: {ACTIONS.find(([action]) => action === snapshot.proposal?.action)?.[1]}</strong>
                <p>{snapshot.proposal.votesYes} yes · {snapshot.proposal.votesNo} no / 4 crew</p>
                <button type="button" onClick={() => send('mission:vote', { proposalId: snapshot.proposal?.id, yes: true })}>Vote yes</button>{' '}
                <button type="button" onClick={() => send('mission:vote', { proposalId: snapshot.proposal?.id, yes: false })}>Vote no</button>
              </div>
            )}
          </div>

          <div>
            <h4>Crew stations (open roles use helper bots)</h4>
            {snapshot.members.map((member) => (
              <div key={member.role} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: 'var(--rule-hair)' }}>
                <span>{member.role} · {member.name}{member.isHost ? ' · HOST' : member.isBot ? ' · BOT' : ''}</span>
                {!member.isBot && member.id !== transport.sessionId && (
                  <button type="button" aria-pressed={mutedPlayers.has(member.id)} onClick={() => toggleRemoteMute(member.id)}>
                    {mutedPlayers.has(member.id) ? 'Unmute player' : 'Mute player'}
                  </button>
                )}
              </div>
            ))}
            <label style={{ display: 'block', marginTop: 10 }}>
              Your role{' '}
              <select value={snapshot.myRole} onChange={(event) => send('crew:role', { role: event.target.value })}>
                {(['CDR', 'EECOM', 'FDO', 'CAPCOM'] as CrewRole[]).map((crewRole) => <option key={crewRole} value={crewRole}>{crewRole}</option>)}
              </select>
            </label>
            {snapshot.isHost && (
              <div style={{ display: 'grid', gap: 6, marginTop: 10 }}>
                <label><input type="checkbox" checked={snapshot.chatEnabled} onChange={(event) => send('crew:settings', { chatEnabled: event.target.checked })} /> Enable preset chat</label>
                <label><input type="checkbox" checked={snapshot.voiceEnabled} onChange={(event) => send('crew:settings', { voiceEnabled: event.target.checked })} /> Enable voice</label>
              </div>
            )}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
              <button type="button" onClick={() => void enableVoice()} disabled={!snapshot.voiceEnabled || !snapshot.voiceRelayConfigured}>Enable voice</button>
              <button type="button" onClick={toggleMicrophoneMute} disabled={!snapshot.voiceEnabled || !snapshot.voiceRelayConfigured}>
                {microphoneMuted ? 'Unmute microphone' : 'Mute microphone'}
              </button>
              <button
                type="button"
                disabled={!snapshot.voiceEnabled || !snapshot.voiceRelayConfigured || !voiceReady}
                onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); setPushToTalk(true); }}
                onPointerUp={() => setPushToTalk(false)}
                onPointerCancel={() => setPushToTalk(false)}
                onLostPointerCapture={() => setPushToTalk(false)}
              >
                Hold to talk · V
              </button>
            </div>
            <p aria-live="polite" style={{ fontSize: 11, fontWeight: 700 }}>
              Microphone: {pushToTalkActive && !microphoneMuted ? 'LIVE' : 'MUTED'}
            </p>
            <p role="status" style={{ fontSize: 11 }}>{voiceStatus}</p>
            <p style={{ fontSize: 11 }}>
              {snapshot.voiceRelayConfigured
                ? 'Voice is push-to-talk and relay-only to avoid exposing player IP addresses to other crew. No voice recording or storage.'
                : 'Voice needs a TURN relay configured by the server operator. Preset messages are ready as a fallback.'}
            </p>
          </div>

          <div>
            <h4>Quick messages · English + বাংলা</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {(Object.entries(QUICK_CHAT_PHRASES) as Array<[QuickChatPhraseId, (typeof QUICK_CHAT_PHRASES)[QuickChatPhraseId]]>).map(([id, phrase]) => (
                <button key={id} type="button" disabled={!snapshot.chatEnabled} onClick={() => send('crew:chat', { phraseId: id })}>
                  {phrase.en} · {phrase.bn}
                </button>
              ))}
            </div>
            <div aria-live="polite" style={{ maxHeight: 180, overflowY: 'auto', marginTop: 10 }}>
              {snapshot.chat.filter((message) => !mutedPlayers.has(message.senderId)).map((message) => (
                <p key={message.id} style={{ fontSize: 12, borderBottom: 'var(--rule-hair)', paddingBottom: 5 }}>
                  <strong>{message.role} · {message.sender}</strong>: {message.en}<br />{message.bn}
                </p>
              ))}
            </div>
            <p style={{ fontSize: 11 }}>Only preset messages are sent. Messages are temporary in room memory and are not written to storage.</p>
          </div>
        </div>
      )}
    </section>
  );
}
