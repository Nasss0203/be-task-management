import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TASK_TYPES } from 'src/modules/tasks/interfaces/types';
import { USER_WORKSPACE_TYPES } from 'src/modules/user_workspace/interfaces/types';
import { TASK_COMMENT_TYPES } from '../interfaces/types';
import { FindTaskCommentServiceImpl } from './find.task_commnent.service';

describe('FindTaskCommentServiceImpl', () => {
  let service: FindTaskCommentServiceImpl;

  const mockFindTaskCommentReposiroty = { findByTaskId: jest.fn() };
  const mockFindTaskService = { findOneTask: jest.fn() };
  const mockFindMemberService = { findMemberInWorkspace: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindTaskCommentServiceImpl,
        { provide: TASK_COMMENT_TYPES.repositories.FindTaskCommentReposiroty, useValue: mockFindTaskCommentReposiroty },
        { provide: TASK_TYPES.services.FindTaskService, useValue: mockFindTaskService },
        { provide: USER_WORKSPACE_TYPES.services.FindMemberService, useValue: mockFindMemberService },
      ],
    }).compile();

    service = module.get<FindTaskCommentServiceImpl>(FindTaskCommentServiceImpl);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByTaskId', () => {
    const input = { workspaceId: 'ws-1', projectId: 'proj-1', taskId: 'task-1', userId: 'user-1' };

    it('should throw NotFoundException if task not found', async () => {
      mockFindTaskService.findOneTask.mockResolvedValue(null);
      await expect(service.findByTaskId(input)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if task does not belong to project/workspace', async () => {
      mockFindTaskService.findOneTask.mockResolvedValue({ workspaceId: 'ws-2', projectId: 'proj-1' });
      await expect(service.findByTaskId(input)).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if user is not member of workspace', async () => {
      mockFindTaskService.findOneTask.mockResolvedValue({ workspaceId: 'ws-1', projectId: 'proj-1' });
      mockFindMemberService.findMemberInWorkspace.mockResolvedValue(null);
      await expect(service.findByTaskId(input)).rejects.toThrow(ForbiddenException);
    });

    it('should return comments successfully', async () => {
      mockFindTaskService.findOneTask.mockResolvedValue({ id: 'task-1', workspaceId: 'ws-1', projectId: 'proj-1' });
      mockFindMemberService.findMemberInWorkspace.mockResolvedValue({ id: 'member-1' });
      mockFindTaskCommentReposiroty.findByTaskId.mockResolvedValue([{ id: 'comment-1' }]);

      const result = await service.findByTaskId(input);

      expect(mockFindTaskCommentReposiroty.findByTaskId).toHaveBeenCalledWith('ws-1', 'proj-1', 'task-1');
      expect(result).toEqual([{ id: 'comment-1' }]);
    });
  });
});
