import { NotFoundException } from '@nestjs/common';
import { AttachmentProvider } from '../../../domain/enums/attachment-provider.enum';
import { DeleteAttachmentCommand } from './delete-attachment.command';
import { DeleteAttachmentHandler } from './delete-attachment.handler';

describe('DeleteAttachmentHandler', () => {
  const deleteAttachment = jest.fn();
  const findReadyById = jest.fn();
  const findBlockById = jest.fn();
  const authorize = jest.fn();
  const deleteStoredFile = jest.fn();
  const handler = new DeleteAttachmentHandler(
    { delete: deleteAttachment, findReadyById } as never,
    { findById: findBlockById } as never,
    { authorize } as never,
    { delete: deleteStoredFile } as never,
  );
  const command = new DeleteAttachmentCommand('att-1', 'user-1');

  const attachmentOn = (
    pageBlockId: string | null,
    provider = AttachmentProvider.R2,
    storageKey: string | null = 'workspaces/ws-1/files/a.pdf',
  ) => ({
    getPageBlockId: () => pageBlockId,
    getProvider: () => provider,
    getStorageKey: () => storageKey,
  });
  const block = (deletedAt: Date | null = null) => ({
    getId: () => 'block-1',
    getDeletedAt: () => deletedAt,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    findReadyById.mockResolvedValue(attachmentOn(null));
  });

  it('preserves hard-delete-only behavior', async () => {
    await handler.execute(command);

    expect(deleteAttachment).toHaveBeenCalledWith('att-1');
    expect(authorize).not.toHaveBeenCalled();
  });

  it('asks storage to delete the file after the row is deleted', async () => {
    findReadyById.mockResolvedValue(
      attachmentOn(
        null,
        AttachmentProvider.S3,
        'private/workspaces/ws-1/a.pdf',
      ),
    );

    await handler.execute(command);

    expect(deleteStoredFile).toHaveBeenCalledWith({
      provider: AttachmentProvider.S3,
      key: 'private/workspaces/ws-1/a.pdf',
    });
    expect(deleteAttachment.mock.invocationCallOrder[0]).toBeLessThan(
      deleteStoredFile.mock.invocationCallOrder[0],
    );
  });

  it('still succeeds when storage fails to delete the file', async () => {
    findReadyById.mockResolvedValue(
      attachmentOn(
        null,
        AttachmentProvider.S3,
        'private/workspaces/ws-1/a.pdf',
      ),
    );
    deleteStoredFile.mockRejectedValue(new Error('s3 down'));

    await expect(handler.execute(command)).resolves.toBeUndefined();
    expect(deleteAttachment).toHaveBeenCalledWith('att-1');
  });

  it('skips storage when the attachment has no storage key', async () => {
    findReadyById.mockResolvedValue(
      attachmentOn(null, AttachmentProvider.CLOUDINARY, null),
    );

    await handler.execute(command);

    expect(deleteStoredFile).not.toHaveBeenCalled();
  });

  it('returns 404 for a missing attachment', async () => {
    findReadyById.mockResolvedValue(null);

    await expect(handler.execute(command)).rejects.toThrow(NotFoundException);
    expect(deleteAttachment).not.toHaveBeenCalled();
  });

  it('requires edit access to the page block holding the file', async () => {
    findReadyById.mockResolvedValue(attachmentOn('block-1'));
    findBlockById.mockResolvedValue(block());
    authorize.mockResolvedValue(false);

    await expect(handler.execute(command)).rejects.toThrow(NotFoundException);
    expect(authorize).toHaveBeenCalledWith({
      userId: 'user-1',
      permissions: ['page_block.update'],
      target: { type: 'pageBlock', id: 'block-1' },
    });
    expect(deleteAttachment).not.toHaveBeenCalled();
  });

  it('deletes when the user can edit the page block', async () => {
    findReadyById.mockResolvedValue(attachmentOn('block-1'));
    findBlockById.mockResolvedValue(block());
    authorize.mockResolvedValue(true);

    await handler.execute(command);

    expect(deleteAttachment).toHaveBeenCalledWith('att-1');
  });

  it.each([
    ['no longer exists', null],
    ['is in the trash', block(new Date('2026-01-01T00:00:00Z'))],
  ])(
    'falls back to the workspace permission when the page block %s',
    async (_label, foundBlock) => {
      findReadyById.mockResolvedValue(attachmentOn('block-1'));
      findBlockById.mockResolvedValue(foundBlock);

      await handler.execute(command);

      expect(authorize).not.toHaveBeenCalled();
      expect(deleteAttachment).toHaveBeenCalledWith('att-1');
    },
  );
});
