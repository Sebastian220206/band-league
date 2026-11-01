import React from 'react';
import { BandRole } from '@band-league/shared';
import { Mic, MicOff, Zap, Sparkles, Sliders } from 'lucide-react';

interface RoleTouchControlsProps {
  role: BandRole;
  onLaneDown: (lane: number) => void;
  onLaneUp: (lane: number) => void;
  activeLanes: boolean[];
  onTriggerSpecialAbility?: () => void;
  onProducerFx?: (type: 'filter_sweep' | 'stutter' | 'delay' | 'drop') => void;
  isMicActive?: boolean;
  onToggleMic?: () => void;
  onSingerPitchChange?: (midiPitch: number) => void;
}

export const RoleTouchControls: React.FC<RoleTouchControlsProps> = ({
  role,
  onLaneDown,
  onLaneUp,
  activeLanes,
  onTriggerSpecialAbility,
  onProducerFx,
  isMicActive = false,
  onToggleMic,
  onSingerPitchChange,
}) => {
  // 1. Drummer Controls (4 Pads + Kick)
  if (role === 'drummer') {
    const drumPads = [
      { name: 'KICK', key: 'F / Space', icon: '🦶', color: '#f97316' },
      { name: 'SNARE', key: 'G', icon: '🥁', color: '#ef4444' },
      { name: 'HI-HAT', key: 'H', icon: '🥢', color: '#06b6d4' },
      { name: 'CRASH', key: 'J', icon: '💥', color: '#eab308' },
    ];
    return (
      <div style={containerStyle}>
        {drumPads.map((pad, idx) => {
          const isActive = activeLanes[idx];
          return (
            <div
              key={idx}
              onTouchStart={(e) => { e.preventDefault(); onLaneDown(idx); }}
              onTouchEnd={(e) => { e.preventDefault(); onLaneUp(idx); }}
              onMouseDown={() => onLaneDown(idx)}
              onMouseUp={() => onLaneUp(idx)}
              style={getPadStyle(isActive, pad.color)}
            >
              <span style={{ fontSize: '20px' }}>{pad.icon}</span>
              <span style={{ fontSize: '13px', fontWeight: 800, color: isActive ? '#fff' : pad.color }}>
                {pad.name}
              </span>
              <span style={{ fontSize: '10px', color: '#64748b', fontFamily: 'JetBrains Mono, monospace' }}>
                {pad.key}
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  // 2. Guitarist Controls (5 Frets + Solo Button)
  if (role === 'guitarist') {
    const frets = [
      { name: '1', key: 'D', color: '#22c55e' },
      { name: '2', key: 'F', color: '#ef4444' },
      { name: '3', key: 'J', color: '#eab308' },
      { name: '4', key: 'K', color: '#3b82f6' },
      { name: '5', key: 'L', color: '#f97316' },
    ];
    return (
      <div style={containerStyle}>
        {frets.map((fret, idx) => {
          const isActive = activeLanes[idx];
          return (
            <div
              key={idx}
              onTouchStart={(e) => { e.preventDefault(); onLaneDown(idx); }}
              onTouchEnd={(e) => { e.preventDefault(); onLaneUp(idx); }}
              onMouseDown={() => onLaneDown(idx)}
              onMouseUp={() => onLaneUp(idx)}
              style={getPadStyle(isActive, fret.color)}
            >
              <span style={{ fontSize: '18px', fontWeight: 900, color: isActive ? '#fff' : fret.color }}>
                FRET {fret.name}
              </span>
              <span style={{ fontSize: '11px', color: '#64748b', fontFamily: 'JetBrains Mono' }}>
                {fret.key}
              </span>
            </div>
          );
        })}
        <button
          onClick={onTriggerSpecialAbility}
          style={{
            padding: '10px 14px',
            borderRadius: '12px',
            backgroundColor: '#ef4444',
            color: '#fff',
            fontWeight: 800,
            fontSize: '11px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Zap size={18} />
          <span>SOLO</span>
        </button>
      </div>
    );
  }

  // 3. Keyboardist Controls (7 Piano Keys)
  if (role === 'keyboardist') {
    const keys = [
      { note: 'C', key: 'A', color: '#ec4899' },
      { note: 'D', key: 'S', color: '#3b82f6' },
      { note: 'E', key: 'D', color: '#06b6d4' },
      { note: 'F', key: 'F', color: '#10b981' },
      { note: 'G', key: 'G', color: '#eab308' },
      { note: 'A', key: 'H', color: '#f97316' },
      { note: 'B', key: 'J', color: '#a855f7' },
    ];
    return (
      <div style={containerStyle}>
        {keys.map((k, idx) => {
          const isActive = activeLanes[idx];
          return (
            <div
              key={idx}
              onTouchStart={(e) => { e.preventDefault(); onLaneDown(idx); }}
              onTouchEnd={(e) => { e.preventDefault(); onLaneUp(idx); }}
              onMouseDown={() => onLaneDown(idx)}
              onMouseUp={() => onLaneUp(idx)}
              style={getPadStyle(isActive, k.color)}
            >
              <span style={{ fontSize: '16px', fontWeight: 900, color: isActive ? '#fff' : k.color }}>
                {k.note}
              </span>
              <span style={{ fontSize: '10px', color: '#64748b', fontFamily: 'JetBrains Mono' }}>
                {k.key}
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  // 4. Singer Controls (Pitch Ribbon & Mic toggle)
  if (role === 'singer') {
    return (
      <div style={{ ...containerStyle, flexDirection: 'row', alignItems: 'center' }}>
        <button
          onClick={onToggleMic}
          style={{
            padding: '14px 18px',
            borderRadius: '12px',
            backgroundColor: isMicActive ? '#ec4899' : '#1e2230',
            color: '#ffffff',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          {isMicActive ? <Mic size={20} /> : <MicOff size={20} />}
          <span>{isMicActive ? 'MIC ON (Singing)' : 'ENABLE MIC'}</span>
        </button>

        <div
          onTouchMove={(e) => {
            const touch = e.touches[0];
            const rect = e.currentTarget.getBoundingClientRect();
            const relY = Math.max(0, Math.min(1, (touch.clientY - rect.top) / rect.height));
            const midi = 72 - relY * 14;
            onSingerPitchChange?.(midi);
          }}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const relY = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
            const midi = 72 - relY * 14;
            onSingerPitchChange?.(midi);
          }}
          style={{
            flex: 1,
            height: '80px',
            borderRadius: '12px',
            backgroundColor: '#191c28',
            border: '2px dashed #ec4899',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ec4899',
            fontWeight: 800,
            fontSize: '13px',
            cursor: 'ns-resize',
          }}
        >
          ↕ SLIDE FINGER / MOUSE VERTICALLY TO MATCH VOCAL PITCH
        </div>
      </div>
    );
  }

  // 5. Producer Controls (Mixer Faders & FX Pads)
  if (role === 'producer') {
    return (
      <div style={containerStyle}>
        <button
          onClick={() => onProducerFx?.('filter_sweep')}
          style={getFxBtnStyle('#10b981')}
        >
          <Sliders size={16} />
          <span>FILTER SWEEP</span>
        </button>

        <button
          onClick={() => onProducerFx?.('stutter')}
          style={getFxBtnStyle('#06b6d4')}
        >
          <Sparkles size={16} />
          <span>STUTTER FX</span>
        </button>

        <button
          onClick={() => onProducerFx?.('drop')}
          style={{
            ...getFxBtnStyle('#f97316'),
            flex: 1.5,
            backgroundColor: '#f97316',
            color: '#08090d',
            fontWeight: 900,
          }}
        >
          <Zap size={18} fill="#08090d" />
          <span>THE DROP (2.5×)</span>
        </button>
      </div>
    );
  }

  return null;
};

const containerStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  height: '110px',
  display: 'flex',
  gap: '6px',
  padding: '8px 12px',
  backgroundColor: 'rgba(8, 9, 13, 0.85)',
  backdropFilter: 'blur(8px)',
  borderTop: '1px solid rgba(255, 255, 255, 0.1)',
  zIndex: 50,
};

function getPadStyle(isActive: boolean, color: string): React.CSSProperties {
  return {
    flex: 1,
    borderRadius: '12px',
    backgroundColor: isActive ? `${color}44` : '#161925',
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
  };
}

function getFxBtnStyle(color: string): React.CSSProperties {
  return {
    flex: 1,
    borderRadius: '12px',
    backgroundColor: '#161925',
    border: `1px solid ${color}`,
    color: '#ffffff',
    fontSize: '12px',
    fontWeight: 800,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
    cursor: 'pointer',
  };
}
