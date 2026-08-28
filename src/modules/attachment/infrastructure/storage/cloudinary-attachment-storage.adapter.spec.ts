import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { AttachmentProvider } from '../../domain/enums/attachment-provider.enum';
import { CloudinaryAttachmentStorageAdapter } from './cloudinary-attachment-storage.adapter';

jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: { upload_stream: jest.fn() },
  },
}));

type UploadCallback = (
  error: { message: string } | null,
  result?: { public_id: string; url: string; secure_url: string },
) => void;

const mockCloudinaryConfig =
  cloudinary.config as unknown as jest.MockedFunction<
    (config: Record<string, string>) => void
  >;
const mockUploadStream = cloudinary.uploader
  .upload_stream as unknown as jest.MockedFunction<
  (
    options: { folder: string; resource_type: string },
    callback: UploadCallback,
  ) => { end(buffer: Buffer): void }
>;

describe('CloudinaryAttachmentStorageAdapter', () => {
  const getOrThrow = jest.fn((key: string) => key);
  const adapter = new CloudinaryAttachmentStorageAdapter({
    getOrThrow,
  } as unknown as ConfigService);
  const baseInput = {
    buffer: Buffer.from('image'),
    workspaceId: 'ws-1',
    taskId: 'task-1',
    commentId: null,
    fileName: 'image.png',
    mimeType: 'image/png',
    uploadedBy: 'user-1',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUploadStream.mockImplementation((_options, callback) => ({
      end: () =>
        callback(null, {
          public_id: 'public-id',
          url: 'http://url',
          secure_url: 'https://url',
        }),
    }));
  });

  it('configures the Cloudinary SDK with the existing environment keys', () => {
    new CloudinaryAttachmentStorageAdapter({
      getOrThrow,
    } as unknown as ConfigService);

    expect(mockCloudinaryConfig).toHaveBeenCalledWith({
      cloud_name: 'CLOUDINARY_CLOUD_NAME',
      api_key: 'CLOUDINARY_API_KEY',
      api_secret: 'CLOUDINARY_API_SECRET',
    });
  });

  it('preserves task folder and upload response mapping', async () => {
    await expect(adapter.upload(baseInput)).resolves.toEqual({
      provider: AttachmentProvider.CLOUDINARY,
      storageKey: null,
      publicId: 'public-id',
      url: 'http://url',
      secureUrl: 'https://url',
    });
    expect(mockUploadStream).toHaveBeenCalledWith(
      {
        folder: 'workspaces/ws-1/tasks/task-1',
        resource_type: 'image',
      },
      expect.any(Function),
    );
  });

  it('preserves comment folder behavior', async () => {
    await adapter.upload({
      ...baseInput,
      taskId: null,
      commentId: 'comment-1',
    });

    expect(mockUploadStream).toHaveBeenCalledWith(
      {
        folder: 'workspaces/ws-1/comments/comment-1',
        resource_type: 'image',
      },
      expect.any(Function),
    );
  });
});
