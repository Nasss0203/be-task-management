import { BadRequestException } from '@nestjs/common';

import { CreatorProfile } from '../../../../domain/entities/creator-profile.entity';
import { SetCreatorImageCommand } from './set-creator-image.command';
import {
  detectCreatorImageType,
  SetCreatorImageHandler,
} from './set-creator-image.handler';

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0]);

describe('detectCreatorImageType', () => {
  it('reads the type from the file bytes, not the name', () => {
    expect(detectCreatorImageType(PNG)?.contentType).toBe('image/png');
    expect(
      detectCreatorImageType(Buffer.from([0xff, 0xd8, 0xff, 0xe0]))
        ?.contentType,
    ).toBe('image/jpeg');
    expect(
      detectCreatorImageType(Buffer.from('RIFF0000WEBPVP8 ', 'ascii'))
        ?.contentType,
    ).toBe('image/webp');
    expect(detectCreatorImageType(Buffer.from('<svg></svg>'))).toBeNull();
  });
});

describe('SetCreatorImageHandler', () => {
  let profile: CreatorProfile;
  let repository: { findByUserId: jest.Mock; save: jest.Mock };
  let storage: {
    upload: jest.Mock;
    delete: jest.Mock;
    getSignedDownloadUrl: jest.Mock;
  };
  let handler: SetCreatorImageHandler;

  beforeEach(() => {
    profile = CreatorProfile.create('user-1', { handle: 'nam' });
    profile.setImageKey('avatar', 'creators/user-1/avatar-old.png');
    repository = {
      findByUserId: jest.fn(() => Promise.resolve(profile)),
      save: jest.fn((saved: CreatorProfile) => Promise.resolve(saved)),
    };
    storage = {
      upload: jest.fn(() => Promise.resolve({})),
      delete: jest.fn(() => Promise.resolve()),
      getSignedDownloadUrl: jest.fn((key: string) =>
        Promise.resolve(`https://cdn/${key}`),
      ),
    };
    handler = new SetCreatorImageHandler(
      repository as never,
      {
        findAccount: jest.fn(() =>
          Promise.resolve({ username: 'nam', avatarUrl: null }),
        ),
      } as never,
      storage as never,
    );
  });

  it('uploads a new avatar under the user folder and deletes the old one', async () => {
    const result = await handler.execute(
      new SetCreatorImageCommand('user-1', 'avatar', {
        buffer: PNG,
        size: PNG.length,
      }),
    );

    const [[uploaded]] = storage.upload.mock.calls as [
      [{ key: string; contentType: string }],
    ];
    expect(uploaded.key).toMatch(/^creators\/user-1\/avatar-.+\.png$/);
    expect(uploaded.contentType).toBe('image/png');
    expect(storage.delete).toHaveBeenCalledWith(
      'creators/user-1/avatar-old.png',
    );
    expect(result.avatar_url).toMatch(/^https:\/\/cdn\/creators\/user-1\//);
  });

  it('rejects non-image bytes, oversized files and unknown kinds', async () => {
    await expect(
      handler.execute(
        new SetCreatorImageCommand('user-1', 'avatar', {
          buffer: Buffer.from('<svg/>'),
          size: 6,
        }),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    await expect(
      handler.execute(
        new SetCreatorImageCommand('user-1', 'avatar', {
          buffer: PNG,
          size: 3 * 1024 * 1024,
        }),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    await expect(
      handler.execute(new SetCreatorImageCommand('user-1', 'banner', null)),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(storage.upload).not.toHaveBeenCalled();
  });

  it('asks the user to save a profile before uploading', async () => {
    repository.findByUserId.mockResolvedValue(null);

    await expect(
      handler.execute(
        new SetCreatorImageCommand('user-1', 'cover', {
          buffer: PNG,
          size: PNG.length,
        }),
      ),
    ).rejects.toThrow('Save your creator profile first');
  });
});
