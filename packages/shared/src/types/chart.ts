import { BandRole, Difficulty } from './game.js';

export interface ChartNote {
  id: string | number;
  beat: number;
  lane: number; // 0-based lane index
  holdBeats?: number;
  pitch?: number; // for singer (MIDI note number or semitones)
  accent?: boolean; // unison / heavy accent note
  type?: 'tap' | 'hold' | 'roll' | 'unison' | 'drop';
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
  offsetMs: number; // audio lead-in / calibration offset
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
