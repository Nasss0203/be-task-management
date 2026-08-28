import { StorageService } from 'src/shared/infrastructure/storage/storage.service';
import { AttachmentProvider } from '../../domain/enums/attachment-provider.enum';
import { R2AttachmentStorageAdapter } from './r2-attachment-storage.adapter';

describe('R2AttachmentStorageAdapter', () => {
  const buildStorageKey = jest.fn();
  const uploadBuffer = jest.fn();
  const createDownloadUrl = jest.fn();
  const storageService = {
    buildStorageKey,
    uploadBuffer,
    createDownloadUrl,
  } as unknown as StorageService;
  const adapter = new R2AttachmentStorageAdapter(storageService);

  beforeEach(() => jest.clearAllMocks());

  it('preserves key generation and object metadata behavior', async () => {
    const input = {
      buffer: Buffer.from('pdf'),
      workspaceId: 'ws-1',
      taskId: 'task-1',
      commentId: null,
      fileName: 'My File.pdf',
      mimeType: 'application/pdf',
      uploadedBy: 'user-1',
    };
    buildStorageKey.mockReturnValue('workspaces/ws-1/key.pdf');

    await expect(adapter.upload(input)).resolves.toEqual({
      provider: AttachmentProvider.R2,
      storageKey: 'workspaces/ws-1/key.pdf',
      publicId: null,
      url: null,
      secureUrl: null,
    });
    expect(buildStorageKey).toHaveBeenCalledWith({
      workspaceId: 'ws-1',
      taskId: 'task-1',
      commentId: undefined,
      fileName: 'My File.pdf',
    });
    expect(uploadBuffer).toHaveBeenCalledWith({
      key: 'workspaces/ws-1/key.pdf',
      buffer: input.buffer,
      contentType: 'application/pdf',
      metadata: {
        uploadedBy: 'user-1',
        originalName: encodeURIComponent('My File.pdf'),
      },
    });
  });

  it('preserves shared signed URL behavior', async () => {
    createDownloadUrl.mockResolvedValue({
      downloadUrl: 'signed-url',
      expiresIn: 300,
    });

    await expect(
      adapter.createDownloadUrl({ key: 'key', fileName: 'file.pdf' }),
    ).resolves.toEqual({ downloadUrl: 'signed-url', expiresIn: 300 });
    expect(createDownloadUrl).toHaveBeenCalledWith({
      key: 'key',
      fileName: 'file.pdf',
    });
  });
});
