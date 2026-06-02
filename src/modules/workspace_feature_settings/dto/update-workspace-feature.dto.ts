import { IsBoolean } from 'class-validator';

export class UpdateWorkspaceFeatureDto {
  @IsBoolean()
  enabled: boolean;
}
