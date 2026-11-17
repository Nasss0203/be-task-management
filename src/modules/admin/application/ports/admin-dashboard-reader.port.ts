export interface AdminDashboardOverview {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  unverifiedUsers: number;
  totalWorkspaces: number;
  archivedWorkspaces: number;
  totalTeamspaces: number;
  totalPages: number;
  totalAttachments: number;
  storageBytes: number;
}

export interface AdminDashboardReader {
  getOverview(): Promise<AdminDashboardOverview>;
}
