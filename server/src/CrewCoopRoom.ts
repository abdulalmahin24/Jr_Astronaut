import { createHmac, randomInt } from 'node:crypto';
import { CloseCode, Room, type Client } from '@colyseus/core';
import type { Destination, GameState, ShiftActionType } from '../../src/types/game';
import {
  advanceCoopMission,
  createCoopMissionState,
  dashboardForRole,
  nicknameForId,
  QUICK_CHAT_PHRASES,
  resolveBotVote,
  type QuickChatPhraseId,
} from '../../src/utils/crewCoopProtocol';
import type { CrewRole } from '../../src/utils/multiplayerMissionService';

type CrewMember = {
  id: string;
  name: string;
  role: CrewRole;
  isHost: boolean;
  isBot: boolean;
  connected: boolean;
  resumeId?: string;
};

type VoteProposal = {
  id: number;
  action: ShiftActionType;
  proposerId: string;
  votes: Record<string, boolean>;
};

type CrewChatEntry = {
  id: string;
  senderId: string;
  sender: string;
  role: CrewRole;
  phraseId: QuickChatPhraseId;
  en: string;
  bn: string;
  sentAt: number;
};

type CrewRoomOptions = {
  destination?: Destination;
  missionId?: string;
};

const ROLES: CrewRole[] = ['CDR', 'EECOM', 'FDO', 'CAPCOM'];
const SHIFT_ACTIONS: ShiftActionType[] = [
  'STANDARD_OPERATIONS',
  'POWER_CONSERVATION',
  'SCIENCE_INTENSIVE',
  'ECLSS_MAINTENANCE',
  'GREENHOUSE_SURGE',
  'ROVER_EVA',
];

function isShiftAction(value: unknown): value is ShiftActionType {
  return typeof value === 'string' && SHIFT_ACTIONS.includes(value as ShiftActionType);
}

function botId(role: CrewRole): string {
  return `bot:${role}`;
}

function safeRoomCode(value: unknown): string | null {
  if (typeof value !== 'string' || value.length > 32) return null;
  return value.trim().toUpperCase();
}

export class CrewCoopRoom extends Room {
  maxClients = 4;
  maxMessagesPerSecond = 15;

  private missionId = 'lunar-outpost';
  private destination: Destination = 'MOON';
  private seed = 1;
  private missionState: GameState | null = null;
  private members: CrewMember[] = [];
  private readonly disconnected = new Map<string, CrewMember>();
  private proposal: VoteProposal | null = null;
  private proposalSequence = 0;
  private readonly chat: CrewChatEntry[] = [];
  private readonly lastChatAt = new Map<string, number>();
  private chatEnabled = true;
  private voiceEnabled = true;
  private earthReplyDueSol: number | null = null;
  private lastEarthReply = 'No Earth reply received yet.';

  async onCreate(options: CrewRoomOptions): Promise<void> {
    this.maxClients = 4;
    this.maxMessagesPerSecond = 15;
    this.missionId = typeof options.missionId === 'string' ? options.missionId.slice(0, 60) : 'lunar-outpost';
    this.destination = options.destination === 'MARS' ? 'MARS' : 'MOON';
    this.seed = randomInt(1, 0x7fffffff);
    this.members = ROLES.map((role) => ({
      id: botId(role),
      name: nicknameForId(botId(role)),
      role,
      isHost: false,
      isBot: true,
      connected: false,
    }));
    await this.setMatchmaking({ private: true, unlisted: true, maxClients: 4 });
    if (process.env.COOP_TURN_URL && !process.env.COOP_TURN_SHARED_SECRET) {
      console.warn('COOP_TURN_URL is set without COOP_TURN_SHARED_SECRET; TURN will not be advertised.');
    }

    this.onMessage('mission:start', (client) => this.startMission(client));
    this.onMessage('mission:propose', (client, payload: { action?: unknown }) => this.proposeAction(client, payload?.action));
    this.onMessage('mission:vote', (client, payload: { proposalId?: unknown; yes?: unknown }) => this.castVote(client, payload));
    this.onMessage('crew:role', (client, payload: { role?: unknown }) => this.changeRole(client, payload?.role));
    this.onMessage('crew:settings', (client, payload: { chatEnabled?: unknown; voiceEnabled?: unknown }) => this.updateSettings(client, payload));
    this.onMessage('crew:chat', (client, payload: { phraseId?: unknown }) => this.sendQuickChat(client, payload?.phraseId));
    this.onMessage('voice:signal', (client, payload: { to?: unknown; signal?: unknown }) => this.relayVoiceSignal(client, payload));
  }

  onJoin(client: Client, options: { resumeId?: unknown }): void {
    const resumeId = safeRoomCode(options?.resumeId);
    const resumedMember = resumeId
      ? [...this.disconnected.values()].find((member) => member.resumeId === resumeId)
      : undefined;

    if (resumedMember) {
      this.restoreMember(client, resumedMember);
    } else {
      const member = this.members.find((candidate) => candidate.isBot);
      if (!member) {
        client.leave(4000, 'This crew room already has four members.');
        return;
      }
      member.id = client.sessionId;
      member.name = nicknameForId(client.sessionId);
      member.isBot = false;
      member.connected = true;
      member.resumeId = resumeId ?? undefined;
      member.isHost = !this.members.some((candidate) => candidate.isHost && !candidate.isBot);
    }

    this.publishSnapshots();
  }

  async onLeave(client: Client, code?: number): Promise<void> {
    const member = this.members.find((candidate) => candidate.id === client.sessionId && !candidate.isBot);
    if (!member) return;

    if (code !== CloseCode.CONSENTED) {
      const savedMember = { ...member, isBot: false, connected: false };
      this.disconnected.set(client.sessionId, savedMember);
      this.replaceWithBot(member.role);
      this.publishSnapshots();
      try {
        const reconnectedClient = await this.allowReconnection(client, 45);
        this.restoreMember(reconnectedClient, savedMember);
      } catch {
        this.disconnected.delete(client.sessionId);
      }
      this.publishSnapshots();
      return;
    }

    this.disconnected.delete(client.sessionId);
    this.replaceWithBot(member.role);
    if (member.isHost) this.assignHost();
    this.publishSnapshots();
  }

  onDispose(): void {
    this.members = [];
    this.chat.length = 0;
    this.disconnected.clear();
    this.lastChatAt.clear();
  }

  private startMission(client: Client): void {
    const member = this.memberFor(client);
    if (!member?.isHost || this.missionState) return;
    this.missionState = createCoopMissionState(this.destination);
    this.publishSnapshots();
  }

  private proposeAction(client: Client, action: unknown): void {
    const member = this.memberFor(client);
    if (!member || !this.missionState || this.missionState.isGameOver || !isShiftAction(action) || this.proposal) return;

    const proposal: VoteProposal = {
      id: ++this.proposalSequence,
      action,
      proposerId: client.sessionId,
      votes: { [client.sessionId]: true },
    };
    for (const candidate of this.members) {
      if (candidate.isBot) {
        proposal.votes[candidate.id] = resolveBotVote(action, this.missionState, candidate.role);
      }
    }
    this.proposal = proposal;
    this.resolveProposalIfReady();
    this.publishSnapshots();
  }

  private castVote(client: Client, payload: { proposalId?: unknown; yes?: unknown }): void {
    const member = this.memberFor(client);
    if (!member || !this.proposal || payload.proposalId !== this.proposal.id || typeof payload.yes !== 'boolean') return;
    this.proposal.votes[client.sessionId] = payload.yes;
    this.resolveProposalIfReady();
    this.publishSnapshots();
  }

  private resolveProposalIfReady(): void {
    if (!this.proposal || !this.missionState) return;
    const yesVotes = Object.values(this.proposal.votes).filter(Boolean).length;
    const noVotes = Object.values(this.proposal.votes).filter((vote) => !vote).length;
    if (yesVotes >= 3) {
      const result = advanceCoopMission(this.missionState, this.proposal.action, this.seed);
      this.missionState = result.state;
      this.proposal = null;
      if (this.earthReplyDueSol !== null && this.missionState.currentSol >= this.earthReplyDueSol) {
        this.lastEarthReply = 'Earth reply received after the simulated communications delay.';
        this.earthReplyDueSol = null;
      }
      if (this.missionState.currentSol > 0 && this.missionState.currentSol % 3 === 0) {
        const delay = (this.destination === 'MARS' ? 4 : 2) + (result.eventRoll > 0.8 ? 1 : 0);
        this.earthReplyDueSol = this.missionState.currentSol + delay;
      }
      this.publishSnapshots();
    } else if (noVotes >= 2) {
      this.proposal = null;
    }
  }

  private changeRole(client: Client, value: unknown): void {
    const member = this.memberFor(client);
    if (!member || typeof value !== 'string' || !ROLES.includes(value as CrewRole)) return;
    const nextRole = value as CrewRole;
    const targetMember = this.members.find((candidate) => candidate.role === nextRole);
    if (!targetMember || targetMember === member) return;
    const previousRole = member.role;
    member.role = nextRole;
    targetMember.role = previousRole;
    if (targetMember.isBot) {
      targetMember.id = botId(previousRole);
      targetMember.name = nicknameForId(targetMember.id);
    }
    if (this.members.some((candidate) => candidate.isHost && !candidate.isBot)) {
      this.assignHost();
    }
    this.publishSnapshots();
  }

  private updateSettings(
    client: Client,
    payload: { chatEnabled?: unknown; voiceEnabled?: unknown },
  ): void {
    const member = this.memberFor(client);
    if (!member?.isHost) return;
    if (typeof payload.chatEnabled === 'boolean') this.chatEnabled = payload.chatEnabled;
    if (typeof payload.voiceEnabled === 'boolean') this.voiceEnabled = payload.voiceEnabled;
    if (!this.voiceEnabled) this.broadcast('voice:disabled', null);
    this.publishSnapshots();
  }

  private sendQuickChat(client: Client, value: unknown): void {
    const member = this.memberFor(client);
    const phraseId = typeof value === 'string' && Object.hasOwn(QUICK_CHAT_PHRASES, value)
      ? value as QuickChatPhraseId
      : null;
    if (!member) return;
    if (!this.chatEnabled) {
      client.send('crew:error', { message: 'Preset chat is disabled by the host.' });
      return;
    }
    if (!phraseId) {
      client.send('crew:error', { message: 'Choose one of the preset crew messages.' });
      return;
    }
    const now = Date.now();
    if (now - (this.lastChatAt.get(client.sessionId) ?? 0) < 900) {
      client.send('crew:error', { message: 'Please wait a moment before sending another message.' });
      return;
    }
    this.lastChatAt.set(client.sessionId, now);
    const phrase = QUICK_CHAT_PHRASES[phraseId];
    this.chat.push({
      id: `${client.sessionId}-${now}`,
      senderId: client.sessionId,
      sender: member.name,
      role: member.role,
      phraseId,
      en: phrase.en,
      bn: phrase.bn,
      sentAt: now,
    });
    if (this.chat.length > 20) this.chat.shift();
    this.broadcast('crew:chat', this.chat[this.chat.length - 1]);
  }

  private relayVoiceSignal(client: Client, payload: { to?: unknown; signal?: unknown }): void {
    if (!this.memberFor(client)) return;
    if (!this.voiceEnabled) {
      client.send('crew:error', { message: 'Voice is disabled by the host.' });
      return;
    }
    if (typeof payload.to !== 'string' || !payload.signal) return;
    const signal = payload.signal as Record<string, unknown>;
    if (!['offer', 'answer', 'candidate'].includes(String(signal.type))) return;
    const receiver = this.clients.find((candidate) => candidate.sessionId === payload.to);
    if (receiver) receiver.send('voice:signal', { from: client.sessionId, signal });
  }

  private memberFor(client: Client): CrewMember | undefined {
    return this.members.find((member) => member.id === client.sessionId && member.connected && !member.isBot);
  }

  private restoreMember(client: Client, savedMember: CrewMember): void {
    const bot = this.members.find((member) => member.role === savedMember.role && member.isBot);
    if (!bot) return;
    Object.assign(bot, savedMember, { id: client.sessionId, isBot: false, connected: true });
    this.disconnected.delete(client.sessionId);
    if (savedMember.isHost) this.assignHost(client.sessionId);
  }

  private replaceWithBot(role: CrewRole): void {
    const member = this.members.find((candidate) => candidate.role === role);
    if (!member) return;
    Object.assign(member, {
      id: botId(role),
      name: nicknameForId(botId(role)),
      isHost: false,
      isBot: true,
      connected: false,
      resumeId: undefined,
    });
    if (this.missionState && this.proposal) {
      this.proposal.votes[member.id] = resolveBotVote(this.proposal.action, this.missionState, role);
      this.resolveProposalIfReady();
    }
    if (!this.members.some((candidate) => candidate.isHost && !candidate.isBot)) this.assignHost();
  }

  private assignHost(preferredId?: string): void {
    const host = this.members.find((member) => !member.isBot && member.connected && member.id === preferredId)
      ?? this.members.find((member) => !member.isBot && member.connected);
    this.members.forEach((member) => { member.isHost = member === host; });
  }

  private publishSnapshots(): void {
    const roomView = {
      roomId: this.roomId,
      missionId: this.missionId,
      destination: this.destination,
      started: this.missionState !== null,
      sol: this.missionState?.currentSol ?? 0,
      totalSols: this.missionState?.totalSols ?? 10,
      outcome: this.missionState?.gameOutcome ?? 'IN_PROGRESS',
      isGameOver: this.missionState?.isGameOver ?? false,
      members: this.members.map(({ id, name, role, isHost, isBot, connected }) => ({
        id: isBot ? `bot:${role}` : id,
        name,
        role,
        isHost,
        isBot,
        connected,
      })),
      proposal: this.proposal ? {
        id: this.proposal.id,
        action: this.proposal.action,
        votesYes: Object.values(this.proposal.votes).filter(Boolean).length,
        votesNo: Object.values(this.proposal.votes).filter((vote) => !vote).length,
        hasVoted: this.proposal.votes,
      } : null,
      chatEnabled: this.chatEnabled,
      voiceEnabled: this.voiceEnabled,
      voiceRelayConfigured: Boolean(process.env.COOP_TURN_URL && process.env.COOP_TURN_SHARED_SECRET),
      chat: this.chat,
      lastEarthReply: this.lastEarthReply,
    };

    for (const client of this.clients) {
      const member = this.memberFor(client);
      if (!member) continue;
      client.send('crew:snapshot', {
        ...roomView,
        myRole: member.role,
        isHost: member.isHost,
        dashboard: this.missionState
          ? dashboardForRole(member.role, this.missionState, this.earthReplyDueSol, this.lastEarthReply, this.seed)
          : null,
        iceServers: this.iceServersForClient(client.sessionId),
      });
    }
  }

  private iceServersForClient(sessionId: string): RTCIceServer[] {
    const stunUrl = process.env.COOP_STUN_URL;
    const servers: RTCIceServer[] = stunUrl ? [{ urls: stunUrl }] : [];
    const turnUrl = process.env.COOP_TURN_URL;
    const sharedSecret = process.env.COOP_TURN_SHARED_SECRET;
    if (turnUrl && sharedSecret) {
      const username = `${Math.floor(Date.now() / 1000) + 3600}:${sessionId}`;
      const credential = createHmac('sha1', sharedSecret).update(username).digest('base64');
      servers.push({ urls: turnUrl, username, credential });
    }
    return servers;
  }
}
