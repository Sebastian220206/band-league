import { BandRole, JudgementWindowConfig, RoleInfo, VenueInfo, LeagueDivision } from '../types/game.js';

export const DEFAULT_JUDGEMENT_WINDOWS: JudgementWindowConfig = {
  perfect: 35,  // ±35ms
  great: 70,    // ±70ms
  good: 110,    // ±110ms
  missLimit: 140, // hits outside ±140ms are ignored or count as mis-press
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
    specialAbilityName: 'Lock the Groove',
    specialAbilityDesc: 'Widens timing windows for all bandmates for 10 seconds.',
    controlsHint: {
      mobile: 'Tap 4 drum zones + kick pedal area',
      laptop: 'F, G, H, J keys + Space for Kick (or D, F, J, K)',
    },
  },
  guitarist: {
    id: 'guitarist',
    name: 'Guitarist',
    icon: '🎸',
    color: '#ef4444', // Red
    description: 'Rhythm riffs, holds, and blistering solos on a 5-lane highway.',
    specialAbilityName: 'Solo Overdrive',
    specialAbilityDesc: 'Earn 2× personal points and unleash stage pyrotechnics.',
    controlsHint: {
      mobile: 'Tap and hold across 5 touch lanes',
      laptop: 'D, F, J, K, L keys (or 1, 2, 3, 4, 5)',
    },
  },
  keyboardist: {
    id: 'keyboardist',
    name: 'Keyboardist',
    icon: '🎹',
    color: '#3b82f6', // Blue
    description: 'Chords, arpeggios, and synth leads across a dynamic 7-key keyboard.',
    specialAbilityName: 'Sustain Harmony',
    specialAbilityDesc: 'Boosts band hype recovery and sustains hold notes.',
    controlsHint: {
      mobile: 'Tap & slide on the piano strip',
      laptop: 'A, S, D, F, G, H, J keys or USB MIDI Keyboard',
    },
  },
  singer: {
    id: 'singer',
    name: 'Singer',
    icon: '🎤',
    color: '#ec4899', // Pink
    description: 'Follow the vocal pitch line smoothly with voice or pitch tracing.',
    specialAbilityName: 'Crowd Call',
    specialAbilityDesc: 'Fills the Crowd Hype Meter to maximum with powerful chorus sustains.',
    controlsHint: {
      mobile: 'Drag finger up/down on the pitch ribbon (or use Microphone)',
      laptop: 'Move mouse vertically or sing into your Microphone',
    },
  },
  producer: {
    id: 'producer',
    name: 'Producer',
    icon: '🎛️',
    color: '#10b981', // Emerald
    description: 'Live DJ mixer: adjust 4 stem faders, fire FX pads, and cue The Drop.',
    specialAbilityName: 'The Drop',
    specialAbilityDesc: 'Triggers a massive 2.5× band-wide multiplier for the drop.',
    controlsHint: {
      mobile: 'Slide volume faders and tap FX pads',
      laptop: 'Drag faders with mouse + 1, 2, 3, 4 keys for FX triggers',
    },
  },
};

export const VENUES: VenueInfo[] = [
  {
    id: 'garage',
    name: "The Rehearsal Garage",
    city: 'Detroit',
    requiredFans: 0,
    crowdSize: '15 Friends & Family',
    stageGlowColor: '#f97316',
    description: 'Where legends begin. Concrete floor, buzzing amps, and raw garage rock passion.',
  },
  {
    id: 'underground_club',
    name: 'The Neon Basement',
    city: 'Berlin',
    requiredFans: 250,
    crowdSize: '250 Enthusiastic Fans',
    stageGlowColor: '#8b5cf6',
    description: 'Underground indie hotspot with strobes, smoke machines, and packed dancefloors.',
  },
  {
    id: 'starlight_arena',
    name: 'Starlight Arena',
    city: 'Tokyo',
    requiredFans: 1200,
    crowdSize: '12,000 Screaming Fans',
    stageGlowColor: '#3b82f6',
    description: 'Colossal indoor arena with laser rigs, soaring video screens, and thunderous sound.',
  },
  {
    id: 'neon_dome',
    name: 'Solaris World Festival',
    city: 'Los Angeles',
    requiredFans: 5000,
    crowdSize: '80,000 Festival Headliners',
    stageGlowColor: '#ec4899',
    description: 'Mainstage under the open stars with fireworks, flame towers, and worldwide livestream.',
  },
];

export const LEAGUE_DIVISIONS: Record<LeagueDivision, { name: string; minRating: number; badgeColor: string }> = {
  garage: { name: 'Garage Circuit', minRating: 0, badgeColor: '#94a3b8' },
  club: { name: 'Club Circuit', minRating: 1000, badgeColor: '#10b981' },
  arena: { name: 'Arena Masters', minRating: 1500, badgeColor: '#3b82f6' },
  festival: { name: 'Festival Stars', minRating: 2000, badgeColor: '#8b5cf6' },
  headliner: { name: 'World Headliners', minRating: 2500, badgeColor: '#f59e0b' },
};
