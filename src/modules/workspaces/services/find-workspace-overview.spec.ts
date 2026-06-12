import { FindWorkspaceOverviewServiceImpl } from './find-workspace-overview.service';

describe('FindWorkspaceOverviewServiceImpl', () => {
  let service: FindWorkspaceOverviewServiceImpl;

  const repo = {
    findOverview: jest.fn(),
  };

  beforeEach(() => {
    jest.resetAllMocks();
    service = new FindWorkspaceOverviewServiceImpl(repo as any);
  });

  it('finds overview successfully', async () => {
    const workspaceId = 'workspace-123';
    const mockOverview = {
      id: workspaceId,
      name: 'Test',
      slug: 'test',
      planType: 'FREE',
      layoutMode: 'TABS',
      createdAt: new Date(),
      totalMembers: 1,
      totalProjects: 1,
      totalViews: 1,
      totalTasks: 1,
      storageUsed: 0,
    };
    
    repo.findOverview.mockResolvedValue(mockOverview);

    const result = await service.findOverview(workspaceId);

    expect(repo.findOverview).toHaveBeenCalledWith(workspaceId, undefined);
    expect(result).toEqual(mockOverview);
  });

  it('finds overview with manager successfully', async () => {
    const workspaceId = 'workspace-123';
    const manager = {} as any;
    const mockOverview = {
      id: workspaceId,
      name: 'Test',
      slug: 'test',
      planType: 'FREE',
      layoutMode: 'TABS',
      createdAt: new Date(),
      totalMembers: 1,
      totalProjects: 1,
      totalViews: 1,
      totalTasks: 1,
      storageUsed: 0,
    };
    
    repo.findOverview.mockResolvedValue(mockOverview);

    const result = await service.findOverview(workspaceId, manager);

    expect(repo.findOverview).toHaveBeenCalledWith(workspaceId, manager);
    expect(result).toEqual(mockOverview);
  });
});
