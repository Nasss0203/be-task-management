import { TaskPriority } from '../domain/entities/task_priority.entity';
import { TaskPriorityModel } from '../domain/models/task_priority.models';
import { TaskPriorityResponseDto } from '../dto/response/task_priority.response.dto';
import { SaveTaskPriorityInput } from '../interfaces/repositories/create.task_priority.repository.interface';

export class TaskPriorityMapper {
  static toModel(entity: TaskPriority): TaskPriorityModel {
    return new TaskPriorityModel(
      entity.id,
      entity.workspaceId,
      entity.projectId,
      entity.name,
      entity.level,
      entity.color ?? null,
      entity.createdAt,
      entity.updatedAt,
    );
  }

  static toEntity(
    model: TaskPriorityModel | SaveTaskPriorityInput,
  ): TaskPriority {
    const e = new TaskPriority();

    if (model.id != null) e.id = model.id;
    e.workspaceId = model.workspaceId;
    e.projectId = model.projectId;
    e.name = model.name;
    e.level = model.level;

    if (model.color !== undefined) e.color = model.color;
    if (model.createdAt != null) e.createdAt = model.createdAt;
    if (model.updatedAt != null) e.updatedAt = model.updatedAt;

    return e;
  }

  static toResponse(model: TaskPriorityModel): TaskPriorityResponseDto {
    return {
      id: model.id,
      workspaceId: model.workspaceId,
      projectId: model.projectId,
      name: model.name,
      level: model.level,
      color: model.color,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    };
  }
}
