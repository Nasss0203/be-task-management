export class UpdateMarketplaceCommissionRateCommand {
  constructor(
    public readonly rateBps: number,
    public readonly actorId: string,
  ) {}
}
