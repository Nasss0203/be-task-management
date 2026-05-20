import { Inject, Injectable } from '@nestjs/common';
import { SystemRole } from 'src/modules/users/domain/entities/user.entity';
import { AdminFindAllUserQueryDto } from '../../dto/query/user/admin-user-query.dto';
import { UpdateUserSystemRoleDto } from '../../dto/request/user/update-user-system-role.dto';
import { AdminUserResponseDto } from '../../dto/response/user/admin-user.response.dto';
import { type AdminUserApplication } from '../../interfaces/applications/user/admin-user.application.interface';
import { type AdminUserService } from '../../interfaces/services/user/admin-user.service.interface';
import { ADMIN_TYPES } from '../../interfaces/types';

@Injectable()
export class AdminUserApplicationImpl implements AdminUserApplication {
  constructor(
    @Inject(ADMIN_TYPES.services.AdminUserService)
    private readonly service: AdminUserService,
  ) {}

  findAll(query: AdminFindAllUserQueryDto): Promise<AdminUserResponseDto[]> {
    return this.service.findAll(query);
  }

  lockUser(
    userId: string,
    actorId: string,
    actorRole: SystemRole,
  ): Promise<void> {
    return this.service.lockUser(userId, actorId, actorRole);
  }

  unlockUser(
    userId: string,
    actorId: string,
    actorRole: SystemRole,
  ): Promise<void> {
    return this.service.unlockUser(userId, actorId, actorRole);
  }

  updateSystemRole(
    userId: string,
    dto: UpdateUserSystemRoleDto,
    actorId: string,
    actorRole: SystemRole,
  ): Promise<void> {
    return this.service.updateSystemRole(userId, dto, actorId, actorRole);
  }
}
