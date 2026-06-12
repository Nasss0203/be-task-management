import { Test, TestingModule } from '@nestjs/testing';
import { MarkDoneTasksCompletedAtInSprintServiceImpl } from './mark-done-tasks-completed-at-in-sprint.service';
import { TASK_TYPES } from '../interfaces/types';

describe('MarkDoneTasksCompletedAtInSprintServiceImpl', () => {
  let service: MarkDoneTasksCompletedAtInSprintServiceImpl;

  const mockRepo = {
    mark: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MarkDoneTasksCompletedAtInSprintServiceImpl,
        {
          provide: TASK_TYPES.repositories.MarkDoneTasksCompletedAtInSprintRepository,
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<MarkDoneTasksCompletedAtInSprintServiceImpl>(MarkDoneTasksCompletedAtInSprintServiceImpl);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('mark', () => {
    it('should call mark on repository', async () => {
      const input = {
        workspaceId: 'ws-1',
        projectId: 'proj-1',
        sprintId: 'sprint-1',
        doneStatusId: 'done-1',
      };
      const manager = {} as any;

      mockRepo.mark.mockResolvedValue(undefined);

      await service.mark(input, manager);

      expect(mockRepo.mark).toHaveBeenCalledWith(
        expect.objectContaining({
          ...input,
          completedAt: expect.any(Date),
        }),
        manager,
      );
    });

    it('should use provided completedAt if passed', async () => {
      const date = new Date('2023-01-01');
      const input = {
        workspaceId: 'ws-1',
        projectId: 'proj-1',
        sprintId: 'sprint-1',
        doneStatusId: 'done-1',
        completedAt: date,
      };

      await service.mark(input);

      expect(mockRepo.mark).toHaveBeenCalledWith(
        expect.objectContaining({
          completedAt: date,
        }),
        undefined,
      );
    });
  });
});
