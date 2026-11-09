import { AttachmentProvider } from '../../../domain/enums/attachment-provider.enum';
import { BulkDeleteWorkspaceFilesCommand } from './bulk-delete-workspace-files.command';
import { BulkDeleteWorkspaceFilesHandler } from './bulk-delete-workspace-files.handler';

const attachment = (
  id: string,
  workspaceId: string,
  uploadedBy: string,
  storageKey: string | null = `private/${id}`,
) => ({
  getId: () => id,
  getWorkspaceId: () => workspaceId,
  getUploadedBy: () => uploadedBy,
  getProvider: () => AttachmentProvider.S3,
  getStorageKey: () => storageKey,
});

describe('BulkDeleteWorkspaceFilesHandler', () => {
  const findReadyByIds = jest.fn();
  const deleteByIds = jest.fn();
  const deleteStoredFile = jest.fn();
  const authorize = jest.fn();
  const handler = new BulkDeleteWorkspaceFilesHandler(
    { findReadyByIds, deleteByIds } as never,
    { delete: deleteStoredFile } as never,
    { authorize } as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    findReadyByIds.mockResolvedValue([
      attachment('a1', 'ws-1', 'user-a'),
      attachment('b1', 'ws-1', 'user-b'),
      attachment('x1', 'ws-2', 'user-a'),
    ]);
  });

  it('lets the owner delete any file of the workspace, never another workspace', async () => {
    authorize.mockResolvedValue(true);

    await expect(
      handler.execute(
        new BulkDeleteWorkspaceFilesCommand('ws-1', 'owner', [
          'a1',
          'b1',
          'x1',
        ]),
      ),
    ).resolves.toEqual({ deletedCount: 2 });

    expect(authorize).toHaveBeenCalledWith({
      userId: 'owner',
      permissions: ['workspace.update'],
      target: { type: 'workspace', id: 'ws-1' },
    });
    expect(deleteByIds).toHaveBeenCalledWith(['a1', 'b1']);
    expect(deleteStoredFile).toHaveBeenCalledTimes(2);
  });

  it('lets a member delete only the files they uploaded', async () => {
    authorize.mockResolvedValue(false);

    await expect(
      handler.execute(
        new BulkDeleteWorkspaceFilesCommand('ws-1', 'user-a', ['a1', 'b1']),
      ),
    ).resolves.toEqual({ deletedCount: 1 });

    expect(deleteByIds).toHaveBeenCalledWith(['a1']);
    expect(deleteStoredFile).toHaveBeenCalledWith({
      provider: AttachmentProvider.S3,
      key: 'private/a1',
    });
  });

  it('deduplicates ids before loading attachments', async () => {
    authorize.mockResolvedValue(true);

    await handler.execute(
      new BulkDeleteWorkspaceFilesCommand('ws-1', 'owner', ['a1', 'a1']),
    );

    expect(findReadyByIds).toHaveBeenCalledWith(['a1']);
  });

  it('keeps deleting rows when storage fails and skips files without a key', async () => {
    authorize.mockResolvedValue(true);
    findReadyByIds.mockResolvedValue([
      attachment('a1', 'ws-1', 'user-a'),
      attachment('c1', 'ws-1', 'user-a', null),
    ]);
    deleteStoredFile.mockRejectedValue(new Error('s3 down'));

    await expect(
      handler.execute(
        new BulkDeleteWorkspaceFilesCommand('ws-1', 'owner', ['a1', 'c1']),
      ),
    ).resolves.toEqual({ deletedCount: 2 });

    expect(deleteByIds).toHaveBeenCalledWith(['a1', 'c1']);
    expect(deleteStoredFile).toHaveBeenCalledTimes(1);
    expect(deleteByIds.mock.invocationCallOrder[0]).toBeLessThan(
      deleteStoredFile.mock.invocationCallOrder[0],
    );
  });
});
