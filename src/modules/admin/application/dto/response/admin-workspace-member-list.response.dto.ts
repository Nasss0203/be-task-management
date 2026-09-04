export class AdminWorkspaceMemberItemResponseDto {
  userId: string;
  email: string;
  username: string;
  avatarUrl: string | null;
  roleName: 'OWNER' | 'MEMBER';
  isActive: boolean;
  joinedAt: Date;
  lastOpenedAt: Date | null;
}

export class AdminWorkspaceMemberListResponseDto {
  items: AdminWorkspaceMemberItemResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
