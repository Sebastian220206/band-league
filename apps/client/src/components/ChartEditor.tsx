import React, { useState } from 'react';
import { SongChart, BandRole, Difficulty, ChartNote, ROLES } from '@band-league/shared';
import { ALL_SONGS } from '../data/songs';
import { Play, Download, ArrowLeft, Music } from 'lucide-react';

interface ChartEditorProps {
  onClose: () => void;
  onPlayCustomChart: (song: SongChart, role: BandRole, diff: Difficulty) => void;
}

export const ChartEditor: React.FC<ChartEditorProps> = ({ onClose, onPlayCustomChart }) => {
  const [selectedSong, setSelectedSong] = useState<SongChart>(ALL_SONGS[0]);
  const [selectedRole, setSelectedRole] = useState<BandRole>('drummer');
  const [selectedDiff, setSelectedDiff] = useState<Difficulty>('medium');
  const [notes, setNotes] = useState<ChartNote[]>(() => {
    return selectedSong.charts[selectedRole]?.[selectedDiff]?.notes || [];
  });

  const handleRoleChange = (role: BandRole) => {
    setSelectedRole(role);
    setNotes(selectedSong.charts[role]?.[selectedDiff]?.notes || []);
  };

  const handleDiffChange = (diff: Difficulty) => {
    setSelectedDiff(diff);
    setNotes(selectedSong.charts[selectedRole]?.[diff]?.notes || []);
  };

  const handleAddNote = (beat: number, lane: number) => {
    const existingIndex = notes.findIndex((n) => Math.abs(n.beat - beat) < 0.25 && n.lane === lane);
    if (existingIndex >= 0) {
      // Toggle / Remove
      setNotes(notes.filter((_, idx) => idx !== existingIndex));
    } else {
      // Add
      const newNote: ChartNote = {
        id: `custom_${Date.now()}_${beat}`,
        beat,
        lane,
        type: 'tap',
      };
      setNotes([...notes, newNote].sort((a, b) => a.beat - b.beat));
    }
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(notes, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${selectedSong.id}_${selectedRole}_${selectedDiff}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleTestPlay = () => {
    const customSong: SongChart = {
      ...selectedSong,
      charts: {
        ...selectedSong.charts,
        [selectedRole]: {
          ...selectedSong.charts[selectedRole],
          [selectedDiff]: { notes },
        },
      },
    };
    onPlayCustomChart(customSong, selectedRole, selectedDiff);
  };

  const totalBeats = 64;
  const maxLanes = selectedRole === 'keyboardist' ? 7 : selectedRole === 'guitarist' ? 5 : 4;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#090a10',
        zIndex: 500,
        display: 'flex',
        flexDirection: 'column',
        color: '#f8fafc',
      }}
    >
      {/* Top Navbar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 20px',
          backgroundColor: '#12141c',
          borderBottom: '1px solid #242938',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button
            onClick={onClose}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: '#94a3b8',
              padding: '6px 12px',
              borderRadius: '8px',
              backgroundColor: '#191c28',
            }}
          >
            <ArrowLeft size={16} /> Exit
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Music size={18} color="#f97316" />
            <h2 style={{ fontSize: '18px', fontWeight: 800 }}>Chart & Beatmap Studio</h2>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={handleExportJson}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#1e2230',
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              color: '#94a3b8',
            }}
          >
            <Download size={14} /> Export JSON
          </button>
          <button
            onClick={handleTestPlay}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#f97316',
              padding: '8px 18px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 800,
              color: '#08090d',
            }}
          >
            <Play size={15} fill="#08090d" /> Test Play Chart
          </button>
        </div>
      </div>

      {/* Toolbar: Role, Diff, Song */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '16px',
          padding: '12px 20px',
          backgroundColor: '#0d0f16',
          borderBottom: '1px solid #1f2433',
        }}
      >
        {/* Song Select */}
        <select
          value={selectedSong.id}
          onChange={(e) => {
            const found = ALL_SONGS.find((s) => s.id === e.target.value) || ALL_SONGS[0];
            setSelectedSong(found);
            setNotes(found.charts[selectedRole]?.[selectedDiff]?.notes || []);
          }}
          style={{
            backgroundColor: '#191c28',
            color: '#f8fafc',
            border: '1px solid #282f42',
            padding: '8px 12px',
            borderRadius: '8px',
            fontWeight: 600,
          }}
        >
          {ALL_SONGS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title} ({s.bpm} BPM)
            </option>
          ))}
        </select>

        {/* Role Pills */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {(['drummer', 'guitarist', 'keyboardist', 'singer', 'producer'] as BandRole[]).map((r) => {
            const isSel = selectedRole === r;
            return (
              <button
                key={r}
                onClick={() => handleRoleChange(r)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  backgroundColor: isSel ? ROLES[r].color : '#161925',
                  color: isSel ? '#08090d' : '#94a3b8',
                  fontWeight: 700,
                  fontSize: '12px',
                }}
              >
                {ROLES[r].icon} {ROLES[r].name}
              </button>
            );
          })}
        </div>

        {/* Diff Pills */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
            <button
              key={d}
              onClick={() => handleDiffChange(d)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                backgroundColor: selectedDiff === d ? '#f8fafc' : '#161925',
                color: selectedDiff === d ? '#08090d' : '#94a3b8',
                fontWeight: 700,
                fontSize: '12px',
                textTransform: 'uppercase',
              }}
            >
              {d}
            </button>
          ))}
        </div>

        <div style={{ marginLeft: 'auto', fontSize: '13px', color: '#64748b' }}>
          Notes Placed: <span style={{ color: '#f8fafc', fontWeight: 700 }}>{notes.length}</span>
        </div>
      </div>

      {/* Interactive Timeline Matrix */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <p style={{ fontSize: '13px', color: '#94a3b8' }}>
          Click any grid cell to place or remove a note. Bars are highlighted every 4 beats.
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `80px repeat(${totalBeats}, 36px)`,
            gap: '2px',
            backgroundColor: '#12141c',
            padding: '12px',
            borderRadius: '12px',
            border: '1px solid #242938',
            overflowX: 'auto',
          }}
        >
          {/* Header Row: Beat Numbers */}
          <div style={{ fontWeight: 800, fontSize: '12px', color: '#64748b' }}>LANE</div>
          {Array.from({ length: totalBeats }).map((_, beat) => (
            <div
              key={beat}
              style={{
                textAlign: 'center',
                fontSize: '10px',
                fontWeight: 700,
                color: beat % 4 === 0 ? '#f97316' : '#475569',
                backgroundColor: beat % 4 === 0 ? 'rgba(249, 115, 22, 0.1)' : 'transparent',
                borderRadius: '2px',
              }}
            >
              {beat}
            </div>
          ))}

          {/* Lane Rows */}
          {Array.from({ length: maxLanes }).map((_, lane) => (
            <React.Fragment key={lane}>
              <div
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                Lane {lane + 1}
              </div>
              {Array.from({ length: totalBeats }).map((_, beat) => {
                const hasNote = notes.some((n) => Math.abs(n.beat - beat) < 0.25 && n.lane === lane);
                return (
                  <div
                    key={beat}
                    onClick={() => handleAddNote(beat, lane)}
                    style={{
                      height: '34px',
                      backgroundColor: hasNote
                        ? ROLES[selectedRole].color
                        : beat % 4 === 0
                        ? '#1a1d2b'
                        : '#141722',
                      border: '1px solid #222738',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: hasNote ? `0 0 10px ${ROLES[selectedRole].color}` : 'none',
                    }}
                  >
                    {hasNote && <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ffffff' }} />}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};
