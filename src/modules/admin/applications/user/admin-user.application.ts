import { Inject, Injectable } from '@nestjs/common';
import { SystemRole } from 'src/modules/users/domain/entities/user.entity';
import { AdminFindAllUserQueryDto } from '../../dto/query/user/admin-user-query.dto';
import { AdminUserResponseDto } from '../../dto/response/user/admin-user.response.dto';
import { type AdminUserApplication } from '../../interfaces/applications/user/admin-user.application.interface';
import { type AdminUserService } from '../../interfaces/services/user/admin-user.service.interface';
import { ADMIN_TYPES } from '../../interfaces/types';
import { CreateSystemAdminDto } from '../../dto/request/user/create-system-admin.dto';
import { CreateSystemAdminResponseDto } from '../../dto/response/user/create-system-admin.response.dto';

@Injectable()
export class AdminUserApplicationImpl implements AdminUserApplication {
  constructor(
    @Inject(ADMIN_TYPES.services.AdminUserService)
    private readonly service: AdminUserService,
  ) {}

  createSystemAdmin(
    dto: CreateSystemAdminDto,
    actorRole: SystemRole,
  ): Promise<CreateSystemAdminResponseDto> {
    return this.service.createSystemAdmin(dto, actorRole);
  }

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
    dto: { role: SystemRole },
    actorId: string,
    actorRole: SystemRole,
  ): Promise<void> {
    return this.service.updateSystemRole(userId, dto.role, actorId, actorRole);
  }

}
