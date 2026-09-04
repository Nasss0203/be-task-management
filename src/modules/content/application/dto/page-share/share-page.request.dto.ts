import { IsEnum, IsUUID } from 'class-validator';

import { ResourceAccessLevel } from '../../../domain/constants/resource-access-level.constant';

export class SharePageRequestDto {
  @IsUUID()
  user_id: string;

  @IsEnum(ResourceAccessLevel)
  access_level: ResourceAccessLevel;
}
