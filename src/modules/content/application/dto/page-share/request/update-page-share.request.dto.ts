import { IsEnum } from 'class-validator';
import { ResourceAccessLevel } from 'src/modules/content/domain/constants/resource-access-level.constant';

export class UpdatePageShareRequestDto {
  @IsEnum(ResourceAccessLevel)
  access_level: ResourceAccessLevel;
}
