import { SystemRole } from 'src/modules/identity/domain/enums/system-role.enum';

export class AdminUserDetailResponseDto {
  id: string;
  email: string;
  username: string;
  avatarUrl: string | null;
  systemRole: SystemRole;
  isActive: boolean;
  isEmailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}
