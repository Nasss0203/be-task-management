import { Test, TestingModule } from '@nestjs/testing';
import { DeleteTaskServiceImpl } from './delete-task.service';
import { TASK_TYPES } from '../interfaces/types';

describe('DeleteTaskServiceImpl', () => {
  let service: DeleteTaskServiceImpl;

  const mockDeleteTaskRepository = {
    softDeleteTask: jest.fn(),
    restoreTask: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteTaskServiceImpl,
        {
          provide: TASK_TYPES.repositories.DeleteTaskRepository,
          useValue: mockDeleteTaskRepository,
        },
      ],
    }).compile();

    service = module.get<DeleteTaskServiceImpl>(DeleteTaskServiceImpl);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('softDeleteTask', () => {
    it('should call softDeleteTask on repository', async () => {
      const input = { taskId: '1', deletedBy: 'user-1' };
      const manager = {} as any;

      mockDeleteTaskRepository.softDeleteTask.mockResolvedValue(undefined);

      await service.softDeleteTask(input, manager);

      expect(mockDeleteTaskRepository.softDeleteTask).toHaveBeenCalledWith(
        input,
        manager,
      );
    });
  });

  describe('restoreTask', () => {
    it('should call restoreTask on repository', async () => {
      const input = { taskId: '1' };
      const manager = {} as any;

      mockDeleteTaskRepository.restoreTask.mockResolvedValue(undefined);

      await service.restoreTask(input, manager);

      expect(mockDeleteTaskRepository.restoreTask).toHaveBeenCalledWith(
        input,
        manager,
      );
    });
  });
});
