import type { ColyseusNetworkTransport } from './multiplayerTransport';

type VoiceSignal =
  | { type: 'offer' | 'answer'; sdp: RTCSessionDescriptionInit }
  | { type: 'candidate'; candidate: RTCIceCandidateInit };

export class CrewVoiceMesh {
  private readonly peers = new Map<string, RTCPeerConnection>();
  private readonly pendingIce = new Map<string, RTCIceCandidateInit[]>();
  private readonly remoteAudio = new Map<string, HTMLAudioElement>();
  private readonly mutedPeers = new Set<string>();
  private readonly unsubscribe: () => void;
  private localStream: MediaStream | null = null;
  private localSessionId: string | null = null;
  private allowed = true;
  private pushToTalkHeld = false;
  private manuallyMuted = false;
  private iceServers: RTCIceServer[] = [];
  private readonly transport: ColyseusNetworkTransport;
  private readonly onStatus: (status: string) => void;

  constructor(
    transport: ColyseusNetworkTransport,
    onStatus: (status: string) => void,
  ) {
    this.transport = transport;
    this.onStatus = onStatus;
    this.unsubscribe = transport.subscribe(({ type, payload }) => {
      if (type === 'voice:signal') void this.receiveSignal(payload as { from: string; signal: VoiceSignal });
      if (type === 'voice:disabled') this.setAllowed(false);
    });
  }

  async unlockAudio(): Promise<void> {
    if (!navigator.mediaDevices?.getUserMedia) {
      await this.resumeRemoteAudio();
      this.onStatus('Microphone is unavailable. You can listen and use quick messages.');
      return;
    }
    try {
      this.localStream ??= await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      this.localStream.getAudioTracks().forEach((track) => {
        track.enabled = this.allowed && this.pushToTalkHeld;
      });
      await this.resumeRemoteAudio();
      this.onStatus('Voice ready. Hold V or the talk button to speak.');
    } catch (error) {
      await this.resumeRemoteAudio();
      this.onStatus(error instanceof Error ? `Microphone unavailable (${error.message}). Listen-only and quick messages remain available.` : 'Microphone unavailable. Listen-only and quick messages remain available.');
    }
  }

  setAllowed(allowed: boolean): void {
    this.allowed = allowed;
    if (!allowed) this.pushToTalkHeld = false;
    this.localStream?.getAudioTracks().forEach((track) => {
      track.enabled = this.allowed && this.pushToTalkHeld;
    });
    if (!allowed) {
      this.peers.forEach((peer) => peer.close());
      this.peers.clear();
      this.pendingIce.clear();
      this.remoteAudio.forEach((audio) => {
        audio.pause();
        audio.srcObject = null;
      });
      this.remoteAudio.clear();
      this.onStatus('Voice is disabled by the host.');
    }
  }

  setPushToTalk(held: boolean): void {
    this.pushToTalkHeld = held && this.allowed && !this.manuallyMuted;
    this.updateLocalMute();
  }

  setMuted(muted: boolean): void {
    this.manuallyMuted = muted;
    if (muted) this.pushToTalkHeld = false;
    this.updateLocalMute();
  }

  get isTransmitting(): boolean {
    return this.allowed && !this.manuallyMuted && this.pushToTalkHeld;
  }

  setRemoteMuted(sessionId: string, muted: boolean): void {
    if (muted) this.mutedPeers.add(sessionId);
    else this.mutedPeers.delete(sessionId);
    const audio = this.remoteAudio.get(sessionId);
    if (audio) audio.muted = muted;
  }

  syncPeers(
    localSessionId: string,
    members: Array<{ id: string; isBot: boolean }>,
    iceServers: RTCIceServer[],
  ): void {
    this.localSessionId = localSessionId;
    this.iceServers = iceServers;
    if (!this.allowed) return;
    this.peers.forEach((peer) => { void this.attachLocalTracks(peer); });
    const activeIds = new Set(members.filter((member) => !member.isBot && member.id !== localSessionId).map((member) => member.id));
    for (const [peerId, peer] of this.peers) {
      if (!activeIds.has(peerId)) {
        peer.close();
        this.peers.delete(peerId);
        this.pendingIce.delete(peerId);
        this.remoteAudio.get(peerId)?.remove();
        this.remoteAudio.delete(peerId);
      }
    }
    for (const peerId of activeIds) {
      if (!this.peers.has(peerId) && localSessionId < peerId) {
        void this.createPeer(peerId, true);
      }
    }
  }

  dispose(): void {
    this.unsubscribe();
    this.setPushToTalk(false);
    this.localStream?.getTracks().forEach((track) => track.stop());
    this.localStream = null;
    this.peers.forEach((peer) => peer.close());
    this.peers.clear();
    this.pendingIce.clear();
    this.remoteAudio.forEach((audio) => {
      audio.pause();
      audio.srcObject = null;
      audio.remove();
    });
    this.remoteAudio.clear();
  }

  private async createPeer(peerId: string, makeOffer: boolean): Promise<RTCPeerConnection> {
    const peer = new RTCPeerConnection({ iceServers: this.iceServers, iceTransportPolicy: 'relay' });
    this.peers.set(peerId, peer);
    peer.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSignal(peerId, { type: 'candidate', candidate: event.candidate.toJSON() });
      }
    };
    peer.ontrack = (event) => {
      const audio = this.remoteAudio.get(peerId) ?? document.createElement('audio');
      audio.autoplay = true;
      audio.muted = this.mutedPeers.has(peerId);
      audio.setAttribute('playsinline', '');
      audio.dataset.crewPeer = peerId;
      audio.srcObject = event.streams[0] ?? new MediaStream([event.track]);
      this.remoteAudio.set(peerId, audio);
      void audio.play().catch(() => this.onStatus('Tap Enable Voice again to unlock incoming audio.'));
    };
    peer.onconnectionstatechange = () => {
      if (peer.connectionState === 'connected') this.onStatus('Voice relay connected.');
      else if (peer.connectionState === 'failed') this.onStatus('Voice could not connect. Check TURN setup or use quick messages.');
    };
    if (makeOffer) {
      peer.addTransceiver('audio', { direction: 'sendrecv' });
      await this.attachLocalTracks(peer);
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      this.sendSignal(peerId, { type: 'offer', sdp: offer });
    }
    return peer;
  }

  private async attachLocalTracks(peer: RTCPeerConnection): Promise<void> {
    if (!this.localStream) return;
    for (const track of this.localStream.getTracks()) {
      const audioTransceiver = peer.getTransceivers().find((transceiver) => transceiver.receiver.track.kind === track.kind);
      if (audioTransceiver) await audioTransceiver.sender.replaceTrack(track);
      else peer.addTrack(track, this.localStream);
    }
  }

  private async receiveSignal(message: { from: string; signal: VoiceSignal }): Promise<void> {
    if (!this.allowed || !message?.from || !message.signal || !this.localSessionId) return;
    let peer = this.peers.get(message.from);
    if (!peer) peer = await this.createPeer(message.from, false);

    if (message.signal.type === 'candidate') {
      if (peer.remoteDescription) {
        await peer.addIceCandidate(message.signal.candidate);
      } else {
        const queue = this.pendingIce.get(message.from) ?? [];
        queue.push(message.signal.candidate);
        this.pendingIce.set(message.from, queue);
      }
      return;
    }

    await peer.setRemoteDescription(message.signal.sdp);
    await this.attachLocalTracks(peer);
    const queued = this.pendingIce.get(message.from) ?? [];
    for (const candidate of queued) await peer.addIceCandidate(candidate);
    this.pendingIce.delete(message.from);

    if (message.signal.type === 'offer') {
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      this.sendSignal(message.from, { type: 'answer', sdp: answer });
    }
  }

  private sendSignal(to: string, signal: VoiceSignal): void {
    try {
      this.transport.send({ type: 'voice:signal', payload: { to, signal } });
    } catch (error) {
      this.onStatus(error instanceof Error ? error.message : 'Voice connection could not be signalled.');
    }
  }

  private async resumeRemoteAudio(): Promise<void> {
    for (const audio of this.remoteAudio.values()) {
      try {
        await audio.play();
      } catch {
        this.onStatus('Incoming audio is still blocked. Try Enable Voice again after the device gesture.');
      }
    }
  }

  private updateLocalMute(): void {
    this.localStream?.getAudioTracks().forEach((track) => {
      track.enabled = this.isTransmitting;
    });
  }
}
