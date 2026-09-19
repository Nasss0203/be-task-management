import { IsEnum } from 'class-validator';

import { ResourceAccessLevel } from '../../../../domain/constants/resource-access-level.constant';

export class ApprovePageAccessRequestRequestDto {
  @IsEnum(ResourceAccessLevel)
  access_level: ResourceAccessLevel;
}
