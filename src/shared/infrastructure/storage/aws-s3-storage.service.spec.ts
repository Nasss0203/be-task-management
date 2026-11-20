import { PutObjectCommand } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { Readable } from 'stream';
import { AwsS3StorageService } from './aws-s3-storage.service';

describe('AwsS3StorageService.upload', () => {
  const send = jest.fn();
  const service = new AwsS3StorageService({
    getOrThrow: (key: string) =>
      key === 'AWS_S3_BUCKET' ? 'bucket' : 'ap-southeast-1',
    get: () => undefined,
  } as unknown as ConfigService);
  Object.assign(service, { client: { send } });

  const sentInput = () =>
    (send.mock.calls[0] as [PutObjectCommand])[0].input as {
      Body: unknown;
      ContentLength: number;
    };

  beforeEach(() => {
    send.mockReset();
    send.mockResolvedValue({});
  });

  it('sends a buffer with its own length', async () => {
    const body = Buffer.from('image');

    await expect(
      service.upload({ key: 'k', body, contentType: 'image/png' }),
    ).resolves.toEqual({ key: 'k', size: 5, contentType: 'image/png' });
    expect(sentInput()).toMatchObject({ Body: body, ContentLength: 5 });
  });

  it('streams a file with the declared content length', async () => {
    const body = Readable.from(['video']);

    await expect(
      service.upload({
        key: 'k',
        body,
        contentLength: 300 * 1024 * 1024,
        contentType: 'video/mp4',
      }),
    ).resolves.toEqual({
      key: 'k',
      size: 300 * 1024 * 1024,
      contentType: 'video/mp4',
    });
    expect(sentInput()).toMatchObject({
      Body: body,
      ContentLength: 300 * 1024 * 1024,
    });
  });
});
