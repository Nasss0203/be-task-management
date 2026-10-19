export class DeleteTemplateReviewCommand {
  constructor(
    public readonly templateId: string,
    public readonly userId: string,
  ) {}
}
