import {
  ActivityAction,
  ActivityEntityType,
} from '../../../domain/entities/activity.entity';
import { ActivityModel } from '../../../domain/entities/activity.entity';

export class ActivityActorResponseDto {
  id: string;
  username: string | null;
  email?: string | null;
}

export class ActivityResponseDto {
  static fromModel(model: ActivityModel): ActivityResponseDto {
    return {
      id: model.id,
      workspaceId: model.workspaceId,
      projectId: model.projectId,
      entityType: model.entityType,
      entityId: model.entityId,
      actorId: model.actorId,
      action: model.action,
      field: model.field,
      oldValue: model.oldValue,
      newValue: model.newValue,
      metadata: model.metadata,
      isSystem: model.isSystem,
      createdAt: model.createdAt,
    };
  }
  id: string;
  workspaceId: string;
  projectId: string | null;

  entityType: ActivityEntityType;
  entityId: string;

  actorId: string | null;
  actor?: ActivityActorResponseDto | null;

  action: ActivityAction;
  field: string | null;

  oldValue: unknown;
  newValue: unknown;
  metadata: Record<string, unknown> | null;

  isSystem: boolean;
  createdAt: Date;
}
