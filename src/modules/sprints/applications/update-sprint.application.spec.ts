import { Test, TestingModule } from '@nestjs/testing';
import { UpdateSprintApplicationImpl } from './update-sprint.application';
import { SPRINT_TYPES } from '../interfaces/types';
import { ACTIVITY_TYPES } from 'src/modules/activity/interfaces/types';
import { DataSource } from 'typeorm';

describe('UpdateSprintApplicationImpl', () => {
  let app: UpdateSprintApplicationImpl;

  const mockUpdateSprintService = { updateSprint: jest.fn() };
  const mockCreateActivityService = { create: jest.fn() };
  const mockDataSource = { transaction: jest.fn((cb) => cb({})) };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateSprintApplicationImpl,
        { provide: DataSource, useValue: mockDataSource },
        { provide: SPRINT_TYPES.services.UpdateSprintService, useValue: mockUpdateSprintService },
        { provide: ACTIVITY_TYPES.services.CreateActivityService, useValue: mockCreateActivityService },
      ],
    }).compile();

    app = module.get<UpdateSprintApplicationImpl>(UpdateSprintApplicationImpl);
  });

  it('should be defined', () => {
    expect(app).toBeDefined();
  });

  describe('updateSprint', () => {
    it('should update sprint and log activity', async () => {
      const mockUpdatedSprint = {
        id: 'sprint-1',
        workspaceId: 'ws-1',
        projectId: 'proj-1',
        name: 'Updated Sprint',
      };
      mockUpdateSprintService.updateSprint.mockResolvedValue(mockUpdatedSprint);

      const result = await app.updateSprint({
        workspaceId: 'ws-1',
        projectId: 'proj-1',
        sprintId: 'sprint-1',
        userId: 'user-1',
        name: 'Updated Sprint',
      });

      expect(mockUpdateSprintService.updateSprint).toHaveBeenCalled();
      expect(mockCreateActivityService.create).toHaveBeenCalled();
      expect(result).toEqual(mockUpdatedSprint);
    });
  });
});
