import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import {
  getProjectRoomName,
  getUserRoomName,
  getWorkspaceRoomName,
} from '../realtime.room-names';
import { SocketUser } from '../types/socket-user.type';

@Injectable()
export class RealtimeRoomsService {
  joinUserRoom(client: Socket, userId: string): void {
    client.join(getUserRoomName(userId));
  }

  joinWorkspace(client: Socket, body: { workspaceId: string }) {
    const user = this.getSocketUserOrDisconnect(client);

    if (!user) {
      return;
    }

    const room = getWorkspaceRoomName(body.workspaceId);

    client.join(room);

    return {
      ok: true,
      room,
    };
  }

  joinProject(client: Socket, body: { projectId: string }) {
    const user = this.getSocketUserOrDisconnect(client);

    if (!user) {
      return;
    }

    const room = getProjectRoomName(body.projectId);

    client.join(room);

    return {
      ok: true,
      room,
    };
  }

  private getSocketUserOrDisconnect(client: Socket): SocketUser | undefined {
    const user = client.data.user as SocketUser | undefined;

    if (!user) {
      client.disconnect();
      return undefined;
    }

    return user;
  }
}
