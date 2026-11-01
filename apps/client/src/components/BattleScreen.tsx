import React from 'react';
import { Swords, Flame } from 'lucide-react';

interface BattleHUDProps {
  bandAScore: number;
  bandBScore: number;
  momentum: number; // -100 to +100
  bandAName?: string;
  bandBName?: string;
}

export const BattleHUD: React.FC<BattleHUDProps> = ({
  bandAScore,
  bandBScore,
  momentum,
  bandAName = 'The Neon Rebels',
  bandBName = 'Cyber Syndicate',
}) => {
  const leadDiff = bandAScore - bandBScore;
  const isLeading = leadDiff >= 0;

  return (
    <div
      style={{
        position: 'absolute',
        top: '65px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '90%',
        maxWidth: '680px',
        backgroundColor: 'rgba(18, 20, 28, 0.9)',
        border: '1px solid #2a3045',
        borderRadius: '16px',
        padding: '10px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        zIndex: 45,
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.7)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {/* Band A (You) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Flame size={16} color="#f97316" />
          <span style={{ fontSize: '14px', fontWeight: 900, color: '#f8fafc' }}>{bandAName}</span>
          <span style={{ fontSize: '16px', fontWeight: 900, color: '#f97316', fontFamily: 'JetBrains Mono' }}>
            {bandAScore.toLocaleString()}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 800, color: '#94a3b8' }}>
          <Swords size={14} color="#ef4444" />
          <span>VS</span>
        </div>

        {/* Band B (Rival) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '16px', fontWeight: 900, color: '#3b82f6', fontFamily: 'JetBrains Mono' }}>
            {bandBScore.toLocaleString()}
          </span>
          <span style={{ fontSize: '14px', fontWeight: 900, color: '#f8fafc' }}>{bandBName}</span>
          <Flame size={16} color="#3b82f6" />
        </div>
      </div>

      {/* Tug-of-war meter */}
      <div
        style={{
          width: '100%',
          height: '10px',
          backgroundColor: '#0a0b10',
          borderRadius: '5px',
          overflow: 'hidden',
          display: 'flex',
          border: '1px solid #242938',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${Math.min(100, Math.max(0, 50 + momentum / 2))}%`,
            backgroundColor: '#f97316',
            boxShadow: '0 0 10px #f97316',
            transition: 'width 0.2s ease',
          }}
        />
        <div
          style={{
            height: '100%',
            flex: 1,
            backgroundColor: '#3b82f6',
            boxShadow: '0 0 10px #3b82f6',
          }}
        />
      </div>

      <div style={{ textAlign: 'center', fontSize: '11px', fontWeight: 800 }}>
        {isLeading ? (
          <span style={{ color: '#10b981' }}>YOU LEAD BY +{leadDiff.toLocaleString()} PTS</span>
        ) : (
          <span style={{ color: '#ef4444' }}>RIVAL LEADS BY +{Math.abs(leadDiff).toLocaleString()} PTS</span>
        )}
      </div>
    </div>
  );
};
