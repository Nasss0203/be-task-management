import { SystemRole } from 'src/modules/identity/domain/enums/system-role.enum';

export class AdminUserSummaryResponseDto {
  id: string;
  email: string;
  username: string;
  systemRole: SystemRole;
  isActive: boolean;
  isEmailVerified: boolean;
  createdAt: Date;
}

export class AdminUserListResponseDto {
  items: AdminUserSummaryResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
