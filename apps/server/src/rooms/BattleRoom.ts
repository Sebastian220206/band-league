import colyseusPkg from 'colyseus';
import { Schema, type } from '@colyseus/schema';
import { calculateEloDelta } from '@band-league/shared';

const { Room } = colyseusPkg;

export class BattleRoomState extends Schema {
  @type('string') songId: string = 'cyber-drop';
  @type('string') status: 'waiting' | 'starting' | 'battling' | 'finished' = 'waiting';
  @type('string') bandAName: string = 'The Neon Rebels';
  @type('string') bandBName: string = 'Cyber Syndicate';
  @type('number') bandAScore: number = 0;
  @type('number') bandBScore: number = 0;
  @type('number') momentum: number = 0;
  @type('string') winner: string = '';
}

export class BattleRoom extends Room<BattleRoomState> {
  maxClients = 10;

  onCreate(options: { songId?: string }) {
    this.setState(new BattleRoomState());
    this.state.songId = options.songId || 'cyber-drop';

    this.onMessage('submit_score_update', (client, data: { band: 'A' | 'B'; deltaScore: number }) => {
      if (data.band === 'A') {
        this.state.bandAScore += data.deltaScore;
      } else {
        this.state.bandBScore += data.deltaScore;
      }

      const diff = this.state.bandAScore - this.state.bandBScore;
      this.state.momentum = Math.max(-100, Math.min(100, Math.round(diff / 500)));
    });

    this.onMessage('finish_battle', () => {
      this.state.status = 'finished';
      if (this.state.bandAScore >= this.state.bandBScore) {
        this.state.winner = this.state.bandAName;
      } else {
        this.state.winner = this.state.bandBName;
      }
      const elo = calculateEloDelta(1200, 1200, this.state.bandAScore, this.state.bandBScore);
      this.broadcast('battle_results', {
        winner: this.state.winner,
        scoreA: this.state.bandAScore,
        scoreB: this.state.bandBScore,
        eloDeltaA: elo.deltaA,
        eloDeltaB: elo.deltaB,
      });
    });
  }

  onJoin(client: any) {
    this.broadcast('battle_announcement', {
      message: `Band contender connected!`,
    });
  }
}
