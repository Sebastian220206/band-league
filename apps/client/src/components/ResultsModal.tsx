import React from 'react';
import { PlayerScoreState, SongChart } from '@band-league/shared';
import { Trophy, Star, RotateCcw, Home, Zap, Flame, Award } from 'lucide-react';

interface ResultsModalProps {
  scoreState: PlayerScoreState;
  finalBandScore: number;
  song: SongChart;
  crowdHype: number;
  isBooedOff: boolean;
  onPlayAgain: () => void;
  onHome: () => void;
}

export const ResultsModal: React.FC<ResultsModalProps> = ({
  scoreState,
  finalBandScore,
  song,
  crowdHype,
  isBooedOff,
  onPlayAgain,
  onHome,
}) => {
  // Determine Grade
  let grade = 'S';
  let gradeColor = '#f59e0b';
  let stars = 5;

  if (isBooedOff) {
    grade = 'F';
    gradeColor = '#ef4444';
    stars = 0;
  } else if (scoreState.accuracy >= 98 && scoreState.counts.miss === 0) {
    grade = 'SS';
    gradeColor = '#ec4899';
    stars = 5;
  } else if (scoreState.accuracy >= 94) {
    grade = 'S';
    gradeColor = '#f59e0b';
    stars = 5;
  } else if (scoreState.accuracy >= 85) {
    grade = 'A';
    gradeColor = '#10b981';
    stars = 4;
  } else if (scoreState.accuracy >= 75) {
    grade = 'B';
    gradeColor = '#3b82f6';
    stars = 3;
  } else {
    grade = 'C';
    gradeColor = '#94a3b8';
    stars = 2;
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 6, 10, 0.92)',
        backdropFilter: 'blur(10px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '560px',
          backgroundColor: '#12141c',
          borderRadius: '20px',
          border: '1px solid #242938',
          padding: '28px',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.8)',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          textAlign: 'center',
        }}
      >
        {/* Title */}
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#f8fafc', letterSpacing: '1px' }}>
            {isBooedOff ? 'BOOED OFF STAGE!' : 'CONCERT COMPLETE!'}
          </h2>
          <p style={{ fontSize: '14px', color: '#94a3b8', marginTop: '4px' }}>
            {song.title} — {song.artist}
          </p>
        </div>

        {/* Big Grade Badge & Stars */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#0d0f16',
            padding: '16px',
            borderRadius: '16px',
          }}
        >
          <div
            style={{
              fontSize: '56px',
              fontWeight: 900,
              color: gradeColor,
              textShadow: `0 0 24px ${gradeColor}88`,
              fontFamily: 'JetBrains Mono, monospace',
            }}
          >
            {grade}
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <Star
                key={i}
                size={22}
                fill={i <= stars ? '#f59e0b' : 'none'}
                color={i <= stars ? '#f59e0b' : '#334155'}
              />
            ))}
          </div>

          <div style={{ fontSize: '13px', color: '#64748b' }}>
            Crowd Hype: <span style={{ color: '#f8fafc', fontWeight: 700 }}>{Math.round(crowdHype)}%</span>
          </div>
        </div>

        {/* Score Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '12px',
          }}
        >
          <div
            style={{
              backgroundColor: '#191c28',
              borderRadius: '12px',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f97316' }}>
              <Trophy size={16} />
              <span style={{ fontSize: '12px', fontWeight: 600 }}>Band Score</span>
            </div>
            <span
              style={{
                fontSize: '22px',
                fontWeight: 900,
                color: '#f8fafc',
                marginTop: '4px',
                fontFamily: 'JetBrains Mono, monospace',
              }}
            >
              {finalBandScore.toLocaleString()}
            </span>
          </div>

          <div
            style={{
              backgroundColor: '#191c28',
              borderRadius: '12px',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981' }}>
              <Award size={16} />
              <span style={{ fontSize: '12px', fontWeight: 600 }}>Accuracy</span>
            </div>
            <span
              style={{
                fontSize: '22px',
                fontWeight: 900,
                color: '#f8fafc',
                marginTop: '4px',
                fontFamily: 'JetBrains Mono, monospace',
              }}
            >
              {scoreState.accuracy}%
            </span>
          </div>

          <div
            style={{
              backgroundColor: '#191c28',
              borderRadius: '12px',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ef4444' }}>
              <Flame size={16} />
              <span style={{ fontSize: '12px', fontWeight: 600 }}>Max Combo</span>
            </div>
            <span
              style={{
                fontSize: '22px',
                fontWeight: 900,
                color: '#f8fafc',
                marginTop: '4px',
                fontFamily: 'JetBrains Mono, monospace',
              }}
            >
              {scoreState.maxCombo}
            </span>
          </div>

          <div
            style={{
              backgroundColor: '#191c28',
              borderRadius: '12px',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#3b82f6' }}>
              <Zap size={16} />
              <span style={{ fontSize: '12px', fontWeight: 600 }}>Avg Timing Offset</span>
            </div>
            <span
              style={{
                fontSize: '22px',
                fontWeight: 900,
                color: '#f8fafc',
                marginTop: '4px',
                fontFamily: 'JetBrains Mono, monospace',
              }}
            >
              {scoreState.averageOffsetMs > 0 ? `+${scoreState.averageOffsetMs}` : scoreState.averageOffsetMs} ms
            </span>
          </div>
        </div>

        {/* Detailed Judgement Breakdown */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-around',
            backgroundColor: '#0d0f16',
            padding: '10px 14px',
            borderRadius: '10px',
            fontSize: '13px',
            fontFamily: 'JetBrains Mono, monospace',
          }}
        >
          <div>
            <span style={{ color: '#f59e0b' }}>Perfect: </span>
            <span style={{ fontWeight: 700 }}>{scoreState.counts.perfect}</span>
          </div>
          <div>
            <span style={{ color: '#10b981' }}>Great: </span>
            <span style={{ fontWeight: 700 }}>{scoreState.counts.great}</span>
          </div>
          <div>
            <span style={{ color: '#3b82f6' }}>Good: </span>
            <span style={{ fontWeight: 700 }}>{scoreState.counts.good}</span>
          </div>
          <div>
            <span style={{ color: '#ef4444' }}>Miss: </span>
            <span style={{ fontWeight: 700 }}>{scoreState.counts.miss}</span>
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '6px' }}>
          <button
            onClick={onHome}
            style={{
              flex: 1,
              padding: '14px',
              borderRadius: '10px',
              backgroundColor: '#1e2230',
              color: '#f8fafc',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            <Home size={18} /> Menu
          </button>
          <button
            onClick={onPlayAgain}
            style={{
              flex: 2,
              padding: '14px',
              borderRadius: '10px',
              backgroundColor: '#f97316',
              color: '#08090d',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            <RotateCcw size={18} /> Play Again
          </button>
        </div>
      </div>
    </div>
  );
};
