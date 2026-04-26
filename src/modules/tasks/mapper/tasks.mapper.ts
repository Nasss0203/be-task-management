import { Task } from '../domain/entities/task.entity';
import { TaskAssigneeModel, TaskModel } from '../domain/models/task.model';
import {
  TaskAssigneeResponseDto,
  TaskResponseDto,
} from '../dto/response/task-response.dto';
import { SaveTaskInput } from '../interfaces/repositories/create-task.repository.interface';

export class TaskMapper {
  static toModel(entity: Task): TaskModel {
    const assignees: TaskAssigneeModel[] =
      entity.assignees?.map((item) => ({
        userId: item.userId,
        username: item.user?.username ?? null,
      })) ?? [];
    return new TaskModel(
      entity.id,
      entity.workspaceId,
      entity.projectId,
      entity.projectSeq,
      entity.title,
      entity.statusId,
      entity.createdBy,

      entity.sprintId ?? null,
      entity.description ?? null,

      entity.status?.name ?? null,

      entity.priorityId ?? null,
      entity.priority?.name ?? null,

      assignees,

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
    const assignees: TaskAssigneeResponseDto[] = model.assignees.map(
      (item) => ({
        userId: item.userId,
        username: item.username,
      }),
    );

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

      assignees,

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
