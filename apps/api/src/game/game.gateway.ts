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

@WebSocketGateway({ cors: { origin: '*' } })
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @Inject() gridsService: GridsService;

  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`Client connecté : ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client connecté : ${client.id}`);
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(client: Socket, payload: { roomId: string }) {
    const { roomId } = payload;
    client.join(roomId);
    console.log(`Client ${client.id} a rejoint la room ${roomId}`);
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
