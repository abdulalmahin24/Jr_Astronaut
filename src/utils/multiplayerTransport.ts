import type { Client, Room } from '@colyseus/sdk';

export interface TransportMessage {
  type: string;
  payload: unknown;
}

export interface MultiplayerTransport {
  send(message: TransportMessage): void;
  subscribe(listener: (message: TransportMessage) => void): () => void;
  close(): void;
}

export class BroadcastChannelTransport implements MultiplayerTransport {
  private readonly channel: BroadcastChannel | null;
  private readonly listeners = new Set<(message: TransportMessage) => void>();

  constructor(channelName = 'astro_camp_coop_broadcast') {
    this.channel = typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel(channelName);
    if (this.channel) {
      this.channel.onmessage = (event: MessageEvent<TransportMessage>) => {
        this.listeners.forEach((listener) => listener(event.data));
      };
    }
  }

  send(message: TransportMessage): void {
    this.channel?.postMessage(message);
  }

  subscribe(listener: (message: TransportMessage) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  close(): void {
    this.channel?.close();
    this.listeners.clear();
  }
}

export class ColyseusNetworkTransport implements MultiplayerTransport {
  private readonly clientPromise: Promise<Client>;
  private room: Room | null = null;
  private readonly listeners = new Set<(message: TransportMessage) => void>();
  private readonly storageKey = 'astro_camp_crew_reconnect';
  private latestSnapshot: unknown = null;

  constructor(endpoint: string) {
    this.clientPromise = import('@colyseus/sdk').then(({ Client: ColyseusClient }) => new ColyseusClient(endpoint));
  }

  get roomId(): string | null {
    return this.room?.roomId ?? null;
  }

  get sessionId(): string | null {
    return this.room?.sessionId ?? null;
  }

  async createRoom(options: { destination: 'MOON' | 'MARS'; missionId: string }): Promise<string> {
    const client = await this.clientPromise;
    const room = await client.create('crew-coop', options);
    this.attachRoom(room);
    return room.roomId;
  }

  async joinRoom(roomId: string, options: { resumeId: string }): Promise<void> {
    const client = await this.clientPromise;
    const room = await client.joinById(roomId, options);
    this.attachRoom(room);
  }

  async reconnect(): Promise<boolean> {
    const token = typeof sessionStorage === 'undefined' ? null : sessionStorage.getItem(this.storageKey);
    if (!token) return false;
    try {
      const client = await this.clientPromise;
      const room = await client.reconnect(token);
      this.attachRoom(room);
      return true;
    } catch (error) {
      sessionStorage.removeItem(this.storageKey);
      this.emit({ type: 'connection:error', payload: error instanceof Error ? error.message : 'Reconnect failed.' });
      return false;
    }
  }

  send(message: TransportMessage): void {
    if (!this.room) throw new Error('Join a private crew room before sending messages.');
    this.room.send(message.type, message.payload);
  }

  subscribe(listener: (message: TransportMessage) => void): () => void {
    this.listeners.add(listener);
    if (this.latestSnapshot) listener({ type: 'crew:snapshot', payload: this.latestSnapshot });
    return () => this.listeners.delete(listener);
  }

  async close(): Promise<void> {
    const room = this.room;
    this.room = null;
    if (typeof sessionStorage !== 'undefined') sessionStorage.removeItem(this.storageKey);
    await room?.leave(true);
  }

  private attachRoom(room: Room): void {
    this.room = room;
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(this.storageKey, room.reconnectionToken);
    }
    room.onMessage('*', (type, payload) => this.emit({ type: String(type), payload }));
    room.onDrop((code, reason) => this.emit({ type: 'connection:dropped', payload: { code, reason } }));
    room.onReconnect(() => this.emit({ type: 'connection:restored', payload: null }));
    room.onError((code, message) => this.emit({ type: 'connection:error', payload: { code, message } }));
    this.emit({ type: 'connection:joined', payload: { roomId: room.roomId, sessionId: room.sessionId } });
  }

  private emit(message: TransportMessage): void {
    if (message.type === 'crew:snapshot') this.latestSnapshot = message.payload;
    this.listeners.forEach((listener) => listener(message));
  }
}
