import { BadRequestException, ConflictException } from '@nestjs/common';

import {
  hashIdentityPassword,
  verifyIdentityPassword,
} from 'src/modules/identity/infrastructure/security/password/password-hasher';
import type { UserRecord } from 'src/modules/identity/domain/repositories/user.repository';
import { SystemRole } from 'src/modules/identity/domain/enums/system-role.enum';

import { AccountService } from './account.service';

const user = (overrides: Partial<UserRecord> = {}): UserRecord => ({
  id: 'user-1',
  email: 'nam@example.com',
  username: 'nam',
  googleId: null,
  avatarUrl: null,
  passwordHash: hashIdentityPassword('old-secret'),
  isActive: true,
  isEmailVerified: true,
  emailVerificationToken: null,
  emailVerificationExpires: null,
  resetPasswordToken: 'reset-token',
  resetPasswordExpires: new Date(),
  systemRole: SystemRole.USER,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  ...overrides,
});

describe('AccountService', () => {
  let current: UserRecord;
  const userRepository = {
    findById: jest.fn(() => Promise.resolve(current)),
    findUserByUsername: jest.fn(),
    save: jest.fn((value: UserRecord) => Promise.resolve(value)),
  };
  const avatarStorage = {
    upload: jest.fn(),
    remove: jest.fn(),
  };
  const service = new AccountService(
    userRepository as never,
    avatarStorage,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    current = user();
    userRepository.findUserByUsername.mockResolvedValue(null);
  });

  it('renames the account and never exposes the password hash', async () => {
    const result = await service.updateUsername('user-1', '  Nam Nguyen ');

    expect(result).toEqual({
      id: 'user-1',
      email: 'nam@example.com',
      username: 'Nam Nguyen',
      avatarUrl: null,
      hasPassword: true,
    });
    expect(result).not.toHaveProperty('passwordHash');
  });

  it('rejects a username owned by another user', async () => {
    userRepository.findUserByUsername.mockResolvedValue({ id: 'user-2' });

    await expect(service.updateUsername('user-1', 'taken')).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(userRepository.save).not.toHaveBeenCalled();
  });

  it('changes the password only when the current one matches', async () => {
    await expect(
      service.changePassword('user-1', 'wrong', 'new-secret'),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.changePassword('user-1', undefined, 'new-secret'),
    ).rejects.toBeInstanceOf(BadRequestException);

    await service.changePassword('user-1', 'old-secret', 'new-secret');

    const saved = userRepository.save.mock.calls[0][0];
    expect(verifyIdentityPassword('new-secret', saved.passwordHash!)).toBe(true);
    expect(saved.resetPasswordToken).toBeNull();
  });

  it('rejects reusing the current password', async () => {
    await expect(
      service.changePassword('user-1', 'old-secret', 'old-secret'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('lets a Google-only account set its first password', async () => {
    current = user({ passwordHash: null, googleId: 'google-1' });

    await service.changePassword('user-1', undefined, 'first-secret');

    const saved = userRepository.save.mock.calls[0][0];
    expect(verifyIdentityPassword('first-secret', saved.passwordHash!)).toBe(
      true,
    );
  });

  it('stores the uploaded avatar url and clears it on removal', async () => {
    avatarStorage.upload.mockResolvedValue('https://cdn.example/avatar.png');

    await expect(service.setAvatar('user-1', Buffer.from('x'))).resolves.toMatchObject({
      avatarUrl: 'https://cdn.example/avatar.png',
    });

    avatarStorage.remove.mockRejectedValue(new Error('cdn down'));
    await expect(service.removeAvatar('user-1')).resolves.toMatchObject({
      avatarUrl: null,
    });
  });
});
