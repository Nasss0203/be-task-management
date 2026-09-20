import { FindActivityFilters } from '../../../domain/repositories/activity.repository';
import { ActivityEntityType } from '../../../domain/entities/activity.entity';

type GetActivitiesFilters = Omit<
  FindActivityFilters,
  'workspaceId' | 'limit'
> & {
  limit?: string;
};

export class GetActivitiesQuery {
  constructor(
    public readonly workspaceId: string,
    public readonly filters: GetActivitiesFilters,
    public readonly scope: {
      projectId?: string;
      entityType?: ActivityEntityType;
      entityId?: string;
    } = {},
  ) {}
}
