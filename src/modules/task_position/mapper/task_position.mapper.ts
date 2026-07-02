import type { TaskPositionContext } from '../constants/task-position-context.constant';
import { TaskPosition } from '../domain/entities/task_position.entity';
import { TaskPositionModel } from '../domain/models/task_position.model';
import { TaskPositionResponseDto } from '../dto/response/task_position.response.dto';

type TaskPositionEntityInput = {
  id?: string;
  taskId: string;
  context: TaskPositionContext;
  contextId: string;
  position: number;
  createdAt?: Date;
  updatedAt?: Date;
};

export class TaskPositionMapper {
  static toModel(entity: TaskPosition): TaskPositionModel {
    return new TaskPositionModel(
      entity.id,
      entity.taskId,
      entity.context,
      entity.contextId,
      Number(entity.position),
      entity.createdAt,
      entity.updatedAt,
    );
  }

  static toEntity(
    model: TaskPositionModel | TaskPositionEntityInput,
  ): TaskPosition {
    const e = new TaskPosition();

    if (model.id != null) {
      e.id = model.id;
    }

    e.taskId = model.taskId;
    e.context = model.context;
    e.contextId = model.contextId;
    e.position = String(model.position);

    if (model.createdAt != null) {
      e.createdAt = model.createdAt;
    }

    if (model.updatedAt != null) {
      e.updatedAt = model.updatedAt;
    }

    return e;
  }

  static toResponse(model: TaskPositionModel): TaskPositionResponseDto {
    return {
      id: model.id,
      taskId: model.taskId,
      context: model.context,
      contextId: model.contextId,
      position: model.position,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    };
  }
}
