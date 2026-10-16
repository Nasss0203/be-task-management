import { TemplateVisibility } from '../../../../domain/enums/template-visibility.enum';

export class UpdatePageTemplateCommand {
  constructor(
    public readonly templateId: string,
    public readonly userId: string,

    public readonly name?: string,
    public readonly description?: string | null,
    public readonly icon?: string | null,
    public readonly coverUrl?: string | null,
    public readonly visibility?: TemplateVisibility,
  ) {}
}
