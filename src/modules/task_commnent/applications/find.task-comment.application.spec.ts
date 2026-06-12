import { Test, TestingModule } from '@nestjs/testing';
import { TASK_COMMENT_TYPES } from '../interfaces/types';
import { TaskCommentMapper } from '../mapper/task_commnent.mapper';
import { FindTaskCommentApplicationImpl } from './find.task-comment.application';

describe('FindTaskCommentApplicationImpl', () => {
  let application: FindTaskCommentApplicationImpl;

  const mockFindTaskCommentService = { findByTaskId: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindTaskCommentApplicationImpl,
        { provide: TASK_COMMENT_TYPES.services.FindTaskCommentService, useValue: mockFindTaskCommentService },
      ],
    }).compile();

    application = module.get<FindTaskCommentApplicationImpl>(FindTaskCommentApplicationImpl);
  });

  it('should be defined', () => {
    expect(application).toBeDefined();
  });

  describe('findByTaskId', () => {
    it('should return comments mapped to response', async () => {
      const input = { workspaceId: 'ws-1', projectId: 'proj-1', taskId: 'task-1', userId: 'user-1' };
      const comments = [{ id: '1' }, { id: '2' }];
      mockFindTaskCommentService.findByTaskId.mockResolvedValue(comments);

      const originalMapper = TaskCommentMapper.toResponseList;
      TaskCommentMapper.toResponseList = jest.fn().mockReturnValue([{ mapped: true }]);

      const result = await application.findByTaskId(input);

      expect(mockFindTaskCommentService.findByTaskId).toHaveBeenCalledWith(input);
      expect(result).toEqual([{ mapped: true }]);

      TaskCommentMapper.toResponseList = originalMapper;
    });
  });
});
