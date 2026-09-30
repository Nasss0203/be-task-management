import { IsBoolean, IsDefined } from 'class-validator';

export class UpdatePagePublicationSettingsDto {
  @IsDefined()
  @IsBoolean()
  include_descendants: boolean;
}
