import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  BandRole,
  Difficulty,
  PlayerScoreState,
  ChartNote,
  createInitialScoreState,
  applyHitToScoreState,
  evaluateHit,
  updateCrowdHype,
  calculateFinalBandScore,
  DEFAULT_JUDGEMENT_WINDOWS,
} from '@band-league/shared';
import { StemAudioEngine } from './audio/StemAudioEngine';
import { InputManager } from './input/InputManager';
import { NoteHighwayRenderer } from './engine/NoteHighwayRenderer';
import { SAMPLE_SONG } from './data/sampleSong';
import { LobbyScreen } from './components/LobbyScreen';
import { ConcertHUD } from './components/ConcertHUD';
import { DrumTouchPads } from './components/DrumTouchPads';
import { CalibrationModal } from './components/CalibrationModal';
import { ResultsModal } from './components/ResultsModal';

export const App: React.FC = () => {
  const [gameState, setGameState] = useState<'lobby' | 'playing' | 'paused' | 'results'>('lobby');
  const [selectedRole, setSelectedRole] = useState<BandRole>('drummer');
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('medium');
  const [isCalibrating, setIsCalibrating] = useState<boolean>(false);
  const [isLoadingSong, setIsLoadingSong] = useState<boolean>(false);

  // Gameplay state
  const [scoreState, setScoreState] = useState<PlayerScoreState>(createInitialScoreState());
  const [crowdHype, setCrowdHype] = useState<number>(50.0);
  const [isBooedOff, setIsBooedOff] = useState<boolean>(false);
  const [currentSection, setCurrentSection] = useState<string>('Intro');
  const [songProgressPercent, setSongProgressPercent] = useState<number>(0);
  const [activeLanes, setActiveLanes] = useState<boolean[]>([false, false, false, false]);

  // Engines
  const audioRef = useRef<StemAudioEngine>(new StemAudioEngine());
  const inputRef = useRef<InputManager>(new InputManager());
  const rendererRef = useRef<NoteHighwayRenderer | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Refs for requestAnimationFrame loop
  const animFrameId = useRef<number | null>(null);
  const activeNotesRef = useRef<ChartNote[]>([]);
  const processedNotesRef = useRef<Set<string | number>>(new Set());
  const scoreStateRef = useRef<PlayerScoreState>(scoreState);
  const crowdHypeRef = useRef<number>(50.0);
  const isPlayingRef = useRef<boolean>(false);

  // Keep scoreStateRef in sync
  useEffect(() => {
    scoreStateRef.current = scoreState;
  }, [scoreState]);

  useEffect(() => {
    crowdHypeRef.current = crowdHype;
  }, [crowdHype]);

  // Handle Canvas resize
  const handleResize = useCallback(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  // Triggered when a drum lane / pad is pressed
  const handleLaneDown = useCallback((lane: number) => {
    if (!isPlayingRef.current) return;

    // Visual lane press indicator
    setActiveLanes((prev) => {
      const copy = [...prev];
      copy[lane] = true;
      return copy;
    });
    rendererRef.current?.setLaneActive(lane, true);

    const audio = audioRef.current;
    const currentSongTimeMs = audio.getCurrentSongTimeMs();
    const bpm = SAMPLE_SONG.bpm;
    const msPerBeat = (60 / bpm) * 1000;

    // Find nearest unjudged note in this lane within reasonable window
    const candidates = activeNotesRef.current.filter((note) => {
      if (note.lane !== lane) return false;
      if (processedNotesRef.current.has(note.id)) return false;
      const noteTimeMs = note.beat * msPerBeat;
      const diffMs = Math.abs(currentSongTimeMs - noteTimeMs);
      return diffMs <= DEFAULT_JUDGEMENT_WINDOWS.missLimit;
    });

    if (candidates.length === 0) {
      // Empty tap / misfire (could play ghost note or slight penalty)
      return;
    }

    // Pick closest note
    candidates.sort((a, b) => {
      const timeA = a.beat * msPerBeat;
      const timeB = b.beat * msPerBeat;
      return Math.abs(currentSongTimeMs - timeA) - Math.abs(currentSongTimeMs - timeB);
    });

    const targetNote = candidates[0];
    const targetTimeMs = targetNote.beat * msPerBeat;
    processedNotesRef.current.add(targetNote.id);

    const hitEval = evaluateHit(targetTimeMs, currentSongTimeMs);
    const isUnison = targetNote.type === 'unison' || !!targetNote.accent;

    // Apply scoring
    const { newState } = applyHitToScoreState(scoreStateRef.current, {
      judgement: hitEval.judgement,
      deltaMs: hitEval.deltaMs,
      isUnison,
    });
    setScoreState(newState);

    // Audio SFX & Stem Filtering
    if (hitEval.judgement === 'miss') {
      audio.playHitSfx('miss');
      audio.setStemPerformanceState('drums', false);
      rendererRef.current?.addJudgement('MISS', '#ef4444', 0);
    } else {
      if (isUnison) {
        audio.playHitSfx('unison');
      } else {
        audio.playHitSfx(hitEval.judgement);
      }
      audio.setStemPerformanceState('drums', true);
      rendererRef.current?.spawnHitExplosion(lane, isUnison);

      const colorMap = {
        perfect: '#f59e0b',
        great: '#10b981',
        good: '#3b82f6',
      };
      rendererRef.current?.addJudgement(
        isUnison ? 'UNISON HIT!' : hitEval.judgement.toUpperCase() + '!',
        isUnison ? '#e879f9' : colorMap[hitEval.judgement],
        newState.combo
      );
    }

    // Crowd Hype
    const nextHype = updateCrowdHype(crowdHypeRef.current, hitEval.judgement);
    setCrowdHype(nextHype);

    if (nextHype <= 0) {
      // Booed off stage!
      handleGameOver(true);
    }
  }, []);

  const handleLaneUp = useCallback((lane: number) => {
    setActiveLanes((prev) => {
      const copy = [...prev];
      copy[lane] = false;
      return copy;
    });
    rendererRef.current?.setLaneActive(lane, false);
  }, []);

  // Initialize Input Manager
  useEffect(() => {
    const input = inputRef.current;
    input.init(handleLaneDown, handleLaneUp);
    return () => input.destroy();
  }, [handleLaneDown, handleLaneUp]);

  // Main Game Loop (60 FPS)
  const gameLoop = useCallback(() => {
    if (!isPlayingRef.current) return;

    const audio = audioRef.current;
    const currentSongTimeMs = audio.getCurrentSongTimeMs();
    const durationMs = audio.getDurationSeconds() * 1000;
    const bpm = SAMPLE_SONG.bpm;
    const msPerBeat = (60 / bpm) * 1000;

    // Check for late misses
    const notes = activeNotesRef.current;
    for (let i = 0; i < notes.length; i++) {
      const note = notes[i];
      if (processedNotesRef.current.has(note.id)) continue;

      const noteTimeMs = note.beat * msPerBeat;
      // If note passed hit window without being pressed
      if (currentSongTimeMs > noteTimeMs + DEFAULT_JUDGEMENT_WINDOWS.good) {
        processedNotesRef.current.add(note.id);

        const { newState } = applyHitToScoreState(scoreStateRef.current, {
          judgement: 'miss',
          deltaMs: 140,
        });
        setScoreState(newState);

        audio.playHitSfx('miss');
        audio.setStemPerformanceState('drums', false);
        rendererRef.current?.addJudgement('MISS', '#ef4444', 0);

        const nextHype = updateCrowdHype(crowdHypeRef.current, 'miss');
        setCrowdHype(nextHype);

        if (nextHype <= 0) {
          handleGameOver(true);
          return;
        }
      }
    }

    // Update section name
    const currentBeat = (currentSongTimeMs / msPerBeat);
    const sec = SAMPLE_SONG.sections.find(
      (s) => currentBeat >= s.startBeat && currentBeat < s.endBeat
    );
    if (sec) {
      setCurrentSection(sec.name);
    }

    // Progress
    if (durationMs > 0) {
      setSongProgressPercent((currentSongTimeMs / durationMs) * 100);
    }

    // Check for song completion
    if (currentSongTimeMs >= durationMs && durationMs > 0) {
      handleGameOver(false);
      return;
    }

    // Render Canvas
    rendererRef.current?.render(currentSongTimeMs, notes, bpm, true);

    animFrameId.current = requestAnimationFrame(gameLoop);
  }, []);

  const handleGameOver = (booedOff: boolean) => {
    isPlayingRef.current = false;
    audioRef.current.stopSong();
    if (animFrameId.current !== null) {
      cancelAnimationFrame(animFrameId.current);
      animFrameId.current = null;
    }
    setIsBooedOff(booedOff);
    setGameState('results');
  };

  const startConcert = async () => {
    setIsLoadingSong(true);
    try {
      const audio = audioRef.current;
      await audio.loadProceduralSong(SAMPLE_SONG.bpm, 24);

      // Extract notes for selected role and difficulty
      const roleChart = SAMPLE_SONG.charts.drummer?.[selectedDifficulty];
      const notes = roleChart ? [...roleChart.notes] : [];
      activeNotesRef.current = notes;
      processedNotesRef.current.clear();

      // Reset score
      setScoreState(createInitialScoreState());
      setCrowdHype(50.0);
      setIsBooedOff(false);
      setGameState('playing');
      isPlayingRef.current = true;

      // Small delay to allow UI to mount canvas
      setTimeout(() => {
        handleResize();
        if (canvasRef.current) {
          rendererRef.current = new NoteHighwayRenderer(canvasRef.current);
        }
        audio.startSong(0);
        animFrameId.current = requestAnimationFrame(gameLoop);
      }, 50);
    } finally {
      setIsLoadingSong(false);
    }
  };

  const togglePause = () => {
    if (gameState === 'playing') {
      isPlayingRef.current = false;
      audioRef.current.pauseSong();
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
      setGameState('paused');
    } else if (gameState === 'paused') {
      audioRef.current.resumeSong();
      isPlayingRef.current = true;
      setGameState('playing');
      animFrameId.current = requestAnimationFrame(gameLoop);
    }
  };

  const finalBandScore = calculateFinalBandScore({
    averagePerformanceAccuracy: scoreState.accuracy,
    averageTimingScore: Math.max(0, 100 - Math.abs(scoreState.averageOffsetMs)),
    ensembleScore: isBooedOff ? 0 : 88, // Simulated high ensemble cohesion
  });

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: '#08090d',
      }}
    >
      {/* Lobby Screen */}
      {gameState === 'lobby' && (
        <LobbyScreen
          selectedRole={selectedRole}
          onSelectRole={setSelectedRole}
          selectedDifficulty={selectedDifficulty}
          onSelectDifficulty={setSelectedDifficulty}
          onStartConcert={startConcert}
          onOpenCalibration={() => setIsCalibrating(true)}
          isLoadingSong={isLoadingSong}
        />
      )}

      {/* Gameplay Canvas & HUD */}
      {(gameState === 'playing' || gameState === 'paused') && (
        <>
          <canvas
            ref={canvasRef}
            style={{
              width: '100%',
              height: '100%',
              display: 'block',
              backgroundColor: '#08090d',
            }}
          />

          <ConcertHUD
            scoreState={scoreState}
            crowdHype={crowdHype}
            song={SAMPLE_SONG}
            currentSection={currentSection}
            isPaused={gameState === 'paused'}
            onTogglePause={togglePause}
            onOpenCalibration={() => setIsCalibrating(true)}
            songProgressPercent={songProgressPercent}
          />

          {/* Mobile Landscape & Laptop Touch Pads */}
          <DrumTouchPads
            onPadDown={handleLaneDown}
            onPadUp={handleLaneUp}
            activeLanes={activeLanes}
          />

          {/* Pause Overlay */}
          {gameState === 'paused' && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: 'rgba(5, 6, 10, 0.85)',
                backdropFilter: 'blur(6px)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '16px',
                zIndex: 80,
              }}
            >
              <h2 style={{ fontSize: '32px', fontWeight: 900, color: '#f8fafc' }}>PAUSED</h2>
              <button
                onClick={togglePause}
                style={{
                  padding: '12px 32px',
                  borderRadius: '12px',
                  backgroundColor: '#f97316',
                  color: '#08090d',
                  fontSize: '16px',
                  fontWeight: 800,
                }}
              >
                Resume Performance
              </button>
              <button
                onClick={() => {
                  audioRef.current.stopSong();
                  isPlayingRef.current = false;
                  setGameState('lobby');
                }}
                style={{
                  padding: '10px 24px',
                  borderRadius: '10px',
                  backgroundColor: '#191c28',
                  color: '#94a3b8',
                  fontSize: '14px',
                  fontWeight: 600,
                }}
              >
                Exit to Lobby
              </button>
            </div>
          )}
        </>
      )}

      {/* Results Screen */}
      {gameState === 'results' && (
        <ResultsModal
          scoreState={scoreState}
          finalBandScore={finalBandScore}
          song={SAMPLE_SONG}
          crowdHype={crowdHype}
          isBooedOff={isBooedOff}
          onPlayAgain={startConcert}
          onHome={() => setGameState('lobby')}
        />
      )}

      {/* Calibration Modal */}
      {isCalibrating && (
        <CalibrationModal
          audio={audioRef.current}
          onClose={() => setIsCalibrating(false)}
        />
      )}
    </div>
  );
};
