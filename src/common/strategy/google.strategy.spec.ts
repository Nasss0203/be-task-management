import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Profile, VerifyCallback } from 'passport-google-oauth20';
import { GoogleStrategy } from './google.strategy';

type GoogleProfileFixture = {
  provider: 'google';
  id: string;
  displayName: string;
  emails?: Array<{
    value: string;
    verified?: boolean;
  }>;
  photos?: Array<{
    value: string;
  }>;
};

const createProfile = (
  overrides: Partial<GoogleProfileFixture> = {},
): Profile =>
  ({
    provider: 'google',
    id: 'google-subject',
    displayName: 'Google User',
    emails: [
      {
        value: 'user@example.com',
        verified: true,
      },
    ],
    photos: [{ value: 'https://example.com/avatar.png' }],
    ...overrides,
  }) as unknown as Profile;

const createConfigService = (): ConfigService => {
  const values: Record<string, string> = {
    GOOGLE_CLIENT_ID: 'test-client-id',
    GOOGLE_CLIENT_SECRET: 'test-client-secret',
    GOOGLE_CALLBACK_URL: 'http://localhost/auth/google/callback',
  };

  return {
    get: jest.fn((key: string) => values[key]),
  } as unknown as ConfigService;
};

const createDoneMock = (): {
  callback: VerifyCallback;
  mock: jest.Mock;
} => {
  const mock = jest.fn();
  return {
    callback: mock as unknown as VerifyCallback,
    mock,
  };
};

describe('GoogleStrategy', () => {
  let strategy: GoogleStrategy;

  beforeEach(() => {
    strategy = new GoogleStrategy(createConfigService());
  });

  it('normalizes a verified Google profile', async () => {
    const { callback, mock } = createDoneMock();
    const profile = createProfile({
      id: '  google-subject-1  ',
      displayName: 'Example User',
      emails: [
        {
          value: '  User@Example.COM  ',
          verified: true,
        },
      ],
      photos: [{ value: 'https://example.com/user.png' }],
    });

    await strategy.validate('', '', profile, callback);

    expect(mock).toHaveBeenCalledWith(null, {
      subject: 'google-subject-1',
      email: 'user@example.com',
      emailVerified: true,
      fullName: 'Example User',
      avatarUrl: 'https://example.com/user.png',
    });
  });

  it('does not treat an unverified email as verified', async () => {
    const { callback, mock } = createDoneMock();
    const profile = createProfile({
      emails: [{ value: 'user@example.com', verified: false }],
    });

    await strategy.validate('', '', profile, callback);

    expect(mock).toHaveBeenCalledWith(
      null,
      expect.objectContaining({ emailVerified: false }),
    );
  });

  it('returns null and unverified when the profile has no email', async () => {
    const { callback, mock } = createDoneMock();
    const profile = createProfile({ emails: undefined });

    await strategy.validate('', '', profile, callback);

    expect(mock).toHaveBeenCalledWith(
      null,
      expect.objectContaining({
        email: null,
        emailVerified: false,
      }),
    );
  });

  it('rejects an empty subject without calling done', async () => {
    const { callback, mock } = createDoneMock();
    const profile = createProfile({ id: '   ' });

    await expect(
      strategy.validate('', '', profile, callback),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(mock).not.toHaveBeenCalled();
  });
});
