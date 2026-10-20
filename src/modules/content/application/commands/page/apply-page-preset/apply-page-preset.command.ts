import { PagePreset } from 'src/modules/content/domain/enums/page-preset.enum';

export class ApplyPagePresetCommand {
  constructor(
    public readonly pageId: string,
    public readonly preset: PagePreset,
    public readonly userId: string,
  ) {}
}
