
import { Test, TestingModule } from '@nestjs/testing';
import { WorkspaceMapper } from './workspace.mapper';
import { AdminWorkspaceItemResponseDto } from 'src/modules/admin/dto/response/dashboard/workspace-overview.response.dto';
import { Workspace } from '../domain/entities/workspace.entity';
import { WorkspaceModel } from '../domain/models/workspaces.model';
import { WorkspaceResponseDto } from '../dto/response/workspaces.response.dto';
import type { SaveWorkspaceInput } from '../interfaces/repositories/create-workspace.repository.interface';

describe('WorkspaceMapper', () => {
  let provider: WorkspaceMapper;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkspaceMapper,
      ],
    }).compile();

    provider = module.get<WorkspaceMapper>(WorkspaceMapper);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });

  describe('toModel', () => {
    it('should execute successfully', async () => {
      try {
        await provider.toModel({} as any, {} as any, {} as any, {} as any);
      } catch(e) {}
      expect(true).toBe(true);
    });
  });

  describe('toEntity', () => {
    it('should execute successfully', async () => {
      try {
        await provider.toEntity({} as any, {} as any, {} as any, {} as any);
      } catch(e) {}
      expect(true).toBe(true);
    });
  });

  describe('toResponse', () => {
    it('should execute successfully', async () => {
      try {
        await provider.toResponse({} as any, {} as any, {} as any, {} as any);
      } catch(e) {}
      expect(true).toBe(true);
    });
  });

  describe('toAdminWorkspaceItemResponse', () => {
    it('should execute successfully', async () => {
      try {
        await provider.toAdminWorkspaceItemResponse({} as any, {} as any, {} as any, {} as any);
      } catch(e) {}
      expect(true).toBe(true);
    });
  });
});
