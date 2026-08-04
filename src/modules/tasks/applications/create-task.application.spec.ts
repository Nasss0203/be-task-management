import { Test, TestingModule } from '@nestjs/testing';
import { CreateTaskApplicationImpl } from './create-task.application';
import { TASK_TYPES } from '../interfaces/types';
import { ACTIVITY_TYPES } from 'src/modules/activity/interfaces/types';
import { WORKSPACE_TYPES } from 'src/modules/workspaces/interfaces/types';
import { TASK_ASSIGNEE_TYPES } from 'src/modules/task_assignee/interfaces/types';
import { TASK_COMMENT_TYPES } from 'src/modules/task_commnent/interfaces/types';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { REALTIME_EVENTS } from 'src/modules/realtime/realtime.events';

describe('CreateTaskApplicationImpl', () => {
  let app: CreateTaskApplicationImpl;

  const mockCreateTaskService = { create: jest.fn() };
  const mockCreateTaskAssigneeApplication = { assign: jest.fn() };
  const mockCreateTaskCommentService = { create: jest.fn() };
  const mockCreateActivityService = { create: jest.fn() };
  const mockUnitOfWork = {
    runInTransaction: jest.fn(async (cb) => {
      return await cb('mockTransactionManager');
    }),
  };
  const mockEventEmitter = { emit: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateTaskApplicationImpl,
        {
          provide: TASK_TYPES.services.CreateTaskService,
          useValue: mockCreateTaskService,
        },
        {
          provide:
            TASK_ASSIGNEE_TYPES.applications.CreateTaskAssigneeApplication,
          useValue: mockCreateTaskAssigneeApplication,
        },
        {
          provide: TASK_COMMENT_TYPES.services.CreateTaskCommentService,
          useValue: mockCreateTaskCommentService,
        },
        {
          provide: ACTIVITY_TYPES.services.CreateActivityService,
          useValue: mockCreateActivityService,
        },
        { provide: WORKSPACE_TYPES.uow.UnitOfWork, useValue: mockUnitOfWork },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    app = module.get<CreateTaskApplicationImpl>(CreateTaskApplicationImpl);
  });

  it('should be defined', () => {
    expect(app).toBeDefined();
  });

  describe('create', () => {
    const input = {
      workspaceId: 'ws-1',
      projectId: 'proj-1',
      createdBy: 'user-1',
      title: 'Task 1',
      statusId: 'status-1',
      assigneeIds: ['user-2'],
      initialComment: 'Comment 1',
    };

    const mockTask = {
      id: 'task-1',
      workspaceId: 'ws-1',
      projectId: 'proj-1',
      title: 'Task 1',
      statusId: 'status-1',
      assignees: [],
    };

    it('should create task, assignees, comment, activity, and emit event inside transaction', async () => {
      mockCreateTaskService.create.mockResolvedValue(mockTask);

      const result = await app.create(input);

      expect(mockUnitOfWork.runInTransaction).toHaveBeenCalled();

      expect(mockCreateTaskService.create).toHaveBeenCalledWith(
        {
          workspaceId: 'ws-1',
          projectId: 'proj-1',
          createdBy: 'user-1',
          title: 'Task 1',
          statusId: 'status-1',
        },
        'mockTransactionManager',
      );

      expect(mockCreateActivityService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          entityId: 'task-1',
          actorId: 'user-1',
        }),
        'mockTransactionManager',
      );

      expect(mockCreateTaskAssigneeApplication.assign).toHaveBeenCalledWith(
        {
          taskId: 'task-1',
          userId: 'user-2',
          assignedBy: 'user-1',
        },
        'mockTransactionManager',
      );

      expect(mockCreateTaskCommentService.create).toHaveBeenCalledWith(
        {
          taskId: 'task-1',
          workspaceId: 'ws-1',
          projectId: 'proj-1',
          content: 'Comment 1',
          authorId: 'user-1',
        },
        'mockTransactionManager',
      );

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        REALTIME_EVENTS.TASK_CREATED,
        {
          workspaceId: mockTask.workspaceId,
          projectId: mockTask.projectId,
          task: mockTask,
        },
      );

      expect(result).toBeDefined();
    });
  });
});
