import { ResourceAccessLevel } from 'src/modules/content/domain/constants/resource-access-level.constant';

export class UpdatePageShareCommand {
  constructor(
    public readonly userId: string,
    public readonly shareId: string,
    public readonly accessLevel: ResourceAccessLevel,
  ) {}
}
