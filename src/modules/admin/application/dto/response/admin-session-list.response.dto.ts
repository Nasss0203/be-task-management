import type { AdminSessionItem } from '../../ports/admin-session-reader.port';

export class AdminSessionListResponseDto {
  items: AdminSessionItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
