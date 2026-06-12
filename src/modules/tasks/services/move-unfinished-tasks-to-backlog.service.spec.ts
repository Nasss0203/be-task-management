import { Test, TestingModule } from '@nestjs/testing';
import { MoveUnfinishedTasksToBacklogServiceImpl } from './move-unfinished-tasks-to-backlog.service';
import { TASK_TYPES } from '../interfaces/types';

describe('MoveUnfinishedTasksToBacklogServiceImpl', () => {
  let service: MoveUnfinishedTasksToBacklogServiceImpl;

  const mockRepo = {
    move: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MoveUnfinishedTasksToBacklogServiceImpl,
        {
          provide: TASK_TYPES.repositories.MoveUnfinishedTasksToBacklogRepository,
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<MoveUnfinishedTasksToBacklogServiceImpl>(MoveUnfinishedTasksToBacklogServiceImpl);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('move', () => {
    it('should call move on repository and return affected count', async () => {
      const input = { workspaceId: 'ws-1', projectId: 'proj-1', sprintId: 'sprint-1', doneStatusId: 'done-1' };
      const manager = {} as any;

      mockRepo.move.mockResolvedValue(5);

      const result = await service.move(input, manager);

      expect(mockRepo.move).toHaveBeenCalledWith('ws-1', 'proj-1', 'sprint-1', 'done-1', manager);
      expect(result).toBe(5);
    });
  });
});
