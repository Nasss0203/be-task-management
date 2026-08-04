import { Test, TestingModule } from '@nestjs/testing';
import { StartSprintApplicationImpl } from './start-sprint.application';
import { SPRINT_TYPES } from '../interfaces/types';
import { ACTIVITY_TYPES } from 'src/modules/activity/interfaces/types';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { REALTIME_EVENTS } from 'src/modules/realtime/realtime.events';

describe('StartSprintApplicationImpl', () => {
  let app: StartSprintApplicationImpl;

  const mockStartSprintService = { startSprint: jest.fn() };
  const mockCreateActivityService = { create: jest.fn() };
  const mockEventEmitter = { emit: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StartSprintApplicationImpl,
        {
          provide: SPRINT_TYPES.services.StartSprintService,
          useValue: mockStartSprintService,
        },
        {
          provide: ACTIVITY_TYPES.services.CreateActivityService,
          useValue: mockCreateActivityService,
        },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    app = module.get<StartSprintApplicationImpl>(StartSprintApplicationImpl);
  });

  it('should be defined', () => {
    expect(app).toBeDefined();
  });

  describe('start', () => {
    const input = {
      workspaceId: 'ws-1',
      projectId: 'proj-1',
      sprintId: 'sprint-1',
      userId: 'user-1',
      dto: {
        startAt: new Date(),
        endAt: new Date(),
        name: 'Sprint 1',
        goal: 'Goal 1',
      },
    };

    const mockSprint = {
      id: 'sprint-1',
      workspaceId: 'ws-1',
      projectId: 'proj-1',
      name: 'Sprint 1',
      startAt: new Date(),
      endAt: new Date(),
    };

    it('should start sprint, create activity, and emit event', async () => {
      mockStartSprintService.startSprint.mockResolvedValue(mockSprint);
      mockCreateActivityService.create.mockResolvedValue(undefined);

      const result = await app.start(input);

      expect(mockStartSprintService.startSprint).toHaveBeenCalledWith({
        workspaceId: input.workspaceId,
        projectId: input.projectId,
        sprintId: input.sprintId,
        startAt: input.dto.startAt,
        endAt: input.dto.endAt,
        name: input.dto.name,
        goal: input.dto.goal,
      });

      expect(mockCreateActivityService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          entityId: mockSprint.id,
          actorId: input.userId,
        }),
      );

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        REALTIME_EVENTS.SPRINT_UPDATED,
        {
          workspaceId: mockSprint.workspaceId,
          projectId: mockSprint.projectId,
          sprint: mockSprint,
        },
      );

      expect(result.id).toEqual(mockSprint.id);
    });

    it('should throw error if startSprintService fails and not emit event', async () => {
      const error = new Error('Start failed');
      mockStartSprintService.startSprint.mockRejectedValue(error);

      await expect(app.start(input)).rejects.toThrow(error);

      expect(mockCreateActivityService.create).not.toHaveBeenCalled();
      expect(mockEventEmitter.emit).not.toHaveBeenCalled();
    });

    it('should throw error if create activity fails and not emit event', async () => {
      mockStartSprintService.startSprint.mockResolvedValue(mockSprint);
      const error = new Error('Activity creation failed');
      mockCreateActivityService.create.mockRejectedValue(error);

      await expect(app.start(input)).rejects.toThrow(error);

      expect(mockEventEmitter.emit).not.toHaveBeenCalled();
    });
  });
});
