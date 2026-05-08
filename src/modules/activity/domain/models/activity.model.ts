// src/modules/activities/domain/models/activity.model.ts

import {
  ActivityAction,
  ActivityEntityType,
} from '../entities/activity.entity';

export class ActivityModel {
  constructor(
    public readonly id: string,
    public readonly workspaceId: string,
    public readonly projectId: string | null,
    public readonly entityType: ActivityEntityType,
    public readonly entityId: string,
    public readonly actorId: string | null,
    public readonly action: ActivityAction,
    public readonly field: string | null,
    public readonly oldValue: unknown | null,
    public readonly newValue: unknown | null,
    public readonly metadata: Record<string, unknown> | null,
    public readonly isSystem: boolean,
    public readonly createdAt: Date,
  ) {}
}
