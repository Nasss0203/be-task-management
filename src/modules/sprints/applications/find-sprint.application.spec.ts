import { Test, TestingModule } from '@nestjs/testing';
import { FindSprintApplicationImpl } from './find-sprint.application';
import { SPRINT_TYPES } from '../interfaces/types';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('FindSprintApplicationImpl', () => {
  let app: FindSprintApplicationImpl;

  const mockFindSprintService = {
    findDeletedSprints: jest.fn(),
    findAllSprintByProject: jest.fn(),
    findTasksBySprint: jest.fn(),
    getSprintProgress: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindSprintApplicationImpl,
        {
          provide: SPRINT_TYPES.services.FindSprintService,
          useValue: mockFindSprintService,
        },
      ],
    }).compile();

    app = module.get<FindSprintApplicationImpl>(FindSprintApplicationImpl);
  });

  it('should be defined', () => {
    expect(app).toBeDefined();
  });

  describe('findDeletedSprints', () => {
    it('should return mapped deleted sprints', async () => {
      mockFindSprintService.findDeletedSprints.mockResolvedValue([
        { id: 'sprint-1' },
      ]);
      const result = await app.findDeletedSprints('ws-1', 'proj-1');
      expect(result).toEqual([{ id: 'sprint-1' }]);
    });
  });

  describe('findAllSprintByProject', () => {
    it('should throw BadRequestException if from > to', async () => {
      await expect(
        app.findAllSprintByProject({
          workspaceId: 'ws-1',
          projectId: 'proj-1',
          userId: 'user-1',
          from: '2023-01-02',
          to: '2023-01-01',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should return mapped sprints', async () => {
      mockFindSprintService.findAllSprintByProject.mockResolvedValue([
        { id: 'sprint-1' },
      ]);
      const result = await app.findAllSprintByProject({
        workspaceId: 'ws-1',
        projectId: 'proj-1',
        userId: 'user-1',
      });
      expect(result).toEqual([{ id: 'sprint-1' }]);
    });
  });

  describe('findTasksBySprint', () => {
    it('should throw NotFoundException if sprint not found', async () => {
      mockFindSprintService.findTasksBySprint.mockResolvedValue(null);
      await expect(
        app.findTasksBySprint({
          workspaceId: 'ws-1',
          projectId: 'proj-1',
          sprintId: 'sprint-1',
          userId: 'user-1',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return mapped sprint', async () => {
      mockFindSprintService.findTasksBySprint.mockResolvedValue({
        id: 'sprint-1',
      });
      const result = await app.findTasksBySprint({
        workspaceId: 'ws-1',
        projectId: 'proj-1',
        sprintId: 'sprint-1',
        userId: 'user-1',
      });
      expect(result).toEqual({ id: 'sprint-1' });
    });
  });

  describe('getSprintProgress', () => {
    it('should throw NotFoundException if sprint progress not found', async () => {
      mockFindSprintService.getSprintProgress.mockResolvedValue(null);
      await expect(
        app.getSprintProgress({
          workspaceId: 'ws-1',
          projectId: 'proj-1',
          sprintId: 'sprint-1',
          userId: 'user-1',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return sprint progress', async () => {
      const mockProgress = {
        sprintId: 'sprint-1',
        totalTasks: 5,
        completedTasks: 3,
      };
      mockFindSprintService.getSprintProgress.mockResolvedValue(mockProgress);
      const result = await app.getSprintProgress({
        workspaceId: 'ws-1',
        projectId: 'proj-1',
        sprintId: 'sprint-1',
        userId: 'user-1',
      });
      expect(result).toEqual(mockProgress);
    });
  });
});
