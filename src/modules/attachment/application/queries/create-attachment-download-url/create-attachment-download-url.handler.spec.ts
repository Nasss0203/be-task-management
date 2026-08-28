import { NotFoundException } from '@nestjs/common';
import { AttachmentAggregate } from '../../../domain/aggregates/attachment.aggregate';
import { AttachmentProvider } from '../../../domain/enums/attachment-provider.enum';
import { AttachmentStatus } from '../../../domain/enums/attachment-status.enum';
import { CreateAttachmentDownloadUrlHandler } from './create-attachment-download-url.handler';
import { CreateAttachmentDownloadUrlQuery } from './create-attachment-download-url.query';

const createAttachment = (
  provider: AttachmentProvider,
  storageKey: string | null,
  secureUrl: string | null,
) =>
  AttachmentAggregate.reconstitute({
    id: 'att-1',
    workspaceId: 'ws-1',
    taskId: 'task-1',
    commentId: null,
    uploadedBy: 'user-1',
    fileName: 'file.pdf',
    mimeType: 'application/pdf',
    size: 1024,
    provider,
    storageKey,
    publicId: null,
    url: null,
    secureUrl,
    status: AttachmentStatus.READY,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

describe('CreateAttachmentDownloadUrlHandler', () => {
  const findReadyById = jest.fn();
  const createDownloadUrl = jest.fn();
  const handler = new CreateAttachmentDownloadUrlHandler(
    { findReadyById } as never,
    { createDownloadUrl } as never,
  );
  const query = new CreateAttachmentDownloadUrlQuery('att-1', 'user-1');

  beforeEach(() => jest.clearAllMocks());

  it('throws when the attachment is not READY or missing', async () => {
    findReadyById.mockResolvedValue(null);

    await expect(handler.execute(query)).rejects.toThrow(NotFoundException);
  });

  it('throws when a Cloudinary attachment has no secure URL', async () => {
    findReadyById.mockResolvedValue(
      createAttachment(AttachmentProvider.CLOUDINARY, null, null),
    );

    await expect(handler.execute(query)).rejects.toThrow(
      'Cloudinary URL not found',
    );
  });

  it('returns the direct Cloudinary URL and legacy expiresIn', async () => {
    findReadyById.mockResolvedValue(
      createAttachment(
        AttachmentProvider.CLOUDINARY,
        null,
        'https://cloudinary/file',
      ),
    );

    await expect(handler.execute(query)).resolves.toEqual({
      attachmentId: 'att-1',
      fileName: 'file.pdf',
      mimeType: 'application/pdf',
      size: 1024,
      downloadUrl: 'https://cloudinary/file',
      expiresIn: 31536000,
    });
    expect(createDownloadUrl).not.toHaveBeenCalled();
  });

  it('throws when an R2 attachment has no storage key', async () => {
    findReadyById.mockResolvedValue(
      createAttachment(AttachmentProvider.R2, null, null),
    );

    await expect(handler.execute(query)).rejects.toThrow(
      'Attachment storage key not found',
    );
  });

  it('returns an R2 signed URL', async () => {
    findReadyById.mockResolvedValue(
      createAttachment(AttachmentProvider.R2, 'key', null),
    );
    createDownloadUrl.mockResolvedValue({
      downloadUrl: 'https://r2/signed',
      expiresIn: 300,
    });

    await expect(handler.execute(query)).resolves.toEqual({
      attachmentId: 'att-1',
      fileName: 'file.pdf',
      mimeType: 'application/pdf',
      size: 1024,
      downloadUrl: 'https://r2/signed',
      expiresIn: 300,
    });
    expect(createDownloadUrl).toHaveBeenCalledWith({
      key: 'key',
      fileName: 'file.pdf',
    });
  });
});
