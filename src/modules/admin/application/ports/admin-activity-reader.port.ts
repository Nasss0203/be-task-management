import type {
  ActivityAction,
  ActivityEntityType,
} from 'src/modules/activity/domain/entities/activity.entity';

export interface ListAdminActivitiesInput {
  page: number;
  limit: number;
  from: Date;
  to: Date;
  workspaceId?: string;
  actorId?: string;
  search?: string;
  entityType?: ActivityEntityType;
  action?: ActivityAction;
}

export interface AdminActivityItem {
  id: string;
  action: ActivityAction;
  entityType: ActivityEntityType;
  entityId: string;
  field: string | null;
  isSystem: boolean;
  createdAt: Date;
  actor: { id: string; username: string; email: string } | null;
  workspace: { id: string; name: string | null };
  page: { id: string; title: string | null } | null;
}

export interface ListAdminActivitiesResult {
  items: AdminActivityItem[];
  total: number;
  page: number;
  limit: number;
}

export interface AdminActivityReader {
  listActivities(
    input: ListAdminActivitiesInput,
  ): Promise<ListAdminActivitiesResult>;
}
