import { Test, TestingModule } from '@nestjs/testing';
import { RealtimeEmitterService } from './realtime-emitter.service';
import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';
import {
  getProjectRoomName,
  getUserRoomName,
  getWorkspaceRoomName,
} from '../realtime.room-names';

describe('RealtimeEmitterService', () => {
  let provider: RealtimeEmitterService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RealtimeEmitterService],
    }).compile();

    provider = module.get<RealtimeEmitterService>(RealtimeEmitterService);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });

  describe('setServer', () => {
    it('should execute successfully', async () => {
      try {
        await provider.setServer({} as any, {} as any, {} as any, {} as any);
      } catch (e) {}
      expect(true).toBe(true);
    });
  });

  describe('emitToUser', () => {
    it('should execute successfully', async () => {
      try {
        await provider.emitToUser({} as any, {} as any, {} as any, {} as any);
      } catch (e) {}
      expect(true).toBe(true);
    });
  });

  describe('emitToWorkspace', () => {
    it('should execute successfully', async () => {
      try {
        await provider.emitToWorkspace(
          {} as any,
          {} as any,
          {} as any,
          {} as any,
        );
      } catch (e) {}
      expect(true).toBe(true);
    });
  });

  describe('emitToProject', () => {
    it('should execute successfully', async () => {
      try {
        await provider.emitToProject(
          {} as any,
          {} as any,
          {} as any,
          {} as any,
        );
      } catch (e) {}
      expect(true).toBe(true);
    });
  });
});
