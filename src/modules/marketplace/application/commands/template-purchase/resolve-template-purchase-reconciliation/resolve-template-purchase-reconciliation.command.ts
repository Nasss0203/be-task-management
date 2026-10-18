export enum TemplatePurchaseReconciliationResolution {
  /** The payment is valid: grant PAID_PURCHASE. */
  GRANT = 'GRANT',
  /** The payment was refunded at the provider: grant nothing. */
  REFUND = 'REFUND',
}

export class ResolveTemplatePurchaseReconciliationCommand {
  constructor(
    public readonly purchaseId: string,
    public readonly resolution: TemplatePurchaseReconciliationResolution,
    public readonly resolvedBy: string,
  ) {}
}
