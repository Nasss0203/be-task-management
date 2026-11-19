import type {
  LoginAttemptMethod,
  LoginAttemptResult,
} from 'src/modules/identity/application/ports/login-attempt-recorder.port';
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
  userId?: string;
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

export interface AdminUserIpHistoryItem {
  ipAddress: string | null;
  userAgent: string | null;
  firstSeenAt: Date;
  lastSeenAt: Date;
  tokensIssued: number;
  hasOpenSession: boolean;
}

export interface AdminUserIpHistory {
  userId: string;
  since: Date;
  items: AdminUserIpHistoryItem[];
}

export interface ListAdminLoginAttemptsInput {
  page: number;
  limit: number;
  result?: LoginAttemptResult;
  method?: LoginAttemptMethod;
  search?: string;
  userId?: string;
}

export interface AdminLoginAttemptItem {
  id: string;
  method: string;
  result: string;
  reason: string | null;
  attemptedEmail: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
  user: {
    id: string;
    username: string;
    email: string;
  } | null;
}

export interface ListAdminLoginAttemptsResult {
  items: AdminLoginAttemptItem[];
  total: number;
  page: number;
  limit: number;
  since: Date;
}

export interface AdminSessionReader {
  getOverview(): Promise<AdminSessionsOverview>;
  listSessions(input: ListAdminSessionsInput): Promise<ListAdminSessionsResult>;
  getUserIpHistory(userId: string): Promise<AdminUserIpHistory | null>;
  listLoginAttempts(
    input: ListAdminLoginAttemptsInput,
  ): Promise<ListAdminLoginAttemptsResult | null>;
}
