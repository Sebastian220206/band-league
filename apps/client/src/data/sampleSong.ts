import { SongChart } from '@band-league/shared';

export const SAMPLE_SONG: SongChart = {
  id: 'neon-horizon',
  title: 'Neon Horizon',
  artist: 'The Cyber Punks',
  genre: 'Synthwave / Arena Rock',
  bpm: 124,
  offsetMs: 0,
  durationSeconds: 46.5, // 24 bars at 124 BPM ≈ 46.45 seconds
  sections: [
    { name: 'Intro', startBeat: 0, endBeat: 16 },
    { name: 'Verse 1', startBeat: 16, endBeat: 32 },
    { name: 'Chorus', startBeat: 32, endBeat: 64 },
    { name: 'Solo', startBeat: 64, endBeat: 80 },
    { name: 'Final Chorus', startBeat: 80, endBeat: 96 },
  ],
  stems: {
    drums: 'procedural',
    guitar: 'procedural',
    keys: 'procedural',
    bass_fx: 'procedural',
  },
  unisonEvents: [
    { beat: 32.0, roles: ['drummer', 'guitarist'], bonusPoints: 500 },
    { beat: 48.0, roles: ['drummer', 'keyboardist'], bonusPoints: 500 },
    { beat: 80.0, roles: ['drummer', 'guitarist', 'singer'], bonusPoints: 1000 },
    { beat: 92.0, roles: ['drummer', 'guitarist', 'keyboardist', 'singer', 'producer'], bonusPoints: 2000 },
  ],
  charts: {
    drummer: {
      easy: {
        notes: [
          // Intro: simple kick & snare
          { id: 'd_e_0', beat: 0, lane: 0, type: 'tap' },
          { id: 'd_e_1', beat: 2, lane: 1, type: 'tap' },
          { id: 'd_e_2', beat: 4, lane: 0, type: 'tap' },
          { id: 'd_e_3', beat: 6, lane: 1, type: 'tap' },
          { id: 'd_e_4', beat: 8, lane: 0, type: 'tap' },
          { id: 'd_e_5', beat: 10, lane: 1, type: 'tap' },
          { id: 'd_e_6', beat: 12, lane: 0, type: 'tap' },
          { id: 'd_e_7', beat: 14, lane: 1, type: 'tap' },

          // Verse: kick, snare, hi-hat
          { id: 'd_e_8', beat: 16, lane: 0, type: 'tap' },
          { id: 'd_e_9', beat: 17, lane: 2, type: 'tap' },
          { id: 'd_e_10', beat: 18, lane: 1, type: 'tap' },
          { id: 'd_e_11', beat: 19, lane: 2, type: 'tap' },
          { id: 'd_e_12', beat: 20, lane: 0, type: 'tap' },
          { id: 'd_e_13', beat: 21, lane: 2, type: 'tap' },
          { id: 'd_e_14', beat: 22, lane: 1, type: 'tap' },
          { id: 'd_e_15', beat: 23, lane: 2, type: 'tap' },

          // Chorus entrance unison
          { id: 'd_e_16', beat: 32, lane: 3, accent: true, type: 'unison' },
          { id: 'd_e_17', beat: 33, lane: 2, type: 'tap' },
          { id: 'd_e_18', beat: 34, lane: 1, type: 'tap' },
          { id: 'd_e_19', beat: 36, lane: 0, type: 'tap' },
          { id: 'd_e_20', beat: 38, lane: 1, type: 'tap' },
          { id: 'd_e_21', beat: 40, lane: 0, type: 'tap' },
          { id: 'd_e_22', beat: 42, lane: 1, type: 'tap' },
          { id: 'd_e_23', beat: 48, lane: 3, accent: true, type: 'unison' },

          // Final Chorus
          { id: 'd_e_24', beat: 80, lane: 3, accent: true, type: 'unison' },
          { id: 'd_e_25', beat: 82, lane: 1, type: 'tap' },
          { id: 'd_e_26', beat: 84, lane: 0, type: 'tap' },
          { id: 'd_e_27', beat: 86, lane: 1, type: 'tap' },
          { id: 'd_e_28', beat: 92, lane: 3, accent: true, type: 'unison' },
        ],
      },
      medium: {
        notes: [
          // Intro groove: Kick (0), Snare (1), Hi-Hat (2), Crash (3)
          { id: 'd_m_0', beat: 0, lane: 3, type: 'tap' },
          { id: 'd_m_1', beat: 1, lane: 2, type: 'tap' },
          { id: 'd_m_2', beat: 2, lane: 1, type: 'tap' },
          { id: 'd_m_3', beat: 3, lane: 2, type: 'tap' },
          { id: 'd_m_4', beat: 4, lane: 0, type: 'tap' },
          { id: 'd_m_5', beat: 5, lane: 2, type: 'tap' },
          { id: 'd_m_6', beat: 6, lane: 1, type: 'tap' },
          { id: 'd_m_7', beat: 7, lane: 2, type: 'tap' },

          { id: 'd_m_8', beat: 8, lane: 0, type: 'tap' },
          { id: 'd_m_9', beat: 9, lane: 2, type: 'tap' },
          { id: 'd_m_10', beat: 10, lane: 1, type: 'tap' },
          { id: 'd_m_11', beat: 11, lane: 2, type: 'tap' },
          { id: 'd_m_12', beat: 12, lane: 0, type: 'tap' },
          { id: 'd_m_13', beat: 13, lane: 2, type: 'tap' },
          { id: 'd_m_14', beat: 14, lane: 1, type: 'tap' },
          { id: 'd_m_15', beat: 15, lane: 2, type: 'tap' },

          // Fill into verse
          { id: 'd_m_16', beat: 15.5, lane: 1, type: 'tap' },

          // Verse 1 (beats 16-31)
          { id: 'd_m_17', beat: 16, lane: 0, type: 'tap' },
          { id: 'd_m_18', beat: 16.5, lane: 2, type: 'tap' },
          { id: 'd_m_19', beat: 17, lane: 2, type: 'tap' },
          { id: 'd_m_20', beat: 18, lane: 1, type: 'tap' },
          { id: 'd_m_21', beat: 19, lane: 2, type: 'tap' },
          { id: 'd_m_22', beat: 20, lane: 0, type: 'tap' },
          { id: 'd_m_23', beat: 21, lane: 2, type: 'tap' },
          { id: 'd_m_24', beat: 22, lane: 1, type: 'tap' },
          { id: 'd_m_25', beat: 23, lane: 2, type: 'tap' },

          { id: 'd_m_26', beat: 24, lane: 0, type: 'tap' },
          { id: 'd_m_27', beat: 25, lane: 2, type: 'tap' },
          { id: 'd_m_28', beat: 26, lane: 1, type: 'tap' },
          { id: 'd_m_29', beat: 27, lane: 2, type: 'tap' },
          { id: 'd_m_30', beat: 28, lane: 0, type: 'tap' },
          { id: 'd_m_31', beat: 29, lane: 1, type: 'tap' },
          { id: 'd_m_32', beat: 30, lane: 2, type: 'tap' },
          { id: 'd_m_33', beat: 31, lane: 1, type: 'tap' },
          { id: 'd_m_34', beat: 31.5, lane: 2, type: 'tap' },

          // CHORUS UNISON DROP (beat 32)
          { id: 'd_m_35', beat: 32, lane: 3, accent: true, type: 'unison' },
          { id: 'd_m_36', beat: 32, lane: 0, accent: true, type: 'unison' },
          { id: 'd_m_37', beat: 33, lane: 2, type: 'tap' },
          { id: 'd_m_38', beat: 34, lane: 1, type: 'tap' },
          { id: 'd_m_39', beat: 35, lane: 2, type: 'tap' },
          { id: 'd_m_40', beat: 36, lane: 0, type: 'tap' },
          { id: 'd_m_41', beat: 37, lane: 2, type: 'tap' },
          { id: 'd_m_42', beat: 38, lane: 1, type: 'tap' },
          { id: 'd_m_43', beat: 39, lane: 2, type: 'tap' },

          { id: 'd_m_44', beat: 40, lane: 0, type: 'tap' },
          { id: 'd_m_45', beat: 41, lane: 2, type: 'tap' },
          { id: 'd_m_46', beat: 42, lane: 1, type: 'tap' },
          { id: 'd_m_47', beat: 43, lane: 2, type: 'tap' },
          { id: 'd_m_48', beat: 44, lane: 0, type: 'tap' },
          { id: 'd_m_49', beat: 45, lane: 2, type: 'tap' },
          { id: 'd_m_50', beat: 46, lane: 1, type: 'tap' },
          { id: 'd_m_51', beat: 47, lane: 2, type: 'tap' },

          // Chorus mid-unison (beat 48)
          { id: 'd_m_52', beat: 48, lane: 3, accent: true, type: 'unison' },
          { id: 'd_m_53', beat: 49, lane: 2, type: 'tap' },
          { id: 'd_m_54', beat: 50, lane: 1, type: 'tap' },
          { id: 'd_m_55', beat: 51, lane: 2, type: 'tap' },
          { id: 'd_m_56', beat: 52, lane: 0, type: 'tap' },
          { id: 'd_m_57', beat: 53, lane: 2, type: 'tap' },
          { id: 'd_m_58', beat: 54, lane: 1, type: 'tap' },
          { id: 'd_m_59', beat: 55, lane: 2, type: 'tap' },

          // Solo section (beats 64-80)
          { id: 'd_m_60', beat: 64, lane: 0, type: 'tap' },
          { id: 'd_m_61', beat: 65, lane: 2, type: 'tap' },
          { id: 'd_m_62', beat: 66, lane: 1, type: 'tap' },
          { id: 'd_m_63', beat: 67, lane: 2, type: 'tap' },
          { id: 'd_m_64', beat: 68, lane: 0, type: 'tap' },
          { id: 'd_m_65', beat: 69, lane: 2, type: 'tap' },
          { id: 'd_m_66', beat: 70, lane: 1, type: 'tap' },
          { id: 'd_m_67', beat: 71, lane: 2, type: 'tap' },

          // Tom roll buildup
          { id: 'd_m_68', beat: 76, lane: 1, type: 'tap' },
          { id: 'd_m_69', beat: 77, lane: 2, type: 'tap' },
          { id: 'd_m_70', beat: 78, lane: 3, type: 'tap' },
          { id: 'd_m_71', beat: 79, lane: 1, type: 'tap' },
          { id: 'd_m_72', beat: 79.5, lane: 1, type: 'tap' },

          // Final Chorus Unison (beat 80)
          { id: 'd_m_73', beat: 80, lane: 3, accent: true, type: 'unison' },
          { id: 'd_m_74', beat: 80, lane: 0, accent: true, type: 'unison' },
          { id: 'd_m_75', beat: 81, lane: 2, type: 'tap' },
          { id: 'd_m_76', beat: 82, lane: 1, type: 'tap' },
          { id: 'd_m_77', beat: 83, lane: 2, type: 'tap' },
          { id: 'd_m_78', beat: 84, lane: 0, type: 'tap' },
          { id: 'd_m_79', beat: 85, lane: 2, type: 'tap' },
          { id: 'd_m_80', beat: 86, lane: 1, type: 'tap' },
          { id: 'd_m_81', beat: 87, lane: 2, type: 'tap' },

          // Grand Finale unison (beat 92)
          { id: 'd_m_82', beat: 92, lane: 3, accent: true, type: 'unison' },
          { id: 'd_m_83', beat: 92, lane: 0, accent: true, type: 'unison' },
          { id: 'd_m_84', beat: 94, lane: 3, type: 'tap' },
        ],
      },
      hard: {
        notes: [
          // Rapid hi-hats and syncopated kick/snare pattern
          { id: 'd_h_0', beat: 0, lane: 3, accent: true, type: 'unison' },
          { id: 'd_h_1', beat: 0, lane: 0, type: 'tap' },
          { id: 'd_h_2', beat: 0.5, lane: 2, type: 'tap' },
          { id: 'd_h_3', beat: 1.0, lane: 2, type: 'tap' },
          { id: 'd_h_4', beat: 1.5, lane: 2, type: 'tap' },
          { id: 'd_h_5', beat: 2.0, lane: 1, type: 'tap' },
          { id: 'd_h_6', beat: 2.5, lane: 2, type: 'tap' },
          { id: 'd_h_7', beat: 2.75, lane: 0, type: 'tap' },
          { id: 'd_h_8', beat: 3.0, lane: 2, type: 'tap' },
          { id: 'd_h_9', beat: 3.5, lane: 2, type: 'tap' },

          { id: 'd_h_10', beat: 4.0, lane: 0, type: 'tap' },
          { id: 'd_h_11', beat: 4.5, lane: 2, type: 'tap' },
          { id: 'd_h_12', beat: 5.0, lane: 2, type: 'tap' },
          { id: 'd_h_13', beat: 5.5, lane: 2, type: 'tap' },
          { id: 'd_h_14', beat: 6.0, lane: 1, type: 'tap' },
          { id: 'd_h_15', beat: 6.5, lane: 2, type: 'tap' },
          { id: 'd_h_16', beat: 7.0, lane: 2, type: 'tap' },
          { id: 'd_h_17', beat: 7.5, lane: 1, type: 'tap' },

          // Verse syncopated groove
          { id: 'd_h_18', beat: 16.0, lane: 0, type: 'tap' },
          { id: 'd_h_19', beat: 16.5, lane: 2, type: 'tap' },
          { id: 'd_h_20', beat: 17.0, lane: 2, type: 'tap' },
          { id: 'd_h_21', beat: 17.5, lane: 0, type: 'tap' },
          { id: 'd_h_22', beat: 18.0, lane: 1, type: 'tap' },
          { id: 'd_h_23', beat: 18.5, lane: 2, type: 'tap' },
          { id: 'd_h_24', beat: 19.0, lane: 2, type: 'tap' },
          { id: 'd_h_25', beat: 19.5, lane: 2, type: 'tap' },

          // Big Unison beat 32
          { id: 'd_h_26', beat: 32.0, lane: 3, accent: true, type: 'unison' },
          { id: 'd_h_27', beat: 32.0, lane: 0, accent: true, type: 'unison' },
          { id: 'd_h_28', beat: 32.5, lane: 2, type: 'tap' },
          { id: 'd_h_29', beat: 33.0, lane: 2, type: 'tap' },
          { id: 'd_h_30', beat: 34.0, lane: 1, type: 'tap' },
          { id: 'd_h_31', beat: 34.5, lane: 0, type: 'tap' },
          { id: 'd_h_32', beat: 35.0, lane: 2, type: 'tap' },

          // Chorus mid-unison beat 48
          { id: 'd_h_33', beat: 48.0, lane: 3, accent: true, type: 'unison' },
          { id: 'd_h_34', beat: 48.0, lane: 1, accent: true, type: 'unison' },

          // Triple drop fill into final chorus
          { id: 'd_h_35', beat: 78.0, lane: 1, type: 'tap' },
          { id: 'd_h_36', beat: 78.5, lane: 2, type: 'tap' },
          { id: 'd_h_37', beat: 79.0, lane: 1, type: 'tap' },
          { id: 'd_h_38', beat: 79.25, lane: 2, type: 'tap' },
          { id: 'd_h_39', beat: 79.5, lane: 3, type: 'tap' },
          { id: 'd_h_40', beat: 79.75, lane: 1, type: 'tap' },

          // Final Chorus beat 80
          { id: 'd_h_41', beat: 80.0, lane: 3, accent: true, type: 'unison' },
          { id: 'd_h_42', beat: 80.0, lane: 0, accent: true, type: 'unison' },
          { id: 'd_h_43', beat: 92.0, lane: 3, accent: true, type: 'unison' },
          { id: 'd_h_44', beat: 92.0, lane: 0, accent: true, type: 'unison' },
        ],
      },
    },
  },
};
