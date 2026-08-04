import { Test, TestingModule } from '@nestjs/testing';
import { TaskPriorityController } from './task_priority.controller';
import { TASK_PRIORITY_TYPES } from '../interfaces/types';

describe('TaskPriorityController', () => {
  let controller: TaskPriorityController;

  const mockFindTaskPriorityApplication = {
    findAllTaskPriority: jest.fn(),
    findDonePriority: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TaskPriorityController],
      providers: [
        {
          provide: TASK_PRIORITY_TYPES.applications.FindTaskPriorityApplication,
          useValue: mockFindTaskPriorityApplication,
        },
      ],
    }).compile();

    controller = module.get<TaskPriorityController>(TaskPriorityController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAllTaskPriority', () => {
    it('should call findAllTaskPriority on application', async () => {
      mockFindTaskPriorityApplication.findAllTaskPriority.mockResolvedValue([
        { id: '1' },
      ]);
      const result = await controller.findAllTaskPriority('ws-1', 'proj-1');
      expect(
        mockFindTaskPriorityApplication.findAllTaskPriority,
      ).toHaveBeenCalledWith('proj-1', 'ws-1');
      expect(result).toEqual([{ id: '1' }]);
    });
  });

  describe('findDonePriority', () => {
    it('should call findDonePriority on application', async () => {
      mockFindTaskPriorityApplication.findDonePriority.mockResolvedValue({
        id: '1',
      });
      const result = await controller.findDonePriority('ws-1', 'proj-1');
      expect(
        mockFindTaskPriorityApplication.findDonePriority,
      ).toHaveBeenCalledWith('proj-1', 'ws-1');
      expect(result).toEqual({ id: '1' });
    });
  });
});
