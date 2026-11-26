import { AttachmentProvider } from '../../domain/enums/attachment-provider.enum';
import { AttachmentStorageRouterAdapter } from './attachment-storage-router.adapter';
import { R2AttachmentStorageAdapter } from './r2-attachment-storage.adapter';
import { S3AttachmentStorageAdapter } from './s3-attachment-storage.adapter';

describe('AttachmentStorageRouterAdapter', () => {
  const s3Upload = jest.fn();
  const s3CreateDownloadUrl = jest.fn();
  const s3Delete = jest.fn();
  const r2CreateDownloadUrl = jest.fn();
  const adapter = new AttachmentStorageRouterAdapter(
    {
      upload: s3Upload,
      createDownloadUrl: s3CreateDownloadUrl,
      delete: s3Delete,
    } as unknown as S3AttachmentStorageAdapter,
    {
      createDownloadUrl: r2CreateDownloadUrl,
    } as unknown as R2AttachmentStorageAdapter,
  );
  const input = {
    filePath: '/tmp/upload',
    size: 4,
    workspaceId: 'ws-1',
    commentId: null,
    pageBlockId: null,
    fileName: 'test.pdf',
    mimeType: 'application/pdf',
    uploadedBy: 'user-1',
  };

  beforeEach(() => jest.clearAllMocks());

  it.each(['image/png', 'application/pdf'])(
    'uploads %s to S3',
    async (mimeType) => {
      await adapter.upload({ ...input, mimeType });

      expect(s3Upload).toHaveBeenCalledWith({ ...input, mimeType });
    },
  );

  it('signs S3 download URLs with S3', async () => {
    s3CreateDownloadUrl.mockResolvedValue({
      downloadUrl: 'https://s3.example/file',
      expiresIn: 300,
    });

    await expect(
      adapter.createDownloadUrl({
        provider: AttachmentProvider.S3,
        key: 'private/key',
        fileName: 'test.pdf',
      }),
    ).resolves.toEqual({
      downloadUrl: 'https://s3.example/file',
      expiresIn: 300,
    });
    expect(s3CreateDownloadUrl).toHaveBeenCalledWith({
      key: 'private/key',
      fileName: 'test.pdf',
    });
    expect(r2CreateDownloadUrl).not.toHaveBeenCalled();
  });

  it('keeps signing legacy R2 download URLs with R2', async () => {
    r2CreateDownloadUrl.mockResolvedValue({
      downloadUrl: 'https://r2.example/file',
      expiresIn: 300,
    });

    await adapter.createDownloadUrl({
      provider: AttachmentProvider.R2,
      key: 'key',
      fileName: 'test.pdf',
    });

    expect(r2CreateDownloadUrl).toHaveBeenCalledWith({
      key: 'key',
      fileName: 'test.pdf',
    });
    expect(s3CreateDownloadUrl).not.toHaveBeenCalled();
  });

  it('deletes only S3 objects', async () => {
    await adapter.delete({ provider: AttachmentProvider.S3, key: 'k1' });
    await adapter.delete({ provider: AttachmentProvider.R2, key: 'k2' });
    await adapter.delete({
      provider: AttachmentProvider.CLOUDINARY,
      key: 'k3',
    });

    expect(s3Delete).toHaveBeenCalledTimes(1);
    expect(s3Delete).toHaveBeenCalledWith('k1');
  });
});
