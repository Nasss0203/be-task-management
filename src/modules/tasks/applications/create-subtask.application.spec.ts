import { BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import { ACTIVITY_TYPES } from 'src/modules/activity/interfaces/types';
import { REALTIME_EVENTS } from 'src/modules/realtime/realtime.events';
import { TASK_ASSIGNEE_TYPES } from 'src/modules/task_assignee/interfaces/types';
import { TASK_COMMENT_TYPES } from 'src/modules/task_commnent/interfaces/types';
import { WORKSPACE_TYPES } from 'src/modules/workspaces/interfaces/types';
import { TASK_TYPES } from '../interfaces/types';
import { CreateSubtaskApplicationImpl } from './create-subtask.application';

describe('CreateSubtaskApplicationImpl', () => {
  let app: CreateSubtaskApplicationImpl;

  const mockFindTaskService = { findOneTask: jest.fn() };
  const mockCreateTaskService = { create: jest.fn() };
  const mockCreateTaskAssigneeApplication = { assign: jest.fn() };
  const mockCreateTaskCommentService = { create: jest.fn() };
  const mockCreateActivityService = { create: jest.fn() };
  const mockUnitOfWork = {
    runInTransaction: jest.fn(async (cb) => cb('mockTransactionManager')),
  };
  const mockEventEmitter = { emit: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateSubtaskApplicationImpl,
        {
          provide: TASK_TYPES.services.FindTaskService,
          useValue: mockFindTaskService,
        },
        {
          provide: TASK_TYPES.services.CreateTaskService,
          useValue: mockCreateTaskService,
        },
        {
          provide: TASK_ASSIGNEE_TYPES.applications.CreateTaskAssigneeApplication,
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

    app = module.get<CreateSubtaskApplicationImpl>(
      CreateSubtaskApplicationImpl,
    );
  });

  it('creates a subtask using workspace and project from parent task', async () => {
    const parentTask = {
      id: 'parent-1',
      workspaceId: 'workspace-1',
      projectId: 'project-1',
      sprintId: 'sprint-1',
      parentTaskId: null,
    };
    const createdSubtask = {
      id: 'subtask-1',
      workspaceId: 'workspace-1',
      projectId: 'project-1',
      parentTaskId: 'parent-1',
      sprintId: 'sprint-1',
      title: 'Subtask',
      statusId: 'status-1',
      priorityId: null,
      assignees: [],
      subtasks: [],
    };

    mockFindTaskService.findOneTask.mockResolvedValue(parentTask);
    mockCreateTaskService.create.mockResolvedValue(createdSubtask);

    const result = await app.create({
      parentTaskId: 'parent-1',
      createdBy: 'user-1',
      title: 'Subtask',
      statusId: 'status-1',
      assigneeIds: ['user-2'],
      initialComment: 'First note',
    });

    expect(mockCreateTaskService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceId: 'workspace-1',
        projectId: 'project-1',
        sprintId: 'sprint-1',
        parentTaskId: 'parent-1',
        createdBy: 'user-1',
        skipPosition: true,
      }),
      'mockTransactionManager',
    );
    expect(mockCreateTaskAssigneeApplication.assign).toHaveBeenCalledWith(
      {
        taskId: 'subtask-1',
        userId: 'user-2',
        assignedBy: 'user-1',
      },
      'mockTransactionManager',
    );
    expect(mockCreateTaskCommentService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        taskId: 'subtask-1',
        workspaceId: 'workspace-1',
        projectId: 'project-1',
        content: 'First note',
      }),
      'mockTransactionManager',
    );
    expect(mockEventEmitter.emit).toHaveBeenCalledWith(
      REALTIME_EVENTS.TASK_CREATED,
      expect.objectContaining({
        workspaceId: 'workspace-1',
        projectId: 'project-1',
        task: createdSubtask,
      }),
    );
    expect(result.parentTaskId).toBe('parent-1');
  });

  it('rejects creating a subtask under another subtask', async () => {
    mockFindTaskService.findOneTask.mockResolvedValue({
      id: 'subtask-1',
      parentTaskId: 'parent-1',
    });

    await expect(
      app.create({
        parentTaskId: 'subtask-1',
        createdBy: 'user-1',
        title: 'Nested subtask',
        statusId: 'status-1',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(mockCreateTaskService.create).not.toHaveBeenCalled();
  });
});
