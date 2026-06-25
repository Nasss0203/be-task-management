import { Test, TestingModule } from '@nestjs/testing';
import { CompleteSprintServiceImpl } from './complete-sprint.service';
import { SPRINT_TYPES } from '../interfaces/types';
import { TASK_TYPES } from 'src/modules/tasks/interfaces/types';
import { TASK_STATUS_TYPES } from 'src/modules/task_status/interfaces/types';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { SprintStatus } from '../domain/entities/sprint.entity';
import { SPRINT_REPORT_TYPES } from 'src/modules/sprint_reports/interfaces/types';

describe('CompleteSprintServiceImpl', () => {
  let service: CompleteSprintServiceImpl;

  const mockFindTask = jest.fn();

  const mockCompleteSprintRepository = {
    completeSprint: jest.fn(),
    repo: {
      manager: {
        getRepository: jest.fn().mockReturnValue({
          find: mockFindTask,
        }),
      },
    },
  };
  const mockFindSprintRepository = { findOneSprint: jest.fn() };
  const mockMoveUnfinishedTasksToBacklogService = { move: jest.fn() };
  const mockFindTaskStatusRepository = { findDoneStatus: jest.fn() };
  const mockMarkDoneTasksCompletedAtInSprintService = { mark: jest.fn() };
  const mockCreateSprintReportRepository = { create: jest.fn() };

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
        { provide: SPRINT_REPORT_TYPES.repositories.CreateSprintReportRepository, useValue: mockCreateSprintReportRepository },
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

    it('should throw error and rollback if create sprint report fails', async () => {
      mockFindSprintRepository.findOneSprint.mockResolvedValue({ workspaceId: 'ws-1', projectId: 'proj-1', status: SprintStatus.ACTIVE, id: '1', name: 'Sprint 1', startAt: new Date() });
      mockFindTaskStatusRepository.findDoneStatus.mockResolvedValue({ id: 'done-status' });
      mockFindTask.mockResolvedValue([]);
      
      const error = new Error('Report creation failed');
      mockCreateSprintReportRepository.create.mockRejectedValue(error);

      await expect(service.completeSprint({ sprintId: '1', workspaceId: 'ws-1', projectId: 'proj-1' } as any)).rejects.toThrow(error);
      
      // Should not proceed to next steps
      expect(mockMoveUnfinishedTasksToBacklogService.move).not.toHaveBeenCalled();
      expect(mockCompleteSprintRepository.completeSprint).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if completeSprint fails at the end', async () => {
      mockFindSprintRepository.findOneSprint.mockResolvedValue({ workspaceId: 'ws-1', projectId: 'proj-1', status: SprintStatus.ACTIVE, id: '1', name: 'Sprint 1', startAt: new Date() });
      mockFindTaskStatusRepository.findDoneStatus.mockResolvedValue({ id: 'done-status' });
      mockFindTask.mockResolvedValue([]);
      mockCreateSprintReportRepository.create.mockResolvedValue(undefined);
      mockCompleteSprintRepository.completeSprint.mockResolvedValue(null);
      
      await expect(service.completeSprint({ sprintId: '1', workspaceId: 'ws-1', projectId: 'proj-1' } as any)).rejects.toThrow(NotFoundException);
    });

    it('should calculate sprint report summary and complete sprint', async () => {
      const startAt = new Date('2026-06-25T00:00:00Z');
      mockFindSprintRepository.findOneSprint.mockResolvedValue({ workspaceId: 'ws-1', projectId: 'proj-1', status: SprintStatus.ACTIVE, id: 'sprint-1', name: 'Sprint 1', goal: 'Goal 1', startAt });
      mockFindTaskStatusRepository.findDoneStatus.mockResolvedValue({ id: 'done-status' });
      
      mockFindTask.mockResolvedValue([
        {
          id: 'task-1',
          statusId: 'done-status',
          estimateMinutes: 60,
          title: 'Task 1',
          projectSeq: 1,
          assignees: [{ userId: 'user-1', user: { name: 'User 1' } }]
        },
        {
          id: 'task-2',
          statusId: 'todo-status',
          estimateMinutes: 30,
          title: 'Task 2',
          projectSeq: 2,
          assignees: [{ userId: 'user-1', user: { name: 'User 1' } }, { userId: 'user-2', user: { name: 'User 2' } }]
        }
      ]);

      mockCreateSprintReportRepository.create.mockResolvedValue(undefined);
      mockCompleteSprintRepository.completeSprint.mockResolvedValue({ id: 'sprint-1' });
      
      const result = await service.completeSprint({ sprintId: 'sprint-1', workspaceId: 'ws-1', projectId: 'proj-1' } as any);
      
      expect(mockMarkDoneTasksCompletedAtInSprintService.mark).toHaveBeenCalled();
      
      // Verify report creation logic
      expect(mockCreateSprintReportRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          sprintId: 'sprint-1',
          totalTasks: 2,
          completedTasks: 1,
          incompleteTasks: 1,
          totalEstimate: 90,
          completedEstimate: 60,
          completedTaskIds: ['task-1'],
          incompleteTaskIds: ['task-2'],
          memberPerformance: expect.arrayContaining([
            expect.objectContaining({ assigneeId: 'user-1', completedTasks: 1, incompleteTasks: 1, completedEstimate: 60, incompleteEstimate: 30 }),
            expect.objectContaining({ assigneeId: 'user-2', completedTasks: 0, incompleteTasks: 1, completedEstimate: 0, incompleteEstimate: 30 }),
          ]),
          startAt,
        }),
        undefined // Because no manager was passed
      );
      
      expect(mockMoveUnfinishedTasksToBacklogService.move).toHaveBeenCalled();
      expect(result).toEqual({ id: 'sprint-1' });
    });
  });
});
