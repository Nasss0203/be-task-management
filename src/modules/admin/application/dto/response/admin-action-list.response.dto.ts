import type { AdminActionItem } from '../../ports/admin-action-reader.port';

export class AdminActionListResponseDto {
  items: AdminActionItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  from: Date;
  to: Date;
}
