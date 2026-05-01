import { Sprint, SprintStatus } from '../domain/entities/sprint.entity';
import { SprintsModel } from '../domain/models/sprints.model';
import { SprintResponseDto } from '../dto/response/sprint.response.dto';
import { SaveSprintInput } from '../interfaces/repositories/create-sprint.repository.interface';

export class SprintsMapper {
  static toModel(entity: Sprint): SprintsModel {
    return new SprintsModel(
      entity.id,
      entity.workspaceId,
      entity.projectId,
      entity.name,
      entity.goal ?? null,
      entity.status,
      entity.startAt ?? null,
      entity.endAt ?? null,
      entity.createdBy,
      entity.createdAt,
      entity.updatedAt,
      entity.deletedAt ?? null,
    );
  }

  static toEntity(model: SprintsModel | SaveSprintInput): Sprint {
    const e = new Sprint();

    if ('id' in model && model.id != null) e.id = model.id;

    e.workspaceId = model.workspaceId;
    e.projectId = model.projectId;
    e.name = model.name;
    e.goal = model.goal ?? null;
    e.status = model.status ?? SprintStatus.PLANNED;
    e.startAt = model.startAt ?? null;
    e.endAt = model.endAt ?? null;
    e.createdBy = model.createdBy;

    if ('createdAt' in model && model.createdAt != null) {
      e.createdAt = model.createdAt;
    }

    if ('updatedAt' in model && model.updatedAt != null) {
      e.updatedAt = model.updatedAt;
    }

    if ('deletedAt' in model && model.deletedAt !== undefined) {
      e.deletedAt = model.deletedAt;
    }

    return e;
  }

  static toResponse(model: SprintsModel): SprintResponseDto {
    return {
      id: model.id,
      workspaceId: model.workspaceId,
      projectId: model.projectId,
      name: model.name,
      goal: model.goal,
      status: model.status,
      startAt: model.startAt,
      endAt: model.endAt,
      createdBy: model.createdBy,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    };
  }
}
