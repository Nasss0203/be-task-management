export class GetMyClaimedTemplatesQuery {
  constructor(
    public readonly userId: string,
    public readonly cursor?: string,
    public readonly limit?: number,
  ) {}
}
