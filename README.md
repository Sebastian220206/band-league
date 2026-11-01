# Band League 🎸🥁🎹🎤🎛️

**Band League** is a competitive, cross-platform (mobile & laptop) web rhythm game where musicians form virtual bands, synchronize musical timing, and compete in virtual concerts, venue tours, and arena battles.

---

## 🚀 All Phases Completed

### 1. Core Musical Roles (All 5 Implemented)
- 🥁 **Drummer**: 4 pads + kick (`F, G, H, J` + `Space` / touch pads). Tempo anchor with groove lock ability.
- 🎸 **Guitarist**: 5-lane highway (`D, F, J, K, L` / 5 touch lanes), hold sustains, and **Solo Overdrive** (2× points + pyrotechnics).
- 🎹 **Keyboardist**: 7-key keyboard (`A, S, D, F, G, H, J` / piano strip) with **Web MIDI API** support for hardware USB keyboards.
- 🎤 **Singer**: Smooth vocal pitch highway. Supports both touch/mouse pitch tracing AND **real microphone input** with auto-correlation pitch detection!
- 🎛️ **Producer**: Interactive DJ mixer with 4 stem faders, live audio FX triggers (*Filter Sweep*, *16th-Note Stutter*, *Delay*), and **THE DROP** (2.5× band-wide multiplier).

### 2. Multi-Genre Audio Stem Engine
- **Procedurally Synthesized Tracks** (Zero external downloads required, 100% sample-accurate Web Audio rendering):
  1. **"Neon Horizon"** (124 BPM, Synthwave / Arena Rock)
  2. **"Midnight Funk Groove"** (116 BPM, Disco / Funk)
  3. **"Cybernetic Drop"** (128 BPM, EDM / Electro House)
  4. **"Sunset in Shibuya"** (85 BPM, Chill Lo-Fi Hip Hop)
- **Dynamic Mute on Miss**: When any role misses, their respective instrument stem drops into a muffled low-pass filter; sustaining combos restores clarity.

### 3. Game Modes
- 🎸 **Quick Concert**: Form a band with AI bandmates who simulate realistic human jitter and combo streaks.
- ⚔️ **Battle of the Bands**: Head-to-head clash on the same song with a live **Tug-of-War Momentum Meter** and ELO rating exchanges.
- 🏆 **Band League & Venues Tour**: Progress from *The Rehearsal Garage* to *The Neon Basement Club*, *Starlight Arena*, and *Solaris World Festival*. Weekly promotion/relegation divisions (*Garage*, *Club*, *Arena*, *Festival*, *Headliner*).
- 🎧 **Practice Rehearsal**: 50% to 150% tempo speed slider + section looping for mastering difficult fills.
- 🎼 **Chart Studio**: In-browser beatmap editor with interactive timeline matrix, beat grid, test play, and JSON export/import.
- 🌐 **Online Co-Op**: Colyseus WebSocket server with NTP clock synchronization and live hit relay.

---

## 🎮 Controls Quick Reference

| Role | Laptop / Desktop Keys | Mobile Touchscreen | Hardware / Special |
|---|---|---|---|
| 🥁 **Drummer** | `F, G, H, J` + `Space` (Kick) | 4 Touch Pads (Kick, Snare, Hat, Crash) | Electronic Drum Kits via MIDI |
| 🎸 **Guitarist** | `D, F, J, K, L` | 5 Fret Touch Lanes | Solo Overdrive Button |
| 🎹 **Keyboardist** | `A, S, D, F, G, H, J` | Piano Strip | USB MIDI Keyboard |
| 🎤 **Singer** | Vertical Mouse / Cursor | Vertical Pitch Ribbon | Real Microphone (Auto-pitch) |
| 🎛️ **Producer** | Mouse Faders + FX buttons | Faders & FX Touch Pads | Live Audio Filters & Drop |

---

## 🛠️ Quick Start

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Run Tests & Build
```bash
pnpm test
pnpm run build
```

### 3. Start the Real-Time Colyseus Server
```bash
pnpm run start:server
```
*(Server listens on `http://localhost:2567` for multiplayer concerts & battle matchmaking)*

### 4. Start the Client Web App
```bash
pnpm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser or on your phone over local Wi-Fi.

---

## 📂 Architecture Overview

```
band-league/
├── apps/
│   ├── client/                  # Vite + React + Canvas Game Client
│   │   ├── src/
│   │   │   ├── audio/           # StemAudioEngine (Multi-genre synth) & PitchDetector (Mic)
│   │   │   ├── engine/          # NoteHighwayRenderer (60 FPS Canvas note highway)
│   │   │   ├── input/           # InputManager & MidiManager (Web MIDI API)
│   │   │   ├── net/             # NetworkManager (Colyseus WebSocket client)
│   │   │   ├── data/            # 4 Songs with multi-role charts & unison events
│   │   │   └── components/      # Lobby, HUD, Controls, Battle, Practice, League, ChartEditor
│   └── server/                  # Colyseus + Express Real-Time Game Server
│       └── src/
│           ├── rooms/           # ConcertRoom & BattleRoom
│           └── index.ts         # REST API & WebSocket transport
└── packages/
    └── shared/                  # Judgement windows, ELO calculation, scoring formulas, types
```
