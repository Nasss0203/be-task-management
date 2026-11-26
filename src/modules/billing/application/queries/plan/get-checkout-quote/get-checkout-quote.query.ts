export class GetCheckoutQuoteQuery {
  constructor(
    public readonly workspaceId: string,
    public readonly planPriceId: string,
  ) {}
}
