import type {
  AdminAction,
  AdminActionTargetType,
} from '../../../domain/audit/admin-action';

export class ListAdminActionsQuery {
  constructor(
    public readonly page: number,
    public readonly limit: number,
    public readonly filters: {
      from?: string;
      to?: string;
      actorId?: string;
      targetType?: AdminActionTargetType;
      targetId?: string;
      action?: AdminAction;
      search?: string;
    } = {},
  ) {}
}
