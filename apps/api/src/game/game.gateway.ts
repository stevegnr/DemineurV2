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
import { PayloadCellsOpened, PlayMovePayload } from './types';

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

  @SubscribeMessage('playMove')
  async handlePlayMove(client: Socket, payload: PlayMovePayload) {
    console.log('Coup reçu :', payload);

    // Update game
    const updatedGrid: PayloadCellsOpened = await this.gridsService.revealCell(
      payload.cellId,
      payload.gridId,
    );

    this.server.to(payload.roomId).emit('updatedGrid', updatedGrid);
  }
}
