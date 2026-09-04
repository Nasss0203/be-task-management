import { ResourceAccessLevel } from 'src/modules/content/domain/constants/resource-access-level.constant';

export class SharePageCommand {
  constructor(
    public readonly userId: string,
    public readonly pageId: string,
    public readonly targetUserId: string,
    public readonly accessLevel: ResourceAccessLevel,
  ) {}
}
