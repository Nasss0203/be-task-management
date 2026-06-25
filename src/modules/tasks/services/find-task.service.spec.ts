import { Test, TestingModule } from '@nestjs/testing';
import { FindTaskServiceImpl } from './find-task.service';
import { TASK_TYPES } from '../interfaces/types';

describe('FindTaskServiceImpl', () => {
  let service: FindTaskServiceImpl;

  const mockFindTaskRepository = {
    findAllTaskByWorkspace: jest.fn(),
    findAllTask: jest.fn(),
    findOneTask: jest.fn(),
    findByIds: jest.fn(),
    findDeletedTasks: jest.fn(),
    findOneTaskForRestore: jest.fn(),
    findAllBacklogTasks: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindTaskServiceImpl,
        {
          provide: TASK_TYPES.repositories.FindTaskRepository,
          useValue: mockFindTaskRepository,
        },
      ],
    }).compile();

    service = module.get<FindTaskServiceImpl>(FindTaskServiceImpl);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAllTaskByWorkspace', () => {
    it('should call findAllTaskByWorkspace on repo', async () => {
      mockFindTaskRepository.findAllTaskByWorkspace.mockResolvedValue([]);
      const result = await service.findAllTaskByWorkspace('ws-1');
      expect(mockFindTaskRepository.findAllTaskByWorkspace).toHaveBeenCalledWith('ws-1');
      expect(result).toEqual([]);
    });
  });

  describe('findAllTask', () => {
    it('should call findAllTask on repo', async () => {
      mockFindTaskRepository.findAllTask.mockResolvedValue([]);
      const result = await service.findAllTask('proj-1', 'ws-1');
      expect(mockFindTaskRepository.findAllTask).toHaveBeenCalledWith({ projectId: 'proj-1', workspaceId: 'ws-1' }, undefined);
      expect(result).toEqual([]);
    });
  });

  describe('findOneTask', () => {
    it('should call findOneTask on repo', async () => {
      const manager = {} as any;
      mockFindTaskRepository.findOneTask.mockResolvedValue({ id: '1' });
      const result = await service.findOneTask('1', manager);
      expect(mockFindTaskRepository.findOneTask).toHaveBeenCalledWith('1', manager);
      expect(result).toEqual({ id: '1' });
    });
  });

  describe('findByIds', () => {
    it('should call findByIds on repo', async () => {
      const manager = {} as any;
      mockFindTaskRepository.findByIds.mockResolvedValue([{ id: '1' }]);
      const result = await service.findByIds(['1'], manager);
      expect(mockFindTaskRepository.findByIds).toHaveBeenCalledWith(['1'], manager);
      expect(result).toEqual([{ id: '1' }]);
    });
  });

  describe('findDeletedTasks', () => {
    it('should call findDeletedTasks on repo', async () => {
      mockFindTaskRepository.findDeletedTasks.mockResolvedValue([]);
      const result = await service.findDeletedTasks('ws-1', 'proj-1');
      expect(mockFindTaskRepository.findDeletedTasks).toHaveBeenCalledWith('ws-1', 'proj-1');
      expect(result).toEqual([]);
    });
  });

  describe('findOneTaskForRestore', () => {
    it('should call findOneTaskForRestore on repo', async () => {
      mockFindTaskRepository.findOneTaskForRestore.mockResolvedValue({ id: '1' });
      const result = await service.findOneTaskForRestore('ws-1', '1');
      expect(mockFindTaskRepository.findOneTaskForRestore).toHaveBeenCalledWith('ws-1', '1');
      expect(result).toEqual({ id: '1' });
    });
  });

  describe('findBacklogTasks', () => {
    it('should call findAllBacklogTasks on repo', async () => {
      const filters = {} as any;
      const manager = {} as any;
      mockFindTaskRepository.findAllBacklogTasks.mockResolvedValue({ items: [], meta: {} });
      const result = await service.findBacklogTasks('proj-1', 'ws-1', filters, manager);
      expect(mockFindTaskRepository.findAllBacklogTasks).toHaveBeenCalledWith('proj-1', 'ws-1', filters, manager);
      expect(result).toEqual({ items: [], meta: {} });
    });
  });
});
