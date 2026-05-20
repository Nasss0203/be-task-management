export class AdminUserOverviewResponseDto {
  totalUsers: number;
  activeUsers: number;
  lockedUsers: number;
  systemAdmins: number;
  newUsersLast7Days: number;
  activeToday: number;
}
