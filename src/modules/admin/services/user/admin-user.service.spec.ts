import {
  ConflictException,
  ForbiddenException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { MailService } from 'src/modules/mail/mail.service';
import {
  SystemRole,
  User,
} from 'src/modules/users/domain/entities/user.entity';
import { AdminUserRepository } from '../../interfaces/repositories/user/admin-user.repository.interface';
import { AdminUserServiceImpl } from './admin-user.service';

describe('AdminUserServiceImpl.createSystemAdmin', () => {
  let repository: jest.Mocked<AdminUserRepository>;
  let mailService: jest.Mocked<
    Pick<MailService, 'assertConfigured' | 'sendSystemAdminInvitation'>
  >;
  let service: AdminUserServiceImpl;

  beforeEach(() => {
    repository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByEmailOrUsername: jest.fn(),
      createSystemAdmin: jest.fn(),
      deleteById: jest.fn(),
      lockAndRevokeSessions: jest.fn(),
      setActive: jest.fn(),
      updateSystemRole: jest.fn(),
    };
    mailService = {
      assertConfigured: jest.fn(),
      sendSystemAdminInvitation: jest.fn(),
    };
    service = new AdminUserServiceImpl(
      repository,
      mailService as unknown as MailService,
    );
  });

  it('creates a verified system admin and emails the activation link', async () => {
    repository.findByEmailOrUsername.mockResolvedValue(null);
    repository.createSystemAdmin.mockImplementation(async (input) => {
      return {
        id: 'new-admin-id',
        ...input,
        systemRole: SystemRole.SYSTEM_ADMIN,
        isActive: true,
        isEmailVerified: true,
      } as User;
    });

    const result = await service.createSystemAdmin(
      { name: 'Operations.Admin', recipientEmail: 'OWNER@EXAMPLE.COM' },
      SystemRole.SUPER_ADMIN,
    );

    expect(repository.createSystemAdmin).toHaveBeenCalledWith({
      email: 'operations.admin@systemadmin.com',
      username: 'operations.admin',
      passwordHash: null,
      emailVerificationToken: expect.any(String),
      emailVerificationExpires: expect.any(Date),
    });
    expect(mailService.sendSystemAdminInvitation).toHaveBeenCalledWith({
      to: 'owner@example.com',
      accountEmail: 'operations.admin@systemadmin.com',
      activationUrl: expect.stringContaining('/activate-admin?token='),
    });
    expect(result).toEqual({
      id: 'new-admin-id',
      email: 'operations.admin@systemadmin.com',
      username: 'operations.admin',
      recipientEmail: 'owner@example.com',
    });
  });

  it('only allows a super admin to create the account', async () => {
    await expect(
      service.createSystemAdmin(
        { name: 'ops', recipientEmail: 'owner@example.com' },
        SystemRole.SYSTEM_ADMIN,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(repository.createSystemAdmin).not.toHaveBeenCalled();
  });

  it('fails before creating an account when email is not configured', async () => {
    mailService.assertConfigured.mockImplementation(() => {
      throw new ServiceUnavailableException('Email is not configured');
    });

    await expect(
      service.createSystemAdmin(
        { name: 'ops', recipientEmail: 'owner@example.com' },
        SystemRole.SUPER_ADMIN,
      ),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);

    expect(repository.findByEmailOrUsername).not.toHaveBeenCalled();
    expect(repository.createSystemAdmin).not.toHaveBeenCalled();
  });

  it('rejects an account name that is already used', async () => {
    repository.findByEmailOrUsername.mockResolvedValue({
      id: 'existing',
    } as User);

    await expect(
      service.createSystemAdmin(
        { name: 'ops', recipientEmail: 'owner@example.com' },
        SystemRole.SUPER_ADMIN,
      ),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(repository.createSystemAdmin).not.toHaveBeenCalled();
  });

  it('removes the new account when its credentials cannot be emailed', async () => {
    repository.findByEmailOrUsername.mockResolvedValue(null);
    repository.createSystemAdmin.mockResolvedValue({
      id: 'new-admin-id',
      email: 'ops@systemadmin.com',
      username: 'ops',
    } as User);
    mailService.sendSystemAdminInvitation.mockRejectedValue(
      new Error('SMTP unavailable'),
    );

    await expect(
      service.createSystemAdmin(
        { name: 'ops', recipientEmail: 'owner@example.com' },
        SystemRole.SUPER_ADMIN,
      ),
    ).rejects.toThrow('SMTP unavailable');

    expect(repository.deleteById).toHaveBeenCalledWith('new-admin-id');
  });

  it('locks and revokes sessions for only the requested system admin', async () => {
    repository.findById.mockResolvedValue({
      id: 'target-system-admin',
      systemRole: SystemRole.SYSTEM_ADMIN,
      isActive: true,
    } as User);

    await service.lockUser(
      'target-system-admin',
      'super-admin',
      SystemRole.SUPER_ADMIN,
    );

    expect(repository.lockAndRevokeSessions).toHaveBeenCalledTimes(1);
    expect(repository.lockAndRevokeSessions).toHaveBeenCalledWith(
      'target-system-admin',
    );
    expect(repository.setActive).not.toHaveBeenCalled();
  });

  it('does not restore old sessions when unlocking an account', async () => {
    repository.findById.mockResolvedValue({
      id: 'target-system-admin',
      systemRole: SystemRole.SYSTEM_ADMIN,
      isActive: false,
    } as User);

    await service.unlockUser(
      'target-system-admin',
      'super-admin',
      SystemRole.SUPER_ADMIN,
    );

    expect(repository.setActive).toHaveBeenCalledWith(
      'target-system-admin',
      true,
    );
    expect(repository.lockAndRevokeSessions).not.toHaveBeenCalled();
  });
});
