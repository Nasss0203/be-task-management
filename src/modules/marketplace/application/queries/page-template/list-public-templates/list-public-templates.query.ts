export class ListPublicTemplatesQuery {
  constructor(
    public readonly search?: string,
    public readonly cursor?: string,
    public readonly limit?: number,
    public readonly category?: string,
    public readonly tag?: string,
    public readonly offerType?: 'FREE' | 'PAID',
  ) {}
}
