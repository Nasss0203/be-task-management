import { Test, TestingModule } from '@nestjs/testing';
import { MoveTaskSprintToSprintApplicationImpl } from './move-task-sprint-to-sprint.application';
import { TASK_TYPES } from '../interfaces/types';
import { ACTIVITY_TYPES } from 'src/modules/activity/interfaces/types';
import { WORKSPACE_TYPES } from 'src/modules/workspaces/interfaces/types';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { REALTIME_EVENTS } from 'src/modules/realtime/realtime.events';

describe('MoveTaskSprintToSprintApplicationImpl', () => {
  let app: MoveTaskSprintToSprintApplicationImpl;

  const mockMoveTaskSprintToSprintService = { move: jest.fn() };
  const mockCreateActivityService = { create: jest.fn() };
  const mockUnitOfWork = { runInTransaction: jest.fn(async (cb) => { return await cb('mockTransactionManager'); }) };
  const mockEventEmitter = { emit: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MoveTaskSprintToSprintApplicationImpl,
        { provide: TASK_TYPES.services.MoveTaskSprintToSprintService, useValue: mockMoveTaskSprintToSprintService },
        { provide: ACTIVITY_TYPES.services.CreateActivityService, useValue: mockCreateActivityService },
        { provide: WORKSPACE_TYPES.uow.UnitOfWork, useValue: mockUnitOfWork },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    app = module.get<MoveTaskSprintToSprintApplicationImpl>(MoveTaskSprintToSprintApplicationImpl);
  });

  it('should be defined', () => {
    expect(app).toBeDefined();
  });

  describe('move', () => {
    it('should move task, create activity, and emit event inside transaction', async () => {
      const input = {
        taskId: '1',
        workspaceId: 'ws-1',
        projectId: 'proj-1',
        sourceSprintId: 'sprint-1',
        targetSprintId: 'sprint-2',
        userId: 'user-1',
      };
      
      const mockTask = { id: '1', workspaceId: 'ws-1', projectId: 'proj-1', sprintId: 'sprint-2', assignees: [] };
      mockMoveTaskSprintToSprintService.move.mockResolvedValue(mockTask);

      const result = await app.move(input);

      expect(mockUnitOfWork.runInTransaction).toHaveBeenCalled();
      expect(mockMoveTaskSprintToSprintService.move).toHaveBeenCalledWith(input, 'mockTransactionManager');
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
