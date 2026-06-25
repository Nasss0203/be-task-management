import { TaskComment } from '../domain/entities/task_commnent.entity';
import { TaskCommentModel } from '../domain/models/task_comment.model';
import { TaskCommentResponseDto } from '../dto/response/task-comment.response.dto';

export type SaveTaskCommentInput = {
  id?: string;
  workspaceId: string;
  projectId: string;
  taskId: string;
  authorId: string;
  content: string;
  isEdited?: boolean;
};

export class TaskCommentMapper {
  static toModel(entity: TaskComment): TaskCommentModel {
    return new TaskCommentModel(
      entity.id,
      entity.workspaceId,
      entity.projectId,
      entity.taskId,
      entity.authorId,
      entity.content,
      entity.isEdited,
      entity.createdAt,
      entity.updatedAt,

      entity.author?.username ?? null,
      entity.author?.email ?? null,
      entity.author?.avatarUrl ?? null,
    );
  }

  static toEntity(model: TaskCommentModel | SaveTaskCommentInput): TaskComment {
    const e = new TaskComment();

    if ('id' in model && model.id != null) e.id = model.id;

    e.workspaceId = model.workspaceId;
    e.projectId = model.projectId;
    e.taskId = model.taskId;
    e.authorId = model.authorId;
    e.content = model.content;
    e.isEdited = model.isEdited ?? false;

    return e;
  }

  static toResponse(model: TaskCommentModel): TaskCommentResponseDto {
    return {
      id: model.id,
      workspaceId: model.workspaceId,
      projectId: model.projectId,
      taskId: model.taskId,
      authorId: model.authorId,
      content: model.content,
      isEdited: model.isEdited,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
      authorName: model.authorName,
      authorEmail: model.authorEmail,
      authorAvatarUrl: model.authorAvatarUrl,
    };
  }

  static toResponseList(models: TaskCommentModel[]): TaskCommentResponseDto[] {
    return models.map((item) => this.toResponse(item));
  }
}
