export class ImportMarkdownPageCommand {
  constructor(
    public readonly parentPageId: string,
    public readonly userId: string,
    public readonly fileName: string,
    public readonly file: Buffer,
  ) {}
}
