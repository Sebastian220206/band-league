import React from 'react';
import { PlayerScoreState, SongChart } from '@band-league/shared';
import { Pause, Play, Sliders, Flame, Users } from 'lucide-react';

interface ConcertHUDProps {
  scoreState: PlayerScoreState;
  crowdHype: number;
  song: SongChart;
  currentSection: string;
  isPaused: boolean;
  onTogglePause: () => void;
  onOpenCalibration: () => void;
  songProgressPercent: number;
}

export const ConcertHUD: React.FC<ConcertHUDProps> = ({
  scoreState,
  crowdHype,
  song,
  currentSection,
  isPaused,
  onTogglePause,
  onOpenCalibration,
  songProgressPercent,
}) => {
  // Hype color
  const hypeColor =
    crowdHype > 60 ? '#10b981' : crowdHype > 25 ? '#f59e0b' : '#ef4444';

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        pointerEvents: 'none',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 40,
      }}
    >
      {/* Top Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 18px',
          background: 'linear-gradient(to bottom, rgba(8, 9, 13, 0.92), rgba(8, 9, 13, 0))',
        }}
      >
        {/* Left: Song Info & Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '16px', fontWeight: 800, color: '#f8fafc' }}>
              {song.title}
            </span>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: '#f97316',
                backgroundColor: 'rgba(249, 115, 22, 0.15)',
                border: '1px solid rgba(249, 115, 22, 0.3)',
                padding: '2px 8px',
                borderRadius: '6px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              {currentSection}
            </span>
          </div>
          <span style={{ fontSize: '12px', color: '#64748b' }}>{song.artist}</span>
        </div>

        {/* Center: Band Virtual Lineup */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'rgba(18, 20, 28, 0.8)',
            border: '1px solid #242938',
            borderRadius: '20px',
            padding: '4px 12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#94a3b8' }}>
            <Users size={14} color="#f97316" />
            <span style={{ fontWeight: 700, color: '#f8fafc' }}>BAND:</span>
          </div>
          <div style={{ display: 'flex', gap: '6px', fontSize: '13px' }}>
            <span title="Drummer (You)" style={{ filter: 'drop-shadow(0 0 4px #f97316)' }}>
              🥁
            </span>
            <span title="Guitarist (AI)" style={{ opacity: 0.85 }}>🎸</span>
            <span title="Keyboardist (AI)" style={{ opacity: 0.85 }}>🎹</span>
            <span title="Singer (AI)" style={{ opacity: 0.85 }}>🎤</span>
            <span title="Producer (AI)" style={{ opacity: 0.85 }}>🎛️</span>
          </div>
        </div>

        {/* Right: Controls & Stats */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', pointerEvents: 'auto' }}>
          <div style={{ textAlign: 'right' }}>
            <div
              style={{
                fontSize: '20px',
                fontWeight: 900,
                color: '#f8fafc',
                fontFamily: 'JetBrains Mono, monospace',
              }}
            >
              {scoreState.score.toLocaleString()}
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>
              Acc: <span style={{ color: '#10b981', fontWeight: 700 }}>{scoreState.accuracy}%</span>
            </div>
          </div>

          <button
            onClick={onOpenCalibration}
            title="Latency Calibration"
            style={{
              padding: '8px',
              borderRadius: '8px',
              backgroundColor: '#191c28',
              color: '#94a3b8',
              border: '1px solid #2a3045',
            }}
          >
            <Sliders size={18} />
          </button>

          <button
            onClick={onTogglePause}
            title={isPaused ? 'Resume' : 'Pause'}
            style={{
              padding: '8px',
              borderRadius: '8px',
              backgroundColor: '#191c28',
              color: '#f8fafc',
              border: '1px solid #2a3045',
            }}
          >
            {isPaused ? <Play size={18} /> : <Pause size={18} />}
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div
        style={{
          width: '100%',
          height: '3px',
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${Math.min(100, Math.max(0, songProgressPercent))}%`,
            backgroundColor: '#f97316',
            boxShadow: '0 0 8px #f97316',
            transition: 'width 0.1s linear',
          }}
        />
      </div>

      {/* Crowd Hype Meter */}
      <div
        style={{
          padding: '8px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 800, color: '#f8fafc' }}>
          <Flame size={14} color={hypeColor} />
          <span>HYPE</span>
        </div>

        <div
          style={{
            flex: 1,
            maxWidth: '220px',
            height: '10px',
            backgroundColor: '#161925',
            borderRadius: '6px',
            overflow: 'hidden',
            border: '1px solid #282f42',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${crowdHype}%`,
              backgroundColor: hypeColor,
              boxShadow: `0 0 10px ${hypeColor}`,
              transition: 'all 0.15s ease',
            }}
          />
        </div>

        <span
          style={{
            fontSize: '11px',
            fontWeight: 700,
            color: hypeColor,
            fontFamily: 'JetBrains Mono, monospace',
          }}
        >
          {Math.round(crowdHype)}%
        </span>
      </div>

      {/* Big Combo Counter Center Popup */}
      {scoreState.combo >= 4 && (
        <div
          style={{
            position: 'absolute',
            top: '120px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            pointerEvents: 'none',
          }}
        >
          <span
            style={{
              fontSize: '42px',
              fontWeight: 900,
              color: '#ffffff',
              fontFamily: 'Outfit, sans-serif',
              textShadow: '0 0 20px #f97316, 0 0 40px #f97316',
              lineHeight: 1,
            }}
          >
            {scoreState.combo}
          </span>
          <span
            style={{
              fontSize: '13px',
              fontWeight: 800,
              color: '#f97316',
              letterSpacing: '3px',
              textTransform: 'uppercase',
            }}
          >
            COMBO
          </span>
        </div>
      )}
    </div>
  );
};
