import type {
  AdminBillingPlanSummary,
  ListAdminBillingPlansResult,
} from '../../ports/admin-billing-plan-reader.port';

export class AdminBillingPlanListResponseDto {
  readonly items: AdminBillingPlanSummary[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
  readonly totalPages: number;

  constructor(result: ListAdminBillingPlansResult) {
    this.items = result.items;
    this.total = result.total;
    this.page = result.page;
    this.limit = result.limit;
    this.totalPages =
      result.total === 0 ? 0 : Math.ceil(result.total / result.limit);
  }
}
