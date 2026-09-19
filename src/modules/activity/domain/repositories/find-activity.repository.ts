import {
  ActivityAction,
  ActivityEntityType,
} from '../entities/activity.entity';
import { ActivityModel } from '../entities/activity.entity';

export type FindActivityFilters = {
  workspaceId: string;
  projectId?: string;
  entityType?: ActivityEntityType;
  entityId?: string;
  actorId?: string;
  action?: ActivityAction;
  cursor?: string;
  limit?: number;
};

export type FindActivityResult = {
  items: ActivityModel[];
  nextCursor: string | null;
};

export interface FindActivityRepository {
  findMany(filters: FindActivityFilters): Promise<FindActivityResult>;
}
