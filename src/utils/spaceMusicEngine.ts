/**
 * spaceMusicEngine.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Procedural Space Ambient & Cinematic Orchestral Synthesizer
 * Built using pure Web Audio API — 0 external audio files, 0 latency, 100% reliable.
 * Generates Hans Zimmer / Brian Eno style space ambient pads, cosmic sub-drones,
 * and crystalline stellar arpeggios that dynamically respond to mission phases.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export type MusicTheme = 'LAUNCH' | 'COAST_SPACE' | 'LUNAR_DESCENT' | 'SURFACE_CALM';

class SpaceMusicEngine {
  private ctx: AudioContext | null = null;
  private isPlaying: boolean = false;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;
  private currentTheme: MusicTheme = 'COAST_SPACE';
  private timerId: number | null = null;
  private activeNodes: { stop: () => void }[] = [];

  constructor() {
    try {
      const savedMute = localStorage.getItem('astro_camp_music_muted');
      if (savedMute !== null) {
        this.isMuted = savedMute === 'true';
      }
    } catch {
      // localStorage not available
    }
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.35, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    try {
      localStorage.setItem('astro_camp_music_muted', String(this.isMuted));
    } catch {}

    if (this.masterGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.linearRampToValueAtTime(this.isMuted ? 0 : 0.35, now + 0.3);
    }

    if (!this.isPlaying && !this.isMuted) {
      this.start();
    }

    return this.isMuted;
  }

  public setVolume(vol: number) {
    if (!this.masterGain || !this.ctx) return;
    const clamped = Math.max(0, Math.min(1, vol));
    this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : clamped * 0.45, this.ctx.currentTime);
  }

  public setTheme(theme: MusicTheme) {
    this.currentTheme = theme;
  }

  public start() {
    if (this.isPlaying) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    this.isPlaying = true;
    this.scheduleChordProgression();
  }

  public stop() {
    this.isPlaying = false;
    if (this.timerId) {
      window.clearTimeout(this.timerId);
      this.timerId = null;
    }
    this.activeNodes.forEach((n) => {
      try {
        n.stop();
      } catch {}
    });
    this.activeNodes = [];
  }

  /**
   * Generates a continuous evolving space ambient chord progression
   * e.g., C minor -> Ab major -> Eb major -> Bb / Gsus4
   */
  private scheduleChordProgression() {
    if (!this.isPlaying || !this.ctx || !this.masterGain) return;

    // Chords in Hz (Cosmic interstellar chord voicings: Bass, Pad 1, Pad 2, Pad 3, Shimmer)
    const chordBook = [
      // Chord 1: C minor 9 (Deep mystery of deep space)
      { bass: 65.41, notes: [130.81, 196.0, 233.08, 311.13, 587.33] },
      // Chord 2: Ab major 7 (Epic soaring Earthrise)
      { bass: 51.91, notes: [103.83, 164.81, 207.65, 261.63, 523.25] },
      // Chord 3: Eb major add9 (Weightless orbital expanse)
      { bass: 77.78, notes: [155.56, 233.08, 311.13, 392.0, 698.46] },
      // Chord 4: Bb sus4 / G (Approaching the lunar surface)
      { bass: 58.27, notes: [116.54, 174.61, 233.08, 349.23, 622.25] },
    ];

    let chordIdx = 0;

    const playNext = () => {
      if (!this.isPlaying || !this.ctx || !this.masterGain) return;

      const chord = chordBook[chordIdx % chordBook.length];
      chordIdx++;
      const duration = 7.5; // seconds per chord
      const now = this.ctx.currentTime;

      // 1. Deep Sub-Bass Drone
      const subOsc = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      const subFilter = this.ctx.createBiquadFilter();

      subOsc.type = this.currentTheme === 'LAUNCH' ? 'sawtooth' : 'sine';
      subOsc.frequency.setValueAtTime(chord.bass, now);

      subFilter.type = 'lowpass';
      subFilter.frequency.setValueAtTime(this.currentTheme === 'LAUNCH' ? 180 : 90, now);

      subGain.gain.setValueAtTime(0.001, now);
      subGain.gain.linearRampToValueAtTime(0.18, now + 2.0);
      subGain.gain.setValueAtTime(0.18, now + duration - 2.0);
      subGain.gain.linearRampToValueAtTime(0.001, now + duration);

      subOsc.connect(subFilter);
      subFilter.connect(subGain);
      subGain.connect(this.masterGain);

      subOsc.start(now);
      subOsc.stop(now + duration);
      this.activeNodes.push(subOsc);

      // 2. Lush Ambient Synth Pads
      chord.notes.forEach((freq, i) => {
        if (!this.ctx || !this.masterGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        // Slight detune for warm analog chorusing
        const detune = (i % 2 === 0 ? 1 : -1) * (i * 3 + 2);
        osc.type = i === 4 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, now);
        osc.detune.setValueAtTime(detune, now);

        filter.type = 'lowpass';
        const cutoff = this.currentTheme === 'LAUNCH' ? 900 : 550 + i * 80;
        filter.frequency.setValueAtTime(cutoff, now);
        filter.frequency.exponentialRampToValueAtTime(cutoff * 1.3, now + duration * 0.5);
        filter.frequency.exponentialRampToValueAtTime(cutoff, now + duration);

        const padVol = 0.045 / (i + 1);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(padVol, now + 2.5);
        gain.gain.setValueAtTime(padVol, now + duration - 2.0);
        gain.gain.linearRampToValueAtTime(0.0001, now + duration);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + duration);
        this.activeNodes.push(osc);
      });

      // 3. Twinkling Stellar Shimmer Notes (High cosmic bell tones)
      const shimmerNotes = [880, 1046.5, 1174.66, 1318.51, 1567.98];
      const shimmerTime = now + 1.5 + Math.random() * 2.0;
      const shimmerFreq = shimmerNotes[Math.floor(Math.random() * shimmerNotes.length)];

      const bellOsc = this.ctx.createOscillator();
      const bellGain = this.ctx.createGain();
      bellOsc.type = 'sine';
      bellOsc.frequency.setValueAtTime(shimmerFreq, shimmerTime);

      bellGain.gain.setValueAtTime(0.0001, shimmerTime);
      bellGain.gain.linearRampToValueAtTime(0.03, shimmerTime + 0.15);
      bellGain.gain.exponentialRampToValueAtTime(0.0001, shimmerTime + 3.0);

      bellOsc.connect(bellGain);
      bellGain.connect(this.masterGain);

      bellOsc.start(shimmerTime);
      bellOsc.stop(shimmerTime + 3.1);
      this.activeNodes.push(bellOsc);

      // Schedule next chord slightly before duration for seamless crossfade
      this.timerId = window.setTimeout(playNext, (duration - 1.2) * 1000);
    };

    playNext();
  }
}

export const spaceMusicEngine = new SpaceMusicEngine();
