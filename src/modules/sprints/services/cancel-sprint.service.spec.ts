import { Test, TestingModule } from '@nestjs/testing';
import { CancelSprintServiceImpl } from './cancel-sprint.service';
import { SPRINT_TYPES } from '../interfaces/types';
import { TASK_TYPES } from 'src/modules/tasks/interfaces/types';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { SprintStatus } from '../domain/entities/sprint.entity';

describe('CancelSprintServiceImpl', () => {
  let service: CancelSprintServiceImpl;

  const mockCancelSprintRepository = { cancelSprint: jest.fn() };
  const mockFindSprintRepository = { findOneSprint: jest.fn() };
  const mockMoveTasksToBacklogBySprintService = { move: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CancelSprintServiceImpl,
        { provide: SPRINT_TYPES.repositories.CancelSprintRepository, useValue: mockCancelSprintRepository },
        { provide: SPRINT_TYPES.repositories.FindSprintRepository, useValue: mockFindSprintRepository },
        { provide: TASK_TYPES.services.MoveTasksToBacklogBySprintService, useValue: mockMoveTasksToBacklogBySprintService },
      ],
    }).compile();

    service = module.get<CancelSprintServiceImpl>(CancelSprintServiceImpl);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('cancelSprint', () => {
    it('should throw NotFoundException if sprint not found', async () => {
      mockFindSprintRepository.findOneSprint.mockResolvedValue(null);
      await expect(service.cancelSprint({ sprintId: '1', workspaceId: 'ws-1', projectId: 'proj-1' } as any)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if workspace mismatch', async () => {
      mockFindSprintRepository.findOneSprint.mockResolvedValue({ workspaceId: 'ws-2' });
      await expect(service.cancelSprint({ sprintId: '1', workspaceId: 'ws-1', projectId: 'proj-1' } as any)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if project mismatch', async () => {
      mockFindSprintRepository.findOneSprint.mockResolvedValue({ workspaceId: 'ws-1', projectId: 'proj-2' });
      await expect(service.cancelSprint({ sprintId: '1', workspaceId: 'ws-1', projectId: 'proj-1' } as any)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if sprint is completed', async () => {
      mockFindSprintRepository.findOneSprint.mockResolvedValue({ workspaceId: 'ws-1', projectId: 'proj-1', status: SprintStatus.COMPLETED });
      await expect(service.cancelSprint({ sprintId: '1', workspaceId: 'ws-1', projectId: 'proj-1' } as any)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if sprint is already cancelled', async () => {
      mockFindSprintRepository.findOneSprint.mockResolvedValue({ workspaceId: 'ws-1', projectId: 'proj-1', status: SprintStatus.CANCELLED });
      await expect(service.cancelSprint({ sprintId: '1', workspaceId: 'ws-1', projectId: 'proj-1' } as any)).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if cancelSprint repository fails', async () => {
      mockFindSprintRepository.findOneSprint.mockResolvedValue({ workspaceId: 'ws-1', projectId: 'proj-1', status: SprintStatus.PLANNED });
      mockCancelSprintRepository.cancelSprint.mockResolvedValue(null);
      await expect(service.cancelSprint({ sprintId: '1', workspaceId: 'ws-1', projectId: 'proj-1' } as any)).rejects.toThrow(NotFoundException);
    });

    it('should cancel sprint', async () => {
      mockFindSprintRepository.findOneSprint.mockResolvedValue({ workspaceId: 'ws-1', projectId: 'proj-1', status: SprintStatus.PLANNED });
      mockCancelSprintRepository.cancelSprint.mockResolvedValue({ id: '1' });
      const result = await service.cancelSprint({ sprintId: '1', workspaceId: 'ws-1', projectId: 'proj-1' } as any);
      expect(mockMoveTasksToBacklogBySprintService.move).toHaveBeenCalled();
      expect(result).toEqual({ id: '1' });
    });
  });
});
