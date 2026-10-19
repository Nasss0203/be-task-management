import { BadRequestException, ConflictException } from '@nestjs/common';

import { CreatorProfile } from '../../../../domain/entities/creator-profile.entity';
import { UpsertMyCreatorProfileCommand } from './upsert-my-creator-profile.command';
import { UpsertMyCreatorProfileHandler } from './upsert-my-creator-profile.handler';

describe('UpsertMyCreatorProfileHandler', () => {
  let repository: { findByUserId: jest.Mock; save: jest.Mock };
  let reader: { findAccount: jest.Mock; isHandleTaken: jest.Mock };
  let handler: UpsertMyCreatorProfileHandler;

  beforeEach(() => {
    repository = {
      findByUserId: jest.fn(() => Promise.resolve(null)),
      save: jest.fn((profile: CreatorProfile) => Promise.resolve(profile)),
    };
    reader = {
      findAccount: jest.fn(() =>
        Promise.resolve({ username: 'nam_123', avatarUrl: null }),
      ),
      isHandleTaken: jest.fn(() => Promise.resolve(false)),
    };
    handler = new UpsertMyCreatorProfileHandler(
      repository as never,
      reader as never,
      { getSignedDownloadUrl: jest.fn() } as never,
    );
  });

  it('creates a profile on first save', async () => {
    const result = await handler.execute(
      new UpsertMyCreatorProfileCommand('user-1', {
        handle: 'Nam-Design',
        displayName: 'Nam',
      }),
    );

    expect(result).toMatchObject({
      has_profile: true,
      handle: 'nam-design',
      display_name: 'Nam',
    });
    expect(reader.isHandleTaken).toHaveBeenCalledWith('nam-design', 'user-1');
  });

  it('rejects a handle used by another creator or user', async () => {
    reader.isHandleTaken.mockResolvedValue(true);

    await expect(
      handler.execute(
        new UpsertMyCreatorProfileCommand('user-1', { handle: 'taken' }),
      ),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('maps invalid input to 400', async () => {
    await expect(
      handler.execute(
        new UpsertMyCreatorProfileCommand('user-1', { handle: 'a' }),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
