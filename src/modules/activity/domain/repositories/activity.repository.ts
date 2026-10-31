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

/** A Page or Page-block edit by a person (plan-v2 §11 #5). */
export type PageEditActivityInput = {
  actorId: string;
  /** The edited Page; bursts are merged per actor, Page and action. */
  pageId: string;
  entityType: ActivityEntityType;
  entityId: string;
  action: ActivityAction;
  metadata: Record<string, unknown> | null;
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

  /**
   * Moves the newest row of the same actor, Page and action written within
   * `windowMs` to now; inserts a row when there is none. No row for a Page
   * that does not exist.
   */
  recordPageEdit(
    input: PageEditActivityInput,
    windowMs: number,
    context?: PersistenceContext,
  ): Promise<void>;
}
