import { Test, TestingModule } from '@nestjs/testing';
import { CreateTaskServiceImpl } from './create-tasks.service';
import { TASK_TYPES } from '../interfaces/types';

describe('CreateTaskServiceImpl', () => {
  let service: CreateTaskServiceImpl;

  const mockCreateTaskRepository = {
    getNextProjectSeq: jest.fn(),
    save: jest.fn(),
    saveMany: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateTaskServiceImpl,
        {
          provide: TASK_TYPES.repositories.CreateTaskRepository,
          useValue: mockCreateTaskRepository,
        },
      ],
    }).compile();

    service = module.get<CreateTaskServiceImpl>(CreateTaskServiceImpl);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should calculate next seq and call save on repo', async () => {
      const manager = {} as any;
      const input = {
        workspaceId: 'ws-1',
        projectId: 'proj-1',
        title: 'Task 1',
        statusId: 'status-1',
        createdBy: 'user-1',
      } as any;

      mockCreateTaskRepository.getNextProjectSeq.mockResolvedValue(5);
      mockCreateTaskRepository.save.mockResolvedValue({ id: 'task-1' });

      const result = await service.create(input, manager);

      expect(mockCreateTaskRepository.getNextProjectSeq).toHaveBeenCalledWith('ws-1', 'proj-1', manager);
      expect(mockCreateTaskRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          workspaceId: 'ws-1',
          projectId: 'proj-1',
          projectSeq: 5,
          title: 'Task 1',
          statusId: 'status-1',
          createdBy: 'user-1',
          completedAt: null,
        }),
        manager,
      );
      expect(result).toEqual({ id: 'task-1' });
    });
  });

  describe('createMany', () => {
    it('should call saveMany on repo', async () => {
      const manager = {} as any;
      const inputs = [
        {
          workspaceId: 'ws-1',
          projectId: 'proj-1',
          title: 'Task 1',
          statusId: 'status-1',
          createdBy: 'user-1',
        },
      ] as any;

      mockCreateTaskRepository.saveMany.mockResolvedValue([{ id: 'task-1' }]);

      const result = await service.createMany(inputs, manager);

      expect(mockCreateTaskRepository.saveMany).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            title: 'Task 1',
            projectSeq: 1, // Fallback to 1 if not provided
          }),
        ]),
        manager,
      );
      expect(result).toEqual([{ id: 'task-1' }]);
    });
  });
});
