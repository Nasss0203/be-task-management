import { ResourceAccessLevel } from '../../../../domain/constants/resource-access-level.constant';

export class UpdatePageShareSettingCommand {
  constructor(
    public readonly userId: string,
    public readonly pageId: string,

    public readonly workspaceAccessLevel:
      | ResourceAccessLevel
      | null
      | undefined,

    public readonly linkAccessLevel: ResourceAccessLevel | null | undefined,
  ) {}
}
