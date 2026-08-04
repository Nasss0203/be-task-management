import { Test, TestingModule } from '@nestjs/testing';
import { DeleteSprintApplicationImpl } from './delete-sprint.application';
import { SPRINT_TYPES } from '../interfaces/types';
import { ACTIVITY_TYPES } from 'src/modules/activity/interfaces/types';
import { TASK_TYPES } from 'src/modules/tasks/interfaces/types';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { SprintStatus } from '../domain/entities/sprint.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { REALTIME_EVENTS } from 'src/modules/realtime/realtime.events';

describe('DeleteSprintApplicationImpl', () => {
  let app: DeleteSprintApplicationImpl;

  const mockFindSprintService = { findOneSprintForRestore: jest.fn() };
  const mockDeleteSprintService = {
    softDeleteSprint: jest.fn(),
    restoreSprint: jest.fn(),
  };
  const mockMoveTasksToBacklogBySprintService = { move: jest.fn() };
  const mockCreateActivityService = { create: jest.fn() };
  const mockUnitOfWork = {
    runInTransaction: jest.fn().mockImplementation(async (cb) => {
      return await cb('mockTransactionManager');
    }),
  };
  const mockEventEmitter = { emit: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteSprintApplicationImpl,
        {
          provide: SPRINT_TYPES.services.FindSprintService,
          useValue: mockFindSprintService,
        },
        {
          provide: SPRINT_TYPES.services.DeleteSprintService,
          useValue: mockDeleteSprintService,
        },
        {
          provide: TASK_TYPES.services.MoveTasksToBacklogBySprintService,
          useValue: mockMoveTasksToBacklogBySprintService,
        },
        {
          provide: ACTIVITY_TYPES.services.CreateActivityService,
          useValue: mockCreateActivityService,
        },
        { provide: SPRINT_TYPES.uow.UnitOfWork, useValue: mockUnitOfWork },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    app = module.get<DeleteSprintApplicationImpl>(DeleteSprintApplicationImpl);
  });

  it('should be defined', () => {
    expect(app).toBeDefined();
  });

  describe('delete', () => {
    it('should throw NotFoundException if sprint not found and not run transaction', async () => {
      mockFindSprintService.findOneSprintForRestore.mockResolvedValue(null);
      await expect(
        app.delete({
          workspaceId: '1',
          projectId: '2',
          sprintId: '3',
          userId: '4',
        }),
      ).rejects.toThrow(NotFoundException);
      expect(mockUnitOfWork.runInTransaction).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if sprint is active and not call transaction or side effects', async () => {
      mockFindSprintService.findOneSprintForRestore.mockResolvedValue({
        status: SprintStatus.ACTIVE,
      });

      await expect(
        app.delete({
          workspaceId: '1',
          projectId: '2',
          sprintId: '3',
          userId: '4',
        }),
      ).rejects.toThrow(BadRequestException);

      expect(mockUnitOfWork.runInTransaction).not.toHaveBeenCalled();
      expect(mockMoveTasksToBacklogBySprintService.move).not.toHaveBeenCalled();
      expect(mockDeleteSprintService.softDeleteSprint).not.toHaveBeenCalled();
      expect(mockEventEmitter.emit).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if sprint is completed and not call transaction or side effects', async () => {
      mockFindSprintService.findOneSprintForRestore.mockResolvedValue({
        status: SprintStatus.COMPLETED,
      });

      await expect(
        app.delete({
          workspaceId: '1',
          projectId: '2',
          sprintId: '3',
          userId: '4',
        }),
      ).rejects.toThrow(BadRequestException);

      expect(mockUnitOfWork.runInTransaction).not.toHaveBeenCalled();
      expect(mockMoveTasksToBacklogBySprintService.move).not.toHaveBeenCalled();
      expect(mockDeleteSprintService.softDeleteSprint).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if sprint is already deleted', async () => {
      mockFindSprintService.findOneSprintForRestore.mockResolvedValue({
        deletedAt: new Date(),
      });
      await expect(
        app.delete({
          workspaceId: '1',
          projectId: '2',
          sprintId: '3',
          userId: '4',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw error if moving tasks to backlog fails, and not call soft delete sprint', async () => {
      mockFindSprintService.findOneSprintForRestore.mockResolvedValue({
        status: SprintStatus.PLANNED,
      });
      const error = new Error('Move tasks failed');
      mockMoveTasksToBacklogBySprintService.move.mockRejectedValue(error);

      await expect(
        app.delete({
          workspaceId: '1',
          projectId: '2',
          sprintId: '3',
          userId: '4',
        }),
      ).rejects.toThrow(error);

      expect(mockDeleteSprintService.softDeleteSprint).not.toHaveBeenCalled();
      expect(mockEventEmitter.emit).not.toHaveBeenCalled();
    });

    it('should throw error if soft delete sprint fails, and not emit events', async () => {
      mockFindSprintService.findOneSprintForRestore.mockResolvedValue({
        status: SprintStatus.PLANNED,
      });
      const error = new Error('Soft delete failed');
      mockMoveTasksToBacklogBySprintService.move.mockResolvedValue(undefined);
      mockDeleteSprintService.softDeleteSprint.mockRejectedValue(error);

      await expect(
        app.delete({
          workspaceId: '1',
          projectId: '2',
          sprintId: '3',
          userId: '4',
        }),
      ).rejects.toThrow(error);

      expect(mockMoveTasksToBacklogBySprintService.move).toHaveBeenCalled();
      expect(mockEventEmitter.emit).not.toHaveBeenCalled();
    });

    it('should soft delete sprint, move tasks to backlog, log activity and emit event when sprint is PLANNED', async () => {
      mockFindSprintService.findOneSprintForRestore.mockResolvedValue({
        status: SprintStatus.PLANNED,
      });
      mockMoveTasksToBacklogBySprintService.move.mockResolvedValue(undefined);
      mockDeleteSprintService.softDeleteSprint.mockResolvedValue(undefined);

      await app.delete({
        workspaceId: '1',
        projectId: '2',
        sprintId: '3',
        userId: '4',
      });

      expect(mockUnitOfWork.runInTransaction).toHaveBeenCalled();
      expect(mockMoveTasksToBacklogBySprintService.move).toHaveBeenCalledWith(
        { workspaceId: '1', projectId: '2', sprintId: '3' },
        'mockTransactionManager',
      );
      expect(mockDeleteSprintService.softDeleteSprint).toHaveBeenCalledWith(
        { sprintId: '3', deletedBy: '4' },
        'mockTransactionManager',
      );
      expect(mockCreateActivityService.create).toHaveBeenCalled();
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        REALTIME_EVENTS.SPRINT_DELETED,
        { workspaceId: '1', projectId: '2', sprintId: '3' },
      );
    });
  });

  describe('restore', () => {
    it('should throw NotFoundException if sprint not found', async () => {
      mockFindSprintService.findOneSprintForRestore.mockResolvedValue(null);
      await expect(
        app.restore({
          workspaceId: '1',
          projectId: '2',
          sprintId: '3',
          userId: '4',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if sprint is not deleted', async () => {
      mockFindSprintService.findOneSprintForRestore.mockResolvedValue({
        deletedAt: null,
      });
      await expect(
        app.restore({
          workspaceId: '1',
          projectId: '2',
          sprintId: '3',
          userId: '4',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should restore sprint and log activity', async () => {
      mockFindSprintService.findOneSprintForRestore.mockResolvedValue({
        deletedAt: new Date(),
      });
      await app.restore({
        workspaceId: '1',
        projectId: '2',
        sprintId: '3',
        userId: '4',
      });
      expect(mockDeleteSprintService.restoreSprint).toHaveBeenCalled();
      expect(mockCreateActivityService.create).toHaveBeenCalled();
    });
  });
});
