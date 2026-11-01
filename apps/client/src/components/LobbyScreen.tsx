import React from 'react';
import { BandRole, Difficulty, ROLES } from '@band-league/shared';
import { SAMPLE_SONG } from '../data/sampleSong';
import { Play, Sliders, Music2, Trophy, Sparkles, Smartphone, Laptop } from 'lucide-react';

interface LobbyScreenProps {
  selectedRole: BandRole;
  onSelectRole: (role: BandRole) => void;
  selectedDifficulty: Difficulty;
  onSelectDifficulty: (diff: Difficulty) => void;
  onStartConcert: () => void;
  onOpenCalibration: () => void;
  isLoadingSong: boolean;
}

export const LobbyScreen: React.FC<LobbyScreenProps> = ({
  selectedRole,
  onSelectRole,
  selectedDifficulty,
  onSelectDifficulty,
  onStartConcert,
  onOpenCalibration,
  isLoadingSong,
}) => {
  const roleList: BandRole[] = ['drummer', 'guitarist', 'keyboardist', 'singer', 'producer'];
  const difficulties: Difficulty[] = ['easy', 'medium', 'hard'];

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '24px 20px',
        overflowY: 'auto',
        background: 'radial-gradient(circle at 50% 15%, rgba(249, 115, 22, 0.12), rgba(8, 9, 13, 1) 60%)',
      }}
    >
      {/* Top Bar */}
      <div
        style={{
          width: '100%',
          maxWidth: '960px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Trophy size={18} color="#f97316" />
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>
            Season 1: Garage League
          </span>
        </div>

        <button
          onClick={onOpenCalibration}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: '#161925',
            border: '1px solid #282f42',
            padding: '8px 14px',
            borderRadius: '10px',
            color: '#94a3b8',
            fontSize: '13px',
            fontWeight: 600,
          }}
        >
          <Sliders size={16} />
          <span>Calibrate Timing</span>
        </button>
      </div>

      {/* Hero Title */}
      <div style={{ textAlign: 'center', margin: '20px 0 16px' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: 'rgba(249, 115, 22, 0.15)',
            border: '1px solid rgba(249, 115, 22, 0.3)',
            borderRadius: '20px',
            padding: '4px 14px',
            fontSize: '12px',
            fontWeight: 800,
            color: '#f97316',
            letterSpacing: '1px',
            textTransform: 'uppercase',
            marginBottom: '8px',
          }}
        >
          <Sparkles size={14} /> Competitive Band Rhythm Battles
        </div>
        <h1
          style={{
            fontSize: 'clamp(36px, 6vw, 64px)',
            fontWeight: 900,
            color: '#f8fafc',
            letterSpacing: '-1px',
            lineHeight: 1.05,
          }}
        >
          BAND <span style={{ color: '#f97316' }}>LEAGUE</span>
        </h1>
        <p style={{ fontSize: '15px', color: '#94a3b8', maxWidth: '520px', margin: '8px auto 0' }}>
          Form bands, sync in virtual concerts, and climb the seasonal leaderboards together.
        </p>
      </div>

      {/* Main Selection Area */}
      <div
        style={{
          width: '100%',
          maxWidth: '960px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}
      >
        {/* Role Selector */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '13px', fontWeight: 800, color: '#64748b', letterSpacing: '0.5px' }}>
              CHOOSE YOUR BAND ROLE
            </span>
            <span style={{ fontSize: '12px', color: '#f97316', fontWeight: 600 }}>
              Phase 0: Drummer Fully Playable
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: '12px',
            }}
          >
            {roleList.map((rId) => {
              const r = ROLES[rId];
              const isSelected = selectedRole === rId;
              const isDrummer = rId === 'drummer';

              return (
                <div
                  key={rId}
                  onClick={() => {
                    if (isDrummer) onSelectRole(rId);
                  }}
                  style={{
                    backgroundColor: isSelected ? '#191c28' : '#10121a',
                    border: isSelected ? `2px solid ${r.color}` : '1px solid #1f2433',
                    boxShadow: isSelected ? `0 0 20px ${r.color}55` : 'none',
                    borderRadius: '14px',
                    padding: '14px',
                    cursor: isDrummer ? 'pointer' : 'default',
                    opacity: isDrummer ? 1 : 0.65,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    position: 'relative',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {!isDrummer && (
                    <span
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        fontSize: '9px',
                        fontWeight: 800,
                        backgroundColor: '#282f42',
                        color: '#94a3b8',
                        padding: '2px 6px',
                        borderRadius: '4px',
                      }}
                    >
                      PHASE 1
                    </span>
                  )}
                  <span style={{ fontSize: '32px' }}>{r.icon}</span>
                  <span
                    style={{
                      fontSize: '15px',
                      fontWeight: 800,
                      color: isSelected ? '#ffffff' : '#f8fafc',
                      marginTop: '6px',
                    }}
                  >
                    {r.name}
                  </span>
                  <span
                    style={{
                      fontSize: '11px',
                      color: '#94a3b8',
                      marginTop: '4px',
                      lineHeight: 1.3,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {r.description}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Song & Difficulty Panel */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '16px',
          }}
        >
          {/* Song Card */}
          <div
            style={{
              backgroundColor: '#12141c',
              border: '1px solid #242938',
              borderRadius: '16px',
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f97316', marginBottom: '8px' }}>
              <Music2 size={16} />
              <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.5px' }}>
                FEATURED CONCERT TRACK
              </span>
            </div>

            <div>
              <div style={{ fontSize: '20px', fontWeight: 900, color: '#f8fafc' }}>
                {SAMPLE_SONG.title}
              </div>
              <div style={{ fontSize: '14px', color: '#94a3b8' }}>{SAMPLE_SONG.artist}</div>
            </div>

            <div
              style={{
                display: 'flex',
                gap: '12px',
                marginTop: '14px',
                fontSize: '12px',
                color: '#64748b',
                fontFamily: 'JetBrains Mono, monospace',
              }}
            >
              <span>{SAMPLE_SONG.bpm} BPM</span>
              <span>•</span>
              <span>{SAMPLE_SONG.genre}</span>
              <span>•</span>
              <span>4 Stems</span>
            </div>
          </div>

          {/* Difficulty Selection & Controls Guide */}
          <div
            style={{
              backgroundColor: '#12141c',
              border: '1px solid #242938',
              borderRadius: '16px',
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '14px',
            }}
          >
            <div>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', marginBottom: '8px' }}>
                DIFFICULTY
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {difficulties.map((diff) => {
                  const isSel = selectedDifficulty === diff;
                  return (
                    <button
                      key={diff}
                      onClick={() => onSelectDifficulty(diff)}
                      style={{
                        flex: 1,
                        padding: '10px 0',
                        borderRadius: '10px',
                        backgroundColor: isSel ? '#f97316' : '#191c28',
                        color: isSel ? '#08090d' : '#94a3b8',
                        fontWeight: 800,
                        fontSize: '13px',
                        textTransform: 'uppercase',
                        border: isSel ? 'none' : '1px solid #2a3045',
                      }}
                    >
                      {diff}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Controls Reminder */}
            <div
              style={{
                backgroundColor: '#0a0b10',
                borderRadius: '10px',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                fontSize: '12px',
                color: '#94a3b8',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#f8fafc' }}>
                <Laptop size={14} /> <span>F, G, H, J + Space</span>
              </div>
              <span>|</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#f8fafc' }}>
                <Smartphone size={14} /> <span>4 Touch Pads</span>
              </div>
            </div>
          </div>
        </div>

        {/* Start Button */}
        <button
          onClick={onStartConcert}
          disabled={isLoadingSong}
          style={{
            width: '100%',
            padding: '18px',
            borderRadius: '16px',
            backgroundColor: '#f97316',
            color: '#08090d',
            fontSize: '18px',
            fontWeight: 900,
            letterSpacing: '1px',
            textTransform: 'uppercase',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            boxShadow: '0 0 30px rgba(249, 115, 22, 0.4)',
            marginTop: '8px',
            opacity: isLoadingSong ? 0.7 : 1,
          }}
        >
          <Play size={22} fill="#08090d" />
          <span>{isLoadingSong ? 'Synthesizing Concert Stems...' : 'ENTER STAGE & PERFORM'}</span>
        </button>
      </div>

      {/* Footer Info */}
      <div style={{ fontSize: '12px', color: '#475569', textAlign: 'center', marginTop: '16px' }}>
        Band League v0.1 Prototype • Web Audio Multi-Track Stems • Playable on Mobile & Laptop
      </div>
    </div>
  );
};
