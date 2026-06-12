import { Test, TestingModule } from '@nestjs/testing';
import { DeleteProjectApplicationImpl } from './delete.project.application';
import { PROJECT_TYPES } from '../interfaces/types';
import { ACTIVITY_TYPES } from 'src/modules/activity/interfaces/types';
import { ActivityAction, ActivityEntityType } from 'src/modules/activity/domain/entities/activity.entity';
import { NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';

describe('DeleteProjectApplicationImpl', () => {
  let application: DeleteProjectApplicationImpl;

  const mockFindProjectService = {
    findOneProjectForRestore: jest.fn(),
    existsActiveProjectKey: jest.fn(),
  };

  const mockDeleteProjectService = {
    softDeleteProject: jest.fn(),
    restoreProject: jest.fn(),
  };

  const mockCreateActivityService = {
    create: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteProjectApplicationImpl,
        {
          provide: PROJECT_TYPES.services.FindProjectService,
          useValue: mockFindProjectService,
        },
        {
          provide: PROJECT_TYPES.services.DeleteProjectService,
          useValue: mockDeleteProjectService,
        },
        {
          provide: ACTIVITY_TYPES.services.CreateActivityService,
          useValue: mockCreateActivityService,
        },
      ],
    }).compile();

    application = module.get<DeleteProjectApplicationImpl>(DeleteProjectApplicationImpl);
  });

  it('should be defined', () => {
    expect(application).toBeDefined();
  });

  describe('delete', () => {
    it('should throw NotFoundException if project not found', async () => {
      mockFindProjectService.findOneProjectForRestore.mockResolvedValue(null);

      await expect(application.delete({ workspaceId: 'ws-1', projectId: '1', userId: 'usr-1' })).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if project is already deleted', async () => {
      mockFindProjectService.findOneProjectForRestore.mockResolvedValue({ id: '1', deletedAt: new Date() });

      await expect(application.delete({ workspaceId: 'ws-1', projectId: '1', userId: 'usr-1' })).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if workspace is deleted', async () => {
      mockFindProjectService.findOneProjectForRestore.mockResolvedValue({ id: '1', workspaceDeletedAt: new Date() });

      await expect(application.delete({ workspaceId: 'ws-1', projectId: '1', userId: 'usr-1' })).rejects.toThrow(BadRequestException);
    });

    it('should call softDeleteProject and create activity', async () => {
      mockFindProjectService.findOneProjectForRestore.mockResolvedValue({ id: '1', name: 'Test', key: 'TEST-1' });
      mockDeleteProjectService.softDeleteProject.mockResolvedValue(undefined);
      mockCreateActivityService.create.mockResolvedValue(undefined);

      await application.delete({ workspaceId: 'ws-1', projectId: '1', userId: 'usr-1' });

      expect(mockDeleteProjectService.softDeleteProject).toHaveBeenCalledWith({ projectId: '1', deletedBy: 'usr-1' });
      expect(mockCreateActivityService.create).toHaveBeenCalledWith({
        workspaceId: 'ws-1',
        projectId: '1',
        entityType: ActivityEntityType.PROJECT,
        entityId: '1',
        actorId: 'usr-1',
        action: ActivityAction.PROJECT_DELETED,
        metadata: {
          name: 'Test',
          key: 'TEST-1',
        },
      });
    });
  });

  describe('restore', () => {
    it('should throw NotFoundException if project not found', async () => {
      mockFindProjectService.findOneProjectForRestore.mockResolvedValue(null);

      await expect(application.restore({ workspaceId: 'ws-1', projectId: '1', userId: 'usr-1' })).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if project is not deleted', async () => {
      mockFindProjectService.findOneProjectForRestore.mockResolvedValue({ id: '1', deletedAt: null });

      await expect(application.restore({ workspaceId: 'ws-1', projectId: '1', userId: 'usr-1' })).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if workspace is deleted', async () => {
      mockFindProjectService.findOneProjectForRestore.mockResolvedValue({ id: '1', deletedAt: new Date(), workspaceDeletedAt: new Date() });

      await expect(application.restore({ workspaceId: 'ws-1', projectId: '1', userId: 'usr-1' })).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException if project key already exists', async () => {
      mockFindProjectService.findOneProjectForRestore.mockResolvedValue({ id: '1', key: 'TEST-1', deletedAt: new Date() });
      mockFindProjectService.existsActiveProjectKey.mockResolvedValue(true);

      await expect(application.restore({ workspaceId: 'ws-1', projectId: '1', userId: 'usr-1' })).rejects.toThrow(ConflictException);
    });

    it('should call restoreProject and create activity', async () => {
      mockFindProjectService.findOneProjectForRestore.mockResolvedValue({ id: '1', name: 'Test', key: 'TEST-1', deletedAt: new Date() });
      mockFindProjectService.existsActiveProjectKey.mockResolvedValue(false);
      mockDeleteProjectService.restoreProject.mockResolvedValue(undefined);
      mockCreateActivityService.create.mockResolvedValue(undefined);

      await application.restore({ workspaceId: 'ws-1', projectId: '1', userId: 'usr-1' });

      expect(mockDeleteProjectService.restoreProject).toHaveBeenCalledWith({ projectId: '1' });
      expect(mockCreateActivityService.create).toHaveBeenCalledWith({
        workspaceId: 'ws-1',
        projectId: '1',
        entityType: ActivityEntityType.PROJECT,
        entityId: '1',
        actorId: 'usr-1',
        action: ActivityAction.PROJECT_RESTORED,
        metadata: {
          name: 'Test',
          key: 'TEST-1',
        },
      });
    });
  });
});
