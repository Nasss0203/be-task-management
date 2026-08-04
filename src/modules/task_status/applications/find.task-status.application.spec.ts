import { Test, TestingModule } from '@nestjs/testing';
import { FindTaskStatusApplicationImpl } from './find.task-status.application';
import { TASK_STATUS_TYPES } from '../interfaces/types';
import { TaskStatusMapper } from '../mapper/task_status.mapper';

describe('FindTaskStatusApplicationImpl', () => {
  let application: FindTaskStatusApplicationImpl;

  const mockFindTaskStatusService = {
    findAllTaskStatus: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindTaskStatusApplicationImpl,
        {
          provide: TASK_STATUS_TYPES.services.FindTaskStatusService,
          useValue: mockFindTaskStatusService,
        },
      ],
    }).compile();

    application = module.get<FindTaskStatusApplicationImpl>(
      FindTaskStatusApplicationImpl,
    );
  });

  it('should be defined', () => {
    expect(application).toBeDefined();
  });

  describe('findAllTaskStatus', () => {
    it('should return mapped task statuses', async () => {
      const mockTaskStatuses = [
        { id: 'status-1', name: 'Todo' },
        { id: 'status-2', name: 'Done' },
      ];
      mockFindTaskStatusService.findAllTaskStatus.mockResolvedValue(
        mockTaskStatuses,
      );

      // We mock the mapper to avoid dealing with the actual implementation detail
      const originalToResponse = TaskStatusMapper.toResponse;
      TaskStatusMapper.toResponse = jest.fn(
        (val) => ({ ...val, isMapped: true }) as any,
      );

      const result = await application.findAllTaskStatus('proj-1', 'ws-1');

      expect(mockFindTaskStatusService.findAllTaskStatus).toHaveBeenCalledWith(
        'proj-1',
        'ws-1',
      );
      expect(result).toEqual([
        { id: 'status-1', name: 'Todo', isMapped: true },
        { id: 'status-2', name: 'Done', isMapped: true },
      ]);

      // Restore mapper
      TaskStatusMapper.toResponse = originalToResponse;
    });
  });
});
