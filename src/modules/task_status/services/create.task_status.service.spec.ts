import { Test, TestingModule } from '@nestjs/testing';
import { CreateTaskStatusServiceImpl } from './create.task_status.service';
import { TASK_STATUS_TYPES } from '../interfaces/types';

describe('CreateTaskStatusServiceImpl', () => {
  let service: CreateTaskStatusServiceImpl;

  const mockCreateTaskStatusRepository = {
    save: jest.fn(),
    saveMany: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateTaskStatusServiceImpl,
        {
          provide: TASK_STATUS_TYPES.repositories.CreateTaskStatusRepository,
          useValue: mockCreateTaskStatusRepository,
        },
      ],
    }).compile();

    service = module.get<CreateTaskStatusServiceImpl>(CreateTaskStatusServiceImpl);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should call save on repository', async () => {
      const dto = { name: 'Todo' } as any;
      const manager = {} as any;
      mockCreateTaskStatusRepository.save.mockResolvedValue({ id: '1', name: 'Todo' });

      const result = await service.create(dto, manager);

      expect(mockCreateTaskStatusRepository.save).toHaveBeenCalledWith(dto, manager);
      expect(result).toEqual({ id: '1', name: 'Todo' });
    });
  });

  describe('createMany', () => {
    it('should call saveMany on repository', async () => {
      const dtos = [{ name: 'Todo' }] as any[];
      const manager = {} as any;
      mockCreateTaskStatusRepository.saveMany.mockResolvedValue([{ id: '1', name: 'Todo' }]);

      const result = await service.createMany(dtos, manager);

      expect(mockCreateTaskStatusRepository.saveMany).toHaveBeenCalledWith(dtos, manager);
      expect(result).toEqual([{ id: '1', name: 'Todo' }]);
    });
  });
});
