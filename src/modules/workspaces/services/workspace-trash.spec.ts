import { HttpException, HttpStatus } from '@nestjs/common';
import { WorkspaceTrashServiceImpl } from './workspace-trash.service';

describe('WorkspaceTrashServiceImpl', () => {
  let service: WorkspaceTrashServiceImpl;

  const workspaceTrashRepository = {
    findDeletedWorkspacesByUserId: jest.fn(),
    softDeleteWorkspace: jest.fn(),
    restoreWorkspace: jest.fn(),
  };

  beforeEach(() => {
    jest.resetAllMocks();
    service = new WorkspaceTrashServiceImpl(workspaceTrashRepository as any);
  });

  describe('findDeletedWorkspacesByUserId', () => {
    it('returns deleted workspaces for user', async () => {
      const userId = 'user-123';
      const mockWorkspaces = [{ id: 'workspace-1', name: 'Deleted Workspace' }];

      workspaceTrashRepository.findDeletedWorkspacesByUserId.mockResolvedValue(
        mockWorkspaces,
      );

      const result = await service.findDeletedWorkspacesByUserId(userId);

      expect(
        workspaceTrashRepository.findDeletedWorkspacesByUserId,
      ).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockWorkspaces);
    });
  });

  describe('softDeleteWorkspace', () => {
    it('soft deletes a workspace successfully', async () => {
      const userId = 'user-123';
      const workspaceId = 'workspace-123';
      const mockWorkspace = { id: workspaceId, name: 'Workspace to delete' };

      workspaceTrashRepository.softDeleteWorkspace.mockResolvedValue(
        mockWorkspace,
      );

      const result = await service.softDeleteWorkspace(userId, workspaceId);

      expect(workspaceTrashRepository.softDeleteWorkspace).toHaveBeenCalledWith(
        userId,
        workspaceId,
      );
      expect(result).toEqual(mockWorkspace);
    });

    it('throws NOT_FOUND exception if workspace to delete is not found', async () => {
      const userId = 'user-123';
      const workspaceId = 'workspace-123';

      workspaceTrashRepository.softDeleteWorkspace.mockResolvedValue(null);

      await expect(
        service.softDeleteWorkspace(userId, workspaceId),
      ).rejects.toMatchObject({
        status: HttpStatus.NOT_FOUND,
      });

      expect(workspaceTrashRepository.softDeleteWorkspace).toHaveBeenCalledWith(
        userId,
        workspaceId,
      );
    });
  });

  describe('restoreWorkspace', () => {
    it('restores a deleted workspace successfully', async () => {
      const userId = 'user-123';
      const workspaceId = 'workspace-123';
      const mockWorkspace = { id: workspaceId, name: 'Restored Workspace' };

      workspaceTrashRepository.restoreWorkspace.mockResolvedValue(
        mockWorkspace,
      );

      const result = await service.restoreWorkspace(userId, workspaceId);

      expect(workspaceTrashRepository.restoreWorkspace).toHaveBeenCalledWith(
        userId,
        workspaceId,
      );
      expect(result).toEqual(mockWorkspace);
    });

    it('throws NOT_FOUND exception if workspace to restore is not found', async () => {
      const userId = 'user-123';
      const workspaceId = 'workspace-123';

      workspaceTrashRepository.restoreWorkspace.mockResolvedValue(null);

      await expect(
        service.restoreWorkspace(userId, workspaceId),
      ).rejects.toMatchObject({
        status: HttpStatus.NOT_FOUND,
      });

      expect(workspaceTrashRepository.restoreWorkspace).toHaveBeenCalledWith(
        userId,
        workspaceId,
      );
    });
  });
});
