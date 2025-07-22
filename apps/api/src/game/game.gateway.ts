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
  handleJoinRoom(
    client: Socket,
    payload: { roomId: string; playerName?: string },
  ) {
    const { roomId } = payload;
    client.join(roomId);
    console.log(`Client ${client.id} a rejoint la room ${roomId}`);

    const newPlayer = { id: client.id, name: payload.playerName ?? 'Invité' };

    this.roomsService.addPlayer(roomId, newPlayer);

    // Broadcast toute la liste mise à jour
    const players = this.roomsService.getPlayers(roomId);
    this.server.to(roomId).emit('updatedPlayers', players);
  }

  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(client: Socket, payload: { roomId: string }) {
    this.roomsService.removePlayer(payload.roomId, client.id);

    // Broadcast toute la liste mise à jour
    const players = this.roomsService.getPlayers(payload.roomId);
    this.server.to(payload.roomId).emit('updatedPlayers', players);
  }

  @SubscribeMessage('playMoves')
  async handlePlayMoves(client: Socket, payload: PlayMovesPayload) {
    // Update game
    const updatedGrid: PayloadCellsOpened = await this.gridsService.revealCells(
      payload.cells,
      payload.gridId,
    );

    this.server.to(payload.roomId).emit('updatedGrid', updatedGrid);
  }
}
