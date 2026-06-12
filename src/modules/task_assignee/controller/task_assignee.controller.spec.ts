import { Test, TestingModule } from '@nestjs/testing';
import { TaskAssigneeController } from './task_assignee.controller';
import { TASK_ASSIGNEE_TYPES } from '../interfaces/types';

describe('TaskAssigneeController', () => {
  let controller: TaskAssigneeController;

  const mockCreateTaskAssigneeApplication = {
    assign: jest.fn(),
  };
  const mockDeleteTaskAssigneeApplication = {
    unassign: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TaskAssigneeController],
      providers: [
        {
          provide: TASK_ASSIGNEE_TYPES.applications.CreateTaskAssigneeApplication,
          useValue: mockCreateTaskAssigneeApplication,
        },
        {
          provide: TASK_ASSIGNEE_TYPES.applications.DeleteTaskAssigneeApplication,
          useValue: mockDeleteTaskAssigneeApplication,
        },
      ],
    }).compile();

    controller = module.get<TaskAssigneeController>(TaskAssigneeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('assignTask', () => {
    it('should call assign on application', async () => {
      mockCreateTaskAssigneeApplication.assign.mockResolvedValue({ id: '1' });
      const dto = { taskId: 'task-1', userId: 'user-1' };
      const auth = { id: 'auth-1' } as any;

      const result = await controller.assignTask(dto, auth);

      expect(mockCreateTaskAssigneeApplication.assign).toHaveBeenCalledWith({
        taskId: 'task-1',
        userId: 'user-1',
        assignedBy: 'auth-1',
      });
      expect(result).toEqual({ id: '1' });
    });
    
    it('should fallback userId to auth.id if not provided', async () => {
      mockCreateTaskAssigneeApplication.assign.mockResolvedValue({ id: '1' });
      const dto = { taskId: 'task-1' } as any;
      const auth = { id: 'auth-1' } as any;

      await controller.assignTask(dto, auth);

      expect(mockCreateTaskAssigneeApplication.assign).toHaveBeenCalledWith({
        taskId: 'task-1',
        userId: 'auth-1',
        assignedBy: 'auth-1',
      });
    });
  });

  describe('unassignTask', () => {
    it('should call unassign on application', async () => {
      mockDeleteTaskAssigneeApplication.unassign.mockResolvedValue({ unassigned: true });
      const auth = { id: 'auth-1' } as any;

      const result = await controller.unassignTask('task-1', 'user-1', auth);

      expect(mockDeleteTaskAssigneeApplication.unassign).toHaveBeenCalledWith({
        taskId: 'task-1',
        userId: 'user-1',
        deletedBy: 'auth-1',
      });
      expect(result).toEqual({ unassigned: true });
    });
  });
});
