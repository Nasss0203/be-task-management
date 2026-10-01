import { IsBoolean, IsOptional } from 'class-validator';

export class UpdatePagePublicationSettingsDto {
  @IsOptional()
  @IsBoolean()
  include_descendants?: boolean;

  @IsOptional()
  @IsBoolean()
  allow_updates?: boolean;
}
