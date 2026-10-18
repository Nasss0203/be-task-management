export class RecordTemplateViewCommand {
  constructor(
    public readonly templateId: string,
    /** Null for guests; public routes attach the user only when a token is sent. */
    public readonly userId: string | null,
  ) {}
}
