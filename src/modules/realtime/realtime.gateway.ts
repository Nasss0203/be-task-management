import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import {
  type NotificationCreatedPayload,
  REALTIME_EVENTS,
} from './realtime.events';

type SocketUser = {
  id: string;
  email?: string;
};

@Injectable()
@WebSocketGateway({
  namespace: '/realtime',
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
  },
})
export class RealtimeGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = this.extractToken(client);

      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.getOrThrow<string>(
          'JWT_ACCESS_TOKEN_SECRET',
        ),
      });

      const userId = payload.sub || payload.id;

      if (!userId) {
        throw new UnauthorizedException();
      }

      client.data.user = {
        id: userId,
        email: payload.email,
      } satisfies SocketUser;

      client.join(`user:${userId}`);

      client.emit('realtime.connected', {
        userId,
        socketId: client.id,
      });

      console.log(`Socket connected: user=${userId}, socket=${client.id}`);
    } catch (error) {
      console.log('Socket connection rejected');
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`Socket disconnected: ${client.id}`);
  }

  private extractToken(client: Socket): string {
    const tokenFromAuth = client.handshake.auth?.token;

    if (tokenFromAuth) {
      return tokenFromAuth;
    }

    const authorization = client.handshake.headers.authorization;

    if (authorization?.startsWith('Bearer ')) {
      return authorization.replace('Bearer ', '');
    }

    throw new UnauthorizedException();
  }

  @SubscribeMessage('workspace.join')
  async joinWorkspace(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { workspaceId: string },
  ) {
    const user = client.data.user as SocketUser | undefined;

    if (!user) {
      client.disconnect();
      return;
    }

    /**
     * Sau này nên check user có thuộc workspace không.
     * Hiện tại test trước thì cho join.
     */

    client.join(`workspace:${body.workspaceId}`);

    return {
      ok: true,
      room: `workspace:${body.workspaceId}`,
    };
  }

  @SubscribeMessage('project.join')
  async joinProject(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { projectId: string },
  ) {
    const user = client.data.user as SocketUser | undefined;

    if (!user) {
      client.disconnect();
      return;
    }

    client.join(`project:${body.projectId}`);

    return {
      ok: true,
      room: `project:${body.projectId}`,
    };
  }

  @OnEvent(REALTIME_EVENTS.NOTIFICATION_CREATED)
  handleNotificationCreated(payload: NotificationCreatedPayload) {
    this.server
      .to(`user:${payload.recipientUserId}`)
      .emit('notification.created', payload.notification);
  }
}
