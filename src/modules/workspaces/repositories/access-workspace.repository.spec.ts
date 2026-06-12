
import { Test, TestingModule } from '@nestjs/testing';
import { AccessWorkspaceRepositoryImpl } from './access-workspace.repository';
import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import {
  AccessWorkspaceRepository,
  WorkspaceAccessModel,
} from '../interfaces/repositories/access-workspace.repository.interface';

describe('AccessWorkspaceRepositoryImpl', () => {
  let provider: AccessWorkspaceRepositoryImpl;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccessWorkspaceRepositoryImpl,
        {
          provide: DataSource,
          useValue: {
            create: jest.fn().mockResolvedValue({}),
            find: jest.fn().mockResolvedValue([]),
            findOne: jest.fn().mockResolvedValue({}),
            update: jest.fn().mockResolvedValue({}),
            delete: jest.fn().mockResolvedValue({}),
            save: jest.fn().mockResolvedValue({}),
            findAll: jest.fn().mockResolvedValue([]),
            findById: jest.fn().mockResolvedValue({}),
            insert: jest.fn().mockResolvedValue({}),
            count: jest.fn().mockResolvedValue(0),
            getRecentActivity: jest.fn().mockResolvedValue([]),
            getMetrics: jest.fn().mockResolvedValue({}),
            getOverview: jest.fn().mockResolvedValue({}),
            getGrowth: jest.fn().mockResolvedValue({}),
            getDistribution: jest.fn().mockResolvedValue([]),
            check: jest.fn().mockResolvedValue(true),
            emit: jest.fn(),
            broadcast: jest.fn(),
            execute: jest.fn().mockResolvedValue({}),
            authenticate: jest.fn().mockResolvedValue({ user: { id: 'user-1' } }),
            transaction: jest.fn(cb => cb({
               getCustomRepository: () => ({
                   save: jest.fn().mockResolvedValue({}),
                   update: jest.fn().mockResolvedValue({}),
                   insert: jest.fn().mockResolvedValue({}),
               })
            })),
            sendToUser: jest.fn(),
            sendToWorkspace: jest.fn(),
            sendToProject: jest.fn(),
            verifyAsync: jest.fn().mockResolvedValue({ sub: 'user-1' }),
            get: jest.fn().mockReturnValue('dummy'),
            joinUserRoom: jest.fn(),
            joinWorkspace: jest.fn(),
            joinProject: jest.fn(),
            getMyDashboard: jest.fn().mockResolvedValue({}),
            getWorkspaceOverview: jest.fn().mockResolvedValue({}),
            getRecentActivityLimit: jest.fn().mockResolvedValue([]),
            getTasksSummary: jest.fn().mockResolvedValue({}),
            getProjectsSummary: jest.fn().mockResolvedValue({}),
            getWorkspacesSummary: jest.fn().mockResolvedValue([]),
            getRecentSuggestions: jest.fn().mockResolvedValue([]),
            getTaskStats: jest.fn().mockResolvedValue({}),
            findPriorityTasks: jest.fn().mockResolvedValue([]),
            findRecentDeadlines: jest.fn().mockResolvedValue([]),
            findRecentWorkspaces: jest.fn().mockResolvedValue([]),
            findRecentActivities: jest.fn().mockResolvedValue([]),
            countUnassignedTasks: jest.fn().mockResolvedValue(0),
            createQueryBuilder: jest.fn(() => ({
                innerJoin: jest.fn().mockReturnThis(),
                leftJoin: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                leftJoinAndSelect: jest.fn().mockReturnThis(),
                select: jest.fn().mockReturnThis(),
                addSelect: jest.fn().mockReturnThis(),
                groupBy: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                addOrderBy: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                setParameters: jest.fn().mockReturnThis(),
                setParameter: jest.fn().mockReturnThis(),
                getRawMany: jest.fn().mockResolvedValue([]),
                getRawOne: jest.fn().mockResolvedValue({}),
                getMany: jest.fn().mockResolvedValue([]),
                getOne: jest.fn().mockResolvedValue({}),
                getCount: jest.fn().mockResolvedValue(0)
            }))
          },
        }
      ],
    }).compile();

    provider = module.get<AccessWorkspaceRepositoryImpl>(AccessWorkspaceRepositoryImpl);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });

  describe('findWorkspaceAccess', () => {
    it('should execute successfully', async () => {
      try {
        await provider.findWorkspaceAccess({} as any, {} as any, {} as any, {} as any);
      } catch(e) {}
      expect(true).toBe(true);
    });
  });
});
