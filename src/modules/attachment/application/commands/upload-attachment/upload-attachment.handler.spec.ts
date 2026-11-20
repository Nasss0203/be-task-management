import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  ActivityAction,
  ActivityEntityType,
} from 'src/modules/activity/domain/entities/activity.entity';
import { AttachmentAggregate } from '../../../domain/aggregates/attachment.aggregate';
import { AttachmentProvider } from '../../../domain/enums/attachment-provider.enum';
import { UploadAttachmentCommand } from './upload-attachment.command';
import { UploadAttachmentHandler } from './upload-attachment.handler';

describe('UploadAttachmentHandler', () => {
  const save = jest.fn();
  const validateExtension = jest.fn();
  const validateRealFileType = jest.fn();
  const upload = jest.fn();
  const createActivity = jest.fn();
  const findBlockById = jest.fn();
  const findPageById = jest.fn();
  const findCommentById = jest.fn();
  const authorize = jest.fn();
  const deleteObject = jest.fn();
  const assertWithinLimit = jest.fn();
  const unitOfWork = {
    runInTransaction: (work: (context: unknown) => Promise<unknown>) =>
      work('tx'),
  };
  const handler = new UploadAttachmentHandler(
    { save } as never,
    { validateExtension, validateRealFileType } as never,
    { upload, delete: deleteObject } as never,
    { create: createActivity } as never,
    { findById: findBlockById } as never,
    { findById: findPageById } as never,
    { findById: findCommentById } as never,
    { authorize } as never,
    unitOfWork as never,
    { assertWithinLimit } as never,
  );
  const file = {
    originalName: 'test.png',
    reportedMimeType: 'image/png',
    size: 1024,
    path: '/tmp/upload-1',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    validateExtension.mockReturnValue('.png');
    findBlockById.mockResolvedValue({
      getPageId: () => 'page-1',
      getDeletedAt: () => null,
    });
    findPageById.mockResolvedValue({ getWorkspaceId: () => 'ws-1' });
    findCommentById.mockResolvedValue({
      getWorkspaceId: () => 'ws-1',
      isDeleted: () => false,
    });
    authorize.mockResolvedValue(true);
    assertWithinLimit.mockResolvedValue(undefined);
    deleteObject.mockResolvedValue(undefined);
    validateRealFileType.mockResolvedValue('image/png');
    upload.mockResolvedValue({
      provider: AttachmentProvider.CLOUDINARY,
      storageKey: null,
      publicId: 'public-id',
      url: 'http://url',
      secureUrl: 'https://secure-url',
    });
    save.mockImplementation((attachment: AttachmentAggregate) =>
      Promise.resolve(
        AttachmentAggregate.reconstitute({
          id: 'att-1',
          workspaceId: attachment.getWorkspaceId(),
          commentId: attachment.getCommentId(),
          pageBlockId: attachment.getPageBlockId(),
          uploadedBy: attachment.getUploadedBy(),
          fileName: attachment.getFileName(),
          mimeType: attachment.getMimeType(),
          size: attachment.getSize(),
          provider: attachment.getProvider(),
          storageKey: attachment.getStorageKey(),
          publicId: attachment.getPublicId(),
          url: attachment.getUrl(),
          secureUrl: attachment.getSecureUrl(),
          status: attachment.getStatus(),
          createdAt: attachment.getCreatedAt(),
          updatedAt: attachment.getUpdatedAt(),
        }),
      ),
    );
  });

  it('rejects upload without a comment or page block target', async () => {
    await expect(
      handler.execute(
        new UploadAttachmentCommand(file, 'ws-1', null, null, 'user-1'),
      ),
    ).rejects.toThrow(BadRequestException);
    expect(upload).not.toHaveBeenCalled();
  });

  describe('with a page block target', () => {
    const uploadToBlock = () =>
      handler.execute(
        new UploadAttachmentCommand(file, 'ws-1', null, 'block-1', 'user-1'),
      );

    it('uploads when the user can edit the block of this workspace', async () => {
      await expect(uploadToBlock()).resolves.toMatchObject({
        pageBlockId: 'block-1',
      });
      expect(authorize).toHaveBeenCalledWith({
        userId: 'user-1',
        permissions: ['page_block.update'],
        target: { type: 'pageBlock', id: 'block-1' },
      });
    });

    it('rejects a block of another workspace', async () => {
      findPageById.mockResolvedValue({ getWorkspaceId: () => 'ws-2' });

      await expect(uploadToBlock()).rejects.toThrow(NotFoundException);
      expect(upload).not.toHaveBeenCalled();
    });

    it('rejects a block the user cannot edit', async () => {
      authorize.mockResolvedValue(false);

      await expect(uploadToBlock()).rejects.toThrow(NotFoundException);
      expect(upload).not.toHaveBeenCalled();
    });

    it.each([
      ['missing', null],
      [
        'in the trash',
        { getPageId: () => 'page-1', getDeletedAt: () => new Date() },
      ],
    ])('rejects a block that is %s', async (_label, foundBlock) => {
      findBlockById.mockResolvedValue(foundBlock);

      await expect(uploadToBlock()).rejects.toThrow(NotFoundException);
      expect(upload).not.toHaveBeenCalled();
    });
  });

  it('preserves validation, storage, persistence and activity ordering data', async () => {
    const result = await handler.execute(
      new UploadAttachmentCommand(file, 'ws-1', 'comment-1', null, 'user-1'),
    );

    expect(validateExtension).toHaveBeenCalledWith('test.png');
    expect(validateRealFileType).toHaveBeenCalledWith(file, '.png');
    expect(upload).toHaveBeenCalledWith({
      filePath: '/tmp/upload-1',
      size: 1024,
      workspaceId: 'ws-1',
      commentId: 'comment-1',
      pageBlockId: null,
      fileName: 'test.png',
      mimeType: 'image/png',
      uploadedBy: 'user-1',
    });
    expect(save).toHaveBeenCalledWith(expect.any(AttachmentAggregate), 'tx');
    expect(createActivity).toHaveBeenCalledWith({
      workspaceId: 'ws-1',
      entityType: ActivityEntityType.ATTACHMENT,
      entityId: 'att-1',
      actorId: 'user-1',
      action: ActivityAction.ATTACHMENT_UPLOADED,
      metadata: {
        commentId: 'comment-1',
        pageBlockId: null,
        fileName: 'test.png',
        mimeType: 'image/png',
        size: 1024,
      },
    });
    expect(result).toEqual(
      expect.objectContaining({
        id: 'att-1',
        provider: AttachmentProvider.CLOUDINARY,
        secureUrl: 'https://secure-url',
      }),
    );
  });

  describe('storage limit', () => {
    const uploadToTask = () =>
      handler.execute(
        new UploadAttachmentCommand(file, 'ws-1', 'comment-1', null, 'user-1'),
      );

    it('checks the single-file limit, then storage before uploading and again inside the transaction', async () => {
      await uploadToTask();

      expect(assertWithinLimit).toHaveBeenNthCalledWith(
        1,
        'ws-1',
        'MAX_FILE_SIZE_MB',
        1024 / (1024 * 1024),
      );
      expect(assertWithinLimit).toHaveBeenNthCalledWith(
        2,
        'ws-1',
        'MAX_STORAGE_MB',
        1024 / (1024 * 1024),
      );
      expect(assertWithinLimit).toHaveBeenNthCalledWith(
        3,
        'ws-1',
        'MAX_STORAGE_MB',
        1024 / (1024 * 1024),
        'tx',
      );
    });

    it('does not upload or check storage when the file exceeds the plan file size', async () => {
      assertWithinLimit.mockRejectedValueOnce(
        new ForbiddenException('WORKSPACE_LIMIT_EXCEEDED'),
      );

      await expect(uploadToTask()).rejects.toThrow(ForbiddenException);
      expect(assertWithinLimit).toHaveBeenCalledTimes(1);
      expect(assertWithinLimit).toHaveBeenCalledWith(
        'ws-1',
        'MAX_FILE_SIZE_MB',
        expect.any(Number),
      );
      expect(upload).not.toHaveBeenCalled();
      expect(save).not.toHaveBeenCalled();
    });

    it('does not upload when the workspace is already full', async () => {
      assertWithinLimit
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(
          new ForbiddenException('WORKSPACE_LIMIT_EXCEEDED'),
        );

      await expect(uploadToTask()).rejects.toThrow(ForbiddenException);
      expect(upload).not.toHaveBeenCalled();
      expect(save).not.toHaveBeenCalled();
    });

    it('deletes the uploaded object when the locked re-check fails', async () => {
      upload.mockResolvedValue({
        provider: AttachmentProvider.S3,
        storageKey: 'workspaces/ws-1/key.png',
        publicId: null,
        url: null,
        secureUrl: null,
      });
      assertWithinLimit
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(
          new ForbiddenException('WORKSPACE_LIMIT_EXCEEDED'),
        );

      await expect(uploadToTask()).rejects.toThrow(ForbiddenException);
      expect(save).not.toHaveBeenCalled();
      expect(deleteObject).toHaveBeenCalledWith({
        provider: AttachmentProvider.S3,
        key: 'workspaces/ws-1/key.png',
      });
      expect(createActivity).not.toHaveBeenCalled();
    });
  });

  it('preserves comment-only targets', async () => {
    const result = await handler.execute(
      new UploadAttachmentCommand(file, 'ws-1', 'comment-1', null, 'user-1'),
    );

    expect(result.commentId).toBe('comment-1');
    expect(findCommentById).toHaveBeenCalledWith('comment-1');
  });

  it.each([
    ['missing', null],
    ['deleted', { getWorkspaceId: () => 'ws-1', isDeleted: () => true }],
    [
      'of another workspace',
      { getWorkspaceId: () => 'ws-2', isDeleted: () => false },
    ],
  ])('rejects a comment that is %s', async (_label, foundComment) => {
    findCommentById.mockResolvedValue(foundComment);

    await expect(
      handler.execute(
        new UploadAttachmentCommand(file, 'ws-1', 'comment-1', null, 'user-1'),
      ),
    ).rejects.toThrow(NotFoundException);
    expect(upload).not.toHaveBeenCalled();
  });

  it('persists R2 storage metadata returned by the storage port', async () => {
    validateExtension.mockReturnValue('.pdf');
    validateRealFileType.mockResolvedValue('application/pdf');
    upload.mockResolvedValue({
      provider: AttachmentProvider.R2,
      storageKey: 'workspaces/ws-1/key.pdf',
      publicId: null,
      url: null,
      secureUrl: null,
    });

    const result = await handler.execute(
      new UploadAttachmentCommand(
        { ...file, originalName: 'test.pdf' },
        'ws-1',
        'comment-1',
        null,
        'user-1',
      ),
    );

    expect(result.provider).toBe(AttachmentProvider.R2);
    expect(result.storageKey).toBe('workspaces/ws-1/key.pdf');
  });
});
