import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  SystemRole,
  User,
} from 'src/modules/users/domain/entities/user.entity';
import { AdminFindAllUserQueryDto } from '../../dto/query/user/admin-user-query.dto';
import { UpdateUserSystemRoleDto } from '../../dto/request/user/update-user-system-role.dto';
import { AdminUserResponseDto } from '../../dto/response/user/admin-user.response.dto';
import { type AdminUserRepository } from '../../interfaces/repositories/user/admin-user.repository.interface';
import { type AdminUserService } from '../../interfaces/services/user/admin-user.service.interface';
import { ADMIN_TYPES } from '../../interfaces/types';

@Injectable()
export class AdminUserServiceImpl implements AdminUserService {
  constructor(
    @Inject(ADMIN_TYPES.repositories.AdminUserRepository)
    private readonly repository: AdminUserRepository,
  ) {}

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

    await this.repository.setActive(userId, false);
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
    dto: UpdateUserSystemRoleDto,
    actorId: string,
    actorRole: SystemRole,
  ): Promise<void> {
    const target = await this.getTargetUser(userId);

    if (actorRole !== SystemRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only SUPER_ADMIN can update system role');
    }

    if (target.id === actorId) {
      throw new ForbiddenException('You cannot change your own system role');
    }

    if (target.systemRole === SystemRole.SUPER_ADMIN) {
      throw new ForbiddenException('Cannot update another SUPER_ADMIN');
    }

    if (dto.systemRole === SystemRole.SUPER_ADMIN) {
      throw new ForbiddenException(
        'Promoting to SUPER_ADMIN is not allowed from this API',
      );
    }

    await this.repository.updateSystemRole(userId, dto.systemRole);
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
