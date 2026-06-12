import { Test, TestingModule } from '@nestjs/testing';
import { StartSprintApplicationImpl } from './start-sprint.application';
import { SPRINT_TYPES } from '../interfaces/types';
import { ACTIVITY_TYPES } from 'src/modules/activity/interfaces/types';

describe('StartSprintApplicationImpl', () => {
  let app: StartSprintApplicationImpl;

  const mockStartSprintService = { startSprint: jest.fn() };
  const mockCreateActivityService = { create: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StartSprintApplicationImpl,
        { provide: SPRINT_TYPES.services.StartSprintService, useValue: mockStartSprintService },
        { provide: ACTIVITY_TYPES.services.CreateActivityService, useValue: mockCreateActivityService },
      ],
    }).compile();

    app = module.get<StartSprintApplicationImpl>(StartSprintApplicationImpl);
  });

  it('should be defined', () => {
    expect(app).toBeDefined();
  });

  describe('start', () => {
    it('should start sprint and create activity', async () => {
      const mockSprint = {
        id: 'sprint-1',
        workspaceId: 'ws-1',
        projectId: 'proj-1',
        name: 'Sprint 1',
      };
      mockStartSprintService.startSprint.mockResolvedValue(mockSprint);

      const result = await app.start({
        workspaceId: 'ws-1',
        projectId: 'proj-1',
        sprintId: 'sprint-1',
        userId: 'user-1',
        dto: { name: 'Sprint 1' } as any,
      });

      expect(mockStartSprintService.startSprint).toHaveBeenCalled();
      expect(mockCreateActivityService.create).toHaveBeenCalled();
      expect(result).toEqual(mockSprint);
    });
  });
});
