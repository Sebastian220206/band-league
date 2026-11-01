/**
 * Real-time Microphone Pitch Detector for Singer role.
 * Uses normalized autocorrelation (YIN-like algorithm) to determine
 * vocal frequency in Hz, converting to MIDI note semitones.
 */

export class PitchDetector {
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private mediaStream: MediaStream | null = null;
  private buffer: Float32Array = new Float32Array(2048);
  private isListening: boolean = false;

  public async start(): Promise<boolean> {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        console.warn('Microphone not supported on this browser/environment');
        return false;
      }

      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioCtxClass();
      const source = this.audioCtx.createMediaStreamSource(this.mediaStream);

      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 2048;
      source.connect(this.analyser);

      this.isListening = true;
      return true;
    } catch (err) {
      console.warn('Microphone permission denied or unavailable:', err);
      return false;
    }
  }

  public stop(): void {
    this.isListening = false;
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      this.audioCtx.close();
      this.audioCtx = null;
    }
  }

  public getIsListening(): boolean {
    return this.isListening;
  }

  /**
   * Samples current audio and returns detected pitch in MIDI semitones (e.g. 60 = C4).
   * Returns -1 if silent or unvoiced.
   */
  public detectMidiPitch(): { pitchMidi: number; confidence: number; freqHz: number } {
    if (!this.analyser || !this.isListening || !this.audioCtx) {
      return { pitchMidi: -1, confidence: 0, freqHz: 0 };
    }

    (this.analyser as any).getFloatTimeDomainData(this.buffer);

    // Calculate RMS volume to filter silence
    let sumSquares = 0;
    for (let i = 0; i < this.buffer.length; i++) {
      sumSquares += this.buffer[i] * this.buffer[i];
    }
    const rms = Math.sqrt(sumSquares / this.buffer.length);
    if (rms < 0.02) {
      // Too quiet
      return { pitchMidi: -1, confidence: 0, freqHz: 0 };
    }

    // Autocorrelation pitch detection
    const sampleRate = this.audioCtx.sampleRate;
    const minPeriod = Math.floor(sampleRate / 1000); // 1000 Hz ceiling
    const maxPeriod = Math.floor(sampleRate / 65);   // 65 Hz floor

    let bestCorrelation = -1;
    let bestPeriod = -1;

    for (let period = minPeriod; period <= maxPeriod; period++) {
      let correlation = 0;
      for (let i = 0; i < this.buffer.length - period; i++) {
        correlation += this.buffer[i] * this.buffer[i + period];
      }
      correlation = correlation / (this.buffer.length - period);

      if (correlation > bestCorrelation) {
        bestCorrelation = correlation;
        bestPeriod = period;
      }
    }

    if (bestPeriod > 0 && bestCorrelation > 0.015) {
      const freqHz = sampleRate / bestPeriod;
      // Convert Hz to MIDI note (A4 = 440 Hz = MIDI 69)
      const pitchMidi = 69 + 12 * Math.log2(freqHz / 440);
      const confidence = Math.min(1.0, bestCorrelation * 10);
      return { pitchMidi: Math.round(pitchMidi * 10) / 10, confidence, freqHz };
    }

    return { pitchMidi: -1, confidence: 0, freqHz: 0 };
  }
}
