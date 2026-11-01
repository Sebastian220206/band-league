import React from 'react';
import { Gauge, RotateCcw } from 'lucide-react';

interface PracticeHUDProps {
  tempoRate: number;
  onTempoChange: (rate: number) => void;
  isLooping: boolean;
  onToggleLoop: () => void;
}

export const PracticeHUD: React.FC<PracticeHUDProps> = ({
  tempoRate,
  onTempoChange,
  isLooping,
  onToggleLoop,
}) => {
  return (
    <div
      style={{
        position: 'absolute',
        top: '65px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: 'rgba(18, 20, 28, 0.9)',
        border: '1px solid #2a3045',
        borderRadius: '14px',
        padding: '8px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        zIndex: 45,
        fontSize: '12px',
        color: '#f8fafc',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Gauge size={16} color="#f97316" />
        <span style={{ fontWeight: 800 }}>PRACTICE TEMPO:</span>
        <span style={{ fontFamily: 'JetBrains Mono', color: '#f97316', fontWeight: 700 }}>
          {Math.round(tempoRate * 100)}%
        </span>
      </div>

      <input
        type="range"
        min="0.5"
        max="1.5"
        step="0.05"
        value={tempoRate}
        onChange={(e) => onTempoChange(parseFloat(e.target.value))}
        style={{ width: '120px', accentColor: '#f97316' }}
      />

      <button
        onClick={onToggleLoop}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          padding: '4px 10px',
          borderRadius: '6px',
          backgroundColor: isLooping ? '#f97316' : '#191c28',
          color: isLooping ? '#08090d' : '#94a3b8',
          fontWeight: 700,
          border: '1px solid #282f42',
        }}
      >
        <RotateCcw size={12} />
        <span>{isLooping ? 'LOOP ON' : 'LOOP SECTION'}</span>
      </button>
    </div>
  );
};
