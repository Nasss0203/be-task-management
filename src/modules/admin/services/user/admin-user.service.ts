import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes, createHash } from 'crypto';
import { MailService } from 'src/modules/mail/mail.service';
import {
  SystemRole,
  User,
} from 'src/modules/users/domain/entities/user.entity';
import { AdminFindAllUserQueryDto } from '../../dto/query/user/admin-user-query.dto';
import { AdminUserResponseDto } from '../../dto/response/user/admin-user.response.dto';
import { type AdminUserRepository } from '../../interfaces/repositories/user/admin-user.repository.interface';
import { type AdminUserService } from '../../interfaces/services/user/admin-user.service.interface';
import { ADMIN_TYPES } from '../../interfaces/types';
import { hashPassword } from 'src/utils';
import { CreateSystemAdminDto } from '../../dto/request/user/create-system-admin.dto';
import { CreateSystemAdminResponseDto } from '../../dto/response/user/create-system-admin.response.dto';

const SYSTEM_ADMIN_DOMAIN = 'systemadmin.com';

@Injectable()
export class AdminUserServiceImpl implements AdminUserService {
  constructor(
    @Inject(ADMIN_TYPES.repositories.AdminUserRepository)
    private readonly repository: AdminUserRepository,
    private readonly mailService: MailService,
  ) {}

  async createSystemAdmin(
    dto: CreateSystemAdminDto,
    actorRole: SystemRole,
  ): Promise<CreateSystemAdminResponseDto> {
    if (actorRole !== SystemRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only SUPER_ADMIN can create system admins');
    }

    this.mailService.assertConfigured();

    const username = dto.name.trim().toLowerCase();
    const email = `${username}@${SYSTEM_ADMIN_DOMAIN}`;
    const recipientEmail = dto.recipientEmail.trim().toLowerCase();
    const existing = await this.repository.findByEmailOrUsername(
      email,
      username,
    );

    if (existing) {
      throw new ConflictException('System admin name is already in use');
    }

    const rawToken = randomBytes(32).toString('hex');
    const hashedToken = createHash('sha256').update(rawToken).digest('hex');
    const expires = new Date();
    expires.setHours(expires.getHours() + 48); // Hết hạn sau 48 giờ

    const user = await this.repository.createSystemAdmin({
      email,
      username,
      passwordHash: null,
      emailVerificationToken: hashedToken,
      emailVerificationExpires: expires,
    });

    const activationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/activate-admin?token=${rawToken}`;

    try {
      await this.mailService.sendSystemAdminInvitation({
        to: recipientEmail,
        accountEmail: email,
        activationUrl,
      });
    } catch (error) {
      await this.repository.deleteById(user.id);
      throw error;
    }

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      recipientEmail,
    };
  }

  findAll(query: AdminFindAllUserQueryDto): Promise<AdminUserResponseDto[]> {
    return this.repository.findAll(query);
  }

  async lockUser(
    userId: string,
    actorId: string,
    actorRole: SystemRole,
  ): Promise<void> {
    const target = await this.getTargetUser(userId);

    this.ensureCanChangeActiveStatus(target, actorId, actorRole);

    await this.repository.lockAndRevokeSessions(userId);
  }

  async unlockUser(
    userId: string,
    actorId: string,
    actorRole: SystemRole,
  ): Promise<void> {
    const target = await this.getTargetUser(userId);

    this.ensureCanChangeActiveStatus(target, actorId, actorRole);

    await this.repository.setActive(userId, true);
  }

  async updateSystemRole(
    userId: string,
    role: SystemRole,
    actorId: string,
    actorRole: SystemRole,
  ): Promise<void> {
    if (actorRole !== SystemRole.SUPER_ADMIN) {
      throw new ForbiddenException(
        'Only SUPER_ADMIN can update user system roles',
      );
    }

    const target = await this.getTargetUser(userId);
    if (target.id === actorId) {
      throw new ForbiddenException('You cannot change your own system role');
    }

    await this.repository.updateSystemRole(userId, role);
  }

  private async getTargetUser(userId: string): Promise<User> {
    const target = await this.repository.findById(userId);

    if (!target || target.deletedAt) {
      throw new NotFoundException('User not found');
    }

    return target;
  }

  private ensureCanChangeActiveStatus(
    target: User,
    actorId: string,
    actorRole: SystemRole,
  ): void {
    if (target.id === actorId) {
      throw new ForbiddenException('You cannot lock or unlock yourself');
    }

    if (target.systemRole === SystemRole.SUPER_ADMIN) {
      throw new ForbiddenException('Cannot lock or unlock SUPER_ADMIN');
    }

    if (actorRole === SystemRole.SUPER_ADMIN) {
      return;
    }

    if (
      actorRole === SystemRole.SYSTEM_ADMIN &&
      target.systemRole === SystemRole.USER
    ) {
      return;
    }

    throw new ForbiddenException('You do not have permission for this action');
  }
}
