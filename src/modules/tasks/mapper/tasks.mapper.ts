import { Task } from '../domain/entities/task.entity';
import { TaskModel } from '../domain/models/task.model';
import { TaskResponseDto } from '../dto/response/task-response.dto';
import { SaveTaskInput } from '../interfaces/repositories/create-task.repository.interface';

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

      entity.createdBy,

      entity.assigneeId ?? null,
      // đổi "name" thành field đúng của User entity nếu cần
      entity.assignee?.username ?? null,

      entity.startAt ?? null,
      entity.dueAt ?? null,
      entity.completedAt ?? null,

      entity.estimateMinutes ?? null,

      entity.createdAt,
      entity.updatedAt,
      entity.deletedAt ?? null,
    );
  }

  static toEntity(model: TaskModel | SaveTaskInput): Task {
    const e = new Task();

    if ('id' in model && model.id != null) {
      e.id = model.id;
    }

    e.workspaceId = model.workspaceId;
    e.projectId = model.projectId;

    if ('sprintId' in model && model.sprintId !== undefined) {
      e.sprintId = model.sprintId ?? null;
    }

    e.projectSeq = model.projectSeq;
    e.title = model.title;

    if ('description' in model && model.description !== undefined) {
      e.description = model.description ?? null;
    }

    e.statusId = model.statusId;

    if ('priorityId' in model && model.priorityId !== undefined) {
      e.priorityId = model.priorityId ?? null;
    }

    e.createdBy = model.createdBy;

    if ('assigneeId' in model && model.assigneeId !== undefined) {
      e.assigneeId = model.assigneeId ?? null;
    }

    if ('startAt' in model && model.startAt !== undefined) {
      e.startAt = model.startAt ?? null;
    }

    if ('dueAt' in model && model.dueAt !== undefined) {
      e.dueAt = model.dueAt ?? null;
    }

    if ('completedAt' in model && model.completedAt !== undefined) {
      e.completedAt = model.completedAt ?? null;
    }

    if ('estimateMinutes' in model && model.estimateMinutes !== undefined) {
      e.estimateMinutes = model.estimateMinutes ?? null;
    }

    if ('createdAt' in model && model.createdAt != null) {
      e.createdAt = model.createdAt;
    }

    if ('updatedAt' in model && model.updatedAt != null) {
      e.updatedAt = model.updatedAt;
    }

    if ('deletedAt' in model && model.deletedAt !== undefined) {
      e.deletedAt = model.deletedAt ?? null;
    }

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

      createdBy: model.createdBy,

      assigneeId: model.assigneeId,
      assigneeName: model.assigneeName,

      startAt: model.startAt,
      dueAt: model.dueAt,
      completedAt: model.completedAt,

      estimateMinutes: model.estimateMinutes,

      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
      deletedAt: model.deletedAt,
    };
  }
}
