import { PersistenceContext } from 'src/shared/domain/persistence-context';
import {
  ActivityAction,
  ActivityEntityType,
} from '../entities/activity.entity';
import { ActivityModel } from '../entities/activity.entity';

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

export interface CreateActivityRepository {
  save(
    activity: SaveActivityInput,
    context?: PersistenceContext,
  ): Promise<ActivityModel>;
}
