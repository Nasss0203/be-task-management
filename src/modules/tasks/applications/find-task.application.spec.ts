import { Test, TestingModule } from '@nestjs/testing';
import { FindTaskApplicationImpl } from './find-task.application';
import { TASK_TYPES } from '../interfaces/types';

describe('FindTaskApplicationImpl', () => {
  let app: FindTaskApplicationImpl;

  const mockFindTaskService = {
    findAllTask: jest.fn(),
    findBacklogTasks: jest.fn(),
    findOneTask: jest.fn(),
    findDeletedTasks: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindTaskApplicationImpl,
        { provide: TASK_TYPES.services.FindTaskService, useValue: mockFindTaskService },
      ],
    }).compile();

    app = module.get<FindTaskApplicationImpl>(FindTaskApplicationImpl);
  });

  it('should be defined', () => {
    expect(app).toBeDefined();
  });

  describe('findAllTask', () => {
    it('should return mapped tasks', async () => {
      mockFindTaskService.findAllTask.mockResolvedValue({
        data: [{ id: '1', title: 'Task 1', assignees: [] }],
        total: 1,
        page: 1,
        pageSize: 10,
        totalPages: 1,
      });
      const result = await app.findAllTask('proj-1', 'ws-1');
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(10);
      expect(result.totalPages).toBe(1);
      expect(result.data[0]).toEqual(expect.objectContaining({ id: '1', title: 'Task 1', assignees: [] }));
    });
  });

  describe('findBacklogTasks', () => {
    it('should return paginated mapped tasks', async () => {
      mockFindTaskService.findBacklogTasks.mockResolvedValue({
        data: [{ id: '1', title: 'Task 1', assignees: [] }],
        total: 1,
        page: 1,
        pageSize: 10,
        totalPages: 1,
      });

      const result = await app.findBacklogTasks('proj-1', 'ws-1', {} as any);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(10);
      expect(result.totalPages).toBe(1);
      expect(result.data[0]).toEqual(expect.objectContaining({ id: '1', title: 'Task 1', assignees: [] }));
    });
  });

  describe('findOneTask', () => {
    it('should return null if task not found', async () => {
      mockFindTaskService.findOneTask.mockResolvedValue(null);
      const result = await app.findOneTask('1');
      expect(result).toBeNull();
    });

    it('should return mapped task if found', async () => {
      mockFindTaskService.findOneTask.mockResolvedValue({ id: '1', title: 'Task 1', assignees: [] });
      const result = await app.findOneTask('1');
      expect(result).toEqual(expect.objectContaining({ id: '1', title: 'Task 1', assignees: [] }));
    });
  });

  describe('findDeletedTasks', () => {
    it('should return mapped deleted tasks', async () => {
      mockFindTaskService.findDeletedTasks.mockResolvedValue([{ id: '1', title: 'Task 1', assignees: [] }]);
      const result = await app.findDeletedTasks('ws-1', 'proj-1');
      expect(result[0]).toEqual(expect.objectContaining({ id: '1', title: 'Task 1', assignees: [] }));
    });
  });
});
