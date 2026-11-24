import type { FindActivityQueryDto } from '../../dto/request/find-activity-query.dto';

export class GetWorkspaceActivitiesQuery {
  constructor(
    public readonly userId: string,
    public readonly workspaceId: string,
    public readonly filters: FindActivityQueryDto,
  ) {}
}
