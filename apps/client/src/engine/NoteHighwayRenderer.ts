import { ChartNote, BandRole } from '@band-league/shared';

export interface JudgementDisplay {
  text: string;
  color: string;
  subText?: string;
  startTime: number;
  durationMs: number;
}

export interface HitParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
}

export const DRUM_THEME = {
  laneColors: ['#f97316', '#ef4444', '#06b6d4', '#eab308'],
  hitBarYPercent: 0.82,
};

export class NoteHighwayRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private role: BandRole = 'drummer';
  private particles: HitParticle[] = [];
  private judgements: JudgementDisplay[] = [];
  private activeLanes: boolean[] = [false, false, false, false, false, false, false];
  private approachTimeMs: number = 1300;
  private pitchCursorMidi: number = 60; // For Singer mode

  constructor(canvas: HTMLCanvasElement, role: BandRole = 'drummer') {
    this.canvas = canvas;
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) throw new Error('Could not get 2D canvas context');
    this.ctx = context;
    this.role = role;
  }

  public setRole(role: BandRole): void {
    this.role = role;
  }

  public setLaneActive(lane: number, active: boolean): void {
    if (lane >= 0 && lane < this.activeLanes.length) {
      this.activeLanes[lane] = active;
    }
  }

  public setSingerPitchCursor(midiNote: number): void {
    this.pitchCursorMidi = midiNote;
  }

  public addJudgement(text: string, color: string, combo?: number): void {
    this.judgements.push({
      text,
      color,
      subText: combo && combo > 1 ? `${combo} COMBO` : undefined,
      startTime: performance.now(),
      durationMs: 700,
    });
  }

  public spawnHitExplosion(lane: number, isUnison: boolean = false): void {
    const geo = this.getHighwayGeometry();
    const laneCount = this.getLaneCount();
    const laneWidth = geo.width / laneCount;
    const x = geo.x + lane * laneWidth + laneWidth / 2;
    const y = geo.y + geo.height * 0.82;
    const color = isUnison ? '#c084fc' : this.getLaneColor(lane);

    const count = isUnison ? 35 : 18;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (Math.random() * 5 + 2) * (isUnison ? 1.4 : 1.0);
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        color,
        size: Math.random() * 4 + 2,
        alpha: 1.0,
        life: 0,
        maxLife: Math.random() * 25 + 20,
      });
    }
  }

  public render(
    currentSongTimeMs: number,
    notes: ChartNote[],
    bpm: number,
    songBegan: boolean
  ): void {
    const { ctx, canvas } = this;
    const width = canvas.width;
    const height = canvas.height;

    // Stage Dark Background
    ctx.fillStyle = '#08090d';
    ctx.fillRect(0, 0, width, height);

    const geo = this.getHighwayGeometry();
    const laneCount = this.getLaneCount();
    const laneWidth = geo.width / laneCount;
    const hitY = geo.y + geo.height * 0.82;

    // Stage spotlights & lasers
    this.renderStageLasers(geo, bpm, currentSongTimeMs);

    if (this.role === 'singer') {
      // Vocal Pitch Ribbon
      this.renderVocalRibbon(geo, notes, currentSongTimeMs, bpm);
    } else {
      // Standard / Multi-lane Note Highway
      this.renderStandardHighway(geo, laneCount, laneWidth, hitY);

      // Scrolling Beat Lines
      this.renderBeatLines(geo, bpm, currentSongTimeMs, hitY);

      // Receptors / Hit Bar
      this.renderHitBar(geo, laneCount, laneWidth, hitY);

      // Notes & Holds
      if (songBegan) {
        this.renderNotes(notes, currentSongTimeMs, bpm, geo, laneWidth, hitY);
      }
    }

    // Particles & Judgements
    this.renderParticles();
    this.renderJudgements(geo, hitY);
  }

  private getLaneCount(): number {
    switch (this.role) {
      case 'keyboardist': return 7;
      case 'guitarist': return 5;
      case 'singer': return 1;
      case 'producer': return 4;
      case 'drummer':
      default: return 4;
    }
  }

  private getLaneColor(lane: number): string {
    const palettes: Record<BandRole, string[]> = {
      drummer: ['#f97316', '#ef4444', '#06b6d4', '#eab308'],
      guitarist: ['#22c55e', '#ef4444', '#eab308', '#3b82f6', '#f97316'],
      keyboardist: ['#ec4899', '#3b82f6', '#06b6d4', '#10b981', '#eab308', '#f97316', '#a855f7'],
      singer: ['#ec4899'],
      producer: ['#10b981', '#06b6d4', '#8b5cf6', '#f97316'],
    };
    const pal = palettes[this.role] || palettes.drummer;
    return pal[lane % pal.length];
  }

  private renderStandardHighway(
    geo: { x: number; y: number; width: number; height: number },
    laneCount: number,
    laneWidth: number,
    hitY: number
  ): void {
    const { ctx } = this;
    ctx.fillStyle = 'rgba(15, 18, 28, 0.9)';
    ctx.fillRect(geo.x, geo.y, geo.width, geo.height);

    for (let i = 0; i <= laneCount; i++) {
      const lx = geo.x + i * laneWidth;
      ctx.strokeStyle = i === 0 || i === laneCount ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = i === 0 || i === laneCount ? 3 : 1.5;
      ctx.beginPath();
      ctx.moveTo(lx, geo.y);
      ctx.lineTo(lx, geo.y + geo.height);
      ctx.stroke();
    }

    for (let i = 0; i < laneCount; i++) {
      const lx = geo.x + i * laneWidth;
      if (this.activeLanes[i]) {
        const gradient = ctx.createLinearGradient(0, hitY - 140, 0, hitY + 30);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
        gradient.addColorStop(0.7, `${this.getLaneColor(i)}44`);
        gradient.addColorStop(1, `${this.getLaneColor(i)}aa`);
        ctx.fillStyle = gradient;
        ctx.fillRect(lx, geo.y, laneWidth, geo.height);
      }
    }
  }

  private renderHitBar(
    geo: { x: number; y: number; width: number; height: number },
    laneCount: number,
    laneWidth: number,
    hitY: number
  ): void {
    const { ctx } = this;
    const barHeight = 12;

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(geo.x, hitY);
    ctx.lineTo(geo.x + geo.width, hitY);
    ctx.stroke();

    for (let i = 0; i < laneCount; i++) {
      const rx = geo.x + i * laneWidth + 6;
      const rw = laneWidth - 12;
      const ry = hitY - barHeight / 2;
      const isActive = this.activeLanes[i];

      ctx.save();
      ctx.fillStyle = isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.15)';
      ctx.strokeStyle = this.getLaneColor(i);
      ctx.lineWidth = isActive ? 3 : 1.5;

      if (isActive) {
        ctx.shadowColor = this.getLaneColor(i);
        ctx.shadowBlur = 16;
      }

      ctx.beginPath();
      ctx.roundRect(rx, ry, rw, barHeight, 4);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  }

  private renderBeatLines(
    geo: { x: number; y: number; width: number; height: number },
    bpm: number,
    currentSongTimeMs: number,
    hitY: number
  ): void {
    const { ctx } = this;
    const msPerBeat = (60 / bpm) * 1000;
    const firstBeat = Math.floor((currentSongTimeMs - 200) / msPerBeat);
    const lastBeat = Math.ceil((currentSongTimeMs + this.approachTimeMs) / msPerBeat);

    for (let b = firstBeat; b <= lastBeat; b++) {
      const beatTimeMs = b * msPerBeat;
      const progress = 1 - (beatTimeMs - currentSongTimeMs) / this.approachTimeMs;
      if (progress >= 0 && progress <= 1) {
        const by = geo.y + progress * (hitY - geo.y);
        const isBar = b % 4 === 0;
        ctx.strokeStyle = isBar ? 'rgba(255, 255, 255, 0.35)' : 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = isBar ? 2 : 1;
        ctx.beginPath();
        ctx.moveTo(geo.x, by);
        ctx.lineTo(geo.x + geo.width, by);
        ctx.stroke();
      }
    }
  }

  private renderNotes(
    notes: ChartNote[],
    currentSongTimeMs: number,
    bpm: number,
    geo: { x: number; y: number; width: number; height: number },
    laneWidth: number,
    hitY: number
  ): void {
    const { ctx } = this;
    const msPerBeat = (60 / bpm) * 1000;
    const noteHeight = 20;
    const laneCount = this.getLaneCount();

    for (let i = 0; i < notes.length; i++) {
      const note = notes[i];
      const noteTimeMs = note.beat * msPerBeat;
      const diffMs = noteTimeMs - currentSongTimeMs;

      if (diffMs > this.approachTimeMs || diffMs < -150) continue;

      const progress = 1 - diffMs / this.approachTimeMs;
      const ny = geo.y + progress * (hitY - geo.y) - noteHeight / 2;

      const lane = note.lane % laneCount;
      const nx = geo.x + lane * laneWidth + 6;
      const nw = laneWidth - 12;
      const isUnison = note.type === 'unison' || !!note.accent;
      const color = isUnison ? '#e879f9' : this.getLaneColor(lane);

      // Render Sustain Hold Tail (Guitar & Keys)
      if (note.holdBeats && note.holdBeats > 0) {
        const holdDurationMs = note.holdBeats * msPerBeat;
        const holdEndProgress = 1 - (diffMs + holdDurationMs) / this.approachTimeMs;
        const holdEndY = geo.y + holdEndProgress * (hitY - geo.y);
        const holdLength = Math.max(8, ny - holdEndY);

        ctx.save();
        ctx.fillStyle = `${color}66`;
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(nx + nw * 0.3, holdEndY, nw * 0.4, holdLength, 4);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }

      ctx.save();
      ctx.shadowBlur = isUnison ? 16 : 8;
      ctx.shadowColor = color;

      const gradient = ctx.createLinearGradient(nx, ny, nx, ny + noteHeight);
      gradient.addColorStop(0, '#ffffff');
      gradient.addColorStop(0.4, color);
      gradient.addColorStop(1, '#0f172a');
      ctx.fillStyle = gradient;

      ctx.strokeStyle = isUnison ? '#ffffff' : color;
      ctx.lineWidth = isUnison ? 3 : 2;

      ctx.beginPath();
      ctx.roundRect(nx, ny, nw, noteHeight, 6);
      ctx.fill();
      ctx.stroke();

      if (isUnison) {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(nx + nw / 2, ny + noteHeight / 2, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  private renderVocalRibbon(
    geo: { x: number; y: number; width: number; height: number },
    notes: ChartNote[],
    currentSongTimeMs: number,
    bpm: number
  ): void {
    const { ctx } = this;
    const msPerBeat = (60 / bpm) * 1000;

    // Pitch Highway background
    ctx.fillStyle = 'rgba(20, 15, 30, 0.9)';
    ctx.fillRect(geo.x, geo.y, geo.width, geo.height);

    // Guide semitone lines (C4 to A4)
    const minMidi = 58;
    const maxMidi = 72;
    const midiRange = maxMidi - minMidi;

    for (let m = minMidi; m <= maxMidi; m += 2) {
      const normY = geo.y + ((maxMidi - m) / midiRange) * geo.height * 0.75 + 40;
      ctx.strokeStyle = 'rgba(236, 72, 153, 0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(geo.x, normY);
      ctx.lineTo(geo.x + geo.width, normY);
      ctx.stroke();
    }

    // Render Target Pitch Blocks
    notes.forEach((note) => {
      const pitch = note.pitch || 64;
      const noteTimeMs = note.beat * msPerBeat;
      const diffMs = noteTimeMs - currentSongTimeMs;

      if (diffMs > this.approachTimeMs || diffMs < -150) return;

      const progress = 1 - diffMs / this.approachTimeMs;
      const bx = geo.x + progress * geo.width;
      const by = geo.y + ((maxMidi - pitch) / midiRange) * geo.height * 0.75 + 40;
      const bw = Math.max(20, (note.holdBeats || 1) * 35);

      ctx.save();
      ctx.fillStyle = '#ec4899';
      ctx.shadowColor = '#ec4899';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.roundRect(bx - bw / 2, by - 8, bw, 16, 8);
      ctx.fill();
      ctx.restore();
    });

    // Render User Vocal / Touch Cursor
    const cursorY = geo.y + ((maxMidi - this.pitchCursorMidi) / midiRange) * geo.height * 0.75 + 40;
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#ec4899';
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.arc(geo.x + geo.width * 0.5, cursorY, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private renderStageLasers(
    geo: { x: number; y: number; width: number; height: number },
    bpm: number,
    songTimeMs: number
  ): void {
    const { ctx } = this;
    const beatProgress = ((songTimeMs / 1000) * (bpm / 60)) % 1;
    const pulse = Math.pow(Math.max(0, 1 - beatProgress), 3);

    const laserAngle = Math.sin((songTimeMs / 1000) * 1.5) * 0.3;
    ctx.save();
    ctx.strokeStyle = `rgba(249, 115, 22, ${0.12 + pulse * 0.25})`;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(geo.x, 0);
    ctx.lineTo(geo.x + geo.width * 0.8 + laserAngle * 200, this.canvas.height);
    ctx.stroke();

    ctx.strokeStyle = `rgba(168, 85, 247, ${0.12 + pulse * 0.25})`;
    ctx.beginPath();
    ctx.moveTo(geo.x + geo.width, 0);
    ctx.lineTo(geo.x + geo.width * 0.2 - laserAngle * 200, this.canvas.height);
    ctx.stroke();
    ctx.restore();
  }

  private renderParticles(): void {
    const { ctx } = this;
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.18;
      p.life++;
      p.alpha = Math.max(0, 1 - p.life / p.maxLife);

      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  private renderJudgements(
    geo: { x: number; y: number; width: number; height: number },
    hitY: number
  ): void {
    const { ctx } = this;
    const now = performance.now();
    const centerX = geo.x + geo.width / 2;
    const centerY = hitY - 100;

    for (let i = this.judgements.length - 1; i >= 0; i--) {
      const j = this.judgements[i];
      const elapsed = now - j.startTime;
      if (elapsed > j.durationMs) {
        this.judgements.splice(i, 1);
        continue;
      }

      const progress = elapsed / j.durationMs;
      const alpha = Math.max(0, 1 - Math.pow(progress, 2));
      const floatY = centerY - progress * 40;
      const scale = 1.0 + Math.sin(progress * Math.PI) * 0.25;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(centerX, floatY);
      ctx.scale(scale, scale);

      ctx.font = '900 28px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowBlur = 12;
      ctx.shadowColor = j.color;
      ctx.fillStyle = j.color;
      ctx.fillText(j.text, 0, 0);

      if (j.subText) {
        ctx.font = '700 16px Outfit, sans-serif';
        ctx.fillStyle = '#f8fafc';
        ctx.shadowBlur = 6;
        ctx.shadowColor = '#000000';
        ctx.fillText(j.subText, 0, 24);
      }

      ctx.restore();
    }
  }

  private getHighwayGeometry(): { x: number; y: number; width: number; height: number } {
    const width = this.canvas.width;
    const height = this.canvas.height;
    const maxHighwayWidth = this.role === 'keyboardist' ? Math.min(width * 0.8, 620) : Math.min(width * 0.65, 520);
    const highwayWidth = Math.max(280, maxHighwayWidth);
    const x = (width - highwayWidth) / 2;
    const y = 0;
    return { x, y, width: highwayWidth, height };
  }
}
