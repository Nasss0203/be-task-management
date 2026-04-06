import { Task } from '../domain/entities/task.entity';
import { TaskModel } from '../domain/models/task.model';
import { TaskResponseDto } from '../dto/response/task.response.dto';
import { SaveTaskInput } from '../interfaces/repositories/create.task.repository.interface';

export class TaskMapper {
  static toModel(entity: Task): TaskModel {
    return new TaskModel(
      entity.id,
      entity.workspaceId,
      entity.projectId,
      entity.sprintId ?? null,
      entity.projectSeq,
      entity.title,
      entity.description ?? null,
      entity.statusId,
      entity.status?.name ?? null,
      entity.priorityId ?? null,
      entity.priority?.name ?? null,
      entity.reporterId,
      entity.dueAt ?? null,
      entity.estimateMinutes ?? null,
      entity.createdAt,
      entity.updatedAt,
    );
  }

  static toEntity(model: TaskModel | SaveTaskInput): Task {
    const e = new Task();

    if (model.id != null) e.id = model.id;
    e.workspaceId = model.workspaceId;
    e.projectId = model.projectId;

    if (model.sprintId !== undefined) e.sprintId = model.sprintId;
    e.projectSeq = model.projectSeq;
    e.title = model.title;

    if (model.description !== undefined) e.description = model.description;
    e.statusId = model.statusId;

    if (model.priorityId !== undefined) e.priorityId = model.priorityId;
    e.reporterId = model.reporterId;

    if (model.dueAt !== undefined) e.dueAt = model.dueAt;
    if (model.estimateMinutes !== undefined) {
      e.estimateMinutes = model.estimateMinutes;
    }

    if (model.createdAt != null) e.createdAt = model.createdAt;
    if (model.updatedAt != null) e.updatedAt = model.updatedAt;

    return e;
  }

  static toResponse(model: TaskModel): TaskResponseDto {
    return {
      id: model.id,
      workspaceId: model.workspaceId,
      projectId: model.projectId,
      sprintId: model.sprintId,
      projectSeq: model.projectSeq,
      title: model.title,
      description: model.description,
      statusId: model.statusId,
      statusName: model.statusName,
      priorityId: model.priorityId,
      priorityName: model.priorityName,
      reporterId: model.reporterId,
      dueAt: model.dueAt,
      estimateMinutes: model.estimateMinutes,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    };
  }
}
