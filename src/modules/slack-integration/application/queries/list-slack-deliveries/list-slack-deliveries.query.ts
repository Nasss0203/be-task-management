export class ListSlackDeliveriesQuery {
  constructor(
    public readonly userId: string,
    public readonly cursor: string | null,
    public readonly limit: number,
  ) {}
}
