import { AttachmentProvider } from '../../domain/enums/attachment-provider.enum';
import { AttachmentStorageRouterAdapter } from './attachment-storage-router.adapter';
import { CloudinaryAttachmentStorageAdapter } from './cloudinary-attachment-storage.adapter';
import { R2AttachmentStorageAdapter } from './r2-attachment-storage.adapter';

describe('AttachmentStorageRouterAdapter', () => {
  const cloudinaryUpload = jest.fn();
  const r2Upload = jest.fn();
  const r2CreateDownloadUrl = jest.fn();
  const cloudinaryStorage = {
    upload: cloudinaryUpload,
  } as unknown as CloudinaryAttachmentStorageAdapter;
  const r2Storage = {
    upload: r2Upload,
    createDownloadUrl: r2CreateDownloadUrl,
  } as unknown as R2AttachmentStorageAdapter;
  const adapter = new AttachmentStorageRouterAdapter(
    cloudinaryStorage,
    r2Storage,
  );
  const input = {
    buffer: Buffer.from('file'),
    workspaceId: 'ws-1',
    taskId: 'task-1',
    commentId: null,
    fileName: 'test.png',
    mimeType: 'image/png',
    uploadedBy: 'user-1',
  };

  beforeEach(() => jest.clearAllMocks());

  it('routes image MIME types to Cloudinary', async () => {
    cloudinaryUpload.mockResolvedValue({
      provider: AttachmentProvider.CLOUDINARY,
    });

    await adapter.upload(input);

    expect(cloudinaryUpload).toHaveBeenCalledWith(input);
    expect(r2Upload).not.toHaveBeenCalled();
  });

  it('routes non-image MIME types to R2', async () => {
    const pdfInput = {
      ...input,
      fileName: 'test.pdf',
      mimeType: 'application/pdf',
    };
    r2Upload.mockResolvedValue({ provider: AttachmentProvider.R2 });

    await adapter.upload(pdfInput);

    expect(r2Upload).toHaveBeenCalledWith(pdfInput);
    expect(cloudinaryUpload).not.toHaveBeenCalled();
  });

  it('delegates signed download URLs to R2', async () => {
    r2CreateDownloadUrl.mockResolvedValue({
      downloadUrl: 'https://r2.example/file',
      expiresIn: 300,
    });

    await expect(
      adapter.createDownloadUrl({ key: 'key', fileName: 'test.pdf' }),
    ).resolves.toEqual({
      downloadUrl: 'https://r2.example/file',
      expiresIn: 300,
    });
  });
});
