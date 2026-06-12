import { Test, TestingModule } from '@nestjs/testing';
import { DeleteTaskAssigneeServiceImpl } from './delete.task_assignee.service';
import { TASK_ASSIGNEE_TYPES } from '../interfaces/types';

describe('DeleteTaskAssigneeServiceImpl', () => {
  let service: DeleteTaskAssigneeServiceImpl;

  const mockDeleteTaskAssigneeRepository = {
    deleteByTaskAndUser: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteTaskAssigneeServiceImpl,
        {
          provide: TASK_ASSIGNEE_TYPES.repositories.DeleteTaskAssigneeRepository,
          useValue: mockDeleteTaskAssigneeRepository,
        },
      ],
    }).compile();

    service = module.get<DeleteTaskAssigneeServiceImpl>(DeleteTaskAssigneeServiceImpl);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('unassign', () => {
    it('should call deleteByTaskAndUser on repository', async () => {
      const input = { taskId: 'task-1', userId: 'user-1', deletedBy: 'user-2' };
      const manager = {} as any;

      await service.unassign(input);

      expect(mockDeleteTaskAssigneeRepository.deleteByTaskAndUser).toHaveBeenCalledWith('task-1', 'user-1');
    });
  });
});
