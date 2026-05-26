import { WebSocketGateway, SubscribeMessage, MessageBody, ConnectedSocket, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@WebSocketGateway({ namespace: '/', cors: { origin: '*' } })
export class WsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  handleConnection(client: Socket) {
    console.log('WS client connected', client.id);
  }

  handleDisconnect(client: Socket) {
    console.log('WS client disconnected', client.id);
  }

  @SubscribeMessage('ping')
  handlePing(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
    client.emit('pong', { time: Date.now(), echo: data });
  }
}
