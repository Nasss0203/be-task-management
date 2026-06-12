import { Test, TestingModule } from '@nestjs/testing';
import { CompleteSprintApplicationImpl } from './complete-sprint.application';
import { SPRINT_TYPES } from '../interfaces/types';
import { ACTIVITY_TYPES } from 'src/modules/activity/interfaces/types';

describe('CompleteSprintApplicationImpl', () => {
  let app: CompleteSprintApplicationImpl;

  const mockCompleteSprintService = { completeSprint: jest.fn() };
  const mockCreateActivityService = { create: jest.fn() };
  const mockUnitOfWork = { runInTransaction: jest.fn((cb) => cb({})) };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompleteSprintApplicationImpl,
        { provide: SPRINT_TYPES.services.CompleteSprintService, useValue: mockCompleteSprintService },
        { provide: ACTIVITY_TYPES.services.CreateActivityService, useValue: mockCreateActivityService },
        { provide: SPRINT_TYPES.uow.UnitOfWork, useValue: mockUnitOfWork },
      ],
    }).compile();

    app = module.get<CompleteSprintApplicationImpl>(CompleteSprintApplicationImpl);
  });

  it('should be defined', () => {
    expect(app).toBeDefined();
  });

  describe('complete', () => {
    it('should complete sprint and create activity', async () => {
      const mockSprint = {
        id: 'sprint-1',
        workspaceId: 'ws-1',
        projectId: 'proj-1',
        name: 'Sprint 1',
        completedAt: new Date(),
      };
      mockCompleteSprintService.completeSprint.mockResolvedValue(mockSprint);

      const result = await app.complete({
        workspaceId: 'ws-1',
        projectId: 'proj-1',
        sprintId: 'sprint-1',
        userId: 'user-1',
      });

      expect(mockCompleteSprintService.completeSprint).toHaveBeenCalled();
      expect(mockCreateActivityService.create).toHaveBeenCalled();
      expect(result).toEqual(mockSprint);
    });
  });
});
