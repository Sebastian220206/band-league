import React from 'react';
import { BandRole, Difficulty, GameMode, ROLES, SongChart } from '@band-league/shared';
import { ALL_SONGS } from '../data/songs';
import {
  Play,
  Sliders,
  Music2,
  Trophy,
  Sparkles,
  Smartphone,
  Laptop,
  Swords,
  Gauge,
  Edit3,
  Globe,
  Radio,
} from 'lucide-react';

interface LobbyScreenProps {
  selectedRole: BandRole;
  onSelectRole: (role: BandRole) => void;
  selectedDifficulty: Difficulty;
  onSelectDifficulty: (diff: Difficulty) => void;
  selectedSong: SongChart;
  onSelectSong: (song: SongChart) => void;
  gameMode: GameMode;
  onSelectGameMode: (mode: GameMode) => void;
  onStartConcert: () => void;
  onOpenCalibration: () => void;
  onOpenLeague: () => void;
  onOpenChartEditor: () => void;
  isLoadingSong: boolean;
  midiConnected: boolean;
  midiDeviceName: string;
}

export const LobbyScreen: React.FC<LobbyScreenProps> = ({
  selectedRole,
  onSelectRole,
  selectedDifficulty,
  onSelectDifficulty,
  selectedSong,
  onSelectSong,
  gameMode,
  onSelectGameMode,
  onStartConcert,
  onOpenCalibration,
  onOpenLeague,
  onOpenChartEditor,
  isLoadingSong,
  midiConnected,
  midiDeviceName,
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
        padding: '20px 24px',
        overflowY: 'auto',
        background: 'radial-gradient(circle at 50% 12%, rgba(249, 115, 22, 0.15), rgba(8, 9, 13, 1) 65%)',
      }}
    >
      {/* Top Navbar */}
      <div
        style={{
          width: '100%',
          maxWidth: '1040px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={onOpenLeague}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#161925',
              border: '1px solid #282f42',
              padding: '8px 14px',
              borderRadius: '10px',
              color: '#f59e0b',
              fontSize: '13px',
              fontWeight: 800,
            }}
          >
            <Trophy size={16} />
            <span>Season 1 League & Venues</span>
          </button>

          <button
            onClick={onOpenChartEditor}
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
            <Edit3 size={15} />
            <span>Chart Studio</span>
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {midiConnected && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: 'rgba(34, 197, 94, 0.15)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#22c55e',
                fontWeight: 700,
              }}
            >
              <Radio size={14} /> MIDI: {midiDeviceName}
            </div>
          )}

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
            <span>Calibrate</span>
          </button>
        </div>
      </div>

      {/* Hero Header */}
      <div style={{ textAlign: 'center', margin: '14px 0 10px' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: 'rgba(249, 115, 22, 0.15)',
            border: '1px solid rgba(249, 115, 22, 0.3)',
            borderRadius: '20px',
            padding: '4px 14px',
            fontSize: '11px',
            fontWeight: 800,
            color: '#f97316',
            letterSpacing: '1px',
            textTransform: 'uppercase',
            marginBottom: '6px',
          }}
        >
          <Sparkles size={14} /> All 5 Band Roles Ready
        </div>
        <h1
          style={{
            fontSize: 'clamp(32px, 5.5vw, 56px)',
            fontWeight: 900,
            color: '#f8fafc',
            letterSpacing: '-1px',
            lineHeight: 1.05,
          }}
        >
          BAND <span style={{ color: '#f97316' }}>LEAGUE</span>
        </h1>
        <p style={{ fontSize: '14px', color: '#94a3b8', maxWidth: '520px', margin: '6px auto 0' }}>
          Form bands, sync on multi-track stems, and compete in virtual concerts and arena battles.
        </p>
      </div>

      {/* Mode Selector */}
      <div
        style={{
          width: '100%',
          maxWidth: '1040px',
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '4px',
        }}
      >
        {[
          { id: 'quickplay', name: 'Quick Concert', icon: <Play size={14} /> },
          { id: 'battle', name: 'Battle of the Bands', icon: <Swords size={14} /> },
          { id: 'online_coop', name: 'Online Room Co-Op', icon: <Globe size={14} /> },
          { id: 'practice', name: 'Practice Rehearsal', icon: <Gauge size={14} /> },
        ].map((m) => {
          const isSel = gameMode === m.id;
          return (
            <button
              key={m.id}
              onClick={() => onSelectGameMode(m.id as GameMode)}
              style={{
                flex: 1,
                minWidth: '150px',
                padding: '10px 12px',
                borderRadius: '10px',
                backgroundColor: isSel ? '#f97316' : '#141724',
                color: isSel ? '#08090d' : '#94a3b8',
                fontWeight: 800,
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                border: isSel ? 'none' : '1px solid #23293a',
              }}
            >
              {m.icon}
              <span>{m.name}</span>
            </button>
          );
        })}
      </div>

      {/* Main Selection Area */}
      <div
        style={{
          width: '100%',
          maxWidth: '1040px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          marginTop: '12px',
        }}
      >
        {/* Role Selector */}
        <div>
          <div style={{ fontSize: '12px', fontWeight: 800, color: '#64748b', marginBottom: '8px' }}>
            SELECT YOUR ROLE (ALL 5 PLAYABLE)
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '10px',
            }}
          >
            {roleList.map((rId) => {
              const r = ROLES[rId];
              const isSelected = selectedRole === rId;

              return (
                <div
                  key={rId}
                  onClick={() => onSelectRole(rId)}
                  style={{
                    backgroundColor: isSelected ? '#191c28' : '#10121a',
                    border: isSelected ? `2px solid ${r.color}` : '1px solid #1f2433',
                    boxShadow: isSelected ? `0 0 20px ${r.color}55` : 'none',
                    borderRadius: '14px',
                    padding: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span style={{ fontSize: '28px' }}>{r.icon}</span>
                  <span style={{ fontSize: '15px', fontWeight: 800, color: '#f8fafc', marginTop: '4px' }}>
                    {r.name}
                  </span>
                  <span style={{ fontSize: '11px', color: r.color, fontWeight: 700, marginTop: '2px' }}>
                    ⚡ {r.specialAbilityName}
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

        {/* Song and Difficulty Selection */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '14px',
          }}
        >
          {/* Song Selector */}
          <div
            style={{
              backgroundColor: '#12141c',
              border: '1px solid #242938',
              borderRadius: '16px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f97316', fontSize: '11px', fontWeight: 800 }}>
              <Music2 size={15} /> SELECT CONCERT TRACK
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {ALL_SONGS.map((song) => {
                const isSel = selectedSong.id === song.id;
                return (
                  <div
                    key={song.id}
                    onClick={() => onSelectSong(song)}
                    style={{
                      padding: '10px',
                      borderRadius: '10px',
                      backgroundColor: isSel ? 'rgba(249, 115, 22, 0.15)' : '#161925',
                      border: isSel ? '1px solid #f97316' : '1px solid #242938',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ fontSize: '13px', fontWeight: 800, color: isSel ? '#f97316' : '#f8fafc' }}>
                      {song.title}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>
                      {song.bpm} BPM • {song.genre}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Difficulty & Quick Controls */}
          <div
            style={{
              backgroundColor: '#12141c',
              border: '1px solid #242938',
              borderRadius: '16px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '12px',
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

            <div
              style={{
                backgroundColor: '#0a0b10',
                borderRadius: '10px',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '11px',
                color: '#94a3b8',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#f8fafc' }}>
                <Laptop size={14} /> <span>{ROLES[selectedRole].controlsHint.laptop}</span>
              </div>
              <span>|</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#f8fafc' }}>
                <Smartphone size={14} /> <span>{ROLES[selectedRole].controlsHint.mobile}</span>
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
            marginTop: '4px',
            opacity: isLoadingSong ? 0.7 : 1,
          }}
        >
          <Play size={22} fill="#08090d" />
          <span>
            {isLoadingSong
              ? 'Rendering Stems & Tuning Audio...'
              : gameMode === 'battle'
              ? 'ENTER ARENA & BATTLE'
              : gameMode === 'practice'
              ? 'START REHEARSAL'
              : 'ENTER STAGE & PERFORM'}
          </span>
        </button>
      </div>

      <div style={{ fontSize: '11px', color: '#475569', textAlign: 'center', marginTop: '14px' }}>
        Band League v1.0 • Web Audio Procedural Stems • Real-Time Colyseus Engine • Web MIDI & Pitch Analysis
      </div>
    </div>
  );
};
