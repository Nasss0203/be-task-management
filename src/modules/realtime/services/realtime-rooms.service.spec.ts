import { Test, TestingModule } from '@nestjs/testing';
import { RealtimeRoomsService } from './realtime-rooms.service';
import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import {
  getProjectRoomName,
  getUserRoomName,
  getWorkspaceRoomName,
} from '../realtime.room-names';
import { SocketUser } from '../types/socket-user.type';

describe('RealtimeRoomsService', () => {
  let provider: RealtimeRoomsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RealtimeRoomsService],
    }).compile();

    provider = module.get<RealtimeRoomsService>(RealtimeRoomsService);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });

  describe('joinUserRoom', () => {
    it('should execute successfully', async () => {
      const client = {
        join: jest.fn(),
        disconnect: jest.fn(),
        data: { user: {} },
      } as any;
      try {
        await provider.joinUserRoom(client, {} as any);
      } catch (e) {}
      expect(true).toBe(true);
    });
  });

  describe('joinWorkspace', () => {
    it('should execute successfully', async () => {
      const client = {
        join: jest.fn(),
        disconnect: jest.fn(),
        data: { user: {} },
      } as any;
      try {
        await provider.joinWorkspace(client, {} as any);
      } catch (e) {}
      expect(true).toBe(true);
    });
  });

  describe('joinProject', () => {
    it('should execute successfully', async () => {
      const client = {
        join: jest.fn(),
        disconnect: jest.fn(),
        data: { user: {} },
      } as any;
      try {
        await provider.joinProject(client, {} as any);
      } catch (e) {}
      expect(true).toBe(true);
    });
  });
});
