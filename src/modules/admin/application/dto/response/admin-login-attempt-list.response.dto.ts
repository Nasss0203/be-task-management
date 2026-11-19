import type { AdminLoginAttemptItem } from '../../ports/admin-session-reader.port';

export class AdminLoginAttemptListResponseDto {
  items: AdminLoginAttemptItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  since: Date;
}
