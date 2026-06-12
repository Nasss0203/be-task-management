import { Test, TestingModule } from '@nestjs/testing';
import { CreateSprintApplicationImpl } from './create-sprint.application';
import { SPRINT_TYPES } from '../interfaces/types';
import { ACTIVITY_TYPES } from 'src/modules/activity/interfaces/types';
import { BadRequestException } from '@nestjs/common';

describe('CreateSprintApplicationImpl', () => {
  let app: CreateSprintApplicationImpl;

  const mockCreateSprintService = { create: jest.fn() };
  const mockCreateActivityService = { create: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateSprintApplicationImpl,
        { provide: SPRINT_TYPES.services.CreateSprintService, useValue: mockCreateSprintService },
        { provide: ACTIVITY_TYPES.services.CreateActivityService, useValue: mockCreateActivityService },
      ],
    }).compile();

    app = module.get<CreateSprintApplicationImpl>(CreateSprintApplicationImpl);
  });

  it('should be defined', () => {
    expect(app).toBeDefined();
  });

  describe('create', () => {
    it('should throw BadRequestException if startAt is invalid date', async () => {
      await expect(
        app.create({ workspaceId: '1', projectId: '2', userId: '3', dto: { startAt: 'invalid' } as any })
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if endAt is invalid date', async () => {
      await expect(
        app.create({ workspaceId: '1', projectId: '2', userId: '3', dto: { endAt: 'invalid' } as any })
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if startAt >= endAt', async () => {
      await expect(
        app.create({
          workspaceId: '1',
          projectId: '2',
          userId: '3',
          dto: { startAt: '2023-01-02', endAt: '2023-01-01' } as any,
        })
      ).rejects.toThrow(BadRequestException);
    });

    it('should create sprint and log activity', async () => {
      const mockCreatedSprint = {
        id: 'sprint-1',
        workspaceId: 'ws-1',
        projectId: 'proj-1',
        name: 'Sprint 1',
      };
      mockCreateSprintService.create.mockResolvedValue(mockCreatedSprint);

      const result = await app.create({
        workspaceId: 'ws-1',
        projectId: 'proj-1',
        userId: 'user-1',
        dto: { name: ' Sprint 1 ', goal: 'Goal 1' },
      });

      expect(mockCreateSprintService.create).toHaveBeenCalledWith({
        workspaceId: 'ws-1',
        projectId: 'proj-1',
        name: 'Sprint 1',
        createdBy: 'user-1',
        goal: 'Goal 1',
      });
      expect(mockCreateActivityService.create).toHaveBeenCalled();
      expect(result).toEqual(mockCreatedSprint);
    });
  });
});
