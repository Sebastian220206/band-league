import { SongChart, BandRole, Difficulty } from '@band-league/shared';

// Helper to generate a playable chart for any role
function generateRoleNotes(role: BandRole, diff: Difficulty, totalBars: number = 24): any[] {
  const notes: any[] = [];
  const maxLane = role === 'keyboardist' ? 6 : role === 'guitarist' ? 4 : 3;
  const density = diff === 'easy' ? 4 : diff === 'medium' ? 2 : 1; // beats per note

  for (let bar = 0; bar < totalBars; bar++) {
    const barBeat = bar * 4;
    for (let b = 0; b < 4; b += density) {
      const beat = barBeat + b;
      let lane = (bar + b) % (maxLane + 1);

      if (role === 'singer') {
        // Melodic vocal line centered around C4-A4 (MIDI 60 to 69)
        const pitch = 60 + ((bar * 2 + b) % 9);
        notes.push({
          id: `${role}_${diff}_${beat}`,
          beat,
          lane: 0,
          pitch,
          holdBeats: density >= 2 ? 1.5 : 0.8,
          type: 'vocal_run',
        });
      } else if (role === 'producer') {
        // Fader cues and drops
        const isDrop = bar % 8 === 7 && b >= 2;
        notes.push({
          id: `${role}_${diff}_${beat}`,
          beat,
          lane: b % 4,
          type: isDrop ? 'drop' : 'fader_cue',
          accent: isDrop,
        });
      } else if (role === 'guitarist') {
        const isHold = (bar + b) % 4 === 3;
        notes.push({
          id: `${role}_${diff}_${beat}`,
          beat,
          lane,
          holdBeats: isHold ? 1.5 : undefined,
          type: isHold ? 'hold' : 'tap',
        });
      } else {
        // Drummer / Keyboardist
        notes.push({
          id: `${role}_${diff}_${beat}`,
          beat,
          lane,
          type: 'tap',
        });
      }
    }
  }

  // Inject Unison drops at bar 8 (beat 32) and bar 20 (beat 80)
  notes.push({
    id: `${role}_${diff}_unison_32`,
    beat: 32,
    lane: 0,
    accent: true,
    type: 'unison',
  });
  notes.push({
    id: `${role}_${diff}_unison_80`,
    beat: 80,
    lane: maxLane,
    accent: true,
    type: 'unison',
  });

  return notes.sort((a, b) => a.beat - b.beat);
}

function buildSongCharts(totalBars: number = 24) {
  const roles: BandRole[] = ['drummer', 'guitarist', 'keyboardist', 'singer', 'producer'];
  const diffs: Difficulty[] = ['easy', 'medium', 'hard'];
  const charts: any = {};

  roles.forEach((r) => {
    charts[r] = {};
    diffs.forEach((d) => {
      charts[r][d] = {
        notes: generateRoleNotes(r, d, totalBars),
      };
    });
  });

  return charts;
}

export const ALL_SONGS: SongChart[] = [
  {
    id: 'neon-horizon',
    title: 'Neon Horizon',
    artist: 'The Cyber Punks',
    genre: 'Synthwave / Arena Rock',
    bpm: 124,
    offsetMs: 0,
    durationSeconds: 46.5,
    sections: [
      { name: 'Intro', startBeat: 0, endBeat: 16 },
      { name: 'Verse 1', startBeat: 16, endBeat: 32 },
      { name: 'Chorus', startBeat: 32, endBeat: 64 },
      { name: 'Solo', startBeat: 64, endBeat: 80 },
      { name: 'Final Chorus', startBeat: 80, endBeat: 96 },
    ],
    stems: { drums: 'procedural', guitar: 'procedural', keys: 'procedural', bass_fx: 'procedural' },
    unisonEvents: [
      { beat: 32.0, roles: ['drummer', 'guitarist', 'keyboardist', 'singer', 'producer'], bonusPoints: 800 },
      { beat: 80.0, roles: ['drummer', 'guitarist', 'keyboardist', 'singer', 'producer'], bonusPoints: 1200 },
    ],
    charts: buildSongCharts(24),
  },
  {
    id: 'midnight-funk',
    title: 'Midnight Funk Groove',
    artist: 'Velvet Groove Syndicate',
    genre: 'Disco / Funk Pop',
    bpm: 116,
    offsetMs: 0,
    durationSeconds: 42.0,
    sections: [
      { name: 'Bass Intro', startBeat: 0, endBeat: 16 },
      { name: 'Funky Verse', startBeat: 16, endBeat: 32 },
      { name: 'Groove Chorus', startBeat: 32, endBeat: 64 },
      { name: 'Brass Breakdown', startBeat: 64, endBeat: 80 },
    ],
    stems: { drums: 'procedural', guitar: 'procedural', keys: 'procedural', bass_fx: 'procedural' },
    unisonEvents: [
      { beat: 32.0, roles: ['drummer', 'guitarist', 'keyboardist', 'singer', 'producer'], bonusPoints: 800 },
      { beat: 64.0, roles: ['drummer', 'guitarist', 'keyboardist', 'singer', 'producer'], bonusPoints: 1000 },
    ],
    charts: buildSongCharts(20),
  },
  {
    id: 'cyber-drop',
    title: 'Cybernetic Drop',
    artist: 'Glitch Protocol',
    genre: 'EDM / Electro House',
    bpm: 128,
    offsetMs: 0,
    durationSeconds: 45.0,
    sections: [
      { name: 'Build Up', startBeat: 0, endBeat: 16 },
      { name: 'Riser Sweep', startBeat: 16, endBeat: 32 },
      { name: 'THE DROP', startBeat: 32, endBeat: 64 },
      { name: 'Electro Outro', startBeat: 64, endBeat: 96 },
    ],
    stems: { drums: 'procedural', guitar: 'procedural', keys: 'procedural', bass_fx: 'procedural' },
    unisonEvents: [
      { beat: 32.0, roles: ['drummer', 'guitarist', 'keyboardist', 'singer', 'producer'], bonusPoints: 1500 },
    ],
    charts: buildSongCharts(24),
  },
  {
    id: 'sunset-lofi',
    title: 'Sunset in Shibuya',
    artist: 'Coffee & Vinyl',
    genre: 'Chill Lo-Fi Hip Hop',
    bpm: 85,
    offsetMs: 0,
    durationSeconds: 45.0,
    sections: [
      { name: 'Vinyl Dust', startBeat: 0, endBeat: 16 },
      { name: 'Rhodes Melody', startBeat: 16, endBeat: 32 },
      { name: 'Chill Chorus', startBeat: 32, endBeat: 64 },
    ],
    stems: { drums: 'procedural', guitar: 'procedural', keys: 'procedural', bass_fx: 'procedural' },
    unisonEvents: [
      { beat: 32.0, roles: ['drummer', 'guitarist', 'keyboardist', 'singer', 'producer'], bonusPoints: 600 },
    ],
    charts: buildSongCharts(16),
  },
];
