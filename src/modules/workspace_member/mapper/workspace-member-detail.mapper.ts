import { WorkspaceRole } from 'src/shared/domain/enums/workspace-role.enum';
import { WorkspaceMemberDetailModel } from '../domain/models/workspace-member.model';
import { WorkspaceMemberDetailResponseDto } from '../dto/response/workspace-member.response.dto';

export type WorkspaceMemberDetailRaw = {
  id: string;
  workspace_id: string;
  user_id: string;
  full_name: string;
  email: string;
  avatar_url?: string | null;
  role_name: WorkspaceRole;
  lastOpenedAt: Date | null;
  joinedAt?: Date;
  taskCount?: number;
};

export class WorkspaceMemberDetailMapper {
  static toModel(raw: WorkspaceMemberDetailRaw): WorkspaceMemberDetailModel {
    return new WorkspaceMemberDetailModel(
      raw.id,
      raw.workspace_id,
      raw.user_id,
      raw.full_name,
      raw.email,
      raw.role_name,
      raw.avatar_url ?? null,
      raw.lastOpenedAt ?? null,
      raw.joinedAt,
      raw.taskCount ? Number(raw.taskCount) : 0,
    );
  }

  static toResponse(
    model: WorkspaceMemberDetailModel,
  ): WorkspaceMemberDetailResponseDto {
    return {
      id: model.id,
      workspace_id: model.workspace_id,
      user_id: model.user_id,
      full_name: model.full_name,
      email: model.email,
      avatar_url: model.avatar_url ?? null,
      role_name: model.role_name,
      joinedAt: model.joinedAt ?? null,
      lastOpenedAt: model.lastOpenedAt ?? null,
      taskCount: model.taskCount ?? 0,
    };
  }

  static toResponseList(
    models: WorkspaceMemberDetailModel[],
  ): WorkspaceMemberDetailResponseDto[] {
    return models.map((model) => this.toResponse(model));
  }
}
