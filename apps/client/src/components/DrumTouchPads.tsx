import React from 'react';
import { DRUM_THEME } from '../engine/NoteHighwayRenderer';

interface DrumTouchPadsProps {
  onPadDown: (lane: number) => void;
  onPadUp: (lane: number) => void;
  activeLanes: boolean[];
}

export const DrumTouchPads: React.FC<DrumTouchPadsProps> = ({
  onPadDown,
  onPadUp,
  activeLanes,
}) => {
  const padLabels = [
    { name: 'KICK', key: 'F / Space', icon: '🦶' },
    { name: 'SNARE', key: 'G', icon: '🥁' },
    { name: 'HI-HAT', key: 'H', icon: '🥢' },
    { name: 'CRASH', key: 'J', icon: '💥' },
  ];

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '110px',
        display: 'flex',
        gap: '6px',
        padding: '8px 12px',
        backgroundColor: 'rgba(8, 9, 13, 0.75)',
        backdropFilter: 'blur(8px)',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        zIndex: 50,
      }}
    >
      {padLabels.map((pad, idx) => {
        const isActive = activeLanes[idx];
        const color = DRUM_THEME.laneColors[idx];

        return (
          <div
            key={idx}
            onTouchStart={(e) => {
              e.preventDefault();
              onPadDown(idx);
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              onPadUp(idx);
            }}
            onMouseDown={() => onPadDown(idx)}
            onMouseUp={() => onPadUp(idx)}
            onMouseLeave={() => {
              if (isActive) onPadUp(idx);
            }}
            style={{
              flex: 1,
              borderRadius: '12px',
              backgroundColor: isActive ? `${color}33` : '#161925',
              border: isActive ? `2px solid ${color}` : '1px solid #2a3045',
              boxShadow: isActive ? `0 0 20px ${color}88, inset 0 0 15px ${color}44` : 'none',
              transform: isActive ? 'scale(0.97)' : 'scale(1)',
              transition: 'all 0.05s ease',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              userSelect: 'none',
              touchAction: 'none',
            }}
          >
            <span style={{ fontSize: '20px' }}>{pad.icon}</span>
            <span
              style={{
                fontSize: '13px',
                fontWeight: 800,
                color: isActive ? '#ffffff' : color,
                letterSpacing: '0.5px',
                marginTop: '2px',
              }}
            >
              {pad.name}
            </span>
            <span
              style={{
                fontSize: '10px',
                color: '#64748b',
                fontFamily: 'JetBrains Mono, monospace',
                marginTop: '2px',
              }}
            >
              {pad.key}
            </span>
          </div>
        );
      })}
    </div>
  );
};
