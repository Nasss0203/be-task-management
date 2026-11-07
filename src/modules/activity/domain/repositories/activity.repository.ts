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

/** A person's change to something that lives on a Page (plan-v2 §11 #5). */
export type PageEditActivityInput = {
  actorId: string;
  /** The Page the change lives on; its workspace owns the activity. */
  pageId: string;
  entityType: ActivityEntityType;
  entityId: string;
  action: ActivityAction;
  field?: string | null;
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
   * With `mergeWindowMs`, moves the newest row of the same actor, action,
   * entity type and key (`metadata.pageId`, else the entity id) written within
   * the window to now; inserts a row when there is none. No row for a Page
   * that does not exist.
   */
  recordOnPage(
    input: PageEditActivityInput,
    mergeWindowMs: number | null,
    context?: PersistenceContext,
  ): Promise<void>;
}
