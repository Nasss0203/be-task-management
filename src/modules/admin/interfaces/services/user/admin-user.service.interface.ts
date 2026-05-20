import { AdminFindAllUserQueryDto } from '../../../dto/query/user/admin-user-query.dto';
import { UpdateUserSystemRoleDto } from '../../../dto/request/user/update-user-system-role.dto';
import { AdminUserResponseDto } from '../../../dto/response/user/admin-user.response.dto';
import { SystemRole } from 'src/modules/users/domain/entities/user.entity';

export interface AdminUserService {
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

  updateSystemRole(
    userId: string,
    dto: UpdateUserSystemRoleDto,
    actorId: string,
    actorRole: SystemRole,
  ): Promise<void>;
}
