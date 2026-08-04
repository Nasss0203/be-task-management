import { UpdateWorkspaceLayoutModeServiceImpl } from './update-workspace-layout-mode.service';
import { WorkspaceModel } from '../domain/models/workspaces.model';

describe('UpdateWorkspaceLayoutModeServiceImpl', () => {
  let service: UpdateWorkspaceLayoutModeServiceImpl;

  const findWorkspaceService = {
    findOneByWorkspaceId: jest.fn(),
  };

  const workspaceRepository = {
    save: jest.fn(),
  };

  beforeEach(() => {
    jest.resetAllMocks();
    service = new UpdateWorkspaceLayoutModeServiceImpl(
      findWorkspaceService as any,
      workspaceRepository as any,
    );
  });

  it('updates workspace layout mode successfully', async () => {
    const userId = 'user-123';
    const workspaceId = 'workspace-123';
    const layoutMode = 'LIST';

    const mockWorkspace = {
      id: workspaceId,
      name: 'Workspace Name',
      slug: 'workspace-name',
      planType: 'FREE',
      layoutMode: 'TABS',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      deletedBy: null,
    };

    findWorkspaceService.findOneByWorkspaceId.mockResolvedValue(mockWorkspace);
    workspaceRepository.save.mockImplementation((workspace) =>
      Promise.resolve(workspace),
    );

    const result = await service.updateLayoutMode({
      userId,
      workspaceId,
      layoutMode: layoutMode as any,
    });

    expect(findWorkspaceService.findOneByWorkspaceId).toHaveBeenCalledWith(
      userId,
      workspaceId,
    );
    expect(workspaceRepository.save).toHaveBeenCalled();
    expect(result.layoutMode).toBe(layoutMode);
    expect(result).toBeInstanceOf(WorkspaceModel);
  });
});
