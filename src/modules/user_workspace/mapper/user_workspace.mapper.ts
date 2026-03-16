import { UserWorkspace } from '../domain/entities/user_workspace.entity';
import { UserWorkspaceModel } from '../domain/models/user_workspace.model';
import { UserWorkspaceResponseDto } from '../dto/response/user_workspace.response.dto';
import { SaveUserWorkspaceInput } from '../interfaces/repositories/user_workspace.repository.interface';

export class WorkspaceMemeberMapper {
  static toModel(entity: UserWorkspace): UserWorkspaceModel {
    return new UserWorkspaceModel(
      entity.id,
      entity.workspace_id,
      entity.user_id,
      entity.lastOpenedAt ?? undefined,
      entity.joinedAt,
    );
  }

  static toEntity(
    model: UserWorkspaceModel | SaveUserWorkspaceInput,
  ): UserWorkspace {
    const e = new UserWorkspace();
    if (model.id != null) e.id = model.id;
    e.user_id = model.user_id;
    e.workspace_id = model.workspace_id;
    if (model.joinedAt != null) e.joinedAt = model.joinedAt;
    if (model.lastOpenedAt != null) e.lastOpenedAt = model.lastOpenedAt;
    return e;
  }

  static toResponse(model: UserWorkspaceModel): UserWorkspaceResponseDto {
    return {
      id: model.id,
      lastOpenedAt: model.joinedAt,
      user_id: model.user_id,
      workspace_id: model.workspace_id,
      joinedAt: model.joinedAt || new Date(),
    };
  }
}
