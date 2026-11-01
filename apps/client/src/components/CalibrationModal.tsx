import React, { useState, useEffect, useRef } from 'react';
import { StemAudioEngine } from '../audio/StemAudioEngine';
import { Sliders, CheckCircle2, RotateCcw, X } from 'lucide-react';

interface CalibrationModalProps {
  audio: StemAudioEngine;
  onClose: () => void;
}

export const CalibrationModal: React.FC<CalibrationModalProps> = ({ audio, onClose }) => {
  const [offsetMs, setOffsetMs] = useState<number>(() => audio.getCalibrationOffset());
  const [isTapping, setIsTapping] = useState<boolean>(false);
  const [tapsRecorded, setTapsRecorded] = useState<number>(0);
  const [lastJudgement, setLastJudgement] = useState<string>('Ready to calibrate');

  const recordedDeltas = useRef<number[]>([]);
  const beatTimerRef = useRef<number | null>(null);
  const nextBeatTimeCtx = useRef<number>(0);
  const beatIntervalSec = 0.5; // 120 BPM = 0.5s per beat
  const [visualFlash, setVisualFlash] = useState<boolean>(false);

  useEffect(() => {
    return () => {
      stopCalibrationMetronome();
    };
  }, []);

  const startCalibrationMetronome = async () => {
    await audio.init();
    setIsTapping(true);
    setTapsRecorded(0);
    recordedDeltas.current = [];
    setLastJudgement('Tap on the beat!');

    const ctx = audio.getContext();
    nextBeatTimeCtx.current = ctx.currentTime + 0.2;

    const scheduleBeats = () => {
      const now = ctx.currentTime;
      while (nextBeatTimeCtx.current < now + 0.15) {
        audio.playMetronomeBeep(true);

        // Schedule visual flash
        const delayMs = Math.max(0, (nextBeatTimeCtx.current - now) * 1000);
        setTimeout(() => {
          setVisualFlash(true);
          setTimeout(() => setVisualFlash(false), 80);
        }, delayMs);

        nextBeatTimeCtx.current += beatIntervalSec;
      }
      beatTimerRef.current = window.setTimeout(scheduleBeats, 50);
    };

    scheduleBeats();
  };

  const stopCalibrationMetronome = () => {
    if (beatTimerRef.current !== null) {
      clearTimeout(beatTimerRef.current);
      beatTimerRef.current = null;
    }
    setIsTapping(false);
  };

  const handleTap = () => {
    if (!isTapping) {
      startCalibrationMetronome();
      return;
    }

    try {
      const ctx = audio.getContext();
      const nowCtx = ctx.currentTime;

      // Find nearest beat time
      const targetBeat = nextBeatTimeCtx.current - beatIntervalSec;
      const prevBeat = targetBeat - beatIntervalSec;
      const nextBeat = nextBeatTimeCtx.current;

      const deltas = [nowCtx - prevBeat, nowCtx - targetBeat, nowCtx - nextBeat].map(
        (d) => d * 1000
      );
      // Pick smallest absolute delta
      deltas.sort((a, b) => Math.abs(a) - Math.abs(b));
      const nearestDelta = deltas[0];

      recordedDeltas.current.push(nearestDelta);
      const count = recordedDeltas.current.length;
      setTapsRecorded(count);

      setLastJudgement(
        nearestDelta > 0 ? `Late by +${Math.round(nearestDelta)}ms` : `Early by ${Math.round(nearestDelta)}ms`
      );

      // After 8 taps, compute result and stop
      if (count >= 8) {
        // Drop lowest and highest outliers
        const sorted = [...recordedDeltas.current].sort((a, b) => a - b);
        const trimmed = sorted.slice(1, sorted.length - 1);
        const avg = trimmed.reduce((sum, d) => sum + d, 0) / trimmed.length;
        const finalOffset = Math.round(avg);

        setOffsetMs(finalOffset);
        audio.setCalibrationOffset(finalOffset);
        stopCalibrationMetronome();
        setLastJudgement(`Calibrated! Offset set to ${finalOffset > 0 ? '+' : ''}${finalOffset}ms`);
      }
    } catch {
      // Audio context might need user gesture
    }
  };

  const handleManualSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    setOffsetMs(val);
    audio.setCalibrationOffset(val);
  };

  const handleReset = () => {
    setOffsetMs(0);
    audio.setCalibrationOffset(0);
    setLastJudgement('Reset to 0ms');
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 6, 10, 0.88)',
        backdropFilter: 'blur(8px)',
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
          maxWidth: '520px',
          backgroundColor: '#12141c',
          borderRadius: '16px',
          border: '1px solid #242938',
          padding: '24px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.7)',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sliders size={22} color="#f97316" />
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#f8fafc' }}>
              Latency Calibration
            </h2>
          </div>
          <button
            onClick={() => {
              stopCalibrationMetronome();
              onClose();
            }}
            style={{ color: '#94a3b8', padding: '6px' }}
          >
            <X size={20} />
          </button>
        </div>

        <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: 1.5 }}>
          Different phones, Bluetooth headphones, and monitors have slight audio/input delays.
          Tap on the metronome beats to sync your audio and controls.
        </p>

        {/* Visual Flash / Metronome Box */}
        <div
          onClick={handleTap}
          style={{
            height: '110px',
            borderRadius: '12px',
            backgroundColor: visualFlash ? '#f97316' : '#191c28',
            border: visualFlash ? '2px solid #ffffff' : '2px dashed #334155',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'background-color 0.05s ease',
            userSelect: 'none',
          }}
        >
          <span style={{ fontSize: '18px', fontWeight: 700, color: visualFlash ? '#000000' : '#f8fafc' }}>
            {isTapping ? `TAP HERE! (${tapsRecorded}/8)` : 'TAP TO START CALIBRATION'}
          </span>
          <span
            style={{
              fontSize: '13px',
              color: visualFlash ? '#111827' : '#94a3b8',
              marginTop: '4px',
              fontFamily: 'JetBrains Mono, monospace',
            }}
          >
            {lastJudgement}
          </span>
        </div>

        {/* Current Offset Display */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#0d0f16',
            padding: '12px 16px',
            borderRadius: '10px',
          }}
        >
          <span style={{ fontSize: '14px', color: '#94a3b8' }}>Calibration Offset:</span>
          <span
            style={{
              fontSize: '18px',
              fontWeight: 800,
              color: '#f97316',
              fontFamily: 'JetBrains Mono, monospace',
            }}
          >
            {offsetMs > 0 ? `+${offsetMs}` : offsetMs} ms
          </span>
        </div>

        {/* Manual Slider */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b' }}>
            <span>-150ms (Earlier)</span>
            <span>Manual Fine-Tuning</span>
            <span>+150ms (Later)</span>
          </div>
          <input
            type="range"
            min="-150"
            max="150"
            value={offsetMs}
            onChange={handleManualSlider}
            style={{ width: '100%', accentColor: '#f97316', cursor: 'pointer' }}
          />
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
          <button
            onClick={handleReset}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '8px',
              backgroundColor: '#1e2230',
              color: '#94a3b8',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <RotateCcw size={16} /> Reset
          </button>
          <button
            onClick={() => {
              stopCalibrationMetronome();
              onClose();
            }}
            style={{
              flex: 2,
              padding: '12px',
              borderRadius: '8px',
              backgroundColor: '#f97316',
              color: '#08090d',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <CheckCircle2 size={18} /> Save & Play
          </button>
        </div>
      </div>
    </div>
  );
};
