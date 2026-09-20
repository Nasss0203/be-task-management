import { PersistenceContext } from 'src/shared/domain/persistence-context';
import {
  ActivityAction,
  ActivityEntityType,
  ActivityModel,
} from '../entities/activity.entity';

export type SaveActivityInput = {
  id?: string;
  workspaceId: string;
  projectId?: string | null;
  entityType: ActivityEntityType;
  entityId: string;
  actorId?: string | null;
  action: ActivityAction;
  field?: string | null;
  oldValue?: unknown;
  newValue?: unknown;
  metadata?: Record<string, unknown> | null;
  isSystem?: boolean;
};

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

export interface ActivityRepository {
  save(
    activity: SaveActivityInput,
    context?: PersistenceContext,
  ): Promise<ActivityModel>;

  findMany(filters: FindActivityFilters): Promise<FindActivityResult>;
}
