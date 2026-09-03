export interface AdminDashboardOverview {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
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
