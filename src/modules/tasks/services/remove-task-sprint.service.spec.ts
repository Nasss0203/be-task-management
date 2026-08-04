import { Test, TestingModule } from '@nestjs/testing';
import { RemoveTaskFromSprintServiceImpl } from './remove-task-sprint.service';
import { TASK_TYPES } from '../interfaces/types';
import { SPRINT_TYPES } from 'src/modules/sprints/interfaces/types';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('RemoveTaskFromSprintServiceImpl', () => {
  let service: RemoveTaskFromSprintServiceImpl;

  const mockFindTaskRepository = {
    findOneTask: jest.fn(),
  };

  const mockMoveTaskSprintRepository = {
    moveTaskToSprint: jest.fn(),
  };

  const mockFindSprintRepository = {
    // not used directly in logic but injected
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RemoveTaskFromSprintServiceImpl,
        {
          provide: TASK_TYPES.repositories.FindTaskRepository,
          useValue: mockFindTaskRepository,
        },
        {
          provide: TASK_TYPES.repositories.MoveTaskSprintRepository,
          useValue: mockMoveTaskSprintRepository,
        },
        {
          provide: SPRINT_TYPES.repositories.FindSprintRepository,
          useValue: mockFindSprintRepository,
        },
      ],
    }).compile();

    service = module.get<RemoveTaskFromSprintServiceImpl>(
      RemoveTaskFromSprintServiceImpl,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('remove', () => {
    it('should throw NotFoundException if task not found', async () => {
      mockFindTaskRepository.findOneTask.mockResolvedValue(null);
      await expect(service.remove({ taskId: '1' } as any)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if task has no sprint (already in backlog)', async () => {
      mockFindTaskRepository.findOneTask.mockResolvedValue({
        id: '1',
        sprintId: null,
      });
      await expect(service.remove({ taskId: '1' } as any)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should call moveTaskToSprint with null and return updated task', async () => {
      const manager = {} as any;
      mockFindTaskRepository.findOneTask.mockResolvedValue({
        id: '1',
        sprintId: 'sprint-1',
      });
      mockMoveTaskSprintRepository.moveTaskToSprint.mockResolvedValue({
        id: '1',
        sprintId: null,
      });

      const result = await service.remove({ taskId: '1' } as any, manager);

      expect(
        mockMoveTaskSprintRepository.moveTaskToSprint,
      ).toHaveBeenCalledWith('1', null, manager);
      expect(result).toEqual({ id: '1', sprintId: null });
    });

    it('should throw NotFoundException if moveTaskToSprint returns null', async () => {
      mockFindTaskRepository.findOneTask.mockResolvedValue({
        id: '1',
        sprintId: 'sprint-1',
      });
      mockMoveTaskSprintRepository.moveTaskToSprint.mockResolvedValue(null);

      await expect(service.remove({ taskId: '1' } as any)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
