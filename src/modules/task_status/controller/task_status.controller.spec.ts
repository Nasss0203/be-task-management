import { Test, TestingModule } from '@nestjs/testing';
import { TaskStatusController } from './task_status.controller';
import { TASK_STATUS_TYPES } from '../interfaces/types';
import { TaskStatusService } from '../task_status.service';

describe('TaskStatusController', () => {
  let controller: TaskStatusController;

  const mockTaskStatusService = {};
  const mockFindTaskStatusService = {
    findAllTaskStatus: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TaskStatusController],
      providers: [
        { provide: TaskStatusService, useValue: mockTaskStatusService },
        {
          provide: TASK_STATUS_TYPES.services.FindTaskStatusService,
          useValue: mockFindTaskStatusService,
        },
      ],
    }).compile();

    controller = module.get<TaskStatusController>(TaskStatusController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should call findAllTaskStatus service', async () => {
      mockFindTaskStatusService.findAllTaskStatus.mockResolvedValue([
        { id: 'status-1' },
      ]);

      const result = await controller.findAll('ws-1', 'proj-1');

      expect(mockFindTaskStatusService.findAllTaskStatus).toHaveBeenCalledWith(
        'proj-1',
        'ws-1',
      );
      expect(result).toEqual([{ id: 'status-1' }]);
    });
  });
});
