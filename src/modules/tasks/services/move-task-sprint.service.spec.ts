import { Test, TestingModule } from '@nestjs/testing';
import { MoveTaskSprintServiceImpl } from './move-task-sprint.service';
import { TASK_TYPES } from '../interfaces/types';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('MoveTaskSprintServiceImpl', () => {
  let service: MoveTaskSprintServiceImpl;

  const mockMoveTaskSprintRepository = {
    moveTaskToSprint: jest.fn(),
    moveManyTaskToSprint: jest.fn(),
  };

  const mockFindTaskRepository = {
    findByIds: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MoveTaskSprintServiceImpl,
        {
          provide: TASK_TYPES.repositories.MoveTaskSprintRepository,
          useValue: mockMoveTaskSprintRepository,
        },
        {
          provide: TASK_TYPES.repositories.FindTaskRepository,
          useValue: mockFindTaskRepository,
        },
      ],
    }).compile();

    service = module.get<MoveTaskSprintServiceImpl>(MoveTaskSprintServiceImpl);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('move', () => {
    it('should call moveTaskToSprint on repository', async () => {
      const input = { taskId: '1', sprintId: 'sprint-1', manager: {} as any };
      mockMoveTaskSprintRepository.moveTaskToSprint.mockResolvedValue({ id: '1' });

      const result = await service.move(input);

      expect(mockMoveTaskSprintRepository.moveTaskToSprint).toHaveBeenCalledWith('1', 'sprint-1', input.manager);
      expect(result).toEqual({ id: '1' });
    });
  });

  describe('moveMany', () => {
    it('should return immediately if taskIds is empty', async () => {
      await service.moveMany({ taskIds: [], sprintId: 'sprint-1', workspaceId: 'ws-1', projectId: 'proj-1' });
      expect(mockFindTaskRepository.findByIds).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if some tasks are not found', async () => {
      mockFindTaskRepository.findByIds.mockResolvedValue([{ id: '1' }]);
      await expect(
        service.moveMany({ taskIds: ['1', '2'], sprintId: 'sprint-1', workspaceId: 'ws-1', projectId: 'proj-1' })
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if task workspace does not match', async () => {
      mockFindTaskRepository.findByIds.mockResolvedValue([{ id: '1', workspaceId: 'ws-2', projectId: 'proj-1' }]);
      await expect(
        service.moveMany({ taskIds: ['1'], sprintId: 'sprint-1', workspaceId: 'ws-1', projectId: 'proj-1' })
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if task project does not match', async () => {
      mockFindTaskRepository.findByIds.mockResolvedValue([{ id: '1', workspaceId: 'ws-1', projectId: 'proj-2' }]);
      await expect(
        service.moveMany({ taskIds: ['1'], sprintId: 'sprint-1', workspaceId: 'ws-1', projectId: 'proj-1' })
      ).rejects.toThrow(BadRequestException);
    });

    it('should call moveManyTaskToSprint on repository', async () => {
      const manager = {} as any;
      mockFindTaskRepository.findByIds.mockResolvedValue([{ id: '1', workspaceId: 'ws-1', projectId: 'proj-1' }]);
      mockMoveTaskSprintRepository.moveManyTaskToSprint.mockResolvedValue(undefined);

      await service.moveMany({ taskIds: ['1'], sprintId: 'sprint-1', workspaceId: 'ws-1', projectId: 'proj-1', manager });

      expect(mockMoveTaskSprintRepository.moveManyTaskToSprint).toHaveBeenCalledWith(['1'], 'sprint-1', manager);
    });
  });
});
