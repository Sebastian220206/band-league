import colyseusPkg from 'colyseus';
import { Schema, MapSchema, type } from '@colyseus/schema';
import {
  BandRole,
  Judgement,
  updateCrowdHype,
} from '@band-league/shared';

const { Room } = colyseusPkg;

export class PlayerState extends Schema {
  @type('string') id: string = '';
  @type('string') name: string = '';
  @type('string') role: string = 'drummer';
  @type('boolean') isReady: boolean = false;
  @type('boolean') isAi: boolean = false;
  @type('number') score: number = 0;
  @type('number') combo: number = 0;
  @type('number') maxCombo: number = 0;
  @type('number') accuracy: number = 100;
  @type('string') lastJudgement: string = 'perfect';
}

export class ConcertRoomState extends Schema {
  @type({ map: PlayerState }) players = new MapSchema<PlayerState>();
  @type('string') status: 'lobby' | 'starting' | 'playing' | 'ended' = 'lobby';
  @type('string') songId: string = 'neon-horizon';
  @type('number') songStartServerTime: number = 0;
  @type('number') totalBandScore: number = 0;
  @type('number') crowdHype: number = 50.0;
  @type('number') ensembleMultiplier: number = 1.0;
  @type('boolean') isBooedOff: boolean = false;
}

export class ConcertRoom extends Room<ConcertRoomState> {
  maxClients = 5;

  onCreate(options: { songId?: string }) {
    this.setState(new ConcertRoomState());
    this.state.songId = options.songId || 'neon-horizon';

    this.onMessage('clock_ping', (client, data: { clientSendTime: number }) => {
      client.send('clock_pong', {
        clientSendTime: data.clientSendTime,
        serverReceiveTime: Date.now(),
        serverSendTime: Date.now(),
      });
    });

    this.onMessage('select_role', (client, data: { role: BandRole }) => {
      const player = this.state.players.get(client.sessionId);
      if (player) {
        player.role = data.role;
      }
    });

    this.onMessage('toggle_ready', (client) => {
      const player = this.state.players.get(client.sessionId);
      if (player) {
        player.isReady = !player.isReady;
        this.checkAllReady();
      }
    });

    this.onMessage('player_hit', (client, data: {
      noteId: string | number;
      judgement: Judgement;
      deltaMs: number;
      isUnison?: boolean;
    }) => {
      const player = this.state.players.get(client.sessionId);
      if (!player) return;

      player.lastJudgement = data.judgement;
      if (data.judgement === 'miss') {
        player.combo = 0;
      } else {
        player.combo += 1;
        if (player.combo > player.maxCombo) player.maxCombo = player.combo;
      }

      this.state.crowdHype = updateCrowdHype(this.state.crowdHype, data.judgement);
      if (this.state.crowdHype <= 0) {
        this.state.isBooedOff = true;
        this.state.status = 'ended';
      }

      this.broadcast('bandmate_hit', {
        playerId: client.sessionId,
        role: player.role,
        judgement: data.judgement,
        isUnison: data.isUnison,
        combo: player.combo,
      }, { except: client });
    });
  }

  onJoin(client: any, options: { name?: string; role?: BandRole }) {
    const player = new PlayerState();
    player.id = client.sessionId;
    player.name = options.name || `Player ${this.clients.length}`;
    player.role = options.role || this.getAvailableRole();
    this.state.players.set(client.sessionId, player);

    this.broadcast('band_chat', { message: `${player.name} joined as ${player.role}!` });
  }

  onLeave(client: any) {
    const player = this.state.players.get(client.sessionId);
    if (player) {
      this.state.players.delete(client.sessionId);
      this.broadcast('band_chat', { message: `${player.name} left the stage.` });
    }
  }

  private getAvailableRole(): BandRole {
    const roles: BandRole[] = ['guitarist', 'drummer', 'keyboardist', 'singer', 'producer'];
    const takenRoles = new Set(Array.from(this.state.players.values()).map((p) => p.role));
    return roles.find((r) => !takenRoles.has(r)) || 'drummer';
  }

  private checkAllReady() {
    const players = Array.from(this.state.players.values());
    if (players.length > 0 && players.every((p) => p.isReady)) {
      this.startSynchronizedConcert();
    }
  }

  private startSynchronizedConcert() {
    this.state.status = 'starting';

    const roles: BandRole[] = ['guitarist', 'drummer', 'keyboardist', 'singer', 'producer'];
    const existingRoles = new Set(Array.from(this.state.players.values()).map((p) => p.role));

    roles.forEach((r) => {
      if (!existingRoles.has(r)) {
        const aiPlayer = new PlayerState();
        aiPlayer.id = `ai_${r}`;
        aiPlayer.name = `AI ${r.toUpperCase()}`;
        aiPlayer.role = r;
        aiPlayer.isReady = true;
        aiPlayer.isAi = true;
        this.state.players.set(aiPlayer.id, aiPlayer);
      }
    });

    const startDelayMs = 3000;
    this.state.songStartServerTime = Date.now() + startDelayMs;

    this.clock.setTimeout(() => {
      this.state.status = 'playing';
      this.broadcast('song_start', {
        serverStartTime: this.state.songStartServerTime,
        songId: this.state.songId,
      });
    }, startDelayMs);
  }
}
