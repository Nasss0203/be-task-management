import { AdminWorkspaceMemberSummaryServiceImpl } from './admin-workspace-member-summary.service';

describe('AdminWorkspaceMemberSummaryServiceImpl', () => {
  let service: AdminWorkspaceMemberSummaryServiceImpl;

  const repo = {
    getMemberSummary: jest.fn(),
  };

  beforeEach(() => {
    jest.resetAllMocks();
    service = new AdminWorkspaceMemberSummaryServiceImpl(repo as any);
  });

  it('gets member summary successfully', async () => {
    const workspaceId = 'workspace-123';
    const mockSummary = {
      workspaceId,
      totalMembers: 5,
      activeMembers: 3,
      inactiveMembers: 2,
    };
    
    repo.getMemberSummary.mockResolvedValue(mockSummary);

    const result = await service.getMemberSummary(workspaceId);

    expect(repo.getMemberSummary).toHaveBeenCalledWith(workspaceId, undefined);
    expect(result).toEqual(mockSummary);
  });

  it('gets member summary with manager successfully', async () => {
    const workspaceId = 'workspace-123';
    const manager = {} as any;
    const mockSummary = {
      workspaceId,
      totalMembers: 5,
      activeMembers: 3,
      inactiveMembers: 2,
    };
    
    repo.getMemberSummary.mockResolvedValue(mockSummary);

    const result = await service.getMemberSummary(workspaceId, manager);

    expect(repo.getMemberSummary).toHaveBeenCalledWith(workspaceId, manager);
    expect(result).toEqual(mockSummary);
  });
});
