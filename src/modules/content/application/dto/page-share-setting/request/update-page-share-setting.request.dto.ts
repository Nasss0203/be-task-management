import { IsIn, IsOptional } from 'class-validator';

import { ResourceAccessLevel } from '../../../../domain/constants/resource-access-level.constant';

const WORKSPACE_ACCESS_LEVELS = [
  ResourceAccessLevel.VIEWER,
  ResourceAccessLevel.COMMENTER,
  ResourceAccessLevel.EDITOR,
  ResourceAccessLevel.FULL_ACCESS,
] as const;

const LINK_ACCESS_LEVELS = [
  ResourceAccessLevel.VIEWER,
  ResourceAccessLevel.EDITOR,
] as const;

export class UpdatePageShareSettingRequestDto {
  @IsOptional()
  @IsIn(WORKSPACE_ACCESS_LEVELS)
  workspace_access_level?: ResourceAccessLevel | null;

  @IsOptional()
  @IsIn(LINK_ACCESS_LEVELS)
  link_access_level?: ResourceAccessLevel | null;
}
