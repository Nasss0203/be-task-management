import { Test, TestingModule } from '@nestjs/testing';
import {
  ActivityAction,
  ActivityEntityType,
} from 'src/modules/activity/domain/entities/activity.entity';
import { ACTIVITY_TYPES } from 'src/modules/activity/interfaces/types';
import { TASK_COMMENT_TYPES } from '../interfaces/types';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TaskCommentMapper } from '../mapper/task_commnent.mapper';
import { CreateTaskCommentApplicationImpl } from './create.task-comment.application';

describe('CreateTaskCommentApplicationImpl', () => {
  let application: CreateTaskCommentApplicationImpl;

  const mockCreateTaskCommentService = { create: jest.fn() };
  const mockCreateActivityService = { create: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateTaskCommentApplicationImpl,
        {
          provide: TASK_COMMENT_TYPES.services.CreateTaskCommentService,
          useValue: mockCreateTaskCommentService,
        },
        {
          provide: ACTIVITY_TYPES.services.CreateActivityService,
          useValue: mockCreateActivityService,
        },
        {
          provide: EventEmitter2,
          useValue: { emitAsync: jest.fn(), emit: jest.fn() },
        },
      ],
    }).compile();

    application = module.get<CreateTaskCommentApplicationImpl>(
      CreateTaskCommentApplicationImpl,
    );
  });

  it('should be defined', () => {
    expect(application).toBeDefined();
  });

  describe('create', () => {
    it('should create comment and activity successfully', async () => {
      const input = {
        workspaceId: 'ws-1',
        projectId: 'proj-1',
        taskId: 'task-1',
        userId: 'user-1',
        content: 'test comment',
      };
      const comment = {
        id: 'comment-1',
        workspaceId: 'ws-1',
        projectId: 'proj-1',
        taskId: 'task-1',
        authorId: 'user-1',
        content: 'test comment',
      };

      mockCreateTaskCommentService.create.mockResolvedValue(comment);

      const originalMapper = TaskCommentMapper.toResponse;
      TaskCommentMapper.toResponse = jest
        .fn()
        .mockReturnValue({ id: 'comment-1', mapped: true });

      const result = await application.create(input);

      expect(mockCreateTaskCommentService.create).toHaveBeenCalledWith({
        workspaceId: input.workspaceId,
        projectId: input.projectId,
        taskId: input.taskId,
        authorId: input.userId,
        content: input.content,
      });

      expect(mockCreateActivityService.create).toHaveBeenCalledWith({
        workspaceId: comment.workspaceId,
        projectId: comment.projectId,
        entityType: ActivityEntityType.COMMENT,
        entityId: comment.id,
        actorId: input.userId,
        action: ActivityAction.COMMENT_CREATED,
        metadata: {
          taskId: comment.taskId,
        },
      });

      expect(result).toEqual({ id: 'comment-1', mapped: true });

      TaskCommentMapper.toResponse = originalMapper;
    });
  });
});
