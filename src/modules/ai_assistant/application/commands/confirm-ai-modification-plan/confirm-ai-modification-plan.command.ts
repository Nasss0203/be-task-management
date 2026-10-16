export class ConfirmAiModificationPlanCommand {
  constructor(
    public readonly userId: string,
    public readonly generationId: string,
    public readonly shareToken?: string,
  ) {}
}
