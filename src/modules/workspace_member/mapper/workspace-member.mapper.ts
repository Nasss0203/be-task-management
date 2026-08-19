import { WorkspaceMember } from '../domain/entities/workspace-member.entity';
import { WorkspaceMemberModel } from '../domain/models/workspace-member.model';
import { WorkspaceMemberResponseDto } from '../dto/response/workspace-member.response.dto';
import { SaveWorkspaceMemberInput } from '../interfaces/repositories/workspace-member.repository.interface';
import { WorkspaceRole } from 'src/shared/domain/enums/workspace-role.enum';

export class WorkspaceMemberMapper {
  static toModel(entity: WorkspaceMember): WorkspaceMemberModel {
    return new WorkspaceMemberModel(
      entity.id,
      entity.workspace_id,
      entity.user_id,
      entity.role_name,
      entity.joinedAt,
      entity.lastOpenedAt ?? undefined,
    );
  }

  static toEntity(
    model: WorkspaceMemberModel | SaveWorkspaceMemberInput,
  ): WorkspaceMember {
    const e = new WorkspaceMember();
    if (model.id != null) e.id = model.id;
    e.user_id = model.user_id;
    e.workspace_id = model.workspace_id;
    e.role_name = model.role_name ?? WorkspaceRole.MEMBER;
    if (model.joinedAt != null) e.joinedAt = model.joinedAt;
    if (model.lastOpenedAt != null) e.lastOpenedAt = model.lastOpenedAt;
    return e;
  }

  static toResponse(model: WorkspaceMemberModel): WorkspaceMemberResponseDto {
    return {
      id: model.id,
      role_name: model.role_name,
      lastOpenedAt: model.lastOpenedAt,
      user_id: model.user_id,
      workspace_id: model.workspace_id,
      joinedAt: model.joinedAt || new Date(),
    };
  }
}
