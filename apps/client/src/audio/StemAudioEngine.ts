/**
 * High-precision Web Audio Engine for Band League.
 * Provides sample-accurate playback for multi-track stems,
 * procedural synth backup, mute-on-miss dynamic mixing, and SFX.
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
  private stems: Map<string, StemTrack> = new Map();
  
  private songStartTimeCtx: number = 0;
  private pauseTimeCtx: number = 0;
  private isPlaying: boolean = false;
  private isPaused: boolean = false;
  private calibrationOffsetMs: number = 0; // Device latency compensation
  private songDurationSeconds: number = 0;

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
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.5;
      this.sfxGain.connect(this.masterGain);
    }

    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  public getContext(): AudioContext {
    if (!this.ctx) {
      throw new Error('AudioContext not initialized. Call init() on user gesture first.');
    }
    return this.ctx;
  }

  public setCalibrationOffset(offsetMs: number): void {
    this.calibrationOffsetMs = offsetMs;
    localStorage.setItem('band_league_latency_offset_ms', offsetMs.toString());
  }

  public getCalibrationOffset(): number {
    return this.calibrationOffsetMs;
  }

  /**
   * Generates or loads multi-track audio stems procedurally.
   * Creates 4 stems: 'drums', 'bass', 'lead', and 'chords'.
   */
  public async loadProceduralSong(bpm: number = 124, totalBars: number = 24): Promise<number> {
    await this.init();
    const ctx = this.ctx!;
    const sampleRate = ctx.sampleRate;
    const secondsPerBeat = 60 / bpm;
    const secondsPerBar = secondsPerBeat * 4;
    const totalDuration = totalBars * secondsPerBar;
    this.songDurationSeconds = totalDuration;

    // Build stems using OfflineAudioContext for glitch-free sample-level rendering
    const [drumBuf, bassBuf, leadBuf, chordsBuf] = await Promise.all([
      this.renderDrumsTrack(bpm, totalBars, sampleRate),
      this.renderBassTrack(bpm, totalBars, sampleRate),
      this.renderLeadTrack(bpm, totalBars, sampleRate),
      this.renderChordsTrack(bpm, totalBars, sampleRate),
    ]);

    this.registerStem('drums', drumBuf, 1.0);
    this.registerStem('bass', bassBuf, 0.85);
    this.registerStem('lead', leadBuf, 0.8);
    this.registerStem('chords', chordsBuf, 0.75);

    return totalDuration;
  }

  private registerStem(name: string, buffer: AudioBuffer, baseVolume: number): void {
    const ctx = this.ctx!;
    const gainNode = ctx.createGain();
    gainNode.gain.value = baseVolume;

    const filterNode = ctx.createBiquadFilter();
    filterNode.type = 'lowpass';
    filterNode.frequency.value = 20000; // wide open initially

    filterNode.connect(gainNode);
    gainNode.connect(this.masterGain!);

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
    this.songStartTimeCtx = now - startOffsetSec;
    this.isPlaying = true;
    this.isPaused = false;

    this.stems.forEach((stem) => {
      const source = this.ctx!.createBufferSource();
      source.buffer = stem.buffer;
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
        // ignore if already stopped
      }
    });
  }

  public resumeSong(): void {
    if (!this.isPaused || !this.ctx) return;
    const elapsed = this.pauseTimeCtx - this.songStartTimeCtx;
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

  /**
   * Returns current song playback position in milliseconds.
   * Compensates for device audio/touch calibration offset.
   */
  public getCurrentSongTimeMs(): number {
    if (!this.isPlaying || !this.ctx) return 0;
    if (this.isPaused) {
      return (this.pauseTimeCtx - this.songStartTimeCtx) * 1000 - this.calibrationOffsetMs;
    }
    const elapsedSec = this.ctx.currentTime - this.songStartTimeCtx;
    return elapsedSec * 1000 - this.calibrationOffsetMs;
  }

  public getRawSongTimeMs(): number {
    if (!this.isPlaying || !this.ctx) return 0;
    if (this.isPaused) {
      return (this.pauseTimeCtx - this.songStartTimeCtx) * 1000;
    }
    return (this.ctx.currentTime - this.songStartTimeCtx) * 1000;
  }

  public getDurationSeconds(): number {
    return this.songDurationSeconds;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying && !this.isPaused;
  }

  /**
   * Miss penalty: low-passes or mutes the stem temporarily to simulate bad performance
   */
  public setStemPerformanceState(stemName: string, isHealthy: boolean): void {
    const stem = this.stems.get(stemName);
    if (!stem || !this.ctx) return;

    const now = this.ctx.currentTime;
    if (isHealthy) {
      // Restore crisp full spectrum
      stem.filterNode.frequency.setTargetAtTime(20000, now, 0.08);
      stem.gainNode.gain.setTargetAtTime(stem.baseVolume, now, 0.08);
    } else {
      // Muffle stem and lower volume
      stem.filterNode.frequency.setTargetAtTime(600, now, 0.05);
      stem.gainNode.gain.setTargetAtTime(stem.baseVolume * 0.25, now, 0.05);
    }
  }

  /**
   * Sound effects synthesized in real time
   */
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
      // Low buzz / vinyl scratch
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
      // Big triumphant power chord
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

  /* -------------------------------------------------------------
     Procedural Stem Rendering using Web Audio OfflineAudioContext
     ------------------------------------------------------------- */

  private async renderDrumsTrack(bpm: number, bars: number, sampleRate: number): Promise<AudioBuffer> {
    const secondsPerBeat = 60 / bpm;
    const secondsPerBar = secondsPerBeat * 4;
    const totalDuration = bars * secondsPerBar;
    const offlineCtx = new OfflineAudioContext(2, Math.ceil(sampleRate * totalDuration), sampleRate);

    for (let bar = 0; bar < bars; bar++) {
      const barTime = bar * secondsPerBar;
      
      // Kick on beats 1 and 3 (and syncopated hits in chorus)
      this.synthKick(offlineCtx, barTime);
      this.synthKick(offlineCtx, barTime + secondsPerBeat * 2);
      if (bar % 4 === 3) {
        this.synthKick(offlineCtx, barTime + secondsPerBeat * 2.75);
      }

      // Snare on beats 2 and 4
      this.synthSnare(offlineCtx, barTime + secondsPerBeat);
      this.synthSnare(offlineCtx, barTime + secondsPerBeat * 3);

      // Hi-hats every eighth note
      for (let eighth = 0; eighth < 8; eighth++) {
        const hhTime = barTime + eighth * (secondsPerBeat / 2);
        const isOpen = eighth === 4 || eighth === 7;
        this.synthHiHat(offlineCtx, hhTime, isOpen);
      }

      // Drum fill on 4th bars
      if (bar % 4 === 3) {
        this.synthTom(offlineCtx, barTime + secondsPerBeat * 3.25, 200);
        this.synthTom(offlineCtx, barTime + secondsPerBeat * 3.5, 150);
        this.synthTom(offlineCtx, barTime + secondsPerBeat * 3.75, 110);
      }
    }

    return await offlineCtx.startRendering();
  }

  private async renderBassTrack(bpm: number, bars: number, sampleRate: number): Promise<AudioBuffer> {
    const secondsPerBeat = 60 / bpm;
    const secondsPerBar = secondsPerBeat * 4;
    const totalDuration = bars * secondsPerBar;
    const offlineCtx = new OfflineAudioContext(2, Math.ceil(sampleRate * totalDuration), sampleRate);

    // Synthwave / Rock Bass Progression: Am - F - C - G
    const rootNotes = [
      55.0,  // A1
      43.65, // F1
      65.41, // C2
      49.0,  // G1
    ];

    for (let bar = 0; bar < bars; bar++) {
      const barTime = bar * secondsPerBar;
      const root = rootNotes[bar % rootNotes.length];

      // Driving 8th note bassline
      for (let eighth = 0; eighth < 8; eighth++) {
        const noteTime = barTime + eighth * (secondsPerBeat / 2);
        const osc = offlineCtx.createOscillator();
        const gain = offlineCtx.createGain();
        const filter = offlineCtx.createBiquadFilter();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(root, noteTime);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(450, noteTime);
        filter.frequency.exponentialRampToValueAtTime(150, noteTime + secondsPerBeat * 0.4);

        gain.gain.setValueAtTime(0.4, noteTime);
        gain.gain.exponentialRampToValueAtTime(0.001, noteTime + secondsPerBeat * 0.45);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(offlineCtx.destination);

        osc.start(noteTime);
        osc.stop(noteTime + secondsPerBeat * 0.48);
      }
    }

    return await offlineCtx.startRendering();
  }

  private async renderLeadTrack(bpm: number, bars: number, sampleRate: number): Promise<AudioBuffer> {
    const secondsPerBeat = 60 / bpm;
    const secondsPerBar = secondsPerBeat * 4;
    const totalDuration = bars * secondsPerBar;
    const offlineCtx = new OfflineAudioContext(2, Math.ceil(sampleRate * totalDuration), sampleRate);

    // Lead guitar riff notes (frequencies in Hz)
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

        osc.type = 'square';
        osc.frequency.setValueAtTime(r.freq, noteTime);

        // Warm lead guitar filter
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2200, noteTime);
        filter.Q.value = 4.0;

        const dur = r.dur * secondsPerBeat;
        gain.gain.setValueAtTime(0.25, noteTime);
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

  private async renderChordsTrack(bpm: number, bars: number, sampleRate: number): Promise<AudioBuffer> {
    const secondsPerBeat = 60 / bpm;
    const secondsPerBar = secondsPerBeat * 4;
    const totalDuration = bars * secondsPerBar;
    const offlineCtx = new OfflineAudioContext(2, Math.ceil(sampleRate * totalDuration), sampleRate);

    // Chords: Am, F, C, G (triads)
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

        // Long sustained chords
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

  /* Synthetic drum instruments */
  private synthKick(ctx: BaseAudioContext, time: number): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(45, time + 0.08);
    gain.gain.setValueAtTime(1.0, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.28);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(time);
    osc.stop(time + 0.3);
  }

  private synthSnare(ctx: BaseAudioContext, time: number): void {
    // Tonal body
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

    // Noise snap
    const bufferSize = ctx.sampleRate * 0.2;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
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
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
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

  private synthTom(ctx: BaseAudioContext, time: number, freq: number): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.6, time + 0.12);
    gain.gain.setValueAtTime(0.5, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.16);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(time);
    osc.stop(time + 0.18);
  }
}
