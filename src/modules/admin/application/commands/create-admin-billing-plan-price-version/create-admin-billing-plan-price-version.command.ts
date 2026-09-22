export class CreateAdminBillingPlanPriceVersionCommand {
  constructor(
    public readonly planId: string,
    public readonly priceId: string,
    public readonly amount: number,
  ) {}
}
