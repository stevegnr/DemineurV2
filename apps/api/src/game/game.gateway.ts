import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: { origin: '*' } })
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`Client connecté : ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client connecté : ${client.id}`);
  }

  @SubscribeMessage('playMove')
  handlePlayMove(client: Socket, payload: any) {
    console.log('Coup reçu :', payload);

    // Update game
    const updatedGameState = { text: 'coucou' };

    this.server.to(payload.roomId).emit('gameUpdated', updatedGameState);
  }
}
