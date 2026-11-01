import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  BandRole,
  Difficulty,
  GameMode,
  PlayerScoreState,
  ChartNote,
  SongChart,
  createInitialScoreState,
  applyHitToScoreState,
  evaluateHit,
  updateCrowdHype,
  calculateFinalBandScore,
  simulateAiNoteHit,
  DEFAULT_JUDGEMENT_WINDOWS,
} from '@band-league/shared';
import { StemAudioEngine } from './audio/StemAudioEngine';
import { InputManager } from './input/InputManager';
import { MidiManager } from './input/MidiManager';
import { PitchDetector } from './audio/PitchDetector';
import { NetworkManager } from './net/NetworkManager';
import { NoteHighwayRenderer } from './engine/NoteHighwayRenderer';
import { ALL_SONGS } from './data/songs';
import { LobbyScreen } from './components/LobbyScreen';
import { ConcertHUD } from './components/ConcertHUD';
import { RoleTouchControls } from './components/RoleTouchControls';
import { BattleHUD } from './components/BattleScreen';
import { PracticeHUD } from './components/PracticeHUD';
import { LeagueView } from './components/LeagueView';
import { ChartEditor } from './components/ChartEditor';
import { CalibrationModal } from './components/CalibrationModal';
import { ResultsModal } from './components/ResultsModal';

export const App: React.FC = () => {
  const [gameState, setGameState] = useState<'lobby' | 'playing' | 'paused' | 'results'>('lobby');
  const [gameMode, setGameMode] = useState<GameMode>('quickplay');
  const [selectedRole, setSelectedRole] = useState<BandRole>('drummer');
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('medium');
  const [selectedSong, setSelectedSong] = useState<SongChart>(ALL_SONGS[0]);

  // Views & Modals
  const [isCalibrating, setIsCalibrating] = useState<boolean>(false);
  const [isLeagueOpen, setIsLeagueOpen] = useState<boolean>(false);
  const [isChartEditorOpen, setIsChartEditorOpen] = useState<boolean>(false);
  const [isLoadingSong, setIsLoadingSong] = useState<boolean>(false);

  // Gameplay State
  const [scoreState, setScoreState] = useState<PlayerScoreState>(createInitialScoreState());
  const [crowdHype, setCrowdHype] = useState<number>(50.0);
  const [isBooedOff, setIsBooedOff] = useState<boolean>(false);
  const [currentSection, setCurrentSection] = useState<string>('Intro');
  const [songProgressPercent, setSongProgressPercent] = useState<number>(0);
  const [activeLanes, setActiveLanes] = useState<boolean[]>([false, false, false, false, false, false, false]);

  // Battle Mode State
  const [battleScoreB, setBattleScoreB] = useState<number>(0);
  const [battleMomentum, setBattleMomentum] = useState<number>(0);

  // Practice Mode State
  const [practiceTempo, setPracticeTempo] = useState<number>(1.0);
  const [isPracticeLooping, setIsPracticeLooping] = useState<boolean>(false);

  // Hardware Audio & Input Managers
  const audioRef = useRef<StemAudioEngine>(new StemAudioEngine());
  const inputRef = useRef<InputManager>(new InputManager());
  const midiRef = useRef<MidiManager>(new MidiManager());
  const pitchRef = useRef<PitchDetector>(new PitchDetector());
  const networkRef = useRef<NetworkManager>(new NetworkManager());
  const rendererRef = useRef<NoteHighwayRenderer | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // MIDI status
  const [midiConnected, setMidiConnected] = useState<boolean>(false);
  const [midiDeviceName, setMidiDeviceName] = useState<string>('');
  const [isMicActive, setIsMicActive] = useState<boolean>(false);

  // Loop refs
  const animFrameId = useRef<number | null>(null);
  const activeNotesRef = useRef<ChartNote[]>([]);
  const processedNotesRef = useRef<Set<string | number>>(new Set());
  const scoreStateRef = useRef<PlayerScoreState>(scoreState);
  const crowdHypeRef = useRef<number>(50.0);
  const isPlayingRef = useRef<boolean>(false);
  const roleRef = useRef<BandRole>(selectedRole);
  const lastAiCheckBeat = useRef<number>(-1);

  useEffect(() => {
    scoreStateRef.current = scoreState;
  }, [scoreState]);

  useEffect(() => {
    crowdHypeRef.current = crowdHype;
  }, [crowdHype]);

  useEffect(() => {
    roleRef.current = selectedRole;
    rendererRef.current?.setRole(selectedRole);
  }, [selectedRole]);

  // Canvas Resize Handler
  const handleResize = useCallback(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.scale(dpr, dpr);
  }, []);

  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  // Init Web MIDI
  useEffect(() => {
    midiRef.current.init(
      (lane) => handleLaneDown(lane),
      (lane) => handleLaneUp(lane)
    ).then((connected) => {
      if (connected) {
        const status = midiRef.current.getStatus();
        setMidiConnected(true);
        setMidiDeviceName(status.deviceName);
      }
    });
    return () => midiRef.current.destroy();
  }, []);

  // Lane Hit Detection
  const handleLaneDown = useCallback((lane: number) => {
    if (!isPlayingRef.current) return;

    setActiveLanes((prev) => {
      const copy = [...prev];
      copy[lane] = true;
      return copy;
    });
    rendererRef.current?.setLaneActive(lane, true);

    const audio = audioRef.current;
    const currentSongTimeMs = audio.getCurrentSongTimeMs();
    const bpm = selectedSong.bpm;
    const msPerBeat = (60 / bpm) * 1000;

    const candidates = activeNotesRef.current.filter((note) => {
      if (note.lane !== lane && selectedRole !== 'singer') return false;
      if (processedNotesRef.current.has(note.id)) return false;
      const noteTimeMs = note.beat * msPerBeat;
      return Math.abs(currentSongTimeMs - noteTimeMs) <= DEFAULT_JUDGEMENT_WINDOWS.missLimit;
    });

    if (candidates.length === 0) return;

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

    const { newState, pointsEarned } = applyHitToScoreState(scoreStateRef.current, {
      judgement: hitEval.judgement,
      deltaMs: hitEval.deltaMs,
      isUnison,
    });
    setScoreState(newState);

    // Relay to Colyseus server
    networkRef.current.sendHit(targetNote.id, hitEval.judgement, hitEval.deltaMs, isUnison);

    if (gameMode === 'battle') {
      networkRef.current.sendBattleScore('A', pointsEarned);
    }

    if (hitEval.judgement === 'miss') {
      audio.playHitSfx('miss');
      audio.setStemPerformanceState(selectedRole === 'drummer' ? 'drums' : 'guitar', false);
      rendererRef.current?.addJudgement('MISS', '#ef4444', 0);
    } else {
      if (isUnison) audio.playHitSfx('unison');
      else audio.playHitSfx(hitEval.judgement);

      audio.setStemPerformanceState(selectedRole === 'drummer' ? 'drums' : 'guitar', true);
      rendererRef.current?.spawnHitExplosion(lane, isUnison);

      const colorMap = { perfect: '#f59e0b', great: '#10b981', good: '#3b82f6' };
      rendererRef.current?.addJudgement(
        isUnison ? 'UNISON HIT!' : hitEval.judgement.toUpperCase() + '!',
        isUnison ? '#e879f9' : colorMap[hitEval.judgement],
        newState.combo
      );
    }

    const nextHype = updateCrowdHype(crowdHypeRef.current, hitEval.judgement);
    setCrowdHype(nextHype);
    if (nextHype <= 0) handleGameOver(true);
  }, [selectedSong, selectedRole, gameMode]);

  const handleLaneUp = useCallback((lane: number) => {
    setActiveLanes((prev) => {
      const copy = [...prev];
      copy[lane] = false;
      return copy;
    });
    rendererRef.current?.setLaneActive(lane, false);
  }, []);

  // Keyboard mappings for all 5 roles
  useEffect(() => {
    const input = inputRef.current;
    input.init(handleLaneDown, handleLaneUp);
    return () => input.destroy();
  }, [handleLaneDown, handleLaneUp]);

  // Main 60 FPS Game Loop
  const gameLoop = useCallback(() => {
    if (!isPlayingRef.current) return;

    const audio = audioRef.current;
    const currentSongTimeMs = audio.getCurrentSongTimeMs();
    const durationMs = audio.getDurationSeconds() * 1000;
    const bpm = selectedSong.bpm;
    const msPerBeat = (60 / bpm) * 1000;
    const currentBeat = currentSongTimeMs / msPerBeat;

    // Singer real-time microphone pitch detection
    if (roleRef.current === 'singer' && pitchRef.current.getIsListening()) {
      const { pitchMidi } = pitchRef.current.detectMidiPitch();
      if (pitchMidi > 0) {
        rendererRef.current?.setSingerPitchCursor(pitchMidi);
      }
    }

    // Check for late misses
    const notes = activeNotesRef.current;
    for (let i = 0; i < notes.length; i++) {
      const note = notes[i];
      if (processedNotesRef.current.has(note.id)) continue;
      const noteTimeMs = note.beat * msPerBeat;

      if (currentSongTimeMs > noteTimeMs + DEFAULT_JUDGEMENT_WINDOWS.good) {
        processedNotesRef.current.add(note.id);

        const { newState } = applyHitToScoreState(scoreStateRef.current, {
          judgement: 'miss',
          deltaMs: 140,
        });
        setScoreState(newState);

        audio.playHitSfx('miss');
        audio.setStemPerformanceState(roleRef.current === 'drummer' ? 'drums' : 'guitar', false);
        rendererRef.current?.addJudgement('MISS', '#ef4444', 0);

        const nextHype = updateCrowdHype(crowdHypeRef.current, 'miss');
        setCrowdHype(nextHype);
        if (nextHype <= 0) {
          handleGameOver(true);
          return;
        }
      }
    }

    // AI Bandmates Simulation & Battle Rival Score Progression
    const intBeat = Math.floor(currentBeat);
    if (intBeat !== lastAiCheckBeat.current && intBeat % 2 === 0) {
      lastAiCheckBeat.current = intBeat;
      if (gameMode === 'battle') {
        const rivalHit = simulateAiNoteHit('medium');
        const rivalPoints = rivalHit.judgement === 'perfect' ? 120 : rivalHit.judgement === 'great' ? 85 : 0;
        setBattleScoreB((prev) => {
          const next = prev + rivalPoints;
          const diff = scoreStateRef.current.score - next;
          setBattleMomentum(Math.max(-100, Math.min(100, Math.round(diff / 400))));
          return next;
        });
      }
    }

    // Section marker
    const sec = selectedSong.sections.find((s) => currentBeat >= s.startBeat && currentBeat < s.endBeat);
    if (sec) setCurrentSection(sec.name);

    if (durationMs > 0) {
      setSongProgressPercent((currentSongTimeMs / durationMs) * 100);
    }

    if (currentSongTimeMs >= durationMs && durationMs > 0) {
      if (isPracticeLooping) {
        audio.startSong(0);
        processedNotesRef.current.clear();
      } else {
        handleGameOver(false);
        return;
      }
    }

    rendererRef.current?.render(currentSongTimeMs, notes, bpm, true);
    animFrameId.current = requestAnimationFrame(gameLoop);
  }, [selectedSong, isPracticeLooping, gameMode]);

  const handleGameOver = (booedOff: boolean) => {
    isPlayingRef.current = false;
    audioRef.current.stopSong();
    pitchRef.current.stop();
    setIsMicActive(false);

    if (animFrameId.current !== null) {
      cancelAnimationFrame(animFrameId.current);
      animFrameId.current = null;
    }
    setIsBooedOff(booedOff);
    setGameState('results');
  };

  const startConcert = async (customSong?: SongChart, roleOverride?: BandRole, diffOverride?: Difficulty) => {
    setIsLoadingSong(true);
    const song = customSong || selectedSong;
    const role = roleOverride || selectedRole;
    const diff = diffOverride || selectedDifficulty;

    try {
      const audio = audioRef.current;
      audio.setPlaybackRate(practiceTempo);
      await audio.loadProceduralSong(song.id, song.bpm, 24);

      const roleChart = song.charts[role]?.[diff];
      const notes = roleChart ? [...roleChart.notes] : [];
      activeNotesRef.current = notes;
      processedNotesRef.current.clear();

      setScoreState(createInitialScoreState());
      setCrowdHype(50.0);
      setBattleScoreB(0);
      setBattleMomentum(0);
      setIsBooedOff(false);
      setGameState('playing');
      isPlayingRef.current = true;

      // Connect to Colyseus server if online co-op
      if (gameMode === 'online_coop') {
        await networkRef.current.connectConcertRoom('concert_room', { role, songId: song.id });
      } else if (gameMode === 'battle') {
        await networkRef.current.connectBattleRoom({ songId: song.id });
      }

      setTimeout(() => {
        handleResize();
        if (canvasRef.current) {
          rendererRef.current = new NoteHighwayRenderer(canvasRef.current, role);
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

  const handleToggleMic = async () => {
    if (isMicActive) {
      pitchRef.current.stop();
      setIsMicActive(false);
    } else {
      const ok = await pitchRef.current.start();
      setIsMicActive(ok);
    }
  };

  const finalBandScore = calculateFinalBandScore({
    averagePerformanceAccuracy: scoreState.accuracy,
    averageTimingScore: Math.max(0, 100 - Math.abs(scoreState.averageOffsetMs)),
    ensembleScore: isBooedOff ? 0 : 92,
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
      {/* 1. Main Lobby Screen */}
      {gameState === 'lobby' && (
        <LobbyScreen
          selectedRole={selectedRole}
          onSelectRole={setSelectedRole}
          selectedDifficulty={selectedDifficulty}
          onSelectDifficulty={setSelectedDifficulty}
          selectedSong={selectedSong}
          onSelectSong={setSelectedSong}
          gameMode={gameMode}
          onSelectGameMode={setGameMode}
          onStartConcert={() => startConcert()}
          onOpenCalibration={() => setIsCalibrating(true)}
          onOpenLeague={() => setIsLeagueOpen(true)}
          onOpenChartEditor={() => setIsChartEditorOpen(true)}
          isLoadingSong={isLoadingSong}
          midiConnected={midiConnected}
          midiDeviceName={midiDeviceName}
        />
      )}

      {/* 2. Gameplay Stage Canvas & HUD */}
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
            song={selectedSong}
            currentSection={currentSection}
            isPaused={gameState === 'paused'}
            onTogglePause={togglePause}
            onOpenCalibration={() => setIsCalibrating(true)}
            songProgressPercent={songProgressPercent}
          />

          {/* Mode specific overlays */}
          {gameMode === 'battle' && (
            <BattleHUD
              bandAScore={scoreState.score}
              bandBScore={battleScoreB}
              momentum={battleMomentum}
            />
          )}

          {gameMode === 'practice' && (
            <PracticeHUD
              tempoRate={practiceTempo}
              onTempoChange={(rate) => {
                setPracticeTempo(rate);
                audioRef.current.setPlaybackRate(rate);
              }}
              isLooping={isPracticeLooping}
              onToggleLoop={() => setIsPracticeLooping(!isPracticeLooping)}
            />
          )}

          {/* Dynamic Role Controls (All 5 Roles) */}
          <RoleTouchControls
            role={selectedRole}
            onLaneDown={handleLaneDown}
            onLaneUp={handleLaneUp}
            activeLanes={activeLanes}
            onTriggerSpecialAbility={() => {
              audioRef.current.triggerProducerFx('drop');
              rendererRef.current?.spawnHitExplosion(2, true);
            }}
            onProducerFx={(type) => audioRef.current.triggerProducerFx(type)}
            isMicActive={isMicActive}
            onToggleMic={handleToggleMic}
            onSingerPitchChange={(midi) => rendererRef.current?.setSingerPitchCursor(midi)}
          />

          {/* Pause Menu */}
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

      {/* 3. Results Screen */}
      {gameState === 'results' && (
        <ResultsModal
          scoreState={scoreState}
          finalBandScore={finalBandScore}
          song={selectedSong}
          crowdHype={crowdHype}
          isBooedOff={isBooedOff}
          onPlayAgain={() => startConcert()}
          onHome={() => setGameState('lobby')}
        />
      )}

      {/* 4. League & Venues View */}
      {isLeagueOpen && (
        <LeagueView
          onClose={() => setIsLeagueOpen(false)}
          onStartVenueConcert={() => {
            setIsLeagueOpen(false);
            startConcert();
          }}
          onStartBattle={() => {
            setIsLeagueOpen(false);
            setGameMode('battle');
            startConcert();
          }}
        />
      )}

      {/* 5. Chart Studio */}
      {isChartEditorOpen && (
        <ChartEditor
          onClose={() => setIsChartEditorOpen(false)}
          onPlayCustomChart={(song, role, diff) => {
            setIsChartEditorOpen(false);
            setSelectedSong(song);
            setSelectedRole(role);
            setSelectedDifficulty(diff);
            startConcert(song, role, diff);
          }}
        />
      )}

      {/* 6. Latency Calibration Modal */}
      {isCalibrating && (
        <CalibrationModal
          audio={audioRef.current}
          onClose={() => setIsCalibrating(false)}
        />
      )}
    </div>
  );
};
