import { Test, TestingModule } from '@nestjs/testing';
import { DeleteSprintApplicationImpl } from './delete-sprint.application';
import { SPRINT_TYPES } from '../interfaces/types';
import { ACTIVITY_TYPES } from 'src/modules/activity/interfaces/types';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { SprintStatus } from '../domain/entities/sprint.entity';

describe('DeleteSprintApplicationImpl', () => {
  let app: DeleteSprintApplicationImpl;

  const mockFindSprintService = { findOneSprintForRestore: jest.fn() };
  const mockDeleteSprintService = { softDeleteSprint: jest.fn(), restoreSprint: jest.fn() };
  const mockCreateActivityService = { create: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteSprintApplicationImpl,
        { provide: SPRINT_TYPES.services.FindSprintService, useValue: mockFindSprintService },
        { provide: SPRINT_TYPES.services.DeleteSprintService, useValue: mockDeleteSprintService },
        { provide: ACTIVITY_TYPES.services.CreateActivityService, useValue: mockCreateActivityService },
      ],
    }).compile();

    app = module.get<DeleteSprintApplicationImpl>(DeleteSprintApplicationImpl);
  });

  it('should be defined', () => {
    expect(app).toBeDefined();
  });

  describe('delete', () => {
    it('should throw NotFoundException if sprint not found', async () => {
      mockFindSprintService.findOneSprintForRestore.mockResolvedValue(null);
      await expect(app.delete({ workspaceId: '1', projectId: '2', sprintId: '3', userId: '4' })).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if sprint is already deleted', async () => {
      mockFindSprintService.findOneSprintForRestore.mockResolvedValue({ deletedAt: new Date() });
      await expect(app.delete({ workspaceId: '1', projectId: '2', sprintId: '3', userId: '4' })).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if workspace is deleted', async () => {
      mockFindSprintService.findOneSprintForRestore.mockResolvedValue({ workspaceDeletedAt: new Date() });
      await expect(app.delete({ workspaceId: '1', projectId: '2', sprintId: '3', userId: '4' })).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if project is deleted', async () => {
      mockFindSprintService.findOneSprintForRestore.mockResolvedValue({ projectDeletedAt: new Date() });
      await expect(app.delete({ workspaceId: '1', projectId: '2', sprintId: '3', userId: '4' })).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if sprint is active', async () => {
      mockFindSprintService.findOneSprintForRestore.mockResolvedValue({ status: SprintStatus.ACTIVE });
      await expect(app.delete({ workspaceId: '1', projectId: '2', sprintId: '3', userId: '4' })).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if sprint is completed', async () => {
      mockFindSprintService.findOneSprintForRestore.mockResolvedValue({ status: SprintStatus.COMPLETED });
      await expect(app.delete({ workspaceId: '1', projectId: '2', sprintId: '3', userId: '4' })).rejects.toThrow(BadRequestException);
    });

    it('should soft delete sprint and log activity', async () => {
      mockFindSprintService.findOneSprintForRestore.mockResolvedValue({ status: SprintStatus.PLANNED });
      await app.delete({ workspaceId: '1', projectId: '2', sprintId: '3', userId: '4' });
      expect(mockDeleteSprintService.softDeleteSprint).toHaveBeenCalled();
      expect(mockCreateActivityService.create).toHaveBeenCalled();
    });
  });

  describe('restore', () => {
    it('should throw NotFoundException if sprint not found', async () => {
      mockFindSprintService.findOneSprintForRestore.mockResolvedValue(null);
      await expect(app.restore({ workspaceId: '1', projectId: '2', sprintId: '3', userId: '4' })).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if sprint is not deleted', async () => {
      mockFindSprintService.findOneSprintForRestore.mockResolvedValue({ deletedAt: null });
      await expect(app.restore({ workspaceId: '1', projectId: '2', sprintId: '3', userId: '4' })).rejects.toThrow(BadRequestException);
    });

    it('should restore sprint and log activity', async () => {
      mockFindSprintService.findOneSprintForRestore.mockResolvedValue({ deletedAt: new Date() });
      await app.restore({ workspaceId: '1', projectId: '2', sprintId: '3', userId: '4' });
      expect(mockDeleteSprintService.restoreSprint).toHaveBeenCalled();
      expect(mockCreateActivityService.create).toHaveBeenCalled();
    });
  });
});
