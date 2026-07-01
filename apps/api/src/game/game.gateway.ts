import { Inject } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GridsService } from 'src/grids/grids.service';
import { PayloadCellsOpened, PlayMovesPayload } from './types';
import { RoomsService } from 'src/rooms/rooms.service';

@WebSocketGateway({ cors: { origin: '*' } })
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @Inject() gridsService: GridsService;
  @Inject() roomsService: RoomsService;

  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`Client connecté : ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client déconnecté : ${client.id}`);
    this.roomsService.removePlayerEverywhere(client.id, this.server);
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    client: Socket,
    payload: { roomId: string; playerName?: string },
  ) {
    const { roomId } = payload;

    const mode = await this.roomsService.getRoomMode(roomId);

    if (!this.roomsService.canJoin(roomId, mode)) {
      client.emit('joinRejected', { reason: 'La salle est pleine' });
      return;
    }

    client.join(roomId);
    console.log(`Client ${client.id} a rejoint la room ${roomId}`);

    const newPlayer = { id: client.id, name: payload.playerName ?? 'Invité' };
    this.roomsService.addPlayer(roomId, newPlayer, mode);

    const players = this.roomsService.getPlayers(roomId);
    this.server.to(roomId).emit('updatedPlayers', players);

    const currentTurn = this.roomsService.getCurrentTurn(roomId);
    const scores = this.roomsService.getScores(roomId);
    this.server.to(roomId).emit('gameState', { mode, currentTurn, scores });
  }

  @SubscribeMessage('newGame')
  handleNewGame(client: Socket, payload: { roomId: string; grid: unknown }) {
    // Vérifier que le client est membre de la room avant de reset
    if (!client.rooms.has(payload.roomId)) return;

    this.roomsService.resetGame(payload.roomId);
    const mode = this.roomsService.getMode(payload.roomId);
    const currentTurn = this.roomsService.getCurrentTurn(payload.roomId);
    const scores = this.roomsService.getScores(payload.roomId);
    this.server
      .to(payload.roomId)
      .emit('gameState', { mode, currentTurn, scores });
    this.server.to(payload.roomId).emit('gameStarted', { grid: payload.grid });
  }

  @SubscribeMessage('renamePlayer')
  handleRenamePlayer(
    client: Socket,
    payload: { roomId: string; name: string },
  ) {
    if (!client.rooms.has(payload.roomId)) return;
    const trimmed = payload.name.trim();
    if (!trimmed) return;
    this.roomsService.renamePlayer(payload.roomId, client.id, trimmed);
    const players = this.roomsService.getPlayers(payload.roomId);
    this.server.to(payload.roomId).emit('updatedPlayers', players);
  }

  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(client: Socket, payload: { roomId: string }) {
    this.roomsService.removePlayer(payload.roomId, client.id);

    const players = this.roomsService.getPlayers(payload.roomId);
    this.server.to(payload.roomId).emit('updatedPlayers', players);
  }

  @SubscribeMessage('playMoves')
  async handlePlayMoves(client: Socket, payload: PlayMovesPayload) {
    // Utilise getRoomMode (avec fallback DB) pour résister aux redémarrages serveur
    const mode = await this.roomsService.getRoomMode(payload.roomId);

    if (mode === '2players') {
      const currentTurn = this.roomsService.getCurrentTurn(payload.roomId);
      if (currentTurn !== client.id) {
        client.emit('notYourTurn');
        return;
      }
    }

    const updatedGrid: PayloadCellsOpened = await this.gridsService.revealCells(
      payload.cells,
      payload.gridId,
      mode,
    );

    if (mode === '2players' && updatedGrid.openedCells.length > 0) {
      const bombsFound = updatedGrid.openedCells.filter(
        (c) => c.hasBomb,
      ).length;
      if (bombsFound > 0) {
        this.roomsService.addScore(payload.roomId, client.id, bombsFound);
      } else if (!updatedGrid.isWin) {
        // Ne pas avancer le tour si la partie vient de se terminer
        this.roomsService.nextTurn(payload.roomId);
      }
    }

    const currentTurn = this.roomsService.getCurrentTurn(payload.roomId);
    const scores = this.roomsService.getScores(payload.roomId);

    this.server.to(payload.roomId).emit('updatedGrid', {
      ...updatedGrid,
      currentTurn,
      scores,
    });

    if (updatedGrid.isWin) {
      const winner = this.getWinner(mode, payload.roomId, scores);
      this.server.to(payload.roomId).emit('gameWon', {
        mode,
        scores,
        winner,
      });
    }
  }

  private getWinner(
    mode: '1player' | '2players',
    roomId: string,
    scores: Record<string, number>,
  ): string | null {
    if (mode === '1player') {
      const players = this.roomsService.getPlayers(roomId);
      return players[0]?.id ?? null;
    }

    const entries = Object.entries(scores);
    if (entries.length === 0) return null;

    const maxScore = Math.max(...entries.map(([, s]) => s));
    const winners = entries.filter(([, s]) => s === maxScore);
    return winners.length === 1 ? winners[0][0] : null;
  }
}
