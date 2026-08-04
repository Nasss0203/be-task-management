import { Test, TestingModule } from '@nestjs/testing';
import { CreateTaskPriorityServiceImpl } from './create.task_priority.service';
import { TASK_PRIORITY_TYPES } from '../interfaces/types';

describe('CreateTaskPriorityServiceImpl', () => {
  let service: CreateTaskPriorityServiceImpl;

  const mockCreateTaskPriorityRepository = {
    save: jest.fn(),
    saveMany: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateTaskPriorityServiceImpl,
        {
          provide:
            TASK_PRIORITY_TYPES.repositories.CreateTaskPriorityRepository,
          useValue: mockCreateTaskPriorityRepository,
        },
      ],
    }).compile();

    service = module.get<CreateTaskPriorityServiceImpl>(
      CreateTaskPriorityServiceImpl,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should call save on repository', async () => {
      const dto = { name: 'High' } as any;
      const manager = {} as any;
      mockCreateTaskPriorityRepository.save.mockResolvedValue({
        id: '1',
        name: 'High',
      });

      const result = await service.create(dto, manager);

      expect(mockCreateTaskPriorityRepository.save).toHaveBeenCalledWith(
        dto,
        manager,
      );
      expect(result).toEqual({ id: '1', name: 'High' });
    });
  });

  describe('createMany', () => {
    it('should call saveMany on repository', async () => {
      const dtos = [{ name: 'High' }] as any[];
      const manager = {} as any;
      mockCreateTaskPriorityRepository.saveMany.mockResolvedValue([
        { id: '1', name: 'High' },
      ]);

      const result = await service.createMany(dtos, manager);

      expect(mockCreateTaskPriorityRepository.saveMany).toHaveBeenCalledWith(
        dtos,
        manager,
      );
      expect(result).toEqual([{ id: '1', name: 'High' }]);
    });
  });
});
