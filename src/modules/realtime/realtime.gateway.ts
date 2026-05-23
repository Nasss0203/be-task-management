import { Injectable } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RealtimeEmitterService } from './services/realtime-emitter.service';
import { RealtimeRoomsService } from './services/realtime-rooms.service';
import { RealtimeSocketAuthService } from './services/realtime-socket-auth.service';
import { SocketUser } from './types/socket-user.type';

@Injectable()
@WebSocketGateway({
  namespace: '/realtime',
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
  },
})
export class RealtimeGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly realtimeSocketAuthService: RealtimeSocketAuthService,
    private readonly realtimeRoomsService: RealtimeRoomsService,
    private readonly realtimeEmitterService: RealtimeEmitterService,
  ) {}

  afterInit(server: Server) {
    this.realtimeEmitterService.setServer(server);
  }

  async handleConnection(client: Socket) {
    try {
      const user = await this.realtimeSocketAuthService.authenticate(client);

      client.data.user = {
        id: user.id,
        email: user.email,
      } satisfies SocketUser;

      this.realtimeRoomsService.joinUserRoom(client, user.id);

      client.emit('realtime.connected', {
        userId: user.id,
        socketId: client.id,
      });

      console.log(`Socket connected: user=${user.id}, socket=${client.id}`);
    } catch (error) {
      console.log('Socket connection rejected');
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`Socket disconnected: ${client.id}`);
  }

  @SubscribeMessage('workspace.join')
  async joinWorkspace(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { workspaceId: string },
  ) {
    return this.realtimeRoomsService.joinWorkspace(client, body);
  }

  @SubscribeMessage('project.join')
  async joinProject(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { projectId: string },
  ) {
    return this.realtimeRoomsService.joinProject(client, body);
  }
}
