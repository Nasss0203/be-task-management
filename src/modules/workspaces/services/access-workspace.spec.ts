import { ForbiddenException } from '@nestjs/common';
import { AccessWorkspaceServiceImpl } from './access-workspace.service';

describe('AccessWorkspaceServiceImpl', () => {
  let service: AccessWorkspaceServiceImpl;

  const accessWorkspaceRepository = {
    findWorkspaceAccess: jest.fn(),
  };

  beforeEach(() => {
    jest.resetAllMocks();
    service = new AccessWorkspaceServiceImpl(accessWorkspaceRepository as any);
  });

  it('returns workspace access if user is a member', async () => {
    const userId = 'user-123';
    const workspaceId = 'workspace-123';
    const mockAccess = { role: 'admin' };

    accessWorkspaceRepository.findWorkspaceAccess.mockResolvedValue(mockAccess);

    const result = await service.getWorkspaceAccess(userId, workspaceId);

    expect(accessWorkspaceRepository.findWorkspaceAccess).toHaveBeenCalledWith(
      userId,
      workspaceId,
    );
    expect(result).toEqual(mockAccess);
  });

  it('throws ForbiddenException if user is not a member', async () => {
    const userId = 'user-123';
    const workspaceId = 'workspace-123';

    accessWorkspaceRepository.findWorkspaceAccess.mockResolvedValue(null);

    await expect(
      service.getWorkspaceAccess(userId, workspaceId),
    ).rejects.toThrow(ForbiddenException);
    expect(accessWorkspaceRepository.findWorkspaceAccess).toHaveBeenCalledWith(
      userId,
      workspaceId,
    );
  });
});
