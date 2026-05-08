// src/modules/activities/mapper/activity.mapper.ts

import { Activity } from '../domain/entities/activity.entity';
import { ActivityModel } from '../domain/models/activity.model';
import { ActivityResponseDto } from '../dto/response/activity.response.dto';
import { SaveActivityInput } from '../interfaces/repositories/create-activity.repository.interface';

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

  static toResponse(model: ActivityModel): ActivityResponseDto {
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

  static toResponseList(models: ActivityModel[]): ActivityResponseDto[] {
    return models.map((model) => this.toResponse(model));
  }
}
