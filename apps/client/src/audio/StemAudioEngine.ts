/**
 * High-precision Web Audio Engine for Band League.
 * Supports multi-genre stem rendering, sample-accurate scheduling,
 * dynamic stem muting on misses, producer live audio FX, and practice tempo scaling.
 */

export interface StemTrack {
  name: string;
  buffer: AudioBuffer;
  sourceNode?: AudioBufferSourceNode;
  gainNode: GainNode;
  filterNode: BiquadFilterNode;
  isMuted: boolean;
  baseVolume: number;
}

export class StemAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private producerFilter: BiquadFilterNode | null = null;
  private stems: Map<string, StemTrack> = new Map();

  private songStartTimeCtx: number = 0;
  private pauseTimeCtx: number = 0;
  private isPlaying: boolean = false;
  private isPaused: boolean = false;
  private calibrationOffsetMs: number = 0;
  private songDurationSeconds: number = 0;
  private playbackRate: number = 1.0; // Practice mode tempo rate

  constructor() {
    const savedOffset = localStorage.getItem('band_league_latency_offset_ms');
    if (savedOffset) {
      this.calibrationOffsetMs = parseInt(savedOffset, 10) || 0;
    }
  }

  public async init(): Promise<void> {
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtxClass();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.9;

      // Master Producer Filter for live DJ sweeps
      this.producerFilter = this.ctx.createBiquadFilter();
      this.producerFilter.type = 'lowpass';
      this.producerFilter.frequency.value = 20000;

      this.producerFilter.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.6;
      this.sfxGain.connect(this.masterGain);
    }

    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  public getContext(): AudioContext {
    if (!this.ctx) throw new Error('AudioContext not initialized.');
    return this.ctx;
  }

  public setCalibrationOffset(offsetMs: number): void {
    this.calibrationOffsetMs = offsetMs;
    localStorage.setItem('band_league_latency_offset_ms', offsetMs.toString());
  }

  public getCalibrationOffset(): number {
    return this.calibrationOffsetMs;
  }

  public setPlaybackRate(rate: number): void {
    this.playbackRate = Math.max(0.5, Math.min(1.5, rate));
    this.stems.forEach((stem) => {
      if (stem.sourceNode) {
        stem.sourceNode.playbackRate.value = this.playbackRate;
      }
    });
  }

  public getPlaybackRate(): number {
    return this.playbackRate;
  }

  /**
   * Generates multi-track audio stems based on song ID and genre
   */
  public async loadProceduralSong(songId: string = 'neon-horizon', bpm: number = 124, totalBars: number = 24): Promise<number> {
    await this.init();
    const ctx = this.ctx!;
    const sampleRate = ctx.sampleRate;
    const secondsPerBeat = 60 / bpm;
    const secondsPerBar = secondsPerBeat * 4;
    const totalDuration = totalBars * secondsPerBar;
    this.songDurationSeconds = totalDuration;

    // Reset previous stems
    this.stopSong();
    this.stems.clear();

    const [drumBuf, bassBuf, leadBuf, chordsBuf] = await Promise.all([
      this.renderDrumsTrack(songId, bpm, totalBars, sampleRate),
      this.renderBassTrack(songId, bpm, totalBars, sampleRate),
      this.renderLeadTrack(songId, bpm, totalBars, sampleRate),
      this.renderChordsTrack(songId, bpm, totalBars, sampleRate),
    ]);

    this.registerStem('drums', drumBuf, 0.95);
    this.registerStem('bass', bassBuf, 0.85);
    this.registerStem('guitar', leadBuf, 0.80);
    this.registerStem('keys', chordsBuf, 0.75);

    return totalDuration;
  }

  private registerStem(name: string, buffer: AudioBuffer, baseVolume: number): void {
    const ctx = this.ctx!;
    const gainNode = ctx.createGain();
    gainNode.gain.value = baseVolume;

    const filterNode = ctx.createBiquadFilter();
    filterNode.type = 'lowpass';
    filterNode.frequency.value = 20000;

    filterNode.connect(gainNode);
    gainNode.connect(this.producerFilter!);

    this.stems.set(name, {
      name,
      buffer,
      gainNode,
      filterNode,
      isMuted: false,
      baseVolume,
    });
  }

  public startSong(startOffsetSec: number = 0): void {
    if (!this.ctx) return;
    this.stopSong();

    const now = this.ctx.currentTime;
    this.songStartTimeCtx = now - (startOffsetSec / this.playbackRate);
    this.isPlaying = true;
    this.isPaused = false;

    this.stems.forEach((stem) => {
      const source = this.ctx!.createBufferSource();
      source.buffer = stem.buffer;
      source.playbackRate.value = this.playbackRate;
      source.connect(stem.filterNode);
      source.start(now, startOffsetSec);
      stem.sourceNode = source;
    });
  }

  public pauseSong(): void {
    if (!this.isPlaying || this.isPaused || !this.ctx) return;
    this.pauseTimeCtx = this.ctx.currentTime;
    this.isPaused = true;
    this.stems.forEach((stem) => {
      try {
        stem.sourceNode?.stop();
      } catch {
        // ignore
      }
    });
  }

  public resumeSong(): void {
    if (!this.isPaused || !this.ctx) return;
    const elapsed = (this.pauseTimeCtx - this.songStartTimeCtx) * this.playbackRate;
    this.startSong(elapsed);
  }

  public stopSong(): void {
    this.isPlaying = false;
    this.isPaused = false;
    this.stems.forEach((stem) => {
      if (stem.sourceNode) {
        try {
          stem.sourceNode.stop();
          stem.sourceNode.disconnect();
        } catch {
          // ignore
        }
        stem.sourceNode = undefined;
      }
    });
  }

  public getCurrentSongTimeMs(): number {
    if (!this.isPlaying || !this.ctx) return 0;
    if (this.isPaused) {
      return (this.pauseTimeCtx - this.songStartTimeCtx) * 1000 * this.playbackRate - this.calibrationOffsetMs;
    }
    const elapsedSec = (this.ctx.currentTime - this.songStartTimeCtx) * this.playbackRate;
    return elapsedSec * 1000 - this.calibrationOffsetMs;
  }

  public getDurationSeconds(): number {
    return this.songDurationSeconds;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying && !this.isPaused;
  }

  public setStemPerformanceState(stemName: string, isHealthy: boolean): void {
    const stem = this.stems.get(stemName);
    if (!stem || !this.ctx) return;

    const now = this.ctx.currentTime;
    if (isHealthy) {
      stem.filterNode.frequency.setTargetAtTime(20000, now, 0.08);
      stem.gainNode.gain.setTargetAtTime(stem.baseVolume, now, 0.08);
    } else {
      stem.filterNode.frequency.setTargetAtTime(500, now, 0.05);
      stem.gainNode.gain.setTargetAtTime(stem.baseVolume * 0.2, now, 0.05);
    }
  }

  /**
   * Producer live audio controls: sweeps, beat-repeater stutter, and boom drops
   */
  public triggerProducerFx(type: 'filter_sweep' | 'stutter' | 'delay' | 'drop'): void {
    if (!this.ctx || !this.producerFilter || !this.masterGain) return;
    const now = this.ctx.currentTime;

    if (type === 'filter_sweep') {
      // Dynamic resonant lowpass sweep
      this.producerFilter.frequency.setValueAtTime(20000, now);
      this.producerFilter.frequency.exponentialRampToValueAtTime(400, now + 0.4);
      this.producerFilter.frequency.exponentialRampToValueAtTime(20000, now + 0.9);
      this.producerFilter.Q.setValueAtTime(6.0, now);
      this.producerFilter.Q.linearRampToValueAtTime(1.0, now + 1.0);
    } else if (type === 'stutter') {
      // Rhythmic 16th-note volume gating
      for (let i = 0; i < 6; i++) {
        const t = now + i * 0.07;
        this.masterGain.gain.setValueAtTime(0.05, t);
        this.masterGain.gain.setValueAtTime(0.9, t + 0.035);
      }
    } else if (type === 'drop') {
      // Massive 808 sub-bass boom
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(32, now + 0.6);
      gain.gain.setValueAtTime(1.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 1.2);
    }
  }

  public playHitSfx(type: 'perfect' | 'great' | 'good' | 'miss' | 'unison'): void {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    if (type === 'perfect') {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(1760, now + 0.06);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'great') {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(659, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.05);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (type === 'good') {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.06);
    } else if (type === 'miss') {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(130, now);
      osc.frequency.linearRampToValueAtTime(70, now + 0.15);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.16);
    } else if (type === 'unison') {
      [523.25, 659.25, 783.99, 1046.5].forEach((freq) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.connect(gain);
        gain.connect(this.sfxGain!);
        osc.start(now);
        osc.stop(now + 0.35);
      });
    }
  }

  public playMetronomeBeep(isHigh: boolean = false): void {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(isHigh ? 1200 : 800, now);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.04);
  }

  /* Multi-Genre Procedural Stems */
  private async renderDrumsTrack(songId: string, bpm: number, bars: number, sampleRate: number): Promise<AudioBuffer> {
    const secondsPerBeat = 60 / bpm;
    const secondsPerBar = secondsPerBeat * 4;
    const totalDuration = bars * secondsPerBar;
    const offlineCtx = new OfflineAudioContext(2, Math.ceil(sampleRate * totalDuration), sampleRate);

    const isFunk = songId === 'midnight-funk';
    const isEdm = songId === 'cyber-drop';
    const isLofi = songId === 'sunset-lofi';

    for (let bar = 0; bar < bars; bar++) {
      const barTime = bar * secondsPerBar;

      if (isEdm) {
        // 4-on-the-floor kick
        for (let b = 0; b < 4; b++) {
          this.synthKick(offlineCtx, barTime + b * secondsPerBeat);
        }
        // Claps on 2 and 4
        this.synthSnare(offlineCtx, barTime + secondsPerBeat);
        this.synthSnare(offlineCtx, barTime + secondsPerBeat * 3);
        // Off-beat open hats
        for (let b = 0; b < 4; b++) {
          this.synthHiHat(offlineCtx, barTime + b * secondsPerBeat + secondsPerBeat / 2, true);
        }
      } else if (isFunk) {
        // Syncopated funky drums
        this.synthKick(offlineCtx, barTime);
        this.synthKick(offlineCtx, barTime + secondsPerBeat * 1.75);
        this.synthKick(offlineCtx, barTime + secondsPerBeat * 2.5);
        this.synthSnare(offlineCtx, barTime + secondsPerBeat);
        this.synthSnare(offlineCtx, barTime + secondsPerBeat * 3);
        for (let eighth = 0; eighth < 8; eighth++) {
          this.synthHiHat(offlineCtx, barTime + eighth * (secondsPerBeat / 2), eighth % 2 === 1);
        }
      } else if (isLofi) {
        // Relaxed boom-bap
        this.synthKick(offlineCtx, barTime);
        this.synthKick(offlineCtx, barTime + secondsPerBeat * 2.5);
        this.synthSnare(offlineCtx, barTime + secondsPerBeat);
        this.synthSnare(offlineCtx, barTime + secondsPerBeat * 3);
        for (let eighth = 0; eighth < 4; eighth++) {
          this.synthHiHat(offlineCtx, barTime + eighth * secondsPerBeat, false);
        }
      } else {
        // Standard Synthwave / Arena Rock
        this.synthKick(offlineCtx, barTime);
        this.synthKick(offlineCtx, barTime + secondsPerBeat * 2);
        this.synthSnare(offlineCtx, barTime + secondsPerBeat);
        this.synthSnare(offlineCtx, barTime + secondsPerBeat * 3);
        for (let eighth = 0; eighth < 8; eighth++) {
          this.synthHiHat(offlineCtx, barTime + eighth * (secondsPerBeat / 2), eighth === 4 || eighth === 7);
        }
      }
    }

    return await offlineCtx.startRendering();
  }

  private async renderBassTrack(songId: string, bpm: number, bars: number, sampleRate: number): Promise<AudioBuffer> {
    const secondsPerBeat = 60 / bpm;
    const secondsPerBar = secondsPerBeat * 4;
    const totalDuration = bars * secondsPerBar;
    const offlineCtx = new OfflineAudioContext(2, Math.ceil(sampleRate * totalDuration), sampleRate);

    const roots = songId === 'midnight-funk'
      ? [43.65, 49.0, 55.0, 65.41] // F1, G1, A1, C2
      : songId === 'sunset-lofi'
      ? [55.0, 65.41, 49.0, 43.65] // Am, C, G, F
      : [55.0, 43.65, 65.41, 49.0]; // Am, F, C, G

    for (let bar = 0; bar < bars; bar++) {
      const barTime = bar * secondsPerBar;
      const root = roots[bar % roots.length];

      for (let eighth = 0; eighth < 8; eighth++) {
        const noteTime = barTime + eighth * (secondsPerBeat / 2);
        const osc = offlineCtx.createOscillator();
        const gain = offlineCtx.createGain();
        const filter = offlineCtx.createBiquadFilter();

        osc.type = songId === 'sunset-lofi' ? 'sine' : 'sawtooth';
        osc.frequency.setValueAtTime(root, noteTime);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(songId === 'sunset-lofi' ? 220 : 500, noteTime);

        gain.gain.setValueAtTime(0.38, noteTime);
        gain.gain.exponentialRampToValueAtTime(0.001, noteTime + secondsPerBeat * 0.42);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(offlineCtx.destination);

        osc.start(noteTime);
        osc.stop(noteTime + secondsPerBeat * 0.45);
      }
    }

    return await offlineCtx.startRendering();
  }

  private async renderLeadTrack(songId: string, bpm: number, bars: number, sampleRate: number): Promise<AudioBuffer> {
    const secondsPerBeat = 60 / bpm;
    const secondsPerBar = secondsPerBeat * 4;
    const totalDuration = bars * secondsPerBar;
    const offlineCtx = new OfflineAudioContext(2, Math.ceil(sampleRate * totalDuration), sampleRate);

    const riff = [
      { beat: 0.0, freq: 440.0, dur: 0.8 },  // A4
      { beat: 1.0, freq: 523.25, dur: 0.8 }, // C5
      { beat: 2.0, freq: 659.25, dur: 1.2 }, // E5
      { beat: 3.5, freq: 587.33, dur: 0.4 }, // D5
    ];

    for (let bar = 2; bar < bars; bar++) {
      const barTime = bar * secondsPerBar;
      riff.forEach((r) => {
        const noteTime = barTime + r.beat * secondsPerBeat;
        const osc = offlineCtx.createOscillator();
        const gain = offlineCtx.createGain();
        const filter = offlineCtx.createBiquadFilter();

        osc.type = songId === 'cyber-drop' ? 'sawtooth' : 'square';
        osc.frequency.setValueAtTime(r.freq, noteTime);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2400, noteTime);
        filter.Q.value = 3.0;

        const dur = r.dur * secondsPerBeat;
        gain.gain.setValueAtTime(0.24, noteTime);
        gain.gain.exponentialRampToValueAtTime(0.001, noteTime + dur);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(offlineCtx.destination);

        osc.start(noteTime);
        osc.stop(noteTime + dur);
      });
    }

    return await offlineCtx.startRendering();
  }

  private async renderChordsTrack(_songId: string, bpm: number, bars: number, sampleRate: number): Promise<AudioBuffer> {
    const secondsPerBeat = 60 / bpm;
    const secondsPerBar = secondsPerBeat * 4;
    const totalDuration = bars * secondsPerBar;
    const offlineCtx = new OfflineAudioContext(2, Math.ceil(sampleRate * totalDuration), sampleRate);

    const chords = [
      [220.0, 261.63, 329.63], // Am
      [174.61, 220.0, 261.63], // F
      [261.63, 329.63, 392.0], // C
      [196.0, 246.94, 293.66], // G
    ];

    for (let bar = 0; bar < bars; bar++) {
      const barTime = bar * secondsPerBar;
      const triad = chords[bar % chords.length];

      triad.forEach((freq) => {
        const osc = offlineCtx.createOscillator();
        const gain = offlineCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, barTime);

        gain.gain.setValueAtTime(0.001, barTime);
        gain.gain.linearRampToValueAtTime(0.12, barTime + 0.1);
        gain.gain.setValueAtTime(0.12, barTime + secondsPerBar * 0.85);
        gain.gain.linearRampToValueAtTime(0.001, barTime + secondsPerBar * 0.98);

        osc.connect(gain);
        gain.connect(offlineCtx.destination);

        osc.start(barTime);
        osc.stop(barTime + secondsPerBar);
      });
    }

    return await offlineCtx.startRendering();
  }

  private synthKick(ctx: BaseAudioContext, time: number): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.setValueAtTime(160, time);
    osc.frequency.exponentialRampToValueAtTime(45, time + 0.08);
    gain.gain.setValueAtTime(1.0, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.28);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(time);
    osc.stop(time + 0.3);
  }

  private synthSnare(ctx: BaseAudioContext, time: number): void {
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, time);
    osc.frequency.exponentialRampToValueAtTime(80, time + 0.08);
    oscGain.gain.setValueAtTime(0.6, time);
    oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    osc.start(time);
    osc.stop(time + 0.16);

    const bufferSize = ctx.sampleRate * 0.2;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.value = 1000;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.5, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(time);
    noise.stop(time + 0.2);
  }

  private synthHiHat(ctx: BaseAudioContext, time: number, isOpen: boolean): void {
    const dur = isOpen ? 0.22 : 0.05;
    const bufferSize = ctx.sampleRate * dur;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 7500;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(isOpen ? 0.25 : 0.18, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(time);
    noise.stop(time + dur);
  }
}
