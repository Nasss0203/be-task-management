import { Role } from '../domain/entities/role.entity';
import { RoleModel } from '../domain/model/role.model';
import { RoleResponseDto } from '../dto/reponse/role.response.dto';
import { SaveRoleInput } from '../interfaces/repositories/role.repository.interface';

export class RoleMapper {
  static toModel(entity: Role): RoleModel {
    return new RoleModel(
      entity.id,
      entity.name,
      entity.workspace_id,
      entity.created_at,
    );
  }

  static toEntity(model: RoleModel | SaveRoleInput): Role {
    const e = new Role();
    if (model.id != null) e.id = model.id;
    e.name = model.name;
    if (model.workspace_id != null) e.workspace_id = model.workspace_id;
    if (model.created_at != null) e.created_at = model.created_at;
    return e;
  }

  static toResponse(model: RoleModel): RoleResponseDto {
    return {
      id: model.id,
      name: model.name,
      created_at: model.created_at,
      workspace_id: model.workspace_id,
    };
  }
}
