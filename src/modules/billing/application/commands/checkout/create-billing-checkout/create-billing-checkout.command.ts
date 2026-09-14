export class CreateBillingCheckoutCommand {
  constructor(
    public readonly workspaceId: string,
    public readonly planPriceId: string,
    public readonly actorId: string,
  ) {}
}
