import { TaskAssignee } from '../domain/entities/task_assignee.entity';
import { TaskAssigneeModel } from '../domain/models/task_assignee.model';
import { TaskAssigneeResponseDto } from '../dto/response/task_assignee.response.dto';

type SaveTaskAssigneeInput = {
  id?: string;
  taskId: string;
  userId: string;
  assignedBy?: string | null;
  assignedAt?: Date;
};

export class TaskAssigneeMapper {
  static toModel(entity: TaskAssignee): TaskAssigneeModel {
    return new TaskAssigneeModel(
      entity.id,
      entity.taskId,
      entity.userId,
      entity.user?.username ?? null,

      entity.assignedBy ?? null,
      entity.assignedByUser?.username ?? null,

      entity.assignedAt,
    );
  }

  static toEntity(
    model: TaskAssigneeModel | SaveTaskAssigneeInput,
  ): TaskAssignee {
    const e = new TaskAssignee();

    if ('id' in model && model.id != null) {
      e.id = model.id;
    }

    e.taskId = model.taskId;
    e.userId = model.userId;
    e.assignedBy = model.assignedBy ?? null;

    if ('assignedAt' in model && model.assignedAt != null) {
      e.assignedAt = model.assignedAt;
    }

    return e;
  }

  static toResponse(model: TaskAssigneeModel): TaskAssigneeResponseDto {
    return {
      id: model.id,
      taskId: model.taskId,
      userId: model.userId,
      username: model.username,

      assignedBy: model.assignedBy,
      assignedByUsername: model.assignedByUsername,

      assignedAt: model.assignedAt,
    };
  }
}
