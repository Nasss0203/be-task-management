import { ConfigService } from '@nestjs/config';
import type { ObjectStoragePort } from 'src/shared/application/ports/object-storage.port';
import { S3AvatarStorageAdapter } from './s3-avatar-storage.adapter';

describe('S3AvatarStorageAdapter', () => {
  const objectStorage = {
    upload: jest.fn(),
    delete: jest.fn(),
    getSignedDownloadUrl: jest.fn(),
  };
  const adapter = new S3AvatarStorageAdapter(
    objectStorage as ObjectStoragePort,
    {
      getOrThrow: () => 'https://cdn.example.com',
    } as unknown as ConfigService,
  );

  beforeEach(() => jest.clearAllMocks());

  it('uploads under the user public prefix and returns its public URL', async () => {
    const url = await adapter.upload('user-1', Buffer.from('x'), 'image/png');

    expect(url).toMatch(
      /^https:\/\/cdn\.example\.com\/public\/users\/user-1\/avatar-[0-9a-f-]{36}$/,
    );
    expect(objectStorage.upload).toHaveBeenCalledWith({
      key: url.replace('https://cdn.example.com/', ''),
      body: Buffer.from('x'),
      contentType: 'image/png',
    });
  });

  it('deletes an S3 avatar owned by the user', async () => {
    await adapter.remove(
      'user-1',
      'https://cdn.example.com/public/users/user-1/avatar-abc',
    );

    expect(objectStorage.delete).toHaveBeenCalledWith(
      'public/users/user-1/avatar-abc',
    );
  });

  it.each([
    'https://res.cloudinary.com/demo/image/upload/users/user-1/avatar.png',
    'https://cdn.example.com/public/users/user-2/avatar-abc',
  ])('leaves %s untouched', async (avatarUrl) => {
    await adapter.remove('user-1', avatarUrl);

    expect(objectStorage.delete).not.toHaveBeenCalled();
  });
});
