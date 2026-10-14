export class CreateTemplatePurchaseCommand {
  constructor(
    public readonly templateId: string,
    public readonly buyerId: string,
    public readonly idempotencyKey: string,
  ) {}
}
