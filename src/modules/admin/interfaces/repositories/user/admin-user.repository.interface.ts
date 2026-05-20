import { AdminFindAllUserQueryDto } from '../../../dto/query/user/admin-user-query.dto';
import { AdminUserResponseDto } from '../../../dto/response/user/admin-user.response.dto';
import {
  SystemRole,
  User,
} from 'src/modules/users/domain/entities/user.entity';

export interface AdminUserRepository {
  findAll(query: AdminFindAllUserQueryDto): Promise<AdminUserResponseDto[]>;

  findById(userId: string): Promise<User | null>;

  setActive(userId: string, isActive: boolean): Promise<void>;

  updateSystemRole(userId: string, systemRole: SystemRole): Promise<void>;
}
