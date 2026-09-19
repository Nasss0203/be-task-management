import { ResourceAccessLevel } from '../../../../domain/constants/resource-access-level.constant';

export class ApprovePageAccessRequestCommand {
  constructor(
    public readonly reviewerId: string,
    public readonly requestId: string,
    public readonly accessLevel: ResourceAccessLevel,
  ) {}
}
