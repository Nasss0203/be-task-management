export class GetBillingPaymentStatusQuery {
  constructor(
    public readonly workspaceId: string,
    public readonly paymentOrderId: string,
  ) {}
}
