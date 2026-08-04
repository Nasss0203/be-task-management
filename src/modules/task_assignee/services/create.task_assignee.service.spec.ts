import { Test, TestingModule } from '@nestjs/testing';
import { CreateTaskAssigneeServiceImpl } from './create.task_assignee.service';
import { TASK_ASSIGNEE_TYPES } from '../interfaces/types';

describe('CreateTaskAssigneeServiceImpl', () => {
  let service: CreateTaskAssigneeServiceImpl;

  const mockCreateTaskAssigneeRepository = {
    save: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateTaskAssigneeServiceImpl,
        {
          provide:
            TASK_ASSIGNEE_TYPES.repositories.CreateTaskAssigneeRepository,
          useValue: mockCreateTaskAssigneeRepository,
        },
      ],
    }).compile();

    service = module.get<CreateTaskAssigneeServiceImpl>(
      CreateTaskAssigneeServiceImpl,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('assign', () => {
    it('should call save on repository', async () => {
      const input = {
        taskId: 'task-1',
        userId: 'user-1',
        assignedBy: 'user-2',
      };
      const manager = {} as any;
      mockCreateTaskAssigneeRepository.save.mockResolvedValue({ id: '1' });

      const result = await service.assign(input, manager);

      expect(mockCreateTaskAssigneeRepository.save).toHaveBeenCalledWith(
        { taskId: 'task-1', userId: 'user-1', assignedBy: 'user-2' },
        manager,
      );
      expect(result).toEqual({ id: '1' });
    });
  });
});
