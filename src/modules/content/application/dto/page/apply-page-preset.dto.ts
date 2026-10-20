import { IsEnum } from 'class-validator';
import { PagePreset } from 'src/modules/content/domain/enums/page-preset.enum';

export class ApplyPagePresetDto {
  @IsEnum(PagePreset)
  preset: PagePreset;
}
