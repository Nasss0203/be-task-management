export class GetTemplatePurchaseQuery {
  constructor(
    public readonly purchaseId: string,
    public readonly buyerId: string,
  ) {}
}
