import { BandRole, Difficulty } from './game.js';

export interface ChartNote {
  id: string | number;
  beat: number;
  lane: number; // 0-based lane index (0..4 guitar, 0..6 keys, 0..3 drums, 0..3 producer faders)
  holdBeats?: number; // for sustain notes (guitar/keys/singer)
  pitch?: number; // for singer: MIDI semitone (e.g. 60 = C4, 62 = D4, 64 = E4)
  accent?: boolean; // unison / heavy accent note
  type?: 'tap' | 'hold' | 'roll' | 'unison' | 'drop' | 'vocal_run' | 'fader_cue';
}

export interface RoleChart {
  notes: ChartNote[];
}

export interface UnisonMarker {
  beat: number;
  roles: BandRole[];
  bonusPoints: number;
}

export interface SongSection {
  name: string;
  startBeat: number;
  endBeat: number;
}

export interface SongChart {
  id: string;
  title: string;
  artist: string;
  genre: string;
  bpm: number;
  offsetMs: number;
  durationSeconds: number;
  sections: SongSection[];
  stems: {
    drums?: string;
    guitar?: string;
    keys?: string;
    vocals?: string;
    bass_fx?: string;
  };
  charts: {
    [key in BandRole]?: {
      [diff in Difficulty]?: RoleChart;
    };
  };
  unisonEvents: UnisonMarker[];
}
