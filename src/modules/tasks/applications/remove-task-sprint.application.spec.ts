import { Test, TestingModule } from '@nestjs/testing';
import { RemoveTaskFromSprintApplicationImpl } from './remove-task-sprint.application';
import { TASK_TYPES } from '../interfaces/types';
import { ACTIVITY_TYPES } from 'src/modules/activity/interfaces/types';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { REALTIME_EVENTS } from 'src/modules/realtime/realtime.events';

describe('RemoveTaskFromSprintApplicationImpl', () => {
  let app: RemoveTaskFromSprintApplicationImpl;

  const mockRemoveTaskFromSprintService = { remove: jest.fn() };
  const mockCreateActivityService = { create: jest.fn() };
  const mockEventEmitter = { emit: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RemoveTaskFromSprintApplicationImpl,
        { provide: TASK_TYPES.services.RemoveTaskFromSprintService, useValue: mockRemoveTaskFromSprintService },
        { provide: ACTIVITY_TYPES.services.CreateActivityService, useValue: mockCreateActivityService },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    app = module.get<RemoveTaskFromSprintApplicationImpl>(RemoveTaskFromSprintApplicationImpl);
  });

  it('should be defined', () => {
    expect(app).toBeDefined();
  });

  describe('remove', () => {
    it('should remove task, create activity, and emit event', async () => {
      const input = {
        taskId: '1',
        workspaceId: 'ws-1',
        projectId: 'proj-1',
        userId: 'user-1',
      };
      
      const mockTask = { id: '1', workspaceId: 'ws-1', projectId: 'proj-1', sprintId: null, assignees: [] };
      mockRemoveTaskFromSprintService.remove.mockResolvedValue(mockTask);

      const result = await app.remove(input);

      expect(mockRemoveTaskFromSprintService.remove).toHaveBeenCalledWith({ taskId: input.taskId });
      expect(mockCreateActivityService.create).toHaveBeenCalled();
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(REALTIME_EVENTS.TASK_UPDATED, {
        workspaceId: mockTask.workspaceId,
        projectId: mockTask.projectId,
        task: mockTask,
      });
      expect(result.id).toEqual(mockTask.id);
    });
  });
});
