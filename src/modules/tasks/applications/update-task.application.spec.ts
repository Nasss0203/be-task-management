import { Test, TestingModule } from '@nestjs/testing';
import { UpdateTaskApplicationImpl } from './update-task.application';
import { TASK_TYPES } from '../interfaces/types';
import { ACTIVITY_TYPES } from 'src/modules/activity/interfaces/types';
import { PERMISSION_TYPES } from 'src/modules/permission/interfaces/types';
import { WORKSPACE_TYPES } from 'src/modules/workspaces/interfaces/types';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { REALTIME_EVENTS } from 'src/modules/realtime/realtime.events';

describe('UpdateTaskApplicationImpl', () => {
  let app: UpdateTaskApplicationImpl;

  const mockUpdateTaskService = { updateTask: jest.fn(), updateManyTasks: jest.fn() };
  const mockFindTaskService = { findOneTask: jest.fn(), findByIds: jest.fn() };
  const mockCreateActivityService = { create: jest.fn(), createMany: jest.fn() };
  const mockFindPermissionService = { checkPermissions: jest.fn() };
  const mockUnitOfWork = { runInTransaction: jest.fn(async (cb) => { return await cb('mockTransactionManager'); }) };
  const mockEventEmitter = { emit: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateTaskApplicationImpl,
        { provide: TASK_TYPES.services.UpdateTaskService, useValue: mockUpdateTaskService },
        { provide: TASK_TYPES.services.FindTaskService, useValue: mockFindTaskService },
        { provide: ACTIVITY_TYPES.services.CreateActivityService, useValue: mockCreateActivityService },
        { provide: PERMISSION_TYPES.services.FindPermissionService, useValue: mockFindPermissionService },
        { provide: WORKSPACE_TYPES.uow.UnitOfWork, useValue: mockUnitOfWork },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    app = module.get<UpdateTaskApplicationImpl>(UpdateTaskApplicationImpl);
  });

  it('should be defined', () => {
    expect(app).toBeDefined();
  });

  describe('updateTask', () => {
    const input = {
      id: 'task-1',
      workspaceId: 'ws-1',
      projectId: 'proj-1',
      actorId: 'user-1',
      title: 'New Title',
    };

    it('should throw NotFoundException if task not found', async () => {
      mockFindTaskService.findOneTask.mockResolvedValue(null);
      await expect(app.updateTask(input)).rejects.toThrow(NotFoundException);
    });

    it('should update task, log activity, and emit event inside transaction', async () => {
      const oldTask = { id: 'task-1', workspaceId: 'ws-1', projectId: 'proj-1', title: 'Old Title', assignees: [] };
      const updatedTask = { id: 'task-1', workspaceId: 'ws-1', projectId: 'proj-1', title: 'New Title', assignees: [] };
      
      mockFindTaskService.findOneTask.mockResolvedValue(oldTask);
      mockUpdateTaskService.updateTask.mockResolvedValue(updatedTask);

      await app.updateTask(input);

      expect(mockUnitOfWork.runInTransaction).toHaveBeenCalled();
      expect(mockUpdateTaskService.updateTask).toHaveBeenCalledWith(input, 'mockTransactionManager');
      expect(mockCreateActivityService.create).toHaveBeenCalled();
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(REALTIME_EVENTS.TASK_UPDATED, {
        workspaceId: updatedTask.workspaceId,
        projectId: updatedTask.projectId,
        task: updatedTask,
      });
    });
  });

  describe('updateManyTasks', () => {
    const input = {
      workspaceId: 'ws-1',
      projectId: 'proj-1',
      actorId: 'user-1',
      dto: { taskIds: ['task-1', 'task-2'], statusId: 'status-2' },
    };

    it('should throw BadRequestException if workspaceId is missing', async () => {
      await expect(app.updateManyTasks({ ...input, workspaceId: '' })).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if projectId is missing', async () => {
      await expect(app.updateManyTasks({ ...input, projectId: '' })).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if task list is empty', async () => {
      await expect(app.updateManyTasks({ ...input, dto: { taskIds: [] } })).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if some tasks are missing', async () => {
      mockFindTaskService.findByIds.mockResolvedValue([{ id: 'task-1', workspaceId: 'ws-1', projectId: 'proj-1' }]);
      await expect(app.updateManyTasks(input)).rejects.toThrow(NotFoundException);
    });

    it('should update many tasks, log activity, and emit event inside transaction', async () => {
      const oldTasks = [
        { id: 'task-1', workspaceId: 'ws-1', projectId: 'proj-1', statusId: 'status-1', assignees: [] },
        { id: 'task-2', workspaceId: 'ws-1', projectId: 'proj-1', statusId: 'status-1', assignees: [] }
      ];
      const updatedTasks = [
        { id: 'task-1', workspaceId: 'ws-1', projectId: 'proj-1', statusId: 'status-2', assignees: [] },
        { id: 'task-2', workspaceId: 'ws-1', projectId: 'proj-1', statusId: 'status-2', assignees: [] }
      ];
      
      mockFindTaskService.findByIds.mockResolvedValue(oldTasks);
      mockUpdateTaskService.updateManyTasks.mockResolvedValue(updatedTasks);

      await app.updateManyTasks(input);

      expect(mockUpdateTaskService.updateManyTasks).toHaveBeenCalledWith(
        {
          workspaceId: 'ws-1',
          projectId: 'proj-1',
          dto: input.dto,
        }
      );
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(REALTIME_EVENTS.TASK_UPDATED, {
        workspaceId: 'ws-1',
        projectId: 'proj-1',
        task: updatedTasks[0],
      });
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(REALTIME_EVENTS.TASK_UPDATED, {
        workspaceId: 'ws-1',
        projectId: 'proj-1',
        task: updatedTasks[1],
      });
    });
  });
});
