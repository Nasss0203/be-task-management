import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';
import {
  getProjectRoomName,
  getUserRoomName,
  getWorkspaceRoomName,
} from '../realtime.room-names';

@Injectable()
export class RealtimeEmitterService {
  private server: Server | null = null;

  setServer(server: Server): void {
    this.server = server;
  }

  emitToUser(userId: string, event: string, payload: unknown): boolean {
    if (!this.server) {
      return false;
    }

    this.server.to(getUserRoomName(userId)).emit(event, payload);
    return true;
  }

  emitToWorkspace(
    workspaceId: string,
    event: string,
    payload: unknown,
  ): boolean {
    if (!this.server) {
      return false;
    }

    this.server.to(getWorkspaceRoomName(workspaceId)).emit(event, payload);
    return true;
  }

  emitToProject(projectId: string, event: string, payload: unknown): boolean {
    if (!this.server) {
      return false;
    }

    this.server.to(getProjectRoomName(projectId)).emit(event, payload);
    return true;
  }
}
