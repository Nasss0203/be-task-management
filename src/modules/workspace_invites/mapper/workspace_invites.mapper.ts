import { WorkspaceInvite } from '../domain/entities/workspace_invite.entity';
import { WorkspaceInviteModel } from '../domain/models/workspace_invite.model';
import { WorkspaceInviteResponseDto } from '../dto/response/workspace_invites-response.dto';
import { SaveWorkspaceInviteInput } from '../interfaces/repositories/create-workspace_invite.repository.interface';

export class WorkspaceInviteMapper {
  static toModel(entity: WorkspaceInvite): WorkspaceInviteModel {
    return new WorkspaceInviteModel(
      entity.id,
      entity.workspace_id,
      entity.user_id ?? null,
      entity.email,
      entity.role_name,
      entity.invited_by,
      entity.token,
      entity.status,
      entity.accepted_at ?? null,
      entity.expires_at,
      entity.created_at,
      entity.updated_at,
    );
  }

  static toEntity(
    model: WorkspaceInviteModel | SaveWorkspaceInviteInput,
  ): WorkspaceInvite {
    const e = new WorkspaceInvite();

    if (model.id != null) e.id = model.id;
    e.workspace_id = model.workspace_id;
    e.email = model.email;
    e.role_name = model.role_name;
    e.invited_by = model.invited_by;
    e.token = model.token;
    e.status = model.status;
    e.expires_at = model.expires_at;

    if (model.user_id !== undefined) e.user_id = model.user_id;
    if (model.accepted_at !== undefined) e.accepted_at = model.accepted_at;
    if (model.created_at != null) e.created_at = model.created_at;
    if (model.updated_at != null) e.updated_at = model.updated_at;

    return e;
  }

  static toResponse(model: WorkspaceInviteModel): WorkspaceInviteResponseDto {
    return {
      id: model.id,
      workspace_id: model.workspace_id,
      user_id: model.user_id,
      email: model.email,
      role_name: model.role_name,
      invited_by: model.invited_by,
      status: model.status,
      accepted_at: model.accepted_at,
      expires_at: model.expires_at,
      created_at: model.created_at,
      updated_at: model.updated_at,
    };
  }
}
