import { UpdateWorkspaceServiceImpl } from './update-workspace.service';
import { WorkspaceModel } from '../domain/models/workspaces.model';

describe('UpdateWorkspaceServiceImpl', () => {
  let service: UpdateWorkspaceServiceImpl;

  const findWorkspaceService = {
    findOneByWorkspaceId: jest.fn(),
  };

  const workspaceRepository = {
    save: jest.fn(),
  };

  beforeEach(() => {
    jest.resetAllMocks();
    service = new UpdateWorkspaceServiceImpl(
      findWorkspaceService as any,
      workspaceRepository as any,
    );
  });

  it('updates workspace name successfully', async () => {
    const userId = 'user-123';
    const workspaceId = 'workspace-123';
    const name = 'New Workspace Name';

    const mockWorkspace = {
      id: workspaceId,
      name: 'Old Workspace Name',
      slug: 'old-workspace-name',
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

    const result = await service.update({ userId, workspaceId, name });

    expect(findWorkspaceService.findOneByWorkspaceId).toHaveBeenCalledWith(
      userId,
      workspaceId,
    );
    expect(workspaceRepository.save).toHaveBeenCalled();
    expect(result.name).toBe(name);
    expect(result).toBeInstanceOf(WorkspaceModel);
  });

  it('preserves old name if name is not provided', async () => {
    const userId = 'user-123';
    const workspaceId = 'workspace-123';

    const mockWorkspace = {
      id: workspaceId,
      name: 'Old Workspace Name',
      slug: 'old-workspace-name',
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

    const result = await service.update({ userId, workspaceId });

    expect(findWorkspaceService.findOneByWorkspaceId).toHaveBeenCalledWith(
      userId,
      workspaceId,
    );
    expect(workspaceRepository.save).toHaveBeenCalled();
    expect(result.name).toBe(mockWorkspace.name);
    expect(result).toBeInstanceOf(WorkspaceModel);
  });
});
