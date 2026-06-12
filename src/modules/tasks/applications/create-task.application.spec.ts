import { Test, TestingModule } from '@nestjs/testing';
import { CreateTaskApplicationImpl } from './create-task.application';
import { TASK_TYPES } from '../interfaces/types';
import { TASK_ASSIGNEE_TYPES } from 'src/modules/task_assignee/interfaces/types';
import { TASK_COMMENT_TYPES } from 'src/modules/task_commnent/interfaces/types';
import { ACTIVITY_TYPES } from 'src/modules/activity/interfaces/types';
import { WORKSPACE_TYPES } from 'src/modules/workspaces/interfaces/types';
import { ActivityAction, ActivityEntityType } from 'src/modules/activity/domain/entities/activity.entity';

describe('CreateTaskApplicationImpl', () => {
  let app: CreateTaskApplicationImpl;

  const mockCreateTaskService = { create: jest.fn() };
  const mockCreateTaskAssigneeApplication = { assign: jest.fn() };
  const mockCreateTaskCommentService = { create: jest.fn() };
  const mockCreateActivityService = { create: jest.fn() };
  const mockUnitOfWork = { runInTransaction: jest.fn((cb) => cb({})) };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateTaskApplicationImpl,
        { provide: TASK_TYPES.services.CreateTaskService, useValue: mockCreateTaskService },
        { provide: TASK_ASSIGNEE_TYPES.applications.CreateTaskAssigneeApplication, useValue: mockCreateTaskAssigneeApplication },
        { provide: TASK_COMMENT_TYPES.services.CreateTaskCommentService, useValue: mockCreateTaskCommentService },
        { provide: ACTIVITY_TYPES.services.CreateActivityService, useValue: mockCreateActivityService },
        { provide: WORKSPACE_TYPES.uow.UnitOfWork, useValue: mockUnitOfWork },
      ],
    }).compile();

    app = module.get<CreateTaskApplicationImpl>(CreateTaskApplicationImpl);
  });

  it('should be defined', () => {
    expect(app).toBeDefined();
  });

  describe('create', () => {
    it('should create task, log activity, assign users, and add initial comment', async () => {
      const dto = {
        workspaceId: 'ws-1',
        projectId: 'proj-1',
        title: 'Task 1',
        createdBy: 'user-1',
        assigneeIds: ['user-2', 'user-2'], // testing uniqueness
        initialComment: '   first comment   ',
      } as any;

      const createdTask = {
        id: 'task-1',
        workspaceId: 'ws-1',
        projectId: 'proj-1',
        title: 'Task 1',
        statusId: 'status-1',
        priorityId: 'priority-1',
        sprintId: 'sprint-1',
        assignees: [],
      };

      mockCreateTaskService.create.mockResolvedValue(createdTask);

      const result = await app.create(dto);

      expect(mockCreateTaskService.create).toHaveBeenCalledWith(
        expect.objectContaining({ workspaceId: 'ws-1', title: 'Task 1' }),
        expect.anything(),
      );

      expect(mockCreateActivityService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          workspaceId: 'ws-1',
          projectId: 'proj-1',
          entityType: ActivityEntityType.TASK,
          entityId: 'task-1',
          actorId: 'user-1',
          action: ActivityAction.TASK_CREATED,
        }),
        expect.anything(),
      );

      // Should only assign unique user-2 once
      expect(mockCreateTaskAssigneeApplication.assign).toHaveBeenCalledTimes(1);
      expect(mockCreateTaskAssigneeApplication.assign).toHaveBeenCalledWith(
        { taskId: 'task-1', userId: 'user-2', assignedBy: 'user-1' },
        expect.anything(),
      );

      expect(mockCreateTaskCommentService.create).toHaveBeenCalledWith(
        {
          taskId: 'task-1',
          workspaceId: 'ws-1',
          projectId: 'proj-1',
          content: 'first comment', // trimmed
          authorId: 'user-1',
        },
        expect.anything(),
      );

      expect(result.id).toEqual('task-1');
    });

    it('should not add comment if initialComment is empty', async () => {
      const dto = {
        workspaceId: 'ws-1',
        projectId: 'proj-1',
        title: 'Task 1',
        createdBy: 'user-1',
      } as any;

      mockCreateTaskService.create.mockResolvedValue({ id: 'task-1', assignees: [] });

      await app.create(dto);

      expect(mockCreateTaskCommentService.create).not.toHaveBeenCalled();
    });
  });
});
