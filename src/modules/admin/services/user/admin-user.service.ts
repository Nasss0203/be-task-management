import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
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

    const temporaryPassword = this.generateTemporaryPassword();
    const user = await this.repository.createSystemAdmin({
      email,
      username,
      passwordHash: hashPassword(temporaryPassword),
    });

    try {
      await this.mailService.sendSystemAdminCredentials({
        to: recipientEmail,
        accountEmail: email,
        temporaryPassword,
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

  private generateTemporaryPassword(): string {
    return `${randomBytes(9).toString('base64url')}Aa1!`;
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
