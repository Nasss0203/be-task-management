export class ListPublicTemplateReviewsQuery {
  constructor(
    public readonly templateId: string,
    public readonly page: number,
    public readonly limit: number,
    public readonly viewerId: string | null,
  ) {}
}
