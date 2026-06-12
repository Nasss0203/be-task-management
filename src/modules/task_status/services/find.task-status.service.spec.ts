import { Test, TestingModule } from '@nestjs/testing';
import { FindTaskStatusServiceImpl } from './find.task-status.service';
import { TASK_STATUS_TYPES } from '../interfaces/types';

describe('FindTaskStatusServiceImpl', () => {
  let service: FindTaskStatusServiceImpl;

  const mockFindTaskStatusRepository = {
    findAllTaskStatus: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindTaskStatusServiceImpl,
        {
          provide: TASK_STATUS_TYPES.repositories.FindTaskStatusRepository,
          useValue: mockFindTaskStatusRepository,
        },
      ],
    }).compile();

    service = module.get<FindTaskStatusServiceImpl>(FindTaskStatusServiceImpl);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAllTaskStatus', () => {
    it('should return all task statuses', async () => {
      const manager = {} as any;
      mockFindTaskStatusRepository.findAllTaskStatus.mockResolvedValue([{ id: 'status-1' }]);

      const result = await service.findAllTaskStatus('proj-1', 'ws-1', manager);

      expect(mockFindTaskStatusRepository.findAllTaskStatus).toHaveBeenCalledWith('proj-1', 'ws-1', manager);
      expect(result).toEqual([{ id: 'status-1' }]);
    });
  });
});
