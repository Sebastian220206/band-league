import http from 'http';
import express from 'express';
import cors from 'cors';
import colyseusPkg from 'colyseus';
import wsTransportPkg from '@colyseus/ws-transport';
import { ConcertRoom } from './rooms/ConcertRoom.js';
import { BattleRoom } from './rooms/BattleRoom.js';
import { LEAGUE_DIVISIONS, VENUES } from '@band-league/shared';

const { Server } = colyseusPkg;
const { WebSocketTransport } = wsTransportPkg;

const app = express();
const port = Number(process.env.PORT || 2567);

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', serverTime: Date.now(), service: 'Band League Realtime Server' });
});

app.get('/api/league/divisions', (req, res) => {
  res.json(LEAGUE_DIVISIONS);
});

app.get('/api/league/venues', (req, res) => {
  res.json(VENUES);
});

app.get('/api/league/leaderboard', (req, res) => {
  res.json([
    { rank: 1, bandName: 'The Voltage Kings', division: 'headliner', rating: 2840, fans: 94000, winRate: 88, streak: 9 },
    { rank: 2, bandName: 'Cyber Syndicate', division: 'festival', rating: 2410, fans: 62000, winRate: 81, streak: 5 },
    { rank: 3, bandName: 'Tokyo Midnight', division: 'arena', rating: 1980, fans: 28000, winRate: 74, streak: 3 },
    { rank: 4, bandName: 'Velvet Groove', division: 'club', rating: 1450, fans: 8500, winRate: 65, streak: 2 },
    { rank: 5, bandName: 'The Neon Rebels', division: 'garage', rating: 1220, fans: 1200, winRate: 58, streak: 1 },
  ]);
});

const server = http.createServer(app);

const gameServer = new Server({
  transport: new WebSocketTransport({
    server,
  }),
});

gameServer.define('concert_room', ConcertRoom);
gameServer.define('battle_room', BattleRoom);

gameServer.listen(port).then(() => {
  console.log(`🎸 Band League Realtime Server listening on http://localhost:${port}`);
  console.log(`📡 WebSocket endpoint ready for Concerts & Battles`);
});
