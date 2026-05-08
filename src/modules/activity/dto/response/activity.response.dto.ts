import {
  ActivityAction,
  ActivityEntityType,
} from '../../domain/entities/activity.entity';

export class ActivityActorResponseDto {
  id: string;
  username: string | null;
  email?: string | null;
}

export class ActivityResponseDto {
  id: string;
  workspaceId: string;
  projectId: string | null;

  entityType: ActivityEntityType;
  entityId: string;

  actorId: string | null;
  actor?: ActivityActorResponseDto | null;

  action: ActivityAction;
  field: string | null;

  oldValue: unknown | null;
  newValue: unknown | null;
  metadata: Record<string, unknown> | null;

  isSystem: boolean;
  createdAt: Date;
}
