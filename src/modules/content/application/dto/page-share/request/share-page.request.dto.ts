import { IsIn, IsUUID } from 'class-validator';

import { ResourceAccessLevel } from '../../../../domain/constants/resource-access-level.constant';

const SHAREABLE_ACCESS_LEVELS = [
  ResourceAccessLevel.VIEWER,
  ResourceAccessLevel.EDITOR,
  ResourceAccessLevel.FULL_ACCESS,
] as const;

export class SharePageRequestDto {
  @IsUUID()
  user_id: string;

  @IsIn(SHAREABLE_ACCESS_LEVELS)
  access_level: ResourceAccessLevel;
}
