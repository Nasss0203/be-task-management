import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TASK_TYPES } from 'src/modules/tasks/interfaces/types';
import { USER_WORKSPACE_TYPES } from 'src/modules/user_workspace/interfaces/types';
import { TASK_COMMENT_TYPES } from '../interfaces/types';
import { CreateTaskCommentServiceImpl } from './create.task_commnent.service';

describe('CreateTaskCommentServiceImpl', () => {
  let service: CreateTaskCommentServiceImpl;

  const mockCreateTaskCommentRepository = { create: jest.fn() };
  const mockFindTaskService = { findOneTask: jest.fn() };
  const mockFindMemberService = { findMemberInWorkspace: jest.fn() };
  const mockFindTaskCommentReposiroty = { findById: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateTaskCommentServiceImpl,
        {
          provide: TASK_COMMENT_TYPES.repositories.CreateTaskCommentRepository,
          useValue: mockCreateTaskCommentRepository,
        },
        {
          provide: TASK_COMMENT_TYPES.repositories.FindTaskCommentReposiroty,
          useValue: mockFindTaskCommentReposiroty,
        },
        {
          provide: TASK_TYPES.services.FindTaskService,
          useValue: mockFindTaskService,
        },
        {
          provide: USER_WORKSPACE_TYPES.services.FindMemberService,
          useValue: mockFindMemberService,
        },
      ],
    }).compile();

    service = module.get<CreateTaskCommentServiceImpl>(
      CreateTaskCommentServiceImpl,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const input = {
      workspaceId: 'ws-1',
      projectId: 'proj-1',
      taskId: 'task-1',
      authorId: 'user-1',
      content: 'test comment',
    };
    const manager = {} as any;

    it('should throw NotFoundException if task not found', async () => {
      mockFindTaskService.findOneTask.mockResolvedValue(null);
      await expect(service.create(input, manager)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if task does not belong to project/workspace', async () => {
      mockFindTaskService.findOneTask.mockResolvedValue({
        workspaceId: 'ws-2',
        projectId: 'proj-1',
      });
      await expect(service.create(input, manager)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw ForbiddenException if user is not member of workspace', async () => {
      mockFindTaskService.findOneTask.mockResolvedValue({
        workspaceId: 'ws-1',
        projectId: 'proj-1',
      });
      mockFindMemberService.findMemberInWorkspace.mockResolvedValue(null);
      await expect(service.create(input, manager)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should create comment successfully', async () => {
      mockFindTaskService.findOneTask.mockResolvedValue({
        id: 'task-1',
        workspaceId: 'ws-1',
        projectId: 'proj-1',
      });
      mockFindMemberService.findMemberInWorkspace.mockResolvedValue({
        id: 'member-1',
      });
      mockCreateTaskCommentRepository.create.mockResolvedValue({
        id: 'comment-1',
      });
      mockFindTaskCommentReposiroty.findById.mockResolvedValue({
        id: 'comment-1',
      });

      const result = await service.create(input, manager);

      expect(mockCreateTaskCommentRepository.create).toHaveBeenCalledWith(
        {
          workspaceId: 'ws-1',
          projectId: 'proj-1',
          taskId: 'task-1',
          authorId: 'user-1',
          content: 'test comment',
          isEdited: false,
        },
        manager,
      );
      expect(result).toEqual({ id: 'comment-1' });
    });
  });
});
