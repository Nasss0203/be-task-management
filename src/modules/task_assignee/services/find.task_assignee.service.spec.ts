import { Test, TestingModule } from '@nestjs/testing';
import { FindTaskAssigneeServiceImpl } from './find.task_assignee.service';
import { TASK_ASSIGNEE_TYPES } from '../interfaces/types';

describe('FindTaskAssigneeServiceImpl', () => {
  let service: FindTaskAssigneeServiceImpl;

  const mockFindTaskAssigneeRepository = {
    findOneTaskAssignee: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindTaskAssigneeServiceImpl,
        {
          provide: TASK_ASSIGNEE_TYPES.repositories.FindTaskAssigneeRepository,
          useValue: mockFindTaskAssigneeRepository,
        },
      ],
    }).compile();

    service = module.get<FindTaskAssigneeServiceImpl>(FindTaskAssigneeServiceImpl);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOneTaskAssignee', () => {
    it('should call findOneTaskAssignee on repository', async () => {
      const manager = {} as any;
      mockFindTaskAssigneeRepository.findOneTaskAssignee.mockResolvedValue({ id: '1' });

      const result = await service.findOneTaskAssignee('task-1', 'user-1', manager);

      expect(mockFindTaskAssigneeRepository.findOneTaskAssignee).toHaveBeenCalledWith('task-1', 'user-1', manager);
      expect(result).toEqual({ id: '1' });
    });
  });
});
