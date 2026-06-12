import { Test, TestingModule } from '@nestjs/testing';
import { CancelSprintApplicationImpl } from './cancel-sprint.application';
import { SPRINT_TYPES } from '../interfaces/types';
import { ACTIVITY_TYPES } from 'src/modules/activity/interfaces/types';

describe('CancelSprintApplicationImpl', () => {
  let app: CancelSprintApplicationImpl;

  const mockCancelSprintService = { cancelSprint: jest.fn() };
  const mockCreateActivityService = { create: jest.fn() };
  const mockUnitOfWork = { runInTransaction: jest.fn((cb) => cb({})) };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CancelSprintApplicationImpl,
        { provide: SPRINT_TYPES.services.CancelSprintService, useValue: mockCancelSprintService },
        { provide: ACTIVITY_TYPES.services.CreateActivityService, useValue: mockCreateActivityService },
        { provide: SPRINT_TYPES.uow.UnitOfWork, useValue: mockUnitOfWork },
      ],
    }).compile();

    app = module.get<CancelSprintApplicationImpl>(CancelSprintApplicationImpl);
  });

  it('should be defined', () => {
    expect(app).toBeDefined();
  });

  describe('cancelSprint', () => {
    it('should cancel sprint and create activity', async () => {
      const mockSprint = {
        id: 'sprint-1',
        workspaceId: 'ws-1',
        projectId: 'proj-1',
        name: 'Sprint 1',
      };
      mockCancelSprintService.cancelSprint.mockResolvedValue(mockSprint);

      const result = await app.cancelSprint({
        workspaceId: 'ws-1',
        projectId: 'proj-1',
        sprintId: 'sprint-1',
        userId: 'user-1',
      });

      expect(mockCancelSprintService.cancelSprint).toHaveBeenCalled();
      expect(mockCreateActivityService.create).toHaveBeenCalled();
      expect(result).toEqual(mockSprint);
    });
  });
});
