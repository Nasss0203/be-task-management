import { StorageService } from 'src/shared/infrastructure/storage/storage.service';
import { R2AttachmentStorageAdapter } from './r2-attachment-storage.adapter';

describe('R2AttachmentStorageAdapter', () => {
  const createDownloadUrl = jest.fn();
  const adapter = new R2AttachmentStorageAdapter({
    createDownloadUrl,
  } as unknown as StorageService);

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
