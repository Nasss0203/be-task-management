import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { AuthService } from 'src/modules/identity/application/services/auth.service';
import { SystemRole } from 'src/modules/identity/domain/enums/system-role.enum';
import type {
  AdminUserDetail,
  AdminUserReader,
} from '../../ports/admin-user-reader.port';
import { SendAdminUserVerificationEmailCommand } from './send-admin-user-verification-email.command';
import { SendAdminUserVerificationEmailHandler } from './send-admin-user-verification-email.handler';

const USER_ID = '035b6e72-279a-4a6f-ab78-a1420cd6344c';

function buildUser(overrides: Partial<AdminUserDetail> = {}): AdminUserDetail {
  return {
    id: USER_ID,
    email: 'member@example.com',
    username: 'member',
    avatarUrl: null,
    systemRole: SystemRole.USER,
    isActive: true,
    isEmailVerified: false,
    hasPassword: true,
    createdAt: new Date('2026-10-21T00:00:00.000Z'),
    updatedAt: new Date('2026-11-16T00:00:00.000Z'),
    ...overrides,
  };
}

function createHandler(user: AdminUserDetail | null) {
  const findUserById = jest.fn().mockResolvedValue(user);
  const resendVerificationEmail = jest.fn().mockResolvedValue(undefined);
  const handler = new SendAdminUserVerificationEmailHandler(
    { findUserById } as unknown as AdminUserReader,
    { resendVerificationEmail } as unknown as AuthService,
  );

  return { handler, findUserById, resendVerificationEmail };
}

describe('SendAdminUserVerificationEmailHandler', () => {
  it('sends the verification email for an active unverified user', async () => {
    const { handler, findUserById, resendVerificationEmail } =
      createHandler(buildUser());

    await expect(
      handler.execute(new SendAdminUserVerificationEmailCommand(USER_ID)),
    ).resolves.toEqual({ sent: true });

    expect(findUserById).toHaveBeenCalledWith(USER_ID);
    expect(resendVerificationEmail).toHaveBeenCalledWith('member@example.com');
  });

  it('throws 404 when the user does not exist or is soft-deleted', async () => {
    const { handler, resendVerificationEmail } = createHandler(null);

    await expect(
      handler.execute(new SendAdminUserVerificationEmailCommand(USER_ID)),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(resendVerificationEmail).not.toHaveBeenCalled();
  });

  it('rejects a suspended user', async () => {
    const { handler, resendVerificationEmail } = createHandler(
      buildUser({ isActive: false }),
    );

    await expect(
      handler.execute(new SendAdminUserVerificationEmailCommand(USER_ID)),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(resendVerificationEmail).not.toHaveBeenCalled();
  });

  it('rejects a user whose email is already verified', async () => {
    const { handler, resendVerificationEmail } = createHandler(
      buildUser({ isEmailVerified: true }),
    );

    await expect(
      handler.execute(new SendAdminUserVerificationEmailCommand(USER_ID)),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(resendVerificationEmail).not.toHaveBeenCalled();
  });
});
