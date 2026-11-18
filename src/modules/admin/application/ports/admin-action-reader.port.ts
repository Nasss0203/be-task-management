import type { SystemRole } from 'src/modules/identity/domain/enums/system-role.enum';

import type {
  AdminAction,
  AdminActionChanges,
  AdminActionTargetType,
} from '../../domain/audit/admin-action';

export interface ListAdminActionsInput {
  page: number;
  limit: number;
  from: Date;
  to: Date;
  actorId?: string;
  targetType?: AdminActionTargetType;
  targetId?: string;
  action?: AdminAction;
  search?: string;
}

export interface AdminActionItem {
  id: string;
  action: AdminAction;
  targetType: AdminActionTargetType;
  targetId: string | null;
  targetLabel: string | null;
  changes: AdminActionChanges;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
  actor: {
    id: string;
    username: string;
    email: string;
    systemRole: SystemRole;
  } | null;
}

export interface ListAdminActionsResult {
  items: AdminActionItem[];
  total: number;
  page: number;
  limit: number;
}

export interface AdminActionReader {
  listActions(input: ListAdminActionsInput): Promise<ListAdminActionsResult>;
}
