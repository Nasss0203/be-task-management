import { UserRole } from '../domain/entities/user_role.entity';
import { UserRoleModel } from '../domain/model/user_role.model';
import { UserRoleResponseDto } from '../dto/response/user_role.response.dto';
import { SaveUserRoleInput } from '../interfaces/repositories/user_role.repository.interface';

export class UserRoleMapper {
  static toModel(entity: UserRole): UserRoleModel {
    return new UserRoleModel(
      entity.role_id,
      entity.user_id,
      entity.workspace_id,
      entity.assigned_at,
      entity.assigned_by,
      entity.revoked_at ?? null,
    );
  }

  static toEntity(model: UserRoleModel | SaveUserRoleInput): UserRole {
    const e = new UserRole();
    if (model.role_id != null) e.role_id = model.role_id;
    if (model.user_id != null) e.user_id = model.user_id;
    if (model.workspace_id != null) e.workspace_id = model.workspace_id;
    if (model.assigned_by != null) e.assigned_by = model.assigned_by;
    if (model.revoked_at != null) e.revoked_at = model.revoked_at;
    if (model.assigned_at != null) e.assigned_at = model.assigned_at;
    return e;
  }

  static toResponse(model: UserRoleModel): UserRoleResponseDto {
    return {
      role_id: model.role_id,
      workspace_id: model.workspace_id,
      user_id: model.user_id,
      assigned_at: model.assigned_at,
      assigned_by: model.assigned_by,
      revoked_at: model.revoked_at,
    };
  }
}
