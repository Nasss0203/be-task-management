// src/modules/activities/mapper/activity.mapper.ts

import { Activity } from '../entities/activity.orm-entity';
import { ActivityModel } from '../../../../domain/entities/activity.entity';
import { SaveActivityInput } from '../../../../domain/repositories/activity.repository';

export class ActivityMapper {
  static toModel(entity: Activity): ActivityModel {
    return new ActivityModel(
      entity.id,
      entity.workspaceId,
      entity.projectId ?? null,
      entity.entityType,
      entity.entityId,
      entity.actorId ?? null,
      entity.action,
      entity.field ?? null,
      entity.oldValue ?? null,
      entity.newValue ?? null,
      entity.metadata ?? null,
      entity.isSystem,
      entity.createdAt,
    );
  }

  static toEntity(model: ActivityModel | SaveActivityInput): Activity {
    const e = new Activity();

    if ('id' in model && model.id != null) e.id = model.id;

    e.workspaceId = model.workspaceId;
    e.projectId = model.projectId ?? null;
    e.entityType = model.entityType;
    e.entityId = model.entityId;
    e.actorId = model.actorId ?? null;
    e.action = model.action;
    e.field = model.field ?? null;
    e.oldValue = model.oldValue ?? null;
    e.newValue = model.newValue ?? null;
    e.metadata = model.metadata ?? null;
    e.isSystem = model.isSystem ?? false;

    return e;
  }
}
