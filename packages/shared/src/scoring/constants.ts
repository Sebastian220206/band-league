import { BandRole, JudgementWindowConfig, RoleInfo } from '../types/game.js';

export const DEFAULT_JUDGEMENT_WINDOWS: JudgementWindowConfig = {
  perfect: 35,  // ±35ms
  great: 70,    // ±70ms
  good: 110,    // ±110ms
  missLimit: 140 // hits outside ±140ms are ignored or count as mis-press
};

export const JUDGEMENT_POINTS: Record<string, number> = {
  perfect: 100,
  great: 70,
  good: 40,
  miss: 0,
};

export const HYPE_IMPACT = {
  perfect: +3.0,
  great: +1.5,
  good: +0.5,
  miss: -6.0,
  initialHype: 50.0,
  maxHype: 100.0,
  minHype: 0.0,
};

export const ROLES: Record<BandRole, RoleInfo> = {
  drummer: {
    id: 'drummer',
    name: 'Drummer',
    icon: '🥁',
    color: '#f97316', // Orange
    description: 'Keep the band tempo anchored. Hit kick, snare, toms, and cymbals.',
    controlsHint: {
      mobile: 'Tap 4 drum zones + kick pedal area',
      laptop: 'F, G, H, J keys + Space for Kick',
    },
  },
  guitarist: {
    id: 'guitarist',
    name: 'Guitarist',
    icon: '🎸',
    color: '#ef4444', // Red
    description: 'Rhythm riffs and blistering solos. Multi-lane note highway.',
    controlsHint: {
      mobile: 'Tap 5 lanes on landscape screen',
      laptop: 'D, F, J, K, L keys',
    },
  },
  keyboardist: {
    id: 'keyboardist',
    name: 'Keyboardist',
    icon: '🎹',
    color: '#3b82f6', // Blue
    description: 'Chords, arpeggios, and melodic pads across dynamic lanes.',
    controlsHint: {
      mobile: 'Touch piano strip',
      laptop: 'A, S, D, F, G, H keys or Web MIDI keyboard',
    },
  },
  singer: {
    id: 'singer',
    name: 'Singer',
    icon: '🎤',
    color: '#ec4899', // Pink
    description: 'Follow the vocal pitch line with precision and hold sustains.',
    controlsHint: {
      mobile: 'Drag finger up/down to match pitch line (or microphone)',
      laptop: 'Move cursor/mouse vertically or use Microphone',
    },
  },
  producer: {
    id: 'producer',
    name: 'Producer',
    icon: '🎛️',
    color: '#10b981', // Emerald
    description: 'Live mixing, cueing the drops, and boosting the band score multipliers.',
    controlsHint: {
      mobile: 'Slide volume faders and tap FX pads',
      laptop: 'Faders with mouse drag + 1, 2, 3, 4 for FX triggers',
    },
  },
};
