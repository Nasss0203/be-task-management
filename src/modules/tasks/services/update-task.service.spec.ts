import { Test, TestingModule } from '@nestjs/testing';
import { UpdateTaskServiceImpl } from './update-task.service';
import { TASK_TYPES } from '../interfaces/types';

describe('UpdateTaskServiceImpl', () => {
  let service: UpdateTaskServiceImpl;

  const mockUpdateTaskRepository = {
    updateTask: jest.fn(),
    updateManyTasks: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateTaskServiceImpl,
        {
          provide: TASK_TYPES.repositories.UpdateTaskRepository,
          useValue: mockUpdateTaskRepository,
        },
      ],
    }).compile();

    service = module.get<UpdateTaskServiceImpl>(UpdateTaskServiceImpl);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('updateTask', () => {
    it('should call updateTask on repository', async () => {
      const dto = {} as any;
      const manager = {} as any;

      mockUpdateTaskRepository.updateTask.mockResolvedValue({ id: '1' });

      const result = await service.updateTask(dto, manager);

      expect(mockUpdateTaskRepository.updateTask).toHaveBeenCalledWith(dto, manager);
      expect(result).toEqual({ id: '1' });
    });
  });

  describe('updateManyTasks', () => {
    it('should call updateManyTasks on repository', async () => {
      const input = { workspaceId: 'ws-1', projectId: 'proj-1', dto: {} } as any;
      const manager = {} as any;

      mockUpdateTaskRepository.updateManyTasks.mockResolvedValue([{ id: '1' }]);

      const result = await service.updateManyTasks(input, manager);

      expect(mockUpdateTaskRepository.updateManyTasks).toHaveBeenCalledWith(input, manager);
      expect(result).toEqual([{ id: '1' }]);
    });
  });
});
