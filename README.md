# Band League 🎸🥁🎹🎤🎛️

**Band League** is a competitive, cross-platform (mobile & laptop) web rhythm game where musicians form virtual bands, synchronize their musical timing, and compete in virtual concerts and seasonal league battles.

---

## 🎮 Phase 0 Prototype: What's Live

- **Cross-Platform Controls**:
  - **Laptop/Desktop**: `F`, `G`, `H`, `J` (Drum Pads 1–4) + `Space` (Kick alternate), or `D`, `F`, `J`, `K`.
  - **Mobile**: Responsive touch pads with multi-touch support for unison hits.
- **Web Audio Multi-Track Stems**:
  - Procedurally synthesized multi-track stems: **Drums**, **Bass**, **Lead Guitar**, and **Chords/Keys**.
  - **Mute / Distort on Miss**: Missing notes drops the drummer's stem into a low-pass filter; keeping combos restores full audio clarity.
  - Real-time synthesized SFX for Perfect, Great, Good, Miss, and Unison chords.
- **Sample-Accurate Timing Engine**:
  - Judgements: **Perfect** (±35ms), **Great** (±70ms), **Good** (±110ms), **Miss** (>110ms).
  - Accuracy tracking, dynamic combo multipliers (up to 4x).
  - Crowd Hype Meter (0–100%) that can boo the band off stage if too many misses accumulate.
- **Latency Calibration System**:
  - Interactive metronome tap test measuring hardware audio/touch latency offset in milliseconds.
  - Fine-tuning slider (-150ms to +150ms) saved to `localStorage`.
- **Note Highway Visuals**:
  - 60 FPS hardware-accelerated canvas renderer with beat lines, highway glow, target receptor shockwaves, note gems, and particle explosions.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Build Shared Package & Client
```bash
pnpm run build
```

### 3. Run Unit Tests
```bash
pnpm test
```

### 4. Start the Local Dev Server
```bash
pnpm run dev
```
Open [http://localhost:3000](http://localhost:3000) on your laptop, or use your local IP on your mobile phone on the same Wi-Fi.

---

## 📂 Project Architecture

```
band-league/
├── apps/
│   ├── client/                  # Vite + React + Canvas Web Audio Game Client
│   │   ├── src/
│   │   │   ├── audio/           # StemAudioEngine (Web Audio sample-accurate player & synth)
│   │   │   ├── engine/          # NoteHighwayRenderer (60fps canvas note highway)
│   │   │   ├── input/           # InputManager (multi-touch & low-latency keyboard)
│   │   │   ├── data/            # Song charts & Unison events
│   │   │   ├── components/      # Lobby, Concert HUD, Touch Pads, Calibration, Results
│   │   │   └── App.tsx          # Main orchestrator
│   └── chart-editor/            # (Phase 1)
├── packages/
│   └── shared/                  # Core game logic, timing windows, scoring formulas, types
└── package.json                 # pnpm workspace configuration
```
