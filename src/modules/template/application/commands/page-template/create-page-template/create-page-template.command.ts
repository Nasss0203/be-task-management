import { TemplateVisibility } from 'src/modules/template/domain/enums/template-visibility.enum';

export class CreatePageTemplateCommand {
  constructor(
    public readonly pageId: string,
    public readonly userId: string,
    public readonly name?: string,
    public readonly description?: string | null,
    public readonly icon?: string | null,
    public readonly coverUrl?: string | null,
    public readonly visibility?: TemplateVisibility,
  ) {}
}
