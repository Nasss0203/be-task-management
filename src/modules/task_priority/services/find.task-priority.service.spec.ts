import { Test, TestingModule } from '@nestjs/testing';
import { FindTaskPriorityServiceImpl } from './find.task-priority.service';
import { TASK_PRIORITY_TYPES } from '../interfaces/types';

describe('FindTaskPriorityServiceImpl', () => {
  let service: FindTaskPriorityServiceImpl;

  const mockFindTaskPriorityRepository = {
    findAllTaskPriority: jest.fn(),
    findDonePriority: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindTaskPriorityServiceImpl,
        {
          provide: TASK_PRIORITY_TYPES.repositories.FindTaskPriorityRepository,
          useValue: mockFindTaskPriorityRepository,
        },
      ],
    }).compile();

    service = module.get<FindTaskPriorityServiceImpl>(
      FindTaskPriorityServiceImpl,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAllTaskPriority', () => {
    it('should call findAllTaskPriority on repository', async () => {
      const manager = {} as any;
      mockFindTaskPriorityRepository.findAllTaskPriority.mockResolvedValue([
        { id: '1' },
      ]);

      const result = await service.findAllTaskPriority(
        'proj-1',
        'ws-1',
        manager,
      );

      expect(
        mockFindTaskPriorityRepository.findAllTaskPriority,
      ).toHaveBeenCalledWith('proj-1', 'ws-1', manager);
      expect(result).toEqual([{ id: '1' }]);
    });
  });

  describe('findDonePriority', () => {
    it('should call findDonePriority on repository', async () => {
      const manager = {} as any;
      mockFindTaskPriorityRepository.findDonePriority.mockResolvedValue({
        id: '1',
      });

      const result = await service.findDonePriority('proj-1', 'ws-1', manager);

      expect(
        mockFindTaskPriorityRepository.findDonePriority,
      ).toHaveBeenCalledWith('proj-1', 'ws-1', manager);
      expect(result).toEqual({ id: '1' });
    });
  });
});
