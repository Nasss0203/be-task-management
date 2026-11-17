import type { AdminTemplateListingSummary } from '../../ports/admin-template-reader.port';

export class AdminTemplateListResponseDto {
  items: AdminTemplateListingSummary[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
