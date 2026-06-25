import { Test, TestingModule } from '@nestjs/testing';
import { DeleteTaskApplicationImpl } from './delete-task.application';
import { TASK_TYPES } from '../interfaces/types';
import { ACTIVITY_TYPES } from 'src/modules/activity/interfaces/types';
import { WORKSPACE_TYPES } from 'src/modules/workspaces/interfaces/types';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ActivityAction, ActivityEntityType } from 'src/modules/activity/domain/entities/activity.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { REALTIME_EVENTS } from 'src/modules/realtime/realtime.events';

describe('DeleteTaskApplicationImpl', () => {
  let app: DeleteTaskApplicationImpl;

  const mockFindTaskService = { findOneTask: jest.fn(), findOneTaskForRestore: jest.fn() };
  const mockDeleteTaskService = { softDeleteTask: jest.fn(), restoreTask: jest.fn() };
  const mockCreateActivityService = { create: jest.fn() };
  const mockUnitOfWork = { runInTransaction: jest.fn(async (cb) => { return await cb('mockTransactionManager'); }) };
  const mockEventEmitter = { emit: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteTaskApplicationImpl,
        { provide: TASK_TYPES.services.FindTaskService, useValue: mockFindTaskService },
        { provide: TASK_TYPES.services.DeleteTaskService, useValue: mockDeleteTaskService },
        { provide: ACTIVITY_TYPES.services.CreateActivityService, useValue: mockCreateActivityService },
        { provide: WORKSPACE_TYPES.uow.UnitOfWork, useValue: mockUnitOfWork },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    app = module.get<DeleteTaskApplicationImpl>(DeleteTaskApplicationImpl);
  });

  it('should be defined', () => {
    expect(app).toBeDefined();
  });

  describe('delete', () => {
    it('should throw NotFoundException if task not found', async () => {
      mockFindTaskService.findOneTask.mockResolvedValue(null);
      await expect(app.delete({ workspaceId: 'ws-1', taskId: '1', userId: 'user-1' })).rejects.toThrow(NotFoundException);
    });

    it('should delete task, create activity, and emit event inside transaction', async () => {
      const mockTask = { id: '1', workspaceId: 'ws-1', projectId: 'proj-1', title: 'Task 1' };
      mockFindTaskService.findOneTask.mockResolvedValue(mockTask);
      await app.delete({ workspaceId: 'ws-1', taskId: '1', userId: 'user-1' });

      expect(mockUnitOfWork.runInTransaction).toHaveBeenCalled();
      expect(mockDeleteTaskService.softDeleteTask).toHaveBeenCalledWith({ taskId: '1', deletedBy: 'user-1' }, 'mockTransactionManager');
      expect(mockCreateActivityService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          entityType: ActivityEntityType.TASK,
          entityId: '1',
          action: ActivityAction.TASK_DELETED,
        }),
        'mockTransactionManager',
      );
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(REALTIME_EVENTS.TASK_DELETED, {
        workspaceId: mockTask.workspaceId,
        projectId: mockTask.projectId,
        taskId: '1',
      });
    });
  });

  describe('restore', () => {
    it('should throw NotFoundException if task not found for restore', async () => {
      mockFindTaskService.findOneTaskForRestore.mockResolvedValue(null);
      await expect(app.restore({ workspaceId: 'ws-1', taskId: '1', userId: 'user-1' })).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if task is not deleted', async () => {
      mockFindTaskService.findOneTaskForRestore.mockResolvedValue({ deletedAt: null });
      await expect(app.restore({ workspaceId: 'ws-1', taskId: '1', userId: 'user-1' })).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if workspace is deleted', async () => {
      mockFindTaskService.findOneTaskForRestore.mockResolvedValue({ deletedAt: new Date(), workspaceDeletedAt: new Date() });
      await expect(app.restore({ workspaceId: 'ws-1', taskId: '1', userId: 'user-1' })).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if project is deleted', async () => {
      mockFindTaskService.findOneTaskForRestore.mockResolvedValue({ deletedAt: new Date(), workspaceDeletedAt: null, projectDeletedAt: new Date() });
      await expect(app.restore({ workspaceId: 'ws-1', taskId: '1', userId: 'user-1' })).rejects.toThrow(BadRequestException);
    });

    it('should restore task, create activity, and emit event inside transaction', async () => {
      const mockTask = { id: '1', workspaceId: 'ws-1', projectId: 'proj-1', deletedAt: new Date(), workspaceDeletedAt: null, projectDeletedAt: null, title: 'Task 1' };
      mockFindTaskService.findOneTaskForRestore.mockResolvedValue(mockTask);
      await app.restore({ workspaceId: 'ws-1', taskId: '1', userId: 'user-1' });

      expect(mockUnitOfWork.runInTransaction).toHaveBeenCalled();
      expect(mockDeleteTaskService.restoreTask).toHaveBeenCalledWith({ taskId: '1' }, 'mockTransactionManager');
      expect(mockCreateActivityService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          entityType: ActivityEntityType.TASK,
          entityId: '1',
          action: ActivityAction.TASK_RESTORED,
        }),
        'mockTransactionManager',
      );
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(REALTIME_EVENTS.TASK_UPDATED, {
        workspaceId: mockTask.workspaceId,
        projectId: mockTask.projectId,
        task: mockTask,
      });
    });
  });
});
