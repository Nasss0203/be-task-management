export class PreviewTemplateDemoQuery {
  constructor(
    public readonly templateId: string,
    public readonly userId: string,
    public readonly demoVersionId: string,
    /** Unsaved config to preview; never persisted. */
    public readonly demoConfig?: Record<string, any> | null,
  ) {}
}
