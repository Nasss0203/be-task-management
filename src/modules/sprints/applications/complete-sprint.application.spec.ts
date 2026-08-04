import { Test, TestingModule } from '@nestjs/testing';
import { CompleteSprintApplicationImpl } from './complete-sprint.application';
import { SPRINT_TYPES } from '../interfaces/types';
import { ACTIVITY_TYPES } from 'src/modules/activity/interfaces/types';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { REALTIME_EVENTS } from 'src/modules/realtime/realtime.events';

describe('CompleteSprintApplicationImpl', () => {
  let app: CompleteSprintApplicationImpl;

  const mockCompleteSprintService = { completeSprint: jest.fn() };
  const mockCreateActivityService = { create: jest.fn() };
  const mockUnitOfWork = {
    runInTransaction: jest.fn().mockImplementation(async (cb) => {
      return await cb('mockTransactionManager');
    }),
  };
  const mockEventEmitter = { emit: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompleteSprintApplicationImpl,
        {
          provide: SPRINT_TYPES.services.CompleteSprintService,
          useValue: mockCompleteSprintService,
        },
        {
          provide: ACTIVITY_TYPES.services.CreateActivityService,
          useValue: mockCreateActivityService,
        },
        { provide: SPRINT_TYPES.uow.UnitOfWork, useValue: mockUnitOfWork },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    app = module.get<CompleteSprintApplicationImpl>(
      CompleteSprintApplicationImpl,
    );
  });

  it('should be defined', () => {
    expect(app).toBeDefined();
  });

  describe('complete', () => {
    const mockSprint = {
      id: 'sprint-1',
      workspaceId: 'ws-1',
      projectId: 'proj-1',
      name: 'Sprint 1',
      completedAt: new Date(),
    };

    const input = {
      workspaceId: 'ws-1',
      projectId: 'proj-1',
      sprintId: 'sprint-1',
      userId: 'user-1',
    };

    it('should complete sprint, create activity, emit event inside transaction, and return response', async () => {
      mockCompleteSprintService.completeSprint.mockResolvedValue(mockSprint);
      mockCreateActivityService.create.mockResolvedValue(undefined);

      const result = await app.complete(input);

      expect(mockUnitOfWork.runInTransaction).toHaveBeenCalled();
      expect(mockCompleteSprintService.completeSprint).toHaveBeenCalledWith(
        {
          workspaceId: input.workspaceId,
          projectId: input.projectId,
          sprintId: input.sprintId,
        },
        'mockTransactionManager',
      );
      expect(mockCreateActivityService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          entityId: mockSprint.id,
          actorId: input.userId,
        }),
        'mockTransactionManager',
      );
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        REALTIME_EVENTS.SPRINT_UPDATED,
        {
          workspaceId: mockSprint.workspaceId,
          projectId: mockSprint.projectId,
          sprint: mockSprint,
        },
      );
      // SprintsMapper.toResponse maps sprint to DTO, we can check basic props
      expect(result.id).toEqual(mockSprint.id);
    });

    it('should throw error if complete sprint service fails, and not emit event', async () => {
      const error = new Error('Complete failed');
      mockCompleteSprintService.completeSprint.mockRejectedValue(error);

      await expect(app.complete(input)).rejects.toThrow(error);

      expect(mockCreateActivityService.create).not.toHaveBeenCalled();
      expect(mockEventEmitter.emit).not.toHaveBeenCalled();
    });

    it('should throw error if create activity fails, and not emit event', async () => {
      mockCompleteSprintService.completeSprint.mockResolvedValue(mockSprint);
      const error = new Error('Activity creation failed');
      mockCreateActivityService.create.mockRejectedValue(error);

      await expect(app.complete(input)).rejects.toThrow(error);

      expect(mockCompleteSprintService.completeSprint).toHaveBeenCalled();
      expect(mockEventEmitter.emit).not.toHaveBeenCalled();
    });
  });
});
