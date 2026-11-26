import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AttachmentAggregate } from '../../../domain/aggregates/attachment.aggregate';
import { AttachmentProvider } from '../../../domain/enums/attachment-provider.enum';
import { AttachmentStatus } from '../../../domain/enums/attachment-status.enum';
import { CreatePublicSiteAttachmentDownloadUrlHandler } from './create-public-site-attachment-download-url.handler';
import { CreatePublicSiteAttachmentDownloadUrlQuery } from './create-public-site-attachment-download-url.query';

const createAttachment = (
  overrides: { workspaceId?: string; pageBlockId?: string | null } = {},
) =>
  AttachmentAggregate.reconstitute({
    id: 'att-1',
    workspaceId: overrides.workspaceId ?? 'ws-1',
    commentId: null,
    pageBlockId:
      overrides.pageBlockId === undefined ? 'block-1' : overrides.pageBlockId,
    uploadedBy: 'user-1',
    fileName: 'clip.mp4',
    mimeType: 'video/mp4',
    size: 2048,
    provider: AttachmentProvider.S3,
    storageKey: 'private/ws-1/clip.mp4',
    publicId: null,
    url: null,
    secureUrl: null,
    status: AttachmentStatus.READY,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

const createBlock = (
  overrides: {
    pageId?: string;
    deletedAt?: Date | null;
    attachmentId?: string;
  } = {},
) => ({
  getPageId: () => overrides.pageId ?? 'page-1',
  getDeletedAt: () => overrides.deletedAt ?? null,
  getContent: () => ({ attachmentId: overrides.attachmentId ?? 'att-1' }),
});

describe('CreatePublicSiteAttachmentDownloadUrlHandler', () => {
  const findReadyById = jest.fn();
  const createDownloadUrl = jest.fn();
  const findActiveBySubdomain = jest.fn();
  const findActiveBySiteAndPath = jest.fn();
  const findById = jest.fn();
  const resolve = jest.fn();
  const handler = new CreatePublicSiteAttachmentDownloadUrlHandler(
    { findReadyById } as never,
    { createDownloadUrl } as never,
    { findActiveBySubdomain } as never,
    { findActiveBySiteAndPath } as never,
    { findById } as never,
    { resolve } as never,
  );
  const query = new CreatePublicSiteAttachmentDownloadUrlQuery(
    'marketing',
    '/',
    'att-1',
  );

  beforeEach(() => {
    jest.clearAllMocks();
    findActiveBySubdomain.mockResolvedValue({
      getId: () => 'site-1',
      getWorkspaceId: () => 'ws-1',
    });
    findActiveBySiteAndPath.mockResolvedValue({ id: 'publication-1' });
    resolve.mockResolvedValue({ page: { getId: () => 'page-1' } });
    findReadyById.mockResolvedValue(createAttachment());
    findById.mockResolvedValue(createBlock());
    createDownloadUrl.mockResolvedValue({
      downloadUrl: 'https://storage.test/signed',
      expiresIn: 300,
    });
  });

  it('returns a signed URL for a file shown on the published page', async () => {
    await expect(handler.execute(query)).resolves.toMatchObject({
      attachmentId: 'att-1',
      downloadUrl: 'https://storage.test/signed',
      expiresIn: 300,
    });
    expect(findActiveBySiteAndPath).toHaveBeenCalledWith('site-1', '/');
    expect(createDownloadUrl).toHaveBeenCalledWith({
      provider: AttachmentProvider.S3,
      key: 'private/ws-1/clip.mp4',
      fileName: 'clip.mp4',
      contentType: 'video/mp4',
    });
  });

  it.each([
    [
      'the site is missing or disabled',
      () => findActiveBySubdomain.mockResolvedValue(null),
    ],
    [
      'the path is invalid',
      () =>
        findActiveBySiteAndPath.mockRejectedValue(new BadRequestException()),
    ],
    [
      'the path is not published',
      () => findActiveBySiteAndPath.mockResolvedValue(null),
    ],
    ['the publication is unavailable', () => resolve.mockResolvedValue(null)],
    ['the attachment is missing', () => findReadyById.mockResolvedValue(null)],
    [
      'the attachment belongs to a comment',
      () =>
        findReadyById.mockResolvedValue(
          createAttachment({ pageBlockId: null }),
        ),
    ],
    [
      'the attachment is from another workspace',
      () =>
        findReadyById.mockResolvedValue(
          createAttachment({ workspaceId: 'ws-2' }),
        ),
    ],
    [
      'the block is on another page',
      () => findById.mockResolvedValue(createBlock({ pageId: 'page-2' })),
    ],
    [
      'the block was deleted',
      () => findById.mockResolvedValue(createBlock({ deletedAt: new Date() })),
    ],
    [
      'the block now shows another file',
      () => findById.mockResolvedValue(createBlock({ attachmentId: 'att-2' })),
    ],
  ])('hides the file when %s', async (_case, arrange) => {
    arrange();

    await expect(handler.execute(query)).rejects.toThrow(NotFoundException);
    expect(createDownloadUrl).not.toHaveBeenCalled();
  });
});
