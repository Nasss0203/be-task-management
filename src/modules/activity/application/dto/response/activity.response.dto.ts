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

export class ActivityTargetResponseDto {
  rowTitle: string | null;
  propertyName: string | null;
  propertyType: string | null;
  options: { id: string; name: string; color: string | null }[];
  people: { id: string; username: string | null }[];
}

export class ActivityPageResponseDto {
  id: string;
  title: string;
  icon: string | null;
}

export class ActivityResponseDto {
  static fromModel(model: ActivityModel): ActivityResponseDto {
    return {
      id: model.id,
      workspaceId: model.workspaceId,
      pageId: model.pageId,
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
  pageId: string | null;
  projectId: string | null;

  entityType: ActivityEntityType;
  entityId: string;

  actorId: string | null;
  actor?: ActivityActorResponseDto | null;
  target?: ActivityTargetResponseDto | null;
  page?: ActivityPageResponseDto | null;

  action: ActivityAction;
  field: string | null;

  oldValue: unknown;
  newValue: unknown;
  metadata: Record<string, unknown> | null;

  isSystem: boolean;
  createdAt: Date;
}
