import { Test, TestingModule } from '@nestjs/testing';
import { TaskCommnentController } from './task_commnent.controller';
import { TASK_COMMENT_TYPES } from '../interfaces/types';

describe('TaskCommnentController', () => {
  let controller: TaskCommnentController;

  const mockCreateTaskCommentApplication = { create: jest.fn() };
  const mockFindTaskCommentApplication = { findByTaskId: jest.fn() };
  const mockUpdateTaskCommentApplication = { update: jest.fn() };
  const mockDeleteTaskCommentApplication = { delete: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TaskCommnentController],
      providers: [
        { provide: TASK_COMMENT_TYPES.applications.CreateTaskCommentApplication, useValue: mockCreateTaskCommentApplication },
        { provide: TASK_COMMENT_TYPES.applications.FindTaskCommentApplication, useValue: mockFindTaskCommentApplication },
        { provide: TASK_COMMENT_TYPES.applications.UpdateTaskCommentApplication, useValue: mockUpdateTaskCommentApplication },
        { provide: TASK_COMMENT_TYPES.applications.DeleteTaskCommentApplication, useValue: mockDeleteTaskCommentApplication },
      ],
    }).compile();

    controller = module.get<TaskCommnentController>(TaskCommnentController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call create on application', async () => {
      mockCreateTaskCommentApplication.create.mockResolvedValue({ id: '1' });
      const auth = { id: 'user-1' } as any;

      const result = await controller.create('ws-1', 'proj-1', 'task-1', { content: 'test' }, auth);

      expect(mockCreateTaskCommentApplication.create).toHaveBeenCalledWith({
        workspaceId: 'ws-1',
        projectId: 'proj-1',
        taskId: 'task-1',
        userId: 'user-1',
        content: 'test',
      });
      expect(result).toEqual({ id: '1' });
    });
  });

  describe('findByTaskId', () => {
    it('should call findByTaskId on application', async () => {
      mockFindTaskCommentApplication.findByTaskId.mockResolvedValue([{ id: '1' }]);
      const auth = { id: 'user-1' } as any;

      const result = await controller.findByTaskId('ws-1', 'proj-1', 'task-1', auth);

      expect(mockFindTaskCommentApplication.findByTaskId).toHaveBeenCalledWith({
        workspaceId: 'ws-1',
        projectId: 'proj-1',
        taskId: 'task-1',
        userId: 'user-1',
      });
      expect(result).toEqual([{ id: '1' }]);
    });
  });
});
