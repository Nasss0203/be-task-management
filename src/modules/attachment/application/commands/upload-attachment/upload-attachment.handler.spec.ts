import { BadRequestException } from '@nestjs/common';
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
  const handler = new UploadAttachmentHandler(
    { save } as never,
    { validateExtension, validateRealFileType } as never,
    { upload } as never,
    { create: createActivity } as never,
  );
  const file = {
    originalName: 'test.png',
    reportedMimeType: 'image/png',
    size: 1024,
    buffer: Buffer.from('image'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    validateExtension.mockReturnValue('.png');
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
          taskId: attachment.getTaskId(),
          commentId: attachment.getCommentId(),
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

  it('rejects upload without a task or comment target', async () => {
    await expect(
      handler.execute(
        new UploadAttachmentCommand(file, 'ws-1', null, null, 'user-1'),
      ),
    ).rejects.toThrow(BadRequestException);
    expect(upload).not.toHaveBeenCalled();
  });

  it('preserves validation, storage, persistence and activity ordering data', async () => {
    const result = await handler.execute(
      new UploadAttachmentCommand(file, 'ws-1', 'task-1', null, 'user-1'),
    );

    expect(validateExtension).toHaveBeenCalledWith('test.png');
    expect(validateRealFileType).toHaveBeenCalledWith(file, '.png');
    expect(upload).toHaveBeenCalledWith({
      buffer: file.buffer,
      workspaceId: 'ws-1',
      taskId: 'task-1',
      commentId: null,
      fileName: 'test.png',
      mimeType: 'image/png',
      uploadedBy: 'user-1',
    });
    expect(save).toHaveBeenCalledWith(expect.any(AttachmentAggregate));
    expect(createActivity).toHaveBeenCalledWith({
      workspaceId: 'ws-1',
      entityType: ActivityEntityType.ATTACHMENT,
      entityId: 'att-1',
      actorId: 'user-1',
      action: ActivityAction.ATTACHMENT_UPLOADED,
      metadata: {
        taskId: 'task-1',
        commentId: null,
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

  it('preserves comment-only targets', async () => {
    const result = await handler.execute(
      new UploadAttachmentCommand(file, 'ws-1', null, 'comment-1', 'user-1'),
    );

    expect(result.taskId).toBeNull();
    expect(result.commentId).toBe('comment-1');
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
        'task-1',
        null,
        'user-1',
      ),
    );

    expect(result.provider).toBe(AttachmentProvider.R2);
    expect(result.storageKey).toBe('workspaces/ws-1/key.pdf');
  });
});
