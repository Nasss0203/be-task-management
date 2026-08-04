import { Test, TestingModule } from '@nestjs/testing';
import { FindTaskPriorityApplicationImpl } from './find.task-priority.application';
import { TASK_PRIORITY_TYPES } from '../interfaces/types';
import { TaskPriorityMapper } from '../mapper/task_priority.mapper';

describe('FindTaskPriorityApplicationImpl', () => {
  let application: FindTaskPriorityApplicationImpl;

  const mockFindTaskPriorityService = {
    findAllTaskPriority: jest.fn(),
    findDonePriority: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindTaskPriorityApplicationImpl,
        {
          provide: TASK_PRIORITY_TYPES.services.FindTaskPriorityService,
          useValue: mockFindTaskPriorityService,
        },
      ],
    }).compile();

    application = module.get<FindTaskPriorityApplicationImpl>(
      FindTaskPriorityApplicationImpl,
    );
  });

  it('should be defined', () => {
    expect(application).toBeDefined();
  });

  describe('findAllTaskPriority', () => {
    it('should return mapped priorities', async () => {
      const mockPriorities = [{ id: '1', name: 'High' }];
      mockFindTaskPriorityService.findAllTaskPriority.mockResolvedValue(
        mockPriorities,
      );

      const originalToResponse = TaskPriorityMapper.toResponse;
      TaskPriorityMapper.toResponse = jest.fn(
        (val) => ({ ...val, isMapped: true }) as any,
      );

      const result = await application.findAllTaskPriority('proj-1', 'ws-1');

      expect(
        mockFindTaskPriorityService.findAllTaskPriority,
      ).toHaveBeenCalledWith('proj-1', 'ws-1');
      expect(result).toEqual([{ id: '1', name: 'High', isMapped: true }]);

      TaskPriorityMapper.toResponse = originalToResponse;
    });
  });

  describe('findDonePriority', () => {
    it('should return mapped priority if found', async () => {
      const mockPriority = { id: '1', name: 'Done' };
      mockFindTaskPriorityService.findDonePriority.mockResolvedValue(
        mockPriority,
      );

      const originalToResponse = TaskPriorityMapper.toResponse;
      TaskPriorityMapper.toResponse = jest.fn(
        (val) => ({ ...val, isMapped: true }) as any,
      );

      const result = await application.findDonePriority('proj-1', 'ws-1');

      expect(mockFindTaskPriorityService.findDonePriority).toHaveBeenCalledWith(
        'proj-1',
        'ws-1',
      );
      expect(result).toEqual({ id: '1', name: 'Done', isMapped: true });

      TaskPriorityMapper.toResponse = originalToResponse;
    });

    it('should return null if not found', async () => {
      mockFindTaskPriorityService.findDonePriority.mockResolvedValue(null);
      const result = await application.findDonePriority('proj-1', 'ws-1');
      expect(result).toBeNull();
    });
  });
});
