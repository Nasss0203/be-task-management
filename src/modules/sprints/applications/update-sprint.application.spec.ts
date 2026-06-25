import { Test, TestingModule } from '@nestjs/testing';
import { UpdateSprintApplicationImpl } from './update-sprint.application';
import { SPRINT_TYPES } from '../interfaces/types';
import { ACTIVITY_TYPES } from 'src/modules/activity/interfaces/types';
import { DataSource } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { REALTIME_EVENTS } from 'src/modules/realtime/realtime.events';

describe('UpdateSprintApplicationImpl', () => {
  let app: UpdateSprintApplicationImpl;

  const mockUpdateSprintService = { updateSprint: jest.fn() };
  const mockCreateActivityService = { create: jest.fn() };
  const mockDataSource = {
    transaction: jest.fn().mockImplementation(async (cb) => {
      return await cb('mockTransactionManager');
    }),
  };
  const mockEventEmitter = { emit: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateSprintApplicationImpl,
        { provide: DataSource, useValue: mockDataSource },
        { provide: SPRINT_TYPES.services.UpdateSprintService, useValue: mockUpdateSprintService },
        { provide: ACTIVITY_TYPES.services.CreateActivityService, useValue: mockCreateActivityService },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    app = module.get<UpdateSprintApplicationImpl>(UpdateSprintApplicationImpl);
  });

  it('should be defined', () => {
    expect(app).toBeDefined();
  });

  describe('updateSprint', () => {
    const input = {
      workspaceId: 'ws-1',
      projectId: 'proj-1',
      sprintId: 'sprint-1',
      userId: 'user-1',
      name: 'Updated Sprint 1',
    };

    const mockSprint = {
      id: 'sprint-1',
      workspaceId: 'ws-1',
      projectId: 'proj-1',
      name: 'Updated Sprint 1',
    };

    it('should update sprint, log activity, and emit event inside transaction', async () => {
      mockUpdateSprintService.updateSprint.mockResolvedValue(mockSprint);
      mockCreateActivityService.create.mockResolvedValue(undefined);

      const result = await app.updateSprint(input);

      expect(mockDataSource.transaction).toHaveBeenCalled();
      expect(mockUpdateSprintService.updateSprint).toHaveBeenCalledWith({
        id: input.sprintId,
        workspaceId: input.workspaceId,
        projectId: input.projectId,
        name: input.name,
      }, 'mockTransactionManager');

      expect(mockCreateActivityService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          entityId: mockSprint.id,
          actorId: input.userId,
        }),
        'mockTransactionManager'
      );

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(REALTIME_EVENTS.SPRINT_UPDATED, {
        workspaceId: mockSprint.workspaceId,
        projectId: mockSprint.projectId,
        sprint: mockSprint,
      });

      expect(result.id).toEqual(mockSprint.id);
    });

    it('should throw error if update service fails and not emit event', async () => {
      const error = new Error('Update failed');
      mockUpdateSprintService.updateSprint.mockRejectedValue(error);

      await expect(app.updateSprint(input)).rejects.toThrow(error);

      expect(mockCreateActivityService.create).not.toHaveBeenCalled();
      expect(mockEventEmitter.emit).not.toHaveBeenCalled();
    });

    it('should throw error if create activity fails and not emit event', async () => {
      mockUpdateSprintService.updateSprint.mockResolvedValue(mockSprint);
      const error = new Error('Activity creation failed');
      mockCreateActivityService.create.mockRejectedValue(error);

      await expect(app.updateSprint(input)).rejects.toThrow(error);

      expect(mockEventEmitter.emit).not.toHaveBeenCalled();
    });
  });
});
