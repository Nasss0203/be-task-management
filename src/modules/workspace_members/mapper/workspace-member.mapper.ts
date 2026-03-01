import { WorkspaceMember } from '../domain/entities/workspace_member.entity';
import { WorkspaceMemberModel } from '../domain/models/workspace-member.model';
import { WorkspaceMemberResponseDto } from '../dto/response/workspace-member.response.dto';
import { SaveWorkspaceMemberInput } from '../interfaces/repositories/workspace-member.repository.interface';

export class WorkspaceMemeberMapper {
  static toModel(entity: WorkspaceMember): WorkspaceMemberModel {
    return new WorkspaceMemberModel(
      entity.id,
      entity.workspace_id,
      entity.user_id,
      entity.role_id,
      entity.joinedAt,
    );
  }

  static toEntity(
    model: WorkspaceMemberModel | SaveWorkspaceMemberInput,
  ): WorkspaceMember {
    const e = new WorkspaceMember();
    if (model.id != null) e.id = model.id;
    e.user_id = model.user_id;
    e.role_id = model.role_id;
    e.workspace_id = model.workspace_id;
    if (model.joinedAt != null) e.joinedAt = model.joinedAt;
    return e;
  }

  static toResponse(model: WorkspaceMemberModel): WorkspaceMemberResponseDto {
    return {
      id: model.id,
      role_id: model.role_id,
      user_id: model.user_id,
      workspace_id: model.workspace_id,
      joinedAt: model.joinedAt || new Date(),
    };
  }
}
