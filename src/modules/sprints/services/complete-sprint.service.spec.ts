import { Test, TestingModule } from '@nestjs/testing';
import { CompleteSprintServiceImpl } from './complete-sprint.service';
import { SPRINT_TYPES } from '../interfaces/types';
import { TASK_TYPES } from 'src/modules/tasks/interfaces/types';
import { TASK_STATUS_TYPES } from 'src/modules/task_status/interfaces/types';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { SprintStatus } from '../domain/entities/sprint.entity';

describe('CompleteSprintServiceImpl', () => {
  let service: CompleteSprintServiceImpl;

  const mockCompleteSprintRepository = { completeSprint: jest.fn() };
  const mockFindSprintRepository = { findOneSprint: jest.fn() };
  const mockMoveUnfinishedTasksToBacklogService = { move: jest.fn() };
  const mockFindTaskStatusRepository = { findDoneStatus: jest.fn() };
  const mockMarkDoneTasksCompletedAtInSprintService = { mark: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompleteSprintServiceImpl,
        { provide: SPRINT_TYPES.repositories.CompleteSprintRepository, useValue: mockCompleteSprintRepository },
        { provide: SPRINT_TYPES.repositories.FindSprintRepository, useValue: mockFindSprintRepository },
        { provide: TASK_TYPES.services.MoveUnfinishedTasksToBacklogService, useValue: mockMoveUnfinishedTasksToBacklogService },
        { provide: TASK_STATUS_TYPES.repositories.FindTaskStatusRepository, useValue: mockFindTaskStatusRepository },
        { provide: TASK_TYPES.services.MarkDoneTasksCompletedAtInSprintService, useValue: mockMarkDoneTasksCompletedAtInSprintService },
      ],
    }).compile();

    service = module.get<CompleteSprintServiceImpl>(CompleteSprintServiceImpl);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('completeSprint', () => {
    it('should throw NotFoundException if sprint not found', async () => {
      mockFindSprintRepository.findOneSprint.mockResolvedValue(null);
      await expect(service.completeSprint({ sprintId: '1', workspaceId: 'ws-1', projectId: 'proj-1' } as any)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if workspace mismatch', async () => {
      mockFindSprintRepository.findOneSprint.mockResolvedValue({ workspaceId: 'ws-2' });
      await expect(service.completeSprint({ sprintId: '1', workspaceId: 'ws-1', projectId: 'proj-1' } as any)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if project mismatch', async () => {
      mockFindSprintRepository.findOneSprint.mockResolvedValue({ workspaceId: 'ws-1', projectId: 'proj-2' });
      await expect(service.completeSprint({ sprintId: '1', workspaceId: 'ws-1', projectId: 'proj-1' } as any)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if sprint is not active', async () => {
      mockFindSprintRepository.findOneSprint.mockResolvedValue({ workspaceId: 'ws-1', projectId: 'proj-1', status: SprintStatus.PLANNED });
      await expect(service.completeSprint({ sprintId: '1', workspaceId: 'ws-1', projectId: 'proj-1' } as any)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if done status not found', async () => {
      mockFindSprintRepository.findOneSprint.mockResolvedValue({ workspaceId: 'ws-1', projectId: 'proj-1', status: SprintStatus.ACTIVE });
      mockFindTaskStatusRepository.findDoneStatus.mockResolvedValue(null);
      await expect(service.completeSprint({ sprintId: '1', workspaceId: 'ws-1', projectId: 'proj-1' } as any)).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if completeSprint fails', async () => {
      mockFindSprintRepository.findOneSprint.mockResolvedValue({ workspaceId: 'ws-1', projectId: 'proj-1', status: SprintStatus.ACTIVE });
      mockFindTaskStatusRepository.findDoneStatus.mockResolvedValue({ id: 'done-status' });
      mockCompleteSprintRepository.completeSprint.mockResolvedValue(null);
      await expect(service.completeSprint({ sprintId: '1', workspaceId: 'ws-1', projectId: 'proj-1' } as any)).rejects.toThrow(NotFoundException);
    });

    it('should complete sprint', async () => {
      mockFindSprintRepository.findOneSprint.mockResolvedValue({ workspaceId: 'ws-1', projectId: 'proj-1', status: SprintStatus.ACTIVE });
      mockFindTaskStatusRepository.findDoneStatus.mockResolvedValue({ id: 'done-status' });
      mockCompleteSprintRepository.completeSprint.mockResolvedValue({ id: '1' });
      
      const result = await service.completeSprint({ sprintId: '1', workspaceId: 'ws-1', projectId: 'proj-1' } as any);
      
      expect(mockMarkDoneTasksCompletedAtInSprintService.mark).toHaveBeenCalled();
      expect(mockMoveUnfinishedTasksToBacklogService.move).toHaveBeenCalled();
      expect(result).toEqual({ id: '1' });
    });
  });
});
