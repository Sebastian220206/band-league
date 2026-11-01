import { Client, Room } from 'colyseus.js';
import { BandRole, Judgement } from '@band-league/shared';

export interface NetworkCallbacks {
  onStatusChange?: (status: string) => void;
  onBandmateHit?: (data: { playerId: string; role: BandRole; judgement: Judgement; isUnison?: boolean }) => void;
  onSongStart?: (serverStartTime: number, songId: string) => void;
  onBattleUpdate?: (momentum: number, scoreA: number, scoreB: number) => void;
}

export class NetworkManager {
  private client: Client;
  private currentRoom: Room | null = null;
  private isConnected: boolean = false;
  private callbacks: NetworkCallbacks = {};
  private clockOffsetMs: number = 0;

  constructor(serverUrl: string = 'ws://localhost:2567') {
    this.client = new Client(serverUrl);
  }

  public getClockOffsetMs(): number {
    return this.clockOffsetMs;
  }

  public setCallbacks(cbs: NetworkCallbacks): void {
    this.callbacks = { ...this.callbacks, ...cbs };
  }

  public async connectConcertRoom(roomName: string = 'concert_room', options: { name?: string; role?: BandRole; songId?: string }): Promise<boolean> {
    try {
      this.currentRoom = await this.client.joinOrCreate(roomName, options);
      this.isConnected = true;
      this.setupRoomListeners(this.currentRoom);
      await this.syncClock();
      return true;
    } catch (err) {
      console.warn('Could not connect to Colyseus server (fallback to local mode):', err);
      this.isConnected = false;
      return false;
    }
  }

  public async connectBattleRoom(options: { bandName?: string; songId?: string }): Promise<boolean> {
    try {
      this.currentRoom = await this.client.joinOrCreate('battle_room', options);
      this.isConnected = true;
      this.setupBattleListeners(this.currentRoom);
      return true;
    } catch (err) {
      console.warn('Could not connect to Battle room:', err);
      this.isConnected = false;
      return false;
    }
  }

  private setupRoomListeners(room: Room): void {
    room.onMessage('bandmate_hit', (data: any) => {
      this.callbacks.onBandmateHit?.(data);
    });

    room.onMessage('song_start', (data: { serverStartTime: number; songId: string }) => {
      this.callbacks.onSongStart?.(data.serverStartTime, data.songId);
    });

    room.onMessage('clock_pong', (data: { clientSendTime: number; serverReceiveTime: number; serverSendTime: number }) => {
      const now = Date.now();
      const roundTrip = now - data.clientSendTime;
      const serverEstimated = data.serverSendTime + roundTrip / 2;
      this.clockOffsetMs = serverEstimated - now;
    });
  }

  private setupBattleListeners(room: Room): void {
    room.onStateChange((state: any) => {
      if (state.momentum !== undefined) {
        this.callbacks.onBattleUpdate?.(state.momentum, state.bandAScore, state.bandBScore);
      }
    });
  }

  public async syncClock(): Promise<void> {
    if (!this.currentRoom) return;
    this.currentRoom.send('clock_ping', { clientSendTime: Date.now() });
  }

  public sendHit(noteId: string | number, judgement: Judgement, deltaMs: number, isUnison: boolean = false): void {
    if (!this.currentRoom || !this.isConnected) return;
    this.currentRoom.send('player_hit', { noteId, judgement, deltaMs, isUnison });
  }

  public sendBattleScore(band: 'A' | 'B', deltaScore: number): void {
    if (!this.currentRoom || !this.isConnected) return;
    this.currentRoom.send('submit_score_update', { band, deltaScore });
  }

  public toggleReady(): void {
    if (!this.currentRoom) return;
    this.currentRoom.send('toggle_ready');
  }

  public leave(): void {
    if (this.currentRoom) {
      this.currentRoom.leave();
      this.currentRoom = null;
    }
    this.isConnected = false;
  }

  public getIsConnected(): boolean {
    return this.isConnected;
  }
}
