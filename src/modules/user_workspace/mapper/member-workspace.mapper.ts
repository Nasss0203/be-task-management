import { RoleName } from 'src/modules/role/domain/entities/role.entity';
import { MemberWorkspaceModel } from '../domain/models/user_workspace.model';
import { MemberWorkspaceResponseDto } from '../dto/response/user_workspace.response.dto';

export type MemberWorkspaceRaw = {
  id: string;
  workspace_id: string;
  user_id: string;
  full_name: string;
  email: string;
  avatar_url?: string | null;
  role_name: RoleName;
  lastOpenedAt: Date | null;
  joinedAt?: Date;
};

export class MemberWorkspaceMapper {
  static toModel(raw: MemberWorkspaceRaw): MemberWorkspaceModel {
    return new MemberWorkspaceModel(
      raw.id,
      raw.workspace_id,
      raw.user_id,
      raw.full_name,
      raw.email,
      raw.role_name,
      raw.avatar_url ?? null,
      raw.lastOpenedAt ?? null,
      raw.joinedAt,
    );
  }

  static toResponse(model: MemberWorkspaceModel): MemberWorkspaceResponseDto {
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
    };
  }

  static toResponseList(
    models: MemberWorkspaceModel[],
  ): MemberWorkspaceResponseDto[] {
    return models.map((model) => this.toResponse(model));
  }
}
