export class GetMyTemplatePurchasesQuery {
  constructor(
    public readonly buyerId: string,
    public readonly cursor?: string,
    public readonly limit?: number,
  ) {}
}
