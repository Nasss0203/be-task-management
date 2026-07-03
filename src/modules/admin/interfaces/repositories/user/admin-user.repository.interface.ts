import { AdminFindAllUserQueryDto } from '../../../dto/query/user/admin-user-query.dto';
import { AdminUserResponseDto } from '../../../dto/response/user/admin-user.response.dto';
import {
  SystemRole,
  User,
} from 'src/modules/users/domain/entities/user.entity';

export interface AdminUserRepository {
  findAll(query: AdminFindAllUserQueryDto): Promise<AdminUserResponseDto[]>;

  findById(userId: string): Promise<User | null>;

  findByEmailOrUsername(email: string, username: string): Promise<User | null>;

  createSystemAdmin(input: {
    email: string;
    username: string;
    passwordHash: string;
  }): Promise<User>;

  deleteById(userId: string): Promise<void>;

  lockAndRevokeSessions(userId: string): Promise<void>;

  setActive(userId: string, isActive: boolean): Promise<void>;

  updateSystemRole(userId: string, role: SystemRole): Promise<void>;
}
