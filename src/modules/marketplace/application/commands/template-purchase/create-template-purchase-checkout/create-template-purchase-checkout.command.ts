import { TemplatePurchaseProvider } from '../../../../domain/aggregates/template-purchase/template-purchase.aggregate';

export class CreateTemplatePurchaseCheckoutCommand {
  constructor(
    public readonly purchaseId: string,
    public readonly buyerId: string,
    public readonly provider: TemplatePurchaseProvider,
  ) {}
}
