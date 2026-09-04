import { ResourceAccessLevel } from 'src/modules/content/domain/constants/resource-access-level.constant';

export class CreatePageShareLinkCommand {
  constructor(
    public readonly userId: string,
    public readonly pageId: string,
    public readonly accessLevel: ResourceAccessLevel,
    public readonly expiresAt?: Date | null,
  ) {}
}
