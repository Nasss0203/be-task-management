import { TaskStatus } from '../domain/entities/task_status.entity';
import { TaskStatusModel } from '../domain/models/task_status.model';
import { TaskStatusResponseDto } from '../dto/response/task_status.response.dto';
import { SaveTaskStatusInput } from '../interfaces/repositories/create.task_status.repository.interface';

export class TaskStatusMapper {
  static toModel(entity: TaskStatus): TaskStatusModel {
    return new TaskStatusModel(
      entity.id,
      entity.workspaceId,
      entity.projectId,
      entity.name,
      entity.position,
      entity.color ?? null,
      entity.isDone,
      entity.createdAt,
      entity.updatedAt,
    );
  }

  static toEntity(model: TaskStatusModel | SaveTaskStatusInput): TaskStatus {
    const e = new TaskStatus();

    if (model.id != null) e.id = model.id;
    e.workspaceId = model.workspaceId;
    e.projectId = model.projectId;
    e.name = model.name;
    e.position = model.position;

    if (model.color !== undefined) e.color = model.color;
    if (model.isDone != null) e.isDone = model.isDone;
    if (model.createdAt != null) e.createdAt = model.createdAt;
    if (model.updatedAt != null) e.updatedAt = model.updatedAt;

    return e;
  }

  static toResponse(model: TaskStatusModel): TaskStatusResponseDto {
    return {
      id: model.id,
      workspaceId: model.workspaceId,
      projectId: model.projectId,
      name: model.name,
      position: model.position,
      color: model.color,
      isDone: model.isDone,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    };
  }
}
