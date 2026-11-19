import type { AdminReconciliationStatus } from '../../ports/admin-marketplace-sales-reader.port';

export class ListAdminReconciliationPurchasesQuery {
  constructor(
    public readonly page: number,
    public readonly limit: number,
    public readonly status: AdminReconciliationStatus,
    public readonly search?: string,
  ) {}
}
