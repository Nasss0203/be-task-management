import type { AdminActionActor } from '../../../domain/audit/admin-action';

export class CreateAdminBillingPlanPriceVersionCommand {
  constructor(
    public readonly planId: string,
    public readonly priceId: string,
    public readonly amount: number,
    public readonly actor: AdminActionActor,
  ) {}
}
