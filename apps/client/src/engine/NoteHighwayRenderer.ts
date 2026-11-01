import { ChartNote } from '@band-league/shared';

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

export interface HighwayTheme {
  laneColors: string[];
  hitBarYPercent: number; // e.g. 0.85 (85% down from top)
}

export const DRUM_THEME: HighwayTheme = {
  laneColors: [
    '#f97316', // Lane 0: Kick (Orange)
    '#ef4444', // Lane 1: Snare (Red)
    '#06b6d4', // Lane 2: Hi-Hat (Cyan)
    '#eab308', // Lane 3: Crash/Tom (Yellow/Gold)
  ],
  hitBarYPercent: 0.82,
};

export class NoteHighwayRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private theme: HighwayTheme = DRUM_THEME;
  private particles: HitParticle[] = [];
  private judgements: JudgementDisplay[] = [];
  private activeLanes: boolean[] = [false, false, false, false];

  // Visual scroll speed (ms visible ahead on screen)
  // 1200ms gives a very readable, musical read-ahead window
  private approachTimeMs: number = 1300;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) throw new Error('Could not get 2D canvas context');
    this.ctx = context;
  }

  public setLaneActive(lane: number, active: boolean): void {
    if (lane >= 0 && lane < this.activeLanes.length) {
      this.activeLanes[lane] = active;
    }
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
    const rect = this.getHighwayGeometry();
    const laneWidth = rect.width / 4;
    const x = rect.x + lane * laneWidth + laneWidth / 2;
    const y = rect.y + rect.height * this.theme.hitBarYPercent;
    const color = isUnison ? '#c084fc' : this.theme.laneColors[lane] || '#ffffff';

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

    // Background fill (deep stage dark)
    ctx.fillStyle = '#090a10';
    ctx.fillRect(0, 0, width, height);

    const geo = this.getHighwayGeometry();
    const laneCount = 4;
    const laneWidth = geo.width / laneCount;
    const hitY = geo.y + geo.height * this.theme.hitBarYPercent;

    // Render Stage lighting / concert backdrop beams
    this.renderStageGlow(geo, bpm, currentSongTimeMs);

    // Highway background track
    ctx.fillStyle = 'rgba(15, 18, 28, 0.9)';
    ctx.fillRect(geo.x, geo.y, geo.width, geo.height);

    // Highway lane dividers
    for (let i = 0; i <= laneCount; i++) {
      const lx = geo.x + i * laneWidth;
      ctx.strokeStyle = i === 0 || i === laneCount ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = i === 0 || i === laneCount ? 3 : 1.5;
      ctx.beginPath();
      ctx.moveTo(lx, geo.y);
      ctx.lineTo(lx, geo.y + geo.height);
      ctx.stroke();
    }

    // Active lane flash / receptor glow
    for (let i = 0; i < laneCount; i++) {
      const lx = geo.x + i * laneWidth;
      if (this.activeLanes[i]) {
        const gradient = ctx.createLinearGradient(0, hitY - 150, 0, hitY + 40);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
        gradient.addColorStop(0.7, `${this.theme.laneColors[i]}44`);
        gradient.addColorStop(1, `${this.theme.laneColors[i]}aa`);
        ctx.fillStyle = gradient;
        ctx.fillRect(lx, geo.y, laneWidth, geo.height);
      }
    }

    // Beat lines scrolling down
    const beatMs = (60 / bpm) * 1000;
    const firstBeat = Math.floor((currentSongTimeMs - 200) / beatMs);
    const lastBeat = Math.ceil((currentSongTimeMs + this.approachTimeMs) / beatMs);

    ctx.lineWidth = 1;
    for (let b = firstBeat; b <= lastBeat; b++) {
      const beatTimeMs = b * beatMs;
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

    // Hit Bar (Receptors)
    this.renderHitBar(geo, laneWidth, hitY);

    // Notes
    if (songBegan) {
      this.renderNotes(notes, currentSongTimeMs, bpm, geo, laneWidth, hitY);
    }

    // Hit Particles
    this.renderParticles();

    // Floating Judgements
    this.renderJudgements(geo, hitY);
  }

  private renderHitBar(
    geo: { x: number; y: number; width: number; height: number },
    laneWidth: number,
    hitY: number
  ): void {
    const { ctx } = this;
    const barHeight = 14;

    // Hit line glow
    ctx.shadowBlur = 12;
    ctx.shadowColor = '#f97316';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(geo.x, hitY);
    ctx.lineTo(geo.x + geo.width, hitY);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Lane Target Receptors
    for (let i = 0; i < 4; i++) {
      const rx = geo.x + i * laneWidth + 8;
      const rw = laneWidth - 16;
      const ry = hitY - barHeight / 2;

      ctx.save();
      const isActive = this.activeLanes[i];
      ctx.fillStyle = isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.15)';
      ctx.strokeStyle = this.theme.laneColors[i];
      ctx.lineWidth = isActive ? 4 : 2;

      if (isActive) {
        ctx.shadowColor = this.theme.laneColors[i];
        ctx.shadowBlur = 18;
      }

      ctx.beginPath();
      ctx.roundRect(rx, ry, rw, barHeight, 6);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
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
    const noteHeight = 22;

    for (let i = 0; i < notes.length; i++) {
      const note = notes[i];
      const noteTimeMs = note.beat * msPerBeat;
      const diffMs = noteTimeMs - currentSongTimeMs;

      // Only draw if within approach window and not already past the bottom
      if (diffMs > this.approachTimeMs || diffMs < -150) {
        continue;
      }

      // Linear distance down to hit bar
      const progress = 1 - diffMs / this.approachTimeMs;
      const ny = geo.y + progress * (hitY - geo.y) - noteHeight / 2;

      const lane = note.lane % 4;
      const nx = geo.x + lane * laneWidth + 8;
      const nw = laneWidth - 16;
      const isUnison = note.type === 'unison' || note.accent;
      const color = isUnison ? '#e879f9' : this.theme.laneColors[lane];

      ctx.save();

      // Outer Glow
      ctx.shadowBlur = isUnison ? 16 : 8;
      ctx.shadowColor = color;

      // Note Body
      const gradient = ctx.createLinearGradient(nx, ny, nx, ny + noteHeight);
      gradient.addColorStop(0, '#ffffff');
      gradient.addColorStop(0.3, color);
      gradient.addColorStop(1, '#111827');
      ctx.fillStyle = gradient;

      ctx.strokeStyle = isUnison ? '#ffffff' : color;
      ctx.lineWidth = isUnison ? 3 : 2;

      ctx.beginPath();
      ctx.roundRect(nx, ny, nw, noteHeight, 8);
      ctx.fill();
      ctx.stroke();

      // Unison Crown/Badge
      if (isUnison) {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(nx + nw / 2, ny + noteHeight / 2, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  private renderParticles(): void {
    const { ctx } = this;
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.18; // gravity
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

  private renderStageGlow(
    geo: { x: number; y: number; width: number; height: number },
    bpm: number,
    songTimeMs: number
  ): void {
    const { ctx } = this;
    const beatProgress = ((songTimeMs / 1000) * (bpm / 60)) % 1;
    const pulse = Math.pow(Math.max(0, 1 - beatProgress), 3);

    // Left and right stage spotlights
    const spotGradientLeft = ctx.createRadialGradient(
      geo.x,
      geo.y,
      10,
      geo.x,
      geo.y + geo.height * 0.5,
      geo.width * 0.8
    );
    spotGradientLeft.addColorStop(0, `rgba(249, 115, 22, ${0.15 + pulse * 0.15})`);
    spotGradientLeft.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = spotGradientLeft;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    const spotGradientRight = ctx.createRadialGradient(
      geo.x + geo.width,
      geo.y,
      10,
      geo.x + geo.width,
      geo.y + geo.height * 0.5,
      geo.width * 0.8
    );
    spotGradientRight.addColorStop(0, `rgba(59, 130, 246, ${0.12 + pulse * 0.12})`);
    spotGradientRight.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = spotGradientRight;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private getHighwayGeometry(): { x: number; y: number; width: number; height: number } {
    const width = this.canvas.width;
    const height = this.canvas.height;

    // On mobile landscape: highway occupies the center ~55-65%
    // On desktop / laptop: highway max width is ~480-540px centered
    const maxHighwayWidth = Math.min(width * 0.65, 520);
    const highwayWidth = Math.max(280, maxHighwayWidth);
    const x = (width - highwayWidth) / 2;
    const y = 0;

    return { x, y, width: highwayWidth, height };
  }
}
