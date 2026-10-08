export class ListPublicTemplatesQuery {
  constructor(
    public readonly search?: string,
    public readonly cursor?: string,
    public readonly limit?: number,
  ) {}
}
