export class UpsertTemplateReviewCommand {
  constructor(
    public readonly templateId: string,
    public readonly userId: string,
    public readonly rating: number,
    public readonly body?: string | null,
  ) {}
}
