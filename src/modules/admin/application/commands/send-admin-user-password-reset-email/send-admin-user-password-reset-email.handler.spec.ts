import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { AuthService } from 'src/modules/identity/application/services/auth.service';
import { SystemRole } from 'src/modules/identity/domain/enums/system-role.enum';
import type {
  AdminUserDetail,
  AdminUserReader,
} from '../../ports/admin-user-reader.port';
import { SendAdminUserPasswordResetEmailCommand } from './send-admin-user-password-reset-email.command';
import { SendAdminUserPasswordResetEmailHandler } from './send-admin-user-password-reset-email.handler';

const USER_ID = '035b6e72-279a-4a6f-ab78-a1420cd6344c';

function buildUser(overrides: Partial<AdminUserDetail> = {}): AdminUserDetail {
  return {
    id: USER_ID,
    email: 'member@example.com',
    username: 'member',
    avatarUrl: null,
    systemRole: SystemRole.USER,
    isActive: true,
    isEmailVerified: true,
    hasPassword: true,
    createdAt: new Date('2026-10-21T00:00:00.000Z'),
    updatedAt: new Date('2026-11-16T00:00:00.000Z'),
    ...overrides,
  };
}

function createHandler(user: AdminUserDetail | null) {
  const findUserById = jest.fn().mockResolvedValue(user);
  const forgotPassword = jest.fn().mockResolvedValue(undefined);
  const handler = new SendAdminUserPasswordResetEmailHandler(
    { findUserById } as unknown as AdminUserReader,
    { forgotPassword } as unknown as AuthService,
  );

  return { handler, findUserById, forgotPassword };
}

describe('SendAdminUserPasswordResetEmailHandler', () => {
  it('sends the reset email for an active user with a local password', async () => {
    const { handler, findUserById, forgotPassword } =
      createHandler(buildUser());

    await expect(
      handler.execute(new SendAdminUserPasswordResetEmailCommand(USER_ID)),
    ).resolves.toEqual({ sent: true });

    expect(findUserById).toHaveBeenCalledWith(USER_ID);
    expect(forgotPassword).toHaveBeenCalledWith('member@example.com');
  });

  it('also sends for an active user whose email is not verified yet', async () => {
    const { handler, forgotPassword } = createHandler(
      buildUser({ isEmailVerified: false }),
    );

    await expect(
      handler.execute(new SendAdminUserPasswordResetEmailCommand(USER_ID)),
    ).resolves.toEqual({ sent: true });
    expect(forgotPassword).toHaveBeenCalledTimes(1);
  });

  it('throws 404 when the user does not exist or is soft-deleted', async () => {
    const { handler, forgotPassword } = createHandler(null);

    await expect(
      handler.execute(new SendAdminUserPasswordResetEmailCommand(USER_ID)),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(forgotPassword).not.toHaveBeenCalled();
  });

  it('rejects a suspended user', async () => {
    const { handler, forgotPassword } = createHandler(
      buildUser({ isActive: false }),
    );

    await expect(
      handler.execute(new SendAdminUserPasswordResetEmailCommand(USER_ID)),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(forgotPassword).not.toHaveBeenCalled();
  });

  it('rejects a user without a local password', async () => {
    const { handler, forgotPassword } = createHandler(
      buildUser({ hasPassword: false }),
    );

    await expect(
      handler.execute(new SendAdminUserPasswordResetEmailCommand(USER_ID)),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(forgotPassword).not.toHaveBeenCalled();
  });
});
