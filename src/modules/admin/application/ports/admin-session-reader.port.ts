import type { SystemRole } from 'src/modules/identity/domain/enums/system-role.enum';

export interface AdminSessionsOverview {
  activeSessions: number;
  usersWithSessions: number;
  adminSessions: number;
}

export interface ListAdminSessionsInput {
  page: number;
  limit: number;
  search?: string;
  systemRole?: SystemRole;
}

export interface AdminSessionItem {
  id: string;
  user: {
    id: string;
    username: string;
    email: string;
    systemRole: SystemRole;
  };
  ipAddress: string | null;
  userAgent: string | null;
  lastActiveAt: Date;
  expiresAt: Date;
}

export interface ListAdminSessionsResult {
  items: AdminSessionItem[];
  total: number;
  page: number;
  limit: number;
}

export interface AdminSessionReader {
  getOverview(): Promise<AdminSessionsOverview>;
  listSessions(input: ListAdminSessionsInput): Promise<ListAdminSessionsResult>;
}
