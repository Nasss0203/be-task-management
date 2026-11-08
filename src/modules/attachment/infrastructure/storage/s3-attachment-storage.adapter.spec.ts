import { ConfigService } from '@nestjs/config';
import type { ObjectStoragePort } from 'src/shared/application/ports/object-storage.port';
import { StorageService } from 'src/shared/infrastructure/storage/storage.service';
import { AttachmentProvider } from '../../domain/enums/attachment-provider.enum';
import { S3AttachmentStorageAdapter } from './s3-attachment-storage.adapter';

describe('S3AttachmentStorageAdapter', () => {
  const objectStorage = {
    upload: jest.fn(),
    delete: jest.fn(),
    getSignedDownloadUrl: jest.fn(),
  };
  const buildStorageKey = jest.fn();
  const adapter = new S3AttachmentStorageAdapter(
    objectStorage as ObjectStoragePort,
    { buildStorageKey } as unknown as StorageService,
    {
      getOrThrow: () => 'https://cdn.example.com/',
    } as unknown as ConfigService,
  );
  const imageKey = 'workspaces/ws-1/page-blocks/block-1/uuid-anh-bia.png';
  const imageUrl = `https://cdn.example.com/public/${imageKey}`;
  const input = {
    buffer: Buffer.from('file'),
    workspaceId: 'ws-1',
    taskId: null,
    commentId: null,
    pageBlockId: 'block-1',
    fileName: 'Ảnh bìa.png',
    mimeType: 'image/png',
    uploadedBy: 'user-1',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    buildStorageKey.mockReturnValue(imageKey);
  });

  it('stores displayable images under public/ with a public URL', async () => {
    await expect(adapter.upload(input)).resolves.toEqual({
      provider: AttachmentProvider.S3,
      storageKey: `public/${imageKey}`,
      publicId: null,
      url: imageUrl,
      secureUrl: imageUrl,
    });
    expect(buildStorageKey).toHaveBeenCalledWith({
      workspaceId: 'ws-1',
      taskId: undefined,
      commentId: undefined,
      pageBlockId: 'block-1',
      fileName: 'Ảnh bìa.png',
    });
    expect(objectStorage.upload).toHaveBeenCalledWith({
      key: `public/${imageKey}`,
      body: input.buffer,
      contentType: 'image/png',
    });
  });

  it.each(['application/pdf', 'image/svg+xml'])(
    'keeps %s private without a URL',
    async (mimeType) => {
      buildStorageKey.mockReturnValue('workspaces/ws-1/tasks/task-1/uuid-f');

      const result = await adapter.upload({
        ...input,
        taskId: 'task-1',
        pageBlockId: null,
        mimeType,
      });

      expect(result).toMatchObject({
        storageKey: 'private/workspaces/ws-1/tasks/task-1/uuid-f',
        url: null,
        secureUrl: null,
      });
    },
  );

  it('signs downloads with the original file name', async () => {
    objectStorage.getSignedDownloadUrl.mockResolvedValue('https://signed');

    await expect(
      adapter.createDownloadUrl({
        key: 'private/k',
        fileName: 'Hợp đồng.pdf',
        contentType: 'application/pdf',
      }),
    ).resolves.toEqual({ downloadUrl: 'https://signed', expiresIn: 300 });
    expect(objectStorage.getSignedDownloadUrl).toHaveBeenCalledWith(
      'private/k',
      300,
      { fileName: 'Hợp đồng.pdf', contentType: 'application/pdf' },
    );
  });
});
