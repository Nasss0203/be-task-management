import type {
  ActivityAction,
  ActivityEntityType,
} from 'src/modules/activity/domain/entities/activity.entity';

export class ListAdminActivitiesQuery {
  constructor(
    public readonly page: number,
    public readonly limit: number,
    public readonly filters: {
      from?: string;
      to?: string;
      workspaceId?: string;
      actorId?: string;
      search?: string;
      entityType?: ActivityEntityType;
      action?: ActivityAction;
    } = {},
  ) {}
}
