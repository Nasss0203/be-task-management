import type { AdminActivityItem } from '../../ports/admin-activity-reader.port';

export class AdminActivityListResponseDto {
  items: AdminActivityItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  from: Date;
  to: Date;
}
