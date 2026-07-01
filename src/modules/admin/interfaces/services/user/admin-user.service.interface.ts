import { AdminFindAllUserQueryDto } from '../../../dto/query/user/admin-user-query.dto';
import { AdminUserResponseDto } from '../../../dto/response/user/admin-user.response.dto';
import { SystemRole } from 'src/modules/users/domain/entities/user.entity';
import { CreateSystemAdminDto } from '../../../dto/request/user/create-system-admin.dto';
import { CreateSystemAdminResponseDto } from '../../../dto/response/user/create-system-admin.response.dto';

export interface AdminUserService {
  createSystemAdmin(
    dto: CreateSystemAdminDto,
    actorRole: SystemRole,
  ): Promise<CreateSystemAdminResponseDto>;

  findAll(query: AdminFindAllUserQueryDto): Promise<AdminUserResponseDto[]>;

  lockUser(
    userId: string,
    actorId: string,
    actorRole: SystemRole,
  ): Promise<void>;

  unlockUser(
    userId: string,
    actorId: string,
    actorRole: SystemRole,
  ): Promise<void>;

}
