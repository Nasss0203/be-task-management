import { Test, TestingModule } from '@nestjs/testing';
import { MoveTasksToBacklogBySprintServiceImpl } from './move-tasks-to-backlog-by-sprint.service';
import { TASK_TYPES } from '../interfaces/types';

describe('MoveTasksToBacklogBySprintServiceImpl', () => {
  let service: MoveTasksToBacklogBySprintServiceImpl;

  const mockRepo = {
    move: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MoveTasksToBacklogBySprintServiceImpl,
        {
          provide: TASK_TYPES.repositories.MoveTasksToBacklogBySprintRepository,
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<MoveTasksToBacklogBySprintServiceImpl>(
      MoveTasksToBacklogBySprintServiceImpl,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('move', () => {
    it('should call move on repository', async () => {
      const input = { sprintId: 'sprint-1' } as any;
      const manager = {} as any;

      mockRepo.move.mockResolvedValue(undefined);

      await service.move(input, manager);

      expect(mockRepo.move).toHaveBeenCalledWith(input, manager);
    });
  });
});
