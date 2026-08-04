import { Test, TestingModule } from '@nestjs/testing';
import { MoveTaskSprintToSprintServiceImpl } from './move-task-sprint-to-sprint.service';
import { TASK_TYPES } from '../interfaces/types';
import { SPRINT_TYPES } from 'src/modules/sprints/interfaces/types';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { SprintStatus } from 'src/modules/sprints/domain/entities/sprint.entity';

describe('MoveTaskSprintToSprintServiceImpl', () => {
  let service: MoveTaskSprintToSprintServiceImpl;

  const mockFindTaskRepository = {
    findOneTask: jest.fn(),
  };

  const mockFindSprintRepository = {
    findOneSprint: jest.fn(),
  };

  const mockMoveTaskSprintToSprintRepository = {
    move: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MoveTaskSprintToSprintServiceImpl,
        {
          provide: TASK_TYPES.repositories.FindTaskRepository,
          useValue: mockFindTaskRepository,
        },
        {
          provide: SPRINT_TYPES.repositories.FindSprintRepository,
          useValue: mockFindSprintRepository,
        },
        {
          provide: TASK_TYPES.repositories.MoveTaskSprintToSprintRepository,
          useValue: mockMoveTaskSprintToSprintRepository,
        },
      ],
    }).compile();

    service = module.get<MoveTaskSprintToSprintServiceImpl>(
      MoveTaskSprintToSprintServiceImpl,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('move', () => {
    const input = {
      workspaceId: 'ws-1',
      projectId: 'proj-1',
      taskId: '1',
      sourceSprintId: 'sprint-1',
      targetSprintId: 'sprint-2',
    };

    it('should throw BadRequestException if source and target sprint are the same', async () => {
      await expect(
        service.move({ ...input, targetSprintId: 'sprint-1' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if task not found', async () => {
      mockFindTaskRepository.findOneTask.mockResolvedValue(null);
      await expect(service.move(input)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if task workspace does not match', async () => {
      mockFindTaskRepository.findOneTask.mockResolvedValue({
        workspaceId: 'ws-2',
      });
      await expect(service.move(input)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if task project does not match', async () => {
      mockFindTaskRepository.findOneTask.mockResolvedValue({
        workspaceId: 'ws-1',
        projectId: 'proj-2',
      });
      await expect(service.move(input)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if task is not in any sprint', async () => {
      mockFindTaskRepository.findOneTask.mockResolvedValue({
        workspaceId: 'ws-1',
        projectId: 'proj-1',
        sprintId: null,
      });
      await expect(service.move(input)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if task is not in source sprint', async () => {
      mockFindTaskRepository.findOneTask.mockResolvedValue({
        workspaceId: 'ws-1',
        projectId: 'proj-1',
        sprintId: 'sprint-3',
      });
      await expect(service.move(input)).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if source sprint not found', async () => {
      mockFindTaskRepository.findOneTask.mockResolvedValue({
        workspaceId: 'ws-1',
        projectId: 'proj-1',
        sprintId: 'sprint-1',
      });
      mockFindSprintRepository.findOneSprint.mockResolvedValueOnce(null);
      await expect(service.move(input)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if source sprint workspace does not match', async () => {
      mockFindTaskRepository.findOneTask.mockResolvedValue({
        workspaceId: 'ws-1',
        projectId: 'proj-1',
        sprintId: 'sprint-1',
      });
      mockFindSprintRepository.findOneSprint.mockResolvedValueOnce({
        workspaceId: 'ws-2',
      });
      await expect(service.move(input)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if source sprint project does not match', async () => {
      mockFindTaskRepository.findOneTask.mockResolvedValue({
        workspaceId: 'ws-1',
        projectId: 'proj-1',
        sprintId: 'sprint-1',
      });
      mockFindSprintRepository.findOneSprint.mockResolvedValueOnce({
        workspaceId: 'ws-1',
        projectId: 'proj-2',
      });
      await expect(service.move(input)).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if target sprint not found', async () => {
      mockFindTaskRepository.findOneTask.mockResolvedValue({
        workspaceId: 'ws-1',
        projectId: 'proj-1',
        sprintId: 'sprint-1',
      });
      mockFindSprintRepository.findOneSprint.mockResolvedValueOnce({
        workspaceId: 'ws-1',
        projectId: 'proj-1',
      });
      mockFindSprintRepository.findOneSprint.mockResolvedValueOnce(null);
      await expect(service.move(input)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if target sprint workspace does not match', async () => {
      mockFindTaskRepository.findOneTask.mockResolvedValue({
        workspaceId: 'ws-1',
        projectId: 'proj-1',
        sprintId: 'sprint-1',
      });
      mockFindSprintRepository.findOneSprint.mockResolvedValueOnce({
        workspaceId: 'ws-1',
        projectId: 'proj-1',
      });
      mockFindSprintRepository.findOneSprint.mockResolvedValueOnce({
        workspaceId: 'ws-2',
      });
      await expect(service.move(input)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if target sprint project does not match', async () => {
      mockFindTaskRepository.findOneTask.mockResolvedValue({
        workspaceId: 'ws-1',
        projectId: 'proj-1',
        sprintId: 'sprint-1',
      });
      mockFindSprintRepository.findOneSprint.mockResolvedValueOnce({
        workspaceId: 'ws-1',
        projectId: 'proj-1',
      });
      mockFindSprintRepository.findOneSprint.mockResolvedValueOnce({
        workspaceId: 'ws-1',
        projectId: 'proj-2',
      });
      await expect(service.move(input)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if source sprint is COMPLETED', async () => {
      mockFindTaskRepository.findOneTask.mockResolvedValue({
        workspaceId: 'ws-1',
        projectId: 'proj-1',
        sprintId: 'sprint-1',
      });
      mockFindSprintRepository.findOneSprint.mockResolvedValueOnce({
        workspaceId: 'ws-1',
        projectId: 'proj-1',
        status: SprintStatus.COMPLETED,
      });
      mockFindSprintRepository.findOneSprint.mockResolvedValueOnce({
        workspaceId: 'ws-1',
        projectId: 'proj-1',
      });
      await expect(service.move(input)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if target sprint is COMPLETED', async () => {
      mockFindTaskRepository.findOneTask.mockResolvedValue({
        workspaceId: 'ws-1',
        projectId: 'proj-1',
        sprintId: 'sprint-1',
      });
      mockFindSprintRepository.findOneSprint.mockResolvedValueOnce({
        workspaceId: 'ws-1',
        projectId: 'proj-1',
      });
      mockFindSprintRepository.findOneSprint.mockResolvedValueOnce({
        workspaceId: 'ws-1',
        projectId: 'proj-1',
        status: SprintStatus.COMPLETED,
      });
      await expect(service.move(input)).rejects.toThrow(BadRequestException);
    });

    it('should call move on repository and return updated task', async () => {
      const manager = {} as any;
      mockFindTaskRepository.findOneTask.mockResolvedValue({
        workspaceId: 'ws-1',
        projectId: 'proj-1',
        sprintId: 'sprint-1',
      });
      mockFindSprintRepository.findOneSprint.mockResolvedValueOnce({
        workspaceId: 'ws-1',
        projectId: 'proj-1',
      });
      mockFindSprintRepository.findOneSprint.mockResolvedValueOnce({
        workspaceId: 'ws-1',
        projectId: 'proj-1',
      });
      mockMoveTaskSprintToSprintRepository.move.mockResolvedValue({ id: '1' });

      const result = await service.move(input, manager);

      expect(mockMoveTaskSprintToSprintRepository.move).toHaveBeenCalledWith(
        {
          workspaceId: 'ws-1',
          projectId: 'proj-1',
          taskId: '1',
          targetSprintId: 'sprint-2',
        },
        manager,
      );
      expect(result).toEqual({ id: '1' });
    });
  });
});
